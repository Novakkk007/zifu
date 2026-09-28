/**
 * 引文依据分流规则（课题13b 复核缺口 → 规则化）
 *
 * 缺口（课题13b §4 出处核验）：引擎 provenance 的 source 字段混装两类内容——
 *   (a) 公版原文的逐字照录；
 *   (b) 算法约定 / 现代自述（原书未必有此表述）。
 * 二者合写在一句 source 里，回查公版原文只能得到「前缀命中」，无法判定引文漂移。
 *
 * 固化为规则（可机器校验）：
 *   R1 每条 provenance 必须显式标注 basis（原文 / 约定 / 混合），不得留空。
 *   R2 basis 含「原文」→ 必须给 quote（逐字照录，供与公版语料对拍）。
 *   R3 basis 含「约定」→ 必须给 convention，且 source 不得使读者以为该句出自原书。
 *   R4 notes 与 provenance 必须一一对应（exhaustive）：有规则无注、有注无规则都报错。
 *   R5 原文字序差异与讹字一律进 ERRATA 校勘记，禁止静默改字；改字必须留痕可溯。
 *
 * 金标语料：F:/紫府文件/tasks/课题13-大六壬公版典籍文本v1.txt（清洗本 课题13-cleaned/）
 */

export type CitationBasis = '原文' | '约定' | '混合'

export interface CitationNote {
  ruleId: string
  basis: CitationBasis
  /** basis 含「原文」时必填：逐字照录的原文句 */
  quote?: string
  /** basis 含「约定」时必填：算法约定 / 自述说明 */
  convention?: string
}

export interface Erratum {
  id: string
  /** 公版（或标点本）原字 */
  raw: string
  /** 校订字 */
  corrected: string
  /** 校勘依据 */
  basis: string
  /** 引擎是否已按校订字取值（false = 仅校记，源码仍用原字且有注释说明） */
  applied: boolean
}

export interface CitationNoteCheck {
  missingBasis: string[]
  quoteMissing: string[]
  conventionMissing: string[]
  notesWithoutRule: string[]
  rulesWithoutNote: string[]
}

/** 校验 R1–R4；返回违例清单（空数组 = 全合规） */
export function checkCitationNotes(
  entries: Array<{ ruleId: string }>,
  notes: CitationNote[],
): CitationNoteCheck {
  const ruleIds = entries.map((e) => e.ruleId)
  const noteIds = notes.map((n) => n.ruleId)
  return {
    missingBasis: notes.filter((n) => !n.basis).map((n) => n.ruleId),
    quoteMissing: notes
      .filter((n) => (n.basis === '原文' || n.basis === '混合') && !n.quote?.trim())
      .map((n) => n.ruleId),
    conventionMissing: notes
      .filter((n) => (n.basis === '约定' || n.basis === '混合') && !n.convention?.trim())
      .map((n) => n.ruleId),
    notesWithoutRule: noteIds.filter((id) => !ruleIds.includes(id)),
    rulesWithoutNote: ruleIds.filter((id) => !noteIds.includes(id)),
  }
}

/**
 * 把依据分流注入 provenance（纯数据合并，零算法改动）。
 * 任一违例即抛错——引文依据不全就构筑失败，不允许「先混着用」。
 */
export function applyCitationNotes<T extends { ruleId: string }>(
  entries: T[],
  notes: CitationNote[] = LIREN_CITATION_NOTES,
): Array<T & { basis: CitationBasis; quote?: string; convention?: string }> {
  const check = checkCitationNotes(entries, notes)
  const bad = Object.entries(check).filter(([, v]) => v.length > 0)
  if (bad.length) {
    throw new Error(
      `引文依据分流不合规：${bad.map(([k, v]) => `${k}=[${v.join(',')}]`).join(' ')}`,
    )
  }
  const byId = new Map(notes.map((n) => [n.ruleId, n]))
  return entries.map((e) => {
    const n = byId.get(e.ruleId)!
    return { ...e, basis: n.basis, quote: n.quote, convention: n.convention }
  })
}

/** 大六壬依据分流表（对应 daliuren-core PROVENANCE 六条规则） */
export const LIREN_CITATION_NOTES: CitationNote[] = [
  {
    ruleId: 'daliuren.yuejiang.zhongqi',
    basis: '混合',
    quote:
      '卷二神将释十二支神释名「神后、大吉、功曹、太冲、天罡、太乙、胜光、小吉、传送、从魁、河魁、登明」（月将名之出处）',
    convention:
      '「中气换将」（雨水后用亥将登明……大寒后用子将神后）为算法约定，原书无此直述句；原文仅云「以月将加于正时」。不得作为《六壬大全》引文引用。',
  },
  {
    ruleId: 'daliuren.tiandipan.jiashi',
    basis: '混合',
    quote: '《六壬大全》卷四：「以月将加于正时」',
    convention: '「顺布十二辰成天盘」为盘法自述（由原文加时之法推得），非原文成句。',
  },
  {
    ruleId: 'daliuren.sike.jigong',
    basis: '混合',
    quote:
      '卷一「入手法」十干寄宫歌：「甲课寅兮乙课辰，丙戊课巳不须论。丁己课未庚申上，辛戌壬亥是其真。癸课原来丑宫坐，分明不用四正神。」',
    convention: '「干上神为一二课、支上神为三四课」为四课布法自述（B 级核验：非原书照录）。',
  },
  {
    ruleId: 'daliuren.sanchuan.jiuzongmen',
    basis: '混合',
    quote: '《六壬大全》卷七–卷十 课经集所载诸课（元首、殃咎等课体条目）',
    convention:
      '「九宗门」次第（贼克→比用→涉害→遥克→昴星→别责→八专→伏吟→返吟）为通行取用次第约定。',
  },
  {
    ruleId: 'daliuren.tianjiang.guiren',
    basis: '原文',
    quote:
      '卷四贵人诀（校订后逐字）：「甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸蛇兔藏，六辛逢马虎」；卷二神将释「背天门、向地户」，故贵人居天门（亥至辰）顺行、居地户（巳至戌）逆行。',
  },
  {
    ruleId: 'daliuren.liuqin.dungan',
    basis: '约定',
    convention:
      '「六亲生克以日干五行为纲；遁干依旬遁（旬首起甲子）」B 级核验为自述语，《大六壬指南》未见此直述句，属算法约定。',
  },
]

/** 大六壬校勘记（课题13b §3）：公版讹字与字序差异，禁止静默改字 */
export const LIREN_ERRATA: Erratum[] = [
  {
    id: 'LIREN-E01',
    raw: '丙戊课己不须论',
    corrected: '丙戊课巳不须论',
    basis:
      '按歌末「分明不用四正神」之例：四正=子午卯酉，寄宫只用四隅与辰戌，故当作「巳」；卷一同歌作「丙戊课巳」。',
    applied: true,
  },
  {
    id: 'LIREN-E02',
    raw: '壬癸蛇兔藏巳卯',
    corrected: '壬癸蛇兔藏巳卯（字序照原文，旧注作「壬癸兔蛇藏」）',
    basis:
      '巳蛇、卯兔：原文先蛇后兔，与干支对应之支序一致；字序差异不影响 GUIREN 取值（九干全对拍通过），但引文须逐字照原文。',
    applied: false,
  },
  {
    id: 'LIREN-E03',
    raw: '六壬逢马虎午寅',
    corrected: '六辛逢马虎午寅',
    basis: '按午马、寅虎推之当为「六辛」；通行本同。此为刊刻之讹。引擎取六辛（辛:[午,寅]）正确。',
    applied: true,
  },
]
