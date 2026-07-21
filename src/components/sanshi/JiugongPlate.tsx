import { motion } from 'framer-motion'
import { DOOR_KIND, GRID_ORDER, type Palace } from '@/components/sanshi/qimen'
import { cn } from '@/lib/utils'

const DOOR_CLS: Record<'吉' | '凶' | '平', string> = {
  吉: 'text-golddim font-semibold',
  凶: 'text-red-700/85',
  平: 'text-inktext',
}

type JiugongPlateProps = {
  palaces: Palace[]
  onSelect: (p: Palace) => void
}

/** 奇门九宫盘：绢米宫格 + 神星门干分层 + 值符金边呼吸 + 值使金印 */
export default function JiugongPlate({ palaces, onSelect }: JiugongPlateProps) {
  return (
    <div className="mx-auto grid w-full max-w-[720px] grid-cols-3 gap-2.5 md:gap-3">
      {GRID_ORDER.map((num, idx) => {
        const p = palaces[num - 1]
        const kind = DOOR_KIND[p.door] ?? '平'
        return (
          <motion.button
            key={num}
            type="button"
            onClick={() => onSelect(p)}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.07, duration: 0.55, ease: 'easeOut' }}
            className={cn(
              'relative flex min-h-[128px] flex-col rounded-lg border bg-silk2 p-3 text-left transition-colors hover:border-gold/50 md:min-h-[150px] md:p-4',
              p.isZhifu ? 'animate-gold-breathe border-gold/70' : 'border-gold/15',
            )}
          >
            {/* 值符角标 */}
            {p.isZhifu && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 font-sans text-[10px] font-semibold tracking-[0.14em] text-[#0B3B39] [background:linear-gradient(135deg,rgb(var(--gold-bright)),rgb(var(--gold)))]">
                值符
              </span>
            )}
            <div className="flex items-start justify-between">
              <span className="text-[10.5px] tracking-[0.1em] text-inkmuted">{p.gua}</span>
              <span className="text-[12px] tracking-[0.08em] text-golddim">
                {p.god || '—'}
              </span>
            </div>
            <div className="mt-1.5 flex flex-1 flex-col items-center justify-center gap-0.5 md:mt-2">
              <span className="font-serif text-[16px] font-bold tracking-[0.06em] text-inktext md:text-[17px]">
                {p.star}
              </span>
              <span className={cn('flex items-center gap-1 text-[14px]', DOOR_CLS[kind])}>
                {p.door ? `${p.door}门` : '寄宫'}
                {p.isZhishi && (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-gold font-serif text-[10px] font-bold text-deep3">
                    使
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 space-y-0.5 border-t border-golddim/15 pt-1.5 text-[11.5px] leading-snug text-inkmuted md:mt-2">
              <p>
                <span className="mr-1.5 text-golddim/80">天</span>
                {p.tianGan}
              </p>
              <p>
                <span className="mr-1.5 text-golddim/80">地</span>
                {p.diGan}
              </p>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
