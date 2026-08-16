/**
 * 名家方法论规则引擎（蒸馏规则集 → 可执行代码）
 *
 * 输入：BaziChartV2（bazi-core 公开字段：strength/wuxing/yongshen/shensha）
 * 输出：MasterHint[]（文化型参详提示，带来源大师与规则ID）
 *
 * 铁律：
 * - 只产出文化型参详提示，禁止具体事件断言、行为指导、医疗投资建议
 * - 每条提示可溯源（规则ID + 大师 + 蒸馏来源）
 * - 阈值全部走公开常量，可版本化
 */

import type { BaziChartV2 } from '../../bazi-core'
import { SWH_RULES } from './swh'

export interface MasterHint {
  /** 规则ID（如 SWH-01，对应 docs/masters/distilled-rules.md） */
  ruleId: string
  /** 来源大师 */
  master: string
  /** 提示标题（短） */
  title: string
  /** 提示正文（文化参详，禁止断言） */
  text: string
  /** 蒸馏来源URL */
  source: string
}

/**
 * 综合分析：命盘 → 名家参详提示列表
 * 提示按规则权重排序，上限 6 条（避免信息过载）
 */
export function analyzeWithMasters(chart: BaziChartV2, maxHints = 6): MasterHint[] {
  const hints: MasterHint[] = []
  for (const rule of SWH_RULES) {
    const result = rule.evaluate(chart)
    if (result) {
      hints.push({ ruleId: rule.id, master: rule.master, source: rule.source, ...result })
    }
  }
  return hints.slice(0, maxHints)
}

export { SWH_RULES }
