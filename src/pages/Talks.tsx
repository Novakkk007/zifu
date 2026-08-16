import { memo, useEffect } from 'react'
import { motion } from 'framer-motion'
import PageHero from '@/components/content/PageHero'

const HERO_POOL = ['言', '创', '说', '书', '灯', '案', '墨', '心']

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

/** 「言」字印：常驻 8s 一次 360° 缓旋（独立 memo 微组件） */
const SealSpin = memo(function SealSpin() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-lg border-2 border-gold/70"
      style={{ boxShadow: 'inset 0 0 0 3px rgb(var(--deep)), inset 0 0 0 5px rgb(var(--gold) / 0.35)' }}
    >
      <span className="font-serif text-[30px] font-black text-goldbright">言</span>
    </motion.div>
  )
})

type Essay = {
  num: string
  title: string
  date: string
  paras: string[]
}

const ESSAYS: Essay[] = [
  {
    num: '序',
    title: '以古人之智，照今日之心',
    date: '2026 年 8 月 17 日',
    paras: [
      '古人没有心理咨询，却有命理。那不是用来吓人的，是那个时代里，人们安放迷茫、痛苦与期待的一套语言。',
      '今天的我们更焦虑、更孤独，而市面上的玄学多在做相反的事：制造恐惧，收割不安。这既害人，也辜负了古人。',
      '紫府想做的，是把这门古老的学问还原成它本该有的样子——关怀。历法，我们就按科学算到精确；解读，我们就明说这是文化视角；每一段参详，最后都回到一句温和的话：好好关照自己。',
      '我们不预言你的命运，我们只是想借千年前流传下来的智慧，陪你把今天过好一点。',
    ],
  },
  {
    num: '壹',
    title: '为什么叫「紫府」',
    date: '2026 年 1 月 6 日',
    paras: [
      '紫府者，道书所谓紫微之宫、星帝之居。我们取这两个字，不为神秘其事——恰恰相反，是想给这门古老的学问一个体面的居所：典籍排架，灯火可亲，来者皆是客。',
      '术数在中国流传了两千多年，与其让它流落于耸动的标题党之间，不如为它修一座干净的房子。',
      '房子不必大，但要端正。架上每一部书都经得起翻检，口中每一句话都找得到来处——这就是「紫府」二字对我们的全部要求。',
    ],
  },
  {
    num: '贰',
    title: '古籍为根，AI 为器',
    date: '2026 年 1 月 18 日',
    paras: [
      '大语言模型长于辞章，短于根脚。所以紫府的每一条参详，都先回到书页上：《滴天髓》怎么讲旺衰，《子平真诠》怎么取格局，《增删卜易》怎么断动爻——先锚定原文，再组织语言。',
      'AI 在这里不是「大师」，只是一位记性极好、读书极勤的誊录生。句有句的出处，话有话的根脚，这是紫府给自己立的第一条规矩。',
      '我们相信，技术的新与典籍的旧并不相斥。新工具是用来把旧书读得更细、引得更准的，不是用来把话说得更玄的。',
    ],
  },
  {
    num: '叁',
    title: '克制与边界',
    date: '2026 年 2 月 2 日',
    paras: [
      '按次计费，不做订阅——因为你不该为「可能用得上」付钱。',
      '句句标信度，孤证明言存疑——因为一术之见不该冒充天意。',
      '页尾永远写着同一句话：仅供文化研究与体验，不构成任何决策建议。命运这件事，古籍尚且只敢说「参」，我们更不越界。',
      '克制不是冷淡，是分寸。把分寸守住，这座紫府才值得常来。',
    ],
  },
]

/** 篇题字级拆分入场 */
function EssayTitle({ text }: { text: string }) {
  return (
    <motion.h2
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      transition={{}}
      className="mt-5 font-serif text-[28px] font-bold tracking-[0.08em] text-inktext"
    >
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { y: 26, opacity: 0, filter: 'blur(6px)' },
            show: { y: 0, opacity: 1, filter: 'blur(0px)' },
          }}
          transition={{ duration: 0.8, delay: i * 0.05, ease: easeOut }}
          className="inline-block will-change-transform"
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </motion.h2>
  )
}

export default function Talks() {
  useEffect(() => {
    document.title = '主创说 · 紫府'
  }, [])

  return (
    <div>
      {/* S1 · PageHero（精简版 + 言字印） */}
      <PageHero
        breadcrumb="主创说"
        title="主创说"
        latin="Notes From The Maker"
        subtitle="关于紫府的几段心里话"
        pool={HERO_POOL}
        glyphCount={20}
        minH="min-h-[34vh]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: easeOut }}
          className="mt-8"
        >
          <SealSpin />
        </motion.div>
      </PageHero>

      {/* 深 → 浅 过渡 */}
      <div className="zf-fade-to-silk h-[160px]" />

      {/* S2 · 手记三篇 */}
      <section className="relative bg-silk pb-20 pt-16">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative mx-auto w-full max-w-[720px] px-6 md:px-10">
          {ESSAYS.map((essay, idx) => (
            <article key={essay.num} className={idx > 0 ? 'mt-20' : ''}>
              {idx > 0 && <div className="zf-hairline mx-auto mb-20" />}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="font-serif text-[15px] font-bold tracking-[0.5em] text-golddim"
              >
                {essay.num}
              </motion.p>
              <EssayTitle text={essay.title} />
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-3 font-sans text-[12.5px] tracking-[0.16em] text-inkmuted"
              >
                {essay.date}
              </motion.p>
              <div className="mt-7 space-y-5">
                {essay.paras.map((p, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.7, delay: i * 0.06, ease: easeOut }}
                    className="font-sans text-[16px] font-light leading-[2.15] text-inktext"
                  >
                    {p}
                  </motion.p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* S3 · 留言条 */}
      <section className="relative bg-silk pb-28 pt-6">
        <div className="relative mx-auto flex w-full max-w-[720px] flex-col items-center px-6 text-center">
          <div className="zf-hairline" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="mt-8 font-serif text-[17px] tracking-[0.1em] text-inktext"
          >
            读后有话？写信至主创案头
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: easeOut }}
            className="mt-6"
          >
            <a
              href="mailto:hello@zifu.palace"
              className="zf-btn inline-flex items-center justify-center rounded-full border border-golddim/60 bg-transparent px-8 py-3 font-sans text-[14.5px] font-medium tracking-[0.14em] text-golddim hover:bg-golddim/10"
            >
              hello@zifu.palace
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-4 text-[12.5px] tracking-[0.08em] text-inkmuted"
          >
            来信不承诺必复，但每一封都会读。
          </motion.p>
        </div>
      </section>
    </div>
  )
}
