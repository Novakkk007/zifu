/**
 * 神煞命中测试（v2 逐柱一条记录，list-all）+ 结构评分基本性质
 */
import { describe, expect, it } from 'vitest'
import {
  FACTOR_WEIGHTS,
  SCORES_DISCLAIMER,
  computeChartV2,
  computeLifeScores,
} from '@contracts/bazi-core'
import type { BirthInput } from '@contracts/bazi-core'

const mk = (over: Partial<BirthInput>): BirthInput => ({
  calendar: 'solar',
  year: 2021,
  month: 3,
  day: 7,
  hour: 12,
  minute: 0,
  gender: 'male',
  useTrueSolarTime: false,
  dayRollover: 'zichu',
  ...over,
})

// 2021-03-07 12:00 → 辛丑年 辛卯月 甲寅日 庚午时（已由历法库交叉验证）
describe('神煞命中（甲寅日 命例）', () => {
  const chart = computeChartV2(mk({}))
  expect(chart.pillars.day.ganzhi).toBe('甲寅')

  it('天乙贵人：甲日见丑 → 命中年支（单条记录）', () => {
    const hits = chart.shensha.filter((s) => s.name === '天乙贵人')
    expect(hits).toHaveLength(1)
    expect(hits[0].pillar).toBe('年支')
    expect(hits[0].char).toBe('丑')
    expect(hits[0].ruleId).toBe('shensha.tianyi.v1')
    expect(hits[0].verse).toContain('甲戊庚牛羊')
  })

  it('桃花（咸池）：寅午戌见卯 → 命中月支', () => {
    const hits = chart.shensha.filter((s) => s.name === '桃花（咸池）')
    expect(hits).toHaveLength(1)
    expect(hits[0].pillar).toBe('月支')
    expect(hits[0].char).toBe('卯')
  })

  it('驿马：寅午戌马在申 → 本例不命中', () => {
    expect(chart.shensha.find((s) => s.name === '驿马')).toBeUndefined()
  })

  it('羊刃：甲刃在卯 → 命中月支', () => {
    const hits = chart.shensha.filter((s) => s.name === '羊刃')
    expect(hits).toHaveLength(1)
    expect(hits[0].pillar).toBe('月支')
  })

  it('禄神：甲禄在寅 → 命中日支', () => {
    const hits = chart.shensha.filter((s) => s.name === '禄神')
    expect(hits).toHaveLength(1)
    expect(hits[0].pillar).toBe('日支')
  })

  it('每条命中记录字段完整（ruleId/pillar/char/verse/source/modernExplanation）', () => {
    expect(chart.shensha.length).toBeGreaterThan(0)
    for (const s of chart.shensha) {
      expect(s.ruleId).toMatch(/^shensha\..+\.v1$/)
      expect(s.pillar.length).toBeGreaterThan(0)
      expect(s.char.length).toBeGreaterThan(0)
      expect(s.verse.length).toBeGreaterThan(0)
      expect(s.source.length).toBeGreaterThan(0)
      expect(s.modernExplanation.length).toBeGreaterThan(0)
      expect(s.rulesetVersion).toBe('1.2.0')
    }
  })
})

describe('空亡（旬空）', () => {
  it('甲寅日属甲寅旬，子丑空：本例年支丑 → 命中年支', () => {
    const chart = computeChartV2(mk({}))
    const hits = chart.shensha.filter((s) => s.name === '空亡')
    expect(hits).toHaveLength(1)
    expect(hits[0].pillar).toBe('年支')
    expect(hits[0].char).toBe('丑')
  })
})

describe('神煞多命中 list-all（天乙贵人同时命中年支与日支）', () => {
  // 2023-04-05 12:00 → 癸卯年 丙辰月 癸巳日；癸日天乙在卯巳 → 年支卯 + 日支巳
  const chart = computeChartV2(mk({ year: 2023, month: 4, day: 5 }))
  it('排盘校验：癸卯年 癸巳日', () => {
    expect(chart.pillars.year.ganzhi).toBe('癸卯')
    expect(chart.pillars.day.ganzhi).toBe('癸巳')
  })
  it('天乙贵人产出两条独立命中记录（不合并布尔）', () => {
    const hits = chart.shensha.filter((s) => s.name === '天乙贵人')
    expect(hits).toHaveLength(2)
    expect(hits.map((h) => h.pillar).sort()).toEqual(['年支', '日支'].sort())
    expect(hits.map((h) => h.char).sort()).toEqual(['卯', '巳'].sort())
    expect(hits[0].ruleId).toBe(hits[1].ruleId)
  })
})

describe('结构评分', () => {
  it('每步大运与 0-100 岁流年均有 0-100 结构分，因子权重总和为 1', () => {
    const chart = computeChartV2(mk({ year: 1990, month: 6, day: 15, hour: 8 }))
    const scores = computeLifeScores(chart)
    expect(scores.disclaimer).toBe(SCORES_DISCLAIMER)
    expect(scores.dayunScores.length).toBe(10)
    expect(scores.liunianScores.length).toBe(101)
    const wSum = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(wSum).toBeCloseTo(1, 10)
    for (const d of scores.dayunScores) {
      expect(d.score).toBeGreaterThanOrEqual(0)
      expect(d.score).toBeLessThanOrEqual(100)
      expect(d.factors).toHaveLength(3)
      for (const f of d.factors) {
        expect(f.score).toBeGreaterThanOrEqual(0)
        expect(f.score).toBeLessThanOrEqual(100)
        expect(f.explanation.length).toBeGreaterThan(0)
      }
    }
    for (const l of scores.liunianScores) {
      expect(l.score).toBeGreaterThanOrEqual(0)
      expect(l.score).toBeLessThanOrEqual(100)
    }
  })
})
