/**
 * 三术合参 · hecan-core 公共类型与引擎接入协议
 * 纯类型文件：无 Node / React / DB 依赖，前后端共用。
 */
import type { Precision, RuleProvenance } from '../engine-result'
import type { Wuxing } from '../../bazi-core/types'

export const HECAN_ALGORITHM_VERSION = 'hecan-core@1'
export const HECAN_RULESET_VERSION = '1.0.0'

/** 三术标识 */
export type HecanArt = 'bazi' | 'ziwei' | 'qizheng'

/** 单术精度状态：在统一 Precision 之外允许 unavailable（引擎缺失，不伪造） */
export type ArtPrecision = Precision | 'unavailable'

/**
 * 外部引擎（ziwei / qizheng）接入协议 —— 供各引擎 agent 实现：
 * 在 `contracts/engines/<art>-core/index.ts` 导出：
 *
 *   export function hecanSynthesize(input: BirthInput): HecanArtContribution
 *
 * hecan-core 编排器将动态探测该导出；缺失则该术输出 unavailable 状态块。
 */
export interface HecanArtContribution {
  /** 该术要点（每条一句，规则化文字） */
  keyPoints: string[]
  /** 该术的核心五行结论（无则 null，参与五行一致性互证） */
  wuxingFocus: Wuxing | null
  /** 命宫所在地支（无则 null，参与日主-命宫互证） */
  mingGongBranch: string | null
  /** 该术结构评分 0-100（无则 null，参与结构分对比） */
  structureScore: number | null
  /** 一段式小结 */
  summary: string
  /** 该术自身精度（不含 unavailable——能返回即存在） */
  precision: Precision
  /** 流派版本标识 */
  ruleVariant: string
  /** 溯源（可选，合并进合参 provenance） */
  provenance?: RuleProvenance[]
}

/** 合参报告中的单术状态块 */
export interface HecanArtBlock {
  art: HecanArt
  artName: string
  precision: ArtPrecision
  /** precision = 'unavailable' 时的原因说明 */
  reason?: string
  ruleVariant: string
  keyPoints: string[]
  wuxingFocus: Wuxing | null
  mingGongBranch: string | null
  structureScore: number | null
  summary: string
}

/** 互证信度：triple=三术一致(金印) / double=两术互参(银) / single=单术孤证(铜·存疑) */
export type HecanTier = 'triple' | 'double' | 'single'

/** 一条交叉互证结论 */
export interface HecanCrossCheck {
  /** 互证主题 */
  topic: '五行结论一致性' | '日主与命宫关系' | '结构分对比'
  /** 参与互证的术 */
  arts: HecanArt[]
  tier: HecanTier
  /** 一致 / 分歧 / 证据不足 */
  verdict: 'consistent' | 'divergent' | 'insufficient'
  text: string
}

export interface HecanReport {
  arts: HecanArtBlock[]
  crossChecks: HecanCrossCheck[]
  /** 综合信度：取互证结论中最高档 */
  overallTier: HecanTier
  /** 可用术数（1-3） */
  availableArts: number
  disclaimer: string
  rulesetVersion: string
}

export const HECAN_DISCLAIMER =
  '三术合参为传统术数规则的结构化互证：各术独立推演后交叉比对，信度分档仅代表「几条推演脉络指向一致」，不代表结论为客观事实。仅供文化研究与体验。'
