import type { ComponentType, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import PageHero from '@/components/content/PageHero'
import SectionHeading from '@/components/SectionHeading'
import { TagPill } from '@/components/Buttons'
import FeatureStatusBadge from '@/components/FeatureStatusBadge'
import {
  GanzhiTool,
  LodgeTool,
  QianTool,
  ShichenTool,
  WuxingTool,
  ZodiacTool,
} from '@/components/content/ToolkitTools'

const HERO_POOL = ['时辰', '生肖', '干支', '星座', '星宿', '黄历', '五行', '子', '午', '甲', '辰', '宝']

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

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

      {/* 全站统一真实度标注：演示模式 */}
      <FeatureStatusBadge kind="demo" />

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
