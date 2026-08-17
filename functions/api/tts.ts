/**
 * 紫府 TTS 服务（Cloudflare Pages Function）
 * 前端 POST { text } → 调 Minimax TTS 合成先生之声 → 返回音频。
 * Key 存于 Cloudflare 环境变量 MINIMAX_TTS_KEY（不暴露前端）。
 * 未配置 key 时返回 503，前端回退浏览器语音合成。
 */
interface Env {
  MINIMAX_TTS_KEY?: string
}

/** Minimax 官方 endpoint（tts-v1，group_id 兼容） */
const MINIMAX_TTS_URL = 'https://api.minimax.chat/v1/t2a_v2'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const key = context.env.MINIMAX_TTS_KEY
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
    model: 'speech-02-hd',
    text,
    stream: false,
    voice_setting: {
      voice_id: 'male-qn-qingse', // 青涩男声→可换：male-qn-jingying 等
      speed: 0.92,
      vol: 1.0,
      pitch: -3, // 略低沉：齐静春式沉稳
    },
    audio_setting: {
      format: 'mp3',
      sample_rate: 32000,
    },
  }

  const upstream = await fetch(`${MINIMAX_TTS_URL}?GroupId=${key.split('::')[0] ?? 'zifu'}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!upstream.ok) {
    return Response.json(
      { error: `upstream ${upstream.status}` },
      { status: 502 },
    )
  }
  const data = (await upstream.json()) as {
    data?: { audio?: string }
    base_resp?: { status_code?: number; status_msg?: string }
  }
  if (data.base_resp?.status_code && data.base_resp.status_code !== 0) {
    return Response.json(
      { error: data.base_resp.status_msg ?? 'tts failed' },
      { status: 502 },
    )
  }
  const b64 = data.data?.audio
  if (!b64) {
    return Response.json({ error: 'no audio' }, { status: 502 })
  }
  const buf = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0))
  return new Response(buf, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  })
}
