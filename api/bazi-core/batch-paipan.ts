/**
 * 批量命例排盘对拍（本地计算，零 token）
 * 读 cases/found-2026-08-27-gh.json → 用 bazi-core 排盘 → 输出四柱/日主/大运 → cases/paipan-results/
 * 用法：npx tsx api/bazi-core/batch-paipan.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { computeChartV2 } from '@contracts/bazi-core'
import type { BirthInput } from '@contracts/bazi-core'

const SRC = 'F:/紫府文件/tasks/cases/found-2026-08-27-gh.json'
const OUT = 'F:/紫府文件/tasks/cases/paipan-results'
mkdirSync(OUT, { recursive: true })

const cases = JSON.parse(readFileSync(SRC, 'utf-8')) as Array<{
  id?: string; name?: string; gender?: string; solar?: string; field?: string; era?: string
}>

let ok = 0, fail = 0
const results: Array<Record<string, unknown>> = []
for (const c of cases) {
  try {
    const [y, m, d] = (c.solar || '').split('-').map((v) => parseInt(v, 10))
    if (!y || !m || !d) { fail++; continue }
    const input = {
      calendar: 'solar',
      year: y, month: m, day: d,
      hour: null, minute: null,  // 历史人物大多无时辰
      gender: c.gender === '女' ? 'female' : 'male',
      useTrueSolarTime: false,
      dayRollover: 'zichu',
    } as unknown as BirthInput
    const chart = computeChartV2(input as unknown as BirthInput)
    const p = chart.pillars as unknown as Record<string, { ganzhi: string } | undefined>
    results.push({
      id: c.id ?? '',
      name: c.name ?? '',
      field: c.field ?? '',
      era: c.era ?? '',
      pillars: [p.year?.ganzhi, p.month?.ganzhi, p.day?.ganzhi, p.hour?.ganzhi].filter(Boolean).join(' '),
      dayMaster: chart.dayMaster,
      dayMasterWuxing: chart.dayMasterWuxing ?? '',
      missing: (chart.wuxing?.missing ?? []).join(''),
      strongest: chart.wuxing?.strongest ?? '',
      weakest: chart.wuxing?.weakest ?? '',
      dayunCount: Object.keys((chart.dayun ?? {}) as object).length,
    })
    ok++
  } catch {
    fail++
  }
}
writeFileSync(`${OUT}/paipan-2026-08-27-gh.json`, JSON.stringify(results, null, 1), 'utf-8')
console.log(`排盘成功 ${ok} / 失败 ${fail} → ${OUT}/paipan-2026-08-27-gh.json`)

// 领域 × 五行特征 交叉统计（断命研究素材）
const byField: Record<string, { n: number; topWuxing: Record<string, number>; missing: Record<string, number> }> = {}
for (const r of results) {
  const key = (r.field as string)?.split(',')[0] || '未知'
  byField[key] ??= { n: 0, topWuxing: {}, missing: {} }
  byField[key].n++
  const s = r.strongest as string
  const m = r.missing as string
  byField[key].topWuxing[s] = (byField[key].topWuxing[s] ?? 0) + 1
  for (const ch of String(m)) byField[key].missing[ch] = (byField[key].missing[ch] ?? 0) + 1
}
console.log('\n=== 领域 × 五行特征交叉（前 8 领域）===')
for (const [k, v] of Object.entries(byField).sort((a, b) => b[1].n - a[1].n).slice(0, 8)) {
  const top = Object.entries(v.topWuxing).sort((a, b) => b[1] - a[1])[0]
  const miss = Object.entries(v.missing).sort((a, b) => b[1] - a[1]).slice(0, 2)
  console.log(`${k} (${v.n}): 日主最旺=${top?.[0]}(${top?.[1]}) 缺=${miss.map(([x, n]) => `${x}${n}`).join(',') || '无'}`)
}
