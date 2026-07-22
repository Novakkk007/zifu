/**
 * 六爻纳甲装卦规则表（通行装卦法）。
 * - 纳甲：乾纳甲壬、坤纳乙癸、震纳庚、巽纳辛、坎纳戊、离纳己、艮纳丙、兑纳丁
 *   （《卜筮正宗·纳甲歌诀》）
 * - 世应：八宫口诀「天同二世天变五，地同四世地变初，本宫六世三世异，人同游魂人变归」
 * - 六亲：以卦宫五行为「我」——同我兄弟、生我父母、我生子孙、克我官鬼、我克妻财
 * - 六神：以日干起，甲乙青龙、丙丁朱雀、戊勾陈、己螣蛇、庚辛白虎、壬癸玄武，自下而上
 * - 旬空：以日柱所在旬推空亡二支
 */
import type { TrigramName } from './hexagram-data'

export type Wuxing = '金' | '木' | '水' | '火' | '土'

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

/** 八卦卦形（自下而上三爻，1=阳 0=阴）→ 卦名 */
export const TRIGRAM_LINES: Record<TrigramName, [number, number, number]> = {
  乾: [1, 1, 1],
  兑: [1, 1, 0],
  离: [1, 0, 1],
  震: [1, 0, 0],
  巽: [0, 1, 1],
  坎: [0, 1, 0],
  艮: [0, 0, 1],
  坤: [0, 0, 0],
}

/** 三爻（自下而上）→ 卦名 */
export function trigramOf(lines: [number, number, number]): TrigramName {
  const key = lines.join('')
  for (const [name, l] of Object.entries(TRIGRAM_LINES)) {
    if (l.join('') === key) return name as TrigramName
  }
  throw new Error(`trigram not found: ${key}`)
}

/** 八卦五行（卦宫五行亦同） */
export const TRIGRAM_WUXING: Record<TrigramName, Wuxing> = {
  乾: '金',
  兑: '金',
  离: '火',
  震: '木',
  巽: '木',
  坎: '水',
  坤: '土',
  艮: '土',
}

/** 地支五行 */
export const BRANCH_WUXING: Record<string, Wuxing> = {
  寅: '木',
  卯: '木',
  巳: '火',
  午: '火',
  申: '金',
  酉: '金',
  亥: '水',
  子: '水',
  辰: '土',
  戌: '土',
  丑: '土',
  未: '土',
}

/** 五行相生：X → X所生 */
export const WUXING_SHENG: Record<Wuxing, Wuxing> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
/** 五行相克：X → X所克 */
export const WUXING_KE: Record<Wuxing, Wuxing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

/**
 * 纳甲表：每卦 [内卦三爻（初二 三），外卦三爻（四五上）] 的干支（自下而上）。
 * 干为纳干，支为纳支；震巽坎离艮兑六子卦内外同干，乾坤内甲/乙、外壬/癸。
 */
export const NAJIA: Record<TrigramName, { inner: string[]; outer: string[] }> = {
  乾: { inner: ['甲子', '甲寅', '甲辰'], outer: ['壬午', '壬申', '壬戌'] },
  坎: { inner: ['戊寅', '戊辰', '戊午'], outer: ['戊申', '戊戌', '戊子'] },
  艮: { inner: ['丙辰', '丙午', '丙申'], outer: ['丙戌', '丙子', '丙寅'] },
  震: { inner: ['庚子', '庚寅', '庚辰'], outer: ['庚午', '庚申', '庚戌'] },
  巽: { inner: ['辛丑', '辛亥', '辛酉'], outer: ['辛未', '辛巳', '辛卯'] },
  离: { inner: ['己卯', '己丑', '己亥'], outer: ['己酉', '己未', '己巳'] },
  坤: { inner: ['乙未', '乙巳', '乙卯'], outer: ['乙丑', '乙亥', '乙酉'] },
  兑: { inner: ['丁巳', '丁卯', '丁丑'], outer: ['丁亥', '丁酉', '丁未'] },
}

/** 以卦宫五行为「我」论六亲 */
export function liuqinOf(gongWuxing: Wuxing, branch: string): string {
  const el = BRANCH_WUXING[branch]
  if (!el) throw new Error(`unknown branch: ${branch}`)
  if (el === gongWuxing) return '兄弟'
  if (WUXING_SHENG[el] === gongWuxing) return '父母'
  if (WUXING_SHENG[gongWuxing] === el) return '子孙'
  if (WUXING_KE[gongWuxing] === el) return '妻财'
  return '官鬼'
}

/**
 * 八宫卦次判定：比较上下卦天地人三爻（口诀）。
 * 返回 { shi: 世爻位（0-5 自下而上）, kind: 卦次名, palaceFrom: 还原本宫需翻转的爻位（0基） }
 */
export function palaceInfo(lines: number[]): {
  shi: number
  kind: '本宫' | '一世' | '二世' | '三世' | '四世' | '五世' | '游魂' | '归魂'
  flipsToPalace: number[]
} {
  const d = lines[0] === lines[3] // 地（初 vs 四）
  const r = lines[1] === lines[4] // 人（二 vs 五）
  const t = lines[2] === lines[5] // 天（三 vs 上）
  if (d && r && t) return { shi: 5, kind: '本宫', flipsToPalace: [] }
  if (!d && !r && !t) return { shi: 2, kind: '三世', flipsToPalace: [0, 1, 2] }
  if (t && !d && !r) return { shi: 1, kind: '二世', flipsToPalace: [0, 1] }
  if (!t && d && r) return { shi: 4, kind: '五世', flipsToPalace: [0, 1, 2, 3, 4] }
  if (d && !t && !r) return { shi: 3, kind: '四世', flipsToPalace: [0, 1, 2, 3] }
  if (!d && t && r) return { shi: 0, kind: '一世', flipsToPalace: [0] }
  if (r && !t && !d) return { shi: 3, kind: '游魂', flipsToPalace: [0, 1, 2, 4] }
  return { shi: 2, kind: '归魂', flipsToPalace: [4] }
}

/** 求卦宫（八纯卦名）：将本卦按卦次规则还原为本宫卦，取其上下（相同）卦名 */
export function palaceOf(lines: number[]): TrigramName {
  const { flipsToPalace } = palaceInfo(lines)
  const restored = lines.map((v, i) => (flipsToPalace.includes(i) ? 1 - v : v))
  return trigramOf([restored[0], restored[1], restored[2]])
}

/** 六神序列（自下而上循环） */
export const LIUSHEN_ORDER = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'] as const

/** 日干 → 初爻所起六神在 LIUSHEN_ORDER 中的下标 */
export function liushenStart(dayGan: string): number {
  if (dayGan === '甲' || dayGan === '乙') return 0 // 青龙
  if (dayGan === '丙' || dayGan === '丁') return 1 // 朱雀
  if (dayGan === '戊') return 2 // 勾陈
  if (dayGan === '己') return 3 // 螣蛇
  if (dayGan === '庚' || dayGan === '辛') return 4 // 白虎
  if (dayGan === '壬' || dayGan === '癸') return 5 // 玄武
  throw new Error(`unknown day stem: ${dayGan}`)
}

/** 第 i 爻（0 基，自下而上）所临六神 */
export function liushenOf(dayGan: string, yaoIndex: number): string {
  return LIUSHEN_ORDER[(liushenStart(dayGan) + yaoIndex) % 6]
}

/**
 * 旬空：以日柱干支推所在旬之空亡二支。
 * 旬首支 = (日支序 − 日干序) mod 12；空亡 = 旬首支后第 10、11 支。
 * 如甲子旬戌亥空、甲戌旬申酉空。
 */
export function xunKongOf(dayGanzhi: string): [string, string] {
  const gan = dayGanzhi[0]
  const zhi = dayGanzhi[1]
  const gi = STEMS.indexOf(gan as (typeof STEMS)[number])
  const zi = BRANCHES.indexOf(zhi as (typeof BRANCHES)[number])
  if (gi < 0 || zi < 0) throw new Error(`invalid ganzhi: ${dayGanzhi}`)
  const xunFirstBranch = (zi - gi + 12) % 12
  return [BRANCHES[(xunFirstBranch + 10) % 12], BRANCHES[(xunFirstBranch + 11) % 12]]
}
