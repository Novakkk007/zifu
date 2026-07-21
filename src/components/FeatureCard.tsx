import { Link } from 'react-router-dom'
import { Sparkle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TagPill } from '@/components/Buttons'

type FeatureCardProps = {
  glyph: string
  title: string
  desc: string
  to: string
  tag?: 'free' | 'flagship' | 'overview'
  dark?: boolean
  flagship?: boolean
  className?: string
}

/** 功能矩阵卡片：单字图标 + 卡题 + 简介 + 标签 + 了解更多 */
export default function FeatureCard({
  glyph,
  title,
  desc,
  to,
  tag,
  dark = false,
  flagship = false,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'gs-reveal group relative flex flex-col rounded-xl border p-7 transition-all duration-300',
        'hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-card',
        dark ? 'border-gold/10 bg-deep' : 'border-golddim/25 bg-silk2',
        className,
      )}
    >
      {flagship && (
        <Sparkle
          className="absolute right-5 top-5 h-3.5 w-3.5 text-goldbright"
          strokeWidth={1.5}
        />
      )}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg font-serif text-[24px] font-black',
            flagship
              ? 'text-[#0B3B39] [background:linear-gradient(135deg,rgb(var(--gold-bright)),rgb(var(--gold)))]'
              : 'border border-gold/40 text-goldbright',
          )}
        >
          {glyph}
        </div>
        {tag && <TagPill variant={tag} />}
      </div>
      <h3
        className={cn(
          'mt-5 font-serif text-[20px] font-bold tracking-[0.06em]',
          dark ? 'text-silktext' : 'text-inktext',
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          'mt-2 flex-1 text-[13.5px] leading-[1.9]',
          dark ? 'text-silkmuted' : 'text-inkmuted',
        )}
      >
        {desc}
      </p>
      <Link
        to={to}
        className={cn(
          'zf-link-more mt-5 inline-flex w-fit items-center gap-1 text-[13.5px] font-medium tracking-[0.08em]',
          dark ? 'text-goldbright' : 'text-golddim',
        )}
      >
        了解更多 <span className="zf-arrow">→</span>
      </Link>
    </div>
  )
}
