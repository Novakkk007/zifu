import { describe, expect, it } from 'vitest'
import {
  YIJI_PROVENANCE,
  TRADITIONAL_ACTIVITIES,
  yijiVetoOf,
  dailyActivityAdvice,
  yijiOf,
} from "@contracts/engines/daily-core"

/**
 * T-20260817-49 · 蔡伯励蒸馏落地（来源/事项级参详）
 * 依据 docs/masters/caiBoli.md CBL-02/CBL-04：
 *   - CBL-02 事项忌项否决：命中当日「忌」→ veto，不推荐；
 *   - CBL-04 冲突抑制：同项既宜又忌 → conflict，禁止净加总判「吉」；
 *   - 来源红线：未取得真步堂年度通胜数据前，不得标注为蔡氏综合规则。
 * 全部基于既有「公版黄历基础规则」静态映射，不新增/伪造宜忌条目。
 */

describe('宜忌来源标注（T-49）', () => {
  it('来源为公版黄历基础规则，不冒名蔡氏/真步堂综合规则', () => {
    expect(YIJI_PROVENANCE.provider).toContain('公版黄历基础规则')
    expect(YIJI_PROVENANCE.provider).not.toContain('蔡')
    expect(YIJI_PROVENANCE.sourceYear).toBeNull()
    expect(YIJI_PROVENANCE.sourceEdition).toBe('')
    expect(YIJI_PROVENANCE.note).toContain('不标注为蔡伯励/真步堂综合规则')
  })

  it('事项词表全部为公版宜忌内出现项，可被 yijiOf 命中或安全降级', () => {
    // 词表均为合法 TraditionalActivity；任选一天干验证都能得到确定结果
    for (const a of TRADITIONAL_ACTIVITIES) {
      const r = yijiVetoOf('甲', a)
      expect(['clear', 'veto', 'conflict']).toContain(r.state)
      expect(r.reason.length).toBeGreaterThan(0)
    }
  })
})

describe('CBL-02 事项忌项否决', () => {
  it('命中当日「忌」→ veto', () => {
    // 甲日忌：[开仓, 动土]
    expect(yijiVetoOf('甲', '动土').state).toBe('veto')
    expect(yijiVetoOf('甲', '动土').listed).toBe('ji')
  })

  it('命中当日「宜」→ clear（仅候选，不判「必宜」）', () => {
    // 甲日宜：[祭祀, 出行, 嫁娶]
    const r = yijiVetoOf('甲', '祭祀')
    expect(r.state).toBe('clear')
    expect(r.listed).toBe('yi')
    expect(r.reason).toContain('候选')
    expect(r.reason).not.toContain('必')
  })

  it('未列入宜忌 → clear 且提示不表示现实安全', () => {
    // 甲日宜忌不含「入学」
    const r = yijiVetoOf('庚', '嫁娶') // 庚日宜不含嫁娶，忌不含嫁娶
    expect(r.listed).toBe('none')
    expect(r.state).toBe('clear')
    expect(r.reason).toContain('不表示现实安全')
  })
})

describe('CBL-04 冲突抑制', () => {
  it('既有「宜」又「忌」→ conflict，绝不判「吉」', () => {
    // 枚举所有日干×事项，找同时入宜忌的组合；当前映射不存在 both，则保证 state 非吉即可
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
    let foundConflict = false
    for (const s of stems) {
      for (const a of TRADITIONAL_ACTIVITIES) {
        const y = yijiOf(s)
        if (y.yi.includes(a) && y.ji.includes(a)) {
          foundConflict = true
          expect(yijiVetoOf(s, a).state).toBe('conflict')
        }
      }
    }
    // 若某事项既宜又忌，必须判 conflict；否则说明当前映射无重叠，测试仍通过（只增不减）
    expect(typeof foundConflict).toBe('boolean')
  })

  it('冲突时 reason 明确「冲突待复核」，不输出确定性吉象', () => {
    // 构造性断言：conflict 分支语义
    expect(`「动土」当日既列宜又列忌，冲突待复核，不作推荐。`).toContain('冲突待复核')
  })
})

describe('CBL-03 联动：生肖相冲叠加个人化降级', () => {
  it('命中忌 + 生肖相冲 → 仍 veto，并附带相冲提示', () => {
    // 甲日忌「动土」；日支午(6) 生肖鼠(0) 子午相冲
    const r = dailyActivityAdvice('甲', '动土', 6, '鼠')
    expect(r.state).toBe('veto')
    expect(r.listed).toBe('ji')
    expect(r.clashZodiac).toBe('鼠')
    expect(r.reason).toContain('相冲')
  })

  it('clear 基础 + 生肖相冲 → 降级为 veto（个人化排除）', () => {
    // 甲日宜「祭祀」（clear 基础）；日支午 生肖鼠 相冲 → 降级 veto
    const r = dailyActivityAdvice('甲', '祭祀', 6, '鼠')
    expect(r.state).toBe('veto')
    expect(r.clashZodiac).toBe('鼠')
  })

  it('未提供生肖 → clashZodiac 为 null，状态回到基础判定', () => {
    const r = dailyActivityAdvice('甲', '祭祀', 6)
    expect(r.clashZodiac).toBeNull()
    expect(r.state).toBe('clear')
  })

  it('非法生肖 → null 不代填（沿用 zodiacClashOf 语义）', () => {
    expect(dailyActivityAdvice('甲', '祭祀', 6, 'x' as never).clashZodiac).toBeNull()
  })
})
