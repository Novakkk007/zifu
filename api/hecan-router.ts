import { TRPCError } from "@trpc/server";
import * as schema from "@db/schema";
import type { BaziChartV2 } from "@contracts/bazi-core";
import {
  synthesizeHecan,
  HECAN_ALGORITHM_VERSION,
  HECAN_RULESET_VERSION,
} from "@contracts/engines/hecan-core";
import type { HecanReport, HecanEngineLoader } from "@contracts/engines/hecan-core";
import { hecanSynthesize as ziweiSynthesize } from "@contracts/engines/ziwei-core";
import { hecanSynthesize as qizhengSynthesize } from "@contracts/engines/qizheng-core";
import { wrapResult } from "@contracts/engines/engine-result";
import type { EngineResult } from "@contracts/engines/engine-result";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";
import { birthInput } from "./bazi-router";

/** hecan.analyze 返回体 */
export interface HecanAnalyzeResult {
  /** 合参报告（含每术 precision 状态：validated/approximate/demo/unavailable） */
  result: EngineResult<HecanReport>;
  /** 八字盘（合参必起，供前台展示四柱） */
  chart: BaziChartV2;
  chartId: number | null;
  persisted: boolean;
}

function isValidSolarDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

export const hecanRouter = createRouter({
  /**
   * 三术合参：编排 bazi-core（真实）+ 动态探测 ziwei/qizheng 引擎，
   * 缺失的术以 unavailable 状态块明示，不伪造。登录后落库（chartType 'hecan'）。
   */
  analyze: publicQuery
    .input(birthInput)
    .mutation(async ({ input, ctx }): Promise<HecanAnalyzeResult> => {
      const birth = { ...input };
      delete (birth as { title?: string }).title;

      if (birth.calendar === "solar" && !isValidSolarDate(birth.year, birth.month, birth.day)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "无效的日期，请检查年月日。",
        });
      }

      let synthesis: Awaited<ReturnType<typeof synthesizeHecan>>;
      try {
        synthesis = await synthesizeHecan(birth);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `无法解析的出生时间：${err instanceof Error ? err.message : String(err)}`,
        });
      }

      const result = wrapResult(
        {
          engine: "hecan",
          algorithmVersion: HECAN_ALGORITHM_VERSION,
          ruleVariant: "三术合参-互证分档模型",
          // 合参整体精度：全部可用术均 validated 才标 validated，否则 approximate
          precision: synthesis.report.arts.every(
            (a) => a.precision === "unavailable" || a.precision === "validated",
          )
            ? "validated"
            : "approximate",
          warnings: synthesis.warnings,
          provenance: synthesis.provenance,
        },
        synthesis.report,
      );

      let chartId: number | null = null;
      if (ctx.user) {
        try {
          const inputJson = JSON.stringify(birth);
          const resultJson = JSON.stringify({ result });
          const inserted = await getDb()
            .insert(schema.charts)
            .values({
              userId: ctx.user.id,
              chartType: "hecan",
              title: input.title ?? "三术合参",
              input: inputJson,
              result: resultJson,
              rulesetVersion: HECAN_RULESET_VERSION,
              algorithmVersion: HECAN_ALGORITHM_VERSION,
            })
            .$returningId();
          chartId = inserted.at(0)?.id ?? null;
          if (chartId !== null) {
            await getDb()
              .insert(schema.chartVersions)
              .values({
                chartId,
                rulesetVersion: HECAN_RULESET_VERSION,
                algorithmVersion: HECAN_ALGORITHM_VERSION,
                inputSnapshot: inputJson,
                resultSnapshot: resultJson,
              });
          }
        } catch (err) {
          console.error("[hecan.analyze] persist failed:", err);
        }
      }

      return {
        result,
        chart: synthesis.chart,
        chartId,
        persisted: chartId !== null,
      };
    }),
});
