/**
 * 生肖相冲参详卡（CBL-03 择日个人化降级）——每日时令页。
 * 用户自愿提供生肖 → 今日日支与之六冲 → 「传统相冲」文化提示。
 * 不代填八字、不作事件预测、无吉凶断言。
 */
import { useMemo, useState } from 'react'
import { zodiacClashOf, ZODIAC, type Zodiac } from '@contracts/engines/daily-core'
import { BRANCHES } from '@contracts/bazi-core'

export default function ZodiacClashCard({ dayBranchIdx }: { dayBranchIdx: number }) {
  const [zodiac, setZodiac] = useState<Zodiac | null>(() => {
    try {
      const v = localStorage.getItem('zifu:zodiac')
      return ZODIAC.includes(v as Zodiac) ? (v as Zodiac) : null
    } catch {
      return null
    }
  })

  const clash = useMemo(() => (zodiac ? zodiacClashOf(dayBranchIdx, zodiac) : null), [dayBranchIdx, zodiac])

  return (
    <div className="rounded-xl border border-golddim/25 bg-deep p-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-golddim">
            Personal Check
          </p>
          <h3 className="mt-1 font-serif text-[17px] font-bold tracking-[0.08em] text-silktext">
            生肖相冲参详
          </h3>
        </div>
        <select
          value={zodiac ?? ''}
          onChange={(e) => {
            const v = e.target.value as Zodiac
            setZodiac(v || null)
            try {
              if (v) localStorage.setItem('zifu:zodiac', v)
              else localStorage.removeItem('zifu:zodiac')
            } catch {
              /* ignore */
            }
          }}
          className="rounded-lg border border-golddim/40 bg-black/30 px-4 py-2 text-[13.5px] text-silktext focus:border-goldbright focus:outline-none"
          aria-label="选择生肖"
        >
          <option value="">不选（跳过本参详）</option>
          {ZODIAC.map((z) => (
            <option key={z} value={z}>
              属{z}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-3 text-[12.5px] leading-[1.9] text-silkmuted">
        今日日支为 <span className="text-goldbright">{BRANCHES[dayBranchIdx]}</span>
        {clash
          ? `，与你所选生肖「${clash}」形成传统六冲。传统择日参详中，相冲日宜留意重要安排（签约、出行、动工等），可择日再行——这属于文化参详，不作事件预测。`
          : '。生肖仅用于本次本地参详，不保存到服务器；不选则跳过。'}
      </p>
    </div>
  )
}
