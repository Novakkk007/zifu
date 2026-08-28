/**
 * 稀缺神煞对拍 v2：紫府引擎 vs zhenyi regression-vectors（含真太阳时四柱+柱位神煞金标）
 * 流程：紫府排盘（公历）→ 四柱与 zhenyi expected.pillars 对齐后才比较神煞；
 *       稀缺 19 种（1.5.0 规则）按柱位与 zhenyi shen_sha 对比
 * 用法：npx tsx api/bazi-core/audit-scarce-shensha.ts
 */
import { readFileSync } from 'node:fs'
import { computeChartV2 } from '@contracts/bazi-core'

const RAW = readFileSync('F:/紫府文件/tasks/absorb/repos/zhenyi-bazi-paipan/tests/regression-vectors.json', 'utf-8')
const VECTORS = JSON.parse(RAW) as Array<{
  id: string
  input: { birthday: string; birth_time: string; gender: string }
  expected: { pillars: string[]; shen_sha: Record<string, string[]> }
}>

// 稀缺 19 种名称（1.5.0 新规则）
const SCARCE = ['国印贵人', '飞刃', '天德合', '月德合', '披麻', '吊客', '丧门', '十灵日', '九丑日', '六秀日', '八专日', '孤鸾煞', '天转日', '地转日', '四废日', '拱禄格', '童子煞', '德秀贵人']

function main() {
  const lines: string[] = []
  let total = 0
  let hit = 0
  let pillarAligned = 0
  for (const v of VECTORS) {
    const [y, m, d] = v.input.birthday.split('-').map(Number)
    const [h, mi] = v.input.birth_time.split(':').map(Number)
    const chart = computeChartV2({
      calendar: 'solar', year: y, month: m, day: d, hour: h, minute: mi,
      gender: v.input.gender === 'female' ? 'female' : 'male',
      useTrueSolarTime: false, dayRollover: 'zichu',
    })
    const p = chart.pillars as unknown as Record<string, { ganzhi: string }>
    const mine = [p.year?.ganzhi, p.month?.ganzhi, p.day?.ganzhi, p.hour?.ganzhi]
    const golden = v.expected.pillars
    const aligned = mine.every((g, i) => g === golden[i])
    if (!aligned) {
      lines.push(`${v.id}: 四柱不对齐（紫府 ${mine.join(' ')} vs zhenyi ${golden.join(' ')}）→ 跳过神煞对比`)
      continue
    }
    pillarAligned += 1
    // 紫府 1.5.0 命中按柱位归类
    const hits = (chart.shensha as Array<{ name: string; rulesetVersion: string; pillar: string }>)
      .filter((s) => s.rulesetVersion === '1.5.0')
    const byPos: Record<string, string[]> = {}
    for (const hh of hits) {
      const pos = (hh.pillar ?? '').replace('柱', '').replace('支', '').replace('干', '')
      ;(byPos[pos] ??= []).push(hh.name)
    }
    // zhenyi 金标稀缺部分
    const goldByPos: Record<string, string[]> = {}
    for (const [pos, names] of Object.entries(v.expected.shen_sha || {})) {
      goldByPos[pos] = names.filter((n) => SCARCE.includes(n))
    }
    // 对比
    const posMap: Record<string, string> = { year: '年', month: '月', day: '日', hour: '时' }
    const diffs: string[] = []
    for (const [pos, gold] of Object.entries(goldByPos)) {
      const minePos = byPos[posMap[pos]] ?? []
      const miss = gold.filter((g) => !minePos.some((mm) => mm.includes(g) || g.includes(mm)))
      if (miss.length) diffs.push(`${posMap[pos]}柱缺:${miss.join(',')}`)
    }
    const goldAll = Object.values(goldByPos).flat()
    total += goldAll.length
    hit += goldAll.length - diffs.map((d) => d.split(':')[1]?.split(',').length ?? 0).reduce((a, b) => a + b, 0)
    lines.push(`${v.id}: 四柱对齐 ✓ | ${diffs.length ? '差异: ' + diffs.join('; ') : '全命中'} | 紫府稀缺命中: ${Object.values(byPos).flat().join(',') || '无'}`)
  }
  lines.push(`\n四柱对齐: ${pillarAligned}/${VECTORS.length} | 稀缺神煞命中率: ${hit}/${total} = ${Math.round((hit / total) * 100)}%`)
  console.log(lines.join('\n'))
}
main()
