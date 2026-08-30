/**
 * 生辰录入卡：完整 BirthInput 表单，提交给服务端 trpc.bazi.paipan。
 */
import { useMemo, useState } from 'react'
import { BRANCHES } from '@contracts/bazi-core'
import { FormInput, FormSelect, SegmentedControl } from '@/components/FormControls'
import { GoldButton } from '@/components/Buttons'
import { CITIES } from '@/lib/cities'
import type { PaipanPayload } from './api'

/** 时辰选项：12 时辰（含钟点） + 时辰不详 */
const SHICHEN_OPTIONS = [
  ...BRANCHES.map((b, i) => {
    const start = (23 + i * 2) % 24
    const end = (start + 2) % 24
    const fmt = (h: number) => String(h).padStart(2, '0')
    return { value: i, label: `${b}时 ${fmt(start)}:00–${fmt(end)}:00` }
  }),
]

const YEARS = Array.from({ length: 2100 - 1900 + 1 }, (_, i) => 1900 + i).reverse()
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const CUSTOM_CITY = '__custom__'
/** 不使用 IANA 时区，回退到固定 UTC 偏移（legacy timezone 字段） */
const FIXED_OFFSET = '__fixed__'

/**
 * 常用 IANA 时区（≥20 个，覆盖亚欧美澳常用出生地）。
 * 选择后服务端按出生当日该时区的历史 UTC 偏移换算（含历史夏令时）。
 */
const IANA_TIMEZONES: { value: string; label: string }[] = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai · 中国标准时间（UTC+8）' },
  { value: 'Asia/Urumqi', label: 'Asia/Urumqi · 新疆（UTC+6，地理时区）' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong · 香港（UTC+8）' },
  { value: 'Asia/Taipei', label: 'Asia/Taipei · 台北（UTC+8）' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore · 新加坡（UTC+8）' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo · 东京（UTC+9）' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul · 首尔（UTC+9）' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok · 曼谷（UTC+7）' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta · 雅加达（UTC+7）' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata · 印度（UTC+5:30）' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai · 迪拜（UTC+4）' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow · 莫斯科（UTC+3）' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin · 柏林（UTC+1，夏令时）' },
  { value: 'Europe/Paris', label: 'Europe/Paris · 巴黎（UTC+1，夏令时）' },
  { value: 'Europe/London', label: 'Europe/London · 伦敦（UTC+0，夏令时）' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo · 圣保罗（UTC-3）' },
  { value: 'America/New_York', label: 'America/New_York · 纽约（UTC-5，夏令时）' },
  { value: 'America/Chicago', label: 'America/Chicago · 芝加哥（UTC-6，夏令时）' },
  { value: 'America/Denver', label: 'America/Denver · 丹佛（UTC-7，夏令时）' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles · 洛杉矶（UTC-8，夏令时）' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney · 悉尼（UTC+10，夏令时）' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland · 奥克兰（UTC+12，夏令时）' },
]

/** 预设城市 → 建议 IANA 时区（用户可改）；中国大陆城市默认东八区 */
const CITY_TZ_SUGGESTION: Record<string, string> = {
  乌鲁木齐: 'Asia/Urumqi',
  拉萨: 'Asia/Urumqi',
}

function suggestTimezone(cityName: string): string {
  return CITY_TZ_SUGGESTION[cityName] ?? 'Asia/Shanghai'
}

export interface BirthFormState {
  calendar: 'solar' | 'lunar'
  isLeapMonth: boolean
  year: number
  month: number
  day: number
  /** 时辰地支序号 0-11；null = 时辰不详 */
  hourBranch: number | null
  /** 仅时辰=子时有效：早子时(00:00-01:00) / 晚子时(23:00-24:00) */
  ziVariant: 'early' | 'late'
  minute: number
  gender: 'male' | 'female'
  /** 预设城市名，或 CUSTOM_CITY */
  city: string
  customLongitude: number
  timezone: number
  /** IANA 时区名；FIXED_OFFSET = 不使用 IANA，回退固定 UTC 偏移 */
  ianaTimezone: string
  useTrueSolarTime: boolean
  dayRollover: 'zichu' | 'midnight'
}

export function defaultBirthForm(): BirthFormState {
  return {
    calendar: 'solar',
    isLeapMonth: false,
    year: 1990,
    month: 6,
    day: 15,
    hourBranch: 6,
    ziVariant: 'early',
    minute: 0,
    gender: 'male',
    city: '北京',
    customLongitude: 120,
    timezone: 8,
    ianaTimezone: 'Asia/Shanghai',
    useTrueSolarTime: true,
    dayRollover: 'zichu',
  }
}

/** 表单状态 → 服务端 BirthInput 载荷 */
export function toPayload(f: BirthFormState, title?: string): PaipanPayload {
  const city = CITIES.find((c) => c.name === f.city)
  const isCustom = f.city === CUSTOM_CITY
  return {
    calendar: f.calendar,
    year: f.year,
    month: f.month,
    day: f.day,
    // 时辰支序 → 代表小时：丑=2、寅=4……；子时按早子(0)/晚子(23)区分，
    // 晚子时提交 23，由引擎按 dayRollover 规则处理换日（修复 23:30 被错转为 00:30 的 bug）
    hour:
      f.hourBranch === null
        ? null
        : f.hourBranch === 0
          ? f.ziVariant === 'late'
            ? 23
            : 0
          : (f.hourBranch * 2) % 24,
    minute: Math.min(59, Math.max(0, Math.round(f.minute) || 0)),
    gender: f.gender,
    isLeapMonth: f.calendar === 'lunar' ? f.isLeapMonth : false,
    city: isCustom ? undefined : f.city,
    longitude: isCustom ? f.customLongitude : city?.longitude,
    timezone: f.timezone,
    ianaTimezone: f.ianaTimezone === FIXED_OFFSET ? undefined : f.ianaTimezone,
    useTrueSolarTime: f.useTrueSolarTime,
    dayRollover: f.dayRollover,
    title: title?.trim() || undefined,
  }
}

type Props = {
  value: BirthFormState
  onChange: (v: BirthFormState) => void
  loading: boolean
  error: string | null
  onSubmit: (payload: PaipanPayload) => void
}

export default function BirthFormCard({ value, onChange, loading, error, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const set = <K extends keyof BirthFormState>(key: K, v: BirthFormState[K]) =>
    onChange({ ...value, [key]: v })

  const payload = useMemo(() => toPayload(value, title), [value, title])

  const submit = () => {
    if (!loading) onSubmit(payload)
  }

  return (
    <div className="mx-auto max-w-[860px] rounded-xl border border-golddim/25 bg-silk2 p-7 shadow-card md:p-10">
      <div className="grid gap-5 md:grid-cols-2">
        <FormInput
          label="存档标题（可选）"
          id="bazi-title"
          placeholder="如：我的本命盘"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={64}
        />
        <div>
          <span className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">
            历法
          </span>
          <SegmentedControl<'solar' | 'lunar'>
            id="bazi-calendar"
            value={value.calendar}
            onChange={(v) => set('calendar', v)}
            options={[
              { value: 'solar', label: '公历' },
              { value: 'lunar', label: '农历' },
            ]}
          />
          {value.calendar === 'lunar' && (
            <label className="mt-2 flex items-center gap-2 text-[12.5px] text-inkmuted">
              <input
                type="checkbox"
                checked={value.isLeapMonth}
                onChange={(e) => set('isLeapMonth', e.target.checked)}
                className="h-4 w-4 accent-[#C7A23A]"
              />
              闰月（该月为阴历闰月）
            </label>
          )}
        </div>
      </div>

      {/* 年月日 */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <FormSelect
          label={value.calendar === 'lunar' ? '农历年' : '出生年'}
          id="bazi-year"
          value={value.year}
          onChange={(e) => set('year', Number(e.target.value))}
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y} 年
            </option>
          ))}
        </FormSelect>
        <FormSelect
          label="月"
          id="bazi-month"
          value={value.month}
          onChange={(e) => set('month', Number(e.target.value))}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m} 月
            </option>
          ))}
        </FormSelect>
        <FormSelect
          label="日"
          id="bazi-day"
          value={value.day}
          onChange={(e) => set('day', Number(e.target.value))}
        >
          {DAYS.map((d) => (
            <option key={d} value={d}>
              {d} 日
            </option>
          ))}
        </FormSelect>
      </div>

      {/* 时辰 + 分钟 */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <FormSelect
          label="时辰"
          id="bazi-hour"
          value={value.hourBranch === null ? 'unknown' : value.hourBranch}
          onChange={(e) =>
            set('hourBranch', e.target.value === 'unknown' ? null : Number(e.target.value))
          }
        >
          {SHICHEN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value="unknown">时辰不详（不排时柱）</option>
        </FormSelect>
        {value.hourBranch === 0 && (
          <div className="flex items-center gap-2 self-end pb-1">
            {(['early', 'late'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => set('ziVariant', v)}
                className={`min-h-11 rounded-full border px-3 py-1.5 font-sans text-[12px] tracking-[0.1em] transition-colors sm:min-h-0 ${
                  value.ziVariant === v
                    ? 'border-gold bg-gold/15 text-golddim'
                    : 'border-inkmuted/30 text-inkmuted hover:border-golddim'
                }`}
              >
                {v === 'early' ? '早子时 00–01' : '晚子时 23–24'}
              </button>
            ))}
          </div>
        )}
        <FormInput
          label="分钟（0–59）"
          id="bazi-minute"
          type="number"
          min={0}
          max={59}
          value={value.minute}
          disabled={value.hourBranch === null}
          onChange={(e) => set('minute', Number(e.target.value))}
        />
      </div>

      {/* 性别 + 城市 */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <span className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">
            性别
          </span>
          <SegmentedControl<'male' | 'female'>
            id="bazi-gender"
            value={value.gender}
            onChange={(v) => set('gender', v)}
            options={[
              { value: 'male', label: '乾 · 男' },
              { value: 'female', label: '坤 · 女' },
            ]}
          />
        </div>
        <div>
          <label htmlFor="bazi-city-search" className="mb-1.5 block font-sans text-[11.5px] font-medium tracking-[0.14em] text-inkmuted">
            出生城市（决定经度 · 全国 {CITIES.length} 城）
          </label>
          <input
            id="bazi-city-search"
            list="bazi-city-list"
            value={value.city === CUSTOM_CITY ? '自定义经度…' : value.city}
            onChange={(e) => {
              const v = e.target.value
              if (v === CUSTOM_CITY || v === '自定义经度…') {
                onChange({ ...value, city: CUSTOM_CITY })
                return
              }
              const hit = CITIES.find((c) => c.name === v)
              if (hit) onChange({ ...value, city: hit.name, ianaTimezone: suggestTimezone(hit.name) })
            }}
            placeholder="输入城市名搜索，如：杭州、喀什、三亚"
            className="w-full rounded-lg border border-golddim/25 bg-silk px-3 py-2.5 text-[13.5px] text-inktext outline-none transition focus:border-golddim"
          />
          <datalist id="bazi-city-list">
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}（东经 {c.longitude.toFixed(2)}°）
              </option>
            ))}
            <option value="自定义经度…">手动输入经度</option>
          </datalist>
          <p className="mt-1.5 text-[11px] leading-[1.6] text-inkmuted/70">
            未找到城市？选「自定义经度…」手动输入精确经度。
          </p>
        </div>
      </div>

      {value.city === CUSTOM_CITY && (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <FormInput
            label="自定义经度（东经度数）"
            id="bazi-longitude"
            type="number"
            step={0.01}
            min={70}
            max={140}
            value={value.customLongitude}
            onChange={(e) => set('customLongitude', Number(e.target.value))}
          />
        </div>
      )}

      {/* IANA 时区 + 固定偏移（备用） */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <FormSelect
            label="出生时时区（IANA）"
            id="bazi-iana-timezone"
            value={value.ianaTimezone}
            onChange={(e) => set('ianaTimezone', e.target.value)}
          >
            {IANA_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
            <option value={FIXED_OFFSET}>不使用 IANA 时区（用右侧固定 UTC 偏移）</option>
          </FormSelect>
          {value.ianaTimezone !== FIXED_OFFSET && (
            <p className="mt-1.5 text-[11.5px] leading-[1.6] text-inkmuted">
              按出生当日该时区的历史偏移换算，自动处理历史夏令时（如中国 1986–1991、欧美夏令时）。
            </p>
          )}
        </div>
        <FormInput
          label="固定 UTC 偏移（小时，未选 IANA 时区时生效）"
          id="bazi-timezone"
          type="number"
          step={1}
          min={-12}
          max={14}
          value={value.timezone}
          disabled={value.ianaTimezone !== FIXED_OFFSET}
          onChange={(e) => set('timezone', Number(e.target.value))}
        />
      </div>

      {/* 真太阳时 + 换日规则 */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <span className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">
            真太阳时修正
          </span>
          <SegmentedControl<'on' | 'off'>
            id="bazi-tst"
            value={value.useTrueSolarTime ? 'on' : 'off'}
            onChange={(v) => set('useTrueSolarTime', v === 'on')}
            options={[
              { value: 'on', label: '开启（默认）' },
              { value: 'off', label: '关闭' },
            ]}
          />
        </div>
        <div>
          <span className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">
            换日规则
          </span>
          <SegmentedControl<'zichu' | 'midnight'>
            id="bazi-rollover"
            value={value.dayRollover}
            onChange={(v) => set('dayRollover', v)}
            options={[
              { value: 'zichu', label: '子初换日（23:00，默认）' },
              { value: 'midnight', label: '0 点换日' },
            ]}
          />
        </div>
      </div>

      <GoldButton
        className="mt-8 w-full animate-gold-breathe disabled:cursor-not-allowed disabled:opacity-50"
        disabled={loading}
        onClick={submit}
      >
        {loading ? '排盘中…' : '排盘'}
      </GoldButton>
      {error && (
        <p role="alert" className="mt-3 text-center text-[13px] text-[#B04A3A]">
          {error}
        </p>
      )}
      <p className="mt-4 text-center text-[12px] text-inkmuted">
        生辰信息仅用于起盘，紫府不做他用；登录后自动保存排盘记录
      </p>
    </div>
  )
}
