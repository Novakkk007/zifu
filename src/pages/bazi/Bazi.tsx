import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { BaziChartV2 } from '@contracts/bazi-core'
import PageHero from '@/components/bazi/PageHero'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import { GhostButton } from '@/components/Buttons'
import BirthFormCard, {
  defaultBirthForm,
  type BirthFormState,
} from '@/components/bazi-v2/BirthFormCard'
import TimeAuditBar from '@/components/bazi-v2/TimeAuditBar'
import PillarsSection from '@/components/bazi-v2/PillarsSection'
import WuxingSection from '@/components/bazi-v2/WuxingSection'
import DetailTabs from '@/components/bazi-v2/DetailTabs'
import LifeChart from '@/components/bazi-v2/LifeChart'
import AiReadingSection from '@/components/bazi-v2/AiReadingSection'
import HistorySection from '@/components/bazi-v2/HistorySection'
import { ChengguCard, RelationsTable, ShenshaTable, TenGodsTable } from '@/components/bazi-v2/ChartDetails'
import type { PaipanPayload, PaipanResponse } from '@/components/bazi-v2/api'
import { trpc } from '@/providers/trpc'

const HERO_POOL = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '子', '丑', '寅', '卯', '财', '官', '印', '食']

export default function Bazi() {
  const reduce = useReducedMotion()
  const [form, setForm] = useState<BirthFormState>(defaultBirthForm())
  const [chart, setChart] = useState<BaziChartV2 | null>(null)
  const [chartTitle, setChartTitle] = useState<string>('')
  const [persisted, setPersisted] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLElement>(null)
  const utils = trpc.useUtils()

  useEffect(() => {
    document.title = '八字排盘 · 紫府 — 服务端排盘，真太阳时校正，全量可解释'
  }, [])

  const paipan = trpc.bazi.paipan.useMutation({
    onSuccess: async (data) => {
      const res = data as unknown as PaipanResponse
      setChart(res.chart)
      setPersisted(res.persisted)
      await utils.bazi.history.invalidate()
    },
  })

  useEffect(() => {
    if (chart) {
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }),
      )
    }
  }, [chart, reduce])

  const submit = (payload: PaipanPayload) => {
    setChartTitle(payload.title ?? '')
    // 服务端契约（升级后）：完整 BirthInput + title → { chart, chartId, persisted }
    paipan.mutate(payload as unknown as Parameters<typeof paipan.mutate>[0])
  }

  const restore = (restored: BaziChartV2, title: string) => {
    setChart(restored)
    setChartTitle(title)
    setPersisted(true)
  }

  const errorText = paipan.isError
    ? paipan.error.message || '排盘服务暂不可用，请稍后重试。'
    : null

  const inputDesc = chart
    ? `${chart.input.calendar === 'lunar' ? '农历' : '公历'} ${chart.input.year} 年 ${chart.input.month} 月 ${chart.input.day} 日${
        chart.pillars.hour ? ` · ${chart.pillars.hour.branch}时` : ' · 时辰不详'
      } · ${chart.input.gender === 'male' ? '乾造' : '坤造'}`
    : ''

  return (
    <div>
      {/* S1 · PageHero */}
      <PageHero glyph="命" title="八字排盘" sub="服务端排盘 · 真太阳时校正 · 全量规则可解释" pool={HERO_POOL} current="八字排盘" />

      {/* 深 → 浅过渡带 */}
      <div className="h-40" style={{ background: 'linear-gradient(to bottom, rgb(var(--deep)), rgb(var(--silk)))' }} />

      {/* S2 · 生辰表单 */}
      <section className="zf-container relative z-10 -mt-24 pb-16">
        <motion.div
          initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.15, duration: reduce ? 0.2 : 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <BirthFormCard value={form} onChange={setForm} loading={paipan.isPending} error={errorText} onSubmit={submit} />
        </motion.div>
      </section>

      {/* S3 · 排盘结果 */}
      <AnimatePresence>
        {chart && (
          <motion.section
            ref={resultRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.4 }}
          >
            <div className="zf-container space-y-8 pb-24">
              <SectionHeading
                eyebrow="Four Pillars"
                title={chartTitle ? `${chartTitle} · 四柱命盘` : '四柱命盘'}
                sub={inputDesc}
                className="mb-2"
              />
              {persisted && (
                <p className="text-center text-[12px] text-inkmuted">已自动保存至排盘记录</p>
              )}

              {/* 排盘依据 */}
              <TimeAuditBar chart={chart} />

              {/* 四柱 + 命身宫 */}
              <PillarsSection chart={chart} />

              {/* 五行分析 */}
              <WuxingSection chart={chart} />

              {/* 十神明细 / 合冲刑害破 / 神煞 / 称骨 */}
              <TenGodsTable chart={chart} />
              <div className="grid gap-6 lg:grid-cols-2">
                <RelationsTable chart={chart} />
                <ShenshaTable chart={chart} />
              </div>
              <ChengguCard chart={chart} />

              {/* 专业细盘 */}
              <DetailTabs chart={chart} />

              {/* 人生轨迹图 */}
              <LifeChart chart={chart} />

              {/* 操作行 */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
                <GhostButton
                  className="border-golddim/50 text-golddim hover:bg-golddim/10"
                  onClick={() => {
                    setChart(null)
                    setPersisted(false)
                    paipan.reset()
                    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
                  }}
                >
                  重新排盘
                </GhostButton>
                <button
                  onClick={() => detailRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })}
                  className="zf-link-more inline-flex items-center gap-1 text-[14px] font-medium tracking-[0.1em] text-golddim"
                >
                  由此进入 AI 详批 <span className="zf-arrow">↓</span>
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* S4 · 排盘记录（登录可见） */}
      <section className="zf-container pb-20">
        <HistorySection onRestore={restore} />
      </section>

      {/* 浅 → 深过渡带 */}
      <div className="h-44" style={{ background: 'linear-gradient(to bottom, rgb(var(--silk)), rgb(var(--deep-2)))' }} />

      {/* S5 · AI 详批（深色） */}
      <section ref={detailRef} className="bg-deep2 py-28">
        <AiReadingSection chart={chart} />
      </section>

      {/* S6 · 典籍依据 */}
      <section className="bg-deep2 pb-24">
        <div className="zf-container max-w-[880px] space-y-5">
          {[
            { book: '滴天髓', quote: '「得时俱为旺论，失时便作衰看。」', source: '论月令之气' },
            { book: '子平真诠', quote: '「八字用神，专求月令。」', source: '论格局之源' },
          ].map((q, i) => (
            <motion.div
              key={q.book}
              initial={reduce ? { opacity: 0 } : { x: -24, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: reduce ? 0 : i * 0.12, duration: reduce ? 0.2 : 0.6, ease: 'easeOut' }}
            >
              <QuoteStrip book={q.book} quote={q.quote} source={q.source} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* 深 → 页脚过渡 */}
      <div className="h-24" style={{ background: 'linear-gradient(to bottom, rgb(var(--deep-2)), rgb(var(--deep-3)))' }} />
    </div>
  )
}
