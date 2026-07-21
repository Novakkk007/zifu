import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
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
  ]).notNull(),
  title: varchar("title", { length: 255 }),
  /** 输入参数（生辰、问事等），JSON 字符串 */
  input: text("input").notNull(),
  /** 排盘结果，JSON 字符串 */
  result: text("result").notNull(),
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
  chartType: varchar("chartType", { length: 32 }).notNull(),
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
