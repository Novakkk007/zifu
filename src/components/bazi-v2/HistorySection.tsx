/**
 * 历史记录区（登录可见）：trpc.bazi.history 列表 / 回填 / 删除（invalidate）。
 * 未登录显示登录引导卡。
 */
import type { BaziChartV2 } from '@contracts/bazi-core'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'
import { DeepButton } from '@/components/Buttons'

type HistoryRow = {
  id: number
  title: string
  chartType: string
  input: unknown
  result: unknown
  createdAt: string | Date
}

export default function HistorySection({
  onRestore,
}: {
  onRestore: (chart: BaziChartV2, title: string) => void
}) {
  const { user, isLoading: authLoading } = useAuth()
  const utils = trpc.useUtils()
  const history = trpc.bazi.history.useQuery(undefined, { enabled: !!user, retry: false })
  const remove = trpc.bazi.remove.useMutation({
    onSuccess: async () => {
      await utils.bazi.history.invalidate()
    },
  })

  if (authLoading) {
    return <div className="mx-auto max-w-[860px] rounded-xl border border-golddim/25 bg-silk2 p-10 text-center text-[13px] text-inkmuted shadow-card">载入登录态…</div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-[860px] rounded-xl border border-golddim/25 bg-silk2 p-10 text-center shadow-card">
        <p className="font-serif text-[16px] font-bold tracking-[0.12em] text-inktext">排盘记录</p>
        <p className="mx-auto mt-3 max-w-[420px] text-[13px] leading-[1.9] text-inkmuted">
          登录后，每次排盘自动存档（含规则版本），可随时回填查看、对比与删除。
        </p>
        <DeepButton to={LOGIN_PATH} className="mt-6">
          登录后保存排盘记录
        </DeepButton>
      </div>
    )
  }

  const rows = ((history.data ?? []) as HistoryRow[]).filter((r) => r.chartType === 'bazi')

  return (
    <div className="mx-auto max-w-[860px] rounded-xl border border-golddim/25 bg-silk2 p-7 shadow-card md:p-8">
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-[16px] font-bold tracking-[0.12em] text-inktext">排盘记录</p>
        <span className="text-[11.5px] text-inkmuted">{rows.length} / 50 条</span>
      </div>

      {history.isLoading ? (
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-silk" />
          ))}
        </div>
      ) : history.isError ? (
        <p className="mt-5 text-center text-[13px] text-[#B04A3A]">记录载入失败，请稍后重试。</p>
      ) : rows.length === 0 ? (
        <p className="mt-5 text-center text-[13px] text-inkmuted">
          暂无排盘记录 —— 完成一次排盘后自动存档。
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-golddim/15">
          {rows.map((r) => {
            const ruleset =
              r.result && typeof r.result === 'object' && 'rulesetVersion' in r.result
                ? String((r.result as { rulesetVersion?: string }).rulesetVersion ?? '')
                : ''
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3.5">
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onRestore(r.result as BaziChartV2, r.title)}
                  title="点击回填展示此盘"
                >
                  <p className="truncate font-serif text-[14.5px] font-bold text-inktext">
                    {r.title}
                    <span className="ml-2 rounded-full border border-golddim/30 px-2 py-0.5 align-middle font-sans text-[10.5px] font-normal tracking-[0.08em] text-inkmuted">
                      {r.chartType === 'bazi' ? '八字' : r.chartType}
                    </span>
                  </p>
                  <p className="mt-1 text-[11.5px] text-inkmuted">
                    {new Date(r.createdAt).toLocaleString('zh-CN', { hour12: false })}
                    {ruleset && <span className="ml-2">规则版本 {ruleset}</span>}
                  </p>
                </button>
                <button
                  onClick={() => remove.mutate({ id: r.id })}
                  disabled={remove.isPending}
                  className="rounded-full border border-golddim/30 px-3 py-1 text-[11.5px] text-inkmuted transition-colors hover:border-[#B04A3A]/60 hover:text-[#B04A3A] disabled:opacity-50"
                >
                  删除
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-4 text-center text-[11px] text-inkmuted">
        点击记录可回填展示；删除后立即生效且不可恢复。
      </p>
    </div>
  )
}
