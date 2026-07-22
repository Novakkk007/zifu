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
 * 覆盖：阿拉伯日期、农历中文数字、时辰+分钟、干支四柱写法。
 */
const BIRTHDATA_PATTERNS = [
  /\d{4}\s*[-/年.]\s*\d{1,2}\s*[-/月.]\s*\d{1,2}/, // 1990-06-15 / 1990年6月15 / 1990.6.15
  /(?:农历|公历|阳历|阴历)\s*(?:闰)?[正一二三四五六七八九十冬腊]{1,2}月/,
  /(?:子时|丑时|寅时|卯时|辰时|巳时|午时|未时|申时|酉时|戌时|亥时)\s*\d{1,2}\s*[:：点]/,
  // 干支四柱连写，如「庚午年壬午月辛亥日」
  /[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]年[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]月/,
  // 出生/生于 + 时辰
  /(?:生于|出生在|出生于)\s*(?:凌晨|早上|上午|中午|下午|晚上|夜里)?\s*\d{1,2}\s*[:：点]/,
  // 经纬度坐标：十进制高精度小数对 / 经度纬度关键字 / 度数表示
  /(?:经度|纬度|东经|西经|北纬|南纬)\s*[:：]?\s*\d{1,3}(?:\.\d+)?/,
  /\d{1,3}\.\d{4,}\s*[,，]\s*\d{1,3}\.\d{4,}/,
  /\d{1,3}°\d{1,2}[′']/, // 116°28′
  // 出生地/籍贯等地点信息
  /(?:出生地|出生地点|出生城市|籍贯|户籍所在地)\s*[:：]?\s*\S{2,}/,
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

/** 全部 5 个文本字段统一过脱敏守卫 */
function assertAllFieldsClean(input: {
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
}): void {
  assertNoBirthData(input.title, "标题");
  assertNoBirthData(input.description, "问题描述");
  if (input.stepsToReproduce) assertNoBirthData(input.stepsToReproduce, "复现步骤");
  if (input.expectedResult) assertNoBirthData(input.expectedResult, "期望结果");
  if (input.actualResult) assertNoBirthData(input.actualResult, "实际结果");
}

/* ---------------- 提交限流（内存滑动窗口） ---------------- */

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 分钟
const RATE_LIMIT_MAX = 5; // 每窗口最多 5 条
const submitLog = new Map<string, number[]>();

/** 测试专用：重置限流状态 */
export function resetFeedbackRateLimits(): void {
  submitLog.clear();
}

function assertSubmitRateAllowed(key: string): void {
  const now = Date.now();
  const log = (submitLog.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (log.length >= RATE_LIMIT_MAX) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "反馈提交过于频繁，请 10 分钟后再试。",
    });
  }
  log.push(now);
  submitLog.set(key, log);
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
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
   * commitSha 由服务端注入当前部署版本，不信任客户端自报；
   * 限流：每用户（登录）或每 IP（游客）10 分钟 5 条。
   */
  submit: publicQuery
    .input(feedbackInput)
    .mutation(async ({ input, ctx }) => {
      assertSubmitRateAllowed(
        ctx.user ? `user:${ctx.user.id}` : `ip:${clientIp(ctx.req)}`,
      );
      assertAllFieldsClean(input);

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
      const feedbackId = Number(result[0].insertId);

      // P0/P1 紧急反馈：写审计日志 + 服务端告警输出（管理收件箱按 severity 排序可见；
      // 外部通知渠道——邮件/IM webhook——预留 NOTIFY_WEBHOOK_URL 环境变量）
      if (input.severity === "P0" || input.severity === "P1") {
        console.warn(
          `[feedback.urgent] ${input.severity} #${feedbackId} [${input.feature}] ${input.title} (${input.route})`,
        );
        try {
          await db.insert(schema.auditLogs).values({
            userId: ctx.user?.id ?? null,
            action: "feedback.urgent",
            targetType: "feedback",
            targetId: String(feedbackId),
            meta: JSON.stringify({
              severity: input.severity,
              feature: input.feature,
              title: input.title,
              route: input.route,
            }),
          });
        } catch (err) {
          console.error("[feedback.urgent] audit log failed:", err);
        }
      }

      return {
        ok: true,
        feedbackId,
        commitSha: env.commitSha,
        notice: "反馈已记录，感谢参谋。",
      };
    }),

  /** 反馈列表（仅管理员）：按状态过滤 + 分页，按时间倒序 */
  list: adminQuery
    .input(
      z
        .object({
          status: z.enum(["open", "triaged", "fixed", "wontfix"]).optional(),
          limit: z.number().int().min(1).max(200).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const base = db.select().from(schema.feedback);
      const rows = input?.status
        ? await base
            .where(eq(schema.feedback.status, input.status))
            .orderBy(desc(schema.feedback.createdAt))
            .limit(input.limit ?? 50)
            .offset(input.offset ?? 0)
        : await base
            .orderBy(desc(schema.feedback.createdAt))
            .limit(input?.limit ?? 50)
            .offset(input?.offset ?? 0);
      return rows;
    }),

  /** 状态流转 + 处理备注（仅管理员） */
  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["open", "triaged", "fixed", "wontfix"]),
        adminNote: z.string().trim().max(1024).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const res = await db
        .update(schema.feedback)
        .set({
          status: input.status,
          ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
        })
        .where(eq(schema.feedback.id, input.id));
      if (Number(res[0]?.affectedRows ?? 0) !== 1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "反馈不存在。" });
      }
      return { ok: true };
    }),
});
