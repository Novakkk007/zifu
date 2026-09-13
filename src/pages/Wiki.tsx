import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import PageHero from '@/components/content/PageHero'
import { usePageMeta } from '@/lib/page-meta'
import SectionHeading from '@/components/SectionHeading'
import { PLAIN_TERMS } from '@/data/plain-terms'
import { yunQiOf, YUNQI_FRAMEWORK } from '@/data/wuyun-liuqi'
import { CHANGSHENG_JIA, CHANGSHENG_MNEMONIC } from '@/data/changsheng'
import { GoldButton } from '@/components/Buttons'
import { BOOKS, BOOK_CATEGORIES } from '@/components/content/books'
import type { Book, BookCategory } from '@/components/content/books'
import { getClassicText } from '@/components/content/classic-texts'

const HERO_POOL = ['易', '髓', '通', '诠', '鉴', '渊', '微', '宗', '卜', '壬', '烟', '波', '藏', '书']

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

type CatFilter = '全部' | BookCategory

/* ---------------- 典籍节选 Drawer ---------------- */

function BookDrawer({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const classicText = book ? getClassicText(book.id) : undefined

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
              {classicText && (
                <GoldButton to={`/wiki/${book.id}`} className="mt-5 w-full">
                  阅读全文 · 共 {classicText.chapters.length} 篇
                </GoldButton>
              )}
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

/* ---------------- 五色书封（书架陈列） ---------------- */

/** 五类书封暗雅色阶：易占/子平/星命/三式/择日（命理归黛蓝、紫微归绛紫） */
const COVER_THEMES: Record<string, { bg: string; char: string }> = {
  易占: { bg: '#1D3D45', char: '易' }, // 玄青
  子平: { bg: '#2A3A55', char: '平' }, // 黛蓝
  命理: { bg: '#2A3A55', char: '命' }, // 子平真诠（命理）归黛蓝
  星命: { bg: '#3B2E4E', char: '星' }, // 绛紫
  紫微: { bg: '#3B2E4E', char: '紫' }, // 紫微斗数全书归绛紫
  三式: { bg: '#2C4038', char: '式' }, // 黛绿
  择日: { bg: '#4A322E', char: '择' }, // 绛赭
}

const COVER_FALLBACK: { bg: string; char: string } = { bg: '#26262E', char: '藏' } // 墨玄

function BookCard({ book, onOpen }: { book: Book; onOpen: () => void }) {
  const theme = COVER_THEMES[book.category] ?? COVER_FALLBACK

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`翻阅《${book.title}》节选`}
        title={book.intro}
        className="group relative block w-full rounded-[6px] text-left outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-silk"
      >
        {/* 书页厚度（左缘，hover 显露加厚，伪 3D 书页感） */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-[6px] top-[10px] bottom-[14px] w-[3px] rounded-l-[3px] opacity-80 transition-all duration-300 ease-out group-hover:w-[6px] group-hover:opacity-100"
          style={{
            background: 'linear-gradient(to bottom, #f1e7d0 0%, #e6d8b6 40%, #d9c79e 75%, #c9b488 100%)',
          }}
        >
          <div className="absolute inset-0 rounded-l-[3px] bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_3px,rgba(110,90,50,0.4)_3px,rgba(110,90,50,0.4)_4px)] opacity-60" />
        </div>

        {/* 书封（3:4） */}
        <div
          style={{ backgroundColor: theme.bg }}
          className="relative aspect-[3/4] overflow-hidden rounded-[6px] border border-golddim/40 shadow-[0_14px_26px_-16px_rgba(24,16,58,0.5)] transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-gold/80 group-hover:shadow-[0_18px_40px_-12px_rgba(201,164,92,0.14),0_14px_30px_-14px_rgba(24,16,58,0.4)]"
        >
          {/* 布面光泽 */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-black/25" />
          {/* 双线饰框 */}
          <div aria-hidden className="pointer-events-none absolute inset-2 rounded-[3px] border border-gold/20" />
          <div aria-hidden className="pointer-events-none absolute inset-3.5 rounded-[2px] border border-gold/10" />
          {/* 左缘（书脊侧）微光 */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-white/10 to-transparent" />

          <div className="relative z-10 flex h-full flex-col p-4">
            {/* 顶：分类字标 + 分类名 */}
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-gold/45 bg-white/[0.04] font-serif text-[14px] text-goldbright/90">
                {theme.char}
              </span>
              <span className="truncate font-sans text-[12px] tracking-[0.3em] text-silkmuted/90">{book.category}</span>
            </div>
            <div className="mt-2.5 h-px shrink-0 bg-gradient-to-r from-gold/45 via-gold/20 to-transparent" />

            {/* 中：书名（移动端横排居中，sm+ 竖排居中） */}
            <div className="flex min-h-0 flex-1 items-center justify-center py-2">
              <span className="line-clamp-2 text-center font-serif text-[16px] font-bold leading-[1.7] tracking-[0.24em] text-goldbright/95 sm:line-clamp-none sm:text-[clamp(13px,0.8vw+9px,19px)] sm:leading-[1.35] sm:tracking-[0.16em] sm:[writing-mode:vertical-rl]">
                {book.title}
              </span>
            </div>

            {/* 底：朝代作者 + 紫府印「紫府藏」 */}
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-sans text-[12px] leading-[1.6] tracking-[0.06em] text-silkmuted/85">
                  {book.dynasty}
                </p>
                <p className="truncate font-sans text-[12px] leading-[1.6] tracking-[0.06em] text-silkmuted/70">
                  {book.author}
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-center border border-gold/45 bg-white/[0.03] px-1 py-0.5 transition-colors duration-300 group-hover:border-goldbright/80">
                <span className="font-serif text-[12px] leading-[1.3] tracking-[0.1em] text-goldbright/85 [writing-mode:vertical-rl]">
                  紫府藏
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  )
}

/* ---------------- 宝 · 术 · 藏经阁导航卡 ---------------- */

function ThreeHallsNav() {
  return (
    <section aria-label="宝 · 术 · 藏经阁" className="relative bg-deep2">
      <div className="zf-container">
        <div className="mx-auto max-w-[880px] pb-16 pt-14">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center font-sans text-[12px] tracking-[0.34em] text-golddim"
          >
            宝 · 术 · 藏经阁
          </motion.p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {/* ① 藏经阁 · 典藏电子书 → 页内书目 */}
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.06, ease: easeOut }}
            >
              <button
                type="button"
                onClick={() =>
                  document.getElementById('wiki-books')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="group flex h-full w-full flex-col rounded-2xl border border-golddim/25 bg-silk2/50 p-7 text-left transition-all duration-300 hover:border-gold/55 hover:bg-silk2/80 hover:shadow-[0_0_36px_rgba(201,164,92,0.18)]"
              >
                <p className="font-serif text-[21px] font-bold tracking-[0.18em] text-goldbright">藏经阁</p>
                <p className="mt-3 flex-1 text-[13px] leading-[2] tracking-[0.06em] text-silkmuted">
                  十九部公版典籍 · 典藏电子书
                </p>
                <span className="mt-6 inline-flex self-end text-golddim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-goldbright">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </button>
            </motion.div>

            {/* ② 术 · 五运六气 → 页内 S2.6 */}
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.16, ease: easeOut }}
            >
              <button
                type="button"
                onClick={() =>
                  document.getElementById('wiki-yunqi')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="group flex h-full w-full flex-col rounded-2xl border border-golddim/25 bg-silk2/50 p-7 text-left transition-all duration-300 hover:border-gold/55 hover:bg-silk2/80 hover:shadow-[0_0_36px_rgba(201,164,92,0.18)]"
              >
                <p className="font-serif text-[21px] font-bold tracking-[0.18em] text-goldbright">术</p>
                <p className="mt-3 flex-1 text-[13px] leading-[2] tracking-[0.06em] text-silkmuted">
                  五运六气——干支推年度气候节律与养生方向
                </p>
                <span className="mt-6 inline-flex self-end text-golddim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-goldbright">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </button>
            </motion.div>

            {/* ③ 宝 · 百宝袋 → /toolkit */}
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.26, ease: easeOut }}
            >
              <Link
                to="/toolkit"
                className="group flex h-full w-full flex-col rounded-2xl border border-golddim/25 bg-silk2/50 p-7 transition-all duration-300 hover:border-gold/55 hover:bg-silk2/80 hover:shadow-[0_0_36px_rgba(201,164,92,0.18)]"
              >
                <p className="font-serif text-[21px] font-bold tracking-[0.18em] text-goldbright">宝</p>
                <p className="mt-3 flex-1 text-[13px] leading-[2] tracking-[0.06em] text-silkmuted">
                  百宝袋——顺手的小工具与收藏
                </p>
                <span className="mt-6 inline-flex self-end text-golddim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-goldbright">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- 页面 ---------------- */

export default function Wiki() {
  const [cat, setCat] = useState<CatFilter>('全部')
  const [opened, setOpened] = useState<Book | null>(null)

  usePageMeta(
    '藏宝阁 · 紫府',
    '紫府藏宝阁——宝·术·藏经阁三分：典藏电子书（公版典籍原文节选）、术数参详、百宝袋，句有出处、可溯源查阅。',
  )

  const list = useMemo(() => (cat === '全部' ? BOOKS : BOOKS.filter((b) => b.category === cat)), [cat])

  return (
    <div>
      {/* S1 · PageHero */}
      <PageHero
        breadcrumb="藏宝阁"
        glyph="宝"
        title="藏宝阁"
        latin="Treasure Library"
        subtitle="宝 · 术 · 藏经阁，三分一阁——典藏电子书在此，句有出处，方敢落笔"
        pool={HERO_POOL}
        minH="min-h-[38vh]"
      />

      {/* S1.5 · 宝 · 术 · 藏经阁导航卡（五运六气锚点 + 今日盘路由） */}
      <ThreeHallsNav />

      {/* 深 → 浅 过渡 */}
      <div className="zf-fade-to-silk h-[160px]" />

      {/* S2 · 类别筛选 + 书目网格 */}
      <section id="wiki-books" className="relative bg-silk pb-28 pt-16 scroll-mt-16">
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

          <motion.div
            layout
            className="mt-12 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            <AnimatePresence mode="popLayout">
              {list.map((book) => (
                <BookCard key={book.id} book={book} onOpen={() => setOpened(book)} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* 书架板（装饰基线） */}
          <div
            aria-hidden
            className="mx-auto mt-4 h-[3px] w-full max-w-[1000px] rounded-full bg-gradient-to-r from-golddim/0 via-golddim/45 to-golddim/0"
          />
        </div>
      </section>

      {/* S2.5 · 术语·说人话（课题学习沉淀的通俗词条） */}
      <section className="relative bg-silk pb-28 pt-4">
        <div className="zf-container">
          <SectionHeading
            eyebrow="Plain Terms"
            title="术语 · 说人话"
            sub="命理行话，一句人话讲明白——不懂术语，也能看懂自己的盘"
            className="mb-10"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(PLAIN_TERMS).map(([term, text]) => (
              <div key={term} className="rounded-xl border border-golddim/25 bg-silk2 p-5">
                <p className="font-serif text-[16px] font-bold tracking-[0.12em] text-golddim">{term}</p>
                <p className="mt-2 text-[13px] leading-[1.9] text-inktext">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* S2.6 · 五运六气（运气学说通识 + 当年示例） */}
      <section id="wiki-yunqi" className="relative bg-silk pb-28 pt-4">
        <div className="zf-container">
          <SectionHeading
            eyebrow="Yun Qi"
            title="五运六气"
            sub="古人以干支推年度气候节律与养生方向——中运、司天、在泉三者相参"
            className="mb-10"
          />
          {/* 当年示例 */}
          {(() => {
            const nowYear = new Date().getFullYear()
            const gan = '甲乙丙丁戊己庚辛壬癸'[(nowYear - 4) % 10]
            const zhi = '子丑寅卯辰巳午未申酉戌亥'[(nowYear - 4) % 12]
            const r = yunQiOf(`${gan}${zhi}`)
            return (
              <div className="mx-auto mb-8 max-w-3xl rounded-xl border border-gold/30 bg-deep p-6 text-center">
                <p className="font-serif text-[17px] font-bold tracking-[0.12em] text-goldbright">
                  今年 · {nowYear}（{gan}{zhi}）年运气
                </p>
                <p className="mt-3 text-[14px] leading-[2] text-silktext">
                  中运：{r.zhongYun} ｜ 司天：{r.siTian} ｜ 在泉：{r.zaiQuan}
                </p>
                <p className="mt-2 text-[12.5px] leading-[1.9] text-silkmuted">{r.plain}</p>
              </div>
            )
          })()}
          {/* 框架五卡 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {YUNQI_FRAMEWORK.map((f) => (
              <div key={f.title} className="rounded-xl border border-golddim/25 bg-silk2 p-5">
                <p className="font-serif text-[15px] font-bold tracking-[0.12em] text-golddim">{f.title}</p>
                <p className="mt-2 text-[13px] leading-[1.9] text-inktext">{f.text}</p>
              </div>
            ))}
            {/* 十二长生速查 */}
            <div className="rounded-xl border border-golddim/25 bg-silk2 p-5 md:col-span-2">
              <p className="font-serif text-[15px] font-bold tracking-[0.12em] text-golddim">十二长生速查（甲木例）</p>
              <p className="mt-2 text-[13px] leading-[2.1] text-inktext">
                {Object.entries(CHANGSHENG_JIA)
                  .map(([zhi, stage]) => `${zhi}＝${stage}`)
                  .join('　')}
              </p>
              <p className="mt-2 border-t border-golddim/15 pt-2 text-[12px] leading-[1.9] text-inkmuted">{CHANGSHENG_MNEMONIC}</p>
            </div>
          </div>
        </div>
      </section>

      {/* S3 · 典籍节选 Drawer */}
      <BookDrawer book={opened} onClose={() => setOpened(null)} />
    </div>
  )
}
