/**
 * 华山榜 —— 三层榜（总榜前百 / 周榜前五十 / 门派榜七派各二十）
 * 假名制 · 默认不上榜 · 诚实声明
 * 隐私铁律：榜上只记假名与战绩；生辰命盘不出本机、不进榜单。
 */
import { useEffect, useState } from 'react'
import { Clock, Crown, RefreshCw, Swords } from 'lucide-react'
import type { JianluRecord } from '@/lib/jianlu'
import {
  buildSubmitPayload,
  fetchBoard,
  getBoardName,
  isBoardOptIn,
  setBoardName,
  setBoardOptIn,
  submitScore,
  type BoardData,
  type BoardEntry,
} from '@/lib/jianlu-board'

type TabKey = 'total' | 'week' | 'sects'

const TABS: Array<{ key: TabKey; label: string; sub: string; Glyph: typeof Crown }> = [
  { key: 'total', label: '总榜', sub: '前百', Glyph: Crown },
  { key: 'week', label: '周榜', sub: '前五十', Glyph: Clock },
  { key: 'sects', label: '门派榜', sub: '七派', Glyph: Swords },
]

function BoardRow({ rank, entry, weekView }: { rank: number; entry: BoardEntry; weekView?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-golddim/15 py-2.5 text-[13px] last:border-b-0">
      <span
        className={`w-8 shrink-0 text-center font-latin ${
          rank <= 3 ? 'font-bold text-goldbright' : 'text-silkmuted'
        }`}
      >
        {rank}
      </span>
      <span className="w-28 shrink-0 truncate text-silktext">{entry.name}</span>
      <span className="hidden w-20 shrink-0 text-[12px] tracking-[0.04em] text-golddim sm:block">
        {entry.rankName}
      </span>
      <span className="flex-1 text-right text-[12.5px] text-silkmuted">
        {weekView && typeof entry.weekWins === 'number' ? (
          <>
            本周 <b className="font-latin text-golddim">{entry.weekWins}</b> 胜 · 共{' '}
            <b className="font-latin">{entry.wins}</b> 胜
          </>
        ) : (
          <>
            <b className="font-latin text-golddim">{entry.wins}</b> 胜 ·{' '}
            <b className="font-latin">{entry.gates}</b> 峰
          </>
        )}
      </span>
    </div>
  )
}

export default function JianluBoard({ record }: { record: JianluRecord }) {
  const [name, setName] = useState(() => getBoardName())
  const [optIn, setOptIn] = useState(() => isBoardOptIn())
  const [data, setData] = useState<BoardData | null>(null)
  const [tab, setTab] = useState<TabKey>('total')
  const [sectIdx, setSectIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let alive = true
    // 不在此处清空 data：刷新时保留旧榜面，避免闪烁与级联渲染
    fetchBoard().then((d) => {
      if (alive) setData(d)
    })
    return () => {
      alive = false
    }
  }, [refreshTick])

  const toggleOptIn = () => {
    const next = !optIn
    setOptIn(next)
    setBoardOptIn(next)
    if (!next) setMsg('')
  }

  const onNameChange = (v: string) => {
    setName(setBoardName(v))
  }

  const submit = async () => {
    if (busy || !optIn) return
    setBusy(true)
    setMsg('')
    const res = await submitScore(buildSubmitPayload(record, name))
    setBusy(false)
    setMsg(res.message)
    if (res.ok) setRefreshTick((t) => t + 1)
  }

  const currentSect = data?.sects[sectIdx]
  const list: BoardEntry[] =
    tab === 'total' ? (data?.total ?? []) : tab === 'week' ? (data?.week ?? []) : (currentSect?.items ?? [])
  const listEmpty = list.length === 0

  return (
    <section className="rounded-2xl border border-golddim/25 bg-silk2/50 p-6">
      {/* 榜额 */}
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-[16px] font-bold tracking-[0.14em] text-silktext">
          华山榜 <span className="ml-1 text-[11px] font-normal tracking-[0.1em] text-golddim">三榜周流 · 假名会天下</span>
        </p>
        <button
          type="button"
          aria-label="刷新榜单"
          onClick={() => setRefreshTick((t) => t + 1)}
          className="flex items-center gap-1 rounded-full border border-golddim/25 px-3 py-1 text-[11.5px] tracking-[0.08em] text-silkmuted transition-colors hover:border-gold/50 hover:text-golddim"
        >
          <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
          刷新
        </button>
      </div>

      {/* 诚实声明（零隐私 · 不恐吓） */}
      <p className="mt-2 text-[12.5px] leading-[1.9] tracking-[0.04em] text-silkmuted">
        判分在本机，上榜凭自愿——战绩由问剑者自报，本榜不核验每场判分，名次仅作研习之乐，不证功力深浅。
        榜上只记假名与战绩：不採生辰，不录命盘，不取任何身份信息。
      </p>

      {/* 假名 + 不上榜开关 + 提交 */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            value={name}
            maxLength={16}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="自取假名（16 字内）"
            className="w-full max-w-[200px] rounded-lg border border-golddim/30 bg-deep3/60 px-3 py-2 text-[13px] text-silktext placeholder:text-silkmuted/60 focus:border-gold/60 focus:outline-none"
          />
          <p className="text-[11.5px] leading-[1.7] text-silkmuted/80">
            假名自取，与身份无关
            <br className="hidden sm:block" />
            生辰命盘概不涉及
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={optIn}
          onClick={toggleOptIn}
          className="flex items-center gap-2"
        >
          <span
            className={`relative h-5 w-9 rounded-full border transition-colors ${
              optIn ? 'border-gold/70 bg-gold/50' : 'border-golddim/30 bg-deep3/80'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-silktext transition-all ${
                optIn ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </span>
          <span className="text-[12.5px] tracking-[0.04em] text-silkmuted">
            {optIn ? '已选择上榜 · 以假名示人' : '默不上榜 · 战绩只留本机'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || !optIn || record.wins === 0}
          className={`rounded-full border px-5 py-2 font-serif text-[13px] tracking-[0.14em] transition ${
            busy || !optIn || record.wins === 0
              ? 'cursor-default border-golddim/20 bg-silk2/30 text-silkmuted'
              : 'border-gold/50 bg-gold/10 text-goldbright hover:bg-gold/20'
          }`}
        >
          {busy ? '提交中…' : !optIn ? '开启上榜方可提交' : record.wins === 0 ? '先胜一场，再来留名' : '提交战绩 · 上华山榜'}
        </button>
      </div>

      {msg && <p className="mt-2 text-[12.5px] tracking-[0.04em] text-golddim">{msg}</p>}

      {/* 三层 tab */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] tracking-[0.08em] transition-colors ${
              tab === t.key
                ? 'border-gold/60 bg-gold/10 text-goldbright'
                : 'border-golddim/25 text-silkmuted hover:border-gold/45'
            }`}
          >
            <t.Glyph className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t.label} · {t.sub}
          </button>
        ))}
      </div>

      {/* 门派榜：七派选择 */}
      {tab === 'sects' && data !== null && data.available && data.sects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.sects.map((s, i) => (
            <button
              key={s.sect}
              type="button"
              onClick={() => setSectIdx(i)}
              className={`rounded-full border px-2.5 py-1 text-[11.5px] tracking-[0.06em] transition-colors ${
                sectIdx === i
                  ? 'border-gold/55 bg-gold/10 text-golddim'
                  : 'border-golddim/20 text-silkmuted hover:border-gold/40'
              }`}
            >
              {s.sect}
            </button>
          ))}
        </div>
      )}

      {/* 榜面 */}
      <div className="mt-4 rounded-xl border border-golddim/20 bg-deep3/60 px-4 py-3">
        {data === null ? (
          <p className="py-6 text-center text-[12.5px] tracking-[0.06em] text-silkmuted">榜上讯息取阅中…</p>
        ) : !data.available ? (
          <p className="py-6 text-center text-[12.5px] leading-[2] tracking-[0.04em] text-silkmuted">
            {data.note ?? ''}
          </p>
        ) : listEmpty ? (
          <p className="py-6 text-center text-[12.5px] leading-[2] tracking-[0.04em] text-silkmuted">
            {tab === 'total'
              ? '总榜尚虚位以待——天下第一人，还看今朝。'
              : tab === 'week'
                ? '本周尚无问剑者留名——榜首虚位以待。'
                : '此派榜上尚无剑客——待有人破峰留名。'}
          </p>
        ) : (
          <>
            {tab === 'week' && data.weekKey && (
              <p className="pt-1 text-center text-[11.5px] tracking-[0.12em] text-silkmuted/80">
                本周胜场 · 每周一零时重开
              </p>
            )}
            {tab === 'sects' && currentSect && (
              <p className="pt-1 text-center text-[11.5px] tracking-[0.12em] text-silkmuted/80">
                {currentSect.sect} · 正问剑{currentSect.gate}者
              </p>
            )}
            <div className="mt-1">
              {list.map((e, i) => (
                <BoardRow key={`${tab}-${i}`} rank={i + 1} entry={e} weekView={tab === 'week'} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
