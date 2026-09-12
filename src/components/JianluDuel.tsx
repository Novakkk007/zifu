/**
 * 同盘对断（华山问剑 · 竞技模式）
 * 流程：随机抽盘 → 门派高手亮断 → 你先断（倒计时悬念）→ 同台亮答案 → 金标判胜负
 * 对手 AI 偶尔「看走眼」（25%）——制造悬念与胜机
 */
import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ARENA_GATES, type ArenaQuestion } from '@contracts/engines/jianlu/arena-questions'
import { addWin, loadRecord, saveRecord } from '@/lib/jianlu'

interface JianluDuelProps {
  record: ReturnType<typeof loadRecord>
  onRecordChange: (r: ReturnType<typeof loadRecord>) => void
  onExit: () => void
}

interface DuelState {
  q: ArenaQuestion
  gateName: string
  peak: string
  glyph: string
  /** 对手是否看走眼 */
  aiMiss: boolean
  /** 对手的答案（看走眼时错位一格） */
  aiAnswer: number
  /** 玩家选择 */
  picked: number | null
  /** 已亮答案 */
  revealed: boolean
}

export default function JianluDuel({ record, onRecordChange, onExit }: JianluDuelProps) {
  const reduce = useReducedMotion()
  const [duel, setDuel] = useState<DuelState | null>(null)
  const [result, setResult] = useState<'win' | 'draw' | 'lose' | null>(null)
  const [thinking, setThinking] = useState(false)

  const randomDuel = (): DuelState => {
    const g = ARENA_GATES[Math.floor(Math.random() * ARENA_GATES.length)]
    const q = g.questions[Math.floor(Math.random() * g.questions.length)]
    const aiMiss = Math.random() < 0.25
    return {
      q,
      gateName: g.name,
      peak: g.peak,
      glyph: g.glyph,
      aiMiss,
      aiAnswer: aiMiss ? (q.answer + 1) % 4 : q.answer,
      picked: null,
      revealed: false,
    }
  }

  const start = () => {
    setDuel(randomDuel())
    setResult(null)
    setThinking(true)
    setTimeout(() => setThinking(false), 1400)
  }

  const pick = (i: number) => {
    if (!duel || duel.picked !== null) return
    const d = { ...duel, picked: i }
    setDuel(d)
    // 判定
    const aiAnswer = d.aiAnswer
    const playerRight = i === d.q.answer
    const aiRight = aiAnswer === d.q.answer
    let res: 'win' | 'draw' | 'lose'
    if (playerRight && !aiRight) res = 'win'
    else if (playerRight && aiRight) res = 'draw'
    else res = 'lose'

    setResult(res)
    setTimeout(() => setDuel((prev) => (prev ? { ...prev, revealed: true } : prev)), 700)

    const r = addWin(record, 'duel')
    const updated = res === 'win' || res === 'draw' ? r : { ...record, total: record.total + 1 }
    saveRecord(updated)
    onRecordChange(updated)
  }

  const again = () => start()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="text-[12px] tracking-[0.14em] text-inkmuted hover:text-golddim">
          ← 回剑庐
        </button>
        <p className="font-serif text-[16px] tracking-[0.14em] text-golddim">同盘对断 · 高手过招</p>
        <p className="text-[12px] tracking-[0.1em] text-inkmuted">胜场 {record.wins}</p>
      </div>

      {!duel ? (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-2xl border border-golddim/28 bg-silk2/60 p-9 text-center"
        >
          <p className="text-[40px]">⚔️</p>
          <p className="mt-4 font-serif text-[20px] font-bold tracking-[0.16em] text-silktext">
            一纸命盘，两柄断剑
          </p>
          <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-[2.1] text-inkmuted">
            系统出一盘，随机一位门派高手与你同台对断。你断、他断，同台亮剑——金标裁判当场定胜负。
            <br />
            高手亦有看走眼时，胜负在分寸之间。
          </p>
          <button
            onClick={start}
            className="mt-7 rounded-full border border-gold/60 bg-gold/15 px-10 py-3 font-serif text-[15px] tracking-[0.18em] text-goldbright transition hover:bg-gold/25"
          >
            亮 剑
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          {/* 对手席 */}
          <div className="rounded-2xl border border-golddim/25 bg-silk2/50 p-6">
            <div className="flex items-center gap-3">
              <span className="text-[26px]">{duel.glyph}</span>
              <div>
                <p className="font-serif text-[16px] tracking-[0.1em] text-silktext">
                  {duel.gateName} · {duel.peak}
                </p>
                <p className="text-[10.5px] tracking-[0.18em] text-golddim">本局对手</p>
              </div>
              <span className="ml-auto flex items-center gap-2 text-[11px] text-inkmuted">
                {thinking ? (
                  <>
                    <span className="inline-block h-2 w-2 animate-ping rounded-full bg-gold" />
                    正捻指细断…
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-gold" />
                    已落笔，等你
                  </>
                )}
              </span>
            </div>
            <p className="mt-4 font-serif text-[18px] leading-[1.9] text-silktext">{duel.q.q}</p>
          </div>

          {/* 你的剑 */}
          <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/[0.05] p-6">
            <p className="text-[11px] tracking-[0.24em] text-golddim">你的断剑</p>
            <div className="mt-4 space-y-2.5">
              {duel.q.options.map((op, i) => {
                const isRight = duel.picked !== null && i === duel.q.answer
                const isWrongPick = duel.picked === i && i !== duel.q.answer
                const isAiPick = duel.revealed && i === duel.aiAnswer
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={duel.picked !== null}
                    className={`block w-full rounded-xl border px-4 py-3 text-left text-[13.5px] transition-all duration-300 ${
                      duel.picked === null
                        ? 'border-golddim/25 bg-silk2/40 text-silktext hover:border-gold/60 hover:bg-gold/[0.07]'
                        : isRight
                          ? 'border-gold bg-gold/15 text-goldbright'
                          : isWrongPick
                            ? 'border-[#c96a5a]/50 bg-[#7a2e2e]/15 text-[#e0a8a0]'
                            : 'border-golddim/15 bg-silk2/20 text-inkmuted'
                    }`}
                  >
                    <span className="mr-2 font-serif text-[13px] text-golddim">{['甲', '乙', '丙', '丁'][i]}</span>
                    {op}
                    {isAiPick && duel.revealed && (
                      <span className="ml-2 rounded-full border border-golddim/40 px-2 py-0.5 text-[9.5px] tracking-[0.1em] text-golddim">
                        对方断此
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 裁判亮剑 */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-5 rounded-2xl border p-6 text-center ${
                result === 'win'
                  ? 'border-gold/55 bg-gold/[0.1]'
                  : result === 'draw'
                    ? 'border-golddim/35 bg-silk2/50'
                    : 'border-[#c96a5a]/40 bg-[#7a2e2e]/10'
              }`}
            >
              <p className="font-serif text-[22px] font-bold tracking-[0.2em] text-goldbright">
                {result === 'win' ? '胜 · 对方看走了眼' : result === 'draw' ? '平 · 双剑同指' : '负 · 差一层火候'}
              </p>
              <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-[2] text-silkmuted">
                {result === 'win' && duel.aiMiss
                  ? '你断准了，对方却看走了眼——高手也有失手时。胜场 +1。'
                  : result === 'draw'
                    ? '你与对方断得一致——旗鼓相当，此局作平，胜场 +1。'
                    : duel.q.explain}
              </p>
              <div className="mt-5 flex items-center justify-center gap-4">
                <button
                  onClick={again}
                  className="rounded-full border border-gold/60 bg-gold/15 px-7 py-2.5 font-serif text-[14px] tracking-[0.16em] text-goldbright transition hover:bg-gold/25"
                >
                  再断一盘
                </button>
                <button onClick={onExit} className="text-[12.5px] tracking-[0.12em] text-inkmuted hover:text-golddim">
                  回剑庐
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
