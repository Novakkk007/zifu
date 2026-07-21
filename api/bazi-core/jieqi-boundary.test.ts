/**
 * 节气边界测试：立春换年、惊蛰/清明换月（真实节气时刻来自 lunar-typescript）
 */
import { describe, expect, it } from 'vitest'
import { Solar } from 'lunar-typescript'
import { computeChartV2, getPrevNextJie, toPseudoMs } from '@contracts/bazi-core'
import type { BirthInput } from '@contracts/bazi-core'

const base = (y: number, m: number, d: number, h: number, mi = 0): BirthInput => ({
  calendar: 'solar',
  year: y,
  month: m,
  day: d,
  hour: h,
  minute: mi,
  gender: 'male',
  useTrueSolarTime: false,
  dayRollover: 'zichu',
})

describe('节气时刻（与 lunar-typescript 一致）', () => {
  it('2024 立春精确时刻为 2024-02-04 16:27（东八区）', () => {
    const { next } = getPrevNextJie(toPseudoMs({ year: 2024, month: 2, day: 4, hour: 12, minute: 0 }))
    expect(next.name).toBe('立春')
    expect(next.text.startsWith('2024-02-04 16:27')).toBe(true)
  })
})

describe('立春换年边界（2024-02-04 16:27:07）', () => {
  const before = computeChartV2(base(2024, 2, 4, 15, 30)) // 立春前约 1 小时
  const after = computeChartV2(base(2024, 2, 4, 17, 30)) // 立春后约 1 小时

  it('立春前 1 小时：年柱癸卯、月柱乙丑', () => {
    expect(before.pillars.year.ganzhi).toBe('癸卯')
    expect(before.pillars.month.ganzhi).toBe('乙丑')
  })
  it('立春后 1 小时：年柱甲辰、月柱丙寅', () => {
    expect(after.pillars.year.ganzhi).toBe('甲辰')
    expect(after.pillars.month.ganzhi).toBe('丙寅')
  })
  it('前后 1 小时年柱/月柱均不同（真实节气换年换月，非 1 月 1 日、非每月 6 日）', () => {
    expect(before.pillars.year.ganzhi).not.toBe(after.pillars.year.ganzhi)
    expect(before.pillars.month.ganzhi).not.toBe(after.pillars.month.ganzhi)
  })
})

describe('惊蛰换月边界（2023-03-06 04:36:14）', () => {
  it('惊蛰前：月柱甲寅；惊蛰后：月柱乙卯；年柱均为癸卯', () => {
    const before = computeChartV2(base(2023, 3, 6, 4, 0))
    const after = computeChartV2(base(2023, 3, 6, 5, 30))
    expect(before.pillars.year.ganzhi).toBe('癸卯')
    expect(after.pillars.year.ganzhi).toBe('癸卯')
    expect(before.pillars.month.ganzhi).toBe('甲寅')
    expect(after.pillars.month.ganzhi).toBe('乙卯')
  })
})

describe('清明换月边界（2023-04-05 09:13:04）', () => {
  it('清明前：月柱乙卯；清明后：月柱丙辰', () => {
    const before = computeChartV2(base(2023, 4, 5, 8, 30))
    const after = computeChartV2(base(2023, 4, 5, 10, 30))
    expect(before.pillars.month.ganzhi).toBe('乙卯')
    expect(after.pillars.month.ganzhi).toBe('丙辰')
  })
})

describe('与 lunar-typescript 精确干支交叉验证（年/月/日柱全等）', () => {
  const cases: [number, number, number, number][] = [
    [1990, 1, 15, 12],
    [2000, 6, 30, 8],
    [1985, 11, 22, 20],
    [2024, 12, 31, 6],
    [1976, 3, 8, 14],
  ]
  for (const [y, m, d, h] of cases) {
    it(`${y}-${m}-${d} ${h}时 四柱与库内精确算法一致`, () => {
      const chart = computeChartV2(base(y, m, d, h))
      const lunar = Solar.fromYmdHms(y, m, d, h, 0, 0).getLunar()
      expect(chart.pillars.year.ganzhi).toBe(lunar.getYearInGanZhiExact())
      expect(chart.pillars.month.ganzhi).toBe(lunar.getMonthInGanZhiExact())
      expect(chart.pillars.day.ganzhi).toBe(lunar.getDayInGanZhiExact())
      expect(chart.pillars.hour?.ganzhi).toBe(lunar.getTimeInGanZhi())
    })
  }
})
