/**
 * 七政四余排盘引擎（ruleVariant「七政四余-黄道十二宫/二十八宿双轨」）
 *
 * 星历：astronomy-engine 真实星历（见 ephemeris.ts 头注）。
 * 精度声明：
 *  - 七政（日月五星）：validated —— 回归黄经角分级（约 ±0.01°），
 *    逆行检测用 ±12h 中心差分（顺逆判据：黄经日速 < 0）。
 *  - 罗睺/计都：月球轨道瞬时升/降交点（真实轨道要素计算）。
 *  - 月孛：月球平远地点（approximate，均轮推法）。
 *  - 紫气：传统虚星推法（approximate，10226.78 日一周天，无天文校验）。
 *
 * 双轨标注：每曜同时给出 黄道十二宫（默认回归黄道，可选恒星黄道指差）
 * 与 二十八宿宿度（汉宿度恒星制，锚角宿一）。
 *
 * 命宫：太阳加时法（日出卯时 variant）—— 以太阳过宫为起点，
 * 自太阳宫起生时，顺数至卯，所至之宫即命宫；身宫取命宫对望。
 */
import { wrapResult, type EngineResult, type Precision } from '../engine-result'
import {
  dailyMotion,
  moonAscendingNodeLongitude,
  norm360,
  tropicalLongitudeUtc,
  yuebeiLongitude,
  ziqiLongitude,
  type QizhengPlanetKey,
} from './ephemeris'
import {
  BRANCH_NAMES,
  ZODIAC_RULER,
  ZODIAC_SIGNS,
  ayanamsaDeg,
  branchOfZodiac,
  mansionFromSidereal,
  zodiacFromLongitude,
  zodiacOfBranch,
  type MansionPlacement,
} from './zodiac-mansions'

export const QIZHENG_ALGORITHM_VERSION = 'qizheng-core@1'
export const QIZHENG_RULESET_VERSION = '1.0.0'
export const QIZHENG_RULE_VARIANT = '七政四余-黄道十二宫/二十八宿双轨'

export type StarName =
  | '日' | '月' | '木' | '火' | '土' | '金' | '水'
  | '紫气' | '月孛' | '罗睺' | '计都'

/** 十一曜顺序（七政 + 四余） */
export const STAR_ORDER: StarName[] = [
  '日', '月', '木', '火', '土', '金', '水', '紫气', '月孛', '罗睺', '计都',
]

export type StarDignity = '入庙' | '得地' | '落陷' | '—'

export interface QizhengStar {
  name: StarName
  kind: 'qizheng' | 'siyu'
  /** 回归黄经（度，真黄道 of date） */
  longitude: number
  /** 黄道宫序 0–11（白羊起；受 zodiacMode/offset 影响） */
  zodiacIndex: number
  zodiac: string
  /** 宫内度 0–30 */
  zodiacDegree: number
  /** 宿序 0–27（角宿起，恒星宿度制） */
  mansionIndex: number
  mansion: string
  /** 宿度（古度，汉宿度制） */
  mansionDegree: number
  /** 宿宽（古度） */
  mansionWidth: number
  /** 宿内进度 0–1（前端布盘用） */
  mansionFraction: number
  /** 逆行判定（黄经日速 < 0，±12h 中心差分） */
  retrograde: boolean
  /** 瞬时黄经日速（度/日） */
  dailyMotion: number
  dignity: StarDignity
  precision: Precision
  note: string
}

export interface QizhengPalace {
  branchIndex: number
  branch: string
  zodiacIndex: number
  zodiac: string
  /** 宫中黄经（回归黄道，宫正中 15°） */
  longitude: number
  mansionIndex: number
  mansion: string
  /** 宿内进度 0–1（前端命宫轴定位用） */
  mansionFraction: number
  method: string
}

export interface QizhengChartData {
  /** 排盘时刻（UTC ISO） */
  datetimeUtc: string
  ianaTimezone: string | null
  gender: 'male' | 'female' | null
  /** 生时时支序 0–11 */
  hourBranch: number
  /** 宫位制：回归黄道 | 恒星黄道（offset 度） */
  zodiacMode: 'tropical' | 'sidereal'
  /** 恒星黄道指差（宿度与恒星宫位所用岁差值，度） */
  ayanamsa: number
  /** 恒星黄道指差来源：lahiri-approx | user */
  ayanamsaSource: 'lahiri-approx' | 'user'
  stars: QizhengStar[]
  minggong: QizhengPalace
  shengong: QizhengPalace
  /** 命主星（命宫宫主） */
  mingzhu: StarName | string
  sunLongitude: number
  moonLongitude: number
}

export interface QizhengComputeInput {
  /** 排盘时刻（UTC 毫秒） */
  utcMs: number
  /** 生时时支序 0–11（子起；由输入墙钟换算） */
  hourBranch: number
  gender?: 'male' | 'female'
  ianaTimezone?: string
  /**
   * 恒星黄道指差（度）。缺省 null = 回归黄道宫位 + Lahiri 近似岁差宿度；
   * 传入数值则宫位按恒星黄道判定，宿度亦用该指差。
   */
  siderealOffsetDeg?: number | null
}

interface StarDef {
  name: StarName
  kind: 'qizheng' | 'siyu'
  lonFn: (d: Date) => number
  precision: Precision
  approxNote: string | null
}

function planetDef(name: StarName, key: QizhengPlanetKey): StarDef {
  return {
    name,
    kind: 'qizheng',
    lonFn: (d) => tropicalLongitudeUtc(key, d),
    precision: 'validated',
    approxNote: null,
  }
}

const STAR_DEFS: StarDef[] = [
  planetDef('日', 'sun'),
  planetDef('月', 'moon'),
  planetDef('木', 'jupiter'),
  planetDef('火', 'mars'),
  planetDef('土', 'saturn'),
  planetDef('金', 'venus'),
  planetDef('水', 'mercury'),
  {
    name: '紫气',
    kind: 'siyu',
    lonFn: ziqiLongitude,
    precision: 'approximate',
    approxNote: '传统虚星推法（28 年一周天），无天文校验',
  },
  {
    name: '月孛',
    kind: 'siyu',
    lonFn: yuebeiLongitude,
    precision: 'approximate',
    approxNote: '月球平远地点（均轮推法），真远地点有数度摄动摆动',
  },
  {
    name: '罗睺',
    kind: 'siyu',
    lonFn: moonAscendingNodeLongitude,
    precision: 'validated',
    approxNote: null,
  },
  {
    name: '计都',
    kind: 'siyu',
    lonFn: (d) => norm360(moonAscendingNodeLongitude(d) + 180),
    precision: 'validated',
    approxNote: null,
  },
]

/** 七政庙旺陷（宫主星体系）：庙 = 本宫主星，陷 = 对宫主星 */
function dignityOf(name: StarName, zodiacIndex: number): StarDignity {
  if (name === '紫气' || name === '月孛' || name === '罗睺' || name === '计都') return '—'
  if (ZODIAC_RULER[zodiacIndex] === name) return '入庙'
  if (ZODIAC_RULER[(zodiacIndex + 6) % 12] === name) return '落陷'
  return '得地'
}

function palaceOf(
  branchIndex: number,
  ayanamsa: number,
  method: string,
): QizhengPalace {
  const zodiacIndex = zodiacOfBranch(branchIndex)
  const longitude = norm360(zodiacIndex * 30 + 15)
  const mansion = mansionFromSidereal(norm360(longitude - ayanamsa))
  return {
    branchIndex,
    branch: `${BRANCH_NAMES[branchIndex]}宫`,
    zodiacIndex,
    zodiac: `${ZODIAC_SIGNS[zodiacIndex]}宫`,
    longitude,
    mansionIndex: mansion.index,
    mansion: mansion.name,
    mansionFraction: round(mansion.fraction, 5),
    method,
  }
}

function round(n: number, digits = 4): number {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/**
 * 排七政四余星盘。纯函数：同一 utcMs 输入 → 同一输出（不含 meta.calculatedAt）。
 */
export function computeQizheng(input: QizhengComputeInput): EngineResult<QizhengChartData> {
  const date = new Date(input.utcMs)
  if (Number.isNaN(date.getTime())) throw new Error('无效的排盘时刻')
  const hourBranch = input.hourBranch
  if (!Number.isInteger(hourBranch) || hourBranch < 0 || hourBranch > 11) {
    throw new Error('生时时支应为 0–11')
  }

  const userOffset = input.siderealOffsetDeg
  const ayanamsa = userOffset != null ? userOffset : ayanamsaDeg(date)
  const ayanamsaSource: QizhengChartData['ayanamsaSource'] = userOffset != null ? 'user' : 'lahiri-approx'
  const zodiacMode: QizhengChartData['zodiacMode'] = userOffset != null ? 'sidereal' : 'tropical'
  // 宫位判定用黄经指差：回归制 0；恒星制 = 用户指差
  const zodiacOffset = userOffset != null ? userOffset : 0

  const stars: QizhengStar[] = STAR_DEFS.map((def) => {
    const longitude = def.lonFn(date)
    const zodiac = zodiacFromLongitude(longitude, zodiacOffset)
    const mansion: MansionPlacement = mansionFromSidereal(norm360(longitude - ayanamsa))
    const motion = dailyMotion(def.lonFn, date)
    const retrograde = motion < 0
    const dignity = dignityOf(def.name, zodiac.index)
    const degText = mansion.degree.toFixed(2).replace(/\.?0+$/, '')
    const note =
      `${def.name}躔${zodiac.name}${zodiac.degree.toFixed(1)}° · ${mansion.name}宿${degText}度` +
      `${retrograde ? '（逆行）' : ''}${def.approxNote ? ` · ${def.approxNote}` : ''}`
    return {
      name: def.name,
      kind: def.kind,
      longitude: round(longitude),
      zodiacIndex: zodiac.index,
      zodiac: zodiac.name,
      zodiacDegree: round(zodiac.degree, 2),
      mansionIndex: mansion.index,
      mansion: mansion.name,
      mansionDegree: round(mansion.degree, 3),
      mansionWidth: mansion.width,
      mansionFraction: round(mansion.fraction, 5),
      retrograde,
      dailyMotion: round(motion, 4),
      dignity,
      precision: def.precision,
      note,
    }
  })

  // 命宫：太阳加时法（日出卯时 variant）—— 自太阳过宫起生时，顺数至卯
  const sun = stars[0]
  const sunBranch = branchOfZodiac(sun.zodiacIndex)
  const MING_BRANCH = 3 // 卯
  const mingBranch = (((sunBranch + (MING_BRANCH - hourBranch)) % 12) + 12) % 12
  const minggong = palaceOf(mingBranch, ayanamsa, '太阳加时·日出卯时法')
  const shengong = palaceOf((mingBranch + 6) % 12, ayanamsa, '命宫对望')
  const mingzhu = ZODIAC_RULER[minggong.zodiacIndex]

  const warnings: string[] = [
    '七政（日月五星）采用 astronomy-engine 真实星历，回归黄经角分级精度（约 ±0.01°），逆行经 ±12h 差分判定。',
    '罗睺/计都为月球轨道瞬时升/降交点（真实轨道要素）；传统另有罗计互置之说，本盘从「罗睺=升交点」。',
    '月孛为月球平远地点（均轮推法，approximate），瞬时真远地点受摄动可有数度摆动。',
    '紫气无可靠天文定义，按传统推法（10226.78 日一周天，J2000 锚定）实现，精度 approximate。',
    '二十八宿采汉宿度恒星制，锚定角宿一（Spica）恒星黄经 180°，岁差指差 Lahiri 近似（角分级）。',
    '命宫按太阳加时·日出卯时法起盘；身宫取命宫对望（流派 variant 标注）。',
  ]
  if (zodiacMode === 'sidereal') {
    warnings.push(`宫位按恒星黄道判定（用户指定指差 ${ayanamsa.toFixed(4)}°）。`)
  }

  const data: QizhengChartData = {
    datetimeUtc: date.toISOString(),
    ianaTimezone: input.ianaTimezone ?? null,
    gender: input.gender ?? null,
    hourBranch,
    zodiacMode,
    ayanamsa: round(ayanamsa, 4),
    ayanamsaSource,
    stars,
    minggong,
    shengong,
    mingzhu,
    sunLongitude: sun.longitude,
    moonLongitude: stars[1].longitude,
  }

  return wrapResult(
    {
      engine: 'qizheng',
      algorithmVersion: QIZHENG_ALGORITHM_VERSION,
      ruleVariant: QIZHENG_RULE_VARIANT,
      precision: 'validated',
      warnings,
      provenance: [
        {
          ruleId: 'qizheng.ephemeris',
          variant: QIZHENG_RULE_VARIANT,
          source: 'astronomy-engine v2 (MIT, Don Cross)：行星 VSOP87 级理论 + 月球 Brown 改进月历，真黄道 of date',
        },
        {
          ruleId: 'qizheng.siyu',
          variant: QIZHENG_RULE_VARIANT,
          source: '《星平会海》四余行度：罗计=黄白升降交点，月孛=月远地点，紫气 28 年一周天（传统推法）',
        },
        {
          ruleId: 'qizheng.mansions',
          variant: QIZHENG_RULE_VARIANT,
          source: '《汉书·律历志》二十八宿距度（汉宿度），角宿锚定角宿一（Spica）恒星黄经 180°',
        },
        {
          ruleId: 'qizheng.minggong',
          variant: '太阳加时·日出卯时法',
          source: '《果老星宗》安命法：太阳过宫加生时，顺数至卯',
        },
        {
          ruleId: 'qizheng.dignity',
          variant: QIZHENG_RULE_VARIANT,
          source: '《果老星宗》诸星庙旺（七政宫主星体系；四余不系庙旺）',
        },
      ],
    },
    data,
  )
}
