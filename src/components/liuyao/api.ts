/**
 * /liuyao · 服务端契约边界。
 * - liuyao.coinToss：每摇由服务端 CSPRNG 掷 3 枚铜钱（字=3 背=2），前端连摇六次。
 * - liuyao.cast：18 枚铜钱 → EngineResult<LiuyaoChart>（纳甲/六亲/六神/旬空全装卦），
 *   登录时服务端自动落库 charts（chartType='liuyao'），idempotencyKey 防重复落库。
 * 页面其余部分一律使用本模块类型，不自行推演。
 */
import type { EngineResult } from '@contracts/engines/engine-result'
import type { LiuyaoChart } from '@contracts/engines/liuyao-core'

export type { EngineResult, LiuyaoChart }
export type { LiuyaoYao, FuShenInfo, HexagramData } from '@contracts/engines/liuyao-core'

/** coinToss 响应 */
export interface CoinTossResponse {
  tossIndex: number
  /** 3 枚铜钱：2=背 3=字 */
  coins: number[]
  faces: string[]
  /** 三枚之和：6/7/8/9 */
  value: number
  source: 'server-csprng'
}

/** cast 响应 */
export interface CastResponse {
  result: EngineResult<LiuyaoChart>
  chartId: number | null
  persisted: boolean
}

/** AI 参详响应（api/ai-router.ts reading，与 bazi 共用 v6 契约） */
export interface ReadingResponse {
  text: string
  source: 'live' | 'fallback'
  model: string | null
  promptTokens?: number | null
  completionTokens?: number | null
  latencyMs?: number | null
}

/** 每次起卦会话生成一次幂等键（重摇即重新生成） */
export function newCastIdempotencyKey(): string {
  return `liuyao-cast:${crypto.randomUUID()}`
}

/** 从 tRPC 错误对象提取服务端错误码 */
export function trpcCode(err: unknown): string | null {
  if (err && typeof err === 'object' && 'data' in err) {
    const code = (err as { data?: { code?: unknown } }).data?.code
    if (typeof code === 'string') return code
  }
  return null
}
