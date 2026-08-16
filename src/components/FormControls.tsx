import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const fieldBase =
  'h-11 w-full rounded-lg border border-golddim/30 bg-silk px-4 font-sans text-[14.5px] text-inktext outline-none transition-shadow placeholder:text-inkmuted/70 focus:border-gold/60 focus:ring-2 focus:ring-gold/30'

type FieldProps = {
  label?: ReactNode
  hint?: string
  className?: string
} & InputHTMLAttributes<HTMLInputElement>

/** 功能页统一输入框：绢米底 + 金边 + focus 金环 */
export function FormInput({ label, hint, className, id, ...rest }: FieldProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted"
        >
          {label}
        </label>
      )}
      <input id={id} className={fieldBase} {...rest} />
      {hint && <p className="mt-1.5 text-[12px] text-inkmuted">{hint}</p>}
    </div>
  )
}

type SelectProps = {
  label?: ReactNode
  className?: string
  children: ReactNode
} & SelectHTMLAttributes<HTMLSelectElement>

/** 功能页统一选择框 */
export function FormSelect({ label, className, id, children, ...rest }: SelectProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted"
        >
          {label}
        </label>
      )}
      <select id={id} className={cn(fieldBase, 'appearance-none pr-10')} {...rest}>
        {children}
      </select>
    </div>
  )
}

type SegmentedProps<T extends string> = {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
  id?: string
}

/** segmented 胶囊组：选中项深底绢字，Framer layoutId 滑动指示 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  id = 'segmented',
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-golddim/30 bg-silk2 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative min-h-11 rounded-full px-5 py-2 font-sans text-[13.5px] font-medium tracking-[0.08em] transition-colors sm:min-h-0',
              active ? 'text-silk' : 'text-inkmuted hover:text-inktext',
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-pill`}
                className="absolute inset-0 rounded-full bg-deep"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
