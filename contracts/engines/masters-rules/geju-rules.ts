/**
 * 取格规则引擎（课题 01/02 师门口径 2026-09-04）
 * 主格：月令藏干透干者优先（透干取格）；副格：计数法（财星透干≥4 → 大偏财格等）
 * 输出：主格/副格/用神倾向/取格依据——接入 AI 摘要，供先生详批定名使用
 */
import type { BaziChartV2 } from '../../bazi-core/types'

export interface GejuResult {
  /** 主格名（如「偏印格」） */
  main: string
  /** 主格依据 */
  mainBasis: string
  /** 副格名（如「大偏财格」；无则 null） */
  vice: string | null
  /** 副格依据 */
  viceBasis: string
  /** 用神倾向（人话一句话，供 AI 参考——只作参详素材） */
  yongshen: string
  /** 特殊提醒（如「枭神夺食」——课题口径：原局无食神则不夺） */
  warnings: string[]
}

// 月令藏干主气对应的十神（由月支五行 vs 日主推算——直接由 tenGods 的 hidden 层月柱主气取）
function monthMainTenGod(chart: BaziChartV2): { tenGod: string; stem: string } | null {
  const monthHidden = chart.tenGods.filter((t) => t.pillar.includes('月') && t.layer === 'hidden')
  if (monthHidden.length === 0) return null
  // 主气排第一（引擎按本中余序）
  return { tenGod: monthHidden[0].tenGod, stem: monthHidden[0].char }
}

/** 天干透出的十神（stem 层） */
function stemTenGods(chart: BaziChartV2): { tenGod: string; pillar: string; char: string }[] {
  return chart.tenGods.filter((t) => t.layer === 'stem').map((t) => ({ tenGod: t.tenGod, pillar: t.pillar, char: t.char }))
}

/** 计数法：某十神在四柱干支+藏干中出现的位置数（每个位置计 1——师门口径） */
function countTenGod(chart: BaziChartV2, tenGods: string[]): number {
  let count = 0
  for (const t of chart.tenGods) {
    if (tenGods.includes(t.tenGod)) count += 1
  }
  return count
}

const GEJU_NAME: Record<string, string> = {
  正官: '正官格', 七杀: '七杀格（大七杀格）', 正财: '正财格', 偏财: '偏财格（大偏财格）',
  正印: '正印格', 偏印: '偏印格（大偏印格）', 食神: '食神格', 伤官: '伤官格',
  比肩: '建禄格', 劫财: '月刃格',
}

export function gejuOf(chart: BaziChartV2): GejuResult {
  // 1. 主格：月令藏干透干者优先；无透则取月令主气
  const mm = monthMainTenGod(chart)
  const stems = stemTenGods(chart)
  const monthHiddenSet = new Set(
    chart.tenGods.filter((t) => t.pillar.includes('月') && t.layer === 'hidden').map((t) => t.tenGod),
  )
  const transparent = stems.find((s) => monthHiddenSet.has(s.tenGod))
  const mainTenGod = transparent ? transparent.tenGod : (mm?.tenGod ?? '比肩')
  const main = GEJU_NAME[mainTenGod] ?? `${mainTenGod}格`
  const mainBasis = transparent
    ? `月令藏干透干取格：${transparent.char}（${transparent.tenGod}）透${transparent.pillar.replace('柱', '干')}`
    : `月令主气取格：${mm?.stem ?? '?'}（${mainTenGod}）当令`

  // 2. 副格：计数法——财星透干（正财+偏财）≥4 → 大偏财格
  const caiCount = countTenGod(chart, ['正财', '偏财'])
  const shaCount = countTenGod(chart, ['七杀'])
  let vice: string | null = null
  let viceBasis = ''
  if (caiCount >= 4) {
    vice = '大偏财格'
    viceBasis = `财星（正财+偏财）位置计数 ${caiCount} ≥ 4——财旺成副格（主格副格并存）`
  } else if (shaCount >= 4) {
    vice = '大七杀格'
    viceBasis = `七杀位置计数 ${shaCount} ≥ 4——杀重成副格`
  } else if (caiCount >= 2.5) {
    vice = '偏财格'
    viceBasis = `财星位置计数 ${caiCount}（次旺）——财为副格`
  }

  // 3. 用神倾向（简版：结合调候与格局——只给方向性一句话）
  const caiYiZhan = mainTenGod === '偏印' || mainTenGod === '正印'
  let yongshen = ''
  if (caiYiZhan && caiCount >= 3) {
    yongshen = '财印相战——取金通关（财生杀、杀生印，化克为生）；木护印为守。'
  } else if (mainTenGod === '七杀') {
    yongshen = '杀重须制化——先取印化杀、次取食伤制杀（见甲寻丁之类按日主另参调候）。'
  } else {
    yongshen = '依调候参考层取用（以月令与日主参详），本层只提示格局走向。'
  }

  // 4. 特殊提醒（课题口径）
  const warnings: string[] = []
  // 枭神夺食：偏印为主格 且 原局有食神（无食神则不夺——课题口径）
  const shiShenCount = countTenGod(chart, ['食神'])
  if ((mainTenGod === '偏印' || mainTenGod === '正印') && shiShenCount > 0) {
    warnings.push('枭神夺食：印星旺而原局有食神——福气被夺之象（不会享福、劳碌、对晚辈苛刻）；逢食神被克之流年大运尤需留意')
  } else if ((mainTenGod === '偏印' || mainTenGod === '正印') && shiShenCount === 0) {
    warnings.push('印格无食神：原局无食神则不夺（课题口径）——但印重之人表达偏弱，宜主动「泄秀」')
  }
  // 财印相战
  if (caiYiZhan && caiCount >= 4) {
    warnings.push('财印相战：财星旺攻印星——为利折名之险，逢土旺运尤须守底线')
  }
  // 三刑检测（寅巳申/丑戌未/子卯）
  const branches = [chart.pillars.year?.branch, chart.pillars.month?.branch, chart.pillars.day?.branch, chart.pillars.hour?.branch].filter((b): b is string => !!b)
  const bSet = new Set(branches)
  if (bSet.has('寅') && bSet.has('巳') && bSet.has('申')) {
    warnings.push('寅巳申三刑（无恩之刑）：恩中生怨、热心反招是非——帮人先想清「落空担不担得起」；人际、官非多留意')
  }
  if (bSet.has('丑') && bSet.has('戌') && bSet.has('未')) {
    warnings.push('丑戌未三刑（恃势之刑）：人事纠纷、官非之象——遇事走正路、留凭证')
  }
  // 双冲检测（同一地支被两处相冲——如日支被双申冲）
  const CHONG: Record<string, string> = {
    子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳',
  }
  for (const b of branches) {
    const c = CHONG[b]
    if (!c) continue
    if (branches.filter((x) => x === c).length >= 2) {
      warnings.push(`双冲${b}：${b}被双${c}相冲——根基、婚姻宫、身体多动荡，宜动中求稳`)
      break
    }
  }
  // 四马全见检测（寅申巳亥全——含胎元）
  const fo = (chart as never as { fetalOrigin?: { branch: string } | null }).fetalOrigin
  const allBranches = fo?.branch ? [...branches, fo.branch] : branches
  const allSet = new Set(allBranches)
  if (allSet.has('寅') && allSet.has('申') && allSet.has('巳') && allSet.has('亥')) {
    warnings.push('寅申巳亥四马全见：驿马重重、一生动荡奔动——宜动中求稳，不宜强行落地')
  }
  return { main, mainBasis, vice, viceBasis, yongshen, warnings }
}
