/**
 * 阳宅环境检查规则引擎。
 *
 * 来源：docs/fengshui/yangzhai-classics.md「3. 可应用规则」。
 * 边界：只输出可验证的环境与工程检查建议，不输出吉凶或方位断言。
 */

export const YANGZHAI_RULESET_VERSION = '2026-08-17'

export const YANGZHAI_RULE_SOURCE = {
  sourceWork: '《宅经》（旧题《黄帝宅经》）公版文献安全转译',
  sourceSection: 'docs/fengshui/yangzhai-classics.md#3-可应用规则条件--提示',
} as const

export interface YangzhaiInput {
  areaRatio?: '大' | '中' | '小'
  doorSize?: '大' | '中' | '小'
  doorDirectToPrivate?: boolean
  maintenanceIssues?: string[]
  kitchenAdjacent?: boolean
  kitchenOnRoute?: boolean
  hasTrueNorth?: boolean
  hasMeasure?: boolean
  ageGenderRequested?: boolean
}

export interface YangzhaiHint {
  /** 对应文档中的 YZ-01～YZ-09。 */
  ruleId: string
  /** 规则集版本，供调用方审计和复现。 */
  rulesetVersion: string
  /** 仅包含检查或复核建议，不包含吉凶结论。 */
  text: string
  /** 古籍与现代安全转译的来源说明。 */
  source: typeof YANGZHAI_RULE_SOURCE
}

export interface YangzhaiRule {
  id: string
  version: string
  source: typeof YANGZHAI_RULE_SOURCE
  evaluate(input: YangzhaiInput): string | null
}

/**
 * YZ-09 的输入映射：同时出现宅命请求与方位测量信息，代表调用方正在
 * 混用后世宅命分类和《宅经》方位分类。这里只提示分开标注来源，不判断
 * 两套标签是否存在吉凶冲突。
 */
function hasMixedTraditionalSystems(input: YangzhaiInput): boolean {
  const hasDirectionInput = input.hasTrueNorth !== undefined || input.hasMeasure !== undefined
  return input.ageGenderRequested === true && hasDirectionInput
}

export const YANGZHAI_RULES: readonly YangzhaiRule[] = [
  {
    id: 'YZ-01',
    version: YANGZHAI_RULESET_VERSION,
    source: YANGZHAI_RULE_SOURCE,
    evaluate: (input) =>
      input.areaRatio === '大'
        ? '可检查空置房间的渗漏、霉变、通风、能耗与维护成本；这对应古籍“宅大人少”的空间观察，不代表贫富结果。'
        : null,
  },
  {
    id: 'YZ-02',
    version: YANGZHAI_RULESET_VERSION,
    source: YANGZHAI_RULE_SOURCE,
    evaluate: (input) =>
      input.doorSize === '大' && input.areaRatio === '小'
        ? '可复核入口保温、噪声、私密、门扇碰撞与疏散净宽；入口实际尺寸应按规范及使用需求确定，不要仅凭“门大”判断好坏。'
        : null,
  },
  {
    id: 'YZ-03',
    version: YANGZHAI_RULESET_VERSION,
    source: YANGZHAI_RULE_SOURCE,
    evaluate: (input) =>
      input.maintenanceIssues?.some((issue) => issue.trim().length > 0)
        ? '优先安排结构与围护巡检，逐项复核已记录的破损、松动或渗漏，并处理坠落、进水、虫害和安防风险；这是维护建议，不是灾祸预测。'
        : null,
  },
  {
    id: 'YZ-04',
    version: YANGZHAI_RULESET_VERSION,
    source: YANGZHAI_RULE_SOURCE,
    evaluate: (input) =>
      input.kitchenAdjacent === true
        ? '请按当地给排水、燃气和消防规范复核饮用水、排污与厨房的相邻关系，以及燃气、排烟和防火条件；必要时请持证专业人员检测，古代方位法不能替代检测。'
        : null,
  },
  {
    id: 'YZ-05',
    version: YANGZHAI_RULESET_VERSION,
    source: YANGZHAI_RULE_SOURCE,
    evaluate: (input) =>
      input.doorDirectToPrivate === true
        ? '可检查入口视线、私密与声光干扰，并考虑玄关、错位收纳或可控遮挡，同时保持消防疏散通道和通行净宽符合要求。'
        : null,
  },
  {
    id: 'YZ-06',
    version: YANGZHAI_RULESET_VERSION,
    source: YANGZHAI_RULE_SOURCE,
    evaluate: (input) =>
      input.kitchenOnRoute === true
        ? '建议复核主要通行路线穿越烹饪区造成的碰撞、烫伤、火焰稳定和排烟风险；调整方案须先满足消防、燃气与通行规范。'
        : null,
  },
  {
    id: 'YZ-07',
    version: YANGZHAI_RULESET_VERSION,
    source: YANGZHAI_RULE_SOURCE,
    evaluate: (input) =>
      input.hasTrueNorth === false || input.hasMeasure === false
        ? '真北或可靠测量信息不足，暂不判方位；请补充测量误差、户型和现场资料。资料齐全后也只应给出文化标签，以及日照、遮挡、风、噪声和热负荷等环境检查项。'
        : null,
  },
  {
    id: 'YZ-08',
    version: YANGZHAI_RULESET_VERSION,
    source: YANGZHAI_RULE_SOURCE,
    evaluate: (input) =>
      input.ageGenderRequested === true
        ? '宅命相配属于传统术数分类，不能据此预测事件；建议改按居住者的行动能力、作息、采光、安静、尺度和无障碍需求评估。'
        : null,
  },
  {
    id: 'YZ-09',
    version: YANGZHAI_RULESET_VERSION,
    source: YANGZHAI_RULE_SOURCE,
    evaluate: (input) =>
      hasMixedTraditionalSystems(input)
        ? '检测到宅命请求与方位资料同时出现；请标注《宅经》二十四路与后世宅命体系的来源时代，不强行合并或放大冲突标签，并转回可测的采光、风、噪声、消防和卫生指标。'
        : null,
  },
]

/** 根据明确提供的条件返回按 YZ-01～YZ-09 排序的环境检查提示。 */
export function evaluateYangzhai(input: YangzhaiInput): YangzhaiHint[] {
  const hints: YangzhaiHint[] = []

  for (const rule of YANGZHAI_RULES) {
    const text = rule.evaluate(input)
    if (text) {
      hints.push({
        ruleId: rule.id,
        rulesetVersion: rule.version,
        text,
        source: rule.source,
      })
    }
  }

  return hints
}
