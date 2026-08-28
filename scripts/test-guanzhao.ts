import { readFileSync } from 'node:fs'
import { computeChartV2 } from '@contracts/bazi-core'
import { runGuanzhao } from '../src/lib/guanzhao'

async function main() {
  const env = readFileSync('.env', 'utf-8')
  const m = env.match(/VITE_DEEPSEEK_API_KEY=(\S+)/)
  const key = m ? m[1] : ''
  const chart = computeChartV2({
    calendar: 'solar', year: 2009, month: 8, day: 29, hour: 2, minute: 0,
    gender: 'male', useTrueSolarTime: false, dayRollover: 'zichu',
  })
  const summary = '八字：己丑 壬申 丙午 己丑（男命 2009-08-29 丑时）日主丙火，伤官驾杀格局；火土旺，金水弱。'
  const res = await runGuanzhao(summary, '小友', '最近对前路有些迷茫', key)
  console.log('观照长度:', res.content.length)
  console.log(res.content)
}
main().catch((e) => console.error('ERR:', String(e).slice(0, 300)))
