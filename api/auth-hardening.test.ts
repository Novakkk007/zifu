/**
 * 认证与预览硬化测试：
 * - 支付/AI 计费 fail-closed 闸门矩阵（纯函数）
 * - OAuth 一次性 state：begin 生成/落库，callback 拒绝伪造/过期/重放
 * - readyz 不外泄数据库异常原文
 * - 反馈限流 + 全字段脱敏
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeAiBillingEnabled,
  computePaymentEnabled,
} from "./lib/env";
import { createOAuthBeginHandler, createOAuthCallbackHandler } from "./kimi/auth";
import { appRouter } from "./router";
import type { TrpcContext } from "./context";
import { resetFeedbackRateLimits } from "./feedback-router";
import app from "./boot";

/** getDb 替身（内存假库，覆盖 oauth_states 最小链路） */
const { getDbMock, stateStore } = vi.hoisted(() => {
  const stateStore = {
    rows: [] as {
      state: string;
      redirectUri: string;
      expiresAt: Date;
      usedAt: Date | null;
      createdAt: Date;
    }[],
  };
  return { getDbMock: vi.fn(), stateStore };
});
vi.mock("./queries/connection", () => ({ getDb: getDbMock }));

function fakeDb() {
  return {
    insert: () => ({
      values: (row: (typeof stateStore.rows)[number]) => {
        stateStore.rows.push(row);
        return Promise.resolve([{ insertId: stateStore.rows.length }]);
      },
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: (n: number) => Promise.resolve(stateStore.rows.slice(0, n)),
        }),
      }),
    }),
    update: () => ({
      set: (v: { usedAt: Date }) => ({
        where: () => {
          // 模拟原子消费：只有未使用的行才被更新
          const row = stateStore.rows.find((r) => r.usedAt === null);
          if (row) row.usedAt = v.usedAt;
          return Promise.resolve([{ affectedRows: row ? 1 : 0 }]);
        },
      }),
    }),
    delete: () => ({ where: () => Promise.resolve() }),
    execute: vi.fn().mockResolvedValue([[], []]),
  };
}

function honoCtx(path: string, query = ""): never {
  const url = `https://zifu-preview.example.com${path}${query}`;
  const req = new Request(url);
  const store = new Map<string, unknown>();
  return {
    req: {
      raw: req,
      query: (k: string) => new URL(url).searchParams.get(k) ?? undefined,
    },
    json: (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    redirect: (to: string, status = 302) =>
      new Response(null, { status, headers: { Location: to } }),
    get: (k: string) => store.get(k),
    set: (k: string, v: unknown) => store.set(k, v),
  } as never;
}

beforeEach(() => {
  stateStore.rows.length = 0;
  resetFeedbackRateLimits();
  getDbMock.mockReset();
  getDbMock.mockImplementation(fakeDb);
});

describe("支付/AI 计费 fail-closed 闸门矩阵", () => {
  it("支付：仅 staging/production + 显式 true 才开放", () => {
    expect(computePaymentEnabled("preview", "true")).toBe(false);
    expect(computePaymentEnabled("development", "true")).toBe(false);
    expect(computePaymentEnabled("staging", "true")).toBe(true);
    expect(computePaymentEnabled("production", "true")).toBe(true);
    expect(computePaymentEnabled("production", "false")).toBe(false);
    expect(computePaymentEnabled("production", undefined)).toBe(false);
  });

  it("AI 计费：preview/development 强制免费，production 可关", () => {
    expect(computeAiBillingEnabled("preview", "true")).toBe(false);
    expect(computeAiBillingEnabled("development", undefined)).toBe(false);
    expect(computeAiBillingEnabled("staging", undefined)).toBe(true);
    expect(computeAiBillingEnabled("production", "false")).toBe(false);
  });
});

describe("OAuth 一次性 state", () => {
  it("begin：生成随机 state 落库并 302 到授权页（含 state/redirect_uri）", async () => {
    const handler = createOAuthBeginHandler();
    const res = (await handler(honoCtx("/api/oauth/begin"))) as Response;
    expect(res.status).toBe(302);
    const loc = res.headers.get("Location")!;
    expect(loc).toContain("/api/oauth/authorize");
    expect(loc).toContain("state=");
    expect(loc).toContain(encodeURIComponent("/api/oauth/callback"));
    expect(stateStore.rows).toHaveLength(1);
    expect(stateStore.rows[0].state).toMatch(/^[0-9a-f]{64}$/);
    const url = new URL(loc);
    expect(url.searchParams.get("state")).toBe(stateStore.rows[0].state);
    // redirectUri 绑定本站 origin，不信客户端
    expect(stateStore.rows[0].redirectUri).toBe(
      "https://zifu-preview.example.com/api/oauth/callback",
    );
  });

  it("callback：state 不存在 → 400 invalid state", async () => {
    const handler = createOAuthCallbackHandler();
    const res = (await handler(
      honoCtx("/api/oauth/callback", "?code=abc&state=forged"),
    )) as Response;
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid state" });
  });

  it("callback：state 过期 → 400", async () => {
    stateStore.rows.push({
      state: "s1",
      redirectUri: "https://zifu-preview.example.com/api/oauth/callback",
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
      createdAt: new Date(),
    });
    const handler = createOAuthCallbackHandler();
    const res = (await handler(
      honoCtx("/api/oauth/callback", "?code=abc&state=s1"),
    )) as Response;
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: "state expired or already used",
    });
  });

  it("callback：state 已使用（重放）→ 400", async () => {
    stateStore.rows.push({
      state: "s2",
      redirectUri: "https://zifu-preview.example.com/api/oauth/callback",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
      createdAt: new Date(),
    });
    const handler = createOAuthCallbackHandler();
    const res = (await handler(
      honoCtx("/api/oauth/callback", "?code=abc&state=s2"),
    )) as Response;
    expect(res.status).toBe(400);
  });

  it("callback：redirect_uri 与 begin 绑定不一致 → 400", async () => {
    stateStore.rows.push({
      state: "s3",
      redirectUri: "https://evil.example.com/api/oauth/callback",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
    });
    const handler = createOAuthCallbackHandler();
    const res = (await handler(
      honoCtx("/api/oauth/callback", "?code=abc&state=s3"),
    )) as Response;
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "redirect uri mismatch" });
  });
});

describe("readyz 脱敏", () => {
  it("数据库异常原文不出现在响应中", async () => {
    getDbMock.mockReturnValue({
      execute: vi
        .fn()
        .mockRejectedValue(
          new Error("connect ECONNREFUSED mysql://user:secret@db.internal:3306/zifu"),
        ),
    });
    const res = await app.fetch(new Request("http://localhost/readyz"));
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(text).not.toContain("ECONNREFUSED");
    expect(text).not.toContain("secret");
    expect(text).not.toContain("db.internal");
    expect(text).toContain('"database":"down"');
  });
});

describe("反馈限流与全字段脱敏", () => {
  function guestCtx(): TrpcContext {
    return {
      req: new Request("http://localhost/trpc", {
        headers: { "x-forwarded-for": "203.0.113.7" },
      }),
      resHeaders: new Headers(),
    };
  }
  const base = {
    route: "/bazi",
    feature: "bug" as const,
    severity: "P2" as const,
    title: "页面标题显示异常",
    description: "某页面在特定操作下标题不更新。",
  };

  function feedbackInsertDb() {
    return {
      insert: () => ({ values: () => Promise.resolve([{ insertId: 1 }]) }),
    };
  }

  it("同一 IP 10 分钟内最多 5 条，第 6 条被拒", async () => {
    getDbMock.mockImplementation(feedbackInsertDb);
    const caller = appRouter.createCaller(guestCtx());
    for (let i = 0; i < 5; i++) {
      await caller.feedback.submit({ ...base, title: `反馈 ${i}` });
    }
    await expect(caller.feedback.submit(base)).rejects.toThrow(/过于频繁/);
  });

  it("期望结果/实际结果字段同样过脱敏守卫", async () => {
    getDbMock.mockImplementation(feedbackInsertDb);
    const caller = appRouter.createCaller(guestCtx());
    await expect(
      caller.feedback.submit({ ...base, expectedResult: "1990年6月15日的盘应该……" }),
    ).rejects.toThrow(/生辰原始数据/);
    await expect(
      caller.feedback.submit({ ...base, actualResult: "庚午年壬午月的结果不对" }),
    ).rejects.toThrow(/生辰原始数据/);
    await expect(
      caller.feedback.submit({ ...base, description: "生于 晚上10点 的盘不对" }),
    ).rejects.toThrow(/生辰原始数据/);
  });
});
