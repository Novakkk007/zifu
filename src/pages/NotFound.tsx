import { Link } from 'react-router'
import FloatingGlyphs from '@/components/FloatingGlyphs'

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80dvh] flex-col items-center justify-center overflow-hidden bg-deep3 px-6 text-center">
      <FloatingGlyphs count={30} onDeep />
      <div className="relative flex flex-col items-center">
        <h1 className="font-serif text-[clamp(72px,14vw,140px)] font-black leading-none text-goldbright">
          迷途
        </h1>
        <p className="mt-4 font-latin text-[12px] font-medium uppercase tracking-[0.38em] text-gold">
          Page Not Found
        </p>
        <p className="mt-6 text-[14px] text-silkmuted">
          此处暂无星图指引，不妨回到紫府正门。
        </p>
        <Link
          to="/"
          className="zf-btn mt-10 rounded-full border border-gold/60 px-8 py-3 font-sans text-[14px] font-medium tracking-[0.14em] text-goldbright hover:bg-gold/10"
        >
          返回首页
        </Link>
      </div>
    </section>
  )
}
