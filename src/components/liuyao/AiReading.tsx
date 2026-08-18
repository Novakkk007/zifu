/**
 * AI 参详区（深色区块）· v6 鉴权契约：
 * - ai.reading 仅登录可用；输入 { chartId, persona, depth, idempotencyKey? }，
 *   摘要由服务端从【已落库】卦例构建，前端一律不发送卦盘数据。
 * - 游客 / 未落库 → 登录引导卡；错误分型处理（UNAUTHORIZED/TOO_MANY_REQUESTS/
 *   FORBIDDEN/BAD_GATEWAY/NOT_FOUND）。
 * - 来源徽章：live · 模型（金）/ fallback · 演示引擎（灰），降级不伪装。
 */
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHeading from '@/components/SectionHeading'
import { SegmentedControl } from '@/components/FormControls'
import { DeepButton, GoldButton } from '@/components/Buttons'
import DirectAiCard from '@/components/DirectAiCard'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { usePaymentEnabled, RECHARGE_CLOSED_HINT } from '@/hooks/usePaymentEnabled'
import { aiBackendUnavailableText } from '@/lib/ai-reading-error'
import { LOGIN_PATH } from '@/const'
import { trpcCode, type ReadingResponse } from '@/components/liuyao/api'
import { daXiangByName } from '@contracts/engines/liuyao-core'

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

/** 分段打字机 */
function Typewriter({ paragraphs, charMs = 22 }: { paragraphs: string[]; charMs?: number }) {
  const total = useMemo(() => paragraphs.reduce((n, p) => n + p.length, 0), [paragraphs])
  const [typed, setTyped] = useState(0)
  // 文本变化时重置打字进度：在渲染期间按上一次总字数派生调整，避免 effect 内同步 setState
  const [prevTotal, setPrevTotal] = useState(total)
  if (prevTotal !== total) {
    setPrevTotal(total)
    setTyped(0)
  }
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTyped((v) => {
        if (v >= total) {
          window.clearInterval(timer)
          return v
        }
        return v + 1
      })
    }, charMs)
    return () => window.clearInterval(timer)
  }, [total, charMs])

  const shownCounts: number[] = []
  let left = typed
  for (const p of paragraphs) {
    shownCounts.push(Math.max(0, Math.min(p.length, left)))
    left -= p.length
  }
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => {
        const shown = shownCounts[i]
        if (shown === 0) return null
        return (
          <p key={i} className="font-serif text-[15.5px] leading-[2.1] text-silktext">
            {p.slice(0, shown)}
            {shown < p.length && <span className="animate-caret-blink text-goldbright">▍</span>}
          </p>
        )
      })}
    </div>
  )
}

function newReadingKey(chartId: number): string {
  return `liuyao-reading:${chartId}:${crypto.randomUUID()}`
}

/** 错误码 → 明确 UI 状态文案 */
function errorStateOf(
  err: unknown,
  paymentEnabled: boolean,
): { title: string; desc: string; showLogin: boolean } {
  // 静态托管无后端：fetch/JSON 解析类错误兜底为友好文案
  const unavailable = aiBackendUnavailableText(err)
  if (unavailable) return { title: '参详失败', desc: unavailable, showLogin: false }
  const code = trpcCode(err)
  const serverMsg = err instanceof Error ? err.message : ''
  switch (code) {
    case 'UNAUTHORIZED':
      return { title: '登录态已失效', desc: 'AI 参详仅向登录用户开放，请重新登录后再试。', showLogin: true }
    case 'TOO_MANY_REQUESTS':
      return {
        title: '额度或频率受限',
        desc: serverMsg || '今日参详次数已达上限，或请求过于频繁，请稍后再试。',
        showLogin: false,
      }
    case 'FORBIDDEN':
      return {
        title: '灵签余额不足',
        desc: paymentEnabled
          ? 'live 参详每次消耗 1 灵签，请先充值或稍后再试。'
          : `live 参详每次消耗 1 灵签。${RECHARGE_CLOSED_HINT}。`,
        showLogin: false,
      }
    case 'BAD_GATEWAY':
      return { title: 'AI 服务暂不可用', desc: '模型网关异常，本次未扣除任何费用，请稍后重试。', showLogin: false }
    case 'NOT_FOUND':
      return { title: '卦例不存在', desc: '该卦例可能已删除或不属于当前账号，请重新起卦后再参详。', showLogin: false }
    default:
      return { title: '参详失败', desc: serverMsg || 'AI 参详服务暂不可用，本次未扣除费用，请稍后重试。', showLogin: false }
  }
}

function SourceBadge({ result }: { result: ReadingResponse }) {
  if (result.source === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-[11.5px] font-medium tracking-[0.12em] text-goldbright">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-goldbright" />
        live · 模型 {result.model ?? '未知'} · 消耗 1 灵签
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-silkmuted/40 bg-silktext/5 px-3 py-1 text-[11.5px] font-medium tracking-[0.12em] text-silkmuted">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-silkmuted" />
      fallback · 演示引擎（非 AI 生成，免费）
    </span>
  )
}

type AiReadingProps = {
  /** 落库卦例 ID（persisted 时由 cast 返回）；null = 未落库 */
  chartId: number | null
  benName: string
  bianName: string | null
}

/** S4 · AI 参详（深色）：人格 × 深度 → ai.reading（chartId 契约） */
export default function AiReading({ chartId, benName, bianName }: AiReadingProps) {
  const { user, isLoading: authLoading } = useAuth()
  const paymentEnabled = usePaymentEnabled()
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('pro')
  const [result, setResult] = useState<ReadingResponse | null>(null)

  const reading = trpc.ai.reading.useMutation({
    onSuccess: (data) => setResult(data as unknown as ReadingResponse),
  })

  const canRun = !!user && chartId !== null && !reading.isPending

  const run = () => {
    if (!canRun || chartId === null) return
    setResult(null)
    reading.mutate({ chartId, persona, depth, idempotencyKey: newReadingKey(chartId) })
  }

  const heading = (
    <SectionHeading
      dark
      eyebrow="AI READING"
      title="AI 参详"
      sub="两种人格 × 两种深度，基于服务端落库卦例生成；来源明示，降级不伪装"
    />
  )

  /* ---------- 游客 / 未落库：直连参详卡（自带密钥） ---------- */
  if (!authLoading && !user) {
    const benXiang = daXiangByName(benName)
    const bianXiang = bianName ? daXiangByName(bianName) : undefined
    let summary = `六爻卦例：本卦《${benName}》`
    if (benXiang) summary += `，其象曰「${benXiang}」`
    if (bianName) {
      summary += `，变卦《${bianName}》`
      if (bianXiang) summary += `，其象曰「${bianXiang}」`
    } else {
      summary += '，六爻安静无变爻'
    }
    summary +=
      '。请以先生口吻为访客参详此卦所问之事，结合本卦与变卦的卦名、卦象与大象辞的文化寓意，点出本卦所主之神与世应之位，不作吉凶断言，仅供传统文化参详。'
    return (
      <div>
        {heading}
        <div className="mx-auto mt-12 max-w-3xl">
          <DirectAiCard chartSummary={summary} title="自带密钥 · AI 直连参详此卦" />
        </div>
      </div>
    )
  }

  if (chartId === null) {
    return (
      <div>
        {heading}
        <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-gold/40 bg-deep p-10 text-center">
          <p className="font-serif text-[18px] font-bold tracking-[0.1em] text-silktext">
            当前卦例未落库
          </p>
          <p className="mx-auto mt-3 max-w-[460px] text-[13px] leading-[1.9] text-silkmuted">
            请在登录状态下重新起卦一次，卦例落库后即可使用 AI 参详
            （每日 20 次额度；live 参详每次消耗 1 灵签，演示引擎免费，失败不扣费）。
          </p>
          <p className="mt-3 text-[12.5px] text-goldbright">
            本次起卦：《{benName}》{bianName ? `之《${bianName}》` : ' · 六爻安静'}
          </p>
        </div>
      </div>
    )
  }

  const paragraphs = result ? result.text.split(/\n{2,}|\n/).filter((p) => p.trim().length > 0) : []
  const errState = reading.isError ? errorStateOf(reading.error, paymentEnabled) : null

  return (
    <div>
      {heading}
      <div className="mx-auto mt-12 max-w-3xl">
        <div className="flex flex-col items-center gap-5">
          <SegmentedControl<Persona>
            id="ly-persona"
            value={persona}
            onChange={setPersona}
            options={[
              { value: 'scholar', label: '严谨学者 SCHOLAR' },
              { value: 'hermit', label: '幽默隐士 HERMIT' },
            ]}
          />
          <SegmentedControl<Depth>
            id="ly-depth"
            value={depth}
            onChange={setDepth}
            options={[
              { value: 'pro', label: '专业级 · 完整推演' },
              { value: 'plain', label: '通俗级 · 直给结论' },
            ]}
          />
        </div>

        <div className="mt-10 text-center">
          <GoldButton disabled={!canRun} onClick={run}>
            {reading.isPending ? '参详中…' : '参详此卦'}
          </GoldButton>
          <p className="mt-4 text-[12.5px] tracking-[0.12em] text-silkmuted">
            本次起卦：《{benName}》{bianName ? `之《${bianName}》` : ' · 六爻安静'} · 卦例 #{chartId}
          </p>
          <p className="mt-2 text-[11.5px] text-silkmuted">
            live 参详每次消耗 1 灵签；演示引擎（fallback）免费；参详失败不扣费。
          </p>
          {errState && (
            <div
              role="alert"
              className="mx-auto mt-5 max-w-[520px] rounded-lg border border-[#B04A3A]/50 bg-[#B04A3A]/10 px-5 py-4"
            >
              <p className="font-serif text-[14px] font-bold tracking-[0.08em] text-[#E0A39A]">
                {errState.title}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-[1.8] text-[#E0A39A]/90">{errState.desc}</p>
              {errState.showLogin && (
                <DeepButton to={LOGIN_PATH} className="mt-4 border border-gold/40 px-6 py-2 text-[13px]">
                  重新登录
                </DeepButton>
              )}
            </div>
          )}
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              key={`${persona}-${depth}-${result.source}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-12 rounded-xl border-l-[3px] border-gold bg-deep2/60 p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] tracking-[0.2em] text-silkmuted">
                  参详输出 · {persona === 'scholar' ? '严谨学者' : '幽默隐士'} ·{' '}
                  {depth === 'pro' ? '专业级' : '通俗级'}
                </p>
                <SourceBadge result={result} />
              </div>
              <div className="mt-5 min-h-[180px]">
                <Typewriter paragraphs={paragraphs} />
              </div>
              <p className="mt-6 border-t border-gold/15 pt-4 text-[12.5px] text-silkmuted">
                {result.source === 'live'
                  ? '本参详由 AI 模型基于您的落库卦例生成（已消耗 1 灵签），仅供传统文化参考。'
                  : '当前为演示引擎模板输出（未配置 AI 密钥），非 AI 模型生成，不消耗灵签，仅供流程演示。'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
