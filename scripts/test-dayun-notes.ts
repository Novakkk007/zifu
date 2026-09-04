import { computeChartV2 } from '@contracts/bazi-core'
import { daYunNotes } from '../contracts/engines/masters-rules/dayun-notes'

// 课题案例：1970 冷柜厂主（乙木日主，辛卯大运=盖头路应触发）
const chart = computeChartV2({
  calendar: 'solar', year: 1970, month: 10, day: 12, hour: 9, minute: 16,
  gender: 'male', useTrueSolarTime: false, dayRollover: 'zichu',
}) as never
// 辛卯运（盖头：辛金克卯木）
console.log('辛卯运:', JSON.stringify(daYunNotes(chart as never, { ganzhi: '辛卯' })))
// 壬辰运（壬水生乙——无盖头；辰与日支丑——不冲）
console.log('壬辰运:', JSON.stringify(daYunNotes(chart as never, { ganzhi: '壬辰' })))
// 庚寅运（庚克寅？庚金克寅木=盖头；寅=申子辰马在寅——1970 年支戌/日支丑——丑马在亥、戌马在申——寅非驿马）
console.log('庚寅运:', JSON.stringify(daYunNotes(chart as never, { ganzhi: '庚寅' })))
// 1989 女命（甲木日主——己巳年——巳马在亥——辛亥运应触发驿马）
const c2 = computeChartV2({
  calendar: 'solar', year: 1989, month: 8, day: 22, hour: 16, minute: 12,
  gender: 'female', useTrueSolarTime: false, dayRollover: 'zichu',
}) as never
console.log('1989 辛亥运(驿马+截脚?):', JSON.stringify(daYunNotes(c2, { ganzhi: '辛亥' })))
console.log('1989 丙子运:', JSON.stringify(daYunNotes(c2, { ganzhi: '丙子' })))
console.log('1989 戊寅运(财坏印盘身弱+财):', JSON.stringify(daYunNotes(c2, { ganzhi: '戊寅' })))
