/**
 * 规则数据 · 神煞注册表（12 种）
 * 每条：命中条件（规则函数）、命中柱位、原始规则口诀、传统出处、解释（原创文案）。
 * 起例以日干为主、兼顾年支/月支者按传统通例标注于 basis。
 */
import { BRANCHES, STEMS, kongWangBranches } from './stems-branches'

export const RULE_META = {
  name: '神煞规则集',
  source: '《三命通会》《渊海子平》神煞诸章（口诀为传统公共文献，解释为原创）',
} as const

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

export interface ShenshaDef {
  name: string
  /** 命中条件：返回命中柱位与字（空数组 = 未命中） */
  find: (ctx: ShenshaContext) => ShenshaHitRaw[]
  /** 原始规则口诀（传统公共文本） */
  rule: string
  /** 起例说明 */
  basis: string
  /** 传统出处 */
  source: string
  /** 解释（原创文案） */
  explanation: string
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

export const SHENSHA_REGISTRY: ShenshaDef[] = [
  {
    name: '天乙贵人',
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
    rule: '甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎，此是贵人方。',
    basis: '以日干起例，四柱地支见之为命中',
    source: '《渊海子平》论天乙贵人',
    explanation: '传统视之为解难扶持之星，命中见之多主人缘和顺、逢困易得人助。',
  },
  {
    name: '文昌贵人',
    find: (ctx) => branchHits(ctx, [[5, 6, 8, 9, 8, 9, 11, 0, 2, 3][ctx.dayStemIdx]]),
    rule: '甲乙巳午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见兔入云梯。',
    basis: '以日干起例，地支见之为命中',
    source: '《三命通会》论文昌',
    explanation: '主文思与学业之象，传统认为命带文昌者利于读书、写作与表达。',
  },
  {
    name: '太极贵人',
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
    rule: '甲乙生人子午中，丙丁鸡兔定亨通，戊己两干临四季，庚辛寅亥禄丰隆，壬癸巳申偏喜美。',
    basis: '以日干起例，地支见之为命中',
    source: '《三命通会》论太极贵人',
    explanation: '主好寻根究底、喜探究玄理之象，传统认为与哲学、术数之学有缘。',
  },
  {
    name: '桃花（咸池）',
    find: (ctx) => branchHits(ctx, [[9, 3, 6, 0][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    rule: '申子辰在酉，寅午戌在卯，巳酉丑在午，亥卯未在子。',
    basis: '以日支起例（兼顾年支），地支见之为命中',
    source: '《三命通会》论咸池',
    explanation: '主人缘、魅力与情感之象，吉凶随全局配合而定，不可单以凶论。',
  },
  {
    name: '驿马',
    find: (ctx) => branchHits(ctx, [[2, 8, 11, 5][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    rule: '申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳。',
    basis: '以日支起例（兼顾年支），地支见之为命中',
    source: '《三命通会》论驿马',
    explanation: '主迁动、出行与变动之象，传统认为命带驿马者多奔波或利远方发展。',
  },
  {
    name: '华盖',
    find: (ctx) => branchHits(ctx, [[4, 10, 1, 7][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    rule: '申子辰见辰，寅午戌见戌，巳酉丑见丑，亥卯未见未。',
    basis: '以日支起例（兼顾年支），地支见之为命中',
    source: '《三命通会》论华盖',
    explanation: '主孤高好静、亲近艺文与玄思之象，传统谓之聪明而性僻。',
  },
  {
    name: '羊刃',
    find: (ctx) => branchHits(ctx, [[3, 4, 6, 7, 6, 7, 9, 10, 0, 1][ctx.dayStemIdx]]),
    rule: '甲刃在卯，丙戊刃在午，庚刃在酉，壬刃在子；阴干刃在辰戌丑未（流派之说）。',
    basis: '以日干起例，地支见之为命中',
    source: '《三命通会》论阳刃（阴刃存流派争议，本库按禄前一位并录）',
    explanation: '主刚烈果决之象，身强见之易急躁冲动，身弱则可为助力，须配合全局看。',
  },
  {
    name: '禄神',
    find: (ctx) => branchHits(ctx, [[2, 3, 5, 6, 5, 6, 8, 9, 11, 0][ctx.dayStemIdx]]),
    rule: '甲禄在寅，乙禄在卯，丙戊禄在巳，丁己禄在午，庚禄在申，辛禄在酉，壬禄在亥，癸禄在子。',
    basis: '以日干起例，地支见之为命中',
    source: '《三命通会》论禄',
    explanation: '即日主的临官之地，主衣食俸禄与根基，传统视为养命之源。',
  },
  {
    name: '空亡',
    find: (ctx) => {
      const voids = kongWangBranches(ctx.dayJiaziIdx)
      return ctx.pillars
        .filter((p) => p.label !== '日柱' && voids.includes(p.branchIdx))
        .map((p) => ({ position: `${p.label.replace('柱', '')}支`, char: BRANCHES[p.branchIdx] }))
    },
    rule: '甲子旬中戌亥空，甲戌旬中申酉空，甲申旬中午未空，甲午旬中辰巳空，甲辰旬中寅卯空，甲寅旬中子丑空。',
    basis: '以日柱所属旬起例，他柱地支见之为命中（日支本旬不计）',
    source: '《渊海子平》论空亡',
    explanation: '主虚而不实之象，传统认为落入空亡的字其力减半，吉凶皆打折扣。',
  },
  {
    name: '天德贵人',
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
    rule: '正丁二坤（申）宫，三壬四辛同，五亥六甲上，七癸八寅逢，九丙十居乙，子巳丑庚中。',
    basis: '以月支起例，见对应天干或地支为命中',
    source: '《三命通会》论天德',
    explanation: '传统视之为天地德秀之气，主性情温厚、遇难呈祥之象。',
  },
  {
    name: '月德贵人',
    // 三合分组序：0=申子辰→壬(8)，1=寅午戌→丙(2)，2=巳酉丑→庚(6)，3=亥卯未→甲(0)
    find: (ctx) => stemHits(ctx, [[8, 2, 6, 0][SANHE_OF_BRANCH(ctx.monthBranchIdx)]]),
    rule: '寅午戌月在丙，申子辰月在壬，亥卯未月在甲，巳酉丑月在庚。',
    basis: '以月支起例，四柱天干见之为命中',
    source: '《三命通会》论月德',
    explanation: '与天德并称，主温和慈祥、少招刑祸之象，传统视为福荫之星。',
  },
  {
    name: '将星',
    find: (ctx) => branchHits(ctx, [[0, 6, 9, 3][SANHE_OF_BRANCH(ctx.dayBranchIdx)]]),
    rule: '申子辰见子，寅午戌见午，巳酉丑见酉，亥卯未见卯。',
    basis: '以日支起例（兼顾年支），地支见之为命中',
    source: '《三命通会》论将星',
    explanation: '三合局中气所在，主统摄与担当之象，传统认为命带将星者颇具组织才干。',
  },
]
