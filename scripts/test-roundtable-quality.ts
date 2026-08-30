import { readFileSync } from 'node:fs'
import { runRoundTable, parseRoundTable } from '../src/lib/roundtable'

async function main() {
  const env = readFileSync('.env', 'utf-8')
  const m = env.match(/VITE_DEEPSEEK_API_KEY=(\S+)/)
  const key = m ? m[1] : ''
  const summary =
    '八字：己丑 壬申 丙午 己丑（男命 2009-08-29 丑时）日主丙火，伤官驾杀格局；火土旺，金水弱。大运顺行，早年己巳/戊辰。'
  const res = await runRoundTable(summary, '想看看学业与前路', key)
  const parsed = parseRoundTable(res.content)
  console.log('席位数:', parsed.seats.length, '| 共识:', parsed.consensus ? parsed.consensus.length + '字' : '无', '| 收束:', parsed.closing ? parsed.closing.length + '字' : '无')
  for (const s of parsed.seats) {
    console.log(`\n【${s.school}】${s.content.slice(0, 120)}...`)
  }
}
main().catch((e) => console.error('ERR:', String(e).slice(0, 200)))
