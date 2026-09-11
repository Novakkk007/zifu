/**
 * 战前基线演示：紫府引擎排盘 + 输出摘要（临时脚本）
 * 目标：① 枚举 1988 年寅月各日找「戊辰 甲寅 丙午」四柱 ② 输出该盘完整摘要
 */
import { computeChartV2 } from '../contracts/bazi-core/index'

type P = { [k: string]: unknown } | null

function fmt(p: P): string {
  if (!p) return '——'
  const s = (p as any).stemName ?? (p as any).stem ?? (p as any).gan ?? '?'
  const b = (p as any).branchName ?? (p as any).branch ?? (p as any).zhi ?? '?'
  return `${s}${b}`
}

// 1) 先看了一眼 2/4 的结构
const probe = computeChartV2({
  calendar: 'solar', year: 1988, month: 2, day: 4, hour: 4, minute: 0,
  gender: 'male', ianaTimezone: 'Asia/Shanghai',
} as any)
console.log('=== probe 1988-02-04 04:00 ===')
console.log('year :', JSON.stringify(probe.pillars.year))
console.log('month:', JSON.stringify(probe.pillars.month))
console.log('day  :', JSON.stringify(probe.pillars.day))
console.log('hour :', JSON.stringify(probe.pillars.hour))

// 2) 枚举立春后全寅月，找 戊辰/甲寅/丙午
console.log('\n=== 枚举 1988-02-04 ~ 1988-03-04（庚寅时 04:00）===')
let hit: { day: number; chart: any } | null = null
for (let d = 4; d <= 31; d++) {
  let c: any
  try {
    c = computeChartV2({
      calendar: 'solar', year: 1988, month: 2, day: d, hour: 4, minute: 0,
      gender: 'male', ianaTimezone: 'Asia/Shanghai',
    } as any)
  } catch (e) { continue }
  const line = [c.pillars.year, c.pillars.month, c.pillars.day, c.pillars.hour].map(fmt).join(' ')
  console.log(`${d}日: ${line}`)
  if (fmt(c.pillars.day) === '丙午' && fmt(c.pillars.month) === '甲寅') hit = { day: d, chart: c }
}
for (let d = 1; d <= 4; d++) {
  let c: any
  try {
    c = computeChartV2({
      calendar: 'solar', year: 1988, month: 3, day: d, hour: 4, minute: 0,
      gender: 'male', ianaTimezone: 'Asia/Shanghai',
    } as any)
  } catch (e) { continue }
  const line = [c.pillars.year, c.pillars.month, c.pillars.day, c.pillars.hour].map(fmt).join(' ')
  console.log(`3/${d}: ${line}`)
  if (fmt(c.pillars.day) === '丙午' && fmt(c.pillars.month) === '甲寅') hit = { day: 100 + d, chart: c }
}

if (!hit) { console.log('\n未找到丙午日'); process.exit(0) }

// 3) 输出命中盘的完整摘要
const c = hit.chart
const day = hit.day > 100 ? `1988-03-${hit.day - 100}` : `1988-02-${hit.day}`
console.log(`\n===== 命中：${day} 04:00 寅时 乾造 =====`)
console.log('四柱   :', [c.pillars.year, c.pillars.month, c.pillars.day, c.pillars.hour].map(fmt).join(' '))
console.log('日主   :', c.dayMaster, c.dayMasterWuxing)
console.log('旺衰   :', JSON.stringify(c.wuxing?.strength ?? c.wuxing, null, 0).slice(0, 400))
console.log('用神   :', JSON.stringify(c.yongshen, null, 0).slice(0, 400))
console.log('神煞   :', JSON.stringify((c.shensha || []).map((s: any) => s.name ?? s.id ?? s), null, 0).slice(0, 400))
console.log('大运   :', JSON.stringify(c.dayun, null, 0).slice(0, 600))
console.log('十神(节选):', JSON.stringify((c.tenGods || []).slice(0, 12), null, 0).slice(0, 600))
console.log('合冲刑害(节选):', JSON.stringify((c.relations || []).slice(0, 8), null, 0).slice(0, 400))

import { writeFileSync } from 'fs'
writeFileSync('/tmp/zifu_paipan_demo.json', JSON.stringify(c, null, 2))
console.log('\n完整 JSON 已存 /tmp/zifu_paipan_demo.json')
