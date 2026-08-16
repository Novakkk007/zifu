import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

export type SiweiTexts = Record<Persona, Record<Depth, string>>

const PERSONAS: { id: Persona; latin: string; name: string }[] = [
  { id: 'scholar', latin: 'SCHOLAR', name: '严谨学者' },
  { id: 'hermit', latin: 'HERMIT', name: '幽默隐士' },
]

type SiweiPanelProps = {
  texts: SiweiTexts
  /** 输出卡角注，如「参详输出 · 本局 mock」 */
  caption?: string
}

/** 深色区块用 · 四维（人格 × 深度）参详切换面板（Framer 交互组件） */
export default function SiweiPanel({ texts, caption = '参详输出 · 演示 mock' }: SiweiPanelProps) {
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('pro')

  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-3 sm:flex-row">
        {PERSONAS.map((p) => {
          const active = persona === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPersona(p.id)}
              className={cn(
                'relative flex-1 rounded-xl border px-5 py-3.5 text-left transition-colors',
                active ? 'border-transparent bg-deep3/70' : 'border-gold/15 bg-deep3/30 hover:border-gold/40',
              )}
            >
              {active && (
                <motion.span
                  layoutId="siwei-persona-frame"
                  className="absolute inset-0 rounded-xl border border-gold/70"
                  transition={{ duration: 0.26, ease: 'easeOut' }}
                />
              )}
              <span className="block font-latin text-[11px] font-medium tracking-[0.3em] text-gold">
                {p.latin}
              </span>
              <span className="mt-0.5 block font-serif text-[15.5px] font-bold tracking-[0.1em] text-silktext">
                {p.name}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 inline-flex items-center gap-1 self-start rounded-full border border-gold/20 bg-deep3/50 p-1">
        {(
          [
            { value: 'pro', label: '专业级' },
            { value: 'plain', label: '通俗级' },
          ] as { value: Depth; label: string }[]
        ).map((opt) => {
          const active = depth === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDepth(opt.value)}
              className={cn(
                'relative min-h-11 rounded-full px-4 py-1.5 font-sans text-[12.5px] font-medium tracking-[0.08em] transition-colors sm:min-h-0',
                active ? 'text-[#0B3B39]' : 'text-silkmuted hover:text-silktext',
              )}
            >
              {active && (
                <motion.span
                  layoutId="siwei-depth-pill"
                  className="absolute inset-0 rounded-full [background:linear-gradient(135deg,rgb(var(--gold-bright)),rgb(var(--gold)))]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 rounded-xl border-l-[3px] border-gold bg-deep3/50 p-7">
        <p className="text-[12px] tracking-[0.14em] text-silkmuted">{caption}</p>
        <div className="mt-4 min-h-[120px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${persona}-${depth}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
              className="font-serif text-[15.5px] leading-[2.1] text-silktext"
            >
              {texts[persona][depth]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
