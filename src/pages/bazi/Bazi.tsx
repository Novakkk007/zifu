import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageHero from '@/components/bazi/PageHero'
import BirthFields, { defaultPerson, type PersonFormState } from '@/components/bazi/BirthForm'
import PillarCard from '@/components/bazi/PillarCard'
import WuxingBar from '@/components/bazi/WuxingBar'
import DayunStrip from '@/components/bazi/DayunStrip'
import DemoDialog from '@/components/bazi/DemoDialog'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import { FormInput, SegmentedControl } from '@/components/FormControls'
import { GhostButton, GoldButton } from '@/components/Buttons'
import { cn } from '@/lib/utils'
import type { BaziChart } from '@/lib/ganzhi'
import { computeChart, wuxingRelation } from '@/lib/ganzhi'

const HERO_POOL = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '子', '丑', '寅', '卯', '财', '官', '印', '食']

/** 十天干性情素描（原创文案） */
const STEM_TRAITS = [
  '挺拔如乔木，立身正直而向上',
  '柔韧如藤蔓，善借势而迂回生长',
  '如日方升，性情坦荡而热力外显',
  '如灯烛之火，温和持久而照亮一隅',
  '如城墙厚土，沉稳可靠而有担当',
  '如田园之土，含蓄涵养而生万物',
  '如刀剑之金，果断锋利而重义理',
  '如珠玉之金，细腻自珍而贵气内敛',
  '如江河之水，奔流不息而善变通',
  '如雨露之水，润物无声而心思绵密',
]

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

/** 依当前四柱拼合 mock 详批文（分格局 / 性情 / 岁运三段，各引一古籍句） */
function buildReading(chart: BaziChart, persona: Persona, depth: Depth): { label: string; text: string }[] {
  const s = chart.dayMaster
  const w = chart.dayMasterWuxing
  const month = chart.monthP
  const rel = wuxingRelation(month.branchWuxing, w)
  const ling =
    rel === '比和'
      ? '月令同气，日主得令而旺'
      : rel === '相生'
        ? '月令相生，日主有气有根'
        : '月令相制，须观通根透干以定强弱'
  const missingText =
    chart.missing.length > 0
      ? `盘中缺${chart.missing.join('、')}，所缺者正待人事物补之`
      : '五行俱全，流通有情'
  const current = chart.dayun.find((d) => d.isCurrent) ?? chart.dayun[0]
  const trait = STEM_TRAITS[chart.dayP.stemIdx]

  if (persona === 'scholar') {
    return [
      {
        label: '格局',
        text:
          depth === 'pro'
            ? `日主${s}属${w}，生于${month.branch}月（${month.ganzhi}），${ling}。${missingText}。《子平真诠》云：「八字用神，专求月令」—— 观此造月令${month.branch}中藏${month.hiddenStems.join('、')}，与年柱${chart.yearP.ganzhi}、时柱${chart.hourP ? chart.hourP.ganzhi : '未详'}相参，格局之清浊、用神之去取，皆由此处落笔。`
            : `你是${s}${w}日主，生在${month.branch}月，${ling}。${missingText}。《子平真诠》说「八字用神，专求月令」—— 月令是整张盘的重心，你的格局基调由此而定。`,
      },
      {
        label: '性情',
        text:
          depth === 'pro'
            ? `${s}${w}之性，${trait}。日干坐${chart.dayP.branch}（${chart.dayP.stage}之地），藏${chart.dayP.hiddenStems.join('、')}，内有所守而外有所显。《滴天髓》云：「得时俱为旺论，失时便作衰看」—— 强弱之外，更看一气之顺逆。`
            : `${s}${w}之人，${trait}。日支坐${chart.dayP.branch}，内里自有主张。《滴天髓》讲「得时俱为旺论，失时便作衰看」—— 性情没有好坏，顺着自己的气走，就是好的用法。`,
      },
      {
        label: '岁运',
        text:
          depth === 'pro'
            ? `${chart.startAge} 岁起运，现行${current.ganzhi}大运（${current.startAge}–${current.startAge + 9} 岁，${current.stemGod}）。${chart.forward ? '运途顺行' : '运途逆行'}，${current.ganzhi[0]}干主事，于日主为${current.stemGod}之位。《三命通会》云：「命好不如运好」—— 岁运相济之时，宜谋定而后动。`
            : `你现在正走${current.ganzhi}大运（${current.startAge}–${current.startAge + 9} 岁），这一段的课题落在「${current.stemGod}」上。《三命通会》说「命好不如运好」—— 顺着这步运的节奏做事，往往事半功倍。`,
      },
    ]
  }
  return [
    {
      label: '格局',
      text:
        depth === 'pro'
          ? `这盘啊，${s}${w}生在${month.branch}月，${ling}—— 好比种子落在了${rel === '相制' ? '得费些力气的地里，可根扎得深，未必是坏事' : '合脾性的地里，先天就占了三分便宜'}。${missingText}。古人讲「八字用神，专求月令」（《子平真诠》），一句话：先看季节，再谈其他。`
          : `一句话说格局：你这颗种子挑了个${rel === '相制' ? '有点磨人、但长本事' : '挺舒服'}的季节落地。${missingText}。《子平真诠》那句「八字用神，专求月令」，翻译过来就是—— 先看看天时不天时。`,
      },
      {
        label: '性情',
        text:
          depth === 'pro'
            ? `${s}${w}之人，${trait}，骨子里还带着${chart.dayP.branch}支的那点倔强。《滴天髓》说「得时俱为旺论，失时便作衰看」—— 顺风顺水时不飘，逆风逆水时不慌，这性子就用对了地方。`
            : `你这天生的性子：${trait}。《滴天髓》讲「得时俱为旺论，失时便作衰看」—— 说白了就是：顺势的时候别浪，逆势的时候别丧。`,
      },
      {
        label: '岁运',
        text:
          depth === 'pro'
            ? `眼下走的是${current.ganzhi}运（${current.startAge}–${current.startAge + 9} 岁），主题词「${current.stemGod}」。好比行船到了这一段水路，${rel === '相制' ? '水流有点急，把稳了舵反而走得远' : '水流还算顺，该扬帆就扬帆'}。《三命通会》有云「命好不如运好」—— 好运歹运，都是让你借力的风。`
            : `这几年行${current.ganzhi}运，关键词「${current.stemGod}」。《三命通会》说「命好不如运好」—— 运气是风，你是帆，风来了会借就行。`,
      },
    ]
}

const PERSONAS: { id: Persona; latin: string; name: string; desc: string }[] = [
  { id: 'scholar', latin: 'SCHOLAR', name: '严谨学者', desc: '客观克制，引经据典，条分缕析' },
  { id: 'hermit', latin: 'HERMIT', name: '幽默隐士', desc: '随性诙谐，妙语点破，围炉夜话' },
]

export default function Bazi() {
  const [name, setName] = useState('')
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>('solar')
  const [person, setPerson] = useState<PersonFormState>(defaultPerson())
  const [chart, setChart] = useState<BaziChart | null>(null)
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('pro')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [readingOn, setReadingOn] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLElement>(null)

  useEffect(() => {
    document.title = '八字排盘 · 紫府 — 录入生辰，依古法起四柱'
  }, [])

  useEffect(() => {
    if (chart) {
      setReadingOn(false)
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      )
    }
  }, [chart])

  const submit = () => {
    setChart(
      computeChart({
        year: person.year,
        month: person.month,
        day: person.day,
        hourBranch: person.hour,
        gender: person.gender,
      }),
    )
  }

  const reading = useMemo(
    () => (chart && readingOn ? buildReading(chart, persona, depth) : null),
    [chart, readingOn, persona, depth],
  )

  const pillars = chart
    ? ([
        { title: '年柱', pillar: chart.yearP },
        { title: '月柱', pillar: chart.monthP },
        { title: '日柱', pillar: chart.dayP, isDay: true },
        { title: '时柱', pillar: chart.hourP },
      ] as const)
    : null

  return (
    <div>
      {/* S1 · PageHero */}
      <PageHero
        glyph="命"
        title="八字排盘"
        sub="录入生辰，依古法起四柱、定十神、排大运"
        pool={HERO_POOL}
        current="八字排盘"
      />

      {/* 深 → 浅过渡带 */}
      <div
        className="h-40"
        style={{ background: 'linear-gradient(to bottom, rgb(var(--deep)), rgb(var(--silk)))' }}
      />

      {/* S2 · 生辰表单 */}
      <section className="zf-container relative z-10 -mt-24 pb-20">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[760px] rounded-xl border border-golddim/25 bg-silk2 p-7 shadow-card md:p-10"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormInput
              label="称谓（可选）"
              id="bazi-name"
              placeholder="如何称呼您"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div>
              <span className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">
                历法
              </span>
              <SegmentedControl<'solar' | 'lunar'>
                id="bazi-calendar"
                value={calendar}
                onChange={setCalendar}
                options={[
                  { value: 'solar', label: '阳历' },
                  { value: 'lunar', label: '农历' },
                ]}
              />
              {calendar === 'lunar' && (
                <p className="mt-1.5 text-[12px] text-inkmuted">
                  演示模式：按同日阳历起盘
                </p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <BirthFields value={person} onChange={setPerson} idPrefix="bazi" />
          </div>

          <GoldButton className="mt-8 w-full animate-gold-breathe" onClick={submit}>
            排盘
          </GoldButton>
          <p className="mt-4 text-center text-[12px] text-inkmuted">
            生辰信息仅用于起盘，紫府不做他用
          </p>
        </motion.div>
      </section>

      {/* S3 · 排盘结果 */}
      <AnimatePresence>
        {chart && pillars && (
          <motion.section
            id="result"
            ref={resultRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="zf-container pb-24">
              <SectionHeading
                eyebrow="Four Pillars"
                title={`${name ? `${name}的` : '您的'}四柱命盘`}
                sub={`${person.year} 年 ${person.month} 月 ${person.day} 日${person.hour === null ? '' : ` · ${chart.hourP?.branch}时`} · ${person.gender === 'male' ? '乾造' : '坤造'}`}
                className="mb-12"
              />

              {/* 四柱横排 */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {pillars.map((p, i) => (
                  <PillarCard
                    key={p.title}
                    title={p.title}
                    pillar={p.pillar}
                    isDay={'isDay' in p && p.isDay}
                    index={i}
                  />
                ))}
              </div>

              {/* 五行统计 + 大运 */}
              <div className="mt-6 grid gap-6">
                <WuxingBar count={chart.wuxingCount} missing={chart.missing} />
                <DayunStrip steps={chart.dayun} startAge={chart.startAge} forward={chart.forward} />
              </div>

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
                    setChart(null)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  重新排盘
                </GhostButton>
                <button
                  onClick={() => detailRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="zf-link-more inline-flex items-center gap-1 text-[14px] font-medium tracking-[0.1em] text-golddim"
                >
                  由此进入详批 <span className="zf-arrow">↓</span>
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

      {/* S4 · 八字详批（深色） */}
      <section ref={detailRef} className="bg-deep2 py-28">
        <div className="zf-container max-w-[880px]">
          <SectionHeading
            eyebrow="AI Reading"
            title="AI 详批 · 四维交互"
            sub="两种人格 × 两种深度，锚定古籍原文，逐柱引经深参"
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
                    active
                      ? 'border-transparent bg-deep'
                      : 'border-golddim/25 bg-deep/50 hover:border-golddim/50',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="bazi-persona-frame"
                      className="absolute inset-0 rounded-2xl border-2 border-gold"
                      transition={{ duration: 0.26, ease: 'easeOut' }}
                    />
                  )}
                  <span className="block font-latin text-[12px] font-medium tracking-[0.3em] text-gold">
                    {p.latin}
                  </span>
                  <span className="mt-1.5 block font-serif text-[19px] font-bold tracking-[0.1em] text-silktext">
                    {p.name}
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-[1.8] text-silkmuted">
                    {p.desc}
                  </span>
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

          {/* 开始详批 */}
          <div className="mt-10 text-center">
            <GoldButton
              disabled={!chart}
              className={cn('animate-gold-breathe', !chart && 'cursor-not-allowed opacity-40')}
              onClick={() => chart && setDialogOpen(true)}
            >
              开始详批 · 9 灵签
            </GoldButton>
            {!chart && (
              <p className="mt-3 text-[12.5px] text-silkmuted">请先在上方排盘</p>
            )}
          </div>

          {/* 输出卡 */}
          <AnimatePresence>
            {reading && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-12 rounded-xl border-l-[3px] border-gold bg-deep p-8"
              >
                <p className="text-[12px] tracking-[0.14em] text-silkmuted">
                  参详输出 · {persona === 'scholar' ? '严谨学者' : '幽默隐士'} ·{' '}
                  {depth === 'pro' ? '专业级' : '通俗级'} · 演示示例
                </p>
                <div className="mt-5 space-y-6">
                  <AnimatePresence mode="wait">
                    {reading.map((seg, i) => (
                      <motion.div
                        key={`${persona}-${depth}-${seg.label}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.3, duration: 0.5 }}
                      >
                        <span className="mb-2 inline-block rounded-full border border-gold/40 px-3 py-0.5 font-serif text-[12px] tracking-[0.2em] text-goldbright">
                          {seg.label}
                        </span>
                        <p className="font-serif text-[15.5px] leading-[2.1] text-silktext">
                          {seg.text}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <p className="mt-7 border-t border-golddim/20 pt-4 text-[12.5px] text-silkmuted">
                  演示模式 · 正式详批由 AI 锚定古籍原文逐句生成
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* S5 · 典籍依据 */}
      <section className="bg-deep2 pb-24">
        <div className="zf-container max-w-[880px] space-y-5">
          {[
            { book: '滴天髓', quote: '「得时俱为旺论，失时便作衰看。」', source: '论月令之气' },
            { book: '子平真诠', quote: '「八字用神，专求月令。」', source: '论格局之源' },
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
        </div>
      </section>

      {/* 深 → 页脚过渡 */}
      <div
        className="h-24"
        style={{ background: 'linear-gradient(to bottom, rgb(var(--deep-2)), rgb(var(--deep-3)))' }}
      />

      <DemoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={() => setReadingOn(true)}
      />
    </div>
  )
}
