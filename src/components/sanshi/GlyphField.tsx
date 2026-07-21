import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'

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

type GlyphFieldProps = {
  /** 本页专属词池（如二十八宿、八门九星） */
  pool: string[]
  count?: number
  className?: string
}

/** 页面 Hero 漂浮字场：与共享 FloatingGlyphs 同风格，但词池按页定制（无视差） */
const GlyphField = memo(function GlyphField({ pool, count = 36, className }: GlyphFieldProps) {
  const glyphs = useMemo<Glyph[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const r = (n: number) => pseudoRandom(i * 7 + n * 13 + pool.length)
      return {
        text: pool[Math.floor(r(1) * pool.length)],
        left: r(2) * 100,
        top: r(3) * 100,
        size: 12 + r(4) * 10,
        opacity: 0.08 + r(5) * 0.06,
        duration: 26 + r(6) * 34,
        delay: -r(7) * 40,
        gx: (r(8) - 0.5) * 60,
        gy: (r(9) - 0.5) * 60,
        gr: (r(10) - 0.5) * 12,
      }
    })
  }, [pool, count])

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
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

export default GlyphField
