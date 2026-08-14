/**
 * 浏览器直跑适配层（src/engines/client.ts）↔ 服务端路由 等价性对拍。
 *
 * 静态托管下前端不再走 tRPC，改为浏览器直接调用同一 contracts 引擎。
 * 此处断言：同一输入下，client 适配层输出与路由真实输出（游客 ctx，
 * 不落库）在剥离 calculatedAt 时间戳后完全一致（项目既有 stripTs 惯例）。
 *
 * 覆盖：八字 / 紫微 / 大六壬（需求指定三引擎）+ 奇门 / 七政 / 六爻 /
 * 合盘 / 合参；另测 CSPRNG 抽签属性、useEngine 纯逻辑、AI 错误归一化。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./context";
import { appRouter } from "./router";
import {
  paipanBazi,
  paipanZiwei,
  qijuQimen,
  paipanQizheng,
  qikeDaliuren,
  castLiuyao,
  coinTossLiuyao,
  analyzeHepan,
  analyzeHecan,
  drawLingqian,
  randomInt,
} from "../src/engines/client";
import { invokeEngine } from "../src/hooks/useEngine";
import {
  AI_READING_UNAVAILABLE_TEXT,
  aiBackendUnavailableText,
  isBackendUnavailableError,
} from "../src/lib/ai-reading-error";

/** getDb 替身（与 qimen-router.test.ts 同法；游客 ctx 不落库，仅防 import 触库） */
const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock("./queries/connection", () => ({ getDb: getDbMock }));

function guestCtx(): TrpcContext {
  return { req: new Request("http://localhost/trpc"), resHeaders: new Headers() };
}

/** 剥离计算时间戳后比较（calculatedAt / 六爻 data.castAt 两次计算必然不同） */
function stripTs(r: unknown): string {
  return JSON.stringify(r, (k, v) => (k === "calculatedAt" || k === "castAt" ? "<ts>" : v));
}

beforeEach(() => {
  getDbMock.mockReset();
});

const BIRTH = {
  calendar: "solar" as const,
  year: 1990,
  month: 6,
  day: 15,
  hour: 10,
  minute: 30,
  gender: "male" as const,
  useTrueSolarTime: true,
  dayRollover: "zichu" as const,
};

/* ------------------------------------------------------------------ */
/* 需求指定三引擎：八字 / 紫微 / 大六壬                                     */
/* ------------------------------------------------------------------ */

describe("client 适配层 === 路由输出（游客，不落库）", () => {
  it("八字 bazi.paipan：chart 全等（剥时间戳），chartId/persisted 形态一致", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const viaRouter = await caller.bazi.paipan(BIRTH);
    const viaClient = paipanBazi(BIRTH);
    expect(stripTs(viaClient.chart)).toBe(stripTs(viaRouter.chart));
    expect(viaRouter.chartId).toBeNull();
    expect(viaClient.chartId).toBeNull();
    expect(viaClient.persisted).toBe(viaRouter.persisted);
  });

  it("紫微 ziwei.paipan：EngineResult 全等（hourBranch 与 hour 两路径）", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const base = { calendar: "solar" as const, year: 1995, month: 3, day: 20, gender: "female" as const };
    for (const time of [{ hourBranch: 7 }, { hour: 14, minute: 30 }]) {
      const viaRouter = await caller.ziwei.paipan({ ...base, ...time });
      const viaClient = paipanZiwei({ ...base, ...time });
      expect(stripTs(viaClient.result)).toBe(stripTs(viaRouter.result));
      expect(viaClient.chartId).toBeNull();
      expect(viaClient.persisted).toBe(viaRouter.persisted);
    }
  });

  it("紫微 unknownHour：warnings 标注一致", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const input = {
      calendar: "solar" as const,
      year: 1988,
      month: 1,
      day: 10,
      unknownHour: true,
      gender: "male" as const,
    };
    const viaRouter = await caller.ziwei.paipan(input);
    const viaClient = paipanZiwei(input);
    expect(stripTs(viaClient.result)).toBe(stripTs(viaRouter.result));
    expect(viaClient.result.meta.warnings).toContain("时辰未知：时柱按子时处理，结果仅供参考。");
  });

  it("大六壬 daliuren.qike：EngineResult 全等", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const input = {
      datetime: { year: 2024, month: 8, day: 8, hour: 10, minute: 0 },
      ianaTimezone: "Asia/Shanghai",
      question: "求财",
    };
    const viaRouter = await caller.daliuren.qike(input);
    const viaClient = qikeDaliuren(input);
    expect(stripTs(viaClient.result)).toBe(stripTs(viaRouter.result));
    expect(viaClient.chartId).toBeNull();
    expect(viaClient.persisted).toBe(viaRouter.persisted);
  });

  /* ---------------- 追加引擎：同口径对拍 ---------------- */

  it("奇门 qimen.qiju：EngineResult 全等", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const input = { datetime: "2024-12-26T12:00", ianaTimezone: "Asia/Shanghai", question: "出行" };
    const viaRouter = await caller.qimen.qiju(input);
    const viaClient = qijuQimen(input);
    expect(stripTs(viaClient.result)).toBe(stripTs(viaRouter.result));
    expect(viaClient.chartId).toBeNull();
  });

  it("七政 qizheng.paipan：EngineResult 全等", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const input = { datetime: "1996-06-15T08:30", ianaTimezone: "Asia/Shanghai", gender: "male" as const };
    const viaRouter = await caller.qizheng.paipan(input);
    const viaClient = paipanQizheng(input);
    expect(stripTs(viaClient.result)).toBe(stripTs(viaRouter.result));
    expect(viaClient.chartId).toBeNull();
  });

  it("六爻 liuyao.cast：固定铜钱序列装卦全等（月建日辰按同日）", async () => {
    const caller = appRouter.createCaller(guestCtx());
    // 18 枚铜钱：6 摇，含老阳/老阴动爻
    const coins = [3, 3, 3, 2, 2, 3, 2, 3, 2, 3, 2, 2, 3, 3, 2, 2, 2, 2];
    const input = { coins, question: "问事" };
    const viaRouter = await caller.liuyao.cast(input);
    const viaClient = castLiuyao(input);
    expect(stripTs(viaClient.result)).toBe(stripTs(viaRouter.result));
    expect(viaClient.chartId).toBeNull();
    expect(viaClient.persisted).toBe(viaRouter.persisted);
  });

  it("合盘 hepan.analyze：双盘 + compatibility 全等", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const personB = { ...BIRTH, year: 1992, month: 10, day: 8, hour: 22, gender: "female" as const };
    const input = { personA: BIRTH, personB };
    const viaRouter = await caller.hepan.analyze(input);
    const viaClient = analyzeHepan(input);
    expect(stripTs(viaClient.chartA)).toBe(stripTs(viaRouter.chartA));
    expect(stripTs(viaClient.chartB)).toBe(stripTs(viaRouter.chartB));
    expect(stripTs(viaClient.compatibility)).toBe(stripTs(viaRouter.compatibility));
    expect(viaClient.chartId).toBeNull();
  });

  it("合参 hecan.analyze：EngineResult + 八字盘全等", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const viaRouter = await caller.hecan.analyze(BIRTH);
    const viaClient = await analyzeHecan(BIRTH);
    expect(stripTs(viaClient.result)).toBe(stripTs(viaRouter.result));
    expect(stripTs(viaClient.chart)).toBe(stripTs(viaRouter.chart));
    expect(viaClient.chartId).toBeNull();
  });

  /* ---------------- 错误语义对拍 ---------------- */

  it("八字无效公历日期：客户端与服务端同文案", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const bad = { ...BIRTH, month: 2, day: 30 };
    await expect(caller.bazi.paipan(bad)).rejects.toMatchObject({
      message: "无效的日期，请检查年月日。",
    });
    expect(() => paipanBazi(bad)).toThrowError("无效的日期，请检查年月日。");
  });

  it("大六壬无效公历日期：客户端与服务端同文案", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const bad = { datetime: { year: 2024, month: 2, day: 31, hour: 8, minute: 0 } };
    await expect(caller.daliuren.qike(bad)).rejects.toMatchObject({
      message: "无效的日期，请检查年月日。",
    });
    expect(() => qikeDaliuren(bad)).toThrowError("无效的日期，请检查年月日。");
  });
});

/* ------------------------------------------------------------------ */
/* CSPRNG 抽签（浏览器 crypto.getRandomValues）                            */
/* ------------------------------------------------------------------ */

describe("浏览器 CSPRNG 抽签", () => {
  it("coinToss：3 枚铜钱 2/3，value 6–9，faces 与 coins 一致", () => {
    for (let i = 1; i <= 6; i++) {
      const r = coinTossLiuyao({ tossIndex: i });
      expect(r.tossIndex).toBe(i);
      expect(r.coins).toHaveLength(3);
      for (const c of r.coins) expect([2, 3]).toContain(c);
      expect(r.value).toBe(r.coins[0] + r.coins[1] + r.coins[2]);
      expect(r.value).toBeGreaterThanOrEqual(6);
      expect(r.value).toBeLessThanOrEqual(9);
      expect(r.faces).toEqual(r.coins.map((c) => (c === 3 ? "zi" : "bei")));
      expect(r.source).toBe("client-csprng");
    }
  });

  it("randomInt：拒绝采样，区间边界正确", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(randomInt(1, 101));
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...seen)).toBeLessThanOrEqual(100);
    // 2000 次抽样应近乎全覆盖 1..100
    expect(seen.size).toBeGreaterThan(95);
  });

  it("灵签：同 idempotencyKey 复放（localStorage 幂等），不重复随机", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
      setItem: (k: string, v: string) => void store.set(k, v),
    });
    try {
      const first = drawLingqian({ idempotencyKey: "guest-2025-01-01" });
      const second = drawLingqian({ idempotencyKey: "guest-2025-01-01" });
      expect(first.result.data.signNo).toBeGreaterThanOrEqual(1);
      expect(first.result.data.signNo).toBeLessThanOrEqual(100);
      expect(first.result.data.idempotentReplay).toBe(false);
      expect(second.result.data.signNo).toBe(first.result.data.signNo);
      expect(second.result.data.idempotentReplay).toBe(true);
      // 与签文库一致：sign 即第 signNo 首（索引 no-1）
      expect(second.result.data.sign).toEqual(first.result.data.sign);
      expect(first.result.meta.warnings.length).toBeGreaterThan(0);
      expect(first.chartId).toBeNull();
      // 不同键独立抽签
      const other = drawLingqian({ idempotencyKey: "guest-2025-01-02" });
      expect(other.result.data.idempotentReplay).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("灵签：localStorage 不可用（node 环境无此全局）退化为每次新抽，不崩溃", () => {
    const r = drawLingqian({ idempotencyKey: "no-storage-key" });
    expect(r.result.data.signNo).toBeGreaterThanOrEqual(1);
    expect(r.result.data.idempotentReplay).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* useEngine 纯逻辑（invokeEngine）                                       */
/* ------------------------------------------------------------------ */

describe("useEngine 纯逻辑 invokeEngine", () => {
  it("同步引擎：返回数据", async () => {
    await expect(invokeEngine((v: number) => v * 2, 21)).resolves.toBe(42);
  });

  it("异步引擎：返回数据", async () => {
    await expect(invokeEngine(async (v: string) => `hi ${v}`, "zifu")).resolves.toBe("hi zifu");
  });

  it("引擎抛 Error：原样透传", async () => {
    await expect(
      invokeEngine(() => {
        throw new Error("无法解析的出生时间：boom");
      }, undefined),
    ).rejects.toThrowError("无法解析的出生时间：boom");
  });

  it("引擎抛非 Error：归一化为 Error", async () => {
    await expect(
      invokeEngine(() => {
        throw "raw-string";
      }, undefined),
    ).rejects.toBeInstanceOf(Error);
  });
});

/* ------------------------------------------------------------------ */
/* AI 参详错误归一化（静态托管兜底）                                       */
/* ------------------------------------------------------------------ */

describe("AI 参详错误归一化", () => {
  it("Safari JSON 解析错（pattern）→ 兜底文案", () => {
    const err = new Error("The string did not match the expected pattern.");
    expect(isBackendUnavailableError(err)).toBe(true);
    expect(aiBackendUnavailableText(err)).toBe(AI_READING_UNAVAILABLE_TEXT);
  });

  it("404 HTML 当 JSON 解析 / fetch 失败 → 兜底文案", () => {
    expect(isBackendUnavailableError(new Error("Unexpected token '<', \"<html>\"... is not valid JSON"))).toBe(true);
    expect(isBackendUnavailableError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isBackendUnavailableError(new TypeError("Load failed"))).toBe(true);
  });

  it("服务端业务错误（带 data.code）→ 不兜底，走原有分型", () => {
    const err = Object.assign(new Error("额度不足"), { data: { code: "FORBIDDEN" } });
    expect(isBackendUnavailableError(err)).toBe(false);
    expect(aiBackendUnavailableText(err)).toBeNull();
  });

  it("其他错误 → 不兜底", () => {
    expect(isBackendUnavailableError(new Error("参详失败"))).toBe(false);
    expect(isBackendUnavailableError(null)).toBe(false);
  });
});
