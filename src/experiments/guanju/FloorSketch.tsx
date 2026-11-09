/**
 * 示例 A 的线稿平面。示意，不是测绘。
 */
type Props = {
  /** 首页缩略图只作装饰，旁边另有文字说明 */
  decorative?: boolean
}

const INK = "rgb(var(--ink-text))"
const DEEP = "rgb(var(--deep))"
const SILK2 = "rgb(var(--silk-2))"
const GOLD = "rgb(var(--gold))"

export default function FloorSketch({ decorative = false }: Props) {
  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 360 270"
        className="h-auto w-full"
        role={decorative ? undefined : "img"}
        aria-hidden={decorative ? true : undefined}
        aria-label={
          decorative
            ? undefined
            : "示例 A 两室一厅示意平面，非测绘。左侧是厅，右上是主卧，右下是次卧。厅的窗边画有高柜，下方是入户。图上方有北向箭头。"
        }
      >
        <g fill="none" stroke={DEEP} strokeWidth="2" strokeLinejoin="round">
          <path d="M28 44 H206 V244 H28 Z" />
          <path d="M206 44 H332 V140 H206 Z" />
          <path d="M206 140 H332 V244 H206 Z" />
          <path d="M206 70 V100" strokeDasharray="3 4" />
          <path d="M206 170 V200" strokeDasharray="3 4" />
          <path d="M70 244 H120" stroke={SILK2} strokeWidth="4" />
        </g>
        <g stroke={DEEP} strokeWidth="1.5">
          <path d="M22 150 H34 M22 190 H34 M22 150 V190" />
          <path d="M240 38 V50 M290 38 V50 M240 38 H290" />
          <path d="M326 170 H338 M326 210 H338 M338 170 V210" />
        </g>
        <rect x="40" y="156" width="38" height="26" fill={SILK2} stroke={DEEP} strokeWidth="1.5" />
        <g fill={INK} stroke="none" fontFamily='"Noto Sans SC", sans-serif'>
          <text x="96" y="128" fontSize="18">
            厅
          </text>
          <text x="236" y="96" fontSize="18">
            主卧
          </text>
          <text x="236" y="196" fontSize="18">
            次卧
          </text>
          <text x="46" y="174" fontSize="12">
            高柜
          </text>
          <text x="78" y="232" fontSize="13">
            入户
          </text>
          <text x="8" y="176" fontSize="12">
            窗
          </text>
          <text x="252" y="32" fontSize="12">
            窗
          </text>
          <text x="300" y="196" fontSize="12">
            窗
          </text>
        </g>
        <g stroke={DEEP} fill="none" strokeWidth="1.75" strokeLinecap="round">
          <path d="M168 30 V12" />
          <path d="M168 12 L162 20 M168 12 L174 20" />
        </g>
        <circle cx="168" cy="12" r="2.5" fill={GOLD} />
        <text x="180" y="24" fill={INK} fontSize="16" fontFamily='"Noto Serif SC", serif'>
          北
        </text>
      </svg>
      {decorative ? null : (
        <>
          <figcaption className="mt-3 text-[14px] leading-[1.6] text-inktext">
            示例非测绘。图中北向是示意箭头，不是罗盘、定位或传感器。
          </figcaption>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[16px] leading-[1.7] text-inktext">
            <li>厅在左侧，左墙有窗，窗内画着高柜。</li>
            <li>主卧在右上，次卧在右下，都标了窗。</li>
            <li>入户在厅的下沿。虚线是房间之间的门洞。</li>
          </ul>
        </>
      )}
    </figure>
  )
}
