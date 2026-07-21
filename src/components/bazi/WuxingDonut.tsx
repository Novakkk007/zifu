import { motion } from 'framer-motion'
import type { Wuxing } from '@/lib/ganzhi'
import { WUXING_COLORS, WUXING_LIST } from '@/lib/ganzhi'

type WuxingDonutProps = {
  outer: Record<Wuxing, number> // 甲方（外环）
  inner: Record<Wuxing, number> // 乙方（内环）
}

const SIZE = 220
const C = SIZE / 2
const R_OUT = 96
const R_IN = 72
const STROKE = 15

function Ring({
  data,
  radius,
  delayBase,
}: {
  data: Record<Wuxing, number>
  radius: number
  delayBase: number
}) {
  const circ = 2 * Math.PI * radius
  const total = WUXING_LIST.reduce((s, w) => s + data[w], 0) || 1
  let acc = 0
  return (
    <>
      {WUXING_LIST.map((w, i) => {
        const frac = data[w] / total
        const startAngle = (acc / total) * 360 - 90
        acc += data[w]
        if (frac <= 0) return null
        const len = frac * circ
        return (
          <motion.circle
            key={w}
            cx={C}
            cy={C}
            r={radius}
            fill="none"
            stroke={WUXING_COLORS[w]}
            strokeWidth={STROKE}
            strokeDasharray={`${len} ${circ - len}`}
            strokeLinecap="butt"
            transform={`rotate(${startAngle} ${C} ${C})`}
            initial={{ strokeDashoffset: len }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ delay: delayBase + i * 0.12, duration: 1.4, ease: 'easeOut' }}
          />
        )
      })}
    </>
  )
}

/** 五行互补双环 donut：外环甲方、内环乙方，五色分段描画 */
export default function WuxingDonut({ outer, inner }: WuxingDonutProps) {
  return (
    <div className="flex flex-col items-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img">
        {/* 底环 */}
        <circle cx={C} cy={C} r={R_OUT} fill="none" stroke="rgba(142,118,48,0.12)" strokeWidth={STROKE} />
        <circle cx={C} cy={C} r={R_IN} fill="none" stroke="rgba(142,118,48,0.12)" strokeWidth={STROKE} />
        <Ring data={outer} radius={R_OUT} delayBase={0.1} />
        <Ring data={inner} radius={R_IN} delayBase={0.4} />
      </svg>
      <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
        {WUXING_LIST.map((w) => (
          <span key={w} className="flex items-center gap-1.5 text-[12.5px] text-inkmuted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: WUXING_COLORS[w] }}
            />
            {w}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[12px] tracking-[0.08em] text-inkmuted">
        外环 甲方 · 内环 乙方
      </p>
    </div>
  )
}
