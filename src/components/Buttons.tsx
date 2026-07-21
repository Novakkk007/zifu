import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

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

/** 金色主按钮（深底 CTA 可叠加 breathing 金晕：加 animate-gold-breathe） */
export function GoldButton(props: CommonProps) {
  return render(
    'zf-btn inline-flex items-center justify-center rounded-full px-8 py-3 font-sans text-[14.5px] font-medium tracking-[0.14em] text-[#0B3B39] [background:linear-gradient(135deg,rgb(var(--gold-bright)),rgb(var(--gold)))]',
    props,
  )
}

/** 深底主按钮（浅底上使用） */
export function DeepButton(props: CommonProps) {
  return render(
    'zf-btn inline-flex items-center justify-center rounded-full bg-deep px-8 py-3 font-sans text-[14.5px] font-medium tracking-[0.14em] text-silk',
    props,
  )
}

/** 金色描边次按钮（深底上使用） */
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
