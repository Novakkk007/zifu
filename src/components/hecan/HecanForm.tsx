import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkle } from 'lucide-react'
import { GoldButton, GhostButton } from '@/components/Buttons'
import { FormInput, FormSelect, SegmentedControl } from '@/components/FormControls'
import ConfidenceBadge from '@/components/hecan/ConfidenceBadge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEngine } from '@/hooks/useEngine'
import { analyzeHecan } from '@/engines/client/hecan'
import type { BaziChartV2, BirthInput } from '@contracts/bazi-core'
import type { EngineResult } from '@contracts/engines/engine-result'
import type { ArtPrecision, HecanReport } from '@contracts/engines/hecan-core/types'

const HOURS = [
  { v: '子', t: '23:00–01:00' }, { v: '丑', t: '01:00–03:00' },
  { v: '寅', t: '03:00–05:00' }, { v: '卯', t: '05:00–07:00' },
  { v: '辰', t: '07:00–09:00' }, { v: '巳', t: '09:00–11:00' },
  { v: '午', t: '11:00–13:00' }, { v: '未', t: '13:00–15:00' },
  { v: '申', t: '15:00–17:00' }, { v: '酉', t: '17:00–19:00' },
  { v: '戌', t: '19:00–21:00' }, { v: '亥', t: '21:00–23:00' },
]

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱']

type HecanResponse = {
  result: EngineResult<HecanReport>
  chart: BaziChartV2
  chartId: number | null
  persisted: boolean
}

/** 术精度徽章：validated 已验证 / approximate 近似 / demo 演示 / unavailable 未接入 */
function PrecisionBadge({ precision }: { precision: ArtPrecision }) {
  const meta: Record<ArtPrecision, { label: string; cls: string }> = {
    validated: { label: '已验证', cls: 'border-gold/60 bg-gold/10 text-goldbright' },
    approximate: { label: '近似', cls: 'border-[#A9B2AC]/50 bg-[#A9B2AC]/10 text-[#A9B2AC]' },
    demo: { label: '演示', cls: 'border-[#C98F58]/50 bg-[#C98F58]/10 text-[#C98F58]' },
    unavailable: { label: '未接入', cls: 'border-silkmuted/30 bg-silkmuted/5 text-silkmuted' },
  }
  const m = meta[precision]
  return (
    <span className={`rounded-full border px-2 py-px font-sans text-[10.5px] tracking-[0.14em] ${m.cls}`}>
      {m.label}
    </span>
  )
}

export default function HecanForm() {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'qian' | 'kun'>('qian')
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>('solar')
  const [year, setYear] = useState(1995)
  const [month, setMonth] = useState(6)
  const [day, setDay] = useState(15)
  const [hour, setHour] = useState('子')
  const [result, setResult] = useState<HecanResponse | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  // 浏览器直跑引擎（静态托管无后端）；返回形状与 trpc.hecan.analyze 一致
  const analyze = useEngine(analyzeHecan, {
    onSuccess: (data) => setResult(data as unknown as HecanResponse),
  })

  useEffect(() => {
    if (result) {
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
  }, [result])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const hourIdx = HOURS.findIndex((h) => h.v === hour)
    const payload: BirthInput & { title?: string } = {
      calendar,
      year,
      month,
      day,
      hour: hourIdx < 0 ? 0 : (hourIdx * 2) % 24,
      minute: 0,
      gender: gender === 'qian' ? 'male' : 'female',
      useTrueSolarTime: false,
      dayRollover: 'zichu',
      title: name.trim() || undefined,
    }
    setResult(null)
    analyze.mutate(payload)
  }

  const labelCls = 'text-silkmuted'
  const report = result?.result.data ?? null
  const chart = result?.chart ?? null

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
        <GoldButton type="submit" className="mt-8 w-full" disabled={analyze.isPending}>
          {analyze.isPending ? '三盘并起中…' : '起三盘 · 免费概览'}
        </GoldButton>
        {analyze.isError && (
          <p className="mt-3 text-center text-[13px] text-[#C98F58]">
            起盘失败，请检查生辰信息后重试
          </p>
        )}
        <p className="mt-4 text-center text-[12px] tracking-[0.08em] text-silkmuted">
          提交即于本页生成三盘概览 · 详参 36 灵签 / 次
        </p>
      </form>

      {/* ===== 合参报告区（服务端真实返回） ===== */}
      <AnimatePresence>
        {result && report && chart && (
          <motion.div
            ref={resultRef}
            id="hecan-report"
            key="hc-result"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="scroll-mt-16 overflow-hidden"
          >
            <div className="pt-10">
              {/* 三术卡片 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {report.arts.map((art, i) => (
                  <motion.div
                    key={art.art}
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                    className="rounded-xl border border-gold/15 bg-deep2/70 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-latin text-[11px] uppercase tracking-[0.3em] text-gold">
                        {art.art}
                      </p>
                      <PrecisionBadge precision={art.precision} />
                    </div>
                    <h4 className="mt-1 font-serif text-[16px] font-bold text-silktext">
                      {art.artName}
                      <span className="ml-2 font-sans text-[11px] font-normal tracking-[0.08em] text-silkmuted">
                        {art.ruleVariant}
                      </span>
                    </h4>
                    {art.art === 'bazi' && (
                      <div className="mt-4 flex justify-between gap-2">
                        {[chart.pillars.year.ganzhi, chart.pillars.month.ganzhi, chart.pillars.day.ganzhi, chart.pillars.hour?.ganzhi ?? '—'].map(
                          (p, pi) => (
                            <div key={PILLAR_LABELS[pi]} className="flex flex-col items-center gap-1.5">
                              <span className="text-[10px] tracking-[0.2em] text-silkmuted">
                                {PILLAR_LABELS[pi]}
                              </span>
                              <span className="flex flex-col rounded-md border border-gold/25 px-2 py-1.5 font-serif text-[18px] font-bold leading-[1.4] text-goldbright">
                                <span>{p[0]}</span>
                                <span>{p[1] ?? ''}</span>
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                    {art.precision === 'unavailable' ? (
                      <p className="mt-4 text-[12px] leading-[1.9] text-silkmuted">
                        {art.summary}
                      </p>
                    ) : (
                      <ul className="mt-4 space-y-1.5">
                        {(art.art === 'bazi' ? art.keyPoints.slice(1) : art.keyPoints).map((k) => (
                          <li key={k} className="flex items-start gap-1.5 text-[12px] leading-[1.8] text-silktext/90">
                            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                            {k}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* 交叉互证 */}
              <motion.div
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.45 }}
                className="mt-6 rounded-xl border border-gold/20 bg-deep2 p-7 md:p-9"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkle className="h-4 w-4 text-goldbright" strokeWidth={1.5} />
                    <h4 className="font-serif text-[20px] font-bold tracking-[0.1em] text-silktext">
                      交叉互证 · 信度分档
                    </h4>
                  </div>
                  <ConfidenceBadge tier={report.overallTier} size={26} />
                </div>
                <div className="zf-hairline mt-4" />
                <ul className="mt-6 flex flex-col gap-5">
                  {report.crossChecks.map((check, i) => (
                    <motion.li
                      key={check.topic}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.45, delay: 0.55 + i * 0.12 }}
                      className="rounded-lg border border-gold/10 bg-deep/50 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-serif text-[14px] font-bold tracking-[0.1em] text-goldbright">
                          {check.topic}
                        </p>
                        <ConfidenceBadge tier={check.tier} size={20} />
                      </div>
                      <p className="mt-3 font-serif text-[15px] leading-[2] text-silktext">
                        {check.text}
                      </p>
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-6 text-[12px] leading-[1.9] text-silkmuted">
                  {report.disclaimer}
                </p>
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

      {/* 余额提示 Dialog */}
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
