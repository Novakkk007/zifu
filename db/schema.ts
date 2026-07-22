import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 排盘记录 — 用户每次排盘（八字/合盘/六爻/紫微等）落库，可按用户回溯历史。
 */
export const charts = mysqlTable("charts", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  chartType: mysqlEnum("chartType", [
    "bazi",
    "hepan",
    "liuyao",
    "ziwei",
    "qizheng",
    "qimen",
    "daliuren",
    "hecan",
    "draw",
  ]).notNull(),
  title: varchar("title", { length: 255 }),
  /** 输入参数（生辰、问事等），JSON 字符串 */
  input: text("input").notNull(),
  /** 排盘结果，JSON 字符串 */
  result: text("result").notNull(),
  /** 排盘规则版本（写入时取自 chart.rulesetVersion，可回溯） */
  rulesetVersion: varchar("rulesetVersion", { length: 32 }),
  /** 算法引擎版本（写入时取自排盘引擎标识） */
  algorithmVersion: varchar("algorithmVersion", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Chart = typeof charts.$inferSelect;
export type InsertChart = typeof charts.$inferInsert;

/**
 * AI 参详调用日志 — 记录每次 AI 解读的消耗与来源（真实模型 / 降级模板），
 * 为后续灵签计费与审计提供依据。
 */
export const aiReadings = mysqlTable("ai_readings", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  /** 关联命盘 ID（仅作溯源，不记录出生输入） */
  chartId: bigint("chartId", { mode: "number", unsigned: true }),
  chartType: varchar("chartType", { length: 32 }).notNull(),
  /** 排盘规则版本（自命盘透传，可空） */
  rulesetVersion: varchar("rulesetVersion", { length: 32 }),
  persona: varchar("persona", { length: 16 }).notNull(),
  depth: varchar("depth", { length: 16 }).notNull(),
  /** live = 真实模型返回；fallback = 无密钥时的降级模板 */
  source: mysqlEnum("source", ["live", "fallback"]).notNull(),
  model: varchar("model", { length: 64 }),
  promptTokens: int("promptTokens"),
  completionTokens: int("completionTokens"),
  latencyMs: int("latencyMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiReading = typeof aiReadings.$inferSelect;
export type InsertAiReading = typeof aiReadings.$inferInsert;

/**
 * 命盘版本 — 每次排盘 / 重算（recompute）均写入一条版本快照，
 * 记录算法 / 规则版本与输入输出快照，保证结果可追溯、可重放。
 */
export const chartVersions = mysqlTable("chart_versions", {
  id: serial("id").primaryKey(),
  chartId: bigint("chartId", { mode: "number", unsigned: true }).notNull(),
  rulesetVersion: varchar("rulesetVersion", { length: 32 }),
  algorithmVersion: varchar("algorithmVersion", { length: 32 }),
  /** 输入快照，JSON 字符串 */
  inputSnapshot: text("inputSnapshot").notNull(),
  /** 结果快照，JSON 字符串 */
  resultSnapshot: text("resultSnapshot").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChartVersion = typeof chartVersions.$inferSelect;
export type InsertChartVersion = typeof chartVersions.$inferInsert;

/**
 * 灵签钱包 — 每用户一条，balanceLingqian 为当前灵签余额。
 */
export const wallets = mysqlTable("wallets", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  balanceLingqian: int("balanceLingqian").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

/**
 * 钱包流水 — 所有余额变动必须落一条流水；idempotencyKey 全局唯一，
 * 同一键重复提交只应用一次（返回既有流水）。
 */
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  walletId: bigint("walletId", { mode: "number", unsigned: true }).notNull(),
  /** 变动金额，正为入账、负为出账 */
  changeAmount: int("changeAmount").notNull(),
  /** 变动后余额 */
  balanceAfter: int("balanceAfter").notNull(),
  reason: mysqlEnum("reason", [
    "recharge",
    "consume",
    "refund",
    "adjust",
    "grant",
  ]).notNull(),
  /** 关联业务类型（如 ai_reading / order） */
  refType: varchar("refType", { length: 32 }),
  /** 关联业务 ID */
  refId: varchar("refId", { length: 64 }),
  idempotencyKey: varchar("idempotencyKey", { length: 64 })
    .notNull()
    .unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

/**
 * 充值订单 — 支付渠道预留：当前仅落单，不接入真实支付渠道，
 * 支付结果以 payment_events 回调（幂等）驱动状态机。
 */
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  orderNo: varchar("orderNo", { length: 32 }).notNull().unique(),
  /** 订单金额（分） */
  amountFen: int("amountFen").notNull(),
  /** 到账灵签数 */
  lingqianAmount: int("lingqianAmount").notNull(),
  status: mysqlEnum("status", [
    "created",
    "paid",
    "failed",
    "refunded",
    "cancelled",
  ])
    .default("created")
    .notNull(),
  /** 支付渠道（预留字段，当前无真实渠道） */
  channel: varchar("channel", { length: 32 }),
  idempotencyKey: varchar("idempotencyKey", { length: 64 })
    .notNull()
    .unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * 支付回调事件 — eventId 全局唯一实现回调幂等；重复回调只记录一次。
 */
export const paymentEvents = mysqlTable("payment_events", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  /** 回调幂等键（支付渠道事件 ID） */
  eventId: varchar("eventId", { length: 64 }).notNull().unique(),
  /** 原始回调报文 */
  payload: text("payload"),
  /** 签名校验是否通过 */
  verified: boolean("verified").default(false).notNull(),
  /** 事件状态（如 paid / failed / refunded） */
  status: varchar("status", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaymentEvent = typeof paymentEvents.$inferSelect;
export type InsertPaymentEvent = typeof paymentEvents.$inferInsert;

/**
 * 审计日志 — 记录敏感操作（账户删除、后台操作等），userId 可空（系统动作）。
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  action: varchar("action", { length: 64 }).notNull(),
  targetType: varchar("targetType", { length: 32 }),
  targetId: varchar("targetId", { length: 64 }),
  /** 附加信息，JSON 字符串（不得含敏感原始输入） */
  meta: text("meta"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// TODO: Add your tables here. See docs/Database.md for schema examples and patterns.
//
// Example:
// export const posts = mysqlTable("posts", {
//   id: serial("id").primaryKey(),
//   title: varchar("title", { length: 255 }).notNull(),
//   content: text("content"),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });
//
// Note: FK columns referencing a serial() PK must use:
//   bigint("columnName", { mode: "number", unsigned: true }).notNull()
