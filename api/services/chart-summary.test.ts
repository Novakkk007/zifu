import { describe, expect, it } from "vitest";
import { computeChartV2 } from "@contracts/bazi-core";
import type { BirthInput } from "@contracts/bazi-core";
import { computeQimen } from "@contracts/engines/qimen-core";
import { chartSummaryForAi } from "./chart-summary";

const input: BirthInput = {
  calendar: "solar",
  year: 2000,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
  gender: "male",
  useTrueSolarTime: false,
  dayRollover: "zichu",
};

describe("chartSummaryForAi", () => {
  const chart = computeChartV2(input);
  const summary = chartSummaryForAi(chart);

  it("包含四柱、日主、五行、旺衰、用神", () => {
    expect(summary).toContain(`年柱${chart.pillars.year.ganzhi}`);
    expect(summary).toContain(`月柱${chart.pillars.month.ganzhi}`);
    expect(summary).toContain(`日柱${chart.pillars.day.ganzhi}`);
    expect(summary).toContain(`时柱${chart.pillars.hour!.ganzhi}`);
    expect(summary).toContain(`日主：${chart.dayMaster}`);
    expect(summary).toContain("五行分布：");
    expect(summary).toContain(`旺衰：${chart.wuxing.strength.grade}`);
    expect(summary).toContain(`用神：${chart.yongshen.yongshen}`);
  });

  it("命中神煞时列出神煞名", () => {
    if (chart.shensha.length > 0) {
      expect(summary).toContain("神煞：");
      expect(summary).toContain(chart.shensha[0].name);
    }
  });

  it("不含原始出生信息（年份/月日/城市）", () => {
    expect(summary).not.toContain(String(input.year));
    expect(summary).not.toContain("2000-01-01");
    expect(summary).not.toContain("北京");
  });

  it("时辰未知时标注未排时柱", () => {
    const noHour = computeChartV2({ ...input, hour: null });
    const s = chartSummaryForAi(noHour);
    expect(s).toContain("时辰未知，未排时柱");
  });

  it("奇门 EngineResult 信封：走 qimen 摘要（遁局/值符值使/九宫）", () => {
    const qm = computeQimen({ datetime: "2024-12-21T18:00" });
    const s = chartSummaryForAi(qm as unknown as Parameters<typeof chartSummaryForAi>[0]);
    expect(s).toContain("阳遁4局");
    expect(s).toContain("值符天辅");
    expect(s).toContain("值使杜门");
    expect(s).toContain("坎一宫");
  });

  it("未登记引擎信封：回退通用占位摘要（不 500、不静默生成八字摘要）", () => {
    const alien = { meta: { engine: "unknown-art", ruleVariant: "测试流派" }, data: {} };
    const s = chartSummaryForAi(alien as unknown as Parameters<typeof chartSummaryForAi>[0]);
    expect(s).toContain("unknown-art");
    expect(s).toContain("暂不支持结构化摘要");
    expect(s).not.toContain("四柱");
  });

  it("已登记引擎（ziwei）信封：走注册表分发而非占位", () => {
    // 最小 ziwei 形状（仅摘要所需字段）
    const zw = {
      meta: { engine: "ziwei", ruleVariant: "北派紫微-全书安星法" },
      data: {
        genderKind: "阳男",
        ju: { name: "火六局", num: 6 },
        mingGongGanzhi: "丙寅",
        shenBranch: "寅",
        mingZhu: "禄存",
        shenZhu: "火星",
        palaces: [],
        sihua: [],
      },
    };
    const s = chartSummaryForAi(zw as unknown as Parameters<typeof chartSummaryForAi>[0]);
    expect(s).toContain("紫微斗数");
    expect(s).toContain("火六局");
    expect(s).toContain("丙寅");
  });

  it("hepan 落库外壳 { compatibility }：拆壳后走合盘摘要", () => {
    const stored = {
      compatibility: {
        meta: { engine: "hepan", ruleVariant: "紫府公开量化模型 v1" },
        data: {
          dimensions: [
            { name: "五行互补", score: 82, weight: 0.3, findings: ["甲方木旺补乙方木缺"] },
            { name: "日主关系", score: 90, weight: 0.25, findings: ["甲乙日主相生"] },
          ],
          totalScore: 85,
          dayMasterRelation: "相生",
          zodiacRelation: "六合",
          crossRelations: [{ type: "天干五合", positions: "甲年干×乙月干", chars: "甲己" }],
        },
      },
    };
    const s = chartSummaryForAi(stored as unknown as Parameters<typeof chartSummaryForAi>[0]);
    expect(s).toContain("八字合盘");
    expect(s).toContain("85/100");
    expect(s).toContain("相生");
    expect(s).toContain("六合");
    expect(s).toContain("五行互补 82分");
    expect(s).toContain("天干五合");
    expect(s).not.toContain("无法识别");
  });

  it("hecan 落库外壳 { result }：拆壳后走合参摘要（含 unavailable 术标注）", () => {
    const stored = {
      result: {
        meta: { engine: "hecan", ruleVariant: "三术合参 v1" },
        data: {
          arts: [
            { artName: "八字", precision: "validated", keyPoints: ["日主丙火身旺", "用神为水"] },
            { artName: "紫微", precision: "validated", keyPoints: ["命宫在戌", "紫微坐命"] },
            { artName: "七政", precision: "unavailable", reason: "时辰未知", keyPoints: [] },
          ],
          crossChecks: [
            { topic: "五行结论一致性", verdict: "consistent", text: "八字与紫微同指火旺" },
          ],
          overallTier: "银",
          availableArts: 2,
        },
      },
    };
    const s = chartSummaryForAi(stored as unknown as Parameters<typeof chartSummaryForAi>[0]);
    expect(s).toContain("三术合参");
    expect(s).toContain("2/3");
    expect(s).toContain("银");
    expect(s).toContain("日主丙火身旺");
    expect(s).toContain("不可用：时辰未知");
    expect(s).toContain("五行结论一致性【一致】");
    expect(s).not.toContain("无法识别");
  });
});
