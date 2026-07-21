import { describe, expect, it } from "vitest";
import { appRouter } from "./router";
import type { TrpcContext } from "./context";

/** 未登录上下文（无 user、无 DB 依赖路径） */
function guestCtx(): TrpcContext {
  return { req: new Request("http://localhost/trpc"), resHeaders: new Headers() };
}

describe("bazi.paipan API", () => {
  const caller = appRouter.createCaller(guestCtx());

  it("合法生辰返回完整四柱命盘", async () => {
    const res = await caller.bazi.paipan({
      year: 2000,
      month: 1,
      day: 1,
      hourBranch: 0,
      gender: "male",
    });
    expect(res.chart.dayP.ganzhi).toBe("戊午");
    expect(res.chart.yearP.ganzhi).toBe("庚辰");
    expect(res.chart.hourP?.branch).toBe("子");
    expect(res.chart.dayMaster).toBe("戊");
    // 未登录：不落库
    expect(res.persisted).toBe(false);
    expect(res.chartId).toBeNull();
  });

  it("拒绝无效日期（2 月 30 日）", async () => {
    await expect(
      caller.bazi.paipan({ year: 2001, month: 2, day: 30, hourBranch: null, gender: "female" }),
    ).rejects.toThrow(/无效/);
  });

  it("Zod 校验拦截越界输入（月份 13）", async () => {
    await expect(
      caller.bazi.paipan({ year: 2000, month: 13, day: 1, hourBranch: null, gender: "male" }),
    ).rejects.toThrow();
  });

  it("未登录访问 history 返回 UNAUTHORIZED", async () => {
    await expect(caller.bazi.history()).rejects.toThrow();
  });
});

describe("ai.reading API", () => {
  const caller = appRouter.createCaller(guestCtx());

  it("无密钥环境下走降级模板并保持契约", async () => {
    delete process.env.AI_API_KEY;
    const res = await caller.ai.reading({
      chartType: "bazi",
      chartSummary: "甲子年 丙寅月 戊午日 壬子时",
      persona: "hermit",
      depth: "plain",
    });
    expect(res.source).toBe("fallback");
    expect(res.text.length).toBeGreaterThan(0);
  });

  it("Zod 校验拦截空摘要", async () => {
    await expect(
      caller.ai.reading({ chartType: "bazi", chartSummary: "", persona: "scholar", depth: "pro" }),
    ).rejects.toThrow();
  });
});
