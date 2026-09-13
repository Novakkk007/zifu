/**
 * 问剑成就（剑冢收集）——纯函数引擎，可单测
 * 12 项成就：解锁即亮，只增不减
 */
import type { JianluRecord } from '@/lib/jianlu'
import { ARENA_GATES } from '@contracts/engines/jianlu/arena-questions'

export interface Achievement {
  id: string
  name: string
  desc: string
  glyph: string
  /** 是否已解锁 */
  unlocked: (r: JianluRecord) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win', name: '初试锋芒', desc: '赢得首场胜利', glyph: '锋', unlocked: (r) => r.wins >= 1 },
  { id: 'streak-3', name: '三剑连珠', desc: '连胜 3 场', glyph: '连', unlocked: (r) => r.streak >= 3 },
  { id: 'streak-5', name: '剑气如虹', desc: '连胜 5 场', glyph: '虹', unlocked: (r) => r.streak >= 5 },
  { id: 'gate-1', name: '破峰初啼', desc: '攻破第一座山峰', glyph: '峰', unlocked: (r) => r.gatesCleared >= 1 },
  { id: 'gate-7', name: '华山之巅', desc: '七峰尽破', glyph: '巅', unlocked: (r) => r.gatesCleared >= 7 },
  { id: 'duel-1', name: '同盘亮剑', desc: '完成首场同盘对断', glyph: '断', unlocked: (r) => r.modeWins.duel >= 1 },
  { id: 'wins-10', name: '江湖留名', desc: '累计 10 胜', glyph: '名', unlocked: (r) => r.wins >= 10 },
  { id: 'wins-25', name: '一方高手', desc: '累计 25 胜', glyph: '高', unlocked: (r) => r.wins >= 25 },
  { id: 'wins-50', name: '开宗立派', desc: '累计 50 胜', glyph: '宗', unlocked: (r) => r.wins >= 50 },
  { id: 'wins-100', name: '绝顶宗师', desc: '累计 100 胜', glyph: '绝', unlocked: (r) => r.wins >= 100 },
  { id: 'rank-3', name: '一流剑客', desc: '段位达一流', glyph: '流', unlocked: (r) => r.wins >= 25 },
  { id: 'full-clear', name: '七峰全破', desc: '通关全部关卡', glyph: '全', unlocked: (r) => r.gatesCleared >= 7 && r.wins >= 10 },
]

export function unlockedCount(r: JianluRecord): number {
  return ACHIEVEMENTS.filter((a) => a.unlocked(r)).length
}

/* ---------------- 每日研剑（悟性轴） ---------------- */

/** djb2 哈希（确定性） */
function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  }
  return h
}

/** 今日日期（本地，YYYY-MM-DD） */
export function todayKey(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const INSIGHT_KEY = 'zifu:jianlu:insight'

export interface InsightState {
  /** 悟性值（软货币——只换称号，不换胜场） */
  insight: number
  /** 最近答题日期 */
  lastDate: string
  /** 连续天数 */
  streakDays: number
}

export function loadInsight(): InsightState {
  try {
    const raw = localStorage.getItem(INSIGHT_KEY)
    if (!raw) return { insight: 0, lastDate: '', streakDays: 0 }
    const d = JSON.parse(raw) as Partial<InsightState>
    return {
      insight: typeof d.insight === 'number' ? d.insight : 0,
      lastDate: typeof d.lastDate === 'string' ? d.lastDate : '',
      streakDays: typeof d.streakDays === 'number' ? d.streakDays : 0,
    }
  } catch {
    return { insight: 0, lastDate: '', streakDays: 0 }
  }
}

export function saveInsight(s: InsightState): void {
  try {
    localStorage.setItem(INSIGHT_KEY, JSON.stringify(s))
  } catch {
    /* 隐私模式忽略 */
  }
}

/** 今日研剑题：日期确定性选题（全体用户同题，每日一换） */
export function dailyQuestion(): { gateName: string; qIndex: number; optionIndex: number } | null {
  const key = todayKey()
  const g = ARENA_GATES[djb2(key) % ARENA_GATES.length]
  const q = g.questions[djb2(key + ':q') % g.questions.length]
  return { gateName: g.name, qIndex: g.questions.indexOf(q), optionIndex: q.answer }
}

/** 答对今日研剑：悟性 +10，连签 +1（重复答对不重复计） */
export function answerDaily(correct: boolean): InsightState {
  const s = loadInsight()
  const today = todayKey()
  if (correct && s.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000)
    const ym = String(yesterday.getMonth() + 1).padStart(2, '0')
    const yd = String(yesterday.getDate()).padStart(2, '0')
    const yKey = `${yesterday.getFullYear()}-${ym}-${yd}`
    const next: InsightState = {
      insight: s.insight + 10,
      lastDate: today,
      streakDays: s.lastDate === yKey ? s.streakDays + 1 : 1,
    }
    saveInsight(next)
    return next
  }
  return s
}

/** 悟性称号 */
export function insightTitle(insight: number): string {
  if (insight >= 300) return '剑心通明'
  if (insight >= 150) return '渐入佳境'
  if (insight >= 70) return '初悟剑理'
  if (insight >= 30) return '观剑有得'
  return '门外看剑'
}
