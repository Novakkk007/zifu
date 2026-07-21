import { FormSelect, SegmentedControl } from '@/components/FormControls'
import { SHICHEN_OPTIONS } from '@/lib/ganzhi'

export interface PersonFormState {
  gender: 'male' | 'female'
  year: number
  month: number
  day: number
  /** 时辰地支序号 0-11；null = 时辰不详 */
  hour: number | null
}

export const CURRENT_YEAR = new Date().getFullYear()
export const YEARS = Array.from({ length: CURRENT_YEAR - 1920 + 1 }, (_, i) => 1920 + i).reverse()
export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
export const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export function defaultPerson(): PersonFormState {
  return { gender: 'male', year: 1990, month: 6, day: 15, hour: 6 }
}

type BirthFieldsProps = {
  value: PersonFormState
  onChange: (v: PersonFormState) => void
  /** 用于 segmented layoutId 隔离 */
  idPrefix: string
}

/** 生辰字段组：性别 segmented + 年/月/日 select + 时辰 select（两页复用） */
export default function BirthFields({ value, onChange, idPrefix }: BirthFieldsProps) {
  const set = <K extends keyof PersonFormState>(key: K, v: PersonFormState[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">
          性别
        </span>
        <SegmentedControl<'male' | 'female'>
          id={`${idPrefix}-gender`}
          value={value.gender}
          onChange={(v) => set('gender', v)}
          options={[
            { value: 'male', label: '乾 · 男' },
            { value: 'female', label: '坤 · 女' },
          ]}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormSelect
          label="出生年"
          id={`${idPrefix}-year`}
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
          id={`${idPrefix}-month`}
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
          id={`${idPrefix}-day`}
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

      <FormSelect
        label="出生时辰"
        id={`${idPrefix}-hour`}
        value={value.hour === null ? 'unknown' : value.hour}
        onChange={(e) =>
          set('hour', e.target.value === 'unknown' ? null : Number(e.target.value))
        }
      >
        {SHICHEN_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        <option value="unknown">时辰不详</option>
      </FormSelect>
    </div>
  )
}
