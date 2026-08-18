import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@db/schema";
import {
  LIUYAO_RULESET_VERSION,
  LIUYAO_RULE_VARIANT,
  castWithCoins,
  deriveHexagrams,
  findHexagramByLines,
  liuqinOf,
  liushenOf,
  palaceInfo,
  palaceOf,
  parseCoins,
  xunKongOf,
  type TossValue,
} from "@contracts/engines/liuyao-core";
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

/** 爻值 → 三枚铜钱（字=3 背=2）：和为 6/7/8/9 */
function coinsFor(tosses: TossValue[]): number[] {
  return tosses.flatMap((t) => {
    const threes = t - 6;
    return [2, 2, 2].map((v, i) => (i < threes ? 3 : v));
  });
}

/** 阴阳线（1 阳 0 阴，自下而上）→ 静爻六摇 */
function staticTosses(lines: number[]): TossValue[] {
  return lines.map((v) => (v === 1 ? 7 : 8)) as TossValue[];
}

/** 固定起卦时刻：2024-06-15 12:00 东八区（庚戌日 · 庚午月，寅卯空） */
const T_GENGXU = Date.parse("2024-06-15T04:00:00Z");
/** 2024-06-19 12:00 东八区（甲寅日，子丑空） */
const T_JIAYIN = Date.parse("2024-06-19T04:00:00Z");

beforeEach(() => {
  getDbMock.mockReset();
});

/* ---------------- 铜钱解析 ---------------- */

describe("parseCoins 校验", () => {
  it("18 枚 2/3 → 六爻数值（字三背二）", () => {
    expect(parseCoins(coinsFor([9, 7, 8, 6, 7, 8]))).toEqual([9, 7, 8, 6, 7, 8]);
    expect(parseCoins([2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 3, 3, 2, 3, 2, 3, 2, 3])).toEqual([
      6, 9, 7, 8, 7, 8,
    ]);
  });
  it("非 18 枚 / 面值非法 → 抛错", () => {
    expect(() => parseCoins([3, 3, 3])).toThrow(/18/);
    expect(() => parseCoins(Array(18).fill(1))).toThrow(/2（背）或 3（字）/);
    expect(() => parseCoins(Array(18).fill(4))).toThrow();
  });
});

/* ---------------- 6/7/8/9 → 卦推导 fixtures ---------------- */

describe("卦推导 fixtures（本卦/变卦/互卦）", () => {
  const fixtures: { name: string; lines: number[]; expectBen: string; gong: string; kind: string }[] = [
    { name: "地天泰", lines: [1, 1, 1, 0, 0, 0], expectBen: "地天泰", gong: "坤", kind: "三世" },
    { name: "火天大有", lines: [1, 1, 1, 1, 0, 1], expectBen: "火天大有", gong: "乾", kind: "归魂" },
    { name: "水火既济", lines: [1, 0, 1, 0, 1, 0], expectBen: "水火既济", gong: "坎", kind: "三世" },
    { name: "火水未济", lines: [0, 1, 0, 1, 0, 1], expectBen: "火水未济", gong: "离", kind: "三世" },
    { name: "乾为天", lines: [1, 1, 1, 1, 1, 1], expectBen: "乾为天", gong: "乾", kind: "本宫" },
    { name: "坤为地", lines: [0, 0, 0, 0, 0, 0], expectBen: "坤为地", gong: "坤", kind: "本宫" },
  ];
  for (const f of fixtures) {
    it(`${f.name}：静爻起卦 → 本卦/卦宫/卦次正确，六爻安静无变卦`, () => {
      const r = castWithCoins(coinsFor(staticTosses(f.lines)), { castAt: T_GENGXU });
      expect(r.data.benGua.name).toBe(f.expectBen);
      expect(r.data.gong).toBe(f.gong);
      expect(r.data.gongKind).toBe(f.kind);
      expect(r.data.bianGua).toBeNull();
      expect(r.data.movingIdx).toEqual([]);
      expect(r.meta.warnings).toContain("六爻安静，无动爻，不变卦");
    });
  }

  it("泰卦初九动 → 之地风升；互卦雷泽归妹", () => {
    const tosses: TossValue[] = [9, 7, 7, 8, 8, 8];
    const r = castWithCoins(coinsFor(tosses), { castAt: T_GENGXU });
    expect(r.data.benGua.name).toBe("地天泰");
    expect(r.data.bianGua?.name).toBe("地风升");
    expect(r.data.huGua.name).toBe("雷泽归妹");
    expect(r.data.movingIdx).toEqual([0]);
    // 变爻装配：泰初爻甲子 → 升初爻辛丑（宫土 → 兄弟）
    expect(r.data.yaos[0].moving).toBe(true);
    expect(r.data.yaos[0].ganzhi).toBe("甲子");
    expect(r.data.yaos[0].bian).toEqual({ ganzhi: "辛丑", wuxing: "土", liuqin: "兄弟" });
    expect(r.data.yaos[1].bian).toBeNull();
  });

  it("六爻皆动：乾（六个老阳）→ 之坤", () => {
    const r = castWithCoins(coinsFor([9, 9, 9, 9, 9, 9]), { castAt: T_GENGXU });
    expect(r.data.benGua.name).toBe("乾为天");
    expect(r.data.bianGua?.name).toBe("坤为地");
    expect(r.data.movingIdx).toEqual([0, 1, 2, 3, 4, 5]);
  });

  // P1#42 复现案（反馈「六爻变卦六亲疑似有误」核查结论）：
  // 变卦六亲一律「以本卦卦宫五行为我」配（野鹤老人《增删卜易》通行装卦法），
  // 与变卦自身卦宫无关。此处取 风泽中孚（艮宫土，游魂）动 0/2/5 爻 → 水风井，
  // 变卦纳支为 辛丑/辛酉/戊子（土/金/水），按艮宫土配 → 兄弟/子孙/妻财。
  // 若改用变卦自身卦宫（水风井=井宫属木）会得到不同六亲——此断言锁死通行法，防被大改。
  it("变卦六亲以本卦卦宫论：风泽中孚（艮宫土）动 0/2/5 → 水风井", () => {
    const r = castWithCoins(coinsFor([9, 7, 6, 8, 7, 9]), { castAt: T_GENGXU });
    expect(r.data.benGua.name).toBe("风泽中孚");
    expect(r.data.gong).toBe("艮");
    expect(r.data.gongWuxing).toBe("土");
    expect(r.data.gongKind).toBe("游魂");
    expect(r.data.movingIdx).toEqual([0, 2, 5]);
    expect(r.data.bianGua?.name).toBe("水风井");
    // 变卦同位爻纳甲 + 六亲（均按艮宫土）
    expect(r.data.yaos[0].bian).toEqual({ ganzhi: "辛丑", wuxing: "土", liuqin: "兄弟" });
    expect(r.data.yaos[2].bian).toEqual({ ganzhi: "辛酉", wuxing: "金", liuqin: "子孙" });
    expect(r.data.yaos[5].bian).toEqual({ ganzhi: "戊子", wuxing: "水", liuqin: "妻财" });
  });
});

/* ---------------- 纳甲 / 六亲 / 世应 spot-checks ---------------- */

describe("纳甲装卦", () => {
  it("乾宫·乾为天：干支、六亲（宫金）、世应（六世）", () => {
    const r = castWithCoins(coinsFor(staticTosses([1, 1, 1, 1, 1, 1])), { castAt: T_GENGXU });
    expect(r.data.yaos.map((y) => y.ganzhi)).toEqual([
      "甲子",
      "甲寅",
      "甲辰",
      "壬午",
      "壬申",
      "壬戌",
    ]);
    expect(r.data.yaos.map((y) => y.liuqin)).toEqual([
      "子孙",
      "妻财",
      "父母",
      "官鬼",
      "兄弟",
      "父母",
    ]);
    expect(r.data.shiIndex).toBe(5);
    expect(r.data.yingIndex).toBe(2);
    expect(r.data.yaos[5].mark).toBe("世");
    expect(r.data.yaos[2].mark).toBe("应");
    // 六亲俱全 → 无伏神
    expect(r.data.fuShen).toEqual([]);
  });

  it("坎宫·坎为水：内外坎纳戊，世应（本宫六世）", () => {
    const r = castWithCoins(coinsFor(staticTosses([0, 1, 0, 0, 1, 0])), { castAt: T_GENGXU });
    expect(r.data.benGua.name).toBe("坎为水");
    expect(r.data.yaos.map((y) => y.ganzhi)).toEqual([
      "戊寅",
      "戊辰",
      "戊午",
      "戊申",
      "戊戌",
      "戊子",
    ]);
    // 宫水：寅木子孙、辰土官鬼、午火妻财、申金父母、戌土官鬼、子水兄弟
    expect(r.data.yaos.map((y) => y.liuqin)).toEqual([
      "子孙",
      "官鬼",
      "妻财",
      "父母",
      "官鬼",
      "兄弟",
    ]);
  });

  it("坤宫·地天泰（三世卦）：世在三爻应在上爻，六亲依宫土", () => {
    const r = castWithCoins(coinsFor(staticTosses([1, 1, 1, 0, 0, 0])), { castAt: T_GENGXU });
    expect(r.data.shiIndex).toBe(2);
    expect(r.data.yingIndex).toBe(5);
    // 内乾三甲 + 外坤三乙；宫土：子水妻财、寅木官鬼、辰土兄弟、丑土兄弟、亥水妻财、酉金子孙
    expect(r.data.yaos.map((y) => y.ganzhi)).toEqual([
      "甲子",
      "甲寅",
      "甲辰",
      "乙丑",
      "乙亥",
      "乙酉",
    ]);
    expect(r.data.yaos.map((y) => y.liuqin)).toEqual([
      "妻财",
      "官鬼",
      "兄弟",
      "兄弟",
      "妻财",
      "子孙",
    ]);
  });

  it("乾宫·天山遁（二世）：缺子孙妻财 → 伏神自本宫纯卦取之", () => {
    const r = castWithCoins(coinsFor(staticTosses([0, 0, 1, 1, 1, 1])), { castAt: T_GENGXU });
    expect(r.data.benGua.name).toBe("天山遁");
    expect(r.data.gongKind).toBe("二世");
    expect(r.data.shiIndex).toBe(1);
    const present = new Set(r.data.yaos.map((y) => y.liuqin));
    expect(present.has("子孙")).toBe(false);
    expect(present.has("妻财")).toBe(false);
    expect(r.data.fuShen).toEqual([
      { pos: 0, liuqin: "子孙", ganzhi: "甲子", wuxing: "水", feiGanzhi: "丙辰" },
      { pos: 1, liuqin: "妻财", ganzhi: "甲寅", wuxing: "木", feiGanzhi: "丙午" },
    ]);
  });
});

/* ---------------- 六神 / 旬空 / 月建日辰 ---------------- */

describe("六神·旬空·月建日辰", () => {
  it("甲乙日起青龙：甲寅日六爻六神 青龙朱雀勾陈螣蛇白虎玄武", () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => liushenOf("甲", i))).toEqual([
      "青龙",
      "朱雀",
      "勾陈",
      "螣蛇",
      "白虎",
      "玄武",
    ]);
    const r = castWithCoins(coinsFor(staticTosses([1, 1, 1, 1, 1, 1])), { castAt: T_JIAYIN });
    expect(r.data.riChen).toBe("甲寅");
    expect(r.data.yaos.map((y) => y.liushen)).toEqual([
      "青龙",
      "朱雀",
      "勾陈",
      "螣蛇",
      "白虎",
      "玄武",
    ]);
  });

  it("庚辛日起白虎：庚戌日初爻白虎、上爻螣蛇", () => {
    const r = castWithCoins(coinsFor(staticTosses([1, 1, 1, 1, 1, 1])), { castAt: T_GENGXU });
    expect(r.data.riChen).toBe("庚戌");
    expect(r.data.yaos[0].liushen).toBe("白虎");
    expect(r.data.yaos[5].liushen).toBe("螣蛇");
    expect(r.data.yueJian).toBe("庚午");
  });

  it("旬空：甲子旬戌亥空 / 甲辰旬寅卯空 / 甲寅旬子丑空", () => {
    expect(xunKongOf("甲子")).toEqual(["戌", "亥"]);
    expect(xunKongOf("庚戌")).toEqual(["寅", "卯"]); // 庚戌属甲辰旬
    expect(xunKongOf("甲寅")).toEqual(["子", "丑"]);
    // 乾为天于庚戌日（寅卯空）：二爻甲寅旬空
    const r = castWithCoins(coinsFor(staticTosses([1, 1, 1, 1, 1, 1])), { castAt: T_GENGXU });
    expect(r.data.xunKong).toEqual(["寅", "卯"]);
    expect(r.data.yaos.map((y) => y.xunKong)).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it("六亲判定：同我兄弟/生我父母/我生子孙/克我官鬼/我克妻财", () => {
    expect(liuqinOf("金", "申")).toBe("兄弟");
    expect(liuqinOf("金", "辰")).toBe("父母");
    expect(liuqinOf("金", "子")).toBe("子孙");
    expect(liuqinOf("金", "午")).toBe("官鬼");
    expect(liuqinOf("金", "寅")).toBe("妻财");
  });

  it("卦宫还原：八宫各世代卦例", () => {
    // 天风姤（乾宫一世）/ 天山遁（二世）/ 天地否（三世）/ 风地观（四世）/ 山地剥（五世）/ 火地晋（游魂）/ 火天大有（归魂）
    expect(palaceOf([0, 1, 1, 1, 1, 1])).toBe("乾");
    expect(palaceInfo([0, 1, 1, 1, 1, 1]).kind).toBe("一世");
    expect(palaceInfo([0, 0, 1, 1, 1, 1]).kind).toBe("二世");
    expect(palaceInfo([0, 0, 0, 1, 1, 1]).kind).toBe("三世");
    expect(palaceInfo([0, 0, 0, 0, 1, 1]).kind).toBe("四世");
    expect(palaceInfo([0, 0, 0, 0, 0, 1]).kind).toBe("五世");
    expect(palaceInfo([0, 0, 0, 1, 0, 1])).toMatchObject({ kind: "游魂", shi: 3 });
    expect(palaceOf([0, 0, 0, 1, 0, 1])).toBe("乾");
    expect(palaceInfo([1, 1, 1, 1, 0, 1])).toMatchObject({ kind: "归魂", shi: 2 });
    expect(palaceOf([1, 1, 1, 1, 0, 1])).toBe("乾");
  });
});

/* ---------------- 不变量 / 确定性 / 信封 ---------------- */

describe("引擎不变量与信封", () => {
  it("64 种卦形全部可起，且一一映射到 64 个不同卦名", () => {
    const names = new Set<string>();
    for (let bits = 0; bits < 64; bits++) {
      const lines = [0, 1, 2, 3, 4, 5].map((i) => (bits >> i) & 1);
      const r = castWithCoins(coinsFor(staticTosses(lines)), { castAt: T_GENGXU });
      names.add(r.data.benGua.name);
      expect(r.data.yaos).toHaveLength(6);
      // 世应必相隔三爻
      expect((r.data.shiIndex + 3) % 6).toBe(r.data.yingIndex);
    }
    expect(names.size).toBe(64);
  });

  it("确定性：同 coins + castAt 结果完全一致", () => {
    const coins = coinsFor([9, 7, 8, 6, 7, 8]);
    const a = castWithCoins(coins, { castAt: T_GENGXU, question: "问事" });
    const b = castWithCoins(coins, { castAt: T_GENGXU, question: "问事" });
    expect(a.data).toEqual(b.data);
  });

  it("信封：precision=validated、流派、溯源分组齐全", () => {
    const r = castWithCoins(coinsFor(staticTosses([1, 1, 1, 1, 1, 1])), { castAt: T_GENGXU });
    expect(r.meta.engine).toBe("liuyao");
    expect(r.meta.precision).toBe("validated");
    expect(r.meta.ruleVariant).toBe(LIUYAO_RULE_VARIANT);
    expect(r.data.rulesetVersion).toBe(LIUYAO_RULESET_VERSION);
    const ruleIds = r.meta.provenance.map((p) => p.ruleId);
    for (const id of [
      "coin-yaozhi",
      "najia-zhuanggua",
      "shiying-bagong",
      "liuqin-gonggua",
      "liushen-rigan",
      "xunkong-yuejian",
      "guaci-yaoci",
    ]) {
      expect(ruleIds).toContain(id);
    }
    expect(r.data.benGua.gua).toContain("乾");
    expect(r.data.benGua.yao).toHaveLength(6);
  });

  it("deriveHexagrams 互卦取二三四 / 三四五爻", () => {
    const { hu } = deriveHexagrams([7, 7, 7, 8, 8, 8]); // 泰
    expect(hu.name).toBe("雷泽归妹");
    expect(findHexagramByLines([1, 1, 1, 1, 1, 1]).name).toBe("乾为天");
  });
});

/* ---------------- 路由：coinToss / cast / detail ---------------- */

describe("liuyao.coinToss（服务端 CSPRNG）", () => {
  it("返回 3 枚 2/3，value 为三枚之和", async () => {
    const caller = appRouter.createCaller(guestCtx());
    for (let i = 0; i < 50; i++) {
      const r = await caller.liuyao.coinToss({ tossIndex: (i % 6) + 1 });
      expect(r.coins).toHaveLength(3);
      for (const c of r.coins) expect([2, 3]).toContain(c);
      expect(r.value).toBe(r.coins[0] + r.coins[1] + r.coins[2]);
      expect([6, 7, 8, 9]).toContain(r.value);
      expect(r.source).toBe("server-csprng");
    }
  });

  it("tossIndex 越界被 Zod 拦截", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(caller.liuyao.coinToss({ tossIndex: 7 })).rejects.toThrow();
  });
});

describe("liuyao.cast", () => {
  const coins = coinsFor([9, 7, 7, 8, 8, 8]);

  it("游客起卦：返回完整 EngineResult，不落库", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const res = await caller.liuyao.cast({ coins, question: "问财运" });
    expect(res.result.meta.precision).toBe("validated");
    expect(res.result.data.benGua.name).toBe("地天泰");
    expect(res.result.data.bianGua?.name).toBe("地风升");
    expect(res.chartId).toBeNull();
    expect(res.persisted).toBe(false);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("非法铜钱 → BAD_REQUEST", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(caller.liuyao.cast({ coins: Array(18).fill(1) })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("登录用户落库；同 idempotencyKey 重复提交只落库一次", async () => {
    const insertFn = vi.fn(() => ({
      values: () => ({ $returningId: async () => [{ id: 7 }] }),
    }));
    const selectLimit = vi
      .fn()
      // 第一次 cast：无既有记录
      .mockResolvedValueOnce([])
      // 第二次 cast：命中既有记录
      .mockResolvedValueOnce([{ id: 7 }]);
    getDbMock.mockReturnValue({
      select: () => ({ from: () => ({ where: () => ({ limit: selectLimit }) }) }),
      insert: insertFn,
    });

    const caller = appRouter.createCaller(userCtx(42));
    const key = "liuyao-cast:test-key-1";
    const first = await caller.liuyao.cast({ coins, question: "问财运", idempotencyKey: key });
    expect(first.chartId).toBe(7);
    expect(first.persisted).toBe(true);
    // charts 一条 + chart_versions 一条
    expect(insertFn).toHaveBeenCalledTimes(2);

    const second = await caller.liuyao.cast({ coins, question: "问财运", idempotencyKey: key });
    expect(second.chartId).toBe(7);
    expect(second.persisted).toBe(true);
    // 幂等命中：未再 insert
    expect(insertFn).toHaveBeenCalledTimes(2);
  });
});

describe("liuyao.detail（归属校验）", () => {
  const storedRow = {
    id: 7,
    userId: 1,
    chartType: "liuyao",
    title: "六爻 · 乾为天",
    input: JSON.stringify({ coins: coinsFor([7, 7, 7, 7, 7, 7]), question: null, idempotencyKey: null }),
    result: JSON.stringify(castWithCoins(coinsFor([7, 7, 7, 7, 7, 7]), { castAt: T_GENGXU })),
    rulesetVersion: LIUYAO_RULESET_VERSION,
    algorithmVersion: "liuyao-core@1.0.0",
    createdAt: new Date(),
  };

  it("未登录 → UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(caller.liuyao.detail({ chartId: 7 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("他人卦例 → NOT_FOUND", async () => {
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [storedRow] }) }),
      }),
    });
    const caller = appRouter.createCaller(userCtx(2));
    await expect(caller.liuyao.detail({ chartId: 7 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("属主读取成功，result 还原为 EngineResult", async () => {
    getDbMock.mockReturnValue({
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [storedRow] }) }),
      }),
    });
    const caller = appRouter.createCaller(userCtx(1));
    const res = await caller.liuyao.detail({ chartId: 7 });
    expect(res.id).toBe(7);
    expect(res.result.data.benGua.name).toBe("乾为天");
    expect(res.result.meta.precision).toBe("validated");
  });
});
