/**
 * 华山问剑 · 接剑页（传一题）
 * 口令解码 → 出示题目 → 答对胜场 +1、答错不计败场。
 * 防刷：每 (关,题) 组合终身只计 1 胜场（jianlu-code.ts 的已接剑集合）。
 * 零隐私：口令只含关号与题号，题库随 bundle——传剑不传盘。
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { Swords } from 'lucide-react'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import { ARENA_GATES } from '@contracts/engines/jianlu/arena-questions'
import { loadRecord, saveRecord } from '@/lib/jianlu'
import {
  copyToClipboard,
  decodeGateQuestion,
  encodeGateQuestion,
  isJieSolved,
  jianluJieLink,
  jieSolvedCount,
  markJieSolved,
} from '@/lib/jianlu-code'
import { usePageMeta } from '@/lib/page-meta'

const OPTION_MARKS = ['甲', '乙', '丙', '丁'] as const

export default function JianluJiePage() {
  usePageMeta(
    '接剑 · 华山问剑 · 紫府',
    '有剑自远方来——接下一题断命要点，答对胜场 +1。传剑不传盘，零隐私。'
  )
  const reduce = useReducedMotion()
  const { code } = useParams<{ code: string }>()

  const target = useMemo(() => decodeGateQuestion(code), [code])
  const entry = useMemo(() => {
    if (!target) return null
    const gate = ARENA_GATES[target.gateIdx]
    const q = gate?.questions[target.qIdx]
    if (!gate || !q) return null
    return { gate, q }
  }, [target])
  const already = useMemo(
    () => (target ? isJieSolved(target.gateIdx, target.qIdx) : false),
    [target]
  )

  const [picked, setPicked] = useState<number | null>(null)
  const [gained, setGained] = useState(false)
  const [missed, setMissed] = useState<number[]>([])
  const [wins, setWins] = useState(() => loadRecord().wins)
  const [copied, setCopied] = useState(false)
  const [solvedTotal, setSolvedTotal] = useState(() => jieSolvedCount())

  const pick = (i: number) => {
    if (!target || !entry || picked !== null) return
    if (i !== entry.q.answer) {
      setMissed((prev) => [...prev, i])
      return
    }
    setPicked(i)
    if (!already) {
      // 防刷：终身只计 1 胜——未接过才入账
      markJieSolved(target.gateIdx, target.qIdx)
      setSolvedTotal(jieSolvedCount())
      const rec = loadRecord()
      saveRecord({
        ...rec,
        wins: rec.wins + 1,
        total: rec.total + 1,
        streak: rec.streak + 1,
      })
      setWins((w) => w + 1)
      setGained(true)
    }
  }

  const shareThis = async () => {
    if (!target) return
    const ok = await copyToClipboard(jianluJieLink(encodeGateQuestion(target.gateIdx, target.qIdx)))
    if (ok) setCopied(true)
  }

  if (!target || !entry) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-deep2">
        <FloatingGlyphs />
        <div className="relative z-10 mx-auto max-w-xl px-4 py-24 text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Swords className="mx-auto h-9 w-9 text-golddim" strokeWidth={1.2} />
            <h1 className="mt-5 font-serif text-[28px] font-bold tracking-[0.2em] text-goldbright">
              口令已折 · 此剑无名
            </h1>
            <p className="mt-4 text-[13px] leading-[2.1] tracking-[0.06em] text-silkmuted">
              这道剑帖的口令对不上七峰剑谱——或许是抄漏了一个字。
              <br />
              请回到华山，让传剑人重新递一剑。
            </p>
            <Link
              to="/jianlu"
              className="mt-8 inline-block rounded-full border border-gold/50 bg-gold/10 px-8 py-2.5 font-serif text-[14px] tracking-[0.16em] text-goldbright transition hover:bg-gold/20"
            >
              回剑庐
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-deep2">
      <FloatingGlyphs />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(620px 380px at 20% 6%, rgba(201,164,92,0.1), transparent 65%),' +
            'radial-gradient(560px 360px at 84% 92%, rgba(122,88,180,0.12), transparent 65%)',
          animation: 'zifu-breathe 9s ease-in-out infinite',
        }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-14">
        {/* 剑帖门额 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="text-center"
        >
          <p className="font-latin text-[12px] uppercase tracking-[0.42em] text-gold">
            Mount Hua · Take the Sword
          </p>
          <h1 className="mt-4 font-serif text-[34px] font-bold tracking-[0.24em] text-goldbright sm:text-[40px]">
            接 剑
          </h1>
          <p className="mt-4 text-[13px] leading-[2.1] tracking-[0.08em] text-silkmuted">
            有剑自远方来——接下这一题断命要点，答对胜场 +1，答错不计败场。
            <br />
            传剑不传盘：口令只含关号与题号，零隐私。
          </p>
        </motion.div>

        {/* 剑帖卡 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 rounded-2xl border border-golddim/28 bg-silk2/60 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3">
            <span className="text-[26px]">{entry.gate.glyph}</span>
            <div>
              <p className="font-serif text-[16px] tracking-[0.1em] text-silktext">
                {entry.gate.name} · {entry.gate.peak}
              </p>
              <p className="mt-0.5 text-[12px] tracking-[0.18em] text-golddim">
                剑帖 · {code}
                {already ? ' · 此剑你已接过' : ''}
              </p>
            </div>
            <span className="ml-auto text-[12px] tracking-[0.1em] text-inkmuted">
              当前胜场 {wins}
            </span>
          </div>

          <p className="mt-5 font-serif text-[18px] leading-[1.9] text-silktext">{entry.q.q}</p>

          <div className="mt-5 space-y-2.5">
            {entry.q.options.map((op, i) => {
              const isRight = picked !== null && i === entry.q.answer
              const isMiss = picked === null && missed.includes(i)
              const disabled = picked !== null
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(i)}
                  className={`block w-full rounded-xl border px-4 py-3 text-left text-[13.5px] transition-all duration-300 ${
                    isRight
                      ? 'border-gold bg-gold/15 text-goldbright'
                      : isMiss
                        ? 'border-[#c96a5a]/50 bg-[#7a2e2e]/15 text-[#e0a8a0]'
                        : disabled
                          ? 'border-golddim/15 bg-silk2/20 text-inkmuted'
                          : 'border-golddim/25 bg-silk2/40 text-silktext hover:border-gold/60 hover:bg-gold/[0.07]'
                  }`}
                >
                  <span className="mr-2 font-serif text-[13px] text-golddim">{OPTION_MARKS[i]}</span>
                  {op}
                </button>
              )
            })}
          </div>

          {picked === null && missed.length > 0 && (
            <p className="mt-4 text-[12.5px] leading-[1.9] tracking-[0.04em] text-[#e0a8a0]">
              剑锋偏了，再试一剑——答错不计败场，静心再断。
            </p>
          )}

          {picked !== null && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-5 rounded-xl border border-gold/40 bg-gold/[0.08] p-5"
            >
              <p className="font-serif text-[18px] font-bold tracking-[0.16em] text-goldbright">
                {gained ? '接剑成功 · 胜场 +1' : '接剑成功 · 此剑先前已接'}
              </p>
              <p className="mt-2 text-[12.5px] leading-[2] text-silkmuted">
                {gained
                  ? '剑已归鞘，胜场 +1——此题终身只计一胜，再断不复计。'
                  : '这一剑你早先接过，胜场不复计——再去华山寻新的剑帖吧。'}
                <br />
                {entry.q.explain}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* 传剑 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 flex flex-col items-center gap-4"
        >
          <button
            type="button"
            onClick={shareThis}
            className="rounded-full border border-gold/60 bg-gold/15 px-8 py-2.5 font-serif text-[14px] tracking-[0.16em] text-goldbright transition hover:bg-gold/25"
          >
            {copied ? '口令已抄下 · 传与同好' : '传此剑题'}
          </button>
          <p className="text-[12px] tracking-[0.1em] text-inkfaint">
            已接 {solvedTotal} / 21 剑 · 传剑不传盘，零隐私
          </p>
          <Link to="/jianlu" className="text-[12.5px] tracking-[0.12em] text-inkmuted hover:text-golddim">
            ← 回剑庐，再闯七峰
          </Link>
        </motion.div>
      </div>

      <style>{`
        @keyframes zifu-breathe {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
