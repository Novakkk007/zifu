import FloatingGlyphs from '@/components/FloatingGlyphs'

type PlaceholderProps = {
  glyph: string
  title: string
  latin: string
  desc: string
}

/** 子页面占位（由对应 page agent 实现完整页面后替换） */
export default function Placeholder({ glyph, title, latin, desc }: PlaceholderProps) {
  return (
    <section className="relative flex min-h-[70dvh] flex-col items-center justify-center overflow-hidden bg-deep px-6 py-24 text-center">
      <FloatingGlyphs count={28} onDeep />
      <div className="relative flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gold/40 font-serif text-[30px] font-black text-goldbright">
          {glyph}
        </div>
        <p className="mt-6 font-latin text-[12px] font-medium uppercase tracking-[0.38em] text-gold">
          {latin}
        </p>
        <h1 className="mt-3 font-serif text-[clamp(34px,5vw,56px)] font-bold tracking-[0.08em] text-silktext">
          {title}
        </h1>
        <div className="zf-hairline mt-6" />
        <p className="mt-6 max-w-md text-[14px] leading-[1.95] text-silkmuted">{desc}</p>
        <p className="mt-8 text-[12.5px] tracking-[0.2em] text-silkmuted/60">
          此页营造中 · 敬请期待
        </p>
      </div>
    </section>
  )
}
