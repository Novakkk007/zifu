import { memo } from 'react'
import BrandLogo from '@/components/BrandLogo'

/** 外环：干支（八字 · 四柱干支） */
const OUTER = '甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥'.split('')
/** 中环：紫微十二宫 */
const MIDDLE = '命兄夫子财疾迁友官田福父'.split('')
/** 内环：二十八宿摘选（七政 · 二十八宿） */
const INNER = '角亢氐房心尾箕斗牛女虚危室壁'.split('')

type RingSpec = {
  chars: string[]
  /** 环直径 px */
  size: number
  /** 恒转一周秒数 */
  period: number
  reverse?: boolean
  label: string
}

const RINGS: RingSpec[] = [
  { chars: OUTER, size: 420, period: 60, label: '八字 · 四柱干支' },
  { chars: MIDDLE, size: 300, period: 90, reverse: true, label: '紫微 · 十二宫' },
  { chars: INNER, size: 180, period: 120, label: '七政 · 二十八宿' },
]

function Ring({ spec, index }: { spec: RingSpec; index: number }) {
  const r = spec.size / 2
  return (
    <div
      className="tri-ring absolute left-1/2 top-1/2 opacity-0"
      style={{ width: spec.size, height: spec.size, marginLeft: -r, marginTop: -r }}
    >
      {/* 恒转层（与 GSAP 入场作用的 .tri-ring 分离，避免 transform 冲突） */}
      <div
        className="h-full w-full"
        style={{
          animation: `hc-ring-spin ${spec.period}s linear infinite${spec.reverse ? ' reverse' : ''}`,
        }}
      >
        <div className="h-full w-full rounded-full border border-gold/25" />
        {spec.chars.map((ch, i) => {
          const angle = (360 / spec.chars.length) * i
          return (
            <span
              key={`${ch}-${i}`}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `rotate(${angle}deg) translateY(-${r - 1}px)` }}
            >
              <span className="block -translate-x-1/2 -translate-y-1/2 font-serif text-[11px] text-gold/60">
                {ch}
              </span>
            </span>
          )
        })}
      </div>
      {/* 环名小签（不随环旋转） */}
      <span
        className="pointer-events-none absolute left-1/2 whitespace-nowrap font-serif text-[11px] tracking-[0.2em] text-gold/70"
        style={{
          top: index === 0 ? -4 : -10,
          transform: 'translate(-50%, -100%)',
        }}
      >
        {spec.label}
      </span>
    </div>
  )
}

/**
 * 三盘环图：三个同心金线圆环（八字/紫微/七政）各自反向缓转，
 * 圆心 BrandLogo 葫芦母标 64px + 金点。入场由页面 GSAP（.tri-ring scale .7→1）驱动。
 */
const TriRingDiagram = memo(function TriRingDiagram() {
  return (
    <div className="relative h-[440px] w-[440px] max-w-[92vw] origin-center scale-[0.66] sm:scale-90 lg:scale-100">
      {RINGS.map((spec, i) => (
        <Ring key={spec.label} spec={spec} index={i} />
      ))}
      {/* 圆心 */}
      <div className="tri-ring absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center opacity-0">
        <BrandLogo variant="mark" theme="indigo" size={64} />
        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-goldbright" />
      </div>
    </div>
  )
})

export default TriRingDiagram
