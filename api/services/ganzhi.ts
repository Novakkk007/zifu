/**
 * 干支工具（真实简化算法，见 design.md §8 / bazi.md S3）
 * - 年柱：(year - 4) % 60 查六十甲子（演示简化为按公历年，立春前不归上一年）
 * - 月柱：节气近似（每月 6 日前后换月）+ 五虎遁年起月
 * - 日柱：1900-01-01 为甲戌日，按天数差 % 60 累推
 * - 时柱：日干五鼠遁配时辰地支
 * - 十神 / 藏干 / 纳音 / 星运：查表内嵌
 */

export type Wuxing = '金' | '木' | '水' | '火' | '土'

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

/** 六十甲子表（0 = 甲子） */
export const JIAZI: string[] = Array.from(
  { length: 60 },
  (_, i) => `${STEMS[i % 10]}${BRANCHES[i % 12]}`,
)

export const STEM_WUXING: Wuxing[] = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
export const BRANCH_WUXING: Wuxing[] = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']

/** 五行配色（bazi.md S3 指定） */
export const WUXING_COLORS: Record<Wuxing, string> = {
  金: '#B8860B',
  木: '#3E7C4F',
  水: '#3A6EA5',
  火: '#B04A3A',
  土: '#8A6D3B',
}

export const WUXING_LIST: Wuxing[] = ['金', '木', '水', '火', '土']

/** 六十甲子纳音（每两项一纳音） */
const NAYIN = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金',
  '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水',
  '沙中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
  '大溪水', '沙中土', '天上火', '石榴木', '大海水',
]

/** 地支藏干表（本气在前） */
export const HIDDEN_STEMS: string[][] = [
  ['癸'], ['己', '癸', '辛'], ['甲', '丙', '戊'], ['乙'],
  ['戊', '乙', '癸'], ['丙', '庚', '戊'], ['丁', '己'], ['己', '丁', '乙'],
  ['庚', '壬', '戊'], ['辛'], ['戊', '辛', '丁'], ['壬', '甲'],
]

/** 十二长生（星运） */
const STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

/** 各天干长生所在支（阳干顺行，演示统一顺行取象） */
const CHANGSHENG_BRANCH = [11, 6, 2, 9, 2, 9, 4, 0, 7, 3] // 甲亥 乙午 丙戊寅 丁己酉 庚巳 辛子 壬申 癸卯

/** 五行生克：生[next]，克[skip 2]（木→火→土→金→水→木） */
const SHENG: Record<Wuxing, Wuxing> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const KE: Record<Wuxing, Wuxing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

/** 十神判定：以日主为体，看目标天干 */
export function tenGod(dayStemIdx: number, targetStemIdx: number): string {
  const me = STEM_WUXING[dayStemIdx]
  const other = STEM_WUXING[targetStemIdx]
  const sameYY = dayStemIdx % 2 === targetStemIdx % 2
  if (other === me) return sameYY ? '比肩' : '劫财'
  if (SHENG[me] === other) return sameYY ? '食神' : '伤官'
  if (KE[me] === other) return sameYY ? '偏财' : '正财'
  if (KE[other] === me) return sameYY ? '七杀' : '正官'
  return sameYY ? '偏印' : '正印'
}

/** 两五行关系（合盘 mock 规则） */
export function wuxingRelation(a: Wuxing, b: Wuxing): '比和' | '相生' | '相制' {
  if (a === b) return '比和'
  if (SHENG[a] === b || SHENG[b] === a) return '相生'
  return '相制'
}

export interface PillarInfo {
  /** 如「甲戌」 */
  ganzhi: string
  stem: string
  branch: string
  stemIdx: number
  branchIdx: number
  jiaziIdx: number
  stemWuxing: Wuxing
  branchWuxing: Wuxing
  nayin: string
  hiddenStems: string[]
  /** 星运（十二长生，mock 简化顺行） */
  stage: string
  /** 天干十神（相对日主）；日主自身为「日主」 */
  stemGod: string
  /** 地支本气十神 */
  branchGod: string
}

export interface DayunStep {
  startAge: number
  ganzhi: string
  stemGod: string
  isCurrent: boolean
}

export interface BaziChart {
  yearP: PillarInfo
  monthP: PillarInfo
  dayP: PillarInfo
  hourP: PillarInfo | null
  dayMaster: string
  dayMasterWuxing: Wuxing
  /** 五行统计：每干支柱 = 1，藏干各 0.5 */
  wuxingCount: Record<Wuxing, number>
  missing: Wuxing[]
  startAge: number
  dayun: DayunStep[]
  forward: boolean
}

function buildPillar(jiaziIdx: number, dayStemIdx: number, isDayPillar = false): PillarInfo {
  const idx = ((jiaziIdx % 60) + 60) % 60
  const stemIdx = idx % 10
  const branchIdx = idx % 12
  const stageIdx = (((branchIdx - CHANGSHENG_BRANCH[dayStemIdx]) % 12) + 12) % 12
  return {
    ganzhi: JIAZI[idx],
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    stemIdx,
    branchIdx,
    jiaziIdx: idx,
    stemWuxing: STEM_WUXING[stemIdx],
    branchWuxing: BRANCH_WUXING[branchIdx],
    nayin: NAYIN[Math.floor(idx / 2)],
    hiddenStems: HIDDEN_STEMS[branchIdx],
    stage: STAGES[stageIdx],
    stemGod: isDayPillar ? '日主' : tenGod(dayStemIdx, stemIdx),
    branchGod: tenGod(dayStemIdx, STEMS.indexOf(HIDDEN_STEMS[branchIdx][0] as (typeof STEMS)[number])),
  }
}

const DAY_MS = 24 * 60 * 60 * 1000
/** 1900-01-01 = 甲戌日（六十甲子序号 10） */
const ANCHOR = Date.UTC(1900, 0, 1)
const ANCHOR_JIAZI = 10

/** 五虎遁：年上起月，寅月天干 */
const HUTU_START = [2, 4, 6, 8, 0] // 甲己丙寅 / 乙庚戊寅 / 丙辛庚寅 / 丁壬壬寅 / 戊癸甲寅
/** 五鼠遁：日上起时，子时天干 */
const SHUTU_START = [0, 2, 4, 6, 8] // 甲己甲子 / 乙庚丙子 / 丙辛戊子 / 丁壬庚子 / 戊癸壬子

/** 时辰选项（含钟点） */
export const SHICHEN_OPTIONS = BRANCHES.map((b, i) => {
  const start = (23 + i * 2) % 24
  const end = (start + 2) % 24
  const fmt = (h: number) => String(h).padStart(2, '0')
  return { value: i, label: `${b}时 ${fmt(start)}–${fmt(end)}` }
})

export interface BirthInput {
  year: number
  month: number // 1-12
  day: number // 1-31
  /** 时辰地支序号 0-11；null = 时辰不详 */
  hourBranch: number | null
  gender: 'male' | 'female'
}

export function computeChart({ year, month, day, hourBranch, gender }: BirthInput): BaziChart {
  /* ---- 日柱（先算，十神以日干为体） ---- */
  const days = Math.floor((Date.UTC(year, month - 1, day) - ANCHOR) / DAY_MS)
  const dayJiazi = (((ANCHOR_JIAZI + days) % 60) + 60) % 60
  const dayStemIdx = dayJiazi % 10

  /* ---- 年柱 ---- */
  const yearJiazi = (((year - 4) % 60) + 60) % 60

  /* ---- 月柱：节气近似（每月 6 日前换月）+ 五虎遁 ---- */
  let effMonth = month
  if (day < 6) effMonth -= 1
  if (effMonth < 1) effMonth = 12
  // 节令月支：寅月起于二月（em=2→寅），子=0 编号下 branch = em % 12
  const monthBranchIdx = effMonth % 12 === 0 ? 0 : effMonth % 12
  const yinOffset = (((monthBranchIdx - 2) % 12) + 12) % 12 // 距寅月序数
  const monthStemIdx = (HUTU_START[(yearJiazi % 10) % 5] + yinOffset) % 10
  const monthJiazi = findJiazi(monthStemIdx, monthBranchIdx)

  /* ---- 时柱：五鼠遁 ---- */
  let hourJiazi: number | null = null
  if (hourBranch !== null) {
    const hourStemIdx = (SHUTU_START[dayStemIdx % 5] + hourBranch) % 10
    hourJiazi = findJiazi(hourStemIdx, hourBranch)
  }

  const yearP = buildPillar(yearJiazi, dayStemIdx)
  const monthP = buildPillar(monthJiazi, dayStemIdx)
  const dayP = buildPillar(dayJiazi, dayStemIdx, true)
  const hourP = hourJiazi !== null ? buildPillar(hourJiazi, dayStemIdx) : null

  /* ---- 五行统计 ---- */
  const count: Record<Wuxing, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }
  for (const p of [yearP, monthP, dayP, hourP]) {
    if (!p) continue
    count[p.stemWuxing] += 1
    count[p.branchWuxing] += 1
    for (const h of p.hiddenStems) {
      count[STEM_WUXING[STEMS.indexOf(h as (typeof STEMS)[number])]] += 0.5
    }
  }
  const missing = WUXING_LIST.filter((w) => count[w] === 0)

  /* ---- 大运（mock 8 步）：阳男阴女顺行，反之逆行；起运 = (月+日) % 9 + 1 ---- */
  const yangYear = yearJiazi % 2 === 0
  const forward = (yangYear && gender === 'male') || (!yangYear && gender === 'female')
  const dir = forward ? 1 : -1
  const startAge = ((month + day) % 9) + 1
  const currentAge = Math.max(0, new Date().getFullYear() - year)
  const dayun: DayunStep[] = Array.from({ length: 8 }, (_, i) => {
    const jz = (((monthP.jiaziIdx + dir * (i + 1)) % 60) + 60) % 60
    const age = startAge + i * 10
    return {
      startAge: age,
      ganzhi: JIAZI[jz],
      stemGod: tenGod(dayStemIdx, jz % 10),
      isCurrent: currentAge >= age && currentAge < age + 10,
    }
  })

  return {
    yearP,
    monthP,
    dayP,
    hourP,
    dayMaster: dayP.stem,
    dayMasterWuxing: dayP.stemWuxing,
    wuxingCount: count,
    missing,
    startAge,
    dayun,
    forward,
  }
}

/** 由天干/地支序号求六十甲子序号（同奇偶才有解） */
function findJiazi(stemIdx: number, branchIdx: number): number {
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) return i
  }
  return 0
}

/** 确定性哈希（合盘 mock：同生日结果稳定） */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 伪随机（确定性） */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
