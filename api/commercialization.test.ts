/**
 * v6 商业化 + AI 加固测试（hermetic）：
 * - vi.mock connection，用内存假 DB（按 drizzle SQL chunk 解析 where 条件）
 * - generateReading 以 vi.mock 替换，不触网
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// 计费测试需要「支付/AI 计费可开启」的环境语义：
// env.ts 对 preview/development 强制 fail-closed，故本文件以 production 环境运行。
// vi.hoisted 保证在所有 import（含 env.ts 求值）之前生效。
vi.hoisted(() => {
  process.env.APP_ENV = "production";
});

import type { User } from "@db/schema";
import * as schema from "@db/schema";
import { appRouter } from "./router";
import type { TrpcContext } from "./context";
import { resetAiRateLimits } from "./ai-router";
import { SIGNUP_GRANT_AMOUNT } from "./queries/wallets";
import { applyTransaction, getOrCreateWallet } from "./queries/wallets";
import { createOrder, processPaymentEvent } from "./queries/orders";

/* ---------------- generateReading mock ---------------- */

const { generateReadingMock } = vi.hoisted(() => ({
  generateReadingMock: vi.fn(),
}));
vi.mock("./services/ai", async (importOriginal) => {
  const orig = await importOriginal<typeof import("./services/ai")>();
  return { ...orig, generateReading: generateReadingMock };
});

/* ---------------- 内存假 DB ---------------- */

type Row = Record<string, unknown>;

type TableKey =
  | "users"
  | "charts"
  | "chartVersions"
  | "feedback"
  | "oauthStates"
  | "sessions"
  | "aiReadings"
  | "wallets"
  | "walletTransactions"
  | "orders"
  | "paymentEvents"
  | "auditLogs";

const TABLE_MAP: Record<TableKey, unknown> = {
  users: schema.users,
  charts: schema.charts,
  chartVersions: schema.chartVersions,
  aiReadings: schema.aiReadings,
  wallets: schema.wallets,
  walletTransactions: schema.walletTransactions,
  orders: schema.orders,
  paymentEvents: schema.paymentEvents,
  auditLogs: schema.auditLogs,
  feedback: schema.feedback,
  oauthStates: schema.oauthStates,
  sessions: schema.sessions,
};

interface Filter {
  name: string;
  op: string;
  value?: unknown;
  values?: unknown[];
}

function isColumnChunk(c: unknown): c is { name: string } {
  return (
    !!c &&
    typeof c === "object" &&
    typeof (c as { name?: unknown }).name === "string" &&
    (c as object).constructor.name.startsWith("MySql")
  );
}

function collectParams(node: unknown, out: unknown[]): void {
  if (Array.isArray(node)) {
    node.forEach((n) => collectParams(n, out));
    return;
  }
  const chunk = node as {
    queryChunks?: unknown[];
    constructor: { name: string };
    value?: unknown;
  };
  if (chunk?.constructor?.name === "Param") {
    out.push(chunk.value);
    return;
  }
  if (chunk?.queryChunks) chunk.queryChunks.forEach((c) => collectParams(c, out));
}

/** 从 drizzle where 条件中提取 (列, 操作符, 值) 列表（支持 eq / gte / inArray / and） */
function extractFilters(cond: unknown, out: Filter[] = []): Filter[] {
  const node = cond as { queryChunks?: unknown[] };
  if (!node?.queryChunks) return out;
  const chunks = node.queryChunks as {
    value?: unknown;
    constructor: { name: string };
  }[];
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i] as Record<string, unknown> & {
      constructor: { name: string };
    };
    if (isColumnChunk(c)) {
      const op = String((chunks[i + 1] as { value?: unknown })?.value ?? "").trim();
      const valChunk = chunks[i + 2];
      if (op === "in") {
        const values: unknown[] = [];
        collectParams(valChunk, values);
        out.push({ name: c.name, op, values });
      } else {
        out.push({
          name: c.name,
          op,
          value: (valChunk as { value?: unknown })?.value,
        });
      }
      i += 2;
    } else if ((c as { queryChunks?: unknown[] })?.queryChunks) {
      extractFilters(c, out);
    }
  }
  return out;
}

function matchRow(row: Row, cond: unknown): boolean {
  return extractFilters(cond).every((f) => {
    const v = row[f.name];
    if (f.op === "=") return v === f.value;
    if (f.op === "in") return (f.values ?? []).includes(v);
    if (f.op === ">=") return (v as Date | number) >= (f.value as Date | number);
    throw new Error(`fake db: unsupported op ${f.op}`);
  });
}

function createFakeDb(seed?: Partial<Record<TableKey, Row[]>>) {
  const tables = {} as Record<TableKey, Row[]>;
  (Object.keys(TABLE_MAP) as TableKey[]).forEach((k) => {
    tables[k] = (seed?.[k] ?? []).map((r) => ({ ...r }));
  });
  const deleteLog: { table: TableKey; count: number }[] = [];
  let autoId = 1000;

  function keyOf(t: unknown): TableKey {
    for (const k of Object.keys(TABLE_MAP) as TableKey[]) {
      if (TABLE_MAP[k] === t) return k;
    }
    throw new Error("fake db: unknown table");
  }

  const UNIQUE_KEYS: Partial<Record<TableKey, string[]>> = {
    wallets: ["userId"],
    walletTransactions: ["idempotencyKey"],
    orders: ["orderNo", "idempotencyKey"],
    paymentEvents: ["eventId"],
  };

  function doInsert(key: TableKey, v: Row): Row {
    for (const uk of UNIQUE_KEYS[key] ?? []) {
      if (
        v[uk] !== undefined &&
        v[uk] !== null &&
        tables[key].some((r) => r[uk] === v[uk])
      ) {
        throw new Error(`Duplicate entry for key ${uk}`);
      }
    }
    const row: Row = { createdAt: new Date(), ...v };
    if (row.id === undefined) row.id = autoId++;
    tables[key].push(row);
    return row;
  }

  function project(rows: Row[], cols?: Record<string, unknown>): unknown[] {
    if (!cols) return rows;
    // 聚合计数：select({ n: sql`count(*)` })
    const n = cols.n as { queryChunks?: unknown[] } | undefined;
    if (n?.queryChunks) return [{ n: rows.length }];
    return rows.map((r) => {
      const out: Row = {};
      for (const [alias, col] of Object.entries(cols)) {
        const name = (col as { name?: string })?.name ?? alias;
        out[alias] = r[name];
      }
      return out;
    });
  }

  const db = {
    select: (cols?: Record<string, unknown>) => ({
      from: (t: unknown) => {
        const key = keyOf(t);
        const makeWhere = (cond: unknown) => {
          const rows = () => tables[key].filter((r) => matchRow(r, cond));
          return {
            limit: async (n: number) => project(rows().slice(0, n), cols),
            orderBy: () => ({
              limit: async (n: number) => project(rows().slice(0, n), cols),
            }),
            then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
              Promise.resolve(project(rows(), cols)).then(res, rej),
          };
        };
        return {
          where: makeWhere,
          orderBy: () => ({
            limit: async (n: number) => project(tables[key].slice(0, n), cols),
          }),
        };
      },
    }),
    insert: (t: unknown) => ({
      values: (v: Row) => {
        let row: Row | null = null;
        const exec = () => {
          if (!row) row = doInsert(keyOf(t), v);
          return row;
        };
        return {
          $returningId: async () => [{ id: exec().id }],
          then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
            Promise.resolve()
              .then(() => exec())
              .then(res, rej),
        };
      },
    }),
    update: (t: unknown) => ({
      set: (v: Row) => ({
        where: (cond: unknown) => {
          const key = keyOf(t);
          // SQL 片段 set（如 balance = balance + delta）：提取数值参数做算术
          const applySet = (r: Row) => {
            for (const [col, val] of Object.entries(v)) {
              const sqlFrag = val as { queryChunks?: unknown[] } | null;
              if (sqlFrag && typeof sqlFrag === "object" && Array.isArray(sqlFrag.queryChunks)) {
                const delta = (sqlFrag.queryChunks as unknown[]).find(
                  (c) => typeof c === "number",
                ) as number | undefined;
                r[col] = Number(r[col] ?? 0) + (delta ?? 0);
              } else {
                r[col] = val;
              }
            }
          };
          let affected = 0;
          tables[key].forEach((r) => {
            if (matchRow(r, cond)) {
              applySet(r);
              affected++;
            }
          });
          return {
            then: (res: (v: unknown) => unknown) =>
              Promise.resolve([{ affectedRows: affected }]).then(res),
          };
        },
      }),
    }),
    delete: (t: unknown) => ({
      where: (cond: unknown) => {
        const key = keyOf(t);
        const before = tables[key].length;
        tables[key] = tables[key].filter((r) => !matchRow(r, cond));
        deleteLog.push({ table: key, count: before - tables[key].length });
        return {
          then: (res: (v: unknown) => unknown) =>
            Promise.resolve(undefined).then(res),
        };
      },
    }),
  } as unknown as Record<string, unknown> & {
    transaction: (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
  };
  // 事务透传：tx 即假 db 本身（内存假库无并发，单线程语义天然一致）
  (db as { transaction: unknown }).transaction = async (
    fn: (tx: unknown) => Promise<unknown>,
  ) => fn(db);

  return { db, tables, deleteLog };
}

/* ---------------- connection mock（每用例注入假 DB） ---------------- */

let fake: ReturnType<typeof createFakeDb>;
vi.mock("./queries/connection", () => ({
  getDb: () => fake.db,
}));

/* ---------------- 上下文 ---------------- */

function guestCtx(): TrpcContext {
  return { req: new Request("http://localhost/trpc"), resHeaders: new Headers() };
}
function userCtx(id: number, role: "user" | "admin" = "user"): TrpcContext {
  return {
    req: new Request("http://localhost/trpc"),
    resHeaders: new Headers(),
    user: { id, role } as User,
  };
}

const solarInput = {
  calendar: "solar" as const,
  year: 2000,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
  gender: "male" as const,
  useTrueSolarTime: false,
  dayRollover: "zichu" as const,
};

function seedChart(userId: number, id = 1): Row {
  const caller = appRouter.createCaller(guestCtx());
  void caller; // chart JSON 直接由 computeChartV2 生成过于笨重，这里用最小可用结构
  return {
    id,
    userId,
    chartType: "bazi",
    title: "八字排盘",
    input: JSON.stringify(solarInput),
    result: JSON.stringify(MINIMAL_CHART),
    rulesetVersion: "1.4.0",
    algorithmVersion: "computeChartV2@1",
    createdAt: new Date(),
  };
}

/** chartSummaryForAi 所需的最小命盘结构 */
const MINIMAL_CHART = {
  rulesetVersion: "1.4.0",
  pillars: {
    year: { label: "年柱", ganzhi: "己卯" },
    month: { label: "月柱", ganzhi: "丙子" },
    day: { label: "日柱", ganzhi: "戊午" },
    hour: { label: "时柱", ganzhi: "戊午" },
  },
  dayMaster: "戊",
  dayMasterWuxing: "土",
  wuxing: {
    count: { 金: 1, 木: 1, 水: 1, 火: 2, 土: 3 },
    missing: [],
    strength: {
      grade: "偏强",
      total: 62,
      deling: 20,
      dedi: 22,
      deshi: 20,
    },
  },
  yongshen: { yongshen: "金", xishen: ["水"], jishen: ["火"] },
  shensha: [],
};

beforeEach(() => {
  fake = createFakeDb();
  generateReadingMock.mockReset();
  resetAiRateLimits();
});

/* ---------------- 钱包 ---------------- */

describe("钱包流水幂等", () => {
  it("同一幂等键重复记账只应用一次，余额正确", async () => {
    const first = await applyTransaction({
      userId: 1,
      changeAmount: 10,
      reason: "recharge",
      idempotencyKey: "recharge-key-001",
    });
    expect(first.applied).toBe(true);
    expect(first.wallet.balanceLingqian).toBe(10);

    const second = await applyTransaction({
      userId: 1,
      changeAmount: 10,
      reason: "recharge",
      idempotencyKey: "recharge-key-001",
    });
    expect(second.applied).toBe(false);
    expect(fake.tables.walletTransactions).toHaveLength(1);
    expect(fake.tables.wallets.at(0)?.balanceLingqian).toBe(10);
  });

  it("注册赠送只发一次（signup-grant:{userId} 幂等）", async () => {
    const w1 = await getOrCreateWallet(9, { withSignupGrant: true });
    expect(w1.balanceLingqian).toBe(SIGNUP_GRANT_AMOUNT);
    const w2 = await getOrCreateWallet(9, { withSignupGrant: true });
    expect(w2.balanceLingqian).toBe(SIGNUP_GRANT_AMOUNT);
    const grants = fake.tables.walletTransactions.filter(
      (t) => t.reason === "grant",
    );
    expect(grants).toHaveLength(1);
    expect(grants.at(0)?.idempotencyKey).toBe("signup-grant:9");
  });
});

/* ---------------- AI 参详加固 ---------------- */

const liveResult = {
  text: "live 解读",
  source: "live" as const,
  model: "gpt-4o-mini",
  promptTokens: 10,
  completionTokens: 20,
  latencyMs: 5,
};

function readingInput(chartId: number, key: string) {
  return {
    chartId,
    persona: "scholar" as const,
    depth: "pro" as const,
    idempotencyKey: key,
  };
}

describe("ai.reading 加固", () => {
  it("游客访问 → UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(
      caller.ai.reading(readingInput(1, "guest-key-0001")),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("他人命盘 → NOT_FOUND", async () => {
    fake = createFakeDb({ charts: [seedChart(1, 1)] });
    const userB = appRouter.createCaller(userCtx(2));
    await expect(
      userB.ai.reading(readingInput(1, "user-b-key-001")),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(generateReadingMock).not.toHaveBeenCalled();
  });

  it("超过每日配额（20 次）→ TOO_MANY_REQUESTS", async () => {
    const readings = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      userId: 1,
      chartId: 1,
      chartType: "bazi",
      persona: "scholar",
      depth: "pro",
      source: "live",
      createdAt: new Date(),
    }));
    fake = createFakeDb({ charts: [seedChart(1, 1)], aiReadings: readings });
    const caller = appRouter.createCaller(userCtx(1));
    await expect(
      caller.ai.reading(readingInput(1, "quota-key-0001")),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(generateReadingMock).not.toHaveBeenCalled();
  });

  it("AI 失败 → 不扣费（无钱包流水）", async () => {
    fake = createFakeDb({ charts: [seedChart(1, 1)] });
    generateReadingMock.mockRejectedValue(
      new (await import("./services/ai")).AiServiceError("上游不可用"),
    );
    const caller = appRouter.createCaller(userCtx(1));
    await expect(
      caller.ai.reading(readingInput(1, "fail-key-00001")),
    ).rejects.toMatchObject({ code: "BAD_GATEWAY" });
    expect(fake.tables.walletTransactions).toHaveLength(0);
    expect(fake.tables.wallets).toHaveLength(0);
  });

  it("live 成功 → 恰好扣 1 灵签；同一幂等键重放不再扣", async () => {
    fake = createFakeDb({ charts: [seedChart(1, 1)] });
    generateReadingMock.mockResolvedValue(liveResult);
    const caller = appRouter.createCaller(userCtx(1));

    const r1 = await caller.ai.reading(readingInput(1, "live-key-00001"));
    expect(r1.source).toBe("live");
    expect(fake.tables.wallets.at(0)?.balanceLingqian).toBe(
      SIGNUP_GRANT_AMOUNT - 1,
    );

    const r2 = await caller.ai.reading(readingInput(1, "live-key-00001"));
    expect(r2.source).toBe("live");
    const consumes = fake.tables.walletTransactions.filter(
      (t) => t.reason === "consume",
    );
    expect(consumes).toHaveLength(1);
    expect(consumes.at(0)?.changeAmount).toBe(-1);
    expect(fake.tables.wallets.at(0)?.balanceLingqian).toBe(
      SIGNUP_GRANT_AMOUNT - 1,
    );
    // 注册赠送只发一次
    expect(
      fake.tables.walletTransactions.filter((t) => t.reason === "grant"),
    ).toHaveLength(1);
    // 日志只记 chartId/chartType 等元信息
    const log = fake.tables.aiReadings.at(0);
    expect(log?.chartId).toBe(1);
    expect(log?.chartType).toBe("bazi");
    expect(log?.rulesetVersion).toBe("1.4.0");
    expect(JSON.stringify(log)).not.toContain("2000");
  });

  it("fallback 成功 → 免费（无流水）", async () => {
    fake = createFakeDb({ charts: [seedChart(1, 1)] });
    generateReadingMock.mockResolvedValue({
      ...liveResult,
      source: "fallback",
      model: null,
      promptTokens: null,
      completionTokens: null,
    });
    const caller = appRouter.createCaller(userCtx(1));
    const res = await caller.ai.reading(readingInput(1, "fallback-key-01"));
    expect(res.source).toBe("fallback");
    expect(fake.tables.walletTransactions).toHaveLength(0);
  });
});

/* ---------------- 支付回调幂等 ---------------- */

describe("支付回调幂等", () => {
  it("同一 eventId 重复回调 → 仅一条 payment_event，订单只入账一次", async () => {
    const order = await createOrder({
      userId: 1,
      amountFen: 1000,
      lingqianAmount: 100,
      idempotencyKey: "order-key-00001",
    });
    expect(order.status).toBe("created");

    const evt = {
      orderNo: order.orderNo,
      eventId: "evt-0001",
      status: "paid" as const,
      payload: "{}",
      verified: true, // 渠道验签通过才会驱动状态机（V9 fail-closed）
    };
    const first = await processPaymentEvent(evt);
    expect(first.applied).toBe(true);
    expect(first.order.status).toBe("paid");

    const second = await processPaymentEvent(evt);
    expect(second.applied).toBe(false);
    expect(fake.tables.paymentEvents).toHaveLength(1);
    // 订单只入账一次
    const recharges = fake.tables.walletTransactions.filter(
      (t) => t.reason === "recharge",
    );
    expect(recharges).toHaveLength(1);
    expect(fake.tables.wallets.at(0)?.balanceLingqian).toBe(100);
  });

  it("未验签事件（verified 缺省/false）→ 只落事件存档，订单不转 paid、钱包不入账", async () => {
    const order = await createOrder({
      userId: 1,
      amountFen: 1000,
      lingqianAmount: 100,
      idempotencyKey: "order-key-unverified",
    });
    // 缺省 verified（fail-closed 默认 false）
    const r1 = await processPaymentEvent({
      orderNo: order.orderNo,
      eventId: "evt-unverified-1",
      status: "paid",
      payload: "{}",
    });
    expect(r1.order.status).toBe("created");
    expect(r1.event.verified).toBe(false);
    // 显式 false
    const r2 = await processPaymentEvent({
      orderNo: order.orderNo,
      eventId: "evt-unverified-2",
      status: "paid",
      payload: "{}",
      verified: false,
    });
    expect(r2.order.status).toBe("created");
    // 两条事件均落库，钱包零入账
    expect(fake.tables.paymentEvents).toHaveLength(2);
    expect(
      fake.tables.walletTransactions.filter((t) => t.reason === "recharge"),
    ).toHaveLength(0);
  });

  it("createOrder 幂等：同一 idempotencyKey 返回既有订单", async () => {
    const o1 = await createOrder({
      userId: 1,
      amountFen: 500,
      lingqianAmount: 50,
      idempotencyKey: "order-key-dup01",
    });
    const o2 = await createOrder({
      userId: 1,
      amountFen: 500,
      lingqianAmount: 50,
      idempotencyKey: "order-key-dup01",
    });
    expect(o2.orderNo).toBe(o1.orderNo);
    expect(fake.tables.orders).toHaveLength(1);
  });

  it("billing.simulateCallback 需要管理员", async () => {
    const caller = appRouter.createCaller(userCtx(1));
    await expect(
      caller.billing.simulateCallback({
        orderNo: "X1",
        eventId: "e1",
        status: "paid",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

/* ---------------- 命盘版本 / 重算 ---------------- */

describe("命盘版本与重算", () => {
  it("paipan 落库时写入 chart_versions 快照与新列", async () => {
    const caller = appRouter.createCaller(userCtx(42));
    const res = await caller.bazi.paipan(solarInput);
    expect(res.persisted).toBe(true);
    const chartRow = fake.tables.charts.at(0);
    expect(chartRow?.rulesetVersion).toBe("1.4.0");
    expect(chartRow?.algorithmVersion).toBe("computeChartV2@1");
    expect(fake.tables.chartVersions).toHaveLength(1);
    const v = fake.tables.chartVersions.at(0);
    expect(v?.chartId).toBe(res.chartId);
    expect(v?.rulesetVersion).toBe("1.4.0");
    expect(JSON.parse(v?.inputSnapshot as string)).toMatchObject({
      year: 2000,
    });
  });

  it("recompute：他人命盘 → NOT_FOUND，不写版本", async () => {
    fake = createFakeDb({ charts: [seedChart(1, 1)] });
    const userB = appRouter.createCaller(userCtx(2));
    await expect(userB.bazi.recompute({ chartId: 1 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(fake.tables.chartVersions).toHaveLength(0);
  });

  it("recompute：属主重算成功并写入新版本快照", async () => {
    fake = createFakeDb({ charts: [seedChart(1, 1)] });
    const owner = appRouter.createCaller(userCtx(1));
    const res = await owner.bazi.recompute({ chartId: 1 });
    expect(res.chartId).toBe(1);
    expect(res.chart.pillars.day.ganzhi).toBe("戊午");
    expect(fake.tables.chartVersions).toHaveLength(1);
    expect(fake.tables.chartVersions.at(0)?.chartId).toBe(1);
    // charts 主表结果同步更新
    expect(
      JSON.parse(fake.tables.charts.at(0)?.result as string).pillars.day
        .ganzhi,
    ).toBe("戊午");
  });
});

/* ---------------- 账户删除 ---------------- */

describe("account.deleteAccount", () => {
  it("清除本人全部数据，不影响他人，写审计日志并清会话 Cookie", async () => {
    fake = createFakeDb({
      users: [
        { id: 1, unionId: "u1" },
        { id: 2, unionId: "u2" },
      ],
      charts: [seedChart(1, 1), seedChart(2, 2)],
      chartVersions: [
        { id: 1, chartId: 1, inputSnapshot: "{}", resultSnapshot: "{}" },
        { id: 2, chartId: 2, inputSnapshot: "{}", resultSnapshot: "{}" },
      ],
      aiReadings: [
        {
          id: 1,
          userId: 1,
          chartType: "bazi",
          persona: "scholar",
          depth: "pro",
          source: "live",
        },
        {
          id: 2,
          userId: 2,
          chartType: "bazi",
          persona: "scholar",
          depth: "pro",
          source: "live",
        },
      ],
      wallets: [
        { id: 1, userId: 1, balanceLingqian: 5 },
        { id: 2, userId: 2, balanceLingqian: 7 },
      ],
      walletTransactions: [
        {
          id: 1,
          userId: 1,
          walletId: 1,
          changeAmount: 5,
          balanceAfter: 5,
          reason: "grant",
          idempotencyKey: "k1",
        },
        {
          id: 2,
          userId: 2,
          walletId: 2,
          changeAmount: 7,
          balanceAfter: 7,
          reason: "grant",
          idempotencyKey: "k2",
        },
      ],
      orders: [
        {
          id: 1,
          userId: 1,
          orderNo: "O1",
          amountFen: 100,
          lingqianAmount: 10,
          status: "created",
          idempotencyKey: "ok1",
        },
        {
          id: 2,
          userId: 2,
          orderNo: "O2",
          amountFen: 100,
          lingqianAmount: 10,
          status: "created",
          idempotencyKey: "ok2",
        },
      ],
      paymentEvents: [
        { id: 1, orderId: 1, eventId: "e1", status: "paid", verified: true },
        { id: 2, orderId: 2, eventId: "e2", status: "paid", verified: true },
      ],
    });

    const ctx = userCtx(1);
    const caller = appRouter.createCaller(ctx);
    const res = await caller.account.deleteAccount();
    expect(res.success).toBe(true);

    // 本人数据全清
    expect(fake.tables.charts.filter((c) => c.userId === 1)).toHaveLength(0);
    expect(fake.tables.chartVersions.filter((v) => v.chartId === 1)).toHaveLength(0);
    expect(fake.tables.aiReadings.filter((r) => r.userId === 1)).toHaveLength(0);
    expect(fake.tables.wallets.filter((w) => w.userId === 1)).toHaveLength(0);
    expect(fake.tables.walletTransactions.filter((t) => t.userId === 1)).toHaveLength(0);
    expect(fake.tables.orders.filter((o) => o.userId === 1)).toHaveLength(0);
    expect(fake.tables.paymentEvents.filter((e) => e.orderId === 1)).toHaveLength(0);
    expect(fake.tables.users.filter((u) => u.id === 1)).toHaveLength(0);

    // 他人数据保留
    expect(fake.tables.charts.filter((c) => c.userId === 2)).toHaveLength(1);
    expect(fake.tables.users.filter((u) => u.id === 2)).toHaveLength(1);
    expect(fake.tables.orders.filter((o) => o.userId === 2)).toHaveLength(1);

    // 审计日志
    const audit = fake.tables.auditLogs.at(0);
    expect(audit?.action).toBe("account.delete");
    expect(audit?.userId).toBe(1);

    // 会话 Cookie 已清除
    const setCookie = ctx.resHeaders.get("set-cookie") ?? "";
    expect(setCookie).toContain("kimi_sid=");
    expect(setCookie.toLowerCase()).toContain("max-age=0");
  });

  it("游客调用 → UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(guestCtx());
    await expect(caller.account.deleteAccount()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
