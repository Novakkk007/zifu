// 神煞对拍：真实生辰 → 完整排盘 → 输出全部神煞命中（用于与问真八字等权威排盘对照）
import { computeChartV2 } from '../../contracts/bazi-core/bazi'
import { SHENSHA_RULESET_VERSION } from '../../contracts/bazi-core/rules/shensha'

const cases: { name: string; y: number; m: number; d: number; h: number; g: 'male' | 'female' }[] = [
  { name: '1990-06-15 12:00 男', y: 1990, m: 6, d: 15, h: 12, g: 'male' },
  { name: '1988-01-24 03:00 女（腊月子时前后）', y: 1988, m: 1, d: 24, h: 3, g: 'female' },
  { name: '1975-11-03 21:00 男', y: 1975, m: 11, d: 3, h: 21, g: 'male' },
]

for (const c of cases) {
  console.log(`\n=== ${c.name} ===（神煞规则集 ${SHENSHA_RULESET_VERSION}）`)
  const chart = computeChartV2({
    calendar: 'solar',
    year: c.y,
    month: c.m,
    day: c.d,
    hour: c.h,
    minute: 0,
    gender: c.g,
  })
  console.log(`四柱：${chart.pillars.year.ganzhi} ${chart.pillars.month.ganzhi} ${chart.pillars.day.ganzhi} ${chart.pillars.hour?.ganzhi ?? '时柱未排'}`)
  if (chart.shensha.length === 0) {
    console.log('（无神煞命中）')
    continue
  }
  for (const h of chart.shensha) {
    console.log(`  ${h.name} → ${h.pillar} ${h.char}`)
  }
}
