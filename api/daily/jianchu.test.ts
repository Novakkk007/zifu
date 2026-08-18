import { describe, expect, it } from 'vitest'
import { Lunar } from 'lunar-typescript'
import { JIANCHU_NAMES, jianchuOf } from '../../contracts/engines/daily-core/index'

describe('建除十二神', () => {
  it('正月建寅：寅日起建', () => {
    expect(jianchuOf(2, 1)).toMatchObject({ name: '建' })
  })

  it('从月建日逐日顺行十二值', () => {
    const values = Array.from({ length: 12 }, (_, offset) => jianchuOf(2 + offset, 1).name)
    expect(values).toEqual(JIANCHU_NAMES)
  })

  it('经过十二日后重新起建', () => {
    expect(jianchuOf(2, 1).name).toBe('建')
    expect(jianchuOf(14, 1).name).toBe('建')
  })

  it('腊月月建在丑：丑日起建', () => {
    expect(jianchuOf(1, 12).name).toBe('建')
  })

  it('腊月到正月按新月建复位，而非沿旧月机械顺行', () => {
    const lastDayOfTwelfthMonth = Lunar.fromYmd(2025, 12, 29)
    const firstDayOfFirstMonth = Lunar.fromYmd(2026, 1, 1)

    expect(lastDayOfTwelfthMonth.getDayInGanZhi()).toBe('辛酉')
    expect(firstDayOfFirstMonth.getDayInGanZhi()).toBe('壬戌')
    expect(jianchuOf(lastDayOfTwelfthMonth).name).toBe('成')
    expect(jianchuOf(firstDayOfFirstMonth).name).toBe('成')
  })

  it('闰月沿用同名月的月建', () => {
    expect(jianchuOf(7, -6)).toEqual(jianchuOf(7, 6))
  })

  it('返回传统含义且不含吉凶断言', () => {
    const value = jianchuOf(3, 1)
    expect(value).toEqual({ name: '除', meaning: '传统称“除旧布新”，象征清除与吐故纳新。' })
    expect(value.meaning).not.toMatch(/吉日|凶日|大吉|大凶/)
  })

  it('拒绝缺失月份或越界输入', () => {
    expect(() => jianchuOf(2, 0)).toThrow(RangeError)
    expect(() => jianchuOf(60, 1)).toThrow(RangeError)
  })
})
