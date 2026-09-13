/**
 * 版面切换过渡：路由变化时旧页轻隐、新页淡入微升——安静而连续（300ms，尊重 reduced-motion）
 * 用法：包住 <Routes>
 */
import { useLocation } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const reduce = useReducedMotion()

  return (
    <motion.div
      key={location.pathname}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
