/**
 * 本命盘明细表组：十神明细 / 合冲刑害破 / 神煞 / 称骨。
 * 全部数据直接渲染 core 结果（含规则出处），无前端伪造。
 */
import type { ReactNode } from 'react'
import type { BaziChartV2, ShenshaHit } from '@contracts/bazi-core'
import { TEN_GOD_INFO, type TenGod } from '@contracts/bazi-core'
import GlossaryTooltip from '@/components/GlossaryTooltip'

/* ---------- 通用表样式 ---------- */

const thCls =
  'whitespace-nowrap border-b border-golddim/25 px-3 py-2.5 text-left font-sans text-[12px] font-medium tracking-[0.1em] text-golddim'
const tdCls = 'border-b border-golddim/10 px-3 py-2.5 align-top text-[13px] leading-[1.8] text-inktext'

function TableShell({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-golddim/25 bg-silk2 shadow-card">
      <p className="border-b border-golddim/15 px-4 py-2 text-[11px] tracking-[0.08em] text-inkmuted sm:hidden">
        左右滑动查看完整表格 →
      </p>
      <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full min-w-[720px] border-collapse">
          <caption className="px-4 pb-0 pt-4 text-left font-serif text-[15px] font-bold tracking-[0.12em] text-inktext">
            {caption}
          </caption>
          {children}
        </table>
      </div>
    </div>
  )
}

/* ---------- 十神明细 ---------- */

const REL_OF_GOD: Record<string, string> = {
  比肩: '同我（比和）', 劫财: '同我（比和）',
  食神: '我生（泄秀）', 伤官: '我生（泄秀）',
  偏财: '我克（财星）', 正财: '我克（财星）',
  七杀: '克我（官杀）', 正官: '克我（官杀）',
  偏印: '生我（印星）', 正印: '生我（印星）',
}
const SAME_YY = new Set(['比肩', '食神', '偏财', '七杀', '偏印'])

export function TenGodsTable({ chart }: { chart: BaziChartV2 }) {
  const groups = new Map<string, { pillar: string; char: string; layer: string }[]>()
  for (const t of chart.tenGods) {
    if (t.tenGod === '日主') continue
    const list = groups.get(t.tenGod) ?? []
    list.push({ pillar: t.pillar, char: t.char, layer: t.layer === 'stem' ? '天干' : '藏干' })
    groups.set(t.tenGod, list)
  }
  return (
    <TableShell caption="十神明细（天干透干 + 地支藏干全量）">
      <thead>
        <tr>
          <th className={thCls}>十神</th>
          <th className={thCls}>来源（落柱 · 干支 · 层）</th>
          <th className={thCls}>与日主关系</th>
          <th className={thCls}>阴阳</th>
          <th className={thCls}>传统含义</th>
          <th className={thCls}>规则出处</th>
        </tr>
      </thead>
      <tbody>
        {[...groups.entries()].map(([god, sources]) => {
          const info = TEN_GOD_INFO[god as TenGod]
          return (
            <tr key={god}>
              <td className={`${tdCls} font-serif text-[15px] font-bold text-golddim`}>
                <GlossaryTooltip term={god}>{god}</GlossaryTooltip>
              </td>
              <td className={tdCls}>
                {sources.map((s, i) => (
                  <span key={i} className="mr-2 inline-block whitespace-nowrap">
                    {s.pillar}·{s.char}
                    <span className="ml-1 text-[11px] text-inkmuted">（{s.layer}）</span>
                  </span>
                ))}
              </td>
              <td className={tdCls}>{REL_OF_GOD[god] ?? '—'}</td>
              <td className={tdCls}>{SAME_YY.has(god) ? '与日主同阴阳' : '与日主异阴阳'}</td>
              <td className={tdCls}>{info?.meaning ?? '—'}</td>
              <td className={`${tdCls} whitespace-nowrap text-[12px] text-inkmuted`}>
                {info?.source ?? '—'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </TableShell>
  )
}

/* ---------- 合冲刑害破 ---------- */

export function RelationsTable({ chart }: { chart: BaziChartV2 }) {
  if (chart.relations.length === 0) {
    return (
      <div className="rounded-xl border border-golddim/25 bg-silk2 p-8 text-center shadow-card">
        <p className="font-serif text-[15px] font-bold tracking-[0.12em] text-inktext">合冲刑害破</p>
        <p className="mt-3 text-[13px] text-inkmuted">本命盘柱间未检出合、冲、刑、害、破关系。</p>
      </div>
    )
  }
  return (
    <TableShell caption="合冲刑害破（柱间关系）">
      <thead>
        <tr>
          <th className={thCls}>类型</th>
          <th className={thCls}>柱位</th>
          <th className={thCls}>干支</th>
          <th className={thCls}>合化</th>
          <th className={thCls}>规则出处</th>
        </tr>
      </thead>
      <tbody>
        {chart.relations.map((r, i) => (
          <tr key={`${r.type}-${r.chars}-${i}`}>
            <td className={`${tdCls} font-serif font-bold text-golddim`}>{r.type}</td>
            <td className={tdCls}>{r.pillars.join(' · ')}</td>
            <td className={tdCls}>{r.chars}</td>
            <td className={tdCls}>{r.resultWuxing ? `化${r.resultWuxing}` : '—'}</td>
            <td className={`${tdCls} text-[12px] text-inkmuted`}>{r.source}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

/* ---------- 神煞 ---------- */

/** 神煞柱位传统对应（年柱早年祖上/月柱父母事业/日柱自身婚姻/时柱子女晚年） */
const PILLAR_MEANING: Record<string, string> = {
  年: '早年 · 祖上',
  月: '父母 · 事业',
  日: '自身 · 婚姻',
  时: '子女 · 晚年',
}

export function ShenshaTable({ chart }: { chart: BaziChartV2 }) {
  if (chart.shensha.length === 0) {
    return (
      <div className="rounded-xl border border-golddim/25 bg-silk2 p-8 text-center shadow-card">
        <p className="font-serif text-[15px] font-bold tracking-[0.12em] text-inktext">神煞</p>
        <p className="mt-3 text-[13px] text-inkmuted">本盘未命中注册表内神煞。</p>
      </div>
    )
  }
  // 神煞 v2：一柱命中一条记录。按名称归组（保持首次出现顺序），
  // 同一神煞多柱命中时逐柱分行展示（如 天乙贵人·年支命中 / 天乙贵人·日支命中）。
  // 前台仅渲染 名称 / 命中柱位 / 命中状态 / 现代化说明；
  // verse / source / variant / basis 为后台字段，一律不渲染。
  const groups: { name: string; hits: ShenshaHit[] }[] = []
  const indexOf = new Map<string, number>()
  for (const hit of chart.shensha) {
    const idx = indexOf.get(hit.name)
    if (idx === undefined) {
      indexOf.set(hit.name, groups.length)
      groups.push({ name: hit.name, hits: [hit] })
    } else {
      groups[idx].hits.push(hit)
    }
  }
  return (
    <TableShell caption="神煞（逐柱命中，同一神煞多柱命中分行列出）">
      <thead>
        <tr>
          <th className={thCls}>名称</th>
          <th className={thCls}>命中柱位</th>
          <th className={thCls}>柱位传统对应</th>
          <th className={thCls}>命中状态</th>
          <th className={thCls}>现代化说明</th>
        </tr>
      </thead>
      <tbody>
        {groups.flatMap((g) =>
          g.hits.map((s, i) => (
            <tr key={`${g.name}-${s.pillar}-${s.char}-${i}`}>
              <td className={`${tdCls} font-serif font-bold text-golddim`}>
                {s.name}
                {g.hits.length > 1 && (
                  <span className="ml-1.5 rounded-full border border-golddim/30 px-1.5 py-0.5 align-middle font-sans text-[10px] font-normal text-inkmuted">
                    {g.hits.length} 柱命中
                  </span>
                )}
              </td>
              <td className={tdCls}>{s.pillar}</td>
              <td className={tdCls}>
                {PILLAR_MEANING[s.pillar[0]] ?? '—'}
              </td>
              <td className={tdCls}>{s.char}</td>
              <td className={`${tdCls} leading-[1.8]`}>{s.modernExplanation}</td>
            </tr>
          )),
        )}
      </tbody>
    </TableShell>
  )
}

/* ---------- 称骨 ---------- */

export function ChengguCard({ chart }: { chart: BaziChartV2 }) {
  const c = chart.chenggu
  if (!c) {
    return (
      <div className="rounded-xl border border-golddim/25 bg-silk2 p-8 text-center shadow-card">
        <p className="font-serif text-[15px] font-bold tracking-[0.12em] text-inktext">称骨</p>
        <p className="mt-3 text-[13px] text-inkmuted">
          暂不可用{chart.input.hour === null ? '（时辰不详，称骨需时柱）' : ''}
        </p>
      </div>
    )
  }
  const qian = (n: number) => `${(n / 10).toFixed(1)} 两`
  const parts = [
    { label: `年（${c.yearGanzhi}）`, q: c.yearQian },
    { label: `月（农历${c.lunarMonth}月）`, q: c.monthQian },
    { label: `日（${c.lunarDay}日）`, q: c.dayQian },
    { label: `时（${c.hourBranch}时）`, q: c.hourQian },
  ]
  return (
    <div className="rounded-xl border border-golddim/25 bg-silk2 p-7 shadow-card">
      <p className="text-center font-serif text-[15px] font-bold tracking-[0.12em] text-inktext">
        称骨（袁天罡称骨歌）
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {parts.map((p) => (
          <div key={p.label} className="rounded-lg border border-golddim/20 bg-silk px-3 py-3 text-center">
            <p className="text-[11.5px] tracking-[0.08em] text-inkmuted">{p.label}</p>
            <p className="mt-1 font-serif text-[16px] font-bold text-inktext">{qian(p.q)}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 text-center">
        <p className="text-[11.5px] tracking-[0.16em] text-inkmuted">总骨重</p>
        <p className="mt-1 font-serif text-[34px] font-black leading-none text-golddim">
          {c.totalText}
        </p>
      </div>
      <p className="mt-4 whitespace-pre-line border-t border-golddim/15 pt-4 text-center font-serif text-[14.5px] leading-[2] text-inktext">
        {c.verse}
      </p>
      <p className="mt-3 text-center text-[11.5px] text-inkmuted">{c.source}</p>
    </div>
  )
}
