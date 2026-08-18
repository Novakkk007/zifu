import { describe, expect, it } from 'vitest'
import { computeChartV2, type BirthInput } from '@contracts/bazi-core'
import { buildHepanReadingPrompt, buildHepanSummary } from './hepan-ai'

const personA: BirthInput = {
  calendar: 'solar',
  year: 1990,
  month: 3,
  day: 15,
  hour: 8,
  minute: 0,
  gender: 'male',
  useTrueSolarTime: false,
  dayRollover: 'zichu',
}

const personB: BirthInput = {
  ...personA,
  year: 1992,
  month: 10,
  day: 8,
  hour: 14,
  gender: 'female',
}

describe('合盘 AI 摘要与先生提示词', () => {
  const chartA = computeChartV2(personA)
  const chartB = computeChartV2(personB)
  const summary = buildHepanSummary(chartA, chartB)

  it('摘要包含双盘日主、五行分布、合冲与互补事实', () => {
    expect(summary).toContain(`甲方${chartA.dayMaster}（${chartA.dayMasterWuxing}）`)
    expect(summary).toContain(`乙方${chartB.dayMaster}（${chartB.dayMasterWuxing}）`)
    expect(summary).toContain('甲方五行分布：木')
    expect(summary).toContain('乙方五行分布：木')
    expect(summary).toContain('相合点：')
    expect(summary).toContain('相冲与磨合点：')
    expect(summary).toContain('五行互补线索：')
  })

  it('提示词固定先生口吻与关系合规红线', () => {
    const prompt = buildHepanReadingPrompt(summary)

    expect(prompt).toContain('先生口吻')
    expect(prompt).toContain('不评判婚姻吉凶')
    expect(prompt).toContain('不回答“配不配”')
    expect(prompt).toContain('不劝分、不劝合')
    expect(prompt).toContain('合盘看气质互补，相处看经营')
    expect(prompt).toContain(summary)
  })
})
