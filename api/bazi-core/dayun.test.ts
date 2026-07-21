/**
 * 大运顺逆与起运岁数测试
 */
import { describe, expect, it } from 'vitest'
import { JIAZI, computeChartV2 } from '@contracts/bazi-core'
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

describe('大运顺逆（以年干阴阳 + 性别）', () => {
  it('阳年男（2024 甲辰）顺排', () => {
    const c = computeChartV2(mk({ gender: 'male' }))
    expect(c.pillars.year.stem).toBe('甲')
    expect(c.dayun.forward).toBe(true)
  })
  it('阳年女逆排', () => {
    const c = computeChartV2(mk({ gender: 'female' }))
    expect(c.dayun.forward).toBe(false)
  })
  it('阴年男（2023 癸卯）逆排', () => {
    const c = computeChartV2(mk({ year: 2023, month: 5, day: 10 }))
    expect(c.pillars.year.stem).toBe('癸')
    expect(c.dayun.forward).toBe(false)
  })
  it('阴年女顺排', () => {
    const c = computeChartV2(mk({ year: 2023, month: 5, day: 10, gender: 'female' }))
    expect(c.dayun.forward).toBe(true)
  })
})

describe('大运干支序列与起运岁数', () => {
  it('顺排第一步 = 月柱后一甲子；逆排 = 月柱前一甲子', () => {
    const fwd = computeChartV2(mk({}))
    const monthJz = fwd.pillars.month.jiaziIdx
    expect(fwd.dayun.steps[0].jiaziIdx).toBe((monthJz + 1) % 60)
    expect(fwd.dayun.steps[1].jiaziIdx).toBe((monthJz + 2) % 60)

    const bwd = computeChartV2(mk({ gender: 'female' }))
    expect(bwd.dayun.steps[0].jiaziIdx).toBe((monthJz + 59) % 60)
  })

  it('起运岁数在合理区间 [0, 10]，且 = 到节气天数 ÷ 3（1 位小数）', () => {
    const samples: [number, number, number][] = [
      [2024, 5, 10],
      [2023, 1, 20],
      [1990, 12, 31],
      [2000, 2, 4],
      [1988, 7, 7],
    ]
    for (const [y, m, d] of samples) {
      const c = computeChartV2(mk({ year: y, month: m, day: d }))
      expect(c.dayun.startAge).toBeGreaterThanOrEqual(0)
      // 三节折一年：生于节后即刻顺排至下一节（约 31 天）≈ 10.4 岁，传统上限在此
      expect(c.dayun.startAge).toBeLessThan(11)
      const expected = Math.round((c.dayun.daysToJie / 3) * 10) / 10
      expect(c.dayun.startAge).toBe(expected)
      expect(c.dayun.daysToJie).toBeGreaterThanOrEqual(0)
      expect(c.dayun.daysToJie).toBeLessThan(32)
      expect(c.dayun.refJieName.length).toBeGreaterThan(0)
    }
  })

  it('每步 10 年，起止年龄连续，干支不重复', () => {
    const c = computeChartV2(mk({}))
    expect(c.dayun.steps.length).toBe(10)
    for (let i = 0; i < c.dayun.steps.length; i += 1) {
      const s = c.dayun.steps[i]
      expect(s.endAge - s.startAge).toBeCloseTo(10, 5)
      if (i > 0) expect(s.startAge).toBe(c.dayun.steps[i - 1].endAge)
    }
    expect(new Set(c.dayun.steps.map((s) => s.ganzhi)).size).toBe(10)
    // 当前大运至多一步（2024 年生人当前可能尚未起运）
    expect(c.dayun.steps.filter((s) => s.isCurrent).length).toBeLessThanOrEqual(1)
  })
})

describe('流年', () => {
  it('覆盖 0-100 岁，干支按 (year-4)%60，含当前流年标记', () => {
    const c = computeChartV2(mk({ year: 1990 }))
    expect(c.liunian.length).toBe(101)
    expect(c.liunian[0].year).toBe(1990)
    expect(c.liunian[0].age).toBe(0)
    expect(c.liunian[0].ganzhi).toBe('庚午')
    expect(c.liunian[100].year).toBe(2090)
    const nowYear = new Date().getFullYear()
    const current = c.liunian.filter((l) => l.isCurrent)
    expect(current).toHaveLength(1)
    expect(current[0].year).toBe(nowYear)
    expect(current[0].ganzhi).toBe(JIAZI[(((nowYear - 4) % 60) + 60) % 60])
  })
})
