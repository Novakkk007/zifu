/**
 * 五行分析区：比例条 + 生克关系环（SVG）+ 来源拆分 + 缺失提示
 * + 旺衰等级卡 + 用神/喜神/忌神卡。
 * 双编码：五行 = 颜色 + 图形符号 + SVG 线型（图例说明，色盲可读）。
 */
import { motion, useReducedMotion } from 'framer-motion'
import type { BaziChartV2, PillarInfo, Wuxing } from '@contracts/bazi-core'
import { WUXING_KE, WUXING_LIST, WUXING_SHENG } from '@contracts/bazi-core'
import { WUXING_COLORS, WUXING_DASH, WUXING_ICONS, WUXING_STYLE_LABEL } from '@/lib/wuxing-style'

/* 相生环顺序（顺时针）：木→火→土→金→水 */
const RING_ORDER: Wuxing[] = ['木', '火', '土', '金', '水']

function relToDayMaster(w: Wuxing, dm: Wuxing): string {
  if (w === dm) return '同我'
  if (WUXING_SHENG[w] === dm) return '生我'
  if (WUXING_SHENG[dm] === w) return '我生'
  if (WUXING_KE[w] === dm) return '克我'
  return '我克'
}

/* ---------------- 比例条 ---------------- */

function ProportionBar({ chart }: { chart: BaziChartV2 }) {
  const reduce = useReducedMotion()
  const total = WUXING_LIST.reduce((s, w) => s + chart.wuxing.count[w], 0) || 1
  return (
    <div>
      <div
        className="flex h-9 w-full overflow-hidden rounded-full border border-golddim/25 bg-silk"
        role="img"
        aria-label={WUXING_LIST.map(
          (w) => `${w} ${((chart.wuxing.count[w] / total) * 100).toFixed(0)}%`,
        ).join('，')}
      >
        {WUXING_LIST.map((w) => {
          const frac = chart.wuxing.count[w] / total
          if (frac <= 0) return null
          return (
            <motion.div
              key={w}
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-full origin-left items-center justify-center"
              style={{ width: `${frac * 100}%`, backgroundColor: WUXING_COLORS[w] }}
              title={`${w} ${chart.wuxing.count[w].toFixed(2)}（${(frac * 100).toFixed(1)}%）`}
            >
              {frac > 0.09 && (
                <span className="font-serif text-[13px] font-bold text-white/95">
                  {WUXING_ICONS[w]} {w}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
      {/* 数值行 */}
      <div className="mt-3 grid grid-cols-5 gap-2">
        {WUXING_LIST.map((w) => (
          <div key={w} className="text-center">
            <p className="font-serif text-[14px] font-bold" style={{ color: WUXING_COLORS[w] }}>
              {WUXING_ICONS[w]} {w}
            </p>
            <p className="text-[12px] text-inktext">{chart.wuxing.count[w].toFixed(2)}</p>
            <p className="text-[11px] text-inkmuted">
              {((chart.wuxing.count[w] / total) * 100).toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] leading-[1.8] text-inkmuted">
        计数权重：天干 1.0；藏干 本气 0.6 / 中气 0.25 / 余气 0.15（权重公开，见旺衰模型说明）。
        {chart.wuxing.missing.length > 0 ? (
          <span className="text-[#B04A3A]"> 盘中缺{chart.wuxing.missing.join('、')}。</span>
        ) : (
          ' 五行俱全，无所缺。'
        )}
      </p>
    </div>
  )
}

/* ---------------- 生克关系环（SVG） ---------------- */

function ShengKeRing({ chart }: { chart: BaziChartV2 }) {
  const dm = chart.dayMasterWuxing
  const SIZE = 340
  const C = SIZE / 2
  const R = 118
  const NODE = 30
  const pos = (i: number) => {
    const angle = (-90 + i * 72) * (Math.PI / 180)
    return { x: C + R * Math.cos(angle), y: C + R * Math.sin(angle) }
  }
  // 相生：i → i+1（沿外环弧线）；相克：i → i+2（五角弦线）
  const arcPath = (i: number) => {
    const a = pos(i)
    const b = pos((i + 1) % 5)
    // 缩短到节点圆外
    const shrink = (p: { x: number; y: number }, q: { x: number; y: number }) => {
      const dx = q.x - p.x
      const dy = q.y - p.y
      const len = Math.hypot(dx, dy)
      return { x: q.x - (dx / len) * (NODE + 6), y: q.y - (dy / len) * (NODE + 6) }
    }
    const e = shrink(a, b)
    return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${e.x} ${e.y}`
  }
  const chordPath = (i: number) => {
    const a = pos(i)
    const b = pos((i + 2) % 5)
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    const sx = a.x + (dx / len) * (NODE + 4)
    const sy = a.y + (dy / len) * (NODE + 4)
    const ex = b.x - (dx / len) * (NODE + 8)
    const ey = b.y - (dy / len) * (NODE + 8)
    return `M ${sx} ${sy} L ${ex} ${ey}`
  }
  return (
    <div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[360px]" role="img" aria-label="五行生克关系环">
        <defs>
          <marker id="arrow-sheng" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#8E7830" />
          </marker>
          <marker id="arrow-ke" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#9A5A4E" />
          </marker>
        </defs>
        {/* 相克弦线（先画，压在节点下） */}
        {RING_ORDER.map((w, i) => (
          <path
            key={`ke-${w}`}
            d={chordPath(i)}
            fill="none"
            stroke={WUXING_COLORS[RING_ORDER[(i + 2) % 5]]}
            strokeWidth={1.4}
            strokeDasharray={WUXING_DASH[RING_ORDER[(i + 2) % 5]]}
            opacity={0.65}
            markerEnd="url(#arrow-ke)"
          />
        ))}
        {/* 相生弧 */}
        {RING_ORDER.map((w, i) => (
          <path
            key={`sheng-${w}`}
            d={arcPath(i)}
            fill="none"
            stroke={WUXING_COLORS[RING_ORDER[(i + 1) % 5]]}
            strokeWidth={2.4}
            strokeDasharray={WUXING_DASH[RING_ORDER[(i + 1) % 5]]}
            opacity={0.9}
            markerEnd="url(#arrow-sheng)"
          />
        ))}
        {/* 节点 */}
        {RING_ORDER.map((w, i) => {
          const p = pos(i)
          const isDM = w === dm
          return (
            <g key={w}>
              {isDM && (
                <circle cx={p.x} cy={p.y} r={NODE + 7} fill="none" stroke="#C7A23A" strokeWidth={2} />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={NODE}
                fill={WUXING_COLORS[w]}
                stroke={isDM ? '#E4C66A' : '#fff'}
                strokeWidth={isDM ? 2 : 1.5}
              />
              <text
                x={p.x}
                y={p.y - 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={17}
                fontWeight={800}
              >
                {w}
              </text>
              <text
                x={p.x}
                y={p.y + 15}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={10}
              >
                {WUXING_ICONS[w]}
              </text>
              <text
                x={p.x}
                y={p.y + NODE + 16}
                textAnchor="middle"
                fontSize={11}
                fill={isDM ? '#8E7830' : '#6E7B6F'}
                fontWeight={isDM ? 700 : 400}
              >
                {isDM ? '日主 · 同我' : relToDayMaster(w, dm)}
              </text>
            </g>
          )
        })}
      </svg>
      {/* 图例（双编码说明） */}
      <div className="mt-2 space-y-1.5 text-[11.5px] leading-[1.8] text-inkmuted">
        <p>
          <span className="font-medium text-inktext">读法：</span>
          外环箭头 = 相生（木→火→土→金→水→木）；内弦箭头 = 相克（木→土→水→火→金→木）。
          金环 = 日主（{chart.dayMaster}
          {dm}）；节点下标注其对日主的关系（生我 / 我生 / 克我 / 我克 / 同我）。
        </p>
        <p>
          <span className="font-medium text-inktext">双编码图例：</span>
          {WUXING_LIST.map((w) => `${w} ${WUXING_STYLE_LABEL[w]}`).join('；')}
          。颜色、符号、线型三者恒定绑定，灰度/色弱场景可按符号与线型辨识。
        </p>
      </div>
    </div>
  )
}

/* ---------------- 来源拆分 ---------------- */

function SourceSplit({ chart }: { chart: BaziChartV2 }) {
  const ps: PillarInfo[] = [
    chart.pillars.year,
    chart.pillars.month,
    chart.pillars.day,
    chart.pillars.hour,
  ].filter((p): p is PillarInfo => p !== null)
  const stemPart: Record<Wuxing, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }
  const hiddenPart: Record<Wuxing, { 本气: number; 中气: number; 余气: number }> = {
    金: { 本气: 0, 中气: 0, 余气: 0 },
    木: { 本气: 0, 中气: 0, 余气: 0 },
    水: { 本气: 0, 中气: 0, 余气: 0 },
    火: { 本气: 0, 中气: 0, 余气: 0 },
    土: { 本气: 0, 中气: 0, 余气: 0 },
  }
  const W = { 本气: 0.6, 中气: 0.25, 余气: 0.15 } as const
  for (const p of ps) {
    stemPart[p.stemWuxing] += 1
    for (const h of p.hiddenStems) hiddenPart[h.wuxing][h.role] += W[h.role]
  }
  const th = 'px-3 py-2 text-left text-[11.5px] font-medium tracking-[0.08em] text-golddim'
  const td = 'px-3 py-2 text-[12.5px] text-inktext'
  return (
    <div>
      <p className="border-b border-golddim/15 px-3 py-2 text-[11px] tracking-[0.08em] text-inkmuted sm:hidden">
        左右滑动查看完整表格 →
      </p>
      <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="border-b border-golddim/25">
            <th className={th}>五行</th>
            <th className={th}>天干（×1.0）</th>
            <th className={th}>藏干本气（×0.6）</th>
            <th className={th}>中气（×0.25）</th>
            <th className={th}>余气（×0.15）</th>
            <th className={th}>合计</th>
          </tr>
        </thead>
        <tbody>
          {WUXING_LIST.map((w) => (
            <tr key={w} className="border-b border-golddim/10">
              <td className={`${td} font-serif font-bold`} style={{ color: WUXING_COLORS[w] }}>
                {WUXING_ICONS[w]} {w}
              </td>
              <td className={td}>{stemPart[w].toFixed(2)}</td>
              <td className={td}>{hiddenPart[w].本气.toFixed(2)}</td>
              <td className={td}>{hiddenPart[w].中气.toFixed(2)}</td>
              <td className={td}>{hiddenPart[w].余气.toFixed(2)}</td>
              <td className={`${td} font-bold`}>{chart.wuxing.count[w].toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------------- 旺衰 + 用神 ---------------- */

function SubScore({ label, value, max, delay }: { label: string; value: number; max: number; delay: number }) {
  const reduce = useReducedMotion()
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[12.5px] tracking-[0.08em] text-inkmuted">{label}</span>
        <span className="font-serif text-[14px] font-bold text-inktext">
          {value}
          <span className="ml-0.5 text-[11px] font-normal text-inkmuted">/ {max}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-silk">
        <motion.div
          initial={reduce ? false : { scaleX: 0 }}
          whileInView={{ scaleX: Math.min(1, value / max) }}
          viewport={{ once: true }}
          transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full w-full origin-left rounded-full [background:linear-gradient(90deg,rgb(var(--gold-dim)),rgb(var(--gold-bright)))]"
        />
      </div>
    </div>
  )
}

function StrengthCard({ chart }: { chart: BaziChartV2 }) {
  const s = chart.wuxing.strength
  return (
    <div className="rounded-xl border border-golddim/25 bg-silk2 p-6 shadow-card">
      <p className="text-center font-serif text-[15px] font-bold tracking-[0.12em] text-inktext">
        日主旺衰 · {chart.dayMaster}
        {chart.dayMasterWuxing}
      </p>
      <p className="mt-2 text-center">
        <span className="inline-block rounded-full border border-gold/50 px-4 py-1 font-serif text-[16px] font-bold tracking-[0.1em] text-golddim">
          {s.grade} · {s.total} 分
        </span>
      </p>
      <div className="mt-5 space-y-3.5">
        <SubScore label="得令（月令之气）" value={s.deling} max={40} delay={0} />
        <SubScore label="得地（支中根气）" value={s.dedi} max={30} delay={0.1} />
        <SubScore label="得势（干透帮扶）" value={s.deshi} max={30} delay={0.2} />
      </div>
      <p className="mt-5 border-t border-golddim/15 pt-3 text-[11.5px] leading-[1.8] text-inkmuted">
        {s.model}
      </p>
      <p className="mt-2 text-[11.5px] leading-[1.8] text-inkmuted">{s.confidence}</p>
      <p className="mt-2 text-[11.5px] font-medium leading-[1.8] text-golddim">{s.disclaimer}</p>
    </div>
  )
}

function Chip({ w, tone }: { w: Wuxing; tone: 'yong' | 'xi' | 'ji' }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-serif text-[14px] font-bold"
      style={{
        color: WUXING_COLORS[w],
        borderColor: `${WUXING_COLORS[w]}66`,
        backgroundColor: tone === 'ji' ? '#B04A3A0d' : `${WUXING_COLORS[w]}0f`,
      }}
    >
      {WUXING_ICONS[w]} {w}
    </span>
  )
}

function YongShenCard({ chart }: { chart: BaziChartV2 }) {
  const y = chart.yongshen
  return (
    <div className="rounded-xl border border-golddim/25 bg-silk2 p-6 shadow-card">
      <p className="text-center font-serif text-[15px] font-bold tracking-[0.12em] text-inktext">
        用神 · 喜神 · 忌神（{y.method}法 · {y.strengthGrade}）
      </p>
      <div className="mt-5 space-y-3 text-[13px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-14 text-inkmuted">用神</span>
          <Chip w={y.yongshen} tone="yong" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-14 text-inkmuted">喜神</span>
          {y.xishen.length > 0 ? y.xishen.map((w) => <Chip key={w} w={w} tone="xi" />) : <span className="text-inkmuted">—</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-14 text-inkmuted">忌神</span>
          {y.jishen.length > 0 ? y.jishen.map((w) => <Chip key={w} w={w} tone="ji" />) : <span className="text-inkmuted">—</span>}
        </div>
      </div>
      <ul className="mt-5 space-y-2 border-t border-golddim/15 pt-4">
        {y.reasoning.map((r, i) => (
          <li key={i} className="flex gap-2 text-[12.5px] leading-[1.9] text-inktext">
            <span className="mt-0.5 shrink-0 text-golddim">{i + 1}.</span>
            {r}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11.5px] font-medium leading-[1.8] text-golddim">{y.disclaimer}</p>
    </div>
  )
}

/* ---------------- 区块出口 ---------------- */

export default function WuxingSection({ chart }: { chart: BaziChartV2 }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-golddim/25 bg-silk2 p-6 shadow-card">
          <p className="mb-4 text-center font-serif text-[15px] font-bold tracking-[0.12em] text-inktext">
            五行比例（颜色 + 符号双编码）
          </p>
          <ProportionBar chart={chart} />
          <div className="mt-5 border-t border-golddim/15 pt-4">
            <p className="mb-2 text-[12px] font-medium tracking-[0.1em] text-inkmuted">
              来源拆分（天干 / 地支藏干）
            </p>
            <SourceSplit chart={chart} />
          </div>
        </div>
        <div className="rounded-xl border border-golddim/25 bg-silk2 p-6 shadow-card">
          <p className="mb-4 text-center font-serif text-[15px] font-bold tracking-[0.12em] text-inktext">
            五行生克关系环
          </p>
          <ShengKeRing chart={chart} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <StrengthCard chart={chart} />
        <YongShenCard chart={chart} />
      </div>
    </div>
  )
}
