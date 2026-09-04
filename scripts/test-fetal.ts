import { computeChartV2 } from '../contracts/bazi-core'

// 胎元验证：1989 盘月柱壬申 → 胎元应为癸亥（手册附录 A 确认）
const chart = computeChartV2({
  calendar: 'solar', year: 1989, month: 8, day: 22, hour: 16, minute: 12, gender: 'female',
} as never) as { fetalOrigin: { ganzhi: string; nayin: string } | null }
console.log('1989 胎元:', chart.fetalOrigin?.ganzhi, '纳音:', chart.fetalOrigin?.nayin, '| 期望: 癸亥 大海水')

// 1993 盘月柱壬子 → 胎元癸卯
const c2 = computeChartV2({
  calendar: 'solar', year: 1993, month: 1, day: 4, hour: 12, minute: 43, gender: 'female',
} as never) as { fetalOrigin: { ganzhi: string } | null }
console.log('1993 胎元:', c2.fetalOrigin?.ganzhi, '| 期望: 癸卯')

// 1970 盘月柱丙戌 → 胎元丁丑
const c3 = computeChartV2({
  calendar: 'solar', year: 1970, month: 10, day: 12, hour: 9, minute: 16, gender: 'male',
} as never) as { fetalOrigin: { ganzhi: string } | null }
console.log('1970 胎元:', c3.fetalOrigin?.ganzhi, '| 期望: 丁丑')
