import { computeChartV2 } from '../contracts/bazi-core'
import { buildChartSummary, buildReadingPrompt } from '../src/lib/ai-direct'

async function main() {
  const inp = { calendar: 'solar' as const, year: 1989, month: 8, day: 22, hour: 16, minute: 12, gender: 'female' as const }
  const chart = computeChartV2(inp)
  if (!chart) {
    console.log('排盘失败')
    return
  }
  const summary = buildChartSummary(chart, inp)
  console.log('摘要长度:', summary.length)
  const prompt = buildReadingPrompt({ chartSummary: summary, persona: 'scholar', depth: 'pro' })
  const res = await fetch('https://zifu.pages.dev/api/guest-reading', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens: 6000 }),
  })
  const d = (await res.json()) as { content?: string; model?: string; error?: string }
  if (d.error) {
    console.log('ERR:', d.error)
    return
  }
  console.log('=== 线上先生详批（' + d.model + '）===')
  console.log((d.content ?? '').slice(0, 800))
}

main().catch((e) => console.error('ERR', e))
