import { describe, expect, it } from 'vitest'
import {
  TIAOHOU_MONTH_BRANCHES,
  TIAOHOU_STEMS,
  TIAOHOU_TABLE,
  tiaohouOf,
} from '../contracts/engines/masters-rules/tiaohou'

describe('穷通宝鉴调候表', () => {
  it.each([
    ['甲', '子', '火', '丙火'],
    ['乙', '午', '水', '癸水'],
    ['丙', '亥', '木', '甲木'],
    ['丁', '巳', '金', '庚金'],
    ['戊', '未', '水', '壬水'],
    ['庚', '丑', '火', '丁火'],
    ['壬', '子', '土', '戊土'],
    ['癸', '午', '金', '庚金'],
  ])('%s日主生于%s月 → %s（%s）', (stem, branch, need, namedGod) => {
    const result = tiaohouOf(stem, branch)
    expect(result?.need).toBe(need)
    expect(result?.reason).toContain(namedGod)
  })

  it('十天干与十二月令全覆盖，且每格均有五行和理由', () => {
    expect(Object.keys(TIAOHOU_TABLE)).toEqual([...TIAOHOU_STEMS])
    for (const stem of TIAOHOU_STEMS) {
      expect(Object.keys(TIAOHOU_TABLE[stem])).toHaveLength(12)
      expect(Object.keys(TIAOHOU_TABLE[stem]).sort()).toEqual([...TIAOHOU_MONTH_BRANCHES].sort())
      for (const branch of TIAOHOU_MONTH_BRANCHES) {
        expect(TIAOHOU_TABLE[stem][branch].need).toMatch(/^[金木水火土]$/)
        expect(TIAOHOU_TABLE[stem][branch].reason.length).toBeGreaterThan(10)
      }
    }
  })

  it.each([
    ['', '子'],
    ['A', '子'],
    ['甲', ''],
    ['甲', '鼠'],
  ])('无效输入 %j/%j 返回 null', (stem, branch) => {
    expect(tiaohouOf(stem, branch)).toBeNull()
  })
})
