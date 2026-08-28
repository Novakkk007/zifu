/**
 * 对拍扩展：3 组特殊口径夹具（真太阳时跨日/农历春节/农历闰月）
 * 用法：npx tsx api/bazi-core/audit-scarce-extra.ts
 */
import { readFileSync } from 'node:fs'
import { computeChartV2 } from '@contracts/bazi-core'

interface VectorInput {
  birthday: string
  birth_time: string
  gender: string
  longitude?: number
}
interface Vector {
  id: string
  input: VectorInput
  expected: { pillars: string[]; shen_sha: Record<string, string[]> }
}

const RAW = readFileSync('F:/紫府文件/tasks/absorb/repos/zhenyi-bazi-paipan/tests/regression-vectors.json', 'utf-8')
const VECTORS = JSON.parse(RAW) as Vector[]

const SCARCE = ['国印贵人', '飞刃', '天德合', '月德合', '披麻', '吊客', '丧门', '十灵日', '九丑日', '六秀日', '八专日', '孤鸾煞', '天转日', '地转日', '四废日', '拱禄格', '童子煞', '德秀贵人']

interface SpecialInput {
  calendar: 'solar' | 'lunar'
  useTrueSolarTime: boolean
  longitude?: number
  isLeapMonth?: boolean
}

const SPECIAL: Record<string, (v: Vector) => SpecialInput> = {
  'west-cross-midnight': (v) => ({ calendar: 'solar', useTrueSolarTime: true, longitude: v.input.longitude }),
  'lunar-newyear': () => ({ calendar: 'lunar', useTrueSolarTime: false }),
  'lunar-leap': () => ({ calendar: 'lunar', useTrueSolarTime: false, isLeapMonth: true }),
}

function main() {
  for (const v of VECTORS) {
    const sp = SPECIAL[v.id]
    if (!sp) continue
    const [y, m, d] = v.input.birthday.split('-').map(Number)
    const [h, mi] = v.input.birth_time.split(':').map(Number)
    const extra = sp(v)
    const chart = computeChartV2({
      calendar: extra.calendar,
      year: y, month: m, day: d, hour: h, minute: mi,
      gender: v.input.gender === 'female' ? 'female' : 'male',
      useTrueSolarTime: extra.useTrueSolarTime,
      ...(extra.longitude !== undefined ? { longitude: extra.longitude } : {}),
      ...(extra.isLeapMonth ? { isLeapMonth: true } : {}),
      dayRollover: 'zichu',
    })
    const p = chart.pillars as unknown as Record<string, { ganzhi: string }>
    const mine = [p.year?.ganzhi, p.month?.ganzhi, p.day?.ganzhi, p.hour?.ganzhi]
    const golden = v.expected.pillars
    const aligned = mine.every((g, i) => g === golden[i])
    if (!aligned) {
      console.log(`${v.id}: 四柱不对齐（紫府 ${mine.join(' ')} vs zhenyi ${golden.join(' ')}）`)
      continue
    }
    console.log(`${v.id}: 四柱对齐 ✓（${extra.calendar}${extra.useTrueSolarTime ? '+真太阳时' : ''}${extra.isLeapMonth ? '+闰月' : ''}）`)
    const hits = (chart.shensha as Array<{ name: string; rulesetVersion: string }>)
      .filter((s) => s.rulesetVersion === '1.5.0')
    const mineNames = hits.map((h) => h.name)
    const goldAll = Object.values(v.expected.shen_sha || {}).flat().filter((n) => SCARCE.includes(n))
    const miss = goldAll.filter((g) => !mineNames.some((mm) => mm.includes(g) || g.includes(mm)))
    console.log(`  稀缺神煞: ${goldAll.length - miss.length}/${goldAll.length} | 缺: ${miss.join(',') || '无'} | 紫府: ${[...new Set(mineNames)].join(',')}`)
  }
}
main()
