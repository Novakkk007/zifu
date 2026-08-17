/**
 * 罗盘定位组件（SVG）——手动旋转盘面确定宅向。
 * 盘面：二十四山简化（八宫 + 天干地支），可拖动/按钮微调。
 * 移动端可接入 DeviceOrientation（V2）。
 */
import { useRef, useState } from 'react'

/** 八宫方位（按罗盘顺时针序：北起） */
const PALACES = [
  { name: '坎 · 北', short: '北', degrees: 0 },
  { name: '艮 · 东北', short: '东北', degrees: 45 },
  { name: '震 · 东', short: '东', degrees: 90 },
  { name: '巽 · 东南', short: '东南', degrees: 135 },
  { name: '离 · 南', short: '南', degrees: 180 },
  { name: '坤 · 西南', short: '西南', degrees: 225 },
  { name: '兑 · 西', short: '西', degrees: 270 },
  { name: '乾 · 西北', short: '西北', degrees: 315 },
]

function nearestPalace(deg: number): string {
  const n = ((deg % 360) + 360) % 360
  let best = PALACES[0]
  let bestDist = 360
  for (const p of PALACES) {
    const d = Math.abs(n - p.degrees)
    const dist = Math.min(d, 360 - d)
    if (dist < bestDist) {
      bestDist = dist
      best = p
    }
  }
  return best.name
}

export interface LoupanProps {
  /** 当前朝向角度（0-359，0=正北） */
  degrees: number
  onChange: (deg: number) => void
  /** 是否手机端（提示真北测量） */
  compact?: boolean
}

export default function LoupanDial({ degrees, onChange, compact }: LoupanProps) {
  const dragRef = useRef<{ startX: number; startDeg: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const palace = nearestPalace(degrees)

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = { startX: e.clientX, startDeg: degrees }
    setDragging(true)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const next = (((dragRef.current.startDeg + dx * 0.5) % 360) + 360) % 360
    onChange(Math.round(next))
  }
  const handlePointerUp = () => {
    dragRef.current = null
    setDragging(false)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ touchAction: 'none' }}>
        <svg
          width={compact ? 220 : 260}
          height={compact ? 220 : 260}
          viewBox="-130 -130 260 260"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={dragging ? 'cursor-grabbing' : 'cursor-grab'}
          role="slider"
          aria-label="罗盘定位：拖动旋转确定朝向"
          aria-valuenow={Math.round(degrees)}
        >
          {/* 外盘 */}
          <circle r="126" fill="rgb(var(--deep))" stroke="rgb(var(--gold)/0.5)" strokeWidth="2" />
          <circle r="110" fill="none" stroke="rgb(var(--gold)/0.25)" strokeWidth="1" />
          {/* 八宫刻度 */}
          {PALACES.map((p) => {
            const rad = (p.degrees - degrees) * (Math.PI / 180)
            const x = Math.sin(rad) * 118
            const y = -Math.cos(rad) * 118
            return (
              <g key={p.name} transform={`translate(${x},${y})`}>
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={p.name === palace ? 'rgb(var(--gold-bright))' : 'rgb(var(--silkmuted))'}
                  fontSize={p.name === palace ? '15' : '12'}
                  fontWeight={p.name === palace ? '700' : '400'}
                >
                  {p.short}
                </text>
              </g>
            )
          })}
          {/* 指针（固定在顶部 = 当前宅向） */}
          <g transform="rotate(-90)">
            <polygon points="0,-118 -7,-88 7,-88" fill="rgb(var(--gold-bright))" />
            <polygon points="0,118 -7,88 7,88" fill="rgb(var(--gold)/0.4)" />
          </g>
          {/* 中心 */}
          <circle r="10" fill="rgb(var(--gold))" />
          <text textAnchor="middle" dominantBaseline="central" fontSize="8" fill="rgb(var(--deep))" fontWeight="700">
            宅向
          </text>
          {/* 十字线 */}
          <line x1="0" y1="-90" x2="0" y2="90" stroke="rgb(var(--gold)/0.3)" strokeWidth="0.5" />
          <line x1="-90" y1="0" x2="90" y2="0" stroke="rgb(var(--gold)/0.3)" strokeWidth="0.5" />
        </svg>
      </div>
      <p className="mt-3 text-[13px] text-silktext">
        宅向：<span className="font-bold text-goldbright">{palace}</span>
        <span className="ml-2 text-silkmuted">{Math.round(((degrees % 360) + 360) % 360)}°</span>
      </p>
      <div className="mt-2 flex gap-2">
        {[-5, -1, 1, 5].map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange((((degrees + step) % 360) + 360) % 360)}
            className="rounded-full border border-golddim/40 px-3 py-1 text-[12px] text-silkmuted hover:border-goldbright hover:text-goldbright"
          >
            {step > 0 ? `+${step}°` : `${step}°`}
          </button>
        ))}
      </div>
      <p className="mt-2 max-w-[260px] text-center text-[11px] leading-[1.7] text-silkmuted">
        手机端可用系统罗盘测量大门朝向（正对门口方向），拖动本盘对齐即可
      </p>
    </div>
  )
}
