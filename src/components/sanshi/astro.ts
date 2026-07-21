/**
 * 三术页共享术数工具：干支、二十八宿、确定性哈希随机。
 * mock 原则：同一输入 → 同一结果（前端内嵌，无后端）。
 */

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

/** 二十八宿（东方苍龙起） */
export const MANSIONS = [
  '角', '亢', '氐', '房', '心', '尾', '箕',
  '斗', '牛', '女', '虚', '危', '室', '壁',
  '奎', '娄', '胃', '昴', '毕', '觜', '参',
  '井', '鬼', '柳', '星', '张', '翼', '轸',
] as const

/** 四象（每象七宿） */
export const XIANG = ['东方苍龙', '北方玄武', '西方白虎', '南方朱雀'] as const

/** 二十八宿对应的星兽（角木蛟…轸水蚓） */
export const MANSION_BEAST = [
  '木蛟', '金龙', '土貉', '日兔', '月狐', '火虎', '水豹',
  '木獬', '金牛', '土蝠', '日鼠', '月燕', '火猪', '水貐',
  '木狼', '金狗', '土雉', '日鸡', '月乌', '火猴', '水猿',
  '木犴', '金羊', '土獐', '日马', '月鹿', '火蛇', '水蚓',
] as const

export type Wuxing = '木' | '火' | '土' | '金' | '水'

export const STEM_WUXING: Wuxing[] = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
export const BRANCH_WUXING: Wuxing[] = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']

/** 五行相克：KE[x] = x 所克 */
export const KE: Record<Wuxing, Wuxing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }
/** 五行相生：SHENG[x] = x 所生 */
export const SHENG: Record<Wuxing, Wuxing> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }

/** FNV-1a 字符串哈希（确定性种子） */
export function hashSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32 确定性伪随机序列 */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

export type Pillar = { stem: number; branch: number; label: string }

/** 日柱：以 1900-01-01（甲戌日，干支序 10）为锚累加 */
export function dayPillar(year: number, month: number, day: number): Pillar {
  const days = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(1900, 0, 1)) / 86400000)
  const idx = (((10 + days) % 60) + 60) % 60
  const stem = idx % 10
  const branch = idx % 12
  return { stem, branch, label: `${STEMS[stem]}${BRANCHES[branch]}` }
}

/** 时支：23:00–00:59 为子时 */
export function hourBranchOf(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2)
}

/** 时干：五鼠遁（甲己还加甲） */
export function hourStemOf(dayStem: number, hourBranch: number): number {
  return ((dayStem % 5) * 2 + hourBranch) % 10
}

export function hourPillar(dayStem: number, hourBranch: number): Pillar {
  const stem = hourStemOf(dayStem, hourBranch)
  return { stem, branch: hourBranch, label: `${STEMS[stem]}${BRANCHES[hourBranch]}` }
}

/** 年内第几天（1 起） */
export function dayOfYear(year: number, month: number, day: number): number {
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86400000) + 1
}

/** 极角 → SVG 坐标（y 轴向下，角度以度计） */
export function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** 环形扇区路径（r1 内半径，r2 外半径，a0→a1 顺时针，y 向下坐标系） */
export function wedgePath(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  a0: number,
  a1: number,
): string {
  const p1 = polar(cx, cy, r2, a0)
  const p2 = polar(cx, cy, r2, a1)
  const p3 = polar(cx, cy, r1, a1)
  const p4 = polar(cx, cy, r1, a0)
  const large = a1 - a0 > 180 ? 1 : 0
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${r2} ${r2} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${r1} ${r1} 0 ${large} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}
