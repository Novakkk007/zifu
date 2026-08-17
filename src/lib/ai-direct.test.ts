import { describe, it, expect } from 'vitest'
import { buildChartSummary, buildReadingPrompt } from './ai-direct'

describe('buildChartSummary（命盘结构化摘要，不含术语释义）', () => {
  it('公历命盘 → 四柱摘要', () => {
    const s = buildChartSummary({
      input: { calendar: 'solar', year: 1990, month: 6, day: 15, hour: 14 },
      pillars: {
        year: { stem: '庚', branch: '午' },
        month: { stem: '壬', branch: '午' },
        day: { stem: '戊', branch: '寅' },
        hour: { stem: '己', branch: '未' },
      },
    })
    expect(s).toContain('公历 1990年6月15日 14时')
    expect(s).toContain('年柱 庚午')
    expect(s).toContain('时柱 己未')
  })

  it('时辰不详降级', () => {
    const s = buildChartSummary({
      input: { calendar: 'solar', year: 2020, month: 1, day: 1, hour: null },
      pillars: { year: { stem: '己', branch: '亥' } },
    })
    expect(s).toContain('时辰不详')
  })

  it('不含术语释义字段（红线：术语数据不进 prompt）', () => {
    const s = buildChartSummary({
      input: { year: 1990, month: 6, day: 15 },
      pillars: {},
      glossary: { 长生: '十二长生之首……' }, // 即使有也不输出
    } as unknown)
    expect(s).not.toContain('十二长生')
  })
})

describe('buildReadingPrompt（红线：无确定性断言、无假引文）', () => {
  const p = buildReadingPrompt({ chartSummary: '命盘数据', persona: 'scholar', depth: 'pro' })

  it('包含文化解读约束', () => {
    expect(p).toContain('不做医疗、投资、法律等具体决策建议')
    expect(p).toContain('不给出确定性生死病灾断言')
    expect(p).toContain('不得编造古籍原文引文')
  })

  it('persona/depth 映射生效', () => {
    expect(p).toContain('格局框架')
    expect(p).toContain('篇幅舒展')
    const q = buildReadingPrompt({ chartSummary: 'x', persona: 'master', depth: 'quick' })
    expect(q).toContain('整体判断与关键提示')
    expect(q).toContain('篇幅精简')
  })

  it('未知 persona/depth 有默认兜底', () => {
    const r = buildReadingPrompt({ chartSummary: 'x', persona: 'unknown', depth: 'unknown' })
    expect(r).toContain('格局框架') // scholar 兜底
  })
})
