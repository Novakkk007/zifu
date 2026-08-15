/**
 * V12 INT-04 销号测试：IANA 时区接入 daily-core。
 *
 * 核心语义：干支历法的「日」是目标时区的墙钟日历日。
 * 同一绝对时刻在不同时区可能属于不同日历日 → 日柱不同。
 *
 * 案例：UTC 2026-08-14 16:30
 *   - Asia/Shanghai（UTC+8）→ 2026-08-15 00:30 → 辛酉日
 *   - America/New_York（UTC-4 夏令时）→ 2026-08-14 12:30 → 庚申日
 */
import { describe, expect, it } from "vitest"
import { getDailySummary, wallClockFields } from "@contracts/engines/daily-core"

const TZ = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "unknown"
  }
})()

describe("wallClockFields：绝对时刻 → 目标时区墙钟", () => {
  it("UTC 2026-08-14 16:30 → 上海 08-15 00:30", () => {
    const utc = Date.UTC(2026, 7, 14, 16, 30)
    const w = wallClockFields(utc, "Asia/Shanghai")
    expect([w.year, w.month, w.day, w.hour, w.minute]).toEqual([2026, 8, 15, 0, 30])
  })

  it("同一时刻 → 纽约 08-14 12:30（夏令时 UTC-4）", () => {
    const utc = Date.UTC(2026, 7, 14, 16, 30)
    const w = wallClockFields(utc, "America/New_York")
    expect([w.year, w.month, w.day, w.hour, w.minute]).toEqual([2026, 8, 14, 12, 30])
  })
})

describe("getDailySummary 跨时区日柱", () => {
  it("同一绝对时刻：上海 08-15（辛酉）≠ 纽约 08-14（庚申）", () => {
    const utc = Date.UTC(2026, 7, 14, 16, 30)
    const sh = getDailySummary(new Date(utc), { ianaTimezone: "Asia/Shanghai" })
    const ny = getDailySummary(new Date(utc), { ianaTimezone: "America/New_York" })
    expect(sh.date).toBe("2026-08-15")
    expect(ny.date).toBe("2026-08-14")
    expect(sh.dayGanzhi).toBe("辛酉") // Kimi 金标：2026-08-15 = 辛酉日
    expect(ny.dayGanzhi).toBe("庚申")
    expect(sh.dayGanzhi).not.toBe(ny.dayGanzhi)
  })

  it("年柱/月柱时区无关（交节为天文绝对时刻），两地一致", () => {
    // UTC 02-04 01:30：立春交节 = UTC 02-03 20:02:08 已过——
    // 全球任何时区此刻都已是丙午年庚寅月
    const utc = Date.UTC(2026, 1, 4, 1, 30)
    const sh = getDailySummary(new Date(utc), { ianaTimezone: "Asia/Shanghai" })
    const ny = getDailySummary(new Date(utc), { ianaTimezone: "America/New_York" })
    expect(sh.yearGanzhi).toBe("丙午")
    expect(ny.yearGanzhi).toBe("丙午") // 纽约 02-03 15:02 EST 已过立春（15:02 EST）
    expect(sh.monthGanzhi).toBe(ny.monthGanzhi)
    // 而日柱不同（上海 02-04 vs 纽约 02-03）
    expect(sh.dayGanzhi).not.toBe(ny.dayGanzhi)
  })

  it.skipIf(TZ !== "Asia/Shanghai")("显式 Asia/Shanghai 与缺省（本地 UTC+8）一致", () => {
    const d = new Date(2026, 6, 31, 12, 0)
    const a = getDailySummary(d)
    const b = getDailySummary(d, { ianaTimezone: "Asia/Shanghai" })
    expect(b.dayGanzhi).toBe(a.dayGanzhi)
    expect(b.monthGanzhi).toBe(a.monthGanzhi)
    expect(b.solarTerm).toBe(a.solarTerm)
    expect(b.date).toBe(a.date)
  })
})
