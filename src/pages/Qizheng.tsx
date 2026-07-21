import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageHero from '@/components/sanshi/PageHero'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import StarRing from '@/components/sanshi/StarRing'
import DemoDialog from '@/components/sanshi/DemoDialog'
import { FormInput, FormSelect, SegmentedControl } from '@/components/FormControls'
import { GoldButton } from '@/components/Buttons'
import FeatureStatusBadge from '@/components/FeatureStatusBadge'
import { BRANCHES, MANSIONS } from '@/components/sanshi/astro'
import { genQizheng, type QizhengChart } from '@/components/sanshi/qizheng'
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

type Gender = 'male' | 'female'
type Calendar = 'solar' | 'lunar'

const STATE_CLS: Record<string, string> = {
  入庙: 'text-golddim font-semibold',
  得地: 'text-deep',
  落陷: 'text-red-700/80',
}

export default function Qizheng() {
  const [year, setYear] = useState('1996')
  const [month, setMonth] = useState('6')
  const [day, setDay] = useState('15')
  const [hour, setHour] = useState('4')
  const [gender, setGender] = useState<Gender>('male')
  const [calendar, setCalendar] = useState<Calendar>('solar')
  const [place, setPlace] = useState('')
  const [chart, setChart] = useState<QizhengChart | null>(null)
  const [runId, setRunId] = useState(0)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = '七政四余 · 紫府 — 果老星宗，以二十八宿论命'
  }, [])

  const submit = () => {
    const c = genQizheng({
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hourBranch: Number(hour),
      gender,
      calendar,
      place: place.trim(),
    })
    setChart(c)
    setRunId((n) => n + 1)
    requestAnimationFrame(() => chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

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

      {/* 全站统一真实度标注：近似排算 */}
      <FeatureStatusBadge kind="approx" />

      {/* ===== S2 · 生辰表单 ===== */}
      <section className="relative bg-silk pb-24 pt-4">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative zf-container flex flex-col items-center">
          <SectionHeading
            eyebrow="Birth Chart"
            title="排 星 盘"
            sub="录入生辰，以果老星宗之法布十一曜于二十八宿"
          />
          <div className="mt-12 w-full max-w-[680px] rounded-xl border border-golddim/25 bg-silk2 p-8 shadow-card md:p-10">
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              <FormSelect label="出生年" value={year} onChange={(e) => setYear(e.target.value)}>
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
              <div>
                <p className="mb-2 font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">历法</p>
                <SegmentedControl<Calendar>
                  id="qz-calendar"
                  value={calendar}
                  onChange={setCalendar}
                  options={[
                    { value: 'solar', label: '阳历' },
                    { value: 'lunar', label: '农历' },
                  ]}
                />
              </div>
            </div>
            <FormInput
              className="mt-6"
              label="出生地点（可选）"
              placeholder="用于校正真太阳时 · 演示可留空"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
            <div className="mt-8 flex justify-center">
              <GoldButton className="w-full sm:w-auto" onClick={submit}>
                排星盘
              </GoldButton>
            </div>
          </div>
        </div>
      </section>

      {/* ===== S3 · 星盘环 ===== */}
      <AnimatePresence>
        {chart && (
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
                sub="外环二十八宿 · 中环十二支 · 十一曜落宿 · 金轴指命宫"
              />
              <div className="mt-14">
                <StarRing key={runId} chart={chart} />
              </div>
              <p className="mt-8 text-center text-[12.5px] tracking-[0.08em] text-inkmuted">
                命宫在{MANSIONS[chart.mingMansion]}宿 · 演示盘为确定性 mock，同一生辰结果稳定
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ===== S4 · 星曜躔度表 ===== */}
      {chart && (
        <section className="relative bg-silk pb-28">
          <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
          <div className="relative mx-auto w-full max-w-[760px] px-6 md:px-10">
            <SectionHeading eyebrow="Star Positions" title="星曜躔度" />
            <div className="mt-12 overflow-hidden rounded-xl border border-golddim/25 bg-silk2 shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-golddim/20 text-[12px] tracking-[0.14em] text-inkmuted">
                      <th className="px-5 py-3.5 font-medium">星曜</th>
                      <th className="px-5 py-3.5 font-medium">躔宿</th>
                      <th className="px-5 py-3.5 font-medium">庙旺</th>
                      <th className="px-5 py-3.5 font-medium">释义</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.stars.map((s, i) => (
                      <motion.tr
                        key={`${runId}-${s.name}`}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                        className={cn(
                          'border-b border-golddim/10 last:border-0',
                          i % 2 === 1 && 'bg-silk/40',
                        )}
                      >
                        <td className="whitespace-nowrap px-5 py-3 font-serif text-[15px] font-bold text-inktext">
                          {s.name}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-serif text-[14px] text-inktext">
                          {s.name} · 躔{MANSIONS[s.mansion]}宿{s.degree}度
                        </td>
                        <td className={cn('whitespace-nowrap px-5 py-3 text-[13px]', STATE_CLS[s.state])}>
                          <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                          >
                            {s.state}
                          </motion.span>
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
                `命宫在 ${MANSIONS[chart.mingMansion]} 宿`,
                `身宫在 ${MANSIONS[chart.shenMansion]} 宿`,
                `命主星 · ${chart.mingZhu}`,
              ].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border border-gold/50 px-3.5 py-1 font-sans text-[12px] font-medium tracking-[0.1em] text-golddim"
                >
                  {t}
                </span>
              ))}
            </motion.div>

            <div className="mt-10 flex justify-center">
              <DemoDialog trigger="详参星命 · 12 灵签" title="七政四余 · 详参星命" />
            </div>
          </div>
        </section>
      )}

      {/* 浅 → 深 过渡带 */}
      <div className="zf-fade-to-deep h-[180px]" />

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
              book="果老星宗"
              quote="星躔有度，命随天行。"
              source="《果老星宗》一脉 · 以恒星制为准（类目意涵）"
            />
            <p className="mt-6 text-center text-[12.5px] tracking-[0.08em] text-silkmuted">
              演示盘为近似排算，真实星历推算于正式版提供
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
