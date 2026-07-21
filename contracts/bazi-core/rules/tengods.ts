/**
 * 规则数据 · 十神
 * 推导规则：以日主为体，按五行生克与阴阳同异定十神（传统公共规则）。
 * 释义文案为本库原创撰写；经典概念以短句标注出处。
 */
import { STEM_WUXING, WUXING_KE, WUXING_SHENG } from './stems-branches'

export const RULE_META = {
  name: '十神推导规则',
  source: '《子平真诠》论十神生克大义（传统公共文献，概念标注）',
} as const

export type TenGod =
  | '比肩' | '劫财' | '食神' | '伤官' | '偏财'
  | '正财' | '七杀' | '正官' | '偏印' | '正印'

/** 十神判定：以日主为体，看目标天干（同为比肩/劫财，我生为食伤，我克为财，克我为官杀，生我为印） */
export function tenGod(dayStemIdx: number, targetStemIdx: number): TenGod {
  const me = STEM_WUXING[dayStemIdx]
  const other = STEM_WUXING[targetStemIdx]
  const sameYY = dayStemIdx % 2 === targetStemIdx % 2
  if (other === me) return sameYY ? '比肩' : '劫财'
  if (WUXING_SHENG[me] === other) return sameYY ? '食神' : '伤官'
  if (WUXING_KE[me] === other) return sameYY ? '偏财' : '正财'
  if (WUXING_KE[other] === me) return sameYY ? '七杀' : '正官'
  return sameYY ? '偏印' : '正印'
}

/** 十神传统释义（原创文案，概念出处以短注标明） */
export const TEN_GOD_INFO: Record<TenGod, { short: string; meaning: string; source: string }> = {
  比肩: {
    short: '比',
    meaning: '与日主同气同性的帮扶之力，主自立、同辈与竞争，身弱得之有助，身强再见则易分夺。',
    source: '概念见《子平真诠》论比劫',
  },
  劫财: {
    short: '劫',
    meaning: '与日主同气异性的争夺之力，主魄力与破耗并存，能助人亦易分夺财源。',
    source: '概念见《子平真诠》论比劫',
  },
  食神: {
    short: '食',
    meaning: '日主同性所生之气，主才华、口福与温和的表达，传统视为泄秀生财的吉神。',
    source: '概念见《滴天髓》论泄秀',
  },
  伤官: {
    short: '伤',
    meaning: '日主异性所生之气，主聪明锋芒与创造力，但易与官星相抗，须配印制化。',
    source: '概念见《子平真诠》论伤官',
  },
  偏财: {
    short: '才',
    meaning: '日主同性所克之气，主流动之财、人缘与经营之机，性活泼而不拘。',
    source: '概念见《子平真诠》论财',
  },
  正财: {
    short: '财',
    meaning: '日主异性所克之气，主稳定之财与务实的经营态度，亦主男命的妻星。',
    source: '概念见《子平真诠》论财',
  },
  七杀: {
    short: '杀',
    meaning: '同性克日主之气，主压力、权威与进取，有制化为权，无制则易为祸患。',
    source: '概念见《子平真诠》论七杀',
  },
  正官: {
    short: '官',
    meaning: '异性克日主之气，主规矩、名位与责任，传统视为立身贵气的正神。',
    source: '概念见《子平真诠》论正官',
  },
  偏印: {
    short: '枭',
    meaning: '同性生日主之气，主偏门学问与悟性，过旺则夺食，传统称枭神。',
    source: '概念见《子平真诠》论印',
  },
  正印: {
    short: '印',
    meaning: '异性生日主之气，主学业、庇护与涵养，为扶身化杀的正神。',
    source: '概念见《子平真诠》论印',
  },
}
