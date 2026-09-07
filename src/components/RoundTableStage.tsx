/**
 * 论命圆桌 · 动态演出舞台
 * 演出三幕：先生开场 → 七席入席+逐席发言 → 共识与分歧 → 先生收束
 * 数据：parseRoundTable 结果（回放式演出——结果一到即开演，节奏稳定）
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { RoundTableResult } from '@/lib/roundtable'

interface StageProps {
  result: RoundTableResult
  onFinish: () => void
  onSkip: () => void
}

const SEAT_STYLES: Array<{ left?: string; top?: string; right?: string; bottom?: string }> = [
  { left: '4%', top: '18%' },
  { left: '0%', top: '50%' },
  { left: '8%', bottom: '8%' },
  { right: '8%', bottom: '8%' },
  { right: '0%', top: '50%' },
  { right: '4%', top: '18%' },
  { left: '50%', bottom: '0%' },
]

const AVATARS = ['📜', '📚', '🧭', '🌊', '🕯️', '🧧', '🔮']

/** 打字机 hook：文本逐字出现 */
function useTypewriter(text: string, active: boolean, speed = 34): string {
  const [shown, setShown] = useState('')
  useEffect(() => {
    if (!active) return
    let i = 0
    const timer = setInterval(() => {
      i += 2
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, active, speed])
  return shown
}

function TypeText({ text, active, speed = 34 }: { text: string; active: boolean; speed?: number }) {
  const shown = useTypewriter(text, active, speed)
  return (
    <span>
      {shown}
      {active && shown.length < text.length && <span className="cursor-blink" />}
    </span>
  )
}

export default function RoundTableStage({ result, onFinish, onSkip }: StageProps) {
  // 演出阶段：0=入席 1=先生开场 2..8=第1..7席 9=共识 10=收束 11=结束
  const [phase, setPhase] = useState(0)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (finished) return
    const seats = result.seats.length || 7
    const phases: Array<{ n: number; dur: number }> = [
      { n: 1, dur: 1800 }, // 先生开场
      ...Array.from({ length: seats }, (_, i) => ({ n: 2 + i, dur: 6500 })), // 每席 6.5s（含打字）
      { n: 9, dur: 7000 }, // 共识
      { n: 10, dur: 4500 }, // 收束
    ]
    let idx = 0
    timerRef.current = setInterval(() => {
      idx += 1
      if (idx >= phases.length) {
        setPhase(11)
        setFinished(true)
        if (timerRef.current) clearInterval(timerRef.current)
        onFinish()
      } else {
        setPhase(phases[idx].n)
      }
    }, phases[0].dur)
    // 首跳用 phases[0].dur 后按当前 phase 的 dur——简化：用统一链
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [result, finished, onFinish])

  const speaking = phase >= 2 && phase <= 8 ? phase - 2 : -1

  return (
    <div className="relative">
      {/* 舞台 */}
      <div className="relative min-h-[540px] overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-b from-deep2 to-deep3 px-4 py-6 sm:px-8">
        {/* 先生主位 */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute left-1/2 top-3 -translate-x-1/2 text-center"
        >
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border text-[24px] transition-all duration-500 ${
              phase === 1 || phase === 10
                ? 'border-gold shadow-[0_0_28px_rgba(201,164,92,0.5)]'
                : 'border-golddim/40'
            } bg-deep3`}
          >
            🎓
          </div>
          <p className="mt-1.5 text-[13px] tracking-[0.16em] text-golddim">先生</p>
        </motion.div>

        {/* 七席环坐 */}
        {result.seats.map((seat, i) => (
          <motion.div
            key={seat.school}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: phase >= 2 + i ? 1 : 0, scale: phase >= 2 + i ? 1 : 0.6 }}
            transition={{ duration: 0.5 }}
            className={`absolute z-10 w-[104px] text-center transition-opacity duration-500 ${
              speaking === i ? '' : phase >= 2 + i && speaking !== i ? 'opacity-45' : ''
            }`}
            style={{ ...SEAT_STYLES[i % 7], transform: 'translateX(-50%)' }}
          >
            <div
              className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full border text-[19px] transition-all duration-500 ${
                speaking === i
                  ? 'border-gold shadow-[0_0_26px_rgba(201,164,92,0.65)]'
                  : 'border-golddim/40'
              } bg-deep2`}
              style={speaking === i ? { animation: 'zifu-pulse 1.6s infinite' } : undefined}
            >
              {AVATARS[i % 7]}
            </div>
            <p className="mt-1 text-[11.5px] leading-tight tracking-[0.04em] text-silkmuted">
              {seat.school.length > 6 ? seat.school.slice(0, 6) + '…' : seat.school}
            </p>
            <p className="text-[9px] tracking-[0.06em] text-inkfaint">
              {speaking === i ? '正在发言' : phase >= 2 + i ? '聆听中' : '待入席'}
            </p>
          </motion.div>
        ))}

        {/* 中央圆桌 */}
        <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-golddim/35 bg-deep3/95 text-center">
          <p className="text-[13px] tracking-[0.2em] text-golddim">一盘命局</p>
          <p className="mt-1.5 px-3 text-[10px] text-inkfaint">七席各言其见</p>
        </div>

        {/* 发言气泡（底部中央——大字号可读） */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 sm:inset-x-8">
          <AnimatePresence mode="wait">
            {phase === 0 && (
              <motion.p
                key="wait"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-[12px] tracking-[0.1em] text-inkfaint"
              >
                结果已到 · 即将开演
              </motion.p>
            )}
            {phase === 1 && (
              <motion.div
                key="opening"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-[560px] rounded-xl border border-gold/30 bg-deep2/95 px-5 py-4 text-[13.5px] leading-[2] text-silkmuted shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              >
                <p className="mb-1 text-[11px] tracking-[0.18em] text-golddim">先生开场</p>
                <TypeText text={result.opening} active />
              </motion.div>
            )}
            {phase >= 2 && phase <= 8 && result.seats[phase - 2] && (
              <motion.div
                key={`seat-${phase - 2}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-[560px] rounded-xl border border-gold/30 bg-deep2/95 px-5 py-4 text-[13.5px] leading-[2] text-silkmuted shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
              >
                <p className="mb-1 text-[11px] tracking-[0.18em] text-golddim">
                  第{phase - 1}席 · {result.seats[phase - 2].school}
                </p>
                <TypeText text={result.seats[phase - 2].content} active />
              </motion.div>
            )}
            {phase === 9 && (
              <motion.div
                key="consensus"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-[560px] rounded-xl border border-gold/40 bg-deep2/95 px-5 py-4 text-[13.5px] leading-[2] text-goldbright shadow-[0_8px_30px_rgba(201,164,92,0.15)]"
              >
                <p className="mb-1 text-[11px] tracking-[0.18em] text-golddim">共识与分歧</p>
                <TypeText text={result.consensus} active speed={28} />
              </motion.div>
            )}
            {phase === 10 && (
              <motion.div
                key="closing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-[560px] rounded-xl border border-gold/50 bg-gold/[0.08] px-5 py-4 text-center text-[14px] leading-[2.1] text-goldbright"
              >
                <p className="mb-1 text-[11px] tracking-[0.18em] text-golddim">先生收束</p>
                <TypeText text={result.closing} active speed={30} />
              </motion.div>
            )}
            {phase === 11 && (
              <motion.p
                key="end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[12px] tracking-[0.1em] text-inkfaint"
              >
                演出结束 · 结果已全部呈现
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 控制条 */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          onClick={onSkip}
          className="rounded-full border border-golddim/30 px-4 py-1.5 text-[12px] tracking-[0.1em] text-silkmuted transition-colors hover:border-gold/50 hover:text-golddim"
        >
          跳过演出 · 看全文
        </button>
        {finished && (
          <span className="text-[11.5px] tracking-[0.08em] text-golddim">「重演」可用查看全文后返回</span>
        )}
      </div>

      <style>{`
        @keyframes zifu-pulse { 0%,100% { box-shadow: 0 0 16px rgba(201,164,92,0.35); } 50% { box-shadow: 0 0 32px rgba(201,164,92,0.75); } }
        .cursor-blink { display: inline-block; width: 7px; height: 14px; background: #c9a45c; vertical-align: -2px; animation: zifu-blink 0.9s infinite; }
        @keyframes zifu-blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}
