import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { BaziChartV2 } from '@contracts/bazi-core'
import { setPageMeta } from '@/lib/pageMeta'
import PageHero from '@/components/bazi/PageHero'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import { GhostButton } from '@/components/Buttons'
import BirthFormCard, {
  defaultBirthForm,
  type BirthFormState,
} from '@/components/bazi-v2/BirthFormCard'
import TimeAuditBar from '@/components/bazi-v2/TimeAuditBar'
import ChartSummaryStrip from '@/components/bazi-v2/ChartSummaryStrip'
import PillarsSection from '@/components/bazi-v2/PillarsSection'
import WuxingSection from '@/components/bazi-v2/WuxingSection'
import DetailTabs from '@/components/bazi-v2/DetailTabs'
import LifeChart from '@/components/bazi-v2/LifeChart'
import AiReadingSection from '@/components/bazi-v2/AiReadingSection'
import MasterHintsSection from '@/components/bazi-v2/MasterHintsSection'
import CoreSummary from '@/components/bazi-v2/CoreSummary'
import HistorySection from '@/components/bazi-v2/HistorySection'
import { ChengguCard, RelationsTable, ShenshaTable, TenGodsTable } from '@/components/bazi-v2/ChartDetails'
import type { PaipanPayload, PaipanResponse } from '@/components/bazi-v2/api'
import { trpc } from '@/providers/trpc'
import { useEngine } from '@/hooks/useEngine'
import { paipanBazi } from '@/engines/client/bazi'
import { SafeStorage, STORAGE_KEYS, consumeRestoreItem } from '@/lib/storage'

const HERO_POOL = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '子', '丑', '寅', '卯', '财', '官', '印', '食']

export default function Bazi() {
  const reduce = useReducedMotion()
  const [restored] = useState(() => consumeRestoreItem('bazi'))
  const restoredChart = restored?.payload as BaziChartV2 | undefined
  const initialChart = restoredChart?.pillars && restoredChart.input ? restoredChart : null
  const [form, setForm] = useState<BirthFormState>(defaultBirthForm())
  const [chart, setChart] = useState<BaziChartV2 | null>(initialChart)
  const [chartTitle, setChartTitle] = useState<string>(initialChart ? restored?.title ?? '' : '')
  const [chartId, setChartId] = useState<number | null>(null)
  const [persisted, setPersisted] = useState(false)
  /** 人生轨迹图「AI 解释此阶段」的阶段标签（接力给 AI 详批区） */
  const [aiStage, setAiStage] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLElement>(null)
  const utils = trpc.useUtils()

  useEffect(() => {
    setPageMeta(
      '八字排盘 · 紫府 — 服务端排盘，真太阳时校正，全量可解释',
      '紫府八字排盘——依古法起四柱、排大运流年，真太阳时校正，全量可解释，AI 逐句引经参详。',
    );
  }, [])

  // 浏览器直跑引擎（静态托管无后端）；返回形状与 trpc.bazi.paipan 一致
  const paipan = useEngine(paipanBazi, {
    onSuccess: async (data) => {
      const res = data as unknown as PaipanResponse
      setChart(res.chart)
      setChartId(res.chartId)
      setPersisted(res.persisted)
      // 自动保存历史（最近10条）。注意：浏览器直跑 chartId 恒为 null，
      // 不能作为保存条件——用时间戳生成本地 id
      if (res.chart) {
        const item = {
          id: `hist-${Date.now()}`,
          type: 'bazi',
          title: chartTitle || `八字排盘 ${new Date().toLocaleDateString('zh-CN')}`,
          createdAt: new Date().toISOString(),
          payload: res.chart,
        }
        const existing = SafeStorage.get(STORAGE_KEYS.HISTORY, [])
        SafeStorage.set(STORAGE_KEYS.HISTORY, [item, ...existing].slice(0, 10))
      }
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
    // 契约（浏览器直跑）：完整 BirthInput + title → { chart, chartId, persisted }
    paipan.mutate(payload)
  }

  const restore = (restored: BaziChartV2, title: string, id: number | null) => {
    setChart(restored)
    setChartTitle(title)
    setChartId(id)
    setPersisted(true)
  }

  /** 轨迹节点「AI 解释此阶段」→ 滚动到 AI 详批区并传递阶段语境 */
  const handleAiExplain = (stageLabel: string) => {
    setAiStage(stageLabel)
    detailRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }

  // 收藏当前命盘到 localStorage（STORAGE_KEYS.FAVORITES）。数据仅本地，不脱敏上传。
  const handleFavorite = () => {
    if (!chart) return
    const item = {
      id: `fav-${chartId ?? 'local'}-${Date.now()}`,
      type: 'bazi',
      title: chartTitle || `八字排盘 ${new Date().toLocaleDateString('zh-CN')}`,
      createdAt: new Date().toISOString(),
      payload: chart,
    }
    const existing = SafeStorage.get(STORAGE_KEYS.FAVORITES, [])
    // 去重：同一命盘（payload 摘要）不重复收藏
    const signature = JSON.stringify(chart.pillars)
    const deduped = existing.filter(
      (f: { payload?: unknown }) => JSON.stringify((f.payload as { pillars?: unknown })?.pillars) !== signature,
    )
    SafeStorage.set(STORAGE_KEYS.FAVORITES, [item, ...deduped])
  }

  const errorText = paipan.isError
    ? paipan.error?.message || '排盘服务暂不可用，请稍后重试。'
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

              {/* 首屏结果摘要（四柱卡之前） */}
              <ChartSummaryStrip chart={chart} />

              {/* 排盘依据 */}
              <TimeAuditBar chart={chart} />

              {/* 四柱 + 命身宫 */}
              {/* 命盘速览（人话版第一屏 + AI 解读主入口） */}
              <CoreSummary chart={chart} onAiRead={() => handleAiExplain('AI 详批')} />

              <PillarsSection chart={chart} />

              {/* 五行分析 */}
              <WuxingSection chart={chart} />

              {/* 名家视角（蒸馏规则引擎参详提示） */}
              <MasterHintsSection chart={chart} />

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
              <LifeChart chart={chart} onAiExplain={handleAiExplain} />

              {/* 操作行 */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
                <GhostButton
                  className="border-golddim/50 text-golddim hover:bg-golddim/10"
                  onClick={() => {
                    setChart(null)
                    setChartId(null)
                    setPersisted(false)
                    setAiStage(null)
                    paipan.reset()
                    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
                  }}
                >
                  重新排盘
                </GhostButton>
                <button
                  onClick={handleFavorite}
                  className="zf-link-more inline-flex items-center gap-1 text-[14px] font-medium tracking-[0.1em] text-golddim"
                >
                  收藏
                </button>
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
        <AiReadingSection
          chart={chart}
          chartId={chartId}
          stage={aiStage}
          onStageConsumed={() => setAiStage(null)}
        />
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
