import { motion } from 'framer-motion'
import { BRANCHES } from '@contracts/bazi-core'
import { GENERAL_SHORT, type DaliurenChart } from '@contracts/engines/daliuren-core'
import { polar } from '@/components/sanshi/astro'

const C = 240

/** 大六壬 · 天地盘圆环：外地盘十二支固定，内天盘随月将加时旋转，旁注十二天将 */
export default function TiandiPan({ chart }: { chart: DaliurenChart }) {
  return (
    <motion.svg
      viewBox="0 0 480 480"
      className="mx-auto block w-full max-w-[480px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      role="img"
      aria-label="大六壬天地盘"
    >
      {/* 圆底 */}
      <circle cx={C} cy={C} r={228} className="fill-deep3" />
      <circle cx={C} cy={C} r={228} fill="none" stroke="rgb(var(--gold))" strokeOpacity={0.3} />
      <circle cx={C} cy={C} r={178} fill="none" stroke="rgb(var(--gold))" strokeOpacity={0.2} strokeWidth={0.8} />
      <circle cx={C} cy={C} r={108} fill="none" stroke="rgb(var(--gold))" strokeOpacity={0.16} strokeWidth={0.8} />

      {/* 外环：地盘十二支（固定方位） */}
      {BRANCHES.map((b, i) => {
        const ang = 90 + i * 30
        const p = polar(C, C, 196, ang)
        const t0 = polar(C, C, 208, ang)
        const t1 = polar(C, C, 218, ang)
        return (
          <g key={b}>
            <line x1={t0.x} y1={t0.y} x2={t1.x} y2={t1.y} stroke="rgb(var(--gold))" strokeOpacity={0.4} strokeWidth={0.9} />
            <motion.text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              className="fill-goldbright font-serif"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              {b}
            </motion.text>
          </g>
        )
      })}

      {/* 内环：天盘十二支 + 十二天将（随月将加时旋转入场） */}
      <motion.g
        style={{ transformOrigin: '240px 240px' }}
        initial={{ rotate: -20, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {BRANCHES.map((_, e) => {
          const ang = 90 + e * 30
          const pb = polar(C, C, 148, ang)
          const pg = polar(C, C, 124, ang)
          return (
            <g key={e}>
              <motion.text
                x={pb.x}
                y={pb.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={14}
                className="fill-silktext font-serif"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + e * 0.04, duration: 0.4 }}
              >
                {BRANCHES[chart.heaven[e]]}
              </motion.text>
              <motion.text
                x={pg.x}
                y={pg.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10.5}
                className="fill-golddim font-serif"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + e * 0.04, duration: 0.4 }}
              >
                {GENERAL_SHORT[chart.generals[e]]}
              </motion.text>
            </g>
          )
        })}
      </motion.g>

      {/* 圆心：日干支 · 月将 */}
      <motion.g
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <text
          x={C}
          y={C - 8}
          textAnchor="middle"
          fontSize={13}
          className="fill-silktext font-serif"
        >
          日干支 {chart.dayGanzhi} · 时干支 {chart.hourGanzhi}
        </text>
        <text
          x={C}
          y={C + 16}
          textAnchor="middle"
          fontSize={12}
          className="fill-goldbright font-serif"
        >
          月将 {chart.yuejiang.branch}·{chart.yuejiang.name}（{chart.yuejiang.zhongqi}后）
        </text>
      </motion.g>
    </motion.svg>
  )
}
