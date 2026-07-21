/**
 * 规则注册表 · 版本入口
 * 任何规则数据变更必须 bump RULESET_VERSION，保证排盘结果可追溯。
 */
export const RULESET_VERSION = '1.0.0'

export * as stemsBranches from './stems-branches'
export * as tengods from './tengods'
export * as shensha from './shensha'
export * as chenggu from './chenggu'
