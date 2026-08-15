/**
 * 术语悬浮释义组件（方向 1+2：引擎释义系统）。
 *
 * 用法：<GlossaryTooltip term="正官">正官</GlossaryTooltip>
 * - hover / 键盘 focus 均可触发（radix tooltip 原生行为），弹出金墨风卡片：
 *   术语名 + 通识性释义 + 关联典籍链接（跳 /wiki 藏经阁）。
 * - term 在 glossary.json 查无此词时静默降级为纯文本：
 *   不报错、不渲染空卡片、不影响布局。
 *
 * 红线：释义数据（glossary.json）与典籍映射（glossary-bridge）仅供展示层使用，
 * 严禁进入 AI prompt 链路（由 api/glossary-wire.test.ts 静态固化）。
 */
import { type ReactNode } from 'react'
import { Link } from 'react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BOOKS } from '@/components/content/books'
import { cn } from '@/lib/utils'
import raw from '@/data/glossary.json?raw'

export interface GlossaryEntry {
  /** 通识性定义（不含典籍原文引用） */
  def: string
  /** 关联典籍 ID（books.json 中的 id，映射抄自 contracts/glossary-bridge） */
  books: string[]
}

/** 与 books.ts 相同原因（tsconfig 未开 resolveJsonModule），经 ?raw 内联解析 */
export const GLOSSARY: Record<string, GlossaryEntry> = JSON.parse(raw) as Record<
  string,
  GlossaryEntry
>

type Props = {
  /** 查询 glossary.json 的术语 key */
  term: string
  /** 展示文本（缺省为 term 本身） */
  children?: ReactNode
  /** 追加到触发元素的类名（继承宿主字号/颜色时用） */
  className?: string
}

export default function GlossaryTooltip({ term, children, className }: Props) {
  const entry = GLOSSARY[term]
  // 查无此词：静默渲染纯文本（保留调用方给的类名以免样式断层，但不带任何悬浮行为）
  if (!entry) {
    return className ? (
      <span className={className}>{children ?? term}</span>
    ) : (
      <>{children ?? term}</>
    )
  }

  const books = entry.books
    .map((id) => BOOKS.find((b) => b.id === id))
    .filter((b): b is (typeof BOOKS)[number] => b !== undefined)

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          // button UA 样式不继承宿主排版，显式继承以贴合干支大字/表格小字等场景
          'cursor-help touch-manipulation bg-transparent p-0 text-left [color:inherit] [font:inherit] [letter-spacing:inherit] [line-height:inherit]',
          'underline decoration-dotted decoration-golddim/60 underline-offset-4 transition-[text-decoration-color]',
          'hover:decoration-golddim focus-visible:decoration-golddim focus-visible:outline-none',
          className,
        )}
      >
        {children ?? term}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="w-[280px] rounded-xl border border-gold/25 bg-deep2 px-5 py-4 shadow-card"
      >
        <p className="font-serif text-[15px] font-bold tracking-[0.12em] text-goldbright">
          {term}
        </p>
        <p className="mt-2 text-[12.5px] leading-[1.9] text-silktext">{entry.def}</p>
        {books.length > 0 && (
          <div className="mt-3 border-t border-gold/15 pt-2.5">
            <p className="text-[11px] tracking-[0.14em] text-silkmuted">相关典籍 · 藏经阁</p>
            <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {books.map((b) => (
                <li key={b.id}>
                  <Link
                    to="/wiki"
                    className="text-[12px] text-goldbright/90 underline decoration-gold/40 underline-offset-4 transition-colors hover:text-goldbright"
                  >
                    《{b.title}》
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
