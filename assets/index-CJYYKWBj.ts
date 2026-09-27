/**
 * 大六壬起课引擎（ruleVariant：大六壬-通行起课法）
 *
 * 纯函数库：无 React / 无 DB / 无网络。前后端共用。
 * 历法基础复用 @contracts/bazi-core（真实节气时刻、干支）。
 *
 * 算法链路：
 *   中气换将（真实节气）→ 月将加时支成天地盘 → 十干寄宫立四课 →
 *   九宗门取三传（贼克/比用/涉害/遥克/昴星/别责/八专/伏吟/返吟）→
 *   贵人诀起十二天将（昼夜分、天门地户顺逆）→ 六亲 / 旬遁遁干。
 *
 * 规则出处：《六壬大全》起例诸章、
 * 《大六壬指南》课经；口诀如「甲戊庚牛羊」「甲课寅兮乙课辰」。
 */
import {
  BRANCH_WUXING,
  BRANCH_YINYANG,
  BRANCHES,
  JIAZI,
  STEM_WUXING,
  STEM_YINYANG,
  STEMS,
  WUXING_KE,
  findJiazi,
  hourToBranchIdx,
} from '../../bazi-core/rules/stems-branches'
import {
  fmtYmdHm,
  fmtYmdHms,
  ianaWallClockToUtcMs,
  lunarAt,
  toPseudoMs,
} from '../../bazi-core/calendar'
import type { Wuxing } from '../../bazi-core/types'
import { wrapResult, type EngineResult, type RuleProvenance } from '../engine-result'

export const DALIUREN_RULESET_VERSION = '1.0.0'
export const DALIUREN_ALGORITHM_VERSION = 'daliuren-core@1.0.0'
export const DALIUREN_RULE_VARIANT = '大六壬-通行起课法'

const SOURCE_DAQUAN = '《六壬大全》'
const SOURCE_ZHINAN = '《大六壬指南》'

/* ------------------------------------------------------------------ */
/* 规则数据                                                            */
/* ------------------------------------------------------------------ */

/** 月将名（太阳过宫）：亥登明、戌河魁、酉从魁、申传送、未小吉、午胜光、巳太乙、辰天罡、卯太冲、寅功曹、丑大吉、子神后 */
export const YUEJIANG_NAME: Record<number, string> = {
  11: '登明', 10: '河魁', 9: '从魁', 8: '传送', 7: '小吉', 6: '胜光',
  5: '太乙', 4: '天罡', 3: '太冲', 2: '功曹', 1: '大吉', 0: '神后',
}

/**
 * 中气换将表：雨水后亥将、春分后戌将、谷雨后酉将、小满后申将、
 * 夏至后未将、大暑后午将、处暑后巳将、秋分后辰将、霜降后卯将、
 * 小雪后寅将、冬至后丑将、大寒后子将（太阳过宫，中气换将）。
 */
export const ZHONGQI_TO_JIANG: Record<string, number> = {
  雨水: 11, 春分: 10, 谷雨: 9, 小满: 8, 夏至: 7, 大暑: 6,
  处暑: 5, 秋分: 4, 霜降: 3, 小雪: 2, 冬至: 1, 大寒: 0,
}

/** 十干寄宫歌：甲课寅乙课辰，丙戊课巳丁己未，庚课申兮辛课戌，壬课亥兮癸课丑 */
export const STEM_PALACE = [2, 4, 5, 7, 5, 7, 8, 10, 11, 1] as const

/** 十二天将序：贵人、螣蛇、朱雀、六合、勾陈、青龙、天空、白虎、太常、玄武、太阴、天后 */
export const GENERALS = [
  '贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙',
  '天空', '白虎', '太常', '玄武', '太阴', '天后',
] as const
export const GENERAL_SHORT = ['贵', '螣', '朱', '合', '勾', '龙', '空', '虎', '常', '玄', '阴', '后'] as const

/**
 * 贵人诀（甲戊庚牛羊、乙己鼠猴乡、丙丁猪鸡位、壬癸兔蛇藏、六辛逢马虎）。
 * [昼贵支序, 夜贵支序]。昼夜以占时支分（卯至申为昼，酉至寅为夜）。
 */
export const GUIREN: Record<number, [number, number]> = {
  0: [1, 7],  // 甲：昼丑夜未
  1: [0, 8],  // 乙：昼子夜申
  2: [11, 9], // 丙：昼亥夜酉
  3: [11, 9], // 丁：昼亥夜酉
  4: [1, 7],  // 戊：昼丑夜未
  5: [0, 8],  // 己：昼子夜申
  6: [1, 7],  // 庚：昼丑夜未
  7: [6, 2],  // 辛：昼午夜寅
  8: [5, 3],  // 壬：昼巳夜卯
  9: [5, 3],  // 癸：昼巳夜卯
}

/** 八专日（干支同气）：甲寅、乙卯、丁未、己未、庚申、辛酉、壬子、癸丑 */
export const BAZHUAN_DAYS = ['甲寅', '乙卯', '丁未', '己未', '庚申', '辛酉', '壬子', '癸丑']

/** 驿马：申子辰马在寅、寅午戌马在申、巳酉丑马在亥、亥卯未马在巳 */
const YIMA: Record<number, number> = {
  8: 2, 0: 2, 4: 2,
  2: 8, 6: 8, 10: 8,
  5: 11, 9: 11, 1: 11,
  11: 5, 3: 5, 7: 5,
}

/** 相刑下一支（寅→巳→申→寅；丑→戌→未→丑；子↔卯）；辰午酉亥自刑 */
const XING_NEXT: Record<number, number> = {
  2: 5, 5: 8, 8: 2, 1: 10, 10: 7, 7: 1, 0: 3, 3: 0,
}
const ZIXING = new Set([4, 6, 9, 11]) // 辰午酉亥自刑
const chongOf = (b: number) => (b + 6) % 12

const MENG = new Set([2, 5, 8, 11]) // 寅申巳亥四孟
const ZHONG = new Set([0, 3, 6, 9]) // 子午卯酉四仲

const mod12 = (n: number) => (((n % 12) + 12) % 12)
const mod60 = (n: number) => (((n % 60) + 60) % 60)

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

export interface DaliurenInput {
  /** 公历年月日时分（ianaTimezone 当地墙钟；未给时区按东八区墙钟） */
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** IANA 时区（如 Asia/Shanghai），缺省按东八区 */
  ianaTimezone?: string
  /** 所问之事（可选，仅落库展示，不进算法） */
  question?: string
}

export interface DaliurenLesson {
  /** 课序 1-4 */
  ke: number
  /** 上神（天盘支序与原文） */
  shangIdx: number
  shang: string
  /** 下神原文（第一课为日干，其余为地盘支） */
  xia: string
  /** 下神地盘支序（第一课为干寄宫） */
  xiaPos: number
  xiaIsStem: boolean
  /** 上神所乘天将 */
  general: string
}

export interface DaliurenChuan {
  label: '初传' | '中传' | '末传'
  branchIdx: number
  branch: string
  /** 干支（遁干 + 支）；旬空之支干为空 */
  ganzhi: string
  /** 遁干（旬遁）；旬空时为「空」 */
  dunGan: string
  wuxing: Wuxing
  liuqin: string
  general: string
  /** 旬空标记 */
  isXunkong: boolean
}

export interface DaliurenMethod {
  /** 九宗门：贼克 / 比用 / 涉害 / 遥克 / 昴星 / 别责 / 八专 / 伏吟 / 返吟 */
  gate: string
  /** 课名，如「重审课-涉害」「元首课」「伏吟课」 */
  name: string
  /** 触发条件说明 */
  condition: string
}

export interface DaliurenChart {
  rulesetVersion: string
  input: DaliurenInput
  /** 东八区标准时刻（排盘所用） */
  standardTime: string
  dayGanzhi: string
  dayStemIdx: number
  dayBranchIdx: number
  hourGanzhi: string
  hourBranchIdx: number
  /** 旬首（如「甲子旬」）与旬空两支 */
  xunShou: string
  xunkong: [string, string]
  yuejiang: {
    branchIdx: number
    branch: string
    name: string
    /** 换将中气名与精确时刻（东八区） */
    zhongqi: string
    zhongqiTime: string
  }
  /** 天盘支序（按地盘位 0-11） */
  heaven: number[]
  /** 十二天将序（按地盘位 0-11，值为 GENERALS 序 0-11） */
  generals: number[]
  guiren: {
    branchIdx: number
    branch: string
    isDay: boolean
    /** 贵人所临地盘位 */
    position: number
    direction: '顺布' | '逆布'
  }
  lessons: [DaliurenLesson, DaliurenLesson, DaliurenLesson, DaliurenLesson]
  chuan: [DaliurenChuan, DaliurenChuan, DaliurenChuan]
  method: DaliurenMethod
}

/* ------------------------------------------------------------------ */
/* 三传取法（九宗门）                                                   */
/* ------------------------------------------------------------------ */

interface LessonRaw {
  shangIdx: number
  xiaPos: number
  xiaIsStem: boolean
  shangWx: Wuxing
  xiaWx: Wuxing
}

interface ChuanResult {
  branches: [number, number, number]
  method: DaliurenMethod
}

/** 比用：候选中与日干阴阳相同者 */
function filterBiYong(cands: LessonRaw[], dayStemIdx: number): LessonRaw[] {
  const yy = STEM_YINYANG[dayStemIdx]
  return cands.filter((c) => BRANCH_YINYANG[c.shangIdx] === yy)
}

/** 涉害深度：自天盘神所临地盘位（含）顺数回本家（含），计地盘克天盘神之数 */
export function sheHaiDepth(shangIdx: number, pos: number): number {
  let depth = 0
  let e = pos
  for (;;) {
    if (WUXING_KE[BRANCH_WUXING[e]] === BRANCH_WUXING[shangIdx]) depth += 1
    if (e === shangIdx) break
    e = (e + 1) % 12
  }
  return depth
}

/** 涉害法裁决：深者先用；俱等取加孟者，次取加仲；再俱等刚日取干上、柔日取支上 */
function resolveSheHai(
  cands: LessonRaw[],
  posOf: (c: LessonRaw) => number,
  dayStemIdx: number,
  ganShang: LessonRaw,
  zhiShang: LessonRaw,
): LessonRaw {
  const depths = cands.map((c) => sheHaiDepth(c.shangIdx, posOf(c)))
  const max = Math.max(...depths)
  let tied = cands.filter((_, i) => depths[i] === max)
  if (tied.length === 1) return tied[0]
  const meng = tied.filter((c) => MENG.has(posOf(c)))
  if (meng.length === 1) return meng[0]
  if (meng.length > 1) tied = meng
  else {
    const zhong = tied.filter((c) => ZHONG.has(posOf(c)))
    if (zhong.length === 1) return zhong[0]
    if (zhong.length > 1) tied = zhong
  }
  // 俱孟俱仲：刚日取干上神，柔日取支上神
  const isYang = STEM_YINYANG[dayStemIdx] === '阳'
  const prefer = isYang ? ganShang : zhiShang
  if (tied.includes(prefer)) return prefer
  return tied[0]
}

/** 多克裁决：比用 → 涉害，返回所选课与附加宗门标记 */
function resolveMultiKe(
  cands: LessonRaw[],
  dayStemIdx: number,
  ganShang: LessonRaw,
  zhiShang: LessonRaw,
): { pick: LessonRaw; gate: '比用' | '涉害' } {
  const bi = filterBiYong(cands, dayStemIdx)
  if (bi.length === 1) return { pick: bi[0], gate: '比用' }
  const pool = bi.length > 1 ? bi : cands
  const pick = resolveSheHai(pool, (c) => c.xiaPos, dayStemIdx, ganShang, zhiShang)
  return { pick, gate: '涉害' }
}

/** 刑取中末：中=初之刑（初自刑时刚日取支上、柔日取干上）；末=中之刑（中自刑取冲） */
function xingChain(chu: number, dayStemIdx: number, ganShangIdx: number, zhiShangIdx: number): [number, number] {
  const isYang = STEM_YINYANG[dayStemIdx] === '阳'
  let zhong: number
  if (ZIXING.has(chu)) zhong = isYang ? zhiShangIdx : ganShangIdx
  else zhong = XING_NEXT[chu]
  let mo: number
  if (ZIXING.has(zhong)) mo = chongOf(zhong)
  else mo = XING_NEXT[zhong] ?? chongOf(zhong)
  return [zhong, mo]
}

/** 九宗门取三传。heaven 按地盘位；lessons 四课；dayStem/dayBranch 日干支配 */
export function deriveChuan(
  heaven: number[],
  lessons: LessonRaw[],
  dayStemIdx: number,
  dayBranchIdx: number,
  dayGanzhi: string,
): ChuanResult {
  const dayWx = STEM_WUXING[dayStemIdx]
  const isYang = STEM_YINYANG[dayStemIdx] === '阳'
  const ganShang = lessons[0]
  const zhiShang = lessons[2]

  const isFuyin = heaven.every((h, e) => h === e)
  const isFanyin = heaven.every((h, e) => h === (e + 6) % 12)

  const xiaZeishang = lessons.filter((l) => WUXING_KE[l.xiaWx] === l.shangWx) // 下贼上
  const shangKexia = lessons.filter((l) => WUXING_KE[l.shangWx] === l.xiaWx) // 上克下
  const hasKe = xiaZeishang.length > 0 || shangKexia.length > 0

  /* ---- 伏吟：天地盘相同 ---- */
  if (isFuyin) {
    let chu: number
    let cond: string
    if (hasKe) {
      const pool = xiaZeishang.length > 0 ? xiaZeishang : shangKexia
      const { pick } = pool.length > 1
        ? resolveMultiKe(pool, dayStemIdx, ganShang, zhiShang)
        : { pick: pool[0] }
      chu = pick.shangIdx
      cond = `伏吟课：天盘与地盘相同；四课有克，仍以克发用（${xiaZeishang.length > 0 ? '下贼上' : '上克下'}取${BRANCHES[chu]}），中末传依刑递取`
    } else {
      chu = isYang ? ganShang.shangIdx : zhiShang.shangIdx
      cond = `伏吟课：天盘与地盘相同，四课无克；${isYang ? '刚日以干上神' : '柔日以支上神'}${BRANCHES[chu]}为初传，中末传依刑递取（自刑取冲）`
    }
    const [zhong, mo] = xingChain(chu, dayStemIdx, ganShang.shangIdx, zhiShang.shangIdx)
    return { branches: [chu, zhong, mo], method: { gate: '伏吟', name: '伏吟课', condition: cond } }
  }

  /* ---- 返吟：天地盘相冲 ---- */
  if (isFanyin) {
    if (hasKe) {
      const pool = xiaZeishang.length > 0 ? xiaZeishang : shangKexia
      const { pick } = pool.length > 1
        ? resolveMultiKe(pool, dayStemIdx, ganShang, zhiShang)
        : { pick: pool[0] }
      const chu = pick.shangIdx
      return {
        branches: [chu, heaven[chu], heaven[heaven[chu]]],
        method: {
          gate: '返吟',
          name: '返吟课',
          condition: `返吟课：天盘与地盘相冲；四课有克，照常以克发用取${BRANCHES[chu]}，中末递传`,
        },
      }
    }
    const ma = YIMA[dayBranchIdx]
    return {
      branches: [ma, zhiShang.shangIdx, ganShang.shangIdx],
      method: {
        gate: '返吟',
        name: '返吟课-无依',
        condition: `返吟课：天盘与地盘相冲，四课无克无遥；取日支驿马${BRANCHES[ma]}为初传，中传支上神、末传干上神`,
      },
    }
  }

  /* ---- 贼克法（重审 / 元首），多克则比用、涉害 ---- */
  if (hasKe) {
    const isZei = xiaZeishang.length > 0
    const pool = isZei ? xiaZeishang : shangKexia
    const base = isZei ? '重审课' : '元首课'
    const baseCond = isZei ? '四课中有下贼上（下神克上神）' : '四课中无下贼上而有上克下'
    let chu: number
    let gate = '贼克'
    let extra = ''
    if (pool.length === 1) {
      chu = pool[0].shangIdx
    } else {
      const { pick, gate: g } = resolveMultiKe(pool, dayStemIdx, ganShang, zhiShang)
      chu = pick.shangIdx
      gate = g
      extra = g === '比用'
        ? `；${pool.length} 处见克，取与日干阴阳比和者（比用法）`
        : `；${pool.length} 处见克且比用不专，取涉害深者（涉害法，俱等取孟仲）`
    }
    return {
      branches: [chu, heaven[chu], heaven[heaven[chu]]],
      method: {
        gate,
        name: pool.length === 1 ? base : `${base}-${gate}`,
        condition: `${baseCond}，取${BRANCHES[chu]}为初传，中末递传${extra}`,
      },
    }
  }

  /* ---- 遥克法：先神遥克日（蒿矢），后日遥克神（弹射） ---- */
  const shenKeRi = lessons.filter((l) => WUXING_KE[l.shangWx] === dayWx)
  const riKeShen = lessons.filter((l) => WUXING_KE[dayWx] === l.shangWx)
  if (shenKeRi.length > 0 || riKeShen.length > 0) {
    const isHao = shenKeRi.length > 0
    const pool = isHao ? shenKeRi : riKeShen
    let pick: LessonRaw
    let extra = ''
    if (pool.length === 1) pick = pool[0]
    else {
      const bi = filterBiYong(pool, dayStemIdx)
      pick = bi.length >= 1 ? bi[0] : pool[0]
      extra = '；多处遥克，取与日干比和者'
    }
    const chu = pick.shangIdx
    return {
      branches: [chu, heaven[chu], heaven[heaven[chu]]],
      method: {
        gate: '遥克',
        name: isHao ? '遥克课-蒿矢' : '遥克课-弹射',
        condition: `四课无上下克，${isHao ? '神遥克日（蒿矢）' : '日遥克神（弹射）'}，取${BRANCHES[chu]}为初传${extra}`,
      },
    }
  }

  /* ---- 八专法：八专日无克无遥 ---- */
  if (BAZHUAN_DAYS.includes(dayGanzhi)) {
    const chu = isYang
      ? mod12(ganShang.shangIdx + 2) // 刚日从干上神顺数三辰
      : mod12(lessons[3].shangIdx - 2) // 柔日从第四课上神逆数三辰
    return {
      branches: [chu, ganShang.shangIdx, ganShang.shangIdx],
      method: {
        gate: '八专',
        name: '八专课',
        condition: `${dayGanzhi}日为八专日，四课无克无遥；${isYang ? '刚日从干上神顺数三辰' : '柔日从第四课上神逆数三辰'}取${BRANCHES[chu]}为初传，中末俱用干上神`,
      },
    }
  }

  /* ---- 别责法：四课不备（仅三课）无克无遥 ---- */
  const keys = lessons.map((l) => `${l.xiaPos}-${l.shangIdx}-${l.xiaIsStem ? 's' : 'b'}`)
  const unique = new Set(keys).size
  if (unique === 3) {
    const chu = isYang
      ? heaven[STEM_PALACE[(dayStemIdx + 5) % 10]] // 刚日取干合之干寄宫上神
      : mod12(dayBranchIdx - 4) // 柔日取支前三合
    return {
      branches: [chu, ganShang.shangIdx, ganShang.shangIdx],
      method: {
        gate: '别责',
        name: '别责课',
        condition: `四课不备（仅三课）且无克无遥；${isYang ? '刚日取干合上神' : '柔日取支前三合'}${BRANCHES[chu]}为初传，中末俱用干上神`,
      },
    }
  }

  /* ---- 昴星法：四课全无克无遥 ---- */
  if (isYang) {
    const chu = heaven[9] // 地盘酉上之神（仰视）
    return {
      branches: [chu, zhiShang.shangIdx, ganShang.shangIdx],
      method: {
        gate: '昴星',
        name: '昴星课-虎视',
        condition: `四课全无克无遥；刚日取地盘酉上之神${BRANCHES[chu]}为初传（虎视），中传支上神、末传干上神`,
      },
    }
  }
  const pos = heaven.indexOf(9) // 天盘酉所临地盘位（俯视）
  const chu = pos
  return {
    branches: [chu, ganShang.shangIdx, zhiShang.shangIdx],
    method: {
      gate: '昴星',
      name: '昴星课-冬蛇掩目',
      condition: `四课全无克无遥；柔日取天盘酉下之地盘${BRANCHES[chu]}为初传（冬蛇掩目），中传干上神、末传支上神`,
    },
  }
}

/* ------------------------------------------------------------------ */
/* 六亲 / 遁干                                                          */
/* ------------------------------------------------------------------ */

const SHENG_OF = (wx: Wuxing): Wuxing =>
  (({ 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }) as Record<Wuxing, Wuxing>)[wx]

function liuqinOf(dayWx: Wuxing, branchIdx: number): string {
  const wx = BRANCH_WUXING[branchIdx]
  if (wx === dayWx) return '兄弟'
  if (SHENG_OF(wx) === dayWx) return '父母'
  if (SHENG_OF(dayWx) === wx) return '子孙'
  if (WUXING_KE[wx] === dayWx) return '官鬼'
  return '妻财'
}

/** 旬遁遁干：由日柱旬首推该支遁干（干序 0-9）；旬空之支返回 null */
export function dunGanOf(dayJiaziIdx: number, branchIdx: number): number | null {
  const xun = Math.floor(mod60(dayJiaziIdx) / 10) // 0..5
  const xunStartBranch = mod12(0 - 2 * xun) // 甲子旬起子、甲戌旬起戌……
  const offset = mod12(branchIdx - xunStartBranch)
  return offset <= 9 ? offset : null
}

const PROVENANCE: RuleProvenance[] = [
  { ruleId: 'daliuren.yuejiang.zhongqi', variant: DALIUREN_RULE_VARIANT, source: `${SOURCE_DAQUAN}：太阳过宫，中气换将（雨水亥将登明……大寒子将神后）` },
  { ruleId: 'daliuren.tiandipan.jiashi', variant: DALIUREN_RULE_VARIANT, source: `${SOURCE_DAQUAN}：月将加占时，顺布十二辰成天盘` },
  { ruleId: 'daliuren.sike.jigong', variant: DALIUREN_RULE_VARIANT, source: `${SOURCE_DAQUAN}：十干寄宫歌「甲课寅兮乙课辰……」；干上神为一二课，支上神为三四课` },
  { ruleId: 'daliuren.sanchuan.jiuzongmen', variant: DALIUREN_RULE_VARIANT, source: `${SOURCE_DAQUAN}课经九宗门：贼克、比用、涉害、遥克、昴星、别责、八专、伏吟、返吟` },
  { ruleId: 'daliuren.tianjiang.guiren', variant: DALIUREN_RULE_VARIANT, source: `${SOURCE_DAQUAN}贵人诀「甲戊庚牛羊、乙己鼠猴乡、丙丁猪鸡位、壬癸兔蛇藏、六辛逢马虎」；贵人居天门（亥至辰）顺行、居地户（巳至戌）逆行` },
  { ruleId: 'daliuren.liuqin.dungan', variant: DALIUREN_RULE_VARIANT, source: `${SOURCE_ZHINAN}：六亲生克以日干五行为纲；遁干依旬遁（旬首起甲子）` },
]

/**
 * 大六壬起课主函数：公历时刻（+可选 IANA 时区）→ 完整课传。
 * 确定性：同一输入 → 同一课传（无任何随机源）。
 */
export function computeDaliuren(input: DaliurenInput): EngineResult<DaliurenChart> {
  const warnings: string[] = []

  // 时刻归一：输入墙钟 → 东八区墙钟（伪毫秒）
  let standardMs: number
  if (input.ianaTimezone) {
    standardMs = ianaWallClockToUtcMs(input.ianaTimezone, {
      year: input.year, month: input.month, day: input.day,
      hour: input.hour, minute: input.minute,
    }) + 8 * 3600_000
  } else {
    standardMs = toPseudoMs({
      year: input.year, month: input.month, day: input.day,
      hour: input.hour, minute: input.minute,
    })
    warnings.push('未提供 ianaTimezone，输入时刻按东八区（UTC+8）墙钟解释。')
  }

  const lunar = lunarAt(standardMs)
  const dayGanzhi = lunar.getDayInGanZhiExact() // 子初(23:00)换日
  const hourGanzhi = lunar.getTimeInGanZhi()
  const dayStemIdx = STEMS.indexOf(dayGanzhi[0] as (typeof STEMS)[number])
  const dayBranchIdx = BRANCHES.indexOf(dayGanzhi[1] as (typeof BRANCHES)[number])
  const hourBranchIdx = BRANCHES.indexOf(hourGanzhi[1] as (typeof BRANCHES)[number])
  const dayJiaziIdx = findJiazi(dayStemIdx, dayBranchIdx)

  /* 月将：中气换将（真实节气时刻） */
  const prevQi = lunar.getPrevQi()
  const qiName = prevQi.getName()
  const jiangBranch = ZHONGQI_TO_JIANG[qiName]
  if (jiangBranch === undefined) {
    throw new Error(`无法由中气「${qiName}」定月将`)
  }
  const qiSolar = prevQi.getSolar()
  const zhongqiTime = fmtYmdHms(toPseudoMs({
    year: qiSolar.getYear(), month: qiSolar.getMonth(), day: qiSolar.getDay(),
    hour: qiSolar.getHour(), minute: qiSolar.getMinute(), second: qiSolar.getSecond(),
  }))

  /* 天盘：月将加于地盘时支之位，顺布十二支 */
  const heaven: number[] = Array.from({ length: 12 }, (_, e) => mod12(jiangBranch + e - hourBranchIdx))

  /* 十二天将：贵人诀 + 昼夜分 + 天门地户顺逆 */
  // 昼夜以占时支分：卯辰巳午未申为昼，酉戌亥子丑寅为夜
  const isDay = hourBranchIdx >= 3 && hourBranchIdx <= 8
  const guiBranch = GUIREN[dayStemIdx][isDay ? 0 : 1]
  const guiPos = heaven.indexOf(guiBranch)
  // 贵人居天门（地盘亥至辰）顺行，居地户（地盘巳至戌）逆行
  const shun = guiPos >= 11 || guiPos <= 4
  const generals: number[] = Array.from({ length: 12 }, (_, e) =>
    shun ? mod12(e - guiPos) : mod12(guiPos - e),
  )
  const generalAt = (tianpanBranch: number): string => GENERALS[generals[heaven.indexOf(tianpanBranch)]]

  /* 四课：干上神（寄宫）为一二课，支上神为三四课 */
  const palace = STEM_PALACE[dayStemIdx]
  const ke1Shang = heaven[palace]
  const ke3Shang = heaven[dayBranchIdx]
  const dayWx = STEM_WUXING[dayStemIdx]
  const raw: LessonRaw[] = [
    { shangIdx: ke1Shang, xiaPos: palace, xiaIsStem: true, shangWx: BRANCH_WUXING[ke1Shang], xiaWx: dayWx },
    { shangIdx: heaven[ke1Shang], xiaPos: ke1Shang, xiaIsStem: false, shangWx: BRANCH_WUXING[heaven[ke1Shang]], xiaWx: BRANCH_WUXING[ke1Shang] },
    { shangIdx: ke3Shang, xiaPos: dayBranchIdx, xiaIsStem: false, shangWx: BRANCH_WUXING[ke3Shang], xiaWx: BRANCH_WUXING[dayBranchIdx] },
    { shangIdx: heaven[ke3Shang], xiaPos: ke3Shang, xiaIsStem: false, shangWx: BRANCH_WUXING[heaven[ke3Shang]], xiaWx: BRANCH_WUXING[ke3Shang] },
  ]

  /* 三传：九宗门 */
  const { branches, method } = deriveChuan(heaven, raw, dayStemIdx, dayBranchIdx, dayGanzhi)

  /* 旬首、旬空 */
  const xun = Math.floor(mod60(dayJiaziIdx) / 10)
  const xunShou = `${JIAZI[xun * 10]}旬`
  const xunStartBranch = mod12(0 - 2 * xun)
  const xunkongIdx: [number, number] = [mod12(xunStartBranch - 2), mod12(xunStartBranch - 1)]
  const xunkong: [string, string] = [BRANCHES[xunkongIdx[0]], BRANCHES[xunkongIdx[1]]]

  const mkChuan = (label: DaliurenChuan['label'], branchIdx: number): DaliurenChuan => {
    const dg = dunGanOf(dayJiaziIdx, branchIdx)
    return {
      label,
      branchIdx,
      branch: BRANCHES[branchIdx],
      ganzhi: dg === null ? `空${BRANCHES[branchIdx]}` : `${STEMS[dg]}${BRANCHES[branchIdx]}`,
      dunGan: dg === null ? '空' : STEMS[dg],
      wuxing: BRANCH_WUXING[branchIdx],
      liuqin: liuqinOf(dayWx, branchIdx),
      general: generalAt(branchIdx),
      isXunkong: dg === null,
    }
  }

  const lessons = raw.map((l, i): DaliurenLesson => ({
    ke: i + 1,
    shangIdx: l.shangIdx,
    shang: BRANCHES[l.shangIdx],
    xia: l.xiaIsStem ? STEMS[dayStemIdx] : BRANCHES[l.xiaPos],
    xiaPos: l.xiaPos,
    xiaIsStem: l.xiaIsStem,
    general: generalAt(l.shangIdx),
  })) as DaliurenChart['lessons']

  const chart: DaliurenChart = {
    rulesetVersion: DALIUREN_RULESET_VERSION,
    input,
    standardTime: fmtYmdHm(standardMs),
    dayGanzhi,
    dayStemIdx,
    dayBranchIdx,
    hourGanzhi,
    hourBranchIdx,
    xunShou,
    xunkong,
    yuejiang: {
      branchIdx: jiangBranch,
      branch: BRANCHES[jiangBranch],
      name: YUEJIANG_NAME[jiangBranch],
      zhongqi: qiName,
      zhongqiTime,
    },
    heaven,
    generals,
    guiren: {
      branchIdx: guiBranch,
      branch: BRANCHES[guiBranch],
      isDay,
      position: guiPos,
      direction: shun ? '顺布' : '逆布',
    },
    lessons,
    chuan: [mkChuan('初传', branches[0]), mkChuan('中传', branches[1]), mkChuan('末传', branches[2])],
    method,
  }

  return wrapResult(
    {
      engine: 'daliuren',
      algorithmVersion: DALIUREN_ALGORITHM_VERSION,
      ruleVariant: DALIUREN_RULE_VARIANT,
      precision: 'validated',
      warnings,
      provenance: PROVENANCE,
    },
    chart,
  )
}

/** 时辰支序换算（供前端/测试） */
export { hourToBranchIdx }
