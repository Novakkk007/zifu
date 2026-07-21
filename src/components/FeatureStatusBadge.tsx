import { FlaskConical, Ruler } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================
 * 全站统一「功能真实度标注」：金色边框小条，置于页首，不遮挡内容。
 * - approx：当前为近似排算，尚未接入完整专业历表服务
 * - demo：  当前为演示模式，尚未完成服务端真实计算
 * ============================================================ */

const CONF = {
  approx: {
    icon: Ruler,
    text: '当前为近似排算，尚未接入完整专业历表服务',
  },
  demo: {
    icon: FlaskConical,
    text: '当前为演示模式，尚未完成服务端真实计算',
  },
} as const

export default function FeatureStatusBadge({
  kind,
  text,
  className,
}: {
  kind: keyof typeof CONF
  /** 覆盖默认文案 */
  text?: string
  className?: string
}) {
  const conf = CONF[kind]
  const Icon = conf.icon
  return (
    <div
      role="note"
      className={cn(
        'zf-container pt-5',
        className,
      )}
    >
      <p className="inline-flex max-w-full items-center gap-2 rounded-lg border border-gold/50 bg-silk px-3.5 py-2 font-sans text-[12px] leading-[1.6] tracking-[0.06em] text-golddim">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{text ?? conf.text}</span>
      </p>
    </div>
  )
}
