/**
 * 六爻纳甲引擎（通行装卦法）· 纯函数核心，无随机源、无 IO。
 * - 起卦：六摇 × 三钱（字=3 背=2）之和 → 6 老阴(动)/7 少阳/8 少阴/9 老阳(动)
 * - 装卦：本卦 / 变卦(之卦) / 互卦；纳甲干支、五行、六亲（卦宫五行为我）、
 *   世应（八宫口诀）、六神（日干起）、旬空（日柱旬）、月建日辰（节气月，lunar-typescript）、
 *   动爻变爻标注、伏神（本宫缺六亲时取本宫纯卦同位之神伏于飞神之下）
 * - 卦辞爻辞：《周易》公版原文（hexagram-data.ts）
 * 随机性不在本库：起卦字节由调用方（服务端 CSPRNG）供给，本库只负责确定性推演。
 */
import { wrapResult, type EngineResult } from '../engine-result'
import { lunarAt } from '../../bazi-core/calendar'
import {
  findHexagramByLines,
  type HexagramData,
  type TrigramName,
} from './hexagram-data'
import {
  BRANCH_WUXING,
  LIUSHEN_ORDER,
  NAJIA,
  TRIGRAM_WUXING,
  liuqinOf,
  liushenOf,
  palaceInfo,
  palaceOf,
  xunKongOf,
  type Wuxing,
} from './najia'

export * from './hexagram-data'
export * from './guaci'
export * from './najia'

/** 规则集版本（装卦规则变更时 bump） */
export const LIUYAO_RULESET_VERSION = '1.0.0'
/** 引擎算法版本 */
export const LIUYAO_ALGORITHM_VERSION = 'liuyao-core@1.0.0'
/** 流派标识 */
export const LIUYAO_RULE_VARIANT = '六爻纳甲-通行装卦法'

/** 摇卦一爻的数值：6 老阴(动) / 7 少阳 / 8 少阴 / 9 老阳(动) */
export type TossValue = 6 | 7 | 8 | 9

export const YAO_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'] as const

export function isYang(t: TossValue): boolean {
  return t === 7 || t === 9
}
export function isMoving(t: TossValue): boolean {
  return t === 6 || t === 9
}
export function yaoLabel(t: TossValue): string {
  switch (t) {
    case 6:
      return '老阴 · 动'
    case 7:
      return '少阳 · 静'
    case 8:
      return '少阴 · 静'
    case 9:
      return '老阳 · 动'
  }
}

/**
 * 校验并解析 18 枚铜钱结果（6 摇 × 3 枚，每枚 2=背 / 3=字）为六爻数值。
 * 非法输入抛出 Error（由路由层转为 400）。
 */
export function parseCoins(coins: number[]): TossValue[] {
  if (!Array.isArray(coins) || coins.length !== 18) {
    throw new Error(`coins 须为 18 个数（6 摇 × 3 枚），实得 ${Array.isArray(coins) ? coins.length : '非数组'}`)
  }
  const tosses: TossValue[] = []
  for (let t = 0; t < 6; t++) {
    let sum = 0
    for (let c = 0; c < 3; c++) {
      const v = coins[t * 3 + c]
      if (v !== 2 && v !== 3) {
        throw new Error(`第 ${t + 1} 摇第 ${c + 1} 枚铜钱须为 2（背）或 3（字），实得 ${v}`)
      }
      sum += v
    }
    tosses.push(sum as TossValue)
  }
  return tosses
}

/** 单爻装配结果（自下而上，index 0 = 初爻） */
export interface LiuyaoYao {
  index: number
  name: string
  value: TossValue
  yinYang: '阳' | '阴'
  moving: boolean
  label: string
  /** 纳甲干支 */
  ganzhi: string
  gan: string
  zhi: string
  /** 爻支五行 */
  wuxing: Wuxing
  /** 六亲（以卦宫五行为我） */
  liuqin: string
  /** 六神（以日干起，自下而上） */
  liushen: string
  /** 世应标记 */
  mark: '世' | '应' | null
  /** 该爻地支是否旬空 */
  xunKong: boolean
  /** 动爻对应的变爻装配（变卦同位爻之纳甲/五行/六亲，六亲仍按本宫论）；静爻为 null */
  bian: { ganzhi: string; wuxing: Wuxing; liuqin: string } | null
}

/** 伏神（本卦缺某六亲时，取本宫纯卦同位之神伏于该爻飞神之下） */
export interface FuShenInfo {
  /** 伏神所在爻位（0 基，自下而上；即飞神爻位） */
  pos: number
  /** 所缺之六亲 */
  liuqin: string
  /** 伏神纳甲干支 */
  ganzhi: string
  wuxing: Wuxing
  /** 同位飞神干支（本卦该爻） */
  feiGanzhi: string
}

export interface LiuyaoChart {
  question: string | null
  /** 18 枚铜钱原始结果（2=背 3=字，每 3 枚一摇，自下而上） */
  coins: number[]
  /** 六爻数值（6/7/8/9，自下而上） */
  tosses: TossValue[]
  benGua: HexagramData
  /** 无动爻时为 null（六爻安静） */
  bianGua: HexagramData | null
  huGua: HexagramData
  /** 动爻下标（0 基，自下而上） */
  movingIdx: number[]
  /** 卦宫（八纯卦名）与卦宫五行 */
  gong: TrigramName
  gongWuxing: Wuxing
  /** 卦次：本宫/一世/…/游魂/归魂 */
  gongKind: string
  shiIndex: number
  yingIndex: number
  yaos: LiuyaoYao[]
  fuShen: FuShenInfo[]
  /** 月建（节气月干支，如「丁卯」） */
  yueJian: string
  /** 日辰（日柱干支） */
  riChen: string
  /** 旬空二支（以日柱旬推） */
  xunKong: [string, string]
  /** 起卦时刻（ISO，东八区墙钟） */
  castAt: string
  rulesetVersion: string
}

export interface LiuyaoCastOptions {
  question?: string
  /** 起卦时刻（epoch 毫秒）；缺省取当前时间，按东八区推月建日辰 */
  castAt?: number
}

/** 由六爻数值推本卦 / 变卦 / 互卦 */
export function deriveHexagrams(tosses: TossValue[]): {
  ben: HexagramData
  bian: HexagramData | null
  hu: HexagramData
  movingIdx: number[]
} {
  const benLines = tosses.map((t) => (isYang(t) ? 1 : 0))
  const movingIdx = tosses.flatMap((t, i) => (isMoving(t) ? [i] : []))
  const ben = findHexagramByLines(benLines)
  let bian: HexagramData | null = null
  if (movingIdx.length > 0) {
    const bianLines = benLines.map((v, i) => (movingIdx.includes(i) ? 1 - v : v))
    bian = findHexagramByLines(bianLines)
  }
  // 互卦：二三四爻为下卦，三四五爻为上卦
  const hu = findHexagramByLines([benLines[1], benLines[2], benLines[3], benLines[2], benLines[3], benLines[4]])
  return { ben, bian, hu, movingIdx }
}

/**
 * 摇钱成卦（确定性纯函数）：18 枚铜钱结果 → 完整装卦。
 * 随机源由服务端提供；相同 coins + castAt 必然得到相同结果。
 */
export function castWithCoins(
  coinResults: number[],
  opts: LiuyaoCastOptions = {},
): EngineResult<LiuyaoChart> {
  const warnings: string[] = []
  const tosses = parseCoins(coinResults)

  const castAtMs = opts.castAt ?? Date.now()
  if (opts.castAt === undefined) {
    warnings.push('未提供起卦时间，月建日辰按服务器当前时间（东八区）推算')
  }
  // 东八区墙钟 → 伪 UTC 毫秒（与 bazi-core 历法约定一致）
  const pseudoMs = castAtMs + 8 * 3600_000
  const lunar = lunarAt(pseudoMs)
  const riChen = lunar.getDayInGanZhi()
  const yueJian = lunar.getMonthInGanZhi()
  const dayGan = riChen[0]
  const kong = xunKongOf(riChen)

  const { ben, bian, hu, movingIdx } = deriveHexagrams(tosses)
  const { shi, kind } = palaceInfo(ben.lines)
  const ying = (shi + 3) % 6
  const gong = palaceOf(ben.lines)
  const gongWuxing = TRIGRAM_WUXING[gong]

  // 本卦纳甲：内卦取 lower.inner，外卦取 upper.outer
  const benGanzhi = [...NAJIA[ben.lower].inner, ...NAJIA[ben.upper].outer]
  const bianGanzhi = bian ? [...NAJIA[bian.lower].inner, ...NAJIA[bian.upper].outer] : null

  const yaos: LiuyaoYao[] = tosses.map((t, i) => {
    const ganzhi = benGanzhi[i]
    const zhi = ganzhi[1]
    const moving = isMoving(t)
    let bianInfo: LiuyaoYao['bian'] = null
    if (moving && bianGanzhi) {
      const bg = bianGanzhi[i]
      const bz = bg[1]
      bianInfo = {
        ganzhi: bg,
        wuxing: BRANCH_WUXING[bz],
        liuqin: liuqinOf(gongWuxing, bz),
      }
    }
    return {
      index: i,
      name: YAO_NAMES[i],
      value: t,
      yinYang: isYang(t) ? '阳' : '阴',
      moving,
      label: yaoLabel(t),
      ganzhi,
      gan: ganzhi[0],
      zhi,
      wuxing: BRANCH_WUXING[zhi],
      liuqin: liuqinOf(gongWuxing, zhi),
      liushen: liushenOf(dayGan, i),
      mark: i === shi ? '世' : i === ying ? '应' : null,
      xunKong: kong.includes(zhi),
      bian: bianInfo,
    }
  })

  // 伏神：本卦所缺六亲，于本宫纯卦同位取之
  const present = new Set(yaos.map((y) => y.liuqin))
  const palaceGanzhi = [...NAJIA[gong].inner, ...NAJIA[gong].outer]
  const fuShen: FuShenInfo[] = []
  for (const qin of ['父母', '兄弟', '子孙', '妻财', '官鬼']) {
    if (present.has(qin)) continue
    const pos = palaceGanzhi.findIndex((gz) => liuqinOf(gongWuxing, gz[1]) === qin)
    if (pos >= 0) {
      fuShen.push({
        pos,
        liuqin: qin,
        ganzhi: palaceGanzhi[pos],
        wuxing: BRANCH_WUXING[palaceGanzhi[pos][1]],
        feiGanzhi: benGanzhi[pos],
      })
    }
  }

  if (movingIdx.length === 0) {
    warnings.push('六爻安静，无动爻，不变卦')
  }

  const chart: LiuyaoChart = {
    question: opts.question?.trim() ? opts.question.trim() : null,
    coins: [...coinResults],
    tosses,
    benGua: ben,
    bianGua: bian,
    huGua: hu,
    movingIdx,
    gong,
    gongWuxing,
    gongKind: kind,
    shiIndex: shi,
    yingIndex: ying,
    yaos,
    fuShen,
    yueJian,
    riChen,
    xunKong: kong,
    castAt: new Date(castAtMs).toISOString(),
    rulesetVersion: LIUYAO_RULESET_VERSION,
  }

  return wrapResult(
    {
      engine: 'liuyao',
      algorithmVersion: LIUYAO_ALGORITHM_VERSION,
      ruleVariant: LIUYAO_RULE_VARIANT,
      precision: 'validated',
      warnings,
      provenance: [
        { ruleId: 'coin-yaozhi', variant: '三钱掷筮·字三背二（六七八九）', source: '《增删卜易》' },
        { ruleId: 'najia-zhuanggua', variant: '八宫纳甲歌诀装干支', source: '《卜筮正宗》' },
        { ruleId: 'shiying-bagong', variant: '八宫世应口诀（天同二世天变五…）', source: '《卜筮正宗》' },
        { ruleId: 'liuqin-gonggua', variant: '以卦宫五行论六亲', source: '《增删卜易》' },
        { ruleId: 'liushen-rigan', variant: `日干起六神（${LIUSHEN_ORDER.join('·')}）`, source: '《卜筮正宗》' },
        { ruleId: 'xunkong-yuejian', variant: '日旬推空亡·节气月建', source: '《增删卜易》' },
        { ruleId: 'guaci-yaoci', variant: '《周易》公版卦爻辞', source: '《周易》' },
      ],
    },
    chart,
  )
}

/** 便捷入口：直接以六爻数值起卦（跳过铜钱解析） */
export function castWithTosses(
  tosses: TossValue[],
  opts: LiuyaoCastOptions = {},
): EngineResult<LiuyaoChart> {
  const coins = tosses.flatMap((t) => {
    // 由爻值还原一组可能的铜钱（2/3 组合），仅作记录：和为 t 的三枚
    const threes = t - 6 // 和 = 6 + (3的个数)
    return [2, 2, 2].map((v, i) => (i < threes ? 3 : v))
  })
  return castWithCoins(coins, opts)
}
