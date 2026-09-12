/**
 * 华山问剑 · 剑庐
 * 世界观：华山之巅，七大门派各踞一峰守关。问剑者自三流始，连胜登阶，可会尽天下高手。
 * 三模式：打擂闯关（主线）· 同盘对断（竞技）· 论道斗法（沉浸）
 */
import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import { usePageMeta } from '@/lib/page-meta'
import { loadRecord, rankOf, nextRank, RANKS, type JianluMode } from '@/lib/jianlu'

const GATES = [
  { name: '子平格局派', peak: '藏剑峰', glyph: '📜', desc: '格局立论，纲举目张' },
  { name: '三命通会派', peak: '通会峰', glyph: '📚', desc: '博览群书，融会贯通' },
  { name: '神峰通考派', peak: '神峰', glyph: '🧭', desc: '考据精严，实务见长' },
  { name: '渊海子平派', peak: '渊海峰', glyph: '🌊', desc: '古法真传，渊深如海' },
  { name: '盲派', peak: '听风峰', glyph: '🕯️', desc: '耳闻断事，快剑无影' },
  { name: '千里命稿派', peak: '千里峰', glyph: '🧧', desc: '老练江湖，火候十足' },
  { name: '金口诀', peak: '口诀峰', glyph: '🔮', desc: '立课如风，当下见机' },
]

const MODES: Array<{ key: JianluMode; title: string; sub: string; desc: string; badge: string }> = [
  { key: 'arena', title: '打擂闯关', sub: '主线 · 金标裁判', desc: '七大门派各守一关，每关三题断命要点——连过七关，登顶华山。', badge: '闯' },
  { key: 'duel', title: '同盘对断', sub: '竞技 · 高手过招', desc: '系统出一盘，你与门派高手同台对断，金标定胜负——胜负留榜。', badge: '断' },
  { key: 'debate', title: '论道斗法', sub: '沉浸 · 三回合攻防', desc: '与门派高手当面论命，三回合问答——被问倒即败，问倒对方即胜。', badge: '论' },
]

export default function JianluPage() {
  usePageMeta(
    '华山问剑 · 紫府',
    '命理界的华山论剑——打擂闯关、同盘对断、论道斗法，会尽天下门派高手。'
  )
  const reduce = useReducedMotion()
  const record = useMemo(() => loadRecord(), [])
  const r = record
  const rank = rankOf(r)
  const next = nextRank(r)
  const winRate = r.total > 0 ? Math.round((r.wins / r.total) * 100) : 0

  const play = (mode: JianluMode) => {
    // P0 骨架：三模式入口就位，闯关 P1 接上——先提示
    if (mode === 'arena') {
      alert('打擂闯关即将开擂——今晚就位。先观剑庐，段位榜已开。')
    } else {
      alert('此模式正在锻造中——先以闯关为主线。')
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
        {/* 剑庐门额 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="text-center"
        >
          <p className="font-latin text-[11px] uppercase tracking-[0.42em] text-gold">Mount Hua · Ask the Sword</p>
          <h1 className="mt-4 font-serif text-[38px] font-bold tracking-[0.22em] text-goldbright sm:text-[46px]">
            华山问剑
          </h1>
          <p className="mt-5 text-[13px] leading-[2.1] tracking-[0.08em] text-silkmuted">
            华山之巅，剑气纵横。七大门派各踞一峰，守关待战。
            <br />
            天下问剑者，自三流始——连胜登阶，可会尽天下高手。
          </p>
        </motion.div>

        {/* 段位卡 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mx-auto mt-10 max-w-md rounded-2xl border border-gold/35 bg-gold/[0.06] px-7 py-6 text-center"
        >
          <p className="text-[11px] tracking-[0.3em] text-golddim">当前段位</p>
          <p className="mt-2 font-serif text-[26px] font-bold tracking-[0.18em] text-goldbright">{rank.name}</p>
          <p className="mt-1 text-[11.5px] tracking-[0.14em] text-silkmuted">{rank.desc}</p>
          <div className="mt-4 flex items-center justify-center gap-6 text-[12px] text-silkmuted">
            <span>胜场 <b className="text-golddim">{r.wins}</b></span>
            <span>胜率 <b className="text-golddim">{winRate}%</b></span>
            <span>连胜 <b className="text-golddim">{r.streak}</b></span>
          </div>
          {next && (
            <p className="mt-4 text-[11px] tracking-[0.1em] text-inkmuted">
              再胜 {next.minWins - r.wins} 场 → 晋升「{next.name}」
            </p>
          )}
        </motion.div>

        {/* 段位阶梯 */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.45 }}
          className="mt-8 flex items-center justify-center gap-2 overflow-x-auto px-2 pb-1"
        >
          {RANKS.map((lv) => (
            <span
              key={lv.index}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] tracking-[0.08em] ${
                lv.index <= rank.index
                  ? 'border-gold/60 bg-gold/10 text-golddim'
                  : 'border-golddim/25 text-inkfaint'
              }`}
            >
              {lv.name}
            </span>
          ))}
        </motion.div>

        {/* 三模式 */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {MODES.map((m, i) => (
            <motion.button
              key={m.key}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 + i * 0.15 }}
              onClick={() => play(m.key)}
              className="group relative overflow-hidden rounded-2xl border border-golddim/28 bg-silk2/55 px-6 py-7 text-left transition-all duration-300 hover:border-gold/55 hover:bg-silk2/85 hover:shadow-[0_0_34px_rgba(201,164,92,0.14)]"
            >
              <span className="pointer-events-none absolute -right-3 -top-4 font-serif text-[76px] leading-none text-gold/[0.06]">
                {m.badge}
              </span>
              <p className="font-serif text-[20px] font-bold tracking-[0.14em] text-inktext">{m.title}</p>
              <p className="mt-1 text-[10.5px] tracking-[0.2em] text-golddim">{m.sub}</p>
              <p className="mt-3 text-[12px] leading-[1.95] tracking-[0.04em] text-inkmuted">{m.desc}</p>
              <p className="mt-4 font-sans text-[11px] tracking-[0.2em] text-golddim/90 transition-colors group-hover:text-goldbright">
                请 战
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
          <p className="text-center text-[11px] tracking-[0.3em] text-golddim">七峰守关</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
            {GATES.map((g, i) => (
              <div
                key={g.name}
                className={`rounded-xl border px-3 py-4 text-center transition-all ${
                  i < r.gatesCleared
                    ? 'border-gold/50 bg-gold/[0.08]'
                    : i === r.gatesCleared
                      ? 'border-gold/40 bg-gold/[0.04]'
                      : 'border-golddim/20 bg-silk2/40'
                }`}
              >
                <p className="text-[19px]">{g.glyph}</p>
                <p className="mt-1.5 text-[11px] leading-tight tracking-[0.04em] text-silktext">{g.name}</p>
                <p className="mt-0.5 text-[9px] tracking-[0.12em] text-inkfaint">
                  {i < r.gatesCleared ? '已破' : i === r.gatesCleared ? '下一战' : '未至'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="mt-12 text-center text-[10.5px] tracking-[0.2em] text-inkfaint">
          问剑乃文化研习之戏——断命之准，不系于胜负；照人之心，方为剑道。
        </p>
      </div>

      <style>{`
        @keyframes zifu-breathe {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
