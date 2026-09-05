import { computeChartV2 } from '../contracts/bazi-core'
import { buildChartSummary, buildReadingPrompt } from '../src/lib/ai-direct'

const inp = { calendar: 'solar' as const, year: 1989, month: 8, day: 22, hour: 16, minute: 12, gender: 'female' as const }
const chart = computeChartV2(inp)
if (!chart) {
  console.log('排盘失败')
} else {
  const summary = buildChartSummary(chart, inp)
  const prompt = buildReadingPrompt(summary, '请先生参详', 'scholar', 'pro')
  console.log('prompt 长度:', prompt.length)
  console.log('prompt 含摘要标记:', prompt.includes('命盘摘要'))
  console.log('prompt 含四柱:', prompt.includes('己巳'))
  console.log('--- prompt 前 800 字 ---')
  console.log(prompt.slice(0, 800))
}
