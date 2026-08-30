import { randomInt } from "node:crypto";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import {
  DRAWS_ALGORITHM_VERSION,
  DRAWS_DISCLAIMER,
  DRAWS_RULESET_VERSION,
  drawSignNo,
  resolveSign,
} from "@contracts/engines/draws-core";
import type { GuanyinSign } from "@contracts/engines/draws-core";
import { wrapResult } from "@contracts/engines/engine-result";
import type { EngineResult } from "@contracts/engines/engine-result";
import { getDb } from "./queries/connection";
import { createRouter, authedQuery } from "./middleware";

/** 灵签结果数据 */
export interface LingqianDraw {
  signNo: number;
  sign: GuanyinSign;
  /** true = 同一 idempotencyKey 的复放（未重新随机） */
  idempotentReplay: boolean;
}

export interface LingqianResult {
  result: EngineResult<LingqianDraw>;
  chartId: number | null;
}

const PROVENANCE = [
  {
    ruleId: "draws.guanyin-100",
    variant: "观音灵签通行本一百首（吉凶等第归并上/中/下）",
    source: "观音灵签一百首",
  },
  {
    ruleId: "draws.csprng",
    variant: "node:crypto randomInt(1,101) 均匀抽取",
    source: "服务端 CSPRNG",
  },
];

function buildResult(signNo: number, idempotentReplay: boolean): EngineResult<LingqianDraw> {
  return wrapResult(
    {
      engine: "draw",
      algorithmVersion: DRAWS_ALGORITHM_VERSION,
      ruleVariant: "观音灵签一百首-CSPRNG均匀抽取",
      precision: "validated",
      warnings: [DRAWS_DISCLAIMER],
      provenance: PROVENANCE,
    },
    { signNo, sign: resolveSign(signNo), idempotentReplay },
  );
}

export const drawsRouter = createRouter({
  /**
   * 观音灵签：服务端 CSPRNG（crypto.randomInt）抽取 1-100 签号。
   * 幂等：同一 idempotencyKey（建议 `${userId}-${date}` 实现每日一签）
   * 命中既有记录时直接复放，不重新随机、不重复落库。
   */
  lingqian: authedQuery
    .input(
      z.object({
        idempotencyKey: z.string().trim().min(1).max(128),
      }),
    )
    .mutation(async ({ input, ctx }): Promise<LingqianResult> => {
      // 幂等查找：该用户的 draw 记录中，input.idempotencyKey 相同者直接复放
      const rows = await getDb()
        .select()
        .from(schema.charts)
        .where(and(eq(schema.charts.userId, ctx.user.id), eq(schema.charts.chartType, "draw")))
        .orderBy(desc(schema.charts.createdAt))
        .limit(100);
      for (const row of rows) {
        try {
          const saved = JSON.parse(row.input) as { idempotencyKey?: string };
          if (saved.idempotencyKey !== input.idempotencyKey) continue;
          const savedResult = JSON.parse(row.result) as EngineResult<LingqianDraw>;
          return {
            result: buildResult(savedResult.data.signNo, true),
            chartId: row.id,
          };
        } catch {
          // 单条记录解析失败则跳过，继续查找
        }
      }

      // 未命中：CSPRNG 抽取新签
      const signNo = drawSignNo(randomInt);
      const result = buildResult(signNo, false);

      let chartId: number | null = null;
      try {
        const inputJson = JSON.stringify({ idempotencyKey: input.idempotencyKey });
        const resultJson = JSON.stringify(result);
        const inserted = await getDb()
          .insert(schema.charts)
          .values({
            userId: ctx.user.id,
            chartType: "draw",
            title: `观音灵签 · 第${signNo}签`,
            input: inputJson,
            result: resultJson,
            rulesetVersion: DRAWS_RULESET_VERSION,
            algorithmVersion: DRAWS_ALGORITHM_VERSION,
          })
          .$returningId();
        chartId = inserted.at(0)?.id ?? null;
      } catch (err) {
        console.error("[draws.lingqian] persist failed:", err);
      }

      return { result, chartId };
    }),
});
