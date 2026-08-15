/**
 * AI 参详（trpc.ai.reading）错误归一化工具。
 *
 * 静态托管（GitHub Pages 无后端）下，tRPC 请求打向不存在的 /api/trpc：
 * - fetch 直接失败（TypeError: Failed to fetch / Load failed / NetworkError）
 * - 或拿到 404 HTML 后 JSON 解析炸掉（"Unexpected token '<'" /
 *   Safari 的 "The string did not match the expected pattern"）
 * 这些都不是服务端业务错误（无 TRPC data.code），必须兜底为友好文案，
 * 不得把原始报错直接渲染给用户。
 */

/** 静态托管/断网兜底文案（需求指定原文） */
export const AI_READING_UNAVAILABLE_TEXT = 'AI 参详暂不可用（演示环境未配置后端）'

const BACKEND_UNAVAILABLE_RE = new RegExp(
  [
    'did not match the expected pattern', // Safari JSON 解析
    'Unexpected token', // V8 JSON 解析（HTML 响应当 JSON 解析）
    'Unexpected end of JSON',
    'not valid JSON',
    'JSON Parse error',
    'Failed to fetch',
    'NetworkError',
    'Network request failed',
    'Load failed',
    'fetch failed',
  ].join('|'),
  'i',
)

/**
 * 判定是否为「后端不可达/响应非 tRPC 协议」类错误。
 * 有 TRPC data.code 的是服务端真实业务错误，不属此类。
 */
export function isBackendUnavailableError(err: unknown): boolean {
  if (!err) return false
  // tRPC 业务错误携带 data.code（服务端可达），不归入后端不可用
  if (typeof err === 'object' && 'data' in err) {
    const code = (err as { data?: { code?: unknown } }).data?.code
    if (typeof code === 'string') return false
  }
  const msg = err instanceof Error ? err.message : String(err)
  return BACKEND_UNAVAILABLE_RE.test(msg)
}

/**
 * 归一化 AI 参详错误：
 * 后端不可达 → 固定兜底文案；否则返回 null（调用方走原有错误分型逻辑）。
 */
export function aiBackendUnavailableText(err: unknown): string | null {
  return isBackendUnavailableError(err) ? AI_READING_UNAVAILABLE_TEXT : null
}
