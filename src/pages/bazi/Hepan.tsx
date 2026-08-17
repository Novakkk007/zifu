import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { AnimatePresence, animate, motion } from 'framer-motion'
import PageHero from '@/components/bazi/PageHero'
import BirthFields, { defaultPerson, type PersonFormState } from '@/components/bazi/BirthForm'
import WuxingDonut from '@/components/bazi/WuxingDonut'
import DemoDialog from '@/components/bazi/DemoDialog'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import { GhostButton, GoldButton } from '@/components/Buttons'
import { cn } from '@/lib/utils'
import type { BaziChartV2, BirthInput, PillarInfo } from '@contracts/bazi-core'
import type { HepanReport } from '@contracts/engines/hepan-core'
import type { EngineResult } from '@contracts/engines/engine-result'
import { WUXING_COLORS } from '@/lib/wuxing-style'
import { useEngine } from '@/hooks/useEngine'
import { analyzeHepan } from '@/engines/client/hepan'

/** 合盘表单（公历、不校正）→ BirthInput */
function toBirthInput(p: PersonFormState): BirthInput {
  return {
    calendar: 'solar',
    year: p.year,
    month: p.month,
    day: p.day,
    hour: p.hour === null ? null : (p.hour * 2) % 24,
    minute: 0,
    gender: p.gender,
    useTrueSolarTime: false,
    dayRollover: 'zichu',
  }
}

const HERO_POOL = ['合', '冲', '刑', '害', '会', '缘', '比肩', '鸳鸯']

function verdictOf(score: number): string {
  if (score >= 80) return '珠联璧合，互为其补'
  if (score >= 60) return '和而不同，磨合成器'
  return '各有锋芒，相处需功'
}

/** 单柱小卡（对照表用） */
function MiniPillar({
  label,
  pillar,
  index,
  isDay,
}: {
  label: string
  pillar: PillarInfo | null
  index: number
  isDay?: boolean
}) {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15 + index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-lg border bg-silk2 px-2 py-3 text-center',
        isDay ? 'border-gold/60' : 'border-golddim/25',
      )}
    >
      <p className="text-[11px] tracking-[0.16em] text-inkmuted">
        {label}
        {isDay && <span className="ml-1 text-golddim">日主</span>}
      </p>
      {pillar ? (
        <>
          <p
            className="mt-1.5 font-serif text-[26px] font-black leading-tight"
            style={{ color: WUXING_COLORS[pillar.stemWuxing] }}
          >
            {pillar.stem}
          </p>
          <p
            className="font-serif text-[26px] font-black leading-tight"
            style={{ color: WUXING_COLORS[pillar.branchWuxing] }}
          >
            {pillar.branch}
          </p>
        </>
      ) : (
        <p className="mt-2 py-2 font-serif text-[20px] text-inkmuted/60">—</p>
      )}
    </motion.div>
  )
}

function ChartGroup({
  name,
  chart,
  indexBase,
}: {
  name: string
  chart: BaziChartV2
  indexBase: number
}) {
  const items = [
    { label: '年柱', pillar: chart.pillars.year },
    { label: '月柱', pillar: chart.pillars.month },
    { label: '日柱', pillar: chart.pillars.day, isDay: true },
    { label: '时柱', pillar: chart.pillars.hour },
  ]
  return (
    <div>
      <p className="mb-2.5 font-serif text-[15px] font-bold tracking-[0.16em] text-golddim">
        {name}
      </p>
      <div className="grid grid-cols-4 gap-3">
        {items.map((it, i) => (
          <MiniPillar
            key={it.label}
            label={it.label}
            pillar={it.pillar}
            index={indexBase + i}
            isDay={it.isDay}
          />
        ))}
      </div>
    </div>
  )
}

type HepanResponse = {
  chartA: BaziChartV2
  chartB: BaziChartV2
  compatibility: EngineResult<HepanReport>
  chartId: number | null
  persisted: boolean
}

export default function Hepan() {
  const reduce = useReducedMotion()
  const [a, setA] = useState<PersonFormState>(defaultPerson())
  const [b, setB] = useState<PersonFormState>({ ...defaultPerson(), gender: 'female', year: 1992, month: 10, day: 8, hour: 10 })
  const [result, setResult] = useState<HepanResponse | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const resultRef = useRef<HTMLDivElement>(null)

  // 浏览器直跑引擎（静态托管无后端）；返回形状与 trpc.hepan.analyze 一致
  const analyze = useEngine(analyzeHepan, {
    onSuccess: (data) => setResult(data as unknown as HepanResponse),
  })

  useEffect(() => {
    document.title = '八字合盘 · 紫府 — 两盘对照，参看缘分'
  }, [])

  useEffect(() => {
    if (result) {
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      )
    }
  }, [result])

  const report = result?.compatibility.data ?? null
  const overall = report?.totalScore ?? 0

  /* 总评数字 count-up */
  useEffect(() => {
    if (!report) return
    const controls = animate(0, overall, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    })
    return () => controls.stop()
  }, [report, overall])

  const submit = () => {
    setResult(null)
    analyze.mutate({ personA: toBirthInput(a), personB: toBirthInput(b) })
  }

  return (
    <div>
      {/* S1 · PageHero */}
      <PageHero
        glyph="缘"
        title="八字合盘"
        sub="双盘并置，五行相参——看互补，也看磨合"
        pool={HERO_POOL}
        current="八字合盘"
      />

      {/* 深 → 浅过渡带 */}
      <div
        className="h-40"
        style={{ background: 'linear-gradient(to bottom, rgb(var(--deep)), rgb(var(--silk)))' }}
      />

      {/* S2 · 双人生辰表单 */}
      <section className="zf-container relative z-10 -mt-24 pb-20">
        <div className="relative mx-auto grid max-w-[980px] gap-6 md:grid-cols-2">
          <motion.div
            initial={reduce ? false : { x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-golddim/25 bg-silk2 p-7 shadow-card md:p-8"
          >
            <h3 className="mb-5 font-serif text-[18px] font-bold tracking-[0.16em] text-inktext">
              甲方
            </h3>
            <BirthFields value={a} onChange={setA} idPrefix="hepan-a" />
          </motion.div>

          <motion.div
            initial={reduce ? false : { x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-golddim/25 bg-silk2 p-7 shadow-card md:p-8"
          >
            <h3 className="mb-5 font-serif text-[18px] font-bold tracking-[0.16em] text-inktext">
              乙方
            </h3>
            <BirthFields value={b} onChange={setB} idPrefix="hepan-b" />
          </motion.div>

          {/* 「合」字金环圆章 */}
          <motion.div
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', bounce: 0.5, duration: 0.7 }}
            className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-deep shadow-card"
            >
              <span className="font-serif text-[20px] font-black text-goldbright">合</span>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-8 text-center">
          <GoldButton
            className="w-full max-w-[480px] animate-gold-breathe"
            onClick={submit}
            disabled={analyze.isPending}
          >
            {analyze.isPending ? '起盘合参中…' : '两盘相合'}
          </GoldButton>
          {analyze.isError && (
            <p className="mt-3 text-[13px] text-[#A8433C]">起盘失败，请检查生辰信息后重试</p>
          )}
          <p className="mt-4 text-[12px] text-inkmuted">生辰信息仅用于起盘，紫府不做他用</p>
        </div>
      </section>

      {/* S3 · 合盘结果 */}
      <AnimatePresence>
        {result && report && (
          <motion.section
            ref={resultRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="zf-container pb-24">
              <SectionHeading
                eyebrow="Synastry"
                title="双盘对照"
                sub={`甲方 ${a.year}.${a.month}.${a.day} · 乙方 ${b.year}.${b.month}.${b.day}`}
                className="mb-12"
              />

              {/* 两盘四柱对照 */}
              <div className="mx-auto max-w-[980px] rounded-xl border border-golddim/25 bg-silk2/60 p-6 md:p-8">
                <ChartGroup name="甲方" chart={result.chartA} indexBase={0} />

                {/* 日柱关系连线（对齐日柱列） */}
                <div className="relative my-5 h-12">
                  <div
                    className="absolute top-0 h-full w-px bg-gold/70"
                    style={{ left: '62.5%' }}
                  />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/60 bg-silk px-4 py-1 text-[12px] tracking-[0.12em] text-golddim">
                    日主相参 · {report.dayMasterRelation}
                  </div>
                </div>

                <ChartGroup name="乙方" chart={result.chartB} indexBase={4} />
              </div>

              {/* 互补环图 + 总评 */}
              <div className="mx-auto mt-8 grid max-w-[980px] gap-6 lg:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="rounded-xl border border-golddim/25 bg-silk2 p-7"
                >
                  <h3 className="mb-5 text-center font-serif text-[17px] font-bold tracking-[0.12em] text-inktext">
                    五行互补
                  </h3>
                  <WuxingDonut outer={result.chartA.wuxing.count} inner={result.chartB.wuxing.count} />
                  <p className="mt-4 text-center text-[12px] leading-[1.8] text-inkmuted">
                    外环甲方 · 内环乙方
                    <span className="mx-1.5 text-inkmuted/50">｜</span>
                    年支生肖 · {report.zodiacRelation}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="flex flex-col rounded-xl border border-golddim/25 bg-silk2 p-7"
                >
                  <h3 className="mb-5 font-serif text-[17px] font-bold tracking-[0.12em] text-inktext">
                    合参五维 · 公开权重
                  </h3>
                  <div className="flex-1 space-y-4">
                    {report.dimensions.map((d, i) => (
                      <div key={d.key}>
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <span className="text-[13px] tracking-[0.1em] text-inkmuted">
                            {d.name}
                            <span className="ml-1.5 text-[11px] text-inkmuted/60">
                              权重 {Math.round(d.weight * 100)}%
                            </span>
                          </span>
                          <span className="font-serif text-[15px] font-bold text-inktext">
                            {d.score}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-silk">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: d.score / 100 }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full w-full origin-left rounded-full [background:linear-gradient(90deg,rgb(var(--gold-dim)),rgb(var(--gold-bright)))]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-5 border-t border-golddim/20 pt-5">
                    <span className="font-serif text-[56px] font-black leading-none text-golddim">
                      {displayScore}
                    </span>
                    <div>
                      <p className="text-[11px] tracking-[0.16em] text-inkmuted">总评 · 五维加权</p>
                      <p className="mt-1 font-serif text-[16px] font-bold tracking-[0.08em] text-inktext">
                        {verdictOf(overall)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 规则依据卡（逐维度 findings + basis） */}
              <div className="mx-auto mt-8 grid max-w-[980px] gap-5 md:grid-cols-2">
                {report.dimensions.map((d, i) => (
                  <motion.div
                    key={d.key}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.55 }}
                    className="rounded-xl border border-golddim/25 bg-silk2 p-6"
                  >
                    <div className="flex items-baseline justify-between">
                      <h4 className="font-serif text-[15px] font-bold tracking-[0.12em] text-golddim">
                        {d.name}
                      </h4>
                      <span className="font-serif text-[14px] font-bold text-inkmuted">{d.score}</span>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {d.findings.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px] leading-[1.8] text-inktext">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-golddim/15 pt-2.5 text-[11.5px] leading-[1.8] text-inkmuted">
                      依据：{d.basis}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* disclaimer */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="mx-auto mt-8 max-w-[980px] rounded-lg border border-golddim/20 bg-silk2/50 px-6 py-4 text-center text-[12px] leading-[1.9] text-inkmuted"
              >
                {report.disclaimer}
              </motion.p>

              {/* 操作行 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-5"
              >
                <GhostButton
                  className="border-golddim/50 text-golddim hover:bg-golddim/10"
                  onClick={() => {
                    setResult(null)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  重新合盘
                </GhostButton>
                <button
                  onClick={() => setDialogOpen(true)}
                  className="zf-link-more inline-flex items-center gap-1 text-[14px] font-medium tracking-[0.1em] text-golddim"
                >
                  详参两人缘分 · 9 灵签 <span className="zf-arrow">→</span>
                </button>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 浅 → 深过渡带 */}
      <div
        className="h-44"
        style={{ background: 'linear-gradient(to bottom, rgb(var(--silk)), rgb(var(--deep-2)))' }}
      />

      {/* S4 · 典籍依据 */}
      <section className="bg-deep2 pb-24 pt-4">
        <div className="zf-container max-w-[880px] space-y-5">
          {[
            {
              book: '三命通会',
              quote: '「天合地合，鸳鸯之配。」',
              source: '论合婚取义 —— 干支相合者，禀赋相牵，古人取为良缘之象',
            },
          ].map((q, i) => (
            <motion.div
              key={q.book}
              initial={{ x: -24, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: 'easeOut' }}
            >
              <QuoteStrip book={q.book} quote={q.quote} source={q.source} />
            </motion.div>
          ))}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="pt-2 text-center text-[12.5px] leading-[1.9] text-silkmuted"
          >
            合盘仅供参看二人禀赋之异同，姻缘人事，终归人为。
          </motion.p>
        </div>
      </section>

      {/* 深 → 页脚过渡 */}
      <div
        className="h-24"
        style={{ background: 'linear-gradient(to bottom, rgb(var(--deep-2)), rgb(var(--deep-3)))' }}
      />

      <DemoDialog open={dialogOpen} onOpenChange={setDialogOpen} onConfirm={() => {}} />
    </div>
  )
}
