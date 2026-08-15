/**
 * 浏览器直跑引擎适配层 · 拆分自 client.ts（V12 拆 chunk，路由级按需加载）。
 * 等价性由 api/browser-client-parity.test.ts 守护。
 */

import { z } from 'zod'
import { castWithCoins, parseCoins } from '@contracts/engines/liuyao-core'
import type { LiuyaoChart } from '@contracts/engines/liuyao-core'
import type { EngineResult } from '@contracts/engines/engine-result'
import { parseWith, engineCall, randomInt } from './shared'

/* ------------------------------------------------------------------ */
/* 六爻（api/liuyao-router.ts coinToss / cast）                          */
/* ------------------------------------------------------------------ */

export interface CoinTossResponse {
  tossIndex: number
  /** 3 枚铜钱：2=背 3=字 */
  coins: number[]
  faces: string[]
  /** 三枚之和：6/7/8/9 */
  value: number
  source: 'server-csprng' | 'client-csprng'
}

export function coinTossLiuyao(payload: { tossIndex: number }): CoinTossResponse {
  const { tossIndex } = parseWith(
    z.object({ tossIndex: z.number().int().min(1).max(6) }),
    payload,
  )
  // 浏览器 CSPRNG（crypto.getRandomValues）；0/1 各半 → 背(2)/字(3)
  const coins = [0, 1, 2].map(() => (randomInt(0, 2) === 0 ? 2 : 3))
  const sum = coins[0] + coins[1] + coins[2]
  return {
    tossIndex,
    coins,
    faces: coins.map((c) => (c === 3 ? 'zi' : 'bei')),
    value: sum, // 6 老阴(动) / 7 少阳 / 8 少阴 / 9 老阳(动)
    source: 'client-csprng' as const,
  }
}

export interface LiuyaoCastPayload {
  coins: number[]
  question?: string
  /** 幂等键（静态托管无落库，仅保留契约字段） */
  idempotencyKey?: string
}

export interface LiuyaoCastResponse {
  result: EngineResult<LiuyaoChart>
  chartId: number | null
  persisted: boolean
}

export function castLiuyao(payload: LiuyaoCastPayload): LiuyaoCastResponse {
  const input = parseWith(
    z.object({
      coins: z.array(z.number().int().min(2).max(3)).length(18),
      question: z.string().trim().max(40).optional(),
      idempotencyKey: z.string().trim().min(8).max(64).optional(),
    }),
    payload,
  )
  const result = engineCall('无法起卦', () => {
    // 先显式解析（给出中文错误），再走引擎
    parseCoins(input.coins)
    return castWithCoins(input.coins, { question: input.question })
  })
  return { result, chartId: null, persisted: false }
}
