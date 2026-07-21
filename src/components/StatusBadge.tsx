import type { ReactNode } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Radio,
  RefreshCcw,
  Ruler,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================
 * 紫府 v6 状态徽章：六态，图标 + 文字双编码（不只靠颜色）
 * live     实时/真实计算（绿）
 * fallback 降级模板（蓝）
 * demo     演示模式（金）
 * approx   近似排算（金-描边）
 * success  成功（绿 ✓）
 * error    失败（红 ⚠）
 * ============================================================ */

export type StatusKind = 'live' | 'fallback' | 'demo' | 'approx' | 'success' | 'error'

const KIND_CONF: Record<
  StatusKind,
  { label: string; icon: typeof Radio; cls: string }
> = {
  live: {
    label: '实时计算',
    icon: Radio,
    cls: 'border-zifugreen/50 bg-zifugreen/10 text-zifugreen',
  },
  fallback: {
    label: '降级模板',
    icon: RefreshCcw,
    cls: 'border-zifublue/50 bg-zifublue/10 text-zifublue',
  },
  demo: {
    label: '演示模式',
    icon: FlaskConical,
    cls: 'border-gold/60 bg-gold/10 text-golddim',
  },
  approx: {
    label: '近似排算',
    icon: Ruler,
    cls: 'border-gold/60 bg-transparent text-golddim',
  },
  success: {
    label: '成功',
    icon: CheckCircle2,
    cls: 'border-zifugreen/50 bg-zifugreen/10 text-zifugreen',
  },
  error: {
    label: '失败',
    icon: AlertCircle,
    cls: 'border-zifured/50 bg-zifured/10 text-zifured',
  },
}

export function StatusBadge({
  kind,
  label,
  className,
}: {
  kind: StatusKind
  /** 覆盖默认文案 */
  label?: ReactNode
  className?: string
}) {
  const conf = KIND_CONF[kind]
  const Icon = conf.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-sans text-[11.5px] font-medium tracking-[0.08em]',
        conf.cls,
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label ?? conf.label}
    </span>
  )
}
