/**
 * 紫府 · 古风背景音乐（徐徐而来）。
 * 纯 Web Audio 五声音阶音景：程序生成，零版权零下载。
 * 宫商角徵羽双八度、悠长衰减、随机稀疏弹拨——似远山古琴。
 * 渐入渐出、循环、记住用户偏好；默认不打扰（用户主动开启）。
 */
import { useEffect, useRef, useState } from 'react'

const PREF_KEY = 'zifu:bgm'

/** 宫商角徵羽（C 宫）双八度 */
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0]

function useGuqinSoundscape(playing: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<number | null>(null)
  const masterRef = useRef<GainNode | null>(null)

  useEffect(() => {
    if (!playing) {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      timerRef.current = null
      return
    }
    const ctx = ctxRef.current ?? new AudioContext()
    ctxRef.current = ctx
    const master = masterRef.current ?? ctx.createGain()
    masterRef.current = master
    // 徐徐而来：主增益 8 秒渐入到 0.14
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 8)
    master.connect(ctx.destination)
    void ctx.resume()

    const pluck = () => {
      const f = PENTA[Math.floor(Math.random() * PENTA.length)]
      const t = ctx.currentTime
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'triangle'
      o.frequency.value = f
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.5, t + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5)
      o.connect(g)
      g.connect(master)
      o.start(t)
      o.stop(t + 4.6)
      // 五度泛音点缀（角上徵），音量更低
      if (Math.random() < 0.35) {
        const o2 = ctx.createOscillator()
        const g2 = ctx.createGain()
        o2.type = 'sine'
        o2.frequency.value = f * 1.5
        g2.gain.setValueAtTime(0, t)
        g2.gain.linearRampToValueAtTime(0.12, t + 0.06)
        g2.gain.exponentialRampToValueAtTime(0.0001, t + 3.4)
        o2.connect(g2)
        g2.connect(master)
        o2.start(t)
        o2.stop(t + 3.5)
      }
    }
    pluck()
    pluck()
    timerRef.current = window.setInterval(pluck, 2600)

    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [playing])
}

export default function BgmPlayer() {
  const [on, setOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PREF_KEY) === '1'
    } catch {
      return false
    }
  })
  useGuqinSoundscape(on)

  const toggle = () => {
    const next = !on
    setOn(next)
    try {
      localStorage.setItem(PREF_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom))] right-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-deep2/95 text-sm text-goldbright shadow-lg backdrop-blur transition hover:bg-deep3 sm:bottom-40 sm:left-5 sm:h-11 sm:w-auto sm:gap-2 sm:px-4 sm:text-sm"
      aria-label={on ? '关闭背景音乐' : '开启背景音乐'}
      title={on ? '古风乐起 · 点此停' : '古风背景音乐 · 徐徐而来'}
    >
      <span className="sm:hidden">{on ? '停' : '乐'}</span>
      <span className="hidden sm:inline">{on ? '♪ 停' : '♪ 乐'}</span>
    </button>
  )
}
