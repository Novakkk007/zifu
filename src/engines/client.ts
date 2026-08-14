/**
 * 浏览器直跑引擎适配层（静态托管无后端 · 游客模式全引擎可用）。
 *
 * 逐路由镜像 api/*-router.ts 的「输入校验 → 引擎入参组装 → 调引擎 → 响应塑形」：
 * 返回形状与对应 tRPC 过程完全一致（数据读取代码零改动），唯一差别是无服务端落库——
 * chartId 恒 null、persisted 恒 false。
 *
 * 覆盖路由：
 * - bazi.paipan        → paipanBazi        （api/bazi-router.ts）
 * - ziwei.paipan       → paipanZiwei       （api/ziwei-router.ts）
 * - liuyao.coinToss    → coinTossLiuyao    （api/liuyao-router.ts，CSPRNG 改浏览器）
 * - liuyao.cast        → castLiuyao        （api/liuyao-router.ts）
 * - qimen.qiju         → qijuQimen         （api/qimen-router.ts）
 * - qizheng.paipan     → paipanQizheng     （api/qizheng-router.ts）
 * - daliuren.qike      → qikeDaliuren      （api/daliuren-router.ts）
 * - hepan.analyze      → analyzeHepan      （api/hepan-router.ts）
 * - hecan.analyze      → analyzeHecan      （api/hecan-router.ts）
 * - draws.lingqian     → drawLingqian      （api/draws-router.ts，幂等改 localStorage）
 *
 * 等价性由 api/browser-client-parity.test.ts 对拍（同输入对比路由真实输出）。
 */
import { z } from 'zod'
import { computeChartV2, ianaWallClockToUtcMs } from '@contracts/bazi-core'
import type { BaziChartV2, BirthInput } from '@contracts/bazi-core'
import { paipanZiwei as enginePaipanZiwei } from '@contracts/engines/ziwei-core'
import type { ZiweiChartData, ZiweiInput } from '@contracts/engines/ziwei-core'
import { hecanSynthesize as ziweiSynthesize } from '@contracts/engines/ziwei-core'
import { computeQimen } from '@contracts/engines/qimen-core'
import type { QimenChart } from '@contracts/engines/qimen-core'
import { computeQizheng, hecanSynthesize as qizhengSynthesize } from '@contracts/engines/qizheng-core'
import type { QizhengChartData } from '@contracts/engines/qizheng-core'
import { computeDaliuren } from '@contracts/engines/daliuren-core'
import type { DaliurenChart, DaliurenInput } from '@contracts/engines/daliuren-core'
import { castWithCoins, parseCoins } from '@contracts/engines/liuyao-core'
import type { LiuyaoChart } from '@contracts/engines/liuyao-core'
import {
  analyzeCompatibility,
  HEPAN_ALGORITHM_VERSION,
} from '@contracts/engines/hepan-core'
import type { HepanReport } from '@contracts/engines/hepan-core'
import {
  synthesizeHecan,
  HECAN_ALGORITHM_VERSION,
} from '@contracts/engines/hecan-core'
import type { HecanEngineLoader, HecanReport } from '@contracts/engines/hecan-core'
import {
  DRAWS_ALGORITHM_VERSION,
  DRAWS_DISCLAIMER,
  drawSignNo,
  resolveSign,
} from '@contracts/engines/draws-core'
import type { GuanyinSign } from '@contracts/engines/draws-core'
import { wrapResult } from '@contracts/engines/engine-result'
import type { EngineResult, RuleProvenance } from '@contracts/engines/engine-result'
import {
  assertValidIanaTimezone,
  hourToBranch,
  InvalidTimezoneError,
} from '@contracts/engines/time-protocol'

/* ------------------------------------------------------------------ */
/* 共用小件（镜像 api 路由里的同名校验/报错语义）                          */
/* ------------------------------------------------------------------ */

function isValidSolarDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

/** zod 校验失败 → 与路由一致的 400 语义（取首条 issue 中文消息） */
function parseWith<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const r = schema.safeParse(input)
  if (!r.success) {
    throw new Error(r.error.issues.at(0)?.message ?? '输入参数无效。')
  }
  return r.data
}

/** 引擎抛错 → 路由同款中文前缀 */
function engineCall<T>(prefix: string, fn: () => T): T {
  try {
    return fn()
  } catch (err) {
    throw new Error(`${prefix}：${err instanceof Error ? err.message : String(err)}`)
  }
}

/** 统一时间协议：无效 IANA 时区 → 400（镜像各路由 assertTz） */
function assertTz(ianaTimezone?: string): void {
  try {
    assertValidIanaTimezone(ianaTimezone)
  } catch (err) {
    if (err instanceof InvalidTimezoneError) {
      throw new Error(err.message)
    }
    throw err
  }
}

/* ------------------------------------------------------------------ */
/* 浏览器 CSPRNG（铁律：禁止 Math.random；拒绝采样消除取模偏差）            */
/* ------------------------------------------------------------------ */

export function randomInt(min: number, maxExclusive: number): number {
  const range = maxExclusive - min
  if (!Number.isInteger(range) || range <= 0) {
    throw new Error('randomInt 区间无效')
  }
  const limit = Math.floor(0x1_0000_0000 / range) * range
  const buf = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buf)
    const v = buf[0] as number
    if (v < limit) return min + (v % range)
  }
}

/* ------------------------------------------------------------------ */
/* 八字（api/bazi-router.ts paipan）                                     */
/* ------------------------------------------------------------------ */

/** 与 api/bazi-router.ts birthInput 完全一致的校验（含 superRefine） */
const birthInputSchema = z
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
/* 八字合盘（api/hepan-router.ts analyze）                               */
/* ------------------------------------------------------------------ */

/** 与 api/hepan-router.ts HEPAN_PROVENANCE 一致（静态数据镜像） */
const HEPAN_PROVENANCE: RuleProvenance[] = [
  {
    ruleId: 'hepan.wuxing-complement',
    variant: '紫府公开量化模型 v1（亏缺/盈余覆盖率）',
    source: '《渊海子平》论五行盈亏（传统公共文献）',
  },
  {
    ruleId: 'hepan.daymaster-relation',
    variant: '比和/相生/相制三分类',
    source: '《滴天髓》论日主（传统公共文献）',
  },
  {
    ruleId: 'hepan.zodiac-harmony',
    variant: '年支六合/三合/六冲/刑害分级',
    source: '《三命通会·论合婚》（传统公共文献）',
  },
  {
    ruleId: 'hepan.yongshen-match',
    variant: '扶抑用神双向匹配',
    source: '《穷通宝鉴》扶抑法（传统公共文献）',
  },
  {
    ruleId: 'hepan.cross-relations',
    variant: '逐柱交叉检视 天干五合/六合/三合半合/六冲/刑/害/破',
    source: '《渊海子平》《三命通会》论干支合冲刑害（传统公共文献）',
  },
]

export interface HepanAnalyzePayload {
  personA: BirthPayload
  personB: BirthPayload
  title?: string
}

export interface HepanAnalyzeResponse {
  chartA: BaziChartV2
  chartB: BaziChartV2
  compatibility: EngineResult<HepanReport>
  chartId: number | null
  persisted: boolean
}

export function analyzeHepan(payload: HepanAnalyzePayload): HepanAnalyzeResponse {
  const input = parseWith(
    z.object({
      personA: birthInputSchema,
      personB: birthInputSchema,
      title: z.string().trim().max(64).optional(),
    }),
    payload,
  )
  const birthA = { ...input.personA }
  const birthB = { ...input.personB }
  delete (birthA as { title?: string }).title
  delete (birthB as { title?: string }).title

  for (const [who, p] of [
    ['甲方', birthA],
    ['乙方', birthB],
  ] as const) {
    if (p.calendar === 'solar' && !isValidSolarDate(p.year, p.month, p.day)) {
      throw new Error(`${who}出生日期无效，请检查年月日。`)
    }
  }

  const { chartA, chartB } = engineCall('无法解析的出生时间', () => ({
    chartA: computeChartV2(birthA),
    chartB: computeChartV2(birthB),
  }))

  const report = analyzeCompatibility(chartA, chartB)
  const compatibility = wrapResult(
    {
      engine: 'hepan',
      algorithmVersion: HEPAN_ALGORITHM_VERSION,
      ruleVariant: '子平合婚-公开权重模型',
      precision: 'validated',
      warnings: [
        chartA.pillars.hour === null || chartB.pillars.hour === null
          ? '一方时辰未知，时柱不参与跨盘干支交互检视，结论精度下降。'
          : undefined,
      ].filter((w): w is string => Boolean(w)),
      provenance: HEPAN_PROVENANCE,
    },
    report,
  )

  return { chartA, chartB, compatibility, chartId: null, persisted: false }
}

/* ------------------------------------------------------------------ */
/* 三术合参（api/hecan-router.ts analyze）                               */
/* ------------------------------------------------------------------ */

export interface HecanAnalyzeResponse {
  result: EngineResult<HecanReport>
  chart: BaziChartV2
  chartId: number | null
  persisted: boolean
}

export async function analyzeHecan(payload: BirthPayload): Promise<HecanAnalyzeResponse> {
  const input = parseWith(birthInputSchema, payload)
  const birth = { ...input }
  delete (birth as { title?: string }).title

  if (birth.calendar === 'solar' && !isValidSolarDate(birth.year, birth.month, birth.day)) {
    throw new Error('无效的日期，请检查年月日。')
  }

  const synthesis = await (async () => {
    try {
      // 静态注册 loader（与路由一致）：ziwei/qizheng 引擎均在本仓库内
      const staticLoader: HecanEngineLoader = async (art) =>
        art === 'ziwei'
          ? { hecanSynthesize: ziweiSynthesize }
          : { hecanSynthesize: qizhengSynthesize }
      return await synthesizeHecan(birth, { loadEngine: staticLoader })
    } catch (err) {
      throw new Error(`无法解析的出生时间：${err instanceof Error ? err.message : String(err)}`)
    }
  })()

  const result = wrapResult(
    {
      engine: 'hecan',
      algorithmVersion: HECAN_ALGORITHM_VERSION,
      ruleVariant: '三术合参-互证分档模型',
      precision: synthesis.report.arts.every(
        (a) => a.precision === 'unavailable' || a.precision === 'validated',
      )
        ? 'validated'
        : 'approximate',
      warnings: synthesis.warnings,
      provenance: synthesis.provenance,
    },
    synthesis.report,
  )

  return { result, chart: synthesis.chart, chartId: null, persisted: false }
}

/* ------------------------------------------------------------------ */
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
    source: '观音灵签一百首（传统公共文献）',
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
