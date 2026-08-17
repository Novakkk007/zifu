/**
 * 通用 AI 直连参详卡——游客通道（BYOK：自带密钥，本机直连）。
 * 八字/六爻/紫微等引擎共用：provider 选择 + 密钥保存 + 直连调用 + 结果展示。
 * 数据由调用方以 chartSummary 文本注入（先生人格 prompt 内置）。
 */
import { useState } from 'react'
import { buildReadingPrompt, aiDirectReading, BUILTIN_AI_KEY, type DirectReadingResult } from '@/lib/ai-direct'

function getStoredKey() {
  try {
    return localStorage.getItem('zifu:ai-key') ?? ''
  } catch {
    return ''
  }
}
function getStoredProvider(): 'kimi' | 'deepseek' {
  try {
    return (localStorage.getItem('zifu:ai-provider') as 'kimi' | 'deepseek') || 'kimi'
  } catch {
    return 'kimi'
  }
}

export default function DirectAiCard({
  chartSummary,
  title = '自带密钥 · AI 直连参详',
  persona = 'scholar',
  depth = 'pro',
}: {
  /** 命盘结构化摘要（引擎产出） */
  chartSummary: string
  title?: string
  persona?: string
  depth?: string
}) {
  const [provider, setProvider] = useState<'kimi' | 'deepseek'>(getStoredProvider)
  const [keyDraft, setKeyDraft] = useState(getStoredKey)
  const [savedKey, setSavedKey] = useState(getStoredKey)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<DirectReadingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const saveKey = () => {
    try {
      localStorage.setItem('zifu:ai-key', keyDraft.trim())
    } catch {
      /* 隐私模式忽略 */
    }
    setSavedKey(keyDraft.trim())
  }

  const hasAccess = savedKey.trim().length > 0 || BUILTIN_AI_KEY.length > 0

  const run = async () => {
    if (!hasAccess || busy || !chartSummary) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const r = await aiDirectReading({
        chartSummary,
        persona,
        depth,
        provider: savedKey.trim() ? provider : 'deepseek',
        apiKey: savedKey.trim(),
      })
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : '参详失败，请稍后再试')
    } finally {
      setBusy(false)
    }
  }

  /** 清洗模型偶尔输出的 markdown 符号（加粗/标题/列表） */
  const cleanText = (t: string) =>
    t
      .replace(/^\s*#{1,6}\s+/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1$2')
      .trim()

  const paragraphs = result ? result.content.split(/\n{2,}|\n/).map(cleanText).filter((p) => p.length > 0) : []

  return (
    <div className="rounded-xl border border-gold/40 bg-deep p-8 text-center">
      <p className="font-serif text-[18px] font-bold tracking-[0.1em] text-silktext">{title}</p>
      <p className="mx-auto mt-3 max-w-[520px] text-[13px] leading-[1.9] text-silkmuted">
        {BUILTIN_AI_KEY ? '测试版已内置 AI 通道，无需密钥即可参详；' : ''}
        也可填入自己的 Kimi 或 DeepSeek（OpenAI 兼容）API 密钥——密钥只保存在你自己的浏览器，
        不上传任何服务器。
      </p>
      <div className="mx-auto mt-5 flex max-w-[460px] items-center gap-2">
        <select
          value={provider}
          onChange={(e) => {
            const p = e.target.value as 'kimi' | 'deepseek'
            setProvider(p)
            try {
              localStorage.setItem('zifu:ai-provider', p)
            } catch {
              /* 隐私模式忽略 */
            }
          }}
          className="shrink-0 rounded-lg border border-golddim/40 bg-black/30 px-3 py-2.5 text-[13px] text-silktext focus:border-goldbright focus:outline-none"
          aria-label="选择 AI 后端"
        >
          <option value="kimi">Kimi</option>
          <option value="deepseek">DeepSeek</option>
        </select>
        <input
          type="password"
          value={keyDraft}
          onChange={(e) => setKeyDraft(e.target.value)}
          placeholder={provider === 'deepseek' ? 'sk-...（DeepSeek 平台 API Key）' : 'sk-...（Kimi 平台 API Key）'}
          className="w-full rounded-lg border border-golddim/40 bg-black/30 px-4 py-2.5 text-[13px] text-silktext placeholder:text-silkmuted/50 focus:border-goldbright focus:outline-none"
        />
        <button
          onClick={saveKey}
          className="shrink-0 rounded-lg border border-golddim/50 px-4 py-2.5 text-[13px] text-goldbright hover:bg-golddim/10"
        >
          保存
        </button>
      </div>
      {savedKey && (
        <p className="mt-2 text-[11.5px] text-golddim">
          已保存密钥（仅本机）· 直连端点{' '}
          {provider === 'deepseek' ? 'api.deepseek.com' : 'api.moonshot.cn'} · 模型{' '}
          {provider === 'deepseek' ? 'deepseek-chat' : 'kimi-k3'}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={run}
          disabled={!hasAccess || busy || !chartSummary}
          className="rounded-xl border border-gold/60 bg-gold/10 px-8 py-3 text-[14px] font-medium tracking-[0.1em] text-goldbright transition-colors enabled:hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'AI 解读中…' : '开始 AI 参详'}
        </button>
      </div>
      {!chartSummary && (
        <p className="mt-3 text-[12px] text-silkmuted">先完成上方排盘/起卦，即可直连参详。</p>
      )}
      {error && <p className="mt-4 text-[12.5px] leading-relaxed text-red-400">参详失败：{error}</p>}
      {result && (
        <div className="mx-auto mt-6 max-w-[720px] rounded-xl border border-goldbright/30 bg-black/20 p-6 text-left">
          <p className="mb-3 text-[12px] font-semibold tracking-[0.15em] text-goldbright">
            live · 模型 {result.model} · 自带密钥直连
          </p>
          <div className="space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i} className="font-serif text-[14.5px] leading-[2] text-silktext">
                {p}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { buildReadingPrompt }
