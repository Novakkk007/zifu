/**
 * 核心摘要卡——排盘结果的"人话版第一屏"。
 * 从引擎既有数据提取 3-4 条核心结论，让普通用户 30 秒内看懂自己的命盘。
 * 专业明细（四柱/十神/神煞）在下方供行家参考。
 */
import { useMemo } from 'react'
import type { BaziChartV2 } from '@contracts/bazi-core'
import { analyzeWithMasters } from '@contracts/engines/masters-rules'

const WUXING_LABEL: Record<string, string> = {
  木: '如树木生长，重条达与舒展',
  火: '如灯火明亮，重热情与表达',
  土: '如大地承载，重稳定与包容',
  金: '如金属肃敛，重条理与决断',
  水: '如流水润下，重智慧与流动',
}

const GRADE_LABEL: Record<string, string> = {
  偏强: '身强——精力较足，宜有节制的输出',
  偏弱: '身弱——易感疲累，宜注重休养与支持',
  中和: '中和——张弛有度，可进可退',
}

export default function CoreSummary({ chart, onAiRead }: { chart: BaziChartV2; onAiRead?: () => void }) {
  const summary = useMemo(() => {
    const me = chart.dayMasterWuxing
    const g = chart.wuxing.strength.grade
    const ys = chart.yongshen.yongshen
    const masterHint = analyzeWithMasters(chart, 1)[0]
    const items = [
      {
        icon: '☯',
        title: `你是「${me}」日主`,
        text: `${WUXING_LABEL[me] ?? ''}。传统命理以日主五行立身，其余五行皆围绕它论生克助泄。`,
      },
      {
        icon: '⚖',
        title: `旺衰：${g}`,
        text: `${GRADE_LABEL[g] ?? '传统量化模型的旺衰等级'}。这是扶抑论局的基础——${g === '偏弱' ? '身弱者宜多休养、亲近生扶之力' : g === '偏强' ? '身强者宜有输出、有节制的进取' : '中和者重在保持节奏'}`,
      },
      {
        icon: '🌿',
        title: `平衡方向：${ys}`,
        text: `扶抑法取「${ys}」为用神方向。日常决策参详时，传统上倾向与${ys}相关的领域与节奏。（文化参考，非行动指令）`,
      },
    ]
    if (masterHint) {
      items.push({
        icon: '📜',
        title: `名家怎么看：${masterHint.title}`,
        text: masterHint.text,
      })
    }
    return items
  }, [chart])

  return (
    <section className="mt-6 rounded-xl border border-gold/25 bg-deep p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-[19px] font-bold tracking-[0.1em] text-silktext">
          命盘速览 · 核心三件事
        </h3>
        <span className="rounded-full border border-golddim/40 px-3 py-1 text-[11px] tracking-[0.1em] text-golddim">
          人话版 · 细节见下方专业盘
        </span>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {summary.map((item) => (
          <div key={item.title} className="rounded-lg border border-golddim/15 bg-black/20 p-4">
            <p className="text-[12px] tracking-[0.2em] text-goldbright">
              {item.icon} {item.title}
            </p>
            <p className="mt-2 text-[13.5px] leading-[1.9] text-silktext/90">{item.text}</p>
          </div>
        ))}
      </div>
      {onAiRead && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onAiRead}
            className="rounded-full bg-gold px-8 py-3 font-sans text-[14px] font-semibold tracking-[0.12em] text-deep transition-transform hover:scale-[1.03]"
          >
            ✨ AI 详批解读（引经参详）
          </button>
        </div>
      )}
    </section>
  )
}
