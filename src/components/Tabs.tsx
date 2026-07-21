import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

/* ============================================================
 * 紫府 v6 Tabs：横向可滑动 + 完整键盘支持
 * （←/→ 循环切换，Home/End 跳首尾，roving tabindex）
 * ============================================================ */

type TabsCtx = {
  value: string
  setValue: (v: string) => void
  baseId: string
}

const Ctx = createContext<TabsCtx | null>(null)

function useTabsCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Tabs 子组件必须置于 <Tabs> 内')
  return ctx
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  children: ReactNode
  className?: string
}) {
  const [inner, setInner] = useState(defaultValue ?? '')
  const isControlled = value !== undefined
  const current = isControlled ? value : inner
  const baseId = useId()
  const setValue = useCallback(
    (v: string) => {
      if (!isControlled) setInner(v)
      onValueChange?.(v)
    },
    [isControlled, onValueChange],
  )
  const ctx = useMemo(() => ({ value: current, setValue, baseId }), [current, setValue, baseId])
  return (
    <Ctx.Provider value={ctx}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  )
}

/** 标签条：overflow-x-auto 可滑动，箭头键循环移动焦点并选中 */
export function TabsList({
  children,
  className,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  className?: string
  'aria-label'?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = listRef.current
    if (!list) return
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
    if (tabs.length === 0) return
    const idx = tabs.indexOf(document.activeElement as HTMLButtonElement)
    let next = -1
    if (e.key === 'ArrowRight') next = (idx + 1 + tabs.length) % tabs.length
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next >= 0) {
      e.preventDefault()
      tabs[next].focus()
      tabs[next].click()
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        'flex gap-1 overflow-x-auto rounded-full border border-gold/20 bg-silk2/60 p-1',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string
  children: ReactNode
  className?: string
}) {
  const { value: current, setValue, baseId } = useTabsCtx()
  const active = current === value
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        'min-h-[40px] shrink-0 whitespace-nowrap rounded-full px-5 font-sans text-[13.5px] tracking-[0.1em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold',
        active ? 'bg-deep text-silk' : 'text-inkmuted hover:text-golddim',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string
  children: ReactNode
  className?: string
}) {
  const { value: current, baseId } = useTabsCtx()
  if (current !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn('mt-6 outline-none', className)}
    >
      {children}
    </div>
  )
}
