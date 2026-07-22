/**
 * 紫微斗数排盘引擎 · 北派（《紫微斗数全书》安星法）
 *
 * 算法链路：
 * 1. 历法归一：公历→农历（bazi-core calendar，lunar-typescript）；闰月按当月计。
 * 2. 年干支：按农历年（正月初一换年，北派惯例，不依立春）。
 * 3. 命身宫：寅起正月顺数至生月，自该宫起子时，逆数至生时安命、顺数至生时安身。
 * 4. 十二宫：自命宫逆布（命兄夫子财疾迁友官田福父）；宫干五虎遁。
 * 5. 五行局：命宫干支纳音五行定局（水二/木三/金四/土五/火六）。
 * 6. 紫微定位：生日 ÷ 局数商数法（不整除则补数，补奇减、补偶加，自寅起算）。
 * 7. 十四主星：紫微系逆布、天府系顺布（天府与紫微以寅申轴对称）。
 * 8. 辅星：昌曲（时起）、辅弼（月起）、魁钺（年干）、禄存羊陀（年干）、
 *    火铃（年支+时支）、空劫（时起）、天马红鸾天喜（年支）。
 * 9. 生年四化：十干四化诀，随星标注入宫。
 * 10. 大限：阳男阴女顺行、阴男阳女逆行，起限虚岁 = 局数，每限十年。
 */
import {
  BRANCHES,
  STEMS,
  NAYIN,
  HUTU_START,
  findJiazi,
  solarToLunar,
  lunarToSolar,
} from '../../bazi-core'
import { wrapResult, type EngineResult, type RuleProvenance } from '../engine-result'
import {
  ZIWEI_RULESET_VERSION,
  ZIWEI_ALGORITHM_VERSION,
  ZIWEI_RULE_VARIANT,
  RING,
  PALACE_NAMES,
  ZIWEI_SERIES,
  TIANFU_SERIES,
  NAYIN_JU,
  SIHUA,
  HUA_ORDER,
  KUI_YUE,
  LUCUN_BRANCH,
  HUOXING_START,
  LINGXING_START,
  TIANMA_BRANCH,
  MING_ZHU,
  SHEN_ZHU,
  STAR_KIND,
} from './rules'
import type {
  DaxianStep,
  HuaKind,
  SihuaEntry,
  ZiweiChartData,
  ZiweiInput,
  ZiweiPalace,
  ZiweiStar,
} from './types'

const mod12 = (n: number) => ((n % 12) + 12) % 12
const mod10 = (n: number) => ((n % 10) + 10) % 10

const PROVENANCE: RuleProvenance[] = [
  { ruleId: 'zw-ming-shen-gong', variant: ZIWEI_RULE_VARIANT, source: '《紫微斗数全书·安命身宫诀》：寅宫起正月，顺数至生月，即从生月宫起子时，逆数至生时安命宫，顺数至生时安身宫' },
  { ruleId: 'zw-twelve-palaces', variant: ZIWEI_RULE_VARIANT, source: '《紫微斗数全书》：命宫既定，逆布兄弟、夫妻、子女、财帛、疾厄、迁移、仆役、官禄、田宅、福德、父母；宫干以五虎遁年起' },
  { ruleId: 'zw-wuxing-ju', variant: ZIWEI_RULE_VARIANT, source: '《紫微斗数全书》：以命宫干支纳音定五行局——水二局、木三局、金四局、土五局、火六局' },
  { ruleId: 'zw-ziwei-locate', variant: ZIWEI_RULE_VARIANT, source: '《紫微斗数全书·安紫微诀》：以生日数除局数，商数自寅起定紫微；除不尽者补至整除，补奇数则商减补、补偶数则商加补' },
  { ruleId: 'zw-major-stars', variant: ZIWEI_RULE_VARIANT, source: '《紫微斗数全书·安南北斗诸星诀》：紫微星系逆布（机阳武同廉），天府与紫微寅申轴对称，天府星系顺布（阴贪巨相梁杀破）' },
  { ruleId: 'zw-aux-stars', variant: ZIWEI_RULE_VARIANT, source: '《紫微斗数全书》安昌曲、辅弼、魁钺、禄存羊陀、火铃、空劫、天马、红鸾天喜诸诀' },
  { ruleId: 'zw-sihua', variant: ZIWEI_RULE_VARIANT, source: '《紫微斗数全书·十干四化诀》：甲廉破武阳、乙机梁紫阴、丙同机昌廉、丁阴同机巨、戊贪阴右机、己武贪梁曲、庚阳武阴同、辛巨阳曲昌、壬梁紫左武、癸破巨阴贪' },
  { ruleId: 'zw-daxian', variant: ZIWEI_RULE_VARIANT, source: '《紫微斗数全书》：大限阳男阴女顺行、阴男阳女逆行，起限虚岁即五行局数，每限十年' },
  { ruleId: 'zw-ming-shen-zhu', variant: ZIWEI_RULE_VARIANT, source: '《紫微斗数全书》：命主以命宫地支起（子贪狼…午破军），身主以生年地支起（子午火星…巳亥天机）' },
]

/**
 * 紫微定位（商数法）：
 * q = ⌈day / ju⌉，补数 r = q·ju − day；
 * r = 0 → 取商 q；r 为奇 → q − r；r 为偶 → q + r；
 * 得数 n 自寅宫起数（寅=1），即支序 mod12(2 + n − 1)。
 */
export function locateZiwei(day: number, ju: number): number {
  const q = Math.ceil(day / ju)
  const r = q * ju - day
  let n = q
  if (r !== 0) n = r % 2 === 1 ? q - r : q + r
  return mod12(2 + (n - 1))
}

export function paipanZiwei(rawInput: ZiweiInput): EngineResult<ZiweiChartData> {
  const warnings: string[] = []
  const input: ZiweiInput = { ...rawInput, isLeapMonth: rawInput.calendar === 'lunar' ? rawInput.isLeapMonth === true : false }

  // ---- 1. 历法归一 ----
  let lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean
  let solar: { year: number; month: number; day: number }
  if (input.calendar === 'lunar') {
    isLeap = input.isLeapMonth === true
    lunarYear = input.year
    lunarMonth = input.month
    lunarDay = input.day
    solar = lunarToSolar(input.year, input.month, input.day, isLeap)
    if (isLeap) {
      warnings.push(`闰月处理：农历闰${input.month}月按${input.month}月安星（北派全书惯例，闰月不另分上下半月）。`)
    }
  } else {
    const l = solarToLunar(input.year, input.month, input.day)
    lunarYear = l.year
    lunarMonth = Math.abs(l.month)
    lunarDay = l.day
    isLeap = l.isLeapMonth
    solar = { year: input.year, month: input.month, day: input.day }
    if (isLeap) {
      warnings.push(`该公历日对应农历闰${lunarMonth}月，按${lunarMonth}月安星（闰月按当月计）。`)
    }
  }

  // ---- 2. 年干支（农历正月初一换年） ----
  const yearStemIdx = mod10(lunarYear - 4)
  const yearBranchIdx = mod12(lunarYear - 4)
  const yearStem = STEMS[yearStemIdx]
  const yearBranch = BRANCHES[yearBranchIdx]
  const yearGanzhi = `${yearStem}${yearBranch}`

  const h = input.hourBranch
  const m = lunarMonth

  // ---- 3. 命宫 / 身宫 ----
  const monthBranchIdx = mod12(2 + (m - 1)) // 寅起正月顺数至生月
  const mingBranchIdx = mod12(monthBranchIdx - h)
  const shenBranchIdx = mod12(monthBranchIdx + h)

  // ---- 4. 十二宫 + 宫干（五虎遁） ----
  const yinStemIdx = HUTU_START[yearStemIdx % 5]
  // 宫干：寅宫起五虎遁干，天干随宫顺布（子宫距寅 10 位，须先按 12 取模再遁干）
  const palaceStemIdx = (b: number) => mod10(yinStemIdx + mod12(b - 2))
  const palaceNameAt = (b: number) => PALACE_NAMES[mod12(mingBranchIdx - b)]

  // ---- 5. 五行局（命宫干支纳音） ----
  const mingStemIdx = palaceStemIdx(mingBranchIdx)
  const mingJiazi = findJiazi(mingStemIdx, mingBranchIdx)
  const nayin = NAYIN[Math.floor(mingJiazi / 2)]
  const nayinWuxing = nayin[nayin.length - 1]
  const juEntry = NAYIN_JU[nayinWuxing]
  if (!juEntry) throw new Error(`无法由命宫纳音「${nayin}」定五行局`)
  const [juName, juNum] = juEntry
  const mingGongGanzhi = `${STEMS[mingStemIdx]}${BRANCHES[mingBranchIdx]}`

  // ---- 6. 紫微定位 + 7. 十四主星 ----
  const ziweiIdx = locateZiwei(lunarDay, juNum)
  const tianfuIdx = mod12(4 - ziweiIdx)
  const majorAt: string[][] = Array.from({ length: 12 }, () => [])
  for (const [star, off] of ZIWEI_SERIES) majorAt[mod12(ziweiIdx + off)].push(star)
  for (const [star, off] of TIANFU_SERIES) majorAt[mod12(tianfuIdx + off)].push(star)

  // ---- 8. 辅星 ----
  const minorAt: string[][] = Array.from({ length: 12 }, () => [])
  minorAt[mod12(10 - h)].push('文昌')
  minorAt[mod12(4 + h)].push('文曲')
  minorAt[mod12(4 + (m - 1))].push('左辅')
  minorAt[mod12(10 - (m - 1))].push('右弼')
  const [kui, yue] = KUI_YUE[yearStemIdx]
  minorAt[kui].push('天魁')
  minorAt[yue].push('天钺')
  const lucun = LUCUN_BRANCH[yearStemIdx]
  minorAt[lucun].push('禄存')
  minorAt[mod12(lucun + 1)].push('擎羊')
  minorAt[mod12(lucun - 1)].push('陀罗')
  minorAt[mod12(HUOXING_START[yearBranch] + h)].push('火星')
  minorAt[mod12(LINGXING_START[yearBranch] + h)].push('铃星')
  minorAt[mod12(11 - h)].push('地空')
  minorAt[mod12(11 + h)].push('地劫')
  minorAt[TIANMA_BRANCH[yearBranch]].push('天马')
  const hongluan = mod12(3 - yearBranchIdx)
  minorAt[hongluan].push('红鸾')
  minorAt[mod12(hongluan + 6)].push('天喜')

  // ---- 9. 生年四化 ----
  const sihuaStars = SIHUA[yearStemIdx]
  const huaOf: Record<string, HuaKind> = {
    [sihuaStars[0]]: '禄',
    [sihuaStars[1]]: '权',
    [sihuaStars[2]]: '科',
    [sihuaStars[3]]: '忌',
  }
  const sihua: SihuaEntry[] = []
  const withHua = (name: string, kind: ZiweiStar['kind']): ZiweiStar =>
    huaOf[name] ? { name, kind, hua: huaOf[name] } : { name, kind }

  // ---- 10. 大限 ----
  const isYangYear = yearStemIdx % 2 === 0
  const forward = (isYangYear && input.gender === 'male') || (!isYangYear && input.gender === 'female')
  const genderKind = `${isYangYear ? '阳' : '阴'}${input.gender === 'male' ? '男' : '女'}`
  const currentYear = input.currentYear ?? new Date().getFullYear()
  const xuAge = currentYear - lunarYear + 1
  const steps: DaxianStep[] = Array.from({ length: 12 }, (_, i) => {
    const b = forward ? mod12(mingBranchIdx + i) : mod12(mingBranchIdx - i)
    const startAge = juNum + i * 10
    return {
      index: i,
      branch: BRANCHES[b],
      branchIdx: b,
      ganzhi: `${STEMS[palaceStemIdx(b)]}${BRANCHES[b]}`,
      palaceName: palaceNameAt(b),
      startAge,
      endAge: startAge + 9,
      isCurrent: xuAge >= startAge && xuAge <= startAge + 9,
    }
  })
  const currentDaxianIndex = Math.max(0, steps.findIndex((s) => s.isCurrent))

  // ---- 组盘（寅起环形序，供 4×4 宫格渲染） ----
  const daxianRangeOf = (b: number) => {
    const step = steps.find((s) => s.branchIdx === b)!
    return { startAge: step.startAge, endAge: step.endAge }
  }
  const palaces: ZiweiPalace[] = RING.map((branch) => {
    const b = BRANCHES.indexOf(branch as (typeof BRANCHES)[number])
    const stemIdx = palaceStemIdx(b)
    const majors = majorAt[b].map((n) => withHua(n, 'major'))
    const minors = minorAt[b].map((n) => withHua(n, STAR_KIND[n] ?? 'misc'))
    for (const s of [...majors, ...minors]) {
      if (s.hua) {
        sihua.push({ star: s.name, hua: s.hua, branch, palaceName: palaceNameAt(b) })
      }
    }
    return {
      branch,
      branchIdx: b,
      stem: STEMS[stemIdx],
      ganzhi: `${STEMS[stemIdx]}${branch}`,
      name: palaceNameAt(b),
      isMing: b === mingBranchIdx,
      isShen: b === shenBranchIdx,
      majors,
      minors,
      daxian: daxianRangeOf(b),
    }
  })
  // 四化按 禄权科忌 固定序输出
  sihua.sort((a, b2) => HUA_ORDER.indexOf(a.hua) - HUA_ORDER.indexOf(b2.hua))

  const data: ZiweiChartData = {
    rulesetVersion: ZIWEI_RULESET_VERSION,
    input,
    lunar: { year: lunarYear, month: isLeap ? -lunarMonth : lunarMonth, day: lunarDay, isLeapMonth: isLeap },
    solar,
    yearGanzhi,
    yearStem,
    yearBranch,
    yearStemIdx,
    yearBranchIdx,
    genderKind,
    mingBranch: BRANCHES[mingBranchIdx],
    mingBranchIdx,
    shenBranch: BRANCHES[shenBranchIdx],
    shenBranchIdx,
    mingGongGanzhi,
    ju: { name: juName, num: juNum, nayin },
    ziweiBranch: BRANCHES[ziweiIdx],
    tianfuBranch: BRANCHES[tianfuIdx],
    mingZhu: MING_ZHU[mingBranchIdx],
    shenZhu: SHEN_ZHU[yearBranchIdx],
    sihua,
    palaces,
    daxian: {
      direction: forward ? '顺行' : '逆行',
      directionReason: `${genderKind}${forward ? '顺行' : '逆行'}（阳男阴女顺行，阴男阳女逆行）`,
      startAge: juNum,
      steps,
    },
    currentDaxianIndex: currentDaxianIndex === -1 ? 0 : currentDaxianIndex,
  }

  return wrapResult(
    {
      engine: 'ziwei',
      algorithmVersion: ZIWEI_ALGORITHM_VERSION,
      ruleVariant: ZIWEI_RULE_VARIANT,
      precision: 'validated',
      warnings,
      provenance: PROVENANCE,
    },
    data,
  )
}
