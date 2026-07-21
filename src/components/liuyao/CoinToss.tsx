import { motion } from 'framer-motion'
import { GhostButton, GoldButton } from '@/components/Buttons'
import YaoLine from '@/components/liuyao/YaoLine'
import type { Toss } from '@/components/liuyao/logic'
import { YAO_NAMES, yaoLabel } from '@/components/liuyao/logic'
import { cn } from '@/lib/utils'

/** 单枚铜钱：金铜渐变圆 + 中央方孔 + 字/背 两面 */
function Coin({ face, spinTarget, tossing }: { face: 'zi' | 'bei'; spinTarget: number; tossing: boolean }) {
  const faceCls =
    'absolute inset-0 flex items-center justify-center rounded-full border border-golddim/50 [backface-visibility:hidden] [background:radial-gradient(circle_at_35%_30%,rgb(var(--gold-bright)),rgb(var(--gold))_55%,rgb(var(--gold-dim)))]'
  const hole = (
    <span className="block h-[26px] w-[26px] rounded-[4px] border border-golddim/60 bg-silk shadow-inner" />
  )
  return (
    <div className="relative h-[72px] w-[72px] sm:h-[88px] sm:w-[88px]" style={{ perspective: 640 }}>
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateY: spinTarget + (face === 'bei' ? 180 : 0),
          y: tossing ? [0, -42, 0] : 0,
        }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      >
        <div className={faceCls}>
          <span className="absolute font-serif text-[15px] font-bold text-deep3" style={{ top: 6 }}>
            字
          </span>
          {hole}
        </div>
        <div className={faceCls} style={{ transform: 'rotateY(180deg)' }}>
          <span className="absolute font-serif text-[15px] font-bold text-deep3" style={{ top: 6 }}>
            背
          </span>
          {hole}
        </div>
      </motion.div>
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
export default function CoinToss({
  tosses,
  coins,
  spin,
  tossing,
  onToss,
  onReset,
  onReveal,
}: CoinTossProps) {
  const done = tosses.length >= 6
  return (
    <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center lg:gap-20">
      {/* 铜钱组 + 按钮 */}
      <div className="flex flex-col items-center">
        <motion.div
          className="flex items-center gap-4 sm:gap-6"
          animate={{ x: tossing ? [0, -3, 3, -3, 3, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          {coins.map((face, i) => (
            <Coin key={i} face={face} spinTarget={spin * (720 + i * 120)} tossing={tossing} />
          ))}
        </motion.div>

        <div className="mt-10 flex flex-col items-center gap-3">
          {done ? (
            <GoldButton onClick={onReveal} className="animate-gold-breathe">
              成卦 · 参看
            </GoldButton>
          ) : (
            <GoldButton onClick={onToss} disabled={tossing}>
              {tossing ? '摇卦中…' : '摇 卦'}
            </GoldButton>
          )}
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
      <div className="w-full max-w-[300px]">
        <p className="mb-4 text-center text-[12px] tracking-[0.3em] text-inkmuted">爻 位 堆 栈</p>
        <div className="flex flex-col-reverse gap-3">
          {YAO_NAMES.map((name, i) => {
            const toss = tosses[i]
            return (
              <div key={name} className="flex items-center justify-between gap-4">
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
      </div>
    </div>
  )
}
