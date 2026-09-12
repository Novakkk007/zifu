/**
 * 打擂闯关视图（华山问剑 · 主线模式）
 * 流程：选关 → 三题连答 → 金标判分 → 过关（≥2/3）记胜场 → 下一关
 */
import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ARENA_GATES } from '@contracts/engines/jianlu/arena-questions'
import { addWin, loadRecord, saveRecord } from '@/lib/jianlu'

interface ArenaViewProps {
  record: ReturnType<typeof loadRecord>
  onRecordChange: (r: ReturnType<typeof loadRecord>) => void
  onExit: () => void
}

export default function JianluArena({ record, onRecordChange, onExit }: ArenaViewProps) {
  const reduce = useReducedMotion()
  const [gateIdx, setGateIdx] = useState(Math.min(record.gatesCleared, ARENA_GATES.length - 1))
  const [qIdx, setQIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [right, setRight] = useState(0)
  const [finished, setFinished] = useState(false)
  const [passed, setPassed] = useState(false)

  const gate = ARENA_GATES[gateIdx]
  const q = gate.questions[qIdx]

  const pick = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) {
      setRight((v) => v + 1)
    }
  }

  const nextQ = () => {
    if (qIdx + 1 < gate.questions.length) {
      setQIdx(qIdx + 1)
      setPicked(null)
    } else {
      // 本关结束——判分（对 2/3 过关）
      const ok = right >= 2
      setPassed(ok)
      setFinished(true)
      if (ok) {
        const r = addWin(record, 'arena')
        const cleared = Math.max(record.gatesCleared, gateIdx + 1)
        const updated = { ...r, gatesCleared: cleared }
        saveRecord(updated)
        onRecordChange(updated)
      } else {
        saveRecord(record)
      }
    }
  }

  const restartGate = () => {
    setQIdx(0)
    setPicked(null)
    setRight(0)
    setFinished(false)
    setPassed(false)
  }

  const nextGate = () => {
    if (gateIdx + 1 < ARENA_GATES.length) {
      setGateIdx(gateIdx + 1)
      restartGate()
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 关卡头 */}
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="text-[12px] tracking-[0.14em] text-inkmuted hover:text-golddim">
          ← 回剑庐
        </button>
        <p className="font-serif text-[16px] tracking-[0.14em] text-golddim">
          第 {gateIdx + 1} 关 · {gate.name}
        </p>
        <p className="text-[12px] tracking-[0.1em] text-inkmuted">
          {gateIdx + 1}/7
        </p>
      </div>

      {/* 进度条 */}
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-golddim/15">
        <div
          className="h-full bg-gold transition-all duration-500"
          style={{ width: `${((qIdx + (picked !== null ? 1 : 0)) / gate.questions.length) * 100}%` }}
        />
      </div>

      {!finished ? (
        <motion.div
          key={qIdx}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 rounded-2xl border border-golddim/28 bg-silk2/60 p-7"
        >
          <p className="text-[11px] tracking-[0.24em] text-golddim">
            第 {qIdx + 1} 题 · 断命要点
          </p>
          <p className="mt-4 font-serif text-[18px] leading-[1.9] text-silktext">{q.q}</p>

          <div className="mt-6 space-y-3">
            {q.options.map((op, i) => {
              const isRight = picked !== null && i === q.answer
              const isWrongPick = picked === i && i !== q.answer
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={picked !== null}
                  className={`block w-full rounded-xl border px-5 py-3.5 text-left text-[14px] leading-[1.8] transition-all duration-300 ${
                    picked === null
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
                </button>
              )
            })}
          </div>

          {picked !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
              <p className={`text-[13px] leading-[1.9] ${picked === q.answer ? 'text-golddim' : 'text-[#e0a8a0]'}`}>
                {picked === q.answer ? '✓ 断得准。' : '✗ 差一层。'}
                {q.explain}
              </p>
              <button
                onClick={nextQ}
                className="mt-5 w-full rounded-xl bg-golddim py-3 font-serif text-[15px] font-bold tracking-[0.2em] text-white transition hover:brightness-110"
              >
                {qIdx + 1 < gate.questions.length ? '下一题' : '看本关战果'}
              </button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-2xl border border-gold/30 bg-gold/[0.05] p-8 text-center"
        >
          <p className="text-[40px]">{passed ? '🗡️' : '🍂'}</p>
          <p className="mt-4 font-serif text-[24px] font-bold tracking-[0.18em] text-goldbright">
            {passed ? `破 ${gate.name}` : '惜败一招'}
          </p>
          <p className="mt-3 text-[13px] leading-[2] text-silkmuted">
            {passed
              ? `三题答对 ${right} 题——${gate.peak}已破，胜场 +1。`
              : `三题答对 ${right} 题——过关需至少两题。再练练，剑无一日成。`}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            {passed && gateIdx + 1 < ARENA_GATES.length ? (
              <button
                onClick={nextGate}
                className="rounded-full border border-gold/60 bg-gold/15 px-7 py-2.5 font-serif text-[14px] tracking-[0.16em] text-goldbright transition hover:bg-gold/25"
              >
                登下一峰 · {ARENA_GATES[gateIdx + 1].name}
              </button>
            ) : passed && gateIdx + 1 >= ARENA_GATES.length ? (
              <p className="font-serif text-[15px] tracking-[0.14em] text-goldbright">
                华山七峰尽破——天下问剑者，你是第一人。
              </p>
            ) : (
              <button
                onClick={restartGate}
                className="rounded-full border border-golddim/40 bg-silk2 px-7 py-2.5 font-serif text-[14px] tracking-[0.16em] text-silktext transition hover:border-gold/60 hover:text-goldbright"
              >
                再战此峰
              </button>
            )}
            <button onClick={onExit} className="text-[12.5px] tracking-[0.12em] text-inkmuted hover:text-golddim">
              回剑庐
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
