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
import {
  assertValidIanaTimezone,
  InvalidTimezoneError,
} from '@contracts/engines/time-protocol'

/* ------------------------------------------------------------------ */
/* 共用小件（镜像 api 路由里的同名校验/报错语义）                          */
/* ------------------------------------------------------------------ */

export function isValidSolarDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

/** zod 校验失败 → 与路由一致的 400 语义（取首条 issue 中文消息） */
export function parseWith<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const r = schema.safeParse(input)
  if (!r.success) {
    throw new Error(r.error.issues.at(0)?.message ?? '输入参数无效。')
  }
  return r.data
}

/** 引擎抛错 → 路由同款中文前缀 */
export function engineCall<T>(prefix: string, fn: () => T): T {
  try {
    return fn()
  } catch (err) {
    throw new Error(`${prefix}：${err instanceof Error ? err.message : String(err)}`)
  }
}

/** 统一时间协议：无效 IANA 时区 → 400（镜像各路由 assertTz） */
export function assertTz(ianaTimezone?: string): void {
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
  // 拒绝采样基于 Uint32（[0, 2^32)）；range 超过 2^32 时 limit 会归零导致死循环，显式拒绝
  if (range > 0x1_0000_0000) {
    throw new Error('randomInt 区间超出 32 位随机源覆盖范围')
  }
  const limit = Math.floor(0x1_0000_0000 / range) * range
  const buf = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buf)
    const v = buf[0] as number
    if (v < limit) return min + (v % range)
  }
}

