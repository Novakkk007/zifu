import { useEffect } from "react";
import { Link } from "react-router";
import FloatingGlyphs from "@/components/FloatingGlyphs";
import { setPageMeta } from "@/lib/pageMeta";

export type ScenarioKind = "wealth" | "love" | "health" | "fengshui";

type ScenarioPlaceholderProps = {
  scenario: ScenarioKind;
};

const SCENARIOS: Record<
  ScenarioKind,
  {
    glyph: string;
    eyebrow: string;
    title: string;
    desc: string;
    preview: string[];
  }
> = {
  wealth: {
    glyph: "财",
    eyebrow: "Career & Wealth",
    title: "事业财富运程",
    desc: "以八字财官结构与阶段节律为基础，梳理事业方向、资源关系与财富趋势。",
    preview: ["财官格局概览", "阶段趋势参看", "古籍原文依据"],
  },
  love: {
    glyph: "缘",
    eyebrow: "Love & Marriage",
    title: "感情婚姻合参",
    desc: "结合个人命盘与双方合盘，从传统术数视角理解情感倾向、互动模式与相处线索。",
    preview: ["个人情感倾向", "双盘关系合参", "相处线索梳理"],
  },
  health: {
    glyph: "养",
    eyebrow: "Health & Wellness",
    title: "健康体质养生",
    desc: "从五行旺衰参看体质倾向与四时养护重点，仅作传统文化研究与日常生活参考。",
    preview: ["五行体质概览", "四时养护提示", "年度节律参看"],
  },
  fengshui: {
    glyph: "宅",
    eyebrow: "Dwelling & Space",
    title: "阳宅风水参详",
    desc: "以《黄帝宅经》等公版典籍为据，参详宅向、门主灶布局与空间环境，输出可验证的环境检查提示。",
    preview: ["宅局环境检查", "门主灶参详", "公版原文依据"],
  },
};

export default function ScenarioPlaceholder({
  scenario,
}: ScenarioPlaceholderProps) {
  const content = SCENARIOS[scenario];

  useEffect(() => {
    setPageMeta(
      `${content.title} · 紫府`,
      content.desc,
    );
  }, [content.title, content.desc]);

  return (
    <main className="relative min-h-[78dvh] overflow-hidden bg-deep px-6 py-24 sm:py-32">
      <FloatingGlyphs count={30} onDeep />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "url(/assets/gold-foil.webp)",
          backgroundSize: "512px 512px",
          maskImage:
            "radial-gradient(ellipse 70% 65% at 50% 38%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 65% at 50% 38%, black, transparent 75%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[780px] flex-col items-center text-center">
        <nav
          className="flex items-center gap-2 text-[12px] tracking-[0.16em] text-silkmuted"
          aria-label="breadcrumb"
        >
          <Link to="/" className="transition-colors hover:text-goldbright">
            首页
          </Link>
          <span className="text-silkmuted/50">/</span>
          <span className="text-goldbright">{content.title}</span>
        </nav>

        <div className="mt-9 flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/50 bg-deep2/80 font-serif text-[36px] font-black text-goldbright shadow-[0_0_45px_-18px_rgba(228,198,106,0.75)]">
          {content.glyph}
        </div>
        <p className="mt-7 font-latin text-[12px] font-medium uppercase tracking-[0.38em] text-gold">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 font-serif text-[clamp(36px,6vw,62px)] font-bold tracking-[0.08em] text-silktext">
          {content.title}
        </h1>
        <div className="zf-hairline mt-7" />
        <p className="mt-7 max-w-2xl text-[15px] leading-[2] text-silkmuted">
          {content.desc}
        </p>

        <div className="mt-10 w-full rounded-2xl border border-gold/25 bg-deep2/80 p-6 sm:p-8">
          <span className="inline-flex rounded-full border border-gold/35 bg-gold/10 px-4 py-1.5 text-[12px] font-medium tracking-[0.2em] text-goldbright">
            即将上线
          </span>
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {content.preview.map((item, index) => (
              <div
                key={item}
                className="rounded-lg border border-gold/10 bg-deep/70 px-4 py-4 text-[13px] tracking-[0.06em] text-silktext"
              >
                <span className="mr-2 font-latin text-golddim">
                  0{index + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
          <p className="mt-6 text-[12px] leading-[1.8] text-silkmuted/75">
            功能正在营造中。你可以先体验现有免费工具，或返回首页浏览其他入口。
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            to="/daily"
            className="rounded-lg bg-gold px-7 py-3 text-[14px] font-semibold tracking-[0.1em] text-deep transition-colors hover:bg-goldbright"
          >
            先看每日时令
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-gold/35 px-7 py-3 text-[14px] font-medium tracking-[0.1em] text-goldbright transition-colors hover:border-gold"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
