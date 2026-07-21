/**
 * 紫府 BrandLogo — 葫芦母标 + 「紫府」字标（Noto Serif CJK SC Bold 轮廓，内联矢量）
 * variant: horizontal（横排，导航） | stacked（竖排） | mark（单标）
 * reverse: 深底反白；默认鎏金 #D2A33D。描边/填充均用 currentColor，可经 CSS color 主题化。
 */
import type { CSSProperties } from 'react'

export type BrandLogoVariant = 'horizontal' | 'stacked' | 'mark'

export interface BrandLogoProps {
  variant?: BrandLogoVariant
  reverse?: boolean
  /** 主高度 px（mark 为边长） */
  size?: number
  className?: string
  style?: CSSProperties
  title?: string
}

const MARK_PATHS = [
  'M256 92 C222 96 196 108 187 128 C181 142 181 154 186 166 C192 186 208 200 228 208 C204 218 176 236 155 262 C132 290 118 322 118 344 C118 390 155 432 212 447 C243 454 269 454 300 447 C357 432 394 390 394 344 C394 322 380 290 357 262 C336 236 308 218 284 208',
  'M256 92 C290 96 316 108 325 128 C331 142 331 154 326 166 C320 186 304 200 286 206 C268 214 254 222 248 232 C236 242 228 252 228 262 C228 274 240 282 256 282 C272 282 282 270 280 256 C279 246 274 238 266 236',
  'M242 286 C228 292 220 300 222 308 C224 317 236 320 248 315 C252 313 254 312 256 310',
  'M216 350 C216 324 232 310 256 310 C280 310 296 324 296 350 L296 392 C296 402 290 408 280 408 L232 408 C222 408 216 402 216 392 Z',
  'M222 346 C232 340 242 340 250 346 C256 352 264 352 270 346 C276 340 284 340 290 344',
  'M220 364 L292 364',
  'M220 380 L220 388 L292 388 L292 380',
  'M232 38 L238 44 C242 54 248 58 256 58 C264 58 270 54 274 44 L280 38',
  'M256 58 L256 92',
  'M256 350 L256 444',
  'M172 460 C190 444 222 438 256 438 C290 438 322 444 340 460',
]

const ZI_PATH = 'M611 737 603 745C671 792 758 872 800 942C928 993 973 751 611 737ZM415 797 300 723 441 702V848C441 858 438 864 423 864C404 864 321 859 321 859V871C367 878 385 890 397 904C409 918 413 941 415 972C542 963 561 923 561 850V684C636 672 703 661 759 651C787 683 812 717 826 748C935 802 989 593 678 559L670 567C691 583 714 604 737 627C558 635 389 641 268 644C439 612 626 562 725 521C749 531 766 525 773 517L657 426C630 445 589 468 541 492L272 496C368 478 472 451 535 426C557 434 572 427 577 418L464 347C416 385 288 458 191 477C180 480 162 482 162 482L210 585C215 582 221 578 225 571C305 560 380 548 444 537C347 579 238 616 148 633C132 636 105 638 105 638L161 758C169 754 176 748 182 739L290 724C239 791 138 877 39 928L47 940C174 916 301 861 376 806C399 812 408 807 415 797ZM28 347 88 470C98 468 109 460 115 447C306 392 434 349 522 316L520 302L385 316V201H505C519 201 529 196 531 185C502 153 450 106 450 106L404 172H385V71C411 66 419 56 421 43L276 30V327L219 332V128C241 125 247 116 249 105L119 94V341ZM689 40 546 28V327C546 399 566 419 664 419H760C916 419 960 407 960 361C960 342 952 330 922 318L918 221H907C892 265 876 303 866 316C860 323 853 326 841 326C829 327 802 327 772 327H691C662 327 658 322 658 308V219C735 204 814 182 864 162C893 170 912 168 922 158L806 71C775 104 716 149 658 186V65C679 63 688 54 689 40Z'
const FU_PATH = 'M1625 496 1615 501C1643 556 1672 631 1674 698C1766 787 1879 597 1625 496ZM1980 105 1918 189H1709C1765 156 1760 39 1553 29L1546 35C1580 72 1619 130 1630 183L1641 189H1374L1238 141V444C1238 619 1233 813 1148 966L1159 975C1345 830 1356 612 1356 444V218H2064C2078 218 2089 213 2092 202C2051 162 1980 105 1980 105ZM1632 274 1489 218C1469 324 1418 489 1354 599L1364 609C1387 589 1409 568 1429 545V969H1449C1492 969 1537 947 1539 939V466C1557 464 1567 457 1570 448L1517 428C1549 380 1574 332 1594 291C1619 292 1628 285 1632 274ZM1998 338 1947 421H1945V271C1969 268 1978 259 1981 244L1831 230V421H1584L1592 450H1831V823C1831 836 1826 842 1809 842C1787 842 1674 834 1674 834V848C1727 857 1750 870 1767 888C1784 906 1790 933 1793 969C1927 957 1945 912 1945 831V450H2062C2076 450 2086 445 2089 434C2058 396 1998 338 1998 338Z'

function MarkSvg({ px, title }: { px: number; title: string }) {
  return (
    <svg
      viewBox="94 14 324 470"
      width={px}
      height={px}
      fill="none"
      stroke="currentColor"
      strokeWidth={15}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {MARK_PATHS.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  )
}

function WordmarkSvg({ px, title }: { px: number; title: string }) {
  // px = 字标高度；em 框 2240x1000
  return (
    <svg
      viewBox="0 0 2240 1000"
      width={(px * 2240) / 1000}
      height={px}
      fill="currentColor"
      role="img"
      aria-label={title}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d={ZI_PATH} />
      <path d={FU_PATH} />
    </svg>
  )
}

export default function BrandLogo({
  variant = 'horizontal',
  reverse = false,
  size = 32,
  className,
  style,
  title = '紫府',
}: BrandLogoProps) {
  const color = reverse ? '#FFFFFF' : '#D2A33D'
  if (variant === 'mark') {
    return (
      <span className={className} style={{ color, display: 'inline-flex', ...style }}>
        <MarkSvg px={size} title={title} />
      </span>
    )
  }
  if (variant === 'stacked') {
    const markPx = size * 0.58
    const wordPx = size * 0.3
    return (
      <span
        className={className}
        style={{
          color,
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: size * 0.07,
          ...style,
        }}
      >
        <MarkSvg px={markPx} title={title} />
        <WordmarkSvg px={wordPx} title={`${title}字标`} />
      </span>
    )
  }
  // horizontal：标高 size，字标高 0.6size，间距 0.14size（与 logo-horizontal.svg 一致）
  return (
    <span
      className={className}
      style={{ color, display: 'inline-flex', alignItems: 'center', gap: size * 0.14, ...style }}
    >
      <MarkSvg px={size} title={title} />
      <WordmarkSvg px={size * 0.6} title={`${title}字标`} />
    </span>
  )
}
