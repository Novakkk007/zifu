/**
 * 时家奇门（拆补法·转盘）起局引擎
 *
 * 算法链路：
 * 1. 时刻统一：输入（ISO / IANA 墙钟）→ 真实 UTC → 东八区墙钟（伪毫秒，与 bazi-core 一致）。
 * 2. 阴阳遁：以真实节气时刻判定——冬至→夏至阳遁，夏至→冬至阴遁（lunar-typescript 全 24 节气）。
 * 3. 局数（拆补法）：交节即换局；符头（最近甲己日）地支定三元——
 *    子午卯酉上元、寅申巳亥中元、辰戌丑未下元，查遁甲局数歌诀表。
 * 4. 地盘：三奇六仪（戊己庚辛壬癸丁丙乙）自局数宫起，阳顺阴逆布九宫（洛书数序）。
 * 5. 值符值使：时柱求旬首，旬首遁仪所落地盘宫之星为值符、门为值使（中五寄坤二）。
 * 6. 天盘：值符随时干——值符星加时干所临地盘宫，九星沿外环顺转，星携本宫地盘干；
 *    天禽寄二宫，随天芮同转并兼带中五地盘干。
 * 7. 人盘：值使随时宫——自值使本宫起，阳顺阴逆按九宫数序数至时支（旬首时支为起点），
 *    落中五者阳遁寄艮八、阴遁寄坤二；八门以值使为锚按休生伤杜景死惊开顺排外环。
 * 8. 神盘：值符起值符星所临宫，阳顺阴逆布八神（白虎/玄武阴遁异名勾陈/朱雀）。
 * 9. 空亡（时柱旬空两支所及宫）、马星（时支三合驿马）。
 *
 * 日柱换日：子初（23:00）换日（晚子时归次日），与 bazi-core zichu 规则一致。
 *
 * 规则出处：《烟波钓叟歌》（公版原文）。
 */
import {
  BRANCHES,
  JIAZI,
  SHUTU_START,
  STEMS,
  findJiazi,
  fromPseudoMs,
  hourToBranchIdx,
  ianaWallClockToUtcMs,
  kongWangBranches,
  fmtYmdHms,
  fmtYmdHm,
} from '../../bazi-core'
import { lunarAt } from '../../bazi-core/calendar'
import { wrapResult, type EngineResult, type RuleProvenance } from '../engine-result'
import {
  BASE_DOOR,
  BASE_STAR,
  BRANCH_PALACE,
  DOORS_SEQ,
  GODS_SEQ,
  GOD_ALIAS,
  GUA_LABEL,
  JU_TABLE,
  RING,
  XUN_YI,
  YANG_JIE,
  YI9,
  YUAN_SHANG,
  YUAN_ZHONG,
  maXingBranch,
} from './tables'
import type { QimenChart, QimenInput, QimenPalace, Yuan } from './types'

export const QIMEN_ALGORITHM_VERSION = 'qimen-core@1'
export const QIMEN_RULE_VARIANT = '时家奇门-拆补法(转盘)'

const PROVENANCE: RuleProvenance[] = [
  {
    ruleId: 'yinyang-dun',
    variant: '二至还乡：冬至→夏至阳遁，夏至→冬至阴遁（真实节气时刻）',
    source: '《烟波钓叟歌》「阴阳顺逆妙难穷，二至还归一九宫」（公版原文）',
  },
  {
    ruleId: 'chaibu-ju',
    variant: '拆补法定局：交节即换局，符头（甲己日）地支定上中下元',
    source: '《烟波钓叟歌》遁甲局数歌诀「冬至惊蛰一七四……大雪四七一两般」（公版原文）',
  },
  {
    ruleId: 'di-pan',
    variant: '三奇六仪戊己庚辛壬癸丁丙乙，阳遁顺布、阴遁逆布九宫',
    source: '《烟波钓叟歌》（公版原文）',
  },
  {
    ruleId: 'zhifu-zhishi',
    variant: '时柱旬首遁仪定值符星、值使门；天禽寄坤二宫',
    source: '《烟波钓叟歌》（公版原文）',
  },
  {
    ruleId: 'tian-pan',
    variant: '值符随时干：值符星加时干宫，九星顺转，星携本宫地盘干（天禽随芮兼带中五干）',
    source: '《烟波钓叟歌》（公版原文）',
  },
  {
    ruleId: 'ren-pan',
    variant: '值使随时宫：阳顺阴逆数至时支；落中五者阳遁寄艮八、阴遁寄坤二',
    source: '《烟波钓叟歌》（公版原文）',
  },
  {
    ruleId: 'shen-pan',
    variant: '八神值符起，阳遁顺布、阴遁逆布（白虎/玄武阴遁异名勾陈/朱雀）',
    source: '《烟波钓叟歌》（公版原文）',
  },
  {
    ruleId: 'kongwang-maxing',
    variant: '空亡取时柱旬空两支；马星按时支三合驿马',
    source: '《烟波钓叟歌》及干支传统（公版文献）',
  },
]

const mod = (n: number, m: number) => ((n % m) + m) % m

/** 解析输入时刻 → { utcMs, warnings } */
function parseInputTime(input: QimenInput): { utcMs: number; warnings: string[] } {
  const warnings: string[] = []
  const raw = input.datetime.trim()
  // 带时区偏移（Z 或 ±hh:mm / ±hhmm）→ 绝对时刻
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    const utcMs = Date.parse(raw)
    if (Number.isNaN(utcMs)) throw new Error(`无法解析的时刻：${raw}`)
    return { utcMs, warnings }
  }
  // 无时区偏移 → 按 IANA 时区墙钟解析（缺省东八区）
  const m = raw.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/,
  )
  if (!m) throw new Error(`无法解析的时刻：${raw}（应为 ISO 格式，如 2024-12-21T18:00）`)
  const tz = input.ianaTimezone?.trim() || 'Asia/Shanghai'
  if (!input.ianaTimezone) {
    warnings.push('输入时刻未携带时区，已按东八区（Asia/Shanghai）墙钟解析。')
  }
  const utcMs = ianaWallClockToUtcMs(tz, {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: Number(m[4]),
    minute: Number(m[5]),
    second: m[6] ? Number(m[6]) : 0,
  })
  return { utcMs, warnings }
}

/** 求全 24 节气中，伪毫秒时刻之前最近的一个（含精确交节时刻） */
function prevJieQi(pseudoMs: number): { name: string; ms: number } {
  const lunar = lunarAt(pseudoMs)
  const prev = lunar.getPrevJieQi()
  const s = prev.getSolar()
  const ms = Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond())
  return { name: prev.getName(), ms }
}

/**
 * 时家奇门起局（拆补法·转盘）。
 * 同一输入时刻 → 同一局盘（纯函数，无随机源）。
 */
export function computeQimen(input: QimenInput): EngineResult<QimenChart> {
  const { utcMs, warnings } = parseInputTime(input)
  const standardMs = utcMs + 8 * 3600_000 // 东八区墙钟（伪毫秒）
  const standard = fromPseudoMs(standardMs)

  /* ---- 日柱 / 时柱（子初 23:00 换日） ---- */
  const lunar = lunarAt(standardMs)
  const dayGZ = lunar.getDayInGanZhiExact()
  const dayJiaziIdx = JIAZI.indexOf(dayGZ)
  if (dayJiaziIdx < 0) throw new Error(`日柱解析失败：${dayGZ}`)
  const dayStemIdx = dayJiaziIdx % 10

  const hourBranchIdx = hourToBranchIdx(standard.hour)
  const hourStemIdx = (SHUTU_START[dayStemIdx % 5] + hourBranchIdx) % 10
  const hourJiaziIdx = findJiazi(hourStemIdx, hourBranchIdx)
  const hourGZ = JIAZI[hourJiaziIdx]

  /* ---- 阴阳遁 + 节气 ---- */
  const jie = prevJieQi(standardMs)
  const juRow = JU_TABLE[jie.name]
  if (!juRow) throw new Error(`未识别的节气：${jie.name}`)
  const dun: '阳遁' | '阴遁' = YANG_JIE.has(jie.name) ? '阳遁' : '阴遁'

  /* ---- 拆补法三元局数 ---- */
  const futouIdx = dayJiaziIdx - (dayStemIdx % 5) // 最近甲己日（符头）
  const futouBranch = futouIdx % 12
  const yuanIdx = YUAN_SHANG.has(futouBranch) ? 0 : YUAN_ZHONG.has(futouBranch) ? 1 : 2
  const yuan: Yuan = (['上元', '中元', '下元'] as const)[yuanIdx]
  const ju = juRow[yuanIdx]

  /* ---- 地盘三奇六仪：阳顺阴逆 ---- */
  const diGan: Record<number, string> = {}
  for (let i = 0; i < 9; i += 1) {
    const p = dun === '阳遁' ? mod(ju - 1 + i, 9) + 1 : mod(ju - 1 - i, 9) + 1
    diGan[p] = YI9[i]
  }
  const palaceOfGan = (g: string) =>
    Number(Object.keys(diGan).find((k) => diGan[Number(k)] === g))

  /* ---- 旬首 → 值符星 / 值使门 ---- */
  const xun = Math.floor(hourJiaziIdx / 10) // 0..5
  const xunYi = XUN_YI[xun]
  const xunshou = `${JIAZI[xun * 10]}${xunYi}`
  const xunRawPalace = palaceOfGan(xunYi)
  // 旬首遁仪落中五：天禽寄坤二宫
  const zfOrigin = xunRawPalace === 5 ? 2 : xunRawPalace
  const zhifuStar = BASE_STAR[xunRawPalace] // 中五时为天禽（寄二宫行权）
  const zhishiDoor = BASE_DOOR[zfOrigin] || '死'

  /* ---- 天盘：值符随时干 ---- */
  const hourStem = STEMS[hourStemIdx]
  const rawTarget = hourStemIdx === 0 ? zfOrigin : palaceOfGan(hourStem)
  const target = rawTarget === 5 ? 2 : rawTarget // 时干落中五寄坤二

  const ringIdx = (p: number) => RING.indexOf(p as (typeof RING)[number])
  const shift = mod(ringIdx(target) - ringIdx(zfOrigin), 8)
  const star: Record<number, string> = {}
  const starJi: Record<number, string> = {}
  const tianGan: Record<number, string> = {}
  const tianGanJi: Record<number, string> = {}
  for (let i = 0; i < 8; i += 1) {
    const originPalace = RING[mod(i - shift, 8)]
    const p = RING[i]
    star[p] = BASE_STAR[originPalace]
    tianGan[p] = diGan[originPalace]
    if (originPalace === 2) {
      // 天禽寄坤二：随天芮同转，兼带中五地盘干
      starJi[p] = BASE_STAR[5]
      tianGanJi[p] = diGan[5]
    }
  }

  /* ---- 人盘：值使随时宫 ---- */
  const xunshouBranchIdx = (xun * 10) % 12 // 旬首时支（子戌申午辰寅）
  const step = mod(hourBranchIdx - xunshouBranchIdx, 12)
  let landing =
    dun === '阳遁' ? mod(zfOrigin - 1 + step, 9) + 1 : mod(zfOrigin - 1 - step, 9) + 1
  if (landing === 5) landing = dun === '阳遁' ? 8 : 2 // 值使落中五：阳寄艮八、阴寄坤二
  const door: Record<number, string> = {}
  const r0 = ringIdx(landing)
  const k0 = DOORS_SEQ.indexOf(zhishiDoor as (typeof DOORS_SEQ)[number])
  for (let k = 0; k < 8; k += 1) {
    door[RING[mod(r0 + k, 8)]] = DOORS_SEQ[mod(k0 + k, 8)]
  }

  /* ---- 神盘：值符起，阳顺阴逆 ---- */
  const god: Record<number, string> = {}
  const s0 = ringIdx(target)
  for (let k = 0; k < 8; k += 1) {
    const idx = dun === '阳遁' ? mod(s0 + k, 8) : mod(s0 - k, 8)
    god[RING[idx]] = GODS_SEQ[k]
  }

  /* ---- 空亡（时柱旬）与马星（时支驿马） ---- */
  const kwBranches = kongWangBranches(hourJiaziIdx)
  const kwPalaces = new Set(kwBranches.map((b) => BRANCH_PALACE[b]))
  const mxBranchIdx = maXingBranch(hourBranchIdx)
  const mxPalace = BRANCH_PALACE[mxBranchIdx]

  /* ---- 组盘 ---- */
  const palaces: QimenPalace[] = []
  for (let p = 1; p <= 9; p += 1) {
    const g = god[p] ?? ''
    palaces.push({
      num: p,
      gua: GUA_LABEL[p],
      diGan: diGan[p],
      tianGan: tianGan[p] ?? '',
      tianGanJi: tianGanJi[p] ?? '',
      star: star[p] ?? '',
      starJi: starJi[p] ?? '',
      door: door[p] ?? '',
      god: g,
      godAlias: dun === '阴遁' ? (GOD_ALIAS[g] ?? '') : '',
      isZhifu: p === target,
      isZhishi: p === landing,
      isKongWang: kwPalaces.has(p),
      hasMaXing: p === mxPalace,
    })
  }

  const chart: QimenChart = {
    standardTime: fmtYmdHm(standardMs),
    utcTime: new Date(utcMs).toISOString(),
    dun,
    ju,
    jie: jie.name,
    jieTime: fmtYmdHms(jie.ms),
    yuan,
    futou: JIAZI[futouIdx],
    dayGZ,
    hourGZ,
    xunshou,
    xunYi,
    zhifuStar,
    zhishiDoor,
    zhifuOrigin: zfOrigin,
    zhifuPalace: target,
    zhishiPalace: landing,
    kongWang: kwBranches.map((b) => BRANCHES[b]),
    maXingBranch: BRANCHES[mxBranchIdx],
    maXingPalace: mxPalace,
    question: input.question?.trim() ?? '',
    palaces,
  }

  return wrapResult(
    {
      engine: 'qimen',
      algorithmVersion: QIMEN_ALGORITHM_VERSION,
      ruleVariant: QIMEN_RULE_VARIANT,
      precision: 'validated',
      warnings,
      provenance: PROVENANCE,
    },
    chart,
  )
}

/** 奇门局盘 → AI 参详结构化摘要（不含输入时刻以外的冗余信息） */
export function qimenSummaryForAi(chart: QimenChart): string {
  const lines: string[] = []
  lines.push(
    `奇门遁甲局（时家·拆补法转盘）：${chart.dun}${chart.ju}局 · ${chart.jie}${chart.yuan} · 符头${chart.futou}`,
  )
  lines.push(`日柱${chart.dayGZ} 时柱${chart.hourGZ} · 旬首${chart.xunshou}`)
  lines.push(`值符${chart.zhifuStar}临${GUA_LABEL[chart.zhifuPalace]}宫 · 值使${chart.zhishiDoor}门临${GUA_LABEL[chart.zhishiPalace]}宫`)
  lines.push(`空亡${chart.kongWang.join('')} · 马星${chart.maXingBranch}在${GUA_LABEL[chart.maXingPalace]}宫`)
  for (const p of chart.palaces) {
    const parts = [
      `${p.gua}宫`,
      p.star ? `${p.star}${p.starJi ? `(${p.starJi}寄)` : ''}` : '中宫',
      p.door ? `${p.door}门` : '',
      p.god || '',
      `天${p.tianGan || '—'}${p.tianGanJi ? `+${p.tianGanJi}` : ''}`,
      `地${p.diGan}`,
      p.isKongWang ? '空亡' : '',
      p.hasMaXing ? '马星' : '',
    ].filter(Boolean)
    lines.push(parts.join(' '))
  }
  if (chart.question) lines.push(`所问：${chart.question}`)
  return lines.join('\n')
}
