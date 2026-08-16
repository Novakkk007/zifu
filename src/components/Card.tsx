import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ============================================================
 * 紫府 v6 卡片：绢纸底 + 金色 hairline 描边 + 柔和投影
 * ============================================================ */

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gold/20 bg-silk shadow-card',
        className,
      )}
      {...rest}
    />
  )
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-gold/15 px-4 py-5 sm:px-6', className)} {...rest} />
}

export function CardTitle({
  eyebrow,
  children,
  className,
}: {
  eyebrow?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="mb-1 font-latin text-[11px] font-medium tracking-[0.3em] text-golddim">
          {eyebrow}
        </p>
      )}
      <h3 className="font-serif text-[19px] font-bold tracking-[0.08em] text-inktext">
        {children}
      </h3>
    </div>
  )
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1.5 text-[13px] leading-[1.8] text-inkmuted', className)} {...rest} />
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-5 sm:px-6', className)} {...rest} />
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-3 border-t border-gold/15 px-4 py-4 sm:px-6', className)}
      {...rest}
    />
  )
}
