import { runRoundTable, parseRoundTable } from '../src/lib/roundtable'
import { readFileSync } from 'node:fs'
const env = readFileSync('.env', 'utf-8')
const m = env.match(/VITE_DEEPSEEK_API_KEY=(\S+)/)
const XIANSHENG_KEY = m ? m[1] : ''


async function main() {
  const summary =
    '八字：己丑 壬申 丙午 己丑（男命 2009-08-29 丑时）日主丙火，生于申月（七杀当令），年时双透伤官己土，伤官驾杀格局；火土旺，金水弱；大运逆行（阴年男命），当前庚午大运、丙午流年；神煞：天乙贵人、太极贵人、文昌、羊刃、阴差阳错。'
  const res = await runRoundTable(summary, undefined, XIANSHENG_KEY)
  console.log('原始长度:', res.content.length)
  const parsed = parseRoundTable(res.content)
  console.log('席位数:', parsed.seats.length)
  for (const s of parsed.seats) {
    console.log(' -', s.school, '|', s.content.length, '字')
  }
  console.log('共识:', parsed.consensus.slice(0, 200))
  console.log('收束:', parsed.closing.slice(0, 150))
  console.log('---第1席全文---')
  console.log(parsed.seats[0]?.content)
}
main().catch((e) => console.error('ERR:', String(e).slice(0, 300)))
