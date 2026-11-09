import type { ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { useDeployInfo } from '@/hooks/useDeployInfo'
import { cn } from '@/lib/utils'

/**
 * 预览横幅的视觉条。不请求后端。
 * 默认 PreviewBanner 仍只在 /healthz 报告 preview 时出现。
 */
export function PreviewBannerBar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-center justify-center gap-2 bg-amber-500/95 px-3 py-1.5 text-center text-[12.5px] font-medium tracking-wide text-amber-950',
        className,
      )}
    >
      <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/**
 * 预览环境横幅：仅当后端 /healthz 报告 APP_ENV=preview 时显示。
 * 让每位参谋者明确知道：这是预览环境，数据与生产隔离，支付已关闭。
 */
export default function PreviewBanner() {
  const deploy = useDeployInfo()
  if (!deploy?.preview) return null
  return (
    <PreviewBannerBar>
      预览环境 · 数据与正式环境隔离，支付已关闭 · 版本 {deploy.commitSha}
    </PreviewBannerBar>
  )
}
