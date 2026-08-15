/**
 * V12 INT-02/03 销号金标测试（Kimi 双源交叉验证：sxtwl × lunar_python）。
 *
 * 金标来源（北京时间 UTC+8）：
 *   立春 2026 交节 = 2026-02-04 04:02:08（04:01 → 乙巳年己丑月；04:03 → 丙午年庚寅月）
 *   惊蛰 2026 交节 = 2026-03-05 21:59:00（庚寅月 → 辛卯月）
 *   日柱锚点：1900-01-01 = 甲戌日；2026-08-15 = 辛酉日
 *
 * 时区策略：金标是北京时间，但 CI（UTC）与本地（UTC+8）环境不同。
 * - 「相对断言」（交节时刻前后 ±1 分钟换月换年）用 lunar-typescript 自身交节表
 *   构造绝对时刻，任何时区自洽；
 * - 「绝对时刻锚点」（04:02:08 逐秒核对）仅在 Asia/Shanghai 时区断言，
 *   其他时区跳过并注明。
 */
import { describe, expect, it } from "vitest"
import { Solar } from "lunar-typescript"
import { getDailySummary } from "@contracts/engines/daily-core"

const TZ = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "unknown"
  }
})()
const isCST = TZ === "Asia/Shanghai"

/** 节气表键别名：lunar-typescript 的表跨年部分用英文大写键（如 2026 冬至=DONG_ZHI） */
const KEY_ALIASES: Record<string, string[]> = {
  冬至: ["冬至", "DONG_ZHI"],
  小寒: ["小寒", "XIAO_HAN"],
  大寒: ["大寒", "DA_HAN"],
  立春: ["立春", "LI_CHUN"],
  雨水: ["雨水", "YU_SHUI"],
  惊蛰: ["惊蛰", "JING_ZHE"],
}

/** 从 lunar 交节表取某年某节气交节时刻的本地 Date（字段构造，时区自洽） */
function jieqiInstant(year: number, name: string): Date {
  const table = Solar.fromYmd(year, 1, 15).getLunar().getJieQiTable() as Record<string, unknown>
  for (const key of KEY_ALIASES[name] ?? [name]) {
    const s = table[key]
    if (!s || typeof (s as { getYear?: unknown }).getYear !== "function") continue
    const j = s as { getYear(): number; getMonth(): number; getDay(): number; getHour(): number; getMinute(): number; getSecond(): number }
    if (j.getYear() !== year) continue // 跳过跨年遗留的同名节气
    return new Date(j.getYear(), j.getMonth() - 1, j.getDay(), j.getHour(), j.getMinute(), j.getSecond())
  }
  throw new Error(`节气表未找到 ${year} ${name}`)
}

describe("INT-02/03 金标：立春交节换年换月（相对断言，时区自洽）", () => {
  it("立春前 1 分钟：乙巳年 己丑月；立春后 1 分钟：丙午年 庚寅月", () => {
    const lichun = jieqiInstant(2026, "立春")
    const before = new Date(lichun.getTime() - 60_000)
    const after = new Date(lichun.getTime() + 60_000)

    const s1 = getDailySummary(before)
    const s2 = getDailySummary(after)

    expect(s1.yearGanzhi).toBe("乙巳")
    expect(s1.monthGanzhi).toBe("己丑")
    expect(s2.yearGanzhi).toBe("丙午")
    expect(s2.monthGanzhi).toBe("庚寅")
    // 换界前后日柱不变，且 = 己酉（Kimi 金标明确值）
    expect(s1.dayGanzhi).toBe(s2.dayGanzhi)
    expect(s1.dayGanzhi).toBe("己酉")
  })

  it("清明交节前后 1 分钟：辛卯月 → 壬辰月", () => {
    const qingming = jieqiInstant(2026, "清明")
    const before = getDailySummary(new Date(qingming.getTime() - 60_000))
    const after = getDailySummary(new Date(qingming.getTime() + 60_000))
    expect(before.monthGanzhi).toBe("辛卯")
    expect(after.monthGanzhi).toBe("壬辰")
  })

  it("惊蛰换月：交节前后 1 分钟 庚寅月 → 辛卯月（年柱不动）", () => {
    const jingzhe = jieqiInstant(2026, "惊蛰")
    const before = getDailySummary(new Date(jingzhe.getTime() - 60_000))
    const after = getDailySummary(new Date(jingzhe.getTime() + 60_000))
    expect(before.monthGanzhi).toBe("庚寅")
    expect(after.monthGanzhi).toBe("辛卯")
    expect(before.yearGanzhi).toBe(after.yearGanzhi)
  })

  it("日柱金标：2026-08-15 = 辛酉日（Kimi 双源一致）", () => {
    const s = getDailySummary(new Date(2026, 7, 15))
    expect(s.dayGanzhi).toBe("辛酉")
  })
})

describe("INT-03 金标：绝对交节时刻（仅 UTC+8 断言，其他时区跳过）", () => {
  it.skipIf(!isCST)("立春 2026 = 北京时间 2026-02-04 04:02:08（逐秒核对 Kimi 金标）", () => {
    const lichun = jieqiInstant(2026, "立春")
    const l = lichun // 本地构造即北京时间
    expect(l.getFullYear()).toBe(2026)
    expect(l.getMonth()).toBe(1) // 2 月
    expect(l.getDate()).toBe(4)
    expect(l.getHours()).toBe(4)
    expect(l.getMinutes()).toBe(2)
    expect(l.getSeconds()).toBe(8)
  })

  it.skipIf(!isCST)("立秋 2026 = 2026-08-07 19:42:43；冬至 2026 = 2026-12-22 04:50:14", () => {
    const liqiu = jieqiInstant(2026, "立秋")
    expect([liqiu.getMonth(), liqiu.getDate(), liqiu.getHours(), liqiu.getMinutes(), liqiu.getSeconds()])
      .toEqual([7, 7, 19, 42, 43])
    const dongzhi = jieqiInstant(2026, "冬至")
    expect([dongzhi.getMonth(), dongzhi.getDate(), dongzhi.getHours(), dongzhi.getMinutes(), dongzhi.getSeconds()])
      .toEqual([11, 22, 4, 50, 14])
  })

  it.skipIf(!isCST)("清明 2026 = 2026-04-05 02:40:00；夏至 2026 = 2026-06-21 16:24:30", () => {
    const qingming = jieqiInstant(2026, "清明")
    expect([qingming.getMonth(), qingming.getDate(), qingming.getHours(), qingming.getMinutes(), qingming.getSeconds()])
      .toEqual([3, 5, 2, 40, 0])
    const xiazhi = jieqiInstant(2026, "夏至")
    expect([xiazhi.getMonth(), xiazhi.getDate(), xiazhi.getHours(), xiazhi.getMinutes(), xiazhi.getSeconds()])
      .toEqual([5, 21, 16, 24, 30])
  })
})
