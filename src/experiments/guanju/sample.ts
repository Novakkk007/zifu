/**
 * 紫府·观居示例文案。全部虚构，只服务网页演示。
 * 方向只更换说明；不确定不作方位解释；西向 × 动线故意没有文案。
 */

export const SAMPLE_VERSION = "guanju-sample-a-1" as const
export const EXAMPLE_ID = "A" as const

export const DIRECTIONS = [
  { id: "north", label: "北向" },
  { id: "east", label: "东向" },
  { id: "south", label: "南向" },
  { id: "west", label: "西向" },
  { id: "unknown", label: "不确定" },
] as const

export const FOCUSES = [
  { id: "light", label: "采光" },
  { id: "air", label: "通风" },
  { id: "flow", label: "动线" },
] as const

export type Direction = (typeof DIRECTIONS)[number]["id"]
export type Focus = (typeof FOCUSES)[number]["id"]

export const DIRECTION_LABEL: Record<Direction, string> = {
  north: "北向",
  east: "东向",
  south: "南向",
  west: "西向",
  unknown: "不确定",
}

export const FOCUS_LABEL: Record<Focus, string> = {
  light: "采光",
  air: "通风",
  flow: "动线",
}

const UNCOVERED: Record<Direction, readonly Focus[]> = {
  north: [],
  east: [],
  south: [],
  west: ["flow"],
  unknown: [],
}

const ORIENTATION_NOTE: Record<Direction, string> = {
  north: "演示说明：你将示例 A 的主要朝向标为北向。这段话只随选项更换，不计算日照，也不表示北向更暗。",
  east: "演示说明：你将示例 A 的主要朝向标为东向。这段话只随选项更换，不表示上午更亮。",
  south: "演示说明：你将示例 A 的主要朝向标为南向。这段话只随选项更换，不表示全天明亮。",
  west: "演示说明：你将示例 A 的主要朝向标为西向。这段话只随选项更换，不表示午后眩光。",
  unknown: "方位未确定，不作方位解释。",
}

export type Advice = {
  place: string
  basis: string
  suggestion: string
  limit: string
  why: string
}

export type FocusReading = {
  focus: Focus
  life: Advice
  culture: Advice
}

export type ReadingResult = {
  orientationNote: string
  explainsBearing: boolean
  covered: FocusReading[]
  missing: Focus[]
}

const LIFE: Record<Focus, Advice> = {
  light: {
    place: "厅 · 窗边高柜",
    basis: "示例图把高柜画在厅的窗边。这是示意位置，图上没有比例尺。",
    suggestion:
      "白天可以比较两下：高柜贴着窗，以及把它从窗边让开大约一掌之后，窗边地面的明暗感觉是否不同。只移动图里这种可搬动的柜子。",
    limit: "没有做日照或照度测量。实际感受取决于窗外遮挡、天气和楼层，本页不推断。",
    why: "示例图里被点名的遮挡物就在窗旁。先做一次可以恢复的比较，比改窗或拆墙更适合这个演示。",
  },
  air: {
    place: "厅与两间卧室的门口",
    basis: "示例图只标出门和窗的相对位置，没有风道或风速数据。",
    suggestion:
      "在不改窗扇的前提下，暂时打开通向两间卧室的门，站在门口感受有没有气流穿过。若觉得闷，先记下是哪一扇门关着。",
    limit: "没有通风模拟，也不测量风速。体感不等于换气量。",
    why: "门窗的开合是示例图上能指到、而且可以随时恢复的条件。先记录感受，不把一次体感写成结论。",
  },
  flow: {
    place: "入户到两间卧室门口",
    basis: "示例图中，入户后先进入厅，再走到两间卧室门口。图上距离不是实际尺寸。",
    suggestion:
      "从入户走到两间卧室门口，看行李会不会横穿厅里主要坐着的位置。可以先用一张小凳试着让出走道。",
    limit: "没有测量步数或通道宽度。不建议为这条示意拆墙或移动承重构件。",
    why: "动线观察看的是人怎么走。这个示例能做的，是走一遍，并让开可搬动的物件。",
  },
}

const CULTURE: Record<Focus, Advice> = {
  light: {
    place: "厅 · 窗",
    basis: "传统居住叙事里，常把开窗讲成室内与屋外相连的开口，用来谈内外，而不是谈吉凶。",
    suggestion: "可以把这段阅读理解成：窗边先留给日常起居，柜子是后来放上的物件。这只是一种空间讲法。",
    limit: "不推断居住者的运势、健康或财物，也不引用未经核验的古籍句子。",
    why: "文化阅读回答前人怎样讲这个开口，生活建议回答你可以比较什么。并列写出来，是为了避免把故事写成预测。",
  },
  air: {
    place: "厅与卧室之间",
    basis: "传统居住叙事有时用「气」描述房间之间的开合与走动。这里只把这个词当作叙事用语。",
    suggestion: "阅读时可以把门的开合看成叙事里的通与隔。对照的是你站在门口的感觉，不是能量大小。",
    limit: "不把这个词解释成可测量的能量，也不判断旺衰或吉凶。",
    why: "用词需要交代边界，避免把文化比喻听成环境结论。",
  },
  flow: {
    place: "入户门之后",
    basis: "传统居住叙事常讨论进门之后先看见什么、卧室是否立刻暴露在入口视线里。",
    suggestion: "对照示例图：进门先到厅，两间卧室在另一侧。这只说明图上的先后，不评价住在这里的人。",
    limit: "不推断家庭、事业或平安，也不把入口讲成需要化解的问题。",
    why: "入口与秩序是文化阅读里的常见话题。这里停在空间叙事。",
  },
}

export function directionLabel(direction: Direction): string {
  return DIRECTION_LABEL[direction]
}

export function focusLabel(focus: Focus): string {
  return FOCUS_LABEL[focus]
}

export function normalizeFocuses(focuses: readonly Focus[]): Focus[] {
  const picked = new Set(focuses)
  return FOCUSES.map((item) => item.id).filter((id) => picked.has(id))
}

export function resolveReading(direction: Direction, focuses: readonly Focus[]): ReadingResult {
  const ordered = normalizeFocuses(focuses)
  const blocked = new Set(UNCOVERED[direction])
  const missing = ordered.filter((id) => blocked.has(id))
  const covered = ordered
    .filter((id) => !blocked.has(id))
    .map((focus) => ({
      focus,
      life: LIFE[focus],
      culture: CULTURE[focus],
    }))
  return {
    orientationNote: ORIENTATION_NOTE[direction],
    explainsBearing: direction !== "unknown",
    covered,
    missing,
  }
}

export function gapMessage(direction: Direction, missing: readonly Focus[], coveredCount: number): string | null {
  if (missing.length === 0) return null
  const where = `${DIRECTION_LABEL[direction]} · ${missing.map((id) => FOCUS_LABEL[id]).join("、")}`
  if (coveredCount === 0) {
    return `此设置暂无对应示例（${where}）。请返回调整方向或关注点。当前选择不会被换成另一套解读。`
  }
  return `此设置暂无对应示例（${where}）。其余已准备的关注点仍列在下面，缺失的部分不会被静默忽略。`
}

export type ObservationItem = {
  id: string
  label: string
}

const OBSERVATION_BY_FOCUS: Record<Focus, ObservationItem> = {
  light: {
    id: "obs-light",
    label: "白天在厅的窗边站一会，比较高柜贴窗和从窗边让开之后的明暗感受。",
  },
  air: {
    id: "obs-air",
    label: "暂时打开通向卧室的门，站在门口感受有没有气流。这只是体感，不是风速测量。",
  },
  flow: {
    id: "obs-flow",
    label: "从入户走到两间卧室门口，看是否要横穿厅的主要坐处。只用可搬动的小凳试让出走道。",
  },
}

const OBSERVATION_FILLERS: ObservationItem[] = [
  {
    id: "obs-weather",
    label: "记下观察时的天气和窗外遮挡，避免把一次感受写成定论。",
  },
  {
    id: "obs-movable",
    label: "若要调整，只移动可搬动的家具，不拆墙、不改电路、不改管道。",
  },
]

export function observationItems(direction: Direction, focuses: readonly Focus[]): ObservationItem[] {
  const reading = resolveReading(direction, focuses)
  if (reading.covered.length === 0) return []
  const items = reading.covered.map((item) => OBSERVATION_BY_FOCUS[item.focus])
  for (const filler of OBSERVATION_FILLERS) {
    if (items.length >= 3) break
    items.push(filler)
  }
  return items.slice(0, 3)
}

export const PRESET_QUESTIONS = [
  {
    id: "window",
    q: "为什么先看窗边？",
    a: "示例 A 的平面里，被标出来的遮挡是厅窗边的高柜。先看它，是为了做一次可以恢复的比较：柜子贴着窗，和从窗边让开之后，明暗感觉有没有不同。这条回复是预先写好的，没有根据照片或测量重新计算。",
  },
  {
    id: "soft",
    q: "不改硬装可以做什么？",
    a: "这个示例只建议移动可搬动的高柜、暂时打开房门，或用小凳让出走道。不涉及拆墙、改窗、改电路或改管道。若某个方向和关注点没有准备文案，页面会直接说明示例不足。",
  },
  {
    id: "diff",
    q: "文化解读与生活建议有何不同？",
    a: "生活观察建议只描述图上能指到的位置，以及你可以自己比较的感受，并写明没有测量。传统文化阅读把入口、开窗和房间先后讲成空间叙事，并声明这不是科学结论，也不推断运势。两者分开，是为了避免把故事写成预测。",
  },
] as const

export type PresetQuestionId = (typeof PRESET_QUESTIONS)[number]["id"]
