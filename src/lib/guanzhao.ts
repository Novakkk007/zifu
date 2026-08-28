/**
 * 观照见性 · AI 观照
 * 与八字参详不同：不排盘断事、不吉凶预言——以生辰为底色，如月照水，映照当下的你。
 * 输入：命盘摘要 → 观照 prompt → AI 直连（先生 key）→ 观照短文 + 箴言
 */
export interface GuanzhaoResult {
  verse: string // 开篇金句
  body: string // 观照正文
  motto: string // 收束箴言
}

/** 构建观照 prompt */
export function buildGuanzhaoPrompt(chartSummary: string, name = '', focus = ''): string {
  return `你是紫府的先生，今夜为一位访客作「观照」。

观照不是算命：不下吉凶断语，不预言祸福，不评格局高低。观照是点一盏灯，照见此人当下的样子——性格的底色、内在的张与驰、以及那珍贵的、他自己未必看见的部分。

【命盘摘要】（仅作气质的底色参考，不必逐项解读）
${chartSummary}

【访客称谓】${name || '这位有缘人'}

【访客想被照见的主题】（可选，如：最近的困惑、一段关系、事业的倦怠）
${focus || '无——只求一照'}

请以先生的口吻写一篇观照（450-650 字）：
1. 开篇一句金句（10-20 字，如箴如偈）
2. 正文：映照其性情的两三个侧面（借命盘五行气象为喻，但落笔在人的当下；温和、具体、不说教）
3. 收束一句箴言（15-30 字，有希望而不鸡汤）

风格：文白相间，如月照水，克制而有余韵。不要出现「你的命」「注定」「大凶」「大吉」等字眼。`
}

/** 观照 AI 调用（先生 key 直连） */
export async function runGuanzhao(
  chartSummary: string,
  name?: string,
  focus?: string,
  apiKey?: string
): Promise<{ content: string }> {
  const builtin = (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_DEEPSEEK_API_KEY as string | undefined
  const key = apiKey || builtin || ''
  if (!key) throw new Error('未配置先生密钥，观照暂不可用')
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            '你是紫府的先生：通晓命理典籍，温和如春风，有分寸，无论如何给访客希望。今夜只做观照，不下断语。',
        },
        { role: 'user', content: buildGuanzhaoPrompt(chartSummary, name, focus) },
      ],
      max_tokens: 1600,
      temperature: 0.85,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`观照服务返回 ${res.status}${body ? `：${body.slice(0, 160)}` : ''}`)
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('观照服务返回为空')
  return { content }
}
