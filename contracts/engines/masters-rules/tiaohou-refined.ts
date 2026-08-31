/**
 * 穷通宝鉴调候参考层（10 干 × 12 月令）
 * 依据：公版《穷通宝鉴》（清·余春台），逐干逐月次序经 Brhiza/mingyu（packages/core MIT）交叉校验，
 * 来源 docs/absorbed/qiong-tong-tiaohou/（吸收轮 2026-08-31）。
 * 此为 AI 参详参考层（先生提示词用），非运行契约；与 tiaohou.ts 分歧见吸收 SOURCE.md「口径状态」。
 * 「待复核」= 源数据该月以判局/透干为条件，不宜简化为单值次序。
 */
export interface TiaohouRefinedEntry {
  /** 首要用神次序（如「火>水」）；null = 待复核 */
  order: string | null
  /** 要点（穷通宝鉴口径短句） */
  note: string
}

export const STEMS10 = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCHES12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

/** [日干 idx][月支 idx]（地支按子0丑1寅2…亥11） */
export const TIAOHOU_REFINED: TiaohouRefinedEntry[][] = [
  // 甲木
  [
    { order: '火>水', note: '先丙后癸' }, // 子
    { order: '火>水', note: '先丙后癸' }, // 丑
    { order: '火>水', note: '先丙后癸，温扶兼滋养' }, // 寅
    { order: '火>水', note: '先丙后癸' }, // 卯
    { order: '金>水', note: '先取庚金裁木成器' }, // 辰
    { order: '水>火>金', note: '先癸后丁，庚金佐助' }, // 巳
    { order: '水>火>金', note: '先癸后丁，庚金次辅' }, // 午
    { order: '火>金>水', note: '先丁后庚，癸水酌用' }, // 未
    { order: '火>水', note: '先丙后癸' }, // 申
    { order: '火>金', note: '先取丁火制金暖木' }, // 酉
    { order: '火>水', note: '先丙后癸' }, // 戌
    { order: '火>水', note: '先丙后癸' }, // 亥
  ],
  // 乙木
  [
    { order: '火>水', note: '先丙后癸' }, // 子
    { order: '火', note: '专取丙火' }, // 丑
    { order: '火>水', note: '先丙后癸' }, // 寅
    { order: '火>水', note: '丙为君，癸为臣' }, // 卯
    { order: '水>火', note: '先癸后丙' }, // 辰
    { order: '水>火', note: '先癸后丙' }, // 巳
    { order: '火>水', note: '午月下半月丙癸齐用' }, // 午
    { order: '水>火', note: '先癸后丙' }, // 未
    { order: '火>水', note: '先丙后癸' }, // 申
    { order: null, note: '特例未采，待复核' }, // 酉
    { order: '火>水', note: '先丙后癸' }, // 戌
    { order: '火>水', note: '先丙后癸' }, // 亥
  ],
  // 丙火
  [
    { order: '水>土', note: '壬水为尊，戊土为佐' }, // 子
    { order: '水>土', note: '壬水为尊，戊土为佐' }, // 丑
    { order: null, note: '特例未采，待复核' }, // 寅
    { order: '土>水', note: '无壬透可姑用己土' }, // 卯
    { order: null, note: '特例未采，待复核' }, // 辰
    { order: null, note: '特例未采，待复核' }, // 巳
    { order: '水>金', note: '丁壬同透多因化合降层' }, // 午
    { order: '水>金', note: '庚壬两透不杂戊己可至科甲' }, // 未
    { order: '水>金', note: '先壬后辛' }, // 申
    { order: null, note: '特例未采，待复核' }, // 酉
    { order: null, note: '特例未采，待复核' }, // 戌
    { order: '水>土', note: '壬水为尊，戊土为佐' }, // 亥
  ],
  // 丁火
  [
    { order: '木>金', note: '甲木为尊，庚金佐之' }, // 子
    { order: '木>金', note: '甲木为尊，庚金佐之' }, // 丑
    { order: '木>火', note: '先丙后甲' }, // 寅
    { order: '金>木', note: '庚乙俱透多主贪合贫困' }, // 卯
    { order: '金>木', note: '先庚后甲' }, // 辰
    { order: '金>木', note: '先庚后甲' }, // 巳
    { order: '水>金', note: '庚壬两透无土制主科甲' }, // 午
    { order: '金>木', note: '先庚后甲' }, // 未
    { order: '金>木', note: '先庚后甲' }, // 申
    { order: null, note: '特例未采，待复核' }, // 酉
    { order: '金>木', note: '先庚后甲' }, // 戌
    { order: '金>木', note: '先庚后甲' }, // 亥
  ],
  // 戊土
  [
    { order: '火>木', note: '先丙后甲' }, // 子
    { order: '火>木', note: '先丙后甲' }, // 丑
    { order: '火>木', note: '先丙后甲' }, // 寅
    { order: '火>木', note: '先丙后甲' }, // 卯
    { order: null, note: '特例未采，待复核' }, // 辰
    { order: '水>木', note: '先壬后甲' }, // 巳
    { order: '水>木', note: '先壬后甲' }, // 午
    { order: '水>火>木', note: '先看癸水，次用丙火甲木' }, // 未
    { order: '火>水>木', note: '丙癸甲全透可至富贵极品' }, // 申
    { order: null, note: '特例未采，待复核' }, // 酉
    { order: '木>火>水', note: '先甲疏土，次用丙火癸水' }, // 戌
    { order: '火>木', note: '先丙后甲' }, // 亥
  ],
  // 己土
  [
    { order: '火>木', note: '先丙后甲' }, // 子
    { order: '火>木', note: '先丙后甲' }, // 丑
    { order: '火>木', note: '先丙后甲' }, // 寅
    { order: '火>木', note: '先丙后甲' }, // 卯
    { order: '火>木', note: '先丙后甲' }, // 辰
    { order: '水>火', note: '先癸后丙' }, // 巳
    { order: '水>火', note: '先癸后丙' }, // 午
    { order: null, note: '特例未采，待复核' }, // 未
    { order: '火>木', note: '先丙后甲' }, // 申
    { order: '水>火', note: '先癸后丙' }, // 酉
    { order: '火>木', note: '先丙后甲' }, // 戌
    { order: '火>木', note: '先丙后甲' }, // 亥
  ],
  // 庚金
  [
    { order: '火>木', note: '丙丁甲全透富贵极品' }, // 子
    { order: '火>木', note: '先丁后甲' }, // 丑
    { order: '火>木', note: '丁火为君，甲木为臣，丙火为佐' }, // 寅
    { order: '火>木', note: '丙丁并用两透富贵' }, // 卯
    { order: '木>火', note: '先甲疏土后丙暖金，甲丙两透科甲' }, // 辰
    { order: '火>木>水', note: '先丙后甲' }, // 巳
    { order: '水>火>木', note: '丙壬甲全透富贵双全' }, // 午
    { order: '水>火>木', note: '甲丙癸全透鼎甲可期' }, // 未
    { order: '火>木', note: '先丁次甲，丙火佐' }, // 申
    { order: '火>木', note: '先丁次甲' }, // 酉
    { order: '火>木>水', note: '先丁后甲壬' }, // 戌
    { order: '火>木', note: '先丁后甲' }, // 亥
  ],
  // 辛金
  [
    { order: '火>水', note: '壬丙两透不见戊癸主衣锦腰金' }, // 子
    { order: '火>水', note: '丙壬两透可作金马玉堂之客' }, // 丑
    { order: '土>水>金', note: '己壬两透支见庚制甲主科甲' }, // 寅
    { order: '水>木', note: '壬甲两透主贵显' }, // 卯
    { order: null, note: '特例未采，待复核' }, // 辰
    { order: null, note: '特例未采，待复核' }, // 巳
    { order: '水>土', note: '支成火局得壬透破火' }, // 午
    { order: null, note: '特例未采，待复核' }, // 未
    { order: '木>土>水', note: '不见壬时退取甲戊' }, // 申
    { order: null, note: '特例未采，待复核' }, // 酉
    { order: '水>木', note: '壬透甲藏又见戊只作平人' }, // 戌
    { order: '水>火', note: '壬丙两透主金榜题名' }, // 亥
  ],
  // 壬水
  [
    { order: '土>火', note: '戊土止流，丙火暖局，戊丙两透富贵' }, // 子
    { order: '火', note: '小寒后专用丙火' }, // 丑
    { order: '金>火>土', note: '先庚次丙，再酌戊土' }, // 寅
    { order: '火>木', note: '丙甲两透主雁塔有名' }, // 卯
    { order: '木>金', note: '甲先庚后，甲庚两透科甲' }, // 辰
    { order: '水>金', note: '先取比肩扶助元神' }, // 巳
    { order: '水>金', note: '取癸为用，庚金为佐' }, // 午
    { order: '金>木>水', note: '先辛后甲，癸水次辅' }, // 未
    { order: '土>火', note: '专用戊土，丁火为佐' }, // 申
    { order: '木>金', note: '先取甲木制土清源' }, // 酉
    { order: '火>木', note: '先丙后甲' }, // 戌
    { order: '土>火', note: '戊土为堤，丙火佐暖，戊丙两透富贵' }, // 亥
  ],
  // 癸水
  [
    { order: '火>金', note: '先丙解冻再取辛金滋扶' }, // 子
    { order: '火>土', note: '支成水局无丙火主劳苦奔波' }, // 丑
    { order: '金>火', note: '辛金为主，丙火次之' }, // 寅
    { order: '金>火', note: '先取庚辛发源护身' }, // 卯
    { order: '火', note: '清明后专用丙火调和' }, // 辰
    { order: '火>金', note: '先丙后辛' }, // 巳
    { order: '水>金', note: '支成炎局无壬出干主僧道之流' }, // 午
    { order: null, note: '特例未采，待复核' }, // 未
    { order: '火>金', note: '先丙后辛' }, // 申
    { order: '金>火', note: '辛金为用，丙火佐之' }, // 酉
    { order: '火>金', note: '先丙后辛' }, // 戌
    { order: '火>金', note: '先丙后辛' }, // 亥
  ],
]

/** 查调候参考（日干 0-9，月支 0-11 子=0）；越界返回 null */
export function tiaohouRefinedOf(dayStemIdx: number, monthBranchIdx: number): TiaohouRefinedEntry | null {
  const row = TIAOHOU_REFINED[dayStemIdx]
  if (!row) return null
  return row[monthBranchIdx] ?? null
}
