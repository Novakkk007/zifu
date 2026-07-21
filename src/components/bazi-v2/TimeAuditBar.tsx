/**
 * 排盘依据条（TimeAudit）：历法换算与时间修正全量可解释展示。
 */
import type { BaziChartV2 } from '@contracts/bazi-core'

export default function TimeAuditBar({ chart }: { chart: BaziChartV2 }) {
  const a = chart.timeAudit
  const items: { label: string; value: string }[] = [
    {
      label: '历法',
      value:
        a.inputCalendar === 'solar'
          ? '公历'
          : `农历${a.isLeapMonth ? '（闰月）' : ''} · ${a.lunarYear}年${Math.abs(a.lunarMonth)}月${a.lunarDay}日`,
    },
    { label: '标准时间', value: `${a.standardTime}（UTC${a.timezone >= 0 ? '+' : ''}${a.timezone}）` },
  ]
  if (a.useTrueSolarTime) {
    items.push(
      { label: '真太阳时', value: a.effectiveTime },
      {
        label: '修正量',
        value: `经度 ${a.longitudeCorrectionMin >= 0 ? '+' : ''}${a.longitudeCorrectionMin.toFixed(1)} 分钟 · 均时差 ${a.equationOfTimeMin >= 0 ? '+' : ''}${a.equationOfTimeMin.toFixed(1)} 分钟`,
      },
    )
  } else {
    items.push({ label: '排盘时刻', value: `${a.effectiveTime}（未启用真太阳时）` })
  }
  items.push(
    { label: '换日规则', value: a.dayRollover === 'zichu' ? '子初换日（23:00）' : '0 点换日' },
    { label: '规则版本', value: `RULESET ${a.rulesetVersion}` },
  )

  return (
    <div className="rounded-lg border border-golddim/30 bg-silk2/70 px-5 py-4">
      <p className="mb-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-golddim">
        排盘依据 · Time Audit
      </p>
      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        {items.map((it) => (
          <div key={it.label} className="text-[12px] leading-[1.7]">
            <dt className="inline text-inkmuted">{it.label}：</dt>
            <dd className="inline font-medium text-inktext">{it.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
