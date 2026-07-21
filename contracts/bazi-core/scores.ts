/**
 * 人生轨迹结构评分（透明可解释）
 * 对每个大运步与每个流年（0-100 岁）输出 0-100 结构分，
 * 由三个公开因子加权：五行结构变化、十神作用、冲合刑害密度。
 */
import {
  BRANCHES,
  BRANCH_CHONG,
  BRANCH_HAI,
  BRANCH_LIUHE,
  BRANCH_PO,
  STEMS,
  STEM_WUXING,
  BRANCH_WUXING,
  WUXING_LIST,
  WUXING_SHENG,
  WUXING_KE,
  XING_PAIR_GROUPS,
  XING_ZIMAO,
  ZIXING_BRANCHES,
} from './rules/stems-branches'
import { tenGod } from './rules/tengods'
import type {
  BaziChartV2,
  DayunScore,
  LifeScores,
  LiunianScore,
  PillarInfo,
  ScoreFactor,
  Wuxing,
} from './types'

/** 全局免责文案（评分可视化专用） */
export const SCORES_DISCLAIMER =
  '此图是传统规则结构可视化，不是客观财富、健康或人生结果预测。'

/** 因子权重（公开常量） */
export const FACTOR_WEIGHTS = {
  wuxingBalance: 0.4,
  tenGodAction: 0.35,
  relationDensity: 0.25,
} as const

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n))

/* ------------------------------------------------------------------ */
/* 因子 1：五行结构变化（岁运五行对命局平衡的影响）                      */
/* ------------------------------------------------------------------ */

function deviation(count: Record<Wuxing, number>): number {
  const total = WUXING_LIST.reduce((s, w) => s + count[w], 0)
  const mean = total / 5
  return WUXING_LIST.reduce((s, w) => s + Math.abs(count[w] - mean), 0)
}

function wuxingBalanceFactor(
  chart: BaziChartV2,
  incoming: { stemIdx: number; branchIdx: number }[],
): ScoreFactor {
  const base: Record<Wuxing, number> = { ...chart.wuxing.count }
  const baseDev = deviation(base)
  const added: string[] = []
  for (const inc of incoming) {
    base[STEM_WUXING[inc.stemIdx]] += 1
    base[BRANCH_WUXING[inc.branchIdx]] += 0.6
    added.push(`${STEMS[inc.stemIdx]}${STEM_WUXING[inc.stemIdx]}/${BRANCHES[inc.branchIdx]}${BRANCH_WUXING[inc.branchIdx]}`)
  }
  const newDev = deviation(base)
  const improvement = baseDev - newDev
  const score = clamp(Math.round(50 + improvement * 12))
  return {
    key: 'wuxingBalance',
    name: '五行结构变化',
    score,
    weight: FACTOR_WEIGHTS.wuxingBalance,
    explanation: `岁运带入五行（${added.join('、')}）后，命局五行总偏差由 ${baseDev.toFixed(2)} 变为 ${newDev.toFixed(2)}，${
      improvement > 0 ? '偏差收窄，结构更趋均衡' : improvement < 0 ? '偏差扩大，结构更趋失衡' : '偏差持平'
    }。`,
  }
}

/* ------------------------------------------------------------------ */
/* 因子 2：十神作用（岁运十神与用神关系）                                */
/* ------------------------------------------------------------------ */

function tenGodFactor(
  chart: BaziChartV2,
  incoming: { stemIdx: number; branchIdx: number }[],
  basis: string,
): ScoreFactor {
  const { yongshen, xishen, jishen } = chart.yongshen
  const me = chart.dayMasterWuxing
  let scoreSum = 0
  const notes: string[] = []
  for (const inc of incoming) {
    const stemEl = STEM_WUXING[inc.stemIdx]
    const branchEl = BRANCH_WUXING[inc.branchIdx]
    const god = tenGod(chart.dayMasterIdx, inc.stemIdx)
    let s = 50
    for (const el of [stemEl, branchEl]) {
      if (el === yongshen) s += 20
      else if (xishen.includes(el)) s += 12
      else if (jishen.includes(el)) s -= 18
    }
    // 与日主本身相生/比和略加分，相克略减分
    if (stemEl === me || WUXING_SHENG[stemEl] === me) s += 4
    else if (WUXING_KE[stemEl] === me) s -= 4
    scoreSum += clamp(s)
    notes.push(`${STEMS[inc.stemIdx]}（${god}，${stemEl}）`)
  }
  const score = clamp(Math.round(scoreSum / incoming.length))
  return {
    key: 'tenGodAction',
    name: '十神作用',
    score,
    weight: FACTOR_WEIGHTS.tenGodAction,
    explanation: `${basis}天干十神为 ${notes.join('、')}；岁运五行与用神（${yongshen}）/喜神（${xishen.join('')}）/忌神（${jishen.join('')}）的匹配度决定本子分。`,
  }
}

/* ------------------------------------------------------------------ */
/* 因子 3：冲合刑害密度（岁运与命局地支/天干的关系）                     */
/* ------------------------------------------------------------------ */

function relationFactor(
  chart: BaziChartV2,
  incoming: { stemIdx: number; branchIdx: number }[],
): ScoreFactor {
  const ps: PillarInfo[] = [
    chart.pillars.year,
    chart.pillars.month,
    chart.pillars.day,
    chart.pillars.hour,
  ].filter((p): p is PillarInfo => p !== null)
  let score = 60
  const found: string[] = []
  const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)
  for (const inc of incoming) {
    for (const p of ps) {
      const key = pairKey(inc.branchIdx, p.branchIdx)
      const tag = `${BRANCHES[inc.branchIdx]}(${p.branch}${p.label.slice(0, 1)}支)`
      if (BRANCH_LIUHE.has(key)) {
        score += 10
        found.push(`${tag}六合`)
      } else if (BRANCH_CHONG.has(key)) {
        score -= 12
        found.push(`${tag}六冲`)
      } else if (BRANCH_HAI.has(key)) {
        score -= 8
        found.push(`${tag}六害`)
      } else if (BRANCH_PO.has(key)) {
        score -= 6
        found.push(`${tag}相破`)
      } else if (XING_ZIMAO.has(key)) {
        score -= 9
        found.push(`${tag}相刑`)
      } else if (
        XING_PAIR_GROUPS.some((g) => g.branches.includes(inc.branchIdx) && g.branches.includes(p.branchIdx)) &&
        inc.branchIdx !== p.branchIdx
      ) {
        score -= 9
        found.push(`${tag}三刑`)
      } else if (ZIXING_BRANCHES.includes(inc.branchIdx) && inc.branchIdx === p.branchIdx) {
        score -= 5
        found.push(`${tag}自刑`)
      }
    }
  }
  const finalScore = clamp(Math.round(score))
  return {
    key: 'relationDensity',
    name: '冲合刑害密度',
    score: finalScore,
    weight: FACTOR_WEIGHTS.relationDensity,
    explanation:
      found.length > 0
        ? `岁运与命局的关系：${found.join('、')}；合多助顺、冲刑害破多则增波动。`
        : '岁运与命局四柱无显著合冲刑害关系，结构影响中性。',
  }
}

/* ------------------------------------------------------------------ */
/* 汇总                                                                */
/* ------------------------------------------------------------------ */

function totalOf(factors: ScoreFactor[]): number {
  return clamp(Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0)))
}

/**
 * 计算人生轨迹结构评分：
 * - 每步大运一个结构分（岁=大运干支）；
 * - 0-100 岁每个流年一个结构分（岁=流年干支 + 该岁所在大运干支）。
 */
export function computeLifeScores(chart: BaziChartV2): LifeScores {
  const dayunScores: DayunScore[] = chart.dayun.steps.map((step) => {
    const jz = step.jiaziIdx
    const incoming = [{ stemIdx: jz % 10, branchIdx: jz % 12 }]
    const factors = [
      wuxingBalanceFactor(chart, incoming),
      tenGodFactor(chart, incoming, `大运「${step.ganzhi}」`),
      relationFactor(chart, incoming),
    ]
    return { startAge: step.startAge, ganzhi: step.ganzhi, score: totalOf(factors), factors }
  })

  const liunianScores: LiunianScore[] = chart.liunian
    .filter((ln) => ln.age >= 0 && ln.age <= 100)
    .map((ln) => {
      const lnIncoming = [{ stemIdx: ln.jiaziIdx % 10, branchIdx: ln.jiaziIdx % 12 }]
      // 所在大运（按起运岁数）
      const step = chart.dayun.steps.find(
        (s) => ln.age >= s.startAge && ln.age < s.startAge + 10,
      )
      const incoming = [...lnIncoming]
      if (step) incoming.push({ stemIdx: step.jiaziIdx % 10, branchIdx: step.jiaziIdx % 12 })
      const factors = [
        wuxingBalanceFactor(chart, incoming),
        tenGodFactor(
          chart,
          incoming,
          `流年「${ln.ganzhi}」${step ? ` 叠加 大运「${step.ganzhi}」` : ''}`,
        ),
        relationFactor(chart, incoming),
      ]
      return { year: ln.year, age: ln.age, ganzhi: ln.ganzhi, score: totalOf(factors), factors }
    })

  return { dayunScores, liunianScores, disclaimer: SCORES_DISCLAIMER }
}
