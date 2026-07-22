import { motion } from 'framer-motion'
import type { ZiweiChartData, ZiweiPalace } from '@/components/ziwei/logic'
import { GRID_POS, HUA_COLOR } from '@/components/ziwei/logic'
import { cn } from '@/lib/utils'

type ZiweiChartProps = {
  chart: ZiweiChartData
  onSelect: (cell: ZiweiPalace) => void
}

/** 十二宫盘：4×4 宫格 + 中央命主信息区（数据来自服务端真实安星） */
export default function ZiweiChart({ chart, onSelect }: ZiweiChartProps) {
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-[880px]"
    >
      <div className="grid grid-cols-4 grid-rows-4 gap-[2px] rounded-xl border border-golddim/30 bg-silk p-[2px] shadow-card">
        {chart.palaces.map((cell, i) => {
          const [r, c] = GRID_POS[cell.branch]
          const active = cell.isMing || cell.isShen
          return (
            <motion.button
              key={cell.branch}
              type="button"
              onClick={() => onSelect(cell)}
              initial={{ opacity: 0, backgroundColor: 'rgba(199,162,58,0.10)' }}
              animate={{ opacity: 1, backgroundColor: 'rgba(199,162,58,0)' }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
              style={{ gridRowStart: r + 1, gridColumnStart: c + 1 }}
              className={cn(
                'group relative flex min-h-[108px] flex-col justify-between overflow-hidden bg-silk2 p-2 text-left transition-colors hover:bg-silk sm:min-h-[150px] sm:p-3',
                active && 'ring-1 ring-inset ring-gold/70',
              )}
            >
              {/* 角标小印 */}
              {cell.isMing && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-sm bg-gold font-serif text-[11px] font-bold text-deep3 sm:h-6 sm:w-6 sm:text-[12px]">
                  命
                </span>
              )}
              {cell.isShen && !cell.isMing && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-sm border border-gold/70 font-serif text-[11px] font-bold text-golddim sm:h-6 sm:w-6 sm:text-[12px]">
                  身
                </span>
              )}

              <div>
                {/* 主星行 */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pr-6">
                  {cell.majors.map((s) => (
                    <span
                      key={s.name}
                      className="flex items-center font-serif text-[12.5px] font-semibold leading-[1.7] text-inktext sm:text-[14px]"
                    >
                      {s.name}
                      {s.hua && (
                        <span
                          className="ml-0.5 inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: HUA_COLOR[s.hua] }}
                          title={`化${s.hua}`}
                        />
                      )}
                    </span>
                  ))}
                </div>
                {/* 辅星 / 杂曜 */}
                <p className="mt-1 line-clamp-2 text-[10px] leading-[1.7] text-inkmuted sm:text-[11px]">
                  {cell.minors.map((s) => (
                    <span key={s.name} className="mr-1.5 inline-flex items-center">
                      {s.name}
                      {s.hua && (
                        <span
                          className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: HUA_COLOR[s.hua] }}
                          title={`化${s.hua}`}
                        />
                      )}
                    </span>
                  ))}
                </p>
              </div>

              <div className="mt-1 flex items-end justify-between">
                <span className="font-serif text-[11px] tracking-[0.08em] text-golddim sm:text-[12px]">
                  {cell.name}
                </span>
                <span className="text-[10px] tracking-[0.08em] text-inkmuted/80 sm:text-[11px]">
                  {cell.ganzhi}
                </span>
              </div>
            </motion.button>
          )
        })}

        {/* 中央 2×2：命主信息区 */}
        <motion.div
          initial={{ filter: 'blur(10px)', opacity: 0 }}
          animate={{ filter: 'blur(0px)', opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          style={{ gridRowStart: 2, gridRowEnd: 4, gridColumnStart: 2, gridColumnEnd: 4 }}
          className="relative flex flex-col items-center justify-center overflow-hidden bg-silk2 p-4 text-center"
        >
          <img
            src="/assets/logo.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 m-auto w-2/3 opacity-20"
          />
          <div className="relative">
            <p className="font-latin text-[10px] uppercase tracking-[0.38em] text-golddim sm:text-[11px]">
              Ziwei Chart
            </p>
            <p className="mt-2 font-serif text-[15px] font-bold tracking-[0.2em] text-inktext sm:text-[17px]">
              {chart.yearGanzhi}年生 · {chart.ju.name}
            </p>
            <div className="zf-hairline mx-auto mt-3" />
            <p className="mt-3 text-[11.5px] leading-[1.9] text-inkmuted sm:text-[12.5px]">
              命主 <span className="font-serif text-golddim">{chart.mingZhu}</span>{'　'}身主{' '}
              <span className="font-serif text-golddim">{chart.shenZhu}</span>
            </p>
            <p className="mt-1 text-[10.5px] leading-[1.8] tracking-[0.06em] text-inkmuted/80 sm:text-[11.5px]">
              命宫{chart.mingGongGanzhi} · 身宫{chart.shenBranch} · {chart.genderKind}大限{chart.daxian.direction}
            </p>
            <p className="mt-1 text-[10.5px] tracking-[0.08em] text-inkmuted/80 sm:text-[11.5px]">
              点击宫格查看宫位详情
            </p>
          </div>
        </motion.div>
      </div>

      {/* 四化图例 */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-inkmuted">
        {(['禄', '权', '科', '忌'] as const).map((h) => (
          <span key={h} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: HUA_COLOR[h] }} />
            化{h}
          </span>
        ))}
        <span className="text-inkmuted/70">生年四化随星落宫</span>
      </div>
    </motion.div>
  )
}
