/**
 * 换日规则、真太阳时、农历闰月、确定性 测试
 */
import { describe, expect, it } from 'vitest'
import {
  JIAZI,
  computeChartV2,
  computeLifeScores,
  equationOfTimeMinutes,
  toPseudoMs,
} from '@contracts/bazi-core'
import type { BirthInput } from '@contracts/bazi-core'

const mk = (over: Partial<BirthInput>): BirthInput => ({
  calendar: 'solar',
  year: 1990,
  month: 5,
  day: 10,
  hour: 23,
  minute: 30,
  gender: 'male',
  useTrueSolarTime: false,
  dayRollover: 'zichu',
  ...over,
})

describe('子时换日规则', () => {
  const zichu = computeChartV2(mk({ dayRollover: 'zichu' }))
  const midnight = computeChartV2(mk({ dayRollover: 'midnight' }))

  it('zichu 规则下 23:30 → 次日日柱', () => {
    expect(zichu.pillars.day.jiaziIdx).toBe((midnight.pillars.day.jiaziIdx + 1) % 60)
  })
  it('midnight 规则下 23:30 → 当日日柱（与次日不同）', () => {
    expect(midnight.pillars.day.jiaziIdx).not.toBe(zichu.pillars.day.jiaziIdx)
    // 午夜规则的日柱 = 当天日柱，与库内连续纪日一致（1990-05-10 为乙亥日）
    expect(midnight.pillars.day.ganzhi).toBe('乙亥')
    expect(zichu.pillars.day.ganzhi).toBe('丙子')
  })
  it('时柱按换日后的日干五鼠遁起：zichu 丙子日子时为戊子', () => {
    expect(zichu.pillars.hour?.ganzhi).toBe('戊子')
    // midnight 乙亥日子时：乙庚丙子 → 丙子
    expect(midnight.pillars.hour?.ganzhi).toBe('丙子')
  })
  it('TimeAudit 记录换日规则', () => {
    expect(zichu.timeAudit.dayRollover).toBe('zichu')
    expect(midnight.timeAudit.dayRollover).toBe('midnight')
  })
})

describe('真太阳时修正', () => {
  it('均时差近似公式输出非零且量级合理（±20 分钟内）', () => {
    const eot = equationOfTimeMinutes(toPseudoMs({ year: 2024, month: 2, day: 11, hour: 12, minute: 0 }))
    expect(eot).not.toBe(0)
    expect(Math.abs(eot)).toBeLessThan(20)
    // 2 月中旬均时差约 -14 分钟
    expect(eot).toBeLessThan(-10)
  })

  it('经度 90°（乌鲁木齐）vs 120°：经度修正 -120 分钟，时柱改变', () => {
    const at120 = computeChartV2(
      mk({ year: 1995, month: 6, day: 15, hour: 12, minute: 30, useTrueSolarTime: true, longitude: 120 }),
    )
    const at90 = computeChartV2(
      mk({ year: 1995, month: 6, day: 15, hour: 12, minute: 30, useTrueSolarTime: true, longitude: 90 }),
    )
    expect(at90.timeAudit.longitudeCorrectionMin).toBe(-120)
    // 12:30 北京时 = 午时；真太阳时约 10:30 → 巳时
    expect(at120.pillars.hour?.branch).toBe('午')
    expect(at90.pillars.hour?.branch).toBe('巳')
    expect(at120.pillars.hour?.ganzhi).not.toBe(at90.pillars.hour?.ganzhi)
  })

  it('TimeAudit 输出标准时间与真太阳时，均时差非零', () => {
    const chart = computeChartV2(mk({ useTrueSolarTime: true, longitude: 114 }))
    expect(chart.timeAudit.useTrueSolarTime).toBe(true)
    expect(chart.timeAudit.standardTime).not.toBe(chart.timeAudit.effectiveTime)
    expect(chart.timeAudit.equationOfTimeMin).not.toBe(0)
    expect(chart.timeAudit.rulesetVersion).toBe('1.3.0')
    expect(chart.timeAudit.eotFormulaVersion).toContain('EoT')
  })

  it('不启用真太阳时时，排盘时刻 = 标准时间', () => {
    const chart = computeChartV2(mk({ useTrueSolarTime: false, longitude: 90 }))
    expect(chart.timeAudit.standardTime).toBe(chart.timeAudit.effectiveTime)
  })
})

describe('农历输入与闰月（2023 闰二月）', () => {
  it('闰二月十五 → 公历 2023-04-05', () => {
    const chart = computeChartV2(
      mk({ calendar: 'lunar', year: 2023, month: 2, day: 15, hour: 12, minute: 0, isLeapMonth: true }),
    )
    expect(chart.timeAudit.isLeapMonth).toBe(true)
    expect(chart.timeAudit.lunarMonth).toBe(-2)
    expect(chart.timeAudit.standardTime.startsWith('2023-04-05')).toBe(true)
  })

  it('非闰二月十五 → 公历 2023-03-06，且与对应公历输入排盘一致', () => {
    const lunar = computeChartV2(
      mk({ calendar: 'lunar', year: 2023, month: 2, day: 15, hour: 12, minute: 0, isLeapMonth: false }),
    )
    expect(lunar.timeAudit.standardTime.startsWith('2023-03-06')).toBe(true)
    const solar = computeChartV2(mk({ year: 2023, month: 3, day: 6, hour: 12, minute: 0 }))
    expect(lunar.pillars.year.ganzhi).toBe(solar.pillars.year.ganzhi)
    expect(lunar.pillars.month.ganzhi).toBe(solar.pillars.month.ganzhi)
    expect(lunar.pillars.day.ganzhi).toBe(solar.pillars.day.ganzhi)
    expect(lunar.pillars.hour?.ganzhi).toBe(solar.pillars.hour?.ganzhi)
  })
})

describe('确定性', () => {
  it('同输入两次计算 JSON 全等（含结构评分）', () => {
    const input = mk({ year: 1988, month: 8, day: 18, hour: 9, minute: 45, useTrueSolarTime: true, longitude: 116.4 })
    const a = computeChartV2(input)
    const b = computeChartV2(input)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(JSON.stringify(computeLifeScores(a))).toBe(JSON.stringify(computeLifeScores(b)))
  })

  it('六十甲子表完整无重复', () => {
    expect(JIAZI).toHaveLength(60)
    expect(new Set(JIAZI).size).toBe(60)
    expect(JIAZI[0]).toBe('甲子')
    expect(JIAZI[59]).toBe('癸亥')
  })
})
