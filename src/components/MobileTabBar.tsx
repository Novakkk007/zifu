import { NavLink } from 'react-router'
import { Home, CalendarDays, Sparkles, Compass, UserRound } from 'lucide-react'

/** 移动端底部常驻导航（小白主场景：首页/八字/问事/每日/我的） */
const TABS = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/bazi', label: '排盘', icon: Sparkles, end: false },
  { to: '/liuyao', label: '问事', icon: Compass, end: false },
  { to: '/daily', label: '每日', icon: CalendarDays, end: false },
  { to: '/profile', label: '我的', icon: UserRound, end: false },
]

export default function MobileTabBar() {
  return (
    <nav
      aria-label="移动端底部导航"
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-gold/20 bg-deep3/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] tracking-[0.08em] transition-colors ${
                isActive ? 'text-goldbright' : 'text-silkmuted/80'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
