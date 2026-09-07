import { computeChartV2 } from '../contracts/bazi-core'
import { daYunBrief } from '../contracts/engines/masters-rules/dayun-notes'
import { liuNianBrief, daYunLiuNianBriefs } from '../contracts/engines/masters-rules/liunian-notes'

const chart = computeChartV2({
  calendar: 'solar',
  year: 1989, month: 8, day: 22, hour: 16, minute: 12,
  gender: 'female', city: '杭州',
})

console.log('四柱:', chart.pillars.year.ganzhi, chart.pillars.month.ganzhi, chart.pillars.day.ganzhi, chart.pillars.hour.ganzhi)

// 大运简批（丙子运 35-45）
console.log('\n【大运简批】丙子运（35.4–45.4 岁）:')
console.log(daYunBrief(chart as never, { ganzhi: '丙子', startAge: 35, endAge: 45 }))
console.log(daYunBrief(chart as never, { ganzhi: '丁丑', startAge: 45, endAge: 55 }))

// 流年简批（丙子运内选几个流年）
console.log('\n【流年简批】:')
const dy = { ganzhi: '丙子' }
for (const gz of ['乙巳', '丙午', '丁未', '戊申']) {
  const b = liuNianBrief(chart as never, dy, { ganzhi: gz, year: 2025 }, 36)
  console.log(`${gz}年 [${b.tone}] ${b.brief}`)
}

// 大运内全 10 流年
console.log('\n【丙子运十年流年】:')
const all = daYunLiuNianBriefs(chart as never, { ganzhi: '丙子', startYear: 2024, endYear: 2033 }, 1989)
all.forEach((b) => console.log(`${b.ganzhi} ${b.age}岁 [${b.tone}] ${b.brief}`))
