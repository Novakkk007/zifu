import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import FloatingGlyphs from "@/components/FloatingGlyphs";
import BrandLogo from "@/components/BrandLogo";
import { usePageMeta } from "@/lib/page-meta";
import QuoteRotator from '@/components/QuoteRotator'

/** 信任锚点（低调四言） */
const TRUST_VERSE = [
  { line: '星移有准', note: '算得准' },
  { line: '字字有根', note: '讲得真' },
  { line: '法度示人', note: '不藏私' },
  { line: '温言照心', note: '留余温' },
];

/**
 * 紫府 · 一层「门」
 * 进门只三样：一句本心、两个入口、先生一句话。
 * 其余一切，藏于深处。
 */
export default function Home() {
  usePageMeta(
    "紫府 · 以古人之智照今日之心",
    "凡事爻一爻，看盘照一生。紫府——AI 命理道场，先生在此。"
  );
  const reduce = useReducedMotion();
  const [entered, setEntered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setEntered(true), 120);
    return () => { if (timerRef.current) clearTimeout(timerRef.current) };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-deep2">
      <FloatingGlyphs />

      {/* 夜穹呼吸光（隐约美的底色——缓慢明暗的金色光晕） */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(560px 340px at 18% 12%, rgba(201,164,92,0.10), transparent 65%)," +
            "radial-gradient(620px 380px at 84% 88%, rgba(122,88,180,0.12), transparent 65%)," +
            "radial-gradient(420px 260px at 55% 45%, rgba(201,164,92,0.05), transparent 70%)",
          animation: "zifu-breathe 9s ease-in-out infinite",
        }}
      />
      {/* 漂移光斑（两点，极慢） */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-0 h-64 w-64 rounded-full"
        style={{
          left: "8%", top: "22%",
          background: "radial-gradient(circle, rgba(201,164,92,0.14), transparent 70%)",
          filter: "blur(30px)",
          animation: "zifu-drift-a 26s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute z-0 h-72 w-72 rounded-full"
        style={{
          right: "6%", bottom: "16%",
          background: "radial-gradient(circle, rgba(160,120,220,0.13), transparent 70%)",
          filter: "blur(34px)",
          animation: "zifu-drift-b 32s ease-in-out infinite",
        }}
      />

      <div className="zf-container relative z-10 flex min-h-screen flex-col items-center justify-center py-20">
        {/* 门额 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 16 }}
          transition={{ duration: 0.9 }}
          className="text-center"
        >
          <BrandLogo variant="mark" size={34} className="mx-auto" />
          <h1 className="mt-6 font-serif text-[30px] font-bold leading-[1.6] tracking-[0.18em] text-inktext sm:text-[36px]">
            以古人之智
            <span className="mx-3 text-golddim">·</span>
            照今日之心
          </h1>
          <p className="mt-5 font-serif text-[13.5px] leading-[2.1] tracking-[0.1em] text-inkmuted">
            问一事，摇一卦；想看清这一生，排一盘。
            <br className="sm:hidden" />
            先生不吆喝，只在这里。
          </p>
        </motion.div>

        {/* 先生的话 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: entered ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="mt-8"
        >
          <QuoteRotator />
        </motion.div>

        {/* 两个入口 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
          animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 22 }}
          transition={{ duration: 0.9, delay: 0.9 }}
          className="mt-12 grid w-full max-w-[720px] grid-cols-1 gap-5 sm:grid-cols-5"
        >
          {/* 主入口 · 六爻 */}
          <Link
            to="/liuyao"
            className="group relative overflow-hidden rounded-2xl border border-gold/45 bg-gold/[0.07] px-7 py-9 text-center transition-all duration-300 hover:border-gold hover:bg-gold/[0.13] hover:shadow-[0_0_44px_rgba(201,164,92,0.18)] sm:col-span-3"
            style={{ animation: "zifu-card-in 1.1s ease-out 1.2s both" }}
          >
            <span className="pointer-events-none absolute -right-6 -top-6 font-serif text-[92px] leading-none text-gold/[0.07] transition-transform duration-500 group-hover:scale-110">☰</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(201,164,92,0.75), transparent)",
                backgroundSize: "200% 100%",
                animation: "zifu-sweep 4.5s linear infinite",
              }}
            />
            <p className="font-serif text-[26px] font-bold tracking-[0.22em] text-goldbright">凡事爻一爻</p>
            <p className="mt-4 text-[12.5px] leading-[2] tracking-[0.08em] text-silkmuted">
              默想所问之事，掷一枚铜钱
              <br />
              不问生辰，两步到卦
            </p>
            <p className="mt-5 font-sans text-[11.5px] tracking-[0.2em] text-golddim transition-colors group-hover:text-goldbright">
              起 一 卦
            </p>
          </Link>

          {/* 次入口 · 八字 */}
          <Link
            to="/bazi"
            className="group relative overflow-hidden rounded-2xl border border-golddim/30 bg-silk2/50 px-7 py-9 text-center transition-all duration-300 hover:border-gold/55 hover:bg-silk2/80 hover:shadow-[0_0_36px_rgba(201,164,92,0.12)] sm:col-span-2"
            style={{ animation: "zifu-card-in 1.1s ease-out 1.5s both" }}
          >
            <span className="pointer-events-none absolute -right-4 -top-4 font-serif text-[72px] leading-none text-gold/[0.06] transition-transform duration-500 group-hover:scale-110">☵</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(201,164,92,0.5), transparent)",
                backgroundSize: "200% 100%",
                animation: "zifu-sweep 7s linear infinite",
              }}
            />
            <p className="font-serif text-[20px] font-bold tracking-[0.18em] text-inktext">看这一生</p>
            <p className="mt-4 text-[12px] leading-[2] tracking-[0.08em] text-inkmuted">
              排一盘，照见底色与来路
            </p>
            <p className="mt-5 font-sans text-[11.5px] tracking-[0.2em] text-golddim/80 transition-colors group-hover:text-golddim">
              排 盘
            </p>
          </Link>
        </motion.div>

        {/* 信任四言（低调收底） */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: entered ? 1 : 0 }}
          transition={{ duration: 1.4, delay: 1.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
        >
          {TRUST_VERSE.map((v) => (
            <span key={v.line} className="flex items-baseline gap-2 font-serif">
              <span className="text-[14px] tracking-[0.2em] text-inkmuted">{v.line}</span>
              <span className="text-[10px] tracking-[0.14em] text-inkfaint">{v.note}</span>
            </span>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes zifu-breathe {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes zifu-drift-a {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(46px, -30px); }
          66% { transform: translate(-24px, 22px); }
        }
        @keyframes zifu-drift-b {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-52px, 26px); }
          66% { transform: translate(28px, -34px); }
        }
        @keyframes zifu-sweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes zifu-card-in {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
