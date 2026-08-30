import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as schema from "@db/schema";
import { computeChartV2 } from "@contracts/bazi-core";
import type { BaziChartV2 } from "@contracts/bazi-core";
import {
  analyzeCompatibility,
  HEPAN_ALGORITHM_VERSION,
  HEPAN_RULESET_VERSION,
} from "@contracts/engines/hepan-core";
import type { HepanReport } from "@contracts/engines/hepan-core";
import { wrapResult } from "@contracts/engines/engine-result";
import type { EngineResult, RuleProvenance } from "@contracts/engines/engine-result";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";
import { birthInput } from "./bazi-router";

/** hepan.analyze 返回体 */
export interface HepanAnalyzeResult {
  chartA: BaziChartV2;
  chartB: BaziChartV2;
  compatibility: EngineResult<HepanReport>;
  chartId: number | null;
  persisted: boolean;
}

const HEPAN_PROVENANCE: RuleProvenance[] = [
  {
    ruleId: "hepan.wuxing-complement",
    variant: "紫府公开量化模型 v1（亏缺/盈余覆盖率）",
    source: "《渊海子平》论五行盈亏",
  },
  {
    ruleId: "hepan.daymaster-relation",
    variant: "比和/相生/相制三分类",
    source: "《滴天髓》论日主",
  },
  {
    ruleId: "hepan.zodiac-harmony",
    variant: "年支六合/三合/六冲/刑害分级",
    source: "《三命通会·论合婚》",
  },
  {
    ruleId: "hepan.yongshen-match",
    variant: "扶抑用神双向匹配",
    source: "《穷通宝鉴》扶抑法",
  },
  {
    ruleId: "hepan.cross-relations",
    variant: "逐柱交叉检视 天干五合/六合/三合半合/六冲/刑/害/破",
    source: "《渊海子平》《三命通会》论干支合冲刑害",
  },
];

function isValidSolarDate(year: number, month: number, day: number): boolean {
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

export const hepanRouter = createRouter({
  /**
   * 八字合盘：双盘经 computeChartV2 真实排出，再由 hepan-core 规则化合参。
   * 公开可调；登录后自动落库（chartType 'hepan'，input 存双方生辰）。
   */
  analyze: publicQuery
    .input(
      z.object({
        personA: birthInput,
        personB: birthInput,
        title: z.string().trim().max(64).optional(),
      }),
    )
    .mutation(async ({ input, ctx }): Promise<HepanAnalyzeResult> => {
      const { personA, personB, title } = input;
      const birthA = { ...personA };
      const birthB = { ...personB };
      delete (birthA as { title?: string }).title;
      delete (birthB as { title?: string }).title;

      for (const [who, p] of [
        ["甲方", birthA],
        ["乙方", birthB],
      ] as const) {
        if (p.calendar === "solar" && !isValidSolarDate(p.year, p.month, p.day)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${who}出生日期无效，请检查年月日。`,
          });
        }
      }

      let chartA: BaziChartV2;
      let chartB: BaziChartV2;
      try {
        chartA = computeChartV2(birthA);
        chartB = computeChartV2(birthB);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `无法解析的出生时间：${err instanceof Error ? err.message : String(err)}`,
        });
      }

      const report = analyzeCompatibility(chartA, chartB);
      const compatibility = wrapResult(
        {
          engine: "hepan",
          algorithmVersion: HEPAN_ALGORITHM_VERSION,
          ruleVariant: "子平合婚-公开权重模型",
          precision: "validated",
          warnings: [
            chartA.pillars.hour === null || chartB.pillars.hour === null
              ? "一方时辰未知，时柱不参与跨盘干支交互检视，结论精度下降。"
              : undefined,
          ].filter((w): w is string => Boolean(w)),
          provenance: HEPAN_PROVENANCE,
        },
        report,
      );

      let chartId: number | null = null;
      if (ctx.user) {
        try {
          const inputJson = JSON.stringify({ personA: birthA, personB: birthB });
          const resultJson = JSON.stringify({ compatibility });
          const inserted = await getDb()
            .insert(schema.charts)
            .values({
              userId: ctx.user.id,
              chartType: "hepan",
              title: title ?? "八字合盘",
              input: inputJson,
              result: resultJson,
              rulesetVersion: HEPAN_RULESET_VERSION,
              algorithmVersion: HEPAN_ALGORITHM_VERSION,
            })
            .$returningId();
          chartId = inserted.at(0)?.id ?? null;
          if (chartId !== null) {
            await getDb()
              .insert(schema.chartVersions)
              .values({
                chartId,
                rulesetVersion: HEPAN_RULESET_VERSION,
                algorithmVersion: HEPAN_ALGORITHM_VERSION,
                inputSnapshot: inputJson,
                resultSnapshot: resultJson,
              });
          }
        } catch (err) {
          console.error("[hepan.analyze] persist failed:", err);
        }
      }

      return { chartA, chartB, compatibility, chartId, persisted: chartId !== null };
    }),
});
