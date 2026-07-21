/**
 * 紫府八字核心库 · 统一出口
 * 纯 TypeScript，无 React / 无 DB / 无网络。前后端共用。
 */
export * from './types'
export { RULESET_VERSION } from './rules'
export * from './rules/stems-branches'
export { tenGod, TEN_GOD_INFO } from './rules/tengods'
export type { TenGod } from './rules/tengods'
export { SHENSHA_REGISTRY } from './rules/shensha'
export * as chengguRules from './rules/chenggu'
export {
  solarToLunar,
  lunarToSolar,
  equationOfTimeMinutes,
  getPrevNextJie,
  resolveBirthTime,
  toPseudoMs,
  fromPseudoMs,
  fmtYmdHm,
  fmtYmdHms,
  EOT_FORMULA_VERSION,
} from './calendar'
export type { CivilDateTime, LunarDate, JieMoment, ResolvedBirthTime } from './calendar'
export { computeChartV2, STRENGTH_MODEL, STRENGTH_DISCLAIMER } from './bazi'
export { computeLifeScores, SCORES_DISCLAIMER, FACTOR_WEIGHTS } from './scores'
