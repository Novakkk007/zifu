/**
 * 本命盘四柱卡（年/月/日/时）+ 命宫/身宫小卡。
 * 命宫/身宫为传统起法，单独列出作参考，绝不混称「六柱」。
 */
import { motion, useReducedMotion } from 'framer-motion'
import type { BaziChartV2, GongInfo, PillarInfo } from '@contracts/bazi-core'
import { cn } from '@/lib/utils'
import { WUXING_COLORS, WUXING_ICONS } from '@/lib/wuxing-style'
import GlossaryTooltip from '@/components/GlossaryTooltip'

function PillarCard({
  pillar,
  isDay,
  index,
}: {
  pillar: PillarInfo | null
  isDay?: boolean
  index: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: reduce ? 0 : 0.12 + index * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-xl border bg-silk2 p-4 text-center shadow-card',
        isDay ? 'border-gold/60 ring-1 ring-gold/40' : 'border-golddim/25',
      )}
    >
      <p className="text-[11.5px] tracking-[0.18em] text-inkmuted">
        {pillar?.label ?? '时柱'}
        {isDay && <span className="ml-1.5 text-golddim">日主</span>}
      </p>
      {pillar ? (
        <>
          <p className="mt-2 font-serif text-[13px] tracking-[0.1em] text-golddim">
            <GlossaryTooltip term={pillar.stemTenGod}>{pillar.stemTenGod}</GlossaryTooltip>
          </p>
          <p
            className="mt-1 font-serif text-[32px] font-black leading-tight"
            style={{ color: WUXING_COLORS[pillar.stemWuxing] }}
          >
            <GlossaryTooltip term={pillar.stem}>{pillar.stem}</GlossaryTooltip>
            <span className="ml-1 align-middle text-[13px]" aria-hidden>
              {WUXING_ICONS[pillar.stemWuxing]}
            </span>
          </p>
          <p
            className="font-serif text-[32px] font-black leading-tight"
            style={{ color: WUXING_COLORS[pillar.branchWuxing] }}
          >
            <GlossaryTooltip term={pillar.branch}>{pillar.branch}</GlossaryTooltip>
            <span className="ml-1 align-middle text-[13px]" aria-hidden>
              {WUXING_ICONS[pillar.branchWuxing]}
            </span>
          </p>
          <div className="mt-3 space-y-1 border-t border-golddim/15 pt-2.5 text-[11.5px] leading-[1.7] text-inkmuted">
            <p>
              藏干：
              {pillar.hiddenStems.map((h) => (
                <span key={h.stem + h.role} className="mr-1.5">
                  <GlossaryTooltip term={h.stem}>{h.stem}</GlossaryTooltip>
                  <GlossaryTooltip term={h.tenGod} className="text-golddim">
                    {h.tenGod}
                  </GlossaryTooltip>
                </span>
              ))}
            </p>
            <p>
              纳音 <span className="text-inktext">{pillar.nayin}</span>
              <span className="mx-1.5 text-inkmuted/50">｜</span>
              十二长生 <span className="text-inktext">{pillar.stage}</span>
            </p>
          </div>
        </>
      ) : (
        <p className="mt-3 py-6 font-serif text-[18px] text-inkmuted/60">
          时辰不详
          <span className="mt-1 block text-[11.5px]">时柱未排</span>
        </p>
      )}
    </motion.div>
  )
}

function GongCard({ title, gong }: { title: string; gong: GongInfo }) {
  return (
    <div className="rounded-lg border border-dashed border-golddim/40 bg-silk2/60 px-5 py-4 text-center">
      <p className="text-[11.5px] tracking-[0.18em] text-inkmuted">{title}</p>
      <p className="mt-1.5 font-serif text-[24px] font-black text-inktext">{gong.ganzhi}</p>
      <p className="mt-1.5 text-[11px] leading-[1.7] text-inkmuted">{gong.method}</p>
    </div>
  )
}

export default function PillarsSection({ chart }: { chart: BaziChartV2 }) {
  const pillars: { pillar: PillarInfo | null; isDay?: boolean }[] = [
    { pillar: chart.pillars.year },
    { pillar: chart.pillars.month },
    { pillar: chart.pillars.day, isDay: true },
    { pillar: chart.pillars.hour },
  ]
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {pillars.map((p, i) => (
          <PillarCard
            key={p.pillar?.label ?? 'hour'}
            pillar={p.pillar}
            isDay={p.isDay}
            index={i}
          />
        ))}
      </div>

      {(chart.mingGong || chart.shenGong) && (
        <div className="mt-5">
          <p className="mb-2.5 text-center text-[11.5px] tracking-[0.16em] text-inkmuted">
            命宫 / 身宫（传统起法，单列参考，不入四柱）
          </p>
          <div className="mx-auto grid max-w-[520px] grid-cols-2 gap-4">
            {chart.mingGong && <GongCard title="命宫" gong={chart.mingGong} />}
            {chart.shenGong && <GongCard title="身宫" gong={chart.shenGong} />}
          </div>
        </div>
      )}
    </div>
  )
}
