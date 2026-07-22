/**
 * 灵签核心 · draws-core
 * 签号抽取与签文解析。随机源由调用方注入（服务端使用 crypto.randomInt CSPRNG），
 * 本库保持纯函数，便于测试与前后端共用。
 */
import type { GuanyinSign } from './guanyin-100'
import { signAt } from './guanyin-100'

export * from './guanyin-100'

export const DRAWS_ALGORITHM_VERSION = 'draws-core@1'
export const DRAWS_RULESET_VERSION = '1.0.0'

export const DRAWS_DISCLAIMER =
  '观音灵签一百首为传统公共文献；签号由服务端加密安全随机数（CSPRNG）均匀抽取。签诗仅供文化体验，不构成任何决策建议。'

/**
 * 抽取签号：rand 为 [min, maxExclusive) 均匀整数随机源。
 * 服务端注入 crypto.randomInt；测试可注入确定性源。
 */
export function drawSignNo(rand: (min: number, maxExclusive: number) => number): number {
  return rand(1, 101)
}

/** 按签号取签文 */
export function resolveSign(no: number): GuanyinSign {
  return signAt(no)
}
