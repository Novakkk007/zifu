/**
 * 首屏结果摘要块：排盘结果顶部的一行式数据带。
 * 全部字段直接从 chart 派生（日主 / 五行最旺最弱 / 旺衰 / 用神 /
 * 当前大运 / 当前流年 / 规则版本），无前端推演。
 */
import type { BaziChartV2 } from '@contracts/bazi-core'

export default function ChartSummaryStrip({ chart }: { chart: BaziChartV2 }) {
  const currentDayun = chart.dayun.steps.find((s) => s.isCurrent)
  const currentLiunian = chart.liunian.find((l) => l.isCurrent)

  const items: { label: string; value: string }[] = [
    {
      label: '日主',
      value: `${chart.dayMaster} · ${chart.dayMasterWuxing}（${chart.pillars.day.stemYinYang}）`,
    },
    {
      label: '五行',
      value: `最旺 ${chart.wuxing.strongest} · 最弱 ${chart.wuxing.weakest}${
        chart.wuxing.missing.length > 0 ? ` · 缺${chart.wuxing.missing.join('、')}` : ''
      }`,
    },
    {
      label: '旺衰',
      value: `${chart.wuxing.strength.grade}（${chart.wuxing.strength.total} 分）`,
    },
    { label: '用神', value: chart.yongshen.yongshen },
    {
      label: '当前大运',
      value: currentDayun
        ? `${currentDayun.ganzhi}（${currentDayun.startAge}–${currentDayun.endAge} 岁）`
        : '未起运',
    },
    {
      label: '当前流年',
      value: currentLiunian ? `${currentLiunian.ganzhi}（${currentLiunian.year} 年）` : '—',
    },
    { label: '规则版本', value: chart.rulesetVersion },
  ]

  return (
    <div className="rounded-xl border border-golddim/30 bg-silk2 px-5 py-4 shadow-card">
      <p className="mb-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-golddim">
        命盘速览 · At a Glance
      </p>
      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        {items.map((it) => (
          <div key={it.label} className="text-[12.5px] leading-[1.7]">
            <dt className="inline text-inkmuted">{it.label}：</dt>
            <dd className="inline font-serif font-bold text-inktext">{it.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
