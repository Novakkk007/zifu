import { randomInt } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@db/schema";
import {
  drawSignNo,
  GUANYIN_100,
  resolveSign,
  signAt,
} from "@contracts/engines/draws-core";
import { appRouter } from "./router";
import type { TrpcContext } from "./context";

/** getDb 替身 */
const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock("./queries/connection", () => ({ getDb: getDbMock }));

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

beforeEach(() => {
  getDbMock.mockReset();
});

describe("draws-core 签诗数据与抽取", () => {
  it("观音灵签一百首：编号 1-100 连续完整，签诗均为四句七言", () => {
    expect(GUANYIN_100).toHaveLength(100);
    GUANYIN_100.forEach((s, i) => {
      expect(s.no).toBe(i + 1);
      expect(s.poem).toHaveLength(4);
      for (const line of s.poem) expect(line).toHaveLength(7);
      expect(["上签", "中签", "下签"]).toContain(s.grade);
      expect(s.note.length).toBeGreaterThan(0);
    });
    expect(signAt(1).poem[0]).toBe("天开地辟结良缘");
    expect(signAt(100).grade).toBe("下签");
    expect(() => signAt(101)).toThrow();
  });

  it("CSPRNG 分布粗检：2000 次抽取覆盖 1-100 全区间且无越界", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i += 1) {
      const no = drawSignNo(randomInt);
      expect(no).toBeGreaterThanOrEqual(1);
      expect(no).toBeLessThanOrEqual(100);
      seen.add(no);
    }
    // 2000 次均匀抽取应覆盖绝大多数签号（单签缺失概率 < 10^-6；允许 1 签缺失防随机抖动）
    expect(seen.size).toBeGreaterThanOrEqual(99);
  });

  it("resolveSign 返回传统签文", () => {
    const sign = resolveSign(40);
    expect(sign.poem.join("")).toContain("红轮西坠兔东升");
  });
});

describe("draws.lingqian API", () => {
  it("未登录返回 UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(
      caller.draws.lingqian({ idempotencyKey: "guest-2025-01-01" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("首抽：CSPRNG 出签 + 落库 chartType 'draw'，EngineResult 信封", async () => {
    const inserts: { values: unknown }[] = [];
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({ orderBy: () => ({ limit: async () => [] }) }),
        }),
      }),
      insert: () => ({
        values: (v: unknown) => {
          inserts.push({ values: v });
          return { $returningId: async () => [{ id: 31 }] };
        },
      }),
    });
    const authed = appRouter.createCaller(userCtx(5));
    const res = await authed.draws.lingqian({ idempotencyKey: "5-2025-06-01" });
    expect(res.result.meta.engine).toBe("draw");
    expect(res.result.meta.precision).toBe("validated");
    expect(res.result.data.signNo).toBeGreaterThanOrEqual(1);
    expect(res.result.data.signNo).toBeLessThanOrEqual(100);
    expect(res.result.data.idempotentReplay).toBe(false);
    expect(res.result.data.sign.no).toBe(res.result.data.signNo);
    expect(res.result.data.sign.poem).toHaveLength(4);
    expect(res.chartId).toBe(31);
    const chartRow = inserts[0].values as { chartType: string; input: string };
    expect(chartRow.chartType).toBe("draw");
    expect(JSON.parse(chartRow.input)).toEqual({ idempotencyKey: "5-2025-06-01" });
  });

  it("幂等：同一 idempotencyKey 复放同一签，不重新随机、不重复落库", async () => {
    const savedResult = {
      meta: { engine: "draw" },
      data: { signNo: 42, sign: resolveSign(42), idempotentReplay: false },
    };
    const insertMock = vi.fn();
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: async () => [
                {
                  id: 88,
                  input: JSON.stringify({ idempotencyKey: "5-2025-06-01" }),
                  result: JSON.stringify(savedResult),
                },
              ],
            }),
          }),
        }),
      }),
      insert: insertMock,
    });
    const authed = appRouter.createCaller(userCtx(5));
    const res = await authed.draws.lingqian({ idempotencyKey: "5-2025-06-01" });
    expect(res.result.data.signNo).toBe(42);
    expect(res.result.data.idempotentReplay).toBe(true);
    expect(res.result.data.sign.poem[0]).toBe(resolveSign(42).poem[0]);
    expect(res.chartId).toBe(88);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("不同 idempotencyKey 不复放（视为新抽签）", async () => {
    const savedResult = {
      meta: { engine: "draw" },
      data: { signNo: 42, sign: resolveSign(42), idempotentReplay: false },
    };
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: async () => [
                {
                  id: 88,
                  input: JSON.stringify({ idempotencyKey: "5-2025-06-01" }),
                  result: JSON.stringify(savedResult),
                },
              ],
            }),
          }),
        }),
      }),
      insert: () => ({
        values: () => ({ $returningId: async () => [{ id: 89 }] }),
      }),
    });
    const authed = appRouter.createCaller(userCtx(5));
    const res = await authed.draws.lingqian({ idempotencyKey: "5-2025-06-02" });
    expect(res.result.data.idempotentReplay).toBe(false);
    expect(res.chartId).toBe(89);
  });
});
