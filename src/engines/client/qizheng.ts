/**
 * 浏览器直跑引擎适配层 · 拆分自 client.ts（V12 拆 chunk，路由级按需加载）。
 * 等价性由 api/browser-client-parity.test.ts 守护。
 */

import { z } from 'zod'
import { ianaWallClockToUtcMs } from '@contracts/bazi-core'
import { computeQizheng } from '@contracts/engines/qizheng-core'
import type { QizhengChartData } from '@contracts/engines/qizheng-core'
import type { EngineResult } from '@contracts/engines/engine-result'
import { hourToBranch } from '@contracts/engines/time-protocol'
import { isValidSolarDate, parseWith, engineCall, assertTz } from './shared'

/* ------------------------------------------------------------------ */
/* 七政四余（api/qizheng-router.ts paipan）                              */
/* ------------------------------------------------------------------ */

const WALL_CLOCK_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/

export interface QizhengPaipanPayload {
  datetime: string
  ianaTimezone?: string
  gender?: 'male' | 'female'
  siderealOffsetDeg?: number
  title?: string
}

export interface QizhengPaipanResponse {
  result: EngineResult<QizhengChartData>
  chartId: number | null
  persisted: boolean
}

/** 镜像路由 resolveInstant：墙钟 → UTC 毫秒 + 生时时支 */
function resolveInstant(input: {
  datetime: string
  ianaTimezone?: string
}): { utcMs: number; hourBranch: number } {
  assertTz(input.ianaTimezone)
  const m = WALL_CLOCK_RE.exec(input.datetime)
  if (!m) {
    throw new Error('无法解析的时间格式，请使用 ISO 格式（如 2000-01-01T08:30）。')
  }
  const [, ys, ms, ds, hs, mins, ss] = m
  const civil = {
    year: Number(ys),
    month: Number(ms),
    day: Number(ds),
    hour: Number(hs),
    minute: Number(mins),
    second: ss ? Number(ss) : 0,
  }
  if (civil.year < 1900 || civil.year > 2100) {
    throw new Error('年份应在 1900–2100 之间。')
  }
  if (
    civil.month < 1 || civil.month > 12 || civil.day < 1 || civil.day > 31 ||
    civil.hour > 23 || civil.minute > 59
  ) {
    throw new Error('无效的日期时间，请检查输入。')
  }
  if (!isValidSolarDate(civil.year, civil.month, civil.day)) {
    throw new Error('无效的日期，请检查年月日。')
  }

  let utcMs: number
  if (input.ianaTimezone) {
    try {
      utcMs = ianaWallClockToUtcMs(input.ianaTimezone, civil)
    } catch {
      throw new Error('无效的时区标识（应为 IANA 时区，如 Asia/Shanghai）。')
    }
  } else {
    const parsed = Date.parse(input.datetime)
    if (Number.isNaN(parsed)) {
      throw new Error('无法解析的时间，请携带时区偏移或指定 ianaTimezone。')
    }
    utcMs = parsed
  }
  return { utcMs, hourBranch: hourToBranch(civil.hour) }
}

export function paipanQizheng(payload: QizhengPaipanPayload): QizhengPaipanResponse {
  const input = parseWith(
    z.object({
      datetime: z.string().trim().min(10).max(40),
      ianaTimezone: z.string().trim().max(64).optional(),
      gender: z.enum(['male', 'female']).optional(),
      siderealOffsetDeg: z.number().min(0).max(360).optional(),
      title: z.string().trim().max(64).optional(),
    }),
    payload,
  )
  const rest = { ...input }
  delete (rest as { title?: string }).title
  const { utcMs, hourBranch } = resolveInstant(rest)

  const result = engineCall('无法排算星盘', () =>
    computeQizheng({
      utcMs,
      hourBranch,
      gender: rest.gender,
      ianaTimezone: rest.ianaTimezone,
      siderealOffsetDeg: rest.siderealOffsetDeg ?? null,
    }),
  )
  return { result, chartId: null, persisted: false }
}
