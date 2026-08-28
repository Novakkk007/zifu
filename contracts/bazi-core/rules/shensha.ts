/**
 * 规则数据 · 神煞注册表 v5（40 种）
 *
 * v2 变更（RULESET 1.1.0）：
 * - 每条神煞为结构化条目：ruleId / 流派变体 / 起例依据 / 命中柱位类型 /
 *   多命中策略 / 原始口诀(verse) / 传统出处(source，后台字段) /
 *   现代化说明(modernExplanation，原创，注明传统说法) / 测试夹具(testFixtures)。
 * - 多命中策略固定为 'list-all'：同一神煞命中多柱时分别列出，
 *   禁止合并为单个布尔（见 types.ts 的 ShenshaHit：每次命中一条记录）。
 * - 起例以日干/日支为主、兼顾年支者按传统通例标注于 basis 与 variant。
 */
import { BRANCHES, JIAZI, STEMS, kongWangBranches } from './stems-branches'

export const RULE_META = {
  name: '神煞规则集 v5（40 种）',
  source: '《三命通会》《渊海子平》神煞诸章（口诀为传统公共文献，解释为原创）',
} as const

/**
 * 本注册表条目的 rulesetVersion 字段值。
 * 与 rules/index.ts 的 RULESET_VERSION 保持一致（有测试断言同步）。
 */
export const SHENSHA_RULESET_VERSION = '1.5.0'

/** 神煞计算上下文（时柱可能缺失） */
export interface ShenshaContext {
  gender: 'male' | 'female'
  dayStemIdx: number
  dayBranchIdx: number
  yearBranchIdx: number
  monthBranchIdx: number
  dayJiaziIdx: number
  /** 四柱干支；hour 为 null 表示时辰未知 */
  pillars: { label: string; stemIdx: number; branchIdx: number }[]
}

export interface ShenshaHitRaw {
  position: string // 如「年支」「日干」「时支」
  char: string
}

/** 起例依据（输入基准） */
export type ShenshaInputBasis =
  | 'yearStem'
  | 'dayStem'
  | 'yearBranch'
  | 'dayBranch'
  | 'monthBranch'
  | 'dayJiazi'
  | 'pillarStems'

/** 命中柱位类型 */
export type ShenshaTargetPosition =
  | 'anyBranch' // 四柱任一地支
  | 'anyStem' // 四柱任一天干
  | 'anyStemOrBranch' // 四柱天干或地支（天德贵人）
  | 'nonDayBranch' // 年/月/时支（空亡：日支本旬不计）
  | 'dayPillar' // 仅按日柱干支整体判定
  | 'hourBranch' // 仅命中时支

/** 测试夹具输入：四柱干支（时柱 null 表示时辰未知） */
export interface ShenshaFixtureInput {
  /** [年柱, 月柱, 日柱, 时柱|null]，干支须为合法甲子组合 */
  pillars: [string, string, string, string | null]
  /** 元辰等区分男女的规则使用；省略时按男命构造夹具 */
  gender?: 'male' | 'female'
}

/** 测试夹具：expectHits 为命中柱位列表（如 ['年支','日支']），空数组 = 不命中 */
export interface ShenshaTestFixture {
  input: ShenshaFixtureInput
  expectHits: string[]
}

/** 神煞结构化注册条目（v2） */
export interface ShenshaDef {
  /** 规则标识，如 "shensha.tianyi.v1" */
  ruleId: string
  name: string
  /** 流派变体标注（如 天乙贵人「甲戊庚牛羊」通行歌诀版） */
  variant: string
  /** 起例依据 */
  inputBasis: ShenshaInputBasis
  /** 命中柱位类型 */
  targetPosition: ShenshaTargetPosition
  /** 多柱命中策略：分别列出，禁止合并布尔 */
  multipleHitPolicy: 'list-all'
  /** 条目所属规则集版本 */
  rulesetVersion: string
  /** 原始规则口诀（传统公共文本，后台字段） */
  verse: string
  /** 起例说明 */
  basis: string
  /** 传统出处（后台字段） */
  source: string
  /** 前台简洁现代化说明（原创，注明传统说法，无迷信断言） */
  modernExplanation: string
  /** 每条 ≥1 个测试夹具 */
  testFixtures: ShenshaTestFixture[]
  /** 命中条件：返回命中柱位与字（空数组 = 未命中） */
  find: (ctx: ShenshaContext) => ShenshaHitRaw[]
}

const branchHits = (ctx: ShenshaContext, targets: number[]): ShenshaHitRaw[] =>
  ctx.pillars
    .filter((p) => targets.includes(p.branchIdx))
    .map((p) => ({ position: `${p.label.replace('柱', '')}支`, char: BRANCHES[p.branchIdx] }))

const stemHits = (ctx: ShenshaContext, targets: number[]): ShenshaHitRaw[] =>
  ctx.pillars
    .filter((p) => targets.includes(p.stemIdx))
    .map((p) => ({ position: `${p.label.replace('柱', '')}干`, char: STEMS[p.stemIdx] }))

const dayPillarHits = (ctx: ShenshaContext, targets: ReadonlySet<string>): ShenshaHitRaw[] => {
  const ganzhi = JIAZI[ctx.dayJiaziIdx]
  return targets.has(ganzhi) ? [{ position: '日柱', char: ganzhi }] : []
}

/** 四柱天干须按年→月→日→时的先后次序全见；允许四柱中夹一柱。 */
const orderedStemHits = (ctx: ShenshaContext, sequence: number[]): ShenshaHitRaw[] => {
  const hits: ShenshaHitRaw[] = []
  let cursor = 0
  for (const pillar of ctx.pillars) {
    if (pillar.stemIdx !== sequence[cursor]) continue
    hits.push({ position: `${pillar.label.replace('柱', '')}干`, char: STEMS[pillar.stemIdx] })
    cursor += 1
    if (cursor === sequence.length) return hits
  }
  return []
}

/** 三合局分组（驿马/桃花/华盖/将星共用）：申子辰 / 寅午戌 / 巳酉丑 / 亥卯未 */
const SANHE_OF_BRANCH = (b: number): number => {
  if ([8, 0, 4].includes(b)) return 0
  if ([2, 6, 10].includes(b)) return 1
  if ([5, 9, 1].includes(b)) return 2
  return 3
}

const V = SHENSHA_RULESET_VERSION
const V_LEGACY = '1.4.0'  // 金标基线：老 40 种神煞锁 1.4.0，不随版本滚动

export const SHENSHA_REGISTRY: ShenshaDef[] = [
  {
    ruleId: 'shensha.tianyi.v1',
    name: '天乙贵人',
    variant: '「甲戊庚牛羊」通行歌诀版（《渊海子平》系；古歌另有「甲戊兼牛羊，庚辛逢马虎」变体，本库不取）',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => {
      // 按日干序：甲戊庚→丑未，乙己→子申，丙丁→亥酉，辛→寅午，壬癸→卯巳
      const table: number[][] = [
        [1, 7], // 甲
        [0, 8], // 乙
        [11, 9], // 丙
        [11, 9], // 丁
        [1, 7], // 戊
        [0, 8], // 己
        [1, 7], // 庚
        [2, 6], // 辛
        [3, 5], // 壬
        [3, 5], // 癸
      ]
      return branchHits(ctx, table[ctx.dayStemIdx])
    },
    verse: '甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎，此是贵人方。',
    basis: '以日干起例，四柱地支见之为命中',
    source: '《渊海子平》论天乙贵人',
    modernExplanation:
      '传统视之为解难扶持之星，命带天乙者多被描述为人缘和顺、逢困易得人助；现代视角可理解为对人际支持系统的传统归纳。',
    testFixtures: [
      // 甲寅日（甲→丑未），年支丑命中
      { input: { pillars: ['辛丑', '辛卯', '甲寅', '庚午'] }, expectHits: ['年支'] },
      // 丁酉日（丁→亥酉），年支亥、日支酉双重命中（list-all）
      { input: { pillars: ['辛亥', '辛卯', '丁酉', '庚戌'] }, expectHits: ['年支', '日支'] },
    ],
  },
  {
    ruleId: 'shensha.wenchang.v1',
    name: '文昌贵人',
    variant: '通行歌诀版（甲乙巳午报君知）',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[5, 6, 8, 9, 8, 9, 11, 0, 2, 3][ctx.dayStemIdx]]),
    verse: '甲乙巳午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见兔入云梯。',
    basis: '以日干起例，地支见之为命中',
    source: '《三命通会》论文昌',
    modernExplanation:
      '传统上主文思与学业之象，命带文昌者被认为利于读书、写作与表达；现代可视为对学习能力的传统象征性描述。',
    testFixtures: [
      // 甲午日（甲→巳），年支巳命中
      { input: { pillars: ['乙巳', '戊寅', '甲午', '甲子'] }, expectHits: ['年支'] },
    ],
  },
  {
    ruleId: 'shensha.taiji.v1',
    name: '太极贵人',
    variant: '通行歌诀版（甲乙生人子午中）',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => {
      const table: number[][] = [
        [0, 6], // 甲乙 → 子午
        [0, 6],
        [3, 9], // 丙丁 → 卯酉
        [3, 9],
        [4, 10, 1, 7], // 戊己 → 辰戌丑未
        [4, 10, 1, 7],
        [2, 11], // 庚辛 → 寅亥
        [2, 11],
        [5, 8], // 壬癸 → 巳申
        [5, 8],
      ]
      return branchHits(ctx, table[ctx.dayStemIdx])
    },
    verse: '甲乙生人子午中，丙丁鸡兔定亨通，戊己两干临四季，庚辛寅亥禄丰隆，壬癸巳申偏喜美。',
    basis: '以日干起例，地支见之为命中',
    source: '《三命通会》论太极贵人',
    modernExplanation:
      '传统上主好寻根究底、喜探究玄理之象，被认为与哲学、术数之学有缘；现代可理解为对探究型人格倾向的传统描述。',
    testFixtures: [
      // 甲子日（甲→子午），年支午、日支子双重命中
      { input: { pillars: ['戊午', '庚申', '甲子', '乙丑'] }, expectHits: ['年支', '日支'] },
    ],
  },
  {
    ruleId: 'shensha.taohua.v1',
    name: '桃花（咸池）',
    variant: '以日支起例（兼顾年支）通行版',
    inputBasis: 'dayBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[9, 3, 6, 0][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    verse: '申子辰在酉，寅午戌在卯，巳酉丑在午，亥卯未在子。',
    basis: '以日支起例（兼顾年支），地支见之为命中',
    source: '《三命通会》论咸池',
    modernExplanation:
      '传统上主人缘、魅力与情感之象，吉凶随全局配合而定，不可单以凶论；现代可视为对人际吸引力的传统象征。',
    testFixtures: [
      // 戊寅日（寅午戌→卯），月支卯命中
      { input: { pillars: ['甲子', '丁卯', '戊寅', '壬子'] }, expectHits: ['月支'] },
    ],
  },
  {
    ruleId: 'shensha.yima.v1',
    name: '驿马',
    variant: '以日支起例（兼顾年支）通行版',
    inputBasis: 'dayBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[2, 8, 11, 5][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    verse: '申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳。',
    basis: '以日支起例（兼顾年支），地支见之为命中',
    source: '《三命通会》论驿马',
    modernExplanation:
      '传统上主迁动、出行与变动之象，命带驿马者多被描述为奔波或利远方发展；现代可理解为对流动性生活方式的传统归纳。',
    testFixtures: [
      // 壬子日（申子辰→寅），年支寅命中
      { input: { pillars: ['甲寅', '壬申', '壬子', '庚子'] }, expectHits: ['年支'] },
    ],
  },
  {
    ruleId: 'shensha.huagai.v1',
    name: '华盖',
    variant: '以日支起例（兼顾年支）通行版',
    inputBasis: 'dayBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[4, 10, 1, 7][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    verse: '申子辰见辰，寅午戌见戌，巳酉丑见丑，亥卯未见未。',
    basis: '以日支起例（兼顾年支），地支见之为命中',
    source: '《三命通会》论华盖',
    modernExplanation:
      '传统上主孤高好静、亲近艺文与玄思之象，谓之聪明而性僻；现代可视为对内向专注型气质的传统描述。',
    testFixtures: [
      // 庚午日（寅午戌→戌），时支戌命中
      { input: { pillars: ['甲子', '丙寅', '庚午', '丙戌'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.yangren.v1',
    name: '羊刃',
    variant: '阳刃为主、阴干刃在辰戌丑未并存流派说（本库按禄前一位并录，见 source）',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[3, 4, 6, 7, 6, 7, 9, 10, 0, 1][ctx.dayStemIdx]]),
    verse: '甲刃在卯，丙戊刃在午，庚刃在酉，壬刃在子；阴干刃在辰戌丑未（流派之说）。',
    basis: '以日干起例，地支见之为命中',
    source: '《三命通会》论阳刃（阴刃存流派争议，本库按禄前一位并录）',
    modernExplanation:
      '传统上主刚烈果决之象，身强见之易急躁冲动、身弱则可为助力，须配合全局看；现代可理解为对决断力与冲动性并存特质的传统描述。',
    testFixtures: [
      // 甲寅日（甲刃在卯），月支卯命中
      { input: { pillars: ['辛丑', '辛卯', '甲寅', '庚午'] }, expectHits: ['月支'] },
    ],
  },
  {
    ruleId: 'shensha.lushen.v1',
    name: '禄神',
    variant: '通行版（十干禄）',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[2, 3, 5, 6, 5, 6, 8, 9, 11, 0][ctx.dayStemIdx]]),
    verse: '甲禄在寅，乙禄在卯，丙戊禄在巳，丁己禄在午，庚禄在申，辛禄在酉，壬禄在亥，癸禄在子。',
    basis: '以日干起例，地支见之为命中',
    source: '《三命通会》论禄',
    modernExplanation:
      '即日主的临官之地，传统上主衣食俸禄与根基，视为养命之源；现代可理解为对稳定资源与自我根基的传统象征。',
    testFixtures: [
      // 甲寅日（甲禄在寅），日支寅命中
      { input: { pillars: ['辛丑', '辛卯', '甲寅', '庚午'] }, expectHits: ['日支'] },
    ],
  },
  {
    ruleId: 'shensha.kongwang.v1',
    name: '空亡',
    variant: '以日柱旬空为准（年柱旬空流派另计，本库不取）',
    inputBasis: 'dayJiazi',
    targetPosition: 'nonDayBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => {
      const voids = kongWangBranches(ctx.dayJiaziIdx)
      return ctx.pillars
        .filter((p) => p.label !== '日柱' && voids.includes(p.branchIdx))
        .map((p) => ({ position: `${p.label.replace('柱', '')}支`, char: BRANCHES[p.branchIdx] }))
    },
    verse: '甲子旬中戌亥空，甲戌旬中申酉空，甲申旬中午未空，甲午旬中辰巳空，甲辰旬中寅卯空，甲寅旬中子丑空。',
    basis: '以日柱所属旬起例，他柱地支见之为命中（日支本旬不计）',
    source: '《渊海子平》论空亡',
    modernExplanation:
      '传统上主虚而不实之象，认为落入空亡的字其力减半、吉凶皆打折扣；现代可视为一种对力量衰减的传统标记方式。',
    testFixtures: [
      // 甲寅日属甲寅旬（子丑空），年支丑命中
      { input: { pillars: ['辛丑', '辛卯', '甲寅', '庚午'] }, expectHits: ['年支'] },
      // 甲子日（戌亥空），四柱无戌亥 → 不命中
      { input: { pillars: ['甲子', '丙寅', '甲子', '庚午'] }, expectHits: [] },
    ],
  },
  {
    ruleId: 'shensha.tiande.v1',
    name: '天德贵人',
    variant: '通行歌诀版（正丁二坤宫）',
    inputBasis: 'monthBranch',
    targetPosition: 'anyStemOrBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => {
      // 正丁二坤（申）宫，三壬四辛同，五亥六甲上，七癸八寅逢，九丙十居乙，子巳丑庚中
      // 支序：寅2 卯3 辰4 巳5 午6 未7 申8 酉9 戌10 亥11 子0 丑1
      const stemTargets: Record<number, number> = {
        2: 3, // 寅月见丁
        4: 8, // 辰月见壬
        5: 7, // 巳月见辛
        7: 0, // 未月见甲
        8: 9, // 申月见癸
        10: 2, // 戌月见丙
        11: 1, // 亥月见乙
        1: 6, // 丑月见庚
      }
      const branchTargets: Record<number, number> = {
        3: 8, // 卯月见申
        6: 11, // 午月见亥
        9: 2, // 酉月见寅
        0: 5, // 子月见巳
      }
      const hits: ShenshaHitRaw[] = []
      const s = stemTargets[ctx.monthBranchIdx]
      if (s !== undefined) hits.push(...stemHits(ctx, [s]))
      const b = branchTargets[ctx.monthBranchIdx]
      if (b !== undefined) hits.push(...branchHits(ctx, [b]))
      return hits
    },
    verse: '正丁二坤（申）宫，三壬四辛同，五亥六甲上，七癸八寅逢，九丙十居乙，子巳丑庚中。',
    basis: '以月支起例，见对应天干或地支为命中',
    source: '《三命通会》论天德',
    modernExplanation:
      '传统视之为天地德秀之气，主性情温厚、遇难呈祥之象；现代可理解为对温厚品格与逢凶化吉叙事的传统表达。',
    testFixtures: [
      // 丙寅月见丁（干），时干丁命中
      { input: { pillars: ['甲寅', '丙寅', '戊申', '丁巳'] }, expectHits: ['时干'] },
      // 丁卯月见申（支），时支申命中
      { input: { pillars: ['甲子', '丁卯', '戊午', '庚申'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.yuede.v1',
    name: '月德贵人',
    variant: '三合月德通行版',
    inputBasis: 'monthBranch',
    targetPosition: 'anyStem',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    // 三合分组序：0=申子辰→壬(8)，1=寅午戌→丙(2)，2=巳酉丑→庚(6)，3=亥卯未→甲(0)
    find: (ctx) => stemHits(ctx, [[8, 2, 6, 0][SANHE_OF_BRANCH(ctx.monthBranchIdx)]]),
    verse: '寅午戌月在丙，申子辰月在壬，亥卯未月在甲，巳酉丑月在庚。',
    basis: '以月支起例，四柱天干见之为命中',
    source: '《三命通会》论月德',
    modernExplanation:
      '与天德并称，传统上主温和慈祥、少招刑祸之象，视为福荫之星；现代可理解为对温和处世方式的传统肯定。',
    testFixtures: [
      // 甲寅月（寅午戌→丙），时干丙命中
      { input: { pillars: ['戊子', '甲寅', '戊午', '丙辰'] }, expectHits: ['时干'] },
    ],
  },
  {
    ruleId: 'shensha.jiangxing.v1',
    name: '将星',
    variant: '以日支起例（兼顾年支）通行版',
    inputBasis: 'dayBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[0, 6, 9, 3][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    verse: '申子辰见子，寅午戌见午，巳酉丑见酉，亥卯未见卯。',
    basis: '以日支起例（兼顾年支），地支见之为命中',
    source: '《三命通会》论将星',
    modernExplanation:
      '三合局中气所在，传统上主统摄与担当之象，命带将星者被认为颇具组织才干；现代可视为对领导力的传统象征。',
    testFixtures: [
      // 辛巳日（巳酉丑→酉），月支酉命中
      { input: { pillars: ['甲子', '癸酉', '辛巳', '戊子'] }, expectHits: ['月支'] },
    ],
  },
  {
    ruleId: 'shensha.hongluan.v1',
    name: '红鸾',
    variant: '以年支起例通行版',
    inputBasis: 'yearBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    // 卯上起子逆数：子→卯 丑→寅 寅→丑 卯→子 辰→亥 巳→戌 午→酉 未→申 申→未 酉→午 戌→巳 亥→辰
    find: (ctx) => branchHits(ctx, [[3, 2, 1, 0, 11, 10, 9, 8, 7, 6, 5, 4][ctx.yearBranchIdx]]),
    verse: '卯上起子，逆数至生年支，即是红鸾。',
    basis: '以年支起例，地支见之为命中',
    source: '《三命通会》论红鸾天喜',
    modernExplanation:
      '传统上主喜事、姻缘之象，常与桃花并参；现代可作为对婚恋与人际喜事话题的传统象征，不作具体事件断言。',
    testFixtures: [
      // 子年（子→卯），日支卯命中
      { input: { pillars: ['甲子', '壬申', '丁卯', '辛亥'] }, expectHits: ['日支'] },
    ],
  },
  {
    ruleId: 'shensha.tianxi.v1',
    name: '天喜',
    variant: '以年支起例通行版',
    inputBasis: 'yearBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    // 红鸾对冲：子→酉 丑→申 寅→未 卯→午 辰→巳 巳→辰 午→卯 未→寅 申→丑 酉→子 戌→亥 亥→戌
    find: (ctx) => branchHits(ctx, [[9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11, 10][ctx.yearBranchIdx]]),
    verse: '天喜者，红鸾之对冲位也。',
    basis: '以年支起例，地支见之为命中',
    source: '《三命通会》论红鸾天喜',
    modernExplanation:
      '与红鸾并称鸾喜，传统上主喜庆吉庆之象，多见于婚嫁择期参详；现代仅作文化象征，不作事件断言。',
    testFixtures: [
      // 子年（天喜→酉），时支酉命中
      { input: { pillars: ['甲子', '壬申', '丁卯', '己酉'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.jiesha.v1',
    name: '劫煞',
    variant: '以日支起例（兼顾年支）通行版',
    inputBasis: 'dayBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    // 三合绝地：申子辰→巳 寅午戌→亥 巳酉丑→寅 亥卯未→申
    find: (ctx) => branchHits(ctx, [[5, 11, 2, 8][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    verse: '申子辰劫在巳，寅午戌劫在亥，巳酉丑劫在寅，亥卯未劫在申。',
    basis: '以日支起例（兼顾年支），地支见之为命中',
    source: '《三命通会》论劫煞',
    modernExplanation:
      '传统上主竞争与变动压力之象，吉凶随全局制化而定，不可单论；现代可理解为对激烈竞争环境的传统描述。',
    testFixtures: [
      // 壬子日（申子辰→巳），时支巳命中
      { input: { pillars: ['甲寅', '壬申', '壬子', '乙巳'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.zaisha.v1',
    name: '灾煞',
    variant: '以日支起例（兼顾年支）通行版',
    inputBasis: 'dayBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    // 三合冲将星：申子辰→午 寅午戌→子 巳酉丑→卯 亥卯未→酉
    find: (ctx) => branchHits(ctx, [[6, 0, 3, 9][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    verse: '申子辰灾在午，寅午戌灾在子，巳酉丑灾在卯，亥卯未灾在酉。',
    basis: '以日支起例（兼顾年支），地支见之为命中',
    source: '《三命通会》论灾煞',
    modernExplanation:
      '传统上主波折与突发变动之象，须与全局喜忌同参，不单独构成事件判断；本馆不据此作任何具体断言。',
    testFixtures: [
      // 壬子日（申子辰→午），月支午命中
      { input: { pillars: ['甲寅', '戊午', '壬子', '庚子'] }, expectHits: ['月支'] },
    ],
  },
  {
    ruleId: 'shensha.yuanchen.v1',
    name: '元辰（大耗）',
    variant: '年支起例；男命用通行表，女命取男命落支的对冲位',
    inputBasis: 'yearBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => {
      const maleTarget = [7, 6, 9, 4, 3, 2, 1, 0, 11, 10, 9, 8][ctx.yearBranchIdx]
      const target = ctx.gender === 'female' ? (maleTarget + 6) % 12 : maleTarget
      return branchHits(ctx, [target])
    },
    verse: '子年见未，丑年见午，寅年见酉，卯年见辰，辰年见卯，巳年见寅，午年见丑，未年见子，申年见亥，酉年见戌，戌年见酉，亥年见申；女命取对冲位。',
    basis: '以年支起例，男命按表取支，女命取该支对冲位，四柱地支见之为命中',
    source: '《三命通会》论元辰',
    modernExplanation:
      '传统命理把元辰作为观察耗散与阻滞主题的辅助符号；本规则仅记录其位置，不能据此推断具体处境或事件。',
    testFixtures: [
      { input: { pillars: ['甲子', '丙寅', '甲辰', '丁未'], gender: 'male' }, expectHits: ['时支'] },
      { input: { pillars: ['甲子', '丙寅', '甲辰', '丁丑'], gender: 'female' }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.jinyu.v1',
    name: '金舆',
    variant: '日干起例通行版',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[4, 5, 7, 8, 7, 8, 10, 11, 1, 2][ctx.dayStemIdx]]),
    verse: '甲龙乙蛇，丙戊羊，丁己猴，庚犬辛猪，壬牛癸虎。',
    basis: '以日干起例，四柱地支见对应支为命中',
    source: '《三命通会》论金舆',
    modernExplanation:
      '传统命理以金舆象征安定资源与生活条件；本规则只提供文化语境中的辅助标记，不作财富或生活结果断言。',
    testFixtures: [
      { input: { pillars: ['丙子', '庚寅', '甲午', '戊辰'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.guchen.v1',
    name: '孤辰',
    variant: '年支三合前位通行版',
    inputBasis: 'yearBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[2, 2, 5, 5, 5, 8, 8, 8, 11, 11, 11, 2][ctx.yearBranchIdx]]),
    verse: '亥子丑人见寅，寅卯辰人见巳，巳午未人见申，申酉戌人见亥。',
    basis: '以年支所属亥子丑、寅卯辰、巳午未、申酉戌分组起例，四柱地支见前位为命中',
    source: '《三命通会》论孤辰',
    modernExplanation:
      '传统命理用孤辰讨论独处与人际距离等主题；其含义依整体命局而异，不能单独用于判断关系或性格。',
    testFixtures: [
      { input: { pillars: ['乙亥', '戊子', '甲辰', '丙寅'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.guasu.v1',
    name: '寡宿',
    variant: '年支三合后位通行版',
    inputBasis: 'yearBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[10, 10, 1, 1, 1, 4, 4, 4, 7, 7, 7, 10][ctx.yearBranchIdx]]),
    verse: '亥子丑人见戌，寅卯辰人见丑，巳午未人见辰，申酉戌人见未。',
    basis: '以年支所属亥子丑、寅卯辰、巳午未、申酉戌分组起例，四柱地支见后位为命中',
    source: '《三命通会》论寡宿',
    modernExplanation:
      '传统命理用寡宿讨论独处与陪伴等主题；本规则仅作辅助标记，不据单一神煞推断婚恋、人际或生活事件。',
    testFixtures: [
      { input: { pillars: ['乙亥', '戊子', '甲辰', '甲戌'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.hongyan.v1',
    name: '红艳煞',
    variant: '日干起例通行版',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[6, 8, 2, 7, 4, 4, 10, 9, 0, 8][ctx.dayStemIdx]]),
    verse: '甲午乙申丙见寅，丁未戊己辰上寻，庚戌辛酉壬见子，癸临申上是红艳。',
    basis: '以日干起例，四柱地支见对应支为命中',
    source: '《三命通会》论红艳煞',
    modernExplanation:
      '传统命理以红艳煞讨论人际吸引与情感表达；本规则只保留其文化象征，不作感情经历或行为判断。',
    testFixtures: [
      { input: { pillars: ['甲子', '丙寅', '乙丑', '戊申'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.xuetang.v1',
    name: '学堂',
    variant: '日干长生位通行版',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[11, 6, 2, 9, 2, 9, 5, 0, 8, 3][ctx.dayStemIdx]]),
    verse: '甲学堂在亥，乙在午，丙戊在寅，丁己在酉，庚在巳，辛在子，壬在申，癸在卯。',
    basis: '以日干的长生位起例，四柱地支见之为命中',
    source: '《三命通会》论学堂',
    modernExplanation:
      '传统命理以学堂象征学习与知识积累主题；实际学习表现受多种因素影响，不由这一标记单独决定。',
    testFixtures: [
      { input: { pillars: ['丙子', '庚寅', '甲辰', '乙亥'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.ciguan.v1',
    name: '词馆',
    variant: '学堂对冲位通行版',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[5, 0, 8, 3, 8, 3, 11, 6, 2, 9][ctx.dayStemIdx]]),
    verse: '词馆取学堂之对冲位：甲巳、乙子、丙戊申、丁己卯、庚亥、辛午、壬寅、癸酉。',
    basis: '以日干学堂所在支的对冲位起例，四柱地支见之为命中',
    source: '《三命通会》论词馆',
    modernExplanation:
      '传统命理以词馆象征文字、表达与知识运用主题；本规则仅作文化层面的辅助说明，不断言能力或成就。',
    testFixtures: [
      { input: { pillars: ['丙子', '庚寅', '甲辰', '己巳'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.tianchu.v1',
    name: '天厨',
    variant: '日干食神临官位通行版',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: (ctx) => branchHits(ctx, [[5, 6, 7, 8, 7, 8, 9, 10, 11, 0][ctx.dayStemIdx]]),
    verse: '甲在巳，乙在午，丙戊在未，丁己在申，庚在酉，辛在戌，壬在亥，癸在子。',
    basis: '以日干食神的临官位起例，四柱地支见之为命中',
    source: '《三命通会》论天厨',
    modernExplanation:
      '传统命理以天厨讨论饮食、供养与生活资源主题；本规则仅标示传统对应关系，不作健康、财富或福祸断言。',
    testFixtures: [
      { input: { pillars: ['丙子', '庚寅', '甲辰', '己巳'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.tianluo.v1',
    name: '天罗',
    variant: '日支起例通行简版（辰见巳；纳音火命细分法另计）',
    inputBasis: 'dayBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => (ctx.dayBranchIdx === 4 ? branchHits(ctx, [5]) : []),
    verse: '辰为天罗，辰人见巳是罗中。',
    basis: '以日支起例，日支为辰时，四柱地支见巳为命中',
    source: '《三命通会》论天罗地网',
    modernExplanation: '传统命理以天罗标记环境牵制或行动受限的主题；本规则采用通行简版，仅供文化参详，不推断具体困境。',
    testFixtures: [
      {
        input: { pillars: ['乙巳', '丙寅', '戊辰', '壬子'] },
        expectHits: ['年支'],
      },
    ],
  },
  {
    ruleId: 'shensha.diwang.v1',
    name: '地网',
    variant: '日支起例通行简版（戌见亥；纳音水命细分法另计）',
    inputBasis: 'dayBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => (ctx.dayBranchIdx === 10 ? branchHits(ctx, [11]) : []),
    verse: '戌为地网，戌人见亥是网中。',
    basis: '以日支起例，日支为戌时，四柱地支见亥为命中',
    source: '《三命通会》论天罗地网',
    modernExplanation: '传统命理以地网标记牵绊与约束主题；本规则采用通行简版，仅记录传统对应关系，不作事件或结果断言。',
    testFixtures: [
      {
        input: { pillars: ['乙亥', '丙寅', '戊戌', '壬子'] },
        expectHits: ['年支'],
      },
    ],
  },
  {
    ruleId: 'shensha.kuigang.v1',
    name: '魁罡',
    variant: '魁罡四日（日柱整体判定）',
    inputBasis: 'dayJiazi',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => dayPillarHits(ctx, new Set(['庚辰', '庚戌', '壬辰', '戊戌'])),
    verse: '壬辰庚戌与庚辰，戊戌魁罡四座神。',
    basis: '以日柱干支整体起例，日柱为庚辰、庚戌、壬辰或戊戌时命中',
    source: '《三命通会》论魁罡',
    modernExplanation: '传统命理以魁罡讨论刚直、果断等性情主题，并强调须合看全局；本规则不据此断言性格或人生结果。',
    testFixtures: [
      {
        input: { pillars: ['甲子', '丙寅', '庚辰', '壬午'] },
        expectHits: ['日柱'],
      },
    ],
  },
  {
    ruleId: 'shensha.jinshen.v1',
    name: '金神',
    variant: '简版：己日见巳酉丑时支',
    inputBasis: 'dayStem',
    targetPosition: 'hourBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => {
      if (ctx.dayStemIdx !== 5) return []
      const hour = ctx.pillars.find(p => p.label === '时柱')
      return hour && [5, 9, 1].includes(hour.branchIdx) ? [{ position: '时支', char: BRANCHES[hour.branchIdx] }] : []
    },
    verse: '金神只在火时乡，己日巳酉丑时详。',
    basis: '采用通行简版，以日干己为前提，时支见巳、酉、丑之一为命中',
    source: '《三命通会》论金神',
    modernExplanation: '传统命理以金神讨论刚锐与行动张力，并须结合制化关系参看；本规则只作结构标记，不作吉凶断言。',
    testFixtures: [
      {
        input: { pillars: ['甲子', '丙寅', '己丑', '癸酉'] },
        expectHits: ['时支'],
      },
    ],
  },
  {
    ruleId: 'shensha.tianshe.v1',
    name: '天赦',
    variant: '四天赦日（日柱整体判定）',
    inputBasis: 'dayJiazi',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => dayPillarHits(ctx, new Set(['戊寅', '甲午', '戊申', '甲子'])),
    verse: '春戊寅，夏甲午，秋戊申，冬甲子，乃天赦日。',
    basis: '以日柱干支整体起例，日柱为戊寅、甲午、戊申或甲子时命中',
    source: '《三命通会》论天赦',
    modernExplanation: '传统择日与命理以天赦象征宽宥、缓和的主题；本规则仅呈现传统日柱分类，不保证具体结果。',
    testFixtures: [
      {
        input: { pillars: ['甲子', '丙寅', '戊寅', '壬子'] },
        expectHits: ['日柱'],
      },
    ],
  },
  {
    ruleId: 'shensha.shiedabai.v1',
    name: '十恶大败',
    variant: '十组日柱通行版（日柱整体判定）',
    inputBasis: 'dayJiazi',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx =>
      dayPillarHits(ctx, new Set(['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'])),
    verse: '甲辰乙巳与壬申，丙申丁亥及庚辰，戊戌己丑辛巳日，癸亥十日号大败。',
    basis: '以日柱干支整体起例，日柱属于十恶大败十组之一时命中',
    source: '《三命通会》论十恶大败',
    modernExplanation:
      '传统命理以十恶大败讨论资源管理等主题，但名称带有古代价值判断；本规则只作文化标签，不推断贫富成败。',
    testFixtures: [
      {
        input: { pillars: ['甲子', '丙寅', '甲辰', '壬午'] },
        expectHits: ['日柱'],
      },
    ],
  },
  {
    ruleId: 'shensha.wangshen.v1',
    name: '亡神',
    variant: '以日支三合局起例通行版',
    inputBasis: 'dayBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => branchHits(ctx, [[11, 5, 8, 2][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    verse: '申子辰见亥，寅午戌见巳，巳酉丑见申，亥卯未见寅。',
    basis: '以日支所属三合局起例，四柱地支见对应亡神支为命中',
    source: '《三命通会》论亡神',
    modernExplanation: '传统命理以亡神讨论注意力耗散与计划反复等主题；本规则仅作辅助标记，不用于判断具体损失或事件。',
    testFixtures: [
      {
        input: { pillars: ['乙亥', '戊寅', '甲子', '庚午'] },
        expectHits: ['年支'],
      },
    ],
  },
  {
    ruleId: 'shensha.tianyiao.v1',
    name: '天医',
    variant: '月支前一位通行版（正月见丑）',
    inputBasis: 'monthBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => branchHits(ctx, [(ctx.monthBranchIdx + 11) % 12]),
    verse: '天医正月在丑，二月在寅，顺月推移，各居月建前一辰。',
    basis: '以月支起例，取月支前一位，四柱地支见之为命中',
    source: '《三命通会》论天医',
    modernExplanation: '传统命理以天医讨论照护、调养与医药兴趣等主题；本规则不构成健康评价、诊断或治疗建议。',
    testFixtures: [
      {
        input: { pillars: ['乙丑', '丙寅', '甲辰', '庚午'] },
        expectHits: ['年支'],
      },
    ],
  },
  {
    ruleId: 'shensha.fuxing.v1',
    name: '福星贵人',
    variant: '日干起例通行福星表（亦见天官贵人名目）',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => branchHits(ctx, [[9, 8, 0, 11, 3, 2, 6, 5, 6, 5][ctx.dayStemIdx]]),
    verse: '甲邀酉禄乙邀申，丙爱鼠兮丁爱亥，戊寻玉兔己寻虎，庚辛逢马巳，壬癸爱马蛇。',
    basis: '以日干起例，按甲酉、乙申、丙子、丁亥、戊卯、己寅、庚午、辛巳、壬午、癸巳查四柱地支',
    source: '《三命通会》论福星贵人',
    modernExplanation: '传统命理以福星贵人象征助缘与生活顺遂主题；本规则只记录传统对应关系，不承诺机遇、福气或结果。',
    testFixtures: [
      {
        input: { pillars: ['癸酉', '丙寅', '甲辰', '庚午'] },
        expectHits: ['年支'],
      },
    ],
  },
  {
    ruleId: 'shensha.tianqisanqi.v1',
    name: '三奇贵人（天上三奇）',
    variant: '甲戊庚按柱序全见',
    inputBasis: 'pillarStems',
    targetPosition: 'anyStem',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => orderedStemHits(ctx, [0, 4, 6]),
    verse: '天上三奇甲戊庚，须从次第顺布成。',
    basis: '按年、月、日、时顺序检查天干，甲、戊、庚依次全见时分别列出命中柱位',
    source: '《三命通会》论三奇',
    modernExplanation: '传统命理以天上三奇讨论组合协调与才识主题；本规则仅识别干序组合，不单独评价能力、地位或成就。',
    testFixtures: [
      {
        input: { pillars: ['甲子', '戊寅', '庚辰', '壬午'] },
        expectHits: ['年干', '月干', '日干'],
      },
    ],
  },
  {
    ruleId: 'shensha.diqisanqi.v1',
    name: '三奇贵人（地下三奇）',
    variant: '乙丙丁按柱序全见',
    inputBasis: 'pillarStems',
    targetPosition: 'anyStem',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => orderedStemHits(ctx, [1, 2, 3]),
    verse: '地下三奇乙丙丁，须从次第顺布成。',
    basis: '按年、月、日、时顺序检查天干，乙、丙、丁依次全见时分别列出命中柱位',
    source: '《三命通会》论三奇',
    modernExplanation: '传统命理以地下三奇讨论表达与实践配合主题；本规则仅识别干序组合，不据此断言际遇或表现。',
    testFixtures: [
      {
        input: { pillars: ['乙丑', '丙寅', '戊辰', '丁巳'] },
        expectHits: ['年干', '月干', '时干'],
      },
    ],
  },
  {
    ruleId: 'shensha.renqisanqi.v1',
    name: '三奇贵人（人中三奇）',
    variant: '壬癸辛按柱序全见',
    inputBasis: 'pillarStems',
    targetPosition: 'anyStem',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => orderedStemHits(ctx, [8, 9, 7]),
    verse: '人中三奇壬癸辛，须从次第顺布成。',
    basis: '按年、月、日、时顺序检查天干，壬、癸、辛依次全见时分别列出命中柱位',
    source: '《三命通会》论三奇',
    modernExplanation: '传统命理以人中三奇讨论思辨与应变配合主题；本规则仅识别干序组合，不作性格或人生结果判断。',
    testFixtures: [
      {
        input: { pillars: ['壬子', '癸丑', '甲辰', '辛酉'] },
        expectHits: ['年干', '月干', '时干'],
      },
    ],
  },
  {
    ruleId: 'shensha.yinchayangcuo.v1',
    name: '阴差阳错',
    variant: '十二日柱通行版（日柱整体判定）',
    inputBasis: 'dayJiazi',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx =>
      dayPillarHits(
        ctx,
        new Set(['丙子', '丁丑', '戊寅', '辛卯', '壬辰', '癸巳', '丙午', '丁未', '戊申', '辛酉', '壬戌', '癸亥'])
      ),
    verse: '丙子丁丑戊寅，辛卯壬辰癸巳，丙午丁未戊申，辛酉壬戌癸亥。',
    basis: '以日柱干支整体起例，日柱属于阴差阳错十二组之一时命中',
    source: '《三命通会》论阴差阳错',
    modernExplanation:
      '传统命理以阴差阳错讨论关系磨合与计划偏差等主题；其名称不代表必然结果，本规则不作婚恋或事件断言。',
    testFixtures: [
      {
        input: { pillars: ['甲子', '丙寅', '丙子', '壬辰'] },
        expectHits: ['日柱'],
      },
    ],
  },
  {
    ruleId: 'shensha.liuxia.v1',
    name: '流霞',
    variant: '日干起例通行歌诀版',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => branchHits(ctx, [[9, 10, 7, 8, 5, 6, 4, 3, 11, 2][ctx.dayStemIdx]]),
    verse: '甲鸡乙犬丙羊加，丁是猴精戊见蛇，己马庚龙辛逐兔，壬猪癸虎是流霞。',
    basis: '以日干起例，四柱地支见对应支为命中',
    source: '《三命通会》论流霞',
    modernExplanation: '传统命理以流霞讨论情绪、人际与身体照护等主题；本规则仅保留文化标记，不构成健康或关系判断。',
    testFixtures: [
      {
        input: { pillars: ['癸酉', '丙寅', '甲辰', '庚午'] },
        expectHits: ['年支'],
      },
    ],
  },
  {
    ruleId: 'shensha.xueren.v1',
    name: '血刃',
    variant: '月支起例通行表',
    inputBasis: 'monthBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    // 子丑寅卯辰巳午未申酉戌亥月，依次见午子丑未寅申卯酉辰戌巳亥
    find: ctx => branchHits(ctx, [[6, 0, 1, 7, 2, 8, 3, 9, 4, 10, 5, 11][ctx.monthBranchIdx]]),
    verse: '寅月见丑，卯月见未，辰月见寅，巳月见申，逐月依表查血刃。',
    basis: '以月支起例，按通行十二月表检查四柱地支',
    source: '《三命通会》论血刃',
    modernExplanation: '传统命理以血刃提醒对冲动与身体照护保持留意；本规则不是风险预测，也不构成医学或安全结论。',
    testFixtures: [
      {
        input: { pillars: ['乙丑', '丙寅', '甲辰', '庚午'] },
        expectHits: ['年支'],
      },
    ],
  },
  {
    ruleId: 'shensha.goujiao.v1',
    name: '勾绞煞',
    variant: '年支前三辰、后三辰合并标记版',
    inputBasis: 'yearBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V_LEGACY,
    find: ctx => branchHits(ctx, [(ctx.yearBranchIdx + 3) % 12, (ctx.yearBranchIdx + 9) % 12]),
    verse: '命前三辰为勾，命后三辰为绞，阴阳男女分名而位同此两端。',
    basis: '以年支起例，四柱地支见年支顺数三位或逆数三位，统一标记为勾绞煞',
    source: '《三命通会》论勾绞煞',
    modernExplanation: '传统命理以勾绞讨论纠葛与沟通阻力等主题；本规则合并记录两处支位，不据此判断纠纷或具体事件。',
    testFixtures: [
      {
        input: { pillars: ['甲子', '丁卯', '甲辰', '癸酉'] },
        expectHits: ['月支', '时支'],
      },
    ],
  },
  // ==================== v1.5.0 稀缺神煞（外部 MIT 源吸收，2026-08-28）====================
  {
    ruleId: 'shensha.guoyin.v1',
    name: '国印贵人',
    variant: '年干+日干双起例（zhenyi main=1,3）',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => {
      // 年干 + 日干双起例（zhenyi shensha-rules.json id=8 main="1,3"）
      const table = [[10], [11], [1], [2], [1], [2], [4], [5], [7], [8]]
      const yearTargets = table[ctx.pillars.find((p) => p.label === '年柱')?.stemIdx ?? 0]
      const dayTargets = table[ctx.dayStemIdx]
      return branchHits(ctx, [...yearTargets, ...dayTargets])
    },
    verse: '甲戌乙亥丙丑寅，丁戊丑寅庚辰巳，辛巳壬未癸申位。',
    basis: '年干、日干双起例，四柱地支见之为命中（zhenyi 原文核对）',
    source: 'zhenyi shensha-rules.json id=8（MIT）',
    modernExplanation: '传统命理以国印贵人象征公门文书之缘；本规则仅记录其位置，不断言具体处境。',
    testFixtures: [
      { input: { pillars: ['甲戌', '丁卯', '甲寅', '癸酉'] }, expectHits: ['年支'] },
      { input: { pillars: ['甲戌', '丁卯', '乙巳', '癸酉'] }, expectHits: ['年支'] },
    ],
  },
  {
    ruleId: 'shensha.feiren.v1',
    name: '飞刃',
    variant: '禄前一位之对宫/羊刃对冲（多派口径略有出入）',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => branchHits(ctx, [[9], [8], [0], [11], [0], [11], [3], [2], [6], [5]][ctx.dayStemIdx]),
    verse: '甲酉乙申丙子亥，丁子戊子己亥庚卯，辛寅壬午癸巳。',
    basis: '以日干起例，四柱地支见之为命中（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '飞刃属「刃」系传统符号，象征果决与锋芒；本规则仅记录位置，不作事件断言。',
    testFixtures: [
      { input: { pillars: ['辛酉', '丁卯', '甲寅', '癸酉'] }, expectHits: ['年支', '时支'] },
    ],
  },
  {
    ruleId: 'shensha.tiandehe.v1',
    name: '天德合',
    variant: '按月支查天干（zhenyi main=8，id 44/156 两表并集）',
    inputBasis: 'monthBranch',
    targetPosition: 'anyStem',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => {
      // 月支→天干（zhenyi id=44 data + id=156 data 并集）
      const table = [[8], [1], [8], [3], [5], [4], [2], [5], [8], [1], [7], [9]]
      return stemHits(ctx, table[ctx.monthBranchIdx])
    },
    verse: '丑乙寅壬辰丁巳丙，未己申戊戌辛亥庚；子申卯巳午寅酉亥。',
    basis: '以月支起例，四柱天干见之为命中（zhenyi 原文核对 main=8）',
    source: 'zhenyi shensha-rules.json id=44/156（MIT）',
    modernExplanation: '天德合为天德贵人之合，传统视为福荫；本规则仅记录位置。',
    testFixtures: [
      { input: { pillars: ['乙丑', '丁卯', '丙午', '癸酉'] }, expectHits: ['月干'] },
    ],
  },
  {
    ruleId: 'shensha.yuedehe.v1',
    name: '月德合',
    variant: '按月支查天干（zhenyi main=8）',
    inputBasis: 'monthBranch',
    targetPosition: 'anyStem',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) =>
      stemHits(ctx, [[3], [1], [7], [5], [3], [1], [7], [5], [3], [1], [7], [5]][ctx.monthBranchIdx]),
    verse: '子丁丑乙寅辛卯己，辰丁巳乙午辛未己，申丁酉乙戌辛亥己。',
    basis: '以月支起例，四柱天干见之为命中（zhenyi 原文核对 main=8）',
    source: 'zhenyi shensha-rules.json id=45（MIT）',
    modernExplanation: '月德合为月德贵人之合，传统视为温和福荫；本规则仅记录位置。',
    testFixtures: [
      { input: { pillars: ['己丑', '丁卯', '丙午', '辛酉'] }, expectHits: ['年干'] },
    ],
  },
  {
    ruleId: 'shensha.pima.v1',
    name: '披麻',
    variant: '年支顺推九位（十二神/流年系变体）',
    inputBasis: 'yearBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => branchHits(ctx, [(ctx.yearBranchIdx + 9) % 12]),
    verse: '子酉丑戌寅亥，卯子辰丑巳寅，午卯未辰申巳，酉午戌未亥申。',
    basis: '以年支起例顺推九位，四柱地支见之为命中（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '披麻为流年十二神系传统符号；本规则仅记录位置，不作吉凶断言。',
    testFixtures: [
      { input: { pillars: ['甲子', '丁卯', '甲辰', '癸酉'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.diaoke.v1',
    name: '吊客',
    variant: '年支顺推十位（十二神/流年系变体）',
    inputBasis: 'yearBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => branchHits(ctx, [(ctx.yearBranchIdx + 10) % 12]),
    verse: '子戌丑亥寅子，卯丑辰寅巳卯，午辰未巳申午，酉未戌申亥酉。',
    basis: '以年支起例顺推十位，四柱地支见之为命中（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '吊客为流年十二神系传统符号；本规则仅记录位置，不作吉凶断言。',
    testFixtures: [
      { input: { pillars: ['甲子', '丁卯', '甲辰', '甲戌'] }, expectHits: ['时支'] },
    ],
  },
  {
    ruleId: 'shensha.sangmen.v1',
    name: '丧门',
    variant: '年支顺推二位（十二神/流年系变体）',
    inputBasis: 'yearBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => branchHits(ctx, [(ctx.yearBranchIdx + 2) % 12]),
    verse: '子寅丑卯寅辰，卯巳辰午巳未，午申未酉申戌，酉亥戌子亥丑。',
    basis: '以年支起例顺推二位，四柱地支见之为命中（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '丧门为流年十二神系传统符号；本规则仅记录位置，不作吉凶断言。',
    testFixtures: [
      { input: { pillars: ['甲寅', '丁卯', '甲辰', '癸酉'] }, expectHits: ['日支'] },
    ],
  },
  {
    ruleId: 'shensha.shiling.v1',
    name: '十灵日',
    variant: '十柱通行版',
    inputBasis: 'dayJiazi',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) =>
      dayPillarHits(ctx, new Set(['乙亥', '癸未', '庚寅', '丁酉', '壬寅', '甲辰', '庚戌', '辛亥', '丙辰', '戊午'])),
    verse: '乙亥癸未庚寅丁酉，壬寅甲辰庚戌辛亥，丙辰戊午号十灵。',
    basis: '日柱命中即记（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '十灵日传统上被视为聪慧灵秀之象；本规则仅记录日柱属性，不作能力断言。',
    testFixtures: [
      { input: { pillars: ['辛丑', '丁卯', '乙亥', '癸酉'] }, expectHits: ['日柱'] },
      { input: { pillars: ['辛丑', '丁卯', '甲辰', '癸酉'] }, expectHits: ['日柱'] },
    ],
  },
  {
    ruleId: 'shensha.jiuchou.v1',
    name: '九丑日',
    variant: '九柱通行版',
    inputBasis: 'dayJiazi',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) =>
      dayPillarHits(ctx, new Set(['己卯', '壬午', '戊子', '辛卯', '丁酉', '己酉', '壬子', '戊午', '辛酉'])),
    verse: '己卯壬午戊子辛卯，丁酉己酉壬子戊午辛酉。',
    basis: '日柱命中即记（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '九丑日为传统日柱属性条目；本规则仅记录属性，不作事件断言。',
    testFixtures: [
      { input: { pillars: ['辛丑', '丁卯', '己卯', '癸酉'] }, expectHits: ['日柱'] },
    ],
  },
  {
    ruleId: 'shensha.liuxiu.v1',
    name: '六秀日',
    variant: '六柱通行版',
    inputBasis: 'dayJiazi',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) =>
      dayPillarHits(ctx, new Set(['戊子', '己丑', '丙午', '丁未', '戊午', '己未'])),
    verse: '戊子己丑丙午丁未，戊午己未号六秀。',
    basis: '日柱命中即记（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '六秀日传统上被视为秀气内敛之象；本规则仅记录日柱属性。',
    testFixtures: [
      { input: { pillars: ['辛丑', '丁卯', '丙午', '癸酉'] }, expectHits: ['日柱'] },
    ],
  },
  {
    ruleId: 'shensha.bazhuan.v1',
    name: '八专日',
    variant: '八柱通行版',
    inputBasis: 'dayJiazi',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) =>
      dayPillarHits(ctx, new Set(['戊戌', '丁未', '癸丑', '甲寅', '乙卯', '己未', '庚申', '辛酉'])),
    verse: '戊戌丁未癸丑甲寅，乙卯己未庚申辛酉。',
    basis: '日柱命中即记（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '八专日为传统日柱属性条目；本规则仅记录属性，不作事件断言。',
    testFixtures: [
      { input: { pillars: ['辛丑', '丁卯', '甲寅', '癸酉'] }, expectHits: ['日柱'] },
    ],
  },
  {
    ruleId: 'shensha.guluan.v1',
    name: '孤鸾煞',
    variant: '八柱通行版（多取女命）',
    inputBasis: 'dayJiazi',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) =>
      dayPillarHits(ctx, new Set(['丁巳', '乙巳', '丙午', '戊申', '辛亥', '壬子', '甲寅', '戊午'])),
    verse: '丁巳乙巳丙午戊申，辛亥壬子甲寅戊午。',
    basis: '日柱命中即记（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '传统命理以孤鸾讨论关系课题，名称不必然对应现实结果；本规则仅记录日柱属性。',
    testFixtures: [
      { input: { pillars: ['辛丑', '丁卯', '丙午', '癸酉'] }, expectHits: ['日柱'] },
    ],
  },
  {
    ruleId: 'shensha.tianzhuan.v1',
    name: '天转日',
    variant: '按年支三合查日柱',
    inputBasis: 'yearBranch',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => {
      const table = [[48], [48], [51], [51], [51], [42], [42], [42], [57], [57], [57], [48]]
      const targets = new Set(table[ctx.yearBranchIdx].map((i) => JIAZI[i]))
      return dayPillarHits(ctx, targets)
    },
    verse: '寅卯辰乙卯，巳午未丙午，申酉戌辛酉，亥子丑壬子。',
    basis: '以年支三合位起例，日柱命中即记（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '天转日为传统日柱属性条目；本规则仅记录属性。',
    testFixtures: [
      { input: { pillars: ['辛丑', '丁卯', '壬子', '癸酉'] }, expectHits: ['日柱'] },
    ],
  },
  {
    ruleId: 'shensha.dizhuan.v1',
    name: '地转日',
    variant: '按年支三合查日柱',
    inputBasis: 'yearBranch',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => {
      const table = [[12], [12], [27], [27], [27], [54], [54], [54], [9], [9], [9], [12]]
      const targets = new Set(table[ctx.yearBranchIdx].map((i) => JIAZI[i]))
      return dayPillarHits(ctx, targets)
    },
    verse: '寅卯辰辛卯，巳午未戊午，申酉戌癸酉，亥子丑丙子。',
    basis: '以年支三合位起例，日柱命中即记（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '地转日为传统日柱属性条目；本规则仅记录属性。',
    testFixtures: [
      { input: { pillars: ['辛丑', '丁卯', '丙子', '癸酉'] }, expectHits: ['日柱'] },
    ],
  },
  {
    ruleId: 'shensha.sifei.v1',
    name: '四废日',
    variant: '甲系（两系并存需约定口径，本库取甲系）',
    inputBasis: 'yearBranch',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => {
      const table = [[42], [42], [56], [56], [56], [48], [48], [48], [50], [50], [50], [42]]
      const targets = new Set(table[ctx.yearBranchIdx].map((i) => JIAZI[i]))
      return dayPillarHits(ctx, targets)
    },
    verse: '寅卯辰庚申，巳午未壬子，申酉戌甲寅，亥子丑丙午。',
    basis: '以年支三合位起例，日柱命中即记；多派取墓绝死囚，甲/乙两系并存（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '四废日为传统日柱属性条目；本规则仅记录属性，不作事件断言。',
    testFixtures: [
      { input: { pillars: ['辛丑', '丁卯', '丙午', '癸酉'] }, expectHits: ['日柱'] },
    ],
  },
  {
    ruleId: 'shensha.gonglu.v1',
    name: '拱禄格',
    variant: '日柱对称查邻柱同干',
    inputBasis: 'dayJiazi',
    targetPosition: 'dayPillar',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => {
      const pairs: Record<number, number> = { 49: 59, 59: 49, 43: 53, 53: 43, 5: 55, 55: 5, 54: 4, 4: 54 }
      const pair = pairs[ctx.dayJiaziIdx]
      if (pair === undefined) return []
      const other = JIAZI[pair]
      const hit = ctx.pillars.find(
        (p) => p.label !== '日柱' && STEMS[p.stemIdx] + BRANCHES[p.branchIdx] === other
      )
      return hit
        ? [{ position: `${hit.label.replace('柱', '')}支`, char: BRANCHES[hit.branchIdx] }]
        : []
    },
    verse: '癸丑癸亥丁未丁巳，己巳己未戊午戊辰。',
    basis: '日柱为对称柱之一端，邻柱（年/月/时）见另一端同干即记（外部 MIT 源吸收，待问真对拍）',
    source: '外部参考表（zhenyi/mingyu，MIT）',
    modernExplanation: '拱禄格为传统格局名目；本规则仅记录柱位配置，不作富贵断言。',
    testFixtures: [
      { input: { pillars: ['癸亥', '丁卯', '癸丑', '癸酉'] }, expectHits: ['年支'] },
    ],
  },
  {
    ruleId: 'shensha.tongzi.v1',
    name: '童子煞',
    variant: '按月支查（zhenyi main=8，另存纳音法 id=143）',
    inputBasis: 'monthBranch',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => {
      const table: number[][] = [
        [3, 7, 4], [3, 7, 4], [2, 0], [2, 0], [2, 0],
        [3, 7, 4], [3, 7, 4], [3, 7, 4], [2, 0], [2, 0], [2, 0], [3, 7, 4],
      ]
      return branchHits(ctx, table[ctx.monthBranchIdx])
    },
    verse: '子丑卯未辰，寅卯辰寅子，巳午未卯未辰，申酉戌寅子，亥卯未辰。',
    basis: '以月支起例，四柱地支见之为命中（zhenyi 原文核对 main=8）',
    source: 'zhenyi shensha-rules.json id=140（MIT）',
    modernExplanation: '童子煞为传统关煞系符号，派别口径差异大；本规则仅记录位置，不作任何断言。',
    testFixtures: [
      { input: { pillars: ['甲子', '丁卯', '甲辰', '癸酉'] }, expectHits: ['年支'] },
    ],
  },
  {
    ruleId: 'shensha.tongzinayin.v1',
    name: '童子煞（纳音法）',
    variant: '按日主纳音五行查（zhenyi main=17，id=143）',
    inputBasis: 'dayJiazi',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => {
      // 30 纳音序列（60 甲子每 2 组共享）：末字即五行
      const NAYIN30 = ['海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木', '泉中水', '屋上土', '霹雳火', '松柏木', '长流水', '沙中金', '山下火', '平地木', '壁上土', '金箔金', '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水']
      const nayin = NAYIN30[Math.floor(ctx.dayJiaziIdx / 2)]
      const wuxing = nayin[nayin.length - 1]
      const table: Record<string, number[]> = { 金: [6, 3], 木: [6, 3], 水: [9, 10], 火: [9, 10], 土: [4, 5] }
      return branchHits(ctx, table[wuxing] ?? [])
    },
    verse: '金午卯，木午卯，水酉戌，火酉戌，土辰巳。',
    basis: '以日主纳音五行起例，四柱地支见之为命中（zhenyi 原文核对 main=17）',
    source: 'zhenyi shensha-rules.json id=143（MIT）',
    modernExplanation: '童子煞（纳音法）为传统关煞系另一口径；本规则仅记录位置，不作任何断言。',
    testFixtures: [
      // 辛亥日（钗钏金→金→午卯），时支午命中
      { input: { pillars: ['庚午', '壬午', '辛亥', '甲午'] }, expectHits: ['年支', '月支', '时支'] },
    ],
  },
  {
    ruleId: 'shensha.dexiu.v1',
    name: '德秀贵人',
    variant: '按月支查四柱天干（zhenyi main=8）',
    inputBasis: 'monthBranch',
    targetPosition: 'anyStem',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
    find: (ctx) => {
      const table: number[][] = [
        [8, 9, 4, 5, 2, 7, 0], [6, 7], [2, 3, 4, 9], [0, 1, 3, 8],
        [8, 9, 4, 5, 2, 7, 0], [6, 7], [2, 3, 4, 9], [0, 1, 3, 8],
        [8, 9, 4, 5, 2, 7, 0], [6, 7], [2, 3, 4, 9], [0, 1, 3, 8],
      ]
      return stemHits(ctx, table[ctx.monthBranchIdx])
    },
    verse: '寅午戌丙丁戊癸，申子辰壬癸戊己丙辛甲，巳酉丑乙庚辛，亥卯未甲乙丁壬。',
    basis: '以月支起例，四柱天干见之为命中（zhenyi 原文核对 main=8）',
    source: 'zhenyi shensha-rules.json id=150（MIT）',
    modernExplanation: '德秀贵人传统上与文华之气相联；本规则仅记录位置，不作能力断言。',
    testFixtures: [
      { input: { pillars: ['甲午', '丁卯', '丙辰', '癸酉'] }, expectHits: ['年干', '月干'] },
    ],
  },
]
