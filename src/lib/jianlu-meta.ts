/**
 * 问剑成就（剑冢收集）——纯函数引擎，可单测
 * 12 项成就：解锁即亮，只增不减
 */
import type { JianluRecord } from '@/lib/jianlu'

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
