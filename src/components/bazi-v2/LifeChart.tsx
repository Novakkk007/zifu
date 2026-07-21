/**
 * 人生轨迹图（SVG 签名组件）。
 * 横轴年龄 0–100（可切换公历年份）；大运区间色带；流年节点；当前大运/流年高亮；
 * 结构分折线（core computeLifeScores 输出）；hover/点击节点 → 三因子注解卡；
 * 显著位置渲染 core 免责声明常量。
 */
import { useMemo, useState } from 'react'
import type { BaziChartV2, DayunScore, LiunianScore, ScoreFactor } from '@contracts/bazi-core'
import { computeLifeScores, FACTOR_WEIGHTS, SCORES_DISCLAIMER } from '@contracts/bazi-core'
import { cn } from '@/lib/utils'

const W = 1100
const H = 340
const PAD = { top: 46, right: 24, bottom: 44, left: 46 }
const X0 = PAD.left
const X1 = W - PAD.right
const Y0 = PAD.top
const Y1 = H - PAD.bottom

const xOf = (age: number) => X0 + (Math.min(100, Math.max(0, age)) / 100) * (X1 - X0)
const yOf = (score: number) => Y1 - (Math.min(100, Math.max(0, score)) / 100) * (Y1 - Y0)

type Selection =
  | { kind: 'liunian'; item: LiunianScore }
  | { kind: 'dayun'; item: DayunScore }

function FactorRows({ factors }: { factors: ScoreFactor[] }) {
  return (
    <div className="space-y-2.5">
      {factors.map((f) => (
        <div key={f.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12px] font-medium text-silktext">
              {f.name}
              <span className="ml-1.5 text-[10.5px] text-silkmuted">权重 {f.weight}</span>
            </span>
            <span className="font-serif text-[13px] font-bold text-goldbright">{f.score}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-silktext/10">
            <div
              className="h-full rounded-full [background:linear-gradient(90deg,rgb(var(--gold-dim)),rgb(var(--gold-bright)))]"
              style={{ width: `${f.score}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] leading-[1.7] text-silkmuted">{f.explanation}</p>
        </div>
      ))}
    </div>
  )
}

function AnnotationCard({ sel, onClose }: { sel: Selection; onClose: () => void }) {
  const title =
    sel.kind === 'liunian'
      ? `流年 ${sel.item.ganzhi} · ${sel.item.year} 年（${sel.item.age} 岁）`
      : `大运 ${sel.item.ganzhi} · ${sel.item.startAge}–${sel.item.startAge + 9} 岁`
  return (
    <div className="relative rounded-xl border border-gold/40 bg-deep2 p-5 shadow-card">
      <button
        onClick={onClose}
        aria-label="关闭注解"
        className="absolute right-3 top-3 rounded-full border border-golddim/40 px-2 py-0.5 text-[11px] text-silkmuted hover:text-goldbright"
      >
        关闭
      </button>
      <p className="pr-14 font-serif text-[15px] font-bold tracking-[0.08em] text-goldbright">
        {title}
      </p>
      <p className="mt-1 text-[12px] text-silkmuted">
        结构分 <span className="font-serif text-[16px] font-bold text-goldbright">{sel.item.score}</span>
        <span className="ml-1 text-[10.5px]">/ 100（0–100，无量纲）</span>
      </p>
      <div className="mt-4">
        <FactorRows factors={sel.item.factors} />
      </div>
    </div>
  )
}

type Props = {
  chart: BaziChartV2 | null
  loading?: boolean
  error?: string | null
}

export default function LifeChart({ chart, loading = false, error = null }: Props) {
  const [yearMode, setYearMode] = useState(false)
  const [sel, setSel] = useState<Selection | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)

  const computed = useMemo(() => {
    if (!chart) return { scores: null, err: null as string | null }
    try {
      return { scores: computeLifeScores(chart), err: null as string | null }
    } catch (e) {
      return { scores: null, err: e instanceof Error ? e.message : '结构分计算失败' }
    }
  }, [chart])
  const scores = computed.scores
  const failed = error ?? computed.err

  const birthYear = chart?.liunian.find((l) => l.age === 0)?.year ?? chart?.liunian[0]?.year ?? null
  const currentLn = scores?.liunianScores.find((l) => l.ganzhi === chart?.liunian.find((x) => x.isCurrent)?.ganzhi && l.year === chart?.liunian.find((x) => x.isCurrent)?.year)
  const currentStep = chart?.dayun.steps.find((s) => s.isCurrent)

  const line = useMemo(() => {
    if (!scores) return ''
    return scores.liunianScores
      .map((l, i) => `${i === 0 ? 'M' : 'L'} ${xOf(l.age).toFixed(1)} ${yOf(l.score).toFixed(1)}`)
      .join(' ')
  }, [scores])

  const axisLabel = (age: number) => (yearMode && birthYear !== null ? `${birthYear + age}` : `${age}`)

  return (
    <div className="rounded-xl border border-golddim/30 bg-deep p-5 shadow-card md:p-7">
      {/* 头部：标题 + 切换 + 图例 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-[16px] font-bold tracking-[0.12em] text-silktext">
          人生轨迹 · 结构分（0–100）
        </p>
        <div className="flex items-center gap-2 text-[12px] text-silkmuted">
          <span>横轴</span>
          {(['age', 'year'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setYearMode(m === 'year')}
              className={cn(
                'rounded-full border px-3 py-1 transition-colors',
                (m === 'year') === yearMode
                  ? 'border-gold bg-gold/15 text-goldbright'
                  : 'border-golddim/40 text-silkmuted hover:border-golddim',
              )}
            >
              {m === 'age' ? '年龄（岁）' : '公历年份'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-silkmuted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-6 bg-goldbright" /> 流年结构分折线
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded-sm bg-gold/20 ring-1 ring-gold/40" /> 大运区间（十年一步）
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-goldbright" /> 流年节点（可点击）
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-goldbright" /> 当前流年 / 当前大运高亮
        </span>
      </div>

      {/* 主体：加载骨架 / 错误 / 空 / 图 */}
      {loading ? (
        <div className="mt-5 h-[300px] animate-pulse rounded-lg bg-silktext/5" aria-label="加载中" />
      ) : failed ? (
        <div className="mt-5 rounded-lg border border-[#B04A3A]/50 bg-[#B04A3A]/10 p-6 text-center text-[13px] text-[#E0A39A]">
          人生轨迹图暂不可用：{failed}
        </div>
      ) : !chart || !scores || scores.liunianScores.length === 0 ? (
        <div className="mt-5 rounded-lg border border-golddim/25 bg-deep2/60 p-10 text-center text-[13px] text-silkmuted">
          请先在上方完成排盘，人生轨迹图将随盘生成。
        </div>
      ) : (
        <div className="relative mt-4">
          {/* 移动端横向滚动容器 */}
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="min-w-[860px]"
              role="img"
              aria-label="人生轨迹结构分折线图"
            >
              {/* 网格 + Y 轴 */}
              {[0, 25, 50, 75, 100].map((v) => (
                <g key={v}>
                  <line x1={X0} x2={X1} y1={yOf(v)} y2={yOf(v)} stroke="#EDE7D2" strokeOpacity={v === 0 ? 0.25 : 0.1} />
                  <text x={X0 - 8} y={yOf(v) + 4} textAnchor="end" fontSize={10.5} fill="#94A398">
                    {v}
                  </text>
                </g>
              ))}
              <text x={14} y={Y0 - 26} fontSize={10.5} fill="#94A398" transform={`rotate(-90 14 ${Y0 - 26})`}>
                结构分
              </text>

              {/* 大运色带 */}
              {scores.dayunScores.map((d, i) => {
                const a = d.startAge
                const b = Math.min(100, d.startAge + 10)
                if (a >= 100) return null
                const isCur = currentStep?.startAge === d.startAge
                return (
                  <g key={`dy-${i}`}>
                    <rect
                      x={xOf(a)}
                      y={Y0 - 22}
                      width={xOf(b) - xOf(a)}
                      height={Y1 - Y0 + 22}
                      fill="#C7A23A"
                      opacity={isCur ? 0.22 : i % 2 === 0 ? 0.1 : 0.05}
                      stroke={isCur ? '#E4C66A' : 'none'}
                      strokeWidth={isCur ? 1.2 : 0}
                      className="cursor-pointer"
                      onClick={() => setSel({ kind: 'dayun', item: d })}
                    />
                    <text
                      x={(xOf(a) + xOf(b)) / 2}
                      y={Y0 - 8}
                      textAnchor="middle"
                      fontSize={11.5}
                      fontWeight={isCur ? 700 : 400}
                      fill={isCur ? '#E4C66A' : '#94A398'}
                      className="cursor-pointer"
                      onClick={() => setSel({ kind: 'dayun', item: d })}
                    >
                      {d.ganzhi} · {d.score}
                    </text>
                  </g>
                )
              })}

              {/* X 轴刻度 */}
              {Array.from({ length: 11 }, (_, i) => i * 10).map((age) => (
                <g key={age}>
                  <line x1={xOf(age)} x2={xOf(age)} y1={Y1} y2={Y1 + 5} stroke="#94A398" strokeOpacity={0.5} />
                  <text x={xOf(age)} y={Y1 + 18} textAnchor="middle" fontSize={10.5} fill="#94A398">
                    {axisLabel(age)}
                  </text>
                </g>
              ))}
              <text x={(X0 + X1) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#94A398">
                {yearMode ? '公历年份（年）' : '年龄（岁）'}
              </text>

              {/* 结构分折线 */}
              <path d={line} fill="none" stroke="#E4C66A" strokeWidth={2} strokeLinejoin="round" />

              {/* 流年节点 */}
              {scores.liunianScores.map((l) => {
                const isCur = currentLn?.year === l.year
                return (
                  <circle
                    key={l.year}
                    cx={xOf(l.age)}
                    cy={yOf(l.score)}
                    r={isCur ? 5.5 : 3}
                    fill={isCur ? '#E4C66A' : '#0B3B39'}
                    stroke="#E4C66A"
                    strokeWidth={isCur ? 2.4 : 1.2}
                    className="cursor-pointer"
                    onClick={() => setSel({ kind: 'liunian', item: l })}
                    onMouseEnter={() =>
                      setTip({
                        x: xOf(l.age),
                        y: yOf(l.score),
                        text: `${l.ganzhi} · ${l.year}（${l.age}岁）· ${l.score} 分`,
                      })
                    }
                    onMouseLeave={() => setTip(null)}
                  >
                    <title>{`${l.ganzhi} ${l.year}（${l.age}岁）结构分 ${l.score}`}</title>
                  </circle>
                )
              })}

              {/* 桌面 tooltip */}
              {tip && (
                <g pointerEvents="none">
                  <rect
                    x={Math.min(Math.max(tip.x - 90, X0), X1 - 180)}
                    y={Math.max(tip.y - 34, Y0 - 18)}
                    width={180}
                    height={22}
                    rx={6}
                    fill="#072B29"
                    stroke="#C7A23A"
                    strokeOpacity={0.5}
                  />
                  <text
                    x={Math.min(Math.max(tip.x - 90, X0), X1 - 180) + 90}
                    y={Math.max(tip.y - 34, Y0 - 18) + 15}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#EDE7D2"
                  >
                    {tip.text}
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* 因子权重说明 */}
          <p className="mt-3 text-[11px] leading-[1.8] text-silkmuted">
            因子权重公开：五行结构变化 ×{FACTOR_WEIGHTS.wuxingBalance} · 十神作用 ×
            {FACTOR_WEIGHTS.tenGodAction} · 冲合刑害密度 ×{FACTOR_WEIGHTS.relationDensity}。
            点击流年节点或大运色带查看三因子子分与说明。
          </p>

          {/* 注解卡 */}
          {sel && (
            <div className="mt-4">
              <AnnotationCard sel={sel} onClose={() => setSel(null)} />
            </div>
          )}
        </div>
      )}

      {/* 显著免责声明（core 常量，原样渲染） */}
      <p className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2.5 text-center text-[12.5px] font-medium leading-[1.8] tracking-[0.04em] text-goldbright">
        {SCORES_DISCLAIMER}
      </p>
    </div>
  )
}
