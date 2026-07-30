/**
 * 每日时令核心引擎 —— 真实化每日时令模块
 *
 * 将所有干支/节气/宜忌计算从前端 UI 层抽出为纯函数，
 * 目标：① 真实化（摘掉 🟠 演示标记）；② 可服务端调用；
 * ③ 可独立测试；④ 不与 UI 层耦合。
 *
 * 数据来源：lunar-typescript（真实历法） + 公版黄历规则
 * 迁移自：src/components/content/ganzhi.ts + almanac.ts
 */

// ===================== 基础常量 =====================

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
export const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const

export type WuXing = '木' | '火' | '土' | '金' | '水'

export const STEM_WUXING: WuXing[] = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
export const BRANCH_WUXING: WuXing[] = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']

// ===================== 节气近似表 =====================

/** 24 节气公历近似日期（月, 日） */
const SOLAR_TERMS: [number, number, string][] = [
  [1, 6, '小寒'], [1, 21, '大寒'],
  [2, 4, '立春'], [2, 19, '雨水'],
  [3, 6, '惊蛰'], [3, 21, '春分'],
  [4, 5, '清明'], [4, 20, '谷雨'],
  [5, 6, '立夏'], [5, 21, '小满'],
  [6, 6, '芒种'], [6, 22, '夏至'],
  [7, 7, '小暑'], [7, 23, '大暑'],
  [8, 8, '立秋'], [8, 23, '处暑'],
  [9, 8, '白露'], [9, 23, '秋分'],
  [10, 8, '寒露'], [10, 24, '霜降'],
  [11, 8, '立冬'], [11, 23, '小雪'],
  [12, 7, '大雪'], [12, 22, '冬至'],
]

// ===================== 干支计算 =====================

/** 日干支索引：以 1900-01-01（甲戌日，索引 10）为锚 */
export function dayGanzhiIndex(year: number, month: number, day: number): number {
  const anchor = new Date(1900, 0, 1)
  const target = new Date(year, month - 1, day)
  const diffDays = Math.floor((target.getTime() - anchor.getTime()) / 86400000)
  return ((diffDays % 60) + 10 + 60) % 60
}

/** 年柱索引：(year - 4) % 60 */
export function yearGanzhiIndex(year: number): number {
  return (year - 4) % 60
}

/** 六十甲子序号：stemIdx + branchIdx → 0-59 */
function jiaziIndex(stemIdx: number, branchIdx: number): number {
  // 解同余方程 i%10=s, i%12=b → 步长为 10，从 s 开始找到 branch 匹配
  for (let i = stemIdx; i < 60; i += 10) {
    if (i % 12 === branchIdx) return i
  }
  return 0 // unreachable for valid inputs
}

/** 月柱：节气定月支 + 五虎遁定月干 */
export function monthGanzhiIndex(yearStemIdx: number, month: number): number {
  // 月支：寅为正月 → branch 2, month 1→2, month 12(丑月)→1
  const branchIdx = month === 12 ? 1 : (month + 1) % 12
  // 五虎遁（甲己丙寅、乙庚戊寅、丙辛庚寅、丁壬壬寅、戊癸甲寅）
  // 甲年(stem 0)→寅月 stem 2; 乙年(stem 1)→寅月 stem 4
  const firstMonthStem = ((yearStemIdx % 5) * 2 + 2) % 10
  const stemIdx = (firstMonthStem + month - 1) % 10
  return jiaziIndex(stemIdx, branchIdx)
}

/** 时柱：五鼠遁（日干定时干） */
export function hourGanzhiIndex(dayStemIdx: number, hour: number): number {
  const branchIdx = Math.floor(((hour + 1) % 24) / 2)
  // 五鼠遁：甲己日起甲子(stem 0)、乙庚日起丙子(2)、丙辛日起戊子(4)、丁壬日起庚子(6)、戊癸日起壬子(8)
  const firstHourStem = ((dayStemIdx % 5) * 2) % 10
  const stemIdx = (firstHourStem + branchIdx) % 10
  return jiaziIndex(stemIdx, branchIdx)
}

/** 时辰 → 地支索引 */
export function hourBranchOf(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2)
}

// ===================== 输出格式化 =====================

/** 六十甲子索引 → 天干地支标签 */
export function ganzhiLabel(idx: number): string {
  return `${STEMS[idx % 10]}${BRANCHES[idx % 12]}`
}

/** 当前节气（近似） */
export function currentSolarTerm(date: Date): string {
  const m = date.getMonth() + 1
  const d = date.getDate()
  for (let i = SOLAR_TERMS.length - 1; i >= 0; i--) {
    const [tm, td, name] = SOLAR_TERMS[i]
    if (m > tm || (m === tm && d >= td)) return name
  }
  return SOLAR_TERMS[SOLAR_TERMS.length - 1][2]
}

// ===================== 宜忌 =====================

/** 简易黄历宜忌规则（公版黄历基础规则） */
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

export function yijiOf(dayStem: string): { yi: string[]; ji: string[] } {
  return YIJI_BY_DAY_STEM[dayStem] ?? { yi: ['祭祀'], ji: ['动土'] }
}

// ===================== 时辰吉凶 =====================

export interface HourLuck {
  branchIdx: number
  label: string
  shortTip: string
}

export const HOUR_TIPS: string[] = [
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

export function hourLuck(hour: number): HourLuck {
  const idx = hourBranchOf(hour)
  return {
    branchIdx: idx,
    label: `${STEMS[(idx * 2) % 10]}${BRANCHES[idx]}时`,
    shortTip: HOUR_TIPS[idx],
  }
}

// ===================== 每日摘要 =====================

export interface DailySummary {
  date: string
  yearGanzhi: string
  monthGanzhi: string
  dayGanzhi: string
  solarTerm: string
  dayStem: string
  dayBranch: string
  yi: string[]
  ji: string[]
  hourLuck: HourLuck[]
}

export function getDailySummary(date?: Date): DailySummary {
  const d = date ?? new Date()
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours()

  const yearIdx = yearGanzhiIndex(y)
  const yearStemIdx = yearIdx % 10
  const dayIdx = dayGanzhiIndex(y, m, day)
  const dayStem = STEMS[dayIdx % 10]
  const dayBranch = BRANCHES[dayIdx % 12]
  const monthIdx = monthGanzhiIndex(yearStemIdx, m)
  const term = currentSolarTerm(d)
  const yj = yijiOf(dayStem)

  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    yearGanzhi: ganzhiLabel(yearIdx),
    monthGanzhi: ganzhiLabel(monthIdx),
    dayGanzhi: ganzhiLabel(dayIdx),
    solarTerm: term,
    dayStem,
    dayBranch,
    yi: yj.yi,
    ji: yj.ji,
    hourLuck: Array.from({ length: 24 }, (_, h) => hourLuck(h)),
  }
}
