import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@db/schema";
import {
  computeDaliuren,
  STEM_PALACE,
  GENERALS,
} from "@contracts/engines/daliuren-core";
import { STEMS, BRANCHES } from "@contracts/bazi-core";
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

const at = (year: number, month: number, day: number, hour: number, minute = 0) => ({
  year, month, day, hour, minute,
});

beforeEach(() => {
  getDbMock.mockReset();
});

describe("月将：中气换将（真实节气）", () => {
  it("春分换将：2024-03-20 11:06:25 前为亥将登明，后为戌将河魁", () => {
    const before = computeDaliuren(at(2024, 3, 20, 10));
    const after = computeDaliuren(at(2024, 3, 20, 12));
    expect(before.data.yuejiang.branch).toBe("亥");
    expect(before.data.yuejiang.name).toBe("登明");
    expect(before.data.yuejiang.zhongqi).toBe("雨水");
    expect(after.data.yuejiang.branch).toBe("戌");
    expect(after.data.yuejiang.name).toBe("河魁");
    expect(after.data.yuejiang.zhongqi).toBe("春分");
    expect(after.data.yuejiang.zhongqiTime).toBe("2024-03-20 11:06:25");
  });

  it("冬至后丑将大吉、大寒后子将神后、夏至后未将小吉", () => {
    expect(computeDaliuren(at(2024, 1, 20, 12)).data.yuejiang.branch).toBe("丑"); // 冬至后
    expect(computeDaliuren(at(2024, 2, 10, 12)).data.yuejiang.branch).toBe("子"); // 大寒后
    expect(computeDaliuren(at(2024, 6, 21, 12)).data.yuejiang.branch).toBe("未"); // 夏至后
  });
});

describe("天地盘：月将加时支", () => {
  it("2024-03-21 12:00（午时，戌将）：戌将加午，天盘顺布", () => {
    const r = computeDaliuren(at(2024, 3, 21, 12));
    expect(r.data.dayGanzhi).toBe("甲申");
    expect(r.data.hourBranchIdx).toBe(6); // 午
    expect(r.data.yuejiang.branchIdx).toBe(10); // 戌
    expect(r.data.heaven).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3]);
    expect(r.data.heaven[6]).toBe(10); // 戌加于地盘午位
  });

  it("月将与时支相同为伏吟盘（天盘=地盘）", () => {
    const r = computeDaliuren(at(2024, 1, 1, 1)); // 丑将丑时
    expect(r.data.heaven).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe("四课：十干寄宫（全十干）", () => {
  // 2024-03-21 起连续十日：甲申、乙酉、丙戌、丁亥、戊子、己丑、庚寅、辛卯、壬辰、癸巳
  const cases = Array.from({ length: 10 }, (_, i) => ({ day: 21 + i, stemIdx: i % 10 }));
  it.each(cases)("日干 $stemIdx 第一课下神与寄宫正确", ({ day, stemIdx }) => {
    const r = computeDaliuren(at(2024, 3, day, 12));
    expect(r.data.dayStemIdx).toBe(stemIdx);
    const ke1 = r.data.lessons[0];
    expect(ke1.xia).toBe(STEMS[stemIdx]);
    expect(ke1.xiaIsStem).toBe(true);
    expect(ke1.xiaPos).toBe(STEM_PALACE[stemIdx]);
    // 第一课下神即寄宫口诀：甲寅乙辰丙戊巳丁己未庚申辛戌壬亥癸丑
    expect(`${ke1.xia}${BRANCHES[ke1.xiaPos]}`).toBe(
      `${STEMS[stemIdx]}${BRANCHES[STEM_PALACE[stemIdx]]}`,
    );
    // 干上神 = 天盘寄宫位上神；第二课 = 干上神之阳神
    expect(ke1.shangIdx).toBe(r.data.heaven[STEM_PALACE[stemIdx]]);
    expect(r.data.lessons[1].xiaPos).toBe(ke1.shangIdx);
    // 第三课下神 = 日支，第四课 = 支上神之阳神
    expect(r.data.lessons[2].xiaPos).toBe(r.data.dayBranchIdx);
    expect(r.data.lessons[3].xiaPos).toBe(r.data.lessons[2].shangIdx);
  });
});

describe("三传：九宗门 fixtures", () => {
  it("贼克·元首课：2024-01-01 07:00 甲子日辰时 → 午卯子", () => {
    const r = computeDaliuren(at(2024, 1, 1, 7));
    expect(r.data.dayGanzhi).toBe("甲子");
    expect(r.data.method.name).toBe("元首课");
    expect(r.data.method.gate).toBe("贼克");
    expect(r.data.method.condition).toContain("上克下");
    expect(r.data.chuan.map((c) => c.branch)).toEqual(["午", "卯", "子"]);
  });

  it("贼克·重审课：2024-01-01 09:00 甲子日巳时 → 戌午寅（下贼上）", () => {
    const r = computeDaliuren(at(2024, 1, 1, 9));
    expect(r.data.method.name).toBe("重审课");
    expect(r.data.method.condition).toContain("下贼上");
    expect(r.data.chuan.map((c) => c.branch)).toEqual(["戌", "午", "寅"]);
  });

  it("比用法：2024-01-01 03:00 甲子日寅时 → 重审课-比用，取与日干比和之子", () => {
    const r = computeDaliuren(at(2024, 1, 1, 3));
    expect(r.data.method.name).toBe("重审课-比用");
    expect(r.data.method.gate).toBe("比用");
    expect(r.data.method.condition).toContain("比用");
    expect(r.data.chuan.map((c) => c.branch)).toEqual(["子", "亥", "戌"]);
  });

  it("涉害法：2024-01-01 05:00 甲子日卯时 → 元首课-涉害，三传戌申午", () => {
    const r = computeDaliuren(at(2024, 1, 1, 5));
    expect(r.data.method.name).toBe("元首课-涉害");
    expect(r.data.method.gate).toBe("涉害");
    expect(r.data.method.condition).toContain("涉害");
    expect(r.data.chuan.map((c) => c.branch)).toEqual(["戌", "申", "午"]);
  });

  it("伏吟法：2024-01-01 01:00 甲子日丑时（丑将）→ 无克刚日取干上，刑传寅巳申", () => {
    const r = computeDaliuren(at(2024, 1, 1, 1));
    expect(r.data.method.name).toBe("伏吟课");
    expect(r.data.method.gate).toBe("伏吟");
    expect(r.data.method.condition).toContain("无克");
    expect(r.data.method.condition).toContain("刚日以干上神");
    expect(r.data.chuan.map((c) => c.branch)).toEqual(["寅", "巳", "申"]);
  });

  it("遥克法：2024-01-03 07:00 丙寅日辰时 → 蒿矢，亥遥克日干丙火", () => {
    const r = computeDaliuren(at(2024, 1, 3, 7));
    expect(r.data.method.name).toBe("遥克课-蒿矢");
    expect(r.data.method.gate).toBe("遥克");
    expect(r.data.chuan.map((c) => c.branch)).toEqual(["亥", "申", "巳"]);
  });

  it("别责法：2024-01-08 07:00 辛未日辰时 → 四课不备，柔日取支前三合", () => {
    const r = computeDaliuren(at(2024, 1, 8, 7));
    expect(r.data.method.name).toBe("别责课");
    expect(r.data.method.gate).toBe("别责");
    expect(r.data.chuan.map((c) => c.branch)).toEqual(["卯", "未", "未"]);
  });

  it("返吟法：2024-01-08 13:00 辛未日未时（丑将）→ 无依取驿马巳", () => {
    const r = computeDaliuren(at(2024, 1, 8, 13));
    expect(r.data.method.name).toBe("返吟课-无依");
    expect(r.data.method.gate).toBe("返吟");
    expect(r.data.chuan.map((c) => c.branch)).toEqual(["巳", "丑", "辰"]);
  });

  it("昴星法：2024-01-05 23:00 己巳日子时 → 柔日冬蛇掩目", () => {
    const r = computeDaliuren(at(2024, 1, 5, 23));
    expect(r.data.method.name).toBe("昴星课-冬蛇掩目");
    expect(r.data.method.gate).toBe("昴星");
    expect(r.data.chuan.map((c) => c.branch)).toEqual(["申", "申", "午"]);
  });
});

describe("三传：六亲与遁干", () => {
  it("2024-01-01 09:00 甲子日：初传戌为妻财、遁干戊（甲子旬）", () => {
    const r = computeDaliuren(at(2024, 1, 1, 9));
    const [chu, zhong, mo] = r.data.chuan;
    // 甲木日主：戌土为妻财、午火为子孙、寅木为兄弟
    expect(chu.liuqin).toBe("妻财");
    expect(zhong.liuqin).toBe("子孙");
    expect(mo.liuqin).toBe("兄弟");
    // 甲子旬：旬空戌亥；初传戌落空、午遁庚、寅遁丙
    expect(r.data.xunShou).toBe("甲子旬");
    expect(r.data.xunkong).toEqual(["戌", "亥"]);
    expect(chu.ganzhi).toBe("空戌");
    expect(chu.isXunkong).toBe(true);
    expect(zhong.ganzhi).toBe("庚午");
    expect(mo.ganzhi).toBe("丙寅");
  });

  it("旬空之传遁干为空（2024-06-21 06:00 丙辰日，甲寅旬子丑空）", () => {
    const r = computeDaliuren(at(2024, 6, 21, 6));
    expect(r.data.xunShou).toBe("甲寅旬");
    expect(r.data.xunkong).toEqual(["子", "丑"]);
    const zhong = r.data.chuan[1];
    expect(zhong.branch).toBe("丑");
    expect(zhong.isXunkong).toBe(true);
    expect(zhong.dunGan).toBe("空");
  });
});

describe("十二天将：贵人诀、昼夜分、顺逆布", () => {
  it("甲日昼占（午时）贵人在丑；甲日夜占（丑时）贵人在未", () => {
    const day = computeDaliuren(at(2024, 3, 21, 12));
    expect(day.data.guiren.isDay).toBe(true);
    expect(day.data.guiren.branch).toBe("丑");
    const night = computeDaliuren(at(2024, 1, 1, 1));
    expect(night.data.guiren.isDay).toBe(false);
    expect(night.data.guiren.branch).toBe("未");
  });

  it("贵人居天门（亥至辰）顺布，居地户（巳至戌）逆布", () => {
    // 2025-05-05 15:30 甲戌日申时：昼贵丑临地盘子位 → 天门顺布
    const shun = computeDaliuren(at(2025, 5, 5, 15, 30));
    expect(shun.data.guiren.position).toBe(0);
    expect(shun.data.guiren.direction).toBe("顺布");
    // 2024-03-21 12:00 甲申日午时：昼贵丑临地盘酉位 → 地户逆布
    const ni = computeDaliuren(at(2024, 3, 21, 12));
    expect(ni.data.guiren.position).toBe(9);
    expect(ni.data.guiren.direction).toBe("逆布");
  });

  it("壬癸兔蛇藏：壬日昼贵巳、夜贵卯；辛日昼贵午、夜贵寅", () => {
    // 2024-03-29 壬辰日午时（昼）
    const ren = computeDaliuren(at(2024, 3, 29, 12));
    expect(ren.data.dayGanzhi[0]).toBe("壬");
    expect(ren.data.guiren.branch).toBe("巳");
    // 2024-03-28 辛卯日亥时（夜）：辛逢马虎，夜贵寅
    const xin = computeDaliuren(at(2024, 3, 28, 22));
    expect(xin.data.dayGanzhi[0]).toBe("辛");
    expect(xin.data.guiren.branch).toBe("寅");
  });

  it("天将排列 invariant：十二将恰好各一位，贵人位于其所临地盘位", () => {
    for (const dt of [at(2024, 1, 1, 1), at(2024, 3, 21, 12), at(2024, 6, 21, 6), at(2025, 5, 5, 15, 30)]) {
      const r = computeDaliuren(dt);
      expect([...r.data.generals].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      expect(r.data.generals[r.data.guiren.position]).toBe(0); // 贵人
      // 顺布：下一地盘位为螣蛇；逆布：上一地盘位为螣蛇
      const next = r.data.guiren.direction === "顺布"
        ? (r.data.guiren.position + 1) % 12
        : (r.data.guiren.position + 11) % 12;
      expect(GENERALS[r.data.generals[next]]).toBe("螣蛇");
    }
  });
});

describe("确定性", () => {
  it("同一输入两次起课结果完全一致", () => {
    const a = computeDaliuren(at(2024, 3, 21, 12));
    const b = computeDaliuren(at(2024, 3, 21, 12));
    expect(a.data).toEqual(b.data);
    expect(a.meta.precision).toBe("validated");
    expect(a.meta.ruleVariant).toBe("大六壬-通行起课法");
    expect(a.meta.provenance.length).toBeGreaterThanOrEqual(6);
  });

  it("未给时区按东八区墙钟并给出警告；给 Asia/Shanghai 结果一致且无警告", () => {
    const noTz = computeDaliuren(at(2024, 3, 21, 12));
    expect(noTz.meta.warnings.length).toBe(1);
    const tz = computeDaliuren({ ...at(2024, 3, 21, 12), ianaTimezone: "Asia/Shanghai" });
    expect(tz.meta.warnings).toEqual([]);
    expect({ ...tz.data, input: noTz.data.input }).toEqual(noTz.data);
  });
});

describe("daliuren.qike API", () => {
  const caller = appRouter.createCaller(guestCtx());

  it("游客起课：返回 EngineResult 信封，不落库", async () => {
    const res = await caller.daliuren.qike({ datetime: at(2024, 1, 1, 1) });
    expect(res.result.meta.engine).toBe("daliuren");
    expect(res.result.meta.precision).toBe("validated");
    expect(res.result.meta.ruleVariant).toBe("大六壬-通行起课法");
    expect(res.result.data.method.name).toBe("伏吟课");
    expect(res.result.data.chuan.map((c) => c.branch)).toEqual(["寅", "巳", "申"]);
    expect(res.persisted).toBe(false);
    expect(res.chartId).toBeNull();
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("Zod 拦截非法月份与日期", async () => {
    await expect(
      caller.daliuren.qike({ datetime: at(2024, 13, 1, 12) }),
    ).rejects.toThrow();
    await expect(
      caller.daliuren.qike({ datetime: at(2024, 2, 30, 12) }),
    ).rejects.toThrow(/无效/);
  });

  it("登录用户起课自动落库（chartType=daliuren）并返回 chartId", async () => {
    const captured: Record<string, unknown>[] = [];
    getDbMock.mockReturnValue({
      insert: () => ({
        values: (v: Record<string, unknown>) => {
          captured.push(v);
          return { $returningId: async () => [{ id: 7 }] };
        },
      }),
    });
    const authed = appRouter.createCaller(userCtx(42));
    const res = await authed.daliuren.qike({
      datetime: at(2024, 1, 1, 1),
      question: "求财",
    });
    expect(res.persisted).toBe(true);
    expect(res.chartId).toBe(7);
    expect(captured[0].chartType).toBe("daliuren");
    expect(captured[0].rulesetVersion).toBe("1.0.0");
    expect(captured[1].chartId).toBe(7);
  });
});
