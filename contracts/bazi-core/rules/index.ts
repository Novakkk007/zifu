/**
 * 规则注册表 · 版本入口
 * 任何规则数据变更必须 bump RULESET_VERSION，保证排盘结果可追溯。
 *
 * 版本历史：
 * - 1.0.0（初版）：四柱/大运/十神/藏干/纳音/长生/合冲刑害/旺衰/用神/神煞12/称骨。
 * - 1.1.0：神煞注册表 v2（结构化条目 + list-all 多命中，ShenshaHit 改为逐柱一条记录）；
 *          BirthInput 新增 ianaTimezone（Intl 历史偏移/夏令时换算）；
 *          TimeAudit 新增 ianaTimezone/timezoneSource。
 *          旧版 1.0.0 排盘结果仍为有效历史数据（不迁移、不作废）。
 * - 1.2.0：神煞注册表 v3，新增红鸾、天喜、劫煞、灾煞（共 16 种）。
 * - 1.3.0：神煞注册表 v4，新增元辰、金舆、孤辰、寡宿、红艳煞、学堂、词馆、天厨（共 24 种）。
 */
export const RULESET_VERSION = '1.3.0'

/** 算法版本（与 RULESET_VERSION 同步发布） */
export const ALGORITHM_VERSION = '1.3.0'

export * as stemsBranches from './stems-branches'
export * as tengods from './tengods'
export * as shensha from './shensha'
export * as chenggu from './chenggu'
