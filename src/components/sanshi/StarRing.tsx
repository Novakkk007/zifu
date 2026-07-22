import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BRANCHES, MANSIONS, polar, rng, wedgePath } from '@/components/sanshi/astro'
import { MANSION_ANGLE, MANSION_WEDGES } from '@/components/sanshi/qizheng'

/** 星盘环输入（真实星历）：星曜按宿序 + 宿内进度布点 */
export interface StarRingStar {
  name: string
  /** 宿序 0–27（角宿起） */
  mansion: number
  /** 宿内进度 0–1 */
  fraction: number
  /** 逆行标记 */
  retrograde?: boolean
}

export interface StarRingChart {
  stars: StarRingStar[]
  /** 命宫宿序与宿内进度（金轴指向） */
  mingMansion: number
  mingFraction: number
}

/** 宿 + 宿内进度 → 环上角度（宿内自起点向终点顺布） */
function starAngle(mansion: number, fraction: number): number {
  const [a0, a1] = MANSION_WEDGES[mansion]
  return a0 + fraction * (a1 - a0)
}

const C = 320 // 圆心
const R_BG = 316
const R_WEDGE_IN = 258
const R_WEDGE_OUT = 308
const R_MANSION_TEXT = 283
const R_BRANCH = 232
const R_STAR = 190
const R_STAR_TEXT = 166

type Twinkle = { x: number; y: number; r: number; dur: number; delay: number }

/** 七政四余 · 二十八宿星盘环（SVG，夜空圆盘 + 十一曜 + 命宫轴，真实星历布点） */
export default function StarRing({ chart }: { chart: StarRingChart }) {
  // 24 颗背景小星点（固定种子，闪烁循环）
  const twinkles = useMemo<Twinkle[]>(() => {
    const rand = rng(20260214)
    return Array.from({ length: 24 }, () => {
      const ang = rand() * 360
      const r = 60 + rand() * 185
      const p = polar(C, C, r, ang)
      return {
        x: p.x,
        y: p.y,
        r: 0.8 + rand() * 1.1,
        dur: 2 + rand() * 2,
        delay: -rand() * 4,
      }
    })
  }, [])

  // 命宫轴旋转角（自正上方缓转至命宫宿度）
  const mingAngle = starAngle(chart.mingMansion, chart.mingFraction)
  const axisRot = ((mingAngle - 270 + 540) % 360) - 180

  return (
    <motion.svg
      viewBox="0 0 640 640"
      className="mx-auto block w-full max-w-[640px]"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      role="img"
      aria-label="七政四余星盘"
    >
      {/* 夜空圆底 */}
      <circle cx={C} cy={C} r={R_BG} className="fill-deep3" />
      <circle cx={C} cy={C} r={R_BG} fill="none" stroke="rgb(var(--gold))" strokeOpacity={0.3} strokeWidth={1} />

      {/* 背景星点（闪烁） */}
      {twinkles.map((t, i) => (
        <circle
          key={i}
          cx={t.x}
          cy={t.y}
          r={t.r}
          className="animate-dot-breathe fill-goldbright"
          style={{ animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }}
        />
      ))}

      {/* 外环：二十八宿（四象分区底色微差） */}
      {MANSIONS.map((name, m) => {
        const center = MANSION_ANGLE[m]
        const [a0, a1] = MANSION_WEDGES[m]
        const quadrant = Math.floor(m / 7) // 0 东 1 北 2 西 3 南
        const p = polar(C, C, R_MANSION_TEXT, center)
        return (
          <g key={name}>
            <path
              d={wedgePath(C, C, R_WEDGE_IN, R_WEDGE_OUT, a1, a0)}
              className={quadrant % 2 === 0 ? 'fill-deep2' : 'fill-deep'}
              stroke="rgb(var(--gold))"
              strokeOpacity={0.22}
              strokeWidth={0.6}
            />
            <motion.text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              className="fill-goldbright font-serif"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + m * 0.03, duration: 0.4 }}
            >
              {name}
            </motion.text>
          </g>
        )
      })}

      {/* 中环分隔线 */}
      <circle cx={C} cy={C} r={R_WEDGE_IN - 6} fill="none" stroke="rgb(var(--gold))" strokeOpacity={0.18} strokeWidth={0.8} />
      <circle cx={C} cy={C} r={R_BRANCH - 22} fill="none" stroke="rgb(var(--gold))" strokeOpacity={0.14} strokeWidth={0.8} />

      {/* 中环：十二地支宫 */}
      {BRANCHES.map((b, i) => {
        const ang = 90 + i * 30
        const p = polar(C, C, R_BRANCH, ang)
        const t0 = polar(C, C, R_BRANCH + 10, ang)
        const t1 = polar(C, C, R_BRANCH + 20, ang)
        return (
          <g key={b}>
            <line x1={t0.x} y1={t0.y} x2={t1.x} y2={t1.y} stroke="rgb(var(--gold))" strokeOpacity={0.35} strokeWidth={0.8} />
            <motion.text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              className="fill-golddim font-serif"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.04, duration: 0.4 }}
            >
              {b}
            </motion.text>
          </g>
        )
      })}

      {/* 命宫轴（缓转至命宫宿度，端点金印「命」） */}
      <motion.g
        style={{ transformOrigin: '320px 320px' }}
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: axisRot, opacity: 1 }}
        transition={{
          rotate: { duration: 1.2, delay: 0.5, ease: [0.65, 0, 0.35, 1] },
          opacity: { duration: 0.4, delay: 0.5 },
        }}
      >
        <line
          x1={C}
          y1={C - R_WEDGE_OUT + 8}
          x2={C}
          y2={C + R_WEDGE_OUT - 8}
          stroke="rgb(var(--gold))"
          strokeOpacity={0.75}
          strokeWidth={1.4}
        />
        <circle cx={C} cy={C - R_MANSION_TEXT} r={13} fill="rgb(var(--gold))" />
        <circle cx={C} cy={C - R_MANSION_TEXT} r={13} fill="none" stroke="rgb(var(--gold-bright))" strokeWidth={1} />
        <text
          x={C}
          y={C - R_MANSION_TEXT}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={700}
          className="fill-deep3 font-serif"
        >
          命
        </text>
      </motion.g>

      {/* 十一曜标记（真实星历位置；逆行曜加「逆」小印） */}
      {chart.stars.map((s, i) => {
        const angle = starAngle(s.mansion, s.fraction)
        const p = polar(C, C, R_STAR, angle)
        const tp = polar(C, C, R_STAR_TEXT, angle)
        return (
          <motion.g
            key={s.name}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.1, type: 'spring', stiffness: 380, damping: 17 }}
          >
            <circle cx={p.x} cy={p.y} r={7.5} fill="none" stroke="rgb(var(--gold-bright))" strokeWidth={1} />
            <circle cx={p.x} cy={p.y} r={3.6} className="fill-goldbright" />
            <text
              x={tp.x}
              y={tp.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={s.name.length > 1 ? 11 : 13}
              className="fill-goldbright font-serif"
            >
              {s.name}
            </text>
            {s.retrograde && (
              <text
                x={tp.x}
                y={tp.y + 13}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                className="fill-red-400/90 font-serif"
              >
                逆
              </text>
            )}
          </motion.g>
        )
      })}

      {/* 圆心：logo + 紫府星盘 */}
      <image href="/assets/logo-mark.svg" x={C - 24} y={C - 30} width={48} height={48} />
      <text
        x={C}
        y={C + 36}
        textAnchor="middle"
        fontSize={11}
        letterSpacing={3}
        className="fill-silkmuted font-latin"
      >
        紫府星盘
      </text>
      <text
        x={C}
        y={C + 52}
        textAnchor="middle"
        fontSize={8}
        letterSpacing={2.5}
        className="fill-silkmuted/60 font-latin"
      >
        ZIFU STAR CHART
      </text>
    </motion.svg>
  )
}
