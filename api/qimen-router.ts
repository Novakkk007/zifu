import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as schema from "@db/schema";
import { computeQimen } from "@contracts/engines/qimen-core";
import type { QimenChart } from "@contracts/engines/qimen-core";
import type { EngineResult } from "@contracts/engines/engine-result";
import {
  assertValidIanaTimezone,
  InvalidTimezoneError,
} from "@contracts/engines/time-protocol";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";

/** 算法引擎版本标识（随 qimen-core 引擎升级而 bump） */
export const QIMEN_ROUTER_ALGORITHM_VERSION = "qimen-core@1";

const qijuInput = z.object({
  /**
   * 起局时刻 ISO 字符串：带偏移按绝对时刻；无偏移按 ianaTimezone
   * （缺省 Asia/Shanghai）墙钟解析。
   */
  datetime: z.string().trim().min(10).max(40),
  /** IANA 时区（如 Asia/Shanghai），仅 datetime 无偏移时生效 */
  ianaTimezone: z.string().trim().max(64).optional(),
  /** 所问之事（可选，透传落库与展示，不入算法） */
  question: z.string().trim().max(120).optional(),
  /** 落库标题（可选，不进算法） */
  title: z.string().trim().max(64).optional(),
});

export const qimenRouter = createRouter({
  /**
   * 时家奇门起局（拆补法·转盘）：真实节气判定阴阳遁，符头三元定局数。
   * 公开可调；若携带登录态，自动落库为一条排盘记录（chartType 'qimen'，
   * result JSON 为 EngineResult<QimenChart>，含算法版本与规则溯源）。
   */
  qiju: publicQuery
    .input(qijuInput)
    .mutation(async ({ input, ctx }) => {
      const { title, ...engineInput } = input;

      // 统一时间协议：无效 IANA 时区 → 400
      try {
        assertValidIanaTimezone(engineInput.ianaTimezone);
      } catch (err) {
        if (err instanceof InvalidTimezoneError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
        }
        throw err;
      }

      let result: EngineResult<QimenChart>;
      try {
        result = computeQimen(engineInput);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `无法解析的起局时刻：${err instanceof Error ? err.message : String(err)}`,
        });
      }

      let chartId: number | null = null;
      if (ctx.user) {
        try {
          const inputJson = JSON.stringify(engineInput);
          const resultJson = JSON.stringify(result);
          const inserted = await getDb()
            .insert(schema.charts)
            .values({
              userId: ctx.user.id,
              chartType: "qimen",
              title: title ?? "奇门遁甲起局",
              input: inputJson,
              result: resultJson,
              rulesetVersion: result.meta.ruleVariant,
              algorithmVersion: QIMEN_ROUTER_ALGORITHM_VERSION,
            })
            .$returningId();
          chartId = inserted.at(0)?.id ?? null;
          if (chartId !== null) {
            // 每次起局均写入一条版本快照（可追溯、可重放）
            await getDb()
              .insert(schema.chartVersions)
              .values({
                chartId,
                rulesetVersion: result.meta.ruleVariant,
                algorithmVersion: QIMEN_ROUTER_ALGORITHM_VERSION,
                inputSnapshot: inputJson,
                resultSnapshot: resultJson,
              });
          }
        } catch (err) {
          // 落库失败不阻塞起局结果返回，但记录日志便于排查
          console.error("[qimen.qiju] persist failed:", err);
        }
      }

      return { result, chartId, persisted: chartId !== null };
    }),
});
