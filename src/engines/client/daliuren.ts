/**
 * 浏览器直跑引擎适配层 · 拆分自 client.ts（V12 拆 chunk，路由级按需加载）。
 * 等价性由 api/browser-client-parity.test.ts 守护。
 */

import { z } from 'zod'
import { computeDaliuren } from '@contracts/engines/daliuren-core'
import type { DaliurenChart, DaliurenInput } from '@contracts/engines/daliuren-core'
import type { EngineResult } from '@contracts/engines/engine-result'
import { isValidSolarDate, parseWith, engineCall, assertTz } from './shared'

/* ------------------------------------------------------------------ */
/* 大六壬（api/daliuren-router.ts qike）                                 */
/* ------------------------------------------------------------------ */

export interface DaliurenQikePayload {
  datetime: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
  }
  ianaTimezone?: string
  question?: string
  title?: string
}

export interface DaliurenQikeResponse {
  result: EngineResult<DaliurenChart>
  chartId: number | null
  persisted: boolean
}

export function qikeDaliuren(payload: DaliurenQikePayload): DaliurenQikeResponse {
  const input = parseWith(
    z.object({
      datetime: z.object({
        year: z.number().int().min(1900).max(2100),
        month: z.number().int().min(1).max(12),
        day: z.number().int().min(1).max(31),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
      }),
      ianaTimezone: z.string().trim().max(64).optional(),
      question: z.string().trim().max(200).optional(),
      title: z.string().trim().max(64).optional(),
    }),
    payload,
  )
  const { datetime, ianaTimezone, question } = input
  assertTz(ianaTimezone)

  if (!isValidSolarDate(datetime.year, datetime.month, datetime.day)) {
    throw new Error('无效的日期，请检查年月日。')
  }

  const engineInput: DaliurenInput = { ...datetime, ianaTimezone, question }
  const result = engineCall('无法起课', () => computeDaliuren(engineInput))
  return { result, chartId: null, persisted: false }
}

/* ------------------------------------------------------------------ */
