/**
 * 统一引擎输出协议（precision-contract）
 * 所有术数引擎的输出必须包裹此信封：版本、流派、精度、警告、溯源齐全。
 * 前台展示 precision/ruleVariant；溯源细节（书名/口诀）仅后台审计使用。
 */

/** 精度状态：validated=已验证真实算法 | approximate=近似实现 | demo=演示（不得收费） */
export type Precision = 'validated' | 'approximate' | 'demo';

/** 单条规则溯源（后台审计字段，前台隐藏） */
export interface RuleProvenance {
  ruleId: string;
  variant: string;
  /** 传统出处（仅后台保留）。注意：本字段为「出处+说明」合写，准确定义见 basis/quote/convention */
  source: string;
  /**
   * 依据性质（课题13b §4 可核对性缺口 → 规则化，见 masters-rules/citation-basis.ts）
   * 原文=公版原文逐字照录；约定=算法约定/现代自述；混合=两者兼有
   */
  basis?: '原文' | '约定' | '混合';
  /** basis 含「原文」时必填：逐字照录的原文句（供与公版语料对拍，防引文漂移） */
  quote?: string;
  /** basis 含「约定」时必填：算法约定说明（不得让读者以为出自原书） */
  convention?: string;
}

export interface EngineMeta {
  /** 引擎标识：bazi / liuyao / ziwei / qimen / daliuren / qizheng / hepan / hecan / almanac / draw */
  engine: string;
  algorithmVersion: string;
  /** 流派版本，如「子平法-子初换日」「时家奇门-拆补法」「北派紫微」 */
  ruleVariant: string;
  precision: Precision;
  /** ISO 时间戳 */
  calculatedAt: string;
  warnings: string[];
  provenance: RuleProvenance[];
}

export interface EngineResult<T> {
  meta: EngineMeta;
  data: T;
}

export function wrapResult<T>(
  meta: Omit<EngineMeta, 'calculatedAt'> & { calculatedAt?: string },
  data: T,
): EngineResult<T> {
  return {
    meta: { ...meta, calculatedAt: meta.calculatedAt ?? new Date().toISOString() },
    data,
  };
}
