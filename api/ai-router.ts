import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, sql } from "drizzle-orm";
import * as schema from "@db/schema";
import type { BaziChartV2 } from "@contracts/bazi-core";
import { getDb } from "./queries/connection";
import { env } from "./lib/env";
import { createRouter, authedQuery } from "./middleware";
import { AiServiceError, generateReading } from "./services/ai";
import { chartSummaryForAi } from "./services/chart-summary";
import {
  applyTransaction,
  getOrCreateWallet,
  InsufficientBalanceError,
} from "./queries/wallets";

/** 每用户每日 AI 参详配额 */
export const AI_DAILY_QUOTA = 20;
/** 每用户每分钟调用上限（内存令牌桶） */
export const AI_RATE_LIMIT_PER_MIN = 5;
/** 一次 live 参详消耗的灵签数（fallback 免费，失败不扣费） */
export const AI_READING_COST_LINGQIAN = 1;

const readingInput = z.object({
  /** 命盘 ID（服务端从库中加载并校验归属，绝不信任客户端提交的命盘数据） */
  chartId: z.number().int().positive().optional(),
  persona: z.enum(["scholar", "hermit"]),
  depth: z.enum(["pro", "plain"]),
  /** 扣费幂等键：同一键重复调用不会重复扣费；缺省时服务端按次生成 */
  idempotencyKey: z.string().trim().min(8).max(64).optional(),
  /** @deprecated 旧契约字段：服务端一律忽略，绝不使用客户端命盘数据 */
  chartType: z.string().trim().max(32).optional(),
  /** @deprecated 旧契约字段：服务端一律忽略，摘要由服务端基于落库结果构建 */
  chartSummary: z.string().trim().max(4000).optional(),
});

/** 内存令牌桶（单实例级限流；多实例部署需替换为集中式限流） */
const rateBuckets = new Map<number, { tokens: number; resetAt: number }>();

/** 测试用：清空限流状态 */
export function resetAiRateLimits(): void {
  rateBuckets.clear();
}

function checkRateLimit(userId: number): void {
  const now = Date.now();
  let bucket = rateBuckets.get(userId);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { tokens: AI_RATE_LIMIT_PER_MIN, resetAt: now + 60_000 };
    rateBuckets.set(userId, bucket);
  }
  if (bucket.tokens <= 0) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `请求过于频繁，每分钟最多 ${AI_RATE_LIMIT_PER_MIN} 次，请稍后再试。`,
    });
  }
  bucket.tokens -= 1;
}

/** 统计用户今日已发起的 AI 参详次数（含 fallback，失败不计） */
async function countTodayReadings(userId: number): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const rows = await getDb()
    .select({ n: sql<number>`count(*)` })
    .from(schema.aiReadings)
    .where(
      and(
        eq(schema.aiReadings.userId, userId),
        gte(schema.aiReadings.createdAt, startOfDay),
      ),
    );
  return Number(rows.at(0)?.n ?? 0);
}

export const aiRouter = createRouter({
  /**
   * AI 参详（需登录）：
   * - 命盘由服务端按 chartId 从库中加载并校验归属（他人命盘 → NOT_FOUND），
   *   摘要由服务端基于【已落库结果】构建，客户端提交的命盘数据一概不信。
   * - 配额：每用户每日 20 次；限流：每用户每分钟 5 次（内存令牌桶）。
   * - 计费：仅当 source=live（真实模型成功返回）时扣 1 灵签，
   *   幂等键防重复扣费；fallback 免费；AI 失败不扣费。
   * - 钱包不存在时自动创建并发放一次注册赠送（36 灵签，幂等）。
   * - 日志：仅记录 chartId + chartType 等元信息，不记录出生输入。
   */
  reading: authedQuery
    .input(readingInput)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      checkRateLimit(userId);

      if (input.chartId === undefined) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "缺少 chartId：AI 参详必须基于已落库的命盘。",
        });
      }

      const db = getDb();
      const chartRows = await db
        .select()
        .from(schema.charts)
        .where(eq(schema.charts.id, input.chartId))
        .limit(1);
      const chart = chartRows.at(0);
      if (!chart || chart.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "命盘不存在。" });
      }

      const todayCount = await countTodayReadings(userId);
      if (todayCount >= AI_DAILY_QUOTA) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `今日 AI 参详次数已达上限（${AI_DAILY_QUOTA} 次），请明日再来。`,
        });
      }

      let stored: BaziChartV2;
      try {
        stored = JSON.parse(chart.result) as BaziChartV2;
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "命盘数据异常，无法参详。",
        });
      }
      const chartSummary = chartSummaryForAi(stored);

      let result;
      try {
        result = await generateReading({
          chartType: chart.chartType,
          chartSummary,
          persona: input.persona,
          depth: input.depth,
        });
      } catch (err) {
        // AI 失败：不扣费，直接透出错误
        if (err instanceof AiServiceError) {
          throw new TRPCError({ code: "BAD_GATEWAY", message: err.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI 参详服务异常。",
        });
      }

      // 仅 live 成功才扣费；fallback 免费
      // AI_BILLING_ENABLED=false（如预览环境）时 live 参详不扣灵签，免费体验
      if (result.source === "live" && env.aiBillingEnabled) {
        // 钱包不存在时自动创建并发放注册赠送（仅一次，幂等）
        await getOrCreateWallet(userId, { withSignupGrant: true });
        const idempotencyKey =
          input.idempotencyKey ??
          `ai-reading:${userId}:${chart.id}:${crypto.randomUUID()}`;
        try {
          await applyTransaction({
            userId,
            changeAmount: -AI_READING_COST_LINGQIAN,
            reason: "consume",
            refType: "ai_reading",
            refId: String(chart.id),
            idempotencyKey,
          });
        } catch (err) {
          if (err instanceof InsufficientBalanceError) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "灵签余额不足，请先充值。",
            });
          }
          throw err;
        }
      }

      // 调用日志：只记录 chartId + chartType 等元信息，绝不记录出生输入
      try {
        await db.insert(schema.aiReadings).values({
          userId,
          chartId: chart.id,
          chartType: chart.chartType,
          rulesetVersion:
            stored.rulesetVersion ?? chart.rulesetVersion ?? null,
          persona: input.persona,
          depth: input.depth,
          source: result.source,
          model: result.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          latencyMs: result.latencyMs,
        });
      } catch (err) {
        console.error("[ai.reading] log persist failed:", err);
      }

      return result;
    }),
});
