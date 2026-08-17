import { describe, expect, it } from "vitest";
import {
  auditYangzhai,
  evaluateYangzhai,
  YANGZHAI_RULES,
  YANGZHAI_RULESET_VERSION,
  YANGZHAI_RULE_SOURCE,
  type YangzhaiInput,
  type YangzhaiRuleId,
  type YangzhaiVerdict,
} from "./fengshui-rules";

interface RuleCase {
  id: YangzhaiRuleId;
  hitVerdict: YangzhaiVerdict;
  trigger: YangzhaiInput;
  boundary: YangzhaiInput;
}

const completeDirectionInput: YangzhaiInput = {
  orientationDegrees: 180,
  floorNumber: 8,
  hasTrueNorth: true,
  hasMeasure: true,
  hasFloorPlan: true,
  doorPosition: "南",
  primaryRoomPosition: "东",
  hasSiteData: true,
};

const cases: RuleCase[] = [
  {
    id: "YZ-01",
    hitVerdict: "凶",
    trigger: { areaRatio: "大" },
    boundary: { areaRatio: "中" },
  },
  {
    id: "YZ-02",
    hitVerdict: "凶",
    trigger: { doorSize: "大", areaRatio: "小" },
    boundary: { doorSize: "大", areaRatio: "中", doorDirectToPrivate: false },
  },
  {
    id: "YZ-03",
    hitVerdict: "凶",
    trigger: { maintenanceIssues: ["屋面渗漏"] },
    boundary: { maintenanceIssues: ["  "] },
  },
  {
    id: "YZ-04",
    hitVerdict: "凶",
    trigger: { kitchenAdjacent: true },
    boundary: { kitchenAdjacent: false },
  },
  {
    id: "YZ-05",
    hitVerdict: "凶",
    trigger: {
      doorDirectToPrivate: true,
      doorPosition: "南",
      primaryRoomPosition: "南",
    },
    boundary: {
      doorDirectToPrivate: false,
      doorPosition: "南",
      primaryRoomPosition: "东",
    },
  },
  {
    id: "YZ-06",
    hitVerdict: "凶",
    trigger: { crossBreezeOverStove: true },
    boundary: { kitchenOnRoute: false, crossBreezeOverStove: false },
  },
  {
    id: "YZ-07",
    hitVerdict: "平",
    trigger: { ...completeDirectionInput, floorNumber: undefined },
    boundary: completeDirectionInput,
  },
  {
    id: "YZ-08",
    hitVerdict: "平",
    trigger: { ageGenderRequested: true },
    boundary: { ageGenderRequested: false },
  },
  {
    id: "YZ-09",
    hitVerdict: "平",
    trigger: {
      traditionalSystems: ["宅经二十四路", "后世八宅"],
      traditionalLabelsConflict: true,
    },
    boundary: {
      traditionalSystems: ["宅经二十四路"],
      traditionalLabelsConflict: true,
    },
  },
];

describe("阳宅 YZ-01～YZ-09 规则", () => {
  for (const testCase of cases) {
    it(`${testCase.id}：正向命中与边界不命中均返回完整闭环`, () => {
      const rule = YANGZHAI_RULES.find(item => item.id === testCase.id);
      expect(rule).toBeDefined();

      const hit = rule!.evaluate(testCase.trigger);
      expect(hit.triggered).toBe(true);
      expect(hit.verdict).toBe(testCase.hitVerdict);
      expect(hit.message.length).toBeGreaterThan(10);
      expect(hit.remedy.length).toBeGreaterThan(10);
      expect(hit.inputFields.length).toBeGreaterThan(0);

      const clear = rule!.evaluate(testCase.boundary);
      expect(clear.triggered).toBe(false);
      expect(clear.verdict).toBe("吉");
      expect(clear.message.length).toBeGreaterThan(10);
      expect(clear.remedy.length).toBeGreaterThan(10);
    });
  }

  it("YZ-02 的另一正向分支覆盖入口直曝主要起居区", () => {
    expect(
      evaluateYangzhai({
        doorSize: "大",
        areaRatio: "中",
        doorDirectToPrivate: true,
      }).map(result => result.ruleId)
    ).toContain("YZ-02");
  });

  it("YZ-06 的另一正向分支覆盖主通行路线穿越厨房", () => {
    expect(
      evaluateYangzhai({ kitchenOnRoute: true }).map(result => result.ruleId)
    ).toContain("YZ-06");
  });

  it("YZ-07 在没有提出方位判断时不误报资料缺失", () => {
    const result = YANGZHAI_RULES.find(rule => rule.id === "YZ-07")!.evaluate(
      {}
    );
    expect(result.triggered).toBe(false);
    expect(result.verdict).toBe("平");
    expect(result.message).toContain("暂不判断");
  });

  it("只展示命中项，完整审计始终按编号返回九条结果", () => {
    const input: YangzhaiInput = {
      areaRatio: "大",
      kitchenAdjacent: true,
    };
    expect(evaluateYangzhai(input).map(result => result.ruleId)).toEqual([
      "YZ-01",
      "YZ-04",
    ]);
    expect(auditYangzhai(input).map(result => result.ruleId)).toEqual([
      "YZ-01",
      "YZ-02",
      "YZ-03",
      "YZ-04",
      "YZ-05",
      "YZ-06",
      "YZ-07",
      "YZ-08",
      "YZ-09",
    ]);
  });

  it("所有结果携带稳定版本、权威来源且不含确定性灾祸断言", () => {
    for (const result of auditYangzhai({})) {
      expect(result.rulesetVersion).toBe(YANGZHAI_RULESET_VERSION);
      expect(result.source).toBe(YANGZHAI_RULE_SOURCE);
      expect(`${result.message}${result.remedy}`).not.toMatch(
        /必然|注定|一定发生|致贫|致富|生死|病灾/
      );
    }
  });
});
