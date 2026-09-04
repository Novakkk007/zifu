/**
 * 先生的话 · 金句轮播（首页人味区）
 * 每 5.5 秒切换一句，淡入淡出；点击可手动切换。
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MR_QUOTES } from '@/data/mr-quotes'

export default function QuoteRotator() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MR_QUOTES.length), 5500)
    return () => clearInterval(t)
  }, [])
  const quote = MR_QUOTES[idx]
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-sans text-[11px] tracking-[0.3em] text-silkmuted/70">先生的话</p>
      <button
        type="button"
        onClick={() => setIdx((i) => (i + 1) % MR_QUOTES.length)}
        className="mt-3 block w-full cursor-pointer"
        aria-label="下一条先生的话"
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-[16px] leading-[2] tracking-[0.06em] text-silktext sm:text-[18px]"
          >
            「{quote}」
          </motion.p>
        </AnimatePresence>
      </button>
      <div className="mt-4 flex items-center justify-center gap-1.5">
        {MR_QUOTES.map((_, i) => (
          <span
            key={i}
            className={`h-1 w-1 rounded-full transition-colors ${i === idx ? 'bg-goldbright' : 'bg-silkmuted/30'}`}
          />
        ))}
      </div>
    </div>
  )
}
