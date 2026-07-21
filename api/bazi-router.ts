import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { computeChartV2 } from "@contracts/bazi-core";
import type { BaziChartV2, BirthInput } from "@contracts/bazi-core";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery, authedQuery } from "./middleware";

/** 算法引擎版本标识（随 computeChartV2 引擎升级而 bump） */
export const ALGORITHM_VERSION = "computeChartV2@1";

/**
 * 新版出生输入（与 @contracts/bazi-core 的 BirthInput 对齐，RULESET_VERSION 1.0.0）。
 * 额外允许 title 用于落库标题。
 */
const birthInput = z
  .object({
    calendar: z.enum(["solar", "lunar"]),
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    /** 0-23；null = 时辰未知（时柱不排，称骨返回 null） */
    hour: z.number().int().min(0).max(23).nullable(),
    minute: z.number().int().min(0).max(59),
    gender: z.enum(["male", "female"]),
    /** 农历闰月标记（calendar='lunar' 时有效） */
    isLeapMonth: z.boolean().optional(),
    /** 出生城市（预设城市表键名；仅作展示与经度缺省来源） */
    city: z.string().trim().max(64).optional(),
    /** 东经度数，缺省 120 */
    longitude: z.number().min(-180).max(180).optional(),
    /** UTC 偏移小时，缺省 8 */
    timezone: z.number().min(-12).max(14).optional(),
    useTrueSolarTime: z.boolean(),
    dayRollover: z.enum(["zichu", "midnight"]),
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

export const baziRouter = createRouter({
  /**
   * 八字排盘 v2：接入共享算法库 @contracts/bazi-core（真实节气、真太阳时、
   * 大运、神煞、称骨）。公开可调；若携带登录态，自动落库为一条排盘记录
   * （result JSON 内含 rulesetVersion，可回溯算法版本）。
   */
  paipan: publicQuery
    .input(birthInput)
    .mutation(async ({ input, ctx }) => {
      const { title, ...birth } = input;

      if (birth.calendar === "solar" && !isValidSolarDate(birth.year, birth.month, birth.day)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "无效的日期，请检查年月日。",
        });
      }

      let chart: BaziChartV2;
      try {
        chart = computeChartV2(birth);
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
          const inputJson = JSON.stringify(birth satisfies BirthInput);
          const resultJson = JSON.stringify(chart);
          const inserted = await getDb()
            .insert(schema.charts)
            .values({
              userId: ctx.user.id,
              chartType: "bazi",
              title: title ?? "八字排盘",
              input: inputJson,
              result: resultJson,
              rulesetVersion: chart.rulesetVersion,
              algorithmVersion: ALGORITHM_VERSION,
            })
            .$returningId();
          chartId = inserted.at(0)?.id ?? null;
          if (chartId !== null) {
            // 每次排盘均写入一条版本快照（可追溯、可重放）
            await getDb()
              .insert(schema.chartVersions)
              .values({
                chartId,
                rulesetVersion: chart.rulesetVersion,
                algorithmVersion: ALGORITHM_VERSION,
                inputSnapshot: inputJson,
                resultSnapshot: resultJson,
              });
          }
        } catch (err) {
          // 落库失败不阻塞排盘结果返回，但记录日志便于排查
          console.error("[bazi.paipan] persist failed:", err);
        }
      }

      return { chart, chartId, persisted: chartId !== null };
    }),

  /** 我的排盘历史（需登录，按时间倒序，上限 50 条） */
  history: authedQuery.query(async ({ ctx }) => {
    const rows = await getDb()
      .select()
      .from(schema.charts)
      .where(eq(schema.charts.userId, ctx.user.id))
      .orderBy(desc(schema.charts.createdAt))
      .limit(50);
    return rows.map((r) => ({
      ...r,
      input: JSON.parse(r.input) as unknown,
      result: JSON.parse(r.result) as unknown,
    }));
  }),

  /** 删除我的一条排盘记录（校验归属） */
  remove: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const rows = await getDb()
        .select({ id: schema.charts.id, userId: schema.charts.userId })
        .from(schema.charts)
        .where(eq(schema.charts.id, input.id))
        .limit(1);
      const row = rows.at(0);
      if (!row || row.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "记录不存在。" });
      }
      await getDb().delete(schema.charts).where(eq(schema.charts.id, input.id));
      return { success: true };
    }),

  /**
   * 重算：按命盘落库输入重新运行算法（算法 / 规则升级后复算），
   * 写入一条新的 chart_versions 快照并更新 charts 主表，返回新鲜命盘。
   * 校验归属（他人命盘 → NOT_FOUND）。
   */
  recompute: authedQuery
    .input(z.object({ chartId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const rows = await getDb()
        .select()
        .from(schema.charts)
        .where(eq(schema.charts.id, input.chartId))
        .limit(1);
      const row = rows.at(0);
      if (!row || row.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "记录不存在。" });
      }

      let birth: BirthInput;
      try {
        birth = JSON.parse(row.input) as BirthInput;
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "命盘输入数据异常，无法重算。",
        });
      }

      let chart: BaziChartV2;
      try {
        chart = computeChartV2(birth);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `无法重算：${err instanceof Error ? err.message : String(err)}`,
        });
      }

      const resultJson = JSON.stringify(chart);
      try {
        await getDb()
          .update(schema.charts)
          .set({
            result: resultJson,
            rulesetVersion: chart.rulesetVersion,
            algorithmVersion: ALGORITHM_VERSION,
          })
          .where(eq(schema.charts.id, row.id));
        await getDb()
          .insert(schema.chartVersions)
          .values({
            chartId: row.id,
            rulesetVersion: chart.rulesetVersion,
            algorithmVersion: ALGORITHM_VERSION,
            inputSnapshot: row.input,
            resultSnapshot: resultJson,
          });
      } catch (err) {
        console.error("[bazi.recompute] persist failed:", err);
      }

      return { chart, chartId: row.id };
    }),
});
