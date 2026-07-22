/**
 * qizheng.paipan 黄金时刻 fixtures + 核心映射单测。
 *
 * 星历基准（astronomy-engine 实算，交叉验证 JPL Horizons 级）：
 * - 2000-01-01T00:00Z 太阳回归黄经 ≈ 279.86°（±0.5° 内锚定 280°）
 * - 2024-03-20T03:06Z 春分，太阳黄经 ≈ 0°
 * - 2003-08 火星大冲逆行期（黄经日速 < 0）；2003-02 为顺行期
 * - 罗睺（瞬时升交点）与 Meeus 平交点公式互洽（章动摆动幅度 < 2°）
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@db/schema";
import * as schema from "@db/schema";
import {
  QIZHENG_RULE_VARIANT,
  ayanamsaDeg,
  computeQizheng,
  mansionFromSidereal,
  moonAscendingNodeLongitude,
  tropicalLongitudeUtc,
  zodiacFromLongitude,
  ziqiLongitude,
  ZIQI_PERIOD_DAYS,
} from "@contracts/engines/qizheng-core";
import { appRouter } from "./router";
import type { TrpcContext } from "./context";

/** getDb 替身（vi.hoisted 保证在 vi.mock 工厂之前初始化） */
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

/** Meeus 平升交点公式（度）：Ω = 125.0445 − 1934.1363·T + 0.0020754·T² */
function meeusMeanNode(date: Date): number {
  const jd = date.getTime() / 86400_000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  return (((125.0445479 - 1934.1362891 * T + 0.0020754 * T * T) % 360) + 360) % 360;
}

describe("qizheng-core · 七政真实星历（黄金时刻）", () => {
  it("2000-01-01T00:00Z 太阳黄经 ≈ 280°（±0.5°）", () => {
    const lon = tropicalLongitudeUtc("sun", new Date("2000-01-01T00:00:00Z"));
    expect(Math.abs(lon - 280)).toBeLessThan(0.5);
  });

  it("2000-01-01T00:00Z 月亮黄经 ≈ 217.3°（±1°）", () => {
    const lon = tropicalLongitudeUtc("moon", new Date("2000-01-01T00:00:00Z"));
    expect(Math.abs(lon - 217.3)).toBeLessThan(1);
  });

  it("2024 春分（2024-03-20T03:07Z）太阳黄经 ≈ 0°（±0.05°）", () => {
    const lon = tropicalLongitudeUtc("sun", new Date("2024-03-20T03:07:00Z"));
    const dist = Math.min(lon, 360 - lon);
    expect(dist).toBeLessThan(0.05);
  });

  it("火星逆行检测：2003-08-15 逆行，2003-02-15 顺行", () => {
    const retro = computeQizheng({
      utcMs: Date.parse("2003-08-15T00:00:00Z"),
      hourBranch: 0,
    });
    const marsRetro = retro.data.stars.find((s) => s.name === "火")!;
    expect(marsRetro.retrograde).toBe(true);
    expect(marsRetro.dailyMotion).toBeLessThan(0);

    const pro = computeQizheng({
      utcMs: Date.parse("2003-02-15T00:00:00Z"),
      hourBranch: 0,
    });
    const marsPro = pro.data.stars.find((s) => s.name === "火")!;
    expect(marsPro.retrograde).toBe(false);
    expect(marsPro.dailyMotion).toBeGreaterThan(0);
  });

  it("罗睺 = 月球瞬时升交点：与 Meeus 平交点互洽（< 2°），计都对望", () => {
    for (const iso of ["2000-01-01T00:00:00Z", "2024-06-15T12:00:00Z"]) {
      const d = new Date(iso);
      const node = moonAscendingNodeLongitude(d);
      const diff = Math.abs(((node - meeusMeanNode(d) + 540) % 360) - 180);
      expect(diff).toBeLessThan(2); // 瞬时交点 vs 平交点（章动摆动 < 2°）
      const chart = computeQizheng({ utcMs: d.getTime(), hourBranch: 0 });
      const luo = chart.data.stars.find((s) => s.name === "罗睺")!;
      const ji = chart.data.stars.find((s) => s.name === "计都")!;
      expect(luo.longitude).toBeCloseTo(node, 3);
      const signed = ((ji.longitude - luo.longitude + 540) % 360) - 180;
      expect(180 - Math.abs(signed)).toBeLessThan(0.001); // 计都 = 罗睺 + 180°
      // 罗计长周期逆行：180 日跨度黄经净退行（≈ −9.5°，章动摆动 ±1.5° 被吸收）
      const later = moonAscendingNodeLongitude(new Date(d.getTime() + 180 * 86400_000));
      const drift = ((later - node + 540) % 360) - 180;
      expect(drift).toBeLessThan(-6);
      expect(drift).toBeGreaterThan(-12);
    }
  });

  it("紫气：传统推法匀速顺行（10226.78 日一周天，恒顺行）", () => {
    const d1 = new Date("2000-01-01T00:00:00Z");
    const d2 = new Date(d1.getTime() + ZIQI_PERIOD_DAYS * 86400_000);
    const diff = Math.abs(((ziqiLongitude(d2) - ziqiLongitude(d1) + 540) % 360) - 180);
    expect(diff).toBeLessThan(0.001); // 一周天后回到原黄经
    const chart = computeQizheng({ utcMs: d1.getTime(), hourBranch: 0 });
    const ziqi = chart.data.stars.find((s) => s.name === "紫气")!;
    expect(ziqi.retrograde).toBe(false);
    expect(ziqi.precision).toBe("approximate");
  });
});

describe("qizheng-core · 黄道宫 / 二十八宿映射（含边界）", () => {
  it("黄道十二宫边界：29.999° → 白羊，30.001° → 金牛；359.9° → 双鱼", () => {
    expect(zodiacFromLongitude(29.999).name).toBe("白羊宫");
    expect(zodiacFromLongitude(30.001).name).toBe("金牛宫");
    expect(zodiacFromLongitude(359.9).name).toBe("双鱼宫");
    expect(zodiacFromLongitude(0).name).toBe("白羊宫");
    // 恒星黄道指差
    expect(zodiacFromLongitude(30.001, 30.001).name).toBe("白羊宫");
  });

  it("二十八宿边界：角宿起 180°；斗宿区间锚定冬至", () => {
    const jiao = mansionFromSidereal(180);
    expect(jiao.name).toBe("角");
    expect(jiao.index).toBe(0);
    expect(jiao.degree).toBeCloseTo(0, 5);
    // 冬至点（2000-01-01 太阳恒星黄经 ≈ 256°）应入斗宿
    const sunSid = 279.859 - ayanamsaDeg(new Date("2000-01-01T00:00:00Z"));
    const m = mansionFromSidereal(sunSid);
    expect(m.name).toBe("斗");
    expect(m.index).toBe(7);
    // 宿度不越宿宽
    expect(m.degree).toBeGreaterThanOrEqual(0);
    expect(m.degree).toBeLessThan(m.width);
    // 28 宿全覆盖：相邻宿界无跳宿
    let prevIdx = -1;
    for (let v = 0; v < 360; v += 3) {
      const idx = mansionFromSidereal(180 + v).index;
      if (prevIdx >= 0 && idx !== prevIdx) expect(idx).toBe((prevIdx + 1) % 28);
      prevIdx = idx;
    }
  });

  it("命宫：太阳加时·日出卯时法（2000-01-01 00:30 UTC，子时）", () => {
    // 太阳 279.86° → 摩羯宫 → 太阳过宫在丑；子时生：丑 + (卯−子) = 辰宫
    const chart = computeQizheng({
      utcMs: Date.parse("2000-01-01T00:30:00Z"),
      hourBranch: 0,
    });
    expect(chart.data.minggong.branch).toBe("辰宫");
    expect(chart.data.minggong.zodiac).toBe("天秤宫");
    // 身宫对望：戌宫
    expect(chart.data.shengong.branch).toBe("戌宫");
    // 命主星 = 天秤宫主 = 金
    expect(chart.data.mingzhu).toBe("金");
  });

  it("确定性：同一输入两次计算 data 完全一致", () => {
    const input = { utcMs: Date.parse("1996-06-15T09:30:00Z"), hourBranch: 5 };
    const a = computeQizheng(input);
    const b = computeQizheng(input);
    expect(a.data).toEqual(b.data);
  });

  it("恒星黄道可选指差：siderealOffsetDeg 改变宫位与模式标注", () => {
    const base = computeQizheng({ utcMs: Date.parse("2000-01-01T00:00:00Z"), hourBranch: 0 });
    expect(base.data.zodiacMode).toBe("tropical");
    const sid = computeQizheng({
      utcMs: Date.parse("2000-01-01T00:00:00Z"),
      hourBranch: 0,
      siderealOffsetDeg: 24,
    });
    expect(sid.data.zodiacMode).toBe("sidereal");
    // 太阳 279.86° − 24° = 255.86° → 射手宫（index 8）
    expect(sid.data.stars[0].zodiac).toBe("射手宫");
    expect(base.data.stars[0].zodiac).toBe("摩羯宫");
  });
});

describe("qizheng.paipan API", () => {
  const caller = appRouter.createCaller(guestCtx());

  it("happy path：返回 EngineResult 信封（meta + 11 曜 + 命宫），游客不落库", async () => {
    const res = await caller.qizheng.paipan({ datetime: "2000-01-01T00:00:00Z" });
    expect(res.result.meta.engine).toBe("qizheng");
    expect(res.result.meta.ruleVariant).toBe(QIZHENG_RULE_VARIANT);
    expect(res.result.meta.precision).toBe("validated");
    expect(res.result.meta.provenance.length).toBeGreaterThanOrEqual(5);
    expect(res.result.meta.warnings.some((w) => w.includes("紫气"))).toBe(true);
    expect(res.result.data.stars).toHaveLength(11);
    // 黄金时刻断言：太阳 ≈ 280°
    const sun = res.result.data.stars[0];
    expect(sun.name).toBe("日");
    expect(Math.abs(sun.longitude - 280)).toBeLessThan(0.5);
    expect(res.persisted).toBe(false);
    expect(res.chartId).toBeNull();
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("ianaTimezone 墙钟换算：Asia/Shanghai 08:30 ≡ UTC 00:30", async () => {
    const a = await caller.qizheng.paipan({
      datetime: "2000-01-01T08:30",
      ianaTimezone: "Asia/Shanghai",
    });
    const b = await caller.qizheng.paipan({ datetime: "2000-01-01T00:30:00Z" });
    expect(a.result.data.datetimeUtc).toBe(b.result.data.datetimeUtc);
    expect(a.result.data.sunLongitude).toBeCloseTo(b.result.data.sunLongitude, 6);
    // 墙钟 08:30 → 辰时（07:00–08:59，index 4）
    expect(a.result.data.hourBranch).toBe(4);
  });

  it("非法输入 → BAD_REQUEST", async () => {
    await expect(caller.qizheng.paipan({ datetime: "not-a-date" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      caller.qizheng.paipan({ datetime: "1850-01-01T00:00:00Z" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("登录用户落库 chartType=qizheng 并写版本快照", async () => {
    const insertCharts = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ $returningId: vi.fn().mockResolvedValue([{ id: 77 }]) }),
    });
    const insertVersions = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    getDbMock.mockReturnValue({
      insert: vi.fn().mockImplementation((table: unknown) =>
        table === schema.charts ? insertCharts() : insertVersions(),
      ),
    });
    const authed = appRouter.createCaller(userCtx(9));
    const res = await authed.qizheng.paipan({ datetime: "1996-06-15T09:30:00Z", gender: "male" });
    expect(res.persisted).toBe(true);
    expect(res.chartId).toBe(77);
  });
});
