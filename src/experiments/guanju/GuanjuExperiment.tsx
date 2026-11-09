/**
 * 紫府·观居网页实验。只在 Vite DEV 中挂载。
 * 静态示例，不请求 AI、上传、定位、支付或账号。
 */
import { useState, type FormEvent, type KeyboardEvent } from "react"
import { Check, ChevronLeft } from "lucide-react"
import BrandLogo from "@/components/BrandLogo"
import { ZifuButton } from "@/components/Buttons"
import { Card, CardContent } from "@/components/Card"
import FeatureStatusBadge from "@/components/FeatureStatusBadge"
import { PreviewBannerBar } from "@/components/PreviewBanner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import FloorSketch from "@/experiments/guanju/FloorSketch"
import {
  DIRECTIONS,
  EXAMPLE_ID,
  FOCUSES,
  PRESET_QUESTIONS,
  SAMPLE_VERSION,
  directionLabel,
  focusLabel,
  gapMessage,
  observationItems,
  resolveReading,
  type Direction,
  type Focus,
  type PresetQuestionId,
} from "@/experiments/guanju/sample"
import {
  SESSION_COPY,
  clearSession,
  readSession,
  writeSession,
  type SessionRecord,
} from "@/experiments/guanju/session"
import { usePageMeta } from "@/lib/page-meta"
import { cn } from "@/lib/utils"

type Step = "home" | "plan" | "result" | "ask" | "save"

const STEP_TITLE: Record<Step, string> = {
  home: "观居 · 实验首页",
  plan: "观居 · 确认示例空间",
  result: "观居 · 示例解读",
  ask: "观居 · 示例对话",
  save: "观居 · 本次方案",
}

const DEMO_LINE = "网页实验 · 全部为演示数据 · 无真实 AI 分析"

export default function GuanjuExperiment() {
  const [step, setStep] = useState<Step>("home")
  const [direction, setDirection] = useState<Direction | null>(null)
  const [focuses, setFocuses] = useState<Focus[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<PresetQuestionId[]>([])
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [emptySaved, setEmptySaved] = useState(false)
  const [hasSaved, setHasSaved] = useState(() => {
    const result = readSession()
    return result.ok && result.record !== null
  })
  const [homeNote, setHomeNote] = useState<string | null>(() => {
    const result = readSession()
    return result.ok ? null : result.message
  })

  usePageMeta(`紫府 · ${STEP_TITLE[step]}`, DEMO_LINE)

  function refreshHome() {
    const result = readSession()
    if (!result.ok) {
      setHasSaved(false)
      setHomeNote(result.message)
      return
    }
    setHasSaved(result.record !== null)
    setHomeNote(null)
  }

  function go(next: Step) {
    if (next === "home") refreshHome()
    if (next === "save") setEmptySaved(false)
    setStep(next)
    window.scrollTo(0, 0)
  }

  function toggleFocus(id: Focus) {
    setFocuses((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
    setFormError(null)
  }

  function onDirectionKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const ids = DIRECTIONS.map((item) => item.id)
    const focusedId = document.activeElement?.id.replace("guanju-direction-", "") ?? ""
    const focusIndex = ids.indexOf(focusedId as Direction)
    const selectedIndex = direction ? ids.indexOf(direction) : -1
    const index = focusIndex >= 0 ? focusIndex : selectedIndex
    let next = 0
    if (event.key === "Home") next = 0
    else if (event.key === "End") next = ids.length - 1
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % ids.length
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = index < 0 ? ids.length - 1 : (index - 1 + ids.length) % ids.length
    }
    const id = ids[next]
    if (!id) return
    setDirection(id)
    setFormError(null)
    document.getElementById(`guanju-direction-${id}`)?.focus()
  }

  function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!direction) {
      setFormError("请选择手动方向，或点「不确定」。未选择时不会生成解读。")
      document.getElementById("guanju-direction-north")?.focus()
      return
    }
    if (focuses.length === 0) {
      setFormError("请至少选择一个关注点。")
      document.getElementById("guanju-focus-light")?.focus()
      return
    }
    setFormError(null)
    go("result")
  }

  function applyRecord(record: SessionRecord) {
    setDirection(record.direction)
    setFocuses(record.focuses)
    setChecks(record.checks)
    setEmptySaved(false)
  }

  function reopen(from: "home" | "save") {
    const result = readSession()
    if (!result.ok) {
      if (from === "home") setHomeNote(result.message)
      else setSaveError(result.message)
      return
    }
    if (!result.record) {
      if (from === "home") setHomeNote(SESSION_COPY.empty)
      else {
        setSaveError(null)
        setSaveMessage(SESSION_COPY.empty)
        setEmptySaved(true)
      }
      setHasSaved(false)
      return
    }
    applyRecord(result.record)
    setSaveError(null)
    setSaveMessage(SESSION_COPY.reopened)
    setHasSaved(true)
    setHomeNote(null)
    setStep("save")
    window.scrollTo(0, 0)
  }

  function saveCurrent() {
    if (!direction || focuses.length === 0) return
    const items = observationItems(direction, focuses)
    const nextChecks: Record<string, boolean> = {}
    for (const item of items) nextChecks[item.id] = Boolean(checks[item.id])
    const result = writeSession({
      sampleVersion: SAMPLE_VERSION,
      exampleId: EXAMPLE_ID,
      direction,
      focuses,
      checks: nextChecks,
    })
    if (!result.ok) {
      setSaveError(result.message)
      setSaveMessage(null)
      setHasSaved(false)
      return
    }
    setChecks(nextChecks)
    setSaveError(null)
    setSaveMessage(result.message)
    setEmptySaved(false)
    setHasSaved(true)
  }

  function clearSaved() {
    const result = clearSession()
    if (!result.ok) {
      setSaveError(result.message)
      return
    }
    setHasSaved(false)
    setSaveError(null)
    setSaveMessage(result.message)
    setEmptySaved(true)
  }

  function clearFromHome() {
    const result = clearSession()
    if (!result.ok) {
      setHomeNote(result.message)
      return
    }
    setHasSaved(false)
    setHomeNote(result.message)
  }

  const reading = direction && focuses.length > 0 ? resolveReading(direction, focuses) : null
  const items = direction && focuses.length > 0 ? observationItems(direction, focuses) : []

  return (
    <main className="guanju-exp mx-auto min-h-[100dvh] w-full max-w-[430px] bg-silk text-[16px] leading-[1.75] text-inktext" data-guanju-step={step}>
      <style>
        {`
          .guanju-exp,
          .guanju-exp * {
            transition-duration: 0.01ms;
          }
          .guanju-exp .guanju-badge p {
            color: rgb(var(--ink-text));
            display: flex;
            width: 100%;
            align-items: flex-start;
          }
          .guanju-exp .guanju-badge p span { min-width: 0; }
          .guanju-exp [data-slot="accordion-trigger"] svg { color: rgb(var(--ink-text)); }
          .guanju-exp :focus-visible { scroll-margin-top: 11rem; }
          @media (prefers-reduced-motion: no-preference) {
            .guanju-step { animation: guanju-in 180ms ease; }
            @keyframes guanju-in { from { opacity: 0; } to { opacity: 1; } }
          }
        `}
      </style>
      <header className="sticky top-0 z-20 bg-silk">
        <PreviewBannerBar className="w-full items-start rounded-none px-4 py-2.5 text-[16px] font-normal leading-snug tracking-normal">
          {DEMO_LINE}
        </PreviewBannerBar>
        <div className="flex items-center justify-between gap-3 bg-deep px-4 py-2">
          <BrandLogo variant="reverse" size={28} title="紫府" />
          <p className="font-serif text-[15px] tracking-[0.16em] text-silk">观居</p>
        </div>
        {step === "ask" ? (
          <p className="flex min-h-12 items-center justify-center gap-2 border-b border-deep/20 px-4 text-[16px] text-inktext">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-deep" />
            未连接 AI
          </p>
        ) : null}
      </header>
      <div className="px-4 pb-16 pt-4">
        <div className="guanju-badge -mx-4 mb-6">
          <FeatureStatusBadge kind="demo" text={DEMO_LINE} className="max-w-none px-4 pb-0 pt-0 sm:px-4 md:px-4" />
        </div>
        <div key={step} className="guanju-step">
          {step === "home" ? (
            <Home
              hasSaved={hasSaved}
              homeNote={homeNote}
              onStart={() => go("plan")}
              onReopen={() => reopen("home")}
              onClear={clearFromHome}
            />
          ) : null}
          {step === "plan" ? (
            <Plan
              direction={direction}
              focuses={focuses}
              formError={formError}
              onDirection={(id) => {
                setDirection(id)
                setFormError(null)
              }}
              onDirectionKeyDown={onDirectionKeyDown}
              onToggleFocus={toggleFocus}
              onSubmit={submitPlan}
              onBack={() => go("home")}
            />
          ) : null}
          {step === "result" && direction && reading ? (
            <Result
              direction={direction}
              focuses={focuses}
              reading={reading}
              onBack={() => go("plan")}
              onAsk={() => go("ask")}
            />
          ) : null}
          {step === "ask" && direction ? (
            <Ask
              direction={direction}
              focuses={focuses}
              revealed={revealed}
              onReveal={(id) =>
                setRevealed((prev) => (prev.includes(id) ? prev : [...prev, id]))
              }
              onBack={() => go("result")}
              onSave={() => go("save")}
            />
          ) : null}
          {step === "save" && direction ? (
            <Save
              direction={direction}
              focuses={focuses}
              items={items}
              checks={checks}
              emptySaved={emptySaved}
              message={saveMessage}
              error={saveError}
              onToggle={(id) => setChecks((prev) => ({ ...prev, [id]: !prev[id] }))}
              onSave={saveCurrent}
              onReopen={() => reopen("save")}
              onClear={clearSaved}
              onBack={() => go("ask")}
              onAdjust={() => go("plan")}
              onHome={() => go("home")}
            />
          ) : null}
        </div>
      </div>
    </main>
  )
}

function BackButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 inline-flex min-h-12 items-center gap-1 rounded-lg px-1 text-[16px] text-inktext outline-none focus-visible:ring-2 focus-visible:ring-deep focus-visible:ring-offset-2 focus-visible:ring-offset-silk"
    >
      <ChevronLeft className="h-5 w-5" aria-hidden />
      {children}
    </button>
  )
}

function Eyebrow({ children }: { children: string }) {
  return (
    <div className="mb-4">
      <p className="font-serif text-[14px] tracking-[0.16em] text-inktext">{children}</p>
      <div className="mt-3 h-0.5 w-10 bg-gold" aria-hidden />
    </div>
  )
}

function Home({
  hasSaved,
  homeNote,
  onStart,
  onReopen,
  onClear,
}: {
  hasSaved: boolean
  homeNote: string | null
  onStart: () => void
  onReopen: () => void
  onClear: () => void
}) {
  return (
    <section>
      <Eyebrow>紫府 · 观居</Eyebrow>
      <h1 className="font-serif text-[26px] font-bold leading-snug tracking-[0.16em] text-inktext">观一室 · 安日常</h1>
      <p className="mt-3 text-[16px] leading-[1.75] text-inktext">从空间布局读传统文化，也照看日常起居。</p>
      <Card className="mt-6">
        <CardContent className="px-4 py-4">
          <FloorSketch decorative />
          <p className="mt-3 text-[16px] leading-[1.75] text-inktext">两室一厅 · 示例 A · 示例非测绘</p>
        </CardContent>
      </Card>
      <ZifuButton type="button" variant="primary" className="mt-6 w-full min-h-12 text-[16px] focus-visible:ring-deep" onClick={onStart}>
        体验示例户型
      </ZifuButton>
      {hasSaved ? (
        <div className="mt-4">
          <p className="text-[16px] leading-[1.75] text-inktext">本次会话里有一份示例方案。{SESSION_COPY.cloud}</p>
          <ZifuButton type="button" variant="secondary" className="mt-3 w-full min-h-12 border-2 border-deep text-[16px] focus-visible:ring-deep" onClick={onReopen}>
            重新打开本次方案
          </ZifuButton>
        </div>
      ) : null}
      {homeNote ? (
        <div className="mt-4" role="status">
          <p className="text-[16px] leading-[1.75] text-inktext">{homeNote}</p>
          {homeNote !== SESSION_COPY.cleared ? (
            <ZifuButton type="button" variant="secondary" className="mt-3 w-full min-h-12 border-2 border-deep text-[16px] focus-visible:ring-deep" onClick={onClear}>
              清除本次示例
            </ZifuButton>
          ) : null}
        </div>
      ) : null}
      <Accordion type="single" collapsible className="mt-8 border-t border-deep/15">
        <AccordionItem value="scope" className="border-deep/15">
          <AccordionTrigger className="min-h-12 py-3 text-left text-[16px] font-normal text-inktext hover:no-underline">
            本实验能做什么
          </AccordionTrigger>
          <AccordionContent className="text-[16px] leading-[1.75] text-inktext">
            <ul className="list-disc space-y-2 pl-5">
              <li>用一套虚构平面，把传统空间叙事和生活观察分开来读。</li>
              <li>三个问题都是预设的，回复立刻出现，没有连接 AI。</li>
              <li>方案只留在本次浏览器会话，可以重新打开，也可以清除。</li>
              <li>不上传照片，不定位，不收生辰、住址或联系方式。</li>
              <li>不打吉凶分，不承诺改运、健康或财物。</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <ZifuButton to="/" variant="secondary" className="mt-6 w-full min-h-12 border-2 border-deep text-[16px] focus-visible:ring-deep">
        返回紫府首页
      </ZifuButton>
    </section>
  )
}

function Plan({
  direction,
  focuses,
  formError,
  onDirection,
  onDirectionKeyDown,
  onToggleFocus,
  onSubmit,
  onBack,
}: {
  direction: Direction | null
  focuses: Focus[]
  formError: string | null
  onDirection: (id: Direction) => void
  onDirectionKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onToggleFocus: (id: Focus) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBack: () => void
}) {
  return (
    <section>
      <BackButton onClick={onBack}>返回</BackButton>
      <Eyebrow>示例 A</Eyebrow>
      <h1 className="font-serif text-[26px] font-bold leading-snug tracking-[0.12em] text-inktext">确认示例空间</h1>
      <p className="mt-3 text-[16px] leading-[1.75] text-inktext">两室一厅 · 示例 A。下面的方向由你手动指定，只更换演示说明。</p>
      <Card className="mt-6">
        <CardContent className="px-4 py-4">
          <FloorSketch />
        </CardContent>
      </Card>
      <form className="mt-6" onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend id="guanju-direction-legend" className="text-[16px] font-medium text-inktext">
            手动方向
          </legend>
          <p className="mt-1 text-[14px] leading-[1.6] text-inktext">含「不确定」。不确定时不做方位解释。</p>
          <div
            role="radiogroup"
            aria-labelledby="guanju-direction-legend"
            aria-required="true"
            aria-invalid={formError && !direction ? true : undefined}
            aria-describedby={formError ? "guanju-form-error" : undefined}
            className="mt-3 grid grid-cols-2 gap-2"
            onKeyDown={onDirectionKeyDown}
          >
            {DIRECTIONS.map((item) => {
              const selected = direction === item.id
              return (
                <button
                  key={item.id}
                  id={`guanju-direction-${item.id}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onDirection(item.id)}
                  className={cn(
                    "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 px-3 text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-deep focus-visible:ring-offset-2 focus-visible:ring-offset-silk",
                    item.id === "unknown" && "col-span-2",
                    selected ? "border-deep bg-deep text-silk" : "border-deep bg-silk text-inktext",
                  )}
                >
                  {selected ? <Check className="h-4 w-4" aria-hidden /> : null}
                  {item.label}
                </button>
              )
            })}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend id="guanju-focus-legend" className="text-[16px] font-medium text-inktext">
            关注点
          </legend>
          <p className="mt-1 text-[14px] leading-[1.6] text-inktext">可多选。至少选一项。</p>
          <div role="group" aria-labelledby="guanju-focus-legend" className="mt-3 grid grid-cols-3 gap-2">
            {FOCUSES.map((item) => {
              const selected = focuses.includes(item.id)
              return (
                <button
                  key={item.id}
                  id={`guanju-focus-${item.id}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onToggleFocus(item.id)}
                  className={cn(
                    "inline-flex min-h-12 items-center justify-center gap-1 rounded-lg border-2 px-2 text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-deep focus-visible:ring-offset-2 focus-visible:ring-offset-silk",
                    selected ? "border-deep bg-deep text-silk" : "border-deep bg-silk text-inktext",
                  )}
                >
                  {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                  {item.label}
                </button>
              )
            })}
          </div>
        </fieldset>
        {formError ? (
          <p id="guanju-form-error" role="alert" className="mt-4 text-[16px] leading-[1.75] text-inktext">
            {formError}
          </p>
        ) : null}
        <ZifuButton type="submit" variant="primary" className="mt-6 w-full min-h-12 text-[16px] focus-visible:ring-deep">
          查看示例解读
        </ZifuButton>
      </form>
      <p className="mt-4 text-[14px] leading-[1.6] text-inktext">样例版本 {SAMPLE_VERSION}</p>
    </section>
  )
}

function AdviceBlock({
  title,
  place,
  basis,
  suggestion,
  limit,
  why,
  whyId,
}: {
  title: string
  place: string
  basis: string
  suggestion: string
  limit: string
  why: string
  whyId: string
}) {
  return (
    <Card>
      <CardContent className="px-4 py-4">
        <h3 className="font-serif text-[18px] font-bold tracking-[0.08em] text-inktext">{title}</h3>
        <dl className="mt-3 space-y-3 text-[16px] leading-[1.75] text-inktext">
          <div>
            <dt className="font-medium">图中位置</dt>
            <dd>{place}</dd>
          </div>
          <div>
            <dt className="font-medium">依据</dt>
            <dd>{basis}</dd>
          </div>
          <div>
            <dt className="font-medium">建议</dt>
            <dd>{suggestion}</dd>
          </div>
          <div>
            <dt className="font-medium">限制</dt>
            <dd>{limit}</dd>
          </div>
        </dl>
        <Accordion type="single" collapsible className="mt-2">
          <AccordionItem value={whyId} className="border-0">
            <AccordionTrigger className="min-h-12 py-3 text-left text-[16px] font-normal text-inktext hover:no-underline">
              为何这样建议
            </AccordionTrigger>
            <AccordionContent className="text-[16px] leading-[1.75] text-inktext">{why}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

function Result({
  direction,
  focuses,
  reading,
  onBack,
  onAsk,
}: {
  direction: Direction
  focuses: Focus[]
  reading: ReturnType<typeof resolveReading>
  onBack: () => void
  onAsk: () => void
}) {
  const gap = gapMessage(direction, reading.missing, reading.covered.length)
  const inputLine = `本次输入：示例 A / ${directionLabel(direction)} / ${focuses.map((id) => focusLabel(id)).join("、")}`
  return (
    <section>
      <BackButton onClick={onBack}>返回调整</BackButton>
      <Eyebrow>示例解读</Eyebrow>
      <h1 className="font-serif text-[26px] font-bold leading-snug tracking-[0.12em] text-inktext">分开来看</h1>
      <p className="mt-3 text-[16px] leading-[1.75] text-inktext">{inputLine}</p>
      <aside className="mt-4 rounded-lg border-2 border-deep px-4 py-3 text-[16px] leading-[1.75] text-inktext">
        {reading.orientationNote}
      </aside>
      {gap ? (
        <p role="status" className="mt-4 rounded-lg border-2 border-deep px-4 py-3 text-[16px] leading-[1.75] text-inktext">
          {gap}
        </p>
      ) : null}
      {reading.covered.length > 0 ? (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="font-serif text-[22px] font-bold tracking-[0.08em] text-inktext">生活观察建议</h2>
            <div className="mt-4 space-y-4">
              {reading.covered.map((item) => (
                <AdviceBlock
                  key={`life-${item.focus}`}
                  whyId={`life-${item.focus}`}
                  title={focusLabel(item.focus)}
                  place={item.life.place}
                  basis={item.life.basis}
                  suggestion={item.life.suggestion}
                  limit={item.life.limit}
                  why={item.life.why}
                />
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-serif text-[22px] font-bold leading-snug tracking-[0.08em] text-inktext">传统文化阅读（非科学结论）</h2>
            <div className="mt-4 space-y-4">
              {reading.covered.map((item) => (
                <AdviceBlock
                  key={`culture-${item.focus}`}
                  whyId={`culture-${item.focus}`}
                  title={focusLabel(item.focus)}
                  place={item.culture.place}
                  basis={item.culture.basis}
                  suggestion={item.culture.suggestion}
                  limit={item.culture.limit}
                  why={item.culture.why}
                />
              ))}
            </div>
          </section>
        </div>
      ) : null}
      <ZifuButton type="button" variant="primary" className="mt-8 w-full min-h-12 text-[16px] focus-visible:ring-deep" onClick={onAsk}>
        继续问一问（示例）
      </ZifuButton>
      <ZifuButton type="button" variant="secondary" className="mt-3 w-full min-h-12 border-2 border-deep text-[16px] focus-visible:ring-deep" onClick={onBack}>
        调整示例条件
      </ZifuButton>
    </section>
  )
}

function Ask({
  direction,
  focuses,
  revealed,
  onReveal,
  onBack,
  onSave,
}: {
  direction: Direction
  focuses: Focus[]
  revealed: PresetQuestionId[]
  onReveal: (id: PresetQuestionId) => void
  onBack: () => void
  onSave: () => void
}) {
  return (
    <section>
      <BackButton onClick={onBack}>返回解读</BackButton>
      <Eyebrow>示例对话</Eyebrow>
      <h1 className="font-serif text-[26px] font-bold leading-snug tracking-[0.12em] text-inktext">问一问 · 示例对话</h1>
      <p className="mt-3 text-[16px] leading-[1.75] text-inktext">预置回复，未连接 AI。点问题后立刻显示写好的答案。这里没有输入框。</p>
      <Card className="mt-4">
        <CardContent className="px-4 py-4 text-[16px] leading-[1.75] text-inktext">
          <p className="font-medium">当前示例</p>
          <p className="mt-1">
            示例 A / {directionLabel(direction)} / {focuses.length > 0 ? focuses.map((id) => focusLabel(id)).join("、") : "未选关注点"}
          </p>
        </CardContent>
      </Card>
      <div className="mt-4 space-y-3">
        {PRESET_QUESTIONS.map((item) => {
          const open = revealed.includes(item.id)
          return (
            <div key={item.id} className="rounded-lg border-2 border-deep">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => onReveal(item.id)}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-[16px] leading-[1.6] text-inktext outline-none focus-visible:ring-2 focus-visible:ring-deep focus-visible:ring-offset-2 focus-visible:ring-offset-silk"
              >
                <span>{item.q}</span>
                <span className="shrink-0 text-[14px]">{open ? "已显示" : "查看"}</span>
              </button>
              <div aria-live="polite">
                {open ? <p className="border-t border-deep/20 px-4 py-3 text-[16px] leading-[1.75] text-inktext">{item.a}</p> : null}
              </div>
            </div>
          )
        })}
      </div>
      <ZifuButton type="button" variant="primary" className="mt-6 w-full min-h-12 text-[16px] focus-visible:ring-deep" onClick={onSave}>
        整理为方案
      </ZifuButton>
    </section>
  )
}

function Save({
  direction,
  focuses,
  items,
  checks,
  emptySaved,
  message,
  error,
  onToggle,
  onSave,
  onReopen,
  onClear,
  onBack,
  onAdjust,
  onHome,
}: {
  direction: Direction
  focuses: Focus[]
  items: ReturnType<typeof observationItems>
  checks: Record<string, boolean>
  emptySaved: boolean
  message: string | null
  error: string | null
  onToggle: (id: string) => void
  onSave: () => void
  onReopen: () => void
  onClear: () => void
  onBack: () => void
  onAdjust: () => void
  onHome: () => void
}) {
  const reading = resolveReading(direction, focuses)
  const gap = gapMessage(direction, reading.missing, reading.covered.length)
  return (
    <section>
      <BackButton onClick={onBack}>返回问答</BackButton>
      <Eyebrow>本次方案</Eyebrow>
      <h1 className="font-serif text-[26px] font-bold leading-snug tracking-[0.12em] text-inktext">整理示例</h1>
      <p className="mt-3 text-[16px] leading-[1.75] text-inktext">{SESSION_COPY.cloud}</p>
      {emptySaved ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-deep px-4 py-6" role="status">
          <h2 className="font-serif text-[20px] font-bold text-inktext">本次会话已清空</h2>
          <p className="mt-2 text-[16px] leading-[1.75] text-inktext">没有可重新打开的示例方案。可以返回调整后再保存一次。</p>
          <ZifuButton type="button" variant="primary" className="mt-4 w-full min-h-12 text-[16px] focus-visible:ring-deep" onClick={onAdjust}>
            返回调整
          </ZifuButton>
          <ZifuButton type="button" variant="secondary" className="mt-3 w-full min-h-12 border-2 border-deep text-[16px] focus-visible:ring-deep" onClick={onHome}>
            回到实验首页
          </ZifuButton>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <Card>
            <CardContent className="px-4 py-4 text-[16px] leading-[1.75] text-inktext">
              <h2 className="font-serif text-[18px] font-bold">方案摘要</h2>
              <p className="mt-2">两室一厅 · 示例 A · 示例非测绘</p>
              <p>方向：{directionLabel(direction)}</p>
              <p>关注点：{focuses.map((id) => focusLabel(id)).join("、")}</p>
              <p className="mt-2">{reading.orientationNote}</p>
              <p className="mt-2 text-[14px] leading-[1.6]">样例版本 {SAMPLE_VERSION}</p>
            </CardContent>
          </Card>
          {gap ? (
            <p role="status" className="rounded-lg border-2 border-deep px-4 py-3 text-[16px] leading-[1.75] text-inktext">
              {gap}
            </p>
          ) : null}
          {reading.covered.length > 0 ? (
            <>
              <Card>
                <CardContent className="px-4 py-4 text-[16px] leading-[1.75] text-inktext">
                  <h2 className="font-serif text-[18px] font-bold">生活观察建议</h2>
                  <ul className="mt-2 list-disc space-y-2 pl-5">
                    {reading.covered.map((item) => (
                      <li key={item.focus}>
                        {focusLabel(item.focus)}：{item.life.suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-4 py-4 text-[16px] leading-[1.75] text-inktext">
                  <h2 className="font-serif text-[18px] font-bold">传统文化阅读（非科学结论）</h2>
                  <ul className="mt-2 list-disc space-y-2 pl-5">
                    {reading.covered.map((item) => (
                      <li key={item.focus}>
                        {focusLabel(item.focus)}：{item.culture.suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : null}
          <div>
            <h2 className="font-serif text-[18px] font-bold text-inktext">观察清单</h2>
            {items.length === 0 ? (
              <p className="mt-2 text-[16px] leading-[1.75] text-inktext">这个组合没有观察清单。请先改到有示例文案的方向或关注点。</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <label className="flex min-h-12 items-start gap-3 rounded-lg border-2 border-deep px-3 py-3 text-[16px] leading-[1.6] text-inktext has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-deep">
                      <input
                        type="checkbox"
                        className="mt-1 size-5 shrink-0"
                        style={{ accentColor: "rgb(var(--deep))" }}
                        checked={Boolean(checks[item.id])}
                        onChange={() => onToggle(item.id)}
                      />
                      <span>{item.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ZifuButton type="button" variant="primary" className="w-full min-h-12 text-[16px] focus-visible:ring-deep" onClick={onSave}>
            保存到本次会话
          </ZifuButton>
        </div>
      )}
      {message ? (
        <p role="status" className="mt-4 text-[16px] leading-[1.75] text-inktext">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-[16px] leading-[1.75] text-inktext">
          {error}
        </p>
      ) : null}
      <div className="mt-4 space-y-3">
        <ZifuButton type="button" variant="secondary" className="w-full min-h-12 border-2 border-deep text-[16px] focus-visible:ring-deep" onClick={onReopen}>
          重新打开
        </ZifuButton>
        <ZifuButton type="button" variant="secondary" className="w-full min-h-12 border-2 border-deep text-[16px] focus-visible:ring-deep" onClick={onClear}>
          清除本次示例
        </ZifuButton>
      </div>
    </section>
  )
}
