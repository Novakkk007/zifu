import { randomInt } from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import {
  LIUYAO_ALGORITHM_VERSION,
  castWithCoins,
  parseCoins,
  type LiuyaoChart,
} from "@contracts/engines/liuyao-core";
import type { EngineResult } from "@contracts/engines/engine-result";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery, authedQuery } from "./middleware";

/**
 * 六爻路由 · 服务端真实起卦：
 * - coinToss：每摇由服务端 CSPRNG（crypto.randomInt）掷三枚铜钱，无状态，
 *   前端连调六次集齐一卦；随机源不落地、不可由客户端伪造。
 * - cast：18 枚铜钱结果 → liuyao-core 确定性装卦（纳甲/六亲/六神/旬空/月建日辰），
 *   登录用户自动落库 charts（chartType='liuyao'）；携带 idempotencyKey 时
 *   同键重复提交只落库一次（命中既有记录直接返回其 chartId）。
 * - detail：按 chartId 读取已落库卦例（仅属主本人）。
 */
export const liuyaoRouter = createRouter({
  /** 服务端掷币：一次一摇，3 枚铜钱（字=3 背=2）。公开、无状态。 */
  coinToss: publicQuery
    .input(z.object({ tossIndex: z.number().int().min(1).max(6) }))
    .mutation(({ input }) => {
      // crypto.randomInt 为 CSPRNG；0/1 各半 → 背(2)/字(3)
      const coins = [0, 1, 2].map(() => (randomInt(0, 2) === 0 ? 2 : 3));
      const sum = coins[0] + coins[1] + coins[2];
      return {
        tossIndex: input.tossIndex,
        coins,
        faces: coins.map((c) => (c === 3 ? "zi" : "bei")),
        value: sum, // 6 老阴(动) / 7 少阳 / 8 少阴 / 9 老阳(动)
        source: "server-csprng" as const,
      };
    }),

  /** 起卦排盘：18 枚铜钱（每摇 3 枚，共 6 摇，自下而上）→ EngineResult<LiuyaoChart> */
  cast: publicQuery
    .input(
      z.object({
        coins: z.array(z.number().int().min(2).max(3)).length(18),
        question: z.string().trim().max(40).optional(),
        /** 幂等键：同键重复提交不重复落库（登录时生效） */
        idempotencyKey: z.string().trim().min(8).max(64).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      let result: EngineResult<LiuyaoChart>;
      try {
        // 先显式解析（给出中文错误），再走引擎
        parseCoins(input.coins);
        result = castWithCoins(input.coins, { question: input.question });
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `无法起卦：${err instanceof Error ? err.message : String(err)}`,
        });
      }

      let chartId: number | null = null;
      let persisted = false;
      if (ctx.user) {
        try {
          const db = getDb();
          const inputJson = JSON.stringify({
            coins: input.coins,
            question: input.question ?? null,
            idempotencyKey: input.idempotencyKey ?? null,
          });
          const resultJson = JSON.stringify(result);

          // 幂等：同 user + 同输入（含幂等键）已存在则复用，不重复落库
          if (input.idempotencyKey) {
            const existing = await db
              .select({ id: schema.charts.id })
              .from(schema.charts)
              .where(
                and(
                  eq(schema.charts.userId, ctx.user.id),
                  eq(schema.charts.chartType, "liuyao"),
                  eq(schema.charts.input, inputJson),
                ),
              )
              .limit(1);
            const hit = existing.at(0);
            if (hit) {
              chartId = hit.id;
              persisted = true;
            }
          }

          if (chartId === null) {
            const inserted = await db
              .insert(schema.charts)
              .values({
                userId: ctx.user.id,
                chartType: "liuyao",
                title: input.question?.trim()
                  ? `六爻 · ${input.question.trim()}`
                  : `六爻 · ${result.data.benGua.name}`,
                input: inputJson,
                result: resultJson,
                rulesetVersion: result.data.rulesetVersion,
                algorithmVersion: LIUYAO_ALGORITHM_VERSION,
              })
              .$returningId();
            chartId = inserted.at(0)?.id ?? null;
            if (chartId !== null) {
              persisted = true;
              // 版本快照（可追溯、可重放）
              await db.insert(schema.chartVersions).values({
                chartId,
                rulesetVersion: result.data.rulesetVersion,
                algorithmVersion: LIUYAO_ALGORITHM_VERSION,
                inputSnapshot: inputJson,
                resultSnapshot: resultJson,
              });
            }
          }
        } catch (err) {
          // 落库失败不阻塞排盘结果返回
          console.error("[liuyao.cast] persist failed:", err);
        }
      }

      return { result, chartId, persisted };
    }),

  /** 卦例详情（仅属主本人；他人 → NOT_FOUND） */
  detail: authedQuery
    .input(z.object({ chartId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const rows = await getDb()
        .select()
        .from(schema.charts)
        .where(
          and(
            eq(schema.charts.id, input.chartId),
            eq(schema.charts.chartType, "liuyao"),
          ),
        )
        .limit(1);
      const row = rows.at(0);
      if (!row || row.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "卦例不存在。" });
      }
      return {
        ...row,
        input: JSON.parse(row.input) as unknown,
        result: JSON.parse(row.result) as EngineResult<LiuyaoChart>,
      };
    }),
});
