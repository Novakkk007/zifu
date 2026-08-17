/**
 * 合盘核心引擎 · hepan-core
 * 纯函数库：输入两张 computeChartV2 真实命盘，输出规则化的结构契合分析。
 * 无 React / 无 DB / 无网络。前后端共用。
 *
 * 规则依据（传统公共文献）：
 * - 天干五合 / 地支六合、六冲、三合、相刑、六害：《渊海子平》《三命通会》
 * - 日主五行生克比和：《滴天髓》论日主
 * - 合婚取年支生肖之合冲：《三命通会·论合婚》
 * 量化权重为紫府公开模型（HEPAN_SCORE_WEIGHTS），非古籍定数。
 */
import {
  BRANCH_CHONG,
  BRANCH_HAI,
  BRANCH_LIUHE,
  BRANCH_PO,
  SANHE_GROUPS,
  STEM_COMBINE,
  WUXING_KE,
  WUXING_LIST,
  WUXING_SHENG,
  XING_PAIR_GROUPS,
  XING_ZIMAO,
  ZIXING_BRANCHES,
} from '../../bazi-core/rules/stems-branches'
import type { BaziChartV2, PillarInfo, Wuxing } from '../../bazi-core/types'

export const HEPAN_ALGORITHM_VERSION = 'hepan-core@1'
export const HEPAN_RULESET_VERSION = '1.0.0'

/** 文案常量：传统规则结构分析，非关系预测 */
export const HEPAN_DISCLAIMER =
  '本报告为传统命理规则的结构化分析：合冲刑害取自《渊海子平》《三命通会》等公共文献，量化权重为紫府公开模型。仅作文化参考，不构成对人际关系的预测或建议。'

/** 总分合成权重（公开常量，五项之和 = 1） */
export const HEPAN_SCORE_WEIGHTS = {
  wuxingComplement: 0.3,
  dayMasterRelation: 0.2,
  zodiacHarmony: 0.15,
  yongshenMatch: 0.2,
  crossRelations: 0.15,
} as const

/** 单维度分析结果（规则 + 依据文字） */
export interface HepanDimension {
  /** 维度标识 */
  key: keyof typeof HEPAN_SCORE_WEIGHTS
  name: string
  /** 0-100 子分数 */
  score: number
  /** 公开权重 */
  weight: number
  /** 规则条目（检出的事实，如「甲己合（年干×月干）」） */
  findings: string[]
  /** 依据文字（规则解释） */
  basis: string
}

/** 日主关系类别 */
export type DayMasterRelation = '比和' | '相生' | '相制'

/** 生肖（年支）关系类别 */
export type ZodiacRelation = '六合' | '三合' | '比和' | '无涉' | '相刑' | '相害' | '相冲'

/** 跨盘干支关系条目 */
export interface CrossRelation {
  type: '天干五合' | '六合' | '三合' | '六冲' | '相刑' | '六害' | '相破'
  /** 参与位置，如「甲年干×乙月干」 */
  positions: string
  /** 参与干支原文，如「甲己」「寅亥」「申子辰」 */
  chars: string
  /** 合化五行（可化者） */
  resultWuxing?: Wuxing
  /** 规则出处 */
  source: string
}

export interface HepanReport {
  dimensions: HepanDimension[]
  /** 总分（公开权重加权和，0-100 整数） */
  totalScore: number
  dayMasterRelation: DayMasterRelation
  zodiacRelation: ZodiacRelation
  crossRelations: CrossRelation[]
  disclaimer: string
  rulesetVersion: string
}

const SOURCE_GANZHI = '《渊海子平》《三命通会》论干支合冲刑害（传统公共文献）'

/* ---------------- 工具 ---------------- */

function pillarsOf(chart: BaziChartV2): { label: string; pillar: PillarInfo }[] {
  const out: { label: string; pillar: PillarInfo }[] = [
    { label: '年柱', pillar: chart.pillars.year },
    { label: '月柱', pillar: chart.pillars.month },
    { label: '日柱', pillar: chart.pillars.day },
  ]
  if (chart.pillars.hour) out.push({ label: '时柱', pillar: chart.pillars.hour })
  return out
}

const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)

/* ---------------- 1 · 五行互补度 ---------------- */

/**
 * 互补量化：各方五行计数的「亏缺量」（低于己方均值部分）中，
 * 能被对方「盈余量」（高于对方均值部分）覆盖的比例。双向合计。
 * 双方五行皆均衡（无亏缺）时记 80：无所缺亦无所补，取中性偏上。
 */
function wuxingComplement(a: BaziChartV2, b: BaziChartV2): HepanDimension {
  const stats = (c: BaziChartV2) => {
    const total = WUXING_LIST.reduce((s, w) => s + c.wuxing.count[w], 0)
    const avg = total / 5
    return { count: c.wuxing.count, avg }
  }
  const sa = stats(a)
  const sb = stats(b)
  let deficit = 0
  let covered = 0
  for (const w of WUXING_LIST) {
    const defA = Math.max(0, sa.avg - sa.count[w])
    const surB = Math.max(0, sb.count[w] - sb.avg)
    const defB = Math.max(0, sb.avg - sb.count[w])
    const surA = Math.max(0, sa.count[w] - sa.avg)
    deficit += defA + defB
    covered += Math.min(defA, surB) + Math.min(defB, surA)
  }
  const score = deficit === 0 ? 80 : Math.min(100, Math.round((covered / deficit) * 100))
  const findings: string[] = []
  const missText = (c: BaziChartV2, other: BaziChartV2, who: string, otherWho: string) =>
    c.wuxing.missing.length > 0
      ? `${who}缺${c.wuxing.missing.join('、')}，${otherWho}${c.wuxing.missing
          .map((w) => `${w}${other.wuxing.count[w].toFixed(1)}`)
          .join('、')}`
      : `${who}五行俱全`
  findings.push(missText(a, b, '甲方', '乙方'), missText(b, a, '乙方', '甲方'))
  findings.push(
    `甲方最旺${a.wuxing.strongest}、最弱${a.wuxing.weakest}；乙方最旺${b.wuxing.strongest}、最弱${b.wuxing.weakest}`,
  )
  return {
    key: 'wuxingComplement',
    name: '五行互补',
    score,
    weight: HEPAN_SCORE_WEIGHTS.wuxingComplement,
    findings,
    basis:
      '以双方五行计数（天干 1.0，藏干本气 0.6 / 中气 0.25 / 余气 0.15）量化亏缺与盈余：一方所缺恰为对方之有余，覆盖率越高互补越深。覆盖率 = 可被对方盈余覆盖的亏缺量 ÷ 双方总亏缺量。',
  }
}

/* ---------------- 2 · 日主关系 ---------------- */

export function dayMasterRelationOf(a: Wuxing, b: Wuxing): DayMasterRelation {
  if (a === b) return '比和'
  if (WUXING_SHENG[a] === b || WUXING_SHENG[b] === a) return '相生'
  return '相制'
}

function dayMasterDim(a: BaziChartV2, b: BaziChartV2): HepanDimension {
  const rel = dayMasterRelationOf(a.dayMasterWuxing, b.dayMasterWuxing)
  const score = rel === '相生' ? 90 : rel === '比和' ? 75 : 50
  const direction =
    rel === '相生'
      ? WUXING_SHENG[a.dayMasterWuxing] === b.dayMasterWuxing
        ? `甲方${a.dayMasterWuxing}生乙方${b.dayMasterWuxing}`
        : `乙方${b.dayMasterWuxing}生甲方${a.dayMasterWuxing}`
      : rel === '相制'
        ? WUXING_KE[a.dayMasterWuxing] === b.dayMasterWuxing
          ? `甲方${a.dayMasterWuxing}制乙方${b.dayMasterWuxing}`
          : `乙方${b.dayMasterWuxing}制甲方${a.dayMasterWuxing}`
        : `两干同属${a.dayMasterWuxing}`
  return {
    key: 'dayMasterRelation',
    name: '日主关系',
    score,
    weight: HEPAN_SCORE_WEIGHTS.dayMasterRelation,
    findings: [
      `甲方日主${a.dayMaster}（${a.dayMasterWuxing}），乙方日主${b.dayMaster}（${b.dayMasterWuxing}）——${rel}`,
      direction,
    ],
    basis:
      '日主为一盘之主。两干相生者（90）有承继之情；比和者（75）同气相求，须各留分寸；相制者（50）棱角相抵，传统视为磨合之象。子分数为公开模型设定。',
  }
}

/* ---------------- 3 · 生肖（年支）合冲 ---------------- */

export function zodiacRelationOf(aBranchIdx: number, bBranchIdx: number): ZodiacRelation {
  if (aBranchIdx === bBranchIdx) return '比和'
  if (BRANCH_LIUHE.has(pairKey(aBranchIdx, bBranchIdx))) return '六合'
  if (BRANCH_CHONG.has(pairKey(aBranchIdx, bBranchIdx))) return '相冲'
  if (BRANCH_HAI.has(pairKey(aBranchIdx, bBranchIdx))) return '相害'
  if (
    XING_ZIMAO.has(pairKey(aBranchIdx, bBranchIdx)) ||
    XING_PAIR_GROUPS.some((g) => g.branches.includes(aBranchIdx) && g.branches.includes(bBranchIdx))
  ) {
    return '相刑'
  }
  if (SANHE_GROUPS.some((g) => g.branches.includes(aBranchIdx) && g.branches.includes(bBranchIdx))) {
    return '三合'
  }
  return '无涉'
}

function zodiacDim(a: BaziChartV2, b: BaziChartV2): HepanDimension {
  const ya = a.pillars.year
  const yb = b.pillars.year
  const rel = zodiacRelationOf(ya.branchIdx, yb.branchIdx)
  const score =
    rel === '六合' ? 95
    : rel === '三合' ? 85
    : rel === '比和' ? 75
    : rel === '无涉' ? 60
    : rel === '相刑' || rel === '相害' ? 45
    : 30
  return {
    key: 'zodiacHarmony',
    name: '生肖合冲',
    score,
    weight: HEPAN_SCORE_WEIGHTS.zodiacHarmony,
    findings: [`甲方年支${ya.branch}，乙方年支${yb.branch}——${rel}`],
    basis:
      '传统合婚先论年支生肖：六合为上（95），三合次之（85），比和中平（75），无涉者平（60），刑害者下（45），六冲最忌（30）。见《三命通会·论合婚》（传统公共文献）。',
  }
}

/* ---------------- 4 · 十神互补（用神匹配） ---------------- */

/**
 * 己方用神五行在对方盘中的分布强度：
 * 对方该五行计数 ≥ 对方均值 → 得配（90）；
 * 仅喜神得配 → （70）；
 * 对方最旺五行恰为己方忌神 → （35）；
 * 其余 → （55）。双向平均。
 */
function yongshenMatchDim(a: BaziChartV2, b: BaziChartV2): HepanDimension {
  const oneWay = (
    self: BaziChartV2,
    other: BaziChartV2,
    who: string,
    otherWho: string,
  ): { score: number; finding: string } => {
    const ys = self.yongshen.yongshen
    const total = WUXING_LIST.reduce((s, w) => s + other.wuxing.count[w], 0)
    const avg = total / 5
    if (other.wuxing.count[ys] >= avg && other.wuxing.count[ys] > 0) {
      return {
        score: 90,
        finding: `${who}用神属${ys}，${otherWho}盘中${ys}达${other.wuxing.count[ys].toFixed(1)}（高于均值${avg.toFixed(1)}），用神得配`,
      }
    }
    if (self.yongshen.xishen.some((x) => other.wuxing.count[x] >= avg && other.wuxing.count[x] > 0)) {
      return { score: 70, finding: `${who}喜用（${[ys, ...self.yongshen.xishen].join('、')}）在${otherWho}盘中部分得配` }
    }
    if (self.yongshen.jishen.includes(other.wuxing.strongest)) {
      return { score: 35, finding: `${otherWho}最旺之${other.wuxing.strongest}恰为${who}忌神，传统视为相碍` }
    }
    return { score: 55, finding: `${who}用神${ys}在${otherWho}盘中不显（${other.wuxing.count[ys].toFixed(1)}）` }
  }
  const ra = oneWay(a, b, '甲方', '乙方')
  const rb = oneWay(b, a, '乙方', '甲方')
  return {
    key: 'yongshenMatch',
    name: '十神互补',
    score: Math.round((ra.score + rb.score) / 2),
    weight: HEPAN_SCORE_WEIGHTS.yongshenMatch,
    findings: [ra.finding, rb.finding],
    basis:
      '以扶抑法用神为纲：己方用神五行在对方盘中得势者为「得配」（90），仅喜神得配（70），对方旺气恰犯己方忌神（35），余者平平（55）。用神推理见各盘 yongshen.reasoning。',
  }
}

/* ---------------- 5 · 跨盘干支合冲刑害 ---------------- */

/** 跨盘关系检测：甲盘每柱 × 乙盘每柱，天干论五合，地支论六合/三合半合/六冲/刑/害/破 */
export function detectCrossRelations(a: BaziChartV2, b: BaziChartV2): CrossRelation[] {
  const out: CrossRelation[] = []
  const pa = pillarsOf(a)
  const pb = pillarsOf(b)
  for (const x of pa) {
    for (const y of pb) {
      const posStem = `甲${x.label.replace('柱', '')}干×乙${y.label.replace('柱', '')}干`
      const posBranch = `甲${x.label.replace('柱', '')}支×乙${y.label.replace('柱', '')}支`
      // 天干五合
      const combine = STEM_COMBINE[x.pillar.stemIdx]
      if (combine && combine.withIdx === y.pillar.stemIdx) {
        out.push({
          type: '天干五合',
          positions: posStem,
          chars: `${x.pillar.stem}${y.pillar.stem}`,
          resultWuxing: combine.result,
          source: SOURCE_GANZHI,
        })
      }
      const key = pairKey(x.pillar.branchIdx, y.pillar.branchIdx)
      // 六合
      if (BRANCH_LIUHE.has(key)) {
        out.push({
          type: '六合',
          positions: posBranch,
          chars: `${x.pillar.branch}${y.pillar.branch}`,
          resultWuxing: BRANCH_LIUHE.get(key),
          source: SOURCE_GANZHI,
        })
      }
      // 六冲
      if (BRANCH_CHONG.has(key)) {
        out.push({ type: '六冲', positions: posBranch, chars: `${x.pillar.branch}${y.pillar.branch}`, source: SOURCE_GANZHI })
      }
      // 六害
      if (BRANCH_HAI.has(key)) {
        out.push({ type: '六害', positions: posBranch, chars: `${x.pillar.branch}${y.pillar.branch}`, source: SOURCE_GANZHI })
      }
      // 相破
      if (BRANCH_PO.has(key)) {
        out.push({ type: '相破', positions: posBranch, chars: `${x.pillar.branch}${y.pillar.branch}`, source: SOURCE_GANZHI })
      }
      // 相刑：子卯 / 寅巳申任意两支 / 辰午酉亥自刑（跨盘同支）
      if (XING_ZIMAO.has(key)) {
        out.push({ type: '相刑', positions: posBranch, chars: `${x.pillar.branch}${y.pillar.branch}（无礼之刑）`, source: SOURCE_GANZHI })
      } else if (x.pillar.branchIdx === y.pillar.branchIdx && ZIXING_BRANCHES.includes(x.pillar.branchIdx)) {
        out.push({ type: '相刑', positions: posBranch, chars: `${x.pillar.branch}${y.pillar.branch}（自刑）`, source: SOURCE_GANZHI })
      } else {
        const g = XING_PAIR_GROUPS.find(
          (gg) => gg.branches.includes(x.pillar.branchIdx) && gg.branches.includes(y.pillar.branchIdx),
        )
        if (g) {
          out.push({ type: '相刑', positions: posBranch, chars: `${x.pillar.branch}${y.pillar.branch}（${g.name}）`, source: SOURCE_GANZHI })
        }
      }
      // 三合半合（跨盘两支同属一个三合局）
      const sanhe = SANHE_GROUPS.find(
        (g) =>
          g.branches.includes(x.pillar.branchIdx) &&
          g.branches.includes(y.pillar.branchIdx) &&
          x.pillar.branchIdx !== y.pillar.branchIdx,
      )
      if (sanhe) {
        out.push({
          type: '三合',
          positions: posBranch,
          chars: `${x.pillar.branch}${y.pillar.branch}（三合局半合）`,
          resultWuxing: sanhe.result,
          source: SOURCE_GANZHI,
        })
      }
    }
  }
  return out
}

function crossRelationsDim(cross: CrossRelation[]): HepanDimension {
  const good = cross.filter((r) => r.type === '天干五合' || r.type === '六合' || r.type === '三合').length
  const bad = cross.filter((r) => r.type === '六冲' || r.type === '相刑' || r.type === '六害' || r.type === '相破').length
  const score = Math.max(0, Math.min(100, 60 + good * 12 - bad * 10))
  const findings =
    cross.length === 0
      ? ['两盘干支无显著交互相涉']
      : cross.map((r) => `${r.type} ${r.chars}（${r.positions}）${r.resultWuxing ? `，化${r.resultWuxing}` : ''}`)
  return {
    key: 'crossRelations',
    name: '干支交互',
    score,
    weight: HEPAN_SCORE_WEIGHTS.crossRelations,
    findings,
    basis:
      '两盘逐柱交叉检视：天干五合、地支六合与三合半合为「相应」，六冲、刑、害、破为「相碍」。基准 60，每相应 +12、每相碍 −10，限幅 0–100。规则见《渊海子平》《三命通会》（传统公共文献）。',
  }
}

/* ---------------- 总合成 ---------------- */

export function analyzeCompatibility(chartA: BaziChartV2, chartB: BaziChartV2): HepanReport {
  const cross = detectCrossRelations(chartA, chartB)
  const dimensions = [
    wuxingComplement(chartA, chartB),
    dayMasterDim(chartA, chartB),
    zodiacDim(chartA, chartB),
    yongshenMatchDim(chartA, chartB),
    crossRelationsDim(cross),
  ]
  const totalScore = Math.round(dimensions.reduce((s, d) => s + d.score * d.weight, 0))
  return {
    dimensions,
    totalScore,
    dayMasterRelation: dayMasterRelationOf(chartA.dayMasterWuxing, chartB.dayMasterWuxing),
    zodiacRelation: zodiacRelationOf(chartA.pillars.year.branchIdx, chartB.pillars.year.branchIdx),
    crossRelations: cross,
    disclaimer: HEPAN_DISCLAIMER,
    rulesetVersion: HEPAN_RULESET_VERSION,
  }
}
