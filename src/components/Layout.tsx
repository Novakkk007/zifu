import type { ReactNode } from 'react'
import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ZifuFab from '@/components/ZifuFab'
import BgmPlayer from '@/components/BgmPlayer'
import PreviewBanner from '@/components/PreviewBanner'
import MobileTabBar from '@/components/MobileTabBar'

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

  // 观居实验自带顶栏与返回。只在 DEV 去掉全站导航，生产构建会删掉这个分支。
  if (
    import.meta.env.DEV &&
    location.pathname.replace(/\/+$/, "") === "/experiments/guanju"
  ) {
    return <div className="min-h-[100dvh] bg-silk text-inktext">{children}</div>
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-silk">
      <PreviewBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileTabBar />
      <ZifuFab />
      <BgmPlayer />
      <Suspense fallback={null}>
        <FeedbackWidget />
      </Suspense>
    </div>
  )
}
