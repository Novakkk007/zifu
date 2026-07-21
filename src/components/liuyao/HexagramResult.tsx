import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SectionHeading from '@/components/SectionHeading'
import YaoLine from '@/components/liuyao/YaoLine'
import type { Hexagram, Toss } from '@/components/liuyao/logic'
import { buildNajia, deriveHexagrams, YAO_NAMES } from '@/components/liuyao/logic'

/** 单卦卡：六爻图形 + 卦名 + 上下卦小注 */
function HexagramCard({ hex, title, delay }: { hex: Hexagram; title: string; delay: number }) {
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
          <YaoLine key={i} toss={v === 1 ? 7 : 8} width={72} delay={delay + 0.2 + i * 0.08} />
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
        {hex.upper}上{hex.lower}下
      </p>
    </motion.div>
  )
}

type HexagramResultProps = {
  tosses: Toss[]
  question: string
}

/** S3 · 卦象结果：本卦 / 变卦并置 + 《易经》原文 + 纳甲装配（mock） */
export default function HexagramResult({ tosses, question }: HexagramResultProps) {
  const { ben, bian, movingIdx } = useMemo(() => deriveHexagrams(tosses), [tosses])
  const najia = useMemo(() => buildNajia(ben), [ben])

  return (
    <div>
      <SectionHeading
        eyebrow="THE HEXAGRAM"
        title="卦象既成"
        sub={question ? `所问之事：${question}` : '六爻齐备，卦自言之'}
      />

      {/* 双卦并置 */}
      <div className="mt-14 flex flex-col items-center justify-center gap-6 lg:flex-row lg:gap-10">
        <HexagramCard hex={ben} title="本 卦" delay={0} />
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

      {/* 《易经》原文卡 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mx-auto mt-14 max-w-3xl rounded-r-xl border-l-[3px] border-gold bg-silk2 px-8 py-8"
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
          ——《周易》{bian ? ` 之《${bian.name}》` : ''}
        </footer>
      </motion.div>

      {/* 纳甲装配表（mock 增强） */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="mx-auto mt-10 max-w-3xl rounded-xl border border-golddim/20 bg-silk2/60 px-8 py-7"
      >
        <p className="text-center text-[12px] tracking-[0.3em] text-inkmuted">纳甲装配 · 世应六亲（演示）</p>
        <div className="mt-5 flex flex-col-reverse gap-1.5">
          {najia.map((row) => (
            <div
              key={row.pos}
              className="flex items-center justify-between rounded-md px-4 py-1.5 text-[13px] odd:bg-silk/60"
            >
              <span className="w-14 tracking-[0.12em] text-inkmuted">{YAO_NAMES[row.pos]}</span>
              <span className="font-serif tracking-[0.1em] text-inktext">{row.branch}{'　'}{row.qin}</span>
              <span className="w-10 text-right">
                {row.mark && (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gold/60 font-serif text-[12px] font-bold text-golddim">
                    {row.mark}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
