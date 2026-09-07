import { describe, expect, it } from 'vitest'
import { buildRoundTablePhases, createRoundTablePlayback, PLAYBACK_TICK_MS } from './roundtable-playback'
import type { RoundTableResult } from './roundtable'

const result: RoundTableResult = {
  opening: '开场', seats: [{ school: '子平格局派', content: '发言' }], consensus: '共识', closing: '收束',
}

function advance(clock: ReturnType<typeof createRoundTablePlayback>, ms: number, speed = 34) {
  let state = clock.tick(speed)
  for (let elapsed = PLAYBACK_TICK_MS; elapsed < ms; elapsed += PLAYBACK_TICK_MS) state = clock.tick(speed)
  return state
}

describe('圆桌演出统一时钟', () => {
  it('逐段经历入席、开场、实际席位、共识、收束，使用各自停留时长', () => {
    const clock = createRoundTablePlayback(buildRoundTablePhases(result))
    expect(advance(clock, 1750).phase).toBe(0)
    expect(advance(clock, 50).phase).toBe(1)
    expect(advance(clock, 1800).phase).toBe(2)
    expect(advance(clock, 6450).phase).toBe(2)
    expect(advance(clock, 50).phase).toBe(3)
    expect(advance(clock, 7000).phase).toBe(4)
    expect(advance(clock, 4450).finished).toBe(false)
    expect(advance(clock, 50).finished).toBe(true)
    expect(advance(clock, 10000).finished).toBe(true)
  })

  it('长文全部出现并留出阅读时间后才推进', () => {
    const text = '甲'.repeat(1000)
    const clock = createRoundTablePlayback(buildRoundTablePhases({ ...result, opening: text }))
    advance(clock, 1800)
    const partial = advance(clock, 1800)
    expect(partial.phase).toBe(1)
    expect(partial.shown.length).toBeLessThan(text.length)
    const complete = advance(clock, 15700)
    expect(complete.phase).toBe(1)
    expect(complete.shown).toBe(text)
    expect(advance(clock, 1200).phase).toBe(2)
  })

  it('实时调速继续打字，慢速、快速和即时显示均生效', () => {
    const phases = buildRoundTablePhases({ ...result, opening: '甲'.repeat(300) })
    const slow = createRoundTablePlayback(phases)
    const fast = createRoundTablePlayback(phases)
    advance(slow, 1800)
    advance(fast, 1800)
    const slowState = advance(slow, 1000, 68)
    const fastState = advance(fast, 1000, 17)
    expect(fastState.shown.length).toBeGreaterThan(slowState.shown.length)
    const changed = advance(slow, 50, 17)
    expect(changed.phase).toBe(slowState.phase)
    expect(changed.shown.startsWith(slowState.shown)).toBe(true)
    expect(advance(slow, 50, 0).shown).toBe(phases[1].text)
  })

  it('逐字显示不拆开扩展汉字、组合字符或 emoji', () => {
    const clock = createRoundTablePlayback(buildRoundTablePhases({ ...result, opening: '𠮷👩‍👩‍👧‍👦e\u0301🕯️' }))
    advance(clock, 1800)
    expect(advance(clock, 550, 100).shown).toBe('𠮷')
    expect(advance(clock, 50, 100).shown).toBe('𠮷👩‍👩‍👧‍👦')
    expect(advance(clock, 50, 100).shown).toBe('𠮷👩‍👩‍👧‍👦e\u0301')
  })

  it('无席位和超过七席都按实际席数演出，没有硬编码阶段冲突', () => {
    for (const count of [0, 9]) {
      const phases = buildRoundTablePhases({ ...result, seats: Array.from({ length: count }, () => result.seats[0]) })
      const clock = createRoundTablePlayback(phases)
      expect(phases.filter((phase) => phase.kind === 'seat')).toHaveLength(count)
      expect(advance(clock, 3600 + count * 6500).phase).toBe(count + 2)
      expect(advance(clock, 11500).finished).toBe(true)
    }
  })

  it('无效速度回退到默认值', () => {
    for (const speed of [NaN, Infinity, -1]) {
      const clock = createRoundTablePlayback(buildRoundTablePhases(result))
      advance(clock, 1800)
      expect(advance(clock, 600, speed).shown).toBe('开场')
    }
  })
})
