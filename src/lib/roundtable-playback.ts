import type { RoundTableResult } from './roundtable'

export const PLAYBACK_TICK_MS = 50
export const DEFAULT_TYPEWRITER_SPEED = 34

export interface RoundTablePhase {
  kind: 'waiting' | 'opening' | 'seat' | 'consensus' | 'closing'
  title: string
  text: string
  duration: number
  seatIndex?: number
}

export function buildRoundTablePhases(result: RoundTableResult): RoundTablePhase[] {
  return [
    { kind: 'waiting', title: '结果已到 · 即将开演', text: '', duration: 1800 },
    { kind: 'opening', title: '先生开场', text: result.opening, duration: 1800 },
    ...result.seats.map((seat, seatIndex): RoundTablePhase => ({
      kind: 'seat', title: `第${seatIndex + 1}席 · ${seat.school}`,
      text: seat.content, duration: 6500, seatIndex,
    })),
    { kind: 'consensus', title: '共识与分歧', text: result.consensus, duration: 7000 },
    { kind: 'closing', title: '先生收束', text: result.closing, duration: 4500 },
  ]
}

/** 阶段和打字共用一个时钟；按字素切分，避免拆开 emoji、扩展汉字或组合字符。 */
export function createRoundTablePlayback(phases: RoundTablePhase[]) {
  const segmenter = new Intl.Segmenter('zh', { granularity: 'grapheme' })
  const characters = phases.map((phase) => Array.from(segmenter.segment(phase.text), (part) => part.segment))
  let phase = 0
  let elapsed = 0
  let typed = 0
  let reading = 0
  let finished = phases.length === 0

  return {
    tick(speed: number) {
      if (!finished) {
        elapsed += PLAYBACK_TICK_MS
        // 留出入场动画时间；切换速度只影响后续字符，不倒退、不重演。
        if (elapsed > 500) {
          const interval = Number.isFinite(speed) && speed >= 0 ? speed : DEFAULT_TYPEWRITER_SPEED
          typed = interval === 0 ? characters[phase].length : typed + PLAYBACK_TICK_MS * 2 / interval
          if (Math.floor(typed) >= characters[phase].length) reading += PLAYBACK_TICK_MS
        }
        // 至少保留原定停留时长，并在全文打完后给出阅读时间。
        if (elapsed >= phases[phase].duration && reading >= 1200) {
          if (phase === phases.length - 1) {
            finished = true
          } else {
            phase += 1
            elapsed = 0
            typed = 0
            reading = 0
          }
        }
      }
      return { phase, shown: characters[phase]?.slice(0, Math.floor(typed)).join('') ?? '', finished }
    },
  }
}
