/**
 * 阳宅 YZ-01～YZ-09 环境检查引擎。
 *
 * 规则来源：docs/fengshui/yangzhai-classics.md「3. 可应用规则」。
 * “吉/凶/平”仅是规则命中状态，不是对住宅或居住者命运的断言。
 */

export const YANGZHAI_RULESET_VERSION = "2026-08-17";

export const YANGZHAI_RULE_SOURCE = {
  sourceWork: "《宅经》（旧题《黄帝宅经》）公版文献安全转译",
  sourceSection: "docs/fengshui/yangzhai-classics.md#3-可应用规则条件--提示",
} as const;

export type YangzhaiVerdict = "吉" | "凶" | "平";
export type AreaRatio = "大" | "中" | "小";
export type DoorSize = "大" | "中" | "小";
export type TraditionalSystem = "宅经二十四路" | "后世八宅" | "门主灶";
export type FloorPlanPosition =
  "东南" | "南" | "西南" | "东" | "中宫" | "西" | "东北" | "北" | "西北";

export interface YangzhaiInput {
  /** 住宅面积相对常住人数与实际使用需求的比例。 */
  areaRatio?: AreaRatio;
  /** 入户门相对内部空间的尺度。 */
  doorSize?: DoorSize;
  /** 入户视线是否直达主要卧室或起居私密区。 */
  doorDirectToPrivate?: boolean;
  /** 围墙、门窗、屋面或外墙的已知维护问题。 */
  maintenanceIssues?: string[];
  /** 饮用水/排污与厨房相邻不当，或燃气、排烟、防火条件不明。 */
  kitchenAdjacent?: boolean;
  /** 主要入户或通行路线是否穿越烹饪操作区。 */
  kitchenOnRoute?: boolean;
  /** 强穿堂风是否会直接掠过灶具。 */
  crossBreezeOverStove?: boolean;
  /** 罗盘记录的宅向角度，正北为 0°，范围 0～359°。 */
  orientationDegrees?: number;
  /** 所在楼层，仅用于判断遮挡、风环境等现场资料是否完整。 */
  floorNumber?: number;
  /** 是否有可靠的真北基准。 */
  hasTrueNorth?: boolean;
  /** 是否记录了测量方法或误差。 */
  hasMeasure?: boolean;
  /** 是否已提供户型图。 */
  hasFloorPlan?: boolean;
  /** 户型图上的门位。 */
  doorPosition?: FloorPlanPosition;
  /** 户型图上的主卧/主要起居位。 */
  primaryRoomPosition?: FloorPlanPosition;
  /** 是否有周边遮挡、风、噪声等现场资料。 */
  hasSiteData?: boolean;
  /** 是否请求按出生年/性别匹配住宅或判断吉凶。 */
  ageGenderRequested?: boolean;
  /** 同一次参详中采用的传统分类体系。 */
  traditionalSystems?: TraditionalSystem[];
  /** 不同体系是否已经给出相互冲突的标签。 */
  traditionalLabelsConflict?: boolean;
}

export interface YangzhaiRuleResult {
  ruleId: YangzhaiRuleId;
  ruleName: string;
  /** 是否命中需要展示的检查条件。 */
  triggered: boolean;
  /** 检查状态标签；不得解释为住宅或人生的确定性吉凶。 */
  verdict: YangzhaiVerdict;
  message: string;
  remedy: string;
  inputFields: readonly (keyof YangzhaiInput)[];
  rulesetVersion: string;
  source: typeof YANGZHAI_RULE_SOURCE;
}

export type YangzhaiRuleId = `YZ-0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

export interface YangzhaiRule {
  id: YangzhaiRuleId;
  name: string;
  inputFields: readonly (keyof YangzhaiInput)[];
  evaluate(input: YangzhaiInput): YangzhaiRuleResult;
}

interface RuleCopy {
  hitVerdict: YangzhaiVerdict;
  hitMessage: string;
  hitRemedy: string;
  clearMessage: string;
  clearRemedy: string;
}

function defineRule(
  id: YangzhaiRuleId,
  name: string,
  inputFields: readonly (keyof YangzhaiInput)[],
  condition: (input: YangzhaiInput) => boolean,
  copy: RuleCopy
): YangzhaiRule {
  return {
    id,
    name,
    inputFields,
    evaluate(input) {
      const triggered = condition(input);
      const hasRelevantInput = inputFields.some(
        field => input[field] !== undefined
      );
      return {
        ruleId: id,
        ruleName: name,
        triggered,
        verdict: triggered ? copy.hitVerdict : hasRelevantInput ? "吉" : "平",
        message: triggered
          ? copy.hitMessage
          : hasRelevantInput
            ? copy.clearMessage
            : `未提供“${name}”规则所需信息，暂不判断。`,
        remedy: triggered
          ? copy.hitRemedy
          : hasRelevantInput
            ? copy.clearRemedy
            : `如需检查“${name}”，请先补充相应表单或户型资料。`,
        inputFields,
        rulesetVersion: YANGZHAI_RULESET_VERSION,
        source: YANGZHAI_RULE_SOURCE,
      };
    },
  };
}

function hasMaintenanceIssue(input: YangzhaiInput): boolean {
  return (
    input.maintenanceIssues?.some(issue => issue.trim().length > 0) ?? false
  );
}

function hasDirectionContext(input: YangzhaiInput): boolean {
  return (
    input.orientationDegrees !== undefined ||
    input.doorPosition !== undefined ||
    input.primaryRoomPosition !== undefined ||
    input.hasTrueNorth !== undefined ||
    input.hasMeasure !== undefined
  );
}

function directionEvidenceIncomplete(input: YangzhaiInput): boolean {
  if (!hasDirectionContext(input)) return false;

  return (
    !Number.isFinite(input.orientationDegrees) ||
    (input.orientationDegrees as number) < 0 ||
    (input.orientationDegrees as number) >= 360 ||
    !Number.isInteger(input.floorNumber) ||
    (input.floorNumber as number) < 1 ||
    input.hasTrueNorth !== true ||
    input.hasMeasure !== true ||
    input.hasFloorPlan !== true ||
    input.doorPosition === undefined ||
    input.primaryRoomPosition === undefined ||
    input.hasSiteData !== true
  );
}

function hasConflictingSystems(input: YangzhaiInput): boolean {
  const systems = new Set(input.traditionalSystems ?? []);
  return systems.size >= 2 && input.traditionalLabelsConflict === true;
}

export const YANGZHAI_RULES: readonly YangzhaiRule[] = [
  defineRule(
    "YZ-01",
    "空间使用",
    ["areaRatio"],
    input => input.areaRatio === "大",
    {
      hitVerdict: "凶",
      hitMessage:
        "住宅面积相对常住人数与实际需求偏大，长期空置区域可能增加维护遗漏与能耗。",
      hitRemedy:
        "定期检查空置房间的渗漏、霉变、通风和设备状态，并按实际使用范围优化分区与能耗；这不代表贫富结果。",
      clearMessage: "住宅面积与实际使用需求未见明显失衡。",
      clearRemedy: "继续按季检查不常用房间的通风、潮湿和设备状态。",
    }
  ),
  defineRule(
    "YZ-02",
    "入口比例",
    ["doorSize", "areaRatio", "doorDirectToPrivate"],
    input =>
      input.doorSize === "大" &&
      (input.areaRatio === "小" || input.doorDirectToPrivate === true),
    {
      hitVerdict: "凶",
      hitMessage:
        "入口尺度偏大，且内部空间偏小或入口直曝主要起居区，需复核使用风险。",
      hitRemedy:
        "检查入口保温、噪声、私密、门扇碰撞与疏散净宽；入口实际尺寸应按规范及使用需求确定。",
      clearMessage: "入口与内部空间比例未命中明显失衡条件。",
      clearRemedy: "保持门扇开启范围清晰，并定期复核疏散净宽与五金状态。",
    }
  ),
  defineRule("YZ-03", "围护完整", ["maintenanceIssues"], hasMaintenanceIssue, {
    hitVerdict: "凶",
    hitMessage: "已记录围墙、门窗、屋面或外墙的破损、松动或渗漏问题。",
    hitRemedy:
      "优先安排结构与围护巡检，处理坠落、进水、虫害和安防风险；这是维护建议，不是灾祸预测。",
    clearMessage: "当前未记录围护结构的明显维护问题。",
    clearRemedy: "在雨季、大风或装修后复查屋面、外墙、门窗和排水节点。",
  }),
  defineRule(
    "YZ-04",
    "井灶适位",
    ["kitchenAdjacent"],
    input => input.kitchenAdjacent === true,
    {
      hitVerdict: "凶",
      hitMessage:
        "饮用水、排污与厨房的相邻关系不当，或燃气、排烟、防火条件尚不明确。",
      hitRemedy:
        "按当地给排水、燃气和消防规范复核，必要时请持证专业人员检测；古代方位法不能替代检测。",
      clearMessage: "当前未报告厨房相邻设施或燃气排烟条件异常。",
      clearRemedy: "继续维护排烟、燃气报警与给排水设施，并按产品要求定期检查。",
    }
  ),
  defineRule(
    "YZ-05",
    "门主关系",
    ["doorDirectToPrivate", "doorPosition", "primaryRoomPosition"],
    input => input.doorDirectToPrivate === true,
    {
      hitVerdict: "凶",
      hitMessage:
        "入户门视线直达主要卧室或起居私密区，可能带来私密与声光干扰。",
      hitRemedy:
        "可用玄关、错位收纳或可控遮挡改善私密，同时保持消防疏散通道与通行净宽。",
      clearMessage: "当前未报告入口视线直达主要私密区。",
      clearRemedy: "保持入户动线清晰，遮挡设施不得占用疏散通道。",
    }
  ),
  defineRule(
    "YZ-06",
    "门灶关系",
    ["kitchenOnRoute", "crossBreezeOverStove", "doorPosition"],
    input =>
      input.kitchenOnRoute === true || input.crossBreezeOverStove === true,
    {
      hitVerdict: "凶",
      hitMessage: "主要通行路线穿越烹饪操作区，或有强穿堂风直接掠过灶具。",
      hitRemedy:
        "复核碰撞、烫伤、火焰稳定和排烟风险；调整方案须先满足消防、燃气与通行规范。",
      clearMessage: "当前未报告主要动线或强穿堂风干扰烹饪区。",
      clearRemedy: "保持灶具周边通行边界明确，并确保排烟与补风条件稳定。",
    }
  ),
  defineRule(
    "YZ-07",
    "宅向复核",
    [
      "orientationDegrees",
      "floorNumber",
      "hasTrueNorth",
      "hasMeasure",
      "hasFloorPlan",
      "doorPosition",
      "primaryRoomPosition",
      "hasSiteData",
    ],
    directionEvidenceIncomplete,
    {
      hitVerdict: "平",
      hitMessage:
        "已有宅向或户型方位输入，但真北、楼层、测量误差、户型标注或现场资料不完整，暂不判方位。",
      hitRemedy:
        "补充可靠测量与空间资料；资料齐全后也只给文化标签，以及日照、遮挡、风、噪声和热负荷等环境检查项。",
      clearMessage: "未提出方位判断，或宅向复核所需资料已完整。",
      clearRemedy: "方位资料仍需结合现场日照、遮挡、风与噪声实测使用。",
    }
  ),
  defineRule(
    "YZ-08",
    "宅命请求",
    ["ageGenderRequested"],
    input => input.ageGenderRequested === true,
    {
      hitVerdict: "平",
      hitMessage:
        "按出生年或性别匹配住宅属于传统术数分类，不能据此预测事件或作住宅决策。",
      hitRemedy:
        "改按居住者的行动能力、作息、采光、安静、尺度和无障碍需求评估人宅匹配。",
      clearMessage: "当前未提出按出生年或性别判断住宅的请求。",
      clearRemedy: "继续以居住者的实际功能、作息与无障碍需求作为空间评估依据。",
    }
  ),
  defineRule(
    "YZ-09",
    "多体系冲突",
    ["traditionalSystems", "traditionalLabelsConflict"],
    hasConflictingSystems,
    {
      hitVerdict: "平",
      hitMessage:
        "两个或以上传统体系给出了相互冲突的标签，不能把不同年代与方法的分类强行合并。",
      hitRemedy:
        "分别标注来源时代与体系，不择凶词放大；转回可测的采光、风、噪声、消防和卫生指标。",
      clearMessage: "当前没有足够证据表明多个传统体系产生了标签冲突。",
      clearRemedy:
        "若引用传统标签，应始终记录体系与来源，不把不同方法混成唯一算法。",
    }
  ),
];

/** 返回按 YZ-01～YZ-09 排序、需要向用户展示的环境检查提示。 */
export function evaluateYangzhai(input: YangzhaiInput): YangzhaiRuleResult[] {
  return YANGZHAI_RULES.map(rule => rule.evaluate(input)).filter(
    result => result.triggered
  );
}

/** 返回九条规则的完整审计结果，包括未命中的“吉”状态。 */
export function auditYangzhai(input: YangzhaiInput): YangzhaiRuleResult[] {
  return YANGZHAI_RULES.map(rule => rule.evaluate(input));
}
