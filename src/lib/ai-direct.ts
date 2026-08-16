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

/** 参详提示词构建（结构化命盘 → 指令模板） */
export function buildReadingPrompt(input: { chartSummary: string; persona: string; depth: string }): string {
  const personaGuide: Record<string, string> = {
    scholar: '以严谨学术风格解读，先述格局框架，再逐层分析，引用处说明为通识推演而非定论。',
    master: '以传统命师口吻解读，结合五行生克与格局变化，给出整体判断与关键提示。',
    skeptic: '以审慎态度解读，指出推演中的不确定性与多重可能，避免确定性断言。',
  }
  const depthGuide: Record<string, string> = {
    quick: '简明扼要，300字以内，突出核心结论。',
    pro: '完整解读，500-800字，覆盖格局、五行、大运要点。',
  }
  const guide = `${personaGuide[input.persona] ?? personaGuide.scholar}\n${depthGuide[input.depth] ?? depthGuide.pro}\n`
  return (
    '你是传统命理文化的研究者，基于给出的八字命盘数据做通识性文化解读。\n' +
    '要求：\n' +
    `1. ${guide}` +
    '2. 只做文化层面的推演阐述，不做医疗、投资、法律等具体决策建议。\n' +
    '3. 不给出确定性生死病灾断言，措辞用"传统上认为/或可参考"等。\n' +
    '4. 不得编造古籍原文引文，只能做通识概述。\n\n' +
    '命盘数据：\n' + input.chartSummary
  )
}

/** 直连调用（OpenAI 兼容 chat/completions） */
export async function aiDirectReading(input: DirectReadingInput): Promise<DirectReadingResult> {
  const model = input.model || 'kimi-k3'
  const baseUrl = (input.baseUrl || 'https://api.moonshot.cn/v1').replace(/\/$/, '')
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
