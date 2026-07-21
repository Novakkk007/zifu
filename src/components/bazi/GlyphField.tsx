import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { seededRandom } from '@/lib/random'

type GlyphFieldProps = {
  /** 本页字池 */
  pool: string[]
  count?: number
  seed?: number
  className?: string
}

/** 页面级漂浮字场（可自定义字池；transform-only 漂移） */
const GlyphField = memo(function GlyphField({
  pool,
  count = 24,
  seed = 7,
  className,
}: GlyphFieldProps) {
  const glyphs = useMemo(() => {
    const rand = seededRandom(seed)
    return Array.from({ length: count }, (_, i) => ({
      text: pool[Math.floor(rand() * pool.length)],
      left: rand() * 100,
      top: rand() * 100,
      size: 12 + rand() * 10,
      opacity: 0.05 + rand() * 0.09,
      duration: 26 + rand() * 34,
      delay: -rand() * 40,
      gx: (rand() - 0.5) * 60,
      gy: (rand() - 0.5) * 60,
      gr: (rand() - 0.5) * 12,
      key: i,
    }))
  }, [pool, count, seed])

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {glyphs.map((g) => (
        <span
          key={g.key}
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
