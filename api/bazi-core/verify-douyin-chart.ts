/* eslint-disable @typescript-eslint/no-explicit-any */
// 命令：npx tsx api/bazi-core/verify-douyin-chart.ts
import { computeChartV2 } from '@contracts/bazi-core'

// 验证抖音截图命盘：己丑 壬申 丙午 己丑（2009 男命）
// 1. 找 2009 年 8 月的丙午日
for (let dd = 1; dd <= 31; dd++) {
  const c = computeChartV2({
    calendar: 'solar', year: 2009, month: 8, day: dd, hour: 2, minute: 0,
    gender: 'male', useTrueSolarTime: false, dayRollover: 'zichu',
  })
  const p = c.pillars as any
  const line = `${dd}: ${p.year?.ganzhi} ${p.month?.ganzhi} ${p.day?.ganzhi}`
  if (p.day?.ganzhi === '丙午') {
    const dayun = c.dayun as any
    const list = dayun?.list || []
    console.log('★ 命中', line, '| 时柱(丑时):', p.hour?.ganzhi)
    console.log('  起运:', dayun?.startAge, '岁 | 大运前5:', (list as any[]).slice(0, 5).map((x: any) => x.ganzhi).join(' '))
    console.log('  神煞(日柱):', JSON.stringify((c.shensha as any)?.byPillar?.day ?? c.shensha))
  } else if (dd % 5 === 0) {
    console.log(line)
  }
}
