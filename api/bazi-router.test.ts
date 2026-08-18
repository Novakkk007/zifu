import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@db/schema";
import { appRouter } from "./router";
import type { TrpcContext } from "./context";

/** getDb 替身（vi.hoisted 保证在 vi.mock 工厂之前初始化） */
const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock("./queries/connection", () => ({ getDb: getDbMock }));

/** 未登录上下文（无 user、无 DB 依赖路径） */
function guestCtx(): TrpcContext {
  return { req: new Request("http://localhost/trpc"), resHeaders: new Headers() };
}

function userCtx(id: number): TrpcContext {
  return {
    req: new Request("http://localhost/trpc"),
    resHeaders: new Headers(),
    user: { id } as User,
  };
}

/** 标准公历输入（2000-01-01 12:00 男） */
const solarInput = {
  calendar: "solar" as const,
  year: 2000,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
  gender: "male" as const,
  useTrueSolarTime: false,
  dayRollover: "zichu" as const,
};

beforeEach(() => {
  getDbMock.mockReset();
});

describe("bazi.paipan API（bazi-core v2）", () => {
  const caller = appRouter.createCaller(guestCtx());

  it("公历输入 happy path：返回完整 V2 命盘与规则版本、时间审计", async () => {
    const res = await caller.bazi.paipan(solarInput);
    expect(res.chart.rulesetVersion).toBe("1.4.0");
    expect(res.chart.timeAudit).toBeDefined();
    expect(res.chart.timeAudit.rulesetVersion).toBe("1.4.0");
    expect(res.chart.timeAudit.inputCalendar).toBe("solar");
    expect(res.chart.pillars.day.ganzhi).toBe("戊午");
    expect(res.chart.pillars.year.ganzhi).toBe("己卯"); // 立春前，仍属己卯年
    expect(res.chart.dayMaster).toBe("戊");
    expect(res.chart.yongshen.yongshen).toBeTruthy();
    // 未登录：不落库
    expect(res.persisted).toBe(false);
    expect(res.chartId).toBeNull();
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("时辰未知（hour=null）时柱不排、称骨为 null，仍可排盘", async () => {
    const res = await caller.bazi.paipan({ ...solarInput, hour: null });
    expect(res.chart.pillars.hour).toBeNull();
    expect(res.chart.chenggu).toBeNull();
  });

  it("农历+闰月输入被接受并正确换算", async () => {
    // 2020 年农历闰四月：闰四月初一 ≈ 公历 2020-05-23
    const res = await caller.bazi.paipan({
      ...solarInput,
      calendar: "lunar",
      year: 2020,
      month: 4,
      day: 1,
      isLeapMonth: true,
    });
    expect(res.chart.timeAudit.inputCalendar).toBe("lunar");
    expect(res.chart.timeAudit.isLeapMonth).toBe(true);
    expect(res.chart.timeAudit.lunarMonth).toBe(-4);
    expect(res.chart.timeAudit.standardTime.startsWith("2020-05-23")).toBe(true);
  });

  it("Zod 拦截月份 13", async () => {
    await expect(
      caller.bazi.paipan({ ...solarInput, month: 13 }),
    ).rejects.toThrow();
  });

  it("Zod 拦截日期 32", async () => {
    await expect(
      caller.bazi.paipan({ ...solarInput, day: 32 }),
    ).rejects.toThrow();
  });

  it("Zod 拦截公历携带闰月标记", async () => {
    await expect(
      caller.bazi.paipan({ ...solarInput, isLeapMonth: true }),
    ).rejects.toThrow(/闰月/);
  });

  it("拒绝不存在的公历日期（2 月 30 日）", async () => {
    await expect(
      caller.bazi.paipan({ ...solarInput, year: 2001, month: 2, day: 30 }),
    ).rejects.toThrow(/无效/);
  });

  it("立春边界：2024-02-04 16:00 与 18:00 年柱不同", async () => {
    const before = await caller.bazi.paipan({
      ...solarInput,
      year: 2024,
      month: 2,
      day: 4,
      hour: 16,
    });
    const after = await caller.bazi.paipan({
      ...solarInput,
      year: 2024,
      month: 2,
      day: 4,
      hour: 18,
    });
    // 2024 立春 ≈ 02-04 16:27（东八区）
    expect(before.chart.pillars.year.ganzhi).toBe("癸卯");
    expect(after.chart.pillars.year.ganzhi).toBe("甲辰");
    expect(before.chart.pillars.year.ganzhi).not.toBe(
      after.chart.pillars.year.ganzhi,
    );
  });

  it("登录用户排盘自动落库并返回 chartId", async () => {
    getDbMock.mockReturnValue({
      insert: () => ({
        values: () => ({ $returningId: async () => [{ id: 7 }] }),
      }),
    });
    const authed = appRouter.createCaller(userCtx(42));
    const res = await authed.bazi.paipan(solarInput);
    expect(res.persisted).toBe(true);
    expect(res.chartId).toBe(7);
  });
});

describe("bazi.remove 归属校验", () => {
  it("越权删除他人排盘记录返回 NOT_FOUND", async () => {
    const deleteMock = vi.fn();
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [{ id: 1, userId: 1 }] }), // 属主是 user 1
        }),
      }),
      delete: deleteMock,
    });
    const userB = appRouter.createCaller(userCtx(2));
    await expect(userB.bazi.remove({ id: 1 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("属主本人删除成功", async () => {
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [{ id: 1, userId: 1 }] }),
        }),
      }),
      delete: () => ({ where: async () => {} }),
    });
    const owner = appRouter.createCaller(userCtx(1));
    await expect(owner.bazi.remove({ id: 1 })).resolves.toEqual({
      success: true,
    });
  });
});

describe("bazi.history", () => {
  it("未登录访问返回 UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(caller.bazi.history()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("ai.reading API（鉴权）", () => {
  it("未登录访问返回 UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(
      caller.ai.reading({
        chartId: 1,
        persona: "hermit",
        depth: "plain",
        idempotencyKey: "guest-key-1",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(getDbMock).not.toHaveBeenCalled();
  });
});
