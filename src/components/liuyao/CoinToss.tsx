import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GhostButton, GoldButton } from '@/components/Buttons'
import YaoLine from '@/components/liuyao/YaoLine'
import type { Toss } from '@/components/liuyao/logic'
import { YAO_NAMES, yaoLabel } from '@/components/liuyao/logic'
import { cn } from '@/lib/utils'

/* ============================================================
 * S2 · 摇卦交互（动效强化版）
 * 天盘：八卦罗盘常时缓转，摇卦时加速成漩涡
 * 铜钱：三轴翻滚 + 腾空抛物线 + 落地冲击环 / 金火星
 * 爻位：落爻金光扫过、下一爻位提示、成卦脉冲
 * 约束：仅 transform/opacity 动画，无新增依赖
 * ============================================================ */

const TRIGRAMS = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'] as const

/** 移动端轻震动（不支持则静默） */
function safeVibrate(ms: number) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms)
    }
  } catch {
    /* 无振动硬件时忽略 */
  }
}

/** 八卦罗盘：铜钱幕后天盘（常时缓转，摇卦时加速 + 漩涡） */
function BaguaRing({ tossing }: { tossing: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div
        className="relative h-[300px] w-[300px] sm:h-[360px] sm:w-[360px]"
        animate={{ opacity: tossing ? 1 : 0.92 }}
        transition={{ duration: 0.4 }}
      >
        {/* 内盘柔光 */}
        <div
          className="absolute inset-[58px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgb(var(--gold) / 0.18) 0%, transparent 72%)' }}
        />
        {/* 摇卦漩涡 */}
        <motion.div
          className="absolute inset-[8px] animate-ring-fast rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgb(var(--gold-bright) / 0.45) 52deg, transparent 118deg, transparent 180deg, rgb(var(--gold-bright) / 0.36) 250deg, transparent 312deg)',
          }}
          animate={{ opacity: tossing ? 0.9 : 0 }}
          transition={{ duration: 0.35 }}
        />
        {/* 中圈虚线 */}
        <div
          className={cn(
            'absolute inset-[34px] rounded-full border border-dashed border-gold/25',
            tossing ? 'animate-ring-fast' : 'animate-ring-slow',
          )}
        />
        {/* 外盘 · 八卦环 */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border border-gold/40',
            tossing ? 'animate-ring-fast' : 'animate-ring-slow',
          )}
        >
          {TRIGRAMS.map((t, i) => (
            <span key={t} className="absolute inset-0" style={{ transform: `rotate(${i * 45}deg)` }}>
              <span
                className="absolute left-1/2 top-[-10px] -translate-x-1/2 font-serif text-[18px] leading-none text-goldbright/85"
                style={{ textShadow: '0 0 9px rgb(var(--gold-bright) / 0.45)' }}
              >
                {t}
              </span>
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

/** 单枚铜钱：三轴翻滚 + 腾空 + 落地；金铜渐变圆 + 中央方孔 + 字/背 两面 */
function Coin({
  face,
  index,
  spin,
  tossing,
}: {
  face: 'zi' | 'bei'
  index: number
  spin: number
  tossing: boolean
}) {
  const reveal = face === 'bei' ? 180 : 0
  const rotY = spin * 1080 + index * 360 + reveal
  const dir = spin % 2 === 0 ? 1 : -1
  const wobble = (spin % 3) * 4
  const delay = index * 0.05
  const faceCls =
    'absolute inset-0 flex items-center justify-center rounded-full border border-golddim/60 [backface-visibility:hidden] [background:radial-gradient(circle_at_33%_28%,rgb(var(--gold-bright))_0%,rgb(var(--gold))_50%,rgb(var(--gold-dim))_100%)] shadow-[inset_0_2px_5px_rgba(255,255,255,0.4),inset_0_-4px_9px_rgba(0,0,0,0.35),0_12px_22px_-8px_rgba(0,0,0,0.6)]'
  const hole = (
    <span className="block h-[27px] w-[27px] rounded-[5px] border border-golddim/70 bg-silk shadow-[inset_0_2px_5px_rgba(0,0,0,0.35)]" />
  )
  const mark = (t: string) => (
    <span
      className="absolute font-serif text-[16px] font-bold text-deep3 [text-shadow:0_1px_0_rgba(255,255,255,0.35)]"
      style={{ top: 7 }}
    >
      {t}
    </span>
  )
  return (
    <div className="relative h-[76px] w-[76px] sm:h-[96px] sm:w-[96px]" style={{ perspective: 800 }}>
      {/* 腾空金光 */}
      <motion.div
        aria-hidden
        className="absolute -inset-3 rounded-full"
        style={{ background: 'radial-gradient(circle, rgb(var(--gold-bright) / 0.5) 0%, transparent 68%)' }}
        animate={{ opacity: tossing ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      {/* 落地影 */}
      <motion.div
        aria-hidden
        className="absolute -bottom-2 left-1/2 h-[9px] w-[74%] rounded-[50%] bg-black/45 blur-[3px]"
        initial={{ x: '-50%', opacity: 0.5, scaleX: 1 }}
        animate={
          tossing
            ? { x: '-50%', scaleX: [1, 0.55 + wobble * 0.01, 1.1, 1], opacity: [0.5, 0.22, 0.55, 0.5] }
            : { x: '-50%', scaleX: 1, opacity: 0.5 }
        }
        transition={{ duration: 1, delay, times: [0, 0.46, 0.84, 1] }}
      />
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        animate={
          tossing
            ? {
                rotateY: rotY,
                rotateX: [0, (260 + wobble) * dir, 620 + wobble, 720],
                rotateZ: [0, -8 * dir, 6 * dir, 0],
                y: [0, -48 - index * 6 - wobble, -6, 0],
                scale: [1, 1.13, 0.96, 1],
              }
            : { rotateY: rotY, y: 0, scale: 1, rotateZ: 0 }
        }
        transition={{
          duration: tossing ? 0.95 : 0.32,
          delay: tossing ? delay : 0,
          ease: [0.2, 0.75, 0.35, 1],
          times: [0, 0.45, 0.82, 1],
        }}
      >
        <div className={faceCls}>
          {mark('字')}
          {hole}
        </div>
        <div className={faceCls} style={{ transform: 'rotateY(180deg)' }}>
          {mark('背')}
          {hole}
        </div>
      </motion.div>
    </div>
  )
}

/** 落地冲击层：中央闪光 + 三环冲击波 + 金火星（每次摇卦重放） */
function ImpactBurst() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const angle = (i / 30) * Math.PI * 2 + (i % 3) * 0.18
        const dist = 56 + ((i * 31) % 56)
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist * 0.62 + 6,
          size: 3 + (i % 6),
          delay: 0.8 + (i % 5) * 0.02,
        }
      }),
    [],
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {/* 中央金色闪光 */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-64 w-[480px] rounded-[50%]"
        style={{
          background:
            'radial-gradient(ellipse, rgb(255 244 214 / 0.6) 0%, rgb(var(--gold-bright) / 0.35) 40%, transparent 72%)',
        }}
        initial={{ opacity: 0, x: '-50%', y: '-50%', scale: 0.7 }}
        animate={{ opacity: [0, 1, 0], x: '-50%', y: '-50%', scale: [0.7, 1.3, 1.8] }}
        transition={{ duration: 0.7, delay: 0.76, times: [0, 0.28, 1] }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-28 w-28 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgb(255 250 235 / 0.95) 0%, rgb(var(--gold-bright) / 0.4) 45%, transparent 72%)',
        }}
        initial={{ opacity: 0, x: '-50%', y: '-50%', scale: 0.4 }}
        animate={{ opacity: [0, 1, 0], x: '-50%', y: '-50%', scale: [0.4, 1.15, 1.5] }}
        transition={{ duration: 0.5, delay: 0.78, times: [0, 0.3, 1] }}
      />
      {/* 三枚铜钱下的冲击环 */}
      {[16.7, 50, 83.3].map((left, i) => (
        <motion.span
          key={'w1-' + left}
          className="absolute top-1/2 h-20 w-20 rounded-full border-4 border-[#F7E7AA]/95"
          style={{ left: `${left}%`, boxShadow: '0 0 16px rgb(var(--gold-bright) / 0.55)' }}
          initial={{ opacity: 1, x: '-50%', y: '-50%', scale: 0.35 }}
          animate={{ opacity: 0, x: '-50%', y: '-50%', scale: 3.2 }}
          transition={{ duration: 0.5, delay: 0.76 + i * 0.05, ease: 'easeOut' }}
        />
      ))}
      {[16.7, 50, 83.3].map((left, i) => (
        <motion.span
          key={'w2-' + left}
          className="absolute top-1/2 h-16 w-16 rounded-full border border-gold/70"
          style={{ left: `${left}%` }}
          initial={{ opacity: 0.7, x: '-50%', y: '-50%', scale: 0.4 }}
          animate={{ opacity: 0, x: '-50%', y: '-50%', scale: 3.6 }}
          transition={{ duration: 0.6, delay: 0.9 + i * 0.05, ease: 'easeOut' }}
        />
      ))}
      {/* 全盘大冲击环 */}
      <motion.span
        className="absolute left-1/2 top-1/2 rounded-full border-2 border-goldbright/60"
        style={{ width: 140, height: 140, boxShadow: '0 0 24px rgb(var(--gold-bright) / 0.5)' }}
        initial={{ opacity: 0.9, x: '-50%', y: '-50%', scale: 0.4 }}
        animate={{ opacity: 0, x: '-50%', y: '-50%', scale: 3.4 }}
        transition={{ duration: 0.6, delay: 0.78, ease: 'easeOut' }}
      />
      {/* 地面冲击线 */}
      {[16.7, 50, 83.3].map((left, i) => (
        <motion.span
          key={'streak-' + left}
          className="absolute top-1/2 h-[3px] w-24 rounded-full bg-[#F7E7AA]/90"
          style={{ left: `${left}%`, boxShadow: '0 0 10px rgb(var(--gold-bright) / 0.8)' }}
          initial={{ opacity: 0.9, x: '-50%', y: '-50%', scaleX: 0.25 }}
          animate={{ opacity: 0, x: '-50%', y: '-50%', scaleX: 2.4 }}
          transition={{ duration: 0.45, delay: 0.78 + i * 0.05, ease: 'easeOut' }}
        />
      ))}
      {/* 金火星 */}
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          className={cn('absolute left-1/2 top-1/2 rounded-full', i % 2 === 0 ? 'bg-goldbright' : 'bg-gold')}
          style={{
            width: s.size,
            height: s.size,
            marginLeft: -s.size / 2,
            marginTop: -s.size / 2,
            boxShadow: '0 0 12px rgb(var(--gold-bright) / 0.95)',
          }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], x: s.x, y: s.y, scale: [0.5, 1.05, 0.15] }}
          transition={{ duration: 0.7, delay: s.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

type CoinTossProps = {
  tosses: Toss[]
  coins: ['zi' | 'bei', 'zi' | 'bei', 'zi' | 'bei']
  spin: number
  tossing: boolean
  onToss: () => void
  onReset: () => void
  onReveal: () => void
}

/** S2 · 摇卦交互：三枚铜钱 × 六摇 + 爻位堆栈（自下而上） */
export default function CoinToss({ tosses, coins, spin, tossing, onToss, onReset, onReveal }: CoinTossProps) {
  const done = tosses.length >= 6

  // 落定瞬间的轻震（与冲击层同拍）
  useEffect(() => {
    if (spin <= 0) return
    const t = window.setTimeout(() => safeVibrate(22), 780)
    return () => window.clearTimeout(t)
  }, [spin])

  return (
    <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center lg:gap-20">
      {/* 铜钱组 + 按钮 */}
      <div className="flex flex-col items-center">
        {/* 舞台：天盘 + 铜钱 + 冲击层 */}
        <div className="relative px-1 py-2">
          <BaguaRing tossing={tossing} />
          <motion.div
            className="relative z-10 flex items-center gap-4 sm:gap-6"
            animate={tossing ? { x: [0, 0, -5, 5, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 1, times: [0, 0.7, 0.78, 0.85, 0.91, 0.96, 1] }}
          >
            {coins.map((face, i) => (
              <Coin key={i} face={face} index={i} spin={spin} tossing={tossing} />
            ))}
          </motion.div>
          {spin > 0 && <ImpactBurst key={`burst-${spin}`} />}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          {done ? (
            <span className="relative inline-flex">
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full border border-goldbright/60"
                animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              />
              <GoldButton onClick={onReveal} className="animate-gold-breathe">
                成卦 · 参看
              </GoldButton>
            </span>
          ) : (
            <motion.span className="relative inline-flex" whileTap={{ scale: 0.94 }}>
              {!tossing && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full border border-goldbright/50"
                  animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <GoldButton
                onClick={() => {
                  safeVibrate(10)
                  onToss()
                }}
                disabled={tossing}
              >
                {tossing ? '摇卦中…' : '摇 卦'}
              </GoldButton>
            </motion.span>
          )}
          {/* 六摇进度点 */}
          <div className="flex items-center gap-1.5" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors duration-300',
                                    i < tosses.length
                                      ? 'bg-goldbright'
                                      : i === tosses.length && !done
                                        ? 'animate-dot-breathe bg-goldbright/70'
                                        : 'bg-silk-muted/40',
                )}
              />
            ))}
          </div>
          <p className="font-latin text-[12px] tracking-[0.3em] text-inkmuted">
            第 {Math.min(tosses.length + (done ? 0 : 1), 6)} / 6 摇
          </p>
          {tosses.length > 0 && (
            <GhostButton
              onClick={onReset}
              className="border-golddim/50 px-6 py-2 text-[13px] !text-golddim hover:!bg-golddim/10"
            >
              重摇
            </GhostButton>
          )}
        </div>
      </div>

      {/* 爻位堆栈：上爻在顶，初爻在底 */}
      <div className="relative w-full max-w-[300px]">
        <p className="mb-4 text-center text-[12px] tracking-[0.3em] text-inkmuted">爻 位 堆 栈</p>
        <div className="flex flex-col-reverse gap-3">
          {YAO_NAMES.map((name, i) => {
            const toss = tosses[i]
            const isNext = !done && i === tosses.length
            return (
              <div
                key={`${name}-${toss ?? 'e'}`}
                className={cn(
                  'relative flex items-center justify-between gap-4 overflow-hidden rounded-md',
                  isNext && 'bg-gold/[0.08] ring-1 ring-goldbright/60',
                )}
              >
                {toss !== undefined && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 w-1/3"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgb(var(--gold-bright) / 0.28), transparent)',
                    }}
                    initial={{ x: '-130%', opacity: 0.95 }}
                    animate={{ x: '330%', opacity: 0 }}
                    transition={{ duration: 0.9, delay: 0.12, ease: 'easeOut' }}
                  />
                )}
                <span
                  className={cn(
                    'w-14 text-right text-[12.5px] tracking-[0.14em]',
                    toss !== undefined ? 'text-inktext' : 'text-inkmuted/60',
                  )}
                >
                  {name}
                </span>
                <div className="flex h-[22px] flex-1 items-center justify-center rounded-md bg-silk2/70 px-3">
                  <YaoLine toss={toss} width={72} placeholder={toss === undefined} />
                </div>
                <span className="w-16 text-[11.5px] tracking-[0.06em] text-golddim">
                  {toss !== undefined ? yaoLabel(toss) : ''}
                </span>
              </div>
            )
          })}
        </div>
        {/* 成卦脉冲 */}
        {done && (
          <motion.div
            key="done-flash"
            aria-hidden
            className="pointer-events-none absolute inset-x-[-12px] inset-y-[-14px] rounded-2xl"
            style={{
              background: 'radial-gradient(ellipse at 50% 42%, rgb(var(--gold-bright) / 0.26) 0%, transparent 72%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.3, times: [0, 0.22, 1], delay: 0.1 }}
          />
        )}
      </div>
    </div>
  )
}
