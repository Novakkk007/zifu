import { describe, expect, it } from 'vitest'
import { zodiacClashOf, ZODIAC } from '../../contracts/engines/daily-core/index'

describe('生肖相冲（CBL-03）', () => {
  it('六冲对全部命中：子午/丑未/寅申/卯酉/辰戌/巳亥', () => {
    const clashes: [number, string][] = [
      [0, '马'], // 子午
      [1, '羊'], // 丑未
      [2, '猴'], // 寅申
      [3, '鸡'], // 卯酉
      [4, '狗'], // 辰戌
      [5, '猪'], // 巳亥
      [6, '鼠'], // 午子
      [7, '牛'], // 未丑
      [8, '虎'], // 申寅
      [9, '兔'], // 酉卯
      [10, '龙'], // 戌辰
      [11, '蛇'], // 亥巳
    ]
    for (const [branch, zod] of clashes) {
      expect(zodiacClashOf(branch, zod as (typeof ZODIAC)[number]), `日支${branch} 生肖${zod}`).toBe(zod)
    }
  })

  it('非冲组合返回 null', () => {
    expect(zodiacClashOf(0, '鼠')).toBeNull()
    expect(zodiacClashOf(2, '马')).toBeNull()
    expect(zodiacClashOf(5, '牛')).toBeNull()
  })

  it('非法生肖返回 null（不代填八字）', () => {
    expect(zodiacClashOf(0, 'x' as never)).toBeNull()
  })
})
