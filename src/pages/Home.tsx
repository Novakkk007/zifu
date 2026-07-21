import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap, ScrollTrigger } from '@/lib/anim'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import SectionHeading from '@/components/SectionHeading'
import FeatureCard from '@/components/FeatureCard'
import SiweiDemo from '@/components/SiweiDemo'
import { GhostButton, GoldButton } from '@/components/Buttons'

const BOOKS = [
  '周易', '滴天髓', '三命通会', '子平真诠', '穷通宝鉴', '渊海子平',
  '紫微斗数全书', '果老星宗', '增删卜易', '卜筮正宗', '六壬大全', '烟波钓叟歌',
]

const STATS = [
  { n: 11, label: '大推演模块' },
  { n: 4, label: '维交互模式' },
  { n: 36, label: '注册即赠灵签' },
  { n: 0, label: '月费订阅' },
]

const FEATURES: {
  glyph: string
  title: string
  desc: string
  to: string
  tag?: 'free' | 'flagship' | 'overview'
  flagship?: boolean
}[] = [
  { glyph: '参', title: '三术合参', desc: '八字 × 紫微 × 七政三盘互证，信度分层的旗舰整合参详', to: '/hecan', tag: 'overview', flagship: true },
  { glyph: '命', title: '八字排盘', desc: '录入生辰，依古法起四柱、排大运流年', to: '/bazi', tag: 'free' },
  { glyph: '批', title: '八字详批', desc: '锚定古籍原文，AI 逐柱逐句引经深参', to: '/bazi' },
  { glyph: '缘', title: '八字合盘', desc: '双盘并置对照，参看五行互补与缘分深浅', to: '/bazi/hepan', tag: 'free' },
  { glyph: '卦', title: '六爻起卦', desc: '铜钱摇卦，依《增删卜易》《卜筮正宗》断卦', to: '/liuyao', tag: 'free' },
  { glyph: '紫', title: '紫微斗数', desc: '十二宫安星，观主星四化与大限流年', to: '/ziwei', tag: 'free' },
  { glyph: '星', title: '七政四余', desc: '果老星宗恒星制，以二十八宿推先天禀赋', to: '/qizheng', tag: 'free' },
  { glyph: '奇', title: '奇门遁甲', desc: '随时起局、锚定用神，依古籍推演策略', to: '/qimen', tag: 'free' },
  { glyph: '壬', title: '大六壬', desc: '月将加时成课，三传定事之始中末', to: '/daliuren', tag: 'free' },
  { glyph: '辰', title: '每日时令', desc: '合本命与节气，查当日干支与宜忌', to: '/daily', tag: 'free' },
  { glyph: '宝', title: '百宝袋', desc: '寻时定盘 · 随身小工具集，陆续上新', to: '/toolkit', tag: 'free' },
]

/** 将纯文本标题拆成单字 span（供字级入场动画） */
function splitChars(el: HTMLElement) {
  const text = el.textContent ?? ''
  el.textContent = ''
  const frag = document.createDocumentFragment()
  for (const ch of text) {
    const s = document.createElement('span')
    s.className = 'gs-char inline-block will-change-transform'
    s.textContent = ch === ' ' ? ' ' : ch
    frag.appendChild(s)
  }
  el.appendChild(frag)
}

/** 预拆分单字（用于含内联样式的标题，跳过 splitChars） */
function Chars({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span key={i} className={`gs-char inline-block will-change-transform ${className ?? ''}`}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </>
  )
}

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const heroFieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ---- 字级拆分（≤10 字标题） ---- */
      gsap.utils.toArray<HTMLElement>('.gs-chars').forEach((el) => {
        if (el.dataset.split !== 'done') {
          splitChars(el)
          el.dataset.split = 'done'
        }
        const chars = el.querySelectorAll('.gs-char')
        gsap.fromTo(
          chars,
          { y: 26, opacity: 0, filter: 'blur(6px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.8,
            stagger: 0.05,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 82%', once: true },
          },
        )
      })

      /* ---- 块级入场 ---- */
      ScrollTrigger.batch('.gs-reveal', {
        start: 'top 85%',
        once: true,
        onEnter: (batch) =>
          gsap.fromTo(
            batch,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out' },
          ),
      })

      /* ---- 数字 count-up ---- */
      gsap.utils.toArray<HTMLElement>('.gs-count').forEach((el, i) => {
        const target = Number(el.dataset.count ?? '0')
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          delay: i * 0.15,
          ease: 'power1.out',
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v))
          },
          scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        })
      })
      gsap.fromTo(
        '.gs-count-label',
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          delay: 0.4,
          stagger: 0.15,
          scrollTrigger: { trigger: '.gs-stats', start: 'top 80%', once: true },
        },
      )

      /* ---- 跑马灯入场 ---- */
      gsap.fromTo(
        '.gs-marquee',
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.9,
          scrollTrigger: { trigger: '.gs-marquee', start: 'top 90%', once: true },
        },
      )

      /* ---- 注册 CTA 按钮 ---- */
      gsap.fromTo(
        '.gs-cta-btn',
        { scale: 0.94, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: 'back.out(1.6)',
          scrollTrigger: { trigger: '.gs-cta-btn', start: 'top 85%', once: true },
        },
      )

      /* ---- PWA 图标入场 ---- */
      gsap.fromTo(
        '.gs-app-icon',
        { scale: 0.8, rotate: -6, opacity: 0 },
        {
          scale: 1,
          rotate: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'back.out(1.7)',
          scrollTrigger: { trigger: '.gs-app-icon', start: 'top 85%', once: true },
        },
      )

      /* ---- Hero 载入序列 ---- */
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(heroFieldRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0)
        .fromTo(
          '.hero-zi',
          { scale: 1.25, opacity: 0, filter: 'blur(14px)' },
          { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.9 },
          0.1,
        )
        .fromTo(
          '.hero-fu',
          { scale: 1.25, opacity: 0, filter: 'blur(14px)' },
          { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.9 },
          0.35,
        )
        .fromTo(
          '.hero-latin',
          { opacity: 0, letterSpacing: '1.2em' },
          { opacity: 1, letterSpacing: '0.6em', duration: 0.8 },
          0.6,
        )
        .fromTo(
          '.hero-line',
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.12 },
          0.7,
        )
        .fromTo(
          '.hero-cta',
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
          1.1,
        )

      /* ---- Hero 滚动：字场视差 0.15 + 巨字上移淡出 ---- */
      gsap.to(heroFieldRef.current, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
      gsap.to('.hero-brand', {
        y: -60,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '60% top',
          scrub: true,
        },
      })
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef}>
      {/* ===== S2 · Hero ===== */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100dvh] flex-col overflow-hidden"
        style={{
          background:
            'linear-gradient(to bottom, rgb(var(--silk)) 0%, rgb(var(--silk)) calc(55% - 110px), rgb(var(--deep)) calc(55% + 110px), rgb(var(--deep)) 100%)',
        }}
      >
        {/* 漂浮字场（浅区更淡 / 深区稍亮），外层做 0.15 视差 */}
        <div ref={heroFieldRef} className="absolute inset-[-10%] opacity-0">
          <FloatingGlyphs count={20} onDeep={false} className="bottom-[42%]" />
          <FloatingGlyphs count={28} onDeep className="top-[46%]" />
        </div>

        {/* 品牌水印 */}
        <img
          src="/assets/logo.png"
          alt=""
          aria-hidden
          className="animate-spin-slow pointer-events-none absolute -bottom-10 -right-10 w-[320px] opacity-[0.07]"
        />

        {/* 品牌区：底部对齐至视口 62%，骑跨米白与墨青交界 */}
        <div className="hero-brand absolute inset-x-0 top-[62%] flex -translate-y-full flex-col items-center px-6 text-center">
          <h1 className="flex items-baseline font-serif text-[clamp(110px,20vw,220px)] font-black leading-[1.05]">
            <span className="hero-zi inline-block text-deep will-change-transform">紫</span>
            <span className="hero-fu inline-block text-goldbright will-change-transform">府</span>
          </h1>
          <p className="hero-latin mt-2 font-latin text-[13px] font-medium uppercase text-silkmuted">
            Zifu Palace
          </p>
          <div className="hero-line mt-7 flex items-center gap-4">
            <span className="h-px w-10 bg-gold/40" />
            <span className="font-serif text-[16px] font-semibold tracking-[0.3em] text-goldbright">
              古籍为根 · AI 参详
            </span>
            <span className="h-px w-10 bg-gold/40" />
          </div>
          <p className="hero-line mt-5 font-sans text-[15.5px] font-light leading-[1.95] text-silktext">
            以《周易》《滴天髓》《三命通会》等典籍原文为基
            <br />
            AI 逐句引经参详，克制而专业；按次付费，无需订阅
          </p>
          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
            <span className="hero-cta inline-block">
              <GoldButton to="/bazi">开始排盘</GoldButton>
            </span>
            <span className="hero-cta inline-block">
              <GhostButton to="/liuyao">六爻起卦</GhostButton>
            </span>
          </div>
        </div>

        {/* 底部滚动提示 */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5">
          <span className="animate-float-hint block h-10 w-px origin-top bg-gold/60" />
          <span className="text-[12px] tracking-[0.24em] text-silkmuted">向下参看</span>
        </div>
      </section>

      {/* ===== S3 · 古籍跑马灯 ===== */}
      <section className="gs-marquee border-y border-[rgba(199,162,58,0.18)] bg-deep py-8">
        <p className="text-center font-serif text-[15px] font-semibold tracking-[0.24em] text-goldbright">
          典籍为据 · 句句可溯
        </p>
        <div className="zf-marquee mt-5 overflow-hidden">
          <div className="zf-marquee-track flex w-max items-center whitespace-nowrap">
            {[0, 1].map((dup) => (
              <div key={dup} aria-hidden={dup === 1} className="flex items-center">
                {BOOKS.map((b) => (
                  <span key={`${dup}-${b}`} className="flex items-center">
                    <span className="px-5 font-serif text-[17px] text-golddim">《{b}》</span>
                    <span className="text-silkmuted">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== S4 · 数据带 ===== */}
      <section className="gs-stats bg-deep pb-20 pt-16">
        <div className="zf-container grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={
                i > 0
                  ? 'flex flex-col items-center lg:border-l lg:border-[rgba(199,162,58,0.18)]'
                  : 'flex flex-col items-center'
              }
            >
              <span
                className="gs-count font-serif text-[56px] font-black leading-none text-goldbright"
                data-count={s.n}
              >
                0
              </span>
              <span className="gs-count-label mt-3 text-[13px] tracking-[0.2em] text-silkmuted">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== S5 · 核心功能矩阵 ===== */}
      <section className="bg-deep2 py-32">
        <div className="zf-container">
          <SectionHeading
            dark
            eyebrow="Eleven Modules"
            title="核心功能"
            sub="每一句参详都锚定古籍原文——可溯源、不空谈、千人千面"
          />
          <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.glyph} dark {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* 深 → 浅 过渡带 */}
      <div className="zf-fade-to-silk h-[180px]" />

      {/* ===== S6 · 四维交互演示 ===== */}
      <section className="relative bg-silk py-32">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative mx-auto w-full max-w-[860px] px-6 md:px-10">
          <SectionHeading
            title="四 维 交 互"
            sub={
              <>
                <span className="block font-serif text-[18px] font-semibold tracking-[0.14em] text-golddim">
                  两种人格 × 两种深度
                </span>
                <span className="mt-2 block text-[14px] text-inkmuted">
                  同一张盘，两种讲法——点下方按钮，现场感受
                </span>
              </>
            }
          />
          <div className="mt-14">
            <SiweiDemo />
          </div>
          <div className="gs-reveal mt-10 text-center">
            <Link
              to="/bazi"
              className="zf-link-more text-[15px] font-medium tracking-[0.1em] text-golddim"
            >
              免费排一张自己的盘试试 <span className="zf-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== S7 · 注册 CTA ===== */}
      <section className="relative bg-silk py-24">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative zf-container flex flex-col items-center text-center">
          <h2
            data-split="done"
            className="gs-chars font-serif text-[clamp(26px,3.6vw,42px)] font-bold leading-snug tracking-[0.12em] text-inktext"
          >
            <Chars text="注册即赠" />
            <Chars
              text="36"
              className="mx-1 align-baseline font-serif text-[1.4em] font-black text-golddim"
            />
            <Chars text="灵签" />
          </h2>
          <p className="gs-reveal mt-4 text-[14px] tracking-[0.08em] text-inkmuted">
            按次计费，无订阅；充值额外赠 15%
          </p>
          <div className="gs-cta-btn mt-10">
            <GoldButton
              to="/auth"
              className="animate-gold-breathe px-12 py-4 text-[16px]"
            >
              免费注册
            </GoldButton>
          </div>
        </div>
      </section>

      {/* 浅 → 深 过渡带 */}
      <div className="zf-fade-to-deep h-[200px]" />

      {/* ===== S8 · PWA 引导 ===== */}
      <section className="relative overflow-hidden bg-deep py-28">
        <FloatingGlyphs count={24} onDeep />
        <div className="relative mx-auto flex w-full max-w-[640px] flex-col items-center px-6 text-center">
          <div className="gs-app-icon">
            <img
              src="/assets/app-icon.png"
              alt="紫府 App 图标"
              className="animate-icon-sway h-24 w-24 rounded-[22%] border border-gold/50 shadow-[0_0_40px_-6px_rgba(199,162,58,0.45)]"
            />
          </div>
          <h2
            data-split="done"
            className="gs-chars mt-8 font-serif text-[clamp(26px,3.6vw,42px)] font-bold leading-snug tracking-[0.12em] text-silktext"
          >
            <Chars text="随身携带你的" />
            <Chars text="紫府" className="text-goldbright" />
          </h2>
          <p className="gs-reveal mt-5 text-[14.5px] leading-[1.95] text-silktext/85">
            添加到手机桌面，像原生 App 一样随时打开
            <br />
            无需下载，无需应用商店，一键直达
          </p>
          <p className="gs-reveal mt-6 text-[12.5px] tracking-[0.1em] text-silkmuted">
            使用手机浏览器访问本页，即可添加到桌面
          </p>
        </div>
      </section>
    </div>
  )
}
