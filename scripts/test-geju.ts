import { computeChartV2 } from '@contracts/bazi-core'
import { gejuOf } from '../contracts/engines/masters-rules/geju-rules'

const cases = [
  { label: '1989 坤造（课口径：大偏印+大偏财）', inp: { calendar: 'solar', year: 1989, month: 8, day: 22, hour: 16, minute: 12, gender: 'female' } },
  { label: '1970 乾造（课口径：七杀格·伤官生财）', inp: { calendar: 'solar', year: 1970, month: 10, day: 12, hour: 9, minute: 16, gender: 'male' } },
  { label: '1993 坤造（印重身弱）', inp: { calendar: 'solar', year: 1993, month: 1, day: 4, hour: 12, minute: 43, gender: 'female' } },
]

for (const c of cases) {
  const chart = computeChartV2(c.inp as never) as never
  const g = gejuOf(chart)
  console.log(`【${c.label}】`)
  console.log(`  主格: ${g.main} | ${g.mainBasis}`)
  console.log(`  副格: ${g.vice ?? '无'} | ${g.viceBasis || '—'}`)
  console.log(`  用神: ${g.yongshen}`)
  console.log()
}
