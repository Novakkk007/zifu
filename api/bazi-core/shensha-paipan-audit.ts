// 神煞对拍：真实生辰 → 完整排盘 → 输出全部神煞命中（用于与问真八字等权威排盘对照）
// 命例库 v2：公开历史人物生辰（公历），供逐条对拍校准
import { computeChartV2 } from '../../contracts/bazi-core/bazi'
import { SHENSHA_RULESET_VERSION } from '../../contracts/bazi-core/rules/shensha'

const CASES = [
  { name: '测试甲', date: '1990-06-15', hour: 12, gender: 'male' },
  { name: '测试乙', date: '1975-11-03', hour: 21, gender: 'male' },
  { name: '测试丙', date: '2003-02-14', hour: 8, gender: 'female' },
  // 公开人物（历史/文化人物，生辰为通行记载）
  { name: '鲁迅', date: '1881-09-25', hour: null, gender: 'male' },
  { name: '梅兰芳', date: '1894-10-22', hour: null, gender: 'male' },
  { name: '孙中山', date: '1866-11-12', hour: null, gender: 'male' },
  { name: '王阳明', date: '1472-10-31', hour: null, gender: 'male' },
  { name: '苏东坡', date: '1037-01-08', hour: null, gender: 'male' },
  { name: '张居正', date: '1525-05-24', hour: null, gender: 'male' },
  { name: '曹雪芹', date: '1715-06-04', hour: null, gender: 'male' },
]

console.log(`=== 紫府神煞对拍（规则集 ${SHENSHA_RULESET_VERSION}）· ${CASES.length} 命例 ===\n`)
for (const c of CASES) {
  const chart = computeChartV2({
    calendar: 'solar',
    year: Number(c.date.slice(0, 4)),
    month: Number(c.date.slice(5, 7)),
    day: Number(c.date.slice(8, 10)),
    hour: c.hour,
    minute: 0,
    useTrueSolarTime: false,
    dayRollover: 'zichu',
    gender: c.gender as 'male' | 'female',
  })
  const p = chart.pillars
  const gz = `${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${p.day.stem}${p.day.branch}${p.hour ? ` ${p.hour.stem}${p.hour.branch}` : '（时不详）'}`
  console.log(`\n--- ${c.name} ${c.date} ${c.hour ?? '时辰不详'} ---`)
  console.log(`四柱：${gz}`)
  if (chart.shensha.length === 0) {
    console.log('  （无神煞命中）')
  } else {
    for (const s of chart.shensha) {
      console.log(`  ${s.name} → ${s.pillar}${s.char}`)
    }
  }
}
