import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageHero from '@/components/sanshi/PageHero'
import SectionHeading from '@/components/SectionHeading'
import QuoteStrip from '@/components/QuoteStrip'
import JiugongPlate from '@/components/sanshi/JiugongPlate'
import { FormInput, SegmentedControl } from '@/components/FormControls'
import { DeepButton, GoldButton } from '@/components/Buttons'
import { setPageMeta } from '@/lib/pageMeta'
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
  type QimenChart,
  type QimenPalace,
} from '@contracts/engines/qimen-core'
import type { EngineResult } from '@contracts/engines/engine-result'
import { trpc } from '@/providers/trpc'
import { useEngine } from '@/hooks/useEngine'
import { qijuQimen } from '@/engines/client/qimen'
import { aiBackendUnavailableText } from '@/lib/ai-reading-error'
import { useAuth } from '@/hooks/useAuth'
import { usePaymentEnabled, RECHARGE_CLOSED_HINT } from '@/hooks/usePaymentEnabled'
import { LOGIN_PATH } from '@/const'
import { cn } from '@/lib/utils'
import { SafeStorage, STORAGE_KEYS } from '@/lib/storage'
import type { FavoriteItem, HistoryItem } from '@/lib/storage'

const HERO_POOL = [
  '休', '生', '伤', '杜', '景', '死', '惊', '开',
  '天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心',
  '值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天',
  '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
]

/** 东八区当前墙钟 → datetime-local 值 */
function nowBeijingLocal(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/* ------------------------------------------------------------------ */
/* 用神锚定（传统取象映射）                                                */
/* ------------------------------------------------------------------ */

type Yongshen = {
  key: string
  hint: string
  type: 'door' | 'star' | 'god' | 'gan'
  value: string
}

const YONGSHEN_LIST: Yongshen[] = [
  { key: '求财', hint: '生门为财源', type: 'door', value: '生' },
  { key: '出行', hint: '开门主远行', type: 'door', value: '开' },
  { key: '合作', hint: '六合主缔约', type: 'god', value: '六合' },
  { key: '疾病', hint: '天芮为病星', type: 'star', value: '天芮' },
  { key: '考试', hint: '景门主文书', type: 'door', value: '景' },
  { key: '姻缘', hint: '乙奇为日奇', type: 'gan', value: '乙' },
  { key: '官非', hint: '惊门主口舌', type: 'door', value: '惊' },
  { key: '谋职', hint: '值符为贵极', type: 'god', value: '值符' },
  { key: '失物', hint: '玄武主遗失', type: 'god', value: '玄武' },
  { key: '置业', hint: '九地主田土', type: 'god', value: '九地' },
]

function chartTitle(chart: QimenChart): string {
  return chart.question.trim()
    ? `${chart.question.trim()} · 奇门遁甲`
    : `奇门局 ${chart.standardTime}`
}

function yongshenPalace(chart: QimenChart, y: Yongshen): number {
  const found = chart.palaces.find((p) => {
    if (y.type === 'door') return p.door === y.value
    if (y.type === 'star') return p.star === y.value
    if (y.type === 'god') return p.god === y.value
    return p.tianGan === y.value || p.diGan === y.value
  })
  return found?.num ?? 5
}

/* ------------------------------------------------------------------ */
/* AI 参详（chartId → ai.reading，与六爻/八字同一通道）                     */
/* ------------------------------------------------------------------ */

type Persona = 'scholar' | 'hermit'
type Depth = 'pro' | 'plain'

interface ReadingResponse {
  text: string
  source: 'live' | 'fallback'
  model: string | null
}

function trpcCode(err: unknown): string | null {
  if (err && typeof err === 'object' && 'data' in err) {
    const code = (err as { data?: { code?: unknown } }).data?.code
    if (typeof code === 'string') return code
  }
  return null
}

function newIdempotencyKey(chartId: number): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.trunc(performance.now() * 1000).toString(36)}`
  return `qimen-reading:${chartId}:${uuid}`
}

function QimenAiReading({ chartId }: { chartId: number | null }) {
  const { user, isLoading: authLoading } = useAuth()
  const paymentEnabled = usePaymentEnabled()
  const [persona, setPersona] = useState<Persona>('scholar')
  const [depth, setDepth] = useState<Depth>('pro')
  const [result, setResult] = useState<ReadingResponse | null>(null)

  const reading = trpc.ai.reading.useMutation({
    onSuccess: (data) => setResult(data as unknown as ReadingResponse),
  })

  const canRun = !!user && chartId !== null && !reading.isPending
  const run = () => {
    if (!canRun || chartId === null) return
    setResult(null)
    reading.mutate({ chartId, persona, depth, idempotencyKey: newIdempotencyKey(chartId) })
  }

  if (!authLoading && !user) {
    return (
      <div className="rounded-xl border border-gold/40 bg-deep p-10 text-center">
        <p className="font-serif text-[18px] font-bold tracking-[0.1em] text-silktext">
          登录后使用 AI 参详
        </p>
        <p className="mx-auto mt-3 max-w-[460px] text-[13px] leading-[1.9] text-silkmuted">
          局盘会自动保存在本机；AI 参详登录后直连服务，服务不可用时进入降级模式。
          每日 20 次额度；live 参详每次消耗 1 灵签，模板参详免费，失败不扣费。
        </p>
        <DeepButton to={LOGIN_PATH} className="mt-7 border border-gold/50">
          前往登录
        </DeepButton>
      </div>
    )
  }

  const errState = reading.isError
    ? (() => {
        // 静态托管无后端：fetch/JSON 解析类错误兜底为友好文案
        const unavailable = aiBackendUnavailableText(reading.error)
        if (unavailable) return { title: '参详失败', desc: unavailable, showLogin: false }
        const code = trpcCode(reading.error)
        const msg = reading.error instanceof Error ? reading.error.message : ''
        if (code === 'UNAUTHORIZED')
          return { title: '登录态已失效', desc: '请重新登录后再参详。', showLogin: true }
        if (code === 'TOO_MANY_REQUESTS')
          return { title: '额度或频率受限', desc: msg || '请稍后再试。', showLogin: false }
        if (code === 'FORBIDDEN')
          return {
            title: '灵签余额不足',
            desc: paymentEnabled
              ? 'live 参详每次消耗 1 灵签，请充值后再试。'
              : `live 参详每次消耗 1 灵签。${RECHARGE_CLOSED_HINT}。`,
            showLogin: false,
          }
        return { title: '参详失败', desc: msg || 'AI 服务暂不可用，本次未扣费。', showLogin: false }
      })()
    : null

  const paragraphs = result
    ? result.text.split(/\n{2,}|\n/).filter((p) => p.trim().length > 0)
    : []

  return (
    <div>
      <div className="text-center">
        <SegmentedControl<Persona>
          id="qimen-persona"
          value={persona}
          onChange={setPersona}
          options={[
            { value: 'scholar', label: '严谨学者' },
            { value: 'hermit', label: '幽默隐士' },
          ]}
        />
        <div className="mt-4">
          <SegmentedControl<Depth>
            id="qimen-depth"
            value={depth}
            onChange={setDepth}
            options={[
              { value: 'pro', label: '专业级 · 完整推演' },
              { value: 'plain', label: '通俗级 · 直给结论' },
            ]}
          />
        </div>
      </div>
      <div className="mt-8 text-center">
        <GoldButton
          disabled={!canRun}
          className={cn(!canRun && 'cursor-not-allowed opacity-40')}
          onClick={run}
        >
          {reading.isPending ? '参详中…' : '参详此局'}
        </GoldButton>
        {chartId === null && (
          <p className="mt-3 text-[12.5px] text-silkmuted">
            局盘已保存在本机；当前为 AI 降级模式。请在服务可用且已登录时重新起局，以启用直连参详。
          </p>
        )}
        <p className="mt-3 text-[11.5px] text-silkmuted">
          live 参详每次消耗 1 灵签；模板参详（非 AI，fallback）免费；参详失败不扣费。
        </p>
        {errState && (
          <div
            role="alert"
            className="mx-auto mt-5 max-w-[520px] rounded-lg border border-[#B04A3A]/50 bg-[#B04A3A]/10 px-5 py-4"
          >
            <p className="font-serif text-[14px] font-bold tracking-[0.08em] text-[#E0A39A]">
              {errState.title}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-[1.8] text-[#E0A39A]/90">{errState.desc}</p>
            {errState.showLogin && (
              <DeepButton to={LOGIN_PATH} className="mt-4 border border-gold/40 px-6 py-2 text-[13px]">
                重新登录
              </DeepButton>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            key={`${persona}-${depth}-${result.source}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 rounded-xl border-l-[3px] border-gold bg-deep p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] tracking-[0.14em] text-silkmuted">
                参详输出 · {persona === 'scholar' ? '严谨学者' : '幽默隐士'} ·{' '}
                {depth === 'pro' ? '专业级' : '通俗级'}
              </p>
              {result.source === 'live' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-[11.5px] font-medium tracking-[0.12em] text-goldbright">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-goldbright" />
                  live · 模型 {result.model ?? '未知'} · 消耗 1 灵签
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-silkmuted/40 bg-silktext/5 px-3 py-1 text-[11.5px] font-medium tracking-[0.12em] text-silkmuted">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-silkmuted" />
                  fallback · 模板参详（非 AI 生成，免费）
                </span>
              )}
            </div>
            <div className="mt-6 space-y-5">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="whitespace-pre-wrap font-serif text-[15.5px] leading-[2.1] text-silktext"
                >
                  {p}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 页面                                                                  */
/* ------------------------------------------------------------------ */

export default function Qimen() {
  const initDt = useMemo(() => nowBeijingLocal(), [])
  const [datetime, setDatetime] = useState(initDt)
  const [question, setQuestion] = useState('')
  const [out, setOut] = useState<{
    result: EngineResult<QimenChart>
    chartId: number | null
  } | null>(null)
  const [runId, setRunId] = useState(0)
  const [selected, setSelected] = useState<QimenPalace | null>(null)
  const [ysIdx, setYsIdx] = useState(0)
  const [favoriteStatus, setFavoriteStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const plateRef = useRef<HTMLElement | null>(null)

  // 浏览器直跑引擎（静态托管无后端）；返回形状与 trpc.qimen.qiju 一致
  const qiju = useEngine(qijuQimen, {
    onSuccess: (res) => {
      setOut({ result: res.result, chartId: res.chartId })
      setYsIdx(0)
      setRunId((n) => n + 1)
      if (res.result.data) {
        const item: HistoryItem = {
          id: `hist-${Date.now()}`,
          type: 'qimen',
          title: chartTitle(res.result.data),
          createdAt: new Date().toISOString(),
          payload: res.result.data,
        }
        const existing = SafeStorage.get<HistoryItem[]>(STORAGE_KEYS.HISTORY, [])
        SafeStorage.set(STORAGE_KEYS.HISTORY, [item, ...existing].slice(0, 10))
      }
      requestAnimationFrame(() =>
        plateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      )
    },
  })

  useEffect(() => {
    setPageMeta(
      '奇门遁甲 · 紫府 — 时家拆补法，真实节气起局',
      '紫府奇门遁甲——时家拆补法，真实节气起局，锚定用神梳理行动策略。',
    );
  }, [])

  useEffect(() => {
    if (favoriteStatus === 'idle') return
    const timer = window.setTimeout(() => setFavoriteStatus('idle'), 1800)
    return () => window.clearTimeout(timer)
  }, [favoriteStatus])

  const submit = () => {
    if (!datetime) return
    qiju.mutate({
      datetime,
      ianaTimezone: 'Asia/Shanghai',
      question: question.trim() || undefined,
    })
  }

  const chart = out?.result.data ?? null
  const meta = out?.result.meta ?? null
  const yongshen = YONGSHEN_LIST[ysIdx]
  const ysPalace = chart ? yongshenPalace(chart, yongshen) : 5

  const handleFavorite = () => {
    if (!chart) return
    const item: FavoriteItem = {
      id: `fav-${out?.chartId ?? 'local'}-${Date.now()}`,
      type: 'qimen',
      title: chartTitle(chart),
      createdAt: new Date().toISOString(),
      payload: chart,
    }
    const existing = SafeStorage.get<FavoriteItem[]>(STORAGE_KEYS.FAVORITES, [])
    const deduped = existing.filter((favorite) => {
      if (favorite.type !== 'qimen') return true
      return (favorite.payload as Partial<QimenChart>)?.utcTime !== chart.utcTime
    })
    setFavoriteStatus(SafeStorage.set(STORAGE_KEYS.FAVORITES, [item, ...deduped]) ? 'success' : 'error')
  }

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

      {/* 真实算法标注：拆补法 · validated */}
      <div role="note" className="zf-container pt-5">
        <p className="inline-flex max-w-full items-center gap-2 rounded-lg border border-gold/50 bg-silk px-3.5 py-2 font-sans text-[12px] leading-[1.6] tracking-[0.06em] text-golddim">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
          <span>
            {meta
              ? `${meta.ruleVariant} · ${meta.precision === 'validated' ? '真实算法（已校验）' : meta.precision} · ${meta.algorithmVersion}`
              : '时家奇门-拆补法(转盘) · 真实节气起局'}
          </span>
        </p>
      </div>

      {/* ===== S2 · 起局表单 ===== */}
      <section className="relative bg-silk pb-24 pt-4">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative zf-container flex flex-col items-center">
          <SectionHeading
            eyebrow="Time Chart"
            title="起 局"
            sub="默认此时此刻（东八区），亦可自定时刻——同一时刻，局盘如一"
          />
          <div className="mt-12 w-full max-w-[680px] rounded-xl border border-golddim/25 bg-silk2 p-4 shadow-card sm:p-8 md:p-10">
            <FormInput
              label="起局时刻（东八区墙钟）"
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />
            <FormInput
              className="mt-6"
              label="所问之事（可选）"
              placeholder="问事方向，如出行 / 求财 / 合作"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="mt-6">
              <p className="mb-2 font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">排法</p>
              <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-golddim/30 bg-silk p-1 sm:rounded-full">
                <span className="rounded-full bg-deep px-4 py-2 font-sans text-[13.5px] font-medium tracking-[0.08em] text-silk sm:px-5">
                  时家奇门 · 拆补法
                </span>
                {['置闰法', '日家', '月家'].map((m) => (
                  <span
                    key={m}
                    className="cursor-not-allowed rounded-full px-4 py-2 font-sans text-[13.5px] tracking-[0.08em] text-inkmuted/50 sm:px-5"
                    title="陆续开放"
                  >
                    {m} · 待开放
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-8 flex justify-center">
              <GoldButton
                className={cn('w-full sm:w-auto', qiju.isPending && 'cursor-wait opacity-60')}
                disabled={qiju.isPending}
                onClick={submit}
              >
                {qiju.isPending ? '起局中…' : '起局'}
              </GoldButton>
            </div>
            {qiju.isError && (
              <p role="alert" className="mt-4 text-center text-[13px] text-red-700/90">
                {qiju.error instanceof Error ? qiju.error.message : '起局失败，请检查时刻输入。'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ===== S3 · 九宫盘 ===== */}
      <AnimatePresence>
        {chart && meta && (
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
                {`${chart.dun}${JU_CN[chart.ju - 1]}局 · ${chart.jie}${chart.yuan} · 旬首 ${chart.xunshou} · 值符 ${chart.zhifuStar} / 值使 ${chart.zhishiDoor}门`
                  .split('')
                  .map((ch, i) => (
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
                {chart.standardTime}（东八区）· {chart.jie}交节 {chart.jieTime} · 日干支 {chart.dayGZ} · 时干支 {chart.hourGZ}
              </p>
              <p className="mt-1 text-center text-[12.5px] tracking-[0.1em] text-inkmuted">
                符头 {chart.futou} · 空亡 {chart.kongWang.join('')} · 马星 {chart.maXingBranch}（{GUA_LABEL[chart.maXingPalace]}宫）
              </p>
              <div className="mt-12">
                <JiugongPlate key={runId} palaces={chart.palaces} onSelect={setSelected} />
              </div>
              <p className="mt-8 text-center text-[12.5px] tracking-[0.08em] text-inkmuted">
                点按宫格，参看该宫门星神干组合
              </p>
              {meta.warnings.length > 0 && (
                <p className="mt-2 text-center text-[12px] tracking-[0.06em] text-inkmuted/80">
                  {meta.warnings.join('；')}
                </p>
              )}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleFavorite}
                  aria-live="polite"
                  className="zf-link-more inline-flex items-center gap-1 text-[14px] font-medium tracking-[0.1em] text-golddim"
                >
                  {favoriteStatus === 'success'
                    ? '已收藏'
                    : favoriteStatus === 'error'
                      ? '保存失败'
                      : '收藏'}
                </button>
              </div>
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
                    {selected.gua}宫 · {selected.star || '中宫'}
                    {selected.starJi ? `（${selected.starJi}寄）` : ''}
                    {selected.door ? ` · ${selected.door}门` : ''}
                    {selected.god ? ` · ${selected.god}${selected.godAlias ? `(${selected.godAlias})` : ''}` : ''}
                  </DrawerTitle>
                  <DrawerDescription className="text-[13px] text-silkmuted">
                    天盘 {selected.tianGan || '—'}
                    {selected.tianGanJi ? `（寄干 ${selected.tianGanJi}）` : ''} ／ 地盘 {selected.diGan}
                    {selected.isZhifu && ' · 值符所临'}
                    {selected.isZhishi && ' · 值使之门'}
                    {selected.isKongWang && ' · 空亡'}
                    {selected.hasMaXing && ' · 马星'}
                  </DrawerDescription>
                </DrawerHeader>
                <div className="rounded-xl border-l-[3px] border-gold bg-deep3/60 px-6 py-5">
                  <p className="font-serif text-[15.5px] leading-[2.1] text-silktext">
                    {selected.door
                      ? `${selected.door}门（${DOOR_KIND[selected.door] ?? '平'}门）临${selected.star || '中宫'}，天盘${selected.tianGan || '—'}加地盘${selected.diGan}。`
                      : `中五之宫，地盘${selected.diGan}寄坤二宫行权。`}
                    {selected.isKongWang && '此宫逢时柱旬空，事多虚耗、应期待填实。'}
                    {selected.hasMaXing && '马星临宫，主动、主速、主变迁。'}
                  </p>
                </div>
                <p className="mt-5 text-center text-[12px] tracking-[0.1em] text-silkmuted/70">
                  以上为局盘事实标注 · 引经断语请用下方 AI 参详
                </p>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ===== S4 · 用神参详 + AI 参详（深色） ===== */}
      {chart && (
        <>
          <div className="zf-fade-to-deep h-[160px]" />
          <section className="relative overflow-hidden bg-deep2 py-24">
            <div className="relative zf-container">
              <SectionHeading
                dark
                eyebrow="Focus Anchor"
                title="用 神 参 详"
                sub="锚定所问之事，观其落宫——左选用神定位，右启 AI 引经参详"
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
                      const p = chart.palaces[num - 1]
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

                {/* 右：AI 参详 */}
                <div>
                  <QimenAiReading key={`${runId}-${out?.chartId ?? 'guest'}`} chartId={out?.chartId ?? null} />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ===== S5 · 典籍依据 ===== */}
      {!chart && <div className="zf-fade-to-deep h-[160px]" />}
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
            <p className="mt-6 text-center text-[12.5px] leading-[1.9] tracking-[0.08em] text-silkmuted">
              本页起局为时家奇门拆补法（转盘）：以真实节气时刻定阴阳遁，
              符头甲己日地支定三元局数，值符随时干、值使随时宫，阳顺阴逆布星门神。
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
