import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 空态：图标 + 标题 + 描述 + 可选动作 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gold/30 bg-silk2/40 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="text-golddim" aria-hidden>
        {icon ?? <Inbox className="h-8 w-8" />}
      </span>
      <p className="font-serif text-[16px] font-bold tracking-[0.08em] text-inktext">{title}</p>
      {description && (
        <p className="max-w-sm text-[13px] leading-[1.8] text-inkmuted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
