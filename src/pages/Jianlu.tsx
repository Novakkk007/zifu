/**
 * 华山问剑 · 剑庐
 * 世界观：华山之巅，七大门派各踞一峰守关。问剑者自三流始，连胜登阶，可会尽天下高手。
 * 三模式：打擂闯关（主线）· 同盘对断（竞技）· 论道斗法（沉浸）
 */
import { useMemo, useRef, useState } from 'react'
import { BookOpen, Compass, Eye, Fan, ScrollText, Sparkles, Swords, Waves } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import JianluArena from '@/components/JianluArena'
import JianluBoard from '@/components/JianluBoard'
import JianluDuel from '@/components/JianluDuel'
import RankUpOverlay from '@/components/RankUpOverlay'
import { JianluReportButton } from '@/components/JianluReport'
import { usePageMeta } from '@/lib/page-meta'
import { loadRecord, rankOf, nextRank, RANKS, type JianluMode, type RankLevel } from '@/lib/jianlu'
import { ACHIEVEMENTS, answerDaily, dailyQuestion, insightTitle, loadInsight, todayKey, unlockedCount } from '@/lib/jianlu-meta'
import { ARENA_GATES } from '@contracts/engines/jianlu/arena-questions'
import { JIANLU_OPENING } from '@/data/jianlu-dialogue'

const GATES = [
  { name: '子平格局派', peak: '藏剑峰', Glyph: ScrollText, desc: '格局立论，纲举目张' },
  { name: '三命通会派', peak: '通会峰', Glyph: BookOpen, desc: '博览群书，融会贯通' },
  { name: '神峰通考派', peak: '神峰', Glyph: Compass, desc: '考据精严，实务见长' },
  { name: '渊海子平派', peak: '渊海峰', Glyph: Waves, desc: '古法真传，渊深如海' },
  { name: '盲派', peak: '听风峰', Glyph: Eye, desc: '耳闻断事，快剑无影' },
  { name: '千里命稿派', peak: '千里峰', Glyph: Fan, desc: '老练江湖，火候十足' },
  { name: '金口诀', peak: '口诀峰', Glyph: Sparkles, desc: '立课如风，当下见机' },
]

const MODES: Array<{ key: JianluMode; title: string; sub: string; desc: string; badge: string; ready: boolean; Glyph: typeof Swords }> = [
  { key: 'arena', title: '打擂闯关', sub: '主线 · 照章判分', desc: '七大门派各守一关，每关三题断命要点——连过七关，登顶华山。', badge: '闯', Glyph: Swords, ready: true },
  { key: 'duel', title: '同盘对断', sub: '竞技 · 高手过招', desc: '系统出一盘，你与门派高手同台对断，照章判分——战绩留档。', badge: '断', Glyph: Eye, ready: true },
  { key: 'debate', title: '论道斗法', sub: '沉浸 · 三回合攻防', desc: '与门派高手当面论命，三回合问答——被问倒即败，问倒对方即胜。', badge: '论', Glyph: Sparkles, ready: false },
]

export default function JianluPage() {
  usePageMeta(
    '华山问剑 · 紫府',
    '命理界的华山论剑——打擂闯关、同盘对断、论道斗法，会尽天下门派高手。'
  )
  const reduce = useReducedMotion()
  const record = useMemo(() => loadRecord(), [])
  const [r, setR] = useState(record)
  const [arena, setArena] = useState(false)
  const [duel, setDuel] = useState(false)
  const prevRankIdx = useRef(rankOf(record).index)
  const [rankUp, setRankUp] = useState<RankLevel | null>(null)
  const [dailyOpen, setDailyOpen] = useState(false)
  const [dailyPicked, setDailyPicked] = useState<number | null>(null)
  const [dailySolved, setDailySolved] = useState(loadInsight().lastDate === todayKey())
  const rank = rankOf(r)
  const next = nextRank(r)
  const winRate = r.total > 0 ? Math.round((r.wins / r.total) * 100) : 0

  const handleRecordChange = (next: ReturnType<typeof loadRecord>) => {
    const newIdx = rankOf(next).index
    if (newIdx > prevRankIdx.current) {
      setRankUp(rankOf(next))
    }
    prevRankIdx.current = newIdx
    setR(next)
  }

  const play = (mode: JianluMode, ready: boolean) => {
    if (!ready) return
    if (mode === 'arena') {
      setArena(true)
      setDuel(false)
    }
    if (mode === 'duel') {
      setDuel(true)
      setArena(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-deep2">
      <FloatingGlyphs />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(620px 380px at 20% 6%, rgba(201,164,92,0.1), transparent 65%)," +
            "radial-gradient(560px 360px at 84% 92%, rgba(122,88,180,0.12), transparent 65%)",
          animation: 'zifu-breathe 9s ease-in-out infinite',
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-14">
        {arena ? (
          <JianluArena record={r} onRecordChange={handleRecordChange} onExit={() => setArena(false)} />
        ) : duel ? (
          <JianluDuel record={r} onRecordChange={handleRecordChange} onExit={() => setDuel(false)} />
        ) : (
          <>
        {/* 剑庐门额 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="text-center"
        >
          <p className="font-latin text-[12px] uppercase tracking-[0.42em] text-gold">Mount Hua · Ask the Sword</p>
          <h1 className="mt-4 font-serif text-[38px] font-bold tracking-[0.22em] text-goldbright sm:text-[46px]">
            华山问剑
          </h1>
          <p className="mt-5 text-[13px] leading-[2.1] tracking-[0.08em] text-silkmuted">
            华山之巅，剑气纵横。七大门派各踞一峰，守关待战。
            <br />
            天下问剑者，自三流始——连胜登阶，可会尽天下高手。
          </p>
          <div className="mx-auto mt-6 max-w-xl rounded-xl border border-golddim/25 bg-silk2/40 px-6 py-4">
            <p className="font-serif text-[13.5px] leading-[2.1] tracking-[0.06em] text-silktext">
              {JIANLU_OPENING}
            </p>
          </div>
        </motion.div>

        {/* 段位卡 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mx-auto mt-10 max-w-md rounded-2xl border border-gold/35 bg-gold/[0.06] px-7 py-6 text-center"
        >
          <p className="text-[12px] tracking-[0.3em] text-golddim">当前段位</p>
          <p className="mt-2 font-serif text-[26px] font-bold tracking-[0.18em] text-goldbright">{rank.name}</p>
          <p className="mt-1 text-[12px] tracking-[0.14em] text-silkmuted">{rank.desc}</p>
          <div className="mt-4 flex items-center justify-center gap-6 text-[12px] text-silkmuted">
            <span>胜场 <b className="text-golddim">{r.wins}</b></span>
            <span>胜率 <b className="text-golddim">{winRate}%</b></span>
            <span>连胜 <b className="text-golddim">{r.streak}</b></span>
          </div>
          <JianluReportButton
            record={r}
            disabled={r.wins === 0}
            className={`mt-5 rounded-full border px-6 py-2 font-serif text-[13px] tracking-[0.18em] transition ${
              r.wins === 0
                ? 'cursor-default border-golddim/20 bg-silk2/20 text-silkmuted'
                : 'border-gold/45 bg-gold/10 text-goldbright hover:bg-gold/20'
            }`}
          >
            战报
          </JianluReportButton>
          {next && (
            <p className="mt-4 text-[12px] tracking-[0.1em] text-inkmuted">
              {next.needGates !== undefined && r.gatesCleared < next.needGates
                ? `再破七峰（${r.gatesCleared}/7）且累计胜 ${next.minWins} 场 → 晋升「${next.name}」`
                : `再胜 ${Math.max(0, next.minWins - r.wins)} 场 → 晋升「${next.name}」`}
            </p>
          )}
        </motion.div>

        {/* 段位阶梯 */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.45 }}
          className="mt-8 flex items-center justify-center gap-2 overflow-x-auto px-2 pb-1"
        >
          {RANKS.map((lv) => (
            <span
              key={lv.index}
              className={`shrink-0 rounded-full border px-3 py-1 text-[12px] tracking-[0.08em] ${
                lv.index <= rank.index
                  ? 'border-gold/60 bg-gold/10 text-golddim'
                  : 'border-golddim/25 text-inkfaint'
              }`}
            >
              {lv.name}
            </span>
          ))}
        </motion.div>

        {/* 剑冢 · 成就 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-10"
        >
          <div className="flex items-baseline justify-between">
            <p className="text-[12px] tracking-[0.3em] text-golddim">剑冢 · 成就</p>
            <p className="text-[12px] tracking-[0.1em] text-silkmuted">
              已刻 {unlockedCount(r)} / {ACHIEVEMENTS.length}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-6">
            {ACHIEVEMENTS.map((a) => {
              const ok = a.unlocked(r)
              return (
                <div
                  key={a.id}
                  title={`${a.name}——${a.desc}`}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl border transition-all ${
                    ok
                      ? 'border-gold/55 bg-gold/[0.09]'
                      : 'border-golddim/20 bg-deep3/70'
                  }`}
                >
                  <span
                    className={`font-serif text-[20px] font-bold ${
                      ok ? 'text-goldbright' : 'text-silkmuted/50'
                    }`}
                  >
                    {a.glyph}
                  </span>
                  <span className={`mt-1 text-[12px] tracking-[0.06em] ${ok ? 'text-silktext' : 'text-silkmuted/60'}`}>
                    {a.name}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* 华山榜（三层榜 · 假名制 · 默认不上榜 · 诚实声明） */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-10"
        >
          <JianluBoard record={r} />
        </motion.div>

        {/* 今日研剑（悟性轴——每日一题） */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-8 rounded-2xl border border-golddim/25 bg-silk2/50 p-6"
        >
          <div className="flex items-baseline justify-between">
            <p className="font-serif text-[16px] font-bold tracking-[0.14em] text-silktext">今日研剑</p>
            <p className="text-[12px] tracking-[0.1em] text-silkmuted">
              悟性 {(() => loadInsight().insight)()} · {insightTitle(loadInsight().insight)}
            </p>
          </div>
          <p className="mt-2 text-[12.5px] leading-[1.9] tracking-[0.04em] text-silkmuted">
            每日一题，与天下同参同断——答对悟性 +10，连签不断，剑心自明。
          </p>
          {!dailyOpen ? (
            <button
              type="button"
              onClick={() => {
                setDailyOpen(true)
                setDailyPicked(null)
              }}
              disabled={dailySolved}
              className={`mt-4 rounded-full border px-6 py-2 font-serif text-[13.5px] tracking-[0.14em] transition ${
                dailySolved
                  ? 'cursor-default border-golddim/20 bg-silk2/30 text-silkmuted'
                  : 'border-gold/50 bg-gold/10 text-goldbright hover:bg-gold/20'
              }`}
            >
              {dailySolved ? '今日已断 · 明日再来' : '拔剑 · 答今日一题'}
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-golddim/25 bg-deep3/70 p-5">
              {(() => {
                const dq = dailyQuestion()
                if (!dq) return null
                const gate = ARENA_GATES.find((g) => g.questions[dq.qIndex])
                const q = gate?.questions[dq.qIndex]
                if (!q) return null
                return (
                  <>
                    <p className="text-[12px] tracking-[0.2em] text-golddim">{dq.gateName} · 今日之题</p>
                    <p className="mt-2 font-serif text-[15px] leading-[1.9] text-silktext">{q.q}</p>
                    <div className="mt-4 space-y-2">
                      {q.options.map((op, i) => {
                        const isRight = dailyPicked !== null && i === q.answer
                        const isWrong = dailyPicked === i && i !== q.answer
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={dailyPicked !== null}
                            onClick={() => {
                              setDailyPicked(i)
                              const ok = i === q.answer
                              answerDaily(ok)
                              if (ok) setDailySolved(true)
                              setR({ ...r })
                            }}
                            className={`block w-full rounded-lg border px-4 py-2.5 text-left text-[13px] transition-colors ${
                              dailyPicked === null
                                ? 'border-golddim/25 bg-silk2/30 text-silktext hover:border-gold/50'
                                : isRight
                                  ? 'border-gold bg-gold/15 text-goldbright'
                                  : isWrong
                                    ? 'border-[#c96a5a]/50 bg-[#7a2e2e]/15 text-[#e0a8a0]'
                                    : 'border-golddim/15 text-silkmuted'
                            }`}
                          >
                            {['甲', '乙', '丙', '丁'][i]} · {op}
                          </button>
                        )
                      })}
                    </div>
                    {dailyPicked !== null && (
                      <p className="mt-3 text-[12.5px] leading-[1.9] text-silkmuted">
                        {dailyPicked === q.answer ? '✓ 断得准，悟性 +10。' : `差一层——正确为「${['甲', '乙', '丙', '丁'][q.answer]}」。`}
                        {q.explain}
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </motion.div>

        {/* 三模式 */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {MODES.map((m, i) => (
            <motion.button
              key={m.key}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 + i * 0.15 }}
              onClick={() => play(m.key, m.ready)}
              disabled={!m.ready}
              className={`group relative overflow-hidden rounded-2xl border px-6 py-7 text-left transition-all duration-300 ${
                m.ready
                  ? 'border-golddim/28 bg-silk2/55 hover:border-gold/55 hover:bg-silk2/85 hover:shadow-[0_0_34px_rgba(201,164,92,0.14)]'
                  : 'cursor-default border-golddim/15 bg-silk2/30'
              }`}
            >
              <span className="pointer-events-none absolute -right-4 -top-4 text-gold/[0.07]">
                <m.Glyph className="h-20 w-20" strokeWidth={0.8} />
              </span>
              <p className="font-serif text-[20px] font-bold tracking-[0.14em] text-inktext">{m.title}</p>
              <p className="mt-1 text-[12px] tracking-[0.2em] text-golddim">{m.sub}</p>
              <p className="mt-3 text-[12px] leading-[1.95] tracking-[0.04em] text-inkmuted">{m.desc}</p>
              <p className={`mt-4 font-sans text-[12px] tracking-[0.2em] transition-colors ${m.ready ? 'text-golddim/90 group-hover:text-goldbright' : 'text-inkfaint'}`}>
                {m.ready ? '请 战' : '锻造中 · 不日开锋'}
              </p>
            </motion.button>
          ))}
        </div>

        {/* 七峰图 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.05 }}
          className="mt-14"
        >
          <p className="text-center text-[12px] tracking-[0.3em] text-golddim">七峰守关</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
            {GATES.map((g, i) => {
              const state = i < r.gatesCleared ? 'cleared' : i === r.gatesCleared ? 'next' : 'locked'
              return (
                <div
                  key={g.name}
                  className={`relative overflow-hidden rounded-xl border px-3 py-5 text-center transition-all duration-300 ${
                    state === 'cleared'
                      ? 'border-gold/55 bg-gradient-to-b from-gold/[0.12] to-gold/[0.04]'
                      : state === 'next'
                        ? 'border-gold/70 bg-gradient-to-b from-gold/[0.16] to-gold/[0.06] shadow-[0_0_26px_rgba(201,164,92,0.18)]'
                        : 'border-golddim/30 bg-deep3/80'
                  }`}
                >
                  <g.Glyph
                    className={`mx-auto h-5 w-5 ${
                      state === 'locked' ? 'text-silkmuted' : 'text-goldbright'
                    }`}
                    strokeWidth={1.5}
                  />
                  <p className={`mt-2 text-[12px] leading-tight tracking-[0.04em] ${
                    state === 'locked' ? 'text-silktext' : 'text-silktext'
                  }`}>{g.name}</p>
                  <p className={`mt-1.5 text-[12px] tracking-[0.14em] ${
                    state === 'cleared'
                      ? 'text-golddim'
                      : state === 'next'
                        ? 'font-serif font-bold text-goldbright'
                        : 'text-silkmuted'
                  }`}>
                    {state === 'cleared' ? '已破' : state === 'next' ? '下一战' : '未至'}
                  </p>
                  {state === 'next' && (
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        <p className="mt-12 text-center text-[12px] tracking-[0.2em] text-inkfaint">
          问剑乃文化研习之戏——断命之准，不系于胜负；照人之心，方为剑道。
        </p>
          </>
        )}
      </div>

      {rankUp && <RankUpOverlay rank={rankUp} onDone={() => setRankUp(null)} />}

      <style>{`
        @keyframes zifu-breathe {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
