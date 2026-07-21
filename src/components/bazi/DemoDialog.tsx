import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GoldButton } from '@/components/Buttons'

type DemoDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** 「演示模式 · 登录后消耗灵签」确认弹窗（两页复用） */
export default function DemoDialog({ open, onOpenChange, onConfirm }: DemoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-golddim/30 bg-silk sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-[19px] tracking-[0.1em] text-inktext">
            演示模式 · 登录后消耗灵签
          </DialogTitle>
          <DialogDescription className="pt-2 text-[13.5px] leading-[1.9] text-inkmuted">
            当前为教学演示：AI 参详输出为模板拼合的示例文字。注册登录后，
            每次正式参详消耗 9 灵签，锚定古籍原文逐句推演。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-golddim/40 px-6 py-2.5 font-sans text-[13.5px] tracking-[0.12em] text-inkmuted transition-colors hover:text-inktext"
          >
            再看看
          </button>
          <GoldButton
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            观看演示
          </GoldButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
