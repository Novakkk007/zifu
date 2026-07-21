import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================
 * 紫府 v6 按钮体系
 * 5 变体 × 状态机（default/hover/active/focus/disabled/loading/success/error）
 * - Primary   深靛蓝底 · 绢纸字
 * - Foil      金箔渐变 · 描边（主 CTA）
 * - Secondary 绢纸底 · 靛蓝描边
 * - Ghost     透明 · hover 淡金
 * - Danger    --zifu-red（危险操作）
 * 旧导出 GoldButton/DeepButton/GhostButton/TagPill 保持向后兼容。
 * ============================================================ */

export type ZifuButtonVariant = 'primary' | 'foil' | 'secondary' | 'ghost' | 'danger'
export type ZifuButtonStatus = 'idle' | 'loading' | 'success' | 'error'

const BTN_BASE =
  'zf-btn inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-7 py-2.5 font-sans text-[14.5px] font-medium tracking-[0.14em] outline-none transition focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-silk active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

const VARIANT_CLS: Record<ZifuButtonVariant, string> = {
  primary: 'bg-deep text-silk hover:bg-deep2',
  foil: 'border border-goldbright/70 text-deep3 [background:linear-gradient(135deg,rgb(var(--gold-bright)),rgb(var(--gold)))]',
  secondary: 'border border-deep/50 bg-silk text-deep hover:bg-silk2',
  ghost: 'bg-transparent text-inkmuted hover:bg-gold/10 hover:text-golddim',
  danger: 'bg-zifured text-silk hover:brightness-110',
}

const STATUS_TEXT: Record<Exclude<ZifuButtonStatus, 'idle'>, string> = {
  loading: '处理中…',
  success: '已完成',
  error: '操作失败，请重试',
}

export type ZifuButtonProps = {
  variant?: ZifuButtonVariant
  /** 状态机：loading 禁重复提交并显示 spinner；success/error 以图标+文字双编码 */
  status?: ZifuButtonStatus
  /** 自定义状态文案（默认：处理中…/已完成/操作失败，请重试） */
  statusText?: Partial<Record<Exclude<ZifuButtonStatus, 'idle'>, string>>
  /** 传入则渲染为 Link（此时 status 不生效） */
  to?: string
  children: ReactNode
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

/** v6 通用按钮：5 变体 + loading/success/error 状态（图标+文字双编码，不止颜色） */
export const ZifuButton = forwardRef<HTMLButtonElement, ZifuButtonProps>(
  function ZifuButton(
    { variant = 'primary', status = 'idle', statusText, to, children, className, disabled, ...rest },
    ref,
  ) {
    const cls = cn(BTN_BASE, VARIANT_CLS[variant], className)
    if (to) {
      return (
        <Link to={to} className={cls}>
          {children}
        </Link>
      )
    }
    const busy = status === 'loading'
    const text = status !== 'idle' ? (statusText?.[status] ?? STATUS_TEXT[status]) : null
    return (
      <button
        ref={ref}
        className={cls}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        aria-live={status === 'success' || status === 'error' ? 'polite' : undefined}
        {...rest}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {status === 'success' && <CheckCircle2 className="h-4 w-4 text-zifugreen" aria-hidden />}
        {status === 'error' && <AlertCircle className="h-4 w-4 text-zifured" aria-hidden />}
        {text ?? children}
      </button>
    )
  },
)

/* ============ 向后兼容导出（既有调用点保持不动） ============ */

type CommonProps = {
  to?: string
  children: ReactNode
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

function render(
  classes: string,
  { to, children, className, ...rest }: CommonProps,
) {
  const cls = cn(classes, className)
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}

/** 金色主按钮（深底 CTA 可叠加 breathing 金晕：加 animate-gold-breathe）。v6 等价物：ZifuButton variant="foil" */
export function GoldButton(props: CommonProps) {
  return render(
    'zf-btn inline-flex items-center justify-center rounded-full px-8 py-3 font-sans text-[14.5px] font-medium tracking-[0.14em] text-[#0B3B39] [background:linear-gradient(135deg,rgb(var(--gold-bright)),rgb(var(--gold)))]',
    props,
  )
}

/** 深底主按钮（浅底上使用）。v6 等价物：ZifuButton variant="primary" */
export function DeepButton(props: CommonProps) {
  return render(
    'zf-btn inline-flex items-center justify-center rounded-full bg-deep px-8 py-3 font-sans text-[14.5px] font-medium tracking-[0.14em] text-silk',
    props,
  )
}

/** 金色描边次按钮（深底上使用）。v6 等价物：ZifuButton variant="ghost" */
export function GhostButton(props: CommonProps) {
  return render(
    'zf-btn inline-flex items-center justify-center rounded-full border border-gold/60 bg-transparent px-8 py-3 font-sans text-[14.5px] font-medium tracking-[0.14em] text-goldbright hover:bg-gold/10',
    props,
  )
}

type TagPillProps = {
  variant: 'free' | 'flagship' | 'overview'
  className?: string
}

const PILL_TEXT: Record<TagPillProps['variant'], string> = {
  free: '免费',
  flagship: '旗舰',
  overview: '概览免费',
}

/** 标签胶囊：免费=空心金边；旗舰=实心金；概览免费=空心金 */
export function TagPill({ variant, className }: TagPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium tracking-[0.1em]',
        variant === 'flagship'
          ? 'text-[#0B3B39] [background:linear-gradient(135deg,rgb(var(--gold-bright)),rgb(var(--gold)))]'
          : 'border border-gold/50 text-goldbright',
        className,
      )}
    >
      {PILL_TEXT[variant]}
    </span>
  )
}
