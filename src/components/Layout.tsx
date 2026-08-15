import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import Lenis from 'lenis'
import { motion } from 'framer-motion'
import { gsap, ScrollTrigger } from '@/lib/anim'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ZifuFab from '@/components/ZifuFab'
import FeedbackWidget from '@/components/FeedbackWidget'
import PreviewBanner from '@/components/PreviewBanner'

/**
 * 全局布局（children 模式）：Navbar（sticky）+ 页面槽 + Footer + 紫宸 FAB。
 * 负责 Lenis 平滑滚动（与 ScrollTrigger 同步）与路由切换动效。
 */
export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // 路由切换回到顶部
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-silk">
      <PreviewBanner />
      <Navbar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: 'easeOut' }}
        className="flex-1"
      >
        {children}
      </motion.main>
      <Footer />
      <ZifuFab />
      <FeedbackWidget />
    </div>
  )
}
