import { AlertTriangle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 错误态：图标 + 标题 + 描述 + 重试按钮 */
export function ErrorState({
  title = '加载失败',
  description,
  onRetry,
  retrying = false,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-zifured/30 bg-zifured/5 px-6 py-12 text-center',
        className,
      )}
    >
      <AlertTriangle className="h-8 w-8 text-zifured" aria-hidden />
      <p className="font-serif text-[16px] font-bold tracking-[0.08em] text-inktext">{title}</p>
      {description && (
        <p className="max-w-sm text-[13px] leading-[1.8] text-inkmuted">{description}</p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="zf-btn mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-deep/50 bg-silk px-6 font-sans text-[13.5px] font-medium tracking-[0.12em] text-deep outline-none transition hover:bg-silk2 focus-visible:ring-2 focus-visible:ring-gold active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          <RotateCcw className={cn('h-4 w-4', retrying && 'animate-spin')} aria-hidden />
          {retrying ? '重试中…' : '重试'}
        </button>
      )}
    </div>
  )
}
