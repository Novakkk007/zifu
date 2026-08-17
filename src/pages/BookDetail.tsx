/**
 * 藏经阁书籍详情页——书目/朝代/作者/简介/公版摘录。
 * 数据源：src/data/books.json（经 books.ts 加载）。
 */
import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { BOOKS } from '@/components/content/books'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import { setPageMeta } from '@/lib/pageMeta'

export default function BookDetail() {
  const { bookId } = useParams<{ bookId: string }>()
  const book = useMemo(() => BOOKS.find((b) => b.id === bookId), [bookId])

  useEffect(() => {
    if (book) {
      setPageMeta(
        `${book.title} · 紫府藏经阁`,
        `紫府藏经阁《${book.title}》——${book.dynasty ?? '公版'}典籍详情与原文摘录，出处可溯。`,
      );
    } else {
      setPageMeta(
        '未找到此书 · 紫府藏经阁',
        '紫府藏经阁——书目可能有变，请回藏经阁重新浏览。',
      );
    }
  }, [book])

  if (!book) {
    return (
      <div className="bg-silk pb-24 pt-20">
        <div className="zf-container mx-auto max-w-[720px] text-center">
          <p className="font-serif text-[26px] font-bold text-inktext">未找到此典籍</p>
          <p className="mt-3 text-[13px] text-inkmuted">书目可能有变，请回藏经阁重新浏览。</p>
          <Link
            to="/wiki"
            className="mt-6 inline-block rounded-full bg-deep px-8 py-3 text-[13.5px] tracking-[0.1em] text-silk"
          >
            返回藏经阁
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-silk pb-24 pt-14 md:pt-20">
      <FloatingGlyphs count={14} />
      <div className="relative zf-container max-w-[780px]">
        <Link to="/wiki" className="text-[12.5px] tracking-[0.1em] text-inkmuted hover:text-golddim">
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
            <span className="rounded-full border border-golddim/40 px-3 py-1">{book.dynasty}</span>
            <span className="rounded-full border border-golddim/40 px-3 py-1">{book.author}</span>
            <span className="rounded-full border border-golddim/40 px-3 py-1">{book.category}</span>
          </div>
          <p className="mt-5 text-[14px] leading-[2] text-inktext">{book.intro}</p>
        </header>

        <section className="mt-10">
          <h2 className="font-serif text-[18px] font-bold tracking-[0.1em] text-inktext">公版摘录</h2>
          <ul className="mt-4 space-y-4">
            {book.excerpts.map((ex, i) => (
              <li key={i} className="rounded-xl border border-golddim/20 bg-white/60 p-6">
                <p className="font-serif text-[15.5px] leading-[1.9] text-inktext">{ex.text}</p>
                <p className="mt-3 text-[11.5px] tracking-[0.08em] text-inkmuted">
                  —— {ex.source}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-center text-[11.5px] leading-[1.8] text-inkmuted">
          本馆引文均为公版古籍原文，摘录仅供传统文化研究参考。
          <br />
          更多术语可查阅 <Link to="/wiki" className="text-golddim hover:text-goldbright">藏经阁</Link> 与术语互链。
        </p>
      </div>
    </div>
  )
}
