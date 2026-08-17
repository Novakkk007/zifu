/**
 * 黄金夹具扩充（v1.1.0）：
 * 公历↔农历已知日期、城市经度真太阳时、IANA 时区/历史夏令时、
 * 起运岁数手算精度、时辰未知全盘行为。
 */
import { describe, expect, it } from 'vitest'
import {
  ALGORITHM_VERSION,
  RULESET_VERSION,
  computeChartV2,
  ianaOffsetMinutesAt,
  lunarToSolar,
  solarToLunar,
} from '@contracts/bazi-core'
import type { BirthInput } from '@contracts/bazi-core'

const mk = (over: Partial<BirthInput>): BirthInput => ({
  calendar: 'solar',
  year: 2024,
  month: 5,
  day: 10,
  hour: 10,
  minute: 0,
  gender: 'male',
  useTrueSolarTime: false,
  dayRollover: 'zichu',
  ...over,
})

describe('版本', () => {
  it('RULESET_VERSION / ALGORITHM_VERSION 均为 1.1.0', () => {
    expect(RULESET_VERSION).toBe('1.2.0')
    expect(ALGORITHM_VERSION).toBe('1.2.0')
    const chart = computeChartV2(mk({}))
    expect(chart.rulesetVersion).toBe('1.2.0')
    expect(chart.timeAudit.rulesetVersion).toBe('1.2.0')
  })
})

describe('公历→农历换算精度（已知日期）', () => {
  it('2024-02-10 = 甲辰年正月初一（春节）', () => {
    const l = solarToLunar(2024, 2, 10)
    expect([l.year, l.month, l.day]).toEqual([2024, 1, 1])
  })
  it('1949-10-01 = 己丑年八月初十', () => {
    const l = solarToLunar(1949, 10, 1)
    expect([l.year, l.month, l.day]).toEqual([1949, 8, 10])
  })
  it('2000-01-01 = 己卯年冬月廿五（跨公历年）', () => {
    const l = solarToLunar(2000, 1, 1)
    expect([l.year, l.month, l.day]).toEqual([1999, 11, 25])
  })
})

describe('农历→公历换算精度（已知日期）', () => {
  it('农历 2024 正月初一 → 2024-02-10', () => {
    expect(lunarToSolar(2024, 1, 1)).toEqual({ year: 2024, month: 2, day: 10 })
  })
  it('农历 1949 八月初十 → 1949-10-01', () => {
    expect(lunarToSolar(1949, 8, 10)).toEqual({ year: 1949, month: 10, day: 1 })
  })
  it('农历 1999 冬月廿五 → 2000-01-01', () => {
    expect(lunarToSolar(1999, 11, 25)).toEqual({ year: 2000, month: 1, day: 1 })
  })
})

describe('不同城市经度的真太阳时（北京 116.4° vs 乌鲁木齐 87.6°）', () => {
  const at = (longitude: number) =>
    computeChartV2(
      mk({ year: 1995, month: 6, day: 15, hour: 12, minute: 30, useTrueSolarTime: true, longitude }),
    )
  it('同一钟表时刻，经度修正量不同（-14.4 vs -129.6 分钟）', () => {
    expect(at(116.4).timeAudit.longitudeCorrectionMin).toBeCloseTo(-14.4, 5)
    expect(at(87.6).timeAudit.longitudeCorrectionMin).toBeCloseTo(-129.6, 5)
  })
  it('真太阳时时刻不同且时柱不同（午时 vs 巳时）', () => {
    const bj = at(116.4)
    const ur = at(87.6)
    expect(bj.timeAudit.effectiveTime).not.toBe(ur.timeAudit.effectiveTime)
    expect(bj.pillars.hour?.branch).toBe('午') // ≈12:16 真太阳时
    expect(ur.pillars.hour?.branch).toBe('巳') // ≈10:21 真太阳时
  })
})

describe('IANA 时区与历史夏令时', () => {
  it('Intl 偏移查询：中国 1986-1991 夏令时（1987-07 → +9；1987-01 → +8）', () => {
    expect(ianaOffsetMinutesAt('Asia/Shanghai', Date.UTC(1987, 6, 1, 3, 0))).toBe(540)
    expect(ianaOffsetMinutesAt('Asia/Shanghai', Date.UTC(1987, 0, 1, 3, 0))).toBe(480)
    expect(ianaOffsetMinutesAt('Asia/Shanghai', Date.UTC(2024, 5, 1, 4, 0))).toBe(480)
  })

  it('Intl 偏移查询：美国东部 DST（7 月 EDT=-4；1 月 EST=-5）', () => {
    expect(ianaOffsetMinutesAt('America/New_York', Date.UTC(2021, 6, 1, 16, 0))).toBe(-240)
    expect(ianaOffsetMinutesAt('America/New_York', Date.UTC(2021, 0, 1, 16, 0))).toBe(-300)
  })

  it('1987-07-01 11:30 Asia/Shanghai（夏令时）：审计偏移 9，东八区标准时 10:30，时柱巳', () => {
    const c = computeChartV2(
      mk({ year: 1987, month: 7, day: 1, hour: 11, minute: 30, ianaTimezone: 'Asia/Shanghai' }),
    )
    expect(c.timeAudit.timezoneSource).toBe('iana')
    expect(c.timeAudit.ianaTimezone).toBe('Asia/Shanghai')
    expect(c.timeAudit.timezone).toBe(9)
    expect(c.timeAudit.standardTime).toBe('1987-07-01 10:30')
    expect(c.pillars.hour?.branch).toBe('巳')
  })

  it('同一时刻用 legacy 固定偏移（timezone 8）：标准时 11:30，时柱午 → 与 IANA 结果不同', () => {
    const legacy = computeChartV2(mk({ year: 1987, month: 7, day: 1, hour: 11, minute: 30, timezone: 8 }))
    expect(legacy.timeAudit.timezoneSource).toBe('fixed-offset')
    expect(legacy.timeAudit.ianaTimezone).toBeNull()
    expect(legacy.timeAudit.timezone).toBe(8)
    expect(legacy.timeAudit.standardTime).toBe('1987-07-01 11:30')
    expect(legacy.pillars.hour?.branch).toBe('午')
    const iana = computeChartV2(
      mk({ year: 1987, month: 7, day: 1, hour: 11, minute: 30, ianaTimezone: 'Asia/Shanghai' }),
    )
    expect(iana.pillars.hour?.ganzhi).not.toBe(legacy.pillars.hour?.ganzhi)
  })

  it('1987-01-01（非夏令时）Asia/Shanghai 与固定偏移 8 结果一致', () => {
    const iana = computeChartV2(mk({ year: 1987, month: 1, day: 1, hour: 12, ianaTimezone: 'Asia/Shanghai' }))
    const legacy = computeChartV2(mk({ year: 1987, month: 1, day: 1, hour: 12, timezone: 8 }))
    expect(iana.timeAudit.timezone).toBe(8)
    expect(iana.timeAudit.standardTime).toBe(legacy.timeAudit.standardTime)
    expect(iana.pillars.hour?.ganzhi).toBe(legacy.pillars.hour?.ganzhi)
    expect(iana.pillars.day.ganzhi).toBe(legacy.pillars.day.ganzhi)
  })

  it('America/New_York 2021-07-01 12:00（EDT）→ 东八区 2021-07-02 00:00，日柱随之推进', () => {
    const ny = computeChartV2(mk({ year: 2021, month: 7, day: 1, hour: 12, ianaTimezone: 'America/New_York' }))
    expect(ny.timeAudit.timezone).toBe(-4)
    expect(ny.timeAudit.standardTime).toBe('2021-07-02 00:00')
    const sh = computeChartV2(mk({ year: 2021, month: 7, day: 1, hour: 12, ianaTimezone: 'Asia/Shanghai' }))
    expect(ny.pillars.day.ganzhi).not.toBe(sh.pillars.day.ganzhi)
  })
})

describe('起运岁数精度（手算夹具）', () => {
  // 2024-05-10 10:00 男，甲辰年阳男顺排 → 数至下一节「芒种」2024-06-05 12:09:54
  // 手算：26 天 + 2小时9分54秒 = 26.090208... 天；÷3 = 8.6967 → 保留 1 位小数 = 8.7 岁
  const c = computeChartV2(mk({}))
  it('顺排参考节气为芒种，时刻 2024-06-05 12:09:54', () => {
    expect(c.dayun.forward).toBe(true)
    expect(c.dayun.refJieName).toBe('芒种')
    expect(c.dayun.refJieTime).toBe('2024-06-05 12:09:54')
  })
  it('daysToJie 精确到手算分数 26.090（3 位小数）', () => {
    const hand = 26 + (2 * 3600 + 9 * 60 + 54) / 86400 // 26.090208333...
    expect(c.dayun.daysToJie).toBe(Math.round(hand * 1000) / 1000)
  })
  it('startAge = 26.090208/3 ≈ 8.7（0-10 区间内）', () => {
    expect(c.dayun.startAge).toBe(8.7)
    expect(c.dayun.startAge).toBeGreaterThanOrEqual(0)
    expect(c.dayun.startAge).toBeLessThanOrEqual(10)
    expect(c.dayun.steps[0].startAge).toBe(8.7)
    expect(c.dayun.steps[0].endAge).toBeCloseTo(18.7, 5)
  })
})

describe('时辰未知（hour=null）全盘行为', () => {
  const c = computeChartV2(mk({ year: 2021, month: 3, day: 7, hour: null }))
  it('时柱为 null，年月日三柱正常', () => {
    expect(c.pillars.hour).toBeNull()
    expect(c.pillars.year.ganzhi).toBe('辛丑')
    expect(c.pillars.month.ganzhi).toBe('辛卯')
    expect(c.pillars.day.ganzhi).toBe('甲寅')
  })
  it('称骨为 null，命宫/身宫为 null', () => {
    expect(c.chenggu).toBeNull()
    expect(c.mingGong).toBeNull()
    expect(c.shenGong).toBeNull()
  })
  it('神煞仍按三柱计算（起例允许处）：天乙贵人命中年支、羊刃月支、禄神日支', () => {
    const byName = (n: string) => c.shensha.filter((s) => s.name === n)
    expect(byName('天乙贵人').map((h) => h.pillar)).toEqual(['年支'])
    expect(byName('羊刃').map((h) => h.pillar)).toEqual(['月支'])
    expect(byName('禄神').map((h) => h.pillar)).toEqual(['日支'])
    // 所有命中均不涉及时柱
    for (const h of c.shensha) expect(h.pillar.startsWith('时')).toBe(false)
  })
  it('旺衰置信度标注时辰未知；大运/流年仍完整输出', () => {
    expect(c.wuxing.strength.confidence).toContain('时辰未知')
    expect(c.dayun.steps).toHaveLength(10)
    expect(c.liunian).toHaveLength(101)
  })
})
