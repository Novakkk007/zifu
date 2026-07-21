import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================
 * 紫府 v6 输入框：label / hint / error（图标+文字）/ focus 金环
 * ============================================================ */

export type InputProps = {
  label?: ReactNode
  hint?: string
  /** 错误文案；传入即进入 error 态（红环 + 图标 + 文字 + aria-invalid） */
  error?: string
  wrapperClassName?: string
} & InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, wrapperClassName, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = error ? errorId : hint ? hintId : undefined
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-11 w-full rounded-lg border bg-silk px-4 font-sans text-[14.5px] text-inktext outline-none transition-shadow placeholder:text-inkmuted/70',
          error
            ? 'border-zifured/70 focus:border-zifured focus:ring-2 focus:ring-zifured/30'
            : 'border-golddim/30 focus:border-gold/60 focus:ring-2 focus:ring-gold/30',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[12px] text-zifured">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="mt-1.5 text-[12px] text-inkmuted">
            {hint}
          </p>
        )
      )}
    </div>
  )
})
