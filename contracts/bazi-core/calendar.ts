/**
 * 历法引擎（封装 lunar-typescript 作为历法基础）
 * - 公历↔农历互转（含闰月）
 * - 精确节气时刻（前一节 / 后一节）
 * - 真太阳时修正：标准时 + (经度-120°)×4分钟 + 均时差
 *
 * 内部时刻表示：把「东八区墙钟时间」编码为伪 UTC 毫秒（Date.UTC 取字段），
 * 与运行时所在时区无关，保证跨环境确定性。
 */
import { Lunar, Solar } from 'lunar-typescript'
import { RULESET_VERSION } from './rules'
import type { BirthInput, TimeAudit } from './types'

export const DAY_MS = 24 * 60 * 60 * 1000

/** 均时差近似公式版本：E = 9.87·sin(2B) − 7.53·cos(B) − 1.5·sin(B)，B = 2π(N−81)/364（N=年积日） */
export const EOT_FORMULA_VERSION = 'EoT-Spencer-NOAA-approx-v1'

export interface CivilDateTime {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export interface LunarDate {
  year: number
  /** 负数表示闰月 */
  month: number
  day: number
  isLeapMonth: boolean
}

export interface JieMoment {
  name: string
  /** 伪 UTC 毫秒（东八区墙钟） */
  ms: number
  text: string
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** 东八区墙钟字段 → 伪 UTC 毫秒 */
export function toPseudoMs(t: CivilDateTime & { second?: number }): number {
  return Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second ?? 0)
}

/** 伪 UTC 毫秒 → 东八区墙钟字段 */
export function fromPseudoMs(ms: number): CivilDateTime & { second: number } {
  const d = new Date(ms)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  }
}

export function fmtYmdHm(ms: number): string {
  const t = fromPseudoMs(ms)
  return `${t.year}-${pad2(t.month)}-${pad2(t.day)} ${pad2(t.hour)}:${pad2(t.minute)}`
}

export function fmtYmdHms(ms: number): string {
  const t = fromPseudoMs(ms)
  return `${fmtYmdHm(ms)}:${pad2(t.second)}`
}

function solarToPseudoMs(s: Solar): number {
  return Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond())
}

/** 公历 → 农历（含闰月标记） */
export function solarToLunar(year: number, month: number, day: number): LunarDate {
  const lunar = Solar.fromYmd(year, month, day).getLunar()
  const m = lunar.getMonth()
  return { year: lunar.getYear(), month: m, day: lunar.getDay(), isLeapMonth: m < 0 }
}

/** 农历 → 公历（isLeapMonth=true 时按闰月） */
export function lunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth = false,
): { year: number; month: number; day: number } {
  const lunar = Lunar.fromYmd(year, isLeapMonth ? -month : month, day)
  const s = lunar.getSolar()
  return { year: s.getYear(), month: s.getMonth(), day: s.getDay() }
}

/**
 * 均时差（分钟）。标准天文近似公式（版本见 EOT_FORMULA_VERSION）：
 * E = 9.87·sin(2B) − 7.53·cos(B) − 1.5·sin(B)，B = 2π(N−81)/364。
 * 视太阳时 = 平太阳时 + E。
 */
export function equationOfTimeMinutes(pseudoMs: number): number {
  const d = new Date(pseudoMs)
  const start = Date.UTC(d.getUTCFullYear(), 0, 1)
  const dayOfYear = Math.floor((d.getTime() - start) / DAY_MS) + 1
  const B = (2 * Math.PI * (dayOfYear - 81)) / 364
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

/** 查询伪时刻前后最近的「节」（12 节：立春、惊蛰……小寒），含精确时刻 */
export function getPrevNextJie(pseudoMs: number): { prev: JieMoment; next: JieMoment } {
  const t = fromPseudoMs(pseudoMs)
  const lunar = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, t.second).getLunar()
  const prev = lunar.getPrevJie()
  const next = lunar.getNextJie()
  const prevMs = solarToPseudoMs(prev.getSolar())
  const nextMs = solarToPseudoMs(next.getSolar())
  return {
    prev: { name: prev.getName(), ms: prevMs, text: fmtYmdHms(prevMs) },
    next: { name: next.getName(), ms: nextMs, text: fmtYmdHms(nextMs) },
  }
}

export interface ResolvedBirthTime {
  /** 输入换算后的公历墙钟（输入时区） */
  civil: CivilDateTime
  /** 农历日期（含闰月） */
  lunar: LunarDate
  /** 东八区标准时刻（伪毫秒） */
  standardMs: number
  /** 排盘所用时刻（真太阳时或标准时，伪毫秒） */
  effectiveMs: number
  /** 排盘时刻墙钟字段 */
  effective: CivilDateTime
  longitude: number
  timezone: number
  longitudeCorrectionMin: number
  equationOfTimeMin: number
  timeAudit: TimeAudit
}

/**
 * 解析 BirthInput → 统一时刻：
 * 1. 农历输入先转公历（含闰月）；
 * 2. 输入时区墙钟 → 东八区墙钟；
 * 3. useTrueSolarTime 时追加 经度修正 + 均时差。
 * hour 为 null 时以正午 12:00 作为换算基准（时柱不排）。
 */
export function resolveBirthTime(input: BirthInput): ResolvedBirthTime {
  const hour = input.hour ?? 12
  const minute = input.minute
  const timezone = input.timezone ?? 8
  const longitude = input.longitude ?? 120

  let civil: CivilDateTime
  let lunar: LunarDate
  if (input.calendar === 'lunar') {
    const isLeap = input.isLeapMonth === true
    const s = lunarToSolar(input.year, input.month, input.day, isLeap)
    civil = { year: s.year, month: s.month, day: s.day, hour, minute }
    lunar = { year: input.year, month: isLeap ? -input.month : input.month, day: input.day, isLeapMonth: isLeap }
  } else {
    civil = { year: input.year, month: input.month, day: input.day, hour, minute }
    lunar = solarToLunar(civil.year, civil.month, civil.day)
  }

  // 输入时区墙钟 → 东八区墙钟
  const standardMs = toPseudoMs(civil) + (8 - timezone) * 3600_000

  // 真太阳时 = 东八区标准时 + (经度-120°)×4分钟 + 均时差
  const longitudeCorrectionMin = (longitude - 120) * 4
  const equationOfTimeMin = equationOfTimeMinutes(standardMs)
  const correctionMs = input.useTrueSolarTime
    ? (longitudeCorrectionMin + equationOfTimeMin) * 60_000
    : 0
  const effectiveMs = standardMs + correctionMs
  const effective = fromPseudoMs(effectiveMs)

  const timeAudit: TimeAudit = {
    inputCalendar: input.calendar,
    isLeapMonth: lunar.isLeapMonth,
    standardTime: fmtYmdHm(standardMs),
    timezone,
    longitude,
    longitudeCorrectionMin: Math.round(longitudeCorrectionMin * 100) / 100,
    equationOfTimeMin: Math.round(equationOfTimeMin * 100) / 100,
    useTrueSolarTime: input.useTrueSolarTime,
    effectiveTime: fmtYmdHm(effectiveMs),
    eotFormulaVersion: EOT_FORMULA_VERSION,
    dayRollover: input.dayRollover,
    lunarYear: lunar.year,
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    rulesetVersion: RULESET_VERSION,
  }

  return {
    civil,
    lunar,
    standardMs,
    effectiveMs,
    effective: {
      year: effective.year,
      month: effective.month,
      day: effective.day,
      hour: effective.hour,
      minute: effective.minute,
    },
    longitude,
    timezone,
    longitudeCorrectionMin,
    equationOfTimeMin,
    timeAudit,
  }
}

/** 由伪毫秒构造 Lunar（供库内精确干支查询） */
export function lunarAt(pseudoMs: number): Lunar {
  const t = fromPseudoMs(pseudoMs)
  return Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, t.second).getLunar()
}
