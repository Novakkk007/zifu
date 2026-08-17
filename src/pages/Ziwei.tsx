import { useMemo, useRef, useState, useEffect } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import QuoteStrip from '@/components/QuoteStrip'
import SectionHeading from '@/components/SectionHeading'
import { FormInput, FormSelect, SegmentedControl } from '@/components/FormControls'
import { GoldButton } from '@/components/Buttons'
import PalaceDrawer from '@/components/ziwei/PalaceDrawer'
import ZiweiChart from '@/components/ziwei/ZiweiChart'
import ZiweiAiReading from '@/components/ziwei/ZiweiAiReading'
import type { EngineResult, ZiweiChartData, ZiweiPalace } from '@contracts/engines/ziwei-core'
import { HOUR_OPTIONS, HUA_COLOR, PALACE_DUTY, liunianOf } from '@/components/ziwei/logic'
import { useEngine } from '@/hooks/useEngine'
import { paipanZiwei } from '@/engines/client/ziwei'
import { cn } from '@/lib/utils'
import { SafeStorage, STORAGE_KEYS, consumeRestoreItem } from '@/lib/storage'
import type { FavoriteItem, HistoryItem } from '@/lib/storage'

type Tab = 'daxian' | 'liunian'

type ZiweiSubmission = Parameters<typeof paipanZiwei>[0]

const CHART_TITLE_SUFFIX = '的紫微命盘'

function getSubmittedName(variables: ZiweiSubmission | null): string {
  const title = variables?.title?.trim()
  if (!title?.endsWith(CHART_TITLE_SUFFIX)) return ''
  return title.slice(0, -CHART_TITLE_SUFFIX.length)
}

function readRestoredZiwei(): {
  result: EngineResult<ZiweiChartData>
  snapshot: ZiweiSubmission
} | null {
  const restored = consumeRestoreItem('ziwei')
  const chart = restored?.payload as ZiweiChartData | undefined
  if (!chart?.input || !Array.isArray(chart.palaces)) return null

  try {
    const snapshot = { ...chart.input, title: restored?.title ?? '' }
    const rebuilt = paipanZiwei(snapshot)
    return {
      result: { ...rebuilt.result, data: chart },
      snapshot,
    }
  } catch (error) {
    console.warn('紫微回看恢复失败:', error)
    return null
  }
}

export default function Ziwei() {
  const [restored] = useState(readRestoredZiwei)
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>('solar')
  const [year, setYear] = useState('1995')
  const [month, setMonth] = useState('6')
  const [day, setDay] = useState('15')
  const [hourBranch, setHourBranch] = useState('0')
  const [isLeapMonth, setIsLeapMonth] = useState(false)
  const [yearError, setYearError] = useState<string | null>(null)

  const [result, setResult] = useState<EngineResult<ZiweiChartData> | null>(restored?.result ?? null)
  const [successfulSnapshot, setSuccessfulSnapshot] = useState<ZiweiSubmission | null>(restored?.snapshot ?? null)
  const [chartId, setChartId] = useState<number | null>(null)
  const [selCell, setSelCell] = useState<ZiweiPalace | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [favoriteStatus, setFavoriteStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [tab, setTab] = useState<Tab>('daxian')
  const [dxIdx, setDxIdx] = useState<number | null>(null)
  const thisYear = new Date().getFullYear()
  const [lnYear, setLnYear] = useState(String(thisYear))

  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = '紫微斗数 · 紫府 — 北派全书安星法，十二宫排盘'
  }, [])

  useEffect(() => {
    if (favoriteStatus === 'idle') return
    const timer = window.setTimeout(() => setFavoriteStatus('idle'), 1800)
    return () => window.clearTimeout(timer)
  }, [favoriteStatus])

  const chart = result?.data ?? null

  // 浏览器直跑引擎（静态托管无后端）；返回形状与 trpc.ziwei.paipan 一致
  const paipan = useEngine(paipanZiwei, {
    onSuccess: async (data, variables) => {
      setResult(data.result as EngineResult<ZiweiChartData>)
      setSuccessfulSnapshot(variables)
      setChartId(data.chartId)
      setDxIdx(null)
      window.setTimeout(() => chartRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
      // 自动保存历史（最近10条）。注意：浏览器直跑 chartId 恒为 null，
      // 不能作为保存条件——用时间戳生成本地 id
      if (data.result.data) {
        const item: HistoryItem = {
          id: `hist-${Date.now()}`,
          type: 'ziwei',
          title: variables.title ?? `紫微命盘 ${new Date().toLocaleDateString('zh-CN')}`,
          createdAt: new Date().toISOString(),
          payload: data.result.data,
        }
        const existing = SafeStorage.get<HistoryItem[]>(STORAGE_KEYS.HISTORY, [])
        SafeStorage.set(STORAGE_KEYS.HISTORY, [item, ...existing].slice(0, 10))
      }
    },
  })

  const handleSubmit = () => {
    const rawYear = year.trim()
    const y = Number(rawYear)
    let validationError: string | null = null

    if (!rawYear) {
      validationError = '请输入出生年。'
    } else if (!Number.isInteger(y)) {
      validationError = '出生年须为整数。'
    } else if (y < 1920 || y > thisYear) {
      validationError = `出生年须在 1920–${thisYear} 年之间。`
    }

    setYearError(validationError)
    if (validationError) return

    const submittedName = name.trim()
    paipan.mutate({
      calendar,
      year: y,
      month: Number(month),
      day: Number(day),
      hourBranch: Number(hourBranch),
      gender,
      isLeapMonth: calendar === 'lunar' ? isLeapMonth : undefined,
      title: submittedName ? `${submittedName}${CHART_TITLE_SUFFIX}` : `紫微命盘 ${new Date().toLocaleDateString('zh-CN')}`,
    })
  }

  const handleSelectCell = (cell: ZiweiPalace) => {
    setSelCell(cell)
    setDrawerOpen(true)
  }

  const lnInfo = useMemo(() => {
    if (!chart) return null
    return liunianOf(chart, Number(lnYear))
  }, [chart, lnYear])

  const dxSteps = chart?.daxian.steps ?? []
  const selDx = dxIdx !== null ? dxSteps[dxIdx] : null
  const currentDx = chart ? dxSteps[chart.currentDaxianIndex] : null

  // 收藏当前命盘到 localStorage（STORAGE_KEYS.FAVORITES）。数据仅本地，不脱敏上传。
  const handleFavorite = () => {
    if (!chart) return
    const item: FavoriteItem = {
      id: `fav-${chartId ?? 'local'}-${Date.now()}`,
      type: 'ziwei',
      title: successfulSnapshot?.title ?? `紫微命盘 ${new Date().toLocaleDateString('zh-CN')}`,
      createdAt: new Date().toISOString(),
      payload: chart,
    }
    const existing = SafeStorage.get<FavoriteItem[]>(STORAGE_KEYS.FAVORITES, [])
    // 去重：同一命盘（payload 摘要）不重复收藏
    const signature = JSON.stringify(chart.palaces)
    const deduped = existing.filter((favorite) => {
      if (favorite.type !== 'ziwei') return true
      return JSON.stringify((favorite.payload as { palaces?: unknown })?.palaces) !== signature
    })
    setFavoriteStatus(SafeStorage.set(STORAGE_KEYS.FAVORITES, [item, ...deduped]) ? 'success' : 'error')
  }

  return (
    <div>
      {/* S1 · PageHero（深色） */}
      <section className="relative flex min-h-[38dvh] flex-col overflow-hidden bg-deep">
        <FloatingGlyphs count={36} onDeep />
        <div className="zf-container relative flex flex-1 flex-col items-center justify-center py-16 text-center">
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute left-6 top-6 flex items-center gap-2 text-[12px] tracking-[0.14em] text-silkmuted md:left-10"
          >
            <Link to="/" className="transition-colors hover:text-goldbright">首页</Link>
            <span className="text-silkmuted/50">/</span>
            <span>术数推演</span>
            <span className="text-silkmuted/50">/</span>
            <span className="text-goldbright">紫微斗数</span>
          </motion.nav>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex flex-col items-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gold/40 font-serif text-[30px] font-black text-goldbright">
              紫
            </div>
            <p className="mt-6 font-latin text-[12px] font-medium uppercase tracking-[0.38em] text-gold">
              Zi Wei Dou Shu
            </p>
            <h1 className="mt-3 font-serif text-[clamp(34px,5vw,56px)] font-bold tracking-[0.08em] text-silktext">
              紫微斗数
            </h1>
            <div className="zf-hairline mt-6" />
            <p className="mt-6 max-w-md text-[14px] leading-[1.95] text-silkmuted">
              北派全书安星 · 五行局定紫微 · 观主星四化与大限流年
            </p>
          </motion.div>
        </div>
      </section>

      <div className="zf-fade-to-deep h-40 rotate-180" />

      {/* S2 · 生辰表单（浅色） */}
      <section className="bg-silk py-20 md:py-28">
        <div className="zf-container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <SectionHeading
              eyebrow="BIRTH DATA"
              title="录入生辰"
              sub="服务端排盘 · 安十二宫、布十四主星、标生年四化"
            />
            <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-golddim/20 bg-silk2/50 p-4 sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormInput
                  id="zw-name"
                  label="称谓"
                  placeholder="如何称呼您（可填化名）"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={12}
                />
                <div>
                  <p className="mb-2 font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">性别</p>
                  <SegmentedControl<'male' | 'female'>
                    id="zw-gender"
                    value={gender}
                    onChange={setGender}
                    options={[
                      { value: 'male', label: '男' },
                      { value: 'female', label: '女' },
                    ]}
                  />
                </div>
                <div>
                  <p className="mb-2 font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">历法</p>
                  <SegmentedControl<'solar' | 'lunar'>
                    id="zw-cal"
                    value={calendar}
                    onChange={(v) => {
                      setCalendar(v)
                      if (v === 'solar') setIsLeapMonth(false)
                    }}
                    options={[
                      { value: 'solar', label: '阳历' },
                      { value: 'lunar', label: '农历' },
                    ]}
                  />
                </div>
                <div>
                  <FormInput
                    id="zw-year"
                    label="出生年"
                    type="number"
                    min={1920}
                    max={thisYear}
                    required
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value)
                      if (yearError) setYearError(null)
                    }}
                    aria-invalid={yearError ? true : undefined}
                    aria-describedby={yearError ? 'zw-year-error' : undefined}
                  />
                  {yearError && (
                    <p id="zw-year-error" className="mt-1.5 text-[12px] text-[#B03A2E]" role="alert">
                      {yearError}
                    </p>
                  )}
                </div>
                <FormSelect id="zw-month" label="月" value={month} onChange={(e) => setMonth(e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} 月
                    </option>
                  ))}
                </FormSelect>
                <FormSelect id="zw-day" label="日" value={day} onChange={(e) => setDay(e.target.value)}>
                  {Array.from({ length: calendar === 'lunar' ? 30 : 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} 日
                    </option>
                  ))}
                </FormSelect>
                <div className="sm:col-span-2">
                  <FormSelect id="zw-hour" label="时辰" value={hourBranch} onChange={(e) => setHourBranch(e.target.value)}>
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </FormSelect>
                </div>
                {calendar === 'lunar' && (
                  <label className="flex items-center gap-2.5 sm:col-span-2">
                    <input
                      id="zw-leap"
                      type="checkbox"
                      checked={isLeapMonth}
                      onChange={(e) => setIsLeapMonth(e.target.checked)}
                      className="h-4 w-4 accent-[rgb(var(--gold))]"
                    />
                    <span className="text-[13px] leading-[1.7] text-inkmuted">
                      该月为农历闰月（闰月按当月安星，北派全书惯例）
                    </span>
                  </label>
                )}
              </div>
              <div className="mt-8 flex flex-col items-center gap-3">
                <GoldButton onClick={handleSubmit} disabled={paipan.isPending} className="w-full sm:w-auto">
                  {paipan.isPending ? '排盘中…' : '安星排盘'}
                </GoldButton>
                {paipan.isError && (
                  <p className="text-[12.5px] leading-[1.8] text-[#B03A2E]">
                    {paipan.error?.message || '排盘服务暂不可用，请稍后重试。'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* S3 · 十二宫盘 */}
      {result && chart && (
        <section ref={chartRef} className="scroll-mt-16 bg-silk pb-24 md:pb-32">
          <div className="zf-container">
            <SectionHeading
              eyebrow="THE CHART"
              title="十二宫盘"
              sub={`${getSubmittedName(successfulSnapshot) || '缘主'} · ${chart.input.gender === 'male' ? '乾造' : '坤造'} · 点击任一宫位查看详情`}
            />
            {/* 引擎 meta 徽章：流派 / 精度 / 算法版本 */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 text-[12px]">
              <span className="rounded-full border border-gold/60 bg-gold/10 px-3.5 py-1.5 tracking-[0.1em] text-golddim">
                {result.meta.ruleVariant}
              </span>
              <span className="rounded-full border border-[#2E7D6B]/50 bg-[#2E7D6B]/10 px-3.5 py-1.5 tracking-[0.1em] text-[#2E7D6B]">
                {result.meta.precision === 'validated' ? 'validated · 已验证真实算法' : result.meta.precision}
              </span>
              <span className="rounded-full border border-golddim/30 bg-silk2/60 px-3.5 py-1.5 tracking-[0.1em] text-inkmuted">
                {result.meta.algorithmVersion}
              </span>
              {chartId !== null && (
                <span className="rounded-full border border-golddim/30 bg-silk2/60 px-3.5 py-1.5 tracking-[0.1em] text-inkmuted">
                  已落库 #{chartId}
                </span>
              )}
            </div>
            {result.meta.warnings.length > 0 && (
              <div className="mx-auto mt-4 max-w-2xl space-y-1.5">
                {result.meta.warnings.map((w, i) => (
                  <p key={i} className="rounded-lg border border-golddim/25 bg-silk2/50 px-4 py-2 text-center text-[12px] leading-[1.8] text-inkmuted">
                    {w}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-10">
              <ZiweiChart chart={chart} onSelect={handleSelectCell} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
              <button
                type="button"
                onClick={handleFavorite}
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
        </section>
      )}

      <div className="zf-fade-to-deep h-44" />

      {/* S4 · 大限流年（深色） */}
      <section className="bg-deep2 py-24 md:py-32">
        <div className="zf-container">
          <SectionHeading
            dark
            eyebrow="DECADES & YEARS"
            title="大限流年"
            sub={
              chart
                ? `${chart.daxian.directionReason}，${chart.ju.num} 岁起限，十年一宫`
                : '十年一限看大走势，一年一宫看小气象'
            }
          />

          {/* Tabs */}
          <div className="mt-12 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-deep3/60 p-1">
              {(
                [
                  { id: 'daxian', label: '大限' },
                  { id: 'liunian', label: '流年' },
                ] as { id: Tab; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'relative min-h-11 rounded-full px-8 py-2 font-sans text-[13.5px] font-medium tracking-[0.14em] transition-colors sm:min-h-0',
                    tab === t.id ? 'text-deep3' : 'text-silkmuted hover:text-silktext',
                  )}
                >
                  {tab === t.id && (
                    <motion.span
                      layoutId="zw-tab-pill"
                      className="absolute inset-0 rounded-full [background:linear-gradient(135deg,rgb(var(--gold-bright)),rgb(var(--gold)))]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            <AnimatePresence mode="wait">
              {tab === 'daxian' ? (
                <motion.div
                  key="daxian"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.24 }}
                >
                  {chart ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                        {dxSteps.map((s, i) => {
                          const current = s.isCurrent
                          const selected = dxIdx === i
                          return (
                            <motion.button
                              key={s.branchIdx}
                              onClick={() => setDxIdx(i)}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: i * 0.05, duration: 0.5 }}
                              className={cn(
                                'relative rounded-lg border px-3 py-4 text-center transition-colors',
                                selected
                                  ? 'border-gold bg-gold/10'
                                  : current
                                    ? 'border-gold/80 bg-deep3/60'
                                    : 'border-gold/15 bg-deep3/40 hover:border-gold/40',
                              )}
                            >
                              {current && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gold px-2 py-px font-serif text-[10px] font-bold text-deep3">
                                  当前
                                </span>
                              )}
                              <p className="font-serif text-[14px] font-bold tracking-[0.1em] text-silktext">
                                {s.palaceName}
                              </p>
                              <p className="mt-1 text-[11px] tracking-[0.06em] text-silkmuted">
                                {s.startAge}–{s.endAge} 岁
                              </p>
                              <p className="text-[10.5px] text-silkmuted/70">
                                {s.ganzhi}宫
                              </p>
                            </motion.button>
                          )
                        })}
                      </div>
                      <div className="mt-6 min-h-[52px] rounded-lg border-l-[3px] border-gold bg-deep3/50 px-6 py-4">
                        <p className="font-serif text-[14.5px] leading-[1.95] text-silktext">
                          {selDx
                            ? `大限行至${selDx.palaceName}（${selDx.ganzhi}宫，${selDx.startAge}–${selDx.endAge} 岁虚岁）：十年以「${PALACE_DUTY[selDx.palaceName]}」为重。`
                            : currentDx
                              ? `当前大限行至${currentDx.palaceName}（${currentDx.ganzhi}宫，${currentDx.startAge}–${currentDx.endAge} 岁虚岁）——点击任一宫条带，参看该限气象。`
                              : ''}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-[13.5px] text-silkmuted">请先录入生辰，安星排盘后再观大限。</p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="liunian"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.24 }}
                  className="flex flex-col items-center"
                >
                  {chart && lnInfo ? (
                    <>
                      <div className="w-56">
                        <FormSelect
                          id="zw-ln-year"
                          label="流年"
                          value={lnYear}
                          onChange={(e) => setLnYear(e.target.value)}
                        >
                          {Array.from({ length: 11 }, (_, i) => thisYear - 5 + i).map((y) => (
                            <option key={y} value={y}>
                              {y} 年
                            </option>
                          ))}
                        </FormSelect>
                      </div>
                      <div className="mt-8 w-full rounded-lg border-l-[3px] border-gold bg-deep3/50 px-6 py-5">
                        <p className="font-serif text-[15px] leading-[2] text-silktext">
                          {lnInfo.year} 年（{lnInfo.stem}
                          {lnInfo.branch}）：太岁入{lnInfo.branch}宫，流年命宫即本盘
                          <span className="mx-1 text-goldbright">{lnInfo.palace.name}</span>
                          ——一年气象以「{PALACE_DUTY[lnInfo.palace.name]}」为纲。
                        </p>
                        {lnInfo.palace.majors.length > 0 && (
                          <p className="mt-2 text-[12.5px] text-silkmuted">
                            宫内主星：{lnInfo.palace.majors.map((s) => `${s.name}${s.hua ? `（生年化${s.hua}）` : ''}`).join('、')}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-silkmuted">
                          {lnInfo.sihua.map((s) => (
                            <span key={s.hua} className="inline-flex items-center gap-1.5">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: HUA_COLOR[s.hua] }}
                              />
                              流年化{s.hua}：{s.star}
                              {s.palaceName ? `（落本命${s.palaceName}）` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-[13.5px] text-silkmuted">请先录入生辰，安星排盘后再观流年。</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* S5 · AI 参详（真实服务端契约：chartId → ai.reading） */}
            <ZiweiAiReading
              chartId={chartId}
              chartSummary={
                result?.data
                  ? `紫微斗数命盘：命宫${result.data.mingGongGanzhi}，${result.data.ju.name}，命主${result.data.mingZhu}，身主${result.data.shenZhu}，生年四化${result.data.sihua.map((s) => `${s.star}${s.hua}`).join('、')}。请以先生口吻为访客参详此盘，总论先行，按主次分述，末了给希望。`
                  : undefined
              }
            />

            {/* S6 · 典籍依据 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-24 max-w-3xl"
            >
              <QuoteStrip book="紫微斗数全书" quote="紫微居垣，众星朝拱。" source="宋 · 陈抟 传" />
              <p className="mt-6 text-center text-[12.5px] leading-[1.9] text-silkmuted">
                安星依北派《紫微斗数全书》安星法：寅起正月安命身、纳音定五行局、商数法定紫微、
                紫府两系正曜逆顺分布、十干四化随星落宫；闰月按当月计，年干支以正月初一换年。
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <PalaceDrawer cell={selCell} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}
