/**
 * 全量精度对拍 · Web 金标生成器（诊断用，不改 Web 引擎）
 * 用 Web 引擎（contracts/bazi-core computeChartV2）同机直算 119 组输入的金标，
 * 落盘到小程序仓库 scripts/golden/（duipai-full.js 消费）。
 * 跑法：npx tsx scripts/gen-bazi-golden.ts
 */
import { LunarYear, Solar } from 'lunar-typescript'
import { computeChartV2 } from '@contracts/bazi-core'
import type { BirthInput } from '@contracts/bazi-core'
import fs from 'fs'
import path from 'path'

const OUT_DIR = 'F:/紫府文件/zifu-miniprogram/scripts/golden'
const INPUTS_PATH = path.join(OUT_DIR, 'bazi-duipai-inputs.json')
const GOLDEN_PATH = path.join(OUT_DIR, 'bazi-web-golden.json')

type Vec = { id: string; tag: string; input: BirthInput }

const vectors: Vec[] = []
let seq = 0
function add(tag: string, input: BirthInput) {
  seq += 1
  vectors.push({ id: `V${String(seq).padStart(3, '0')}`, tag, input })
}

const base = (over: Partial<BirthInput>): BirthInput => ({
  calendar: 'solar',
  year: 1990,
  month: 3,
  day: 15,
  hour: 8,
  minute: 0,
  gender: 'male',
  useTrueSolarTime: false,
  dayRollover: 'zichu',
  longitude: 116.4,
  ianaTimezone: 'Asia/Shanghai',
  ...over,
})

/* ── A. 固定公历散布 1900-2026（含子时/0点/闰日/岁末边界） ── */
const fixed: Array<[number, number, number, number, number, string, string]> = [
  [1900, 1, 1, 0, 0, 'male', 'zichu'],
  [1900, 2, 28, 12, 0, 'female', 'zichu'],
  [1901, 12, 31, 23, 59, 'male', 'zichu'],
  [1911, 10, 10, 10, 0, 'male', 'zichu'],
  [1924, 2, 5, 23, 30, 'female', 'midnight'],
  [1949, 10, 1, 15, 0, 'male', 'zichu'],
  [1950, 6, 25, 12, 0, 'female', 'zichu'],
  [1963, 8, 15, 8, 30, 'male', 'zichu'],
  [1966, 5, 16, 4, 0, 'female', 'zichu'],
  [1970, 10, 12, 9, 16, 'male', 'zichu'],
  [1976, 9, 9, 9, 9, 'female', 'zichu'],
  [1980, 1, 1, 23, 30, 'male', 'midnight'],
  [1984, 12, 31, 23, 59, 'female', 'zichu'],
  [1987, 4, 12, 3, 0, 'male', 'zichu'],
  [1989, 8, 22, 16, 12, 'female', 'zichu'],
  [1990, 3, 15, 8, 0, 'male', 'zichu'],
  [1992, 8, 18, 22, 30, 'female', 'midnight'],
  [1993, 1, 4, 12, 43, 'male', 'zichu'],
  [1995, 6, 15, 12, 30, 'male', 'zichu'],
  [1996, 7, 7, 14, 0, 'female', 'zichu'],
  [2000, 2, 29, 23, 0, 'male', 'zichu'],
  [2000, 12, 31, 23, 59, 'female', 'midnight'],
  [2001, 9, 11, 9, 0, 'male', 'zichu'],
  [2004, 2, 10, 0, 0, 'female', 'zichu'],
  [2008, 8, 8, 20, 0, 'male', 'zichu'],
  [2012, 12, 21, 11, 12, 'female', 'zichu'],
  [2016, 2, 8, 0, 0, 'male', 'zichu'],
  [2020, 1, 25, 0, 0, 'female', 'zichu'],
  [2021, 2, 11, 23, 59, 'male', 'midnight'],
  [2023, 1, 1, 0, 0, 'female', 'zichu'],
  [2024, 2, 9, 23, 59, 'male', 'zichu'],
  [2025, 1, 29, 0, 0, 'female', 'zichu'],
  [2026, 2, 17, 0, 0, 'male', 'zichu'],
]
fixed.forEach(([y, m, d, h, mi, g, r]) => {
  add(`固定-${y}-${m}-${d}-${h}:${mi}`, base({ year: y, month: m, day: d, hour: h, minute: mi, gender: g as 'male' | 'female', dayRollover: r as 'zichu' | 'midnight' }))
})

/* ── B. 节气交节时刻 ±2 分钟探针（立春/清明/立秋/立冬/冬至） ── */
function jieSolar(civilYear: number, nameCn: string, nameUp: string): Solar {
  const lunarCur = Solar.fromYmd(civilYear, 7, 1).getLunar()
  const t = lunarCur.getJieQiTable() as Record<string, Solar>
  const s = t[nameCn] ?? t[nameUp]
  if (s && s.getYear() === civilYear) return s
  throw new Error(`jie not found: ${civilYear} ${nameCn}`)
}
function offsetOf(s: Solar, offsetMin: number): { y: number; m: number; d: number; h: number; mi: number } {
  const utc = Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond())
  const t = new Date(utc + offsetMin * 60000)
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes() }
}
const jieList: Array<[string, string]> = [
  ['立春', 'LI_CHUN'],
  ['清明', 'QING_MING'],
  ['立秋', 'LI_QIU'],
  ['立冬', 'LI_DONG'],
  ['冬至', 'DONG_ZHI'],
]
for (const y of [1900, 1901, 2000, 2024, 2026]) {
  for (const [cn, up] of jieList) {
    let s: Solar
    try {
      s = jieSolar(y, cn, up)
    } catch {
      continue
    }
    for (const off of [-2, 2]) {
      const o = offsetOf(s, off)
      add(
        `节气-${y}-${cn}${off > 0 ? '+' : ''}${off}min`,
        base({ year: o.y, month: o.m, day: o.d, hour: o.h, minute: o.mi, gender: off < 0 ? 'male' : 'female' }),
      )
    }
  }
}

/* ── C. 子时换日边界（23:00/23:59/0:00/0:01 × zichu/midnight） ── */
const ziCases: Array<[number, number, number, number, number]> = [
  [1990, 3, 15, 23, 0],
  [1989, 8, 22, 23, 59],
  [2000, 2, 29, 0, 0],
  [2024, 2, 9, 0, 1],
]
for (const [y, m, d, h, mi] of ziCases) {
  for (const r of ['zichu', 'midnight'] as const) {
    add(`子时边界-${y}-${m}-${d}-${h}:${mi}-${r}`, base({ year: y, month: m, day: d, hour: h, minute: mi, gender: r === 'zichu' ? 'male' : 'female', dayRollover: r }))
  }
}

/* ── D. 闰月（农历输入，isLeapMonth=true，含月末边界） ── */
const leapPicks: Array<[number, number]> = [
  [1900, 8], [1917, 2], [1928, 2], [1947, 2], [1955, 3], [1963, 4], [1968, 7],
  [1976, 8], [1984, 10], [1990, 5], [1995, 8], [1998, 5], [2004, 2], [2014, 9],
  [2017, 6], [2020, 4], [2023, 2], [2025, 6],
]
for (const [y, lm] of leapPicks) {
  const ly = LunarYear.fromYear(y)
  const actual = ly.getLeapMonth()
  if (actual !== lm) {
    console.error(`跳过：${y} 年实际闰月 ${actual} ≠ 预期 ${lm}`)
    continue
  }
  const dayCount = ly.getMonths().find((mm) => Math.abs(mm.getMonth()) === lm && mm.getMonth() < 0)?.getDayCount() ?? 30
  const days = [15]
  if (dayCount >= 29) days.push(dayCount)
  days.forEach((day, di) => {
    add(
      `闰月-${y}-闰${lm}-日${day}`,
      {
        calendar: 'lunar',
        year: y,
        month: lm,
        day,
        isLeapMonth: true,
        hour: di === 0 ? 11 : 23,
        minute: di === 0 ? 30 : 30,
        gender: di % 2 === 0 ? 'female' : 'male',
        useTrueSolarTime: false,
        dayRollover: 'zichu',
        ianaTimezone: 'Asia/Shanghai',
      },
    )
  })
}
/* 普通农历（非闰）对照 */
add('农历-非闰-1990-12-5', {
  calendar: 'lunar', year: 1990, month: 12, day: 5, hour: 12, minute: 0,
  gender: 'male', useTrueSolarTime: false, dayRollover: 'zichu', ianaTimezone: 'Asia/Shanghai',
})
add('农历-非闰-2024-1-29', {
  calendar: 'lunar', year: 2024, month: 1, day: 29, hour: 23, minute: 0,
  gender: 'female', useTrueSolarTime: false, dayRollover: 'zichu', ianaTimezone: 'Asia/Shanghai',
})
/* 非法农历日期（2024 正月仅 29 天）——错误行为一致性探针 */
add('农历-非法-2024-1-30', {
  calendar: 'lunar', year: 2024, month: 1, day: 30, hour: 12, minute: 0,
  gender: 'male', useTrueSolarTime: false, dayRollover: 'zichu', ianaTimezone: 'Asia/Shanghai',
})

/* ── E. 城市 / 经度 / 时区（含真太阳时、夏令时、中国夏令时 1986-1991） ── */
const cityCases: Array<[string, number, string, boolean, number, number, number, number, number, string]> = [
  ['北京', 116.4, 'Asia/Shanghai', true, 1995, 6, 15, 12, 30, 'male'],
  ['乌鲁木齐', 87.6, 'Asia/Urumqi', true, 1995, 6, 15, 12, 30, 'male'],
  ['乌鲁木齐', 87.6, 'Asia/Urumqi', false, 1995, 6, 15, 12, 30, 'female'],
  ['哈尔滨', 126.6, 'Asia/Shanghai', true, 1988, 1, 10, 23, 30, 'female'],
  ['拉萨', 91.1, 'Asia/Shanghai', true, 2008, 5, 12, 14, 28, 'female'],
  ['广州', 113.3, 'Asia/Shanghai', true, 1997, 7, 1, 0, 0, 'male'],
  ['新加坡', 103.8, 'Asia/Singapore', true, 2001, 1, 1, 12, 0, 'male'],
  ['悉尼(夏令时)', 151.2, 'Australia/Sydney', true, 2001, 1, 15, 12, 0, 'male'],
  ['纽约(夏令时)', -74.0, 'America/New_York', true, 2001, 7, 4, 12, 0, 'female'],
  ['纽约(冬令时)', -74.0, 'America/New_York', false, 2001, 1, 4, 12, 0, 'female'],
  ['伦敦(夏令时)', -0.1, 'Europe/London', false, 2001, 7, 4, 12, 0, 'male'],
  ['洛杉矶(冬令时)', -118.2, 'America/Los_Angeles', false, 2001, 1, 4, 1, 30, 'male'],
  ['中国夏令时-1989', 116.4, 'Asia/Shanghai', false, 1989, 7, 1, 12, 0, 'female'],
  ['中国夏令时-1986', 116.4, 'Asia/Shanghai', false, 1986, 5, 4, 12, 0, 'male'],
  ['中国夏令时-1991', 116.4, 'Asia/Shanghai', false, 1991, 9, 15, 12, 0, 'female'],
]
cityCases.forEach(([tag, lon, iana, trueSolar, y, m, d, h, mi, g]) => {
  add(`城市-${tag}`, base({ longitude: lon, ianaTimezone: iana, useTrueSolarTime: trueSolar, year: y, month: m, day: d, hour: h, minute: mi, gender: g as 'male' | 'female' }))
})

/* ── F. 时辰未知（hour=null） ── */
add('时辰未知-1990-03-15', base({ year: 1990, month: 3, day: 15, hour: null, minute: 0, gender: 'male' }))
add('时辰未知-2024-06-01', base({ year: 2024, month: 6, day: 1, hour: null, minute: 0, gender: 'female' }))

/* ── G. 输入模式补盲：数值时区 / 真太阳时无经度 / 农历+真太阳时 / 2100 边界 ── */
add('时区-数值-9', { calendar: 'solar', year: 2000, month: 6, day: 1, hour: 8, minute: 30, gender: 'male', timezone: 9, longitude: 139.7, useTrueSolarTime: true, dayRollover: 'zichu' })
add('时区-数值--5', { calendar: 'solar', year: 2000, month: 6, day: 1, hour: 8, minute: 30, gender: 'female', timezone: -5, longitude: -74.0, useTrueSolarTime: false, dayRollover: 'zichu' })
add('时区-数值--12', { calendar: 'solar', year: 1985, month: 1, day: 1, hour: 23, minute: 0, gender: 'male', timezone: -12, useTrueSolarTime: false, dayRollover: 'midnight' })
add('时区-数值-14', { calendar: 'solar', year: 2015, month: 7, day: 7, hour: 0, minute: 1, gender: 'female', timezone: 14, useTrueSolarTime: false, dayRollover: 'zichu' })
add('真太阳时-无经度', { calendar: 'solar', year: 1999, month: 9, day: 9, hour: 9, minute: 9, gender: 'male', useTrueSolarTime: true, dayRollover: 'zichu' })
add('农历+真太阳时', { calendar: 'lunar', year: 1976, month: 8, day: 15, isLeapMonth: true, hour: 6, minute: 30, gender: 'female', longitude: 87.6, useTrueSolarTime: true, dayRollover: 'zichu', ianaTimezone: 'Asia/Urumqi' })
add('2100边界-公历', { calendar: 'solar', year: 2100, month: 3, day: 1, hour: 0, minute: 0, gender: 'male', useTrueSolarTime: false, dayRollover: 'zichu', ianaTimezone: 'Asia/Shanghai' })
add('2099-除夕', { calendar: 'solar', year: 2099, month: 12, day: 31, hour: 23, minute: 59, gender: 'female', useTrueSolarTime: false, dayRollover: 'zichu', ianaTimezone: 'Asia/Shanghai' })
add('2100边界-农历', { calendar: 'lunar', year: 2100, month: 1, day: 1, hour: 12, minute: 0, gender: 'male', useTrueSolarTime: false, dayRollover: 'zichu', ianaTimezone: 'Asia/Shanghai' })

/* ── 落盘 ── */
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(INPUTS_PATH, JSON.stringify(vectors.map((v) => ({ id: v.id, tag: v.tag, input: v.input })), null, 2), 'utf-8')

const golden = vectors.map((v) => {
  try {
    const chart = computeChartV2(v.input)
    return { id: v.id, tag: v.tag, chart }
  } catch (e) {
    return { id: v.id, tag: v.tag, error: String(e) }
  }
})
fs.writeFileSync(GOLDEN_PATH, JSON.stringify(golden, null, 2), 'utf-8')
console.log(`生成 ${vectors.length} 组输入 + ${golden.length} 组金标 → ${OUT_DIR}`)
console.log(`金标异常组：${golden.filter((g) => g.error).map((g) => g.id).join(',') || '无'}`)
