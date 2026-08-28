import { useState } from 'react'
import { useLocation } from 'react-router'
import { MessageSquarePlus, Loader2, CheckCircle2 } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useDeployInfo } from '@/hooks/useDeployInfo'

const FEATURES = [
  { value: 'bug', label: '问题反馈' },
  { value: 'suggestion', label: '功能建议' },
  { value: 'algorithm', label: '算法疑问' },
  { value: 'visual', label: '视觉问题' },
  { value: 'mobile', label: '移动端问题' },
  { value: 'data', label: '数据错误' },
  { value: 'interaction', label: '按钮无法使用' },
] as const

const SEVERITIES = [
  { value: 'P0', label: 'P0 · 阻断（无法使用）' },
  { value: 'P1', label: 'P1 · 严重（结果错误）' },
  { value: 'P2', label: 'P2 · 一般（体验受损）' },
  { value: 'P3', label: 'P3 · 建议（锦上添花）' },
] as const

/**
 * 反馈入口（浮动按钮 + 表单弹窗）。
 * 自动采集当前路由 / UA / 视口；commitSha 由服务端注入，不自报。
 * 游客也可提交（预览环境需要低门槛收集意见）。
 */
export default function FeedbackWidget() {
  const location = useLocation()
  const deploy = useDeployInfo()
  const [open, setOpen] = useState(false)
  const [feature, setFeature] = useState<string>('bug')
  const [severity, setSeverity] = useState<string>('P2')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState('')
  const [expected, setExpected] = useState('')
  const [actual, setActual] = useState('')
  const [doneId, setDoneId] = useState<number | null>(null)

  const submit = trpc.feedback.submit.useMutation({
    onSuccess: (data) => {
      setDoneId(data.feedbackId)
      setTitle('')
      setDescription('')
      setSteps('')
    },
  })

  const canSubmit = title.trim().length >= 2 && description.trim().length >= 5 && !submit.isPending

  const handleSubmit = () => {
    if (!canSubmit) return
    submit.mutate({
      route: location.pathname,
      feature: feature as (typeof FEATURES)[number]['value'],
      severity: severity as (typeof SEVERITIES)[number]['value'],
      title: title.trim(),
      description: description.trim(),
      stepsToReproduce: steps.trim() || undefined,
      expectedResult: expected.trim() || undefined,
      actualResult: actual.trim() || undefined,
      browser: navigator.userAgent.slice(0, 250),
      device: `${window.innerWidth}x${window.innerHeight}`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="提交反馈"
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-deep2/95 text-sm text-goldbright shadow-lg backdrop-blur transition hover:bg-deep3 sm:bottom-24 sm:left-5 sm:h-11 sm:w-auto sm:gap-2 sm:px-4"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">反馈</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>问题反馈 · 功能建议</DialogTitle>
          <DialogDescription>
            每条意见都会绑定当前页面、版本号（{deploy?.commitSha ?? '…'}）与设备信息，便于按版本归类修复。
            <span className="mt-1 block text-xs text-amber-600">
              请勿填写生辰原始数据——排盘问题请提供命盘编号（#chartId）。
            </span>
          </DialogDescription>
        </DialogHeader>

        {doneId !== null ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <p className="font-medium">反馈已记录（#{doneId}）</p>
            <p className="text-sm text-muted-foreground">感谢参谋，我们会按严重度分类处理。</p>
            <button
              type="button"
              className="mt-2 rounded-full border border-gold/40 px-5 py-2 text-sm text-gold"
              onClick={() => {
                setDoneId(null)
                setOpen(false)
              }}
            >
              完成
            </button>
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="fb-feature">分类</Label>
                <select
                  id="fb-feature"
                  value={feature}
                  onChange={(e) => setFeature(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {FEATURES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fb-severity">严重度</Label>
                <select
                  id="fb-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fb-title">标题</Label>
              <Input
                id="fb-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="一句话说明问题"
                maxLength={128}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fb-desc">详细描述</Label>
              <Textarea
                id="fb-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="发生了什么？你期望的结果是什么？"
                rows={4}
                maxLength={4000}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fb-steps">复现步骤（可选）</Label>
              <Textarea
                id="fb-steps"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="1. 打开… 2. 点击… 3. 看到…"
                rows={2}
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="fb-expected">期望结果（可选）</Label>
                <Textarea id="fb-expected" value={expected} onChange={(e) => setExpected(e.target.value)} rows={2} maxLength={1000} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fb-actual">实际结果（可选）</Label>
                <Textarea id="fb-actual" value={actual} onChange={(e) => setActual(e.target.value)} rows={2} maxLength={1000} />
              </div>
            </div>

            {submit.isError && (
              <p className="text-sm text-red-600">{submit.error.message}</p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                当前页面 {location.pathname} · 版本 {deploy?.commitSha ?? '…'}
              </span>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-gold px-5 text-sm font-medium text-deep transition disabled:opacity-40"
              >
                {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                提交反馈
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
