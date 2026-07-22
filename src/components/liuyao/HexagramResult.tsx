import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import SectionHeading from '@/components/SectionHeading'
import YaoLine from '@/components/liuyao/YaoLine'
import type { Toss } from '@/components/liuyao/logic'
import type { EngineResult, HexagramData, LiuyaoChart } from '@/components/liuyao/api'
import { cn } from '@/lib/utils'

/** 单卦卡：六爻图形 + 卦名 + 上下卦/卦宫小注 */
function HexagramCard({
  hex,
  title,
  delay,
  tosses,
  note,
}: {
  hex: HexagramData
  title: string
  delay: number
  /** 本卦传入六爻数值以标注动爻；变卦不传 */
  tosses?: number[]
  note?: string
}) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center rounded-xl border border-golddim/25 bg-silk2 px-8 py-9 shadow-card"
    >
      <p className="font-latin text-[11px] uppercase tracking-[0.38em] text-golddim">{title}</p>
      <div className="mt-6 flex flex-col-reverse gap-2.5">
        {hex.lines.map((v, i) => (
          <YaoLine
            key={i}
            toss={(tosses ? tosses[i] : v === 1 ? 7 : 8) as Toss}
            width={72}
            delay={delay + 0.2 + i * 0.08}
          />
        ))}
      </div>
      <motion.h3
        initial={{ opacity: 0, filter: 'blur(8px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay: delay + 0.55 }}
        className="mt-7 font-serif text-[32px] font-black tracking-[0.14em] text-inktext"
      >
        {hex.name}
      </motion.h3>
      <p className="mt-1.5 text-[12.5px] tracking-[0.2em] text-inkmuted">
        {hex.upper}上{hex.lower}下{note ? ` · ${note}` : ''}
      </p>
    </motion.div>
  )
}

/** 月建日辰条 */
function CalendarStrip({ chart }: { chart: LiuyaoChart }) {
  const items: [string, string][] = [
    ['月建', chart.yueJian],
    ['日辰', chart.riChen],
    ['旬空', chart.xunKong.join('、')],
    ['卦宫', `${chart.gong}宫（${chart.gongWuxing}）· ${chart.gongKind}`],
  ]
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.7 }}
      className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-lg border border-golddim/20 bg-silk2/70 px-6 py-3.5"
    >
      {items.map(([k, v]) => (
        <p key={k} className="text-[12.5px] tracking-[0.1em] text-inkmuted">
          <span className="mr-1.5 text-golddim">{k}</span>
          <span className="font-serif font-semibold text-inktext">{v}</span>
        </p>
      ))}
    </motion.div>
  )
}

/** 每爻明细（上爻在顶，初爻在底）：六神 | 六亲干支五行 | 爻象 | 世应 | 动静旬空 | 变爻 */
function YaoDetailTable({ chart }: { chart: LiuyaoChart }) {
  const rows = [...chart.yaos].reverse()
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.7 }}
      className="mx-auto mt-10 max-w-3xl rounded-xl border border-golddim/20 bg-silk2/60 px-4 py-6 sm:px-8"
    >
      <p className="text-center text-[12px] tracking-[0.3em] text-inkmuted">
        纳甲装卦 · 六亲世应六神旬空
      </p>
      <div className="mt-5 space-y-1.5">
        {rows.map((y) => {
          const fu = chart.fuShen.find((f) => f.pos === y.index)
          return (
            <div key={y.index}>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-2 text-[13px] sm:gap-3 sm:px-4',
                  y.index % 2 === 1 && 'bg-silk/60',
                )}
              >
                {/* 六神 */}
                <span className="w-10 shrink-0 text-[11.5px] tracking-[0.08em] text-inkmuted sm:w-12">
                  {y.liushen}
                </span>
                {/* 六亲 + 干支 + 五行 */}
                <span className="w-[7.5rem] shrink-0 font-serif tracking-[0.06em] text-inktext sm:w-36">
                  {y.liuqin}
                  <span className="mx-1 font-semibold">{y.ganzhi}</span>
                  <span className="text-[12px] text-inkmuted">{y.wuxing}</span>
                </span>
                {/* 爻象（动爻带 ○/×） */}
                <span className="flex flex-1 justify-center">
                  <YaoLine toss={y.value as Toss} width={56} />
                </span>
                {/* 世应 */}
                <span className="flex w-7 shrink-0 justify-center">
                  {y.mark && (
                    <span
                      className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded-full border font-serif text-[12px] font-bold',
                        y.mark === '世'
                          ? 'border-gold bg-gold/15 text-golddim'
                          : 'border-golddim/50 text-golddim',
                      )}
                    >
                      {y.mark}
                    </span>
                  )}
                </span>
                {/* 动静 / 旬空 */}
                <span className="w-14 shrink-0 text-right text-[11.5px] tracking-[0.06em] text-inkmuted">
                  {y.moving && <span className="mr-1 font-semibold text-golddim">动</span>}
                  {y.xunKong && <span className="text-[#B04A3A]">空亡</span>}
                </span>
                {/* 变爻 */}
                <span className="hidden w-24 shrink-0 text-right font-serif text-[12.5px] text-golddim sm:block">
                  {y.bian ? `${y.bian.liuqin}${y.bian.ganzhi}` : ''}
                </span>
              </div>
              {fu && (
                <p className="py-0.5 pl-14 text-[11.5px] tracking-[0.06em] text-inkmuted/80 sm:pl-16">
                  伏神：{fu.liuqin}
                  <span className="font-serif">{fu.ganzhi}</span>
                  {fu.wuxing}（伏于{fu.feiGanzhi}之下）
                </p>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

/** S3 · 卦象结果：本卦 / 变卦并置 + 全装卦明细 + 《易经》原文 + meta badge */
export default function HexagramResult({
  result,
  question,
}: {
  result: EngineResult<LiuyaoChart>
  question: string
}) {
  const chart = result.data
  const { benGua: ben, bianGua: bian, movingIdx } = chart

  return (
    <div>
      <SectionHeading
        eyebrow="THE HEXAGRAM"
        title="卦象既成"
        sub={question ? `所问之事：${question}` : '六爻齐备，卦自言之'}
      />

      <CalendarStrip chart={chart} />

      {/* 双卦并置 */}
      <div className="mt-12 flex flex-col items-center justify-center gap-6 lg:flex-row lg:gap-10">
        <HexagramCard
          hex={ben}
          title="本 卦"
          delay={0}
          tosses={chart.tosses}
          note={`${chart.gong}宫${chart.gongKind}`}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex items-center gap-2 text-golddim lg:flex-col"
        >
          <span className="text-[12px] tracking-[0.3em]">动爻</span>
          <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" />
        </motion.div>
        {bian ? (
          <HexagramCard hex={bian} title="变 卦" delay={0.15} />
        ) : (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-golddim/35 px-12"
          >
            <p className="font-serif text-[20px] tracking-[0.2em] text-inkmuted">六爻安静</p>
            <p className="mt-2 text-[12.5px] tracking-[0.14em] text-inkmuted/70">无动爻 · 无变卦</p>
          </motion.div>
        )}
      </div>

      {/* 每爻明细 */}
      <YaoDetailTable chart={chart} />

      {/* 《易经》原文卡 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mx-auto mt-10 max-w-3xl rounded-r-xl border-l-[3px] border-gold bg-silk2 px-8 py-8"
      >
        <p className="font-serif text-[17px] leading-[2.1] text-inktext">
          <span className="mr-2 font-semibold text-golddim">卦辞</span>
          {ben.gua}
        </p>
        {movingIdx.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-golddim/20 pt-4">
            {movingIdx.map((i) => (
              <p key={i} className="font-serif text-[15.5px] leading-[2] text-inktext">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 font-sans text-[11px] font-bold text-golddim">
                  {i + 1}
                </span>
                {ben.yao[i]}
              </p>
            ))}
          </div>
        )}
        <footer className="mt-5 text-[12.5px] tracking-[0.1em] text-inkmuted">
          ——《周易》{bian ? ` 之《${bian.name}》` : ''} · 互卦《{chart.huGua.name}》
        </footer>
      </motion.div>

      {/* meta badge：版本 / 流派 / precision */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.7 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/10 px-3.5 py-1.5 text-[11.5px] font-medium tracking-[0.12em] text-golddim">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          已验证算法 · v{chart.rulesetVersion}
        </span>
        <span className="inline-flex items-center rounded-full border border-golddim/35 px-3.5 py-1.5 text-[11.5px] tracking-[0.12em] text-inkmuted">
          {result.meta.ruleVariant} · {result.meta.algorithmVersion}
        </span>
      </motion.div>
    </div>
  )
}
