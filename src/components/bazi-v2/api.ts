/**
 * /bazi v2 · 服务端契约边界。
 * 后端 api/bazi-router.ts 的 paipan 接受完整 BirthInput（+可选 title），
 * 返回 { chart, chartId, persisted }，chart 为 BaziChartV2。
 * 此处集中类型断言，页面其余部分一律使用本模块类型。
 */
import type { BaziChartV2, BirthInput, PillarInfo } from '@contracts/bazi-core'
import { STRENGTH_DISCLAIMER } from '@contracts/bazi-core'

/** 排盘请求载荷（完整 BirthInput + 可选存档标题） */
export interface PaipanPayload extends BirthInput {
  title?: string
}

/** 排盘响应契约 */
export interface PaipanResponse {
  chart: BaziChartV2
  chartId: number | null
  persisted: boolean
}

/** AI 详批响应契约（api/ai-router.ts reading，输出不变） */
export interface ReadingResponse {
  text: string
  source: 'live' | 'fallback'
  model: string | null
  promptTokens?: number | null
  completionTokens?: number | null
  latencyMs?: number | null
}

/** AI 详批请求契约（v6：鉴权 + chartId，服务端从落库命盘构建摘要） */
export interface ReadingPayload {
  chartId: number
  persona: 'scholar' | 'hermit'
  depth: 'pro' | 'plain'
  idempotencyKey?: string
}

/**
 * 由 chart 构建 AI 详批 chartSummary：
 * 只含推演结果（四柱/日主/旺衰/用神/主要神煞），不含生辰原始数据。
 */
export function buildChartSummary(chart: BaziChartV2): string {
  const ps: PillarInfo[] = [
    chart.pillars.year,
    chart.pillars.month,
    chart.pillars.day,
    chart.pillars.hour,
  ].filter((p): p is PillarInfo => p !== null)
  const pillarText = ps
    .map((p) => `${p.label}${p.ganzhi}（${p.stemTenGod}，藏干：${p.hiddenStems.map((h) => `${h.stem}${h.tenGod}`).join('、')}）`)
    .join('；')
  const countText = (['金', '木', '水', '火', '土'] as const)
    .map((w) => `${w}${chart.wuxing.count[w].toFixed(2)}`)
    .join(' ')
  // 神煞 v2：逐柱一条记录，按名称归组后列出全部命中柱位
  const byName = new Map<string, string[]>()
  for (const s of chart.shensha) {
    const list = byName.get(s.name) ?? []
    list.push(`${s.pillar}（${s.char}）`)
    byName.set(s.name, list)
  }
  const shenshaText =
    byName.size > 0
      ? [...byName.entries()].map(([name, hits]) => `${name}（命中：${hits.join('、')}）`).join('；')
      : '未命中注册表内神煞'
  const currentDayun = chart.dayun.steps.find((s) => s.isCurrent)
  return [
    `四柱：${pillarText}${chart.pillars.hour === null ? '（时辰不详，时柱未排）' : ''}`,
    `日主：${chart.dayMaster}${chart.dayMasterWuxing}，阴阳${chart.pillars.day.stemYinYang}`,
    `五行计数：${countText}${chart.wuxing.missing.length > 0 ? `；缺${chart.wuxing.missing.join('、')}` : '；五行俱全'}`,
    `旺衰：${chart.wuxing.strength.grade}（总分${chart.wuxing.strength.total}，得令${chart.wuxing.strength.deling}/得地${chart.wuxing.strength.dedi}/得势${chart.wuxing.strength.deshi}；${STRENGTH_DISCLAIMER}）`,
    `用神：${chart.yongshen.yongshen}；喜神：${chart.yongshen.xishen.join('、') || '无'}；忌神：${chart.yongshen.jishen.join('、') || '无'}`,
    `神煞：${shenshaText}`,
    `大运：${chart.dayun.forward ? '顺排' : '逆排'}，${chart.dayun.startAge}岁起运${
      currentDayun ? `，现行${currentDayun.ganzhi}运（${currentDayun.startAge}–${currentDayun.endAge}岁）` : ''
    }`,
    `规则版本：${chart.rulesetVersion}`,
  ].join('\n')
}
