import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { lookupGlossary } from "@contracts/glossary"
import { BookOpen, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface GlossaryTooltipProps {
  term: string
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
}

/**
 * 术语悬浮释义卡片
 *
 * 用法：
 * ```tsx
 * <GlossaryTooltip term="正官">
 *   <span className="underline decoration-dotted cursor-help">正官</span>
 * </GlossaryTooltip>
 * ```
 *
 * 红线：不出现绝对断语（数据源 glossary.ts 已审计），引典只引公版原文。
 */
export default function GlossaryTooltip({ term, children, side = "top" }: GlossaryTooltipProps) {
  const entry = lookupGlossary(term)
  if (!entry) return <>{children}</>

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span
          className="underline decoration-gold/40 decoration-dotted underline-offset-4 cursor-help hover:decoration-gold transition-colors"
          tabIndex={0}
          role="button"
          aria-describedby={`glossary-${term}`}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        id={`glossary-${term}`}
        side={side}
        align="center"
        className={cn(
          "w-80 p-0 border-gold/30 bg-deep2/95 backdrop-blur-xl",
          "shadow-[0_20px_60px_-20px_rgba(199,162,58,.25)]",
        )}
      >
        <div className="p-4 space-y-3">
          {/* header */}
          <div className="flex items-center justify-between">
            <span className="font-serif text-lg font-bold text-goldbright tracking-wider">
              {entry.term}
            </span>
            <BookOpen className="w-3.5 h-3.5 text-golddim" />
          </div>

          {/* short */}
          <p className="text-sm text-silktext leading-relaxed">
            {entry.short}
          </p>

          {/* detail folded */}
          <details className="group">
            <summary className="text-xs text-golddim cursor-pointer hover:text-gold transition-colors list-none flex items-center gap-1">
              <span className="group-open:hidden">▶ 详解</span>
              <span className="hidden group-open:inline">▼ 收起</span>
            </summary>
            <p className="mt-2 text-xs text-silkmuted leading-relaxed">
              {entry.detail}
            </p>
          </details>

          {/* source citation */}
          {entry.source && (
            <div className="pt-2 border-t border-gold/15">
              <p className="text-[11px] text-golddim italic leading-relaxed flex items-start gap-1">
                <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
                《{entry.source.book}》：{entry.source.quote}
              </p>
            </div>
          )}

          {/* related */}
          {entry.related.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {entry.related.slice(0, 6).map((rel) => (
                <span
                  key={rel}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-gold/20 text-silkmuted"
                >
                  {rel}
                </span>
              ))}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
