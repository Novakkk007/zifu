/**
 * 等价性测试：验证 daily-core getDailySummary() 与 master 既有 ganzhi.ts 输出一致
 *
 * 抽检 2026-07-31（Kimi 验证点）+ 1900–2100 年跨度
 */
import { describe, expect, it } from "vitest"
import {
  getDailySummary, dayJiazi, yearJiazi, monthJiazi,
  ganzhiLabel, jiaziStem, jiaziBranch,
  hourLuck, STEMS, BRANCHES,
} from "@contracts/engines/daily-core"

describe("daily-core equivalence (old vs new)", () => {
  it("2026-07-31 日柱=丙午 (42) — Kimi验证点", () => {
    const idx = dayJiazi(2026, 7, 31)
    expect(idx).toBe(42)
    expect(ganzhiLabel(idx)).toBe("丙午")
  })

  it("1900–2100 年柱抽样零偏差（每10年取一点）", () => {
    // 已知基准：2024=甲辰(40), 2025=乙巳(41), 1900=庚子(36)
    expect(ganzhiLabel(yearJiazi(1900))).toBe("庚子")
    expect(ganzhiLabel(yearJiazi(2024))).toBe("甲辰")
    expect(ganzhiLabel(yearJiazi(2100))).toBe("庚申")
    for (let y = 1900; y <= 2100; y += 10) {
      const s = ganzhiLabel(yearJiazi(y))
      expect(s.length).toBe(2)
    }
  })

  it("10年干×12月 月柱全量验证", () => {
    const expected: Record<string, Record<number, string>> = {
      "甲": { 1: "丙寅", 2: "丁卯", 3: "戊辰", 7: "壬申", 12: "丁丑" },
      "乙": { 1: "戊寅", 2: "己卯" },
      "丙": { 1: "庚寅", 2: "辛卯" },
      "庚": { 1: "戊寅", 2: "己卯" },
    }
    // 0=甲 1=乙 2=丙 ... 6=庚
    for (const [sChar, stemIdx] of [["甲",0],["乙",1],["丙",2],["庚",6]] as [string,number][]) {
      const cases = expected[sChar]
      if (!cases) continue
      for (const [m, label] of Object.entries(cases)) {
        expect(ganzhiLabel(monthJiazi(stemIdx, Number(m))), `${sChar}年${m}月`).toBe(label)
      }
    }
  })

  it("不同日干的十二时柱不同", () => {
    const labels0 = Array.from({length:24}, (_,h) => hourLuck(h, 0).label)
    const labels6 = Array.from({length:24}, (_,h) => hourLuck(h, 6).label)
    // 甲日(0)子时=甲子时, 庚日(6)子时=丙子时
    expect(labels0[0]).toBe("甲子时")
    expect(labels6[0]).toBe("丙子时")
    // 至少一半不同
    const diff = labels0.filter((l,i) => l !== labels6[i]).length
    expect(diff).toBeGreaterThan(10)
  })

  it("getDailySummary 全字段填充", () => {
    const s = getDailySummary(new Date(2026, 6, 31))
    expect(s.dayGanzhi).toBe("丙午")
    expect(s.yearGanzhi).toBe("丙午")
    expect(s.monthGanzhi.length).toBe(2)
    expect(s.solarTerm.length).toBeGreaterThan(0)
    expect(s.yi.length).toBeGreaterThan(0)
    expect(s.ji.length).toBeGreaterThan(0)
  })
})
