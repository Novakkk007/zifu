/**
 * 论命圆桌 · 7 大命理流派同盘论命
 * 输入：命盘摘要 → 生成 7 段式圆桌 prompt → AI 直连（先生 key）→ 解析 7 席发言 + 共识小结
 */

export interface RoundTableSchool {
  id: string
  name: string
  school: string
  method: string
  tone: string
  focus: string[]
}

/** 7 大流派席位定义（参考「野生你盘叔」7 派论命 + 命理源流） */
export const ROUNDTABLE_SCHOOLS: RoundTableSchool[] = [
  {
    id: 'ziping-geju',
    name: '子平格局派',
    school: '《子平真诠》',
    method: '以月令为纲，先定格、后取用；正官格、七杀格、伤官格各有喜忌，专重格局成败与清浊。',
    tone: '严整克制，条分缕析，先立骨架再论血肉',
    focus: ['月令格局', '用神喜忌', '成败救应'],
  },
  {
    id: 'sanming',
    name: '三命通会派',
    school: '《三命通会》',
    method: '博采众说，神煞、纳音、胎元、干支会合兼看，重综合气象与吉凶神煞配置。',
    tone: '博雅周全，引经据典，面面俱到',
    focus: ['神煞配置', '纳音气象', '干支会合'],
  },
  {
    id: 'shenfeng',
    name: '神峰通考派',
    school: '《神峰通考》',
    method: '病药之说：雕、枯、旺、弱四病，制化损益为药；专找命局之病，再言何药可医。',
    tone: '直接点病，不绕弯子，如医者论症',
    focus: ['病药', '雕枯旺弱', '制化损益'],
  },
  {
    id: 'yuanhai',
    name: '渊海子平派',
    school: '《渊海子平》',
    method: '十神性情与六亲为体，日主强弱为权衡，重格局与性情相互印证。',
    tone: '温润敦厚，从性情处着笔',
    focus: ['十神性情', '日主强弱', '六亲缘分'],
  },
  {
    id: 'mangpai',
    name: '盲派',
    school: '盲派歌诀·象法',
    method: '重象法直断：干支组合即象，干支互制即事；不重格局术语，直接断事、断层次、断职业。',
    tone: '爽利干脆，一语中的',
    focus: ['干支取象', '直断事项', '层次职业'],
  },
  {
    id: 'qianli',
    name: '千里命稿派',
    school: '韦千里《千里命稿》',
    method: '重实务论命：格局与岁运结合，看富贵层次、行业属性、流年应期，忌空谈。',
    tone: '老练务实，如从业数十年的老先生',
    focus: ['富贵层次', '岁运应期', '行业属性'],
  },
  {
    id: 'jinkoujue',
    name: '金口诀',
    school: '大六壬金口诀',
    method: '以地支立课、三动五动断事，重当下契机与方位信息，快问快断。',
    tone: '神秘简洁，如卦师临场',
    focus: ['立课', '方位信息', '当下契机'],
  },
]

/** 构建圆桌 prompt（先生人格 + 7 派轮番发言 + 共识小结） */
export function buildRoundTablePrompt(chartSummary: string, question = ''): string {
  const seats = ROUNDTABLE_SCHOOLS.map(
    (s, i) => `【第${i + 1}席 · ${s.name}】
- 法脉：${s.school}
- 方法：${s.method}
- 口吻：${s.tone}
- 论命抓手：${s.focus.join('、')}
请以本派立场，针对此命盘发言 150-220 字：先点本派最看重的一两处，再给一句本派式的判断。`
  ).join('\n\n')

  return `你是紫府论命圆桌的主持人。今日圆桌共七席，各执一派法脉，同观一盘命局。你以先生口吻主持，既尊重各家，又守住分寸：不给恐吓之词，不给必然断言，只把各家视角如实呈现，最后留一句温和的收束。

【命盘摘要】
${chartSummary}

【访客附问】（可忽略）
${question || '无'}

【圆桌议程】
${seats}

【输出格式】严格按以下结构输出，每席独立成段，不要遗漏任何一席：
【第1席 · 子平格局派】
（发言）

【第2席 · 三命通会派】
（发言）

……（第3至第7席同式）……

【共识与分歧】
（3-5 句：哪几席所见略同、哪一席意见相左、最值得留意的一点）

【先生收束】
（1-2 句温和而有希望的话）`
}

export interface RoundTableResult {
  seats: Array<{ school: string; content: string }>
  consensus: string
  closing: string
}

/** 解析圆桌响应（按席位标记切段） */
export function parseRoundTable(text: string): RoundTableResult {
  const seats: RoundTableResult['seats'] = []
  const blocks = text.split(/(?=【第\d+席)/)
  for (const b of blocks) {
    const m = b.match(/【第\d+席\s*·\s*([^】]+)】\s*([\s\S]*)/)
    if (m) seats.push({ school: m[1].trim(), content: m[2].trim() })
  }
  // 共识与收束
  let consensus = ''
  let closing = ''
  const cm = text.match(/【共识与分歧】\s*([\s\S]*?)(?=【先生收束】|$)/)
  if (cm) consensus = cm[1].trim()
  const cl = text.match(/【先生收束】\s*([\s\S]*)$/)
  if (cl) closing = cl[1].trim()
  // 兜底：按席位数补齐缺失席
  const names = ROUNDTABLE_SCHOOLS.map((s) => s.name)
  for (const n of names) {
    if (!seats.some((s) => s.school.includes(n) || n.includes(s.school))) {
      seats.push({ school: n, content: '（此席本次缺席，可追问唤醒）' })
    }
  }
  return { seats, consensus, closing }
}

/** 圆桌 AI 调用（先生 key 直连，长输出） */
export async function runRoundTable(
  chartSummary: string,
  question?: string,
  apiKey?: string,
  provider?: 'deepseek' | 'kimi'
): Promise<{ source: string; model: string; content: string }> {
  // key 解析：显式传入 > 内置先生 key（Vite 注入）> 空（报错提示）
  const builtin = (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_DEEPSEEK_API_KEY as string | undefined
  const key = apiKey || builtin || ''
  if (!key) throw new Error('未配置先生密钥，圆桌暂不可用')
  const prov = provider ?? 'deepseek'
  const cfg = {
    deepseek: { baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
    kimi: { baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'kimi-k2.6' },
  }[prov]
  const baseUrl = cfg.baseUrl.replace(/\/$/, '')
  const prompt = buildRoundTablePrompt(chartSummary, question)
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: cfg.defaultModel,
      messages: [
        {
          role: 'system',
          content:
            '你是紫府论命圆桌的主持人，通晓各家命理，温厚克制，绝不恐吓、绝不断言必然，始终给人希望与准备。',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4200,
      temperature: 0.75,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`圆桌服务返回 ${res.status}${body ? `：${body.slice(0, 160)}` : ''}`)
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('圆桌服务返回为空')
  return { source: 'live-roundtable', model: cfg.defaultModel, content }
}
