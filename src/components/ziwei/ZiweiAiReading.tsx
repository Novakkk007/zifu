/**
 * 紫微 AI 参详（深色区块）· 与六爻/八字同一契约：
 * - ai.reading 仅登录可用；输入 { chartId, persona, depth, idempotencyKey }，
 *   命盘摘要由服务端从【已落库】命盘构建，前端一律不发送命盘数据。
 * - 游客 → 登录引导；已排盘但未落库（无 chartId）→ 提示登录后重新排盘。
 * - 结果头部明示来源徽章：live · 模型（金）/ fallback · 演示引擎（灰）。
 */
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SectionHeading from '@/components/SectionHeading'
import { SegmentedControl } from '@/components/FormControls'
import { GoldButton } from '@/components/Buttons'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'
import { cn } from '@/lib/utils'

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

interface ReadingResponse {
  text: string
  source: 'live' | 'fallback'
  model: string | null
}

const PERSONAS: { id: Persona; name: string }[] = [
  { id: 'scholar', name: '严谨学者' },
  { id: 'hermit', name: '幽默隐士' },
]

function trpcCode(err: unknown): string | null {
  if (err && typeof err === 'object' && 'data' in err) {
    const code = (err as { data?: { code?: unknown } }).data?.code
    if (typeof code === 'string') return code
  }
  return null
}

function newIdempotencyKey(chartId: number): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  return `ziwei-reading:${chartId}:${uuid}`
}

function errorText(err: unknown): string {
  const code = trpcCode(err)
  const msg = err instanceof Error ? err.message : ''
  switch (code) {
    case 'UNAUTHORIZED':
      return '登录态已失效，请重新登录后再参详。'
    case 'TOO_MANY_REQUESTS':
      return msg || '今日参详次数已达上限，或请求过于频繁，请稍后再试。'
    case 'FORBIDDEN':
      return '灵签余额不足，请先充值；本次未扣除费用。'
    case 'BAD_GATEWAY':
      return 'AI 服务暂不可用，本次未扣除任何费用，请稍后重试。'
    case 'NOT_FOUND':
      return '命盘不存在或不属于当前账号，请重新排盘后再参详。'
    default:
      return msg || '参详失败，本次未扣除费用，请稍后重试。'
  }
}

export default function ZiweiAiReading({ chartId }: { chartId: number | null }) {
  const { user, isLoading } = useAuth()
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('plain')
  const [reading, setReading] = useState<ReadingResponse | null>(null)

  const aiReading = trpc.ai.reading.useMutation({
    onSuccess: (data) => setReading(data as unknown as ReadingResponse),
  })

  const request = () => {
    if (!chartId) return
    setReading(null)
    aiReading.mutate({ chartId, persona, depth, idempotencyKey: newIdempotencyKey(chartId) })
  }

  const paragraphs = reading?.text.split(/\n+/).filter((p) => p.trim().length > 0) ?? []

  return (
    <div className="mx-auto mt-12 max-w-3xl">
      <SectionHeading
        dark
        eyebrow="AI READING"
        title="AI 参详"
        sub="依已落库命盘，引《紫微斗数全书》逐宫参详"
      />

      <div className="mt-10 rounded-xl border border-gold/20 bg-deep3/50 p-7">
        {isLoading ? null : !user ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-[13.5px] leading-[1.9] text-silkmuted">
              AI 参详仅向登录用户开放。登录后排盘自动落库，即可引经参详。
            </p>
            <Link
              to={LOGIN_PATH}
              className="rounded-full border border-gold/50 px-6 py-2 text-[13px] tracking-[0.14em] text-goldbright transition-colors hover:bg-gold/10"
            >
              前往登录
            </Link>
          </div>
        ) : chartId === null ? (
          <p className="py-6 text-center text-[13.5px] leading-[1.9] text-silkmuted">
            当前命盘尚未落库——请重新「安星排盘」，落库后即可参详。
          </p>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[12px] tracking-[0.24em] text-silkmuted">参详人设</p>
                <SegmentedControl<Persona>
                  id="zw-ai-persona"
                  value={persona}
                  onChange={setPersona}
                  options={PERSONAS.map((p) => ({ value: p.id, label: p.name }))}
                />
              </div>
              <div>
                <p className="mb-2 text-[12px] tracking-[0.24em] text-silkmuted">参详深浅</p>
                <SegmentedControl<Depth>
                  id="zw-ai-depth"
                  value={depth}
                  onChange={setDepth}
                  options={[
                    { value: 'plain', label: '白话' },
                    { value: 'pro', label: '专业' },
                  ]}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <GoldButton onClick={request} disabled={aiReading.isPending} className="w-full sm:w-auto">
                {aiReading.isPending ? '参详中…' : '开始参详'}
              </GoldButton>
            </div>
            <p className="mt-3 text-center text-[11.5px] text-silkmuted/80">
              live 参详每次消耗 1 灵签；失败或降级不扣费
            </p>

            {aiReading.isError && (
              <p className="mt-5 rounded-lg border border-[#B03A2E]/40 bg-[#B03A2E]/10 px-5 py-3 text-center text-[13px] leading-[1.8] text-[#E8A49C]">
                {errorText(aiReading.error)}
              </p>
            )}

            <AnimatePresence>
              {reading && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-7 border-t border-gold/15 pt-6"
                >
                  <div className="mb-4 flex justify-center">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] tracking-[0.12em]',
                        reading.source === 'live'
                          ? 'border-gold/60 bg-gold/10 text-goldbright'
                          : 'border-silkmuted/40 bg-silkmuted/10 text-silkmuted',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-1.5 w-1.5 rounded-full',
                          reading.source === 'live' ? 'bg-goldbright' : 'bg-silkmuted',
                        )}
                      />
                      {reading.source === 'live'
                        ? `live · 模型 ${reading.model ?? '未知'} · 消耗 1 灵签`
                        : 'fallback · 演示引擎 · 免费'}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {paragraphs.map((p, i) => (
                      <p key={i} className="font-serif text-[15px] leading-[2.05] text-silktext">
                        {p}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
