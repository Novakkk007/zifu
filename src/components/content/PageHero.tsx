import type { ReactNode } from 'react'
import { memo, useMemo } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ---------- 字场（词池可定制，复用全局 glyph-drift keyframes） ---------- */

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

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

const GlyphField = memo(function GlyphField({
  pool,
  count = 26,
}: {
  pool: string[]
  count?: number
}) {
  const glyphs = useMemo<Glyph[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (n: number) => pseudoRandom(i * 7 + n * 13)
        return {
          text: pool[Math.floor(r(1) * pool.length)],
          left: r(2) * 100,
          top: r(3) * 100,
          size: 12 + r(4) * 10,
          opacity: 0.07 + r(5) * 0.07,
          duration: 26 + r(6) * 34,
          delay: -r(7) * 40,
          gx: (r(8) - 0.5) * 60,
          gy: (r(9) - 0.5) * 60,
          gr: (r(10) - 0.5) * 12,
        }
      }),
    [pool, count],
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
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

/* ---------- 标题字级入场 ---------- */

const charContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } },
}
const charItem = {
  hidden: { y: 26, opacity: 0, filter: 'blur(6px)' },
  show: { y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}

/* ---------- PageHero ---------- */

type PageHeroProps = {
  /** 面包屑当前页名（首页 / X） */
  breadcrumb: string
  title: string
  /** 拉丁眉题（全大写 Cormorant） */
  latin?: string
  subtitle?: string
  /** 单字图标（如「宝」「藏」），不传则不显示 */
  glyph?: string
  /** 字场词池 */
  pool: string[]
  glyphCount?: number
  /** 高度控制，默认 38vh */
  minH?: string
  /** 追加在副题下方的内容（如每日时令的今日干支大字） */
  children?: ReactNode
}

/** 内页统一深色 PageHero：面包屑 + 单字图标 + 字级入场标题 + 字场 */
export default function PageHero({
  breadcrumb,
  title,
  latin,
  subtitle,
  glyph,
  pool,
  glyphCount = 26,
  minH = 'min-h-[24vh] sm:min-h-[30vh] lg:min-h-[38vh]',
  children,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden bg-deep px-4 py-16 text-center sm:px-6 sm:py-20',
        minH,
      )}
    >
      <GlyphField pool={pool} count={glyphCount} />

      <div className="relative flex flex-col items-center">
        {/* 面包屑 */}
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center gap-2 font-sans text-[12px] tracking-[0.18em] text-silkmuted"
          aria-label="breadcrumb"
        >
          <Link to="/" className="transition-colors hover:text-goldbright">
            首页
          </Link>
          <span className="text-silkmuted/50">/</span>
          <span className="text-goldbright">{breadcrumb}</span>
        </motion.nav>

        {/* 单字图标 */}
        {glyph && (
          <motion.div
            initial={{ scale: 1.15, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="mt-7 flex h-16 w-16 items-center justify-center rounded-xl border border-gold/40 font-serif text-[30px] font-black text-goldbright"
          >
            {glyph}
          </motion.div>
        )}

        {latin && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 font-latin text-[12px] font-medium uppercase tracking-[0.38em] text-gold"
          >
            {latin}
          </motion.p>
        )}

        {/* 字级入场标题 */}
        <motion.h1
          variants={charContainer}
          initial="hidden"
          animate="show"
          className="mt-3 font-serif text-[clamp(30px,8vw,56px)] font-bold tracking-[0.06em] text-silktext sm:tracking-[0.08em]"
        >
          {Array.from(title).map((ch, i) => (
            <motion.span key={i} variants={charItem} className="inline-block will-change-transform">
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          className="zf-hairline mt-6"
        />

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease: 'easeOut' }}
            className="mt-5 max-w-lg text-[14px] leading-[1.95] text-silkmuted"
          >
            {subtitle}
          </motion.p>
        )}

        {children}
      </div>
    </section>
  )
}
