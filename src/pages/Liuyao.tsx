import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { History, ShieldCheck, Zap } from 'lucide-react'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import QuoteStrip from '@/components/QuoteStrip'
import SectionHeading from '@/components/SectionHeading'
import { FormInput } from '@/components/FormControls'
import AiReading from '@/components/liuyao/AiReading'
import CoinToss from '@/components/liuyao/CoinToss'
import HexagramResult from '@/components/liuyao/HexagramResult'
import type { Toss } from '@/components/liuyao/logic'
import {
  newCastIdempotencyKey,
  type CastResponse,
} from '@/components/liuyao/api'
import { trpc } from '@/providers/trpc'

type CoinFace = 'zi' | 'bei'

export default function Liuyao() {
  const [question, setQuestion] = useState('')
  const [tosses, setTosses] = useState<Toss[]>([])
  /** 已收集的 18 枚铜钱结果（2=背 3=字，每 3 枚一摇） */
  const coinsRef = useRef<number[]>([])
  const [coins, setCoins] = useState<[CoinFace, CoinFace, CoinFace]>(['zi', 'zi', 'zi'])
  const [spin, setSpin] = useState(0)
  const [tossing, setTossing] = useState(false)
  const [castData, setCastData] = useState<CastResponse | null>(null)
  const timerRef = useRef<number | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  /** 每次起卦会话一个幂等键（重摇即换），防止重复落库 */
  const idemKeyRef = useRef<string>(newCastIdempotencyKey())

  const coinToss = trpc.liuyao.coinToss.useMutation()
  const cast = trpc.liuyao.cast.useMutation({
    onSuccess: (data) => setCastData(data as unknown as CastResponse),
  })

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

  // 六摇齐备 → 服务端起卦装卦（自动触发一次；幂等键防重复落库）
  useEffect(() => {
    if (tosses.length === 6 && !castData && !cast.isPending && !cast.isError) {
      cast.mutate({
        coins: coinsRef.current,
        question: question.trim() ? question.trim() : undefined,
        idempotencyKey: idemKeyRef.current,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tosses.length, castData, cast.isPending, cast.isError])

  const handleToss = async () => {
    if (tossing || done || coinToss.isPending) return
    setTossing(true)
    try {
      // 服务端 CSPRNG 掷币（随机源不下放到客户端）
      const r = await coinToss.mutateAsync({ tossIndex: tosses.length + 1 })
      const faces = r.faces as CoinFace[]
      setCoins([faces[0], faces[1], faces[2]])
      setSpin((s) => s + 1)
      const value = r.value as Toss
      const triple = r.coins
      timerRef.current = window.setTimeout(() => {
        coinsRef.current = [...coinsRef.current, ...triple]
        setTosses((prev) => [...prev, value])
        setTossing(false)
      }, 950)
    } catch {
      setTossing(false)
    }
  }

  const handleReset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setTosses([])
    coinsRef.current = []
    setCoins(['zi', 'zi', 'zi'])
    setSpin(0)
    setTossing(false)
    setCastData(null)
    cast.reset()
    coinToss.reset()
    idemKeyRef.current = newCastIdempotencyKey()
  }

  const handleReveal = () => {
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const chart = castData?.result.data ?? null

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

      {/* 全站统一真实度标注：已验证算法（服务端真实起卦，非演示） */}
      <div role="note" className="zf-container pt-5">
        <p className="inline-flex max-w-full items-center gap-2 rounded-lg border border-gold/50 bg-silk px-3.5 py-2 font-sans text-[12px] leading-[1.6] tracking-[0.06em] text-golddim">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>已验证算法 · v1.0.0 · 六爻纳甲-通行装卦法</span>
        </p>
      </div>

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
            <div className="mt-8 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-golddim/40 bg-silk2 px-3.5 py-1.5 text-[11.5px] font-medium tracking-[0.14em] text-golddim">
                <Zap className="h-3.5 w-3.5" aria-hidden />
                服务端随机源 · CSPRNG
              </span>
            </div>
            <div className="mt-10">
              <CoinToss
                tosses={tosses}
                coins={coins}
                spin={spin}
                tossing={tossing || coinToss.isPending}
                onToss={handleToss}
                onReset={handleReset}
                onReveal={handleReveal}
              />
            </div>
            {coinToss.isError && (
              <p role="alert" className="mt-6 text-center text-[13px] text-[#B04A3A]">
                掷币服务暂不可用，请稍后重试。
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* S3 · 卦象结果（浅色） */}
      {done && (
        <section ref={resultRef} className="scroll-mt-16 bg-silk pb-24 md:pb-32">
          <div className="zf-container">
            {castData ? (
              <>
                <HexagramResult result={castData.result} question={question.trim()} />
                {castData.persisted && castData.chartId !== null && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="mt-8 flex items-center justify-center gap-2 text-center text-[12.5px] tracking-[0.1em] text-inkmuted"
                  >
                    <History className="h-3.5 w-3.5 text-golddim" aria-hidden />
                    本卦已落库（#{castData.chartId}），可在
                    <Link to="/account" className="text-golddim underline underline-offset-4 hover:text-gold">
                      我的账户 · 排盘历史
                    </Link>
                    中查看
                  </motion.p>
                )}
              </>
            ) : cast.isError ? (
              <div className="py-10 text-center">
                <p role="alert" className="text-[14px] text-[#B04A3A]">
                  起卦服务暂不可用，请稍后重试。
                </p>
                <button
                  onClick={() => {
                    cast.reset()
                    setCastData(null)
                  }}
                  className="mt-4 rounded-full border border-golddim/50 px-6 py-2 text-[13px] text-golddim hover:bg-golddim/10"
                >
                  重试起卦
                </button>
              </div>
            ) : (
              <p className="py-10 text-center text-[13px] tracking-[0.2em] text-inkmuted">
                装卦中……
              </p>
            )}
          </div>
        </section>
      )}

      <div className="zf-fade-to-deep h-44" />

      {/* S4 · AI 参详（深色）+ S5 · 典籍依据 */}
      <section className="bg-deep py-24 md:py-32">
        <div className="zf-container">
          {chart ? (
            <AiReading
              chartId={castData?.chartId ?? null}
              benName={chart.benGua.name}
              bianName={chart.bianGua?.name ?? null}
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
            掷币由服务端加密安全随机源（CSPRNG）完成，装卦依《增删卜易》《卜筮正宗》通行之法，
            卦辞爻辞皆出《周易》公版原文 · 仅供文化研究与体验
          </p>
        </div>
      </section>
    </div>
  )
}
