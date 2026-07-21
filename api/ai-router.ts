import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as schema from "@db/schema";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";
import { AiServiceError, generateReading } from "./services/ai";

const readingInput = z.object({
  chartType: z.enum([
    "bazi",
    "hepan",
    "liuyao",
    "ziwei",
    "qizheng",
    "qimen",
    "daliuren",
    "hecan",
  ]),
  chartSummary: z.string().trim().min(1).max(4000),
  persona: z.enum(["scholar", "hermit"]),
  depth: z.enum(["pro", "plain"]),
});

export const aiRouter = createRouter({
  /**
   * AI 参详：调用 AI 适配器生成解读。
   * - 配置 AI_API_KEY 时走真实模型（source = "live"）
   * - 未配置时降级确定性模板（source = "fallback"），接口契约不变
   * - 调用日志落库（含 token 与耗时），供计费与审计
   */
  reading: publicQuery
    .input(readingInput)
    .mutation(async ({ input, ctx }) => {
      let result;
      try {
        result = await generateReading(input);
      } catch (err) {
        if (err instanceof AiServiceError) {
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: err.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI 参详服务异常。",
        });
      }

      // 测试环境跳过日志落库，保持用例隔离（VITEST 由测试运行器自动注入）
      if (!process.env.VITEST) try {
        await getDb().insert(schema.aiReadings).values({
          userId: ctx.user?.id ?? null,
          chartType: input.chartType,
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
