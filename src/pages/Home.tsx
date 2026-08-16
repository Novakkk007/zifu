import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { gsap, ScrollTrigger } from "@/lib/anim";
import FloatingGlyphs from "@/components/FloatingGlyphs";
import SectionHeading from "@/components/SectionHeading";
import FeatureCard from "@/components/FeatureCard";
import SiweiDemo from "@/components/SiweiDemo";
import { GhostButton, GoldButton } from "@/components/Buttons";
import BrandLogo from "@/components/BrandLogo";
import { usePaymentEnabled } from "@/hooks/usePaymentEnabled";

const BOOKS = [
  "周易",
  "滴天髓",
  "三命通会",
  "子平真诠",
  "穷通宝鉴",
  "渊海子平",
  "紫微斗数全书",
  "果老星宗",
  "增删卜易",
  "卜筮正宗",
  "六壬大全",
  "烟波钓叟歌",
];

/** 信任锚点（为什么信紫府） */
const TRUST_ANCHORS = [
  {
    title: '历法 · 精确到秒',
    desc: '节气交节时刻采用天文历双源金标对拍，跨时区换算，经得起核验。',
  },
  {
    title: '引文 · 句句可溯',
    desc: '参详引文全部来自公版古籍原文，每条标注出处，不编造不私藏。',
  },
  {
    title: '规则 · 权重公开',
    desc: '旺衰量化、神煞取格等规则权重全部公开，可复核可版本化。',
  },
  {
    title: '关怀 · 不吓不敛',
    desc: '不做灾祸恐吓，不承诺转运。解读以建设性收尾，痛苦时引导专业求助。',
  },
];

type HomeEntry = {
  glyph: string;
  title: string;
  desc: string;
  to: string;
  tag?: "free" | "flagship" | "overview";
  flagship?: boolean;
};

/** 三才 · 天地人（《易经·说卦》分类框架） */
const THREE_REALMS: {
  glyph: string;
  name: string;
  sub: string;
  desc: string;
  items: { to: string; label: string }[];
}[] = [
  {
    glyph: '☰',
    name: '天 · 时运',
    sub: 'THE HEAVEN · 天时',
    desc: '立天之道曰阴与阳。历法、节气、流年大势，皆属天时——何时做何事，顺时而参。',
    items: [
      { to: '/daily', label: '每日时令' },
      { to: '/daily', label: '安寝时令' },
      { to: '/qimen', label: '奇门时空' },
      { to: '/scenario/wealth', label: '流年运势' },
    ],
  },
  {
    glyph: '☷',
    name: '地 · 空间',
    sub: 'THE EARTH · 地利',
    desc: '立地之道曰柔与刚。方位、宅局、环境布局，皆属地利——居处于何处，安宅而参。',
    items: [
      { to: '/scenario/fengshui', label: '九宫飞星 · 即启' },
      { to: '/scenario/fengshui', label: '安床择吉 · 即启' },
      { to: '/scenario/fengshui', label: '阳宅参详 · 即启' },
    ],
  },
  {
    glyph: '☴',
    name: '人 · 命理',
    sub: 'THE HUMAN · 人和',
    desc: '立人之道曰仁与义。八字、星盘、人事合参，皆属人和——我是谁、我与谁，明己而参。',
    items: [
      { to: '/bazi', label: '八字排盘' },
      { to: '/ziwei', label: '紫微斗数' },
      { to: '/liuyao', label: '六爻起卦' },
      { to: '/daliuren', label: '大六壬' },
      { to: '/bazi/hepan', label: '合盘合参' },
    ],
  },
];

const SCENARIOS: (HomeEntry & { emoji: string; eyebrow: string })[] = [
  {
    glyph: "财",
    emoji: "💰",
    eyebrow: "Career & Wealth",
    title: "事业财富运程",
    desc: "从财官格局与阶段节律入手，参看事业选择与财富趋势。",
    to: "/scenario/wealth",
  },
  {
    glyph: "缘",
    emoji: "💑",
    eyebrow: "Love & Marriage",
    title: "感情婚姻合参",
    desc: "并看双方命盘关系，梳理相处模式、情感倾向与沟通线索。",
    to: "/scenario/love",
  },
  {
    glyph: "寝",
    emoji: "🌙",
    eyebrow: "Sleep & Almanac",
    title: "今晚安寝时令",
    desc: "结合今日干支与节气流转，为今晚作息提供传统时令参考。",
    to: "/daily",
  },
  {
    glyph: "养",
    emoji: "🍃",
    eyebrow: "Health & Wellness",
    title: "健康体质养生",
    desc: "从五行旺衰理解体质倾向，获得适合自己的日常养护提示。",
    to: "/scenario/health",
  },
];

const LEAD_TOOLS: HomeEntry[] = [
  {
    glyph: "辰",
    title: "每日时令",
    desc: "合节气与今日干支，查时令宜忌与日常提示",
    to: "/daily",
    tag: "free",
  },
  {
    glyph: "卦",
    title: "六爻起卦",
    desc: "铜钱摇卦，依《增删卜易》《卜筮正宗》参详",
    to: "/liuyao",
    tag: "free",
  },
  {
    glyph: "奇",
    title: "奇门参详",
    desc: "随时起局、锚定用神，依古籍梳理行动策略",
    to: "/qimen",
    tag: "free",
  },
];

const LEARNING_ENTRIES: HomeEntry[] = [
  {
    glyph: "藏",
    title: "藏经阁",
    desc: "翻阅十二部公版术数典籍，原文节选皆可追溯",
    to: "/wiki",
  },
  {
    glyph: "辞",
    title: "术语词典",
    desc: "从干支、十神到格局，用通识释义理解古典术语",
    to: "/wiki",
  },
  {
    glyph: "法",
    title: "名家方法论",
    desc: "研读名家分析与教学思路，辨明方法、适用范围与边界",
    to: "/talks",
  },
];

const SECONDARY_ENGINES: HomeEntry[] = [
  {
    glyph: "参",
    title: "三术合参",
    desc: "八字 × 紫微 × 七政三盘互证，信度分层的旗舰整合参详",
    to: "/hecan",
    tag: "overview",
    flagship: true,
  },
  {
    glyph: "命",
    title: "八字排盘",
    desc: "录入生辰，依古法起四柱、排大运流年",
    to: "/bazi",
    tag: "free",
  },
  {
    glyph: "批",
    title: "八字详批",
    desc: "锚定古籍原文，AI 逐柱逐句引经深参",
    to: "/bazi",
  },
  {
    glyph: "缘",
    title: "八字合盘",
    desc: "双盘并置对照，参看五行互补与缘分深浅",
    to: "/bazi/hepan",
    tag: "free",
  },
  {
    glyph: "紫",
    title: "紫微斗数",
    desc: "十二宫安星，观主星四化与大限流年",
    to: "/ziwei",
    tag: "free",
  },
  {
    glyph: "星",
    title: "七政四余",
    desc: "果老星宗恒星制，以二十八宿推先天禀赋",
    to: "/qizheng",
    tag: "free",
  },
  {
    glyph: "壬",
    title: "大六壬",
    desc: "月将加时成课，三传定事之始中末",
    to: "/daliuren",
    tag: "free",
  },
  {
    glyph: "宝",
    title: "百宝袋",
    desc: "寻时定盘 · 随身小工具集，陆续上新",
    to: "/toolkit",
    tag: "free",
  },
];

/** 将纯文本标题拆成单字 span（供字级入场动画） */
function splitChars(el: HTMLElement) {
  const text = el.textContent ?? "";
  el.textContent = "";
  const frag = document.createDocumentFragment();
  for (const ch of text) {
    const s = document.createElement("span");
    s.className = "gs-char inline-block will-change-transform";
    s.textContent = ch === " " ? " " : ch;
    frag.appendChild(s);
  }
  el.appendChild(frag);
}

/** 预拆分单字（用于含内联样式的标题，跳过 splitChars） */
function Chars({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          className={`gs-char inline-block will-change-transform ${className ?? ""}`}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroFieldRef = useRef<HTMLDivElement>(null);
  const paymentEnabled = usePaymentEnabled();

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ---- 字级拆分（≤10 字标题） ---- */
      gsap.utils.toArray<HTMLElement>(".gs-chars").forEach(el => {
        if (el.dataset.split !== "done") {
          splitChars(el);
          el.dataset.split = "done";
        }
        const chars = el.querySelectorAll(".gs-char");
        gsap.fromTo(
          chars,
          { y: 26, opacity: 0, filter: "blur(6px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.8,
            stagger: 0.05,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 82%", once: true },
          }
        );
      });

      /* ---- 块级入场 ---- */
      ScrollTrigger.batch(".gs-reveal", {
        start: "top 85%",
        once: true,
        onEnter: batch =>
          gsap.fromTo(
            batch,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              stagger: 0.08,
              ease: "power3.out",
            }
          ),
      });

      /* ---- 跑马灯入场 ---- */
      gsap.fromTo(
        ".gs-marquee",
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.9,
          scrollTrigger: {
            trigger: ".gs-marquee",
            start: "top 90%",
            once: true,
          },
        }
      );

      /* ---- 注册 CTA 按钮 ---- */
      gsap.fromTo(
        ".gs-cta-btn",
        { scale: 0.94, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: "back.out(1.6)",
          scrollTrigger: {
            trigger: ".gs-cta-btn",
            start: "top 85%",
            once: true,
          },
        }
      );

      /* ---- PWA 图标入场 ---- */
      gsap.fromTo(
        ".gs-app-icon",
        { scale: 0.8, rotate: -6, opacity: 0 },
        {
          scale: 1,
          rotate: 0,
          opacity: 1,
          duration: 0.7,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".gs-app-icon",
            start: "top 85%",
            once: true,
          },
        }
      );

      /* ---- Hero 载入序列 ---- */
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        heroFieldRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.2 },
        0
      )
        .fromTo(
          ".hero-mark",
          { scale: 1.18, opacity: 0, filter: "blur(12px)" },
          { scale: 1, opacity: 1, filter: "blur(0px)", duration: 1.0 },
          0.05
        )
        .fromTo(
          ".hero-zi",
          { scale: 1.25, opacity: 0, filter: "blur(14px)" },
          { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.9 },
          0.1
        )
        .fromTo(
          ".hero-fu",
          { scale: 1.25, opacity: 0, filter: "blur(14px)" },
          { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.9 },
          0.35
        )
        .fromTo(
          ".hero-latin",
          { opacity: 0, letterSpacing: "1.2em" },
          { opacity: 1, letterSpacing: "0.6em", duration: 0.8 },
          0.6
        )
        .fromTo(
          ".hero-line",
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.12 },
          0.7
        )
        .fromTo(
          ".hero-cta",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
          1.1
        );

      /* ---- Hero 滚动：字场视差 0.15 + 巨字上移淡出 ---- */
      gsap.to(heroFieldRef.current, {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(".hero-brand", {
        y: -60,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "60% top",
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      {/* ===== S2 · Hero ===== */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100dvh] flex-col overflow-hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgb(var(--deep-2)) 0%, rgb(var(--deep)) 100%)",
        }}
      >
        {/* 金箔纹理叠层（10% 透明，纵向渐隐遮罩） */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "url(/assets/gold-foil.webp)",
            backgroundSize: "512px 512px",
            maskImage:
              "radial-gradient(ellipse 90% 75% at 50% 42%, black 30%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 75% at 50% 42%, black 30%, transparent 78%)",
          }}
        />

        {/* 漂浮字场（深区稍亮），外层做 0.15 视差 */}
        <div ref={heroFieldRef} className="absolute inset-[-10%] opacity-0">
          <FloatingGlyphs count={20} onDeep className="bottom-[42%]" />
          <FloatingGlyphs count={28} onDeep className="top-[46%]" />
        </div>

        {/* 品牌水印 */}
        <BrandLogo
          variant="mark"
          theme="indigo"
          size={320}
          title=""
          aria-hidden
          className="animate-spin-slow pointer-events-none absolute -bottom-10 -right-10 w-[320px] opacity-[0.1]"
        />

        {/* 品牌区：文档流布局，顶部留导航余量（80px），向下自然排列。
            任何窗口高度都不裁剪、不遮挡（原 absolute+bottom 锚定在矮视口
            上沿越界压住导航——版面事故根因） */}
        <div className="hero-brand relative z-10 mt-[80px] flex flex-col items-center px-6 pb-20 text-center">
          <span className="hero-mark inline-block will-change-transform">
            <span className="inline-block sm:hidden">
              <BrandLogo variant="mark" size={64} />
            </span>
            <span className="hidden sm:inline-block">
              <BrandLogo variant="mark" size={132} />
            </span>
          </span>
          <h1 className="mt-3 flex items-baseline font-serif text-[clamp(64px,13vw,148px)] font-black leading-[1.05] sm:mt-5">
            <span className="hero-zi inline-block text-silktext will-change-transform">
              紫
            </span>
            <span className="hero-fu inline-block text-goldbright will-change-transform">
              府
            </span>
          </h1>
          <p className="hero-latin mt-2 font-latin text-[13px] font-medium uppercase text-silkmuted">
            Zifu Palace
          </p>
          <div className="hero-line mt-7 flex items-center gap-4">
            <span className="h-px w-10 bg-gold/40" />
            <span className="font-serif text-[16px] font-semibold tracking-[0.3em] text-goldbright">
              以古人之智 · 照今日之心
            </span>
            <span className="h-px w-10 bg-gold/40" />
          </div>
          <p className="hero-line mt-5 font-sans text-[15.5px] font-light leading-[1.95] text-silktext">
            以《周易》《滴天髓》《三命通会》等典籍原文为基
            <br />
            AI 逐句引经参详，让流传千年的智慧，成为关照自己的方式
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
          <span className="text-[12px] tracking-[0.24em] text-silkmuted">
            向下参看
          </span>
        </div>
      </section>

      {/* ===== S2b · 为什么信紫府（信任锚点） ===== */}
      <section className="bg-silk py-20">
        <div className="zf-container">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            {TRUST_ANCHORS.map((a) => (
              <div key={a.title} className="rounded-xl border border-golddim/20 bg-white/60 p-6 text-center">
                <p className="font-serif text-[15.5px] font-bold tracking-[0.1em] text-inktext">{a.title}</p>
                <p className="mt-2.5 text-[12.5px] leading-[1.85] text-inkmuted">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== S3 · 场景入口 ===== */}
      <section className="relative overflow-hidden bg-deep2 py-24 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "url(/assets/gold-foil.webp)",
            backgroundSize: "512px 512px",
          }}
        />
        <div className="relative zf-container">
          <SectionHeading
            dark
            eyebrow="Four Life Scenarios"
            title="此刻，你想参看什么"
            sub="从当下最关心的事出发，进入相应的传统文化参详场景"
          />
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            {SCENARIOS.map(scenario => (
              <Link
                key={scenario.to}
                to={scenario.to}
                className="gs-reveal group relative min-h-[230px] overflow-hidden rounded-2xl border border-gold/35 bg-deep p-7 transition-all duration-500 hover:-translate-y-1 hover:border-gold/80 hover:shadow-[0_20px_55px_-28px_rgba(228,198,106,0.65)] sm:p-9"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at 100% 0%, rgb(var(--gold) / 0.22), transparent 48%), linear-gradient(135deg, transparent 30%, rgb(var(--gold) / 0.08))",
                  }}
                />
                <span className="absolute right-5 top-3 select-none text-[70px] opacity-[0.09] grayscale transition-all duration-500 group-hover:scale-110 group-hover:opacity-20 group-hover:grayscale-0 sm:right-8 sm:text-[92px]">
                  {scenario.emoji}
                </span>
                <div className="relative flex h-full flex-col items-start">
                  <p className="font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                    {scenario.eyebrow}
                  </p>
                  <div className="mt-7 flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gold/45 font-serif text-[23px] font-black text-goldbright">
                      {scenario.glyph}
                    </span>
                    <h2 className="font-serif text-[clamp(24px,3vw,34px)] font-bold tracking-[0.08em] text-silktext">
                      {scenario.title}
                    </h2>
                  </div>
                  <p className="mt-5 max-w-xl text-[14px] leading-[1.9] text-silkmuted">
                    {scenario.desc}
                  </p>
                  <span className="zf-link-more mt-6 inline-flex items-center gap-1 text-[13px] font-medium tracking-[0.12em] text-goldbright">
                    进入参详 <span className="zf-arrow">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== S3b · 三才 · 天地人 ===== */}
      <section className="bg-silk py-24 sm:py-28">
        <div className="zf-container">
          <SectionHeading
            eyebrow="Three Realms"
            title="三才 · 天地人"
            sub="立天之道曰阴与阳，立地之道曰柔与刚，立人之道曰仁与义 ——《易经·说卦》"
          />
          <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {THREE_REALMS.map(realm => (
              <div
                key={realm.name}
                className="rounded-2xl border border-golddim/20 bg-white/50 p-7"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-[26px] font-black text-goldbright">{realm.glyph}</span>
                  <div>
                    <h3 className="font-serif text-[20px] font-bold tracking-[0.1em] text-inktext">
                      {realm.name}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] tracking-[0.14em] text-inkmuted">{realm.sub}</p>
                  </div>
                </div>
                <p className="mt-4 text-[13px] leading-[1.9] text-inkmuted">{realm.desc}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {realm.items.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="rounded-full border border-golddim/30 px-3.5 py-1.5 text-[12px] tracking-[0.08em] text-inktext transition-colors hover:border-goldbright hover:text-goldbright"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== S4 · 古籍跑马灯 ===== */}
      <section className="gs-marquee border-y border-[rgba(199,162,58,0.18)] bg-deep py-8">
        <p className="text-center font-serif text-[15px] font-semibold tracking-[0.24em] text-goldbright">
          典籍为据 · 句句可溯
        </p>
        <div className="zf-marquee mt-5 overflow-hidden">
          <div className="zf-marquee-track flex w-max items-center whitespace-nowrap">
            {[0, 1].map(dup => (
              <div
                key={dup}
                aria-hidden={dup === 1}
                className="flex items-center"
              >
                {BOOKS.map(b => (
                  <span key={`${dup}-${b}`} className="flex items-center">
                    <span className="px-5 font-serif text-[17px] text-golddim">
                      《{b}》
                    </span>
                    <span className="text-silkmuted">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== S5 · 引流工具 ===== */}
      <section className="bg-deep py-24 sm:py-28">
        <div className="zf-container">
          <SectionHeading
            dark
            eyebrow="Free Tools"
            title="先从一件小事开始"
            sub="三个免费工具，无需订阅；随用随走，句句以传统典籍为据"
          />
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {LEAD_TOOLS.map(tool => (
              <FeatureCard
                key={tool.to}
                dark
                {...tool}
                className="min-h-[245px] border-gold/30"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== S6 · 学习入口 ===== */}
      <section className="bg-deep2 py-24 sm:py-28">
        <div className="zf-container">
          <SectionHeading
            dark
            eyebrow="Study & Sources"
            title="循着出处，读懂古法"
            sub="从典籍原文、术语释义到方法脉络，建立自己的理解"
          />
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {LEARNING_ENTRIES.map(entry => (
              <FeatureCard key={entry.title} dark {...entry} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== S7 · 次级引擎入口 ===== */}
      <section className="border-t border-gold/10 bg-deep2 pb-28">
        <div className="zf-container">
          <div className="flex flex-col gap-3 border-b border-gold/15 pb-7 pt-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-latin text-[11px] font-medium uppercase tracking-[0.32em] text-gold">
                More Engines
              </p>
              <h2 className="mt-3 font-serif text-[25px] font-bold tracking-[0.1em] text-silktext">
                更多古法引擎
              </h2>
            </div>
            <p className="text-[13px] leading-relaxed text-silkmuted">
              按术式选择，进入完整排盘与参详工具
            </p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
            {SECONDARY_ENGINES.map(engine => (
              <Link
                key={engine.title}
                to={engine.to}
                className="gs-reveal group flex items-center gap-3 rounded-lg border border-gold/10 bg-deep/65 px-4 py-4 transition-all duration-300 hover:border-gold/45 hover:bg-deep"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gold/30 font-serif text-[17px] font-bold text-goldbright">
                  {engine.glyph}
                </span>
                <span className="min-w-0 font-serif text-[14px] font-semibold tracking-[0.05em] text-silktext transition-colors group-hover:text-goldbright sm:text-[15px]">
                  {engine.title}
                </span>
              </Link>
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
            <Chars text="无需注册" />
            <Chars text="即刻参详" />
          </h2>
          <p className="gs-reveal mt-4 text-[14px] tracking-[0.08em] text-inkmuted">
            {paymentEnabled
              ? "按次计费，无订阅；充值额外赠 15%"
              : "游客模式全功能可用 · AI 参详自带密钥直连 · 账号与充值系统即将上线"}
          </p>
          <div className="gs-cta-btn mt-10">
            <GoldButton
              to="/bazi"
              className="animate-gold-breathe px-12 py-4 text-[16px]"
            >
              开始排盘
            </GoldButton>
          </div>
        </div>
      </section>

      {/* 浅 → 深 过渡带 */}
      <div className="zf-fade-to-deep h-[200px]" />

      {/* ===== S8 · PWA 引导（仅移动端展示；桌面端显示简化提示） ===== */}
      <section className="relative overflow-hidden bg-deep py-28">
        <FloatingGlyphs count={24} onDeep />
        {/* 移动端：添加到桌面引导 */}
        <div className="relative mx-auto flex w-full max-w-[640px] flex-col items-center px-6 text-center md:hidden">
          <div className="gs-app-icon">
            <img
              src="/assets/app-icon-512.png"
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
        {/* 桌面端：简化提示 */}
        <div className="relative mx-auto hidden w-full max-w-[640px] flex-col items-center px-6 text-center md:flex">
          <h2
            data-split="done"
            className="gs-chars mt-2 font-serif text-[clamp(24px,3vw,38px)] font-bold leading-snug tracking-[0.12em] text-silktext"
          >
            <Chars text="手机访问" />
            <Chars text="体验更佳" className="text-goldbright" />
          </h2>
          <p className="gs-reveal mt-5 text-[14.5px] leading-[1.95] text-silktext/85">
            每日时令、安寝参详、排盘解读，在手机上随手可得。
          </p>
        </div>
      </section>
    </div>
  );
}
