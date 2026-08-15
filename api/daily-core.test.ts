import { describe, expect, it } from "vitest"
import {
  getDailySummary, yearJiazi, dayJiazi, monthJiazi, hourJiazi,
  ganzhiLabel, jiaziStem, jiaziBranch, hourLuck, yijiOf,
} from "@contracts/engines/daily-core"

/** 所有合法二百甲子标签 */
const ALL_JIAZI = new Set<string>()
for (let i = 0; i < 60; i++) ALL_JIAZI.add(ganzhiLabel(i))

describe("daily-core canonical encoding", () => {
  // ===== Year =====
  it("2024 = 甲辰 (40)", () => {
    const idx = yearJiazi(2024)
    expect(idx).toBe(40)
    expect(jiaziStem(idx)).toBe(0)  // 甲
    expect(jiaziBranch(idx)).toBe(4) // 辰
    expect(ganzhiLabel(idx)).toBe("甲辰")
  })

  it("2025 = 乙巳 (41)", () => {
    expect(ganzhiLabel(yearJiazi(2025))).toBe("乙巳")
  })

  it("every year stem cycles correctly (10 year-stem samples)", () => {
    for (let y = 2000; y < 2010; y++) {
      const s = ganzhiLabel(yearJiazi(y))
      expect(ALL_JIAZI.has(s), `year ${y} gives "${s}"`).toBe(true)
    }
  })

  // ===== Month =====
  it("甲年 正月 = 丙寅", () => expect(ganzhiLabel(monthJiazi(0, 1))).toBe("丙寅"))
  it("甲年 二月 = 丁卯", () => expect(ganzhiLabel(monthJiazi(0, 2))).toBe("丁卯"))
  it("乙年 正月 = 戊寅", () => expect(ganzhiLabel(monthJiazi(1, 1))).toBe("戊寅"))
  it("庚年 正月 = 戊寅", () => expect(ganzhiLabel(monthJiazi(6, 1))).toBe("戊寅"))
  it("丙年 正月 = 庚寅", () => expect(ganzhiLabel(monthJiazi(2, 1))).toBe("庚寅"))
  it("壬年 七月 = 戊申", () => expect(ganzhiLabel(monthJiazi(8, 7))).toBe("戊申"))
  it("己年 腊月 = 丁丑", () => expect(ganzhiLabel(monthJiazi(5, 12))).toBe("丁丑"))
  it("癸年 四月 = 丁巳", () => expect(ganzhiLabel(monthJiazi(9, 4))).toBe("丁巳"))

  // ===== Day =====
  it("1900-01-01 = 甲戌 (10)", () => {
    expect(dayJiazi(1900, 1, 1)).toBe(10)
    expect(ganzhiLabel(10)).toBe("甲戌")
  })

  it("2024-06-15 = 庚戌 (46)", () => {
    const idx = dayJiazi(2024, 6, 15)
    expect(idx).toBe(46)
    expect(ganzhiLabel(idx)).toBe("庚戌")
  })

  // ===== Hour =====
  it("甲日 子时(0h) = 甲子", () => expect(ganzhiLabel(hourJiazi(0, 0))).toBe("甲子"))
  it("甲日 午时(12h) = 庚午", () => expect(ganzhiLabel(hourJiazi(0, 12))).toBe("庚午"))
  it("庚日 子时(0h) = 丙子", () => expect(ganzhiLabel(hourJiazi(6, 0))).toBe("丙子"))
  it("庚日 午时(12h) = 壬午", () => expect(ganzhiLabel(hourJiazi(6, 12))).toBe("壬午"))

  it("hourLuck uses day stem", () => {
    const l0 = hourLuck(0, 0)   // 甲日子时
    const l6 = hourLuck(0, 6)   // 庚日子时
    expect(l0.label).toBe("甲子时")
    expect(l6.label).toBe("丙子时")
    expect(l0.label).not.toBe(l6.label)
  })

  // ===== Encoding invariants =====
  it("all year outputs 2000-2050 are valid jiazi labels", () => {
    for (let y = 2000; y <= 2050; y++) {
      expect(ALL_JIAZI.has(ganzhiLabel(yearJiazi(y)))).toBe(true)
    }
  })

  it("all month outputs for 10 stems × 12 months are valid", () => {
    for (let s = 0; s < 10; s++) {
      for (let m = 1; m <= 12; m++) {
        expect(ALL_JIAZI.has(ganzhiLabel(monthJiazi(s, m)))).toBe(true)
      }
    }
  })

  it("all hour outputs for 2 stems × 24 hours are valid", () => {
    for (const s of [0, 6]) {
      for (let h = 0; h < 24; h++) {
        expect(ALL_JIAZI.has(ganzhiLabel(hourJiazi(s, h)))).toBe(true)
      }
    }
  })

  // ===== Yiji =====
  it("甲日 yiji", () => {
    const yj = yijiOf("甲")
    expect(yj.yi).toContain("祭祀")
    expect(yj.ji).toContain("动土")
  })

  // ===== Summary =====
  it("2024-06-15 12:30 snapshot matches expected values", () => {
    const s = getDailySummary(new Date(2024, 5, 15, 12, 30))
    expect(s.date).toBe("2024-06-15")
    expect(s.yearGanzhi).toBe("甲辰")
    expect(s.dayGanzhi).toBe("庚戌")
    expect(s.dayStem).toBe("庚")
    expect(s.dayBranch).toBe("戌")
    expect(s.monthGanzhi.length).toBe(2)
    expect(s.hourLuck).toHaveLength(24)
    expect(s.hourLuck[0].label).toBe("丙子时")  // 庚日子时
    expect(s.hourLuck[12].label).toBe("壬午时") // 庚日午时
  })
})
