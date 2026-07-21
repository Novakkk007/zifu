import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { computeChart } from "./services/ganzhi";

const birthInput = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  /** 时辰地支序号 0-11；null = 时辰不详 */
  hourBranch: z.number().int().min(0).max(11).nullable(),
  gender: z.enum(["male", "female"]),
  title: z.string().trim().max(64).optional(),
});

function isValidDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

export const baziRouter = createRouter({
  /**
   * 八字排盘：服务端真实干支算法（五虎遁/五鼠遁/日柱锚定 1900-01-01 甲戌）。
   * 公开可调；若携带登录态，自动落库为一条排盘记录。
   */
  paipan: publicQuery
    .input(birthInput)
    .mutation(async ({ input, ctx }) => {
      if (!isValidDate(input.year, input.month, input.day)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "无效的日期，请检查年月日。",
        });
      }

      const chart = computeChart({
        year: input.year,
        month: input.month,
        day: input.day,
        hourBranch: input.hourBranch,
        gender: input.gender,
      });

      let chartId: number | null = null;
      if (ctx.user) {
        try {
          const inserted = await getDb()
            .insert(schema.charts)
            .values({
              userId: ctx.user.id,
              chartType: "bazi",
              title: input.title ?? "八字排盘",
              input: JSON.stringify(input),
              result: JSON.stringify(chart),
            })
            .$returningId();
          chartId = inserted.at(0)?.id ?? null;
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
});
