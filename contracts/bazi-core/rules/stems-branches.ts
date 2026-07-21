/**
 * 规则数据 · 天干地支基础表
 * 规则集元数据：每张表注明规则名与出处（传统命理公共文献）。
 */
import type { Wuxing, YinYang } from '../types'

export const RULE_META = {
  name: '干支五行基础规则',
  source: '《渊海子平》《三命通会》论干支五行、合冲刑害诸章（传统公共文献）',
} as const

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

/** 六十甲子表（0 = 甲子） */
export const JIAZI: string[] = Array.from(
  { length: 60 },
  (_, i) => `${STEMS[i % 10]}${BRANCHES[i % 12]}`,
)

export const STEM_WUXING: Wuxing[] = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
export const BRANCH_WUXING: Wuxing[] = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']
export const STEM_YINYANG: YinYang[] = ['阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴']
export const BRANCH_YINYANG: YinYang[] = ['阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴']

export const WUXING_LIST: Wuxing[] = ['金', '木', '水', '火', '土']
/** 五行相生：木→火→土→金→水→木 */
export const WUXING_SHENG: Record<Wuxing, Wuxing> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
/** 五行相克：木克土、土克水、水克火、火克金、金克木 */
export const WUXING_KE: Record<Wuxing, Wuxing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

/** 六十甲子纳音（每两柱一纳音，30 组） */
export const NAYIN = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金',
  '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水',
  '沙中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
  '大溪水', '沙中土', '天上火', '石榴木', '大海水',
] as const

export interface HiddenStemDef {
  stem: string
  stemIdx: number
  role: '本气' | '中气' | '余气'
}

/**
 * 地支藏干表（本气/中气/余气）。
 * 规则出处：《渊海子平》地支藏干歌诀（传统公共文献）。
 * 排列约定：四正支只列本气；四墓库为 本气(土)→中气→余气；四生支为 本气→中气→余气。
 */
export const HIDDEN_STEMS: HiddenStemDef[][] = (() => {
  const def = (s: string, role: HiddenStemDef['role']): HiddenStemDef => ({
    stem: s,
    stemIdx: STEMS.indexOf(s as (typeof STEMS)[number]),
    role,
  })
  return [
    [def('癸', '本气')], // 子
    [def('己', '本气'), def('癸', '中气'), def('辛', '余气')], // 丑
    [def('甲', '本气'), def('丙', '中气'), def('戊', '余气')], // 寅
    [def('乙', '本气')], // 卯
    [def('戊', '本气'), def('乙', '中气'), def('癸', '余气')], // 辰
    [def('丙', '本气'), def('庚', '中气'), def('戊', '余气')], // 巳
    [def('丁', '本气'), def('己', '中气')], // 午
    [def('己', '本气'), def('丁', '中气'), def('乙', '余气')], // 未
    [def('庚', '本气'), def('壬', '中气'), def('戊', '余气')], // 申
    [def('辛', '本气')], // 酉
    [def('戊', '本气'), def('辛', '中气'), def('丁', '余气')], // 戌
    [def('壬', '本气'), def('甲', '中气')], // 亥
  ]
})()

/**
 * 十二长生（阳顺阴逆，完整实现）：
 * 阳干长生：甲亥、丙戊寅、庚巳、壬申，顺行十二支；
 * 阴干长生：乙午、丁己酉、辛子、癸卯，逆行十二支。
 * 规则出处：《五行寄生十二宫》之说，见《三命通会·论干支性情》（传统公共文献）。
 */
export const STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'] as const

/** 各天干长生所在支序（子=0）：甲11 乙6 丙2 丁9 戊2 己9 庚5 辛0 壬8 癸3 */
export const CHANGSHENG_BRANCH = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3] as const

/** 日主在某地支的十二长生状态（阳干顺行、阴干逆行） */
export function stageAt(stemIdx: number, branchIdx: number): string {
  const start = CHANGSHENG_BRANCH[stemIdx]
  const isYang = stemIdx % 2 === 0
  const offset = isYang
    ? (((branchIdx - start) % 12) + 12) % 12
    : (((start - branchIdx) % 12) + 12) % 12
  return STAGES[offset]
}

/** 天干五合：甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火（《渊海子平》） */
export const STEM_COMBINE: Record<number, { withIdx: number; result: Wuxing }> = {
  0: { withIdx: 5, result: '土' },
  1: { withIdx: 6, result: '金' },
  2: { withIdx: 7, result: '水' },
  3: { withIdx: 8, result: '木' },
  4: { withIdx: 9, result: '火' },
  5: { withIdx: 0, result: '土' },
  6: { withIdx: 1, result: '金' },
  7: { withIdx: 2, result: '水' },
  8: { withIdx: 3, result: '木' },
  9: { withIdx: 4, result: '火' },
}

const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)

function buildPairTable(pairs: [number, number][], result?: Wuxing[]): Map<string, Wuxing | undefined> {
  const m = new Map<string, Wuxing | undefined>()
  pairs.forEach(([a, b], i) => m.set(pairKey(a, b), result ? result[i] : undefined))
  return m
}

/** 地支六合：子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合土（《三命通会》） */
export const BRANCH_LIUHE = buildPairTable(
  [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]],
  ['土', '木', '火', '金', '水', '土'],
)

/** 地支六冲：子午、丑未、寅申、卯酉、辰戌、巳亥 */
export const BRANCH_CHONG = buildPairTable([[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]])

/** 地支六害：子未、丑午、寅巳、卯辰、申亥、酉戌 */
export const BRANCH_HAI = buildPairTable([[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]])

/** 地支相破：子酉、丑辰、寅亥、卯午、巳申、未戌 */
export const BRANCH_PO = buildPairTable([[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]])

/** 三合局：申子辰合水、寅午戌合火、巳酉丑合金、亥卯未合木 */
export const SANHE_GROUPS: { branches: [number, number, number]; result: Wuxing }[] = [
  { branches: [8, 0, 4], result: '水' },
  { branches: [2, 6, 10], result: '火' },
  { branches: [5, 9, 1], result: '金' },
  { branches: [11, 3, 7], result: '木' },
]

/** 三会方：寅卯辰东方木、巳午未南方火、申酉戌西方金、亥子丑北方水 */
export const SANHUI_GROUPS: { branches: [number, number, number]; result: Wuxing; name: string }[] = [
  { branches: [2, 3, 4], result: '木', name: '东方木' },
  { branches: [5, 6, 7], result: '火', name: '南方火' },
  { branches: [8, 9, 10], result: '金', name: '西方金' },
  { branches: [11, 0, 1], result: '水', name: '北方水' },
]

/** 相刑：寅巳申恃势之刑（任意两支见刑）、丑戌未无恩之刑、子卯无礼之刑；辰午酉亥自刑 */
export const XING_PAIR_GROUPS: { branches: [number, number, number]; name: string }[] = [
  { branches: [2, 5, 8], name: '恃势之刑' },
  { branches: [1, 10, 7], name: '无恩之刑' },
]
export const XING_ZIMAO = buildPairTable([[0, 3]])
export const ZIXING_BRANCHES = [4, 6, 9, 11] // 辰午酉亥

/** 五虎遁（年上起月）：甲己丙寅、乙庚戊寅、丙辛庚寅、丁壬壬寅、戊癸甲寅 → 寅月天干序 */
export const HUTU_START = [2, 4, 6, 8, 0] as const
/** 五鼠遁（日上起时）：甲己甲子、乙庚丙子、丙辛戊子、丁壬庚子、戊癸壬子 → 子时天干序 */
export const SHUTU_START = [0, 2, 4, 6, 8] as const

/** 由天干/地支序号求六十甲子序号（同奇偶才有解；无解返回 -1） */
export function findJiazi(stemIdx: number, branchIdx: number): number {
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) return i
  }
  return -1
}

/** 空亡：由日柱六十甲子序推旬空两支（甲子旬戌亥空……甲寅旬子丑空） */
export function kongWangBranches(dayJiaziIdx: number): [number, number] {
  const xun = Math.floor((((dayJiaziIdx % 60) + 60) % 60) / 10) // 0..5
  const xunStartBranch = (((0 - 2 * xun) % 12) + 12) % 12 // 子0 戌10 申8 午6 辰4 寅2
  return [(((xunStartBranch - 2) % 12) + 12) % 12, (((xunStartBranch - 1) % 12) + 12) % 12]
}

/** 时辰支序：23、0 点为子时(0)，1-2 点丑时(1)…… */
export function hourToBranchIdx(hour: number): number {
  return Math.floor(((hour % 24) + 1) / 2) % 12
}
