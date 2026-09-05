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
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10)
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
    if (ipCount >= 10) {
      return new Response(JSON.stringify({ error: '今日体验次数已用完（单设备 10 次），明日再来' }), {
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
        max_tokens: body.maxTokens ?? 4000,
        temperature: body.temperature ?? 0.7,
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
