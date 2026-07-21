import hexRaw from '@/data/hexagrams.json?raw'

/** 六十四卦数据条目（lines 自下而上，1=阳 0=阴） */
export type Hexagram = {
  id: number
  name: string
  upper: string
  lower: string
  lines: number[]
  gua: string
  yao: string[]
}

export const HEXAGRAMS: Hexagram[] = JSON.parse(hexRaw) as Hexagram[]

/** 摇卦一爻的数值：6 老阴(动) / 7 少阳 / 8 少阴 / 9 老阳(动) */
export type Toss = 6 | 7 | 8 | 9

export const YAO_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

export function isYang(t: Toss): boolean {
  return t === 7 || t === 9
}
export function isMoving(t: Toss): boolean {
  return t === 6 || t === 9
}
export function yaoLabel(t: Toss): string {
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

/** 三枚铜钱（字=3 背=2）之和 → 爻值 */
export function sumToToss(coins: [number, number, number]): Toss {
  const s = coins[0] + coins[1] + coins[2]
  return s as Toss
}

export function findHexagram(lines: number[]): Hexagram {
  const key = lines.join('')
  const hit = HEXAGRAMS.find((h) => h.lines.join('') === key)
  if (!hit) throw new Error(`hexagram not found: ${key}`)
  return hit
}

/** 由六爻数值（自下而上）求本卦 / 变卦 */
export function deriveHexagrams(tosses: Toss[]): {
  ben: Hexagram
  bian: Hexagram | null
  movingIdx: number[]
} {
  const benLines = tosses.map((t) => (isYang(t) ? 1 : 0))
  const movingIdx = tosses.flatMap((t, i) => (isMoving(t) ? [i] : []))
  const ben = findHexagram(benLines)
  let bian: Hexagram | null = null
  if (movingIdx.length > 0) {
    const bianLines = benLines.map((v, i) => (movingIdx.includes(i) ? 1 - v : v))
    bian = findHexagram(bianLines)
  }
  return { ben, bian, movingIdx }
}

/* ---------------- 六爻纳甲 mock ---------------- */

const TRI_BRANCHES: Record<string, [string[], string[]]> = {
  // [内卦(初二三), 外卦(四五上)] 纳甲地支（古法）
  乾: [['子', '寅', '辰'], ['午', '申', '戌']],
  坎: [['寅', '辰', '午'], ['申', '戌', '子']],
  艮: [['辰', '午', '申'], ['戌', '子', '寅']],
  震: [['子', '寅', '辰'], ['午', '申', '戌']],
  巽: [['丑', '亥', '酉'], ['未', '巳', '卯']],
  离: [['卯', '丑', '亥'], ['酉', '未', '巳']],
  坤: [['未', '巳', '卯'], ['丑', '亥', '酉']],
  兑: [['巳', '卯', '丑'], ['亥', '酉', '未']],
}

const TRI_ELEMENT: Record<string, string> = {
  乾: '金', 兑: '金', 离: '火', 震: '木', 巽: '木', 坎: '水', 坤: '土', 艮: '土',
}
const BRANCH_ELEMENT: Record<string, string> = {
  寅: '木', 卯: '木', 巳: '火', 午: '火', 申: '金', 酉: '金',
  亥: '水', 子: '水', 辰: '土', 戌: '土', 丑: '土', 未: '土',
}
const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

/** 以本宫五行（mock 取下卦）对爻支论六亲 */
function liuqin(gongEl: string, branch: string): string {
  const el = BRANCH_ELEMENT[branch]
  if (el === gongEl) return '兄弟'
  if (SHENG[gongEl] === el) return '子孙'
  if (SHENG[el] === gongEl) return '父母'
  if (KE[gongEl] === el) return '妻财'
  return '官鬼'
}

/** 世爻位（0-5，自下而上），依八宫口诀近似：天同二世天变五，地同四世地变初，本宫六世三世异，人同游魂人变归 */
export function shiPosition(hex: Hexagram): number {
  const same = (i: number) => hex.lines[i] === hex.lines[i + 3]
  const d = same(0)
  const r = same(1)
  const t = same(2)
  if (d && r && t) return 5 // 本宫六世
  if (!d && !r && !t) return 2 // 三世异
  if (t && !d && !r) return 1 // 天同二世
  if (!t && d && r) return 4 // 天变五世
  if (d && !t && !r) return 3 // 地同四世
  if (!d && t && r) return 0 // 地变初世
  if (r && !t && !d) return 3 // 人同游魂
  return 2 // 人变归魂
}

export type NajiaRow = {
  pos: number
  branch: string
  qin: string
  mark: '世' | '应' | null
}

export function buildNajia(hex: Hexagram): NajiaRow[] {
  const inner = TRI_BRANCHES[hex.lower][0]
  const outer = TRI_BRANCHES[hex.upper][1]
  const branches = [...inner, ...outer]
  const gongEl = TRI_ELEMENT[hex.lower]
  const shi = shiPosition(hex)
  const ying = (shi + 3) % 6
  return branches.map((b, i) => ({
    pos: i,
    branch: b,
    qin: liuqin(gongEl, b),
    mark: i === shi ? '世' : i === ying ? '应' : null,
  }))
}
