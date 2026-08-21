import { describe, expect, it } from "vitest";
import { paipanZiwei } from "@contracts/engines/ziwei-core";
import { buildPalaceChartSummary } from "./PalacePanel";

describe("buildPalaceChartSummary", () => {
  it("向逐宫讲述注入命盘摘要、宫位与主星", () => {
    const chart = paipanZiwei({
      calendar: "solar",
      year: 1995,
      month: 6,
      day: 15,
      hourBranch: 0,
      gender: "male",
      currentYear: 2026,
    }).data;
    const palace = chart.palaces.find(item => item.majors.length > 0);

    expect(palace).toBeDefined();
    const summary = buildPalaceChartSummary(chart, palace!);

    expect(summary).toContain("紫微斗数命盘摘要");
    expect(summary).toContain(
      `${palace!.name.endsWith("宫") ? palace!.name : `${palace!.name}宫`}（${palace!.ganzhi}宫）`
    );
    for (const star of palace!.majors) expect(summary).toContain(star.name);
  });

  it("明示文化参详红线", () => {
    const chart = paipanZiwei({
      calendar: "solar",
      year: 2000,
      month: 1,
      day: 1,
      hourBranch: 6,
      gender: "female",
      currentYear: 2026,
    }).data;
    const summary = buildPalaceChartSummary(chart, chart.palaces[0]);

    expect(summary).toContain("仅作传统文化参详");
    expect(summary).toContain("不作具体事件断言");
    expect(summary).toContain("不替代医疗、法律或投资意见");
  });
});
