import { describe, expect, it } from "vitest";
import { castWithTosses } from "@contracts/engines/liuyao-core";
import { buildLiuyaoChartSummary, hexagramSymbol } from "./GuaciPanel";

describe("GuaciPanel helpers", () => {
  it("按文王卦序生成六十四卦符号，并对越界值安全降级", () => {
    expect(hexagramSymbol(1)).toBe("䷀");
    expect(hexagramSymbol(2)).toBe("䷁");
    expect(hexagramSymbol(64)).toBe("䷿");
    expect(hexagramSymbol(0)).toBe("卦");
  });

  it("先生摘要包含本卦、变卦、大象辞、六亲世应与合规边界", () => {
    const chart = castWithTosses([9, 7, 7, 7, 7, 7], {
      question: "近期计划如何安排？",
      castAt: Date.UTC(2026, 7, 20, 4),
    }).data;
    const summary = buildLiuyaoChartSummary(chart);

    expect(summary).toContain("本卦：《乾为天》䷀");
    expect(summary).toContain("天行健，君子以自强不息");
    expect(summary).toContain("变卦：《天风姤》䷫");
    expect(summary).toContain("六亲世应概览（自下而上）");
    expect(summary).toMatch(/世在.+，应在/);
    expect(summary).toContain("不作具体事件断言");
    expect(summary).toContain("不替代医疗、法律或投资意见");
  });

  it("无动爻时明确说明六爻安静且无变卦", () => {
    const chart = castWithTosses([7, 7, 7, 7, 7, 7], { castAt: 0 }).data;
    expect(buildLiuyaoChartSummary(chart)).toContain("变卦：六爻安静，无变卦");
  });
});
