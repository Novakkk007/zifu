/**
 * 预览环境硬化测试：healthz/readyz 探针、支付闸门、反馈系统（含脱敏守卫）。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@db/schema";
import { appRouter } from "./router";
import type { TrpcContext } from "./context";
import app from "./boot";

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

describe("部署探针", () => {
  it("GET /healthz：进程存活 + 环境标识 + commitSha", async () => {
    const res = await app.fetch(new Request("http://localhost/healthz"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(typeof body.env).toBe("string");
    expect(typeof body.preview).toBe("boolean");
    expect(typeof body.commitSha).toBe("string");
  });

  it("GET /readyz：数据库可用 → 200 且汇报路由注册表", async () => {
    getDbMock.mockReturnValue({ execute: vi.fn().mockResolvedValue([[], []]) });
    const res = await app.fetch(new Request("http://localhost/readyz"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      database: string;
      routers: string[];
      paymentEnabled: boolean;
    };
    expect(body.ok).toBe(true);
    expect(body.database).toBe("up");
    for (const r of ["bazi", "liuyao", "ziwei", "qimen", "daliuren", "qizheng", "hepan", "hecan", "draws", "feedback"]) {
      expect(body.routers).toContain(r);
    }
    expect(body.paymentEnabled).toBe(false); // 测试环境未设 PAYMENT_ENABLED → 默认关闭
  });

  it("GET /readyz：数据库不可用 → 503", async () => {
    getDbMock.mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error("conn refused")),
    });
    const res = await app.fetch(new Request("http://localhost/readyz"));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { ok: boolean; database: string };
    expect(body.ok).toBe(false);
    expect(body.database).toBe("down");
  });
});

describe("运行时配置出口", () => {
  it("GET /api/config：未设 PAYMENT_ENABLED → paymentEnabled=false（fail-closed）", async () => {
    const res = await app.fetch(new Request("http://localhost/api/config"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { paymentEnabled: boolean };
    expect(body.paymentEnabled).toBe(false); // 测试环境未设 PAYMENT_ENABLED → 默认关闭
  });

  it("GET /api/config：不依赖数据库可用性（DB down 仍 200）", async () => {
    getDbMock.mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error("conn refused")),
    });
    const res = await app.fetch(new Request("http://localhost/api/config"));
    expect(res.status).toBe(200);
  });
});

describe("支付闸门", () => {
  it("PAYMENT_ENABLED 未开启：billing.recharge 拒绝落单", async () => {
    const caller = appRouter.createCaller(userCtx(1));
    await expect(
      caller.billing.recharge({ amountFen: 100, idempotencyKey: "preview-gate-01" }),
    ).rejects.toThrow(/未开放充值/);
  });
});

describe("反馈系统", () => {
  const validInput = {
    route: "/liuyao",
    feature: "algorithm" as const,
    severity: "P1" as const,
    title: "六爻变卦六亲疑似有误",
    description: "本卦泰之初九动，变卦装出的六亲与本宫不一致，请复核。",
    browser: "vitest",
    device: "1280x800",
  };

  function insertMock() {
    const values = vi.fn().mockResolvedValue([{ insertId: 42 }]);
    getDbMock.mockReturnValue({ insert: vi.fn().mockReturnValue({ values }) });
    return values;
  }

  it("游客可提交反馈；commitSha 由服务端注入", async () => {
    const values = insertMock();
    const caller = appRouter.createCaller(guestCtx());
    const res = await caller.feedback.submit(validInput);
    expect(res.ok).toBe(true);
    expect(res.feedbackId).toBe(42);
    expect(typeof res.commitSha).toBe("string");
    const row = values.mock.calls[0][0] as Record<string, unknown>;
    expect(row.userId).toBeNull();
    expect(row.commitSha).toBe(res.commitSha);
    expect(row.status).toBeUndefined(); // 由 schema 默认值 open 兜底
  });

  it("登录用户提交：记录 userId", async () => {
    const values = insertMock();
    const caller = appRouter.createCaller(userCtx(7));
    await caller.feedback.submit(validInput);
    const row = values.mock.calls[0][0] as Record<string, unknown>;
    expect(row.userId).toBe(7);
  });

  it("脱敏守卫：描述含生辰日期 → 拒绝并提示用 chartId", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(
      caller.feedback.submit({
        ...validInput,
        description: "我生于 1990-06-15，排出来的盘不对。",
      }),
    ).rejects.toThrow(/生辰原始数据/);
    await expect(
      caller.feedback.submit({
        ...validInput,
        description: "农历闰五月初三 午时10:30 的盘不对",
      }),
    ).rejects.toThrow(/生辰原始数据/);
  });

  it("feedback.list 需要管理员（游客与非管理员均拒绝）", async () => {
    const guest = appRouter.createCaller(guestCtx());
    await expect(guest.feedback.list()).rejects.toThrow();
    const nonAdmin = appRouter.createCaller(userCtx(9));
    await expect(nonAdmin.feedback.list()).rejects.toThrow();
  });
});
