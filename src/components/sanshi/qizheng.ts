/**
 * 七政四余 mock 排盘：按生辰哈希确定性生成十一曜躔宿，
 * 日按节气近似真实位置（冬至点锚于斗宿）。同一输入 → 同一星盘。
 */
import {
  BRANCHES,
  MANSIONS,
  MANSION_BEAST,
  dayOfYear,
  hashSeed,
  rng,
} from '@/components/sanshi/astro'

export type StarName =
  | '日' | '月' | '木' | '火' | '土' | '金' | '水'
  | '紫气' | '月孛' | '罗睺' | '计都'

export const STAR_ORDER: StarName[] = [
  '日', '月', '木', '火', '土', '金', '水', '紫气', '月孛', '罗睺', '计都',
]

export type StarState = '入庙' | '得地' | '落陷'

export type StarPos = {
  name: StarName
  /** 宿序 0–27 */
  mansion: number
  /** 宿内度（1–12，演示近似） */
  degree: number
  /** 盘上角度（度，SVG 极角） */
  angle: number
  state: StarState
  note: string
}

export type QizhengChart = {
  stars: StarPos[]
  mingMansion: number
  mingAngle: number
  shenMansion: number
  mingZhu: StarName
}

/** 二十八宿环上角度（子正北居下，θ=90°+b·30 顺布；宿序递增 → 角度递减） */
export const MANSION_ANGLE = [
  217.5, 202.5, 190, 180, 170, 157.5, 142.5,
  127.5, 112.5, 100, 90, 80, 67.5, 52.5,
  37.5, 22.5, 10, 0, 350, 337.5, 322.5,
  307.5, 292.5, 280, 270, 260, 247.5, 232.5,
]

/** 各宿的环上进度 u（自角宿 0 起递增，一周 360） */
const MANSION_U = MANSION_ANGLE.map((a) => ((217.5 - a) % 360 + 360) % 360)
/** 宿界（28+1 条） */
const BOUNDS: number[] = (() => {
  const b: number[] = []
  for (let m = 0; m < 28; m++) {
    const prev = m === 0 ? MANSION_U[27] - 360 : MANSION_U[m - 1]
    b.push((prev + MANSION_U[m]) / 2)
  }
  b.push(MANSION_U[27] + (360 - MANSION_U[27] + MANSION_U[0]) / 2)
  return b
})()

/** 各宿扇区的环角边界 [aStart, aEnd]（aStart > aEnd，顺时针） */
export const MANSION_WEDGES: [number, number][] = Array.from({ length: 28 }, (_, m) => [
  217.5 - BOUNDS[m],
  217.5 - BOUNDS[m + 1],
])

/** 由环上角度求宿与度 */
export function mansionFromAngle(angle: number): { mansion: number; degree: number } {
  const v = ((217.5 - angle) % 360 + 360) % 360
  for (let m = 0; m < 28; m++) {
    if (v >= BOUNDS[m] && v < BOUNDS[m + 1]) {
      const frac = (v - BOUNDS[m]) / (BOUNDS[m + 1] - BOUNDS[m])
      return { mansion: m, degree: Math.min(12, Math.floor(frac * 12) + 1) }
    }
  }
  return { mansion: 0, degree: 1 }
}

/** 太阳黄经近似：春分（年内第 80 天）= 0° */
function sunLongitude(year: number, month: number, day: number): number {
  const doy = dayOfYear(year, month, day)
  return (((doy - 80) / 365.25) * 360 % 360 + 360) % 360
}

/** 日的环上角度：冬至（黄经 270°）锚于斗宿（环角 127.5°），黄经增 → 环角减 */
export function sunAngle(year: number, month: number, day: number): number {
  return ((397.5 - sunLongitude(year, month, day)) % 360 + 360) % 360
}

/** 各曜释义模板（原创短句库） */
const STAR_PHRASES: Record<StarName, string[]> = {
  日: ['日主明朗而带锐气，行事有光', '主声名早显，锋芒贵在自持'],
  月: ['主体察入微，情性温润', '主内秀多思，静水而流深'],
  木: ['主仁心渐长，处事有荫', '主文脉绵长，贵人暗助'],
  火: ['主礼性外扬，锋芒宜敛', '主行动力足，戒急而戒躁'],
  土: ['主信实稳重，厚积而缓发', '主守成有余，于不变中求新'],
  金: ['主义气清肃，断事分明', '主骨格清奇，宜专而宜精'],
  水: ['主智识流转，善谋而善变', '主才思敏捷，渊渟而岳峙'],
  紫气: ['余气清贵，主孤高出尘之趣', '余气含章，主晚成之福'],
  月孛: ['余气潋滟，主才情外溢', '余气幽微，宜守清心以自持'],
  罗睺: ['余气交蚀，主变中藏机', '余气横空，事多转折而后成'],
  计都: ['余气沉潜，主先难而后易', '余气伏隐，破障而后见明'],
}

export type QizhengInput = {
  year: number
  month: number
  day: number
  /** 时支序 0–11 */
  hourBranch: number
  gender: 'male' | 'female'
  calendar: 'solar' | 'lunar'
  place: string
}

export function genQizheng(input: QizhengInput): QizhengChart {
  const { year, month, day, hourBranch, gender, calendar, place } = input
  const seed = hashSeed(
    `qizheng|${year}|${month}|${day}|${hourBranch}|${gender}|${calendar}|${place}`,
  )
  const rand = rng(seed)

  // 日：节气近似真实位置
  const aSun = sunAngle(year, month, day)
  const sunAt = mansionFromAngle(aSun)

  // 其余十曜：确定性打散到各宿（允许同宿）
  const perm = Array.from({ length: 28 }, (_, i) => i)
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }

  const stars: StarPos[] = []
  const stateOf = (): StarState => {
    const r = rand()
    return r < 0.3 ? '入庙' : r < 0.75 ? '得地' : '落陷'
  }
  STAR_ORDER.forEach((name, i) => {
    let mansion: number
    let degree: number
    let angle: number
    if (name === '日') {
      mansion = sunAt.mansion
      degree = sunAt.degree
      angle = aSun
    } else {
      mansion = perm[(i - 1) % 28]
      degree = 1 + Math.floor(rand() * 11)
      // 星点落在宿内确定性位置
      const frac = (degree - 0.5) / 12
      const v = BOUNDS[mansion] + frac * (BOUNDS[mansion + 1] - BOUNDS[mansion])
      angle = ((217.5 - v) % 360 + 360) % 360
    }
    const state = stateOf()
    const phrase = STAR_PHRASES[name][Math.floor(rand() * STAR_PHRASES[name].length)]
    const note = `${name}躔${MANSIONS[mansion]}宿：${MANSIONS[mansion]}为${MANSION_BEAST[mansion]}之宿，${phrase}`
    stars.push({ name, mansion, degree, angle, state, note })
  })

  // 命宫：太阳加时支（七政式近似），身宫对望
  const mingAngle = ((aSun - hourBranch * 30) % 360 + 360) % 360
  const mingMansion = mansionFromAngle(mingAngle).mansion
  const shenMansion = mansionFromAngle(mingAngle + 180).mansion

  // 命主星：命宫宿有星则取之，否则取最近者
  let mingZhu: StarName | null = stars.find((s) => s.mansion === mingMansion)?.name ?? null
  if (!mingZhu) {
    let best = 0
    let bestDist = 99
    stars.forEach((s, i) => {
      const d = Math.min(
        Math.abs(s.mansion - mingMansion),
        28 - Math.abs(s.mansion - mingMansion),
      )
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    mingZhu = stars[best].name
  }

  return { stars, mingMansion, mingAngle, shenMansion, mingZhu }
}

export { MANSIONS, BRANCHES }
