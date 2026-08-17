/**
 * AI 详批区（深色区块）· v6 鉴权契约：
 * - ai.reading 仅登录可用；输入 { chartId, persona, depth, idempotencyKey? }，
 *   命盘摘要由服务端从【已落库】命盘构建，前端一律不发送命盘数据。
 * - 游客 → 登录引导卡；已登录但命盘未落库（无 chartId）→ 提示重新排盘落库。
 * - 错误分型：UNAUTHORIZED（重新登录）/ TOO_MANY_REQUESTS（额度或频率）/
 *   FORBIDDEN（灵签不足）/ BAD_GATEWAY（AI 服务异常，未扣费）/ 其他。
 * - 结果头部明示来源徽章：live · 模型 {model}（金）/ fallback · 演示引擎（灰）。
 * - 计费说明：live 每次消耗 1 灵签；fallback 免费；失败不扣费。
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import SectionHeading from '@/components/SectionHeading'
import { SegmentedControl } from '@/components/FormControls'
import { DeepButton, GoldButton } from '@/components/Buttons'
import DirectAiChat from '@/components/DirectAiChat'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { buildChartSummary } from '@/lib/ai-direct'
import { aiBackendUnavailableText } from '@/lib/ai-reading-error'
import { LOGIN_PATH } from '@/const'
import { cn } from '@/lib/utils'
import type { BaziChartV2 } from '@contracts/bazi-core'
import { getBooksForTerm } from '@contracts/glossary-bridge'
import { BOOKS, type Book } from '@/components/content/books'
import { GLOSSARY } from '@/components/GlossaryTooltip'
import type { ReadingResponse } from './api'

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

const PERSONAS: { id: Persona; latin: string; name: string; desc: string }[] = [
  { id: 'scholar', latin: 'SCHOLAR', name: '严谨学者', desc: '客观克制，依传统规则条分缕析' },
  { id: 'hermit', latin: 'HERMIT', name: '幽默隐士', desc: '随性诙谐，妙语点破，围炉夜话' },
]

/** 从 tRPC 错误对象提取服务端错误码 */
function trpcCode(err: unknown): string | null {
  if (err && typeof err === 'object' && 'data' in err) {
    const code = (err as { data?: { code?: unknown } }).data?.code
    if (typeof code === 'string') return code
  }
  return null
}

function newIdempotencyKey(chartId: number): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.trunc(performance.now() * 1000).toString(36)}`
  return `bazi-reading:${chartId}:${uuid}`
}

/** 错误码 → 明确 UI 状态文案（action 可选登录引导） */
function errorStateOf(err: unknown): { title: string; desc: string; showLogin: boolean } {
  // 静态托管无后端：fetch/JSON 解析类错误兜底为友好文案
  const unavailable = aiBackendUnavailableText(err)
  if (unavailable) return { title: '参详失败', desc: unavailable, showLogin: false }
  const code = trpcCode(err)
  const serverMsg = err instanceof Error ? err.message : ''
  switch (code) {
    case 'UNAUTHORIZED':
      return {
        title: '登录态已失效',
        desc: 'AI 参详仅向登录用户开放，请重新登录后再试。',
        showLogin: true,
      }
    case 'TOO_MANY_REQUESTS':
      return {
        title: '额度或频率受限',
        desc: serverMsg || '今日参详次数已达上限，或请求过于频繁，请稍后再试。',
        showLogin: false,
      }
    case 'FORBIDDEN':
      return {
        title: '灵签余额不足',
        desc: 'live 参详每次消耗 1 灵签。充值通道即将开放，敬请期待；当前可稍后再试演示引擎。',
        showLogin: false,
      }
    case 'BAD_GATEWAY':
      return {
        title: 'AI 服务暂不可用',
        desc: '模型网关异常，本次未扣除任何费用，请稍后重试。',
        showLogin: false,
      }
    case 'NOT_FOUND':
      return {
        title: '命盘不存在',
        desc: '该命盘可能已删除或不属于当前账号，请重新排盘后再参详。',
        showLogin: false,
      }
    default:
      return {
        title: '参详失败',
        desc: serverMsg || 'AI 详批服务暂不可用，本次未扣除费用，请稍后重试。',
        showLogin: false,
      }
  }
}

/**
 * 相关典籍（纯展示）：对本次排盘实际涉及的术语（十神 + 日主/身强身弱/格局/大运/流年）
 * 经 glossary-bridge 映射取关联典籍，渲染为藏经阁入口卡。
 * 数据仅供展示层互链，不进入 AI prompt 链路（红线见 api/glossary-wire.test.ts）。
 */
function relatedBooksForChart(chart: BaziChartV2): Book[] {
  const terms = new Set<string>(['日主', '身强身弱', '格局', '大运', '流年'])
  for (const t of chart.tenGods) terms.add(t.tenGod)
  const ids = new Set<string>()
  for (const term of terms) {
    if (!GLOSSARY[term]) continue // 无词条的术语（如偏印）跳过，不强行关联
    for (const id of getBooksForTerm(term)) ids.add(id)
  }
  return BOOKS.filter((b) => ids.has(b.id))
}

function RelatedBooksSection({ chart }: { chart: BaziChartV2 }) {
  const books = relatedBooksForChart(chart)
  if (books.length === 0) return null
  return (
    <div className="mt-12">
      <p className="text-center text-[12px] tracking-[0.18em] text-silkmuted">
        相关典籍 · 本盘术语可溯源的公版书目（藏经阁）
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {books.map((b) => (
          <Link
            key={b.id}
            to="/wiki"
            className="rounded-xl border border-golddim/25 bg-deep/50 px-4 py-4 text-center transition-colors hover:border-gold/60 hover:bg-deep"
          >
            <p className="font-serif text-[15px] font-bold tracking-[0.08em] text-goldbright">
              《{b.title}》
            </p>
            <p className="mt-1.5 text-[11.5px] leading-[1.7] text-silkmuted">
              {b.dynasty} · {b.author}
            </p>
            <p className="mt-1 line-clamp-2 text-[11.5px] leading-[1.7] text-silkmuted/80">
              {b.intro}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
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

type Props = {
  chart: BaziChartV2 | null
  /** 落库命盘 ID（persisted 时由 paipan 返回；历史回填时为记录 id） */
  chartId: number | null
  /** 来自人生轨迹图的「AI 解释此阶段」请求（阶段标签，仅作 UI 语境展示） */
  stage: string | null
  onStageConsumed: () => void
}

export default function AiReadingSection({ chart, chartId, stage, onStageConsumed }: Props) {
  const reduce = useReducedMotion()
  const { user, isLoading: authLoading } = useAuth()
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('pro')
  const [result, setResult] = useState<ReadingResponse | null>(null)
  const [stageLabel, setStageLabel] = useState<string | null>(null)

  const reading = trpc.ai.reading.useMutation({
    onSuccess: (data) => setResult(data as unknown as ReadingResponse),
  })

  const canRun = !!user && chartId !== null && !reading.isPending

  const run = () => {
    if (!canRun || chartId === null) return
    setResult(null)
    reading.mutate({ chartId, persona, depth, idempotencyKey: newIdempotencyKey(chartId) })
  }

  // 轨迹图「AI 解释此阶段」：落到本区并自动发起一次参详（同一 ai.reading 通道，
  // chartSummary 由服务端按落库命盘构建；阶段语境仅作界面提示）
  useEffect(() => {
    if (stage === null) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部阶段请求落区：以 effect 同步 props→state 为既有契约
    setStageLabel(stage)
    onStageConsumed()
    if (canRun) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const directChartSummary = chart ? buildChartSummary(chart) : ''

  if (!authLoading && !user) {
    return (
      <div className="zf-container max-w-[880px]">
        <SectionHeading
          eyebrow="AI Reading"
          title="AI 详批 · 四维交互"
          sub="自带密钥直连 AI（Kimi K3 / OpenAI 兼容端点）；密钥仅存本机浏览器，来源明示"
          dark
          className="mb-12"
        />
        {stageLabel && (
          <p className="mb-4 text-center text-[12.5px] text-goldbright">
            已收到「{stageLabel}」的解读请求。
          </p>
        )}
        <DirectAiChat
          key={directChartSummary || 'empty-chart'}
          chartSummary={directChartSummary}
          persona={persona}
          depth={depth}
        />
      </div>
    )
  }

  const paragraphs = result ? result.text.split(/\n{2,}|\n/).filter((p) => p.trim().length > 0) : []
  const errState = reading.isError ? errorStateOf(reading.error) : null

  return (
    <div className="zf-container max-w-[880px]">
      <SectionHeading
        eyebrow="AI Reading"
        title="AI 详批 · 四维交互"
        sub="两种人格 × 两种深度，服务端基于落库命盘构建摘要；来源明示，降级不伪装"
        dark
        className="mb-12"
      />

      {/* 人格 */}
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
        {PERSONAS.map((p) => {
          const active = persona === p.id
          return (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={cn(
                'relative flex-1 rounded-2xl border px-8 py-6 text-left transition-colors sm:max-w-[320px]',
                active ? 'border-transparent bg-deep' : 'border-golddim/25 bg-deep/50 hover:border-golddim/50',
              )}
            >
              {active && (
                <motion.span
                  layoutId="bazi-persona-frame"
                  className="absolute inset-0 rounded-2xl border-2 border-gold"
                  transition={{ duration: reduce ? 0 : 0.26, ease: 'easeOut' }}
                />
              )}
              <span className="block font-latin text-[12px] font-medium tracking-[0.3em] text-gold">
                {p.latin}
              </span>
              <span className="mt-1.5 block font-serif text-[19px] font-bold tracking-[0.1em] text-silktext">
                {p.name}
              </span>
              <span className="mt-1 block text-[12.5px] leading-[1.8] text-silkmuted">{p.desc}</span>
            </button>
          )
        })}
      </div>

      {/* 深度 */}
      <div className="mt-6 text-center">
        <SegmentedControl<Depth>
          id="bazi-depth"
          value={depth}
          onChange={setDepth}
          options={[
            { value: 'pro', label: '专业级 · 完整推演' },
            { value: 'plain', label: '通俗级 · 直给结论' },
          ]}
        />
      </div>

      {stageLabel && (
        <p className="mt-5 text-center text-[12.5px] text-goldbright">
          岁运语境：{stageLabel} —— AI 将基于您的落库命盘解读当前岁运阶段。
        </p>
      )}

      <div className="mt-8 text-center">
        <GoldButton
          disabled={!canRun}
          className={cn(!canRun && 'cursor-not-allowed opacity-40')}
          onClick={run}
        >
          {reading.isPending ? '参详中…' : '开始详批'}
        </GoldButton>
        {!chart && <p className="mt-3 text-[12.5px] text-silkmuted">请先在上方完成排盘</p>}
        {chart && chartId === null && (
          <p className="mt-3 text-[12.5px] text-silkmuted">
            当前命盘尚未落库（可能排盘时未登录或落库失败）——请在登录状态下重新排盘一次，即可使用 AI 参详。
          </p>
        )}
        <p className="mt-3 text-[11.5px] text-silkmuted">
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

      {/* 输出卡 */}
      <AnimatePresence>
        {result && (
          <motion.div
            key={`${persona}-${depth}-${result.source}`}
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.5 }}
            className="mt-12 rounded-xl border-l-[3px] border-gold bg-deep p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] tracking-[0.14em] text-silkmuted">
                参详输出 · {persona === 'scholar' ? '严谨学者' : '幽默隐士'} ·{' '}
                {depth === 'pro' ? '专业级' : '通俗级'}
                {stageLabel ? ` · ${stageLabel}` : ''}
              </p>
              <SourceBadge result={result} />
            </div>
            <div className="mt-6 space-y-5">
              {paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : i * 0.18, duration: reduce ? 0.15 : 0.5 }}
                  className="whitespace-pre-wrap font-serif text-[15.5px] leading-[2.1] text-silktext"
                >
                  {p}
                </motion.p>
              ))}
            </div>
            <p className="mt-7 border-t border-golddim/20 pt-4 text-[12.5px] text-silkmuted">
              {result.source === 'live'
                ? '本详批由 AI 模型基于您的落库命盘生成（已消耗 1 灵签），仅供传统文化参考。'
                : '当前为演示引擎模板输出（未配置 AI 密钥或余额校验未触发），非 AI 模型生成，不消耗灵签，仅供流程演示。'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 相关典籍：本盘术语 → 藏经阁互链（纯展示，不入 AI 链路） */}
      {chart && <RelatedBooksSection chart={chart} />}
    </div>
  )
}
