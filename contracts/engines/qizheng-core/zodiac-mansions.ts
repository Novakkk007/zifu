/**
 * 七政四余 · 黄道十二宫 + 二十八宿 双轨标注
 *
 * 黄道十二宫（回归黄道，默认）：
 *   白羊 0–30°，金牛 30–60°，……，双鱼 330–360°，每宫 30°。
 *   可选恒星黄道：传入 siderealOffsetDeg（岁差指差），宫位按
 *   (黄经 − offset) 判定；默认 null = 回归黄道。
 *
 * 二十八宿（恒星宿度表）：
 *   宿宽采《汉书·律历志》汉宿度（距度，单位古度，周天 365 度），
 *   角宿起点锚于角宿一（Spica）恒星黄经 180°（Lahiri 恒星黄道约定）。
 *   恒星黄经 = 回归黄经 − 岁差指差 ayanamsa(t)。
 *   岁差指差：Lahiri 近似 —— J2000 取 23.8531°，年率 50.290966″。
 *   （近似量级：角分级；距星宿度本身为传统约定值。）
 */
import { norm360 } from './ephemeris'

export const ZODIAC_SIGNS = [
  '白羊', '金牛', '双子', '巨蟹', '狮子', '处女',
  '天秤', '天蝎', '射手', '摩羯', '宝瓶', '双鱼',
] as const

export const BRANCH_NAMES = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const

/** 二十八宿（自角宿起，顺布） */
export const MANSION_NAMES = [
  '角', '亢', '氐', '房', '心', '尾', '箕',
  '斗', '牛', '女', '虚', '危', '室', '壁',
  '奎', '娄', '胃', '昴', '毕', '觜', '参',
  '井', '鬼', '柳', '星', '张', '翼', '轸',
] as const

/**
 * 汉宿度（《汉书·律历志》距度，古度；周天 365 度）。
 * 东方青龙 75 · 北方玄武 98 · 西方白虎 80 · 南方朱雀 112，合计 365。
 */
export const MANSION_WIDTHS_GU = [
  12, 9, 15, 5, 5, 18, 11,
  26, 8, 12, 10, 17, 16, 9,
  16, 12, 14, 11, 16, 2, 9,
  33, 4, 15, 7, 18, 18, 17,
] as const

const GU_CIRCLE = MANSION_WIDTHS_GU.reduce((a, b) => a + b, 0) // 365
/** 古度 → 360° 制的换算因子 */
export const GU_TO_DEG = 360 / GU_CIRCLE

/** 各宿起点在恒星黄道上的累计位置（度，自角宿起点 180° 起算） */
const MANSION_START_OFFSETS: number[] = (() => {
  const out: number[] = [0]
  for (let i = 1; i < 28; i++) out.push(out[i - 1] + MANSION_WIDTHS_GU[i - 1] * GU_TO_DEG)
  return out
})()

/** 角宿起点（角宿一 Spica）在恒星黄道上的约定黄经（度） */
export const MANSION_ANCHOR_SIDEREAL_LON = 180

/** Lahiri 岁差指差近似：J2000 值与年率（度） */
export const AYANAMSA_J2000 = 23.8531
export const AYANAMSA_RATE_PER_YEAR = 50.290966 / 3600

const J2000_MS = Date.UTC(2000, 0, 1, 12)
const YEAR_MS = 365.25 * 86400_000

/**
 * 岁差指差（度，Lahiri 近似，回归黄经 − 恒星黄经）。
 * 精度：角分级（与瑞士星历 Lahiri 值在数十年尺度差 < 1′）。
 */
export function ayanamsaDeg(date: Date): number {
  const years = (date.getTime() - J2000_MS) / YEAR_MS
  return AYANAMSA_J2000 + AYANAMSA_RATE_PER_YEAR * years
}

export interface ZodiacPlacement {
  /** 宫序 0–11（白羊起） */
  index: number
  name: string
  /** 宫内度 0–30 */
  degree: number
}

/** 黄经 → 黄道十二宫（offsetDeg = 0 为回归黄道；>0 为恒星黄道指差） */
export function zodiacFromLongitude(longitude: number, offsetDeg = 0): ZodiacPlacement {
  const lon = norm360(longitude - offsetDeg)
  const index = Math.min(11, Math.floor(lon / 30))
  return { index, name: `${ZODIAC_SIGNS[index]}宫`, degree: lon - index * 30 }
}

export interface MansionPlacement {
  /** 宿序 0–27（角宿起） */
  index: number
  name: string
  /** 宿度（古度，0–宿宽；汉宿度制） */
  degree: number
  /** 宿宽（古度） */
  width: number
  /** 宿内进度 0–1 */
  fraction: number
}

/** 恒星黄经 → 二十八宿（汉宿度，角宿锚定 Spica 180°） */
export function mansionFromSidereal(siderealLongitude: number): MansionPlacement {
  const v = norm360(siderealLongitude - MANSION_ANCHOR_SIDEREAL_LON)
  for (let i = 0; i < 28; i++) {
    const start = MANSION_START_OFFSETS[i]
    const widthDeg = MANSION_WIDTHS_GU[i] * GU_TO_DEG
    if (v >= start && v < start + widthDeg) {
      const fraction = (v - start) / widthDeg
      return {
        index: i,
        name: MANSION_NAMES[i],
        degree: fraction * MANSION_WIDTHS_GU[i],
        width: MANSION_WIDTHS_GU[i],
        fraction,
      }
    }
  }
  // 数值边界兜底（v ≈ 360）
  return { index: 0, name: MANSION_NAMES[0], degree: 0, width: MANSION_WIDTHS_GU[0], fraction: 0 }
}

/**
 * 七政四余宫支：黄道宫序 → 地支（宫名）。
 * 对应：摩羯=丑、宝瓶=子、双鱼=亥、白羊=戌、金牛=酉、双子=申、
 * 巨蟹=未、狮子=午、处女=巳、天秤=辰、天蝎=卯、射手=寅。
 */
export function branchOfZodiac(index: number): number {
  return (((10 - index) % 12) + 12) % 12
}

/** 地支序 → 黄道宫序（branchOfZodiac 的逆映射） */
export function zodiacOfBranch(branch: number): number {
  return (((10 - branch) % 12) + 12) % 12
}

/** 宫主星（七政庙主）：白羊火·金牛金·双子水·巨蟹月·狮子日·处女水·天秤金·天蝎火·射手木·摩羯土·宝瓶土·双鱼木 */
export const ZODIAC_RULER: readonly string[] = [
  '火', '金', '水', '月', '日', '水', '金', '火', '木', '土', '土', '木',
]
