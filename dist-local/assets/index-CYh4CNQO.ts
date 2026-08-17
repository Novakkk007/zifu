/**
 * 每日时令核心引擎 —— 六十甲子 canonical 编码
 *
 * 编码规则（唯一、全局）：
 *   六十甲子索引 i ∈ [0, 59]，天干 = i % 10，地支 = i % 12。
 *   禁止使用 `i / 12 | 0`、`stem * 12 + branch` 等非等价的混用编码。
 *
 * 历法精度（V12 起）：
 *   - 纯函数（yearJiazi / dayJiazi / monthJiazi / hourJiazi）保留确定性公式实现，
 *     作为独立校验锚点（1900–2100 与 lunar-typescript 全量对拍见 daily-core.test.ts）。
 *   - getDailySummary 使用 lunar-typescript 精密历法：
 *     年干支以立春为界、月干支以节气为界（销号 V11-INT-02/03）、
 *     节气名为真实交节而非近似日期表。
 *   - monthJiazi（公历月近似）保留导出并标注 approximate，仅供对拍与兼容。
 * 宜忌：按日干静态映射（公版黄历基础规则）。
 *
 * 迁移自：src/components/content/ganzhi.ts + almanac.ts
 */

import { Solar } from 'lunar-typescript'

// ===================== 常量 =====================

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
export const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const

export type WuXing = '木' | '火' | '土' | '金' | '水'

// ===================== Encoding =====================

/** 六十甲子序号 → 天干索引 (0-9) */
export function jiaziStem(jiazi: number): number { return jiazi % 10 }

/** 六十甲子序号 → 地支索引 (0-11) */
export function jiaziBranch(jiazi: number): number { return jiazi % 12 }

/** stemIdx + branchIdx → 六十甲子序号 */
function makeJiazi(stem: number, branch: number): number {
  for (let i = stem; i < 60; i += 10) {
    if (i % 12 === branch) return i
  }
  return 0
}

/** 六十甲子序号 → "甲子" 格式标签 */
export function ganzhiLabel(idx: number): string {
  return `${STEMS[jiaziStem(idx)]}${BRANCHES[jiaziBranch(idx)]}`
}

// ===================== 节气近似表 =====================

const SOLAR_TERMS: [number, number, string][] = [
  [1, 6, '小寒'], [1, 21, '大寒'], [2, 4, '立春'], [2, 19, '雨水'],
  [3, 6, '惊蛰'], [3, 21, '春分'], [4, 5, '清明'], [4, 20, '谷雨'],
  [5, 6, '立夏'], [5, 21, '小满'], [6, 6, '芒种'], [6, 22, '夏至'],
  [7, 7, '小暑'], [7, 23, '大暑'], [8, 8, '立秋'], [8, 23, '处暑'],
  [9, 8, '白露'], [9, 23, '秋分'], [10, 8, '寒露'], [10, 24, '霜降'],
  [11, 8, '立冬'], [11, 23, '小雪'], [12, 7, '大雪'], [12, 22, '冬至'],
]

// ===================== 年柱 =====================

/** 年柱六十甲子序号：(year - 4) % 60 */
export function yearJiazi(year: number): number {
  return ((year - 4) % 60 + 60) % 60
}

// ===================== 月柱 =====================

/**
 * 月柱六十甲子序号。
 * 月支按公历月（近似，非节气换月 —— approximate），月干用五虎遁。
 * 五虎遁：甲己年丙寅、乙庚年戊寅、丙辛年庚寅、丁壬年壬寅、戊癸年甲寅。
 */
export function monthJiazi(yearStemIdx: number, month: number): number {
  const branchIdx = month === 12 ? 1 : (month + 1) % 12 // 寅=2 for month 1
  const firstStem = ((yearStemIdx % 5) * 2 + 2) % 10
  const stemIdx = (firstStem + month - 1) % 10
  return makeJiazi(stemIdx, branchIdx)
}

// ===================== 日柱 =====================

/** 日柱六十甲子序号。锚点：1900-01-01 = 甲戌 (index 10)。 */
export function dayJiazi(year: number, month: number, day: number): number {
  const anchor = new Date(1900, 0, 1)
  const target = new Date(year, month - 1, day)
  const diffDays = Math.round((target.getTime() - anchor.getTime()) / 86400000)
  return ((diffDays % 60) + 10 + 60) % 60
}

// ===================== 时柱 =====================

/**
 * 时柱六十甲子序号。
 * 地支按钟点，天干用五鼠遁：甲己日甲子、乙庚日丙子、丙辛日戊子、
 * 丁壬日庚子、戊癸日壬子。
 */
export function hourJiazi(dayStemIdx: number, clockHour: number): number {
  const branchIdx = Math.floor(((clockHour + 1) % 24) / 2)
  const firstStem = ((dayStemIdx % 5) * 2) % 10
  const stemIdx = (firstStem + branchIdx) % 10
  return makeJiazi(stemIdx, branchIdx)
}

/** clockHour → 地支索引（不涉日干） */
export function hourBranchOf(clockHour: number): number {
  return Math.floor(((clockHour + 1) % 24) / 2)
}

// ===================== 节气 =====================

/** 当前节气（公历近似；精密版见 getDailySummary / preciseSolarTerm） */
export function currentSolarTerm(date: Date): string {
  const m = date.getMonth() + 1
  const d = date.getDate()
  for (let i = SOLAR_TERMS.length - 1; i >= 0; i--) {
    const [tm, td, name] = SOLAR_TERMS[i]
    if (m > tm || (m === tm && d >= td)) return name
  }
  return SOLAR_TERMS[SOLAR_TERMS.length - 1][2]
}

/** 精密版当前节气名（lunar-typescript 真实交节，INT-03 销号产物） */
export function preciseSolarTerm(date: Date): string {
  return Solar.fromDate(date).getLunar().getPrevJieQi(false).getName()
}

/** 精密版下一节气（真实交节时刻，含精确剩余天数） */
export function preciseNextSolarTerm(date: Date): { name: string; daysTo: number } {
  const lunar = Solar.fromDate(date).getLunar()
  const next = lunar.getNextJieQi(false)
  if (!next) return { name: preciseSolarTerm(date), daysTo: 0 }
  const solar = next.getSolar()
  const nextMs = new Date(
    solar.getYear(), solar.getMonth() - 1, solar.getDay(),
    solar.getHour(), solar.getMinute(), solar.getSecond(),
  ).getTime()
  const daysTo = Math.ceil((nextMs - date.getTime()) / 86400000)
  return { name: next.getName(), daysTo: Math.max(0, daysTo) }
}

/** 某日是否为交节日（当天发生节气交接），返回节气名或 null */
export function solarTermStartsOn(date: Date): string | null {
  const jieQi = Solar.fromDate(date).getLunar().getJieQi() // string：当天节气名或空串
  return jieQi || null
}

// ===================== 宜忌 =====================

const YIJI_BY_DAY_STEM: Record<string, { yi: string[]; ji: string[] }> = {
  '甲': { yi: ['祭祀', '出行', '嫁娶'], ji: ['开仓', '动土'] },
  '乙': { yi: ['入学', '纳采', '交易'], ji: ['穿井', '开渠'] },
  '丙': { yi: ['会友', '修造', '上册'], ji: ['渡水', '行船'] },
  '丁': { yi: ['祭祀', '祈福', '入学'], ji: ['理发', '整手足甲'] },
  '戊': { yi: ['祭祀', '会友', '上册'], ji: ['移徙', '栽种'] },
  '己': { yi: ['祭祀', '嫁娶', '纳采'], ji: ['开生坟', '合寿木'] },
  '庚': { yi: ['出行', '修造', '上册'], ji: ['动土', '开渠'] },
  '辛': { yi: ['祭祀', '会友', '交易'], ji: ['伐木', '栽种'] },
  '壬': { yi: ['出行', '嫁娶', '开市'], ji: ['开渠', '穿井'] },
  '癸': { yi: ['入学', '纳采', '上册'], ji: ['词讼', '开仓'] },
}

export type DayStem = (typeof STEMS)[number]

export function yijiOf(dayStem: DayStem): { yi: string[]; ji: string[] } {
  return YIJI_BY_DAY_STEM[dayStem] ?? { yi: ['祭祀'], ji: ['动土'] }
}

/* ===================== 安寝时令（睡眠方向第一枪） =====================
 * 五行干支 → 传统养生文化提示。依据：中医五行与子午流注为公版通识
 * （《黄帝内经》等公版典籍的思想），干支→五行的映射为历法常识。
 * 全部为文化参考性质，不构成医疗建议。
 */

export interface SleepAdvice {
  /** 今晚主题（如「木日养肝」） */
  theme: string
  /** 安寝提示（文化参考） */
  tip: string
  /** 时辰建议（子午流注公版知识） */
  hourHint: string
}

/** 日干五行 → 安寝主题 */
const SLEEP_BY_STEM: Record<DayStem, SleepAdvice> = {
  甲: { theme: '木日 · 养肝舒达', tip: '传统养生以春木应肝，木日宜早卧，睡前勿郁怒忧思，可缓步放松助气机舒展。', hourHint: '子时（23-1点）胆经当令，宜已入眠；丑时（1-3点）肝经当令，深睡为佳。' },
  乙: { theme: '木日 · 柔肝和眠', tip: '乙木性柔，宜以静养神，睡前少看惊扰内容，温水泡脚引气下行。', hourHint: '子丑时分（23-3点）肝胆当令，宜睡实勿醒。' },
  丙: { theme: '火日 · 静心安神', tip: '丙火性烈，心绪易亢，睡前宜离屏静坐，听舒缓之声收敛心神。', hourHint: '午时（11-13点）心经当令宜小憩；夜睡宁早勿晚。' },
  丁: { theme: '火日 · 养心敛神', tip: '丁火如灯，宜护心阴，睡前勿思虑过度，可闭目数息助入眠。', hourHint: '戌时（19-21点）心包经当令，宜开始放松，亥时前就寝。' },
  戊: { theme: '土日 · 和胃安寝', tip: '戊土厚重，晚餐宜清淡勿过饱，「胃不和则卧不安」为传统通识。', hourHint: '亥时（21-23点）三焦当令，宜已卧床静养。' },
  己: { theme: '土日 · 健脾宁神', tip: '己土性柔喜静，宜饮食有节、思虑有度，睡前轻摩腹助运化。', hourHint: '戌时（19-21点）心包经当令宜渐入安静，勿夜宵。' },
  庚: { theme: '金日 · 清肺助眠', tip: '庚金主肃降，宜卧室空气流通，睡前勿吸烟饮酒，呼吸调匀。', hourHint: '寅时（3-5点）肺经当令，宜睡实；寝前开窗换气片刻。' },
  辛: { theme: '金日 · 润燥宁卧', tip: '辛金喜润，宜室内湿度适宜，睡前温水漱饮，勿食辛辣。', hourHint: '卯时（5-7点）大肠经当令，起卧有时为宜。' },
  壬: { theme: '水日 · 藏精早卧', tip: '壬水主藏，传统以冬水应肾，宜早卧养藏，睡前暖足护腰。', hourHint: '酉时（17-19点）肾经当令，宜舒缓勿过劳，夜间早眠。' },
  癸: { theme: '水日 · 养肾固本', tip: '癸水至柔至静，宜勿熬夜耗精，睡前热水暖足，忌冰饮。', hourHint: '亥时（21-23点）三焦当令宜已入眠，睡足而醒。' },
}

/** 安寝提示（文化参考，非医疗建议） */
export function sleepAdviceOf(dayStem: DayStem): SleepAdvice {
  return SLEEP_BY_STEM[dayStem]
}

// ===================== 时辰吉凶 =====================

export interface HourLuck {
  branchIdx: number
  label: string
  shortTip: string
}

const HOUR_TIPS: string[] = [
  '夜半子时，万物归寂，宜静思、忌外出',
  '鸡鸣丑时，寒气凝结，宜蓄力、忌决策',
  '平旦寅时，曙光初现，宜早起、忌赖床',
  '日出卯时，朝气蓬勃，宜开始、忌拖延',
  '食时辰时，脾胃当令，宜进食、忌空腹劳作',
  '隅中巳时，精力充沛，宜攻坚、忌分心',
  '日中午时，阳气最盛，宜小憩、忌暴晒',
  '日昳未时，渐入午后，宜收尾、忌开新',
  '晡时申时，金气渐盛，宜总结、忌冲动',
  '日入酉时，收工归家，宜陪伴、忌加班',
  '黄昏戌时，心包当令，宜放松、忌忧思',
  '人定亥时，万物归藏，宜安眠、忌熬夜',
]

/** 时辰吉凶（需要日干以正确显示时柱天干） */
export function hourLuck(clockHour: number, dayStemIdx: number): HourLuck {
  const branchIdx = hourBranchOf(clockHour)
  const jiazi = hourJiazi(dayStemIdx, clockHour)
  return {
    branchIdx,
    label: `${ganzhiLabel(jiazi)}时`,
    shortTip: HOUR_TIPS[branchIdx],
  }
}

// ===================== 每日摘要 =====================

export interface DailySummary {
  date: string
  yearGanzhi: string
  monthGanzhi: string
  dayGanzhi: string
  solarTerm: string
  dayStem: DayStem
  dayBranch: string
  yi: string[]
  ji: string[]
  hourLuck: HourLuck[]
}

export interface DailySummaryOptions {
  /** IANA 时区（如 Asia/Shanghai）。缺省用运行环境本地时区 */
  ianaTimezone?: string
}

/** 提取某绝对时刻在指定 IANA 时区的墙钟字段（Intl 实现，无外部依赖） */
export function wallClockFields(utcMs: number, ianaTimezone: string): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} {
  let y = 0, mo = 0, d = 0, h = 0, mi = 0, s = 0
  for (const p of new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(utcMs)) {
    if (p.type === 'year') y = Number(p.value)
    else if (p.type === 'month') mo = Number(p.value)
    else if (p.type === 'day') d = Number(p.value)
    else if (p.type === 'hour') h = Number(p.value) % 24 // hour12:false 仍可能给 24
    else if (p.type === 'minute') mi = Number(p.value)
    else if (p.type === 'second') s = Number(p.value)
  }
  return { year: y, month: mo, day: d, hour: h, minute: mi, second: s }
}

export function getDailySummary(date?: Date, opts?: DailySummaryOptions): DailySummary {
  const d = date ?? new Date()
  const tz = opts?.ianaTimezone
  // 精密历法源：lunar-typescript（销号 V11-INT-02/03）。
  // 关键事实：lunar 的节气表固定按北京时间(+8)生成，年柱/月柱/节气判定
  // 用「运行环境本地墙钟 vs 表墙钟」比较——非 +8 环境会错位（实测 UTC 下
  // 立春后 1.5h 仍判乙巳年）。修复：统一把绝对时刻换算为北京时间墙钟喂入。
  const bj = wallClockFields(d.getTime(), 'Asia/Shanghai')
  const eff = new Date(bj.year, bj.month - 1, bj.day, bj.hour, bj.minute, bj.second)
  const lunar = Solar.fromDate(eff).getLunar()
  // Exact 版：交节时刻精确换界（ByLiChun/getMonthInGanZhi 整日粒度会在
  // 立春/节气当日 00:00 提前换柱，Kimi 金标 04:01→乙巳己丑 / 04:03→丙午庚寅
  // 要求精确到分钟，故用 Exact 系列）。
  // 年柱/月柱/节气：交节是天文绝对时刻，与观看时区无关——直接用原绝对时刻。
  const yearGanzhiStr = lunar.getYearInGanZhiExact() // 立春交节时刻界年干支
  const monthGanzhiStr = lunar.getMonthInGanZhiExact() // 节气交节时刻界月干支
  const prevJieQi = lunar.getPrevJieQi(false) // 上一个节或气（真实交节）

  // INT-04：日柱与 date 字段按目标时区的墙钟日历日。
  // 干支日的本质：自锚点（1900-01-01 甲戌）起每个日历日进一位，
  // 只依赖日历日标签，与运行环境时区无关——直接把目标日历日喂给
  // Solar.fromYmd（其内部用本地时区解读，日历日标签自洽）。
  let y: number, m: number, day: number, dayGanzhiStr: string
  if (tz) {
    const w = wallClockFields(d.getTime(), tz)
    y = w.year
    m = w.month
    day = w.day
    dayGanzhiStr = Solar.fromYmd(y, m, day).getLunar().getDayInGanZhi()
  } else {
    y = d.getFullYear()
    m = d.getMonth() + 1
    day = d.getDate()
    dayGanzhiStr = lunar.getDayInGanZhi()
  }

  const dayStem = dayGanzhiStr[0] as DayStem
  const dayBranch = dayGanzhiStr[1]
  const dayStemIdx = STEMS.indexOf(dayStem)
  const yj = yijiOf(dayStem)

  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    yearGanzhi: yearGanzhiStr,
    monthGanzhi: monthGanzhiStr,
    dayGanzhi: dayGanzhiStr,
    solarTerm: prevJieQi.getName(),
    dayStem,
    dayBranch,
    yi: yj.yi,
    ji: yj.ji,
    hourLuck: Array.from({ length: 24 }, (_, h) => hourLuck(h, dayStemIdx)),
  }
}
