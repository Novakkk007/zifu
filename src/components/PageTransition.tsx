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

  // 观居实验自管步骤切换。包一层 transform 会让顶栏 sticky 失效。仅 DEV。
  if (
    import.meta.env.DEV &&
    location.pathname.replace(/\/+$/, "") === "/experiments/guanju"
  ) {
    return <>{children}</>
  }

  return (
    <motion.div
      key={location.pathname}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
