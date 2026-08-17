import type { ReactNode } from 'react'
import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ZifuFab from '@/components/ZifuFab'
import BgmPlayer from '@/components/BgmPlayer'
import PreviewBanner from '@/components/PreviewBanner'

const FeedbackWidget = lazy(() => import('@/components/FeedbackWidget'))

/**
 * 全局布局（children 模式）：Navbar（sticky）+ 页面槽 + Footer + 紫宸 FAB。
 * 非关键反馈弹窗独立分包，避免首屏解析整套 Dialog/Form 代码。
 */
export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  // 路由切换回到顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-silk">
      <PreviewBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ZifuFab />
      <BgmPlayer />
      <Suspense fallback={null}>
        <FeedbackWidget />
      </Suspense>
    </div>
  )
}
