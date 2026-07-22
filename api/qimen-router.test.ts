import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@db/schema";
import { computeQimen, RING } from "@contracts/engines/qimen-core";
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

/* ------------------------------------------------------------------ */
/* 引擎：阴阳遁（真实节气时刻切换）                                       */
/* ------------------------------------------------------------------ */

describe("qimen-core 阴阳遁（真实节气时刻）", () => {
  it("冬至前（2024-12-21 17:00，交节 17:20:35 前）→ 阴遁·大雪", () => {
    const c = computeQimen({ datetime: "2024-12-21T17:00" }).data;
    expect(c.dun).toBe("阴遁");
    expect(c.jie).toBe("大雪");
  });

  it("冬至后（2024-12-21 17:30）→ 阳遁·冬至（同日跨节即切换）", () => {
    const c = computeQimen({ datetime: "2024-12-21T17:30" }).data;
    expect(c.dun).toBe("阳遁");
    expect(c.jie).toBe("冬至");
    expect(c.jieTime).toBe("2024-12-21 17:20:35");
  });

  it("夏至前（2024-06-21 04:00，交节 04:51 前）→ 阳遁·芒种", () => {
    const c = computeQimen({ datetime: "2024-06-21T04:00" }).data;
    expect(c.dun).toBe("阳遁");
    expect(c.jie).toBe("芒种");
  });

  it("夏至后（2024-06-21 05:30）→ 阴遁·夏至", () => {
    const c = computeQimen({ datetime: "2024-06-21T05:30" }).data;
    expect(c.dun).toBe("阴遁");
    expect(c.jie).toBe("夏至");
  });
});

/* ------------------------------------------------------------------ */
/* 引擎：拆补法三元局数 fixtures（已知日时 → 已知局数）                    */
/* ------------------------------------------------------------------ */

describe("qimen-core 拆补法三元局数", () => {
  const cases: Array<[string, string, number, string, string, string]> = [
    // [datetime, 遁, 局, 节气, 元, 符头]
    ["2024-12-21T17:30", "阳遁", 4, "冬至", "下元", "己未"], // 冬至一七四·下元四局
    ["2024-12-26T12:00", "阳遁", 1, "冬至", "上元", "甲子"], // 甲子日符头甲子→上元一局
    ["2024-12-31T12:00", "阳遁", 7, "冬至", "中元", "己巳"], // 己巳日符头巳→中元七局
    ["2024-08-08T10:00", "阴遁", 8, "立秋", "下元", "甲辰"], // 立秋二五八·下元八局
    ["2024-06-21T05:30", "阴遁", 3, "夏至", "中元", "甲寅"], // 夏至九三六·中元三局
  ];
  for (const [dt, dun, ju, jie, yuan, futou] of cases) {
    it(`${dt} → ${dun}${ju}局（${jie}${yuan}·符头${futou}）`, () => {
      const c = computeQimen({ datetime: dt }).data;
      expect(c.dun).toBe(dun);
      expect(c.ju).toBe(ju);
      expect(c.jie).toBe(jie);
      expect(c.yuan).toBe(yuan);
      expect(c.futou).toBe(futou);
    });
  }

  it("拆补特性：同一节气内符头换元即换局（冬至下元四局 → 上元一局）", () => {
    const a = computeQimen({ datetime: "2024-12-22T12:00" }).data; // 庚申日·己未符头下元
    const b = computeQimen({ datetime: "2024-12-26T12:00" }).data; // 甲子日·甲子符头上元
    expect(a.jie).toBe("冬至");
    expect(b.jie).toBe("冬至");
    expect(a.ju).toBe(4);
    expect(b.ju).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* 引擎：地盘三奇六仪 阳顺阴逆                                           */
/* ------------------------------------------------------------------ */

describe("qimen-core 地盘布法", () => {
  it("阳遁一局：戊一 己二 庚三 辛四 壬五 癸六 丁七 丙八 乙九（顺布）", () => {
    const c = computeQimen({ datetime: "2024-12-26T12:00" }).data; // 阳遁一局
    const expect1 = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
    for (let p = 1; p <= 9; p += 1) {
      expect(c.palaces[p - 1].diGan).toBe(expect1[p - 1]);
    }
  });

  it("阴遁一局：戊一 乙二 丙三 丁四 癸五 壬六 辛七 庚八 己九（逆布）", () => {
    const c = computeQimen({ datetime: "2024-12-21T17:00" }).data; // 阴遁一局
    // 逆布：戊起一宫，己九、庚八、辛七、壬六、癸五、丁四、丙三、乙二
    const expect1 = ["戊", "乙", "丙", "丁", "癸", "壬", "辛", "庚", "己"];
    for (let p = 1; p <= 9; p += 1) {
      expect(c.palaces[p - 1].diGan).toBe(expect1[p - 1]);
    }
  });
});

/* ------------------------------------------------------------------ */
/* 引擎：值符值使定位 fixtures                                          */
/* ------------------------------------------------------------------ */

describe("qimen-core 值符值使", () => {
  it("2024-12-21 18:00（阳四局·癸酉时·甲子旬）：值符天辅临离九，值使杜门临巽四", () => {
    const c = computeQimen({ datetime: "2024-12-21T18:00" }).data;
    expect(c.dayGZ).toBe("己未");
    expect(c.hourGZ).toBe("癸酉");
    expect(c.xunshou).toBe("甲子戊");
    expect(c.zhifuStar).toBe("天辅");
    expect(c.zhifuPalace).toBe(9);
    expect(c.zhishiDoor).toBe("杜");
    expect(c.zhishiPalace).toBe(4);
    // 天盘干：值符星携本宫地盘干加时干宫（戊临离九）
    expect(c.palaces[8].tianGan).toBe("戊");
    expect(c.palaces[8].star).toBe("天辅");
    // 神盘值符亦起离九
    expect(c.palaces[8].god).toBe("值符");
  });

  it("旬首遁仪落中五：天禽寄坤二宫行权（2024-06-21 04:00 阳三局·庚寅时·甲申旬）", () => {
    const c = computeQimen({ datetime: "2024-06-21T04:00" }).data;
    expect(c.xunshou).toBe("甲申庚");
    expect(c.zhifuStar).toBe("天禽"); // 遁仪庚落中五
    expect(c.zhifuOrigin).toBe(2); // 寄坤二宫
    expect(c.zhishiDoor).toBe("死"); // 坤二宫本门
  });

  it("晚子时（23:30）日柱子初换日：2024-12-21 23:30 → 庚申日丙子时", () => {
    const c = computeQimen({ datetime: "2024-12-21T23:30" }).data;
    expect(c.dayGZ).toBe("庚申");
    expect(c.hourGZ).toBe("丙子");
  });
});

/* ------------------------------------------------------------------ */
/* 引擎：结构不变量                                                      */
/* ------------------------------------------------------------------ */

describe("qimen-core 结构不变量", () => {
  const STAR_ORDER = ["天蓬", "天任", "天冲", "天辅", "天英", "天芮", "天柱", "天心"];
  const sample = [
    "2024-12-21T18:00",
    "2024-06-21T05:30",
    "2024-08-08T10:00",
    "2025-03-05T16:00",
    "2025-01-20T03:45",
  ];

  it("天盘九星沿外环保持蓬任冲辅英芮柱心环序（纯旋转）", () => {
    for (const dt of sample) {
      const c = computeQimen({ datetime: dt }).data;
      const seq = RING.map((p) => c.palaces[p - 1].star);
      // 环序必须是 STAR_ORDER 的一个循环移位
      const doubled = [...STAR_ORDER, ...STAR_ORDER];
      const start = doubled.indexOf(seq[0]);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(doubled.slice(start, start + 8)).toEqual(seq);
      // 天禽寄星始终随天芮同宫
      const ruiPalace = RING[seq.indexOf("天芮")];
      expect(c.palaces[ruiPalace - 1].starJi).toBe("天禽");
      // 中五无星
      expect(c.palaces[4].star).toBe("");
    }
  });

  it("八门各出现且仅出现一次，中五无门；八神唯一", () => {
    for (const dt of sample) {
      const c = computeQimen({ datetime: dt }).data;
      const doors = c.palaces.map((p) => p.door).filter(Boolean).sort();
      expect(doors).toEqual(["伤", "休", "杜", "开", "惊", "死", "生", "景"].sort());
      expect(c.palaces[4].door).toBe("");
      const gods = c.palaces.map((p) => p.god).filter(Boolean).sort();
      expect(new Set(gods).size).toBe(8);
      expect(c.palaces[4].god).toBe("");
    }
  });

  it("空亡取时柱旬空，马星按时支三合（癸酉时→戌亥空·乾六；酉→马在亥）", () => {
    const c = computeQimen({ datetime: "2024-12-21T18:00" }).data;
    expect(c.kongWang).toEqual(["戌", "亥"]);
    expect(c.palaces[5].isKongWang).toBe(true); // 乾六宫
    expect(c.maXingBranch).toBe("亥");
    expect(c.maXingPalace).toBe(6);
    expect(c.palaces[5].hasMaXing).toBe(true);
  });

  it("确定性：同一时刻两次起局结果完全一致", () => {
    const a = computeQimen({ datetime: "2024-12-21T18:00" });
    const b = computeQimen({ datetime: "2024-12-21T18:00" });
    expect(JSON.stringify(a.data)).toBe(JSON.stringify(b.data));
  });

  it("meta：validated 精度 + 拆补法流派 + 溯源齐全", () => {
    const r = computeQimen({ datetime: "2024-12-21T18:00" });
    expect(r.meta.engine).toBe("qimen");
    expect(r.meta.precision).toBe("validated");
    expect(r.meta.ruleVariant).toBe("时家奇门-拆补法(转盘)");
    expect(r.meta.provenance.length).toBeGreaterThanOrEqual(8);
  });

  it("带时区偏移的 ISO 时刻按绝对时刻解析（17:30+08:00 与本地 17:30 同局）", () => {
    const a = computeQimen({ datetime: "2024-12-21T17:30:00+08:00" }).data;
    const b = computeQimen({ datetime: "2024-12-21T17:30" }).data;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

/* ------------------------------------------------------------------ */
/* API：qimen.qiju                                                     */
/* ------------------------------------------------------------------ */

describe("qimen.qiju API", () => {
  it("游客起局：返回 EngineResult，不落库", async () => {
    const caller = appRouter.createCaller(guestCtx());
    const res = await caller.qimen.qiju({ datetime: "2024-12-21T18:00" });
    expect(res.result.meta.engine).toBe("qimen");
    expect(res.result.meta.precision).toBe("validated");
    expect(res.result.data.dun).toBe("阳遁");
    expect(res.result.data.ju).toBe(4);
    expect(res.result.data.palaces).toHaveLength(9);
    expect(res.persisted).toBe(false);
    expect(res.chartId).toBeNull();
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("非法时刻 → BAD_REQUEST", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(
      caller.qimen.qiju({ datetime: "not-a-date-at-all" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("登录用户起局自动落库（chartType qimen）并返回 chartId", async () => {
    const insertValues = vi.fn();
    getDbMock.mockReturnValue({
      insert: () => ({
        values: (v: unknown) => {
          insertValues(v);
          return { $returningId: async () => [{ id: 9 }] };
        },
      }),
    });
    const authed = appRouter.createCaller(userCtx(42));
    const res = await authed.qimen.qiju({
      datetime: "2024-12-21T18:00",
      question: "出行",
    });
    expect(res.persisted).toBe(true);
    expect(res.chartId).toBe(9);
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ chartType: "qimen", userId: 42 }),
    );
  });
});
