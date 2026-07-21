import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionHeadingProps = {
  eyebrow?: string
  title: ReactNode
  sub?: ReactNode
  align?: 'center' | 'left'
  dark?: boolean
  className?: string
}

/**
 * 区块标题：拉丁眉题（金）+ 中文 H2 + 56px 金色 hairline。
 * H2 套 .gs-chars 时可被 GSAP 字级拆分入场接管（见 pages/Home）。
 */
export default function SectionHeading({
  eyebrow,
  title,
  sub,
  align = 'center',
  dark = false,
  className,
}: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <div className={cn(centered ? 'text-center' : 'text-left', className)}>
      {eyebrow && (
        <p className="font-latin text-[12px] font-medium uppercase tracking-[0.38em] text-gold">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'gs-chars mt-4 font-serif text-[clamp(26px,3.6vw,42px)] font-bold leading-snug tracking-[0.12em]',
          dark ? 'text-silktext' : 'text-inktext',
        )}
      >
        {title}
      </h2>
      <div className={cn('zf-hairline mt-6', centered && 'mx-auto')} />
      {sub && (
        <p
          className={cn(
            'mt-5 text-[14px] leading-relaxed',
            dark ? 'text-silkmuted' : 'text-inkmuted',
          )}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
