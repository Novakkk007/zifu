import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@db/schema";
import type { BirthInput } from "@contracts/bazi-core";
import {
  crossCheck,
  overallTierOf,
  synthesizeHecan,
} from "@contracts/engines/hecan-core";
import type {
  HecanArtBlock,
  HecanEngineModule,
} from "@contracts/engines/hecan-core";
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

const input: BirthInput = {
  calendar: "solar",
  year: 1990,
  month: 3,
  day: 15,
  hour: 8,
  minute: 0,
  gender: "male",
  useTrueSolarTime: false,
  dayRollover: "zichu",
};

/** 构造一个协议引擎（与 bazi 结论同向或反向） */
function fakeEngine(mod: {
  wuxingFocus?: "木" | "火" | "土" | "金" | "水";
  mingGongBranch?: string;
  structureScore?: number;
}): HecanEngineModule {
  return {
    hecanSynthesize: () => ({
      keyPoints: ["假引擎要点（测试注入）"],
      wuxingFocus: mod.wuxingFocus ?? null,
      mingGongBranch: mod.mingGongBranch ?? null,
      structureScore: mod.structureScore ?? null,
      summary: "测试注入的引擎小结",
      precision: "approximate",
      ruleVariant: "测试流派",
    }),
  };
}

beforeEach(() => {
  getDbMock.mockReset();
});

describe("hecan-core 编排与互证", () => {
  it("ziwei/qizheng 引擎缺失 → unavailable 状态块，绝不伪造", async () => {
    const { report, warnings } = await synthesizeHecan(input, {
      loadEngine: async () => null,
    });
    const ziwei = report.arts.find((a) => a.art === "ziwei")!;
    const qizheng = report.arts.find((a) => a.art === "qizheng")!;
    expect(ziwei.precision).toBe("unavailable");
    expect(qizheng.precision).toBe("unavailable");
    // 不伪造：要点为空、无五行结论、无命宫、无结构分
    expect(ziwei.keyPoints).toHaveLength(0);
    expect(ziwei.wuxingFocus).toBeNull();
    expect(ziwei.mingGongBranch).toBeNull();
    expect(ziwei.structureScore).toBeNull();
    expect(ziwei.reason).toContain("ziwei-core");
    // 八字始终可用
    const bazi = report.arts.find((a) => a.art === "bazi")!;
    expect(bazi.precision).toBe("validated");
    expect(bazi.keyPoints.length).toBeGreaterThan(2);
    expect(report.availableArts).toBe(1);
    // 仅单术 → 所有互证均为孤证/证据不足，综合信度为铜
    expect(report.overallTier).toBe("single");
    expect(warnings.join()).toContain("紫微引擎不可用");
  });

  it("三术五行结论一致 → triple（金印）", async () => {
    const first = await synthesizeHecan(input, { loadEngine: async () => null });
    const focus = first.report.arts.find((a) => a.art === "bazi")!.wuxingFocus!;
    const gong = first.report.arts.find((a) => a.art === "bazi")!.mingGongBranch!;
    const score = first.report.arts.find((a) => a.art === "bazi")!.structureScore!;
    const { report } = await synthesizeHecan(input, {
      loadEngine: async () =>
        fakeEngine({ wuxingFocus: focus, mingGongBranch: gong, structureScore: score + 5 }),
    });
    expect(report.availableArts).toBe(3);
    const wuxingCheck = report.crossChecks.find((c) => c.topic === "五行结论一致性")!;
    expect(wuxingCheck.verdict).toBe("consistent");
    expect(wuxingCheck.tier).toBe("triple");
    expect(report.overallTier).toBe("triple");
  });

  it("两术一致、第三术缺席 → double（银）", async () => {
    const first = await synthesizeHecan(input, { loadEngine: async () => null });
    const focus = first.report.arts.find((a) => a.art === "bazi")!.wuxingFocus!;
    const { report } = await synthesizeHecan(input, {
      loadEngine: async (art) =>
        art === "ziwei" ? fakeEngine({ wuxingFocus: focus }) : null,
    });
    expect(report.availableArts).toBe(2);
    const wuxingCheck = report.crossChecks.find((c) => c.topic === "五行结论一致性")!;
    expect(wuxingCheck.verdict).toBe("consistent");
    expect(wuxingCheck.tier).toBe("double");
    expect(report.overallTier).toBe("double");
  });

  it("五行结论相悖 → divergent + 铜档存疑", async () => {
    const first = await synthesizeHecan(input, { loadEngine: async () => null });
    const focus = first.report.arts.find((a) => a.art === "bazi")!.wuxingFocus!;
    const other = (["金", "木", "水", "火", "土"] as const).find((w) => w !== focus)!;
    const { report } = await synthesizeHecan(input, {
      loadEngine: async () => fakeEngine({ wuxingFocus: other }),
    });
    const wuxingCheck = report.crossChecks.find((c) => c.topic === "五行结论一致性")!;
    expect(wuxingCheck.verdict).toBe("divergent");
    expect(wuxingCheck.tier).toBe("single");
    expect(wuxingCheck.text).toContain("并存待考");
  });

  it("crossCheck/overallTierOf 纯函数：consistent 才提档", () => {
    const arts: HecanArtBlock[] = [
      {
        art: "bazi",
        artName: "八字",
        precision: "validated",
        ruleVariant: "子平",
        keyPoints: [],
        wuxingFocus: "木",
        mingGongBranch: null,
        structureScore: 60,
        summary: "",
      },
    ];
    const checks = crossCheck(arts, null as never);
    // mingGong 检查需要 chart——这里只验证 overallTierOf 对 insufficient 不升级
    expect(overallTierOf(checks)).toBe("single");
  });
});

describe("hecan.analyze API", () => {
  it("返回 EngineResult 含每术 precision 状态（未登录不落库）", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const res = await caller.hecan.analyze({ ...input });
    expect(res.result.meta.engine).toBe("hecan");
    expect(res.result.data.arts).toHaveLength(3);
    const precisions = Object.fromEntries(res.result.data.arts.map((a) => [a.art, a.precision]));
    expect(precisions.bazi).toBe("validated");
    expect(precisions.ziwei).toBe("unavailable");
    expect(precisions.qizheng).toBe("unavailable");
    expect(res.result.data.overallTier).toBe("single");
    expect(res.chart.pillars.day.ganzhi).toBeTruthy();
    expect(res.persisted).toBe(false);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("登录后落库 chartType 'hecan'", async () => {
    const inserts: { values: unknown }[] = [];
    getDbMock.mockReturnValue({
      insert: () => ({
        values: (v: unknown) => {
          inserts.push({ values: v });
          return { $returningId: async () => [{ id: 21 }] };
        },
      }),
    });
    const authed = appRouter.createCaller(userCtx(9));
    const res = await authed.hecan.analyze({ ...input });
    expect(res.persisted).toBe(true);
    expect(res.chartId).toBe(21);
    const chartRow = inserts[0].values as { chartType: string; input: string };
    expect(chartRow.chartType).toBe("hecan");
    expect(JSON.parse(chartRow.input)).toMatchObject({ year: 1990 });
  });
});
