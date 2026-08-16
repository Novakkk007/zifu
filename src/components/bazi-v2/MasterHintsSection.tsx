/**
 * 名家视角区块——蒸馏规则引擎（masters-rules）的展示层。
 * 文化型参详提示，每条带来源大师与规则ID徽标。
 */
import { useMemo } from 'react'
import { analyzeWithMasters } from '@contracts/engines/masters-rules'
import type { BaziChartV2 } from '@contracts/bazi-core'

export default function MasterHintsSection({ chart }: { chart: BaziChartV2 }) {
  const hints = useMemo(() => analyzeWithMasters(chart), [chart])

  if (hints.length === 0) return null

  return (
    <section className="mt-8 rounded-xl border border-golddim/25 bg-silk2 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-golddim">
            Master Perspectives
          </p>
          <h3 className="mt-1 font-serif text-[20px] font-bold tracking-[0.08em] text-inktext">
            名家视角 · 参详提示
          </h3>
        </div>
        <span className="rounded-full border border-golddim/40 px-4 py-1.5 text-[11px] tracking-[0.1em] text-inkmuted">
          传统方法论蒸馏 · 文化参考 · 不构成决策建议
        </span>
      </div>
      <ul className="mt-5 space-y-3">
        {hints.map((h) => (
          <li key={h.ruleId} className="rounded-lg border border-golddim/15 bg-white/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-serif text-[15px] font-bold text-inktext">{h.title}</span>
              <span className="rounded bg-deep px-2 py-0.5 font-mono text-[10.5px] tracking-[0.08em] text-goldbright">
                {h.ruleId}
              </span>
              <span className="text-[11.5px] text-golddim">{h.master}</span>
            </div>
            <p className="mt-2 text-[13.5px] leading-[1.9] text-inkmuted">{h.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
