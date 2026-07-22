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
  /** 传统出处（仅后台保留） */
  source: string;
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
