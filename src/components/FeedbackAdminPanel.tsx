import { Inbox } from 'lucide-react'
import { trpc } from '@/providers/trpc'

const FEATURE_LABEL: Record<string, string> = {
  bug: '问题反馈',
  suggestion: '功能建议',
  algorithm: '算法疑问',
  visual: '视觉问题',
  mobile: '移动端问题',
  data: '数据错误',
  interaction: '按钮无法使用',
}

const SEVERITY_COLOR: Record<string, string> = {
  P0: 'text-red-600 border-red-300',
  P1: 'text-orange-600 border-orange-300',
  P2: 'text-amber-600 border-amber-300',
  P3: 'text-sky-600 border-sky-300',
}

/**
 * 反馈列表（管理员）。服务端 adminQuery 强制鉴权：
 * 非管理员调用报 FORBIDDEN，此处静默隐藏整个面板。
 */
export default function FeedbackAdminPanel() {
  const q = trpc.feedback.list.useQuery({ limit: 100 }, { retry: false })
  if (q.isError || !q.data) return null

  return (
    <section className="mt-10">
      <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-inktext">
        <Inbox className="h-5 w-5 text-gold" />
        反馈收件箱
        <span className="text-sm font-normal text-inkmuted">（{q.data.length} 条，按时间倒序）</span>
      </h2>
      {q.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gold/30 p-6 text-center text-sm text-inkmuted">
          暂无反馈
        </p>
      ) : (
        <ul className="space-y-3">
          {q.data.map((f) => (
            <li key={f.id} className="rounded-xl border border-gold/25 bg-silk2 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full border px-2 py-0.5 font-semibold ${SEVERITY_COLOR[f.severity] ?? ''}`}>
                  {f.severity}
                </span>
                <span className="rounded-full bg-deep px-2 py-0.5 text-goldbright">
                  {FEATURE_LABEL[f.feature] ?? f.feature}
                </span>
                <span className="text-inkmuted">{f.route}</span>
                <span className="text-inkmuted">版本 {f.commitSha ?? '—'}</span>
                {f.algorithmVersion && <span className="text-inkmuted">{f.algorithmVersion}</span>}
                <span className="ml-auto text-inkmuted">
                  #{f.id} · {f.device ?? ''} · {new Date(f.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <p className="mt-2 font-medium text-inktext">{f.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-inkmuted">{f.description}</p>
              {f.stepsToReproduce && (
                <p className="mt-1 whitespace-pre-wrap text-xs text-inkmuted">
                  复现：{f.stepsToReproduce}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
