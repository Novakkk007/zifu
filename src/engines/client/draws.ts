/**
 * 浏览器直跑引擎适配层 · 拆分自 client.ts（V12 拆 chunk，路由级按需加载）。
 * 等价性由 api/browser-client-parity.test.ts 守护。
 */

import { z } from 'zod'
import { DRAWS_ALGORITHM_VERSION, DRAWS_DISCLAIMER, drawSignNo, resolveSign } from '@contracts/engines/draws-core'
import type { GuanyinSign } from '@contracts/engines/draws-core'
import { wrapResult } from '@contracts/engines/engine-result'
import type { EngineResult, RuleProvenance } from '@contracts/engines/engine-result'
import { parseWith, randomInt } from './shared'

/* 观音灵签（api/draws-router.ts lingqian）                              */
/* ------------------------------------------------------------------ */

/** 灵签结果数据（与 api/draws-router.ts LingqianDraw 同形） */
export interface LingqianDraw {
  signNo: number
  sign: GuanyinSign
  /** true = 同一 idempotencyKey 的复放（未重新随机） */
  idempotentReplay: boolean
}

export interface LingqianDrawResponse {
  result: EngineResult<LingqianDraw>
  chartId: number | null
}

/** 与路由 buildResult 同构；溯源如实标注浏览器 CSPRNG */
const DRAWS_PROVENANCE: RuleProvenance[] = [
  {
    ruleId: 'draws.guanyin-100',
    variant: '观音灵签通行本一百首（吉凶等第归并上/中/下）',
    source: '观音灵签一百首',
  },
  {
    ruleId: 'draws.csprng',
    variant: 'crypto.getRandomValues 拒绝采样均匀抽取',
    source: '浏览器 CSPRNG',
  },
]

function buildDrawResult(signNo: number, idempotentReplay: boolean): EngineResult<LingqianDraw> {
  return wrapResult(
    {
      engine: 'draw',
      algorithmVersion: DRAWS_ALGORITHM_VERSION,
      ruleVariant: '观音灵签一百首-CSPRNG均匀抽取',
      precision: 'validated',
      warnings: [DRAWS_DISCLAIMER],
      provenance: DRAWS_PROVENANCE,
    },
    { signNo, sign: resolveSign(signNo), idempotentReplay },
  )
}

/**
 * 幂等存储：静态托管无服务端落库，改以 localStorage 记录
 * 「idempotencyKey → signNo」，同键重抽复放（语义与路由一致，如每日一签）。
 * 存储不可用（隐私模式等）时退化为每次新抽。
 */
const drawStoreKey = (key: string) => `zifu:lingqian:${key}`

function readStoredSignNo(key: string): number | null {
  try {
    const raw = localStorage.getItem(drawStoreKey(key))
    if (raw === null) return null
    const no = Number(raw)
    return Number.isInteger(no) && no >= 1 && no <= 100 ? no : null
  } catch {
    return null
  }
}

function storeSignNo(key: string, signNo: number): void {
  try {
    localStorage.setItem(drawStoreKey(key), String(signNo))
  } catch {
    // 存储不可用不阻塞抽签
  }
}

export function drawLingqian(payload: { idempotencyKey: string }): LingqianDrawResponse {
  const input = parseWith(
    z.object({ idempotencyKey: z.string().trim().min(1).max(128) }),
    payload,
  )

  const replay = readStoredSignNo(input.idempotencyKey)
  if (replay !== null) {
    return { result: buildDrawResult(replay, true), chartId: null }
  }

  const signNo = drawSignNo(randomInt)
  storeSignNo(input.idempotencyKey, signNo)
  return { result: buildDrawResult(signNo, false), chartId: null }
}
