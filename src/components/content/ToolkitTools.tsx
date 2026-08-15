/**
 * 百宝袋 6 个小工具面板
 * 确定性工具前端本地计算；灵签一抽走浏览器 CSPRNG（drawLingqian，静态托管无后端亦可用）。
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEngine } from '@/hooks/useEngine'
import { drawLingqian } from '@/engines/client'
import { useAuth } from '@/hooks/useAuth'
import { LOGIN_PATH } from '@/const'
import type { GuanyinSign } from '@contracts/engines/draws-core'
import {
  BRANCHES,
  BRANCH_WUXING,
  HOUR_RANGES,
  STEMS,
  STEM_WUXING,
  WUXING_ORDER,
  WUXING_SWATCH,
  ZODIAC,
  controlledBy,
  controls,
  dayGanzhiIndex,
  ganzhiLabel,
  generatedBy,
  generates,
  hourBranchOf,
  lodgeOf,
  monthPillar,
  yearGanzhiIndex,
} from '@/components/content/ganzhi'
import type { WuXing } from '@/components/content/ganzhi'

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

/* ================= 1 · 时辰对照 ================= */

export function ShichenTool() {
  const now = new Date()
  const [minutes, setMinutes] = useState(now.getHours() * 60 + now.getMinutes())
  const hour = Math.floor(minutes / 60) % 24
  const branch = hourBranchOf(hour)
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
          {BRANCHES[branch]}时
          <span className="ml-3 font-sans text-[13px] font-normal tracking-[0.08em] text-inkmuted">
            {HOUR_RANGES[branch]}
          </span>
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
                i === branch
                  ? 'border-gold bg-deep text-goldbright'
                  : 'border-golddim/20 bg-silk2 text-inkmuted hover:border-golddim/50',
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================= 2 · 生肖纪年 ================= */

export function ZodiacTool() {
  const [year, setYear] = useState(1995)
  const gz = yearGanzhiIndex(year)
  const branchIdx = gz % 12
  return (
    <div>
      <PanelTitle>公元年 ↔ 生肖干支</PanelTitle>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <input
          type="number"
          min={1}
          max={9999}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-label="年份"
          className={cn(inputCls, 'max-w-[180px] text-center font-latin text-[18px]')}
        />
        <div className="flex items-center gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-gold/40 font-serif text-[28px] font-black text-golddim">
            {ZODIAC[branchIdx]}
          </span>
          <div>
            <p className="font-serif text-[22px] font-bold text-inktext">
              {ganzhiLabel(gz)}年 · 属{ZODIAC[branchIdx]}
            </p>
            <p className="mt-1 font-sans text-[12.5px] tracking-[0.08em] text-inkmuted">
              年柱依 (年份 − 4) ÷ 60 取余推算
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================= 3 · 干支换算 ================= */

function toISODate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function GanzhiTool() {
  const [iso, setIso] = useState(() => toISODate(new Date()))
  const pillars = useMemo(() => {
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return null
    const month = monthPillar(y, m, d)
    return {
      year: ganzhiLabel(yearGanzhiIndex(y)),
      month: month.label,
      day: ganzhiLabel(dayGanzhiIndex(y, m, d)),
      y,
      m,
      d,
    }
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
          年柱按 (年份 − 4) % 60；日柱以 1900-01-01（甲戌日）为锚逐日累加；月柱按节气近似表与五虎遁起月干
        </p>
      </div>
    </div>
  )
}

/* ================= 4 · 星宿速查 ================= */

const LODGE_NOTES: Record<string, string> = {
  角: '角宿主仁，凡事有始，宜谋新篇。',
  亢: '亢宿性刚，宜守不宜攻，戒躁。',
  氐: '氐宿如根，宜固本培元，缓图后劲。',
  房: '房宿明堂，宜会友议事，开门纳客。',
  心: '心宿主明察，宜静心思虑，审慎落笔。',
  尾: '尾宿主收束，宜了结旧务，清点尾数。',
  箕: '箕宿主风，宜散郁抒怀，吐故纳新。',
  斗: '斗宿主量，宜权衡取舍，公平持正。',
  牛: '牛宿主勤，宜深耕不辍，勿问收获。',
  女: '女宿主柔，宜以退为进，以柔化刚。',
  虚: '虚宿主空明，宜删繁就简，留白养气。',
  危: '危宿居高，宜谨慎言行，居高思坠。',
  室: '室宿主安，宜居家修整，洒扫庭除。',
  壁: '壁宿主文，宜读书写字，涵养笔墨。',
  奎: '奎宿主文昌，宜著述立言，投稿应试。',
  娄: '娄宿主聚众，宜团队协作，聚众成事。',
  胃: '胃宿主仓廪，宜理财积储，量入为出。',
  昴: '昴宿主明，宜决断分明，当断则断。',
  毕: '毕宿主网，宜收网成事，收口小成。',
  觜: '觜宿主言，宜慎语三思，沉默为金。',
  参: '参宿主衡，宜持平守中，不偏不倚。',
  井: '井宿主源，宜饮水思源，回访故旧。',
  鬼: '鬼宿主幽，宜独处内省，静夜观心。',
  柳: '柳宿主柔条，宜顺势而为，不逆其势。',
  星: '星宿主辉，宜亮相展示，毛遂自荐。',
  张: '张宿主张设，宜布置规划，张弛有度。',
  翼: '翼宿主飞，宜远行开拓，展翅一试。',
  轸: '轸宿主车尾，宜复盘回望，鉴往知来。',
}

export function LodgeTool() {
  const [iso, setIso] = useState('1995-06-15')
  const lodge = useMemo(() => {
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return null
    return lodgeOf(y, m, d)
  }, [iso])

  return (
    <div>
      <PanelTitle>生日 → 二十八宿值日</PanelTitle>
      <div className="flex flex-col items-center">
        <input
          type="date"
          value={iso}
          onChange={(e) => e.target.value && setIso(e.target.value)}
          aria-label="生日"
          className={cn(inputCls, 'max-w-[220px] text-center')}
        />
        {lodge && (
          <div className="mt-7 flex flex-col items-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/50 font-serif text-[38px] font-black text-golddim">
              {lodge}
            </span>
            <p className="mt-4 font-serif text-[17px] font-bold text-inktext">
              值日星宿 · {lodge}宿
            </p>
            <p className="mt-2 max-w-[420px] text-center font-sans text-[13.5px] leading-[1.95] text-inkmuted">
              {LODGE_NOTES[lodge]}
            </p>
            <p className="mt-3 font-sans text-[11.5px] tracking-[0.08em] text-inkmuted/70">
              值日星宿按 28 宿逐日循环推排（mock 宿性短评，供文化体验）
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================= 5 · 灵签一抽（服务端真实随机） ================= */

type QianDraw = { signNo: number; sign: GuanyinSign; idempotentReplay: boolean }

export function QianTool() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [drawn, setDrawn] = useState<QianDraw | null>(null)
  const [shaking, setShaking] = useState(false)

  // 浏览器直跑（静态托管无后端）：CSPRNG 抽签 + localStorage 幂等复放，
  // 返回形状与 trpc.draws.lingqian 一致
  const lingqian = useEngine(drawLingqian, {
    onSuccess: (data) => {
      setDrawn(data.result.data as unknown as QianDraw)
      setShaking(false)
    },
    onError: () => setShaking(false),
  })

  const draw = () => {
    if (shaking) return
    setShaking(true)
    setDrawn(null)
    const t = new Date()
    const dateKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
    // 摇筒动画与抽签并行；每日幂等键保证同日同签（游客按本机 guest 键幂等）
    const uid = user?.id ?? 'guest'
    window.setTimeout(() => {
      lingqian.mutate({ idempotencyKey: `${uid}-${dateKey}` })
    }, 620)
  }

  return (
    <div>
      <PanelTitle>每日一签 · 随缘自取</PanelTitle>
      <div className="flex flex-col items-center">
        {!isAuthenticated && !isLoading && (
          <p className="mb-5 max-w-[420px] text-center font-sans text-[12.5px] leading-[1.9] text-inkmuted">
            游客模式：签号由浏览器加密随机数（CSPRNG）均匀抽取，今日之签在本机恒定；
            <Link to={LOGIN_PATH} className="text-golddim underline underline-offset-4 hover:text-gold">
              登录
            </Link>
            后可跨设备同步每日一签。
          </p>
        )}
        {/* CSS 签筒 */}
        <motion.button
          type="button"
          onClick={draw}
          aria-label="抽一签"
          animate={shaking ? { rotate: [0, -8, 8, -8, 8, 0] } : { rotate: 0 }}
          transition={{ duration: 0.6 }}
          className="group relative flex h-[132px] w-[104px] items-end justify-center"
        >
          {/* 签枝 */}
          <div className="absolute inset-x-0 top-0 flex justify-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                animate={shaking ? { y: [0, -14 - (i % 3) * 6, 0] } : { y: 0 }}
                transition={{ duration: 0.55, delay: i * 0.03 }}
                className="block h-[64px] w-[7px] rounded-t-sm border border-golddim/50 bg-silk2"
                style={{ transformOrigin: 'bottom' }}
              />
            ))}
          </div>
          {/* 筒身 */}
          <div className="relative flex h-[84px] w-[96px] items-center justify-center rounded-b-[14px] rounded-t-md border border-gold/50 bg-deep shadow-card">
            <span className="font-serif text-[22px] font-black tracking-[0.2em] text-goldbright">签</span>
            <span className="absolute inset-x-3 top-2 h-px bg-gold/30" />
          </div>
        </motion.button>
        <p className="mt-4 font-sans text-[12.5px] tracking-[0.14em] text-inkmuted">
          点击签筒，摇出一签
        </p>

        <AnimatePresence mode="wait">
          {drawn && (
            <motion.div
              key={drawn.signNo}
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="mt-7 w-full max-w-[420px] rounded-xl border border-golddim/30 bg-silk2 p-7 text-center"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="rounded-full border border-gold/50 px-3 py-0.5 font-sans text-[11px] font-medium tracking-[0.14em] text-golddim">
                  {drawn.sign.grade}
                </span>
                <span className="font-serif text-[20px] font-bold tracking-[0.14em] text-inktext">
                  第 {drawn.signNo} 签
                </span>
              </div>
              <div className="zf-hairline mx-auto mt-4" />
              <div className="mt-4 space-y-1">
                {drawn.sign.poem.map((line) => (
                  <p key={line} className="font-serif text-[16px] leading-[2.1] text-inktext">
                    {line}
                  </p>
                ))}
              </div>
              <p className="mt-4 font-sans text-[13px] leading-[1.9] text-inkmuted">
                简注：{drawn.sign.note}
              </p>
              <p className="mt-3 font-sans text-[11px] tracking-[0.06em] text-inkmuted/70">
                观音灵签通行本 · CSPRNG 均匀抽取 · 每日一签 · 仅供文化体验
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {drawn && (
          <button
            type="button"
            onClick={draw}
            className="zf-link-more mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium tracking-[0.1em] text-golddim"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 再摇签筒（今日之签不变） <span className="zf-arrow">→</span>
          </button>
        )}
      </div>
    </div>
  )
}

/* ================= 6 · 五行速查 ================= */

const RELATIONS: { key: string; label: string; resolve: (el: WuXing) => WuXing }[] = [
  { key: 'shengwo', label: '生我 · 印星', resolve: (el) => generatedBy(el) },
  { key: 'wosheng', label: '我生 · 食伤', resolve: (el) => generates(el) },
  { key: 'kewo', label: '克我 · 官杀', resolve: (el) => controlledBy(el) },
  { key: 'woke', label: '我克 · 财星', resolve: (el) => controls(el) },
  { key: 'tongwo', label: '同我 · 比劫', resolve: (el) => el },
]

function resolveWuxing(input: string): { el: WuXing; via: string } | null {
  for (const ch of input.trim()) {
    const si = STEMS.indexOf(ch as (typeof STEMS)[number])
    if (si >= 0) return { el: STEM_WUXING[si], via: `天干「${ch}」` }
    const bi = BRANCHES.indexOf(ch as (typeof BRANCHES)[number])
    if (bi >= 0) return { el: BRANCH_WUXING[bi], via: `地支「${ch}」` }
    const zi = ZODIAC.indexOf(ch as (typeof ZODIAC)[number])
    if (zi >= 0) return { el: BRANCH_WUXING[zi], via: `生肖「${ch}」（${BRANCHES[zi]}）` }
    if ((WUXING_ORDER as string[]).includes(ch)) return { el: ch as WuXing, via: `五行「${ch}」` }
  }
  return null
}

export function WuxingTool() {
  const [input, setInput] = useState('甲')
  const result = resolveWuxing(input)

  return (
    <div>
      <PanelTitle>查某字 / 干支 / 生肖的五行归属</PanelTitle>
      <div className="flex flex-col items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入天干、地支或生肖，如：甲 / 辰 / 龙"
          aria-label="查询字"
          className={cn(inputCls, 'max-w-[320px] text-center')}
        />
        {result ? (
          <div className="mt-7 flex flex-col items-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full border font-serif text-[30px] font-black"
              style={{
                borderColor: 'rgb(var(--gold) / 0.5)',
                backgroundColor: WUXING_SWATCH[result.el],
                color: result.el === '金' || result.el === '土' ? '#22302C' : '#F6F3E6',
              }}
            >
              {result.el}
            </span>
            <p className="mt-3 font-sans text-[13px] tracking-[0.06em] text-inkmuted">
              {result.via} · 五行属<span className="font-serif font-semibold text-golddim">{result.el}</span>
            </p>

            {/* 生克关系 */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {RELATIONS.map((r) => {
                const target = r.resolve(result.el)
                return (
                  <div
                    key={r.key}
                    className="flex flex-col items-center rounded-lg border border-golddim/20 bg-silk2 px-3 py-3"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: WUXING_SWATCH[target] }}
                    />
                    <span className="mt-1.5 font-serif text-[16px] font-bold text-inktext">{target}</span>
                    <span className="mt-0.5 text-center font-sans text-[10.5px] leading-tight text-inkmuted">
                      {r.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 相生环 */}
            <div className="mt-6 flex items-center gap-1.5">
              {WUXING_ORDER.map((el, i) => (
                <span key={el} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-1 font-serif text-[13px]',
                      el === result.el
                        ? 'border-gold bg-deep text-goldbright'
                        : 'border-golddim/25 text-inkmuted',
                    )}
                  >
                    {el}
                  </span>
                  <span className="text-[11px] text-golddim/70">{i === WUXING_ORDER.length - 1 ? '↺' : '→'}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 font-sans text-[11.5px] tracking-[0.08em] text-inkmuted/70">
              外圈为相生之序：木生火、火生土、土生金、金生水、水生木
            </p>
          </div>
        ) : (
          <p className="mt-6 font-sans text-[13px] text-inkmuted">
            未识别——请输入天干（甲乙丙…）、地支（子丑寅…）或生肖（鼠牛虎…）
          </p>
        )}
      </div>
    </div>
  )
}


