import { useEffect, useRef } from "react";
import FloatingGlyphs from "@/components/FloatingGlyphs";

function Chars({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {Array.from(text).map((ch, index) => (
        <span
          key={index}
          className={`gs-char inline-block will-change-transform ${className ?? ""}`}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

/** 页底 PWA 引导：由首页在接近视口时按需加载。 */
export default function HomeInstallPrompt() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    root.querySelectorAll<HTMLElement>(".gs-chars").forEach((title) => {
      title.querySelectorAll<HTMLElement>(".gs-char").forEach((char, index) => {
        char.style.setProperty("--zf-char-delay", `${index * 45}ms`);
      });
    });
    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(".gs-chars, .gs-reveal, .gs-app-icon"),
    );
    targets.forEach((target) => target.classList.add("zf-reveal-pending"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("zf-in-view");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-deep py-28">
      <FloatingGlyphs count={24} onDeep />
      <div className="relative mx-auto flex w-full max-w-[640px] flex-col items-center px-6 text-center md:hidden">
        <div className="gs-app-icon">
          <img
            src="/assets/app-icon-512.png"
            alt="紫府 App 图标"
            width={512}
            height={512}
            loading="lazy"
            decoding="async"
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
  );
}
