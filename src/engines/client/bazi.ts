/**
 * 浏览器直跑引擎适配层 · 拆分自 client.ts（V12 拆 chunk，路由级按需加载）。
 * 等价性由 api/browser-client-parity.test.ts 守护。
 */

import { z } from 'zod'
import { computeChartV2 } from '@contracts/bazi-core'
import type { BaziChartV2, BirthInput } from '@contracts/bazi-core'
import { isValidSolarDate, parseWith, engineCall } from './shared'

/* ------------------------------------------------------------------ */
/* 八字（api/bazi-router.ts paipan）                                     */
/* ------------------------------------------------------------------ */

/** 与 api/bazi-router.ts birthInput 完全一致的校验（含 superRefine） */
export const birthInputSchema = z
  .object({
    calendar: z.enum(['solar', 'lunar']),
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23).nullable(),
    minute: z.number().int().min(0).max(59),
    gender: z.enum(['male', 'female']),
    isLeapMonth: z.boolean().optional(),
    city: z.string().trim().max(64).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    timezone: z.number().min(-12).max(14).optional(),
    ianaTimezone: z.string().trim().max(64).optional(),
    useTrueSolarTime: z.boolean(),
    dayRollover: z.enum(['zichu', 'midnight']),
    title: z.string().trim().max(64).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.calendar === 'solar' && v.isLeapMonth === true) {
      ctx.addIssue({ code: 'custom', path: ['isLeapMonth'], message: '公历输入不允许携带闰月标记。' })
    }
    if (v.calendar === 'lunar' && v.day > 30) {
      ctx.addIssue({ code: 'custom', path: ['day'], message: '农历日期应在 1-30 之间。' })
    }
  })

export type BirthPayload = BirthInput & { title?: string }

export interface BaziPaipanResponse {
  chart: BaziChartV2
  chartId: number | null
  persisted: boolean
}

export function paipanBazi(payload: BirthPayload): BaziPaipanResponse {
  const input = parseWith(birthInputSchema, payload)
  const birth = { ...input }
  delete (birth as { title?: string }).title

  if (birth.calendar === 'solar' && !isValidSolarDate(birth.year, birth.month, birth.day)) {
    throw new Error('无效的日期，请检查年月日。')
  }

  const chart = engineCall('无法解析的出生时间', () => computeChartV2(birth))
  return { chart, chartId: null, persisted: false }
}
