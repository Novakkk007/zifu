/**
 * 健康体质养生——场景页。
 * 五行旺衰 → 体质倾向（文化视角）+ 四时养护提示。
 * 红线最严场景：全页医疗免责，任何表述不构成医疗建议。
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import { SafeStorage, STORAGE_KEYS } from '@/lib/storage'
import type { BaziChartV2 } from '@contracts/bazi-core'

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

/** 五行 → 体质倾向（文化参详，非医疗判断） */
const WUXING_CONSTITUTION: Record<string, { theme: string; traits: string; season: string; care: string }> = {
  木: {
    theme: '木行体质 · 主疏泄条达',
    traits: '传统五行学说以木应肝胆、主生发。木旺者传统上被认为精力升发较足，情志宜舒展。',
    season: '春木当令，宜舒展活动；秋金克木，宜护肝舒怀。',
    care: '传统养生建议：规律作息、少郁怒、适度伸展运动。',
  },
  火: {
    theme: '火行体质 · 主温热心脉',
    traits: '传统五行学说以火应心、主神明。火旺者传统上被认为热情外显，心绪易亢。',
    season: '夏火当令，宜静心安神；冬水克火，宜暖护心阳。',
    care: '传统养生建议：离屏静坐、舒缓运动、避免过劳心绪。',
  },
  土: {
    theme: '土行体质 · 主运化承载',
    traits: '传统五行学说以土应脾胃、主思虑。土旺者传统上被认为厚重踏实，思虑偏多。',
    season: '长夏土当令，宜饮食有节；春木克土，宜疏解思虑。',
    care: '传统养生建议：三餐规律、清淡饮食、勿久坐思虑。',
  },
  金: {
    theme: '金行体质 · 主肃降清润',
    traits: '传统五行学说以金应肺、主气机。金旺者传统上被认为条理分明，宜清润护肺。',
    season: '秋金当令，宜润燥护肺；夏火克金，宜清静避暑。',
    care: '传统养生建议：呼吸调匀、空气流通、忌烟酒辛燥。',
  },
  水: {
    theme: '水行体质 · 主藏精润下',
    traits: '传统五行学说以水应肾、主封藏。水旺者传统上被认为智慧内敛，宜藏精养神。',
    season: '冬水当令，宜早卧养藏；土季克水，宜节制勿劳。',
    care: '传统养生建议：勿熬夜、暖足护腰、适度静养。',
  },
}

export default function HealthScenario() {
  const [dayMaster, setDayMaster] = useState<string | null>(null)
  const advice = useMemo(() => (dayMaster ? WUXING_CONSTITUTION[dayMaster] : null), [dayMaster])

  // 从本地收藏的八字命盘自动读日主五行（游客排盘后直达）
  const linkedChart = useMemo(() => {
    try {
      const favs = SafeStorage.get(STORAGE_KEYS.FAVORITES, []) as { type?: string; payload?: BaziChartV2 }[]
      const bazi = favs.find((f) => f.type === 'bazi' && f.payload?.pillars?.day)
      return bazi?.payload ?? null
    } catch {
      return null
    }
  }, [])

  const linkedWuxing = linkedChart?.pillars?.day?.stemWuxing ?? null

  return (
    <div className="relative min-h-screen bg-deep pb-24 pt-14 md:pt-20">
      <FloatingGlyphs count={18} onDeep />
      <div className="relative zf-container max-w-[880px]">
        <header className="text-center">
          <p className="font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-golddim">
            Health &amp; Wellness
          </p>
          <h1 className="mt-2 font-serif text-[30px] font-black tracking-[0.12em] text-silktext">
            健康体质养生
          </h1>
          <p className="mx-auto mt-4 max-w-[620px] text-[13.5px] leading-[1.95] text-silkmuted">
            以传统五行学说参看体质倾向与四时养护——这是流传千年的养生文化智慧，
            不是医学诊断。身体不适，请务必就医。
          </p>
          <p className="mx-auto mt-4 inline-block rounded-full border border-gold/40 px-5 py-2 text-[12px] tracking-[0.1em] text-goldbright">
            ⚕ 本页内容不构成任何医疗建议 · 不替代医师诊断与治疗
          </p>
        </header>

        {/* 命盘联动：排过八字的访客一键直达 */}
        {linkedChart && linkedWuxing && (
          <section className="mt-8 rounded-2xl border border-gold/40 bg-deep2 p-6 text-center">
            <p className="text-[13px] tracking-[0.1em] text-silkmuted">
              检测到你在本机排过的八字命盘
            </p>
            <p className="mt-2 font-serif text-[17px] font-bold text-goldbright">
              {linkedChart.pillars.day.stem}
              {linkedChart.pillars.day.branch} 日 · {linkedWuxing}日主
            </p>
            <button
              type="button"
              onClick={() => setDayMaster(linkedWuxing)}
              className="mt-4 rounded-full bg-gold px-8 py-2.5 text-[13.5px] font-semibold tracking-[0.12em] text-deep transition-transform hover:scale-[1.03]"
            >
              按我的日主参看体质
            </button>
          </section>
        )}

        {/* 五行自测 */}
        <section className="mt-10 rounded-2xl border border-gold/20 bg-silk2 p-6 sm:p-8">
          <p className="font-serif text-[16px] font-bold tracking-[0.08em] text-inktext">
            方式一 · 按日主五行参看
          </p>
          <p className="mt-2 text-[12.5px] leading-[1.9] text-inkmuted">
            在八字排盘中查看你的「日主」五行（如「你是木日主」），点选对应五行：
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(['木', '火', '土', '金', '水'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setDayMaster(w)}
                className={`rounded-full border px-6 py-2 text-[13.5px] transition-colors ${
                  dayMaster === w
                    ? 'border-goldbright bg-gold/15 text-goldbright'
                    : 'border-golddim/30 text-inkmuted hover:border-golddim'
                }`}
              >
                {w}日主
              </button>
            ))}
          </div>
          {advice && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="mt-6 rounded-xl border border-golddim/20 bg-white/50 p-6"
            >
              <p className="font-serif text-[17px] font-bold text-inktext">{advice.theme}</p>
              <p className="mt-3 text-[13.5px] leading-[1.9] text-inkmuted">{advice.traits}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-golddim/15 bg-silk p-4">
                  <p className="text-[11px] tracking-[0.2em] text-golddim">四时参详</p>
                  <p className="mt-1.5 text-[13px] leading-[1.9] text-inktext">{advice.season}</p>
                </div>
                <div className="rounded-lg border border-golddim/15 bg-silk p-4">
                  <p className="text-[11px] tracking-[0.2em] text-golddim">传统养生提示</p>
                  <p className="mt-1.5 text-[13px] leading-[1.9] text-inktext">{advice.care}</p>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* 安寝时令直通 */}
        <section className="mt-8 rounded-2xl border border-gold/20 bg-silk2 p-6 sm:p-8 text-center">
          <p className="font-serif text-[16px] font-bold tracking-[0.08em] text-inktext">
            方式二 · 每晚安寝时令（每日自动更新）
          </p>
          <p className="mx-auto mt-2 max-w-[520px] text-[12.5px] leading-[1.9] text-inkmuted">
            按当日干支五行给出安寝主题与子午流注时辰参详——睡眠是养生之本，
            每天都值得温柔对待。
          </p>
          <Link
            to="/daily"
            className="mt-5 inline-block rounded-full bg-gold px-8 py-3 text-[14px] font-semibold tracking-[0.12em] text-deep transition-transform hover:scale-[1.03]"
          >
            🌙 去每日时令 · 今晚安寝
          </Link>
        </section>

        {/* 医疗免责 */}
        <section className="mt-8 rounded-2xl border border-golddim/20 bg-silk2 p-6 text-center">
          <p className="text-[12.5px] leading-[1.9] text-inkmuted">
            🍃 免责声明：本页所有内容为传统养生文化参详，仅供日常生活参考，
            不构成医疗建议，不能替代医师诊断与治疗。如有身体不适、慢性疾病
            或用药情况，请咨询专业医疗人员。
          </p>
        </section>
      </div>
    </div>
  )
}
