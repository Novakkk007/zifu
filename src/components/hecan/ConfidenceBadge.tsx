import { cn } from '@/lib/utils'

export type ConfidenceTier = 'triple' | 'double' | 'single'

const TIER_META: Record<ConfidenceTier, { name: string; hint: string }> = {
  triple: { name: '三盘共证', hint: '三术同指一事，结论加重标注，可重点参看' },
  double: { name: '两盘互参', hint: '两术相合、一术未及，结论平实陈述' },
  single: { name: '单盘孤证', hint: '仅一术所见，明言存疑，供参考不供决断' },
}

/** 徽章图形：三枚金环交叠 / 双环相扣（银金） / 单环（铜色） */
function BadgeGlyph({ tier, size }: { tier: ConfidenceTier; size: number }) {
  const gold = 'rgb(var(--gold-bright))'
  const silver = '#A9B2AC'
  const copper = '#B07A44'
  const sw = 2.4
  if (tier === 'triple') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
        <circle cx="32" cy="24" r="13" stroke={gold} strokeWidth={sw} />
        <circle cx="22" cy="40" r="13" stroke={gold} strokeWidth={sw} opacity={0.85} />
        <circle cx="42" cy="40" r="13" stroke={gold} strokeWidth={sw} opacity={0.7} />
      </svg>
    )
  }
  if (tier === 'double') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
        <circle cx="26" cy="32" r="14" stroke={gold} strokeWidth={sw} />
        <circle cx="40" cy="32" r="14" stroke={silver} strokeWidth={sw} opacity={0.9} />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="15" stroke={copper} strokeWidth={sw} />
      <circle cx="32" cy="32" r="8.5" stroke={copper} strokeWidth={1.2} opacity={0.55} />
    </svg>
  )
}

type ConfidenceBadgeProps = {
  tier: ConfidenceTier
  /** 图形尺寸（S3 大卡用 64，报告结论用 28） */
  size?: number
  /** 仅图形，不带文字 */
  glyphOnly?: boolean
  className?: string
}

/** 信度徽章：交叠环图形 + 级名（hover 时图形 8s 缓转一圈，由父级 group 触发） */
export default function ConfidenceBadge({
  tier,
  size = 28,
  glyphOnly = false,
  className,
}: ConfidenceBadgeProps) {
  const meta = TIER_META[tier]
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="hc-badge-glyph inline-flex shrink-0">
        <BadgeGlyph tier={tier} size={size} />
      </span>
      {!glyphOnly && (
        <span
          className={cn(
            'font-serif font-bold tracking-[0.14em]',
            size >= 48 ? 'text-[18px] text-silktext' : 'text-[13px] text-goldbright',
          )}
        >
          {meta.name}
          {tier === 'single' && (
            <span className="ml-2 rounded-sm border border-[#B07A44]/60 px-1 py-px align-middle font-sans text-[10px] font-normal tracking-[0.2em] text-[#C98F58]">
              存疑
            </span>
          )}
        </span>
      )}
    </span>
  )
}

export { TIER_META }
