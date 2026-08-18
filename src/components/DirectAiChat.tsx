/**
 * 游客 AI 直连多轮参详：先生先完整讲述，再围绕前文接续问答。
 * 密钥仅存 localStorage，所有请求从浏览器直达所选兼容端点。
 */
import { type FormEvent, useEffect, useRef, useState } from 'react'

/** 对话历史本地存储键 */
const CHAT_STORE_KEY = 'zifu:xiansheng-chat'
import {
  aiDirectChat,
  aiDirectReading,
  BUILTIN_AI_KEY,
  getStoredAiKey,
  setStoredAiKey,
  type AIProvider,
  type DirectChatHistoryMessage,
} from '@/lib/ai-direct'

function getStoredProvider(): AIProvider {
  try {
    return (localStorage.getItem('zifu:ai-provider') as AIProvider) || 'kimi'
  } catch {
    return 'kimi'
  }
}

function MessageContent({ content }: { content: string }) {
  const cleaned = content
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1$2')
  const sections = cleaned.split(/\n{2,}/).filter((section) => section.trim().length > 0)
  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <p key={index} className="whitespace-pre-wrap font-serif text-[14.5px] leading-[2]">
          {section}
        </p>
      ))}
    </div>
  )
}

/** 先生之声：优先 /api/tts（Minimax 沉稳男声），未配置/失败回退浏览器语音合成。 */
function useXianshengVoice() {
  const [speaking, setSpeaking] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speakFallback = (text: string) => {
    try {
      const synth = window.speechSynthesis
      if (!synth) return
      synth.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'zh-CN'
      utter.rate = 0.85
      utter.pitch = 0.8
      const voices = synth.getVoices()
      const byName = (kw: string) =>
        voices.find((v) => v.name.toLowerCase().includes(kw) && v.lang.toLowerCase().startsWith('zh'))
      const voice =
        byName('yunye') ?? byName('yunjian') ?? byName('yunyang') ?? byName('yunxi') ??
        voices.find((v) => v.lang.toLowerCase().startsWith('zh')) ?? null
      if (voice) utter.voice = voice
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      utterRef.current = utter
      setSpeaking(true)
      synth.speak(utter)
    } catch {
      /* ignore */
    }
  }

  const speak = async (text: string) => {
    const cleaned = text.replace(/\*\*|#{1,6}|\*/g, '')
    setSpeaking(true)
    // 优先级：本地 TTS 代理（开发机秒连）→ CF /api/tts → 浏览器语音
    for (const endpoint of ['http://127.0.0.1:8770/tts', '/api/tts']) {
      try {
        const controller = new AbortController()
        const timer = window.setTimeout(() => controller.abort(), 20000)
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleaned }),
          signal: controller.signal,
        })
        window.clearTimeout(timer)
        if (!res.ok) throw new Error(`tts ${res.status}`)
        const blob = await res.blob()
        if (blob.size < 200) throw new Error('empty audio')
        const url = URL.createObjectURL(blob)
        const a = audioRef.current ?? new Audio()
        audioRef.current = a
        a.src = url
        a.onended = () => setSpeaking(false)
        a.onerror = () => setSpeaking(false)
        await a.play()
        return
      } catch {
        // 下一个端点
      }
    }
    speakFallback(cleaned)
  }
  const stop = () => {
    try {
      audioRef.current?.pause()
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
    utterRef.current = null
    setSpeaking(false)
  }
  return { speaking, speak, stop }
}

export default function DirectAiChat({
  chartSummary,
  title = 'AI 直连参详 · 先生问答',
  persona = 'scholar',
  depth = 'pro',
}: {
  chartSummary: string
  title?: string
  persona?: string
  depth?: string
}) {
  const [provider, setProvider] = useState<AIProvider>(getStoredProvider)
  const [keyDraft, setKeyDraft] = useState(getStoredAiKey)
  const [savedKey, setSavedKey] = useState(getStoredAiKey)
  const [messages, setMessages] = useState<DirectChatHistoryMessage[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as DirectChatHistoryMessage[]
      return Array.isArray(parsed) ? parsed.slice(-30) : []
    } catch {
      return []
    }
  })
  const [question, setQuestion] = useState('')
  const [model, setModel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 对话持久化：刷新/重进不丢（最多 30 条）
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORE_KEY, JSON.stringify(messages.slice(-30)))
      }
    } catch {
      /* ignore */
    }
  }, [messages])
  const { speaking: voiceSpeaking, speak: voiceSpeak, stop: voiceStop } = useXianshengVoice()

  const hasAccess = savedKey.trim().length > 0 || BUILTIN_AI_KEY.length > 0
  const hasReading = messages.some((message) => message.role === 'assistant')

  const saveKey = () => {
    const key = keyDraft.trim()
    setStoredAiKey(key)
    setSavedKey(key)
  }

  const access = {
    provider: savedKey.trim() ? provider : undefined,
    apiKey: savedKey.trim(),
  }

  const startReading = async () => {
    if (!hasAccess || busy || !chartSummary) return
    setBusy(true)
    setError(null)
    setMessages([])
    try {
      const result = await aiDirectReading({
        chartSummary,
        persona,
        depth,
        ...access,
      })
      setModel(result.model)
      setMessages([{ role: 'assistant', content: result.content }])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '参详失败，请稍后再试')
    } finally {
      setBusy(false)
    }
  }

  const sendQuestion = async (event: FormEvent) => {
    event.preventDefault()
    const content = question.trim()
    if (!content || !hasReading || busy) return

    const previousMessages = messages
    const nextHistory: DirectChatHistoryMessage[] = [...previousMessages, { role: 'user', content }]
    setMessages(nextHistory)
    setQuestion('')
    setBusy(true)
    setError(null)
    try {
      const result = await aiDirectChat({
        chartSummary,
        history: nextHistory,
        persona,
        depth,
        ...access,
      })
      setModel(result.model)
      setMessages([...nextHistory, { role: 'assistant', content: result.content }])
    } catch (cause) {
      setMessages(previousMessages)
      setQuestion(content)
      setError(cause instanceof Error ? cause.message : '追问失败，请稍后再试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-gold/40 bg-deep p-5 text-center sm:p-8">
      <p className="font-serif text-[18px] font-bold tracking-[0.1em] text-silktext">{title}</p>
      <p className="mx-auto mt-3 max-w-[560px] text-[13px] leading-[1.9] text-silkmuted">
        先生会先完整讲盘，再请你说说挂心之处。之后可沿着前文继续问，不必一次把话问完。
        {BUILTIN_AI_KEY ? '测试版已内置 AI 通道；' : ''}
        自带密钥只保存在本机浏览器。
      </p>

      <div className="mx-auto mt-5 flex max-w-[520px] flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={provider}
          onChange={(event) => {
            const nextProvider = event.target.value as AIProvider
            setProvider(nextProvider)
            try {
              localStorage.setItem('zifu:ai-provider', nextProvider)
            } catch {
              /* 隐私模式静默失败 */
            }
          }}
          className="rounded-lg border border-golddim/40 bg-black/30 px-3 py-2.5 text-[13px] text-silktext focus:border-goldbright focus:outline-none"
          aria-label="选择 AI 后端"
        >
          <option value="kimi">Kimi</option>
          <option value="deepseek">DeepSeek</option>
        </select>
        <input
          type="password"
          value={keyDraft}
          onChange={(event) => setKeyDraft(event.target.value)}
          placeholder={provider === 'deepseek' ? 'sk-...（DeepSeek API Key）' : 'sk-...（Kimi API Key）'}
          className="min-w-0 flex-1 rounded-lg border border-golddim/40 bg-black/30 px-4 py-2.5 text-[13px] text-silktext placeholder:text-silkmuted/50 focus:border-goldbright focus:outline-none"
        />
        <button
          type="button"
          onClick={saveKey}
          className="shrink-0 rounded-lg border border-golddim/50 px-4 py-2.5 text-[13px] text-goldbright hover:bg-golddim/10"
        >
          保存
        </button>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={startReading}
          disabled={!hasAccess || busy || !chartSummary}
          className="rounded-xl border border-gold/60 bg-gold/10 px-8 py-3 text-[14px] font-medium tracking-[0.1em] text-goldbright transition-colors enabled:hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy && !hasReading ? '先生正在参详…' : hasReading ? '重新参详此盘' : '请先生参详'}
        </button>
      </div>
      {!chartSummary && <p className="mt-3 text-[12px] text-silkmuted">先完成上方排盘，即可直连参详。</p>}
      {error && (
        <p role="alert" className="mt-4 text-[12.5px] leading-relaxed text-red-400">
          {error}
        </p>
      )}

      {hasReading && (
        <div className="mx-auto mt-7 max-w-[760px] border-t border-golddim/25 pt-6 text-left">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-center text-[11.5px] tracking-[0.14em] text-golddim">
              先生与访客 · {model ? `live · ${model}` : 'live'}
            </p>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([])
                  try {
                    localStorage.removeItem(CHAT_STORE_KEY)
                  } catch {
                    /* ignore */
                  }
                }}
                className="text-[11.5px] tracking-[0.1em] text-inkmuted underline-offset-2 transition-colors hover:text-goldbright hover:underline"
              >
                清空对话
              </button>
            )}
          </div>
          <div className="space-y-5" aria-live="polite">
            {messages.map((message, index) => {
              const isVisitor = message.role === 'user'
              return (
                <div key={`${message.role}-${index}`} className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={
                      isVisitor
                        ? 'max-w-[85%] rounded-2xl rounded-br-sm border border-gold/35 bg-gold/10 px-4 py-3 text-silktext sm:max-w-[72%]'
                        : 'max-w-[92%] rounded-2xl rounded-bl-sm border border-golddim/25 bg-black/20 px-5 py-4 text-silktext sm:max-w-[86%]'
                    }
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-[11px] tracking-[0.15em] text-golddim">{isVisitor ? '访客' : '先生'}</p>
                      {!isVisitor && (
                        <button
                          type="button"
                          onClick={() => (voiceSpeaking ? voiceStop() : voiceSpeak(message.content))}
                          className="rounded-full border border-golddim/40 px-3 py-0.5 text-[11px] tracking-[0.1em] text-golddim transition-colors hover:border-goldbright hover:text-goldbright"
                          aria-label={voiceSpeaking ? '停止朗读' : '先生朗读'}
                        >
                          {voiceSpeaking ? '◼ 停止' : '▶ 先生之声'}
                        </button>
                      )}
                    </div>
                    <MessageContent content={message.content} />
                  </div>
                </div>
              )
            })}
            {busy && (
              <div className="flex justify-start">
                <p className="rounded-2xl rounded-bl-sm border border-golddim/25 bg-black/20 px-5 py-3 text-[13px] text-silkmuted">
                  先生略作思量……
                </p>
              </div>
            )}
          </div>

          <form onSubmit={sendQuestion} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-2 block text-[12px] text-silkmuted">接着问先生</span>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={1_000}
                rows={2}
                placeholder="比如：我最近更挂心事业，该从哪里留意？"
                className="w-full resize-y rounded-xl border border-golddim/40 bg-black/30 px-4 py-3 text-[14px] leading-[1.7] text-silktext placeholder:text-silkmuted/50 focus:border-goldbright focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={!question.trim() || busy}
              className="rounded-xl border border-gold/60 bg-gold/10 px-6 py-3 text-[14px] text-goldbright enabled:hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? '请稍候' : '问先生'}
            </button>
          </form>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-silkmuted/80">
            对话仅供传统文化参考；前文会做长度保护后随追问发送。
          </p>
        </div>
      )}
    </div>
  )
}
