/**
 * 浏览器直跑引擎适配层 · 拆分自 client.ts（V12 拆 chunk，路由级按需加载）。
 * 等价性由 api/browser-client-parity.test.ts 守护。
 */

import { z } from 'zod'
import { computeQimen } from '@contracts/engines/qimen-core'
import type { QimenChart } from '@contracts/engines/qimen-core'
import type { EngineResult } from '@contracts/engines/engine-result'
import { parseWith, engineCall, assertTz } from './shared'

/* ------------------------------------------------------------------ */
/* 奇门（api/qimen-router.ts qiju）                                      */
/* ------------------------------------------------------------------ */

export interface QimenQijuPayload {
  datetime: string
  ianaTimezone?: string
  question?: string
  title?: string
}

export interface QimenQijuResponse {
  result: EngineResult<QimenChart>
  chartId: number | null
  persisted: boolean
}

export function qijuQimen(payload: QimenQijuPayload): QimenQijuResponse {
  const input = parseWith(
    z.object({
      datetime: z.string().trim().min(10).max(40),
      ianaTimezone: z.string().trim().max(64).optional(),
      question: z.string().trim().max(120).optional(),
      title: z.string().trim().max(64).optional(),
    }),
    payload,
  )
  const engineInput = { ...input }
  delete (engineInput as { title?: string }).title
  assertTz(engineInput.ianaTimezone)
  const result = engineCall('无法解析的起局时刻', () => computeQimen(engineInput))
  return { result, chartId: null, persisted: false }
}
