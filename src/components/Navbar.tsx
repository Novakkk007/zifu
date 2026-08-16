import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogOut, Menu, Sparkle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import BrandLogo from '@/components/BrandLogo'

const YAN_MENU = [
  { to: '/bazi', label: '八字排盘' },
  { to: '/bazi/hepan', label: '八字合盘' },
  { to: '/liuyao', label: '六爻起卦' },
  { to: '/ziwei', label: '紫微斗数' },
  { to: '/qizheng', label: '七政四余' },
  { to: '/qimen', label: '奇门遁甲' },
  { to: '/daliuren', label: '大六壬' },
]

const NAV_LINKS = [
  { to: '/toolkit', label: '百宝袋' },
  { to: '/daily', label: '每日时令' },
  { to: '/wiki', label: '藏经阁' },
]

const linkCls =
  'font-sans text-[13.5px] tracking-[0.1em] text-inkmuted transition-colors hover:text-golddim'

/** 当前页：金色文字 + 金色下划线 */
const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    linkCls,
    isActive && 'text-golddim underline decoration-gold/70 underline-offset-8',
  )

export default function Navbar() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 40)
  const [dropOpen, setDropOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const dropBtnRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 路由变化时收起菜单：在渲染期间按上一次路径派生调整，避免 effect 内同步 setState
  const [prevPath, setPrevPath] = useState(location.pathname)
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname)
    setDrawerOpen(false)
    setDropOpen(false)
  }

  // 移动抽屉打开时锁定 body 滚动
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'sticky top-0 z-50 h-16 border-b bg-silk/90 backdrop-blur-md transition-[border-color] duration-300',
        scrolled ? 'border-[rgba(199,162,58,0.18)]' : 'border-transparent',
      )}
    >
      <div className="zf-container flex h-full items-center justify-between">
        {/* 左：品牌 */}
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo variant="mark" size={28} />
          <span className="bg-gradient-to-br from-goldbright to-gold bg-clip-text font-serif text-[22px] font-black tracking-[0.12em] text-transparent">
            紫府
          </span>
          <span
            className="hidden font-latin text-[10px] font-medium tracking-[0.3em] text-inkmuted sm:block"
            style={{ writingMode: 'vertical-rl' }}
          >
            ZIFU PALACE
          </span>
        </Link>

        {/* 中：桌面导航 */}
        <nav className="hidden items-center gap-7 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setDropOpen(true)}
            onMouseLeave={() => setDropOpen(false)}
            onKeyDown={(e) => {
              // Esc 关闭并把焦点还给触发按钮
              if (e.key === 'Escape' && dropOpen) {
                e.stopPropagation()
                setDropOpen(false)
                dropBtnRef.current?.focus()
              }
            }}
          >
            <button
              ref={dropBtnRef}
              className={cn(linkCls, 'flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-gold rounded')}
              aria-haspopup="menu"
              aria-expanded={dropOpen}
              onClick={() => setDropOpen((v) => !v)}
              onKeyDown={(e) => {
                if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && !dropOpen) {
                  e.preventDefault()
                  setDropOpen(true)
                }
              }}
            >
              术数推演
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', dropOpen && 'rotate-180')}
              />
            </button>
            <AnimatePresence>
              {dropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.16 }}
                  className="absolute left-1/2 top-full w-40 -translate-x-1/2 pt-3"
                >
                  <div
                    role="menu"
                    aria-label="术数推演"
                    className="overflow-hidden rounded-xl border border-gold/15 bg-silk shadow-card"
                    onKeyDown={(e) => {
                      // 方向键在菜单项间移动
                      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
                      e.preventDefault()
                      const items = Array.from(
                        e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'),
                      )
                      const idx = items.indexOf(document.activeElement as HTMLElement)
                      const next =
                        e.key === 'ArrowDown'
                          ? (idx + 1) % items.length
                          : (idx - 1 + items.length) % items.length
                      items[next]?.focus()
                    }}
                  >
                    {YAN_MENU.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        className="block px-5 py-2.5 font-sans text-[13.5px] tracking-[0.1em] text-inkmuted outline-none transition-colors hover:bg-silk2 hover:text-golddim focus-visible:bg-silk2 focus-visible:text-golddim"
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavLink
            to="/hecan"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5',
                navLinkCls({ isActive }),
              )
            }
          >
            <Sparkle className="h-3 w-3 text-gold" strokeWidth={2} />
            三术合参
          </NavLink>
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkCls}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* 右：登录 + 汉堡 */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <span className="h-8 w-20 animate-pulse rounded-full bg-silk2" aria-hidden />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/account"
                title="用户中心"
                aria-label={`用户中心（${user.name || '紫府同参'}）`}
                className="max-w-[10rem] truncate rounded-full border border-[rgba(199,162,58,0.35)] px-4 py-1.5 font-sans text-[13px] tracking-[0.08em] text-golddim outline-none transition-colors hover:border-gold/60 hover:bg-gold/10 focus-visible:ring-2 focus-visible:ring-gold"
              >
                {user.name || '紫府同参'}
              </Link>
              <button
                onClick={logout}
                aria-label="退出登录"
                title="退出登录"
                className="rounded-full p-2 text-inkmuted transition-colors hover:text-golddim"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/profile"
              className="zf-btn rounded-full bg-deep px-5 py-2 font-sans text-[13px] font-medium tracking-[0.12em] text-silk"
            >
              我的
            </Link>
          )}
          <button
            className="p-2 text-inktext lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 移动端全屏抽屉 */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="fixed inset-0 z-[60] flex flex-col bg-deep3 lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-6">
              <span className="font-serif text-[20px] font-black tracking-[0.12em] text-goldbright">
                紫府
              </span>
              <button
                className="p-2 text-silkmuted"
                onClick={() => setDrawerOpen(false)}
                aria-label="关闭菜单"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col items-center justify-center gap-1 overflow-y-auto px-8 pb-16">
              {[
                { to: '/hecan', label: '✦ 三术合参' },
                ...YAN_MENU,
                ...NAV_LINKS,
                { to: '/talks', label: '主创说' },
                ...(isAuthenticated
                  ? [
                      { to: '/account', label: '用户中心' },
                      { to: '/', label: '退出登录', action: 'logout' as const },
                    ]
                  : [{ to: '/profile', label: '我的' }]),
              ].map((item, i) => (
                <motion.div
                  key={item.to + item.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                >
                  {'action' in item && item.action === 'logout' ? (
                    <button
                      onClick={() => {
                        setDrawerOpen(false)
                        logout()
                      }}
                      className="block py-2.5 text-center font-serif text-[22px] tracking-[0.2em] text-silktext transition-colors hover:text-goldbright"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <NavLink
                      to={item.to}
                      className="block py-2.5 text-center font-serif text-[22px] tracking-[0.2em] text-silktext transition-colors hover:text-goldbright"
                    >
                      {item.label}
                    </NavLink>
                  )}
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
