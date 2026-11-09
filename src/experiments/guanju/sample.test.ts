import { describe, expect, it } from "vitest"
import {
  DIRECTIONS,
  FOCUSES,
  PRESET_QUESTIONS,
  gapMessage,
  observationItems,
  resolveReading,
  type Direction,
  type Focus,
} from "@/experiments/guanju/sample"

const ALL_FOCUSES = FOCUSES.map((item) => item.id)

function subsets(ids: Focus[]): Focus[][] {
  const out: Focus[][] = [[]]
  for (const id of ids) {
    const next = out.map((set) => [...set, id])
    out.push(...next)
  }
  return out.filter((set) => set.length > 0)
}

describe("观居示例解读", () => {
  it("南向与采光会更换方向说明，并同时给出生活建议和文化阅读", () => {
    const reading = resolveReading("south", ["light"])
    expect(reading.explainsBearing).toBe(true)
    expect(reading.orientationNote).toContain("南向")
    expect(reading.orientationNote).toContain("演示说明")
    expect(reading.missing).toEqual([])
    expect(reading.covered).toHaveLength(1)
    expect(reading.covered[0]?.life.place).toContain("高柜")
    expect(reading.covered[0]?.life.limit).toContain("没有")
    expect(reading.covered[0]?.culture.limit).toContain("不推断")
  })

  it("不确定时只声明方位未确定，建议正文不解释朝向", () => {
    const reading = resolveReading("unknown", ["light", "air"])
    expect(reading.explainsBearing).toBe(false)
    expect(reading.orientationNote).toBe("方位未确定，不作方位解释。")
    expect(reading.missing).toEqual([])
    const body = reading.covered
      .flatMap((item) => [item.life.suggestion, item.culture.suggestion])
      .join("")
    expect(body).not.toMatch(/北向|东向|南向|西向/)
  })

  it("西向加动线明确示例不足，不静默给出别的方向文案", () => {
    const reading = resolveReading("west", ["flow"])
    expect(reading.covered).toEqual([])
    expect(reading.missing).toEqual(["flow"])
    expect(gapMessage("west", reading.missing, reading.covered.length)).toContain("此设置暂无对应示例")
    expect(observationItems("west", ["flow"])).toEqual([])
  })

  it("西向同时选采光和动线时，只缺动线", () => {
    const reading = resolveReading("west", ["flow", "light"])
    expect(reading.covered.map((item) => item.focus)).toEqual(["light"])
    expect(reading.missing).toEqual(["flow"])
    expect(gapMessage("west", reading.missing, reading.covered.length)).toContain("不会被静默忽略")
  })

  it("关注点顺序固定，重复选择不会重复成卡", () => {
    const reading = resolveReading("north", ["flow", "light", "light", "air"])
    expect(reading.covered.map((item) => item.focus)).toEqual(["light", "air", "flow"])
  })

  it("不同方向的演示说明不同", () => {
    const north = resolveReading("north", ["air"]).orientationNote
    const east = resolveReading("east", ["air"]).orientationNote
    expect(north).not.toBe(east)
    expect(north).toContain("北向")
    expect(east).toContain("东向")
  })

  it("有文案的组合给出最多三项观察，且不建议拆改", () => {
    const items = observationItems("south", ["light"])
    expect(items).toHaveLength(3)
    expect(items.map((item) => item.id)).toEqual(["obs-light", "obs-weather", "obs-movable"])
    expect(items[2]?.label).toContain("只移动可搬动的家具")
    expect(observationItems("north", ALL_FOCUSES).map((item) => item.id)).toEqual([
      "obs-light",
      "obs-air",
      "obs-flow",
    ])
  })

  it("已覆盖组合都不编造书名，也不把测量写成数值", () => {
    for (const direction of DIRECTIONS.map((item) => item.id) as Direction[]) {
      for (const focuses of subsets(ALL_FOCUSES)) {
        const blob = JSON.stringify(resolveReading(direction, focuses))
        expect(blob).not.toContain("《")
        expect(blob).not.toMatch(/照度为|风速为|吉凶分|招财|消灾/)
      }
    }
  })

  it("预设问题是三条静态问答", () => {
    expect(PRESET_QUESTIONS).toHaveLength(3)
    expect(PRESET_QUESTIONS.map((item) => item.q)).toEqual([
      "为什么先看窗边？",
      "不改硬装可以做什么？",
      "文化解读与生活建议有何不同？",
    ])
    for (const item of PRESET_QUESTIONS) {
      expect(item.a.length).toBeGreaterThan(20)
    }
  })
})
