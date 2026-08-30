/**
 * 浏览器直跑引擎适配层 · 拆分自 client.ts（V12 拆 chunk，路由级按需加载）。
 * 等价性由 api/browser-client-parity.test.ts 守护。
 */

import { z } from 'zod'
import { computeChartV2 } from '@contracts/bazi-core'
import type { BaziChartV2 } from '@contracts/bazi-core'
import { analyzeCompatibility, HEPAN_ALGORITHM_VERSION } from '@contracts/engines/hepan-core'
import type { HepanReport } from '@contracts/engines/hepan-core'
import { wrapResult } from '@contracts/engines/engine-result'
import type { EngineResult, RuleProvenance } from '@contracts/engines/engine-result'
import { isValidSolarDate, parseWith, engineCall } from './shared'
import { birthInputSchema, type BirthPayload } from './bazi'

/* 八字合盘（api/hepan-router.ts analyze）                               */
/* ------------------------------------------------------------------ */

/** 与 api/hepan-router.ts HEPAN_PROVENANCE 一致（静态数据镜像） */
const HEPAN_PROVENANCE: RuleProvenance[] = [
  {
    ruleId: 'hepan.wuxing-complement',
    variant: '紫府公开量化模型 v1（亏缺/盈余覆盖率）',
    source: '《渊海子平》论五行盈亏',
  },
  {
    ruleId: 'hepan.daymaster-relation',
    variant: '比和/相生/相制三分类',
    source: '《滴天髓》论日主',
  },
  {
    ruleId: 'hepan.zodiac-harmony',
    variant: '年支六合/三合/六冲/刑害分级',
    source: '《三命通会·论合婚》',
  },
  {
    ruleId: 'hepan.yongshen-match',
    variant: '扶抑用神双向匹配',
    source: '《穷通宝鉴》扶抑法',
  },
  {
    ruleId: 'hepan.cross-relations',
    variant: '逐柱交叉检视 天干五合/六合/三合半合/六冲/刑/害/破',
    source: '《渊海子平》《三命通会》论干支合冲刑害',
  },
]

export interface HepanAnalyzePayload {
  personA: BirthPayload
  personB: BirthPayload
  title?: string
}

export interface HepanAnalyzeResponse {
  chartA: BaziChartV2
  chartB: BaziChartV2
  compatibility: EngineResult<HepanReport>
  chartId: number | null
  persisted: boolean
}

export function analyzeHepan(payload: HepanAnalyzePayload): HepanAnalyzeResponse {
  const input = parseWith(
    z.object({
      personA: birthInputSchema,
      personB: birthInputSchema,
      title: z.string().trim().max(64).optional(),
    }),
    payload,
  )
  const birthA = { ...input.personA }
  const birthB = { ...input.personB }
  delete (birthA as { title?: string }).title
  delete (birthB as { title?: string }).title

  for (const [who, p] of [
    ['甲方', birthA],
    ['乙方', birthB],
  ] as const) {
    if (p.calendar === 'solar' && !isValidSolarDate(p.year, p.month, p.day)) {
      throw new Error(`${who}出生日期无效，请检查年月日。`)
    }
  }

  const { chartA, chartB } = engineCall('无法解析的出生时间', () => ({
    chartA: computeChartV2(birthA),
    chartB: computeChartV2(birthB),
  }))

  const report = analyzeCompatibility(chartA, chartB)
  const compatibility = wrapResult(
    {
      engine: 'hepan',
      algorithmVersion: HEPAN_ALGORITHM_VERSION,
      ruleVariant: '子平合婚-公开权重模型',
      precision: 'validated',
      warnings: [
        chartA.pillars.hour === null || chartB.pillars.hour === null
          ? '一方时辰未知，时柱不参与跨盘干支交互检视，结论精度下降。'
          : undefined,
      ].filter((w): w is string => Boolean(w)),
      provenance: HEPAN_PROVENANCE,
    },
    report,
  )

  return { chartA, chartB, compatibility, chartId: null, persisted: false }
}

/* ------------------------------------------------------------------ */
