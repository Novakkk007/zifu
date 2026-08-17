import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/anim'
import { setPageMeta } from '@/lib/pageMeta'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import { GoldButton, GhostButton, TagPill } from '@/components/Buttons'
import TriRingDiagram from '@/components/hecan/TriRingDiagram'
import ConfidenceBadge from '@/components/hecan/ConfidenceBadge'
import type { ConfidenceTier } from '@/components/hecan/ConfidenceBadge'
import HecanForm from '@/components/hecan/HecanForm'

/* ---------- S2 三小竖卡 ---------- */
const SHI_WEI_TIAN = [
  { glyph: '时', note: '四柱干支 · 推五行旺衰' },
  { glyph: '位', note: '十二宫星曜 · 论人事禀赋' },
  { glyph: '天', note: '日月五星 · 校先天之根' },
]

/* ---------- S3 信度三级 ---------- */
const TIERS: { tier: ConfidenceTier; name: string; desc: string }[] = [
  { tier: 'triple', name: '三盘共证', desc: '三术同指一事，结论加重标注，可重点参看' },
  { tier: 'double', name: '两盘互参', desc: '两术相合、一术未及，结论平实陈述' },
  { tier: 'single', name: '单盘孤证', desc: '仅一术所见，明言存疑，供参考不供决断' },
]

/* ---------- S4 合参流程 ---------- */
const STEPS = [
  { n: '一', title: '录生辰', desc: '填写出生年月日时与性别，阳历农历皆可。' },
  { n: '二', title: '起三盘', desc: '同时排出八字四柱、紫微十二宫、七政星宿三盘。' },
  { n: '三', title: '互印证', desc: '三盘结论逐条比对，标定共证 / 互参 / 孤证。' },
  { n: '四', title: '成合参', desc: '输出信度分层的整合报告，句句标注古籍出处。' },
]

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** 「先看示例」→ 报告区；尚无报告则先到表单区 */
function scrollToReport() {
  const target = document.getElementById('hecan-report') ?? document.getElementById('hecan-form')
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Hecan() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPageMeta(
      '三术合参 · 紫府 — 八字 × 紫微 × 七政三盘互证',
      '紫府三术合参——八字、紫微斗数、七政四余三盘并置互证，锚定公版典籍原文，法度分明。',
    );
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ---- Hero 载入序列 ---- */
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(
        '.tri-ring',
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, stagger: 0.15 },
        0,
      )
        .fromTo(
          '.hc-hero-char',
          { y: 30, opacity: 0, filter: 'blur(8px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.08 },
          0.5,
        )
        .fromTo(
          '.hc-hero-line',
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.1 },
          0.9,
        )

      /* ---- 区块标题字级入场 ---- */
      gsap.utils.toArray<HTMLElement>('.gs-chars').forEach((el) => {
        const text = el.textContent ?? ''
        el.textContent = ''
        const chars = Array.from(text).map((ch) => {
          const s = document.createElement('span')
          s.className = 'gs-char inline-block will-change-transform'
          s.textContent = ch === ' ' ? ' ' : ch
          el.appendChild(s)
          return s
        })
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

      /* ---- S3 徽章入场 ---- */
      gsap.fromTo(
        '.hc-tier-badge',
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: 'back.out(1.7)',
          scrollTrigger: { trigger: '.hc-tiers', start: 'top 80%', once: true },
        },
      )

      /* ---- S4 流程：虚线描画 + 节点弹入 ---- */
      gsap.fromTo(
        '.hc-flow-line',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: 'power2.inOut',
          transformOrigin: 'left center',
          scrollTrigger: { trigger: '.hc-flow', start: 'top 80%', once: true },
        },
      )
      gsap.fromTo(
        '.hc-flow-node',
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: 'back.out(1.8)',
          scrollTrigger: { trigger: '.hc-flow', start: 'top 80%', once: true },
        },
      )
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef}>
      {/* 页内 keyframes：三环恒转 + 徽章 hover 缓转 */}
      <style>{`
        @keyframes hc-ring-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .group:hover .hc-badge-glyph { animation: hc-ring-spin 8s linear infinite; }
      `}</style>

      {/* ===== S1 · Hero（深色，三盘环图） ===== */}
      <section className="relative flex min-h-[70dvh] items-center justify-center overflow-hidden bg-deep py-24">
        <FloatingGlyphs count={36} onDeep />
        {/* 三盘环图：55% 透明度背景 */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.55]">
          <TriRingDiagram />
        </div>
        <div className="relative z-10 flex max-w-3xl flex-col items-center px-6 text-center">
          <p className="hc-hero-line font-latin text-[12px] font-medium uppercase tracking-[0.38em] text-gold">
            Flagship · Tri-Verification
          </p>
          <h1 className="mt-5 font-serif text-[clamp(40px,7vw,72px)] font-black leading-tight tracking-[0.14em]">
            {'三术合参'.split('').map((ch) => (
              <span
                key={ch}
                className="hc-hero-char inline-block bg-gradient-to-br from-goldbright to-gold bg-clip-text text-transparent will-change-transform"
              >
                {ch}
              </span>
            ))}
          </h1>
          <p className="hc-hero-line mt-5 font-serif text-[18px] font-semibold tracking-[0.08em] text-silktext">
            八字 × 紫微 × 七政 —— 三盘互证，方敢落笔
          </p>
          <div className="hc-hero-line mt-5 space-y-1.5 text-[15px] font-light leading-[1.95] text-silkmuted">
            <p>一术之言或有偏，三术同指方可信。紫府将三条独立推演的脉络彼此印证，</p>
            <p>相合者加重，相悖者存疑——信度分层，写在每一句结论之前。</p>
          </div>
          <div className="hc-hero-line mt-8 flex flex-wrap items-center justify-center gap-4">
            <GoldButton className="animate-gold-breathe" onClick={() => scrollToId('hecan-form')}>
              开始合参
            </GoldButton>
            <GhostButton onClick={scrollToReport}>先看示例</GhostButton>
          </div>
          <div className="hc-hero-line mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <TagPill variant="flagship" />
            <TagPill variant="overview" />
            <span className="text-[12px] tracking-[0.1em] text-silkmuted">详参 36 灵签 / 次</span>
          </div>
        </div>
      </section>

      {/* 深 → 浅 过渡带 */}
      <div className="zf-fade-to-silk h-[180px]" />

      {/* ===== S2 · 何为合参（浅色） ===== */}
      <section className="bg-silk py-28">
        <div className="zf-container grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Why Three Lineages"
              title="为什么是三条脉络"
            />
            <div className="mt-8 space-y-5 text-[15px] leading-[1.95] text-inkmuted">
              <p className="gs-reveal">
                <strong className="font-serif text-inktext">八字</strong>
                看时——四柱干支推五行旺衰，定格局与岁运起伏，其长在『时序』。
              </p>
              <p className="gs-reveal">
                <strong className="font-serif text-inktext">紫微</strong>
                看位——十二宫安星曜，论人事十二面向的禀赋与际遇，其长在『结构』。
              </p>
              <p className="gs-reveal">
                <strong className="font-serif text-inktext">七政</strong>
                看天——日月五星躔于二十八宿，以天星实测校先天之根，其长在『本源』。
              </p>
              <p className="gs-reveal pt-2 font-serif text-[17px] font-semibold tracking-[0.06em] text-golddim">
                时、位、天三者互证，参详方有底气。
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {SHI_WEI_TIAN.map((c) => (
              <div
                key={c.glyph}
                className="gs-reveal flex flex-col items-center rounded-xl border border-golddim/25 bg-silk2 px-3 py-10 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-card"
              >
                <span className="font-serif text-[64px] font-black leading-none text-gold">
                  {c.glyph}
                </span>
                <span className="mt-5 text-[11.5px] leading-[1.8] tracking-[0.06em] text-inkmuted">
                  {c.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 浅 → 深 过渡带（silk → deep-2） */}
      <div
        className="h-[180px]"
        style={{
          background: 'linear-gradient(to bottom, rgb(var(--silk)), rgb(var(--deep-2)))',
        }}
      />

      {/* ===== S3 · 信度分级（深色） ===== */}
      <section className="bg-deep2 py-28">
        <div className="zf-container">
          <SectionHeading
            dark
            eyebrow="Confidence Tiers"
            title="信度三级 · 写在结论之前"
          />
          <div className="hc-tiers mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {TIERS.map((t) => (
              <div
                key={t.tier}
                className="gs-reveal group flex flex-col items-center rounded-xl border border-gold/10 bg-deep px-7 py-10 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-card"
              >
                <span className="hc-tier-badge inline-flex">
                  <ConfidenceBadge tier={t.tier} size={64} glyphOnly />
                </span>
                <h3 className="mt-6 font-serif text-[20px] font-bold tracking-[0.12em] text-silktext">
                  {t.name}
                </h3>
                <p className="mt-3 text-[13.5px] leading-[1.9] text-silkmuted">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="gs-reveal mt-10 text-center text-[12.5px] tracking-[0.08em] text-silkmuted">
            凡孤证之语，紫府必加『存疑』小印——克制，是对古籍的敬意。
          </p>
          <QuoteStrip
            className="gs-reveal mx-auto mt-12 max-w-3xl"
            book="三命通会"
            quote="夫命禀于有生之初，非今可易；夫妇之为穷通，亦各有时。"
            source="明 · 万民英"
          />
        </div>
      </section>

      {/* 深 → 浅 过渡带 */}
      <div className="zf-fade-to-silk h-[180px]" />

      {/* ===== S4 · 合参流程（浅色，四步时间线） ===== */}
      <section id="hecan-flow" className="scroll-mt-16 bg-silk py-28">
        <div className="zf-container">
          <SectionHeading eyebrow="The Process" title="四步成合参" />
          <div className="hc-flow relative mt-16">
            {/* 金色虚线（desktop） */}
            <div className="hc-flow-line absolute left-[12%] right-[12%] top-7 hidden border-t border-dashed border-gold/50 md:block" />
            <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-5">
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative flex flex-col items-center text-center">
                  <span className="hc-flow-node relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 bg-silk font-serif text-[20px] font-bold text-golddim">
                    {s.n}
                  </span>
                  {/* mobile 纵向虚线 */}
                  {i < STEPS.length - 1 && (
                    <span className="mt-3 h-8 border-l border-dashed border-gold/40 md:hidden" />
                  )}
                  <h3 className="mt-5 font-serif text-[19px] font-bold tracking-[0.14em] text-inktext">
                    {s.title}
                  </h3>
                  <p className="mt-2.5 max-w-[240px] text-[13.5px] leading-[1.9] text-inkmuted">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 浅 → 深 过渡带 */}
      <div className="zf-fade-to-deep h-[200px]" />

      {/* ===== S5 · 合参表单 + 示例报告（深色） ===== */}
      <section id="hecan-form" className="scroll-mt-16 bg-deep py-28">
        <div className="zf-container">
          <SectionHeading
            dark
            eyebrow="Begin Synthesis"
            title="起三盘 · 成合参"
            sub="录入生辰，三盘并起；概览免费，信度逐句标明。"
          />
          <div className="mt-14">
            <HecanForm />
          </div>
        </div>
      </section>
    </div>
  )
}
