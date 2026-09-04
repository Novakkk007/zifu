/**
 * 大运人话批注规则（课题 01 吸收 · 师门口径 2026-09-04）
 * 输入命盘+大运干支 → 输出人话标签（自动判定断法，产品层展示，小白可懂）
 * 断法来源：盖头路 / 截脚 / 天克地冲 / 身弱不担财 / 驿马动 / 合绊用神
 */
import type { BaziChartV2 } from '../../bazi-core/types'

export interface DaYunNote {
  /** 人话标签（短） */
  tag: string
  /** 解释（给懂行者） */
  detail: string
  /** 吉凶倾向 */
  tone: '吉' | '平' | '慎'
}

const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
// 五行：木火土金水
const STEM_WX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4] // 甲乙木 丙丁火 戊己土 庚辛金 壬癸水
const BRANCH_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4] // 子水 丑土 寅木 卯木 辰土 巳火 午火 未土 申金 酉金 戌土 亥水
// 生克：0=木 1=火 2=土 3=金 4=水；ke[a]=被a克
const KE = [2, 3, 4, 0, 1] // 木克土 火克金 土克水 金克木 水克火
// 驿马（年支/日支查）：申子辰马在寅、寅午戌马在申、巳酉丑马在亥、亥卯未马在巳
const HORSE: Record<number, number> = {
  8: 2, // 申→寅
  0: 2, // 子→寅
  4: 2, // 辰→寅
  2: 8, // 寅→申
  6: 8, // 午→申
  10: 8, // 戌→申
  5: 11, // 巳→亥
  9: 11, // 酉→亥
  1: 11, // 丑→亥
  11: 5, // 亥→巳
  3: 5, // 卯→巳
  7: 5, // 未→巳
}

/** 身弱粗判（简版：月令克泄日主且帮扶少——用于「身弱不担财」标签） */
function isBodyWeak(chart: BaziChartV2): boolean {
  const dayStem = chart.pillars.day.stem
  const monthBranch = chart.pillars.month.branch
  const ds = STEMS.indexOf(dayStem)
  const mb = BRANCHES.indexOf(monthBranch)
  const dwx = STEM_WX[ds]
  const mwx = BRANCH_WX[mb]
  // 月令克我或泄我 → 弱
  return KE[mwx] === dwx || KE[dwx] === mwx
}

/** 生成某步大运的人话批注 */
export function daYunNotes(chart: BaziChartV2, step: { ganzhi: string }): DaYunNote[] {
  const notes: DaYunNote[] = []
  if (step.ganzhi.length !== 2) return notes
  const stem = step.ganzhi[0]
  const branch = step.ganzhi[1]
  const si = STEMS.indexOf(stem)
  const bi = BRANCHES.indexOf(branch)
  if (si < 0 || bi < 0) return notes
  const swx = STEM_WX[si]
  const bwx = BRANCH_WX[bi]

  // 1. 盖头路：天干克地支（能量打折，前劲不足）
  if (KE[swx] === bwx) {
    notes.push({ tag: '盖头：能量打折，前劲不足', detail: `${stem}克${branch}——天干克地支，本运能量减半，宜稳不宜冲`, tone: '慎' })
  }
  // 2. 截脚：地支克天干（后力难继）
  if (KE[bwx] === swx) {
    notes.push({ tag: '截脚：开头有力，后劲不足', detail: `${branch}克${stem}——地支克天干，本运后段乏力`, tone: '慎' })
  }
  // 3. 天克地冲：大运干支对四柱任一柱（天干克+地支冲同柱成立）
  const clashMap: Record<string, string> = {
    '0': '午', '1': '未', '2': '申', '3': '酉', '4': '戌', '5': '亥', '6': '子', '7': '丑', '8': '寅', '9': '卯', '10': '辰', '11': '巳',
  }
  const pillars = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour]
  for (const pz of pillars) {
    if (!pz) continue
    const ps = STEMS.indexOf(pz.stem)
    const pb = BRANCHES.indexOf(pz.branch)
    if (ps < 0 || pb < 0) continue
    if (KE[swx] === STEM_WX[ps] && clashMap[String(bi)] === pz.branch) {
      notes.push({ tag: '天克地冲：变动之年，宜守不宜动', detail: `${step.ganzhi}天克地冲${pz.ganzhi}——大运与命局相冲，工作、居所、人事多变动`, tone: '慎' })
      break
    }
  }
  // 4. 身弱不担财：身弱逢财星大运（赚得到守不住）——财五行按日主算
  const dayStemIdx = STEMS.indexOf(chart.pillars.day.stem)
  const wealthWxOfDay = [2, 2, 3, 3, 4, 4, 0, 0, 1, 1][dayStemIdx] // 甲乙→土 丙丁→金 戊己→水 庚辛→木 壬癸→火
  if (isBodyWeak(chart) && swx === wealthWxOfDay) {
    notes.push({ tag: '财来难担：赚得到，守不住', detail: '身弱逢财运——财星来而难担，宜落袋为安，忌大投资', tone: '慎' })
  }
  // 5. 驿马动：大运地支为命局驿马（跑动、远行、出差）
  const horseBranches = new Set<number>()
  ;[chart.pillars.year.branch, chart.pillars.day.branch].forEach((b) => {
    const idx = BRANCHES.indexOf(b)
    if (idx >= 0 && HORSE[idx] !== undefined) horseBranches.add(HORSE[idx])
  })
  if (horseBranches.has(bi)) {
    notes.push({ tag: '驿马动：跑动、远行、变动之年', detail: `${branch}为命局驿马——出差、迁移、海外信息之应`, tone: '平' })
  }
  // 6. 用神合绊（简版）：大运天干与日主相合（动中求变）
  const HE: Record<string, string> = { '0': '己', '1': '辛', '2': '癸', '3': '壬', '4': '庚', '5': '甲', '6': '乙', '7': '丙', '8': '丁', '9': '戊' }
  if (HE[String(si)] === chart.pillars.day.stem) {
    notes.push({ tag: '日主被合：心思被牵，取舍之年', detail: `${stem}合日主——本运易有牵绊、合作、取舍`, tone: '平' })
  }
  return notes.slice(0, 3)
}
