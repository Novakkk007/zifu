/**
 * 晋升仪式：段位晋升时的全屏转场——逐字+剑形流光+「晋」印章
 * 一生一次（段位只升不降），绝顶宗师特例加长
 */
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { RankLevel } from '@/lib/jianlu'

interface RankUpOverlayProps {
  rank: RankLevel
  onDone: () => void
}

export default function RankUpOverlay({ rank, onDone }: RankUpOverlayProps) {
  const reduce = useReducedMotion()
  const [show, setShow] = useState(true)
  const isSupreme = rank.index >= 5

  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), isSupreme ? 2400 : 1800)
    return () => window.clearTimeout(t)
  }, [isSupreme])

  useEffect(() => {
    if (!show) {
      const t = window.setTimeout(onDone, 450)
      return () => window.clearTimeout(t)
    }
  }, [show, onDone])

  const chars = rank.name.split('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden bg-deep2/97"
      aria-live="polite"
      aria-label={`晋升：${rank.name}`}
    >
      {/* 背景剑光 */}
      {!reduce && (
        <span
          aria-hidden
          className="pointer-events-none absolute h-[140%] w-24 -rotate-12 bg-gradient-to-b from-transparent via-gold/[0.14] to-transparent"
          style={{ animation: 'rank-sweep 1.4s ease-out 1' }}
        />
      )}
      <p className="text-[13px] tracking-[0.42em] text-golddim">段位晋升</p>
      <div className="mt-6 flex items-baseline gap-2">
        {chars.map((c, i) => (
          <motion.span
            key={i}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
            className="font-serif text-[clamp(32px,6vw,52px)] font-bold tracking-[0.12em] text-goldbright"
          >
            {c}
          </motion.span>
        ))}
      </div>
      {/* 印章 */}
      <motion.span
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 2.2, rotate: -14 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 16 }}
        className="mt-8 flex h-16 w-16 items-center justify-center rounded-lg border-2 border-[#a83c2e] font-serif text-[28px] font-black text-[#c9533f]"
      >
        晋
      </motion.span>
      <p className="mt-6 max-w-sm px-6 text-center text-[13px] leading-[2] tracking-[0.08em] text-silkmuted">
        {isSupreme ? '华山七峰尽破，天下问剑者，你是第一人。' : rank.desc}
      </p>

      <style>{`
        @keyframes rank-sweep {
          0% { transform: translateX(-160%) rotate(-12deg); }
          100% { transform: translateX(220%) rotate(-12deg); }
        }
      `}</style>
    </motion.div>
  )
}
