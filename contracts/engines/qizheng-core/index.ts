/**
 * 七政四余核心库 · 统一出口
 * 纯 TypeScript（astronomy-engine 为唯一运行时依赖），无 React / 无 DB / 无网络。
 */
import type { BirthInput, Wuxing } from '../../bazi-core/types'
import { ianaWallClockToUtcMs, lunarToSolar } from '../../bazi-core/calendar'
import type { HecanArtContribution } from '../hecan-core/types'
import { computeQizheng } from './engine'

export * from './ephemeris'
export * from './zodiac-mansions'
export * from './engine'

/* ---------------- 三术合参协议（hecan-core 动态探测/静态注册均可） ---------------- */

/** 命主星 → 五行（七政星性：五星直取，太阳君火、太阴壬水） */
const STAR_WUXING: Record<string, Wuxing> = {
  金星: '金',
  木星: '木',
  水星: '水',
  火星: '火',
  土星: '土',
  太阳: '火',
  太阴: '水',
}

/**
 * hecanSynthesize — 三术合参接入协议实现。
 * 输入与 bazi-core 的 BirthInput 对齐；时辰未知时抛错（编排器降级为 unavailable，不伪造）。
 */
export function hecanSynthesize(input: BirthInput): HecanArtContribution {
  if (input.hour === null || input.hour === undefined) {
    throw new Error('时辰未知，七政四余无法安命宫（需准确时辰）')
  }
  const solar =
    input.calendar === 'lunar'
      ? lunarToSolar(input.year, input.month, input.day, input.isLeapMonth ?? false)
      : { year: input.year, month: input.month, day: input.day }
  const tz = input.ianaTimezone ?? 'Asia/Shanghai'
  const utcMs = ianaWallClockToUtcMs(tz, {
    year: solar.year,
    month: solar.month,
    day: solar.day,
    hour: input.hour,
    minute: input.minute ?? 0,
    second: 0,
  })
  const hourBranch = Math.floor(((input.hour + 1) % 24) / 2)
  const result = computeQizheng({
    utcMs,
    hourBranch,
    gender: input.gender,
    ianaTimezone: tz,
  })
  const d = result.data
  const sun = d.stars.find((s) => s.name === '日')
  const moon = d.stars.find((s) => s.name === '月')
  const retro = d.stars.filter((s) => s.retrograde).map((s) => s.name)
  const keyPoints = [
    `命宫：${d.minggong.branch}（${d.minggong.zodiac}，${d.minggong.mansion}宿）；身宫：${d.shengong.branch}`,
    `命主星：${d.mingzhu}`,
    ...(sun ? [`太阳在${sun.zodiac}${sun.zodiacDegree.toFixed(1)}°（${sun.mansion}宿）`] : []),
    ...(moon ? [`太阴在${moon.zodiac}${moon.zodiacDegree.toFixed(1)}°（${moon.mansion}宿）`] : []),
    retro.length > 0 ? `逆行星曜：${retro.join('、')}` : '十一曜皆顺行',
  ]
  return {
    keyPoints,
    wuxingFocus: STAR_WUXING[String(d.mingzhu)] ?? null,
    mingGongBranch: d.minggong.branch,
    structureScore: null,
    summary: `七政看星：命宫${d.minggong.branch}（${d.minggong.zodiac}），命主星${d.mingzhu}。`,
    precision: result.meta.precision,
    ruleVariant: result.meta.ruleVariant,
    provenance: result.meta.provenance,
  }
}
