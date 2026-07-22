/**
 * 三术页共享静态数据与 SVG 几何工具。
 * 排盘算法已全部迁至服务端真实引擎（contracts/engines/*），
 * 本文件只保留展示层所需的干支/五行表、二十八宿名与环上几何。
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

export type Wuxing = '木' | '火' | '土' | '金' | '水'

export const STEM_WUXING: Wuxing[] = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
export const BRANCH_WUXING: Wuxing[] = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']

/** mulberry32 确定性伪随机序列（仅用于背景星点等装饰，不参与任何排盘） */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 时支：23:00–00:59 为子时 */
export function hourBranchOf(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2)
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

/* ---------------- 二十八宿环上几何（汉宿度近似，用于星盘 SVG 布点） ---------------- */

/** 各宿中心的环上角度（SVG 极角，冬至点锚斗宿 127.5°） */
export const MANSION_ANGLE = [
  217.5, 202.5, 190, 180, 170, 157.5, 142.5,
  127.5, 112.5, 100, 90, 80, 67.5, 52.5,
  37.5, 22.5, 10, 0, 350, 337.5, 322.5,
  307.5, 292.5, 280, 270, 260, 247.5, 232.5,
]

/** 各宿的环上进度 u（自角宿 0 起递增，一周 360） */
const MANSION_U = MANSION_ANGLE.map((a) => ((217.5 - a) % 360 + 360) % 360)
/** 宿界（28+1 条） */
const BOUNDS: number[] = (() => {
  const b: number[] = []
  for (let m = 0; m < 28; m++) {
    const prev = m === 0 ? MANSION_U[27] - 360 : MANSION_U[m - 1]
    b.push((prev + MANSION_U[m]) / 2)
  }
  b.push(MANSION_U[27] + (360 - MANSION_U[27] + MANSION_U[0]) / 2)
  return b
})()

/** 各宿扇区的环角边界 [aStart, aEnd]（aStart > aEnd，顺时针） */
export const MANSION_WEDGES: [number, number][] = Array.from({ length: 28 }, (_, m) => [
  217.5 - BOUNDS[m],
  217.5 - BOUNDS[m + 1],
])
