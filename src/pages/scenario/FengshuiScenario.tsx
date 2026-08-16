/**
 * 阳宅风水参详——真实功能页（YZ-01~09 环境检查引擎 + 《宅经》公版依据）。
 * 边界：只输出可验证的环境与工程检查建议，不输出吉凶或方位断言。
 */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { evaluateYangzhai, type YangzhaiInput } from '@contracts/engines/fengshui-rules'
import FloatingGlyphs from '@/components/FloatingGlyphs'

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

/** 表单问题（文化化表述 → YangzhaiInput 字段） */
const QUESTIONS: {
  key: keyof YangzhaiInput
  label: string
  hint: string
  kind: 'select' | 'bool' | 'multi'
  options?: string[]
}[] = [
  {
    key: 'areaRatio',
    label: '住宅面积与实际需求',
    hint: '常住人数少、空置房间多 → 选「偏大」',
    kind: 'select',
    options: ['偏大', '适中', '偏小'],
  },
  {
    key: 'doorSize',
    label: '入户门相对室内空间',
    hint: '门洞明显偏大或直接面对主起居区 → 选「偏大」',
    kind: 'select',
    options: ['偏大', '适中', '偏小'],
  },
  {
    key: 'doorDirectToPrivate',
    label: '开门是否直见卧室/私密区',
    hint: '入户视线直达主要卧室或起居私密区',
    kind: 'bool',
  },
  {
    key: 'maintenanceIssues',
    label: '房屋现状（可多选）',
    hint: '选择存在的维护问题',
    kind: 'multi',
    options: ['墙体/屋面破损', '门窗松动', '渗漏潮湿', '无明显问题'],
  },
  {
    key: 'kitchenAdjacent',
    label: '水源与厨房的相邻关系',
    hint: '饮用水/排污设施与厨房相邻不当，或燃气排烟条件不明',
    kind: 'bool',
  },
  {
    key: 'kitchenOnRoute',
    label: '主通行路线是否穿过厨房操作区',
    hint: '入户/主要动线穿越烹饪操作区，或穿堂风掠过灶具',
    kind: 'bool',
  },
  {
    key: 'hasMeasure',
    label: '是否有真北朝向与现场测量数据',
    hint: '有可靠的真北测量与户型数据 → 是；只有大致方位印象 → 否',
    kind: 'bool',
  },
  {
    key: 'ageGenderRequested',
    label: '是否想按出生年匹配住宅',
    hint: '传统「宅命相配」属术数分类，本页只提供说明，不做吉凶判断',
    kind: 'bool',
  },
]

function toInput(answers: Record<string, string | string[] | undefined>): YangzhaiInput {
  const bool = (k: string) => answers[k] === '是'
  return {
    areaRatio: (answers['areaRatio'] as string) === '偏大' ? '大' : (answers['areaRatio'] as string) === '偏小' ? '小' : '中',
    doorSize: (answers['doorSize'] as string) === '偏大' ? '大' : (answers['doorSize'] as string) === '偏小' ? '小' : '中',
    doorDirectToPrivate: bool('doorDirectToPrivate'),
    maintenanceIssues: Array.isArray(answers['maintenanceIssues'])
      ? (answers['maintenanceIssues'] as string[]).filter((s) => s !== '无明显问题')
      : undefined,
    kitchenAdjacent: bool('kitchenAdjacent'),
    kitchenOnRoute: bool('kitchenOnRoute'),
    hasTrueNorth: bool('hasMeasure'),
    hasMeasure: bool('hasMeasure'),
    ageGenderRequested: bool('ageGenderRequested'),
  }
}

export default function FengshuiScenario() {
  const [answers, setAnswers] = useState<Record<string, string | string[] | undefined>>({})
  const [evaluated, setEvaluated] = useState(false)

  const hints = useMemo(() => {
    if (!evaluated) return []
    return evaluateYangzhai(toInput(answers))
  }, [answers, evaluated])

  const answeredCount = Object.values(answers).filter((v) => {
    if (Array.isArray(v)) return v.length > 0
    return v !== undefined && v !== ''
  }).length

  return (
    <div className="relative min-h-screen bg-deep pb-24 pt-14 md:pt-20">
      <FloatingGlyphs count={18} onDeep />
      <div className="relative zf-container max-w-[880px]">
        {/* 页头 */}
        <header className="text-center">
          <p className="font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-golddim">
            Dwelling &amp; Space
          </p>
          <h1 className="mt-2 font-serif text-[30px] font-black tracking-[0.12em] text-silktext">
            阳宅风水参详
          </h1>
          <p className="mx-auto mt-4 max-w-[620px] text-[13.5px] leading-[1.95] text-silkmuted">
            以《黄帝宅经》等公版典籍为据，参详宅向、门主灶布局与空间环境，
            输出可验证的环境检查提示。本页只给检查建议，不给吉凶结论。
          </p>
        </header>

        {/* 表单卡 */}
        <section className="mt-10 rounded-2xl border border-gold/20 bg-silk2 p-6 sm:p-8">
          <p className="font-serif text-[16px] font-bold tracking-[0.08em] text-inktext">宅局自查 · 八问</p>
          <div className="mt-5 space-y-5">
            {QUESTIONS.map((q, i) => (
              <div key={q.key} className="border-b border-golddim/10 pb-5 last:border-0 last:pb-0">
                <p className="text-[13.5px] font-medium text-inktext">
                  <span className="mr-2 font-serif text-golddim">{String(i + 1).padStart(2, '0')}</span>
                  {q.label}
                </p>
                <p className="mt-1 text-[11.5px] text-inkmuted">{q.hint}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {q.kind === 'select' &&
                    q.options?.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [q.key]: opt }))}
                        className={`rounded-full border px-4 py-1.5 text-[12.5px] transition-colors ${
                          answers[q.key] === opt
                            ? 'border-goldbright bg-gold/15 text-goldbright'
                            : 'border-golddim/30 text-inkmuted hover:border-golddim'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  {q.kind === 'bool' &&
                    ['是', '否'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [q.key]: opt }))}
                        className={`rounded-full border px-4 py-1.5 text-[12.5px] transition-colors ${
                          answers[q.key] === opt
                            ? 'border-goldbright bg-gold/15 text-goldbright'
                            : 'border-golddim/30 text-inkmuted hover:border-golddim'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  {q.kind === 'multi' &&
                    q.options?.map((opt) => {
                      const cur = Array.isArray(answers[q.key]) ? (answers[q.key] as string[]) : []
                      const active = cur.includes(opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setAnswers((a) => ({
                              ...a,
                              [q.key]: active ? cur.filter((s) => s !== opt) : [...cur, opt],
                            }))
                          }
                          className={`rounded-full border px-4 py-1.5 text-[12.5px] transition-colors ${
                            active
                              ? 'border-goldbright bg-gold/15 text-goldbright'
                              : 'border-golddim/30 text-inkmuted hover:border-golddim'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setEvaluated(true)}
              className="rounded-full bg-gold px-10 py-3 text-[14px] font-semibold tracking-[0.12em] text-deep transition-transform hover:scale-[1.03]"
            >
              生成环境检查提示
            </button>
            <p className="text-[11px] text-inkmuted">已答 {answeredCount}/{QUESTIONS.length} 问 · 全部可跳过</p>
          </div>
        </section>

        {/* 结果 */}
        {evaluated && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="mt-8 rounded-2xl border border-gold/20 bg-deep p-6 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[18px] font-bold tracking-[0.1em] text-silktext">环境检查提示</h2>
              <span className="rounded-full border border-golddim/40 px-3 py-1 text-[11px] tracking-[0.1em] text-golddim">
                {hints.length} 项 · 文化参详 · 非吉凶结论
              </span>
            </div>
            {hints.length === 0 ? (
              <p className="mt-6 text-[13.5px] leading-[1.9] text-silkmuted">
                未命中检查项——宅局状态良好。传统上认为「宅有五实」为安居之象；
                保持通风、采光与围护完整即可。（《宅经》通识转译，不作吉凶断言）
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {hints.map((h) => (
                  <li key={h.ruleId} className="rounded-lg border border-golddim/15 bg-black/20 p-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gold/15 px-2 py-0.5 font-mono text-[10.5px] tracking-[0.08em] text-goldbright">
                        {h.ruleId}
                      </span>
                      <span className="text-[11px] text-silkmuted">{h.source.sourceWork}</span>
                    </div>
                    <p className="mt-2 text-[13.5px] leading-[1.9] text-silktext/90">{h.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        )}

        {/* 公版原文依据 */}
        <section className="mt-8 rounded-2xl border border-gold/20 bg-silk2 p-6 sm:p-8">
          <h2 className="font-serif text-[18px] font-bold tracking-[0.1em] text-inktext">公版原文依据</h2>
          <ul className="mt-4 space-y-3">
            {[
              { book: '宅经', quote: '「宅有五虚，令人贫耗；五实，令人富贵。」', note: '（传世本《宅经》通识——本页仅取「空间充实/虚耗」的居住观察，不取贫富断语。）' },
              { book: '宅经', quote: '「宅大人少，一虚也。」', note: '（大宅少人 → 维护成本与空置风险提示，非吉凶判断。）' },
              { book: '宅经', quote: '「宅乃渐昌，勿弃宫堂；不衰莫移，故为受殃。」', note: '（传统上劝人审慎迁移——本页转译为「动土与搬迁前先做结构与环境检查」。）' },
            ].map((q) => (
              <li key={q.quote} className="rounded-lg border border-golddim/15 bg-white/40 p-4">
                <p className="font-serif text-[14px] text-inktext">
                  《{q.book}》{q.quote}
                </p>
                <p className="mt-1.5 text-[12px] leading-[1.8] text-inkmuted">{q.note}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
