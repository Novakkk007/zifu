import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { PillarInfo } from '@/lib/ganzhi'
import { WUXING_COLORS } from '@/lib/ganzhi'

type PillarCardProps = {
  title: string
  pillar: PillarInfo | null
  isDay?: boolean
  index?: number
  compact?: boolean
}

/** 四柱竖卡：顶栏柱名 + 十神小注，干支大字按五行着色，下缀藏干/纳音/星运 */
export default function PillarCard({ title, pillar, isDay = false, index = 0, compact = false }: PillarCardProps) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-golddim/25 bg-silk2 text-center',
        compact ? 'p-3' : 'p-5',
      )}
    >
      <div className="flex items-center justify-between border-b border-golddim/20 pb-2.5">
        <span className="font-serif text-[14px] font-bold tracking-[0.2em] text-inktext">
          {title}
        </span>
        <span className="text-[11px] tracking-[0.08em] text-golddim">
          {pillar ? pillar.stemGod : ''}
        </span>
      </div>

      {pillar ? (
        <>
          <div className={cn('relative', compact ? 'py-3' : 'py-5')}>
            <span
              className={cn(
                'relative inline-block font-serif font-black leading-none',
                compact ? 'text-[30px]' : 'text-[48px]',
                isDay &&
                  'rounded-full ring-2 ring-gold ring-offset-4 ring-offset-silk2',
              )}
              style={{ color: WUXING_COLORS[pillar.stemWuxing] }}
            >
              {pillar.stem}
            </span>
            {isDay && (
              <span className="absolute -right-1 -top-1 rounded-sm border border-gold/60 px-1 py-px font-serif text-[10px] text-golddim">
                日主
              </span>
            )}
          </div>
          <div
            className={cn('font-serif font-black leading-none', compact ? 'text-[30px]' : 'text-[48px]')}
            style={{ color: WUXING_COLORS[pillar.branchWuxing] }}
          >
            {pillar.branch}
          </div>
          <div className="mt-4 space-y-1 border-t border-golddim/15 pt-3 text-[12px] leading-[1.7] text-inkmuted">
            <p>
              藏 {pillar.hiddenStems.join(' ')}
              <span className="ml-1.5 text-golddim">{pillar.branchGod}</span>
            </p>
            <p>纳音 · {pillar.nayin}</p>
            <p>星运 · {pillar.stage}</p>
          </div>
        </>
      ) : (
        <div className="flex h-[150px] flex-col items-center justify-center gap-2 text-inkmuted">
          <span className="font-serif text-[26px] text-inkmuted/60">—</span>
          <span className="text-[12px] tracking-[0.1em]">时辰不详</span>
        </div>
      )}
    </motion.div>
  )
}
