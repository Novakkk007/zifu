import type { BirthInput, Wuxing } from '../../bazi-core/types'
import type { HecanArtContribution } from '../hecan-core/types'
import { paipanZiwei, locateZiwei } from './engine'

export * from './types'
export * from './rules'
export { paipanZiwei, locateZiwei }
export type { EngineResult, EngineMeta, Precision, RuleProvenance } from '../engine-result'

/* ---------------- 三术合参协议（hecan-core 动态探测/静态注册均可） ---------------- */

const WUXING_LIST: Wuxing[] = ['金', '木', '水', '火', '土']

/**
 * hecanSynthesize — 三术合参接入协议实现。
 * 输入与 bazi-core 的 BirthInput 对齐；时辰未知时抛错（编排器降级为 unavailable，不伪造）。
 */
export function hecanSynthesize(input: BirthInput): HecanArtContribution {
  if (input.hour === null || input.hour === undefined) {
    throw new Error('时辰未知，紫微斗数无法安命身宫与诸星（需准确时辰）')
  }
  const hourBranch = Math.floor(((input.hour + 1) % 24) / 2)
  const result = paipanZiwei({
    calendar: input.calendar,
    year: input.year,
    month: input.month,
    day: input.day,
    hourBranch,
    gender: input.gender,
    isLeapMonth: input.isLeapMonth,
  })
  const d = result.data
  const juWuxing = WUXING_LIST.find((w) => d.ju.name.startsWith(w)) ?? null
  const mingPalace = d.palaces.find((p) => p.isMing)
  const keyPoints = [
    `${d.genderKind}，五行局：${d.ju.name}`,
    `命宫：${d.mingGongGanzhi}；身宫：${d.shenBranch}；命主：${d.mingZhu}；身主：${d.shenZhu}`,
    mingPalace && mingPalace.majors.length > 0
      ? `命宫主星：${mingPalace.majors.map((s) => s.name + (s.hua ? `化${s.hua}` : '')).join('、')}`
      : '命宫无正曜（借对宫论）',
    `生年四化：${d.sihua.map((s) => `${s.star}化${s.hua}在${s.palaceName}`).join('，')}`,
  ]
  return {
    keyPoints,
    wuxingFocus: juWuxing,
    mingGongBranch: d.mingBranch,
    structureScore: null,
    summary: `紫微看命：${d.ju.name}，命宫在${d.mingBranch}（${d.mingGongGanzhi}），命主${d.mingZhu}。`,
    precision: result.meta.precision,
    ruleVariant: result.meta.ruleVariant,
    provenance: result.meta.provenance,
  }
}
