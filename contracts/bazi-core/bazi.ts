/**
 * 八字核心计算（纯函数）
 * 历法基础由 calendar.ts（封装 lunar-typescript）提供：真实节气、农历换算。
 * 本模块实现：四柱（立春换年 / 节气换月 / 子时换日可选 / 五鼠遁时柱）、
 * 大运、流年、十神、纳音、十二长生、合冲刑害破、旺衰量化、扶抑用神、
 * 神煞、称骨、命宫身宫。单一入口 computeChartV2。
 */
import { Lunar } from 'lunar-typescript'
import { DAY_MS, getPrevNextJie, lunarAt, resolveBirthTime } from './calendar'
import { RULESET_VERSION } from './rules'
import {
  BRANCHES,
  BRANCH_CHONG,
  BRANCH_HAI,
  BRANCH_LIUHE,
  BRANCH_PO,
  BRANCH_WUXING,
  BRANCH_YINYANG,
  HIDDEN_STEMS,
  HUTU_START,
  JIAZI,
  NAYIN,
  SANHE_GROUPS,
  SANHUI_GROUPS,
  SHUTU_START,
  STEMS,
  STEM_COMBINE,
  STEM_WUXING,
  STEM_YINYANG,
  WUXING_KE,
  WUXING_LIST,
  WUXING_SHENG,
  XING_PAIR_GROUPS,
  XING_ZIMAO,
  ZIXING_BRANCHES,
  findJiazi,
  hourToBranchIdx,
  stageAt,
} from './rules/stems-branches'
import { tenGod } from './rules/tengods'
import { SHENSHA_REGISTRY } from './rules/shensha'
import {
  RULE_META as CHENGGU_META,
  lookupDayQian,
  lookupHourQian,
  lookupMonthQian,
  lookupVerse,
  lookupYearQian,
  qianToText,
} from './rules/chenggu'
import type {
  BaziChartV2,
  BirthInput,
  BoneWeight,
  DayunInfo,
  DayunStep,
  GongInfo,
  LiunianInfo,
  PillarInfo,
  PillarRelation,
  ShenshaHit,
  TenGodEntry,
  Wuxing,
  WuxingAnalysis,
  YongShenAnalysis,
} from './types'

/** 旺衰量化公开权重（传统规则量化模型，非客观预测） */
export const STRENGTH_MODEL = {
  name: '得令/得地/得势量化模型 v1',
  delingMax: 40, // 月令本气：比劫40 印30 食伤12 财8 官杀4
  dediMax: 30, // 年/日/时支藏干：比劫 本气10 中气6 余气4；印 本气7 中气4 余气2（封顶30）
  deshiMax: 30, // 年/月/时干：比劫10 印7（封顶30）
  countWeights: '天干1.0；藏干 本气0.6 / 中气0.25 / 余气0.15',
} as const

export const STRENGTH_DISCLAIMER = '传统规则量化模型，非客观预测'

/* ------------------------------------------------------------------ */
/* 基础工具                                                            */
/* ------------------------------------------------------------------ */

function parseGanzhi(gz: string): { stemIdx: number; branchIdx: number; jiaziIdx: number } {
  const stemIdx = STEMS.indexOf(gz[0] as (typeof STEMS)[number])
  const branchIdx = BRANCHES.indexOf(gz[1] as (typeof BRANCHES)[number])
  return { stemIdx, branchIdx, jiaziIdx: findJiazi(stemIdx, branchIdx) }
}

function buildPillar(label: string, stemIdx: number, branchIdx: number, dayStemIdx: number): PillarInfo {
  const jiaziIdx = findJiazi(stemIdx, branchIdx)
  const hidden = HIDDEN_STEMS[branchIdx].map((h) => ({
    stem: h.stem,
    stemIdx: h.stemIdx,
    role: h.role,
    wuxing: STEM_WUXING[h.stemIdx],
    tenGod: tenGod(dayStemIdx, h.stemIdx),
  }))
  const isDay = label === '日柱'
  return {
    label,
    ganzhi: `${STEMS[stemIdx]}${BRANCHES[branchIdx]}`,
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    stemIdx,
    branchIdx,
    jiaziIdx,
    stemWuxing: STEM_WUXING[stemIdx],
    branchWuxing: BRANCH_WUXING[branchIdx],
    stemYinYang: STEM_YINYANG[stemIdx],
    branchYinYang: BRANCH_YINYANG[branchIdx],
    nayin: NAYIN[Math.floor(jiaziIdx / 2)],
    hiddenStems: hidden,
    stage: stageAt(dayStemIdx, branchIdx),
    stemTenGod: isDay ? '日主' : tenGod(dayStemIdx, stemIdx),
  }
}

/* ------------------------------------------------------------------ */
/* 四柱                                                                */
/* ------------------------------------------------------------------ */

function computePillars(
  effectiveMs: number,
  input: BirthInput,
): { pillars: BaziChartV2['pillars']; dayStemIdx: number } {
  const lunar = lunarAt(effectiveMs)
  const year = parseGanzhi(lunar.getYearInGanZhiExact()) // 立春精确换年
  const month = parseGanzhi(lunar.getMonthInGanZhiExact()) // 节气精确换月
  const dayGz =
    input.dayRollover === 'zichu'
      ? lunar.getDayInGanZhiExact() // 子初(23:00)换日
      : lunar.getDayInGanZhiExact2() // 0 点换日
  const day = parseGanzhi(dayGz)
  const dayStemIdx = day.stemIdx

  const yearP = buildPillar('年柱', year.stemIdx, year.branchIdx, dayStemIdx)
  const monthP = buildPillar('月柱', month.stemIdx, month.branchIdx, dayStemIdx)
  const dayP = buildPillar('日柱', day.stemIdx, day.branchIdx, dayStemIdx)

  let hourP: PillarInfo | null = null
  if (input.hour !== null) {
    const effHour = new Date(effectiveMs).getUTCHours()
    const hourBranchIdx = hourToBranchIdx(effHour)
    // 五鼠遁：以（换日规则处理后的）日干起时
    const hourStemIdx = (SHUTU_START[dayStemIdx % 5] + hourBranchIdx) % 10
    hourP = buildPillar('时柱', hourStemIdx, hourBranchIdx, dayStemIdx)
  }
  return { pillars: { year: yearP, month: monthP, day: dayP, hour: hourP }, dayStemIdx }
}

/* ------------------------------------------------------------------ */
/* 合冲刑害破                                                          */
/* ------------------------------------------------------------------ */

function computeRelations(pillars: BaziChartV2['pillars']): PillarRelation[] {
  const list: PillarRelation[] = []
  const ps = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(
    (p): p is PillarInfo => p !== null,
  )
  const SRC = '《三命通会》论干支合冲刑害（传统公共文献）'

  // 天干五合（两两）
  for (let i = 0; i < ps.length; i += 1) {
    for (let j = i + 1; j < ps.length; j += 1) {
      const c = STEM_COMBINE[ps[i].stemIdx]
      if (c.withIdx === ps[j].stemIdx) {
        list.push({
          type: '天干五合',
          pillars: [ps[i].label, ps[j].label],
          chars: `${ps[i].stem}${ps[j].stem}`,
          resultWuxing: c.result,
          source: '《渊海子平》论天干五合',
        })
      }
    }
  }

  // 地支两两关系
  const pair = (map: Map<string, Wuxing | undefined>, type: string, withResult: boolean) => {
    for (let i = 0; i < ps.length; i += 1) {
      for (let j = i + 1; j < ps.length; j += 1) {
        const a = ps[i].branchIdx
        const b = ps[j].branchIdx
        const key = a < b ? `${a}-${b}` : `${b}-${a}`
        if (map.has(key)) {
          const result = map.get(key)
          list.push({
            type,
            pillars: [ps[i].label, ps[j].label],
            chars: `${ps[i].branch}${ps[j].branch}`,
            ...(withResult && result ? { resultWuxing: result } : {}),
            source: SRC,
          })
        }
      }
    }
  }
  pair(BRANCH_LIUHE, '六合', true)
  pair(BRANCH_CHONG, '六冲', false)
  pair(BRANCH_HAI, '六害', false)
  pair(BRANCH_PO, '相破', false)
  pair(XING_ZIMAO, '相刑（无礼之刑）', false)

  // 三刑（任意两支同见即论）与自刑
  for (const g of XING_PAIR_GROUPS) {
    for (let i = 0; i < ps.length; i += 1) {
      for (let j = i + 1; j < ps.length; j += 1) {
        if (g.branches.includes(ps[i].branchIdx) && g.branches.includes(ps[j].branchIdx)) {
          list.push({
            type: `相刑（${g.name}）`,
            pillars: [ps[i].label, ps[j].label],
            chars: `${ps[i].branch}${ps[j].branch}`,
            source: SRC,
          })
        }
      }
    }
  }
  for (const p of ps) {
    const same = ps.filter((q) => q !== p && q.branchIdx === p.branchIdx)
    if (ZIXING_BRANCHES.includes(p.branchIdx) && same.length > 0) {
      for (const q of same) {
        if (ps.indexOf(p) < ps.indexOf(q)) {
          list.push({
            type: '自刑',
            pillars: [p.label, q.label],
            chars: `${p.branch}${q.branch}`,
            source: SRC,
          })
        }
      }
    }
  }

  // 三合局（三支全）与半合（含中神的两支）
  for (const g of SANHE_GROUPS) {
    const hit = ps.filter((p) => g.branches.includes(p.branchIdx))
    const uniqBranches = new Set(hit.map((p) => p.branchIdx))
    if (uniqBranches.size === 3) {
      list.push({
        type: '三合局',
        pillars: hit.map((p) => p.label),
        chars: g.branches.map((b) => BRANCHES[b]).join(''),
        resultWuxing: g.result,
        source: SRC,
      })
    } else if (uniqBranches.size === 2 && hit.length === 2) {
      const mid = g.branches[1]
      if (hit.some((p) => p.branchIdx === mid)) {
        list.push({
          type: '三合半合',
          pillars: hit.map((p) => p.label),
          chars: hit.map((p) => p.branch).join(''),
          resultWuxing: g.result,
          source: SRC,
        })
      }
    }
  }

  // 三会方（三支全）
  for (const g of SANHUI_GROUPS) {
    const hit = ps.filter((p) => g.branches.includes(p.branchIdx))
    if (new Set(hit.map((p) => p.branchIdx)).size === 3) {
      list.push({
        type: `三会（${g.name}）`,
        pillars: hit.map((p) => p.label),
        chars: g.branches.map((b) => BRANCHES[b]).join(''),
        resultWuxing: g.result,
        source: SRC,
      })
    }
  }

  return list
}

/* ------------------------------------------------------------------ */
/* 五行统计与旺衰                                                      */
/* ------------------------------------------------------------------ */

const HIDDEN_WEIGHT = { 本气: 0.6, 中气: 0.25, 余气: 0.15 } as const

function computeWuxing(pillars: BaziChartV2['pillars'], dayStemIdx: number): WuxingAnalysis {
  const count: Record<Wuxing, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }
  const ps = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(
    (p): p is PillarInfo => p !== null,
  )
  for (const p of ps) {
    count[p.stemWuxing] += 1
    for (const h of p.hiddenStems) {
      count[h.wuxing] += HIDDEN_WEIGHT[h.role]
    }
  }
  const missing = WUXING_LIST.filter((w) => count[w] === 0)
  const sorted = [...WUXING_LIST].sort((a, b) => count[b] - count[a])

  /* 得令（月令本气与日主关系） */
  const me = STEM_WUXING[dayStemIdx]
  const monthBenqi = pillars.month.hiddenStems[0]
  const monthGod = tenGod(dayStemIdx, monthBenqi.stemIdx)
  const deling =
    monthGod === '比肩' || monthGod === '劫财'
      ? 40
      : monthGod === '正印' || monthGod === '偏印'
        ? 30
        : monthGod === '食神' || monthGod === '伤官'
          ? 12
          : monthGod === '正财' || monthGod === '偏财'
            ? 8
            : 4

  /* 得地（年/日/时支藏干中的比劫与印） */
  const rootWeight = {
    比劫: { 本气: 10, 中气: 6, 余气: 4 },
    印: { 本气: 7, 中气: 4, 余气: 2 },
  }
  let dedi = 0
  for (const p of [pillars.year, pillars.day, pillars.hour]) {
    if (!p) continue
    for (const h of p.hiddenStems) {
      const god = tenGod(dayStemIdx, h.stemIdx)
      if (god === '比肩' || god === '劫财') dedi += rootWeight.比劫[h.role]
      else if (god === '正印' || god === '偏印') dedi += rootWeight.印[h.role]
    }
  }
  dedi = Math.min(dedi, 30)

  /* 得势（年/月/时干帮扶） */
  let deshi = 0
  for (const p of [pillars.year, pillars.month, pillars.hour]) {
    if (!p) continue
    const god = tenGod(dayStemIdx, p.stemIdx)
    if (god === '比肩' || god === '劫财') deshi += 10
    else if (god === '正印' || god === '偏印') deshi += 7
  }
  deshi = Math.min(deshi, 30)

  const total = deling + dedi + deshi
  const grade =
    total >= 85 ? '极旺'
    : total >= 70 ? '旺'
    : total >= 58 ? '偏旺'
    : total >= 42 ? '中和'
    : total >= 30 ? '偏弱'
    : total >= 15 ? '弱'
    : '极弱'

  const hourKnown = pillars.hour !== null
  return {
    count,
    missing,
    strongest: sorted[0],
    weakest: sorted[sorted.length - 1],
    strength: {
      deling,
      dedi,
      deshi,
      total,
      grade,
      model: `权重公开：得令≤40（月令本气 比劫40/印30/食伤12/财8/官杀4）；得地≤30（支藏 比劫10/6/4、印7/4/2）；得势≤30（干透 比劫10、印7）。五行计数权重：${STRENGTH_MODEL.countWeights}。日主五行属${me}。`,
      confidence: hourKnown
        ? '四柱齐全，量化输入完整；模型为公开权重的传统规则量化，结果仅供结构参考。'
        : '时辰未知，得地/得势缺少时柱数据，旺衰判定置信度降低，请谨慎参考。',
      disclaimer: STRENGTH_DISCLAIMER,
    },
  }
}

/* ------------------------------------------------------------------ */
/* 喜忌用神（扶抑法基础规则）                                           */
/* ------------------------------------------------------------------ */

function computeYongshen(dayStemIdx: number, wuxing: WuxingAnalysis): YongShenAnalysis {
  const me = STEM_WUXING[dayStemIdx]
  const shengMe = WUXING_LIST.find((w) => WUXING_SHENG[w] === me) as Wuxing // 印
  const meSheng = WUXING_SHENG[me] // 食伤
  const meKe = WUXING_KE[me] // 财
  const keMe = WUXING_LIST.find((w) => WUXING_KE[w] === me) as Wuxing // 官杀

  const { total, grade } = wuxing.strength
  const reasoning: string[] = [
    `日主五行属${me}，旺衰量化总分 ${total}/100，等级「${grade}」。`,
  ]
  let yongshen: Wuxing
  let xishen: Wuxing[]
  let jishen: Wuxing[]

  if (total >= 42) {
    // 中和偏旺及以上 → 抑：克（官杀）> 泄（食伤）> 耗（财），取局中有根气者优先
    reasoning.push('按扶抑法：身不弱（≥42 分）取「抑」，优先次序为 官杀(克我) > 食伤(我生) > 财(我克)。')
    const candidates: { el: Wuxing; name: string }[] = [
      { el: keMe, name: '官杀' },
      { el: meSheng, name: '食伤' },
      { el: meKe, name: '财' },
    ]
    const picked = candidates.find((c) => wuxing.count[c.el] > 0) ?? candidates[0]
    yongshen = picked.el
    reasoning.push(`选用神五行属${picked.el}（${picked.name}），以其抑旺身。`)
    xishen = [WUXING_LIST.find((w) => WUXING_SHENG[w] === yongshen) as Wuxing]
    jishen = [me, shengMe]
    reasoning.push(`喜神取生助用神之五行；忌神取扶身之比劫（${me}）与印绶（${shengMe}）。`)
  } else {
    // 偏弱及以下 → 扶：印 > 比劫
    reasoning.push('按扶抑法：身弱（<42 分）取「扶」，优先次序为 印(生我) > 比劫(同我)。')
    const candidates: { el: Wuxing; name: string }[] = [
      { el: shengMe, name: '印' },
      { el: me, name: '比劫' },
    ]
    const picked = candidates.find((c) => wuxing.count[c.el] > 0) ?? candidates[0]
    yongshen = picked.el
    reasoning.push(`选用神五行属${yongshen}（${picked.name}），以其扶弱身。`)
    xishen = [yongshen === shengMe ? me : shengMe]
    jishen = [keMe, meKe]
    reasoning.push(`喜神取同扶之五行；忌神取克我之官杀（${keMe}）与我克之财（${meKe}，身弱财多反为累）。`)
  }
  reasoning.push('说明：扶抑法为基础取用法，未涉及调候、通关、专旺等进阶格局判定。')

  return {
    method: '扶抑',
    strengthGrade: grade,
    yongshen,
    xishen,
    jishen,
    reasoning,
    disclaimer: STRENGTH_DISCLAIMER,
  }
}

/* ------------------------------------------------------------------ */
/* 神煞                                                                */
/* ------------------------------------------------------------------ */

function computeShensha(pillars: BaziChartV2['pillars'], gender: BirthInput['gender']): ShenshaHit[] {
  const ps = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(
    (p): p is PillarInfo => p !== null,
  )
  const ctx = {
    gender,
    dayStemIdx: pillars.day.stemIdx,
    dayBranchIdx: pillars.day.branchIdx,
    yearBranchIdx: pillars.year.branchIdx,
    monthBranchIdx: pillars.month.branchIdx,
    dayJiaziIdx: pillars.day.jiaziIdx,
    pillars: ps.map((p) => ({ label: p.label, stemIdx: p.stemIdx, branchIdx: p.branchIdx })),
  }
  const hits: ShenshaHit[] = []
  for (const def of SHENSHA_REGISTRY) {
    // 多命中策略 list-all：每个命中柱位产出一条独立记录，不合并布尔
    for (const f of def.find(ctx)) {
      hits.push({
        ruleId: def.ruleId,
        name: def.name,
        pillar: f.position,
        char: f.char,
        variant: def.variant,
        basis: def.basis,
        verse: def.verse,
        source: def.source,
        modernExplanation: def.modernExplanation,
        rulesetVersion: def.rulesetVersion,
      })
    }
  }
  return hits
}

/* ------------------------------------------------------------------ */
/* 称骨（需农历月日；时辰未知或查表失败返回 null）                        */
/* ------------------------------------------------------------------ */

function computeChenggu(
  input: BirthInput,
  lunarDate: { year: number; month: number; day: number },
  effectiveMs: number,
): BoneWeight | null {
  if (input.hour === null) return null // 时辰未知无法计时重
  // 年干支按农历年（正月初一换年，称骨民俗通例）
  const l = Lunar.fromYmd(lunarDate.year, lunarDate.month, lunarDate.day)
  const yearGz = l.getYearInGanZhi()
  const jiaziIdx = JIAZI.indexOf(yearGz)
  const month = Math.abs(lunarDate.month)
  const day = lunarDate.day
  const hourBranchIdx = hourToBranchIdx(new Date(effectiveMs).getUTCHours())

  const yearQian = lookupYearQian(jiaziIdx)
  const monthQian = lookupMonthQian(month)
  const dayQian = lookupDayQian(day)
  const hourQian = lookupHourQian(hourBranchIdx)
  if (yearQian === null || monthQian === null || dayQian === null || hourQian === null) return null

  const totalQian = yearQian + monthQian + dayQian + hourQian
  const verse = lookupVerse(totalQian)
  if (verse === null) return null

  return {
    yearQian,
    monthQian,
    dayQian,
    hourQian,
    totalQian,
    totalText: qianToText(totalQian),
    yearGanzhi: yearGz,
    lunarMonth: month,
    lunarDay: day,
    hourBranch: BRANCHES[hourBranchIdx],
    verse,
    source: CHENGGU_META.source,
  }
}

/* ------------------------------------------------------------------ */
/* 大运 / 流年                                                         */
/* ------------------------------------------------------------------ */

function computeDayun(
  input: BirthInput,
  pillars: BaziChartV2['pillars'],
  effectiveMs: number,
  birthSolarYear: number,
): DayunInfo {
  const yearStemIdx = pillars.year.stemIdx
  const yangYear = yearStemIdx % 2 === 0
  const forward = (yangYear && input.gender === 'male') || (!yangYear && input.gender === 'female')
  const directionReason = `年干${STEMS[yearStemIdx]}属${yangYear ? '阳' : '阴'}，${
    input.gender === 'male' ? '男命' : '女命'
  }，按「阳男阴女顺排、阴男阳女逆排」定为${forward ? '顺排' : '逆排'}。`

  const { prev, next } = getPrevNextJie(effectiveMs)
  const ref = forward ? next : prev
  const daysToJie = Math.abs(ref.ms - effectiveMs) / DAY_MS
  const startAge = Math.round((daysToJie / 3) * 10) / 10 // 三天折一年，保留 1 位小数

  const dir = forward ? 1 : -1
  const monthJz = pillars.month.jiaziIdx
  const dayStemIdx = pillars.day.stemIdx
  const nowYear = new Date().getFullYear()
  const steps: DayunStep[] = Array.from({ length: 10 }, (_, i) => {
    const jz = (((monthJz + dir * (i + 1)) % 60) + 60) % 60
    const age = Math.round((startAge + i * 10) * 10) / 10
    const startYear = birthSolarYear + Math.round(age)
    return {
      index: i + 1,
      ganzhi: JIAZI[jz],
      jiaziIdx: jz,
      stemTenGod: tenGod(dayStemIdx, jz % 10),
      nayin: NAYIN[Math.floor(jz / 2)],
      startAge: age,
      endAge: Math.round((age + 10) * 10) / 10,
      startYear,
      endYear: startYear + 10,
      isCurrent: nowYear >= startYear && nowYear < startYear + 10,
    }
  })

  return {
    forward,
    directionReason,
    startAge,
    refJieName: ref.name,
    refJieTime: ref.text,
    daysToJie: Math.round(daysToJie * 1000) / 1000,
    steps,
  }
}

function computeLiunian(birthSolarYear: number, dayStemIdx: number): LiunianInfo[] {
  const nowYear = new Date().getFullYear()
  const list: LiunianInfo[] = []
  for (let year = birthSolarYear; year <= birthSolarYear + 100; year += 1) {
    const jz = (((year - 4) % 60) + 60) % 60
    list.push({
      year,
      ganzhi: JIAZI[jz],
      jiaziIdx: jz,
      stemTenGod: tenGod(dayStemIdx, jz % 10),
      age: year - birthSolarYear,
      isCurrent: year === nowYear,
    })
  }
  return list
}

/* ------------------------------------------------------------------ */
/* 命宫 / 身宫（传统起法，单独标注，不混称「六柱」）                      */
/* ------------------------------------------------------------------ */

function computeGong(
  kind: 'ming' | 'shen',
  monthBranchIdx: number,
  hourBranchIdx: number,
  yearStemIdx: number,
): GongInfo {
  // 寅=1 … 丑=12（节令月序）；子=1 … 亥=12（时序）
  const monthNum = (((monthBranchIdx - 2) % 12) + 12) % 12 + 1
  const hourNum = hourBranchIdx + 1
  // 命宫：由生月支起子时逆数至生时 → 宫支序 = 14 − (月序 + 时序)（≤0 加 12）
  // 身宫：由生月支起子时顺数至生时 → 宫支序 = 月序 + 时序 − 1（>12 减 12）
  let zhiNum =
    kind === 'ming' ? 14 - (monthNum + hourNum) : monthNum + hourNum - 1
  while (zhiNum <= 0) zhiNum += 12
  while (zhiNum > 12) zhiNum -= 12
  const branchIdx = (zhiNum + 1) % 12 // 1→寅(2) … 12→丑(1)
  // 宫干：五虎遁由年干起寅月干
  const stemIdx = (HUTU_START[yearStemIdx % 5] + (zhiNum - 1)) % 10
  return {
    ganzhi: `${STEMS[stemIdx]}${BRANCHES[branchIdx]}`,
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    method:
      kind === 'ming'
        ? '命宫起法：以生月支起子时逆数至生时所在支，再以五虎遁由年干起宫干（传统起法，单独标注，不混称六柱）。'
        : '身宫起法：以生月支起子时顺数至生时所在支，再以五虎遁由年干起宫干（传统起法，单独标注，不混称六柱）。',
  }
}

/* ------------------------------------------------------------------ */
/* 十神全量                                                            */
/* ------------------------------------------------------------------ */

function collectTenGods(pillars: BaziChartV2['pillars']): TenGodEntry[] {
  const ps = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(
    (p): p is PillarInfo => p !== null,
  )
  const list: TenGodEntry[] = []
  for (const p of ps) {
    list.push({ tenGod: p.stemTenGod, pillar: p.label, char: p.stem, layer: 'stem' })
    for (const h of p.hiddenStems) {
      list.push({
        tenGod: h.tenGod,
        pillar: p.label,
        char: `${p.branch}中${h.stem}${STEM_WUXING[h.stemIdx]}`,
        layer: 'hidden',
      })
    }
  }
  return list
}

/* ------------------------------------------------------------------ */
/* 主入口                                                              */
/* ------------------------------------------------------------------ */

export function computeChartV2(input: BirthInput): BaziChartV2 {
  const resolved = resolveBirthTime(input)
  const { pillars, dayStemIdx } = computePillars(resolved.effectiveMs, input)
  const dayMaster = STEMS[dayStemIdx]
  const dayMasterWuxing = STEM_WUXING[dayStemIdx]

  const wuxing = computeWuxing(pillars, dayStemIdx)
  const yongshen = computeYongshen(dayStemIdx, wuxing)
  const relations = computeRelations(pillars)
  const shensha = computeShensha(pillars, input.gender)
  const chenggu = computeChenggu(input, resolved.lunar, resolved.effectiveMs)
  const birthSolarYear = resolved.civil.year
  const dayun = computeDayun(input, pillars, resolved.effectiveMs, birthSolarYear)
  const liunian = computeLiunian(birthSolarYear, dayStemIdx)

  const hourBranchIdx = pillars.hour ? pillars.hour.branchIdx : null
  const mingGong =
    hourBranchIdx === null
      ? null
      : computeGong('ming', pillars.month.branchIdx, hourBranchIdx, pillars.year.stemIdx)
  const shenGong =
    hourBranchIdx === null
      ? null
      : computeGong('shen', pillars.month.branchIdx, hourBranchIdx, pillars.year.stemIdx)

  return {
    rulesetVersion: RULESET_VERSION,
    input,
    timeAudit: resolved.timeAudit,
    pillars,
    dayMaster,
    dayMasterIdx: dayStemIdx,
    dayMasterWuxing,
    tenGods: collectTenGods(pillars),
    relations,
    wuxing,
    yongshen,
    shensha,
    chenggu,
    dayun,
    liunian,
    mingGong,
    shenGong,
  }
}
