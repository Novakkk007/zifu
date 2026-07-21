import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================
 * 紫府 v6 Modal：focus trap + ESC 关闭 + 遮罩点击关闭 +
 * 打开时锁定 body 滚动，关闭后焦点还原到触发元素。
 * ============================================================ */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  /** 设为 false 可禁用遮罩点击关闭（如危险确认） */
  closeOnOverlay = true,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
  closeOnOverlay?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  // 记录触发元素、锁定滚动、初始聚焦
  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      restoreRef.current?.focus?.()
    }
  }, [open])

  // ESC 关闭 + Tab 焦点圈禁
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (items.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-deep3/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (closeOnOverlay && e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'w-full max-w-md rounded-2xl border border-gold/25 bg-silk shadow-card outline-none',
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gold/15 px-6 py-4">
              <div>
                <h2 className="font-serif text-[18px] font-bold tracking-[0.08em] text-inktext">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-[12.5px] leading-[1.7] text-inkmuted">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭弹层"
                className="rounded-full p-1.5 text-inkmuted outline-none transition-colors hover:text-golddim focus-visible:ring-2 focus-visible:ring-gold"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {children && <div className="px-6 py-5">{children}</div>}
            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-gold/15 px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
