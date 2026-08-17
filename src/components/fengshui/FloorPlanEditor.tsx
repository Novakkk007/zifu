/**
 * 户型图编辑器——上传户型图，叠加九宫格，标记门/主卧/厨房。
 * 纯前端 Canvas：图片仅在本机处理，不上传任何服务器。
 */
import { useRef, useState } from 'react'

export type MarkType = 'door' | 'master' | 'kitchen'

export interface FloorPlanMark {
  type: MarkType
  /** 九宫格位置 0-8（左上起） */
  cell: number
}

const MARK_LABEL: Record<MarkType, { label: string; glyph: string }> = {
  door: { label: '大门', glyph: '门' },
  master: { label: '主卧', glyph: '卧' },
  kitchen: { label: '厨房', glyph: '灶' },
}

/** 九宫格传统方位（按上南下北的户型图惯例：上=南） */
const CELL_NAMES = ['东南', '南', '西南', '东', '中宫', '西', '东北', '北', '西北']

export default function FloorPlanEditor({
  marks,
  onMarksChange,
  image,
  onImageChange,
}: {
  marks: FloorPlanMark[]
  onMarksChange: (m: FloorPlanMark[]) => void
  image: string | null
  onImageChange: (dataUrl: string | null) => void
}) {
  const [activeType, setActiveType] = useState<MarkType>('door')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onImageChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  const placeMark = (cell: number) => {
    const next = marks.filter((m) => m.type !== activeType)
    onMarksChange([...next, { type: activeType, cell }])
  }

  return (
    <div>
      {/* 工具条 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-golddim/50 px-4 py-1.5 text-[12.5px] text-goldbright hover:bg-golddim/10"
        >
          {image ? '更换户型图' : '📤 上传户型图'}
        </button>
        {image && (
          <button
            type="button"
            onClick={() => {
              onImageChange(null)
              onMarksChange([])
            }}
            className="rounded-full border border-golddim/30 px-4 py-1.5 text-[12.5px] text-silkmuted hover:border-goldbright"
          >
            清除
          </button>
        )}
        <span className="ml-1 text-[11px] text-silkmuted">
          标注：{Object.values(MARK_LABEL).map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => setActiveType(m.label === '大门' ? 'door' : m.label === '主卧' ? 'master' : 'kitchen')}
              className={`ml-1.5 rounded-full border px-3 py-0.5 text-[11.5px] ${
                MARK_LABEL[activeType].label === m.label
                  ? 'border-goldbright bg-gold/15 text-goldbright'
                  : 'border-golddim/30 text-silkmuted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </span>
      </div>

      {/* 编辑区 */}
      {image ? (
        <div className="relative mt-4 overflow-hidden rounded-xl border border-gold/20 bg-black/40">
          <img src={image} alt="户型图" className="mx-auto max-h-[420px] w-auto object-contain" />
          {/* 九宫格叠加层 */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {CELL_NAMES.map((name, cell) => {
              const mark = marks.find((m) => m.cell === cell)
              return (
                <button
                  key={cell}
                  type="button"
                  onClick={() => placeMark(cell)}
                  className="group relative border border-gold/25 bg-transparent transition-colors hover:bg-gold/10"
                  aria-label={`${name}宫`}
                >
                  {mark ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold font-serif text-[14px] font-bold text-deep shadow">
                        {MARK_LABEL[mark.type].glyph}
                      </span>
                    </span>
                  ) : (
                    <span className="absolute bottom-0.5 right-1 text-[9px] text-silkmuted opacity-0 transition-opacity group-hover:opacity-100">
                      {name}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-4 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gold/25 py-14 text-center transition-colors hover:border-gold/50"
        >
          <span className="text-[26px]">🏠</span>
          <span className="mt-2 text-[13px] text-silkmuted">
            点击上传户型图（拍照或相册均可）
          </span>
          <span className="mt-1 text-[11px] text-silkmuted/70">
            图片仅在本机处理，不上传服务器
          </span>
        </button>
      )}

      {/* 标记列表 */}
      {marks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {marks.map((m, i) => (
            <span
              key={i}
              className="rounded-full border border-golddim/30 bg-black/20 px-3 py-1 text-[11.5px] text-silktext"
            >
              {MARK_LABEL[m.type].label} → {CELL_NAMES[m.cell]}宫
              <button
                type="button"
                onClick={() => onMarksChange(marks.filter((_, j) => j !== i))}
                className="ml-1.5 text-silkmuted hover:text-goldbright"
                aria-label={`移除${MARK_LABEL[m.type].label}标记`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
