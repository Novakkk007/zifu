/**
 * 干支 / 节气 / 五行工具（每日时令 · 百宝袋共用，本模块自有实现）
 *
 * - 年柱：(year - 4) % 60（甲子起）
 * - 日柱：以 1900-01-01（甲戌日）为锚，逐日累加
 * - 月柱：节气近似表定月支 + 五虎遁定月干
 * - 时柱：五鼠遁
 * - 节气：24 节气公历近似日期表
 */

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
export const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const

export type WuXing = '木' | '火' | '土' | '金' | '水'
export const WUXING_ORDER: WuXing[] = ['木', '火', '土', '金', '水']

/** 天干五行：甲乙木 丙丁火 戊己土 庚辛金 壬癸水 */
export const STEM_WUXING: WuXing[] = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
/** 地支五行：亥子水 寅卯木 巳午火 申酉金 辰戌丑未土 */
export const BRANCH_WUXING: WuXing[] = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']

/** 五行对应传统色名 */
export const WUXING_COLOR: Record<WuXing, string> = {
  木: '青碧',
  火: '朱赤',
  土: '鹅黄',
  金: '素白',
  水: '玄青',
}
/** 五行色块（展示用近似色值） */
export const WUXING_SWATCH: Record<WuXing, string> = {
  木: '#4E7A5A',
  火: '#A8433C',
  土: '#C9A24B',
  金: '#D8D4C8',
  水: '#2E3A4A',
}

/** 二十八宿（角起东方） */
export const LODGES = [
  '角', '亢', '氐', '房', '心', '尾', '箕',
  '斗', '牛', '女', '虚', '危', '室', '壁',
  '奎', '娄', '胃', '昴', '毕', '觜', '参',
  '井', '鬼', '柳', '星', '张', '翼', '轸',
] as const

const DAY_MS = 86_400_000

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

/** 与 1900-01-01（甲戌日）的整日差 */
export function daysSinceAnchor(y: number, m: number, d: number) {
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / DAY_MS)
}

/** 日柱干支索引（0–59），甲戌 = 10 */
export function dayGanzhiIndex(y: number, m: number, d: number) {
  return mod(10 + daysSinceAnchor(y, m, d), 60)
}

/** 年柱干支索引（0–59），(year-4)%60，甲子 = 0 */
export function yearGanzhiIndex(year: number) {
  return mod(year - 4, 60)
}

export function ganzhiOf(index: number) {
  return { stem: STEMS[index % 10], branch: BRANCHES[index % 12], index }
}

export function ganzhiLabel(index: number) {
  return `${STEMS[index % 10]}${BRANCHES[index % 12]}`
}

/* ---------------- 节气近似表 ---------------- */

export type SolarTerm = { name: string; month: number; day: number }

/** 24 节气公历近似日期（按年内顺序） */
export const SOLAR_TERMS: SolarTerm[] = [
  { name: '小寒', month: 1, day: 5 },
  { name: '大寒', month: 1, day: 20 },
  { name: '立春', month: 2, day: 4 },
  { name: '雨水', month: 2, day: 19 },
  { name: '惊蛰', month: 3, day: 6 },
  { name: '春分', month: 3, day: 21 },
  { name: '清明', month: 4, day: 5 },
  { name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 6 },
  { name: '小满', month: 5, day: 21 },
  { name: '芒种', month: 6, day: 6 },
  { name: '夏至', month: 6, day: 21 },
  { name: '小暑', month: 7, day: 7 },
  { name: '大暑', month: 7, day: 23 },
  { name: '立秋', month: 8, day: 8 },
  { name: '处暑', month: 8, day: 23 },
  { name: '白露', month: 9, day: 8 },
  { name: '秋分', month: 9, day: 23 },
  { name: '寒露', month: 10, day: 8 },
  { name: '霜降', month: 10, day: 23 },
  { name: '立冬', month: 11, day: 8 },
  { name: '小雪', month: 11, day: 22 },
  { name: '大雪', month: 12, day: 7 },
  { name: '冬至', month: 12, day: 22 },
]

/** 12 「节」（月建之交）：立春起寅月 …… 小寒起丑月 */
const JIE_TERMS: { name: string; month: number; day: number; branch: number }[] = [
  { name: '小寒', month: 1, day: 5, branch: 1 },
  { name: '立春', month: 2, day: 4, branch: 2 },
  { name: '惊蛰', month: 3, day: 6, branch: 3 },
  { name: '清明', month: 4, day: 5, branch: 4 },
  { name: '立夏', month: 5, day: 6, branch: 5 },
  { name: '芒种', month: 6, day: 6, branch: 6 },
  { name: '小暑', month: 7, day: 7, branch: 7 },
  { name: '立秋', month: 8, day: 8, branch: 8 },
  { name: '白露', month: 9, day: 8, branch: 9 },
  { name: '寒露', month: 10, day: 8, branch: 10 },
  { name: '立冬', month: 11, day: 8, branch: 11 },
  { name: '大雪', month: 12, day: 7, branch: 0 },
]

/** 当前节气 + 距下一节气天数（近似） */
export function currentSolarTerm(now: Date): { term: SolarTerm; next: SolarTerm; daysToNext: number } {
  const y = now.getFullYear()
  const todayUtc = Date.UTC(y, now.getMonth(), now.getDate())
  // 覆盖上一年冬至，保证 1 月初也有「当前节气」
  const points = [
    { name: '冬至', month: 12, day: 22, year: y - 1 },
    ...SOLAR_TERMS.map((t) => ({ ...t, year: y })),
    { name: '小寒', month: 1, day: 5, year: y + 1 },
  ]
  let idx = 0
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    if (Date.UTC(p.year, p.month - 1, p.day) <= todayUtc) idx = i
  }
  const cur = points[idx]
  const nxt = points[idx + 1]
  const daysToNext = Math.round(
    (Date.UTC(nxt.year, nxt.month - 1, nxt.day) - todayUtc) / DAY_MS,
  )
  return {
    term: { name: cur.name, month: cur.month, day: cur.day },
    next: { name: nxt.name, month: nxt.month, day: nxt.day },
    daysToNext,
  }
}

/** 某月某日的节气名（用于月历角标，近似表） */
export function solarTermOn(month: number, day: number): string | null {
  const hit = SOLAR_TERMS.find((t) => t.month === month && t.day === day)
  return hit ? hit.name : null
}

/** 月柱：节气定月支 + 五虎遁定月干 */
export function monthPillar(y: number, m: number, d: number) {
  const dateUtc = Date.UTC(y, m - 1, d)
  let branch = 0 // 上一年大雪 → 子月
  for (const j of JIE_TERMS) {
    if (Date.UTC(y, j.month - 1, j.day) <= dateUtc) branch = j.branch
  }
  const yearStem = yearGanzhiIndex(y) % 10
  // 五虎遁：甲己之年丙作首，乙庚戊寅，丙辛庚寅，丁壬壬寅，戊癸甲寅
  const firstStem = [2, 4, 6, 8, 0][yearStem % 5]
  const monthStem = mod(firstStem + mod(branch - 2, 12), 10)
  return { stem: STEMS[monthStem], branch: BRANCHES[branch], label: `${STEMS[monthStem]}${BRANCHES[branch]}` }
}

/** 时柱：五鼠遁（hourBranch 0=子 … 11=亥） */
export function hourPillar(dayGzIndex: number, hourBranch: number) {
  const dayStem = dayGzIndex % 10
  // 甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸壬子
  const ziStem = [0, 2, 4, 6, 8][dayStem % 5]
  const stem = mod(ziStem + hourBranch, 10)
  return { stem: STEMS[stem], branch: BRANCHES[hourBranch], label: `${STEMS[stem]}${BRANCHES[hourBranch]}` }
}

/** 由小时数（0–23）求时支索引（23:00–01:00 为子时） */
export function hourBranchOf(hour: number) {
  return Math.floor(mod(hour + 1, 24) / 2)
}

/** 时辰钟点区间文案 */
export const HOUR_RANGES = [
  '23:00–01:00', '01:00–03:00', '03:00–05:00', '05:00–07:00',
  '07:00–09:00', '09:00–11:00', '11:00–13:00', '13:00–15:00',
  '15:00–17:00', '17:00–19:00', '19:00–21:00', '21:00–23:00',
] as const

/* ---------------- 五行生克 ---------------- */

/** 相生：木→火→土→金→水→木 */
export function generates(a: WuXing): WuXing {
  return WUXING_ORDER[(WUXING_ORDER.indexOf(a) + 1) % 5]
}
/** 生我者 */
export function generatedBy(a: WuXing): WuXing {
  return WUXING_ORDER[mod(WUXING_ORDER.indexOf(a) - 1, 5)]
}
/** 相克：木→土→水→火→金→木 */
export function controls(a: WuXing): WuXing {
  return WUXING_ORDER[(WUXING_ORDER.indexOf(a) + 2) % 5]
}
/** 克我者 */
export function controlledBy(a: WuXing): WuXing {
  return WUXING_ORDER[mod(WUXING_ORDER.indexOf(a) - 2, 5)]
}

/* ---------------- 地支关系（时辰吉凶用） ---------------- */

const LIU_HE: [number, number][] = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]]
const SAN_HE: [number, number][] = [[8, 0], [0, 4], [4, 8], [5, 9], [9, 1], [1, 5], [2, 6], [6, 10], [10, 2], [11, 3], [3, 7], [7, 11]]
const LIU_HAI: [number, number][] = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]]

function pairHit(pairs: [number, number][], a: number, b: number) {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

export type HourLuck = '吉' | '平' | '凶'

/** 时辰吉凶：与日支六合 / 三合 → 吉；相冲 / 相害 → 凶；余为平（确定性） */
export function hourLuck(dayGzIndex: number, hourBranch: number): HourLuck {
  const dayBranch = dayGzIndex % 12
  if (mod(dayBranch - hourBranch, 12) === 6) return '凶' // 六冲
  if (pairHit(LIU_HAI, dayBranch, hourBranch)) return '凶'
  if (pairHit(LIU_HE, dayBranch, hourBranch)) return '吉'
  if (pairHit(SAN_HE, dayBranch, hourBranch)) return '吉'
  return '平'
}

/** 值日星宿（确定性循环，近似锚定） */
export function lodgeOf(y: number, m: number, d: number) {
  return LODGES[mod(daysSinceAnchor(y, m, d), 28)]
}
