import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import PageHero from '@/components/sanshi/PageHero'
import { setPageMeta } from '@/lib/pageMeta'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import TiandiPan from '@/components/sanshi/TiandiPan'
import { FormInput, FormSelect, SegmentedControl } from '@/components/FormControls'
import { DeepButton, GoldButton } from '@/components/Buttons'
import { BRANCHES } from '@contracts/bazi-core'
import type { DaliurenChart } from '@contracts/engines/daliuren-core'
import type { EngineResult } from '@contracts/engines/engine-result'
import { trpc } from '@/providers/trpc'
import { useEngine } from '@/hooks/useEngine'
import { qikeDaliuren } from '@/engines/client/daliuren'
import { aiBackendUnavailableText } from '@/lib/ai-reading-error'
import { useAuth } from '@/hooks/useAuth'
import { usePaymentEnabled, RECHARGE_CLOSED_HINT } from '@/hooks/usePaymentEnabled'
import { LOGIN_PATH } from '@/const'
import { cn } from '@/lib/utils'
import type { ReadingResponse } from '@/components/bazi-v2/api'
import { SafeStorage, STORAGE_KEYS } from '@/lib/storage'
import type { FavoriteItem, HistoryItem } from '@/lib/storage'

const HERO_POOL = [
  '贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙',
  '天空', '白虎', '太常', '玄武', '太阴', '天后',
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
  '三传', '四课', '月将', '日辰',
]

const HOUR_OPTIONS = BRANCHES.map((b, i) => {
  const start = String((2 * i + 23) % 24).padStart(2, '0')
  const end = String((2 * i + 1) % 24).padStart(2, '0')
  return { value: String(i), label: `${b}时 ${start}:00–${end}:59` }
})

const YEARS = Array.from({ length: 21 }, (_, i) => 2020 + i)

const CHUAN_LABEL = ['初传', '中传', '末传'] as const

function nowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  const hour = Number(get('hour'))
  return {
    year: get('year'),
    month: String(Number(get('month'))),
    day: String(Number(get('day'))),
    hour: String(Math.floor(((hour + 1) % 24) / 2)),
  }
}

/** 时辰支序 → 代表时刻（取时辰中点小时：子=0、丑=2……避免子初换日歧义） */
const hourOfBranch = (b: number) => (2 * b) % 24

function chartTitle(chart: DaliurenChart): string {
  return chart.input.question?.trim()
    ? `${chart.input.question.trim()} · 大六壬`
    : `大六壬课 ${chart.standardTime}`
}

/* ================= AI 参详（chartId → ai.reading，同六爻模式） ================= */

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

const PERSONAS: { id: Persona; latin: string; name: string; desc: string }[] = [
  { id: 'scholar', latin: 'SCHOLAR', name: '严谨学者', desc: '客观克制，引经据典，条分缕析' },
  { id: 'hermit', latin: 'HERMIT', name: '幽默隐士', desc: '随性诙谐，妙语点破，围炉夜话' },
]

function trpcCode(err: unknown): string | null {
  if (err && typeof err === 'object' && 'data' in err) {
    const code = (err as { data?: { code?: unknown } }).data?.code
    if (typeof code === 'string') return code
  }
  return null
}

function newIdempotencyKey(chartId: number): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.trunc(performance.now() * 1000).toString(36)}`
  return `daliuren-reading:${chartId}:${uuid}`
}

function AiReadingSection({ chartId }: { chartId: number | null }) {
  const { user, isLoading: authLoading } = useAuth()
  const paymentEnabled = usePaymentEnabled()
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('pro')
  const [result, setResult] = useState<ReadingResponse | null>(null)

  const reading = trpc.ai.reading.useMutation({
    onSuccess: (data) => setResult(data as unknown as ReadingResponse),
  })

  const canRun = !!user && chartId !== null && !reading.isPending
  const run = () => {
    if (!canRun || chartId === null) return
    setResult(null)
    reading.mutate({ chartId, persona, depth, idempotencyKey: newIdempotencyKey(chartId) })
  }

  /* ---------- 游客引导卡 ---------- */
  if (!authLoading && !user) {
    return (
      <div className="rounded-xl border border-gold/40 bg-deep p-6 text-center sm:p-10">
        <p className="font-serif text-[18px] font-bold tracking-[0.1em] text-silktext">
          登录后使用 AI 参详
        </p>
        <p className="mx-auto mt-3 max-w-[460px] text-[13px] leading-[1.9] text-silkmuted">
          课传会自动保存在本机；AI 参详登录后直连服务，服务不可用时进入降级模式。
          每日 20 次额度；live 参详每次消耗 1 灵签，模板参详免费，失败不扣费。
        </p>
        <DeepButton to={LOGIN_PATH} className="mt-7 border border-gold/50">
          前往登录
        </DeepButton>
      </div>
    )
  }

  const paragraphs = result ? result.text.split(/\n{2,}|\n/).filter((p) => p.trim().length > 0) : []
  const code = reading.isError ? trpcCode(reading.error) : null

  return (
    <div>
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
                active ? 'border-gold bg-deep' : 'border-golddim/25 bg-deep/50 hover:border-golddim/50',
              )}
            >
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
          id="daliuren-depth"
          value={depth}
          onChange={setDepth}
          options={[
            { value: 'pro', label: '专业级 · 完整推演' },
            { value: 'plain', label: '通俗级 · 直给结论' },
          ]}
        />
      </div>

      <div className="mt-8 text-center">
        <GoldButton
          disabled={!canRun}
          className={cn(!canRun && 'cursor-not-allowed opacity-40')}
          onClick={run}
        >
          {reading.isPending ? '参详中…' : '开始参详'}
        </GoldButton>
        {chartId === null && (
          <p className="mt-3 text-[12.5px] text-silkmuted">
            课传已保存在本机；当前为 AI 降级模式。请在服务可用且已登录时重新起课，以启用直连参详。
          </p>
        )}
        <p className="mt-3 text-[11.5px] text-silkmuted">
          live 参详每次消耗 1 灵签；模板参详（非 AI，fallback）免费；参详失败不扣费。
        </p>
        {reading.isError && (
          <div
            role="alert"
            className="mx-auto mt-5 max-w-[520px] rounded-lg border border-[#B04A3A]/50 bg-[#B04A3A]/10 px-5 py-4"
          >
            <p className="font-serif text-[14px] font-bold tracking-[0.08em] text-[#E0A39A]">
              {code === 'TOO_MANY_REQUESTS' ? '额度或频率受限' : code === 'FORBIDDEN' ? '灵签余额不足' : '参详失败'}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-[1.8] text-[#E0A39A]/90">
              {code === 'FORBIDDEN' && !paymentEnabled
                ? `live 参详每次消耗 1 灵签。${RECHARGE_CLOSED_HINT}。`
                : (aiBackendUnavailableText(reading.error) ??
                  (reading.error instanceof Error
                    ? reading.error.message
                    : 'AI 参详服务暂不可用，本次未扣除费用，请稍后重试。'))}
            </p>
          </div>
        )}
      </div>

      {/* 输出卡 */}
      <AnimatePresence>
        {result && (
          <motion.div
            key={`${persona}-${depth}-${result.source}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-12 rounded-xl border-l-[3px] border-gold bg-deep p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] tracking-[0.14em] text-silkmuted">
                参详输出 · {persona === 'scholar' ? '严谨学者' : '幽默隐士'} ·{' '}
                {depth === 'pro' ? '专业级' : '通俗级'}
              </p>
              {result.source === 'live' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-[11.5px] font-medium tracking-[0.12em] text-goldbright">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-goldbright" />
                  live · 模型 {result.model ?? '未知'} · 消耗 1 灵签
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-silkmuted/40 bg-silktext/5 px-3 py-1 text-[11.5px] font-medium tracking-[0.12em] text-silkmuted">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-silkmuted" />
                  fallback · 模板参详（非 AI 生成，免费）
                </span>
              )}
            </div>
            <div className="mt-6 space-y-5">
              {paragraphs.map((p, i) => (
                <p key={i} className="font-serif text-[15.5px] leading-[2.1] text-silktext">
                  {p}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ================= 页面 ================= */

export default function Daliuren() {
  const init = useMemo(() => nowParts(), [])
  const [year, setYear] = useState(init.year)
  const [month, setMonth] = useState(init.month)
  const [day, setDay] = useState(init.day)
  const [hour, setHour] = useState(init.hour)
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<EngineResult<DaliurenChart> | null>(null)
  const [chartId, setChartId] = useState<number | null>(null)
  const [runId, setRunId] = useState(0)
  const [favoriteStatus, setFavoriteStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const panRef = useRef<HTMLElement | null>(null)

  // 浏览器直跑引擎（静态托管无后端）；返回形状与 trpc.daliuren.qike 一致
  const qike = useEngine(qikeDaliuren, {
    onSuccess: (res) => {
      setResult(res.result as unknown as EngineResult<DaliurenChart>)
      setChartId(res.chartId)
      setRunId((n) => n + 1)
      if (res.result.data) {
        const item: HistoryItem = {
          id: `hist-${Date.now()}`,
          type: 'daliuren',
          title: chartTitle(res.result.data),
          createdAt: new Date().toISOString(),
          payload: res.result.data,
        }
        const existing = SafeStorage.get<HistoryItem[]>(STORAGE_KEYS.HISTORY, [])
        SafeStorage.set(STORAGE_KEYS.HISTORY, [item, ...existing].slice(0, 10))
      }
      requestAnimationFrame(() => panRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    },
  })

  useEffect(() => {
    setPageMeta(
      '大六壬 · 紫府 — 月将加时，三传定事之始中末',
      '紫府大六壬——月将加时成课，三传定事之始中末，依《六壬大全》参详。',
    );
  }, [])

  useEffect(() => {
    if (favoriteStatus === 'idle') return
    const timer = window.setTimeout(() => setFavoriteStatus('idle'), 1800)
    return () => window.clearTimeout(timer)
  }, [favoriteStatus])

  const submit = () => {
    qike.mutate({
      datetime: {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: hourOfBranch(Number(hour)),
        minute: 0,
      },
      ianaTimezone: 'Asia/Shanghai',
      question: question.trim() || undefined,
    })
  }

  const chart = result?.data ?? null
  const meta = result?.meta ?? null

  const handleFavorite = () => {
    if (!chart) return
    const item: FavoriteItem = {
      id: `fav-${chartId ?? 'local'}-${Date.now()}`,
      type: 'daliuren',
      title: chartTitle(chart),
      createdAt: new Date().toISOString(),
      payload: chart,
    }
    const existing = SafeStorage.get<FavoriteItem[]>(STORAGE_KEYS.FAVORITES, [])
    const deduped = existing.filter((favorite) => {
      if (favorite.type !== 'daliuren') return true
      const saved = favorite.payload as Partial<DaliurenChart>
      return saved.standardTime !== chart.standardTime || saved.input?.question !== chart.input.question
    })
    setFavoriteStatus(SafeStorage.set(STORAGE_KEYS.FAVORITES, [item, ...deduped]) ? 'success' : 'error')
  }

  return (
    <div>
      {/* ===== S1 · PageHero ===== */}
      <PageHero
        glyph="壬"
        title="大六壬"
        latin="Da Liu Ren"
        subtitle="月将加时，四课三传——一课既成，始中末三段自分"
        crumb="大六壬"
        pool={HERO_POOL}
      />

      <div className="zf-fade-to-silk h-[180px]" />

      {/* ===== S2 · 起课表单 ===== */}
      <section className="relative bg-silk pb-24 pt-4">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative zf-container flex flex-col items-center">
          <SectionHeading
            eyebrow="Divination"
            title="起 课"
            sub="默认此时此刻，亦可自定年月日时——真实节气换将，同一时刻，课传如一"
          />
          <div className="mt-12 w-full max-w-[680px] rounded-xl border border-golddim/25 bg-silk2 p-4 shadow-card sm:p-8 md:p-10">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
              <FormSelect label="起课年" value={year} onChange={(e) => setYear(e.target.value)}>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y} 年
                  </option>
                ))}
              </FormSelect>
              <FormSelect label="月" value={month} onChange={(e) => setMonth(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} 月
                  </option>
                ))}
              </FormSelect>
              <FormSelect label="日" value={day} onChange={(e) => setDay(e.target.value)}>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} 日
                  </option>
                ))}
              </FormSelect>
              <FormSelect label="时辰" value={hour} onChange={(e) => setHour(e.target.value)}>
                {HOUR_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </FormSelect>
            </div>
            <FormInput
              className="mt-6"
              label="所问之事（可选）"
              placeholder="问事方向，如求财 / 谋职 / 远行"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="mt-8 flex flex-col items-center gap-3">
              <GoldButton
                className="w-full sm:w-auto"
                disabled={qike.isPending}
                onClick={submit}
              >
                {qike.isPending ? '起课中…' : '起课'}
              </GoldButton>
              {qike.isError && (
                <p role="alert" className="text-[12.5px] text-[#B04A3A]">
                  {qike.error instanceof Error ? qike.error.message : '起课失败，请稍后重试。'}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== S3 · 天地盘 + 四课三传 ===== */}
      <AnimatePresence>
        {chart && meta && (
          <motion.section
            key="ke"
            ref={(el) => {
              panRef.current = el
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative bg-silk pb-28"
          >
            <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
            <div className="relative zf-container">
              <SectionHeading
                eyebrow="Heaven & Earth"
                title="天地盘 · 四课三传"
                sub={`日干支 ${chart.dayGanzhi} · 时干支 ${chart.hourGanzhi} · 月将 ${chart.yuejiang.branch}·${chart.yuejiang.name}（${chart.yuejiang.zhongqi} ${chart.yuejiang.zhongqiTime} 换将）`}
              />

              {/* 起课方法 + meta badge */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="font-serif text-[20px] font-bold tracking-[0.14em] text-gold">
                  {chart.method.name}
                </p>
                <p className="max-w-[640px] text-center text-[12.5px] leading-[1.9] text-inkmuted">
                  {chart.method.condition}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-[11.5px] font-medium tracking-[0.12em] text-golddim">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-goldbright" />
                    {meta.precision === 'validated' ? 'validated · 真实算法' : meta.precision} · {meta.ruleVariant}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-golddim/30 px-3 py-1 text-[11.5px] tracking-[0.12em] text-inkmuted">
                    {meta.algorithmVersion} · {chart.xunShou}（旬空 {chart.xunkong.join('')}）
                  </span>
                </div>
              </div>

              <div className="mt-14 grid items-start gap-14 lg:grid-cols-2 lg:gap-10">
                {/* 左：天地盘 */}
                <div>
                  <TiandiPan key={runId} chart={chart} />
                  <p className="mt-6 text-center text-[12.5px] tracking-[0.08em] text-inkmuted">
                    外环地盘十二支 · 内环天盘（月将加时）· 小字为十二天将 · 贵人{chart.guiren.branch}宫{chart.guiren.direction}（{chart.guiren.isDay ? '昼' : '夜'}占）
                  </p>
                </div>

                {/* 右：四课三传 */}
                <div className="flex flex-col gap-12">
                  {/* 四课 */}
                  <div>
                    <h3 className="font-serif text-[17px] font-bold tracking-[0.14em] text-inktext">
                      四课 <span className="ml-2 font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Four Lessons</span>
                    </h3>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:items-stretch sm:gap-0">
                      {chart.lessons.map((l, i) => (
                        <div key={`${runId}-lesson-${i}`} className="flex min-w-0 items-center sm:flex-1">
                          <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                            className="min-w-0 flex-1 rounded-lg border border-golddim/25 bg-silk2 px-3 py-4 text-center"
                          >
                            <p className="text-[11px] tracking-[0.14em] text-inkmuted">第{['一', '二', '三', '四'][i]}课</p>
                            <p className="mt-2 font-serif text-[19px] font-bold leading-snug text-inktext">
                              {l.shang}
                              <span className="mx-1 text-golddim/70">/</span>
                              <span className="text-[15px] font-semibold text-inkmuted">{l.xia}</span>
                            </p>
                            <p className="mt-1 text-[11px] text-inkmuted">上神 / 下神</p>
                            <p className="mt-1 text-[11px] tracking-[0.14em] text-golddim">{l.general}</p>
                          </motion.div>
                          {i < 3 && <span className="mx-1 hidden h-px w-3 shrink-0 self-center bg-gold/50 sm:block md:w-4" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 三传 */}
                  <div>
                    <h3 className="font-serif text-[17px] font-bold tracking-[0.14em] text-inktext">
                      三传 <span className="ml-2 font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Three Passages</span>
                    </h3>
                    <div className="mt-5 flex items-start gap-5">
                      <div className="flex w-full max-w-[300px] flex-col items-stretch">
                        {chart.chuan.map((c, i) => (
                          <div key={`${runId}-chuan-${i}`}>
                            {i > 0 && (
                              <motion.div
                                initial={{ scaleY: 0, opacity: 0 }}
                                animate={{ scaleY: 1, opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.15, duration: 0.4, ease: 'easeOut' }}
                                className="flex origin-top justify-center py-1.5"
                              >
                                <ArrowDown className="h-4 w-4 text-gold" strokeWidth={1.5} />
                              </motion.div>
                            )}
                            <motion.div
                              initial={{ opacity: 0, y: 24 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.35 + i * 0.15, duration: 0.5, ease: 'easeOut' }}
                              className={cn(
                                'rounded-lg border bg-silk2 px-5 py-4',
                                i === 0 ? 'border-gold/70 shadow-card' : 'border-golddim/25',
                              )}
                            >
                              <div className="flex items-baseline justify-between">
                                <span className="text-[11.5px] tracking-[0.16em] text-inkmuted">
                                  {CHUAN_LABEL[i]}
                                </span>
                                <span className="text-[11.5px] text-golddim">{c.general}</span>
                              </div>
                              <div className="mt-1.5 flex items-baseline justify-between">
                                <span className="font-serif text-[22px] font-bold tracking-[0.1em] text-inktext">
                                  {c.ganzhi}
                                  {c.isXunkong && (
                                    <span className="ml-1.5 align-middle text-[11px] font-normal tracking-[0.1em] text-[#B04A3A]">
                                      旬空
                                    </span>
                                  )}
                                </span>
                                <span className="text-[12px] text-inkmuted">
                                  {c.liuqin} · {c.wuxing}
                                </span>
                              </div>
                            </motion.div>
                          </div>
                        ))}
                      </div>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.6 }}
                        className="pt-2 font-serif text-[13px] tracking-[0.3em] text-golddim"
                        style={{ writingMode: 'vertical-rl' }}
                      >
                        始 → 中 → 末
                      </motion.p>
                    </div>
                    <p className="mt-4 text-[11.5px] leading-[1.8] tracking-[0.06em] text-inkmuted">
                      干支为旬遁遁干 · 六亲以日干「{chart.dayGanzhi[0]}」为纲 · 将即所乘十二天将
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleFavorite}
                  aria-live="polite"
                  className="zf-link-more inline-flex items-center gap-1 text-[14px] font-medium tracking-[0.1em] text-golddim"
                >
                  {favoriteStatus === 'success'
                    ? '已收藏'
                    : favoriteStatus === 'error'
                      ? '保存失败'
                      : '收藏'}
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 浅 → 深 */}
      <div className="zf-fade-to-deep h-[160px]" />

      {/* ===== S4 · AI 参详区（深色） ===== */}
      {chart && (
        <section className="relative overflow-hidden bg-deep2 py-24">
          <div className="relative mx-auto w-full max-w-[860px] px-6 md:px-10">
            <SectionHeading
              dark
              eyebrow="Interpretation"
              title="参 详"
              sub="初传为始，中传为移，末传为归——AI 参详采用服务直连，后端不可用时显示降级提示"
            />
            <div className="mt-14">
              <AiReadingSection key={runId} chartId={chartId} />
            </div>
          </div>
        </section>
      )}

      {/* ===== S5 · 典籍依据 ===== */}
      <section className="relative overflow-hidden bg-deep2 py-28">
        <div className="relative mx-auto w-full max-w-[860px] px-6 md:px-10">
          <SectionHeading dark eyebrow="Classics" title="典 籍 依 据" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mt-14"
          >
            <QuoteStrip
              book="六壬大全"
              quote="三传者，事之始中末也。"
              source="《六壬大全》（公版短引）"
            />
            <p className="mt-6 text-center text-[12.5px] tracking-[0.08em] text-silkmuted">
              月将以中气换将（真实节气时刻）· 月将加时支成天地盘 · 四课依十干寄宫 · 三传依九宗门 · 十二天将依贵人诀昼夜顺逆
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
