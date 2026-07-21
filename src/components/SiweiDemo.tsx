import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SegmentedControl } from '@/components/FormControls'
import { cn } from '@/lib/utils'

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

const SAMPLES: Record<Persona, Record<Depth, string>> = {
  scholar: {
    pro: '日主庚金生于酉月，金正当令而锐。《穷通宝鉴》论秋金：锐锐之象，喜火炼而忌土埋。盘中丁火透干，主以礼法束其锋；甲木坐寅有根，财星不绝。大运南行，火土相济——格清而有守，宜稳中求进。',
    plain:
      '你的日主是庚金，生在金气最旺的秋天，骨子里自带果断。盘里有火炼金、有木通财，属于‘有锋芒、也收得住’的组合；中年行南方运，整体越走越稳。',
  },
  hermit: {
    pro: '秋金如出鞘之刃，非得丁火这把慢火细细淬过，方成大器。好在寅中甲木是炉里薪炭——火有柴、金有成。后半程运走南方，恰似开炉时辰到了，别急，刀要慢慢磨。',
    plain:
      '这盘像一把好刀：够快，但得学会收。命里带火带木，等于既有磨刀石、又配了刀鞘——急什么？好饭都在后头。',
  },
}

const PERSONAS: { id: Persona; latin: string; name: string; desc: string }[] = [
  { id: 'scholar', latin: 'SCHOLAR', name: '严谨学者', desc: '客观克制，引经据典，如导师般条分缕析' },
  { id: 'hermit', latin: 'HERMIT', name: '幽默隐士', desc: '随性诙谐，妙语点破，如老友围炉夜话' },
]

/** 首页 S6 · 四维交互演示：两种人格 × 两种深度（Framer Motion 交互组件） */
export default function SiweiDemo() {
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('pro')

  return (
    <div className="flex flex-col items-center">
      {/* 行 1：人格 */}
      <div className="gs-reveal flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
        {PERSONAS.map((p) => {
          const active = persona === p.id
          return (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={cn(
                'relative flex-1 rounded-2xl border px-8 py-6 text-left transition-colors sm:max-w-[320px]',
                active
                  ? 'border-transparent bg-silk2'
                  : 'border-golddim/25 bg-silk2/50 hover:border-golddim/50',
              )}
            >
              {active && (
                <motion.span
                  layoutId="persona-frame"
                  className="absolute inset-0 rounded-2xl border-2 border-gold"
                  transition={{ duration: 0.26, ease: 'easeOut' }}
                />
              )}
              <span className="block font-latin text-[12px] font-medium tracking-[0.3em] text-gold">
                {p.latin}
              </span>
              <span className="mt-1.5 block font-serif text-[19px] font-bold tracking-[0.1em] text-inktext">
                {p.name}
              </span>
              <span className="mt-1 block text-[12.5px] leading-[1.8] text-inkmuted">
                {p.desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* 行 2：深度 */}
      <div className="gs-reveal mt-6">
        <SegmentedControl<Depth>
          id="depth"
          value={depth}
          onChange={setDepth}
          options={[
            { value: 'pro', label: '专业级 · 完整推演' },
            { value: 'plain', label: '通俗级 · 直给结论' },
          ]}
        />
      </div>

      {/* 输出示例卡 */}
      <div className="gs-reveal mt-10 w-full">
        <div className="rounded-xl border-l-[3px] border-gold bg-silk2 p-8">
          <p className="text-[12px] tracking-[0.14em] text-inkmuted">参详输出 · 示例文风</p>
          <div className="mt-4 min-h-[150px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${persona}-${depth}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24 }}
                className="font-serif text-[16px] leading-[2.1] text-inktext"
              >
                {SAMPLES[persona][depth]}
              </motion.p>
            </AnimatePresence>
          </div>
          <p className="mt-5 border-t border-golddim/20 pt-4 text-[12.5px] text-inkmuted">
            正式详批中可随时切换人格与深度 · 以上仅为文风示例
          </p>
        </div>
      </div>
    </div>
  )
}
