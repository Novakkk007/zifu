/**
 * 紫微斗数前端展示层（纯展示工具，无排盘逻辑）。
 * 排盘由服务端 @contracts/engines/ziwei-core（北派-全书安星法）完成，
 * 本文件仅提供宫格坐标、宫位释义、四化配色与流年推算辅助。
 */
import {
  SIHUA,
  STAR_LINE,
  type HuaKind,
  type ZiweiChartData,
  type ZiweiPalace,
} from '@contracts/engines/ziwei-core'
import { BRANCHES, STEMS } from '@contracts/bazi-core'

export type { HuaKind, ZiweiChartData, ZiweiPalace, ZiweiStar } from '@contracts/engines/ziwei-core'
export { PALACE_NAMES, RING, SIHUA, STAR_LINE } from '@contracts/engines/ziwei-core'
export { BRANCHES, STEMS } from '@contracts/bazi-core'

/** 地支 → 4×4 宫格坐标 [row, col] */
export const GRID_POS: Record<string, [number, number]> = {
  巳: [0, 0], 午: [0, 1], 未: [0, 2], 申: [0, 3],
  辰: [1, 0], 酉: [1, 3],
  卯: [2, 0], 戌: [2, 3],
  寅: [3, 0], 丑: [3, 1], 子: [3, 2], 亥: [3, 3],
}

export const PALACE_DUTY: Record<string, string> = {
  命宫: '先天禀赋与一生总纲',
  兄弟: '手足情谊与同辈助力',
  夫妻: '姻缘际遇与伴侣相处',
  子女: '子女缘分与创造表达',
  财帛: '求财方式与财库厚薄',
  疾厄: '体质禀赋与健康隐患',
  迁移: '外出际遇与环境变迁',
  交友: '人脉网络与朋友部属',
  官禄: '事业格局与职场进退',
  田宅: '不动产运与家庭根基',
  福德: '精神世界与享福能力',
  父母: '长辈缘分与原生家庭',
}

export const HUA_COLOR: Record<HuaKind, string> = {
  禄: '#C7A23A',
  权: '#8E5FBF',
  科: '#2E7D6B',
  忌: '#B03A2E',
}

/** 时辰下拉文案（支序 0=子 … 11=亥） */
export const HOUR_OPTIONS = BRANCHES.map((b, i) => {
  const start = (23 + i * 2) % 24
  const end = (start + 2) % 24
  const fmt = (h: number) => `${String(h).padStart(2, '0')}:00`
  return { value: i, label: `${b}时 ${fmt(start)}–${fmt(end)}` }
})

/** 公历年 → 干支（流年用，正月初一换年，与本命盘同例） */
export function yearGanzhi(year: number): { stem: string; branch: string; stemIdx: number; branchIdx: number } {
  const stemIdx = (((year - 4) % 10) + 10) % 10
  const branchIdx = (((year - 4) % 12) + 12) % 12
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx], stemIdx, branchIdx }
}

export interface LiunianInfo {
  year: number
  stem: string
  branch: string
  /** 流年命宫（太岁入宫） */
  palace: ZiweiPalace
  /** 流年四化（化星 + 落本命宫位） */
  sihua: { star: string; hua: HuaKind; branch: string; palaceName: string }[]
}

/** 由本命盘推某流年：太岁入宫为流年命宫，流年干四化随本命星曜落宫 */
export function liunianOf(chart: ZiweiChartData, year: number): LiunianInfo | null {
  const { stem, branch, stemIdx } = yearGanzhi(year)
  const palace = chart.palaces.find((p) => p.branch === branch)
  if (!palace) return null
  const stars = SIHUA[stemIdx]
  const huas: HuaKind[] = ['禄', '权', '科', '忌']
  const sihua = stars.map((star, i) => {
    const host = chart.palaces.find((p) =>
      [...p.majors, ...p.minors].some((s) => s.name === star),
    )
    return { star, hua: huas[i], branch: host?.branch ?? '', palaceName: host?.name ?? '' }
  })
  return { year, stem, branch, palace, sihua }
}

/** 宫位释义句（真实星曜 + 生年四化落宫） */
export function palaceSentences(cell: ZiweiPalace): string[] {
  const short = cell.name === '命宫' ? '命' : cell.name
  const out: string[] = []
  for (const s of cell.majors) {
    out.push(`${s.name}居${short}：${STAR_LINE[s.name] ?? '主一方气数'}。`)
  }
  for (const s of cell.minors) {
    if (STAR_LINE[s.name]) out.push(`${s.name}同宫：${STAR_LINE[s.name]}。`)
  }
  for (const s of [...cell.majors, ...cell.minors]) {
    if (s.hua) {
      out.push(
        `生年化${s.hua}落此宫：${s.name}化${s.hua}，此宫${
          s.hua === '忌' ? '宜守不宜进，多一分谨慎' : '得其加持，可作着力之处'
        }。`,
      )
    }
  }
  if (out.length === 0) out.push('此宫主星不坐，静守待时，借对宫之势而行。')
  return out
}
