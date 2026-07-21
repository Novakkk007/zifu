/**
 * 大六壬 mock 起课：月将加时成天地盘，四课三传依简化贼克法，
 * 十二天将依贵人诀顺逆布。以时间哈希确定性生成，同一时刻 → 同一课。
 */
import {
  BRANCH_WUXING,
  BRANCHES,
  KE,
  SHENG,
  STEM_WUXING,
  STEMS,
  dayPillar,
  hashSeed,
  hourBranchOf,
  hourStemOf,
  rng,
  type Wuxing,
} from '@/components/sanshi/astro'

/** 月将名（太阳过宫） */
export const YUEJIANG_NAME: Record<number, string> = {
  11: '登明', 10: '河魁', 9: '从魁', 8: '传送', 7: '小吉', 6: '胜光',
  5: '太乙', 4: '天罡', 3: '太冲', 2: '功曹', 1: '大吉', 0: '神后',
}

/** 中气换将边界（月,日)→月将支 */
const JIANG_BOUNDS: [number, number, number][] = [
  [1, 20, 0],  // 大寒 → 子将神后
  [2, 19, 11], // 雨水 → 亥将登明
  [3, 21, 10], // 春分 → 戌将河魁
  [4, 20, 9],  // 谷雨 → 酉将从魁
  [5, 21, 8],  // 小满 → 申将传送
  [6, 21, 7],  // 夏至 → 未将小吉
  [7, 23, 6],  // 大暑 → 午将胜光
  [8, 23, 5],  // 处暑 → 巳将太乙
  [9, 23, 4],  // 秋分 → 辰将天罡
  [10, 23, 3], // 霜降 → 卯将太冲
  [11, 22, 2], // 小雪 → 寅将功曹
  [12, 22, 1], // 冬至 → 丑将大吉
]

/** 十二天将（序） */
export const GENERALS = [
  '贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙',
  '天空', '白虎', '太常', '玄武', '太阴', '天后',
] as const

/** 天将单字（盘上标注） */
export const GENERAL_SHORT = ['贵', '螣', '朱', '合', '勾', '龙', '空', '虎', '常', '玄', '阴', '后'] as const

/** 日干寄宫 */
const STEM_PALACE = [2, 4, 5, 7, 5, 7, 8, 10, 11, 1]

export type Lesson = {
  /** 上神（天盘支序） */
  shang: number
  /** 下神标签（第一课为日干） */
  xiaLabel: string
}

export type Chuan = {
  branch: number
  gz: string
  general: string
  liuqin: string
}

export type LiuRenKe = {
  dayGZ: string
  dayStem: number
  dayBranch: number
  hourGZ: string
  yuejiangBranch: number
  yuejiangName: string
  /** 天盘支（按地盘位 0–11） */
  heaven: number[]
  /** 天将序（按地盘位 0–11） */
  generals: number[]
  lessons: Lesson[]
  chuan: Chuan[]
}

export type LiuRenInput = {
  year: number
  month: number
  day: number
  hourBranch: number
  question: string
}

function liuqinOf(dayStemWx: Wuxing, branch: number): string {
  const wx = BRANCH_WUXING[branch]
  if (wx === dayStemWx) return '兄弟'
  if (SHENG[wx] === dayStemWx) return '父母'
  if (SHENG[dayStemWx] === wx) return '子孙'
  if (KE[wx] === dayStemWx) return '官鬼'
  return '妻财'
}

export function genDaliuren(input: LiuRenInput): LiuRenKe {
  const { year, month, day, hourBranch, question } = input
  const seed = hashSeed(`daliuren|${year}|${month}|${day}|${hourBranch}|${question}`)
  const rand = rng(seed)

  const dp = dayPillar(year, month, day)
  const hourStem = hourStemOf(dp.stem, hourBranch)
  const hourGZ = `${STEMS[hourStem]}${BRANCHES[hourBranch]}`

  // 月将：中气换将（年内最后一条不晚于当日的边界；否则上年冬至丑将）
  let yuejiangBranch = 1
  for (const [m, d, b] of JIANG_BOUNDS) {
    if (month > m || (month === m && day >= d)) yuejiangBranch = b
  }

  // 天盘：月将加于地盘时支之位
  const heaven: number[] = Array.from({ length: 12 }, (_, e) => {
    return (((yuejiangBranch + e - hourBranch) % 12) + 12) % 12
  })

  // 贵人：昼夜分阴阳（昼 06–18 时）
  const hour24 = (hourBranch * 2 + 23) % 24 // 时辰起始小时
  const isDay = hour24 >= 6 && hour24 < 18
  const ds = dp.stem
  let guiPos: number
  if (ds === 0 || ds === 4 || ds === 6) guiPos = isDay ? 1 : 7 // 甲戊庚牛羊
  else if (ds === 1 || ds === 5) guiPos = isDay ? 0 : 8 // 乙己鼠猴
  else if (ds === 2 || ds === 3) guiPos = isDay ? 11 : 9 // 丙丁猪鸡
  else if (ds === 8 || ds === 9) guiPos = isDay ? 5 : 3 // 壬癸蛇兔
  else guiPos = isDay ? 6 : 2 // 辛逢马虎

  // 顺逆：贵人临地盘亥至辰顺布，临巳至戌逆布
  const shun = guiPos >= 11 || guiPos <= 4
  const generals: number[] = Array.from({ length: 12 }, (_, e) => {
    const off = shun ? ((e - guiPos + 12) % 12) : ((guiPos - e + 12) % 12)
    return off
  })

  // 四课
  const palace = STEM_PALACE[ds]
  const ke1Shang = heaven[palace]
  const ke3Shang = heaven[dp.branch]
  const lessons: Lesson[] = [
    { shang: ke1Shang, xiaLabel: STEMS[ds] },
    { shang: heaven[ke1Shang], xiaLabel: BRANCHES[ke1Shang] },
    { shang: ke3Shang, xiaLabel: BRANCHES[dp.branch] },
    { shang: heaven[ke3Shang], xiaLabel: BRANCHES[ke3Shang] },
  ]

  // 三传：贼克法（取下贼上，无上克下，皆无则以种子定一课上神）
  const dayWx = STEM_WUXING[ds]
  let chu: number | null = null
  const lowers: Wuxing[] = [dayWx, BRANCH_WUXING[ke1Shang], BRANCH_WUXING[dp.branch], BRANCH_WUXING[ke3Shang]]
  for (let i = 0; i < 4; i++) {
    if (KE[lowers[i]] === BRANCH_WUXING[lessons[i].shang]) {
      chu = lessons[i].shang
      break
    }
  }
  if (chu === null) {
    for (let i = 0; i < 4; i++) {
      if (KE[BRANCH_WUXING[lessons[i].shang]] === lowers[i]) {
        chu = lessons[i].shang
        break
      }
    }
  }
  if (chu === null) chu = lessons[Math.floor(rand() * 4)].shang

  const zhong = heaven[chu]
  const mo = heaven[zhong]
  const mkChuan = (branch: number): Chuan => {
    const stem = (((ds + branch - dp.branch) % 10) + 10) % 10
    return {
      branch,
      gz: `${STEMS[stem]}${BRANCHES[branch]}`,
      general: GENERALS[generals[branch]],
      liuqin: liuqinOf(dayWx, branch),
    }
  }

  return {
    dayGZ: dp.label,
    dayStem: ds,
    dayBranch: dp.branch,
    hourGZ,
    yuejiangBranch,
    yuejiangName: YUEJIANG_NAME[yuejiangBranch],
    heaven,
    generals,
    lessons,
    chuan: [mkChuan(chu), mkChuan(zhong), mkChuan(mo)],
  }
}

export { BRANCHES, hourBranchOf }
