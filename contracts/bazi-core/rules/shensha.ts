/**
 * 规则数据 · 神煞注册表 v2（12 种）
 *
 * v2 变更（RULESET 1.1.0）：
 * - 每条神煞为结构化条目：ruleId / 流派变体 / 起例依据 / 命中柱位类型 /
 *   多命中策略 / 原始口诀(verse) / 传统出处(source，后台字段) /
 *   现代化说明(modernExplanation，原创，注明传统说法) / 测试夹具(testFixtures)。
 * - 多命中策略固定为 'list-all'：同一神煞命中多柱时分别列出，
 *   禁止合并为单个布尔（见 types.ts 的 ShenshaHit：每次命中一条记录）。
 * - 起例以日干/日支为主、兼顾年支者按传统通例标注于 basis 与 variant。
 */
import { BRANCHES, STEMS, kongWangBranches } from './stems-branches'

export const RULE_META = {
  name: '神煞规则集 v2',
  source: '《三命通会》《渊海子平》神煞诸章（口诀为传统公共文献，解释为原创）',
} as const

/**
 * 本注册表条目的 rulesetVersion 字段值。
 * 与 rules/index.ts 的 RULESET_VERSION 保持一致（有测试断言同步）。
 */
export const SHENSHA_RULESET_VERSION = '1.1.0'

/** 神煞计算上下文（时柱可能缺失） */
export interface ShenshaContext {
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

/** 命中柱位类型 */
export type ShenshaTargetPosition =
  | 'anyBranch' // 四柱任一地支
  | 'anyStem' // 四柱任一天干
  | 'anyStemOrBranch' // 四柱天干或地支（天德贵人）
  | 'nonDayBranch' // 年/月/时支（空亡：日支本旬不计）

/** 测试夹具输入：四柱干支（时柱 null 表示时辰未知） */
export interface ShenshaFixtureInput {
  /** [年柱, 月柱, 日柱, 时柱|null]，干支须为合法甲子组合 */
  pillars: [string, string, string, string | null]
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

/** 三合局分组（驿马/桃花/华盖/将星共用）：申子辰 / 寅午戌 / 巳酉丑 / 亥卯未 */
const SANHE_OF_BRANCH = (b: number): number => {
  if ([8, 0, 4].includes(b)) return 0
  if ([2, 6, 10].includes(b)) return 1
  if ([5, 9, 1].includes(b)) return 2
  return 3
}

const V = SHENSHA_RULESET_VERSION

export const SHENSHA_REGISTRY: ShenshaDef[] = [
  {
    ruleId: 'shensha.tianyi.v1',
    name: '天乙贵人',
    variant: '「甲戊庚牛羊」通行歌诀版（《渊海子平》系；古歌另有「甲戊兼牛羊，庚辛逢马虎」变体，本库不取）',
    inputBasis: 'dayStem',
    targetPosition: 'anyBranch',
    multipleHitPolicy: 'list-all',
    rulesetVersion: V,
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
    rulesetVersion: V,
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
    rulesetVersion: V,
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
    rulesetVersion: V,
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
    rulesetVersion: V,
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
    rulesetVersion: V,
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
    rulesetVersion: V,
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
    rulesetVersion: V,
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
    rulesetVersion: V,
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
    rulesetVersion: V,
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
    rulesetVersion: V,
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
    rulesetVersion: V,
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
]
