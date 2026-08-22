/**
 * 藏经阁书籍详情页——书目/朝代/作者/简介/公版摘录。
 * 数据源：src/data/books.json（经 books.ts 加载）。
 */
import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router";
import ClassicReader from "@/components/ClassicReader";
import { BOOKS } from "@/components/content/books";
import { getClassicText } from "@/components/content/classic-texts";
import FloatingGlyphs from "@/components/FloatingGlyphs";
import { setPageMeta } from "@/lib/pageMeta";

export default function BookDetail() {
  const { bookId } = useParams<{ bookId: string }>();
  const book = useMemo(() => BOOKS.find(b => b.id === bookId), [bookId]);
  const classicText = useMemo(
    () => (bookId ? getClassicText(bookId) : undefined),
    [bookId]
  );
  const hasChapters = Boolean(book?.chapters?.length);

  useEffect(() => {
    if (book) {
      setPageMeta(
        `${book.title} · 紫府藏经阁`,
        `紫府藏经阁《${book.title}》——${book.dynasty ?? "公版"}典籍详情与${classicText ? "公版全文" : "原文摘录"}，出处可溯。`
      );
    } else {
      setPageMeta(
        "未找到此书 · 紫府藏经阁",
        "紫府藏经阁——书目可能有变，请回藏经阁重新浏览。"
      );
    }
  }, [book, classicText]);

  if (!book) {
    return (
      <div className="bg-silk pb-24 pt-20">
        <div className="zf-container mx-auto max-w-[720px] text-center">
          <p className="font-serif text-[26px] font-bold text-inktext">
            未找到此典籍
          </p>
          <p className="mt-3 text-[13px] text-inkmuted">
            书目可能有变，请回藏经阁重新浏览。
          </p>
          <Link
            to="/wiki"
            className="mt-6 inline-block rounded-full bg-deep px-8 py-3 text-[13.5px] tracking-[0.1em] text-silk"
          >
            返回藏经阁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-silk pb-24 pt-14 md:pt-20">
      <FloatingGlyphs count={14} />
      <div
        className={`relative zf-container ${classicText ? "max-w-[1180px]" : "max-w-[780px]"}`}
      >
        <Link
          to="/wiki"
          className="text-[12.5px] tracking-[0.1em] text-inkmuted hover:text-golddim"
        >
          ← 藏经阁
        </Link>
        <header className="mt-6">
          <p className="font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-golddim">
            Classics
          </p>
          <h1 className="mt-2 font-serif text-[34px] font-black tracking-[0.1em] text-inktext">
            《{book.title}》
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[12.5px] text-inkmuted">
            <span className="rounded-full border border-golddim/40 px-3 py-1">
              {book.dynasty}
            </span>
            <span className="rounded-full border border-golddim/40 px-3 py-1">
              {book.author}
            </span>
            <span className="rounded-full border border-golddim/40 px-3 py-1">
              {book.category}
            </span>
          </div>
          <p className="mt-5 text-[14px] leading-[2] text-inktext">
            {book.intro}
          </p>
          {classicText && (
            <a
              href="#full-text"
              className="mt-6 inline-flex rounded-full bg-deep px-7 py-2.5 text-[13px] font-medium tracking-[0.12em] text-silk transition-colors hover:bg-deep2"
            >
              阅读全文 · 共 {classicText.chapters.length} 篇
            </a>
          )}
        </header>

        {classicText ? (
          <ClassicReader bookId={book.id} chapters={classicText.chapters} />
        ) : hasChapters ? (
          <section className="mt-10" aria-labelledby="chapter-reading-title">
            <h2
              id="chapter-reading-title"
              className="font-serif text-[18px] font-bold tracking-[0.1em] text-inktext"
            >
              章节阅读
            </h2>
            <nav
              aria-label="章节目录"
              className="mt-4 rounded-xl border border-golddim/20 bg-white/45 p-5"
            >
              <p className="text-[12px] font-medium tracking-[0.14em] text-golddim">
                目录
              </p>
              <ol className="mt-3 grid gap-2 text-[13px] text-inktext sm:grid-cols-2">
                {book.chapters?.map((chapter, index) => (
                  <li key={chapter.title}>
                    <a
                      href={`#chapter-${index + 1}`}
                      className="inline-flex gap-2 leading-[1.7] hover:text-golddim"
                    >
                      <span className="text-inkmuted">{index + 1}.</span>
                      <span>{chapter.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="mt-5 space-y-4">
              {book.chapters?.map((chapter, index) => (
                <details
                  key={chapter.title}
                  id={`chapter-${index + 1}`}
                  open={index === 0}
                  className="scroll-mt-24 rounded-xl border border-golddim/20 bg-white/60 p-5 open:shadow-sm md:p-6"
                >
                  <summary className="cursor-pointer list-none font-serif text-[17px] font-bold leading-[1.7] text-inktext marker:hidden">
                    <span className="mr-2 text-[12px] font-normal text-golddim">
                      第 {index + 1} 章
                    </span>
                    {chapter.title}
                  </summary>
                  <div className="mt-4 space-y-4 border-t border-golddim/15 pt-4">
                    {chapter.paragraphs.map((paragraph, paragraphIndex) => (
                      <p
                        key={paragraphIndex}
                        className="whitespace-pre-line font-serif text-[15px] leading-[2] text-inktext"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-10">
            <h2 className="font-serif text-[18px] font-bold tracking-[0.1em] text-inktext">
              公版摘录
            </h2>
            <ul className="mt-4 space-y-4">
              {book.excerpts.map((ex, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-golddim/20 bg-white/60 p-6"
                >
                  <p className="font-serif text-[15.5px] leading-[1.9] text-inktext">
                    {ex.text}
                  </p>
                  <p className="mt-3 text-[11.5px] tracking-[0.08em] text-inkmuted">
                    —— {ex.source}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 text-center text-[11.5px] leading-[1.8] text-inkmuted">
          {classicText ? (
            <>
              《子平真诠》为清代沈孝瞻所著，原著已进入公版。
              <br />
              本页正文据 docs/classics/absorbed-bazi-repo/zipingzhenquan.md
              结构化整理，仅供传统文化研究参考。
            </>
          ) : (
            <>本馆引文均为公版古籍原文，摘录仅供传统文化研究参考。</>
          )}
          <br />
          更多术语可查阅{" "}
          <Link to="/wiki" className="text-golddim hover:text-goldbright">
            藏经阁
          </Link>{" "}
          与术语互链。
        </p>
      </div>
    </div>
  );
}
