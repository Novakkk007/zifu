import { useEffect, useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type { ZiweiPalace } from '@/components/ziwei/logic'
import { HUA_COLOR, PALACE_DUTY, palaceSentences } from '@/components/ziwei/logic'

type PalaceDrawerProps = {
  cell: ZiweiPalace | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** 宫位详情抽屉：desktop 右侧滑入 / mobile 底部弹层 */
export default function PalaceDrawer({ cell, open, onOpenChange }: PalaceDrawerProps) {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isDesktop ? 'right' : 'bottom'}>
      <DrawerContent className="border-gold/25 bg-deep2 text-silktext">
        {cell && (
          <div className="mx-auto w-full max-w-md overflow-y-auto px-7 pb-10 pt-2 md:pt-10">
            <DrawerHeader className="px-0">
              <p className="font-latin text-[11px] uppercase tracking-[0.38em] text-gold">
                Palace Detail
              </p>
              <DrawerTitle className="mt-2 flex items-baseline gap-3 font-serif text-[26px] font-bold tracking-[0.14em] text-goldbright">
                {cell.name}
                <span className="text-[14px] font-normal tracking-[0.2em] text-silkmuted">
                  {cell.stem}
                  {cell.branch}宫
                </span>
                {cell.isMing && (
                  <span className="rounded-sm bg-gold px-1.5 py-0.5 font-serif text-[11px] font-bold text-deep3">
                    命宫
                  </span>
                )}
                {cell.isShen && (
                  <span className="rounded-sm border border-gold/70 px-1.5 py-0.5 font-serif text-[11px] font-bold text-goldbright">
                    身宫
                  </span>
                )}
              </DrawerTitle>
              <DrawerDescription className="mt-2 text-[13px] leading-[1.9] text-silkmuted">
                {cell.name} · {PALACE_DUTY[cell.name]}
              </DrawerDescription>
            </DrawerHeader>

            <div className="mt-4 border-t border-gold/15 pt-5">
              <p className="text-[12px] tracking-[0.3em] text-silkmuted">入 宫 星 曜</p>
              <ul className="mt-4 space-y-3.5">
                {palaceSentences(cell).map((s, i) => (
                  <li key={i} className="flex gap-3 font-serif text-[14.5px] leading-[1.95] text-silktext">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {[...cell.majors, ...cell.minors].some((s) => s.hua) && (
              <div className="mt-6 rounded-lg border border-gold/20 bg-deep3/60 px-5 py-4">
                <p className="text-[12px] tracking-[0.3em] text-silkmuted">四 化 落 宫</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {[...cell.majors, ...cell.minors]
                    .filter((s) => s.hua)
                    .map((s) => (
                      <span key={s.name} className="flex items-center gap-1.5 text-[13px] text-silktext">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: HUA_COLOR[s.hua!] }}
                        />
                        {s.name}化{s.hua}
                      </span>
                    ))}
                </div>
              </div>
            )}

            <p className="mt-6 text-[12px] leading-[1.9] text-silkmuted">
              大限 {cell.daxian.startAge}–{cell.daxian.endAge} 岁（虚岁）行此宫 · 北派《紫微斗数全书》安星法
            </p>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
