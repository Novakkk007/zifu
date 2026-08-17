/**
 * AI 参详直连模式（自带密钥）——静态托管无后端时的 live 通道。
 *
 * 架构：浏览器直连 OpenAI 兼容 API（默认 Kimi K3 / api.moonshot.cn），
 * key 由用户自行填入（存 localStorage，不出本机）。
 * 已验证 api.moonshot.cn 开启 CORS（Access-Control-Allow-Origin 回显）。
 *
 * 红线：术语数据（glossary 词条/释义）不进 prompt；prompt 仅含命盘
 * 原始数据（四柱/十神等由引擎产出的结构化数据）+ persona/depth 指令。
 */

export interface DirectReadingInput {
  /** 命盘结构化摘要（引擎产出，非术语释义） */
  chartSummary: string
  persona: string
  depth: string
  /** AI 后端提供方（kimi/deepseek，默认 kimi） */
  provider?: 'kimi' | 'deepseek'
  model?: string
  baseUrl?: string
  apiKey: string
}

export interface DirectReadingResult {
  source: 'live-direct'
  model: string
  content: string
}

// 名家主题化上下文（LJM 十神角色映射——AI 参详增强，静态引入保持同步函数签名）
import { ljmContextText } from '@contracts/engines/masters-rules/ljm'

/**
 * 命盘 → 结构化摘要（直连 prompt 用）。仅含引擎产出的数据，
 * 不注入任何术语释义（红线）。
 */
export function buildChartSummary(chart: unknown): string {
  const c = chart as {
    input?: { calendar?: string; year?: number; month?: number; day?: number; hour?: number | null }
    pillars?: Record<string, { stem: string; branch: string } | null | undefined>
    tenGods?: Record<string, string>
  }
  const inp = c.input ?? { year: 0, month: 0, day: 0 }
  const p = c.pillars ?? {}
  const lines: string[] = []
  lines.push(
    `出生：${inp.calendar === 'lunar' ? '农历' : '公历'} ${inp.year}年${inp.month}月${inp.day}日${inp.hour != null ? ` ${inp.hour}时` : '（时辰不详）'}`,
  )
  const fmt = (pz?: { stem: string; branch: string } | null) => (pz ? `${pz.stem}${pz.branch}` : '不详')
  lines.push(`四柱：年柱 ${fmt(p.year)}，月柱 ${fmt(p.month)}，日柱 ${fmt(p.day)}，时柱 ${fmt(p.hour)}`)
  if (c.tenGods && Object.keys(c.tenGods).length > 0) {
    lines.push(`十神：${Object.entries(c.tenGods).map(([k, v]) => `${k}=${v}`).join('，')}`)
  }
  // 名家主题化上下文（LJM 十神角色映射——文化解释层，不映射现实身份）
  try {
    const ljm = ljmContextText(chart as never)
    if (ljm) lines.push(ljm)
  } catch {
    /* 规则层异常时静默跳过（增强不是依赖） */
  }
  return lines.join('\n')
}

/** 参详提示词构建（结构化命盘 → 先生人格指令模板） */
export function buildReadingPrompt(input: { chartSummary: string; persona: string; depth: string }): string {
  const personaGuide: Record<string, string> = {
    scholar: '讲述侧重：格局框架与逻辑推演，引经处说明为通识推演而非定论。',
    master: '讲述侧重：整体判断与关键提示，结合五行生克与格局变化，敢下判断。',
    skeptic: '讲述侧重：审慎从容，指出多重可能与不确定处，不武断。',
  }
  const depthGuide: Record<string, string> = {
    quick: '篇幅精简，三百字上下，突出总论与最关键的一处点穴。',
    pro: '篇幅舒展，五百至八百字，总论、分述、点穴、岁运完整铺陈。',
  }
  const guide = `${personaGuide[input.persona] ?? personaGuide.scholar}\n${depthGuide[input.depth] ?? depthGuide.pro}\n`
  return (
    '你是一位紫府的先生：通晓命理典籍，温和如春风，有分寸，可托付。\\n' +
    '你给访客看盘，像坐在他旁边喝茶讲古，不是发布报告。\\n\\n' +
    '气质要求：\\n' +
    '- 先生的学问：引经据典如讲古（\"古人有句话……\"），比喻用家常之物（山水、天气、灯、路、农事），不讲术语堆砌。\\n' +
    '- 先生的温和：短句从容，以\"你\"相称，不居高临下，不说教。\\n' +
    '- 先生的分寸：敢下判断（\"是块读书的料\"），但留三分余地（\"走到哪一步还看你自己\"）；不好的事不说满，用\"留个心/宜留意/或可\"。\\n\\n' +
    '讲述结构（先讲再问）：\\n' +
    `1. ${guide}` +
    '2. 总论先行：一句话定性这个人（格局气质），再按主次分述，不平均用力。\\n' +
    '3. 点穴：命局最关键的一两处，点透；若访客未问具体事，讲述后温和一问（如\"你最近更挂心哪一处？\"），待他开口再深入指点。\\n' +
    '4. 只做文化层面的参详，不做医疗、投资、法律等具体决策建议。\\n' +
    '5. 不给出确定性生死病灾断言；不得编造古籍原文引文，只能做通识概述。\\n\\n' +
    '希望法则（无论如何，给希望——不可违背）：\\n' +
    '- 每一处警示之后，必给一条出路或转机；再\"凶\"的象，也要找到\"路\"。\\n' +
    '- 结尾永远亮色，把话头交还给访客的生活（哪怕只是\"先把今天的觉睡好\"）。\\n' +
    '- 若访客表露明显痛苦（失眠、绝望、自伤倾向），温和建议他向可信赖的亲友或专业心理支持求助。\\n\\n' +
    '忌词（出现即错）：灾、祸、血光、大难、必、注定、绝对。\\n\\n' +
    '命盘数据（幕后依据，不在嘴边罗列）：\\n' + input.chartSummary
  )
}

/** AI 后端提供方（浏览器直连均实测 CORS 全开） */
export type AIProvider = 'kimi' | 'deepseek'

export const AI_PROVIDERS: Record<AIProvider, { label: string; baseUrl: string; defaultModel: string }> = {
  kimi: { label: 'Kimi (Moonshot)', baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'kimi-k3' },
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
}

/** 直连调用（OpenAI 兼容 chat/completions） */
export async function aiDirectReading(input: DirectReadingInput): Promise<DirectReadingResult> {
  const provider: AIProvider = input.provider ?? 'kimi'
  const cfg = AI_PROVIDERS[provider] ?? AI_PROVIDERS.kimi
  const model = input.model || cfg.defaultModel
  const baseUrl = (input.baseUrl || cfg.baseUrl).replace(/\/$/, '')
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '你是紫府平台的命理文化解读助手。' },
        {
          role: 'user',
          content: buildReadingPrompt({
            chartSummary: input.chartSummary,
            persona: input.persona,
            depth: input.depth,
          }),
        },
      ],
      max_tokens: 1200,
      temperature: 0.7,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`AI 服务返回 ${res.status}${body ? `：${body.slice(0, 160)}` : ''}`)
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('AI 服务返回为空')
  return { source: 'live-direct', model, content }
}

/** 密钥本地存储（仅本机 localStorage，不上传任何服务器） */
export const AI_KEY_STORAGE_KEY = 'zifu:ai-key'
export function getStoredAiKey(): string {
  try {
    return globalThis.localStorage?.getItem(AI_KEY_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}
export function setStoredAiKey(key: string): void {
  try {
    globalThis.localStorage?.setItem(AI_KEY_STORAGE_KEY, key)
  } catch {
    /* 隐私模式静默失败 */
  }
}
