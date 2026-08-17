import { Link } from 'react-router'
import { motion } from 'framer-motion'
import GlyphField from '@/components/bazi/GlyphField'

type PageHeroProps = {
  /** 单字图标，如「命」「缘」 */
  glyph: string
  title: string
  sub: string
  /** 字场词池 */
  pool: string[]
  current: string
}

/**
 * 功能页统一 PageHero（深色，约 38vh）：
 * breadcrumb + 单字金环图标 + H1 字级入场 + 副题 + 漂浮字场。
 */
export default function PageHero({ glyph, title, sub, pool, current }: PageHeroProps) {
  return (
    <section className="relative flex min-h-[24vh] flex-col overflow-hidden bg-deep sm:min-h-[30vh] lg:min-h-[38vh]">
      <GlyphField pool={pool} count={24} />

      {/* breadcrumb */}
      <motion.nav
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="zf-container relative z-10 pt-6 text-[12px] tracking-[0.1em] text-silkmuted"
      >
        <Link to="/" className="transition-colors hover:text-goldbright">
          首页
        </Link>
        <span className="mx-2 text-silkmuted/50">/</span>
        <span>术数推演</span>
        <span className="mx-2 text-silkmuted/50">/</span>
        <span className="text-goldbright">{current}</span>
      </motion.nav>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 text-center sm:px-6 sm:py-14">
        <motion.div
          initial={{ scale: 1.3, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 font-serif text-[30px] font-black text-goldbright sm:h-24 sm:w-24 sm:text-[56px]"
        >
          {glyph}
        </motion.div>

        <h1 className="mt-4 font-serif text-[clamp(24px,7vw,56px)] font-bold leading-tight tracking-[0.06em] text-silktext sm:mt-7 sm:text-[clamp(30px,8vw,56px)] sm:tracking-[0.08em]">
          {Array.from(title).map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block will-change-transform"
              initial={{ y: 26, opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.25 + i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6, ease: 'easeOut' }}
          className="mt-3 hidden max-w-xl text-[15px] leading-[1.9] text-silktext/80 sm:block"
        >
          {sub}
        </motion.p>
      </div>
    </section>
  )
}
