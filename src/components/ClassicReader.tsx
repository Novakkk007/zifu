import { useEffect, useRef, useState } from "react";
import type { ClassicChapter } from "@/components/content/classic-texts";
import { cn } from "@/lib/utils";

type ClassicReaderProps = {
  bookId: string;
  chapters: ClassicChapter[];
};

type ReadingProgress = {
  chapterIndex: number;
  scrollY: number;
};

const STORAGE_PREFIX = "zifu:classic-reader:";

function chapterId(index: number) {
  return `classic-chapter-${index + 1}`;
}

function readProgress(key: string): ReadingProgress | undefined {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return undefined;
    const parsed = JSON.parse(value) as Partial<ReadingProgress>;
    if (
      typeof parsed.scrollY !== "number" ||
      typeof parsed.chapterIndex !== "number"
    ) {
      return undefined;
    }
    return {
      chapterIndex: Math.max(0, Math.floor(parsed.chapterIndex)),
      scrollY: Math.max(0, parsed.scrollY),
    };
  } catch {
    return undefined;
  }
}

function saveProgress(key: string, progress: ReadingProgress) {
  try {
    window.localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // 隐私模式或存储配额不足时，阅读本身仍应可用。
  }
}

export default function ClassicReader({
  bookId,
  chapters,
}: ClassicReaderProps) {
  const [activeChapter, setActiveChapter] = useState(0);
  const activeChapterRef = useRef(0);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const storageKey = `${STORAGE_PREFIX}${bookId}`;
    const saved = readProgress(storageKey);
    let frame = 0;
    let restoreFrame = 0;

    if (saved) {
      const restoredChapter = Math.min(
        saved.chapterIndex,
        Math.max(0, chapters.length - 1)
      );
      activeChapterRef.current = restoredChapter;
      restoreFrame = window.requestAnimationFrame(() => {
        setActiveChapter(restoredChapter);
        window.scrollTo({ top: saved.scrollY, behavior: "auto" });
      });
    }

    const updateReadingState = () => {
      const marker = window.scrollY + window.innerHeight * 0.28;
      let nextChapter = 0;

      chapterRefs.current.forEach((section, index) => {
        if (
          section &&
          section.getBoundingClientRect().top + window.scrollY <= marker
        ) {
          nextChapter = index;
        }
      });

      if (nextChapter !== activeChapterRef.current) {
        activeChapterRef.current = nextChapter;
        setActiveChapter(nextChapter);
      }

      saveProgress(storageKey, {
        chapterIndex: nextChapter,
        scrollY: window.scrollY,
      });
      frame = 0;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateReadingState);
    };
    const onPageHide = () => {
      saveProgress(storageKey, {
        chapterIndex: activeChapterRef.current,
        scrollY: window.scrollY,
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      if (frame) window.cancelAnimationFrame(frame);
      if (restoreFrame) window.cancelAnimationFrame(restoreFrame);
    };
  }, [bookId, chapters]);

  const handleChapterClick = (index: number) => {
    activeChapterRef.current = index;
    setActiveChapter(index);
  };

  const tableOfContents = (
    <ol className="space-y-1.5">
      {chapters.map((chapter, index) => (
        <li key={chapter.title}>
          <a
            href={`#${chapterId(index)}`}
            aria-current={activeChapter === index ? "location" : undefined}
            onClick={() => handleChapterClick(index)}
            className={cn(
              "block rounded-md border-l-2 px-3 py-1.5 text-[12.5px] leading-[1.65] transition-colors",
              activeChapter === index
                ? "border-gold bg-gold/10 font-medium text-golddim"
                : "border-transparent text-inkmuted hover:border-golddim/40 hover:text-inktext"
            )}
          >
            {chapter.title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <section
      id="full-text"
      className="mt-12 scroll-mt-24"
      aria-labelledby="full-text-title"
    >
      <div className="border-y border-golddim/20 py-5 text-center">
        <p className="font-latin text-[10px] uppercase tracking-[0.28em] text-golddim">
          Complete Text · 47 Chapters
        </p>
        <h2
          id="full-text-title"
          className="mt-2 font-serif text-[22px] font-bold tracking-[0.16em] text-inktext"
        >
          阅读全文
        </h2>
        <p className="mt-2 text-[12px] leading-[1.8] text-inkmuted">
          目录随阅读进度高亮，离开后将从本机保存的位置继续。
        </p>
      </div>

      <details className="mt-6 rounded-xl border border-golddim/20 bg-white/55 p-4 lg:hidden">
        <summary className="cursor-pointer font-serif text-[15px] font-bold tracking-[0.1em] text-inktext">
          篇目 · {chapters[activeChapter]?.title}
        </summary>
        <nav
          aria-label="全文目录"
          className="mt-4 max-h-[52vh] overflow-y-auto pr-1"
        >
          {tableOfContents}
        </nav>
      </details>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-golddim/20 bg-white/45 p-4 lg:block">
          <p className="mb-3 px-3 text-[11px] font-medium tracking-[0.16em] text-golddim">
            全文目录
          </p>
          <nav aria-label="全文目录">{tableOfContents}</nav>
        </aside>

        <article className="min-w-0 rounded-2xl border border-golddim/20 bg-white/60 px-5 py-2 shadow-sm sm:px-9 md:px-12">
          {chapters.map((chapter, index) => (
            <section
              key={chapter.title}
              id={chapterId(index)}
              ref={node => {
                chapterRefs.current[index] = node;
              }}
              className="scroll-mt-24 border-b border-golddim/15 py-10 last:border-b-0 md:py-12"
              aria-labelledby={`${chapterId(index)}-title`}
            >
              <p className="text-center font-latin text-[10px] tracking-[0.24em] text-golddim">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3
                id={`${chapterId(index)}-title`}
                className="mt-2 text-center font-serif text-[20px] font-bold tracking-[0.12em] text-inktext sm:text-[22px]"
              >
                {chapter.title}
              </h3>
              <div className="mx-auto mt-7 max-w-[42rem] space-y-5">
                {chapter.paragraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className="whitespace-pre-line text-justify indent-[2em] font-serif text-[16px] leading-[2.15] tracking-[0.025em] text-inktext sm:text-[17px] sm:leading-[2.2]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </section>
  );
}
