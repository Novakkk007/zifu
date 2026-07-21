import { cn } from '@/lib/utils'

/** 加载态：骨架屏（animate-pulse，语义色块） */
export function LoadingState({
  rows = 3,
  className,
  label = '加载中…',
}: {
  rows?: number
  className?: string
  label?: string
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-gold/15 bg-silk px-6 py-6',
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="h-4 animate-pulse rounded bg-silk2"
          style={{ width: `${92 - i * 14}%` }}
        />
      ))}
    </div>
  )
}
