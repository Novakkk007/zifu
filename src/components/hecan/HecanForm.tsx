import { useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkle } from 'lucide-react'
import { GoldButton, GhostButton } from '@/components/Buttons'
import { FormInput, FormSelect, SegmentedControl } from '@/components/FormControls'
import ConfidenceBadge from '@/components/hecan/ConfidenceBadge'
import type { ConfidenceTier } from '@/components/hecan/ConfidenceBadge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/* ================= 确定性 mock 数据池 ================= */

const STEMS = '甲乙丙丁戊己庚辛壬癸'.split('')
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'.split('')
const ZIWEI_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
]
const MANSIONS = '角亢氐房心尾箕斗牛女虚危室壁奎娄胃昴毕觜参井鬼柳星张翼轸'.split('')

const HOURS = [
  { v: '子', t: '23:00–01:00' }, { v: '丑', t: '01:00–03:00' },
  { v: '寅', t: '03:00–05:00' }, { v: '卯', t: '05:00–07:00' },
  { v: '辰', t: '07:00–09:00' }, { v: '巳', t: '09:00–11:00' },
  { v: '午', t: '11:00–13:00' }, { v: '未', t: '13:00–15:00' },
  { v: '申', t: '15:00–17:00' }, { v: '酉', t: '17:00–19:00' },
  { v: '戌', t: '19:00–21:00' }, { v: '亥', t: '21:00–23:00' },
]

/** FNV-1a 散列：同一生辰输入必得同一结果 */
function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick<T>(pool: T[], h: number, salt: number): T {
  return pool[Math.abs(h + salt * 2654435761) % pool.length]
}

/** 年柱为真实推算 (year-4)%60，其余三柱由散列确定性生成（mock） */
function ganzhiOf(index: number): string {
  return STEMS[index % 10] + BRANCHES[index % 12]
}

type BirthInput = {
  name: string
  gender: 'qian' | 'kun'
  calendar: 'solar' | 'lunar'
  year: number
  month: number
  day: number
  hour: string
}

type MockResult = {
  pillars: string[]
  ziweiStar: string
  ziweiPalace: string
  mansion: string
  degree: number
}

function computeResult(input: BirthInput): MockResult {
  const seed = `${input.name}|${input.gender}|${input.calendar}|${input.year}-${input.month}-${input.day}|${input.hour}`
  const h = hashStr(seed)
  const yearPillar = ganzhiOf((((input.year - 4) % 60) + 60) % 60)
  return {
    pillars: [
      yearPillar,
      pick(STEMS, h, 1) + pick(BRANCHES, h, 2),
      pick(STEMS, h, 3) + pick(BRANCHES, h, 5),
      pick(STEMS, h, 7) + pick(BRANCHES, h, 11),
    ],
    ziweiStar: pick(ZIWEI_STARS, h, 13),
    ziweiPalace: pick(BRANCHES, h, 17),
    mansion: pick(MANSIONS, h, 19),
    degree: (h % 30) + 1,
  }
}

/* ================= 合参示例报告（固定示例，原创文案） ================= */

const REPORT: { tier: ConfidenceTier; text: string; source: string }[] = [
  {
    tier: 'triple',
    text: '金水相生而秀——八字金水成势，紫微太阴居命，七政月躔壁宿：主心思清润，宜文职。',
    source: '《滴天髓》·《紫微斗数全书》·《果老星宗》',
  },
  {
    tier: 'double',
    text: '中年运转南方，八字火土暖局、紫微大限逢禄——三十九岁后气象渐开。',
    source: '《三命通会》·《紫微斗数全书》',
  },
  {
    tier: 'single',
    text: '七政见紫气照命，或主孤高之好；仅此一见，存而不论。',
    source: '《果老星宗》',
  },
]

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱']

/* ================= 组件 ================= */

export default function HecanForm() {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'qian' | 'kun'>('qian')
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>('solar')
  const [year, setYear] = useState(1995)
  const [month, setMonth] = useState(6)
  const [day, setDay] = useState(15)
  const [hour, setHour] = useState('子')
  const [submitted, setSubmitted] = useState<BirthInput | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const result = useMemo(() => (submitted ? computeResult(submitted) : null), [submitted])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted({ name, gender, calendar, year, month, day, hour })
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const labelCls = 'text-silkmuted'

  return (
    <div className="mx-auto w-full max-w-[720px]">
      {/* ===== 表单卡 ===== */}
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-gold/15 bg-deep2 p-7 shadow-card md:p-10"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormInput
            id="hc-name"
            label={<span className={labelCls}>称谓（可选）</span>}
            placeholder="如何称呼您"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
          />
          <div className="flex flex-col justify-end gap-2">
            <span className="mb-0 block font-sans text-[13px] font-medium tracking-[0.08em] text-silkmuted">
              性别 · 历法
            </span>
            <div className="flex h-11 flex-wrap items-center gap-3">
              <SegmentedControl
                id="hc-gender"
                options={[
                  { value: 'qian', label: '乾' },
                  { value: 'kun', label: '坤' },
                ]}
                value={gender}
                onChange={setGender}
              />
              <SegmentedControl
                id="hc-calendar"
                options={[
                  { value: 'solar', label: '阳历' },
                  { value: 'lunar', label: '农历' },
                ]}
                value={calendar}
                onChange={setCalendar}
              />
            </div>
          </div>
          <FormSelect
            id="hc-year"
            label={<span className={labelCls}>出生年</span>}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 201 }, (_, i) => 1900 + i).map((y) => (
              <option key={y} value={y}>
                {y} 年
              </option>
            ))}
          </FormSelect>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              id="hc-month"
              label={<span className={labelCls}>月</span>}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m} 月
                </option>
              ))}
            </FormSelect>
            <FormSelect
              id="hc-day"
              label={<span className={labelCls}>日</span>}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d} 日
                </option>
              ))}
            </FormSelect>
          </div>
          <FormSelect
            id="hc-hour"
            label={<span className={labelCls}>出生时辰</span>}
            className="sm:col-span-2"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
          >
            {HOURS.map((h) => (
              <option key={h.v} value={h.v}>
                {h.v} · {h.t}
              </option>
            ))}
          </FormSelect>
        </div>
        <GoldButton type="submit" className="mt-8 w-full">
          起三盘 · 免费概览
        </GoldButton>
        <p className="mt-4 text-center text-[12px] tracking-[0.08em] text-silkmuted">
          提交即于本页生成三盘概览 · 详参 36 灵签 / 次
        </p>
      </form>

      {/* ===== 结果区（mock，确定性生成） ===== */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultRef}
            key="hc-result"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-10">
              {/* 三列迷你盘摘要 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <motion.div
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="rounded-xl border border-gold/15 bg-deep2/70 p-5"
                >
                  <p className="font-latin text-[11px] uppercase tracking-[0.3em] text-gold">
                    Bazi
                  </p>
                  <h4 className="mt-1 font-serif text-[16px] font-bold text-silktext">
                    八字 · 四柱
                  </h4>
                  <div className="mt-4 flex justify-between gap-2">
                    {result.pillars.map((p, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <span className="text-[10px] tracking-[0.2em] text-silkmuted">
                          {PILLAR_LABELS[i]}
                        </span>
                        <span className="flex flex-col rounded-md border border-gold/25 px-2 py-1.5 font-serif text-[18px] font-bold leading-[1.4] text-goldbright">
                          <span>{p[0]}</span>
                          <span>{p[1]}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="rounded-xl border border-gold/15 bg-deep2/70 p-5"
                >
                  <p className="font-latin text-[11px] uppercase tracking-[0.3em] text-gold">
                    Ziwei
                  </p>
                  <h4 className="mt-1 font-serif text-[16px] font-bold text-silktext">
                    紫微 · 命宫
                  </h4>
                  <div className="mt-4 flex flex-col items-center gap-2 pt-1">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 font-serif text-[22px] font-black text-goldbright">
                      {result.ziweiPalace}
                    </span>
                    <p className="font-serif text-[17px] font-bold tracking-[0.2em] text-silktext">
                      {result.ziweiStar}
                    </p>
                    <p className="text-[11.5px] text-silkmuted">命宫坐{result.ziweiPalace} · 主星</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="rounded-xl border border-gold/15 bg-deep2/70 p-5"
                >
                  <p className="font-latin text-[11px] uppercase tracking-[0.3em] text-gold">
                    Qizheng
                  </p>
                  <h4 className="mt-1 font-serif text-[16px] font-bold text-silktext">
                    七政 · 宿度
                  </h4>
                  <div className="mt-4 flex flex-col items-center gap-2 pt-1">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 font-serif text-[22px] font-black text-goldbright">
                      {result.mansion}
                    </span>
                    <p className="font-serif text-[17px] font-bold tracking-[0.1em] text-silktext">
                      {result.mansion}宿 {result.degree} 度
                    </p>
                    <p className="text-[11.5px] text-silkmuted">命宫宿度 · 恒星制</p>
                  </div>
                </motion.div>
              </div>

              {/* 合参示例报告 */}
              <motion.div
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.45 }}
                className="mt-6 rounded-xl border border-gold/20 bg-deep2 p-7 md:p-9"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkle className="h-4 w-4 text-goldbright" strokeWidth={1.5} />
                  <h4 className="font-serif text-[20px] font-bold tracking-[0.1em] text-silktext">
                    合参示例 · 概览三条
                  </h4>
                </div>
                <div className="zf-hairline mt-4" />
                <ul className="mt-6 flex flex-col gap-5">
                  {REPORT.map((item, i) => (
                    <motion.li
                      key={item.tier}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.45, delay: 0.55 + i * 0.12 }}
                      className="rounded-lg border border-gold/10 bg-deep/50 p-5"
                    >
                      <ConfidenceBadge tier={item.tier} size={26} />
                      <p className="mt-3 font-serif text-[15px] leading-[2] text-silktext">
                        {item.text}
                      </p>
                      <p className="mt-2 text-[12px] tracking-[0.06em] text-silkmuted">
                        参详出处：{item.source}
                      </p>
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col items-center gap-3">
                  <GhostButton onClick={() => setDialogOpen(true)}>
                    解锁完整详参 · 36 灵签
                  </GhostButton>
                  <p className="text-[12px] text-silkmuted">
                    完整报告含三盘全图、逐项互证与岁运推演
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 余额提示 Dialog（mock） */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-gold/25 bg-deep2 text-silktext sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif tracking-[0.12em] text-goldbright">
              演示模式 · 登录后计费
            </DialogTitle>
            <DialogDescription className="pt-2 leading-[1.9] text-silkmuted">
              当前为演示环境，不产生真实扣费。登录后每次完整详参消耗
              <span className="mx-1 font-serif text-[16px] font-bold text-goldbright">36</span>
              灵签，注册即赠 36 灵签可体验一次。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end">
            <GoldButton className="px-6 py-2 text-[13px]" onClick={() => setDialogOpen(false)}>
              知道了
            </GoldButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
