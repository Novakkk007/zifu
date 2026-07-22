/**
 * 时家奇门（拆补法·转盘）引擎 · 统一出口
 * 纯 TypeScript，无 React / 无 DB / 无网络。前后端共用。
 */
export * from './types'
export * from './tables'
export {
  computeQimen,
  qimenSummaryForAi,
  QIMEN_ALGORITHM_VERSION,
  QIMEN_RULE_VARIANT,
} from './qimen'
