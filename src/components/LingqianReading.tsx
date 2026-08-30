import { useState } from 'react'
import { motion } from 'framer-motion'
import { chargeLingqian, hasDevice, myWallet, refundLingqian } from '@/lib/auth-client'
import { proxyAI } from '@/lib/ai-proxy'
import { buildReadingPrompt } from '@/lib/ai-direct'

const LINGQIAN_COST = 9

/**
 * 灵签详批（生产计费闭环）
 * 流程：确认消耗 → 服务端原子扣签 → AI 详批（CF Worker 代理）→ 失败自动退款
 * 游客无账页时引导一键建账（赠 36 灵签）。
 */
export default function LingqianReading({
  chartSummary,
  persona = 'scholar',
  depth = 'pro',
}: {
  chartSummary: string
  persona?: string
  depth?: string
}) {
  const [busy, setBusy] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)

  const start = async () => {
    setBusy(true)
    setError(null)
    let charged = false
    try {
      const r = await chargeLingqian(LINGQIAN_COST)
      if (!r.ok) {
        setError(r.error ?? '灵签不足')
        return
      }
      charged = true
      setBalance(r.balance ?? null)
      const prompt = buildReadingPrompt({ chartSummary, persona, depth })
      const res = await proxyAI('guest-reading', prompt, { maxTokens: 1600, temperature: 0.72 })
      setContent(res.content)
    } catch (e) {
      setError(e instanceof Error ? e.message : '详批服务暂不可用')
    } finally {
      if (charged && !content && !error) {
        // 输出为空或异常：退款
        try {
          await refundLingqian(LINGQIAN_COST)
          const w = await myWallet()
          setBalance(w.balance ?? null)
        } catch {
          /* 退款失败留给客服兜底 */
        }
      }
      setBusy(false)
      setConfirming(false)
    }
  }

  if (!hasDevice()) {
    return (
      <div className="mt-6 rounded-xl border border-golddim/25 bg-silk2/70 px-5 py-4 text-center">
        <p className="text-[13px] leading-[1.9] text-inkmuted">
          <b className="text-golddim">AI 详批</b> 消耗 {LINGQIAN_COST} 灵签/次——创建账页即赠 36 灵签。
        </p>
        <a
          href="/account"
          className="mt-3 inline-block rounded-lg bg-golddim px-5 py-2.5 font-serif text-[14px] font-bold tracking-[0.15em] text-white transition hover:brightness-110"
        >
          一键创建账页 · 领 36 灵签
        </a>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="rounded-xl border border-golddim/25 bg-silk2/70 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px] leading-[1.8] text-inkmuted">
            <b className="font-serif text-[15px] text-golddim">灵签详批</b>
            <span className="ml-2">先生逐句引经深参 · 消耗 {LINGQIAN_COST} 灵签</span>
            {balance !== null && (
              <span className="ml-2 text-[12px] text-inkmuted/70">当前余额 {balance} 灵签</span>
            )}
          </div>
          {!confirming ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming(true)}
              className="rounded-lg bg-golddim px-5 py-2.5 font-serif text-[13.5px] font-bold tracking-[0.12em] text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? '详批中……' : '开始详批'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] text-inkmuted">确认消耗 {LINGQIAN_COST} 灵签？</span>
              <button
                type="button"
                onClick={() => void start()}
                className="rounded-lg bg-golddim px-4 py-2 text-[13px] font-bold text-white hover:brightness-110"
              >
                确认
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-golddim/30 px-4 py-2 text-[13px] text-inkmuted"
              >
                取消
              </button>
            </div>
          )}
        </div>
        {error && <p className="mt-3 text-[12.5px] text-red-400">{error}</p>}
      </div>

      {content && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-5 rounded-2xl border border-golddim/25 bg-silk2 p-6 shadow-card"
        >
          <p className="whitespace-pre-line text-center font-serif text-[15px] leading-[2.05] text-inktext">
            {content}
          </p>
          <p className="mt-5 text-center text-[11px] tracking-[0.2em] text-inkmuted">
            —— 先生详批 · 本次消耗 {LINGQIAN_COST} 灵签
          </p>
        </motion.div>
      )}
    </div>
  )
}
