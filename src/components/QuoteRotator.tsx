/**
 * 先生的话 · 金句轮播（首页人味区——金句即主角）
 * 每 20 秒切换一句，hover 暂停；点击可手动切换。
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MR_QUOTES } from '@/data/mr-quotes'

export default function QuoteRotator() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIdx((i) => (i + 1) % MR_QUOTES.length), 20000)
    return () => clearInterval(t)
  }, [paused])
  const quote = MR_QUOTES[idx]
  return (
    <div
      className="mx-auto max-w-2xl text-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="font-sans text-[12px] tracking-[0.3em] text-silkmuted/70">先生的话</p>
      <button
        type="button"
        onClick={() => setIdx((i) => (i + 1) % MR_QUOTES.length)}
        className="mt-4 block w-full cursor-pointer"
        aria-label="下一条先生的话"
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7 }}
            className="font-serif text-[clamp(22px,2.6vw,28px)] font-semibold leading-[1.7] tracking-[0.04em] text-silktext"
          >
            「{quote}」
          </motion.p>
        </AnimatePresence>
      </button>
      <div className="mt-5 flex items-center justify-center gap-1.5">
        {MR_QUOTES.map((_, i) => (
          <span
            key={i}
            className={`h-[2px] transition-all duration-500 ${
              i === idx ? 'w-5 bg-goldbright' : 'w-2 bg-silkmuted/25'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
