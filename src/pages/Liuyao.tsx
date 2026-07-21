import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import QuoteStrip from '@/components/QuoteStrip'
import SectionHeading from '@/components/SectionHeading'
import { FormInput } from '@/components/FormControls'
import FeatureStatusBadge from '@/components/FeatureStatusBadge'
import AiReading from '@/components/liuyao/AiReading'
import CoinToss from '@/components/liuyao/CoinToss'
import HexagramResult from '@/components/liuyao/HexagramResult'
import type { Toss } from '@/components/liuyao/logic'
import { deriveHexagrams, sumToToss } from '@/components/liuyao/logic'

type CoinFace = 'zi' | 'bei'
const randFace = (): CoinFace => (Math.random() < 0.5 ? 'zi' : 'bei')

export default function Liuyao() {
  const [question, setQuestion] = useState('')
  const [tosses, setTosses] = useState<Toss[]>([])
  const [coins, setCoins] = useState<[CoinFace, CoinFace, CoinFace]>(['zi', 'zi', 'zi'])
  const [spin, setSpin] = useState(0)
  const [tossing, setTossing] = useState(false)
  const timerRef = useRef<number | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = '六爻起卦 · 紫府 — 依《增删卜易》《卜筮正宗》参详卦象'
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const done = tosses.length >= 6
  const result = useMemo(() => (done ? deriveHexagrams(tosses) : null), [done, tosses])

  const handleToss = () => {
    if (tossing || done) return
    const next: [CoinFace, CoinFace, CoinFace] = [randFace(), randFace(), randFace()]
    setCoins(next)
    setSpin((s) => s + 1)
    setTossing(true)
    timerRef.current = window.setTimeout(() => {
      setTosses((prev) => [...prev, sumToToss(next.map((c) => (c === 'zi' ? 3 : 2)) as [number, number, number])])
      setTossing(false)
    }, 950)
  }

  const handleReset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setTosses([])
    setCoins(['zi', 'zi', 'zi'])
    setSpin(0)
    setTossing(false)
  }

  const handleReveal = () => {
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
            <span className="text-goldbright">六爻起卦</span>
          </motion.nav>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex flex-col items-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gold/40 font-serif text-[30px] font-black text-goldbright">
              卦
            </div>
            <p className="mt-6 font-latin text-[12px] font-medium uppercase tracking-[0.38em] text-gold">
              Six Lines Divination
            </p>
            <h1 className="mt-3 font-serif text-[clamp(34px,5vw,56px)] font-bold tracking-[0.08em] text-silktext">
              六爻起卦
            </h1>
            <div className="zf-hairline mt-6" />
            <p className="mt-6 max-w-md text-[14px] leading-[1.95] text-silkmuted">
              心有所疑，摇钱成卦——六爻既成，卦自言之
            </p>
          </motion.div>
        </div>
      </section>

      <div className="zf-fade-to-deep h-40 rotate-180" />

      {/* 全站统一真实度标注：演示模式 */}
      <FeatureStatusBadge kind="demo" />

      {/* S2 · 摇卦交互区（浅色） */}
      <section className="relative overflow-hidden bg-silk py-20 md:py-28">
        <div className="zf-container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <SectionHeading
              eyebrow="CAST THE COINS"
              title="摇钱成卦"
              sub="默念所问之事，连摇六次，自成一卦"
            />
            <div className="mx-auto mt-12 max-w-md">
              <FormInput
                id="liuyao-question"
                label="问事（可不填）"
                placeholder="心中所念之事（可不填）"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={40}
              />
            </div>
            <div className="mt-14">
              <CoinToss
                tosses={tosses}
                coins={coins}
                spin={spin}
                tossing={tossing}
                onToss={handleToss}
                onReset={handleReset}
                onReveal={handleReveal}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* S3 · 卦象结果（浅色） */}
      {result && (
        <section ref={resultRef} className="scroll-mt-16 bg-silk pb-24 md:pb-32">
          <div className="zf-container">
            <HexagramResult tosses={tosses} question={question} />
          </div>
        </section>
      )}

      <div className="zf-fade-to-deep h-44" />

      {/* S4 · AI 参详（深色）+ S5 · 典籍依据 */}
      <section className="bg-deep py-24 md:py-32">
        <div className="zf-container">
          {result ? (
            <AiReading
              ben={result.ben}
              bian={result.bian}
              movingIdx={result.movingIdx}
              question={question}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <SectionHeading
                dark
                eyebrow="AI READING"
                title="AI 参详"
                sub="六爻齐备之后，此处将为所得之卦逐句引经参详——请先摇完成卦"
              />
            </motion.div>
          )}

          {/* S5 · 典籍依据 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-24 grid max-w-4xl gap-6 md:grid-cols-2"
          >
            <QuoteStrip book="增删卜易" quote="爻不乱动，动必有因。" source="清 · 野鹤老人" />
            <QuoteStrip book="卜筮正宗" quote="卦成而后，先观世应。" source="清 · 王洪绪" />
          </motion.div>
          <p className="mt-10 text-center text-[12.5px] leading-[1.9] text-silkmuted">
            摇卦以随机数模拟铜钱掷落，卦辞爻辞皆出《周易》公版原文 · 仅供文化研究与体验
          </p>
        </div>
      </section>
    </div>
  )
}
