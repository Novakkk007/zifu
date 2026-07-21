/**
 * 五行视觉双编码规范（前端展示层）：
 * 每个五行 = 颜色 + 图形符号 + SVG 线型，三者恒定绑定。
 * 颜色之外提供形状/线型冗余编码，保证色盲与灰度场景可读。
 */
import type { Wuxing } from '@contracts/bazi-core'

/** 五行配色（沿用站点既定色板） */
export const WUXING_COLORS: Record<Wuxing, string> = {
  金: '#B8860B',
  木: '#3E7C4F',
  水: '#3A6EA5',
  火: '#B04A3A',
  土: '#8A6D3B',
}

/** 五行图形符号（双编码之形状通道） */
export const WUXING_ICONS: Record<Wuxing, string> = {
  金: '◆', // 菱形
  木: '▲', // 三角
  水: '≈', // 波纹
  火: '●', // 圆点
  土: '■', // 方块
}

/** 五行 SVG 线型（双编码之纹理通道，stroke-dasharray） */
export const WUXING_DASH: Record<Wuxing, string> = {
  金: '1 0', // 实线
  木: '8 4', // 长划
  水: '2 4', // 点线
  火: '10 3 2 3', // 划点相间
  土: '5 5', // 均匀虚线
}

/** 五行形状名称（图例说明用） */
export const WUXING_STYLE_LABEL: Record<Wuxing, string> = {
  金: '菱形 ◆ · 实线',
  木: '三角 ▲ · 长划线',
  水: '波纹 ≈ · 点线',
  火: '圆点 ● · 划点线',
  土: '方块 ■ · 虚线',
}
