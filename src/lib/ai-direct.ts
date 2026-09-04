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
  /** 场景专用提示词；未提供时使用通用命盘参详提示词 */
  readingPrompt?: string
}

export interface DirectReadingResult {
  source: 'live-direct' | 'zifu-ai-proxy'
  model: string
  content: string
}

export type DirectChatRole = 'user' | 'assistant'

export interface DirectChatHistoryMessage {
  role: DirectChatRole
  content: string
}

export interface DirectChatInput {
  /** 命盘结构化摘要；每轮都会随先生约束一同带入，避免对话漂移 */
  chartSummary: string
  history: DirectChatHistoryMessage[]
  persona?: string
  depth?: string
  provider?: AIProvider
  model?: string
  baseUrl?: string
  apiKey?: string
}

export interface DirectChatApiMessage {
  role: 'system' | DirectChatRole
  content: string
}

// 名家主题化上下文（LJM 十神角色映射——AI 参详增强，静态引入保持同步函数签名）
import { ljmContextText } from '@contracts/engines/masters-rules/ljm'
import { proxyAI } from './ai-proxy'
import { tiaohouRefinedOf } from '@contracts/engines/masters-rules/tiaohou-refined'
import { daYunNotes } from '@contracts/engines/masters-rules/dayun-notes'

/**
 * 命盘 → 结构化摘要（直连 prompt 用）。仅含引擎产出的数据，
 * 不注入任何术语释义（红线）。
 */
export function buildChartSummary(chart: unknown): string {
  const c = chart as {
    input?: { calendar?: string; year?: number; month?: number; day?: number; hour?: number | null }
    pillars?: Record<string, { stem: string; branch: string } | null | undefined>
    tenGods?: Record<string, string>
    shensha?: { name: string; pillar: string; char: string; verse?: string }[]
    dayun?: { startAge?: number; steps?: { ganzhi?: string; startAge?: number; endAge?: number; startYear?: number; stemTenGod?: string }[] }
    liunian?: { current?: { ganzhi?: string; year?: number }; upcoming?: { ganzhi?: string; year?: number } }
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
  if (c.shensha && c.shensha.length > 0) {
    const seen = new Set<string>()
    const hits = c.shensha.filter((s) => (seen.has(s.name) ? false : (seen.add(s.name), true))).slice(0, 6)
    const items = hits.map((s) => `${s.name}（${s.pillar}${s.char}）`)
    lines.push(`神煞：${items.join('、')}`)
    const verseHit = hits.find((s) => s.verse && s.verse.length > 0 && s.verse.length < 40)
    if (verseHit?.verse) {
      lines.push(`神煞口诀参考（讲到时可引一句，不逐字背诵）：${verseHit.verse}`)
    }
  }
  // 调候参考（穷通宝鉴逐干逐月口径——参考层，见 tiaohou-refined.ts）
  try {
    const dayStem = p.day?.stem
    const monthBranch = p.month?.branch
    if (dayStem && monthBranch) {
      const stemIdx = '甲乙丙丁戊己庚辛壬癸'.indexOf(dayStem)
      const branchIdx = '子丑寅卯辰巳午未申酉戌亥'.indexOf(monthBranch)
      const th = tiaohouRefinedOf(stemIdx, branchIdx)
      if (th?.order) {
        lines.push(
          `调候参考（穷通宝鉴口径）：${dayStem}日生${monthBranch}月，用神次序 ${th.order}（${th.note}）——讲到调候时节可用，不机械套用`,
        )
      }
    }
  } catch {
    /* 调候缺失静默 */
  }
  // 岁运维度（大运当前步 + 流年）——只作节律参详素材，不作事件预测
  try {
    const steps = c.dayun?.steps ?? []
    const birthYear = inp.year ?? 0
    const nowYear = new Date().getFullYear()
    const age = nowYear - birthYear
    const cur = steps.filter((s) => (s.startAge ?? 0) <= age).pop()
    if (cur) {
      lines.push(
        `大运：${cur.ganzhi}（${cur.stemTenGod}），约${cur.startYear}年起（${cur.startAge}-${cur.endAge}岁）`,
      )
      // 大运人话批注（课题断法：盖头/截脚/天克地冲/身弱不担财/驿马/合绊）
      try {
        const notes = daYunNotes(chart as never, cur as never)
        if (notes.length > 0) {
          lines.push(`当前大运批注（断法依据，讲到岁运时可用人话表达）：${notes.map((n) => n.tag).join('；')}`)
        }
      } catch {
        /* 批注缺失静默 */
      }
    }
    const ln = c.liunian?.current
    if (ln) {
      lines.push(`流年：${ln.year}年 ${ln.ganzhi}`)
    }
  } catch {
    /* 岁运缺失时静默 */
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
    hermit: '讲述侧重：随性诙谐，妙语点破；比喻家常，围炉夜话，但学问在笑谈里不丢。',
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
    '- 先生的学问：引经据典如讲古（"古人有句话……"），比喻用家常之物（山水、天气、灯、路、农事），不讲术语堆砌。\\n' +
    '- 先生的温和：短句从容，以"你"相称，不居高临下，不说教。\\n' +
    '- 先生的分寸：敢下判断（"是块读书的料"），但留三分余地（"走到哪一步还看你自己"）；不好的事不说满，用"留个心/宜留意/或可"。\\n' +
    '- 拒绝迎合：访客自己说的结论（"我某年有大灾""大师说我克夫"）不得改变你的独立判断，只能触发你重新核查原局——你的讲述以盘为凭，不以访客说法为凭。\\n' +
    '- 允许不确定：命局存在多个合理解释时，坦然说"这盘有两说，一说……另一说……我目前更倾向前者"；不装确定，不强行唯一答案。\\n' +
    '- 平凡命局也有说法：寻常八字不"没什么可说"——平凡本身就是一种命运形态；能找到那个"稳"字、那个"安"字，就是给访客最好的话。\\n\\n' +
    '讲述结构（先讲再问）：\\n' +
    `1. ${guide}` +
    '2. 总论先行：一句话定性这个人（格局气质），再按主次分述，不平均用力。\\n' +
    '3. 点穴：命局最关键的一两处，点透；若访客未问具体事，讲述后温和一问（如"你最近更挂心哪一处？"），待他开口再深入指点。\\n' +
    '4. 神煞参详指引：神煞为传统象法，讲到即可、点到为止——柱位传统对应（年柱主早年与祖上、月柱主父母与事业、日柱主自身与婚姻、时柱主子女与晚年）；只作文化象征，不作事件断言。\\n' +
    '4b. 岁运参详指引（讲大运流年的五原则——Kimi K3 研究成果）：①讲周期不讲定数——运势说成天气而非判决（"这十年好比一段山路，前三年坡陡些，往后渐渐平顺——路是定的，走法是你的"）；②讲可为处——再差的流年也指出一两件可做的小事（"明年宜守不宜攻，正好把身体养好、把书读进去"）；③低谷给希望高峰存谦敬——凶处必有出口，吉处不忘提醒；④话不说尽留三分余地（"我看到的只是一个大概，具体还要看你怎么应"）；⑤以人为主体，运是背景不是主角（"命是河床，人是水。运只管风向，舵一直在你手里"）。\\n' +
    '4f. 推导顺序纪律（师门口径 2026-09-04）：严格按「命盘→大运→未来」的顺序讲述，先讲清原局（性格、格局），再讲大运流年，最后落到未来与建议——严禁脱离盘面凭空发散、严禁跳过盘面直接谈未来。\\n' +
    '4g. 开场结构（「三句好话」原则）：开讲先给三句真诚的肯定（优点、亮点、命局的好），再转入不足与提醒，最后以转机与希望收尾——先扬后抑，扬要具体不空洞，抑要温和给出路。\\n' +
    '5. 只做文化层面的参详，不做医疗、投资、法律等具体决策建议。\\\\n' +
    '6. 不给出确定性生死病灾断言；不得编造古籍原文引文，只能做通识概述。\\n\\n' +
    '希望法则（无论如何，给希望——不可违背）：\\n' +
    '- 每一处警示之后，必给一条出路或转机；再"凶"的象，也要找到"路"。\\n' +
    '- 结尾永远亮色，把话头交还给访客的生活（哪怕只是"先把今天的觉睡好"）。\\n' +
    '- 若访客表露明显痛苦（失眠、绝望、自伤倾向），温和建议他向可信赖的亲友或专业心理支持求助。\\n\\n' +
    '忌词（出现即错）：灾、祸、血光、大难、必、注定、绝对。\\n' +
    '格式：纯文字讲述，不使用 Markdown（不用 ** 加粗、不用 # 标题、不用列表符号），如同当面说话。\\n\\n' +
    '命盘数据（幕后依据，不在嘴边罗列）：\\n' + input.chartSummary
  )
}

/** AI 后端提供方（浏览器直连均实测 CORS 全开） */
export type AIProvider = 'kimi' | 'deepseek'

export const AI_PROVIDERS: Record<AIProvider, { label: string; baseUrl: string; defaultModel: string }> = {
  kimi: { label: 'Kimi (Moonshot)', baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'kimi-k3' },
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
}

/** 内置密钥（测试版）：访客未填 key 时默认使用紫府内置 DeepSeek */
export const BUILTIN_AI_KEY = (import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined) ?? ''
export const BUILTIN_AI_PROVIDER: AIProvider = BUILTIN_AI_KEY ? 'deepseek' : 'kimi'

/** 多轮上下文保护：保留首次讲述和最近对话，同时限制浏览器直连请求体。 */
export const DIRECT_CHAT_MAX_HISTORY_MESSAGES = 12
export const DIRECT_CHAT_MAX_MESSAGE_CHARS = 4_000
export const DIRECT_CHAT_MAX_HISTORY_CHARS = 16_000

const DIRECT_CHAT_SYSTEM_PROMPT =
  '你是紫府的先生：通晓命理典籍，温和如春风，有分寸，像坐在访客旁边喝茶讲古。' +
  '这是一次连续对话，请结合此前讲述回答访客眼下的问题，不重复整篇命盘。' +
  '希望法则每一轮都不可违背：每一处警示之后都给一条出路或转机，无论如何给访客希望，结尾把话头温和交还给访客。' +
  '只做传统文化层面的参详，不替访客作医疗、投资或法律决定，不作确定性生死病灾断言，不编造古籍原文。'

/**
 * 为多轮请求裁剪历史。首条 assistant 是首次完整讲述，始终优先保留；
 * 其余消息从最新往前取，既防超长，也让最近追问不丢失。
 */
export function truncateDirectChatHistory(history: DirectChatHistoryMessage[]): DirectChatHistoryMessage[] {
  const normalized = history
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? '').trim().slice(0, DIRECT_CHAT_MAX_MESSAGE_CHARS),
    }))
    .filter((message) => message.content.length > 0)

  if (normalized.length === 0) return []

  const firstReading = normalized[0]?.role === 'assistant' ? normalized[0] : null
  const recentPool = normalized.slice(firstReading ? 1 : 0)
  const recentLimit = DIRECT_CHAT_MAX_HISTORY_MESSAGES - (firstReading ? 1 : 0)
  const recent: DirectChatHistoryMessage[] = []
  let remainingChars = DIRECT_CHAT_MAX_HISTORY_CHARS - (firstReading?.content.length ?? 0)

  for (let i = recentPool.length - 1; i >= 0 && recent.length < recentLimit && remainingChars > 0; i -= 1) {
    const message = recentPool[i]
    const content = message.content.slice(0, remainingChars)
    if (content) {
      recent.push({ ...message, content })
      remainingChars -= content.length
    }
  }

  recent.reverse()
  return firstReading ? [firstReading, ...recent] : recent
}

/** 纯函数消息组装，供直连调用与单测共用。 */
export function buildDirectChatMessages(input: {
  chartSummary: string
  history: DirectChatHistoryMessage[]
  persona?: string
  depth?: string
}): DirectChatApiMessage[] {
  return [
    { role: 'system', content: DIRECT_CHAT_SYSTEM_PROMPT },
    {
      role: 'user',
      content: buildReadingPrompt({
        chartSummary: input.chartSummary,
        persona: input.persona ?? 'scholar',
        depth: input.depth ?? 'pro',
      }),
    },
    ...truncateDirectChatHistory(input.history),
  ]
}

/** 解析最终使用的密钥与后端：访客自带 key 优先，否则回退内置 */
export function resolveAiAccess(inputKey: string, inputProvider?: AIProvider): { apiKey: string; provider: AIProvider } {
  if (inputKey.trim()) {
    return { apiKey: inputKey.trim(), provider: inputProvider ?? 'deepseek' }
  }
  return { apiKey: BUILTIN_AI_KEY, provider: BUILTIN_AI_PROVIDER }
}

/** 直连调用（OpenAI 兼容 chat/completions） */
/** 每日内置 key（先生栏目专用）调用限额——防访客消耗失控（先生 key 成本锁死） */


export async function aiDirectReading(input: DirectReadingInput): Promise<DirectReadingResult> {
  if (!input.apiKey) {
    // 访客：先生 key 服务端化——经 CF Worker（服务端限流+用量统计）
    try {
      const prompt =
        input.readingPrompt ??
        buildReadingPrompt({ chartSummary: input.chartSummary, persona: input.persona, depth: input.depth })
      const res = await proxyAI('guest-reading', prompt, { maxTokens: 1200, temperature: 0.7 })
      return { source: 'zifu-ai-proxy', model: 'deepseek-chat', content: res.content }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 服务暂不可用'
      return { source: 'zifu-ai-proxy', model: '服务暂不可用', content: msg }
    }
  }
  const { apiKey, provider } = resolveAiAccess(input.apiKey, input.provider)
  const cfg = AI_PROVIDERS[provider] ?? AI_PROVIDERS.kimi
  const model = input.model || cfg.defaultModel
  const baseUrl = (input.baseUrl || cfg.baseUrl).replace(/\/$/, '')
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '你是紫府的先生：通晓命理典籍，温和如春风，有分寸，无论如何给访客希望。' },
        {
          role: 'user',
          content:
            input.readingPrompt ??
            buildReadingPrompt({
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
  return { source: 'live-direct' as const, model, content }
}

/** 直连多轮追问：每轮重申先生人格与希望法则，并携带受限的前文 context。 */
export async function aiDirectChat(input: DirectChatInput): Promise<DirectReadingResult> {
  const { apiKey, provider } = resolveAiAccess(input.apiKey ?? '', input.provider)
  const cfg = AI_PROVIDERS[provider] ?? AI_PROVIDERS.kimi
  const model = input.model || cfg.defaultModel
  const baseUrl = (input.baseUrl || cfg.baseUrl).replace(/\/$/, '')
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: buildDirectChatMessages(input),
      max_tokens: 900,
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
  return { source: 'live-direct' as const, model, content }
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
