import { describe, expect, it } from "vitest"
import {
  getDailySummary, dayGanzhiIndex, yearGanzhiIndex,
  monthGanzhiIndex, ganzhiLabel,
  hourLuck, yijiOf,
} from "@contracts/engines/daily-core"

describe("daily-core 每日时令引擎", () => {
  it("日干支——1900-01-01 甲戌日 (索引 10)", () => {
    expect(dayGanzhiIndex(1900, 1, 1)).toBe(10) // 甲戌
  })

  it("日干支——2000-06-15 已知值验证", () => {
    const idx = dayGanzhiIndex(2000, 6, 15)
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThan(60)
  })

  it("年柱——2024 为甲辰年 (索引 40)", () => {
    expect(yearGanzhiIndex(2024)).toBe(40)
  })

  it("年柱——2025 为乙巳年 (索引 41)", () => {
    expect(yearGanzhiIndex(2025)).toBe(41)
  })

  // ===== 月柱验证（Kimi 的 8 个五虎遁对照案例）=====

  it("月柱——甲年正月=丙寅", () => {
    expect(ganzhiLabel(monthGanzhiIndex(0, 1))).toBe("丙寅")
  })
  it("月柱——甲年二月=丁卯", () => {
    expect(ganzhiLabel(monthGanzhiIndex(0, 2))).toBe("丁卯")
  })
  it("月柱——乙年正月=戊寅", () => {
    expect(ganzhiLabel(monthGanzhiIndex(1, 1))).toBe("戊寅")
  })
  it("月柱——庚年正月=戊寅", () => {
    expect(ganzhiLabel(monthGanzhiIndex(6, 1))).toBe("戊寅")
  })
  it("月柱——丙年正月=庚寅", () => {
    expect(ganzhiLabel(monthGanzhiIndex(2, 1))).toBe("庚寅")
  })
  it("月柱——壬年七月=戊申", () => {
    expect(ganzhiLabel(monthGanzhiIndex(8, 7))).toBe("戊申")
  })
  it("月柱——己年腊月=丁丑", () => {
    expect(ganzhiLabel(monthGanzhiIndex(5, 12))).toBe("丁丑")
  })
  it("月柱——癸年四月=丁巳", () => {
    expect(ganzhiLabel(monthGanzhiIndex(9, 4))).toBe("丁巳")
  })

  // ===== 时辰 =====

  it("时辰——中午 12 点为午时（索引 6）", () => {
    expect(hourLuck(12).branchIdx).toBe(6)
  })
  it("时辰——半夜 0 点为子时（索引 0）", () => {
    expect(hourLuck(0).branchIdx).toBe(0)
  })
  it("时辰——23 点为子时", () => {
    expect(hourLuck(23).branchIdx).toBe(0)
  })

  // ===== 宜忌 =====

  it("宜忌——甲日的宜忌", () => {
    const yj = yijiOf("甲")
    expect(yj.yi).toContain("祭祀")
    expect(yj.ji).toContain("动土")
  })

  // ===== 汇总 =====

  it("getDailySummary 包含所有字段", () => {
    const s = getDailySummary(new Date(2024, 5, 15, 12, 30))
    expect(s.date).toBe("2024-06-15")
    expect(s.dayGanzhi.length).toBe(2)
    expect(s.monthGanzhi.length).toBe(2)
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
    expect(seen.size).toBeGreaterThanOrEqual(20)
  })
})
