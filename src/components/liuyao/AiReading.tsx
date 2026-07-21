import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GhostButton } from '@/components/Buttons'
import SectionHeading from '@/components/SectionHeading'
import { SegmentedControl } from '@/components/FormControls'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Hexagram } from '@/components/liuyao/logic'

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

/** 分段打字机 */
function Typewriter({ paragraphs, charMs = 22 }: { paragraphs: string[]; charMs?: number }) {
  const total = useMemo(() => paragraphs.reduce((n, p) => n + p.length, 0), [paragraphs])
  const [typed, setTyped] = useState(0)
  // 文本变化时重置打字进度：在渲染期间按上一次总字数派生调整，避免 effect 内同步 setState
  const [prevTotal, setPrevTotal] = useState(total)
  if (prevTotal !== total) {
    setPrevTotal(total)
    setTyped(0)
  }
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTyped((v) => {
        if (v >= total) {
          window.clearInterval(timer)
          return v
        }
        return v + 1
      })
    }, charMs)
    return () => window.clearInterval(timer)
  }, [total, charMs])

  // 先算好每段应显示的字数，避免在渲染闭包中改写剩余额度
  const shownCounts: number[] = []
  let left = typed
  for (const p of paragraphs) {
    shownCounts.push(Math.max(0, Math.min(p.length, left)))
    left -= p.length
  }
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => {
        const shown = shownCounts[i]
        if (shown === 0) return null
        return (
          <p key={i} className="font-serif text-[15.5px] leading-[2.1] text-silktext">
            {p.slice(0, shown)}
            {shown < p.length && <span className="animate-caret-blink text-goldbright">▍</span>}
          </p>
        )
      })}
    </div>
  )
}

function buildReading(
  persona: Persona,
  depth: Depth,
  ben: Hexagram,
  bian: Hexagram | null,
  movingIdx: number[],
  question: string,
): string[] {
  const movingTexts = movingIdx.map((i) => ben.yao[i])
  const q = question ? `所问「${question}」，` : ''
  if (persona === 'scholar') {
    if (depth === 'pro') {
      const p1 = `${q}得《${ben.name}》${bian ? `之《${bian.name}` : '，六爻安静'}。卦辞云：「${ben.gua}」——《周易》立象，先观卦体之大义。`
      const p2 = movingIdx.length
        ? `动在${movingIdx.map((i) => `第${['一', '二', '三', '四', '五', '六'][i]}爻`).join('、')}，爻辞曰：「${movingTexts.join('」「')}」。《增删卜易》论动爻之用，重在生克冲合；动者为事之机，变者为事之归。`
        : '六爻安静，无动爻可取。《卜筮正宗》云：卦成而后，先观世应——静卦以世爻为枢，观其所临生克。'
      const p3 = bian
        ? `变出《${bian.name}》，乃事势之转向。学者之参，当以本卦为体、变卦为用，体用相参，其义自见。`
        : '卦体静定，事多守成，宜循其常而勿轻动。'
      return [p1, p2, p3]
    }
    const p1 = `${q}这一卦是《${ben.name}》${bian ? `，动而之《${bian.name}` : '，六爻安静'}。卦辞说：「${ben.gua}」`
    const p2 = movingIdx.length
      ? `关键的动爻讲：「${movingTexts[0]}」——把这一句放在所问之事上读，重点就清楚了。`
      : '全卦安静，没有特别变动的信号，多主按部就班。'
    return [p1, p2]
  }
  // hermit
  if (depth === 'pro') {
    const p1 = `${q}卦落《${ben.name}》${bian ? `，一转身成了《${bian.name}` : '，纹丝不动'}。老话讲「${ben.gua}」——听着玄，其实就一层窗户纸。`
    const p2 = movingIdx.length
      ? `妙在那${movingIdx.length === 1 ? '一' : '几'}根动爻：「${movingTexts[0]}」。动爻一响，事情就活了一半，剩下的看你怎么接。`
      : '六爻都懒得动，说明这事急不得，茶要一口一口喝。'
    return [p1, p2]
  }
  const p1 = `${q}手里捧着的卦是《${ben.name}》。卦在提醒一句：顺势的时候别端得太满。`
  const p2 = bian
    ? `走着走着会变成《${bian.name}》的局面——收着点，反而顺。`
    : '卦也安静，人也别急，守住眼前这一亩三分地就好。'
  return [p1, p2]
}

type AiReadingProps = {
  ben: Hexagram
  bian: Hexagram | null
  movingIdx: number[]
  question: string
}

/** S4 · AI 参详（深色）：人格 × 深度 → mock 输出 */
export default function AiReading({ ben, bian, movingIdx, question }: AiReadingProps) {
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('pro')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [started, setStarted] = useState(false)

  const paragraphs = useMemo(
    () => buildReading(persona, depth, ben, bian, movingIdx, question),
    [persona, depth, ben, bian, movingIdx, question],
  )

  return (
    <div>
      <SectionHeading
        dark
        eyebrow="AI READING"
        title="AI 参详"
        sub="两种人格 × 两种深度，锚定《周易》原文与《增删卜易》《卜筮正宗》语类逐句引经"
      />

      <div className="mx-auto mt-12 max-w-3xl">
        <div className="flex flex-col items-center gap-5">
          <SegmentedControl<Persona>
            id="ly-persona"
            value={persona}
            onChange={setPersona}
            options={[
              { value: 'scholar', label: '严谨学者 SCHOLAR' },
              { value: 'hermit', label: '幽默隐士 HERMIT' },
            ]}
          />
          <SegmentedControl<Depth>
            id="ly-depth"
            value={depth}
            onChange={setDepth}
            options={[
              { value: 'pro', label: '专业级 · 完整推演' },
              { value: 'plain', label: '通俗级 · 直给结论' },
            ]}
          />
        </div>

        {!started ? (
          <div className="mt-12 flex flex-col items-center">
            <GhostButton className="animate-gold-breathe" onClick={() => setDialogOpen(true)}>
              参详此卦 · 6 灵签
            </GhostButton>
            <p className="mt-4 text-[12.5px] tracking-[0.12em] text-silkmuted">
              本次起卦：{ben.name}
              {bian ? ` 之 ${bian.name}` : ' · 六爻安静'}
            </p>
          </div>
        ) : (
          <div className="mt-12 rounded-xl border-l-[3px] border-gold bg-deep2/60 p-8">
            <p className="text-[12px] tracking-[0.2em] text-silkmuted">
              参详输出 · {persona === 'scholar' ? '严谨学者' : '幽默隐士'} ·{' '}
              {depth === 'pro' ? '专业级' : '通俗级'}
            </p>
            <div className="mt-5 min-h-[180px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${persona}-${depth}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24 }}
                >
                  <Typewriter paragraphs={paragraphs} />
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="mt-6 border-t border-gold/15 pt-4 text-[12.5px] text-silkmuted">
              演示输出 · 正式参详逐句锚定古籍原文出处
            </p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-golddim/30 bg-silk sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-[20px] tracking-[0.12em] text-inktext">
              参详此卦
            </DialogTitle>
            <DialogDescription className="text-[13.5px] leading-[1.9] text-inkmuted">
              将消耗 <span className="font-serif text-[16px] font-bold text-golddim">6</span>{' '}
              灵签，为《{ben.name}》{bian ? `之《${bian.name}》` : ''}
              生成逐句引经的 AI 参详。当前为演示模式，输出为 mock 预览。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <GhostButton
              className="!border-golddim/50 !text-golddim hover:!bg-golddim/10"
              onClick={() => setDialogOpen(false)}
            >
              再想想
            </GhostButton>
            <button
              onClick={() => {
                setDialogOpen(false)
                setStarted(true)
              }}
              className="zf-btn inline-flex items-center justify-center rounded-full px-8 py-3 font-sans text-[14.5px] font-medium tracking-[0.14em] text-[#0B3B39] [background:linear-gradient(135deg,rgb(var(--gold-bright)),rgb(var(--gold)))]"
            >
              开始参详
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
