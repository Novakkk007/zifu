/**
 * 华山问剑 · 段位与战绩系统（本地存档，后期账号化）
 * 段位：初入江湖 → 三流 → 二流 → 一流 → 剑道高手 → 绝顶宗师
 */
const STORAGE_KEY = 'zifu:jianlu:record'

export interface JianluRecord {
  /** 总胜场 */
  wins: number
  /** 总场次 */
  total: number
  /** 连胜 */
  streak: number
  /** 七关进度（0-7） */
  gatesCleared: number
  /** 各模式胜场 */
  modeWins: { arena: number; duel: number; debate: number }
  /** 创建时间 */
  createdAt: string
}

export interface RankLevel {
  index: number
  name: string
  desc: string
  minWins: number
  needGates?: number
}

export const RANKS: RankLevel[] = [
  { index: 0, name: '初入江湖', desc: '剑未出鞘', minWins: 0 },
  { index: 1, name: '三流剑客', desc: '略窥门径', minWins: 3 },
  { index: 2, name: '二流剑客', desc: '小有所成', minWins: 10 },
  { index: 3, name: '一流剑客', desc: '江湖留名', minWins: 25 },
  { index: 4, name: '剑道高手', desc: '开宗立派', minWins: 50 },
  { index: 5, name: '绝顶宗师', desc: '华山之巅', minWins: 100, needGates: 7 },
]

const DEFAULT_RECORD: JianluRecord = {
  wins: 0,
  total: 0,
  streak: 0,
  gatesCleared: 0,
  modeWins: { arena: 0, duel: 0, debate: 0 },
  createdAt: new Date().toISOString(),
}

export function loadRecord(): JianluRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_RECORD }
    const d = JSON.parse(raw) as Partial<JianluRecord>
    return { ...DEFAULT_RECORD, ...d, modeWins: { ...DEFAULT_RECORD.modeWins, ...(d.modeWins ?? {}) } }
  } catch {
    return { ...DEFAULT_RECORD }
  }
}

export function saveRecord(r: JianluRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r))
  } catch {
    /* 隐私模式忽略 */
  }
}

export type JianluMode = 'arena' | 'duel' | 'debate'

/** 记录一场胜利 */
export function addWin(r: JianluRecord, mode: JianluMode): JianluRecord {
  const next: JianluRecord = {
    ...r,
    wins: r.wins + 1,
    total: r.total + 1,
    streak: r.streak + 1,
    modeWins: { ...r.modeWins, [mode]: r.modeWins[mode] + 1 },
  }
  saveRecord(next)
  return next
}

/** 记录一场败绩（连胜清零） */
export function addLoss(r: JianluRecord): JianluRecord {
  const next: JianluRecord = { ...r, total: r.total + 1, streak: 0 }
  saveRecord(next)
  return next
}

/** 当前段位 */
export function rankOf(r: JianluRecord): RankLevel {
  let cur = RANKS[0]
  for (const lv of RANKS) {
    if (r.wins >= lv.minWins && (lv.needGates === undefined || r.gatesCleared >= lv.needGates)) {
      cur = lv
    }
  }
  return cur
}

/** 下一段位（无则 null） */
export function nextRank(r: JianluRecord): RankLevel | null {
  const cur = rankOf(r)
  if (cur.index >= RANKS.length - 1) return null
  return RANKS[cur.index + 1]
}
