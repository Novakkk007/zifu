import { computeChartV2 } from '../contracts/bazi-core'
import { buildChartSummary } from '../src/lib/ai-direct'
import { buildRoundTablePrompt, parseRoundTable } from '../src/lib/roundtable'

async function main() {
  const inp = { calendar: 'solar' as const, year: 1989, month: 8, day: 22, hour: 16, minute: 12, gender: 'female' as const }
  const chart = computeChartV2(inp)
  if (!chart) {
    console.log('排盘失败')
    return
  }
  const summary = buildChartSummary(chart, inp)
  const prompt = buildRoundTablePrompt(summary, '今年运势与去留')
  const t0 = Date.now()
  const res = await fetch('https://zifu.pages.dev/api/roundtable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens: 9000 }),
  })
  const d = (await res.json()) as { content?: string; error?: string }
  if (d.error) {
    console.log('ERR:', d.error)
    return
  }
  const parsed = parseRoundTable(d.content ?? '')
  console.log(`耗时 ${((Date.now() - t0) / 1000).toFixed(0)}s | 开场: ${parsed.opening ? '有' : '无'} | 席位: ${parsed.seats.length} | 共识: ${parsed.consensus ? '有' : '无'} | 收束: ${parsed.closing ? '有' : '无'}`)
  console.log('--- 先生开场 ---')
  console.log(parsed.opening.slice(0, 150))
  console.log('--- 第1席 ---')
  console.log(parsed.seats[0]?.content.slice(0, 200))
  console.log('--- 共识 ---')
  console.log(parsed.consensus.slice(0, 200))
}

main().catch((e) => console.error('ERR', e))
