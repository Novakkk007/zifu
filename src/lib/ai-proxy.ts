/**
 * 紫府 AI 代理客户端（先生 key 服务端化——前端零 key）
 * 所有访客 AI 调用经 CF Worker（zifu-ai-proxy）：
 * 限流（IP 10/日 + 全局 100/日）+ 用量统计 + key 藏后端
 */
export const AI_PROXY_URL = 'https://zifu-ai-proxy.novakk.workers.dev'

export type ProxyKind = 'guest-reading' | 'roundtable' | 'guanzhao'

export async function proxyAI(
  kind: ProxyKind,
  prompt: string,
  opts?: { maxTokens?: number; temperature?: number }
): Promise<{ content: string; tokens?: number }> {
  const res = await fetch(`${AI_PROXY_URL}/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      maxTokens: opts?.maxTokens,
      temperature: opts?.temperature,
    }),
  })
  if (!res.ok) {
    let msg = `AI 服务返回 ${res.status}`
    try {
      const d = (await res.json()) as { error?: string }
      if (d.error) msg = d.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  const data = (await res.json()) as { content?: string; tokens?: number; error?: string }
  if (!data.content) throw new Error(data.error ?? 'AI 服务返回为空')
  return { content: data.content, tokens: data.tokens }
}
