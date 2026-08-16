/**
 * 感情婚姻合参——场景页。
 * 情感是四大焦虑之一：本页以关怀口吻承接情绪，引导到合盘功能，
 * 并说明分享裂变路径（合盘天然是两个人一起看的东西）。
 */
import { motion } from 'framer-motion'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import { GoldButton, GhostButton } from '@/components/Buttons'

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

const FEATURES = [
  {
    icon: '💞',
    title: '双盘合参',
    desc: '以双方八字命盘为据，从日主五行、月令生克、生肖地支等维度参详相处模式。',
  },
  {
    icon: '🌿',
    title: '相处线索',
    desc: '传统合参关注的不是「配不配」，而是两个人相处的节奏与互补方向。',
  },
  {
    icon: '📤',
    title: '一起看',
    desc: '合盘结果可以分享给对方——感情是两个人的事，参详也是。',
  },
]

export default function LoveScenario() {
  return (
    <div className="relative min-h-screen bg-deep pb-24 pt-14 md:pt-20">
      <FloatingGlyphs count={18} onDeep />
      <div className="relative zf-container max-w-[880px]">
        <header className="text-center">
          <p className="font-latin text-[11px] font-medium uppercase tracking-[0.3em] text-golddim">
            Love &amp; Marriage
          </p>
          <h1 className="mt-2 font-serif text-[30px] font-black tracking-[0.12em] text-silktext">
            感情婚姻合参
          </h1>
          <p className="mx-auto mt-4 max-w-[620px] text-[13.5px] leading-[1.95] text-silkmuted">
            感情里的不确定，最让人悬心。传统合参不替你们做决定——
            它只是提供一个安静下来的角度：看看彼此的节奏、脾气与相处线索。
            合不合适，最终是两个人过出来的。
          </p>
        </header>

        {/* 功能卡 */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-golddim/20 bg-black/20 p-6">
              <p className="text-[22px]">{f.icon}</p>
              <p className="mt-3 font-serif text-[15.5px] font-bold tracking-[0.08em] text-silktext">{f.title}</p>
              <p className="mt-2 text-[12.5px] leading-[1.85] text-silkmuted">{f.desc}</p>
            </div>
          ))}
        </motion.section>

        {/* 合盘直通 */}
        <section className="mt-8 rounded-2xl border border-gold/25 bg-silk2 p-8 text-center">
          <p className="font-serif text-[18px] font-bold tracking-[0.1em] text-inktext">
            开始合参 · 需要两人的出生信息
          </p>
          <p className="mx-auto mt-3 max-w-[480px] text-[12.5px] leading-[1.9] text-inkmuted">
            准备好双方的出生年月日（时辰可选），进入合盘页。
            数据只在本机浏览器计算，不上传任何服务器。
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GoldButton to="/bazi/hepan">开始合盘</GoldButton>
            <GhostButton to="/bazi">先看自己的命盘</GhostButton>
          </div>
        </section>

        {/* 关怀提示 */}
        <section className="mt-8 rounded-2xl border border-golddim/20 bg-silk2 p-6 text-center">
          <p className="text-[12.5px] leading-[1.9] text-inkmuted">
            🍃 提醒：合参是传统文化视角的相处参详，不构成婚恋决策建议。
            如果你们正经历困难，坦诚沟通与专业支持永远比任何推算更可靠。
          </p>
        </section>
      </div>
    </div>
  )
}
