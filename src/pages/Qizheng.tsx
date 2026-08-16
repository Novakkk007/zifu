import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageHero from '@/components/sanshi/PageHero'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import StarRing, { type StarRingChart } from '@/components/sanshi/StarRing'
import { FormSelect, SegmentedControl } from '@/components/FormControls'
import { DeepButton, GoldButton } from '@/components/Buttons'
import { BRANCHES, MANSIONS } from '@/components/sanshi/astro'
import { trpc } from '@/providers/trpc'
import { useEngine } from '@/hooks/useEngine'
import { paipanQizheng } from '@/engines/client/qizheng'
import { isValidSolarDate } from '@/engines/client/shared'
import { aiBackendUnavailableText } from '@/lib/ai-reading-error'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'
import { cn } from '@/lib/utils'

const HERO_POOL = [
  '角', '亢', '氐', '房', '心', '尾', '箕', '斗', '牛', '女', '虚', '危', '室', '壁',
  '奎', '娄', '胃', '昴', '毕', '觜', '参', '井', '鬼', '柳', '星', '张', '翼', '轸',
  '日', '月', '木', '火', '土', '金', '水', '紫气', '月孛', '罗睺', '计都',
]

const HOUR_OPTIONS = BRANCHES.map((b, i) => {
  const start = String((2 * i + 23) % 24).padStart(2, '0')
  const end = String((2 * i + 1) % 24).padStart(2, '0')
  return { value: String(i), label: `${b}时 ${start}:00–${end}:59` }
})

const YEARS = Array.from({ length: 97 }, (_, i) => 1930 + i)

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

type Gender = 'male' | 'female'

const STATE_CLS: Record<string, string> = {
  入庙: 'text-golddim font-semibold',
  得地: 'text-deep',
  落陷: 'text-red-700/80',
  '—': 'text-inkmuted/60',
}

/** AI 参详响应契约（api/ai-router.ts reading，与六爻同通道） */
interface ReadingResponse {
  text: string
  source: 'live' | 'fallback'
  model: string | null
}

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

function newIdempotencyKey(chartId: number): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.trunc(performance.now() * 1000).toString(36)}`
  return `qizheng-reading:${chartId}:${uuid}`
}

/** 双精度标注：七政真实星历 validated · 紫气传统推法 approximate */
function PrecisionBadge({ className }: { className?: string }) {
  return (
    <div role="note" className={cn('zf-container pt-5', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-gold/60 bg-silk px-3 py-1.5 font-sans text-[12px] tracking-[0.06em] text-golddim">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
          七政（日月五星）· 真实星历 validated · 角分级精度
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-golddim/35 bg-silk px-3 py-1.5 font-sans text-[12px] tracking-[0.06em] text-inkmuted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-golddim/60" aria-hidden />
          紫气 · 传统推法 approximate（罗计孛据月球轨道要素）
        </span>
      </div>
    </div>
  )
}

/** AI 参详面板（chartId → ai.reading，同六爻模式；摘要由服务端自落库命盘构建） */
function AiPanel({ chartId }: { chartId: number | null }) {
  const { user, isLoading: authLoading } = useAuth()
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('pro')
  const [readingResult, setReadingResult] = useState<ReadingResponse | null>(null)

  const reading = trpc.ai.reading.useMutation({
    onSuccess: (data) => setReadingResult(data as unknown as ReadingResponse),
  })

  if (!authLoading && !user) {
    return (
      <div className="rounded-xl border border-gold/40 bg-deep p-10 text-center">
        <p className="font-serif text-[18px] font-bold tracking-[0.1em] text-silktext">
          登录后使用 AI 参详
        </p>
        <p className="mx-auto mt-3 max-w-[460px] text-[13px] leading-[1.9] text-silkmuted">
          AI 参详仅向登录用户开放：星盘自动落库，服务端基于落库结果构建摘要；
          live 参详每次消耗 1 灵签，模板参详免费，失败不扣费。
        </p>
        <DeepButton to={LOGIN_PATH} className="mt-7 border border-gold/50">
          前往登录
        </DeepButton>
      </div>
    )
  }

  if (chartId === null) {
    return (
      <div className="rounded-xl border border-golddim/25 bg-deep/60 p-8 text-center">
        <p className="text-[13px] leading-[1.9] text-silkmuted">
          当前星盘未落库，无法发起 AI 参详。请重新排盘（登录状态下自动落库）。
        </p>
      </div>
    )
  }

  // 静态托管无后端：fetch/JSON 解析类错误兜底为友好文案
  const errMsg = reading.isError
    ? (aiBackendUnavailableText(reading.error) ??
      (reading.error instanceof Error ? reading.error.message : '参详失败，请稍后重试'))
    : null

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
        <div>
          <p className="mb-2 text-center font-sans text-[13px] font-medium tracking-[0.08em] text-silkmuted">
            人格
          </p>
          <SegmentedControl<Persona>
            id="qz-persona"
            value={persona}
            onChange={setPersona}
            options={[
              { value: 'scholar', label: '严谨学者' },
              { value: 'hermit', label: '幽默隐士' },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-center font-sans text-[13px] font-medium tracking-[0.08em] text-silkmuted">
            深度
          </p>
          <SegmentedControl<Depth>
            id="qz-depth"
            value={depth}
            onChange={setDepth}
            options={[
              { value: 'pro', label: '专业详批' },
              { value: 'plain', label: '白话浅释' },
            ]}
          />
        </div>
      </div>
      <div className="mt-7 flex justify-center">
        <GoldButton
          disabled={reading.isPending}
          onClick={() => {
            setReadingResult(null)
            reading.mutate({ chartId, persona, depth, idempotencyKey: newIdempotencyKey(chartId) })
          }}
        >
          {reading.isPending ? '参详中…' : '详参星命 · 1 灵签'}
        </GoldButton>
      </div>
      {errMsg && (
        <p className="mt-5 text-center text-[13px] text-red-300/90">{errMsg}</p>
      )}
      <AnimatePresence>
        {readingResult && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-9 max-w-[720px] rounded-xl border border-golddim/25 bg-deep/70 p-8"
          >
            <p className="mb-5 flex items-center justify-center gap-2 text-[12px] tracking-[0.12em]">
              {readingResult.source === 'live' ? (
                <span className="rounded-full border border-gold/60 px-3 py-1 text-goldbright">
                  live · 模型 {readingResult.model ?? '未知'}
                </span>
              ) : (
                <span className="rounded-full border border-silkmuted/40 px-3 py-1 text-silkmuted">
                  fallback · 模板参详（免费）
                </span>
              )}
            </p>
            <div className="space-y-4">
              {readingResult.text
                .split(/\n{2,}|\n/)
                .filter((p) => p.trim().length > 0)
                .map((p, i) => (
                  <p key={i} className="text-[14px] leading-[2] text-silktext">
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

export default function Qizheng() {
  const [year, setYear] = useState('1996')
  const [month, setMonth] = useState('6')
  const [day, setDay] = useState('15')
  const [hour, setHour] = useState('4')
  const [gender, setGender] = useState<Gender>('male')
  const [dateError, setDateError] = useState<string | null>(null)
  const [runId, setRunId] = useState(0)
  const chartRef = useRef<HTMLDivElement>(null)

  // 浏览器直跑引擎（静态托管无后端）；返回形状与 trpc.qizheng.paipan 一致
  const paipan = useEngine(paipanQizheng, {
    onSuccess: () => {
      setRunId((n) => n + 1)
      requestAnimationFrame(() => chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    },
  })

  useEffect(() => {
    document.title = '七政四余 · 紫府 — 果老星宗，真实星历论命'
  }, [])

  const chart = paipan.data?.result ?? null
  const chartId = paipan.data?.chartId ?? null

  const updateYear = (nextYear: string) => {
    setYear(nextYear)
    setDay((current) => String(Math.min(Number(current), daysInMonth(Number(nextYear), Number(month)))))
    setDateError(null)
  }

  const updateMonth = (nextMonth: string) => {
    setMonth(nextMonth)
    setDay((current) => String(Math.min(Number(current), daysInMonth(Number(year), Number(nextMonth)))))
    setDateError(null)
  }

  const submit = () => {
    if (!isValidSolarDate(Number(year), Number(month), Number(day))) {
      setDateError('无效的日期，请检查年月日。')
      return
    }
    setDateError(null)
    // 时辰中点作为排盘时刻；按 Asia/Shanghai 墙钟（服务端换算 UTC）
    const hh = String((2 * Number(hour) + 24) % 24).padStart(2, '0')
    paipan.mutate({
      datetime: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hh}:30`,
      ianaTimezone: 'Asia/Shanghai',
      gender,
    })
  }

  // 服务端十一曜 → 星盘环布点
  const ringChart: StarRingChart | null = chart
    ? {
        stars: chart.data.stars.map((s) => ({
          name: s.name,
          mansion: s.mansionIndex,
          fraction: s.mansionFraction,
          retrograde: s.retrograde,
        })),
        mingMansion: chart.data.minggong.mansionIndex,
        mingFraction: chart.data.minggong.mansionFraction,
      }
    : null

  return (
    <div>
      {/* ===== S1 · PageHero ===== */}
      <PageHero
        glyph="星"
        title="七政四余"
        latin="Seven Governors & Four Remainders"
        subtitle="日月五星谓之七政，紫气月孛罗睺计都谓之四余——以天星实测，论先天之命"
        crumb="七政四余"
        pool={HERO_POOL}
      />

      {/* 深 → 浅 过渡带 */}
      <div className="zf-fade-to-silk h-[180px]" />

      {/* 双精度标注：七政 validated / 紫气 approximate */}
      <PrecisionBadge />

      {/* ===== S2 · 生辰表单 ===== */}
      <section className="relative bg-silk pb-24 pt-4">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative zf-container flex flex-col items-center">
          <SectionHeading
            eyebrow="Birth Chart"
            title="排 星 盘"
            sub="录入生辰，以真实星历布十一曜于黄道十二宫与二十八宿"
          />
          <div className="mt-12 w-full max-w-[680px] rounded-xl border border-golddim/25 bg-silk2 p-8 shadow-card md:p-10">
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              <FormSelect label="出生年" value={year} onChange={(e) => updateYear(e.target.value)}>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y} 年
                  </option>
                ))}
              </FormSelect>
              <FormSelect label="月" value={month} onChange={(e) => updateMonth(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} 月
                  </option>
                ))}
              </FormSelect>
              <FormSelect
                label="日"
                value={day}
                onChange={(e) => {
                  setDay(e.target.value)
                  setDateError(null)
                }}
              >
                {Array.from({ length: daysInMonth(Number(year), Number(month)) }, (_, i) => (
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
            <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-5">
              <div>
                <p className="mb-2 font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">性别</p>
                <SegmentedControl<Gender>
                  id="qz-gender"
                  value={gender}
                  onChange={setGender}
                  options={[
                    { value: 'male', label: '男' },
                    { value: 'female', label: '女' },
                  ]}
                />
              </div>
              <p className="max-w-[280px] text-[12px] leading-[1.8] text-inkmuted">
                时间按东八区（Asia/Shanghai）墙钟排算，服务端自动换算 UTC 星历时刻。
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <GoldButton className="w-full sm:w-auto" disabled={paipan.isPending} onClick={submit}>
                {paipan.isPending ? '推算星历…' : '排星盘'}
              </GoldButton>
            </div>
            {(dateError || paipan.isError) && (
              <p role="alert" className="mt-5 text-center text-[13px] text-red-700/90">
                {dateError ?? (paipan.error instanceof Error ? paipan.error.message : '排盘失败，请检查输入')}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ===== S3 · 星盘环 ===== */}
      <AnimatePresence>
        {chart && ringChart && (
          <motion.section
            ref={(el) => {
              chartRef.current = el as HTMLDivElement | null
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative bg-silk pb-24"
          >
            <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
            <div className="relative zf-container">
              <SectionHeading
                eyebrow="Mansions Ring"
                title="星 盘 环"
                sub="外环二十八宿 · 中环十二支 · 十一曜实测落宿 · 金轴指命宫"
              />
              <div className="mt-14">
                <StarRing key={runId} chart={ringChart} />
              </div>
              <p className="mt-8 text-center text-[12.5px] tracking-[0.08em] text-inkmuted">
                命宫在{chart.data.minggong.branch}（{chart.data.minggong.zodiac} · {MANSIONS[chart.data.minggong.mansionIndex]}宿）
                · 星历时刻 {chart.data.datetimeUtc.replace('T', ' ').replace(/\.\d+Z$/, ' UTC')}
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ===== S4 · 星曜躔度表 ===== */}
      {chart && (
        <section className="relative bg-silk pb-28">
          <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
          <div className="relative mx-auto w-full max-w-[860px] px-6 md:px-10">
            <SectionHeading eyebrow="Star Positions" title="星曜躔度" />
            <div className="mt-12 overflow-hidden rounded-xl border border-golddim/25 bg-silk2 shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-golddim/20 text-[12px] tracking-[0.14em] text-inkmuted">
                      <th className="px-5 py-3.5 font-medium">星曜</th>
                      <th className="px-5 py-3.5 font-medium">黄经</th>
                      <th className="px-5 py-3.5 font-medium">黄道宫</th>
                      <th className="px-5 py-3.5 font-medium">躔宿</th>
                      <th className="px-5 py-3.5 font-medium">顺逆</th>
                      <th className="px-5 py-3.5 font-medium">庙旺</th>
                      <th className="px-5 py-3.5 font-medium">释义</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.data.stars.map((s, i) => (
                      <motion.tr
                        key={`${runId}-${s.name}`}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
                        className={cn(
                          'border-b border-golddim/10 last:border-0',
                          i % 2 === 1 && 'bg-silk/40',
                        )}
                      >
                        <td className="whitespace-nowrap px-5 py-3 font-serif text-[15px] font-bold text-inktext">
                          {s.name}
                          {s.precision === 'approximate' && (
                            <span className="ml-1 align-super text-[10px] text-golddim" title="传统推法 approximate">
                              *
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-latin text-[13px] text-inktext">
                          {s.longitude.toFixed(2)}°
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-serif text-[13.5px] text-inktext">
                          {s.zodiac} {s.zodiacDegree.toFixed(1)}°
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-serif text-[13.5px] text-inktext">
                          {MANSIONS[s.mansionIndex]}宿{s.mansionDegree.toFixed(2)}度
                        </td>
                        <td
                          className={cn(
                            'whitespace-nowrap px-5 py-3 text-[13px]',
                            s.retrograde ? 'font-semibold text-red-700/80' : 'text-inkmuted',
                          )}
                        >
                          {s.retrograde ? '逆行' : '顺行'}
                        </td>
                        <td className={cn('whitespace-nowrap px-5 py-3 text-[13px]', STATE_CLS[s.dignity])}>
                          {s.dignity}
                        </td>
                        <td className="px-5 py-3 text-[12.5px] leading-[1.8] text-inkmuted">{s.note}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-3"
            >
              {[
                `命宫在 ${chart.data.minggong.branch} · ${chart.data.minggong.zodiac}`,
                `身宫在 ${chart.data.shengong.branch} · ${chart.data.shengong.zodiac}`,
                `命主星 · ${chart.data.mingzhu}`,
                `岁差指差 ${chart.data.ayanamsa.toFixed(2)}°`,
              ].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border border-gold/50 px-3.5 py-1 font-sans text-[12px] font-medium tracking-[0.1em] text-golddim"
                >
                  {t}
                </span>
              ))}
            </motion.div>

            {/* 精度与算法说明（meta.warnings 透传） */}
            <details className="mx-auto mt-8 max-w-[720px] rounded-xl border border-golddim/20 bg-silk2/70 px-6 py-4">
              <summary className="cursor-pointer text-center text-[12.5px] tracking-[0.1em] text-inkmuted">
                星历来源与精度说明 · {chart.meta.ruleVariant} · {chart.meta.algorithmVersion}
              </summary>
              <ul className="mt-4 space-y-2 text-[12.5px] leading-[1.9] text-inkmuted">
                {chart.meta.warnings.map((w) => (
                  <li key={w} className="flex gap-2">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-golddim/70" aria-hidden />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>
      )}

      {/* 浅 → 深 过渡带 */}
      <div className="zf-fade-to-deep h-[180px]" />

      {/* ===== S5 · AI 参详 ===== */}
      {chart && (
        <section className="relative overflow-hidden bg-deep2 py-24">
          <div className="relative mx-auto w-full max-w-[860px] px-6 md:px-10">
            <SectionHeading
              dark
              eyebrow="AI Reading"
              title="AI 参 详"
              sub="基于落库星盘，由服务端构建摘要发起参详；来源明示，降级不伪装"
              className="mb-12"
            />
            <AiPanel chartId={chartId} />
          </div>
        </section>
      )}

      {/* ===== S6 · 典籍依据 ===== */}
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
              book="果老星宗"
              quote="星躔有度，命随天行。"
              source="《果老星宗》一脉 · 黄道十二宫与二十八宿双轨并参"
            />
            <p className="mt-6 text-center text-[12.5px] tracking-[0.08em] text-silkmuted">
              七政采用 astronomy-engine 真实星历（角分级）；紫气按传统推法，精度 approximate
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
