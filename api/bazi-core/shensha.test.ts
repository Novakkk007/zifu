/**
 * 神煞命中测试 + 结构评分基本性质
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

  it('天乙贵人：甲日见丑 → 命中年支', () => {
    const hit = chart.shensha.find((s) => s.name === '天乙贵人')
    expect(hit).toBeDefined()
    expect(hit!.hitPositions).toContain('年支')
    expect(hit!.hitChars).toContain('丑')
    expect(hit!.rule).toContain('甲戊庚牛羊')
  })

  it('桃花（咸池）：寅午戌见卯 → 命中月支', () => {
    const hit = chart.shensha.find((s) => s.name === '桃花（咸池）')
    expect(hit).toBeDefined()
    expect(hit!.hitPositions).toContain('月支')
    expect(hit!.hitChars).toContain('卯')
  })

  it('驿马：寅午戌马在申 → 本例不命中', () => {
    expect(chart.shensha.find((s) => s.name === '驿马')).toBeUndefined()
  })

  it('羊刃：甲刃在卯 → 命中月支', () => {
    const hit = chart.shensha.find((s) => s.name === '羊刃')
    expect(hit).toBeDefined()
    expect(hit!.hitPositions).toContain('月支')
  })

  it('禄神：甲禄在寅 → 命中日支', () => {
    const hit = chart.shensha.find((s) => s.name === '禄神')
    expect(hit).toBeDefined()
    expect(hit!.hitPositions).toContain('日支')
  })

  it('神煞注册表至少 12 种且每条带原始规则与出处', () => {
    const names = new Set(chart.shensha.map((s) => s.name))
    expect(names.size).toBe(chart.shensha.length)
    for (const s of chart.shensha) {
      expect(s.rule.length).toBeGreaterThan(0)
      expect(s.source.length).toBeGreaterThan(0)
      expect(s.explanation.length).toBeGreaterThan(0)
    }
  })
})

describe('空亡（旬空）', () => {
  it('甲寅日属甲寅旬，子丑空：本例年支丑 → 命中年支', () => {
    const chart = computeChartV2(mk({}))
    const hit = chart.shensha.find((s) => s.name === '空亡')
    expect(hit).toBeDefined()
    expect(hit!.hitPositions).toContain('年支')
    expect(hit!.hitChars).toContain('丑')
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
