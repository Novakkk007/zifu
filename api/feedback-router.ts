import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./queries/connection";
import { env } from "./lib/env";
import { createRouter, publicQuery, adminQuery } from "./middleware";

/**
 * 反馈脱敏守卫：拒绝疑似包含生辰原始数据的文本。
 * 生辰不属于反馈内容——排盘数据应通过 chartId 关联，而不是把生日贴进反馈。
 */
const BIRTHDATA_PATTERNS = [
  /\d{4}\s*[-/年]\s*\d{1,2}\s*[-/月]\s*\d{1,2}/, // 1990-06-15 / 1990年6月15
  /(?:农历|公历|阳历|阴历)\s*(?:闰)?[正一二三四五六七八九十冬腊]{1,2}月/,
  /(?:子时|丑时|寅时|卯时|辰时|巳时|午时|未时|申时|酉时|戌时|亥时)\s*\d{1,2}\s*[:：点]/,
];

function assertNoBirthData(text: string, field: string): void {
  for (const re of BIRTHDATA_PATTERNS) {
    if (re.test(text)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `「${field}」疑似包含生辰原始数据。反馈不需要出生信息——如需定位排盘问题，请提供命盘编号（#chartId）与算法版本。`,
      });
    }
  }
}

const feedbackInput = z.object({
  route: z.string().trim().min(1).max(128),
  feature: z.enum(["bug", "suggestion", "algorithm", "visual", "mobile", "data", "interaction"]),
  severity: z.enum(["P0", "P1", "P2", "P3"]),
  title: z.string().trim().min(2).max(128),
  description: z.string().trim().min(5).max(4000),
  stepsToReproduce: z.string().trim().max(2000).optional(),
  expectedResult: z.string().trim().max(1000).optional(),
  actualResult: z.string().trim().max(1000).optional(),
  browser: z.string().trim().max(255).optional(),
  device: z.string().trim().max(64).optional(),
  algorithmVersion: z.string().trim().max(64).optional(),
  screenshotUrl: z.string().trim().url().max(512).optional(),
});

export const feedbackRouter = createRouter({
  /**
   * 提交反馈（游客可用——预览环境需要低门槛收集意见）。
   * commitSha 由服务端注入当前部署版本，不信任客户端自报。
   */
  submit: publicQuery
    .input(feedbackInput)
    .mutation(async ({ input, ctx }) => {
      assertNoBirthData(input.title, "标题");
      assertNoBirthData(input.description, "问题描述");
      if (input.stepsToReproduce) assertNoBirthData(input.stepsToReproduce, "复现步骤");

      const db = getDb();
      const result = await db.insert(schema.feedback).values({
        userId: ctx.user?.id ?? null,
        route: input.route,
        feature: input.feature,
        severity: input.severity,
        title: input.title,
        description: input.description,
        stepsToReproduce: input.stepsToReproduce ?? null,
        expectedResult: input.expectedResult ?? null,
        actualResult: input.actualResult ?? null,
        browser: input.browser ?? null,
        device: input.device ?? null,
        commitSha: env.commitSha,
        algorithmVersion: input.algorithmVersion ?? null,
        screenshotUrl: input.screenshotUrl ?? null,
      });
      return {
        ok: true,
        feedbackId: Number(result[0].insertId),
        commitSha: env.commitSha,
        notice: "反馈已记录，感谢参谋。",
      };
    }),

  /** 反馈列表（仅管理员），按时间倒序 */
  list: adminQuery
    .input(
      z
        .object({
          status: z.enum(["open", "triaged", "fixed", "wontfix"]).optional(),
          limit: z.number().int().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const rows = input?.status
        ? await db
            .select()
            .from(schema.feedback)
            .where(eq(schema.feedback.status, input.status))
            .orderBy(desc(schema.feedback.createdAt))
            .limit(input.limit ?? 50)
        : await db
            .select()
            .from(schema.feedback)
            .orderBy(desc(schema.feedback.createdAt))
            .limit(input?.limit ?? 50);
      return rows;
    }),
});
