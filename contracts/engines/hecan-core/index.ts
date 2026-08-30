/**
 * 三术合参编排器 · hecan-core（服务端使用）
 *
 * 编排：bazi-core（本地真实算法，始终可用）+ 动态探测 ziwei-core / qizheng-core。
 * 探测协议：在 contracts/engines/<art>-core/index.ts 导出
 *   hecanSynthesize(input: BirthInput): HecanArtContribution
 * 探测失败（引擎不存在 / 未导出协议函数）→ 该术输出 precision:'unavailable' 状态块，
 * 绝不伪造星曜、宫位或宿度。
 */
// 别名导入：避免与 esbuild ESM bundle 顶部注入的 createRequire shim 冲突
import { createRequire as nodeCreateRequire } from 'node:module'
import { computeChartV2 } from '../../bazi-core'
import type { BaziChartV2, BirthInput, Wuxing } from '../../bazi-core/types'
import { BRANCH_WUXING, BRANCHES } from '../../bazi-core/rules/stems-branches'
import type { RuleProvenance } from '../engine-result'
import type {
  HecanArt,
  HecanArtBlock,
  HecanArtContribution,
  HecanCrossCheck,
  HecanReport,
  HecanTier,
} from './types'
import { HECAN_DISCLAIMER, HECAN_RULESET_VERSION } from './types'

export * from './types'

/* ---------------- 引擎探测 ---------------- */

export interface HecanEngineModule {
  hecanSynthesize: (input: BirthInput) => HecanArtContribution
}

export type HecanEngineLoader = (art: 'ziwei' | 'qizheng') => Promise<HecanEngineModule | null>

function asProtocolModule(mod: unknown): HecanEngineModule | null {
  if (
    mod !== null &&
    typeof mod === 'object' &&
    typeof (mod as Record<string, unknown>).hecanSynthesize === 'function'
  ) {
    return mod as HecanEngineModule
  }
  return null
}

/**
 * 默认探测器：
 * 1) createRequire 以本模块为锚点解析 `../<art>-core`（适配已构建/已链接布局）；
 * 2) 计算文件 URL 后动态 import（适配 vitest / vite-node 的 TS 直跑）。
 * 全部失败返回 null —— 视为引擎不存在。
 */
export const defaultEngineLoader: HecanEngineLoader = async (art) => {
  try {
    const req = nodeCreateRequire(import.meta.url)
    for (const spec of [`../${art}-core`, `../${art}-core/index`]) {
      try {
        const mod = asProtocolModule(req(spec))
        if (mod) return mod
      } catch {
        /* 继续下一个候选 */
      }
    }
  } catch {
    /* createRequire 不可用则跳过 */
  }
  try {
    const url = new URL(`../${art}-core/index.ts`, import.meta.url).href
    const mod = asProtocolModule(await import(/* @vite-ignore */ url))
    if (mod) return mod
  } catch {
    /* 引擎不存在 */
  }
  return null
}

/* ---------------- 八字术块（本地真实算法） ---------------- */

const ART_NAMES: Record<HecanArt, string> = { bazi: '八字', ziwei: '紫微', qizheng: '七政' }

function baziArtBlock(chart: BaziChartV2): HecanArtBlock {
  const p = chart.pillars
  const pillarsText = [p.year.ganzhi, p.month.ganzhi, p.day.ganzhi, p.hour?.ganzhi ?? '（时辰未知）'].join(' ')
  const keyPoints = [
    `四柱：${pillarsText}`,
    `日主${chart.dayMaster}（${chart.dayMasterWuxing}），旺衰 ${chart.wuxing.strength.total} 分 · ${chart.wuxing.strength.grade}`,
    `扶抑用神：${chart.yongshen.yongshen}；喜神 ${chart.yongshen.xishen.join('、') || '无'}；忌神 ${chart.yongshen.jishen.join('、') || '无'}`,
    chart.wuxing.missing.length > 0
      ? `五行缺${chart.wuxing.missing.join('、')}，最旺${chart.wuxing.strongest}`
      : `五行俱全，最旺${chart.wuxing.strongest}`,
  ]
  if (chart.mingGong) keyPoints.push(`命宫：${chart.mingGong.ganzhi}（${chart.mingGong.method}）`)
  return {
    art: 'bazi',
    artName: ART_NAMES.bazi,
    precision: 'validated',
    ruleVariant: `子平法-${chart.timeAudit.dayRollover === 'zichu' ? '子初换日' : '0点换日'}`,
    keyPoints,
    wuxingFocus: chart.yongshen.yongshen,
    mingGongBranch: chart.mingGong?.branch ?? null,
    structureScore: chart.wuxing.strength.total,
    summary: `八字看时：日主${chart.dayMaster}${chart.dayMasterWuxing}，${chart.wuxing.strength.grade}，用神取${chart.yongshen.yongshen}。`,
  }
}

function unavailableBlock(art: 'ziwei' | 'qizheng', reason: string): HecanArtBlock {
  return {
    art,
    artName: ART_NAMES[art],
    precision: 'unavailable',
    reason,
    ruleVariant: '—',
    keyPoints: [],
    wuxingFocus: null,
    mingGongBranch: null,
    structureScore: null,
    summary: `${ART_NAMES[art]}引擎尚未接入，本术暂缺——合参仅就已起之盘互证，不虚构${ART_NAMES[art]}结论。`,
  }
}

/* ---------------- 交叉互证 ---------------- */

const TIER_RANK: Record<HecanTier, number> = { single: 1, double: 2, triple: 3 }

function tierOf(n: number): HecanTier {
  return n >= 3 ? 'triple' : n === 2 ? 'double' : 'single'
}

function checkWuxingConsistency(arts: HecanArtBlock[]): HecanCrossCheck {
  const topic: HecanCrossCheck['topic'] = '五行结论一致性'
  const parts = arts.filter((a) => a.wuxingFocus !== null)
  if (parts.length < 2) {
    return {
      topic,
      arts: parts.map((a) => a.art),
      tier: 'single',
      verdict: 'insufficient',
      text:
        parts.length === 1
          ? `仅${parts[0].artName}给出五行结论（${parts[0].wuxingFocus}），无第二术可证——孤证存疑。`
          : '无术给出五行结论，无法互证。',
    }
  }
  const focus = parts.map((a) => `${a.artName}取${a.wuxingFocus}`)
  const allSame = parts.every((a) => a.wuxingFocus === parts[0].wuxingFocus)
  return allSame
    ? {
        topic,
        arts: parts.map((a) => a.art),
        tier: tierOf(parts.length),
        verdict: 'consistent',
        text: `${focus.join('，')}——${parts.length}术同指「${parts[0].wuxingFocus}」，互证成立。`,
      }
    : {
        topic,
        arts: parts.map((a) => a.art),
        tier: 'single',
        verdict: 'divergent',
        text: `${focus.join('，')}——诸术五行结论不一，并存待考，不作独断。`,
      }
}

function checkMingGong(arts: HecanArtBlock[], chart: BaziChartV2): HecanCrossCheck {
  const topic: HecanCrossCheck['topic'] = '日主与命宫关系'
  const parts = arts.filter((a) => a.mingGongBranch !== null)
  if (parts.length === 0) {
    return {
      topic,
      arts: [],
      tier: 'single',
      verdict: 'insufficient',
      text: '时辰未知或诸术未安命宫，日主与命宫之辨暂缺。',
    }
  }
  const branchIdx = BRANCHES.indexOf(parts[0].mingGongBranch as (typeof BRANCHES)[number])
  const gongWuxing: Wuxing | null = branchIdx >= 0 ? BRANCH_WUXING[branchIdx] : null
  const sameGong = parts.every((a) => a.mingGongBranch === parts[0].mingGongBranch)
  const relText = gongWuxing
    ? `命宫${parts[0].mingGongBranch}属${gongWuxing}，日主属${chart.dayMasterWuxing}`
    : `命宫${parts[0].mingGongBranch}，日主属${chart.dayMasterWuxing}`
  return {
    topic,
    arts: parts.map((a) => a.art),
    tier: sameGong ? tierOf(parts.length) : 'single',
    verdict: parts.length < 2 ? 'insufficient' : sameGong ? 'consistent' : 'divergent',
    text:
      parts.length < 2
        ? `${relText}（仅${parts[0].artName}安命宫，孤证存疑）。`
        : sameGong
          ? `${parts.map((a) => a.artName).join('、')}同安命宫于${parts[0].mingGongBranch}——${relText}，互证成立。`
          : `${parts.map((a) => `${a.artName}安${a.mingGongBranch}`).join('，')}——命宫所落不一，并存待考。`,
  }
}

function checkStructureScores(arts: HecanArtBlock[]): HecanCrossCheck {
  const topic: HecanCrossCheck['topic'] = '结构分对比'
  const parts = arts.filter((a) => a.structureScore !== null)
  if (parts.length < 2) {
    return {
      topic,
      arts: parts.map((a) => a.art),
      tier: 'single',
      verdict: 'insufficient',
      text:
        parts.length === 1
          ? `仅${parts[0].artName}给出结构分（${parts[0].structureScore}），无第二术可校——孤证存疑。`
          : '无术给出结构分，无法互证。',
    }
  }
  const scores = parts.map((a) => a.structureScore as number)
  const spread = Math.max(...scores) - Math.min(...scores)
  const detail = parts.map((a) => `${a.artName} ${a.structureScore}`).join('，')
  return spread <= 15
    ? {
        topic,
        arts: parts.map((a) => a.art),
        tier: tierOf(parts.length),
        verdict: 'consistent',
        text: `${detail}——离散 ${spread} 分 ≤ 15，诸术对结构强弱判断相合。`,
      }
    : {
        topic,
        arts: parts.map((a) => a.art),
        tier: 'single',
        verdict: 'divergent',
        text: `${detail}——离散 ${spread} 分 > 15，诸术判断相悖，并存待考。`,
      }
}

export function crossCheck(arts: HecanArtBlock[], chart: BaziChartV2): HecanCrossCheck[] {
  return [checkWuxingConsistency(arts), checkMingGong(arts, chart), checkStructureScores(arts)]
}

export function overallTierOf(checks: HecanCrossCheck[]): HecanTier {
  let best: HecanTier = 'single'
  for (const c of checks) {
    if (c.verdict === 'consistent' && TIER_RANK[c.tier] > TIER_RANK[best]) best = c.tier
  }
  return best
}

/* ---------------- 编排入口 ---------------- */

const BAZI_PROVENANCE: RuleProvenance[] = [
  {
    ruleId: 'hecan.bazi',
    variant: 'computeChartV2 子平排盘',
    source: '《渊海子平》《三命通会》',
  },
  {
    ruleId: 'hecan.cross-check',
    variant: '紫府三术互证模型 v1（五行一致性 / 日主命宫 / 结构分离散度）',
    source: '紫府公开模型',
  },
]

export interface HecanSynthesis {
  report: HecanReport
  /** 合并后的溯源（各术贡献 + 互证模型），后台审计字段 */
  provenance: RuleProvenance[]
  warnings: string[]
  /** 八字盘（合参必起，供前台双栏展示） */
  chart: BaziChartV2
}

export async function synthesizeHecan(
  input: BirthInput,
  opts?: { loadEngine?: HecanEngineLoader },
): Promise<HecanSynthesis> {
  const loadEngine = opts?.loadEngine ?? defaultEngineLoader
  const chart = computeChartV2(input)
  const arts: HecanArtBlock[] = [baziArtBlock(chart)]
  const provenance = [...BAZI_PROVENANCE]
  const warnings: string[] = []

  for (const art of ['ziwei', 'qizheng'] as const) {
    const mod = await loadEngine(art)
    if (!mod) {
      const reason = `contracts/engines/${art}-core 不存在或未导出 hecanSynthesize 协议函数`
      arts.push(unavailableBlock(art, reason))
      warnings.push(`${ART_NAMES[art]}引擎不可用：${reason}。`)
      continue
    }
    try {
      const contribution = mod.hecanSynthesize(input)
      arts.push({
        art,
        artName: ART_NAMES[art],
        precision: contribution.precision,
        ruleVariant: contribution.ruleVariant,
        keyPoints: contribution.keyPoints,
        wuxingFocus: contribution.wuxingFocus,
        mingGongBranch: contribution.mingGongBranch,
        structureScore: contribution.structureScore,
        summary: contribution.summary,
      })
      if (contribution.provenance) provenance.push(...contribution.provenance)
    } catch (err) {
      const reason = `${ART_NAMES[art]}引擎调用失败：${err instanceof Error ? err.message : String(err)}`
      arts.push(unavailableBlock(art, reason))
      warnings.push(`${reason}。`)
    }
  }

  if (chart.pillars.hour === null) {
    warnings.push('时辰未知：时柱、命宫不排，日主-命宫互证精度下降。')
  }

  const checks = crossCheck(arts, chart)
  const report: HecanReport = {
    arts,
    crossChecks: checks,
    overallTier: overallTierOf(checks),
    availableArts: arts.filter((a) => a.precision !== 'unavailable').length,
    disclaimer: HECAN_DISCLAIMER,
    rulesetVersion: HECAN_RULESET_VERSION,
  }
  return { report, provenance, warnings, chart }
}
