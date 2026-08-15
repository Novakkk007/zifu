/**
 * V11 方向3 切换护栏：前端 Daily / Toolkit 从 content/ganzhi.ts 本地计算
 * 切到共享引擎 @contracts/engines/daily-core —— 切换不得改变既有正确输出，
 * 且 INT-02 约束（引擎月柱为公历近似、不上屏）以测试形式固化。
 */
import { describe, expect, it } from "vitest"
import {
  STEMS as CORE_STEMS,
  dayJiazi,
  ganzhiLabel as coreLabel,
  getDailySummary,
  hourBranchOf as coreHourBranchOf,
  jiaziStem,
  monthJiazi,
  yearJiazi,
  yijiOf as coreYijiOf,
} from "@contracts/engines/daily-core"
import {
  dayGanzhiIndex,
  ganzhiLabel as legacyLabel,
  hourBranchOf as legacyHourBranchOf,
  monthPillar,
  yearGanzhiIndex,
} from "@/components/content/ganzhi"

describe("daily-core ↔ content/ganzhi 切换等价性", () => {
  it("任务基准日 2026-07-31：日柱索引与标签两源一致", () => {
    const legacy = dayGanzhiIndex(2026, 7, 31)
    const core = dayJiazi(2026, 7, 31)
    expect(core).toBe(legacy)
    expect(coreLabel(core)).toBe(legacyLabel(legacy))
    expect(coreLabel(core)).toBe("丙午")
  })

  it("1900–2100 抽样（每 37 天）：日柱索引两源零偏差", () => {
    for (let t = Date.UTC(1900, 0, 1); t <= Date.UTC(2100, 11, 31); t += 37 * 86_400_000) {
      const d = new Date(t)
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      const day = d.getUTCDate()
      expect(dayJiazi(y, m, day), `${y}-${m}-${day}`).toBe(dayGanzhiIndex(y, m, day))
    }
  })

  it("六十甲子标签：0–59 全量一致", () => {
    for (let i = 0; i < 60; i++) expect(coreLabel(i)).toBe(legacyLabel(i))
  })

  it("年柱索引：1930–2100 全量一致", () => {
    for (let y = 1930; y <= 2100; y++) expect(yearJiazi(y)).toBe(yearGanzhiIndex(y))
  })

  it("时支划分：0–23 点两源一致", () => {
    for (let h = 0; h < 24; h++) expect(coreHourBranchOf(h)).toBe(legacyHourBranchOf(h))
  })

  it("getDailySummary 字段与日柱索引自洽", () => {
    const s = getDailySummary(new Date(2026, 6, 31))
    expect(s.date).toBe("2026-07-31")
    expect(s.dayGanzhi).toBe("丙午")
    expect(s.dayStem).toBe(CORE_STEMS[jiaziStem(dayJiazi(2026, 7, 31))])
    expect(s.hourLuck).toHaveLength(24)
    expect(s.yi.length).toBeGreaterThan(0)
    expect(s.ji.length).toBeGreaterThan(0)
  })

  it("INT-02：引擎月柱（公历近似）与节气换月月柱不同——上屏必须用 monthPillar()", () => {
    // 2026-07-31：节气版（小暑后入未月）为乙未月；引擎公历近似为丙申月，二者必须不同
    const legacy = monthPillar(2026, 7, 31).label
    const core = coreLabel(monthJiazi(yearJiazi(2026) % 10, 7))
    expect(core).not.toBe(legacy)
    expect(legacy).toBe("乙未")
    expect(getDailySummary(new Date(2026, 6, 31)).monthGanzhi).toBe(core)
  })

  it("宜忌切换后按日干确定性映射（core yijiOf 签名：日干→宜忌）", () => {
    const s = getDailySummary(new Date(2026, 6, 31))
    expect(coreYijiOf(s.dayStem)).toEqual({ yi: s.yi, ji: s.ji })
  })
})
