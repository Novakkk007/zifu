import { describe, expect, it } from "vitest";
import { computeChart, JIAZI } from "./ganzhi";

describe("干支引擎（服务端）", () => {
  it("六十甲子表完整且首尾正确", () => {
    expect(JIAZI).toHaveLength(60);
    expect(JIAZI[0]).toBe("甲子");
    expect(JIAZI[10]).toBe("甲戌");
    expect(JIAZI[59]).toBe("癸亥");
  });

  it("日柱锚定：1900-01-01 = 甲戌日", () => {
    const chart = computeChart({
      year: 1900,
      month: 1,
      day: 1,
      hourBranch: null,
      gender: "male",
    });
    expect(chart.dayP.ganzhi).toBe("甲戌");
  });

  it("日柱校验：2000-01-01 = 戊午日", () => {
    const chart = computeChart({
      year: 2000,
      month: 1,
      day: 1,
      hourBranch: null,
      gender: "female",
    });
    expect(chart.dayP.ganzhi).toBe("戊午");
  });

  it("年柱：(year-4)%60，2000 年 = 庚辰", () => {
    const chart = computeChart({
      year: 2000,
      month: 6,
      day: 15,
      hourBranch: null,
      gender: "male",
    });
    expect(chart.yearP.ganzhi).toBe("庚辰");
  });

  it("时辰不详时 hourP 为 null，指定时辰则有时柱", () => {
    const noHour = computeChart({ year: 1990, month: 5, day: 20, hourBranch: null, gender: "male" });
    expect(noHour.hourP).toBeNull();
    const withHour = computeChart({ year: 1990, month: 5, day: 20, hourBranch: 0, gender: "male" });
    expect(withHour.hourP).not.toBeNull();
    expect(withHour.hourP!.branch).toBe("子");
  });

  it("五行统计守恒：四柱干支各计 1、藏干各计 0.5", () => {
    const chart = computeChart({ year: 1988, month: 3, day: 12, hourBranch: 3, gender: "female" });
    const total = Object.values(chart.wuxingCount).reduce((a, b) => a + b, 0);
    // 4 柱 × (干 1 + 支 1) + 4 支藏干累计
    expect(total).toBeGreaterThan(8);
    expect(total).toBeLessThanOrEqual(20);
  });

  it("同一输入输出确定（可重复排盘）", () => {
    const input = { year: 1995, month: 8, day: 8, hourBranch: 7, gender: "male" as const };
    const a = computeChart(input);
    const b = computeChart(input);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
