import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEngine } from '@/hooks/useEngine'
import { drawLingqian } from '@/engines/client/draws'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'
import type { GuanyinSign } from '@contracts/engines/draws-core'
import PageHero from '@/components/content/PageHero'
import ZodiacClashCard from '@/components/ZodiacClashCard'
import SectionHeading from '@/components/SectionHeading'
import { FormSelect } from '@/components/FormControls'
import { GhostButton, GoldButton } from '@/components/Buttons'
import FeatureStatusBadge from '@/components/FeatureStatusBadge'
/**
 * 数据来源映射（V12 更新 · 每日时令全真实化）：
 * - 日柱 / 月柱 / 年柱 / 节气名（真实交节）/ 宜忌 / 时柱干支与时辰批语：
 *   共享引擎 @contracts/engines/daily-core（lunar-typescript 精密历法，V11-INT-02/03 已销号）
 * - 时辰「吉/平/凶」评级：daily-core v1 未提供评级 API，沿用 content/ganzhi.ts 的
 *   六合三合冲害确定性规则（真实推算，非 mock）
 * - 农历（lunarApprox）与「今日与你 · 逐日详参」：仍为近似 / 演示，标注保留
 */
import {
  BRANCHES,
  BRANCH_WUXING,
  HOUR_RANGES,
  STEMS,
  STEM_WUXING,
  WUXING_COLOR,
  WUXING_SWATCH,
  ganzhiOf,
  hourLuck,
} from '@/components/content/ganzhi'
import {
  STEMS as CORE_STEMS,
  dayJiazi,
  ganzhiLabel,
  getDailySummary,
  hourBranchOf,
  hourLuck as coreHourLuck,
  jiaziStem,
  yijiOf,
  sleepAdviceOf,
} from '@contracts/engines/daily-core'
import { hebenReading, lunarApprox } from '@/components/content/almanac'
import type { HourLuck } from '@/components/content/ganzhi'

// INT-02/03 销号：节气改 daily-core 精密 API（lunar-typescript 真实交节）
import { preciseNextSolarTerm, solarTermStartsOn as preciseStartsOn, type DayStem } from '@contracts/engines/daily-core'

/** 距下一节气（精密交节时刻） */
function nextSolarTerm(from: Date): { name: string; daysTo: number } {
  return preciseNextSolarTerm(from)
}

/** 某日是否为交节日（月历角标，精密版） */
function solarTermStartsOn(y: number, m: number, d: number): string | null {
  return preciseStartsOn(new Date(y, m - 1, d))
}

const MONTHS_EN = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

const HERO_POOL = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满',
  '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒',
  '甲', '乙', '子', '丑', '宜', '忌',
]

const LUCK_STYLE: Record<HourLuck, { text: string; chip: string }> = {
  吉: { text: 'text-golddim', chip: 'border-gold/60 bg-gold/10 text-golddim' },
  平: { text: 'text-inkmuted', chip: 'border-inkmuted/30 bg-inkmuted/5 text-inkmuted' },
  凶: { text: 'text-[#A8433C]', chip: 'border-[#A8433C]/40 bg-[#A8433C]/5 text-[#A8433C]' },
}

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

/** 块级入场 */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ================= S2 · 今日宜忌 ================= */

/** 今晚安寝卡（五行养生 · 文化参考，非医疗建议） */
function SleepCard({ dayStem }: { dayStem: DayStem }) {
  const advice = sleepAdviceOf(dayStem)
  return (
    <div className="mx-auto w-full max-w-[960px] rounded-xl border border-golddim/25 bg-deep p-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="font-latin text-[12px] font-medium uppercase tracking-[0.3em] text-golddim">
            Nightly Rest
          </p>
          <h3 className="mt-1 font-serif text-[22px] font-bold tracking-[0.08em] text-silktext">
            🌙 今晚安寝 · {advice.theme}
          </h3>
        </div>
        <span className="rounded-full border border-golddim/40 px-4 py-1.5 text-[11.5px] tracking-[0.12em] text-silkmuted">
          五行养生 · 文化参考 · 不构成医疗建议
        </span>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-golddim/15 bg-black/20 p-5">
          <p className="text-[12px] tracking-[0.2em] text-goldbright">安寝提示</p>
          <p className="mt-2.5 font-serif text-[15px] leading-[1.95] text-silktext">
            {advice.tip}
          </p>
        </div>
        <div className="rounded-lg border border-golddim/15 bg-black/20 p-5">
          <p className="text-[12px] tracking-[0.2em] text-goldbright">时辰参详（子午流注）</p>
          <p className="mt-2.5 font-serif text-[15px] leading-[1.95] text-silktext">
            {advice.hourHint}
          </p>
        </div>
      </div>
    </div>
  )
}

function YijiCards({ dayStem }: { dayStem: DayStem }) {
  // 宜忌：共享引擎 daily-core（公版黄历基础规则，按日干映射）
  const { yi, ji } = yijiOf(dayStem)
  return (
    <div className="mx-auto w-full max-w-[960px]">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {[
          { title: '宜', items: yi, gold: true, fromX: -32 },
          { title: '忌', items: ji, gold: false, fromX: 32 },
        ].map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: card.fromX }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="rounded-xl border border-golddim/25 bg-silk2 p-7"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-lg font-serif text-[22px] font-black',
                  card.gold
                    ? 'text-[#0B3B39] [background:linear-gradient(135deg,rgb(var(--gold-bright)),rgb(var(--gold)))]'
                    : 'bg-deep text-silk',
                )}
              >
                {card.title}
              </span>
              <span className="font-latin text-[12px] font-medium uppercase tracking-[0.3em] text-golddim">
                {card.gold ? 'Auspicious' : 'Avoid'}
              </span>
            </div>
            <ul className="mt-5 space-y-2.5">
              {card.items.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
                  className="flex items-center gap-2.5 font-sans text-[14.5px] tracking-[0.06em] text-inktext"
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', card.gold ? 'bg-gold' : 'bg-deep/60')} />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
      <Reveal className="mt-4 text-center">
        <p className="text-[12.5px] tracking-[0.06em] text-inkmuted">
          宜忌依日柱轮换择日类目 —— 公版黄历基础规则，共享引擎 daily-core 真实计算
        </p>
      </Reveal>
    </div>
  )
}

/** 今日五行色条（日干/日支来自 daily-core summary，五行映射表为展示常量） */
function WuxingStrip({ stem, branch }: { stem: DayStem; branch: string }) {
  const stemEl = STEM_WUXING[STEMS.indexOf(stem)]
  const branchEl = BRANCH_WUXING[BRANCHES.indexOf(branch as (typeof BRANCHES)[number])]
  const els = [stemEl, branchEl]
  return (
    <Reveal className="mx-auto mt-6 w-full max-w-[960px]">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-golddim/25 bg-silk2 px-7 py-5 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          {els.map((el) => (
            <span key={el} className="flex items-center gap-1.5">
              <span
                className="h-4 w-4 rounded-full border border-inktext/10"
                style={{ backgroundColor: WUXING_SWATCH[el] }}
              />
              <span className="font-serif text-[15px] font-semibold text-inktext">{el}</span>
            </span>
          ))}
        </div>
        <p className="font-sans text-[13.5px] tracking-[0.06em] text-inkmuted">
          日干属{stemEl}、日支属{branchEl} —— 今日宜着
          <span className="font-serif font-semibold text-golddim"> {WUXING_COLOR[stemEl]} </span>
          之色
        </p>
      </div>
    </Reveal>
  )
}

/* ================= S3 · 时辰吉凶 ================= */

function HourGrid({ dayGz, dayStemIdx, now }: { dayGz: number; dayStemIdx: number; now: Date }) {
  const [tip, setTip] = useState<number | null>(null)
  const current = hourBranchOf(now.getHours())
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-12">
        {BRANCHES.map((b, i) => {
          // 吉凶评级：daily-core v1 无评级 API，沿用六合三合冲害确定性规则（真实推算）
          const luck = hourLuck(dayGz, i)
          // 时柱干支（五鼠遁，含时干）与批语：daily-core 真实计算
          const core = coreHourLuck((2 * i) % 24, dayStemIdx)
          const isNow = i === current
          const st = LUCK_STYLE[luck]
          return (
            <motion.button
              key={b}
              type="button"
              onClick={() => setTip(tip === i ? null : i)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: easeOut }}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-lg border bg-silk2 px-1 py-3 transition-colors',
                isNow
                  ? 'animate-gold-breathe border-gold'
                  : tip === i
                    ? 'border-gold/70'
                    : 'border-golddim/20 hover:border-golddim/50',
              )}
            >
              {isNow && (
                <span className="absolute -top-2 right-1.5 rounded-full bg-gold px-1.5 py-px font-sans text-[10px] font-medium text-[#0B3B39]">
                  现在
                </span>
              )}
              <span className="font-serif text-[17px] font-bold text-inktext">{core.label}</span>
              <span className="font-latin text-[10px] tracking-wide text-inkmuted">
                {HOUR_RANGES[i]}
              </span>
              <span
                className={cn(
                  'mt-0.5 rounded-full border px-2 py-px font-sans text-[11px] font-medium',
                  st.chip,
                )}
              >
                {luck}
              </span>
            </motion.button>
          )
        })}
      </div>
      <AnimatePresence mode="wait">
        {tip !== null && (
          <motion.p
            key={tip}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.24 }}
            className="mt-4 text-center font-serif text-[14.5px] tracking-[0.06em] text-golddim"
          >
            {coreHourLuck((2 * tip) % 24, dayStemIdx).shortTip}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ================= S3.5 · 今日灵签 ================= */

type LingqianDraw = { signNo: number; sign: GuanyinSign; idempotentReplay: boolean }

function LingqianSection() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [draw, setDraw] = useState<LingqianDraw | null>(null)
  // 浏览器直跑（静态托管无后端）：CSPRNG 抽签 + localStorage 幂等复放，
  // 返回形状与 trpc.draws.lingqian 一致
  const lingqian = useEngine(drawLingqian, {
    onSuccess: (data) => setDraw(data.result.data as unknown as LingqianDraw),
  })

  const todayKey = (uid: number | 'guest') => {
    const t = new Date()
    return `${uid}-${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }

  const submit = () => {
    // 游客按本机 guest 键幂等（localStorage），登录用户按用户 id 幂等
    lingqian.mutate({ idempotencyKey: todayKey(user?.id ?? 'guest') })
  }

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center">
      {!isAuthenticated && !isLoading && (
        <Reveal className="mb-6 flex flex-col items-center">
          <p className="text-center font-sans text-[13px] leading-[2] text-inkmuted">
            游客模式：签号由浏览器加密随机数均匀抽取，今日之签在本机恒定；
            <Link
              to={LOGIN_PATH}
              className="text-golddim underline underline-offset-4 hover:text-gold"
            >
              登录
            </Link>
            后可跨设备同步每日一签。
          </p>
        </Reveal>
      )}
      {isLoading ? null : (
        <Reveal className="flex w-full flex-col items-center">
          <GoldButton onClick={submit} disabled={lingqian.isPending} className="px-12">
            {lingqian.isPending ? '抽签中…' : draw ? '查看今日灵签' : '今日灵签'}
          </GoldButton>
          {lingqian.isError && (
            <p className="mt-3 text-[13px] text-[#A8433C]">抽签失败，请稍后重试</p>
          )}
          <AnimatePresence mode="wait">
            {draw && (
              <motion.div
                key={draw.signNo}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.5, ease: easeOut }}
                className="mt-7 w-full rounded-xl border border-golddim/30 bg-silk2 p-7 text-center"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="rounded-full border border-gold/50 px-3 py-0.5 font-sans text-[11px] font-medium tracking-[0.14em] text-golddim">
                    {draw.sign.grade}
                  </span>
                  <span className="font-serif text-[20px] font-bold tracking-[0.14em] text-inktext">
                    第 {draw.signNo} 签
                  </span>
                </div>
                <div className="zf-hairline mx-auto mt-4" />
                <div className="mt-4 space-y-1">
                  {draw.sign.poem.map((line) => (
                    <p key={line} className="font-serif text-[16px] leading-[2.1] text-inktext">
                      {line}
                    </p>
                  ))}
                </div>
                <p className="mt-4 font-sans text-[13px] leading-[1.9] text-inkmuted">
                  简注：{draw.sign.note}
                </p>
                <p className="mt-3 font-sans text-[11.5px] tracking-[0.06em] text-inkmuted/70">
                  观音灵签通行本 · CSPRNG 均匀抽取 · 每日一签（同一日内重抽仍为该签）· 仅供文化体验
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Reveal>
      )}
    </div>
  )
}

/* ================= S4 · 月令日历 ================= */

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function MonthCalendar({ today }: { today: Date }) {
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [dir, setDir] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)

  const cells = useMemo(() => {
    const days = new Date(view.y, view.m + 1, 0).getDate()
    const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7
    return { days, firstWeekday }
  }, [view])

  const shift = (d: number) => {
    setDir(d)
    setPicked(null)
    setView((v) => {
      const nm = v.m + d
      return { y: v.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 }
    })
  }

  const isToday = (d: number) =>
    view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate()

  const pickedGz = picked !== null ? dayJiazi(view.y, view.m + 1, picked) : null

  return (
    <div className="mx-auto w-full max-w-[720px]">
      {/* 月份切换 */}
      <div className="mb-6 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="上一月"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-golddim/30 text-inkmuted transition-colors hover:border-gold hover:text-golddim"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="min-w-[140px] text-center font-serif text-[19px] font-bold tracking-[0.14em] text-inktext">
          {view.y} 年 {view.m + 1} 月
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="下一月"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-golddim/30 text-inkmuted transition-colors hover:border-gold hover:text-golddim"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-2 text-center font-sans text-[12px] tracking-[0.2em] text-inkmuted">
            {w}
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={`${view.y}-${view.m}`}
            custom={dir}
            initial={{ opacity: 0, x: dir >= 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir >= 0 ? -40 : 40 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="grid grid-cols-7 gap-1.5"
          >
            {Array.from({ length: cells.firstWeekday }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: cells.days }).map((_, i) => {
              const d = i + 1
              const gz = dayJiazi(view.y, view.m + 1, d)
              const term = solarTermStartsOn(view.y, view.m + 1, d)
              const todayCell = isToday(d)
              return (
                <motion.button
                  key={d}
                  type="button"
                  onClick={() => setPicked(picked === d ? null : d)}
                  initial={todayCell ? { scale: 1 } : false}
                  animate={todayCell ? { scale: [1, 1.08, 1] } : undefined}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className={cn(
                    'relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-lg border py-1.5 transition-colors',
                    todayCell
                      ? 'border-gold bg-deep text-goldbright'
                      : picked === d
                        ? 'border-gold/70 bg-silk2 text-inktext'
                        : 'border-golddim/15 bg-silk2/60 text-inktext hover:border-golddim/45',
                  )}
                >
                  <span className={cn('font-sans text-[14px] font-medium', todayCell && 'font-semibold')}>
                    {d}
                  </span>
                  <span
                    className={cn(
                      'font-serif text-[10.5px] leading-none',
                      todayCell ? 'text-goldbright/85' : 'text-inkmuted',
                    )}
                  >
                    {ganzhiLabel(gz)}
                  </span>
                  {term && (
                    <span
                      className={cn(
                        'absolute bottom-0.5 right-1 font-serif text-[9px]',
                        todayCell ? 'text-goldbright' : 'text-golddim',
                      )}
                    >
                      {term}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 点选某日 → 宜忌小弹卡 */}
      <AnimatePresence>
        {picked !== null && pickedGz !== null && (
          <motion.div
            key={`picked-${view.y}-${view.m}-${picked}`}
            initial={{ opacity: 0, y: 16, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.32, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="mt-5 rounded-xl border border-golddim/30 bg-silk2 p-6">
              <div className="flex items-baseline justify-between">
                <p className="font-serif text-[17px] font-bold tracking-[0.1em] text-inktext">
                  {view.m + 1} 月 {picked} 日 ·{' '}
                  <span className="text-golddim">{ganzhiLabel(pickedGz)}日</span>
                </p>
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  aria-label="收起"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-inkmuted transition-colors hover:text-inktext"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="font-serif text-[13px] font-bold tracking-[0.2em] text-golddim">宜</p>
                  <p className="mt-1.5 font-sans text-[13px] leading-[1.9] text-inktext">
                    {yijiOf(CORE_STEMS[jiaziStem(pickedGz)]).yi.join(' · ')}
                  </p>
                </div>
                <div>
                  <p className="font-serif text-[13px] font-bold tracking-[0.2em] text-inkmuted">忌</p>
                  <p className="mt-1.5 font-sans text-[13px] leading-[1.9] text-inktext">
                    {yijiOf(CORE_STEMS[jiaziStem(pickedGz)]).ji.join(' · ')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ================= S5 · 合本命 ================= */

const YEARS = Array.from({ length: 2026 - 1930 + 1 }, (_, i) => 2026 - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function HebenSection({ todayGz }: { todayGz: number }) {
  const [y, setY] = useState(1995)
  const [m, setM] = useState(6)
  const [d, setD] = useState(15)
  const [result, setResult] = useState<ReturnType<typeof hebenReading> | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const submit = () => {
    // 本命日柱同样由 daily-core 真实推算（与本页日柱同源）
    const myGz = dayJiazi(y, m, d)
    const today = ganzhiOf(todayGz)
    const mine = ganzhiOf(myGz)
    setResult(
      hebenReading(
        today.stem,
        STEM_WUXING[STEMS.indexOf(today.stem)],
        mine.stem,
        STEM_WUXING[STEMS.indexOf(mine.stem)],
      ),
    )
  }

  useEffect(() => {
    if (!dialogOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [dialogOpen])

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <Reveal>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
          <FormSelect
            label="出生年"
            value={y}
            onChange={(e) => setY(Number(e.target.value))}
            className="[&>select]:border-gold/30 [&>select]:bg-deep [&>select]:text-silktext [&>label]:text-silkmuted"
          >
            {YEARS.map((yy) => (
              <option key={yy} value={yy}>
                {yy} 年
              </option>
            ))}
          </FormSelect>
          <FormSelect
            label="出生月"
            value={m}
            onChange={(e) => setM(Number(e.target.value))}
            className="[&>select]:border-gold/30 [&>select]:bg-deep [&>select]:text-silktext [&>label]:text-silkmuted"
          >
            {MONTHS.map((mm) => (
              <option key={mm} value={mm}>
                {mm} 月
              </option>
            ))}
          </FormSelect>
          <FormSelect
            label="出生日"
            value={d}
            onChange={(e) => setD(Number(e.target.value))}
            className="[&>select]:border-gold/30 [&>select]:bg-deep [&>select]:text-silktext [&>label]:text-silkmuted"
          >
            {DAYS.map((dd) => (
              <option key={dd} value={dd}>
                {dd} 日
              </option>
            ))}
          </FormSelect>
          <GoldButton onClick={submit} className="h-11 shrink-0 px-10 py-0">
            合看
          </GoldButton>
        </div>
      </Reveal>

      <AnimatePresence>
        {result && (
          <motion.div
            key="heben-result"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.55, ease: easeOut }}
            className="mt-8 rounded-xl border border-gold/25 bg-deep p-8"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-serif text-[17px] font-bold leading-[1.9] text-goldbright"
            >
              {result.headline}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-3 font-sans text-[14px] leading-[2.05] text-silktext/90"
            >
              {result.para}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-2 font-serif text-[14px] tracking-[0.06em] text-gold"
            >
              {result.colorAdvice}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="mt-6"
            >
              <GhostButton onClick={() => setDialogOpen(true)}>逐日详参 · 3 灵签</GhostButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 演示 Dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-deep3/80 px-6 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: easeOut }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[420px] rounded-xl border border-gold/30 bg-deep2 p-8 text-center"
            >
              <p className="font-serif text-[20px] font-bold tracking-[0.12em] text-goldbright">
                逐日详参
              </p>
              <div className="zf-hairline mx-auto mt-4" />
              <p className="mt-5 font-sans text-[14px] leading-[2] text-silktext/90">
                此为演示入口：正式版将锚定当日干支与您的本命四柱，
                逐日引经详参宜忌行止，每次消耗
                <span className="font-serif font-semibold text-goldbright"> 3 </span>灵签。
              </p>
              <p className="mt-3 text-[12.5px] tracking-[0.06em] text-silkmuted">
                古籍数字化 · AI 参详 — 仅供文化研究与体验
              </p>
              <GoldButton onClick={() => setDialogOpen(false)} className="mt-6 px-10">
                知道了
              </GoldButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ================= 页面 ================= */

export default function Daily() {
  const [now, setNow] = useState(() => new Date())

  // 每分钟刷新（当前时辰高亮）
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    document.title = '每日时令 · 紫府 — 今日干支、节气与宜忌'
  }, [])

  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  // 当日摘要：日柱 / 节气 / 宜忌 / 时辰均由共享引擎 daily-core 真实计算
  const summary = getDailySummary(now)
  const dayGz = dayJiazi(y, m, d)
  const { dayStem: stem, dayBranch: branch } = summary
  const dayStemIdx = jiaziStem(dayGz)
  const { name: nextTerm, daysTo: daysToNext } = nextSolarTerm(now)

  return (
    <div>
      {/* S1 · PageHero（加强版：内嵌今日干支大字） */}
      <PageHero
        breadcrumb="每日时令"
        title="每日时令"
        latin="Daily Almanac"
        pool={HERO_POOL}
        glyphCount={30}
        minH="min-h-[42vh]"
      >
        {/* 公历 + 农历近似 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 font-latin text-[14px] font-medium tracking-[0.28em] text-silkmuted"
        >
          {MONTHS_EN[m - 1]} {d}, {y}
          <span className="ml-3 font-sans text-[12.5px] tracking-[0.14em] text-silkmuted/80">
            农历{lunarApprox(y, m, d)}（近似）
          </span>
        </motion.p>

        {/* 今日干支大字（上下排列，真实计算） */}
        <div className="mt-4 flex flex-col items-center">
          {[stem, branch].map((ch, i) => (
            <motion.span
              key={ch}
              initial={{ opacity: 0, scale: 1.15, filter: 'blur(12px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, delay: 0.35 + i * 0.18, ease: easeOut }}
              className="font-serif text-[96px] font-black leading-[1.06] text-goldbright"
            >
              {ch}
            </motion.span>
          ))}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-1 font-serif text-[15px] tracking-[0.4em] text-gold"
          >
            日柱
          </motion.span>
        </div>

        {/* 节气行 */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75, ease: easeOut }}
          className="mt-5 text-[14px] tracking-[0.1em] text-silkmuted"
        >
          时值
          <span className="mx-1.5 font-serif text-[16px] font-semibold text-goldbright">{summary.solarTerm}</span>
          · 距 {nextTerm} 还有
          <span className="mx-1 font-serif text-[16px] font-semibold text-goldbright">{daysToNext}</span>
          天
        </motion.p>
      </PageHero>

      {/* 深 → 浅 过渡 */}
      <div className="zf-fade-to-silk h-[160px]" />

      {/* 真实度标注：干支/宜忌/时柱/节气已接 daily-core 精密历法；农历近似；「今日与你·逐日详参」仍为演示 */}
      <FeatureStatusBadge
        kind="approx"
        text="今日干支、宜忌、时柱、节气由共享引擎 daily-core 精密历法真实计算（年以立春界、月以节气界、交节时刻精确）；农历为公历近似；「今日与你 · 逐日详参」仍为演示入口"
      />

      {/* S2 · 今日详卡 */}
      <section className="relative bg-silk py-24">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative zf-container">
          <SectionHeading
            eyebrow="Do & Don't"
            title="今日宜忌"
            sub={`${summary.dayGanzhi}日 · 依日柱轮换择日类目 · 共享引擎真实推算`}
          />
          <div className="mt-14">
            <YijiCards dayStem={summary.dayStem} />
            <WuxingStrip stem={summary.dayStem} branch={summary.dayBranch} />
          </div>
        </div>
      </section>

      {/* S2b · 今晚安寝（睡眠方向 · 五行养生文化参考） */}
      <section className="relative bg-silk pb-24 pt-4">
        <div className="relative zf-container">
          <SleepCard dayStem={summary.dayStem} />
          <div className="mx-auto mt-6 w-full max-w-[960px]">
            <ZodiacClashCard dayBranchIdx={summary.dayBranchIdx} />
          </div>
        </div>
      </section>

      {/* S3 · 时辰吉凶 */}
      <section className="relative bg-silk pb-24 pt-4">
        <div className="relative zf-container">
          <SectionHeading
            eyebrow="Twelve Hours"
            title="时辰吉凶"
            sub="与日支六合三合为吉、相冲相害为凶；点击时辰看一句小注"
          />
          <div className="mt-14">
            <HourGrid dayGz={dayGz} dayStemIdx={dayStemIdx} now={now} />
          </div>
        </div>
      </section>

      {/* S3.5 · 今日灵签（服务端真实随机） */}
      <section className="relative bg-silk pb-24 pt-4">
        <div className="relative zf-container">
          <SectionHeading
            eyebrow="Daily Oracle"
            title="今日灵签"
            sub="观音灵签一百首 · 服务端真实随机，每日一签，同日不复抽"
          />
          <div className="mt-14">
            <LingqianSection />
          </div>
        </div>
      </section>

      {/* S4 · 月令日历 */}
      <section className="relative bg-silk pb-28 pt-4">
        <div className="relative zf-container">
          <SectionHeading
            eyebrow="Month View"
            title="月令日历"
            sub="逐日干支真实推算，节气以公历近似表标注；点选某日看宜忌"
          />
          <div className="mt-14">
            <MonthCalendar today={now} />
          </div>
        </div>
      </section>

      {/* 浅 → 深 过渡 */}
      <div className="zf-fade-to-deep h-[160px]" />

      {/* S5 · 合本命（深色） */}
      <section className="bg-deep2 py-24">
        <div className="zf-container">
          <SectionHeading
            dark
            eyebrow="You & Today"
            title="今日与你"
            sub="输入生日，看今日日干与本命日干的生克关系"
          />
          <div className="mt-12">
            <HebenSection todayGz={dayGz} />
          </div>
        </div>
      </section>
    </div>
  )
}
