import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import PageHero from '@/components/sanshi/PageHero'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import DemoDialog from '@/components/sanshi/DemoDialog'
import SiweiPanel, { type SiweiTexts } from '@/components/sanshi/SiweiPanel'
import TiandiPan from '@/components/sanshi/TiandiPan'
import { FormInput, FormSelect } from '@/components/FormControls'
import { GoldButton } from '@/components/Buttons'
import { BRANCHES } from '@/components/sanshi/astro'
import { genDaliuren, type LiuRenKe } from '@/components/sanshi/daliuren'
import { cn } from '@/lib/utils'

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

const GOOD_GENERALS = ['贵人', '六合', '青龙', '太常', '太阴', '天后']

const LIUQIN_NOTE: Record<string, string> = {
  官鬼: '官鬼压境，中途有阻',
  妻财: '财动其中，利有所归',
  父母: '父母护持，文书有成',
  兄弟: '兄弟争财，宜防分夺',
  子孙: '子孙解忧，诸事渐舒',
}

function nowParts() {
  const d = new Date()
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1),
    day: String(d.getDate()),
    hour: String(Math.floor(((d.getHours() + 1) % 24) / 2)),
  }
}

function buildTexts(ke: LiuRenKe): SiweiTexts {
  const [chu, zhong, mo] = ke.chuan
  const good = GOOD_GENERALS.includes(chu.general)
  const zhongNote = LIUQIN_NOTE[zhong.liuqin] ?? '中宫气缓，宜持恒'
  return {
    scholar: {
      pro: `初传${chu.gz}乘${chu.general}，事之始也，${good ? `得${chu.general}扶掖，开端顺遂` : `${chu.general}相逼，起步多磨`}；中传${zhong.gz}见${zhong.liuqin}，${zhongNote}；末传${mo.gz}归于${mo.liuqin}，事之终局可据此参看——《六壬大全》论三传者，始中末如事之三节，宜逐段参看。`,
      plain: `这一课初传${chu.gz}乘${chu.general}，开头${good ? '有助力' : '略有磕绊'}；中传${zhong.gz}带${zhong.liuqin}，${zhongNote}；末传${mo.gz}收尾。一段一段看，不必慌。`,
    },
    hermit: {
      pro: `月将${BRANCHES[ke.yuejiangBranch]}一加时，天地盘滴溜溜一转——初传${chu.gz}骑着${chu.general}出门，${good ? '开场就是好兆头' : '开头先来个下马威'}；中传${zhong.liuqin}拦腰一站，${zhongNote}；末传${mo.gz}把尾一收。《六壬大全》说得明白：始中末，一节一节过，急不得。`,
      plain: `一句话：开头${good ? '顺' : '磨'}，中间${zhongNote}，结尾看${mo.liuqin}的脸色。课已排好，慢慢走。`,
    },
  }
}

export default function Daliuren() {
  const init = useMemo(() => nowParts(), [])
  const [year, setYear] = useState(init.year)
  const [month, setMonth] = useState(init.month)
  const [day, setDay] = useState(init.day)
  const [hour, setHour] = useState(init.hour)
  const [question, setQuestion] = useState('')
  const [ke, setKe] = useState<LiuRenKe | null>(null)
  const [runId, setRunId] = useState(0)
  const panRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    document.title = '大六壬 · 紫府 — 月将加时，三传定事之始中末'
  }, [])

  const submit = () => {
    const k = genDaliuren({
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hourBranch: Number(hour),
      question: question.trim(),
    })
    setKe(k)
    setRunId((n) => n + 1)
    requestAnimationFrame(() => panRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const CHUAN_LABEL = ['初传', '中传', '末传']

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
            sub="默认此时此刻，亦可自定年月日时——同一时刻，课传如一"
          />
          <div className="mt-12 w-full max-w-[680px] rounded-xl border border-golddim/25 bg-silk2 p-8 shadow-card md:p-10">
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
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
            <div className="mt-8 flex justify-center">
              <GoldButton className="w-full sm:w-auto" onClick={submit}>
                起课
              </GoldButton>
            </div>
          </div>
        </div>
      </section>

      {/* ===== S3 · 天地盘 + 四课三传 ===== */}
      <AnimatePresence>
        {ke && (
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
                sub={`日干支 ${ke.dayGZ} · 时干支 ${ke.hourGZ} · 月将 ${BRANCHES[ke.yuejiangBranch]}·${ke.yuejiangName}`}
              />
              <div className="mt-14 grid items-start gap-14 lg:grid-cols-2 lg:gap-10">
                {/* 左：天地盘 */}
                <div>
                  <TiandiPan key={runId} ke={ke} />
                  <p className="mt-6 text-center text-[12.5px] tracking-[0.08em] text-inkmuted">
                    外环地盘十二支 · 内环天盘（月将加时）· 小字为十二天将
                  </p>
                </div>

                {/* 右：四课三传 */}
                <div className="flex flex-col gap-12">
                  {/* 四课 */}
                  <div>
                    <h3 className="font-serif text-[17px] font-bold tracking-[0.14em] text-inktext">
                      四课 <span className="ml-2 font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Four Lessons</span>
                    </h3>
                    <div className="mt-5 flex items-stretch">
                      {ke.lessons.map((l, i) => (
                        <div key={`${runId}-lesson-${i}`} className="flex flex-1 items-center">
                          <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                            className="flex-1 rounded-lg border border-golddim/25 bg-silk2 px-3 py-4 text-center"
                          >
                            <p className="text-[11px] tracking-[0.14em] text-inkmuted">第{['一', '二', '三', '四'][i]}课</p>
                            <p className="mt-2 font-serif text-[19px] font-bold leading-snug text-inktext">
                              {BRANCHES[l.shang]}
                              <span className="mx-1 text-golddim/70">/</span>
                              <span className="text-[15px] font-semibold text-inkmuted">{l.xiaLabel}</span>
                            </p>
                            <p className="mt-1 text-[11px] text-inkmuted">上神 / 下神</p>
                          </motion.div>
                          {i < 3 && <span className="mx-1 h-px w-3 shrink-0 self-center bg-gold/50 md:w-4" />}
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
                        {ke.chuan.map((c, i) => (
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
                                  {c.gz}
                                </span>
                                <span className="text-[12px] text-inkmuted">{c.liuqin}</span>
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
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 浅 → 深 */}
      <div className="zf-fade-to-deep h-[160px]" />

      {/* ===== S4 · 参详区（深色） ===== */}
      {ke && (
        <section className="relative overflow-hidden bg-deep2 py-24">
          <div className="relative mx-auto w-full max-w-[860px] px-6 md:px-10">
            <SectionHeading
              dark
              eyebrow="Interpretation"
              title="参 详"
              sub="初传为始，中传为移，末传为归——两段人格，两种讲法"
            />
            <div className="mt-14">
              <SiweiPanel key={runId} texts={buildTexts(ke)} caption="参详输出 · 本课 mock" />
            </div>
            <div className="mt-10 flex justify-center">
              <DemoDialog trigger="详参此课 · 12 灵签" title="大六壬 · 详参此课" />
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
              演示课传由时间哈希确定性生成 · 正式版依节气月将精密起课
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
