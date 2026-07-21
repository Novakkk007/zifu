import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Toss } from '@/components/liuyao/logic'
import { isMoving, isYang } from '@/components/liuyao/logic'

type YaoLineProps = {
  /** 爻值（6/7/8/9），未摇出时为空 */
  toss?: Toss
  /** 条宽（px） */
  width?: number
  /** 未填充占位样式 */
  placeholder?: boolean
  /** 入场延迟（秒） */
  delay?: number
  className?: string
}

/** 爻线图形：实线（阳）/ 断线（阴），动爻缀 ○/× 金印 */
export default function YaoLine({
  toss,
  width = 64,
  placeholder = false,
  delay = 0,
  className,
}: YaoLineProps) {
  const h = 10
  if (placeholder || toss === undefined) {
    return (
      <div
        className={cn('rounded-sm border border-dashed border-golddim/35', className)}
        style={{ width, height: h }}
      />
    )
  }
  const yang = isYang(toss)
  const moving = isMoving(toss)
  const bar = (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="flex h-full origin-left items-center justify-between"
    >
      {yang ? (
        <div className="h-full w-full rounded-sm bg-deep" />
      ) : (
        <>
          <div className="h-full rounded-sm bg-deep" style={{ width: '44%' }} />
          <div className="h-full rounded-sm bg-deep" style={{ width: '44%' }} />
        </>
      )}
    </motion.div>
  )
  return (
    <div className={cn('flex items-center', className)} style={{ width: width + 22 }}>
      <div style={{ width, height: h }}>{bar}</div>
      <span className="ml-1.5 flex h-4 w-4 items-center justify-center">
        {moving && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15, delay: delay + 0.3 }}
            className="font-serif text-[13px] font-bold leading-none text-gold"
          >
            {toss === 9 ? '○' : '×'}
          </motion.span>
        )}
      </span>
    </div>
  )
}
