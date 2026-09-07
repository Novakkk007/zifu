/**
 * Pages Functions AI 代理（zifu.pages.dev/api/*）
 * 上游 Kimi k2.6（思考模式）。统一流式转发：reasoning 作心跳（防 CF 100s 524）、content 透传。
 */
const KIMI_URL = 'https://api.moonshot.cn/v1/chat/completions'
const MODEL = 'kimi-k2.6'

interface Env {
  KIMI_MR_KEY?: string
  DEEPSEEK_XIANSHENG_KEY?: string
  AI_PROXY_KV?: {
    get: (k: string) => Promise<string | null>
    put: (k: string, v: string, opts?: { expirationTtl?: number }) => Promise<void>
  }
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const SYSTEM: Record<string, string> = {
  'guest-reading': '你是紫府的先生，通晓命理典籍，温和如春风，有分寸，可托付。人话铁律：零术语、结论先行、打比方、给岁数、短句口语。',
  guanzhao: '你是紫府观照的先生，以照见照亮照护三照之心看盘，温厚克制，绝不断言必然，始终给人希望与准备。',
  roundtable: '你是紫府论命圆桌的主持人，通晓各家命理，温厚克制，绝不恐吓、绝不断言必然，始终给人希望与准备。',
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '仅支持 POST' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
  const url = new URL(request.url)
  const kind = url.pathname.split('/').pop() ?? ''
  const clientIp = (request.headers.get('cf-connecting-ip') ?? 'unknown').toString()

  // 限额：单 IP 10 次/日，全局 100 次/日
  const today = new Date().toISOString().slice(0, 10)
  const ipKey = `ip:${today}:${clientIp}`
  const gKey = `g:${today}`
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

  let body: { prompt?: string; maxTokens?: number }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: '请求体无效' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
  const prompt = body.prompt ?? ''
  if (!prompt || prompt.length > 16000) {
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
          { role: 'system', content: SYSTEM[kind] ?? SYSTEM['guest-reading'] },
          { role: 'user', content: prompt },
        ],
        max_tokens: body.maxTokens ?? 9000,
        stream: true,
        // k2.6 思考模式：不传 temperature
      }),
    })
    if (!upstream.ok) {
      await upstream.text()
      return new Response(JSON.stringify({ error: `上游错误 ${upstream.status}` }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    if (!upstream.body) {
      return new Response(JSON.stringify({ error: '上游响应为空' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // 统一流式：reasoning_content 打 \u0000 前缀作心跳，content 原样透传
    const encoder = new TextEncoder()
    const reader = upstream.body.getReader()
    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }
        const chunk = new TextDecoder().decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const j = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string; reasoning_content?: string } }>
            }
            const delta = j.choices?.[0]?.delta
            if (delta?.reasoning_content) {
              // 心跳：\u0000R<长度>——前端忽略内容但据此显示「推演中」
              controller.enqueue(encoder.encode(`\u0000R${delta.reasoning_content.length}`))
            }
            if (delta?.content) {
              controller.enqueue(encoder.encode(delta.content))
            }
          } catch {
            /* 跳过非 JSON 行 */
          }
        }
      },
    })
    return new Response(stream, {
      headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    })
  } catch {
    return new Response(JSON.stringify({ error: '服务暂不可用，请稍后再试' }), {
      status: 502,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
}
