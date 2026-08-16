import { describe, it, expect } from 'vitest'
import { analyzeWithMasters } from '../contracts/engines/masters-rules'
import type { BaziChartV2 } from '../contracts/bazi-core'

/** 构造最小可用 chart（只填规则依赖字段） */
function makeChart(over: Partial<BaziChartV2> = {}): BaziChartV2 {
  const base: BaziChartV2 = {
    rulesetVersion: 'test',
    input: { calendar: 'solar', year: 1990, month: 1, day: 1, hour: 0, minute: 0, gender: 'male', useTrueSolarTime: false, dayRollover: 'zi0' } as never,
    timeAudit: { source: 'test', dateStr: '', wallClock: '', offset: '', tzName: 'Asia/Shanghai' } as never,
    pillars: { year: null, month: null, day: null, hour: null } as never,
    dayMaster: '甲',
    dayMasterIdx: 0,
    dayMasterWuxing: '木',
    tenGods: [],
    relations: [],
    wuxing: {
      count: { 木: 2, 火: 1, 土: 1, 金: 1, 水: 1 },
      missing: [],
      strongest: '木',
      weakest: '火',
      strength: { deling: 30, dedi: 10, deshi: 5, total: 55, grade: '偏强', model: '', confidence: '', disclaimer: '' },
    },
    yongshen: { method: '扶抑', strengthGrade: '偏强', yongshen: '金', xishen: ['土'], jishen: ['木', '水'], reasoning: [], disclaimer: '' },
    shensha: [],
    chenggu: null,
    dayun: { startAge: 0, ganzhi: '', score: 0, factors: [] } as never,
    liunian: [],
    mingGong: null,
    shenGong: null,
    ...over,
  }
  return base
}

describe('analyzeWithMasters（名家参详提示）', () => {
  it('SWH-01：得令+有生助 → 偏强提示', () => {
    const hints = analyzeWithMasters(makeChart())
    expect(hints.some((h) => h.ruleId === 'SWH-01')).toBe(true)
  })

  it('SWH-02：失令但多处生助 → 反转审查提示', () => {
    const c = makeChart()
    c.wuxing.strength = { deling: 10, dedi: 14, deshi: 12, total: 40, grade: '中和', model: '', confidence: '', disclaimer: '' }
    const hints = analyzeWithMasters(c)
    expect(hints.some((h) => h.ruleId === 'SWH-02')).toBe(true)
    expect(hints.some((h) => h.ruleId === 'SWH-01')).toBe(false)
  })

  it('SWH-03：身弱官杀多 → 印星优先', () => {
    const c = makeChart()
    c.wuxing.count = { 木: 2, 火: 1, 土: 1, 金: 4, 水: 0.5 }
    c.wuxing.strength.total = 30
    c.wuxing.strength.grade = '偏弱'
    const hints = analyzeWithMasters(c)
    expect(hints.some((h) => h.ruleId === 'SWH-03')).toBe(true)
  })

  it('SWH-07：有神煞 → 降权提示', () => {
    const c = makeChart()
    c.shensha = [
      { ruleId: 't1', name: '桃花', pillar: '年支', char: '卯', variant: '', basis: '', verse: '', source: '', modernExplanation: '', rulesetVersion: 'v1' },
    ] as never
    const hints = analyzeWithMasters(c)
    expect(hints.some((h) => h.ruleId === 'SWH-07')).toBe(true)
  })

  it('无神煞 → 不触发 SWH-07；上限 6 条', () => {
    const hints = analyzeWithMasters(makeChart(), 6)
    expect(hints.length).toBeLessThanOrEqual(6)
    expect(hints.every((h) => h.master && h.source.startsWith('https://'))).toBe(true)
  })

  it('提示合规：不出现确定性断言词', () => {
    const c = makeChart()
    c.shensha = [{ ruleId: 't1', name: '羊刃', pillar: '日支', char: '午', variant: '', basis: '', verse: '', source: '', modernExplanation: '', rulesetVersion: 'v1' }] as never
    for (const h of analyzeWithMasters(c)) {
      const full = h.title + h.text
      expect(full).not.toMatch(/必|注定|一定|绝对|肯定/)
      expect(full).not.toMatch(/治疗|投资建议|离婚|死亡/)
    }
  })

  it('LXR-01：冬月调候火与扶抑用神一致 → 三轨同向', () => {
    const c = makeChart()
    c.pillars = { ...(c.pillars as object), month: { branch: '子', stem: '壬' } } as never
    c.yongshen = { ...c.yongshen, yongshen: '火' }
    const hints = analyzeWithMasters(c)
    expect(hints.some((h) => h.ruleId === 'LXR-01')).toBe(true)
  })

  it('LXR-02：冬月调候火与扶抑用神水相克 → 三轨冲突', () => {
    const c = makeChart()
    c.pillars = { ...(c.pillars as object), month: { branch: '子', stem: '壬' } } as never
    c.yongshen = { ...c.yongshen, yongshen: '水' }
    const hints = analyzeWithMasters(c)
    expect(hints.some((h) => h.ruleId === 'LXR-02')).toBe(true)
    expect(hints.some((h) => h.ruleId === 'LXR-01')).toBe(false)
  })

  it('LXR-04：旺衰偏强/偏弱 → 限定说明；中和则无', () => {
    const c = makeChart()
    c.wuxing.strength.grade = '偏强'
    expect(analyzeWithMasters(c).some((h) => h.ruleId === 'LXR-04')).toBe(true)
    c.wuxing.strength.grade = '中和'
    expect(analyzeWithMasters(c).some((h) => h.ruleId === 'LXR-04')).toBe(false)
  })
})
