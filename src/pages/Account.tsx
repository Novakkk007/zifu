import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Coins, ScrollText, ShieldAlert, UserRound, Wallet } from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { hasDevice, myWallet, rechargeLingqian, setNick } from '@/lib/auth-client'
import type { WalletInfo } from '@/lib/auth-client'
import { setPageMeta } from '@/lib/pageMeta'
import { useAuth } from '@/hooks/useAuth'
import { usePaymentEnabled, RECHARGE_CLOSED_HINT } from '@/hooks/usePaymentEnabled'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'
import { ZifuButton } from '@/components/Buttons'
import { Modal } from '@/components/Modal'
import { Input } from '@/components/Input'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import FeedbackAdminPanel from '@/components/FeedbackAdminPanel'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { cn } from '@/lib/utils'

const CHART_TYPE_LABEL: Record<string, string> = {
  bazi: '八字排盘',
  hepan: '八字合盘',
  liuyao: '六爻',
  ziwei: '紫微斗数',
  qizheng: '七政四余',
  qimen: '奇门遁甲',
  daliuren: '大六壬',
  hecan: '三术合参',
}

const TX_REASON_LABEL: Record<string, string> = {
  recharge: '充值',
  consume: '消费',
  refund: '退款',
  adjust: '调整',
  grant: '赠送',
}

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  created: { label: '待支付', cls: 'border-gold/60 text-golddim' },
  paid: { label: '已支付', cls: 'border-zifugreen/50 text-zifugreen' },
  failed: { label: '已失败', cls: 'border-zifured/50 text-zifured' },
  refunded: { label: '已退款', cls: 'border-zifublue/50 text-zifublue' },
  cancelled: { label: '已取消', cls: 'border-inkmuted/40 text-inkmuted' },
}

function fmtTime(d: Date | string) {
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleString('zh-CN', { hour12: false })
}

function truncateMiddle(s: string, head = 8, tail = 6) {
  if (s.length <= head + tail + 3) return s
  return `${s.slice(0, head)}…${s.slice(-tail)}`
}

const RECHARGE_PRESETS = [
  { yuan: 10, fen: 1000 },
  { yuan: 30, fen: 3000 },
  { yuan: 68, fen: 6800 },
]

export default function Account() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading } = useAuth()
  const paymentEnabled = usePaymentEnabled()
  const utils = trpc.useUtils()

  /* ===== 生产钱包（匿名设备账号，CF Worker DO 记账）===== */
  const [dev, setDev] = useState<boolean>(() => hasDevice())
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [rechargeMsg, setRechargeMsg] = useState<string | null>(null)

  const refreshWallet = useCallback(async () => {
    if (!hasDevice()) return
    setWalletLoading(true)
    try {
      setWalletInfo(await myWallet())
    } finally {
      setWalletLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!dev) return
    let alive = true
    myWallet()
      .then((w) => {
        if (alive) setWalletInfo(w)
      })
      .finally(() => {
        if (alive) setWalletLoading(false)
      })
    return () => {
      alive = false
    }
  }, [dev])

  useEffect(() => {
    setPageMeta(
      '用户中心 · 紫府',
      '紫府用户中心——灵签钱包与个人资料管理。',
    );
  }, [])

  const enabled = isAuthenticated
  const wallet = trpc.billing.wallet.useQuery(undefined, { enabled: enabled && !dev, retry: false })
  const orders = trpc.billing.orders.useQuery(undefined, { enabled: enabled && !dev, retry: false })
  const history = trpc.bazi.history.useQuery(undefined, { enabled: enabled && !dev, retry: false })

  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [rechargeStatus, setRechargeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  )
  const [rechargeNote, setRechargeNote] = useState<string | null>(null)
  const recharge = trpc.billing.recharge.useMutation({
    onSuccess: async (data) => {
      setRechargeStatus('success')
      setRechargeNote(`订单 ${data.order.orderNo} 已创建（待支付）。${data.notice}`)
      await Promise.all([utils.billing.wallet.invalidate(), utils.billing.orders.invalidate()])
    },
    onError: (err) => {
      setRechargeStatus('error')
      setRechargeNote(err.message)
    },
  })

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const deleteAccount = trpc.account.deleteAccount.useMutation({
    onSuccess: async () => {
      await utils.invalidate()
      navigate('/', { replace: true })
    },
  })

  const canConfirmDelete = useMemo(() => deleteText.trim() === '确认删除', [deleteText])

  /* ===== 未登录/无设备：引导创建账页 ===== */
  if (!isLoading && !isAuthenticated && !dev) {
    return (
      <div className="zf-container flex min-h-[60dvh] items-center justify-center py-20">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle eyebrow="ACCOUNT">用户中心</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <UserRound className="h-10 w-10 text-golddim" aria-hidden />
            <p className="text-[14px] leading-[1.9] text-inkmuted">
              紫府账页：无需手机号与密码，本设备一键创建。
              <br />
              注册即赠 <b className="text-golddim">36 灵签</b>——用于解锁 AI 详批等深度服务。
            </p>
            <ZifuButton
              variant="foil"
              onClick={() => {
                void (async () => {
                  if (!hasDevice()) {
                    localStorage.setItem('zifu:deviceId', `zf-${Math.random().toString(36).slice(2, 14)}`)
                  }
                  setDev(true)
                  await refreshWallet()
                })()
              }}
            >
              创建 / 恢复我的账页
            </ZifuButton>
            <p className="text-[11.5px] leading-[1.7] text-inkmuted/70">
              账页数据存储于紫府服务器（灵签余额）；换设备可用「恢复账页」重新绑定。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-silk pb-24 pt-14 md:pt-20">
      <div className="zf-container flex flex-col gap-8">
        <header>
          <p className="font-latin text-[11px] font-medium tracking-[0.3em] text-golddim">
            ACCOUNT
          </p>
          <h1 className="mt-1 font-serif text-[30px] font-black tracking-[0.1em] text-inktext">
            用户中心
          </h1>
        </header>

        {/* ===== 资料卡 ===== */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle eyebrow="PROFILE">
              <span className="inline-flex items-center gap-2">
                <UserRound className="h-5 w-5 text-golddim" aria-hidden />
                我的资料
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !user ? (
              <LoadingState rows={3} />
            ) : (
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] tracking-[0.08em] text-inkmuted">昵称</dt>
                  <dd className="mt-0.5 font-sans text-[15px] text-inktext">
                    {user.name || '紫府同参'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] tracking-[0.08em] text-inkmuted">邮箱</dt>
                  <dd className="mt-0.5 font-sans text-[15px] text-inktext">
                    {user.email || '未绑定'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] tracking-[0.08em] text-inkmuted">Union ID</dt>
                  <dd
                    className="mt-0.5 break-all font-mono text-[13px] text-inktext"
                    title={user.unionId}
                  >
                    {truncateMiddle(user.unionId)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] tracking-[0.08em] text-inkmuted">注册时间</dt>
                  <dd className="mt-0.5 font-sans text-[15px] text-inktext">
                    {fmtTime(user.createdAt)}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        {/* ===== 灵签钱包 ===== */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle eyebrow="WALLET">
              <span className="inline-flex items-center gap-2">
                <Wallet className="h-5 w-5 text-golddim" aria-hidden />
                灵签钱包
              </span>
            </CardTitle>
            {paymentEnabled ? (
              <ZifuButton
                variant="foil"
                onClick={() => {
                  setRechargeStatus('idle')
                  setRechargeNote(null)
                  setRechargeOpen(true)
                }}
              >
                <Coins className="h-4 w-4" aria-hidden />
                充值
              </ZifuButton>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 px-3.5 py-1.5 text-[12px] tracking-[0.1em] text-inkmuted">
                <Coins className="h-3.5 w-3.5" aria-hidden />
                {RECHARGE_CLOSED_HINT}
              </span>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {dev ? (
              /* 生产钱包：CF Worker DO 记账 */
              walletLoading ? (
                <LoadingState rows={4} />
              ) : walletInfo?.error ? (
                <ErrorState description={walletInfo.error} onRetry={refreshWallet} retrying={walletLoading} />
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] tracking-[0.1em] text-inkmuted">灵签余额</span>
                    <span className="font-serif text-[34px] font-black leading-none text-golddim">
                      {walletInfo?.balance ?? 36}
                    </span>
                    <span className="text-[12px] text-inkmuted/70">灵签</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <ZifuButton
                      variant="foil"
                      onClick={() => {
                        void (async () => {
                          const r = await rechargeLingqian()
                          setRechargeMsg(r.ok ? `体验赠签 +36，当前 ${r.balance} 灵签` : (r.error ?? '充值暂不可用'))
                          await refreshWallet()
                        })()
                      }}
                    >
                      <Coins className="h-4 w-4" aria-hidden />
                      充值（体验赠签）
                    </ZifuButton>
                    <ZifuButton
                      variant="ghost"
                      onClick={() => {
                        const nick = window.prompt('设置昵称（最多 12 字）', walletInfo?.nick ?? '')
                        if (nick) {
                          void setNick(nick).then(refreshWallet)
                        }
                      }}
                    >
                      设置昵称
                    </ZifuButton>
                  </div>
                  {rechargeMsg && (
                    <p className="text-[12.5px] leading-[1.8] text-inkmuted">{rechargeMsg}</p>
                  )}
                  <p className="text-[11.5px] leading-[1.8] text-inkmuted/70">
                    详批类服务 9 灵签/次，扣减前必有确认提示。支付通道接入后，充值将支持微信/支付宝。
                  </p>
                </>
              )
            ) : wallet.isLoading ? (
              <LoadingState rows={4} />
            ) : wallet.isError ? (
              <ErrorState
                description="钱包信息加载失败，请重试。"
                onRetry={() => wallet.refetch()}
                retrying={wallet.isRefetching}
              />
            ) : wallet.data ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="bg-gradient-to-br from-goldbright to-gold bg-clip-text font-serif text-[36px] font-black leading-none text-transparent">
                    {wallet.data.balanceLingqian}
                  </span>
                  <span className="text-[13px] tracking-[0.1em] text-inkmuted">灵签余额</span>
                </div>
                {wallet.data.transactions.length === 0 ? (
                  <EmptyState title="暂无流水" description="充值或消费后，这里会记录每一笔变动。" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left font-sans text-[13px]">
                      <thead>
                        <tr className="border-b border-gold/15 text-[12px] tracking-[0.08em] text-inkmuted">
                          <th className="py-2 pr-4 font-medium">时间</th>
                          <th className="py-2 pr-4 font-medium">类型</th>
                          <th className="py-2 pr-4 font-medium">变动</th>
                          <th className="py-2 font-medium">余额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wallet.data.transactions.map((tx) => (
                          <tr key={String(tx.id)} className="border-b border-gold/10">
                            <td className="py-2.5 pr-4 text-inkmuted">{fmtTime(tx.createdAt)}</td>
                            <td className="py-2.5 pr-4 text-inktext">
                              {TX_REASON_LABEL[tx.reason] ?? tx.reason}
                            </td>
                            <td
                              className={cn(
                                'py-2.5 pr-4 font-medium',
                                tx.changeAmount >= 0 ? 'text-zifugreen' : 'text-zifured',
                              )}
                            >
                              {tx.changeAmount >= 0 ? '+' : ''}
                              {tx.changeAmount}
                            </td>
                            <td className="py-2.5 text-inktext">{tx.balanceAfter}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* ===== 我的订单 ===== */}
        <Card>
          <CardHeader>
            <CardTitle eyebrow="ORDERS">
              <span className="inline-flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-golddim" aria-hidden />
                我的订单
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.isLoading ? (
              <LoadingState rows={3} />
            ) : orders.isError ? (
              <ErrorState
                description="订单加载失败，请重试。"
                onRetry={() => orders.refetch()}
                retrying={orders.isRefetching}
              />
            ) : !orders.data || orders.data.length === 0 ? (
              <EmptyState title="暂无订单" description="充值下单后，订单会出现在这里。" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left font-sans text-[13px]">
                  <thead>
                    <tr className="border-b border-gold/15 text-[12px] tracking-[0.08em] text-inkmuted">
                      <th className="py-2 pr-4 font-medium">订单号</th>
                      <th className="py-2 pr-4 font-medium">金额</th>
                      <th className="py-2 pr-4 font-medium">灵签</th>
                      <th className="py-2 pr-4 font-medium">状态</th>
                      <th className="py-2 font-medium">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.data.map((o) => {
                      const st = ORDER_STATUS[o.status] ?? ORDER_STATUS.created
                      return (
                        <tr key={o.orderNo} className="border-b border-gold/10">
                          <td className="py-2.5 pr-4 font-mono text-[12px] text-inkmuted">
                            {o.orderNo}
                          </td>
                          <td className="py-2.5 pr-4 text-inktext">
                            ¥{(o.amountFen / 100).toFixed(2)}
                          </td>
                          <td className="py-2.5 pr-4 text-inktext">{o.lingqianAmount}</td>
                          <td className="py-2.5 pr-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border bg-transparent px-2.5 py-0.5 text-[11.5px] font-medium tracking-[0.08em]',
                                st.cls,
                              )}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                              {st.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-inkmuted">{fmtTime(o.createdAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== 我的命盘 ===== */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle eyebrow="CHARTS">我的命盘</CardTitle>
            <ZifuButton variant="secondary" to="/bazi">
              前往排盘
            </ZifuButton>
          </CardHeader>
          <CardContent>
            {history.isLoading ? (
              <LoadingState rows={3} />
            ) : history.isError ? (
              <ErrorState
                description="命盘记录加载失败，请重试。"
                onRetry={() => history.refetch()}
                retrying={history.isRefetching}
              />
            ) : !history.data || history.data.length === 0 ? (
              <EmptyState
                title="暂无命盘"
                description="完成一次排盘后，命盘会自动保存在这里。"
                action={
                  <ZifuButton variant="foil" to="/bazi">
                    立即排盘
                  </ZifuButton>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left font-sans text-[13px]">
                  <thead>
                    <tr className="border-b border-gold/15 text-[12px] tracking-[0.08em] text-inkmuted">
                      <th className="py-2 pr-4 font-medium">类型</th>
                      <th className="py-2 pr-4 font-medium">标题</th>
                      <th className="py-2 font-medium">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.slice(0, 10).map((c) => (
                      <tr key={c.id} className="border-b border-gold/10">
                        <td className="py-2.5 pr-4 text-inktext">
                          {CHART_TYPE_LABEL[c.chartType] ?? c.chartType}
                        </td>
                        <td className="py-2.5 pr-4 text-inktext">
                          <Link
                            to="/bazi"
                            className="underline decoration-gold/50 underline-offset-4 transition-colors hover:text-golddim"
                          >
                            {c.title || `#${c.id}`}
                          </Link>
                        </td>
                        <td className="py-2.5 text-inkmuted">{fmtTime(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== 危险区 ===== */}
        <Card className="border-zifured/40">
          <CardHeader>
            <CardTitle eyebrow="DANGER ZONE">
              <span className="inline-flex items-center gap-2 text-zifured">
                <ShieldAlert className="h-5 w-5" aria-hidden />
                危险区
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-[13px] leading-[1.8] text-inkmuted">
              删除账户将不可恢复地清除您的全部数据（命盘、钱包与流水、订单、AI
              参详记录）。此操作无法撤销。
            </p>
            <ZifuButton
              variant="danger"
              onClick={() => {
                setDeleteText('')
                setDeleteOpen(true)
              }}
            >
              删除账户
            </ZifuButton>
          </CardContent>
        </Card>

        {/* ===== 反馈收件箱（仅管理员可见，服务端强鉴权） ===== */}
        <FeedbackAdminPanel />
      </div>

      {/* ===== 充值说明弹层（支付渠道预留） ===== */}
      <Modal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        title="灵签充值"
        description="支付渠道预留：尚未接入真实支付，提交仅落「待支付」订单，不会扣款，也不会自动入账。"
        footer={
          <>
            <ZifuButton variant="ghost" onClick={() => setRechargeOpen(false)}>
              关闭
            </ZifuButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-[1.8] text-inkmuted">
            选择面额（1 元 = 10 灵签）。点击后将创建一笔 <b className="text-inktext">待支付</b>{' '}
            订单；待真实支付渠道接入并完成回调后，灵签才会到账。
          </p>
          <div className="flex flex-wrap gap-3">
            {RECHARGE_PRESETS.map((p) => (
              <ZifuButton
                key={p.yuan}
                variant="secondary"
                status={rechargeStatus === 'loading' ? 'loading' : 'idle'}
                onClick={() => {
                  setRechargeStatus('loading')
                  setRechargeNote(null)
                  recharge.mutate({
                    amountFen: p.fen,
                    idempotencyKey: crypto.randomUUID(),
                  })
                }}
              >
                ¥{p.yuan}（{p.yuan * 10} 签）
              </ZifuButton>
            ))}
          </div>
          {rechargeNote && (
            <p
              role="status"
              className={cn(
                'rounded-lg border px-3.5 py-2.5 text-[12.5px] leading-[1.7]',
                rechargeStatus === 'success'
                  ? 'border-zifugreen/40 bg-zifugreen/5 text-zifugreen'
                  : 'border-zifured/40 bg-zifured/5 text-zifured',
              )}
            >
              {rechargeNote}
            </p>
          )}
          <StatusBadge kind="approx" label="支付渠道预留 · 未接入真实支付" />
        </div>
      </Modal>

      {/* ===== 删除账户二次确认 ===== */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="确认删除账户？"
        description="此操作不可撤销。请输入「确认删除」以继续。"
        closeOnOverlay={false}
        footer={
          <>
            <ZifuButton variant="ghost" onClick={() => setDeleteOpen(false)}>
              取消
            </ZifuButton>
            <ZifuButton
              variant="danger"
              status={
                deleteAccount.isPending
                  ? 'loading'
                  : deleteAccount.isError
                    ? 'error'
                    : 'idle'
              }
              disabled={!canConfirmDelete}
              onClick={() => deleteAccount.mutate()}
            >
              永久删除
            </ZifuButton>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-[13px] leading-[1.8] text-inkmuted">
            将永久删除：全部命盘与版本、钱包与流水、订单与支付事件、AI 参详记录，并退出登录。
          </p>
          <Input
            label="输入「确认删除」"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="确认删除"
            error={
              deleteText.length > 0 && !canConfirmDelete ? '请输入完整的「确认删除」四字' : undefined
            }
          />
        </div>
      </Modal>
    </div>
  )
}
