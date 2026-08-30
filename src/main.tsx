import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import ErrorBoundary from '@/components/ErrorBoundary'
import App from './App.tsx'

// GitHub Pages SPA fallback：404.html 暂存路径 → 恢复路由
// （直接访问/刷新 /zifu/<子路由> 时 GitHub 返回 404，经 404.html 跳回后在此恢复）
try {
  const redirect = sessionStorage.getItem('zifu:redirect')
  if (redirect && window.location.pathname.replace(/\/+$/, '') === (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '')) {
    sessionStorage.removeItem('zifu:redirect')
    window.history.replaceState(null, '', (import.meta.env.BASE_URL ?? '/') + redirect)
  }
} catch {
  /* 隐私模式 sessionStorage 不可用则静默跳过 */
}

// PWA：生产环境注册 Service Worker（安装到桌面/离线壳）
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* 注册失败静默（不影响站点） */
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </BrowserRouter>
  </ErrorBoundary>,
)
