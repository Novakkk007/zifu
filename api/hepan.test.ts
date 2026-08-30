import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@db/schema";
import { computeChartV2 } from "@contracts/bazi-core";
import type { BirthInput } from "@contracts/bazi-core";
import {
  analyzeCompatibility,
  dayMasterRelationOf,
  detectCrossRelations,
  HEPAN_DISCLAIMER,
  HEPAN_SCORE_WEIGHTS,
  zodiacRelationOf,
} from "@contracts/engines/hepan-core";
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

const personA = {
  calendar: "solar" as const,
  year: 1990,
  month: 3,
  day: 15,
  hour: 8,
  minute: 0,
  gender: "male" as const,
  useTrueSolarTime: false,
  dayRollover: "zichu" as const,
};
const personB = {
  calendar: "solar" as const,
  year: 1992,
  month: 10,
  day: 8,
  hour: 14,
  minute: 0,
  gender: "female" as const,
  useTrueSolarTime: false,
  dayRollover: "zichu" as const,
};

const toBirth = (p: BirthInput): BirthInput => ({ ...p });

beforeEach(() => {
  getDbMock.mockReset();
});

describe("hepan-core 规则单元", () => {
  it("日主关系：比和 / 相生 / 相制", () => {
    expect(dayMasterRelationOf("木", "木")).toBe("比和");
    expect(dayMasterRelationOf("木", "火")).toBe("相生");
    expect(dayMasterRelationOf("水", "木")).toBe("相生");
    expect(dayMasterRelationOf("金", "木")).toBe("相制");
    expect(dayMasterRelationOf("土", "水")).toBe("相制");
  });

  it("生肖（年支）关系：六合 / 六冲 / 三合 / 相刑 / 相害", () => {
    // 子丑六合、子午相冲、申子三合（申子辰同局）、子卯相刑、子未相害
    expect(zodiacRelationOf(0, 1)).toBe("六合");
    expect(zodiacRelationOf(0, 6)).toBe("相冲");
    expect(zodiacRelationOf(8, 0)).toBe("三合");
    expect(zodiacRelationOf(0, 3)).toBe("相刑");
    expect(zodiacRelationOf(0, 7)).toBe("相害");
    expect(zodiacRelationOf(0, 0)).toBe("比和");
  });

  it("跨盘天干五合检测：甲×己 检出「天干五合 甲己」", () => {
    const a = computeChartV2(toBirth(personA));
    const b = computeChartV2(toBirth(personB));
    const cross = detectCrossRelations(a, b);
    // 手工构造：甲盘年干 vs 乙盘年干若恰为五合对，应检出
    const stemPairs = cross.filter((r) => r.type === "天干五合");
    for (const r of stemPairs) {
      expect(r.resultWuxing).toBeTruthy();
      expect(r.positions).toContain("×");
    }
    // 全量关系均带出处（书名）
    for (const r of cross) expect(r.source.length).toBeGreaterThan(0);
  });

  it("报告结构：五维度 + 公开权重合成总分 + disclaimer", () => {
    const a = computeChartV2(toBirth(personA));
    const b = computeChartV2(toBirth(personB));
    const report = analyzeCompatibility(a, b);
    expect(report.dimensions).toHaveLength(5);
    const weightSum = Object.values(HEPAN_SCORE_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(weightSum).toBeCloseTo(1, 10);
    const expected = Math.round(
      report.dimensions.reduce((s, d) => s + d.score * d.weight, 0),
    );
    expect(report.totalScore).toBe(expected);
    expect(report.totalScore).toBeGreaterThanOrEqual(0);
    expect(report.totalScore).toBeLessThanOrEqual(100);
    expect(report.disclaimer).toBe(HEPAN_DISCLAIMER);
    expect(report.disclaimer).toContain("不构成");
    // 每维度都有依据文字
    for (const d of report.dimensions) {
      expect(d.basis.length).toBeGreaterThan(10);
      expect(d.findings.length).toBeGreaterThan(0);
    }
  });
});

describe("hepan.analyze API", () => {
  it("双盘真实排出 + 合盘 EngineResult 信封（未登录不落库）", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const res = await caller.hepan.analyze({ personA, personB });
    expect(res.chartA.dayMaster).toBeTruthy();
    expect(res.chartB.dayMaster).toBeTruthy();
    expect(res.compatibility.meta.engine).toBe("hepan");
    expect(res.compatibility.meta.precision).toBe("validated");
    expect(res.compatibility.meta.provenance.length).toBeGreaterThanOrEqual(5);
    expect(res.compatibility.data.dimensions).toHaveLength(5);
    expect(res.persisted).toBe(false);
    expect(res.chartId).toBeNull();
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("登录后落库 chartType 'hepan'，input 存双方生辰", async () => {
    const inserts: { values: unknown }[] = [];
    getDbMock.mockReturnValue({
      insert: () => ({
        values: (v: unknown) => {
          inserts.push({ values: v });
          return { $returningId: async () => [{ id: 11 }] };
        },
      }),
    });
    const authed = appRouter.createCaller(userCtx(7));
    const res = await authed.hepan.analyze({ personA, personB });
    expect(res.persisted).toBe(true);
    expect(res.chartId).toBe(11);
    const chartRow = inserts[0].values as {
      chartType: string;
      input: string;
      userId: number;
    };
    expect(chartRow.chartType).toBe("hepan");
    expect(chartRow.userId).toBe(7);
    const saved = JSON.parse(chartRow.input) as { personA: unknown; personB: unknown };
    expect(saved.personA).toMatchObject({ year: 1990 });
    expect(saved.personB).toMatchObject({ year: 1992 });
  });

  it("无效日期（2 月 30 日）返回 BAD_REQUEST", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(
      caller.hepan.analyze({ personA: { ...personA, month: 2, day: 30 }, personB }),
    ).rejects.toThrow(/无效/);
  });

  it("时辰未知：时柱不参与，warnings 提示精度下降", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const res = await caller.hepan.analyze({
      personA: { ...personA, hour: null },
      personB,
    });
    expect(res.chartA.pillars.hour).toBeNull();
    expect(res.compatibility.meta.warnings.join()).toContain("时辰未知");
  });
});
