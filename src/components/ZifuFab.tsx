import { useEffect, useRef, useState } from 'react'
import { applyTheme, getTheme, THEMES } from '@/lib/theme'
import type { ZifuTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const BUBBLE_KEY = 'zifu-fab-bubble-seen'

/** 悬浮助手「紫宸」：右下 56px 圆形，兼作四色主题切换器 */
export default function ZifuFab() {
  const [theme, setTheme] = useState<ZifuTheme>(() => getTheme())
  const [menuOpen, setMenuOpen] = useState(false)
  const [bubble, setBubble] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // 首次访问 3s 后弹气泡，8s 自动收起，localStorage 记忆
  useEffect(() => {
    let seen = false
    try {
      seen = localStorage.getItem(BUBBLE_KEY) === '1'
    } catch {
      /* ignore */
    }
    if (seen) return
    const t1 = window.setTimeout(() => setBubble(true), 3000)
    const t2 = window.setTimeout(() => {
      setBubble(false)
      try {
        localStorage.setItem(BUBBLE_KEY, '1')
      } catch {
        /* ignore */
      }
    }, 11000)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  // 菜单外点击收起
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const pick = (t: ZifuTheme) => {
    setTheme(t)
    applyTheme(t)
    setMenuOpen(false)
  }

  return (
    <div ref={rootRef} className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* 气泡提示 */}
      {bubble && !menuOpen && (
          <div className="animate-in rounded-xl border border-gold/30 bg-deep2 px-4 py-2.5 shadow-card fade-in slide-in-from-bottom-2 zoom-in-95 duration-300">
            <p className="whitespace-nowrap font-sans text-[12.5px] tracking-[0.08em] text-goldbright">
              紫府有四色 · 点此切换
            </p>
            <span className="absolute -bottom-1 right-7 h-2.5 w-2.5 rotate-45 border-b border-r border-gold/30 bg-deep2" />
          </div>
        )}

      {/* 主题菜单 */}
      {menuOpen && (
          <div className="flex animate-in gap-3 rounded-2xl border border-gold/25 bg-deep2 px-4 py-3.5 shadow-card fade-in slide-in-from-bottom-2 zoom-in-95 duration-200">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => pick(t.id)}
                title={t.hint}
                className="group flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    'h-8 w-8 rounded-full border transition-all',
                    theme === t.id
                      ? 'border-goldbright ring-2 ring-gold/60'
                      : 'border-gold/30 group-hover:border-gold/70',
                  )}
                  style={{ background: t.swatch }}
                />
                <span
                  className={cn(
                    'font-serif text-[11px] tracking-[0.1em]',
                    theme === t.id ? 'text-goldbright' : 'text-silkmuted',
                  )}
                >
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        )}

      {/* FAB 本体 */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="紫宸 · 切换主题"
        className="zf-btn relative flex h-14 w-14 flex-col items-center justify-center rounded-full border border-gold/50 bg-deep2 shadow-card"
      >
        <span className="font-serif text-[13px] font-bold leading-none tracking-[0.06em] text-goldbright">
          紫宸
        </span>
        <span className="mt-1.5 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="animate-dot-breathe h-1 w-1 rounded-full bg-gold"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </span>
      </button>
    </div>
  )
}
