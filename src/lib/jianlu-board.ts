/**
 * 华山榜 · 客户端库
 * 假名制 + 默认不上榜 + 诚实声明
 * 隐私铁律：只上报「假名 + 战绩」白名单，生辰命盘一律不出本机、不进榜单。
 */
import { rankOf, type JianluRecord } from '@/lib/jianlu'

export const ANON_ID_KEY = 'zifu:jianlu:anon-id'
export const BOARD_NAME_KEY = 'zifu:jianlu:board-name'
export const BOARD_OPTIN_KEY = 'zifu:jianlu:board-optin'

export const DEFAULT_BOARD_NAME = '无名剑客'
export const BOARD_NAME_MAX = 16
export const ANON_ID_LEN = 16

/**
 * 匿名标识：由 crypto.randomUUID() 派生 16 位十六进制串，存 localStorage。
 * 隐私模式（localStorage 不可用）时返回一次性标识（重复提交由服务端限流兜底）。
 */
export function getAnonId(rng: () => string = () => crypto.randomUUID()): string {
  try {
    const cached = localStorage.getItem(ANON_ID_KEY)
    if (cached && /^[a-f0-9]{16}$/.test(cached)) return cached
    const id = rng().replace(/-/g, '').slice(0, ANON_ID_LEN)
    try {
      localStorage.setItem(ANON_ID_KEY, id)
    } catch {
      /* 存储已满等异常忽略 */
    }
    return id
  } catch {
    return rng().replace(/-/g, '').slice(0, ANON_ID_LEN)
  }
}

/** 假名净化：去控制符、去首尾空白、限 16 字 */
export function sanitizeName(name: string): string {
  return stripControlChars(name).trim().slice(0, BOARD_NAME_MAX)
}

/** 去除控制字符（\x00-\x1f 与 DEL，不写控制字符正则以过 lint） */
function stripControlChars(s: string): string {
  let out = ''
  for (const ch of s) {
    const c = ch.charCodeAt(0)
    if (c >= 32 && c !== 127) out += ch
  }
  return out
}

/** 当前假名（未取过则为空串） */
export function getBoardName(): string {
  try {
    return sanitizeName(localStorage.getItem(BOARD_NAME_KEY) ?? '')
  } catch {
    return ''
  }
}

/** 保存假名（返回净化后的值） */
export function setBoardName(name: string): string {
  const clean = sanitizeName(name)
  try {
    localStorage.setItem(BOARD_NAME_KEY, clean)
  } catch {
    /* 隐私模式忽略 */
  }
  return clean
}

/** 不上榜开关：默认不上榜（false）——主动开启才公开 */
export function isBoardOptIn(): boolean {
  try {
    return localStorage.getItem(BOARD_OPTIN_KEY) === '1'
  } catch {
    return false
  }
}

export function setBoardOptIn(on: boolean): void {
  try {
    localStorage.setItem(BOARD_OPTIN_KEY, on ? '1' : '0')
  } catch {
    /* 隐私模式忽略 */
  }
}

/**
 * 提交载荷（零隐私白名单）：
 * 假名 + 战绩 + 段位名 + 峰数——类型里没有生辰/命盘字段。
 */
export interface BoardSubmitPayload {
  id: string
  name: string
  wins: number
  total: number
  gates: number
  rankName: string
}

export function buildSubmitPayload(
  record: JianluRecord,
  name: string,
  anonId?: string
): BoardSubmitPayload {
  return {
    id: anonId ?? getAnonId(),
    name: sanitizeName(name) || DEFAULT_BOARD_NAME,
    wins: Math.max(0, Math.floor(record.wins)),
    total: Math.max(0, Math.floor(record.total)),
    gates: Math.min(7, Math.max(0, Math.floor(record.gatesCleared))),
    rankName: rankOf(record).name,
  }
}

/* ---------------- 榜单数据 ---------------- */

export interface BoardEntry {
  name: string
  wins: number
  gates: number
  rankName: string
  /** 本周胜场（仅周榜返回） */
  weekWins?: number
}

export interface SectBoard {
  sect: string
  gate: string
  items: BoardEntry[]
}

export interface BoardData {
  available: boolean
  weekKey: string
  total: BoardEntry[]
  week: BoardEntry[]
  sects: SectBoard[]
  note?: string
}

function emptyBoard(note?: string): BoardData {
  return {
    available: false,
    weekKey: '',
    total: [],
    week: [],
    sects: [],
    note: note ?? '华山榜暂未开榜——战绩仍留本机，不碍研习。',
  }
}

function asBoardEntry(v: unknown): BoardEntry | null {
  if (typeof v !== 'object' || v === null) return null
  const e = v as Record<string, unknown>
  if (
    typeof e.name !== 'string' ||
    typeof e.wins !== 'number' ||
    typeof e.gates !== 'number' ||
    typeof e.rankName !== 'string'
  ) {
    return null
  }
  return {
    name: e.name,
    wins: e.wins,
    gates: e.gates,
    rankName: e.rankName,
    weekWins: typeof e.weekWins === 'number' ? e.weekWins : undefined,
  }
}

/** 解析并归一化服务端榜单响应（不可信输入防御） */
export function parseBoardData(raw: unknown): BoardData {
  if (typeof raw !== 'object' || raw === null) return emptyBoard()
  const r = raw as Record<string, unknown>
  const arr = (v: unknown): BoardEntry[] =>
    Array.isArray(v) ? v.map(asBoardEntry).filter((e): e is BoardEntry => e !== null) : []
  const sectsRaw = Array.isArray(r.sects) ? r.sects : []
  const sects: SectBoard[] = sectsRaw.map((s) => {
    const o = (typeof s === 'object' && s !== null ? s : {}) as Record<string, unknown>
    return {
      sect: typeof o.sect === 'string' ? o.sect : '',
      gate: typeof o.gate === 'string' ? o.gate : '',
      items: arr(o.items),
    }
  })
  const data: BoardData = {
    available: r.available === true,
    weekKey: typeof r.weekKey === 'string' ? r.weekKey : '',
    total: arr(r.total),
    week: arr(r.week),
    sects,
    note: typeof r.note === 'string' ? r.note : undefined,
  }
  if (!data.available && !data.note) data.note = emptyBoard().note
  return data
}

/** 拉取华山榜（无后端/网络故障时降级为空榜 + 提示，不打断页面） */
export async function fetchBoard(): Promise<BoardData> {
  try {
    const res = await fetch('/api/board', { method: 'GET', headers: { Accept: 'application/json' } })
    if (!res.ok) {
      const raw: unknown = await res.json().catch(() => null)
      const note =
        typeof raw === 'object' && raw !== null && typeof (raw as Record<string, unknown>).note === 'string'
          ? ((raw as Record<string, unknown>).note as string)
          : undefined
      return parseBoardData({ available: false, note })
    }
    return parseBoardData(await res.json())
  } catch {
    return parseBoardData({ available: false, note: '榜单暂未取到——山高路远，稍后再看。' })
  }
}

export interface BoardSubmitResult {
  ok: boolean
  message: string
}

/** 自愿提交战绩（POST /api/board）；限流/校验错误时带回服务端话术 */
export async function submitScore(payload: BoardSubmitPayload): Promise<BoardSubmitResult> {
  try {
    const res = await fetch('/api/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const raw: unknown = await res.json().catch(() => null)
    const err =
      typeof raw === 'object' && raw !== null && typeof (raw as Record<string, unknown>).error === 'string'
        ? ((raw as Record<string, unknown>).error as string)
        : ''
    if (res.ok) return { ok: true, message: '已以假名刻上华山榜' }
    if (err) return { ok: false, message: err }
    return { ok: false, message: '榜单暂未收下——稍后再试' }
  } catch {
    return { ok: false, message: '榜单未通——网络不畅，战绩仍留本机' }
  }
}
