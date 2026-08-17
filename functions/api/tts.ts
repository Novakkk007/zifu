/**
 * 紫府 TTS 服务（Cloudflare Pages Function）——火山引擎豆包语音合成。
 * 前端 POST { text } → 豆包 TTS 合成先生之声 → 返回 mp3。
 * Key 存于 Cloudflare 环境变量 VOLC_TTS_KEY（ark-xxx，不暴露前端）。
 * 未配置 key 时返回 503，前端回退浏览器语音合成。
 */
interface Env {
  VOLC_TTS_KEY?: string
  VOLC_TTS_APPID?: string
}

const VOLC_TTS_URL = 'https://openspeech.bytedance.com/api/v1/tts'

/** 齐静春式沉稳男声候选（豆包 voice_type）：
 * zh_male_M392_conversation_wvae_bigtts —— 通用对话男声（自然沉稳）
 * 备选：zh_male_qingrun_jingying_sunne（精英男声）、zh_male_wennuan_sunne（温暖男声）
 */
const VOICE_TYPE = 'zh_male_M392_conversation_wvae_bigtts'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const rawKey = context.env.VOLC_TTS_KEY
  const appid = context.env.VOLC_TTS_APPID
  if (!rawKey) {
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

  // 鉴权双格式兼容：
  // 1) 语音合成专属 APIKey（形式 "APIKey;xxx" 或存的就是带前缀完整串）→ Authorization 原文透传
  // 2) 传统 access_token（appid 单独存 VOLC_TTS_APPID）→ Bearer;{token}
  const authHeader = rawKey.startsWith('APIKey;') || rawKey.startsWith('APIKey ')
    ? rawKey
    : `Bearer;${rawKey}`

  const payload = {
    app: {
      appid: appid ?? 'zifu-palace',
      token: 'access_token',
      cluster: 'volcano_tts',
    },
    user: { uid: 'zifu-visitor' },
    audio: {
      voice_type: VOICE_TYPE,
      encoding: 'mp3',
      speed_ratio: 0.92,
      volume_ratio: 1.0,
      pitch_ratio: 0.96,
    },
    request: {
      reqid: crypto.randomUUID(),
      text,
      text_type: 'plain',
      operation: 'query',
    },
  }

  const upstream = await fetch(VOLC_TTS_URL, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!upstream.ok) {
    return Response.json({ error: `upstream ${upstream.status}` }, { status: 502 })
  }
  const ct = upstream.headers.get('content-type') ?? ''
  if (ct.includes('audio') || ct.includes('mpeg')) {
    const buf = new Uint8Array(await upstream.arrayBuffer())
    return new Response(buf, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    })
  }
  const errText = await upstream.text()
  return Response.json({ error: errText.slice(0, 300) }, { status: 502 })
}
