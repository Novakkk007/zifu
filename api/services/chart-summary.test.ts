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

  it("未知引擎信封：抛出明确错误而非静默生成八字摘要", () => {
    const alien = { meta: { engine: "ziwei" }, data: {} };
    expect(() =>
      chartSummaryForAi(alien as unknown as Parameters<typeof chartSummaryForAi>[0]),
    ).toThrow(/暂不支持/);
  });
});
