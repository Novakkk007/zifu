/**
 * Reveal · 全局区块渐显（紫府统一入场律动）
 * 用法：<Reveal><section>…</section></Reveal> 或 <Reveal as="div" delay={0.2}>
 * 滚动进入视口即淡入上移，once（只演一次）。尊重系统减弱动态偏好。
 */
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** 延迟（秒）——多区块错落 */
  delay?: number
  /** 初始位移方向 */
  dir?: 'up' | 'left' | 'right' | 'none'
  className?: string
  /** 一次性触发视口边距 */
  margin?: string
}

export default function Reveal({
  children,
  delay = 0,
  dir = 'up',
  className,
  margin = '-60px',
}: RevealProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  const offset = dir === 'up' ? { y: 22 } : dir === 'left' ? { x: -26 } : dir === 'right' ? { x: 26 } : {}
  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin }}
      transition={{ duration: 0.75, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
