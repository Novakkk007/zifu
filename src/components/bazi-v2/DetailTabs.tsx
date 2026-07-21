/**
 * 专业细盘 Tabs：四柱总表 / 藏干十神 / 纳音长生 / 合冲刑害 / 大运 / 流年。
 */
import { useState, type ReactNode } from 'react'
import type { BaziChartV2, PillarInfo } from '@contracts/bazi-core'
import { cn } from '@/lib/utils'
import { WUXING_COLORS, WUXING_ICONS } from '@/lib/wuxing-style'

const TABS = ['四柱总表', '藏干十神', '纳音长生', '合冲刑害', '大运', '流年'] as const
type TabId = (typeof TABS)[number]

const thCls =
  'whitespace-nowrap border-b border-golddim/25 px-3 py-2.5 text-left font-sans text-[12px] font-medium tracking-[0.1em] text-golddim'
const tdCls = 'border-b border-golddim/10 px-3 py-2.5 align-top text-[13px] leading-[1.8] text-inktext'

function pillarList(chart: BaziChartV2): (PillarInfo | null)[] {
  return [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour]
}

function WX({ w, children }: { w: WuxingKey; children?: ReactNode }) {
  return (
    <span style={{ color: WUXING_COLORS[w] }}>
      {WUXING_ICONS[w]} {children ?? w}
    </span>
  )
}
type WuxingKey = keyof typeof WUXING_COLORS

/* ---------- 四柱总表 ---------- */
function PillarsTable({ chart }: { chart: BaziChartV2 }) {
  const ps = pillarList(chart)
  const row = (label: string, render: (p: PillarInfo) => ReactNode) => (
    <tr>
      <td className={`${tdCls} whitespace-nowrap font-medium text-inkmuted`}>{label}</td>
      {ps.map((p, i) => (
        <td key={i} className={tdCls}>
          {p ? render(p) : <span className="text-inkmuted/60">未排</span>}
        </td>
      ))}
    </tr>
  )
  return (
    <table className="w-full min-w-[640px] border-collapse">
      <thead>
        <tr>
          <th className={thCls}>项目</th>
          {ps.map((p, i) => (
            <th key={i} className={thCls}>
              {p?.label ?? '时柱'}
              {p?.label === '日柱' && <span className="ml-1 text-golddim">日主</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {row('干支', (p) => (
          <span className="font-serif text-[17px] font-black">
            <span style={{ color: WUXING_COLORS[p.stemWuxing] }}>{p.stem}</span>
            <span style={{ color: WUXING_COLORS[p.branchWuxing] }}>{p.branch}</span>
          </span>
        ))}
        {row('天干五行', (p) => (
          <WX w={p.stemWuxing}>{`${p.stemWuxing}（${p.stemYinYang}）`}</WX>
        ))}
        {row('地支五行', (p) => (
          <WX w={p.branchWuxing}>{`${p.branchWuxing}（${p.branchYinYang}）`}</WX>
        ))}
        {row('天干十神', (p) => <span className="font-medium text-golddim">{p.stemTenGod}</span>)}
        {row('六十甲子', (p) => `#${p.jiaziIdx + 1} ${p.ganzhi}`)}
      </tbody>
    </table>
  )
}

/* ---------- 藏干十神 ---------- */
function HiddenTable({ chart }: { chart: BaziChartV2 }) {
  const ps = pillarList(chart)
  return (
    <table className="w-full min-w-[640px] border-collapse">
      <thead>
        <tr>
          <th className={thCls}>柱位</th>
          <th className={thCls}>地支</th>
          <th className={thCls}>本气</th>
          <th className={thCls}>中气</th>
          <th className={thCls}>余气</th>
        </tr>
      </thead>
      <tbody>
        {ps.map((p, i) => (
          <tr key={i}>
            <td className={`${tdCls} font-medium`}>{p?.label ?? '时柱'}</td>
            <td className={tdCls}>
              {p ? <WX w={p.branchWuxing}>{p.branch}</WX> : <span className="text-inkmuted/60">未排</span>}
            </td>
            {(['本气', '中气', '余气'] as const).map((role) => {
              const h = p?.hiddenStems.find((x) => x.role === role)
              return (
                <td key={role} className={tdCls}>
                  {h ? (
                    <>
                      <WX w={h.wuxing}>{h.stem}</WX>
                      <span className="ml-1.5 text-golddim">{h.tenGod}</span>
                    </>
                  ) : (
                    <span className="text-inkmuted/50">—</span>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ---------- 纳音长生 ---------- */
function NayinTable({ chart }: { chart: BaziChartV2 }) {
  const ps = pillarList(chart)
  return (
    <table className="w-full min-w-[520px] border-collapse">
      <thead>
        <tr>
          <th className={thCls}>柱位</th>
          <th className={thCls}>干支</th>
          <th className={thCls}>纳音</th>
          <th className={thCls}>十二长生（日主）</th>
        </tr>
      </thead>
      <tbody>
        {ps.map((p, i) => (
          <tr key={i}>
            <td className={`${tdCls} font-medium`}>{p?.label ?? '时柱'}</td>
            <td className={`${tdCls} font-serif font-bold`}>{p?.ganzhi ?? '未排'}</td>
            <td className={tdCls}>{p?.nayin ?? '—'}</td>
            <td className={`${tdCls} text-golddim`}>{p?.stage ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ---------- 合冲刑害 ---------- */
function RelationsTab({ chart }: { chart: BaziChartV2 }) {
  if (chart.relations.length === 0) {
    return <p className="px-3 py-6 text-center text-[13px] text-inkmuted">本命盘柱间未检出合、冲、刑、害、破关系。</p>
  }
  return (
    <table className="w-full min-w-[560px] border-collapse">
      <thead>
        <tr>
          <th className={thCls}>类型</th>
          <th className={thCls}>柱位</th>
          <th className={thCls}>干支</th>
          <th className={thCls}>合化</th>
          <th className={thCls}>出处</th>
        </tr>
      </thead>
      <tbody>
        {chart.relations.map((r, i) => (
          <tr key={i}>
            <td className={`${tdCls} font-serif font-bold text-golddim`}>{r.type}</td>
            <td className={tdCls}>{r.pillars.join(' · ')}</td>
            <td className={tdCls}>{r.chars}</td>
            <td className={tdCls}>{r.resultWuxing ? `化${r.resultWuxing}` : '—'}</td>
            <td className={`${tdCls} text-[12px] text-inkmuted`}>{r.source}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ---------- 大运 ---------- */
function DayunTab({ chart }: { chart: BaziChartV2 }) {
  const d = chart.dayun
  return (
    <div>
      <p className="px-3 pb-3 pt-1 text-[12.5px] leading-[1.9] text-inkmuted">
        {d.directionReason} · {d.forward ? '顺排' : '逆排'} · {d.startAge} 岁起运（数至
        {d.forward ? '后' : '前'}节气「{d.refJieName}」{d.refJieTime}，共 {d.daysToJie} 天 ÷ 3）
      </p>
      <table className="w-full min-w-[680px] border-collapse">
        <thead>
          <tr>
            <th className={thCls}>大运</th>
            <th className={thCls}>十神</th>
            <th className={thCls}>纳音</th>
            <th className={thCls}>虚岁</th>
            <th className={thCls}>公历年（约）</th>
          </tr>
        </thead>
        <tbody>
          {d.steps.map((s) => (
            <tr key={s.index} className={cn(s.isCurrent && 'bg-gold/10')}>
              <td className={`${tdCls} font-serif text-[15px] font-bold`}>
                {s.ganzhi}
                {s.isCurrent && (
                  <span className="ml-2 rounded-full border border-gold/60 px-2 py-0.5 text-[10.5px] font-sans font-medium tracking-[0.1em] text-golddim">
                    当前大运
                  </span>
                )}
              </td>
              <td className={`${tdCls} text-golddim`}>{s.stemTenGod}</td>
              <td className={tdCls}>{s.nayin}</td>
              <td className={tdCls}>
                {s.startAge}–{s.endAge} 岁
              </td>
              <td className={tdCls}>
                {s.startYear}–{s.endYear}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- 流年 ---------- */
function LiunianTab({ chart }: { chart: BaziChartV2 }) {
  const current = chart.liunian.find((l) => l.isCurrent)
  const shown = chart.liunian.filter((l) => current && l.year >= current.year - 5 && l.year <= current.year + 10)
  const list = shown.length > 0 ? shown : chart.liunian.slice(0, 16)
  return (
    <div>
      <p className="px-3 pb-3 pt-1 text-[12.5px] text-inkmuted">
        当前流年前后共 {list.length} 年（当前岁运叠加高亮）。
      </p>
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr>
            <th className={thCls}>公历年</th>
            <th className={thCls}>流年干支</th>
            <th className={thCls}>十神</th>
            <th className={thCls}>周岁</th>
            <th className={thCls}>所在大运</th>
          </tr>
        </thead>
        <tbody>
          {list.map((l) => {
            const step = chart.dayun.steps.find((s) => l.age >= s.startAge && l.age < s.startAge + 10)
            return (
              <tr key={l.year} className={cn(l.isCurrent && 'bg-gold/10')}>
                <td className={tdCls}>
                  {l.year}
                  {l.isCurrent && (
                    <span className="ml-2 rounded-full border border-gold/60 px-2 py-0.5 text-[10.5px] tracking-[0.1em] text-golddim">
                      当前流年
                    </span>
                  )}
                </td>
                <td className={`${tdCls} font-serif font-bold`}>{l.ganzhi}</td>
                <td className={`${tdCls} text-golddim`}>{l.stemTenGod}</td>
                <td className={tdCls}>{l.age} 岁</td>
                <td className={tdCls}>{step ? `${step.ganzhi}（${step.startAge}–${step.endAge} 岁）` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function DetailTabs({ chart }: { chart: BaziChartV2 }) {
  const [tab, setTab] = useState<TabId>('四柱总表')
  return (
    <div className="rounded-xl border border-golddim/25 bg-silk2 shadow-card">
      <div className="flex flex-wrap gap-1 border-b border-golddim/20 px-3 pt-3" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-t-lg px-4 py-2.5 font-sans text-[13px] font-medium tracking-[0.1em] transition-colors',
              tab === t
                ? 'bg-deep text-silk'
                : 'text-inkmuted hover:bg-golddim/10 hover:text-inktext',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto p-4">
        {tab === '四柱总表' && <PillarsTable chart={chart} />}
        {tab === '藏干十神' && <HiddenTable chart={chart} />}
        {tab === '纳音长生' && <NayinTable chart={chart} />}
        {tab === '合冲刑害' && <RelationsTab chart={chart} />}
        {tab === '大运' && <DayunTab chart={chart} />}
        {tab === '流年' && <LiunianTab chart={chart} />}
      </div>
    </div>
  )
}
