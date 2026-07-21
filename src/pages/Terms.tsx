import { useEffect } from 'react'
import { motion } from 'framer-motion'
import PageHero from '@/components/content/PageHero'

const HERO_POOL = ['约', '条', '款', '信', '度', '规', '矩']

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number]

type Clause = {
  num: string
  title: string
  paras: string[]
  list?: string[]
}

const CLAUSES: Clause[] = [
  {
    num: '壹',
    title: '服务性质',
    paras: [
      '紫府是一个古籍数字化与 AI 参详体验平台。本站所有排盘、起卦、合参及文字输出，均以公版术数典籍为文化素材，由程序与 AI 生成，仅供文化研究与娱乐体验，不构成医疗、法律、金融、婚恋或任何现实决策的建议。请理性看待，切勿据此决断人生大事。',
    ],
  },
  {
    num: '贰',
    title: '灵签与计费',
    paras: [],
    list: [
      '「灵签」为站内虚拟计数单位，用于按次解锁详批类服务，不具有货币价值，不可提现、不可转让。',
      '注册即赠 36 灵签；充值以人民币计价，充值额外赠送 15% 灵签。',
      '消耗标准于各功能页明示（如详批 9 灵签 / 次），扣减前必有确认提示。',
      '已消耗的灵签不予返还；未消耗的余额在法律允许范围内可申请退款。',
    ],
  },
  {
    num: '叁',
    title: '内容与版权',
    paras: [],
    list: [
      '站内引用的古籍原文均属公有领域；出处随文标注。',
      '紫府之界面设计、原创文案与品牌标识（含「紫府」名称与 Logo）之权利归运营方所有，请勿擅自商用。',
    ],
  },
  {
    num: '肆',
    title: '隐私',
    paras: [
      '生辰等信息仅用于当次起盘计算；演示版数据仅存于浏览器本地，不上传服务器。',
    ],
  },
  {
    num: '伍',
    title: '免责',
    paras: [
      '因使用本站内容而作出的任何决定，由使用者自行承担后果；平台不就输出之准确性、适用性作担保。',
    ],
  },
  {
    num: '陆',
    title: '条款变更',
    paras: ['条款如有修订，将于本页更新并注明日期。最近更新：2026 年 1 月 1 日。'],
  },
]

export default function Terms() {
  useEffect(() => {
    document.title = '服务条款 · 紫府'
  }, [])

  return (
    <div>
      {/* S1 · PageHero（精简） */}
      <PageHero
        breadcrumb="服务条款"
        title="服务条款"
        latin="Terms Of Service"
        subtitle="签约之前，请君细读"
        pool={HERO_POOL}
        glyphCount={18}
        minH="min-h-[30vh]"
      />

      {/* 深 → 浅 过渡 */}
      <div className="zf-fade-to-silk h-[140px]" />

      {/* S2 · 条款正文 */}
      <section className="relative bg-silk pb-28 pt-14">
        <div className="zf-paper-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative mx-auto w-full max-w-[760px] px-6 md:px-10">
          {CLAUSES.map((clause, i) => (
            <motion.section
              key={clause.num}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.75, delay: i * 0.07, ease: easeOut }}
              className={i > 0 ? 'mt-14' : ''}
            >
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-[18px] font-black tracking-[0.2em] text-golddim">
                  {clause.num}
                </span>
                <h2 className="font-serif text-[20px] font-bold tracking-[0.1em] text-inktext">
                  {clause.title}
                </h2>
              </div>
              <div className="mt-4 space-y-3 border-l border-golddim/25 pl-6">
                {clause.paras.map((p, j) => (
                  <p key={j} className="font-sans text-[15px] leading-[2.0] text-inktext">
                    {p}
                  </p>
                ))}
                {clause.list && (
                  <ol className="space-y-2.5">
                    {clause.list.map((item, j) => (
                      <li
                        key={j}
                        className="flex gap-3 font-sans text-[15px] leading-[2.0] text-inktext"
                      >
                        <span className="mt-[13px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </motion.section>
          ))}

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 text-center text-[12.5px] leading-[1.9] tracking-[0.08em] text-inkmuted"
          >
            古籍数字化 · AI 参详 — 仅供文化研究与体验，不构成任何决策建议
          </motion.p>
        </div>
      </section>
    </div>
  )
}
