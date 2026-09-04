import { describe, it, expect } from 'vitest'
import { computeChartV2 } from '@contracts/bazi-core'
import { gejuOf } from '@contracts/engines/masters-rules/geju-rules'

function chartOf(inp: Record<string, unknown>) {
  return computeChartV2(inp as never) as never
}

describe('geju-rules 取格（课题口径）', () => {
  it('1989 坤造 → 偏印格（大偏印）+ 大偏财格', () => {
    const g = gejuOf(chartOf({ calendar: 'solar', year: 1989, month: 8, day: 22, hour: 16, minute: 12, gender: 'female' }))
    expect(g.main).toContain('偏印格')
    expect(g.vice).toBe('大偏财格')
    expect(g.yongshen).toContain('金通关')
  })
  it('1970 乾造 → 七杀格（大七杀格）+ 大偏财格', () => {
    const g = gejuOf(chartOf({ calendar: 'solar', year: 1970, month: 10, day: 12, hour: 9, minute: 16, gender: 'male' }))
    expect(g.main).toContain('七杀格')
    expect(g.vice).toBe('大偏财格')
  })
  it('1993 坤造 → 偏印格（月令主气取格）', () => {
    const g = gejuOf(chartOf({ calendar: 'solar', year: 1993, month: 1, day: 4, hour: 12, minute: 43, gender: 'female' }))
    expect(g.main).toContain('偏印格')
    expect(g.mainBasis).toContain('月令主气')
  })
})
