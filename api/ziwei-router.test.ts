import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@db/schema";
import type { EngineResult, ZiweiChartData } from "@contracts/engines/ziwei-core";
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

/** 标准输入：农历 1984 甲子年正月初一 子时 男（黄金命例 A） */
const lunarInput = {
  calendar: "lunar" as const,
  year: 1984,
  month: 1,
  day: 1,
  hourBranch: 0,
  gender: "male" as const,
};

beforeEach(() => {
  getDbMock.mockReset();
});

describe("ziwei.paipan API（北派全书安星法）", () => {
  const caller = appRouter.createCaller(guestCtx());

  it("happy path：EngineResult 信封 + 真实安星结果；未登录不落库", async () => {
    const res = await caller.ziwei.paipan(lunarInput);
    expect(res.persisted).toBe(false);
    expect(res.chartId).toBeNull();
    expect(getDbMock).not.toHaveBeenCalled();
    const { meta, data } = res.result as EngineResult<ZiweiChartData>;
    expect(meta.engine).toBe("ziwei");
    expect(meta.ruleVariant).toBe("北派紫微-全书安星法");
    expect(meta.precision).toBe("validated");
    expect(data.mingBranch).toBe("寅");
    expect(data.ju.name).toBe("火六局");
    expect(data.ziweiBranch).toBe("酉");
  });

  it("公历输入换算农历后排盘", async () => {
    const res = await caller.ziwei.paipan({
      ...lunarInput,
      calendar: "solar",
      year: 2000,
      month: 1,
      day: 1,
      hourBranch: 6,
    });
    expect(res.result.data.lunar).toEqual({ year: 1999, month: 11, day: 25, isLeapMonth: false });
    expect(res.result.data.yearGanzhi).toBe("己卯");
  });

  it("农历闰月输入被接受（闰四月按四月计）", async () => {
    const res = await caller.ziwei.paipan({
      ...lunarInput,
      year: 2020,
      month: 4,
      day: 15,
      isLeapMonth: true,
    });
    expect(res.result.data.lunar.month).toBe(-4);
    expect(res.result.meta.warnings.some((w) => w.includes("闰月"))).toBe(true);
  });

  it("Zod 拦截时辰支序 12", async () => {
    await expect(caller.ziwei.paipan({ ...lunarInput, hourBranch: 12 })).rejects.toThrow();
  });

  it("Zod 拦截公历携带闰月标记", async () => {
    await expect(
      caller.ziwei.paipan({ ...lunarInput, calendar: "solar", isLeapMonth: true }),
    ).rejects.toThrow(/闰月/);
  });

  it("Zod 拦截农历日期 31", async () => {
    await expect(caller.ziwei.paipan({ ...lunarInput, day: 31 })).rejects.toThrow();
  });

  it("拒绝不存在的公历日期（2 月 30 日）", async () => {
    await expect(
      caller.ziwei.paipan({ ...lunarInput, calendar: "solar", year: 2001, month: 2, day: 30 }),
    ).rejects.toThrow(/无效/);
  });

  it("登录用户排盘自动落库（chartType ziwei）并写版本快照", async () => {
    const inserted: Record<string, unknown>[] = [];
    getDbMock.mockReturnValue({
      insert: () => ({
        values: (v: Record<string, unknown>) => {
          inserted.push(v);
          return { $returningId: async () => [{ id: 9 }] };
        },
      }),
    });
    const authed = appRouter.createCaller(userCtx(42));
    const res = await authed.ziwei.paipan(lunarInput);
    expect(res.persisted).toBe(true);
    expect(res.chartId).toBe(9);
    expect(inserted[0]).toMatchObject({ userId: 42, chartType: "ziwei", algorithmVersion: "ziwei-core@1.0.0" });
    expect(inserted[1]).toMatchObject({ chartId: 9 });
  });
});

describe("ziwei.detail 归属校验", () => {
  const storedResult = JSON.stringify({ meta: { engine: "ziwei" }, data: { mingBranch: "寅" } });

  function dbWithRow(row: Record<string, unknown> | null) {
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => (row ? [row] : []) }),
        }),
      }),
    });
  }

  it("属主可读取落库 EngineResult 快照", async () => {
    dbWithRow({ id: 5, userId: 1, chartType: "ziwei", title: "紫微斗数排盘", result: storedResult });
    const owner = appRouter.createCaller(userCtx(1));
    const res = await owner.ziwei.detail({ chartId: 5 });
    expect(res.chartId).toBe(5);
    expect((res.result as { data: { mingBranch: string } }).data.mingBranch).toBe("寅");
  });

  it("越权读取他人命盘返回 NOT_FOUND", async () => {
    dbWithRow({ id: 5, userId: 1, chartType: "ziwei", result: storedResult });
    const other = appRouter.createCaller(userCtx(2));
    await expect(other.ziwei.detail({ chartId: 5 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("非 ziwei 类型记录返回 NOT_FOUND", async () => {
    dbWithRow({ id: 6, userId: 1, chartType: "bazi", result: storedResult });
    const owner = appRouter.createCaller(userCtx(1));
    await expect(owner.ziwei.detail({ chartId: 6 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("未登录访问返回 UNAUTHORIZED", async () => {
    const guest = appRouter.createCaller(guestCtx());
    await expect(guest.ziwei.detail({ chartId: 5 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(getDbMock).not.toHaveBeenCalled();
  });
});
