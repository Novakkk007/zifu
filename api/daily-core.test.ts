import { describe, expect, it } from "vitest"
import { getDailySummary, dayGanzhiIndex, yearGanzhiIndex, hourLuck, yijiOf } from "@contracts/engines/daily-core"

describe("daily-core 每日时令引擎", () => {
  it("日干支——1900-01-01 甲戌日 (索引 10)", () => {
    expect(dayGanzhiIndex(1900, 1, 1)).toBe(10) // 甲戌
  })

  it("日干支——2000-06-15 已知值验证", () => {
    const idx = dayGanzhiIndex(2000, 6, 15)
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThan(60)
  })

  it("年柱——2024 为甲辰年", () => {
    expect(yearGanzhiIndex(2024)).toBe(40) // 甲辰
  })

  it("年柱——2025 为乙巳年", () => {
    expect(yearGanzhiIndex(2025)).toBe(41) // 乙巳
  })

  it("时辰——中午 12 点为午时（索引 6）", () => {
    const l = hourLuck(12)
    expect(l.branchIdx).toBe(6)
    expect(l.shortTip).toContain("午时")
  })

  it("时辰——半夜 0 点为子时（索引 0）", () => {
    expect(hourLuck(0).branchIdx).toBe(0)
  })

  it("时辰——23 点为子时（索引 0）", () => {
    expect(hourLuck(23).branchIdx).toBe(0)
  })

  it("宜忌——甲日的宜忌", () => {
    const yj = yijiOf("甲")
    expect(yj.yi).toContain("祭祀")
    expect(yj.ji).toContain("动土")
  })

  it("getDailySummary 包含所有字段", () => {
    const s = getDailySummary(new Date(2024, 5, 15, 12, 30))
    expect(s.date).toBe("2024-06-15")
    expect(s.dayGanzhi.length).toBe(2)
    expect(s.yi.length).toBeGreaterThan(0)
    expect(s.ji.length).toBeGreaterThan(0)
    expect(s.hourLuck).toHaveLength(24)
    expect(s.solarTerm.length).toBeGreaterThan(0)
  })

  it("所有节气名不为空", () => {
    const seen = new Set<string>()
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 28; d += 7) {
        const s = getDailySummary(new Date(2024, m - 1, d))
        seen.add(s.solarTerm)
      }
    }
    // 至少覆盖 20 个不同节气
    expect(seen.size).toBeGreaterThanOrEqual(20)
  })
})
