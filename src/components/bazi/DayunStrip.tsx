import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { DayunStep } from '@/lib/ganzhi'

type DayunStripProps = {
  steps: DayunStep[]
  startAge: number
  forward: boolean
}

/** 大运横向卡条（mock 8 步）：起运岁数 + 大运干支 + 十神，当前年龄段金边高亮 */
export default function DayunStrip({ steps, startAge, forward }: DayunStripProps) {
  return (
    <div className="rounded-xl border border-golddim/25 bg-silk2 p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-[17px] font-bold tracking-[0.12em] text-inktext">
          大运
        </h3>
        <span className="text-[12px] text-inkmuted">
          {forward ? '顺行' : '逆行'} · {startAge} 岁起运 · 演示排法
        </span>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {steps.map((s, i) => (
          <motion.div
            key={s.ganzhi + s.startAge}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'flex w-[104px] shrink-0 flex-col items-center rounded-lg border px-3 py-4',
              s.isCurrent
                ? 'border-gold bg-silk shadow-card'
                : 'border-golddim/20 bg-silk',
            )}
          >
            <span className="text-[11px] tracking-[0.1em] text-inkmuted">
              {s.startAge}–{s.startAge + 9} 岁
            </span>
            <span
              className={cn(
                'mt-2 font-serif text-[22px] font-black tracking-[0.08em]',
                s.isCurrent ? 'text-golddim' : 'text-inktext',
              )}
            >
              {s.ganzhi}
            </span>
            <span className="mt-1.5 text-[11.5px] tracking-[0.1em] text-inkmuted">
              {s.stemGod}
            </span>
            {s.isCurrent && (
              <span className="mt-2 rounded-full border border-gold/50 px-2 py-px text-[10px] tracking-[0.12em] text-golddim">
                当前
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
