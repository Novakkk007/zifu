import { describe, it, expect } from 'vitest'
import { sleepAdviceOf, STEMS } from '../contracts/engines/daily-core'

describe('sleepAdviceOf（安寝时令 · 五行养生文化参考）', () => {
  it('十个日干都有安寝主题（覆盖完整）', () => {
    for (const stem of STEMS) {
      const a = sleepAdviceOf(stem)
      expect(a.theme).toContain('日')
      expect(a.tip.length).toBeGreaterThan(10)
      expect(a.hourHint).toContain('当令')
    }
  })

  it('五行归类正确（甲乙木/丙丁火/戊己土/庚辛金/壬癸水）', () => {
    expect(sleepAdviceOf('甲').theme).toContain('木')
    expect(sleepAdviceOf('丙').theme).toContain('火')
    expect(sleepAdviceOf('戊').theme).toContain('土')
    expect(sleepAdviceOf('庚').theme).toContain('金')
    expect(sleepAdviceOf('壬').theme).toContain('水')
  })

  it('内容合规：不出现医疗断言词', () => {
    for (const stem of STEMS) {
      const a = sleepAdviceOf(stem)
      const full = a.theme + a.tip + a.hourHint
      expect(full).not.toMatch(/治疗|治愈|疗效|诊断/)
    }
  })
})
