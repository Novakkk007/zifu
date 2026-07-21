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

export interface BirthFormState {
  calendar: 'solar' | 'lunar'
  isLeapMonth: boolean
  year: number
  month: number
  day: number
  /** 时辰地支序号 0-11；null = 时辰不详 */
  hourBranch: number | null
  minute: number
  gender: 'male' | 'female'
  /** 预设城市名，或 CUSTOM_CITY */
  city: string
  customLongitude: number
  timezone: number
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
    minute: 0,
    gender: 'male',
    city: '北京',
    customLongitude: 120,
    timezone: 8,
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
    // 时辰支序 → 时段中点小时（子=0、丑=2、寅=4……）
    hour: f.hourBranch === null ? null : (f.hourBranch * 2) % 24,
    minute: Math.min(59, Math.max(0, Math.round(f.minute) || 0)),
    gender: f.gender,
    isLeapMonth: f.calendar === 'lunar' ? f.isLeapMonth : false,
    city: isCustom ? undefined : f.city,
    longitude: isCustom ? f.customLongitude : city?.longitude,
    timezone: f.timezone,
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
        <FormSelect
          label="出生城市（决定经度）"
          id="bazi-city"
          value={value.city}
          onChange={(e) => set('city', e.target.value)}
        >
          {CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}（东经 {c.longitude.toFixed(2)}°）
            </option>
          ))}
          <option value={CUSTOM_CITY}>自定义经度…</option>
        </FormSelect>
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

      {/* 时区 + 真太阳时 + 换日规则 */}
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <FormInput
          label="时区（UTC 偏移小时）"
          id="bazi-timezone"
          type="number"
          step={1}
          min={-12}
          max={14}
          value={value.timezone}
          onChange={(e) => set('timezone', Number(e.target.value))}
        />
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
