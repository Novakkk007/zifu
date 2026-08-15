/**
 * 浏览器直跑引擎适配层 · 拆分自 client.ts（V12 拆 chunk，路由级按需加载）。
 * 等价性由 api/browser-client-parity.test.ts 守护。
 */

import type { BaziChartV2 } from '@contracts/bazi-core'
import { hecanSynthesize as ziweiSynthesize } from '@contracts/engines/ziwei-core'
import { hecanSynthesize as qizhengSynthesize } from '@contracts/engines/qizheng-core'
import { synthesizeHecan, HECAN_ALGORITHM_VERSION } from '@contracts/engines/hecan-core'
import type { HecanEngineLoader, HecanReport } from '@contracts/engines/hecan-core'
import { wrapResult } from '@contracts/engines/engine-result'
import type { EngineResult } from '@contracts/engines/engine-result'
import { isValidSolarDate, parseWith } from './shared'
import { birthInputSchema, type BirthPayload } from './bazi'

/* 三术合参（api/hecan-router.ts analyze）                               */
/* ------------------------------------------------------------------ */

export interface HecanAnalyzeResponse {
  result: EngineResult<HecanReport>
  chart: BaziChartV2
  chartId: number | null
  persisted: boolean
}

export async function analyzeHecan(payload: BirthPayload): Promise<HecanAnalyzeResponse> {
  const input = parseWith(birthInputSchema, payload)
  const birth = { ...input }
  delete (birth as { title?: string }).title

  if (birth.calendar === 'solar' && !isValidSolarDate(birth.year, birth.month, birth.day)) {
    throw new Error('无效的日期，请检查年月日。')
  }

  const synthesis = await (async () => {
    try {
      // 静态注册 loader（与路由一致）：ziwei/qizheng 引擎均在本仓库内
      const staticLoader: HecanEngineLoader = async (art) =>
        art === 'ziwei'
          ? { hecanSynthesize: ziweiSynthesize }
          : { hecanSynthesize: qizhengSynthesize }
      return await synthesizeHecan(birth, { loadEngine: staticLoader })
    } catch (err) {
      throw new Error(`无法解析的出生时间：${err instanceof Error ? err.message : String(err)}`)
    }
  })()

  const result = wrapResult(
    {
      engine: 'hecan',
      algorithmVersion: HECAN_ALGORITHM_VERSION,
      ruleVariant: '三术合参-互证分档模型',
      precision: synthesis.report.arts.every(
        (a) => a.precision === 'unavailable' || a.precision === 'validated',
      )
        ? 'validated'
        : 'approximate',
      warnings: synthesis.warnings,
      provenance: synthesis.provenance,
    },
    synthesis.report,
  )

  return { result, chart: synthesis.chart, chartId: null, persisted: false }
}

/* ------------------------------------------------------------------ */
