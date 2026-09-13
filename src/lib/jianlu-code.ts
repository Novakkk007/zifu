/**
 * 华山问剑 · 传一题（口令编解码 + 防刷 + 分享链接）
 *
 * 口令格式：「紫府问剑·壹·贰」——关号壹~柒、题号壹~叁。
 * 零隐私：口令只含关号与题号（题库随 bundle 本地判分），不含生辰/命盘/任何个人信息。
 *
 * 防刷：每 (关, 题) 组合终身只计 1 胜场——localStorage `zifu:jianlu:jie-solved`
 * 记录已接剑题目，重复接剑不计胜。七关 × 3 题 = 21 道口令，接剑胜场上限天然为 21。
 */

/** 已接剑题目存储键（终身只计一次胜场） */
const SOLVED_KEY = 'zifu:jianlu:jie-solved'

/** 口令前缀 */
const CODE_PREFIX = '紫府问剑'

/** 关号中文数字（下标 0-6，题号取前三字） */
const GATE_NUMS = ['壹', '贰', '叁', '肆', '伍', '陆', '柒']

/** 数字字符 → 下标（宽容解析：中文数字 / 大写数字 / 阿拉伯数字） */
const NUM_TO_IDX: Record<string, number> = {
  壹: 0,
  一: 0,
  '1': 0,
  贰: 1,
  二: 1,
  两: 1,
  '2': 1,
  叁: 2,
  三: 2,
  '3': 2,
  肆: 3,
  四: 3,
  '4': 3,
  伍: 4,
  五: 4,
  '5': 4,
  陆: 5,
  六: 5,
  '6': 5,
  柒: 6,
  七: 6,
  '7': 6,
}

export interface JieCode {
  gateIdx: number
  qIdx: number
}

/** 接剑胜场上限：7 关 × 3 题——21 道口令终身各计 1 胜 */
export const JIE_MAX_WINS = GATE_NUMS.length * 3

/** 编口令：关号题号 → 「紫府问剑·壹·贰」。越界返回空串。 */
export function encodeGateQuestion(gateIdx: number, qIdx: number): string {
  if (!Number.isInteger(gateIdx) || gateIdx < 0 || gateIdx >= GATE_NUMS.length) return ''
  if (!Number.isInteger(qIdx) || qIdx < 0 || qIdx > 2) return ''
  return `${CODE_PREFIX}·${GATE_NUMS[gateIdx]}·${GATE_NUMS[qIdx]}`
}

/**
 * 解口令：容错接受「紫府问剑·壹·贰」「紫府问剑壹贰」「壹贰」「12」「一·二」或完整 URL 尾巴。
 * 失败返回 null。
 */
export function decodeGateQuestion(code: string | null | undefined): JieCode | null {
  if (!code) return null
  let s = code.trim()
  // 容忍粘贴完整链接（取最后一段；若是百分号编码的原始链接先解一次）
  if (s.includes('/')) {
    s = s.slice(s.lastIndexOf('/') + 1).trim()
    if (s.includes('%')) {
      try {
        s = decodeURIComponent(s)
      } catch {
        /* 解码失败保留原样 */
      }
    }
  }
  if (s.startsWith(CODE_PREFIX)) s = s.slice(CODE_PREFIX.length)
  // 去分隔符后应恰剩两个数字字符
  const compact = s.replace(/[·・、\-_\s]+/g, '')
  if (compact.length !== 2) return null
  const gateIdx = NUM_TO_IDX[compact[0]]
  const qIdx = NUM_TO_IDX[compact[1]]
  if (gateIdx === undefined || qIdx === undefined) return null
  if (gateIdx >= GATE_NUMS.length || qIdx > 2) return null
  return { gateIdx, qIdx }
}

function solvedKeyOf(gateIdx: number, qIdx: number): string {
  return `${gateIdx}:${qIdx}`
}

function loadSolvedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(SOLVED_KEY)
    const arr: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

/** 该题是否已接过（每 (关,题) 终身只计 1 胜） */
export function isJieSolved(gateIdx: number, qIdx: number): boolean {
  return loadSolvedSet().has(solvedKeyOf(gateIdx, qIdx))
}

/** 标记已接剑（答对时调用，幂等） */
export function markJieSolved(gateIdx: number, qIdx: number): void {
  try {
    const set = loadSolvedSet()
    set.add(solvedKeyOf(gateIdx, qIdx))
    localStorage.setItem(SOLVED_KEY, JSON.stringify([...set]))
  } catch {
    /* 隐私模式忽略 */
  }
}

/** 已接剑题数（展示用） */
export function jieSolvedCount(): number {
  return loadSolvedSet().size
}

/** 接剑路由路径（含 base 前缀，口令已编码） */
export function jianluJiePath(code: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}jianlu/jie/${encodeURIComponent(code)}`
}

/** 接剑完整链接（复制分享用；无 window 环境时返回相对路径） */
export function jianluJieLink(code: string): string {
  if (typeof window === 'undefined') return jianluJiePath(code)
  return `${window.location.origin}${jianluJiePath(code)}`
}

/** 复制到剪贴板（clipboard API + execCommand 兜底），返回是否成功 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 落入兜底 */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
