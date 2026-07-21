import { motion } from 'framer-motion'
import type { Wuxing } from '@/lib/ganzhi'
import { WUXING_COLORS, WUXING_LIST } from '@/lib/ganzhi'

type WuxingBarProps = {
  count: Record<Wuxing, number>
  missing: Wuxing[]
}

/** 五行统计条：一根横条按金木水火土分色填充 + 计数小字 + 缺行金注 */
export default function WuxingBar({ count, missing }: WuxingBarProps) {
  const total = WUXING_LIST.reduce((s, w) => s + count[w], 0) || 1

  return (
    <div className="rounded-xl border border-golddim/25 bg-silk2 p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-serif text-[17px] font-bold tracking-[0.12em] text-inktext">
          五行统计
        </h3>
        <span className="text-[12px] text-inkmuted">干支各计一 · 藏干各计半</span>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-4 w-full origin-left overflow-hidden rounded-full"
      >
        {WUXING_LIST.map((w) =>
          count[w] > 0 ? (
            <div
              key={w}
              style={{
                width: `${(count[w] / total) * 100}%`,
                backgroundColor: WUXING_COLORS[w],
              }}
            />
          ) : null,
        )}
      </motion.div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5">
        {WUXING_LIST.map((w) => (
          <span key={w} className="flex items-center gap-1.5 text-[13px] text-inkmuted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: WUXING_COLORS[w] }}
            />
            <span className="font-serif font-bold text-inktext">{w}</span>
            {count[w] > 0 ? (
              <span className="font-latin">{count[w].toFixed(1)}</span>
            ) : (
              <span className="font-medium text-golddim">缺</span>
            )}
          </span>
        ))}
      </div>

      {missing.length > 0 && (
        <p className="mt-3 text-[12.5px] tracking-[0.06em] text-golddim">
          命局缺{missing.join('、')} —— 宜从岁运流转与后天行事中补益。
        </p>
      )}
    </div>
  )
}
