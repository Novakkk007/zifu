/**
 * 论命圆桌 · 动态演出舞台
 * 窄屏按席位纵向演出，桌面保留环坐；阶段与打字共用一个间隔计时器。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { RoundTableResult } from '@/lib/roundtable'
import {
  buildRoundTablePhases,
  createRoundTablePlayback,
  DEFAULT_TYPEWRITER_SPEED,
  PLAYBACK_TICK_MS,
} from '@/lib/roundtable-playback'

interface StageProps {
  result: RoundTableResult
  onFinish: () => void
  onSkip: () => void
  /** 每两个字素的间隔毫秒数，0 表示直接显示全文。 */
  typewriterSpeed?: number
}

const SEAT_POSITIONS = [
  { left: '20%', top: '16%' },
  { left: '12%', top: '46%' },
  { left: '24%', top: '77%' },
  { left: '76%', top: '77%' },
  { left: '88%', top: '46%' },
  { left: '80%', top: '16%' },
  { left: '50%', top: '88%' },
]
const AVATARS = ['📜', '📚', '🧭', '🌊', '🕯️', '🧧', '🔮']

export default function RoundTableStage({ result, onFinish, onSkip, typewriterSpeed = DEFAULT_TYPEWRITER_SPEED }: StageProps) {
  const phases = useMemo(() => buildRoundTablePhases(result), [result])
  const [playback, setPlayback] = useState({ result, phase: 0, shown: '', finished: false })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const settingsRef = useRef({ onFinish, typewriterSpeed })

  useEffect(() => {
    settingsRef.current = { onFinish, typewriterSpeed }
  }, [onFinish, typewriterSpeed])

  useEffect(() => {
    const clock = createRoundTablePlayback(phases)
    const timer = setInterval(() => {
      const next = clock.tick(settingsRef.current.typewriterSpeed)
      setPlayback((previous) => previous.phase === next.phase && previous.shown === next.shown && previous.finished === next.finished
        ? previous : { result, ...next })
      if (next.finished) {
        clearInterval(timer)
        timerRef.current = null
        settingsRef.current.onFinish()
      }
    }, PLAYBACK_TICK_MS)
    timerRef.current = timer
    // 清理本次 effect 创建的计时器，兼容卸载、结果替换和 StrictMode。
    return () => {
      clearInterval(timer)
      if (timerRef.current === timer) timerRef.current = null
    }
  }, [phases, result])

  // 新结果从开场前重新演出；父组件普通重渲染或调速不重置阶段。
  if (playback.result !== result) {
    setPlayback({ result, phase: 0, shown: '', finished: false })
    return null
  }
  const phase = phases[playback.phase]
  const speaking = phase.kind === 'seat' ? phase.seatIndex! : -1
  const hostSpeaking = phase.kind === 'opening' || phase.kind === 'closing'
  // 异常响应席位超过七个时也使用列表，避免复用环坐坐标导致重叠。
  const ringLayout = result.seats.length <= SEAT_POSITIONS.length
  const speech = (
    <AnimatePresence mode="wait">
      <motion.div
        key={playback.finished ? 'finished' : playback.phase}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="min-w-0 rounded-xl border border-golddim/30 bg-deep2 px-4 py-4 text-[13.5px] leading-[2] text-silk shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
      >
        <p className="mb-1 text-[11px] tracking-[0.14em] text-golddim" role="status">
          {playback.finished ? '演出结束 · 结果已全部呈现' : phase.title}
        </p>
        {!playback.finished && phase.kind !== 'waiting' && (
          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
            {playback.shown}
            {playback.shown !== phase.text && <span className="roundtable-cursor" aria-hidden="true" />}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  )

  return (
    <div className="relative" data-roundtable-stage>
      <div className="rounded-2xl border border-golddim/20 bg-gradient-to-b from-deep2 to-deep3 px-4 py-6 sm:px-8">
        <div className={ringLayout ? 'relative md:h-[430px]' : 'relative'}>
          {/* 定位包裹层与动画层分离，防止动画 transform 覆盖居中偏移。 */}
          <div className={ringLayout ? 'text-center md:absolute md:left-1/2 md:top-0 md:-translate-x-1/2' : 'text-center'}>
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-deep3 text-[24px] transition-shadow ${
                hostSpeaking ? 'border-gold shadow-[0_0_28px_rgba(201,164,92,0.5)]' : 'border-golddim/40'
              }`} aria-hidden="true">🎓</div>
              <p className="mt-1.5 text-[13px] tracking-[0.16em] text-golddim">先生</p>
            </motion.div>
          </div>

          <div className={`mt-4 ${ringLayout ? 'md:hidden' : ''}`}>
            {(phase.kind === 'waiting' || phase.kind === 'opening') && speech}
          </div>

          {/* 移动端用正常文档流，当前发言紧随席位，长文自动撑开。 */}
          <ol className={`mt-4 space-y-3 ${ringLayout ? 'md:hidden' : ''}`} aria-label="圆桌席位">
            {result.seats.map((seat, i) => (
              <motion.li
                key={`${i}-${seat.school}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="min-w-0 rounded-xl border border-golddim/20 bg-deep2 p-3"
                aria-current={speaking === i ? 'step' : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${speaking === i ? 'border-gold' : 'border-golddim/30'}`} aria-hidden="true">{AVATARS[i % AVATARS.length]}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] text-silk [overflow-wrap:anywhere]">第{i + 1}席 · {seat.school}</p>
                    <p className="text-[11px] text-inkmuted">{speaking === i ? '正在发言' : playback.phase > i + 2 ? '聆听中' : '待入席'}</p>
                  </div>
                </div>
                {speaking === i && <div className="mt-3">{speech}</div>}
              </motion.li>
            ))}
          </ol>

          {ringLayout && (
            <div className="hidden md:block" aria-hidden="true">
              {result.seats.map((seat, i) => (
                <div key={`${i}-${seat.school}`} className="absolute w-[104px] -translate-x-1/2 -translate-y-1/2 text-center" style={SEAT_POSITIONS[i]}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: speaking === i ? 1 : playback.phase >= i + 2 ? 0.6 : 0.3, scale: speaking === i ? 1.05 : 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full border bg-deep2 text-[19px] ${
                      speaking === i ? 'border-gold shadow-[0_0_26px_rgba(201,164,92,0.65)]' : 'border-golddim/40'
                    }`}>{AVATARS[i]}</div>
                    <p className="mt-1 break-words text-[11.5px] leading-tight text-silk" title={seat.school}>{Array.from(seat.school).slice(0, 8).join('')}{Array.from(seat.school).length > 8 ? '…' : ''}</p>
                    <p className="text-[10px] text-inkmuted">{speaking === i ? '正在发言' : playback.phase > i + 2 ? '聆听中' : '待入席'}</p>
                  </motion.div>
                </div>
              ))}
              <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-golddim/35 bg-deep3 text-center">
                <p className="text-[13px] tracking-[0.2em] text-golddim">一盘命局</p>
                <p className="mt-1.5 text-[10px] text-inkmuted">七席各言其见</p>
              </div>
            </div>
          )}
        </div>

        {/* 桌面发言区独立占行，不再遮挡下方席位。 */}
        {ringLayout && <div className="mx-auto mt-4 hidden max-w-[640px] md:block">{speech}</div>}
        <div className={`mt-4 ${ringLayout ? 'md:hidden' : ''}`}>
          {(phase.kind === 'consensus' || phase.kind === 'closing' || playback.finished) && speech}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (timerRef.current !== null) clearInterval(timerRef.current)
            timerRef.current = null
            onSkip()
          }}
          className="rounded-full border border-golddim/30 px-4 py-1.5 text-[12px] tracking-[0.1em] text-silkmuted transition-colors hover:border-gold/50 hover:text-golddim"
        >跳过演出 · 看全文</button>
      </div>
      <style>{`
        .roundtable-cursor { display: inline-block; width: 7px; height: 14px; margin-left: 2px; background: #c9a45c; vertical-align: -2px; animation: roundtable-blink 0.9s infinite; }
        @keyframes roundtable-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .roundtable-cursor { animation: none; } }
      `}</style>
    </div>
  )
}
