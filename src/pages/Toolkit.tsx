import type { ComponentType, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import PageHero from '@/components/content/PageHero'
import SectionHeading from '@/components/SectionHeading'
import { TagPill } from '@/components/Buttons'
import FeatureStatusBadge from '@/components/FeatureStatusBadge'
import {
  LodgeTool,
  QianTool,
  WuxingTool,
  ZodiacTool,
} from '@/components/content/ToolkitTools'
/**
 * V11 方向3：GanzhiTool / ShichenTool 改由本页调用层直接接共享引擎
 * @contracts/engines/daily-core（ToolkitTools.tsx 为共用组件文件，保持不动）。
 * INT-02 硬约束：daily-core 月柱为公历月近似（非节气换月），不得上屏——
 * 三柱卡片的月柱继续用 content/ganzhi.ts monthPillar()（节气换月 + 五虎遁）。
 */
import {
  getDailySummary,
  dayJiazi,
  hourLuck as coreHourLuck,
  jiaziStem,
} from '@contracts/engines/daily-core'
import { BRANCHES, HOUR_RANGES, monthPillar } from '@/components/content/ganzhi'

const HERO_POOL = ['时辰', '生肖', '干支', '星座', '星宿', '黄历', '五行', '子', '午', '甲', '辰', '宝']

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

const inputCls =
  'h-11 w-full rounded-lg border border-golddim/30 bg-silk px-4 font-sans text-[14.5px] text-inktext outline-none transition-shadow focus:border-gold/60 focus:ring-2 focus:ring-gold/30'

function PanelTitle({ children }: { children: string }) {
  return (
    <p className="mb-5 font-serif text-[15px] font-bold tracking-[0.22em] text-golddim">
      {children}
    </p>
  )
}

/* ================= 时辰对照（daily-core 版） ================= */

function ShichenTool() {
  const [minutes, setMinutes] = useState(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })
  const hour = Math.floor(minutes / 60) % 24
  // 时柱干支（五鼠遁，含时干）由 daily-core 计算——需当日日干起时干
  const now = new Date()
  const dayStemIdx = jiaziStem(dayJiazi(now.getFullYear(), now.getMonth() + 1, now.getDate()))
  const info = coreHourLuck(hour, dayStemIdx)
  const hh = String(hour).padStart(2, '0')
  const mm = String(minutes % 60).padStart(2, '0')

  return (
    <div>
      <PanelTitle>拖动时间 · 对照十二时辰</PanelTitle>
      <div className="flex flex-col items-center">
        <p className="font-latin text-[40px] font-semibold leading-none text-inktext">
          {hh}:{mm}
        </p>
        <p className="mt-3 font-serif text-[26px] font-bold text-golddim">
          {info.label}
          <span className="ml-3 font-sans text-[13px] font-normal tracking-[0.08em] text-inkmuted">
            {HOUR_RANGES[info.branchIdx]}
          </span>
        </p>
        <p className="mt-2 max-w-[460px] text-center font-sans text-[12.5px] leading-[1.9] text-inkmuted">
          {info.shortTip}
        </p>
        <input
          type="range"
          min={0}
          max={1439}
          step={5}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          aria-label="时间滑杆"
          className="mt-7 w-full max-w-[560px]"
          style={{ accentColor: 'rgb(var(--gold))' }}
        />
        <div className="mt-5 grid w-full max-w-[720px] grid-cols-6 gap-1.5 sm:grid-cols-12">
          {BRANCHES.map((b, i) => (
            <button
              key={b}
              type="button"
              onClick={() => setMinutes(((2 * i) % 24) * 60)}
              className={cn(
                'rounded-md border py-1.5 font-serif text-[14px] transition-colors',
                i === info.branchIdx
                  ? 'border-gold bg-deep text-goldbright'
                  : 'border-golddim/20 bg-silk2 text-inkmuted hover:border-golddim/50',
              )}
            >
              {b}
            </button>
          ))}
        </div>
        <p className="mt-5 max-w-[520px] text-center font-sans text-[12px] leading-[1.9] text-inkmuted">
          时支按钟点划分，时干以当日日干五鼠遁起——共享引擎 daily-core 真实推算
        </p>
      </div>
    </div>
  )
}

/* ================= 干支换算（daily-core 版） ================= */

function toISODate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function GanzhiTool() {
  const [iso, setIso] = useState(() => toISODate(new Date()))
  const pillars = useMemo(() => {
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return null
    // 年柱 / 日柱：daily-core 真实计算（日柱锚定 1900-01-01 甲戌日）
    const summary = getDailySummary(new Date(y, m - 1, d))
    // INT-02：daily-core 月柱为公历月近似（非节气换月），不得上屏；
    // 月柱继续采用 content/ganzhi.ts monthPillar()（节气换月 + 五虎遁）
    const month = monthPillar(y, m, d)
    return { year: summary.yearGanzhi, month: month.label, day: summary.dayGanzhi }
  }, [iso])

  return (
    <div>
      <PanelTitle>任意日期 → 年月日三柱</PanelTitle>
      <div className="flex flex-col items-center">
        <input
          type="date"
          value={iso}
          onChange={(e) => e.target.value && setIso(e.target.value)}
          aria-label="日期"
          className={cn(inputCls, 'max-w-[220px] text-center')}
        />
        {pillars && (
          <div className="mt-7 grid grid-cols-3 gap-4">
            {[
              { label: '年柱', value: pillars.year },
              { label: '月柱', value: pillars.month },
              { label: '日柱', value: pillars.day },
            ].map((p) => (
              <div
                key={p.label}
                className="flex w-[92px] flex-col items-center rounded-xl border border-golddim/25 bg-silk2 py-4"
              >
                <span className="font-sans text-[11px] tracking-[0.24em] text-inkmuted">{p.label}</span>
                <span className="mt-2 font-serif text-[24px] font-black text-golddim">{p.value}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-5 max-w-[520px] text-center font-sans text-[12px] leading-[1.9] text-inkmuted">
          年柱、日柱由共享引擎 daily-core 真实计算（日柱锚定 1900-01-01 甲戌日）；
          月柱按节气近似表与五虎遁起月干（引擎月柱为公历月近似，不上屏）
        </p>
      </div>
    </div>
  )
}

/** 六件小物注册表 */
const TOOLS: {
  id: string
  glyph: string
  name: string
  desc: string
  Panel: ComponentType
}[] = [
  { id: 'shichen', glyph: '辰', name: '时辰对照', desc: '钟表时间 ↔ 十二时辰', Panel: ShichenTool },
  { id: 'zodiac', glyph: '肖', name: '生肖纪年', desc: '公元年 ↔ 生肖干支', Panel: ZodiacTool },
  { id: 'ganzhi', glyph: '历', name: '干支换算', desc: '任意日期 → 干支日', Panel: GanzhiTool },
  { id: 'lodge', glyph: '星', name: '星宿速查', desc: '生日 → 二十八宿值日', Panel: LodgeTool },
  { id: 'qian', glyph: '签', name: '灵签一抽', desc: '每日一签，随缘自取', Panel: QianTool },
  { id: 'wuxing', glyph: '行', name: '五行速查', desc: '查某字 / 干支的五行', Panel: WuxingTool },
]

function ToolPanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-golddim/30 bg-silk2/60 p-8 md:p-10">{children}</div>
  )
}

export default function Toolkit() {
  const [active, setActive] = useState(0)
  const ActivePanel = TOOLS[active].Panel

  useEffect(() => {
    document.title = '百宝袋 · 紫府 — 寻时定盘，随身小工具'
  }, [])

  return (
    <div>
      {/* S1 · PageHero */}
      <PageHero
        breadcrumb="百宝袋"
        glyph="宝"
        title="百宝袋"
        latin="Pocket Tools"
        subtitle="寻时定盘的随身小件——取之即用，陆续上新"
        pool={HERO_POOL}
        minH="min-h-[38vh]"
      />

      {/* 深 → 浅 过渡 */}
      <div className="zf-fade-to-silk h-[160px]" />

      {/* 真实度标注：干支/时辰已接 daily-core 真实计算；星宿短评仍为演示文案 */}
      <FeatureStatusBadge
        kind="approx"
        text="干支换算与时辰对照已接入共享引擎 daily-core 真实计算（月柱按节气换月）；星宿值日按 28 宿循环推排，宿性短评仍为演示文案"
      />

      {/* S2 · 工具矩阵 */}
      <section className="relative bg-silk pb-28 pt-16">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative zf-container">
          <SectionHeading
            eyebrow="Six Gadgets"
            title="六件小物"
            sub="点一张卡，袋中小物即刻摊开在手心"
          />

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool, i) => {
              const selected = i === active
              return (
                <motion.button
                  key={tool.id}
                  type="button"
                  onClick={() => setActive(i)}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: easeOut }}
                  className={cn(
                    'group relative flex flex-col rounded-xl border p-7 text-left transition-all duration-300',
                    'hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-card',
                    selected ? 'border-gold bg-silk2 shadow-card' : 'border-golddim/25 bg-silk2',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-lg border font-serif text-[24px] font-black transition-colors',
                        selected ? 'border-gold bg-deep text-goldbright' : 'border-gold/40 text-golddim',
                      )}
                    >
                      {tool.glyph}
                    </span>
                    <TagPill variant="free" className="!border-golddim/50 !text-golddim" />
                  </div>
                  <span className="mt-5 block font-serif text-[20px] font-bold tracking-[0.06em] text-inktext">
                    {tool.name}
                  </span>
                  <span className="mt-2 block flex-1 text-[13.5px] leading-[1.9] text-inkmuted">
                    {tool.desc}
                  </span>
                  <span className="zf-link-more mt-5 inline-flex w-fit items-center gap-1 text-[13.5px] font-medium tracking-[0.08em] text-golddim">
                    即开即用 <span className="zf-arrow">→</span>
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* 工具面板（AnimatePresence 交叉淡入） */}
          <div className="mt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={TOOLS[active].id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                <ToolPanelShell>
                  <ActivePanel />
                </ToolPanelShell>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 浅 → 深 过渡 */}
      <div className="zf-fade-to-deep h-[140px]" />

      {/* S3 · 上新预告（深色条带） */}
      <section className="bg-deep2 py-20">
        <div className="zf-container flex flex-col items-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="font-serif text-[16px] leading-[2.1] tracking-[0.08em] text-goldbright"
          >
            袋中乾坤，陆续上新——真太阳时校正 · 罗盘刻度 · 择日合参
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4"
          >
            <Link
              to="/talks"
              className="zf-link-more text-[13px] tracking-[0.1em] text-silkmuted transition-colors hover:text-goldbright"
            >
              有想要的小工具？主创说里留言 <span className="zf-arrow">→</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
