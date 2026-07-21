import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GhostButton } from '@/components/Buttons'

type DemoDialogProps = {
  /** 触发按钮文案，如「详参星命 · 12 灵签」 */
  trigger: string
  /** 弹窗标题，如「七政四余 · 详参星命」 */
  title: string
  children?: ReactNode
}

/** 「详参 · N 灵签」演示弹窗：说明 mock 版边界，正式版按次扣灵签 */
export default function DemoDialog({ trigger, title, children }: DemoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <GhostButton>{trigger}</GhostButton>
      </DialogTrigger>
      <DialogContent className="border-gold/25 bg-deep2 text-silktext sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-[19px] tracking-[0.08em] text-goldbright">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-[1.9] text-silkmuted">
            演示环境 · 不消耗灵签
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-gold/15 bg-deep3/60 px-5 py-4 text-[13.5px] leading-[2] text-silktext">
          {children ?? (
            <p>
              当前为排盘演示：盘面由确定性 mock 生成，用于体验完整交互流程。
              正式版将以真实星历 / 历法推算，并由 AI 逐句引经参详，每次详参消耗
              <span className="mx-1 font-serif font-bold text-goldbright">12</span>
              灵签。
            </p>
          )}
        </div>
        <DialogFooter>
          <p className="w-full text-center text-[12px] tracking-[0.1em] text-silkmuted/70">
            古籍数字化 · AI 参详 — 仅供文化研究与体验
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
