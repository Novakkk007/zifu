import { useEffect, useState } from 'react'

/* ============================================================
 * 动效性能分级（帧率守卫）· T-20260927
 * - 初始化静态判定：小屏 + 低核数/低内存（Chromium deviceMemory）→ lite
 * - 运行期采样：摇卦等重负载期间实测均帧 < 50fps → 永久降档 lite
 * - 调试/冒烟：URL 加 ?mtier=lite|full 强制指定；root dataset.mtier 记录当前档位
 * - 降档只关停「无限循环 / 大面积重绘 / 高密度元素」类效果，不改动画时长与结构
 * ============================================================ */

export type MotionTier = 'full' | 'lite'

const SUBS = new Set<() => void>()

function queryOverride(): MotionTier | null {
  try {
    const v = new URLSearchParams(window.location.search).get('mtier')
    if (v === 'lite' || v === 'full') return v
  } catch {
    /* 非浏览器环境忽略 */
  }
  return null
}

function staticTier(): MotionTier {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return 'full'
  const forced = queryOverride()
  if (forced) return forced
  try {
    if (!window.matchMedia('(max-width: 640px)').matches) return 'full'
    const cores = navigator.hardwareConcurrency || 8
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory
    if (cores <= 4 || (mem !== undefined && mem <= 4)) return 'lite'
  } catch {
    /* 判定失败按 full 保守处理 */
  }
  return 'full'
}

let tier: MotionTier = staticTier()

function applyTier(next: MotionTier) {
  if (next === tier) return
  tier = next
  try {
    document.documentElement.dataset.mtier = next
  } catch {
    /* 非浏览器环境忽略 */
  }
  SUBS.forEach((fn) => fn())
}

try {
  document.documentElement.dataset.mtier = tier
} catch {
  /* 非浏览器环境忽略 */
}

export function getMotionTier(): MotionTier {
  return tier
}

/** 实测均帧低于 50fps 时永久降档 lite（只降不升，防抖动） */
export function reportFrameRate(fps: number) {
  if (fps >= 50) return
  applyTier('lite')
}

/** 启动 rAF 帧率采样；调用返回的 stop() 得采样窗口平均帧率（窗口过短返回 60） */
export function sampleFrames(): () => number {
  if (typeof requestAnimationFrame !== 'function') return () => 60
  let frames = 0
  let start = 0
  let last = 0
  let raf = 0
  let stopped = false
  const tick = (t: number) => {
    if (stopped) return
    if (start === 0) {
      start = t
    } else {
      frames += 1
      last = t
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => {
    stopped = true
    cancelAnimationFrame(raf)
    const span = last - start
    return span > 300 ? (frames / span) * 1000 : 60
  }
}

/** 订阅当前档位（组件用；同一页面多次调用共享同一判定与降档事件） */
export function useMotionTier(): MotionTier {
  const [current, setCurrent] = useState<MotionTier>(tier)
  useEffect(() => {
    const fn = () => setCurrent(tier)
    SUBS.add(fn)
    return () => {
      SUBS.delete(fn)
    }
  }, [])
  return current
}
