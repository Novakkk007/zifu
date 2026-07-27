import { Link } from 'react-router'
import { motion } from 'framer-motion'
import GlyphField from '@/components/sanshi/GlyphField'

type PageHeroProps = {
  glyph: string
  title: string
  latin: string
  subtitle: string
  /** 末级面包屑（当前页名） */
  crumb: string
  /** 字场词池 */
  pool: string[]
}

/** 功能页统一深色 Hero（38vh）：面包屑 + 单字图标 + H1 + 副题 + 漂浮字场 */
export default function PageHero({ glyph, title, latin, subtitle, crumb, pool }: PageHeroProps) {
  return (
    <section className="relative flex min-h-[38dvh] flex-col items-center justify-center overflow-hidden bg-deep px-6 py-20 text-center">
      <GlyphField pool={pool} count={36} />
      <div className="relative flex flex-col items-center">
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center gap-2 font-sans text-[12px] tracking-[0.14em] text-silkmuted"
        >
          <Link to="/" className="transition-colors hover:text-goldbright">
            首页
          </Link>
          <span className="text-silkmuted/50">/</span>
          <span>术数推演</span>
          <span className="text-silkmuted/50">/</span>
          <span className="text-goldbright">{crumb}</span>
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="mt-7 flex h-16 w-16 items-center justify-center rounded-xl border border-gold/40 font-serif text-[30px] font-black text-goldbright"
        >
          {glyph}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-5 font-latin text-[12px] font-medium uppercase tracking-[0.38em] text-gold"
        >
          {latin}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32, ease: 'easeOut' }}
          className="mt-3 font-serif text-[clamp(34px,5vw,56px)] font-bold tracking-[0.08em] text-silktext"
        >
          {title}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.44 }}
          className="zf-hairline mt-6"
        />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.52, ease: 'easeOut' }}
          className="mt-6 max-w-xl text-[14px] leading-[1.95] text-silkmuted"
        >
          {subtitle}
        </motion.p>
      </div>
    </section>
  )
}
