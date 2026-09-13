/**
 * 紫府 AI 代理（Pages Functions 版——挂 zifu.pages.dev/api/*，国内稳定可达）
 * workers.dev 域名被 GFW 封锁波动（2026-09-01 事故：圆桌/观照/详批全断）
 * 逻辑同 zifu-ai-proxy Worker；先生 key 存 Pages secret（前端零 key）
 * 端点：POST /api/guest-reading | /api/roundtable | /api/guanzhao；GET /api/stats
 */
const KIMI_URL = 'https://api.moonshot.cn/v1/chat/completions'
const MODEL = 'kimi-k2.6'

const SYSTEM: Record<string, string> = {
  'guest-reading':
    '你是紫府的先生：通晓命理典籍，温和如春风，有分寸，无论如何给访客希望。逐句引经，法度示人。',
  roundtable:
    '你是紫府论命圆桌的主持人，通晓各家命理，温厚克制，绝不恐吓、绝不断言必然，始终给人希望与准备。',
  guanzhao:
    '你是紫府的先生：通晓命理典籍，温和如春风，有分寸。今夜只做观照，不下断语，不预言祸福。',
}

interface Env {
  DEEPSEEK_XIANSHENG_KEY?: string
  KIMI_MR_KEY?: string
  AI_PROXY_KV?: KVNamespace
  ZIFU_BOARD?: KVNamespace
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/* ================ 华山榜（/api/board） ================
 * 假名制 · 默认不上榜（由前端开关把关） · 三层榜
 * 隐私铁律：榜上只记假名与战绩，不採生辰、不录命盘、不取身份信息。
 */

/** 七门派（与前端 GATES 一致） */
const BOARD_SECTS = [
  { sect: '子平格局派', gate: '藏剑峰' },
  { sect: '三命通会派', gate: '通会峰' },
  { sect: '神峰通考派', gate: '神峰' },
  { sect: '渊海子平派', gate: '渊海峰' },
  { sect: '盲派', gate: '听风峰' },
  { sect: '千里命稿派', gate: '千里峰' },
  { sect: '金口诀', gate: '口诀峰' },
]

interface BoardEntry {
  id: string
  name: string
  wins: number
  gates: number
  rankName: string
  weekKey: string
  weekWins: number
  updatedAt: string
}

/** 段位名（与前端 RANKS 门槛一致：0/3/10/25/50/100 胜，绝顶宗师需七峰尽破） */
function boardRankName(wins: number, gates: number): string {
  if (wins >= 100 && gates >= 7) return '绝顶宗师'
  if (wins >= 50) return '剑道高手'
  if (wins >= 25) return '一流剑客'
  if (wins >= 10) return '二流剑客'
  if (wins >= 3) return '三流剑客'
  return '初入江湖'
}

/** 北京日（限流按北京自然日计） */
function beijingDayKey(): string {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
}

/** 当前周 key：北京时间周一 00:00 起算——周榜每周一重置 */
function mondayKey(): string {
  const b = new Date(Date.now() + 8 * 3600_000)
  const diff = (b.getUTCDay() + 6) % 7
  return new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate() - diff))
    .toISOString()
    .slice(0, 10)
}

/** 去除控制字符（\x00-\x1f 与 DEL，不写控制字符正则以过 lint） */
function stripControlChars(s: string): string {
  let out = ''
  for (const ch of s) {
    const c = ch.charCodeAt(0)
    if (c >= 32 && c !== 127) out += ch
  }
  return out
}

function sanitizeBoardName(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return stripControlChars(raw).trim().slice(0, 16)
}

function isInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v)
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const url = new URL(request.url)
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

  // GET /api/board —— 华山榜三层（总榜 Top100 / 周榜 Top50 每周一重置 / 门派榜 7×Top20）
  if (request.method === 'GET' && url.pathname === '/api/board') {
    const kv = env.ZIFU_BOARD ?? env.AI_PROXY_KV
    const weekKey = mondayKey()
    if (!kv) {
      return new Response(
        JSON.stringify({
          available: false,
          weekKey,
          total: [],
          week: [],
          sects: BOARD_SECTS.map((s) => ({ ...s, items: [] })),
          note: '华山榜暂未开榜——云端名册未启，战绩仍留本机。',
        }),
        { headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      )
    }
    try {
      const entries: BoardEntry[] = []
      let cursor: string | undefined
      do {
        const page = await kv.list({ prefix: 'entry:' })
        for (const k of page.keys) {
          const raw: unknown = await kv.get(k.name, 'json')
          if (typeof raw === 'object' && raw !== null) {
            const e = raw as Partial<BoardEntry>
            if (
              typeof e.id === 'string' &&
              typeof e.name === 'string' &&
              typeof e.wins === 'number' &&
              typeof e.gates === 'number' &&
              typeof e.rankName === 'string' &&
              e.wins >= 1
            ) {
              entries.push({
                id: e.id,
                name: e.name,
                wins: e.wins,
                gates: e.gates,
                rankName: e.rankName,
                weekKey: typeof e.weekKey === 'string' ? e.weekKey : '',
                weekWins: typeof e.weekWins === 'number' ? e.weekWins : 0,
                updatedAt: typeof e.updatedAt === 'string' ? e.updatedAt : '',
              })
            }
          }
        }
        cursor = page.list_complete ? undefined : page.cursor
      } while (cursor)

      const proj = (e: BoardEntry, withWeek = false) =>
        withWeek
          ? { name: e.name, wins: e.wins, gates: e.gates, rankName: e.rankName, weekWins: e.weekWins }
          : { name: e.name, wins: e.wins, gates: e.gates, rankName: e.rankName }

      const total = [...entries]
        .sort((a, b) => b.wins - a.wins || (a.updatedAt < b.updatedAt ? -1 : 1))
        .slice(0, 100)
        .map((e) => proj(e))

      const week = [...entries]
        .filter((e) => e.weekKey === weekKey && e.weekWins >= 1)
        .sort((a, b) => b.weekWins - a.weekWins || b.wins - a.wins)
        .slice(0, 50)
        .map((e) => proj(e, true))

      const sects = BOARD_SECTS.map((s, i) => ({
        ...s,
        items: [...entries]
          .filter((e) => Math.min(e.gates, 6) === i)
          .sort((a, b) => b.wins - a.wins)
          .slice(0, 20)
          .map((e) => proj(e)),
      }))

      return new Response(JSON.stringify({ available: true, weekKey, total, week, sects }), {
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    } catch {
      return new Response(
        JSON.stringify({
          available: false,
          weekKey,
          total: [],
          week: [],
          sects: BOARD_SECTS.map((s) => ({ ...s, items: [] })),
          note: '榜单暂未取到，稍后再看。',
        }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }
  }

  // GET /api/stats
  if (request.method === 'GET' && url.pathname === '/api/stats') {
    const d = dayKey()
    const g = Number((await env.AI_PROXY_KV?.get(`global:${d}`)) ?? 0)
    const tk = Number((await env.AI_PROXY_KV?.get(`tokens:${d}`)) ?? 0)
    return new Response(JSON.stringify({ date: d, calls: g, limit: 100, tokens: tk }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
  if (request.method !== 'POST') return new Response('not found', { status: 404 })

  // POST /api/board —— 自愿上榜（假名制；限流：同匿名 id 每日 3 次 + 单线路每日 30 次）
  if (url.pathname === '/api/board') {
    const kv = env.ZIFU_BOARD ?? env.AI_PROXY_KV
    if (!kv) {
      return new Response(JSON.stringify({ error: '华山榜暂未开榜——战绩留本机即可。' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: '请求体无效' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const b = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
    const id = typeof b.id === 'string' ? b.id : ''
    if (!/^[A-Za-z0-9_-]{1,16}$/.test(id)) {
      return new Response(JSON.stringify({ error: '匿名标识无效' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    if (!isInt(b.wins) || b.wins < 0 || b.wins > 100000) {
      return new Response(JSON.stringify({ error: '胜场数值无效' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    if (!isInt(b.gates) || b.gates < 0 || b.gates > 7) {
      return new Response(JSON.stringify({ error: '峰数数值无效' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const wins = b.wins
    const gates = b.gates
    const name = sanitizeBoardName(b.name) || '无名剑客'

    const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For')?.split(',')[0] ?? 'unknown'
    const day = beijingDayKey()
    const rlKey = `rl:${day}:${id}`
    const ipKey = `rlip:${day}:${ip}`
    const rlCount = Number((await kv.get(rlKey)) ?? 0)
    const ipCount = Number((await kv.get(ipKey)) ?? 0)
    if (rlCount >= 3) {
      return new Response(JSON.stringify({ error: '今日已三次提交战绩——留些胜负，明日再来。' }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    if (ipCount >= 30) {
      return new Response(JSON.stringify({ error: '今日此线路提交已满——明日再来。' }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    await kv.put(rlKey, String(rlCount + 1), { expirationTtl: 86400 })
    await kv.put(ipKey, String(ipCount + 1), { expirationTtl: 86400 })

    const key = `entry:${id}`
    let prev: Partial<BoardEntry> | null = null
    try {
      const raw: unknown = await kv.get(key, 'json')
      if (typeof raw === 'object' && raw !== null) prev = raw as Partial<BoardEntry>
    } catch {
      prev = null
    }
    const prevWins = typeof prev?.wins === 'number' ? prev.wins : 0
    const prevGates = typeof prev?.gates === 'number' ? prev.gates : 0
    const wk = mondayKey()
    // 本周胜场 = 本周内历次提交的胜场增量（跨周清零重计）
    const weekWins =
      (prev?.weekKey === wk && typeof prev?.weekWins === 'number' ? prev.weekWins : 0) +
      Math.max(0, wins - prevWins)
    const finalWins = Math.max(prevWins, wins)
    const finalGates = Math.max(prevGates, gates)
    const entry: BoardEntry = {
      id,
      name,
      wins: finalWins,
      gates: finalGates,
      rankName: boardRankName(finalWins, finalGates),
      weekKey: wk,
      weekWins,
      updatedAt: new Date().toISOString(),
    }
    await kv.put(key, JSON.stringify(entry))
    return new Response(
      JSON.stringify({
        ok: true,
        name,
        wins: finalWins,
        gates: finalGates,
        rankName: entry.rankName,
        weekWins,
        remaining: Math.max(0, 2 - rlCount),
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }

  // POST /api/<kind>
  const kind = url.pathname.replace('/api/', '').split('/')[0] as
    | 'guest-reading'
    | 'roundtable'
    | 'guanzhao'
  if (!SYSTEM[kind]) return new Response('not found', { status: 404 })

  const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For')?.split(',')[0] ?? 'unknown'
  // 限流：单 IP 10/日 + 全局 100/日
  const d = dayKey()
  const ipKey = `ip:${d}:${ip}`
  const gKey = `global:${d}`
  if (env.AI_PROXY_KV) {
    const ipCount = Number((await env.AI_PROXY_KV.get(ipKey)) ?? 0)
    const gCount = Number((await env.AI_PROXY_KV.get(gKey)) ?? 0)
    if (ipCount >= 30) {
      return new Response(JSON.stringify({ error: '今日体验次数已用完（单设备 30 次），明日再来' }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    if (gCount >= 100) {
      return new Response(JSON.stringify({ error: '今日访客较多，圆桌暂时客满，明日再来' }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    await env.AI_PROXY_KV.put(ipKey, String(ipCount + 1), { expirationTtl: 86400 })
    await env.AI_PROXY_KV.put(gKey, String(gCount + 1), { expirationTtl: 86400 })
  }

  let body: { prompt?: string; maxTokens?: number; temperature?: number }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: '请求体无效' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
  const prompt = body.prompt ?? ''
  if (!prompt || prompt.length > 8000) {
    return new Response(JSON.stringify({ error: '内容长度不合法' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const key = env.KIMI_MR_KEY ?? env.DEEPSEEK_XIANSHENG_KEY ?? ''
  if (!key) {
    return new Response(JSON.stringify({ error: '服务未就绪（密钥缺失）' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const upstream = await fetch(KIMI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM[kind] },
          { role: 'user', content: prompt },
        ],
        max_tokens: body.maxTokens ?? 9000,
        // kimi-k2.6 思考模型不支持 temperature 参数——不传
      }),
    })
    if (!upstream.ok) {
      await upstream.text()
      return new Response(JSON.stringify({ error: `上游错误 ${upstream.status}` }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { total_tokens?: number }
    }
    const content = data.choices?.[0]?.message?.content ?? ''
    const tokens = data.usage?.total_tokens ?? 0
    if (env.AI_PROXY_KV) {
      const tk = Number((await env.AI_PROXY_KV.get(`tokens:${d}`)) ?? 0)
      await env.AI_PROXY_KV.put(`tokens:${d}`, String(tk + tokens), { expirationTtl: 86400 })
    }
    return new Response(JSON.stringify({ content, source: 'zifu-pages-api', model: MODEL, tokens }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: '服务暂不可用，请稍后再试' }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
}
