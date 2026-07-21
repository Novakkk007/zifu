import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion } from 'framer-motion'
import PageHero from '@/components/bazi/PageHero'
import BirthFields, { defaultPerson, type PersonFormState } from '@/components/bazi/BirthForm'
import WuxingDonut from '@/components/bazi/WuxingDonut'
import DemoDialog from '@/components/bazi/DemoDialog'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import { GhostButton, GoldButton } from '@/components/Buttons'
import { cn } from '@/lib/utils'
import type { BaziChartV2, BirthInput, PillarInfo, Wuxing } from '@contracts/bazi-core'
import { computeChartV2, WUXING_SHENG } from '@contracts/bazi-core'
import { WUXING_COLORS } from '@/lib/wuxing-style'
import { hashString, seededRandom } from '@/lib/random'

/** 两五行关系（合盘演示规则） */
function wuxingRelation(a: Wuxing, b: Wuxing): '比和' | '相生' | '相制' {
  if (a === b) return '比和'
  if (WUXING_SHENG[a] === b || WUXING_SHENG[b] === a) return '相生'
  return '相制'
}

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

const SCORE_LABELS = ['性情相投', '价值相契', '沟通相顺', '长远相扶']

function verdictOf(score: number): string {
  if (score >= 80) return '珠联璧合，互为其补'
  if (score >= 60) return '和而不同，磨合成器'
  return '各有锋芒，相处需功'
}

const REL_TEXT: Record<string, string> = {
  比和: '同气相求，性情底色相近，相处多有默契；惟同质者亦须各留分寸，免生毫厘之争。',
  相生: '一行生一行，付出与承接自有方向；生者不倦、受者知恩，贵在生生不息。',
  相制: '一行制一行，相处难免棱角相抵；然制而有度，反成砥砺琢磨之益。',
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

export default function Hepan() {
  const [a, setA] = useState<PersonFormState>(defaultPerson())
  const [b, setB] = useState<PersonFormState>({ ...defaultPerson(), gender: 'female', year: 1992, month: 10, day: 8, hour: 10 })
  const [result, setResult] = useState<{ ca: BaziChartV2; cb: BaziChartV2 } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const resultRef = useRef<HTMLDivElement>(null)

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

  /* 确定性契合度（以双方生日哈希生成，同输入结果稳定） */
  const scores = useMemo(() => {
    if (!result) return null
    const seed = hashString(
      `${a.year}-${a.month}-${a.day}-${a.hour ?? 'x'}|${b.year}-${b.month}-${b.day}-${b.hour ?? 'x'}`,
    )
    const rand = seededRandom(seed)
    return SCORE_LABELS.map((label) => ({ label, value: 45 + Math.floor(rand() * 54) }))
  }, [result, a, b])

  const overall = useMemo(
    () => (scores ? Math.round(scores.reduce((s, x) => s + x.value, 0) / scores.length) : 0),
    [scores],
  )

  /* 总评数字 count-up */
  useEffect(() => {
    if (!scores) return
    const controls = animate(0, overall, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    })
    return () => controls.stop()
  }, [scores, overall])

  const analysis = useMemo(() => {
    if (!result) return null
    const { ca, cb } = result
    const rel = wuxingRelation(ca.dayMasterWuxing, cb.dayMasterWuxing)
    const rawComplement =
      ca.wuxing.missing.reduce((s, w) => s + cb.wuxing.count[w], 0) +
      cb.wuxing.missing.reduce((s, w) => s + ca.wuxing.count[w], 0)
    const complement = Math.min(100, Math.round((rawComplement / 6) * 100))
    const missText = (c: BaziChartV2, other: BaziChartV2, who: string, otherWho: string) =>
      c.wuxing.missing.length > 0
        ? `${who}盘缺${c.wuxing.missing.join('、')}，${otherWho}盘中${c.wuxing.missing
            .map((w) => `${w} ${other.wuxing.count[w].toFixed(1)}`)
            .join('、')}，恰可为补`
        : `${who}五行俱全，不求于外`
    return { rel, complement, p1miss: missText(ca, cb, '甲方', '乙方'), p2miss: missText(cb, ca, '乙方', '甲方') }
  }, [result])

  const submit = () => {
    setResult({
      ca: computeChartV2(toBirthInput(a)),
      cb: computeChartV2(toBirthInput(b)),
    })
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
            initial={{ x: -40, opacity: 0 }}
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
            initial={{ x: 40, opacity: 0 }}
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
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', bounce: 0.5, duration: 0.7 }}
            className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-deep shadow-card"
            >
              <span className="font-serif text-[26px] font-black text-goldbright">合</span>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-8 text-center">
          <GoldButton className="w-full max-w-[480px] animate-gold-breathe" onClick={submit}>
            两盘相合
          </GoldButton>
          <p className="mt-4 text-[12px] text-inkmuted">生辰信息仅用于起盘，紫府不做他用</p>
        </div>
      </section>

      {/* S3 · 合盘结果 */}
      <AnimatePresence>
        {result && scores && analysis && (
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
                <ChartGroup name="甲方" chart={result.ca} indexBase={0} />

                {/* 日柱关系连线（对齐日柱列） */}
                <div className="relative my-5 h-12">
                  <div
                    className="absolute top-0 h-full w-px bg-gold/70"
                    style={{ left: '62.5%' }}
                  />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/60 bg-silk px-4 py-1 text-[12px] tracking-[0.12em] text-golddim">
                    日主相参 · {analysis.rel}
                  </div>
                </div>

                <ChartGroup name="乙方" chart={result.cb} indexBase={4} />
              </div>

              {/* 互补环图 + 契合度 */}
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
                  <WuxingDonut outer={result.ca.wuxing.count} inner={result.cb.wuxing.count} />
                  <p className="mt-4 text-center text-[12px] leading-[1.8] text-inkmuted">
                    互补度 <span className="font-serif text-[15px] font-bold text-golddim">{analysis.complement}</span>
                    <span className="mx-1.5 text-inkmuted/50">｜</span>
                    互补度 = 一方所缺、另一方所有之和（演示计算）
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="flex flex-col rounded-xl border border-golddim/25 bg-silk2 p-7"
                >
                  <h3 className="mb-5 font-serif text-[17px] font-bold tracking-[0.12em] text-inktext">
                    契合度四项
                  </h3>
                  <div className="flex-1 space-y-4">
                    {scores.map((s, i) => (
                      <div key={s.label}>
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <span className="text-[13px] tracking-[0.1em] text-inkmuted">
                            {s.label}
                          </span>
                          <span className="font-serif text-[15px] font-bold text-inktext">
                            {s.value}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-silk">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: s.value / 100 }}
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
                      <p className="text-[11px] tracking-[0.16em] text-inkmuted">总评</p>
                      <p className="mt-1 font-serif text-[16px] font-bold tracking-[0.08em] text-inktext">
                        {verdictOf(overall)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 参详短文卡 */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="mx-auto mt-8 max-w-[980px] rounded-xl border-l-[3px] border-gold bg-silk2 p-8"
              >
                <p className="text-[12px] tracking-[0.14em] text-inkmuted">
                  缘分参详 · 学者笔 · 演示示例
                </p>
                <p className="mt-4 font-serif text-[15.5px] leading-[2.1] text-inktext">
                  甲方日主{result.ca.dayMaster}属{result.ca.dayMasterWuxing}，乙方日主
                  {result.cb.dayMaster}属{result.cb.dayMasterWuxing}—— 两干{analysis.rel}。
                  {REL_TEXT[analysis.rel]}
                </p>
                <p className="mt-4 font-serif text-[15.5px] leading-[2.1] text-inktext">
                  以五行论互补：{analysis.p1miss}；{analysis.p2miss}。
                  所缺者得对方之有以为补，所旺者亦当留三分余地—— 合盘所见，是二人禀赋之异同，
                  而非姻缘之定数。
                </p>
              </motion.div>

              {/* 操作行 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
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
