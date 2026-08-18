import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import PageHero from '@/components/content/PageHero'
import { usePageMeta } from '@/lib/page-meta'
import SectionHeading from '@/components/SectionHeading'
import { GoldButton } from '@/components/Buttons'
import { BOOKS, BOOK_CATEGORIES } from '@/components/content/books'
import type { Book, BookCategory } from '@/components/content/books'

const HERO_POOL = ['易', '髓', '通', '诠', '鉴', '渊', '微', '宗', '卜', '壬', '烟', '波', '藏', '书']

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

type CatFilter = '全部' | BookCategory

/* ---------------- 典籍节选 Drawer ---------------- */

function BookDrawer({ book, onClose }: { book: Book | null; onClose: () => void }) {
  useEffect(() => {
    if (!book) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [book])

  return (
    <AnimatePresence>
      {book && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.26 }}
          className="fixed inset-0 z-[70] bg-deep3/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: easeOut }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full flex-col overflow-y-auto border-l border-gold/20 bg-deep2 sm:w-[480px]"
          >
            <div className="flex items-start justify-between p-8 pb-0">
              <div>
                <h3 className="font-serif text-[30px] font-black tracking-[0.1em] text-goldbright">
                  《{book.title}》
                </h3>
                <p className="mt-2 font-sans text-[13px] tracking-[0.14em] text-silkmuted">
                  {book.dynasty} · {book.author} ｜ {book.category}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                className="rounded-full border border-gold/30 p-2 text-silkmuted transition-colors hover:border-gold hover:text-goldbright"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="zf-hairline mx-8 mt-6" style={{ width: 'auto' }} />

            <div className="flex-1 space-y-5 p-8">
              {book.excerpts.map((ex, i) => (
                <motion.blockquote
                  key={ex.text}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: easeOut }}
                  className="rounded-r-xl border-l-[3px] border-gold bg-deep/50 px-6 py-5"
                >
                  <p className="font-serif text-[16px] leading-[2.1] text-goldbright">{ex.text}</p>
                  <footer className="mt-2 text-[12.5px] tracking-[0.08em] text-silkmuted">
                    —— {ex.source}
                  </footer>
                </motion.blockquote>
              ))}
            </div>

            <div className="border-t border-gold/15 p-8">
              <p className="text-[12px] leading-[1.9] tracking-[0.06em] text-silkmuted">
                以上皆公版原文 · 紫府 AI 参详时逐句锚定此类出处
              </p>
              <GoldButton to={book.route} className="mt-5 w-full">
                以此书为据 · 开始推演
              </GoldButton>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------------- 书目卡 ---------------- */

function BookCard({ book, onOpen }: { book: Book; onOpen: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="group flex gap-5 rounded-xl border border-golddim/25 bg-silk2 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-card"
    >
      {/* 左：信息 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="w-fit rounded-sm border border-golddim/40 px-1.5 py-0.5 font-serif text-[11px] tracking-[0.2em] text-golddim">
          {book.category}
        </span>
        <p className="mt-3 font-sans text-[12.5px] tracking-[0.12em] text-inkmuted">
          {book.dynasty} · {book.author}
        </p>
        <p className="mt-2 flex-1 text-[13.5px] leading-[1.9] text-inkmuted">{book.intro}</p>
        <button
          type="button"
          onClick={onOpen}
          className="zf-link-more mt-4 inline-flex w-fit items-center gap-1 text-[13.5px] font-medium tracking-[0.08em] text-golddim"
        >
          翻阅节选 <span className="zf-arrow">→</span>
        </button>
      </div>
      {/* 右：竖排书名（线装书脊式） */}
      <div className="flex w-[52px] shrink-0 items-start justify-center rounded-md border border-gold/30 bg-silk py-4">
        <span
          className="font-serif text-[22px] font-bold leading-[1.35] tracking-[0.15em] text-inktext"
          style={{ writingMode: 'vertical-rl' }}
        >
          {book.title}
        </span>
      </div>
    </motion.div>
  )
}

/* ---------------- 页面 ---------------- */

export default function Wiki() {
  const [cat, setCat] = useState<CatFilter>('全部')
  const [opened, setOpened] = useState<Book | null>(null)

  usePageMeta(
    '藏经阁 · 紫府',
    '紫府藏经阁——汇聚《周易》《滴天髓》《三命通会》等十二部公版术数典籍原文节选，句有出处、可溯源查阅。',
  )

  const list = useMemo(() => (cat === '全部' ? BOOKS : BOOKS.filter((b) => b.category === cat)), [cat])

  return (
    <div>
      {/* S1 · PageHero */}
      <PageHero
        breadcrumb="藏经阁"
        glyph="藏"
        title="藏经阁"
        latin="Sutra Library"
        subtitle="紫府参详所据之典籍，皆在此阁——句有出处，方敢落笔"
        pool={HERO_POOL}
        minH="min-h-[38vh]"
      />

      {/* 深 → 浅 过渡 */}
      <div className="zf-fade-to-silk h-[160px]" />

      {/* S2 · 类别筛选 + 书目网格 */}
      <section className="relative bg-silk pb-28 pt-16">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative zf-container">
          <SectionHeading
            eyebrow="Twelve Classics"
            title="十二部典籍"
            sub="点击书目，翻阅公版原文节选"
          />

          {/* 类别筛选 */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {BOOK_CATEGORIES.map((c) => {
              const active = cat === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={cn(
                    'relative rounded-full px-5 py-2 font-sans text-[13px] font-medium tracking-[0.12em] transition-colors',
                    active ? 'text-silk' : 'text-inkmuted hover:text-inktext',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="wiki-cat-pill"
                      className="absolute inset-0 rounded-full bg-deep"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{c}</span>
                </button>
              )
            })}
          </div>

          <motion.div layout className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {list.map((book) => (
                <BookCard key={book.id} book={book} onOpen={() => setOpened(book)} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* S3 · 典籍节选 Drawer */}
      <BookDrawer book={opened} onClose={() => setOpened(null)} />
    </div>
  )
}
