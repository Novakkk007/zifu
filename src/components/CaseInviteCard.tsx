/**
 * 命例征集卡片（社区生态 D + 数据生态 B 的交叉入口）
 * 访客自愿提交生辰+反馈 → localStorage（zifu:case-drafts）
 * 用于对拍校准（四柱/神煞/大运验证）。脱敏：不采集任何身份信息。
 */
import { useState } from 'react'

interface Draft {
  solar: string
  hour: string
  gender: '男' | '女' | ''
  feedback: string
  ts: number
}

const STORE_KEY = 'zifu:case-drafts'

export default function CaseInviteCard() {
  const [solar, setSolar] = useState('')
  const [hour, setHour] = useState('')
  const [gender, setGender] = useState<'男' | '女' | ''>('')
  const [feedback, setFeedback] = useState('')
  const [done, setDone] = useState(false)

  const submit = () => {
    if (!solar) return
    const drafts: Draft[] = JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
    drafts.push({ solar, hour, gender, feedback: feedback.slice(0, 200), ts: Date.now() })
    localStorage.setItem(STORE_KEY, JSON.stringify(drafts.slice(-100)))
    setDone(true)
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-4">
      <div className="rounded-2xl border border-gold/25 bg-deep2/70 p-6 sm:p-8">
        <h2 className="font-serif text-xl font-semibold tracking-[0.12em] text-golddim">
          参与命例对拍 · 助紫府更准
        </h2>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-7 text-silktext/80">
          紫府以古籍为据、以实例为证。留下你的生辰与已知反馈，我们会匿名用于
          排盘引擎的对拍校准（不采集任何身份信息）。凡参与者，先生参详更用心。
        </p>
        {done ? (
          <div className="mt-6 rounded-xl border border-gold/30 bg-gold/10 p-5 text-center">
            <p className="font-serif text-[15px] text-golddim">已记下。多谢你为紫府添一分准头。</p>
            <p className="mt-2 text-[12px] text-silktext/70">（数据仅存于本机浏览器，用作对拍样本）</p>
          </div>
        ) : (
          <div className="mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] tracking-[0.1em] text-silktext/70">公历生日 *</span>
              <input
                type="date"
                value={solar}
                onChange={(e) => setSolar(e.target.value)}
                className="w-full rounded-lg border border-gold/20 bg-deep1 px-3 py-2 text-[13.5px] text-silktext outline-none focus:border-gold/50"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] tracking-[0.1em] text-silktext/70">时辰（选填）</span>
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="w-full rounded-lg border border-gold/20 bg-deep1 px-3 py-2 text-[13.5px] text-silktext outline-none focus:border-gold/50"
              >
                <option value="">未知</option>
                {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map((z) => (
                  <option key={z} value={z}>{z}时</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] tracking-[0.1em] text-silktext/70">性别</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as '男' | '女' | '')}
                className="w-full rounded-lg border border-gold/20 bg-deep1 px-3 py-2 text-[13.5px] text-silktext outline-none focus:border-gold/50"
              >
                <option value="">未填</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] tracking-[0.1em] text-silktext/70">已知反馈（选填）</span>
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="如：幼年多病 / 28岁结婚 / 做技术工作…"
                className="w-full rounded-lg border border-gold/20 bg-deep1 px-3 py-2 text-[13.5px] text-silktext outline-none focus:border-gold/50"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                onClick={submit}
                disabled={!solar}
                className="rounded-xl border border-gold/40 bg-gold/15 px-8 py-2.5 font-serif text-[14px] tracking-[0.14em] text-golddim transition hover:bg-gold/25 disabled:opacity-40"
              >
                提交命例
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
