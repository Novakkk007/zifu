import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { paipanZiwei } from "@contracts/engines/ziwei-core";
import type { ZiweiInput } from "@contracts/engines/ziwei-core";
import { ZIWEI_ALGORITHM_VERSION, ZIWEI_RULESET_VERSION } from "@contracts/engines/ziwei-core";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery, authedQuery } from "./middleware";

/**
 * 紫微排盘输入（简化版 BirthInput：时辰以时支 0-11 表示）。
 * 闰月按当月计（北派全书惯例）；公历输入由服务端换算农历（lunar-typescript）。
 */
const ziweiInput = z
  .object({
    calendar: z.enum(["solar", "lunar"]),
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    /** 时辰支序：0=子 1=丑 … 11=亥 */
    hourBranch: z.number().int().min(0).max(11),
    gender: z.enum(["male", "female"]),
    /** 农历闰月标记（calendar='lunar' 时有效） */
    isLeapMonth: z.boolean().optional(),
    /** 落库标题（可选，不进算法） */
    title: z.string().trim().max(64).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.calendar === "solar" && v.isLeapMonth === true) {
      ctx.addIssue({
        code: "custom",
        path: ["isLeapMonth"],
        message: "公历输入不允许携带闰月标记。",
      });
    }
    if (v.calendar === "lunar" && v.day > 30) {
      ctx.addIssue({
        code: "custom",
        path: ["day"],
        message: "农历日期应在 1-30 之间。",
      });
    }
  });

function isValidSolarDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

export const ziweiRouter = createRouter({
  /**
   * 紫微斗数排盘：接入 @contracts/engines/ziwei-core（北派全书安星法，
   * 五行局 / 紫微定位 / 十四主星 / 辅星 / 生年四化 / 大限，iztro 全量对拍验证）。
   * 公开可调；登录后自动落库（chartType 'ziwei'）并写版本快照。
   * 返回 EngineResult 信封（meta: ruleVariant/precision/warnings/provenance）。
   */
  paipan: publicQuery
    .input(ziweiInput)
    .mutation(async ({ input, ctx }) => {
      const { title, ...birth } = input;

      if (birth.calendar === "solar" && !isValidSolarDate(birth.year, birth.month, birth.day)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "无效的日期，请检查年月日。",
        });
      }

      let result: ReturnType<typeof paipanZiwei>;
      try {
        result = paipanZiwei(birth satisfies ZiweiInput);
      } catch (err) {
        // 历法引擎对越界农历日期等会抛错，统一转为 400
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `无法解析的出生时间：${err instanceof Error ? err.message : String(err)}`,
        });
      }

      let chartId: number | null = null;
      if (ctx.user) {
        try {
          const inputJson = JSON.stringify(birth satisfies ZiweiInput);
          const resultJson = JSON.stringify(result);
          const inserted = await getDb()
            .insert(schema.charts)
            .values({
              userId: ctx.user.id,
              chartType: "ziwei",
              title: title ?? "紫微斗数排盘",
              input: inputJson,
              result: resultJson,
              rulesetVersion: ZIWEI_RULESET_VERSION,
              algorithmVersion: ZIWEI_ALGORITHM_VERSION,
            })
            .$returningId();
          chartId = inserted.at(0)?.id ?? null;
          if (chartId !== null) {
            await getDb()
              .insert(schema.chartVersions)
              .values({
                chartId,
                rulesetVersion: ZIWEI_RULESET_VERSION,
                algorithmVersion: ZIWEI_ALGORITHM_VERSION,
                inputSnapshot: inputJson,
                resultSnapshot: resultJson,
              });
          }
        } catch (err) {
          // 落库失败不阻塞排盘结果返回，但记录日志便于排查
          console.error("[ziwei.paipan] persist failed:", err);
        }
      }

      return { result, chartId, persisted: chartId !== null };
    }),

  /** 我的紫微命盘详情（需登录，校验归属；返回落库的 EngineResult 快照） */
  detail: authedQuery
    .input(z.object({ chartId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const rows = await getDb()
        .select()
        .from(schema.charts)
        .where(eq(schema.charts.id, input.chartId))
        .limit(1);
      const row = rows.at(0);
      if (!row || row.userId !== ctx.user.id || row.chartType !== "ziwei") {
        throw new TRPCError({ code: "NOT_FOUND", message: "记录不存在。" });
      }
      let result: unknown;
      try {
        result = JSON.parse(row.result) as unknown;
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "命盘数据异常，无法读取。",
        });
      }
      return {
        chartId: row.id,
        title: row.title,
        chartType: row.chartType,
        rulesetVersion: row.rulesetVersion,
        algorithmVersion: row.algorithmVersion,
        createdAt: row.createdAt,
        result,
      };
    }),
});
