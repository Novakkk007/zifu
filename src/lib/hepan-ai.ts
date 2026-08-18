import type { BaziChartV2, Wuxing } from '@contracts/bazi-core'
import { analyzeCompatibility, type CrossRelation } from '@contracts/engines/hepan-core'

const WUXING_ORDER: Wuxing[] = ['木', '火', '土', '金', '水']
const HARMONY_TYPES = new Set<CrossRelation['type']>(['天干五合', '六合', '三合'])

function formatWuxing(chart: BaziChartV2): string {
  const distribution = WUXING_ORDER.map(wuxing => `${wuxing}${chart.wuxing.count[wuxing].toFixed(1)}`).join('、')
  const missing = chart.wuxing.missing.length > 0 ? chart.wuxing.missing.join('、') : '无明显缺项'
  return `${distribution}；最旺${chart.wuxing.strongest}，最弱${chart.wuxing.weakest}，缺项：${missing}`
}

function formatRelations(relations: CrossRelation[], harmony: boolean): string {
  const selected = relations.filter(relation => HARMONY_TYPES.has(relation.type) === harmony)
  if (selected.length === 0) return harmony ? '未见显著合会，宜从日常节奏中体察默契' : '未见显著冲刑害破'
  return selected
    .slice(0, 8)
    .map(
      relation =>
        `${relation.type}${relation.chars}（${relation.positions}${relation.resultWuxing ? `，取${relation.resultWuxing}意` : ''}）`,
    )
    .join('；')
}

/**
 * 双盘引擎结果 → AI 合盘参详摘要。
 * 只提供盘面事实与传统关系，不在摘要层给出关系成败判断。
 */
export function buildHepanSummary(chartA: BaziChartV2, chartB: BaziChartV2): string {
  const report = analyzeCompatibility(chartA, chartB)
  const complement = report.dimensions.find(dimension => dimension.key === 'wuxingComplement')
  const yongshen = report.dimensions.find(dimension => dimension.key === 'yongshenMatch')

  return [
    `双盘日主：甲方${chartA.dayMaster}（${chartA.dayMasterWuxing}），乙方${chartB.dayMaster}（${chartB.dayMasterWuxing}）`,
    `日主五行关系：${report.dayMasterRelation}`,
    `甲方五行分布：${formatWuxing(chartA)}`,
    `乙方五行分布：${formatWuxing(chartB)}`,
    `年支关系：甲方${chartA.pillars.year.branch}、乙方${chartB.pillars.year.branch}，取${report.zodiacRelation}意`,
    `相合点：${formatRelations(report.crossRelations, true)}`,
    `相冲与磨合点：${formatRelations(report.crossRelations, false)}`,
    `五行互补线索：${complement?.findings.join('；') ?? '暂无明确线索'}`,
    `喜用互补线索：${yongshen?.findings.join('；') ?? '暂无明确线索'}`,
  ].join('\n')
}

/** 合盘专用先生提示词：把判断重心放在气质、互动与经营，不作关系裁决。 */
export function buildHepanReadingPrompt(summary: string): string {
  return (
    '你是紫府的先生，正与两位访客喝茶讲合盘。请依据双盘摘要，以温和、通透、有分寸的先生口吻讲述。\n\n' +
    '讲述方法：\n' +
    '- 先用一两句说清两人的日主五行气质与互动主线。可以用山水、灯火、四时等家常比喻，例如火水相见，可讲“看似相制，也有相济的一面——火暖水润，各补所缺”，但须服从实际盘面。\n' +
    '- 再择要讲相合点、相冲或磨合点、五行互补点；每处磨合之后都给一条可落实的相处提醒。不要逐项复述数据，不报分数。\n' +
    '- 结尾自然落在这句话：“合盘看气质互补，相处看经营。”并把选择与行动交还给两位访客。\n\n' +
    '合规边界（不可违背）：\n' +
    '- 只作传统文化参详，不评判婚姻吉凶，不回答“配不配”，不预测关系结局。\n' +
    '- 不劝分、不劝合，不替任何一方作决定；不把合、冲、刑、害说成现实事件的必然因果。\n' +
    '- 不给医疗、法律、财务或心理诊断建议，不编造古籍原文。\n' +
    '- 纯文字讲述，不用 Markdown 标题、加粗或列表。\n\n' +
    `双盘摘要（幕后依据，不照表宣读）：\n${summary}`
  )
}
