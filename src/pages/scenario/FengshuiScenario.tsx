/**
 * 阳宅风水参详——真实功能页（YZ-01~09 环境检查引擎 + 《宅经》公版依据）。
 * 边界：只输出可验证的环境与工程检查建议，不输出吉凶或方位断言。
 */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import LoupanDial from '@/components/fengshui/LoupanDial'
import FloorPlanEditor, { type FloorPlanMark } from '@/components/fengshui/FloorPlanEditor'
import { analyzeFloorPlan } from '@/components/fengshui/floor-plan-logic'
import {
  evaluateYangzhai,
  type TraditionalSystem,
  type YangzhaiInput,
} from '@/lib/fengshui-rules'
import { STORAGE_KEYS, useSafeStorage } from '@/lib/storage'

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]
const POSITION_NAMES = ['东南', '南', '西南', '东', '中宫', '西', '东北', '北', '西北'] as const

type FormAnswer = string | string[] | undefined
type FormAnswers = Record<string, FormAnswer>

/** 表单问题（文化化表述 → YangzhaiInput 字段） */
const QUESTIONS: {
  key: keyof YangzhaiInput
  label: string
  hint: string
  kind: 'select' | 'bool' | 'multi' | 'number'
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
    key: 'floorNumber',
    label: '住宅所在楼层',
    hint: '用于结合周边遮挡、风环境与噪声复核，不作楼层吉凶推演',
    kind: 'number',
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
    key: 'crossBreezeOverStove',
    label: '是否有强穿堂风直吹灶具',
    hint: '观察开门窗或机械通风时，气流是否影响火焰稳定',
    kind: 'bool',
  },
  {
    key: 'hasMeasure',
    label: '是否有真北朝向与现场测量数据',
    hint: '有可靠的真北测量与户型数据 → 是；只有大致方位印象 → 否',
    kind: 'bool',
  },
  {
    key: 'hasSiteData',
    label: '是否有周边环境现场资料',
    hint: '包括建筑遮挡、日照、风、噪声与热环境记录',
    kind: 'bool',
  },
  {
    key: 'ageGenderRequested',
    label: '是否想按出生年匹配住宅',
    hint: '传统「宅命相配」属术数分类，本页只提供说明，不做吉凶判断',
    kind: 'bool',
  },
  {
    key: 'traditionalSystems',
    label: '本次还采用了哪些传统分类',
    hint: '可多选；不同年代的体系必须分别记录来源',
    kind: 'multi',
    options: ['宅经二十四路', '后世八宅', '门主灶', '未采用'],
  },
  {
    key: 'traditionalLabelsConflict',
    label: '不同传统体系的标签是否冲突',
    hint: '只有实际得到相互冲突的标签时才选「是」',
    kind: 'bool',
  },
]

function toInput(
  answers: FormAnswers,
  orientation: number,
  floorMarks: FloorPlanMark[],
  hasFloorPlan: boolean,
): YangzhaiInput {
  const bool = (k: string) => answers[k] === '是'
  const floorValue = Number(answers['floorNumber'])
  const findPosition = (type: FloorPlanMark['type']) => {
    const mark = floorMarks.find((item) => item.type === type)
    return mark ? POSITION_NAMES[mark.cell] : undefined
  }
  const selectedSystems = Array.isArray(answers['traditionalSystems'])
    ? (answers['traditionalSystems'] as string[]).filter((value) => value !== '未采用') as TraditionalSystem[]
    : undefined

  return {
    areaRatio: (answers['areaRatio'] as string) === '偏大' ? '大' : (answers['areaRatio'] as string) === '偏小' ? '小' : '中',
    doorSize: (answers['doorSize'] as string) === '偏大' ? '大' : (answers['doorSize'] as string) === '偏小' ? '小' : '中',
    doorDirectToPrivate: bool('doorDirectToPrivate'),
    maintenanceIssues: Array.isArray(answers['maintenanceIssues'])
      ? (answers['maintenanceIssues'] as string[]).filter((s) => s !== '无明显问题')
      : undefined,
    kitchenAdjacent: bool('kitchenAdjacent'),
    kitchenOnRoute: bool('kitchenOnRoute'),
    crossBreezeOverStove: bool('crossBreezeOverStove'),
    orientationDegrees: orientation,
    floorNumber: Number.isInteger(floorValue) && floorValue > 0 ? floorValue : undefined,
    hasTrueNorth: bool('hasMeasure'),
    hasMeasure: bool('hasMeasure'),
    hasFloorPlan,
    doorPosition: findPosition('door'),
    primaryRoomPosition: findPosition('master'),
    hasSiteData: bool('hasSiteData'),
    ageGenderRequested: bool('ageGenderRequested'),
    traditionalSystems: selectedSystems,
    traditionalLabelsConflict: bool('traditionalLabelsConflict'),
  }
}

export default function FengshuiScenario() {
  const [answers, setAnswers] = useSafeStorage<FormAnswers>(STORAGE_KEYS.FENGSHUI_FORM, {})
  const [evaluated, setEvaluated] = useState(false)
  const [floorMarks, setFloorMarks] = useState<FloorPlanMark[]>([])
  const [floorImage, setFloorImage] = useState<string | null>(null)
  const [orientation, setOrientation] = useState<number>(180)

  const planAdvice = useMemo(
    () => (floorMarks.length > 0 ? analyzeFloorPlan(floorMarks, orientation) : []),
    [floorMarks, orientation],
  )

  const hints = useMemo(() => {
    if (!evaluated) return []
    return evaluateYangzhai(toInput(answers, orientation, floorMarks, floorImage !== null))
  }, [answers, evaluated, floorImage, floorMarks, orientation])

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
          <p className="mx-auto mt-4 max-w-[620px] break-words text-[13.5px] leading-[1.95] text-silkmuted">
            以《黄帝宅经》等公版典籍为据，参详宅向、门主灶布局与空间环境，
            输出可验证的环境检查提示。本页只给检查建议，不给吉凶结论。
          </p>
        </header>

        {/* 户型图参谋 */}
        <section className="mt-10 rounded-2xl border border-gold/25 bg-silk2 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="font-serif text-[16px] font-bold tracking-[0.08em] text-inktext">
              户型图参谋 · 罗盘定位
            </p>
            <span className="rounded-full border border-golddim/40 px-3 py-1 text-[11px] text-inkmuted">
              图仅本机处理 · 不上传
            </span>
          </div>
          <p className="mt-2 text-[12.5px] leading-[1.9] text-inkmuted">
            上传户型图 → 标注大门/主卧/厨房位置 → 用罗盘对准宅向（手机可用系统罗盘测朝向），
            生成门主灶关系与环境参详。
          </p>
          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
            <FloorPlanEditor
              marks={floorMarks}
              onMarksChange={setFloorMarks}
              image={floorImage}
              onImageChange={setFloorImage}
            />
            <LoupanDial degrees={orientation} onChange={setOrientation} />
          </div>

          {/* 户型参详结果 */}
          {planAdvice.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="mt-6 rounded-xl border border-golddim/20 bg-white/50 p-5"
            >
              <p className="font-serif text-[14.5px] font-bold text-inktext">户型参详</p>
              <ul className="mt-3 space-y-2.5">
                {planAdvice.map((a, i) => (
                  <li key={i} className="rounded-lg border border-golddim/10 bg-silk p-3.5">
                    <p className="text-[12px] font-semibold tracking-[0.08em] text-golddim">{a.title}</p>
                    <p className="mt-1 text-[12.5px] leading-[1.85] text-inkmuted">{a.text}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </section>

        {/* 表单卡 */}
        <section className="mt-10 rounded-2xl border border-gold/20 bg-silk2 p-6 sm:p-8">
          <p className="font-serif text-[16px] font-bold tracking-[0.08em] text-inktext">宅局自查 · 十三项</p>
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
                  {q.kind === 'number' && (
                    <input
                      type="number"
                      min={1}
                      max={200}
                      step={1}
                      inputMode="numeric"
                      value={typeof answers[q.key] === 'string' ? answers[q.key] : ''}
                      onChange={(event) => setAnswers((current) => ({ ...current, [q.key]: event.target.value }))}
                      placeholder="请输入楼层"
                      className="w-36 rounded-lg border border-golddim/30 bg-white/60 px-3 py-2 text-[12.5px] text-inktext outline-none focus:border-goldbright"
                    />
                  )}
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
                      const emptyOption = opt === '无明显问题' || opt === '未采用'
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setAnswers((a) => ({
                              ...a,
                              [q.key]: active
                                ? cur.filter((s) => s !== opt)
                                : emptyOption
                                  ? [opt]
                                  : [...cur.filter((s) => s !== '无明显问题' && s !== '未采用'), opt],
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
                      <span
                        className={`rounded px-2 py-0.5 text-[10.5px] font-semibold ${
                          h.verdict === '凶' ? 'bg-red-900/40 text-red-200' : 'bg-amber-800/35 text-amber-100'
                        }`}
                      >
                        检查状态 · {h.verdict}
                      </span>
                      <span className="text-[11px] text-silkmuted">{h.source.sourceWork}</span>
                    </div>
                    <p className="mt-2 text-[13.5px] leading-[1.9] text-silktext/90">{h.message}</p>
                    <p className="mt-2 text-[12.5px] leading-[1.85] text-silkmuted">
                      <span className="text-golddim">化解建议：</span>
                      {h.remedy}
                    </p>
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
