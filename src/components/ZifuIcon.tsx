/**
 * 紫府 · 栏目徽记（隐晦中式线条图标）
 * 极简手绘线条：细金线、大留白、意象藏三分——不直白、有暗香
 * 用法：<ZifuIcon name="liuyao" className="h-4 w-4" />
 */
import type { SVGProps } from 'react'

export type ZifuIconName = 'liuyao' | 'bazi' | 'jianlu' | 'cangbaoge' | 'cangjingge' | 'shu' | 'bao'

const PATHS: Record<ZifuIconName, React.ReactNode> = {
  /* 六爻：三爻断线——阴爻意象，微错落 */
  liuyao: (
    <>
      <path d="M5 7h14" />
      <path d="M7 12h10" />
      <path d="M5 17h14" />
      <circle cx="19" cy="7" r="0.6" />
      <circle cx="17" cy="12" r="0.6" />
      <circle cx="19" cy="17" r="0.6" />
    </>
  ),
  /* 排盘：同心双圆+微错盘心——盘面意象 */
  bazi: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 3.5v4.5M12 16v4.5M3.5 12h4.5M16 12h4.5" />
      <circle cx="12" cy="12" r="0.8" />
    </>
  ),
  /* 问剑：一柄剑斜挑——只画剑尖与剑格，隐去剑身 */
  jianlu: (
    <>
      <path d="M14.5 4.5L19 9" />
      <path d="M17 7l-4.2 4.2" />
      <path d="M12.8 11.2l-6 6" />
      <circle cx="6.8" cy="17.2" r="0.7" />
    </>
  ),
  /* 藏宝阁：飞檐挑角——阁楼意象，一角入画 */
  cangbaoge: (
    <>
      <path d="M4 17c2.5-6 5-8.5 8-8.5S17.5 11 20 17" />
      <path d="M12 8.5L10.5 6M12 8.5L13.5 6" />
      <path d="M6 17h12" />
      <path d="M9 17v2.5M15 17v2.5" />
    </>
  ),
  /* 藏经阁（类）：线装书展开——两页微张 */
  cangjingge: (
    <>
      <path d="M12 5.5C10.5 4 8 3.5 5.5 3.8v13c2.5-.3 5 .2 6.5 1.7 1.5-1.5 4-2 6.5-1.7v-13C16 3.5 13.5 4 12 5.5Z" />
      <path d="M12 5.5v13" />
      <path d="M8 7.5h1.5M8 10.5h1.5M14.5 7.5H16M14.5 10.5H16" />
    </>
  ),
  /* 术（类）：坎卦——两阴一阳，古法最简符号 */
  shu: (
    <>
      <path d="M6 6.5h12M6 6.5h5M6 6.5v0" opacity={0} />
      <path d="M8 6.5h8M8 12h8M6 17.5h12M8 17.5h8" />
      <path d="M12 6.5h4M12 17.5h4" opacity={0} />
    </>
  ),
  /* 宝（类）：如意祥云勾——一笔回环 */
  bao: (
    <>
      <path d="M7 16c-2-1.5-3.5-4-2-7.5 1.5-3.5 5.5-3 7-.5 1.5 2.5 2.5 5 4 6 1.5 1 2.5 1.5 3 3 .5 1.5-1.5 3-3.5 2.5C12.5 18.7 9 17.5 7 16Z" />
      <circle cx="15.5" cy="9.5" r="0.7" />
    </>
  ),
}

export default function ZifuIcon({
  name,
  size = 16,
  strokeWidth = 1.2,
  ...rest
}: { name: ZifuIconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
