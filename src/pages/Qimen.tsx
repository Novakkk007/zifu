import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageHero from '@/components/sanshi/PageHero'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import DemoDialog from '@/components/sanshi/DemoDialog'
import SiweiPanel, { type SiweiTexts } from '@/components/sanshi/SiweiPanel'
import JiugongPlate from '@/components/sanshi/JiugongPlate'
import { FormInput, FormSelect } from '@/components/FormControls'
import { GoldButton } from '@/components/Buttons'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  DOOR_KIND,
  GRID_ORDER,
  GUA_LABEL,
  JU_CN,
  YONGSHEN_LIST,
  genQimen,
  yongshenPalace,
  type Palace,
  type QimenPlate,
  type Yongshen,
} from '@/components/sanshi/qimen'
import { BRANCHES } from '@/components/sanshi/astro'
import { cn } from '@/lib/utils'

const HERO_POOL = [
  '休', '生', '伤', '杜', '景', '死', '惊', '开',
  '天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心',
  '值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天',
  '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
]

const HOUR_OPTIONS = BRANCHES.map((b, i) => {
  const start = String((2 * i + 23) % 24).padStart(2, '0')
  const end = String((2 * i + 1) % 24).padStart(2, '0')
  return { value: String(i), label: `${b}时 ${start}:00–${end}:59` }
})

const YEARS = Array.from({ length: 21 }, (_, i) => 2020 + i)

function nowParts() {
  const d = new Date()
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1),
    day: String(d.getDate()),
    hour: String(Math.floor(((d.getHours() + 1) % 24) / 2)),
  }
}

const KIND_ADVICE: Record<'吉' | '凶' | '平', string> = {
  吉: '得门而不迫，事可徐图',
  凶: '门路稍滞，宜守而待时',
  平: '局势中平，守成为上',
}

const KIND_WIT: Record<'吉' | '凶' | '平', string> = {
  吉: '门路敞亮，抬脚就能走',
  凶: '门口有点堵，先喝杯茶再说',
  平: '不好不坏，稳稳当当便是赢',
}

function buildTexts(plate: QimenPlate, y: Yongshen, pNum: number): SiweiTexts {
  const dir = plate.dun === '阳遁' ? '顺' : '逆'
  const ju = JU_CN[plate.ju - 1]
  const cell = plate.palaces[pNum - 1]
  const zf = plate.palaces.find((p) => p.isZhifu) ?? plate.palaces[4]
  const kind = DOOR_KIND[cell.door] ?? '平'
  const cellDesc = cell.door ? `${cell.door}门配${cell.star}` : `${cell.star}寄居中宫`
  return {
    scholar: {
      pro: `《烟波钓叟歌》云「阴阳顺逆妙难穷」——此局${plate.dun}${ju}局，三奇六仪${dir}布九宫，值符${plate.zhifuStar}临${zf.gua}宫，值使${plate.zhishiDoor}门掌事。用神「${y.key}」锚于${cell.gua}宫，${cellDesc}，${KIND_ADVICE[kind]}，宜逐宫参看天地盘干之生克。`,
      plain: `这一局是${plate.dun}${ju}局。「${y.key}」看${cell.gua}宫：${cellDesc}，${KIND_ADVICE[kind]}。按既定节奏推进即可，不必临时变招。`,
    },
    hermit: {
      pro: `盘子一摆，值符${plate.zhifuStar}坐镇${zf.gua}宫，值使${plate.zhishiDoor}门听差——「${y.key}」这档事落在了${cell.gua}宫。《烟波钓叟歌》说「阴阳顺逆妙难穷」，局已布好，人等风来，急不得。`,
      plain: `简单说：${cell.gua}宫守着「${y.key}」，${KIND_WIT[kind]}。`,
    },
  }
}

export default function Qimen() {
  const init = useMemo(() => nowParts(), [])
  const [year, setYear] = useState(init.year)
  const [month, setMonth] = useState(init.month)
  const [day, setDay] = useState(init.day)
  const [hour, setHour] = useState(init.hour)
  const [question, setQuestion] = useState('')
  const [plate, setPlate] = useState<QimenPlate | null>(null)
  const [runId, setRunId] = useState(0)
  const [selected, setSelected] = useState<Palace | null>(null)
  const [ysIdx, setYsIdx] = useState(0)
  const plateRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    document.title = '奇门遁甲 · 紫府 — 据时起局，用神锚定'
  }, [])

  const submit = () => {
    const p = genQimen({
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hourBranch: Number(hour),
      question: question.trim(),
    })
    setPlate(p)
    setYsIdx(0)
    setRunId((n) => n + 1)
    requestAnimationFrame(() => plateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const yongshen = YONGSHEN_LIST[ysIdx]
  const ysPalace = plate ? yongshenPalace(plate, yongshen) : 5

  return (
    <div>
      {/* ===== S1 · PageHero ===== */}
      <PageHero
        glyph="奇"
        title="奇门遁甲"
        latin="Qi Men Dun Jia"
        subtitle="依《烟波钓叟歌》之法，随时起局——九宫之中，观门星神干之势"
        crumb="奇门遁甲"
        pool={HERO_POOL}
      />

      <div className="zf-fade-to-silk h-[180px]" />

      {/* ===== S2 · 起局表单 ===== */}
      <section className="relative bg-silk pb-24 pt-4">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative zf-container flex flex-col items-center">
          <SectionHeading
            eyebrow="Time Chart"
            title="起 局"
            sub="默认此时此刻，亦可自定年月日时——同一时刻，局盘如一"
          />
          <div className="mt-12 w-full max-w-[680px] rounded-xl border border-golddim/25 bg-silk2 p-8 shadow-card md:p-10">
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              <FormSelect label="起局年" value={year} onChange={(e) => setYear(e.target.value)}>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y} 年
                  </option>
                ))}
              </FormSelect>
              <FormSelect label="月" value={month} onChange={(e) => setMonth(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} 月
                  </option>
                ))}
              </FormSelect>
              <FormSelect label="日" value={day} onChange={(e) => setDay(e.target.value)}>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} 日
                  </option>
                ))}
              </FormSelect>
              <FormSelect label="时辰" value={hour} onChange={(e) => setHour(e.target.value)}>
                {HOUR_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </FormSelect>
            </div>
            <FormInput
              className="mt-6"
              label="所问之事（可选）"
              placeholder="问事方向，如出行 / 求财 / 合作"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="mt-6">
              <p className="mb-2 font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">排法</p>
              <div className="inline-flex items-center gap-1 rounded-full border border-golddim/30 bg-silk p-1">
                <span className="rounded-full bg-deep px-5 py-2 font-sans text-[13.5px] font-medium tracking-[0.08em] text-silk">
                  时家奇门
                </span>
                {['日家', '月家'].map((m) => (
                  <span
                    key={m}
                    className="cursor-not-allowed rounded-full px-5 py-2 font-sans text-[13.5px] tracking-[0.08em] text-inkmuted/50"
                    title="陆续开放"
                  >
                    {m} · 待开放
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-8 flex justify-center">
              <GoldButton className="w-full sm:w-auto" onClick={submit}>
                起局
              </GoldButton>
            </div>
          </div>
        </div>
      </section>

      {/* ===== S3 · 九宫盘 ===== */}
      <AnimatePresence>
        {plate && (
          <motion.section
            key="plate"
            ref={(el) => {
              plateRef.current = el
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative bg-silk pb-28"
          >
            <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
            <div className="relative zf-container">
              <SectionHeading eyebrow="Nine Palaces" title="九 宫 局 盘" />
              {/* 局数信息条 */}
              <motion.p
                key={`info-${runId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-8 text-center font-serif text-[16px] font-semibold tracking-[0.14em] text-golddim"
              >
                {`${plate.dun}${JU_CN[plate.ju - 1]}局 · 旬首 ${plate.xunshou} · 值符 ${plate.zhifuStar}星 / 值使 ${plate.zhishiDoor}门`.split('').map((ch, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.02 }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </motion.p>
              <p className="mt-2 text-center text-[12.5px] tracking-[0.1em] text-inkmuted">
                {year} 年 {month} 月 {day} 日 {BRANCHES[Number(hour)]}时 · 日干支 {plate.dayGZ} · 时干支 {plate.hourGZ}
              </p>
              <div className="mt-12">
                <JiugongPlate key={runId} palaces={plate.palaces} onSelect={setSelected} />
              </div>
              <p className="mt-8 text-center text-[12.5px] tracking-[0.08em] text-inkmuted">
                点按宫格，参看该宫门星神干组合断语
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 宫格详情 Drawer */}
      <Drawer open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="border-t border-gold/25 bg-deep2 text-silktext">
          <div className="mx-auto w-full max-w-md px-6 pb-10">
            {selected && (
              <>
                <DrawerHeader className="px-0">
                  <DrawerTitle className="font-serif text-[20px] font-bold tracking-[0.1em] text-goldbright">
                    {selected.gua}宫 · {selected.star}
                    {selected.door ? ` · ${selected.door}门` : ''}
                    {selected.god ? ` · ${selected.god}` : ''}
                  </DrawerTitle>
                  <DrawerDescription className="text-[13px] text-silkmuted">
                    天盘 {selected.tianGan} ／ 地盘 {selected.diGan}
                    {selected.isZhifu && ' · 值符所临'}
                    {selected.isZhishi && ' · 值使之门'}
                  </DrawerDescription>
                </DrawerHeader>
                <div className="rounded-xl border-l-[3px] border-gold bg-deep3/60 px-6 py-5">
                  <p className="font-serif text-[15.5px] leading-[2.1] text-silktext">{selected.duanyu}</p>
                </div>
                <p className="mt-5 text-center text-[12px] tracking-[0.1em] text-silkmuted/70">
                  演示断语由模板句库生成 · 正式版引经逐句参详
                </p>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ===== S4 · 用神参详（深色） ===== */}
      {plate && (
        <>
          <div className="zf-fade-to-deep h-[160px]" />
          <section className="relative overflow-hidden bg-deep2 py-24">
            <div className="relative zf-container">
              <SectionHeading
                dark
                eyebrow="Focus Anchor"
                title="用 神 参 详"
                sub="锚定所问之事，观其落宫旺衰——左选用神，右观参详"
              />
              <div className="mt-14 grid gap-12 lg:grid-cols-2">
                {/* 左：用神锚定器 + 缩略盘 */}
                <div>
                  <label
                    htmlFor="yongshen"
                    className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-silkmuted"
                  >
                    用神锚定
                  </label>
                  <select
                    id="yongshen"
                    value={ysIdx}
                    onChange={(e) => setYsIdx(Number(e.target.value))}
                    className="h-11 w-full appearance-none rounded-lg border border-gold/25 bg-deep3 px-4 font-sans text-[14.5px] text-silktext outline-none transition-shadow focus:border-gold/60 focus:ring-2 focus:ring-gold/30"
                  >
                    {YONGSHEN_LIST.map((y, i) => (
                      <option key={y.key} value={i}>
                        {y.key} → {y.hint}
                      </option>
                    ))}
                  </select>

                  {/* 缩略盘 */}
                  <div className="mt-8 grid max-w-[340px] grid-cols-3 gap-1.5">
                    {GRID_ORDER.map((num) => {
                      const p = plate.palaces[num - 1]
                      const active = num === ysPalace
                      return (
                        <motion.div
                          key={`${runId}-${ysIdx}-${num}`}
                          animate={active ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
                          transition={
                            active ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }
                          }
                          className={cn(
                            'flex aspect-square flex-col items-center justify-center rounded-md border text-center',
                            active
                              ? 'border-goldbright bg-gold/15 text-goldbright'
                              : 'border-gold/15 bg-deep3/60 text-silkmuted',
                          )}
                        >
                          <span className="text-[10px] tracking-[0.08em]">{p.gua}</span>
                          <span className="mt-0.5 font-serif text-[13px] font-semibold">
                            {p.door ? `${p.door}门` : '中宫'}
                          </span>
                          <span className="text-[10px]">{p.god || p.star}</span>
                        </motion.div>
                      )
                    })}
                  </div>
                  <p className="mt-4 text-[12.5px] tracking-[0.08em] text-silkmuted">
                    用神「{yongshen.key}」落于 {GUA_LABEL[ysPalace]} 宫
                  </p>
                </div>

                {/* 右：参详输出 */}
                <div>
                  <SiweiPanel
                    key={`${runId}-${ysIdx}`}
                    texts={buildTexts(plate, yongshen, ysPalace)}
                    caption="参详输出 · 本局 mock"
                  />
                  <div className="mt-8">
                    <DemoDialog trigger="详参此局 · 12 灵签" title="奇门遁甲 · 详参此局" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ===== S5 · 典籍依据 ===== */}
      {!plate && <div className="zf-fade-to-deep h-[160px]" />}
      <section className="relative overflow-hidden bg-deep2 py-28">
        <div className="relative mx-auto w-full max-w-[860px] px-6 md:px-10">
          <SectionHeading dark eyebrow="Classics" title="典 籍 依 据" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mt-14"
          >
            <QuoteStrip
              book="烟波钓叟歌"
              quote="阴阳顺逆妙难穷，二至还归一九宫。"
              source="《烟波钓叟歌》（公版原文）"
            />
            <p className="mt-6 text-center text-[12.5px] tracking-[0.08em] text-silkmuted">
              演示局盘由时间哈希确定性生成 · 正式版以真太阳时精密起局
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
