/**
 * 浏览器直跑引擎适配层 · 拆分自 client.ts（V12 拆 chunk，路由级按需加载）。
 * 等价性由 api/browser-client-parity.test.ts 守护。
 */

import { z } from 'zod'
import { paipanZiwei as enginePaipanZiwei } from '@contracts/engines/ziwei-core'
import type { ZiweiChartData, ZiweiInput } from '@contracts/engines/ziwei-core'
import type { EngineResult } from '@contracts/engines/engine-result'
import { hourToBranch } from '@contracts/engines/time-protocol'
import { isValidSolarDate, parseWith, engineCall } from './shared'

/* ------------------------------------------------------------------ */
/* 紫微（api/ziwei-router.ts paipan）                                    */
/* ------------------------------------------------------------------ */

const ziweiInputSchema = z
  .object({
    calendar: z.enum(['solar', 'lunar']),
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23).optional(),
    minute: z.number().int().min(0).max(59).optional(),
    unknownHour: z.boolean().optional(),
    hourBranch: z.number().int().min(0).max(11).optional(),
    gender: z.enum(['male', 'female']),
    isLeapMonth: z.boolean().optional(),
    title: z.string().trim().max(64).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.calendar === 'solar' && v.isLeapMonth === true) {
      ctx.addIssue({ code: 'custom', path: ['isLeapMonth'], message: '公历输入不允许携带闰月标记。' })
    }
    if (v.calendar === 'lunar' && v.day > 30) {
      ctx.addIssue({ code: 'custom', path: ['day'], message: '农历日期应在 1-30 之间。' })
    }
    if (v.hour === undefined && v.hourBranch === undefined && v.unknownHour !== true) {
      ctx.addIssue({
        code: 'custom',
        path: ['hour'],
        message: '请提供出生时分（hour/minute），或显式声明时辰未知（unknownHour）。',
      })
    }
  })

export type ZiweiPaipanPayload = z.input<typeof ziweiInputSchema>

export interface ZiweiPaipanResponse {
  result: EngineResult<ZiweiChartData>
  chartId: number | null
  persisted: boolean
}

/** 镜像路由 resolveHourBranch：hour 优先，hourBranch 兼容，unknownHour → 子时 */
function resolveHourBranch(input: {
  hour?: number
  hourBranch?: number
  unknownHour?: boolean
}): { hourBranch: number; hourUnknown: boolean } {
  if (input.hour !== undefined) {
    return { hourBranch: hourToBranch(input.hour), hourUnknown: false }
  }
  if (input.hourBranch !== undefined) {
    return { hourBranch: input.hourBranch, hourUnknown: false }
  }
  return { hourBranch: 0, hourUnknown: true }
}

export function paipanZiwei(payload: ZiweiPaipanPayload): ZiweiPaipanResponse {
  const input = parseWith(ziweiInputSchema, payload)
  const raw = { ...input }
  delete (raw as { title?: string }).title

  if (raw.calendar === 'solar' && !isValidSolarDate(raw.year, raw.month, raw.day)) {
    throw new Error('无效的日期，请检查年月日。')
  }

  const { hourBranch, hourUnknown } = resolveHourBranch(raw)
  const birth: ZiweiInput = {
    calendar: raw.calendar,
    year: raw.year,
    month: raw.month,
    day: raw.day,
    hourBranch,
    gender: raw.gender,
    isLeapMonth: raw.isLeapMonth,
  }

  const result = engineCall('无法解析的出生时间', () => enginePaipanZiwei(birth))

  // 时辰未知：在结果 meta.warnings 显式标注（不静默按子时出盘）
  if (hourUnknown && result?.meta && Array.isArray(result.meta.warnings)) {
    result.meta.warnings.push('时辰未知：时柱按子时处理，结果仅供参考。')
  }

  return { result, chartId: null, persisted: false }
}
