import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as schema from "@db/schema";
import { computeQizheng, QIZHENG_ALGORITHM_VERSION, QIZHENG_RULESET_VERSION } from "@contracts/engines/qizheng-core";
import { ianaWallClockToUtcMs } from "@contracts/bazi-core";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";

/** 算法引擎版本标识（随 qizheng-core 升级而 bump） */
export const ALGORITHM_VERSION = QIZHENG_ALGORITHM_VERSION;

const WALL_CLOCK_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;

/**
 * 七政四余排盘输入：
 * - datetime：ISO 时间串。携带 ianaTimezone 时解释为「该时区墙钟」
 *   （YYYY-MM-DDTHH:mm，自动处理历史夏令时）；否则按 ISO 解析
 *   （含 Z 或 ±hh:mm 偏移；无偏移时按 UTC 处理）。
 * - hourBranch 由 datetime 的墙钟小时换算（子时 23:00–00:59）。
 */
const paipanInput = z.object({
  datetime: z.string().trim().min(10).max(40),
  ianaTimezone: z.string().trim().max(64).optional(),
  gender: z.enum(["male", "female"]).optional(),
  /** 恒星黄道指差（度）；缺省 = 回归黄道宫位 + Lahiri 近似宿度 */
  siderealOffsetDeg: z.number().min(0).max(360).optional(),
  /** 落库标题（可选，不进算法） */
  title: z.string().trim().max(64).optional(),
});

/** 墙钟小时 → 时支序 0–11（子=0，23:00–00:59 为子） */
export function hourToBranch(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2);
}

/** 解析输入时刻 → UTC 毫秒与生时时支 */
function resolveInstant(input: z.infer<typeof paipanInput>): { utcMs: number; hourBranch: number } {
  const m = WALL_CLOCK_RE.exec(input.datetime);
  if (!m) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "无法解析的时间格式，请使用 ISO 格式（如 2000-01-01T08:30）。",
    });
  }
  const [, ys, ms, ds, hs, mins, ss] = m;
  const civil = {
    year: Number(ys),
    month: Number(ms),
    day: Number(ds),
    hour: Number(hs),
    minute: Number(mins),
    second: ss ? Number(ss) : 0,
  };
  if (civil.year < 1900 || civil.year > 2100) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "年份应在 1900–2100 之间。" });
  }
  if (civil.month < 1 || civil.month > 12 || civil.day < 1 || civil.day > 31 || civil.hour > 23 || civil.minute > 59) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "无效的日期时间，请检查输入。" });
  }

  let utcMs: number;
  if (input.ianaTimezone) {
    try {
      utcMs = ianaWallClockToUtcMs(input.ianaTimezone, civil);
    } catch {
      throw new TRPCError({ code: "BAD_REQUEST", message: "无效的时区标识（应为 IANA 时区，如 Asia/Shanghai）。" });
    }
  } else {
    const parsed = Date.parse(input.datetime);
    if (Number.isNaN(parsed)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "无法解析的时间，请携带时区偏移或指定 ianaTimezone。" });
    }
    utcMs = parsed;
  }
  return { utcMs, hourBranch: hourToBranch(civil.hour) };
}

export const qizhengRouter = createRouter({
  /**
   * 七政四余排盘：astronomy-engine 真实星历（七政回归黄经/顺逆）+
   * 四余（罗睺计都=黄白交点、月孛=平远地点、紫气=传统推法）+
   * 黄道十二宫/二十八宿双轨标注 + 太阳加时命宫。
   * 公开可调；登录后自动落库（chartType 'qizheng'），返回 chartId 供 ai.reading 参详。
   */
  paipan: publicQuery
    .input(paipanInput)
    .mutation(async ({ input, ctx }) => {
      const { title, ...rest } = input;
      const { utcMs, hourBranch } = resolveInstant(rest);

      let result;
      try {
        result = computeQizheng({
          utcMs,
          hourBranch,
          gender: rest.gender,
          ianaTimezone: rest.ianaTimezone,
          siderealOffsetDeg: rest.siderealOffsetDeg ?? null,
        });
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `无法排算星盘：${err instanceof Error ? err.message : String(err)}`,
        });
      }

      let chartId: number | null = null;
      if (ctx.user) {
        try {
          const inputJson = JSON.stringify({ ...rest, hourBranch });
          const resultJson = JSON.stringify(result);
          const inserted = await getDb()
            .insert(schema.charts)
            .values({
              userId: ctx.user.id,
              chartType: "qizheng",
              title: title ?? "七政四余排盘",
              input: inputJson,
              result: resultJson,
              rulesetVersion: QIZHENG_RULESET_VERSION,
              algorithmVersion: ALGORITHM_VERSION,
            })
            .$returningId();
          chartId = inserted.at(0)?.id ?? null;
          if (chartId !== null) {
            await getDb()
              .insert(schema.chartVersions)
              .values({
                chartId,
                rulesetVersion: QIZHENG_RULESET_VERSION,
                algorithmVersion: ALGORITHM_VERSION,
                inputSnapshot: inputJson,
                resultSnapshot: resultJson,
              });
          }
        } catch (err) {
          // 落库失败不阻塞排盘结果返回
          console.error("[qizheng.paipan] persist failed:", err);
        }
      }

      return { result, chartId, persisted: chartId !== null };
    }),
});
