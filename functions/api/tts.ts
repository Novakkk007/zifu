/**
 * 紫府 TTS 服务（Cloudflare Pages Function）——豆包语音合成 2.0（seed-tts-2.0）。
 * 前端 POST { text } → 单向非流式合成 → 返回 mp3。
 * 密钥存 Cloudflare 环境变量：
 *   VOLC_TTS_KEY  = 语音合成 APIKey（X-Api-Key）
 *   VOLC_TTS_VOICE = 音色 ID（seed-tts-2.0 列表；默认沉稳男声占位，待配）
 * 未配置时返回 503，前端回退浏览器语音。
 */
interface Env {
  VOLC_TTS_KEY?: string
  VOLC_TTS_VOICE?: string
}

const VOLC_TTS_URL = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
const RESOURCE_ID = 'seed-tts-2.0'
/** 默认音色（示例验证可用的女声作占位；男声 ID 待从音色列表配置） */
const DEFAULT_VOICE = 'zh_female_gaolengyujie_uranus_bigtts'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const key = context.env.VOLC_TTS_KEY
  const voice = context.env.VOLC_TTS_VOICE ?? DEFAULT_VOICE
  if (!key) {
    return Response.json({ error: 'TTS not configured' }, { status: 503 })
  }
  let body: { text?: string }
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 })
  }
  const text = (body.text ?? '').replace(/\*\*|#{1,6}|\*/g, '').trim().slice(0, 800)
  if (!text) {
    return Response.json({ error: 'empty text' }, { status: 400 })
  }

  const payload = {
    req_params: {
      speaker: voice,
      audio_params: {
        format: 'mp3',
        sample_rate: 24000,
        // 沉稳先生：语速 0.92
        speed_ratio: 0.92,
      },
      text,
    },
  }

  const upstream = await fetch(VOLC_TTS_URL, {
    method: 'POST',
    headers: {
      'X-Api-Key': key,
      'X-Api-Resource-Id': RESOURCE_ID,
      'X-Api-Connect-Id': crypto.randomUUID(),
      'Content-Type': 'application/json',
      'Accept-Encoding': 'identity',
    },
    body: JSON.stringify(payload),
  })

  if (!upstream.ok) {
    return Response.json({ error: `upstream ${upstream.status}` }, { status: 502 })
  }
  // 上游分块返回多个 JSON（每块含一段 base64 data）：逐块解析并拼接
  const rawText = await upstream.text()
  const chunks = rawText.split('\n').filter((line) => line.trim().startsWith('{'))
  let merged = ''
  let lastError = ''
  for (const line of chunks) {
    try {
      const part = JSON.parse(line.trim()) as { code?: number; message?: string; data?: string }
      if (part.code !== 0) {
        lastError = part.message ?? 'tts failed'
        continue
      }
      if (part.data) merged += part.data
    } catch {
      // 跳过坏块
    }
  }
  if (!merged) {
    return Response.json({ error: lastError || 'no audio' }, { status: 502 })
  }
  const buf = Uint8Array.from(atob(merged), (ch) => ch.charCodeAt(0))
  return new Response(buf, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
  })
}
