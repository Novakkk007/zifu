/**
 * 七政四余 · 真实星历层（astronomy-engine 封装）
 *
 * 星历来源：astronomy-engine v2 (MIT, Don Cross)
 *  - 行星：VSOP87 级解析理论（地心视黄经，含光行差修正），角分级精度
 *  - 月球：Brown 改进月历（ILE 1954），角分级精度
 *  - 坐标：真黄道坐标系（ecliptic of date，含岁差章动）→ 回归黄经
 *
 * 四余处理：
 *  - 罗睺 = 月球轨道瞬时升交点（osculating node，由月心位置/速度矢量
 *    叉积求得，纯 astronomy-engine 数据，无外部常数）；计都 = 罗睺 + 180°
 *  - 月孛 = 月球平远地点（均轮推法，周期 3230.9375 日 ≈ 8.85 年，
 *    J2000 锚定；与 Meeus 平近点角公式互洽在 0.1° 内。瞬时真远地点
 *    受太阳摄动可有数度摆动 → approximate）
 *  - 紫气 = 传统虚星，无可靠天文定义：按传统推法匀速顺行，
 *    周期 10226.78132 日 ≈ 28 年，J2000 锚定黄经 188.6849°
 *    （《星平会海》「紫气 28 日行一度、28 个月过一宫」之精确化）→ approximate
 */
import {
  AstroTime,
  Body,
  Ecliptic,
  EclipticGeoMoon,
  GeoMoon,
  GeoVector,
  SunPosition,
  Vector,
} from 'astronomy-engine'

export type QizhengPlanetKey = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'

const BODY_MAP: Record<Exclude<QizhengPlanetKey, 'sun' | 'moon'>, Body> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
}

/** 角度归一化到 [0, 360) */
export function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** 有符号角差 a−b 归一化到 (−180, 180] */
export function deltaAngle(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180
}

/** Date → 儒略日 (JD, UT) */
export function julianDay(date: Date): number {
  return date.getTime() / 86400_000 + 2440587.5
}

/**
 * 七政（日月五星）地心回归黄经（度，[0,360)）。
 * 精度：角分级（astronomy-engine 官方校验 vs JPL Horizons）。
 */
export function tropicalLongitudeUtc(key: QizhengPlanetKey, date: Date): number {
  if (key === 'sun') return norm360(SunPosition(date).elon)
  if (key === 'moon') return norm360(EclipticGeoMoon(date).lon)
  const vec = GeoVector(BODY_MAP[key], date, true)
  return norm360(Ecliptic(vec).elon)
}

/**
 * 瞬时黄经速度（度/日，中心差分 ±12h）。
 * 负值 = 逆行。对七政与四余公式统一适用（短时差分法）。
 */
export function dailyMotion(lonFn: (d: Date) => number, date: Date): number {
  const half = 12 * 3600_000
  const a = lonFn(new Date(date.getTime() + half))
  const b = lonFn(new Date(date.getTime() - half))
  return deltaAngle(a, b)
}

/* ---------------- 罗睺 / 计都：月球轨道瞬时交点 ---------------- */

const OBLIQUITY_J2000_RAD = (23.4392911 * Math.PI) / 180
/** 黄道极（J2000 赤道系 EQJ 中的方向矢量） */
const ECLIPTIC_POLE_EQJ: [number, number, number] = [
  0,
  -Math.sin(OBLIQUITY_J2000_RAD),
  Math.cos(OBLIQUITY_J2000_RAD),
]

type Vec3 = [number, number, number]

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function moonVec(date: Date): Vec3 {
  const v = GeoMoon(date)
  return [v.x, v.y, v.z]
}

/**
 * 月球轨道瞬时升交点黄经（罗睺，度）。
 * 方法：月心位置 r 与速度 v（±1h 数值微分）→ 轨道角动量 h = r×v；
 * 升交点方向 n = 黄道极 × h；再经 Ecliptic() 转换取黄经。
 * 与 Meeus 平交点公式（Ω = 125.0445 − 1934.1363·T + …）互洽在约 1.5° 内
 * （瞬时交点围绕平交点做章动周期摆动）。
 */
export function moonAscendingNodeLongitude(date: Date): number {
  const h = 3600_000
  const r0 = moonVec(new Date(date.getTime() - h))
  const r1 = moonVec(new Date(date.getTime() + h))
  const r = moonVec(date)
  const v: Vec3 = [r1[0] - r0[0], r1[1] - r0[1], r1[2] - r0[2]]
  const angMom = cross(r, v)
  const node = cross(ECLIPTIC_POLE_EQJ, angMom)
  const ecl = Ecliptic(new Vector(node[0], node[1], node[2], new AstroTime(date)))
  return norm360(ecl.elon)
}

/* ---------------- 月孛 / 紫气：传统推法（J2000 锚定匀速） ---------------- */

/** J2000 锚点 JD 2451543.5（2000-01-01 00:00 UT） */
export const SIYU_EPOCH_JD = 2451543.5
/** 月孛（月球平远地点）锚定黄经（度，@SIYU_EPOCH_JD） */
export const YUEBEI_EPOCH_LON = 263.2976
/** 月孛周期（日）：月球远地点进动周期 ≈ 8.85 年 */
export const YUEBEI_PERIOD_DAYS = 3230.9375
/** 紫气锚定黄经（度，@SIYU_EPOCH_JD） */
export const ZIQI_EPOCH_LON = 188.6849
/** 紫气周期（日）：传统 28 年一周天（10226.78 日） */
export const ZIQI_PERIOD_DAYS = 10226.78132

/** 月孛黄经：月球平远地点，匀速顺行（approximate，真远地点有数度摄动摆动） */
export function yuebeiLongitude(date: Date): number {
  const jd = julianDay(date)
  return norm360(YUEBEI_EPOCH_LON + (360 * (jd - SIYU_EPOCH_JD)) / YUEBEI_PERIOD_DAYS)
}

/**
 * 紫气黄经：传统虚星推法，匀速顺行，28 年一周天。
 * 紫气无可靠天文定义（疑为回回历法系虚星），按《星平会海》行度精确化锚定。
 * 精度：approximate（仅保证传统行度自洽，无天文观测校验）。
 */
export function ziqiLongitude(date: Date): number {
  const jd = julianDay(date)
  return norm360(ZIQI_EPOCH_LON + (360 * (jd - SIYU_EPOCH_JD)) / ZIQI_PERIOD_DAYS)
}
