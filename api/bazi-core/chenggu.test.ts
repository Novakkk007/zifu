/**
 * 称骨测试：已知生辰 → 已知总骨重（按公开称骨表手工核算），查表失败返回 null
 */
import { describe, expect, it } from 'vitest'
import { chengguRules, computeChartV2 } from '@contracts/bazi-core'
import type { BirthInput } from '@contracts/bazi-core'

const lunar = (over: Partial<BirthInput>): BirthInput => ({
  calendar: 'lunar',
  year: 1984,
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  gender: 'male',
  useTrueSolarTime: false,
  dayRollover: 'zichu',
  ...over,
})

describe('称骨计重（手工核算 fixture）', () => {
  it('甲子年正月初一日子时 = 12+6+5+16 = 39 钱（三两九钱）', () => {
    const c = computeChartV2(lunar({}))
    expect(c.chenggu).not.toBeNull()
    expect(c.chenggu!.yearGanzhi).toBe('甲子')
    expect(c.chenggu!.yearQian).toBe(12)
    expect(c.chenggu!.monthQian).toBe(6)
    expect(c.chenggu!.dayQian).toBe(5)
    expect(c.chenggu!.hourQian).toBe(16)
    expect(c.chenggu!.totalQian).toBe(39)
    expect(c.chenggu!.totalText).toBe('三两九钱')
    expect(c.chenggu!.verse).toContain('此命终身运不通')
  })

  it('庚午年五月廿三日午时 = 9+5+8+10 = 32 钱（三两二钱）', () => {
    const c = computeChartV2(lunar({ year: 1990, month: 5, day: 23, hour: 12 }))
    expect(c.chenggu!.yearGanzhi).toBe('庚午')
    expect(c.chenggu!.totalQian).toBe(32)
    expect(c.chenggu!.totalText).toBe('三两二钱')
    expect(c.chenggu!.verse).toContain('初年运蹇事难谋')
  })

  it('壬辰年腊月廿九日亥时 = 10+5+16+6 = 37 钱（三两七钱）', () => {
    const c = computeChartV2(lunar({ year: 2012, month: 12, day: 29, hour: 22 }))
    expect(c.chenggu!.yearGanzhi).toBe('壬辰')
    expect(c.chenggu!.totalQian).toBe(37)
    expect(c.chenggu!.totalText).toBe('三两七钱')
    expect(c.chenggu!.verse).toContain('此命般般事不成')
  })

  it('农历闰月按当月计（2023 闰二月十五午时：癸卯12+二月7+十五10+午10=39）', () => {
    const c = computeChartV2(
      lunar({ year: 2023, month: 2, day: 15, hour: 12, isLeapMonth: true }),
    )
    expect(c.chenggu).not.toBeNull()
    expect(c.chenggu!.yearGanzhi).toBe('癸卯')
    expect(c.chenggu!.monthQian).toBe(7)
    expect(c.chenggu!.totalQian).toBe(39)
  })
})

describe('称骨查表失败返回 null（不伪造）', () => {
  it('时辰未知（hour=null）→ 称骨为 null', () => {
    const c = computeChartV2(lunar({ hour: null }))
    expect(c.chenggu).toBeNull()
  })
  it('计重表越界查询一律返回 null', () => {
    expect(chengguRules.lookupYearQian(60)).toBeNull()
    expect(chengguRules.lookupYearQian(-1)).toBeNull()
    expect(chengguRules.lookupMonthQian(0)).toBeNull()
    expect(chengguRules.lookupMonthQian(13)).toBeNull()
    expect(chengguRules.lookupDayQian(31)).toBeNull()
    expect(chengguRules.lookupDayQian(2.5)).toBeNull()
    expect(chengguRules.lookupHourQian(12)).toBeNull()
    expect(chengguRules.lookupVerse(20)).toBeNull()
    expect(chengguRules.lookupVerse(73)).toBeNull()
  })
  it('批语表覆盖 二两一…七两二 全区间', () => {
    for (let q = 21; q <= 72; q += 1) {
      expect(chengguRules.lookupVerse(q), `缺 ${q} 钱批语`).not.toBeNull()
    }
  })
})
