import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as schema from "@db/schema";
import {
  computeDaliuren,
  DALIUREN_ALGORITHM_VERSION,
  DALIUREN_RULESET_VERSION,
  type DaliurenInput,
} from "@contracts/engines/daliuren-core";
import {
  assertValidIanaTimezone,
  InvalidTimezoneError,
} from "@contracts/engines/time-protocol";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";

/** 算法引擎版本标识（随 daliuren-core 引擎升级而 bump） */
export const ALGORITHM_VERSION = DALIUREN_ALGORITHM_VERSION;

/**
 * 起课输入：公历时刻 + 可选 IANA 时区（未给按东八区墙钟）+ 可选所问之事。
 * 大六壬为占时起课，年月日时分皆取公历墙钟。
 */
const qikeInput = z.object({
  datetime: z.object({
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
  }),
  /** IANA 时区（如 Asia/Shanghai），缺省按东八区墙钟解释 */
  ianaTimezone: z.string().trim().max(64).optional(),
  /** 所问之事（可选，仅落库展示，不进算法） */
  question: z.string().trim().max(200).optional(),
  /** 落库标题（可选，不进算法） */
  title: z.string().trim().max(64).optional(),
});

function isValidSolarDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

export const daliurenRouter = createRouter({
  /**
   * 大六壬起课：接入真实引擎 @contracts/engines/daliuren-core
   * （中气换将、月将加时、四课九宗门、十二天将）。公开可调；
   * 若携带登录态，自动落库为一条排盘记录（chartType='daliuren'）。
   */
  qike: publicQuery
    .input(qikeInput)
    .mutation(async ({ input, ctx }) => {
      const { datetime, ianaTimezone, question, title } = input;

      // 统一时间协议：无效 IANA 时区 → 400
      try {
        assertValidIanaTimezone(ianaTimezone);
      } catch (err) {
        if (err instanceof InvalidTimezoneError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
        }
        throw err;
      }

      if (!isValidSolarDate(datetime.year, datetime.month, datetime.day)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "无效的日期，请检查年月日。",
        });
      }

      const engineInput: DaliurenInput = {
        ...datetime,
        ianaTimezone,
        question,
      };

      let result;
      try {
        result = computeDaliuren(engineInput);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `无法起课：${err instanceof Error ? err.message : String(err)}`,
        });
      }

      let chartId: number | null = null;
      if (ctx.user) {
        try {
          const inputJson = JSON.stringify(engineInput satisfies DaliurenInput);
          const resultJson = JSON.stringify(result);
          const inserted = await getDb()
            .insert(schema.charts)
            .values({
              userId: ctx.user.id,
              chartType: "daliuren",
              title: title ?? "大六壬起课",
              input: inputJson,
              result: resultJson,
              rulesetVersion: DALIUREN_RULESET_VERSION,
              algorithmVersion: ALGORITHM_VERSION,
            })
            .$returningId();
          chartId = inserted.at(0)?.id ?? null;
          if (chartId !== null) {
            await getDb()
              .insert(schema.chartVersions)
              .values({
                chartId,
                rulesetVersion: DALIUREN_RULESET_VERSION,
                algorithmVersion: ALGORITHM_VERSION,
                inputSnapshot: inputJson,
                resultSnapshot: resultJson,
              });
          }
        } catch (err) {
          // 落库失败不阻塞起课结果返回，但记录日志便于排查
          console.error("[daliuren.qike] persist failed:", err);
        }
      }

      return { result, chartId, persisted: chartId !== null };
    }),
});
