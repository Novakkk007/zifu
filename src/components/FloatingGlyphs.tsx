import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'

const GLYPH_POOL = [
  // 干支
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
  // 八卦
  '乾', '坤', '震', '巽', '坎', '离', '艮', '兑',
  // 六十四卦摘选
  '泰', '否', '谦', '既济', '未济', '复', '姤', '恒',
  // 二十八宿
  '角', '亢', '氐', '房', '心', '尾', '箕', '斗', '牛', '女', '虚', '危', '室', '壁',
  // 紫微星曜
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
  // 七政四余
  '日', '月', '木', '火', '土', '金', '水', '紫气', '月孛', '罗睺', '计都',
]

type Glyph = {
  text: string
  left: number
  top: number
  size: number
  opacity: number
  duration: number
  delay: number
  gx: number
  gy: number
  gr: number
}

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

type FloatingGlyphsProps = {
  count?: number
  /** 深底情境透明度更高 */
  onDeep?: boolean
  className?: string
}

/**
 * 漂浮字场：干支 / 卦名 / 星曜缓慢漂移（transform-only，≤48 个）。
 * 视差由外层容器负责（首页 Hero 用 GSAP scrub 包一层）。
 */
const FloatingGlyphs = memo(function FloatingGlyphs({
  count = 40,
  onDeep = true,
  className,
}: FloatingGlyphsProps) {
  const glyphs = useMemo<Glyph[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const r = (n: number) => pseudoRandom(i * 7 + n * 13)
      return {
        text: GLYPH_POOL[Math.floor(r(1) * GLYPH_POOL.length)],
        left: r(2) * 100,
        top: r(3) * 100,
        size: 12 + r(4) * 10,
        opacity: onDeep ? 0.08 + r(5) * 0.06 : 0.05 + r(5) * 0.04,
        duration: 26 + r(6) * 34,
        delay: -r(7) * 40,
        gx: (r(8) - 0.5) * 60,
        gy: (r(9) - 0.5) * 60,
        gr: (r(10) - 0.5) * 12,
      }
    })
  }, [count, onDeep])

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {glyphs.map((g, i) => (
        <span
          key={i}
          className="animate-glyph-drift absolute font-serif font-normal text-gold will-change-transform"
          style={{
            left: `${g.left}%`,
            top: `${g.top}%`,
            fontSize: `${g.size}px`,
            opacity: g.opacity,
            animationDuration: `${g.duration}s`,
            animationDelay: `${g.delay}s`,
            ['--gx' as string]: `${g.gx}px`,
            ['--gy' as string]: `${g.gy}px`,
            ['--gr' as string]: `${g.gr}deg`,
          }}
        >
          {g.text}
        </span>
      ))}
    </div>
  )
})

export default FloatingGlyphs
