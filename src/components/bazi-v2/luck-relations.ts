/**
 * 岁运干支 ↔ 本命局的合冲刑害破速查（纯展示层派生，供人生轨迹节点详情卡使用）。
 * 规则为传统通例：天干五合、地支六合 / 六冲 / 三刑（含自刑）/ 六害 / 相破。
 */
import type { BaziChartV2, PillarInfo, Wuxing } from '@contracts/bazi-core'
import {
  BRANCHES,
  BRANCH_WUXING,
  STEMS,
  STEM_WUXING,
  WUXING_KE,
  WUXING_SHENG,
} from '@contracts/bazi-core'

/** 天干五合：甲己合土 / 乙庚合金 / 丙辛合水 / 丁壬合木 / 戊癸合火 */
const STEM_COMBINE_WUXING: Wuxing[] = ['土', '金', '水', '木', '火']
/** 地支六合对 */
const LIUHE: [number, number][] = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 7], [6, 8]]
/** 六害对 */
const LIUHAI: [number, number][] = [[0, 8], [1, 6], [2, 5], [3, 4], [7, 11], [9, 10]]
/** 相破对 */
const XIANGPO: [number, number][] = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 7], [8, 10]]
/** 三刑组（组内两两相刑；单子为自刑） */
const XING_GROUPS: number[][] = [
  [2, 5, 7], // 寅巳申
  [1, 8, 10], // 丑戌未
  [0, 3], // 子卯
  [4], // 辰自刑
  [6], // 午自刑
  [9], // 酉自刑
  [11], // 亥自刑
]

function inPair(pairs: [number, number][], a: number, b: number): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === y && y === a))
}

export interface GanzhiWuxingInfo {
  stem: string
  branch: string
  stemWuxing: Wuxing
  branchWuxing: Wuxing
  stemIdx: number
  branchIdx: number
}

/** 解析干支 → 天干/地支及其五行（干支非法时返回 null） */
export function ganzhiWuxing(ganzhi: string): GanzhiWuxingInfo | null {
  const stem = ganzhi.charAt(0)
  const branch = ganzhi.charAt(1)
  const stemIdx = (STEMS as readonly string[]).indexOf(stem)
  const branchIdx = (BRANCHES as readonly string[]).indexOf(branch)
  if (stemIdx < 0 || branchIdx < 0) return null
  return { stem, branch, stemWuxing: STEM_WUXING[stemIdx], branchWuxing: BRANCH_WUXING[branchIdx], stemIdx, branchIdx }
}

/** 某五行对日主五行的作用关系描述 */
export function wuxingActionOnDayMaster(dayMasterWuxing: Wuxing, incoming: Wuxing): string {
  if (incoming === dayMasterWuxing) return '与日主同气（比和）'
  if (WUXING_SHENG[incoming] === dayMasterWuxing) return `生日主（${incoming}生${dayMasterWuxing}）`
  if (WUXING_SHENG[dayMasterWuxing] === incoming) return `泄日主（${dayMasterWuxing}生${incoming}）`
  if (WUXING_KE[incoming] === dayMasterWuxing) return `克日主（${incoming}克${dayMasterWuxing}）`
  return `日主所克（${dayMasterWuxing}克${incoming}）`
}

/**
 * 岁运干支与本命局四柱的合冲刑害破关系（展示用文字列表）。
 * 天干论五合（对各柱天干），地支论六合/六冲/三刑/六害/相破（对各柱地支）。
 */
export function luckRelationsWithChart(ganzhi: string, chart: BaziChartV2): string[] {
  const info = ganzhiWuxing(ganzhi)
  if (!info) return []
  const pillars: PillarInfo[] = [
    chart.pillars.year,
    chart.pillars.month,
    chart.pillars.day,
    chart.pillars.hour,
  ].filter((p): p is PillarInfo => p !== null)

  const out: string[] = []
  for (const p of pillars) {
    // 天干五合
    const diff = Math.abs(info.stemIdx - p.stemIdx)
    if (diff === 5) {
      const low = Math.min(info.stemIdx, p.stemIdx)
      out.push(`${info.stem} 与 ${p.label}天干${p.stem} 五合化${STEM_COMBINE_WUXING[low]}`)
    }
    // 地支关系
    const a = info.branchIdx
    const b = p.branchIdx
    if (inPair(LIUHE, a, b)) out.push(`${info.branch} 与 ${p.label}地支${p.branch} 六合`)
    if ((a - b + 12) % 12 === 6) out.push(`${info.branch} 与 ${p.label}地支${p.branch} 相冲`)
    for (const g of XING_GROUPS) {
      if (g.length === 1 && a === b && g[0] === a) {
        out.push(`${info.branch} 与 ${p.label}地支${p.branch} 自刑`)
      } else if (g.length > 1 && g.includes(a) && g.includes(b) && a !== b) {
        out.push(`${info.branch} 与 ${p.label}地支${p.branch} 相刑`)
      }
    }
    if (inPair(LIUHAI, a, b)) out.push(`${info.branch} 与 ${p.label}地支${p.branch} 相害`)
    if (inPair(XIANGPO, a, b)) out.push(`${info.branch} 与 ${p.label}地支${p.branch} 相破`)
  }
  return out
}
