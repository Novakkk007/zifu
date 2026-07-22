/**
 * V9 商业化整改测试：
 * - 统一时间协议：IANA 时区校验（无效 → InvalidTimezoneError）、hourToBranch 全引擎口径
 * - AI 输出净化：HTML/脚本/链接剥除 + 长度截断
 * - 安全响应头：CSP / nosniff / Referrer-Policy / X-Frame-Options
 * - 请求体分级限额：反馈 64KB 超限 → 413
 * - 反馈脱敏补齐：经纬度坐标 / 出生地信息拒收
 * - 紫微统一输入：hour/minute 优选、hourBranch 兼容、unknownHour 显式声明
 */
import { describe, expect, it, vi } from "vitest";
import {
  assertValidIanaTimezone,
  branchToRepresentativeHour,
  hourToBranch,
  InvalidTimezoneError,
} from "@contracts/engines/time-protocol";
import { sanitizeModelOutput, AI_OUTPUT_MAX_CHARS } from "./services/ai";
import { appRouter } from "./router";
import type { TrpcContext } from "./context";
import { resetFeedbackRateLimits } from "./feedback-router";
import app from "./boot";

/** getDb 替身（反馈 submit 最小链路） */
const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock("./queries/connection", () => ({ getDb: getDbMock }));

/* ---------------- 统一时间协议 ---------------- */

describe("统一时间协议", () => {
  it("合法 IANA 时区放行；非法时区抛 InvalidTimezoneError", () => {
    expect(() => assertValidIanaTimezone("Asia/Shanghai")).not.toThrow();
    expect(() => assertValidIanaTimezone("America/New_York")).not.toThrow();
    expect(() => assertValidIanaTimezone(undefined)).not.toThrow();
    expect(() => assertValidIanaTimezone("")).not.toThrow();
    expect(() => assertValidIanaTimezone("Mars/Olympus_Mons")).toThrow(
      InvalidTimezoneError,
    );
    expect(() => assertValidIanaTimezone("Beijing")).toThrow(
      InvalidTimezoneError,
    );
  });

  it("hourToBranch 全引擎统一口径：子时 23:00–00:59", () => {
    expect(hourToBranch(23)).toBe(0); // 夜子
    expect(hourToBranch(0)).toBe(0); // 早子
    expect(hourToBranch(1)).toBe(1); // 丑
    expect(hourToBranch(14)).toBe(7); // 未
    expect(hourToBranch(22)).toBe(11); // 亥
    expect(() => hourToBranch(24)).toThrow();
    expect(() => hourToBranch(-1)).toThrow();
  });

  it("branchToRepresentativeHour 与 hourToBranch 互逆（代表小时）", () => {
    for (let b = 0; b < 12; b++) {
      expect(hourToBranch(branchToRepresentativeHour(b))).toBe(b);
    }
  });
});

/* ---------------- AI 输出净化 ---------------- */

describe("AI 输出净化", () => {
  it("剥除 script 块、HTML 标签与外部链接", () => {
    const dirty =
      '正常段落。<script>alert("x")</script><b>加粗</b>详见 https://evil.example.com/x 与 www.bad.org';
    const clean = sanitizeModelOutput(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("<b>");
    expect(clean).not.toContain("https://evil.example.com");
    expect(clean).not.toContain("www.bad.org");
    expect(clean).toContain("[链接已过滤]");
    expect(clean).toContain("正常段落。");
    expect(clean).toContain("加粗");
  });

  it("超长输出截断到上限", () => {
    const long = "甲".repeat(AI_OUTPUT_MAX_CHARS + 500);
    expect(sanitizeModelOutput(long).length).toBeLessThanOrEqual(
      AI_OUTPUT_MAX_CHARS,
    );
  });
});

/* ---------------- 安全响应头与请求体限额 ---------------- */

describe("安全响应头", () => {
  it("healthz 携带 CSP / nosniff / Referrer-Policy / X-Frame-Options", async () => {
    const res = await app.request("http://localhost/healthz");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-security-policy")).toContain(
      "default-src 'self'",
    );
    expect(res.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(res.headers.get("x-frame-options")).toBe("DENY");
  });

  it("反馈接口请求体超 64KB → 413", async () => {
    const big = JSON.stringify({ json: { description: "x".repeat(70 * 1024) } });
    const res = await app.request("http://localhost/api/trpc/feedback.submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: big,
    });
    expect(res.status).toBe(413);
  });
});

/* ---------------- 反馈地理脱敏 ---------------- */

describe("反馈脱敏补齐（地点/经纬度）", () => {
  function guestCtx(): TrpcContext {
    return {
      req: new Request("http://localhost/trpc", {
        headers: { "x-forwarded-for": "203.0.113.9" },
      }),
      resHeaders: new Headers(),
    };
  }
  const base = {
    route: "/bazi",
    feature: "bug" as const,
    severity: "P2" as const,
    title: "排盘结果疑问",
    description: "某页面的显示与预期不一致。",
  };
  function feedbackInsertDb() {
    return {
      insert: () => ({ values: () => Promise.resolve([{ insertId: 1 }]) }),
    };
  }

  it("经纬度关键字 / 坐标对 / 出生地 一律拒收", async () => {
    resetFeedbackRateLimits();
    getDbMock.mockImplementation(feedbackInsertDb);
    const caller = appRouter.createCaller(guestCtx());
    await expect(
      caller.feedback.submit({ ...base, description: "经度: 116.40 的盘不对" }),
    ).rejects.toThrow(/生辰|出生/);
    await expect(
      caller.feedback.submit({
        ...base,
        description: "坐标 39.90420, 116.40740 排出来不对",
      }),
    ).rejects.toThrow(/生辰|出生/);
    await expect(
      caller.feedback.submit({ ...base, description: "出生地：北京市朝阳区" }),
    ).rejects.toThrow(/生辰|出生/);
  });
});

/* ---------------- 紫微统一输入模型 ---------------- */

describe("紫微统一输入", () => {
  function guestCtx(): TrpcContext {
    return {
      req: new Request("http://localhost/trpc"),
      resHeaders: new Headers(),
    };
  }
  const base = {
    calendar: "solar" as const,
    year: 1990,
    month: 3,
    day: 15,
    gender: "male" as const,
  };

  /** 剥离计算时间戳后比较（同一盘两次计算 calculatedAt 必然不同） */
  function stripTs(r: unknown): string {
    return JSON.stringify(r, (k, v) => (k === "calculatedAt" ? "<ts>" : v));
  }

  it("hour/minute 与 hourBranch 等效（14 时 = 未时）", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const byHour = await caller.ziwei.paipan({ ...base, hour: 14, minute: 30 });
    const byBranch = await caller.ziwei.paipan({ ...base, hourBranch: 7 });
    expect(stripTs(byHour.result)).toBe(stripTs(byBranch.result));
  });

  it("hour 与 hourBranch 同时提供时以 hour 为准", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const byHour = await caller.ziwei.paipan({ ...base, hour: 14 });
    const mixed = await caller.ziwei.paipan({ ...base, hour: 14, hourBranch: 3 });
    expect(stripTs(mixed.result)).toBe(stripTs(byHour.result));
  });

  it("缺 hour/hourBranch 且未声明 unknownHour → 400", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(caller.ziwei.paipan(base)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("unknownHour 显式声明后可排盘，warnings 标注时辰未知", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const res = await caller.ziwei.paipan({ ...base, unknownHour: true });
    const warnings = (res.result as { meta?: { warnings?: string[] } }).meta
      ?.warnings;
    expect(warnings?.some((w) => w.includes("时辰未知"))).toBe(true);
  });
});
