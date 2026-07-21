/**
 * AI 详批区（深色区块）：人格 × 深度切换 → trpc.ai.reading。
 * 结果头部明示来源徽章：live · 模型 {model}（金）/ fallback · 演示引擎（灰）。
 */
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import SectionHeading from '@/components/SectionHeading'
import { SegmentedControl } from '@/components/FormControls'
import { GoldButton } from '@/components/Buttons'
import { trpc } from '@/providers/trpc'
import { cn } from '@/lib/utils'
import type { BaziChartV2 } from '@contracts/bazi-core'
import { buildChartSummary, type ReadingResponse } from './api'

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

const PERSONAS: { id: Persona; latin: string; name: string; desc: string }[] = [
  { id: 'scholar', latin: 'SCHOLAR', name: '严谨学者', desc: '客观克制，引经据典，条分缕析' },
  { id: 'hermit', latin: 'HERMIT', name: '幽默隐士', desc: '随性诙谐，妙语点破，围炉夜话' },
]

function SourceBadge({ result }: { result: ReadingResponse }) {
  if (result.source === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-[11.5px] font-medium tracking-[0.12em] text-goldbright">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-goldbright" />
        live · 模型 {result.model ?? '未知'}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-silkmuted/40 bg-silktext/5 px-3 py-1 text-[11.5px] font-medium tracking-[0.12em] text-silkmuted">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-silkmuted" />
      fallback · 演示引擎（非 AI 生成）
    </span>
  )
}

export default function AiReadingSection({ chart }: { chart: BaziChartV2 | null }) {
  const reduce = useReducedMotion()
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('pro')
  const [result, setResult] = useState<ReadingResponse | null>(null)

  const reading = trpc.ai.reading.useMutation({
    onSuccess: (data) => setResult(data as unknown as ReadingResponse),
  })

  const run = () => {
    if (!chart || reading.isPending) return
    setResult(null)
    reading.mutate({
      chartType: 'bazi',
      chartSummary: buildChartSummary(chart),
      persona,
      depth,
    })
  }

  const paragraphs = result ? result.text.split(/\n{2,}|\n/).filter((p) => p.trim().length > 0) : []

  return (
    <div className="zf-container max-w-[880px]">
      <SectionHeading
        eyebrow="AI Reading"
        title="AI 详批 · 四维交互"
        sub="两种人格 × 两种深度，基于服务端排盘结果生成；来源明示，降级不伪装"
        dark
        className="mb-12"
      />

      {/* 人格 */}
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
        {PERSONAS.map((p) => {
          const active = persona === p.id
          return (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={cn(
                'relative flex-1 rounded-2xl border px-8 py-6 text-left transition-colors sm:max-w-[320px]',
                active ? 'border-transparent bg-deep' : 'border-golddim/25 bg-deep/50 hover:border-golddim/50',
              )}
            >
              {active && (
                <motion.span
                  layoutId="bazi-persona-frame"
                  className="absolute inset-0 rounded-2xl border-2 border-gold"
                  transition={{ duration: reduce ? 0 : 0.26, ease: 'easeOut' }}
                />
              )}
              <span className="block font-latin text-[12px] font-medium tracking-[0.3em] text-gold">
                {p.latin}
              </span>
              <span className="mt-1.5 block font-serif text-[19px] font-bold tracking-[0.1em] text-silktext">
                {p.name}
              </span>
              <span className="mt-1 block text-[12.5px] leading-[1.8] text-silkmuted">{p.desc}</span>
            </button>
          )
        })}
      </div>

      {/* 深度 */}
      <div className="mt-6 text-center">
        <SegmentedControl<Depth>
          id="bazi-depth"
          value={depth}
          onChange={setDepth}
          options={[
            { value: 'pro', label: '专业级 · 完整推演' },
            { value: 'plain', label: '通俗级 · 直给结论' },
          ]}
        />
      </div>

      <div className="mt-10 text-center">
        <GoldButton
          disabled={!chart || reading.isPending}
          className={cn(!chart && 'cursor-not-allowed opacity-40')}
          onClick={run}
        >
          {reading.isPending ? '参详中…' : '开始详批'}
        </GoldButton>
        {!chart && <p className="mt-3 text-[12.5px] text-silkmuted">请先在上方完成排盘</p>}
        {reading.isError && (
          <p role="alert" className="mt-3 text-[13px] text-[#E0A39A]">
            {reading.error.message || 'AI 详批服务暂不可用，请稍后重试。'}
          </p>
        )}
      </div>

      {/* 输出卡 */}
      <AnimatePresence>
        {result && (
          <motion.div
            key={`${persona}-${depth}-${result.source}`}
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.5 }}
            className="mt-12 rounded-xl border-l-[3px] border-gold bg-deep p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] tracking-[0.14em] text-silkmuted">
                参详输出 · {persona === 'scholar' ? '严谨学者' : '幽默隐士'} ·{' '}
                {depth === 'pro' ? '专业级' : '通俗级'}
              </p>
              <SourceBadge result={result} />
            </div>
            <div className="mt-6 space-y-5">
              {paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : i * 0.18, duration: reduce ? 0.15 : 0.5 }}
                  className="whitespace-pre-wrap font-serif text-[15.5px] leading-[2.1] text-silktext"
                >
                  {p}
                </motion.p>
              ))}
            </div>
            <p className="mt-7 border-t border-golddim/20 pt-4 text-[12.5px] text-silkmuted">
              {result.source === 'live'
                ? '本详批由 AI 模型基于排盘结果生成，仅供传统文化参考。'
                : '当前为演示引擎模板输出（未配置 AI 密钥），非 AI 模型生成，仅供流程演示。'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
