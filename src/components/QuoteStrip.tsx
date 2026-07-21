import { cn } from '@/lib/utils'

type QuoteStripProps = {
  book: string
  quote: string
  source?: string
  className?: string
}

/** 古籍引文条（深底区块内）：金色书名 + Serif 引文 + 出处小字 + 左 3px 金竖线 */
export default function QuoteStrip({ book, quote, source, className }: QuoteStripProps) {
  return (
    <blockquote
      className={cn(
        'rounded-r-xl border-l-[3px] border-gold bg-deep2/60 px-7 py-6',
        className,
      )}
    >
      <p className="font-serif text-[16px] leading-[2.1] text-goldbright">
        <span className="mr-2 font-semibold text-gold">《{book}》</span>
        {quote}
      </p>
      {source && (
        <footer className="mt-3 text-[12.5px] tracking-[0.08em] text-silkmuted">
          —— {source}
        </footer>
      )}
    </blockquote>
  )
}
