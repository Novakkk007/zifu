/**
 * 问剑音效（Web Audio 合成，零资源文件）
 * 克制原则：只三声——答对清磬 / 答错闷响 / 破峰剑鸣；默认静音需用户开声
 */
let ctx: AudioContext | null = null
let enabled = false

export function soundEnabled(): boolean {
  return enabled
}

export function enableSound(): void {
  enabled = true
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, c.currentTime + start)
  g.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur)
  o.connect(g).connect(c.destination)
  o.start(c.currentTime + start)
  o.stop(c.currentTime + start + dur + 0.05)
}

/** 答对：清磬一声（高频正弦+泛音） */
export function sndRight(): void {
  if (!enabled) return
  tone(880, 0, 0.5, 0.06)
  tone(1760, 0.02, 0.4, 0.03)
}

/** 答错：闷响（低频短促） */
export function sndWrong(): void {
  if (!enabled) return
  tone(220, 0, 0.22, 0.05, 'triangle')
}

/** 破峰：剑鸣（滑音上行） */
export function sndVictory(): void {
  if (!enabled) return
  tone(440, 0, 0.15, 0.05, 'sawtooth')
  tone(660, 0.12, 0.2, 0.05, 'sawtooth')
  tone(990, 0.26, 0.5, 0.06, 'sawtooth')
}
