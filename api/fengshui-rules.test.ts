import { describe, expect, it } from 'vitest'
import {
  evaluateYangzhai,
  YANGZHAI_RULES,
  YANGZHAI_RULESET_VERSION,
  YANGZHAI_RULE_SOURCE,
  type YangzhaiInput,
} from '../contracts/engines/fengshui-rules'

function hasRule(input: YangzhaiInput, ruleId: string): boolean {
  return evaluateYangzhai(input).some((hint) => hint.ruleId === ruleId)
}

describe('evaluateYangzhai（阳宅环境检查提示）', () => {
  const cases: Array<{
    ruleId: string
    trigger: YangzhaiInput
    nonTrigger: YangzhaiInput
  }> = [
    { ruleId: 'YZ-01', trigger: { areaRatio: '大' }, nonTrigger: { areaRatio: '中' } },
    {
      ruleId: 'YZ-02',
      trigger: { areaRatio: '小', doorSize: '大' },
      nonTrigger: { areaRatio: '大', doorSize: '大' },
    },
    {
      ruleId: 'YZ-03',
      trigger: { maintenanceIssues: ['屋面渗漏'] },
      nonTrigger: { maintenanceIssues: [] },
    },
    { ruleId: 'YZ-04', trigger: { kitchenAdjacent: true }, nonTrigger: { kitchenAdjacent: false } },
    {
      ruleId: 'YZ-05',
      trigger: { doorDirectToPrivate: true },
      nonTrigger: { doorDirectToPrivate: false },
    },
    { ruleId: 'YZ-06', trigger: { kitchenOnRoute: true }, nonTrigger: { kitchenOnRoute: false } },
    {
      ruleId: 'YZ-07',
      trigger: { hasTrueNorth: false, hasMeasure: true },
      nonTrigger: { hasTrueNorth: true, hasMeasure: true },
    },
    {
      ruleId: 'YZ-08',
      trigger: { ageGenderRequested: true },
      nonTrigger: { ageGenderRequested: false },
    },
    {
      ruleId: 'YZ-09',
      trigger: { ageGenderRequested: true, hasTrueNorth: true, hasMeasure: true },
      nonTrigger: { ageGenderRequested: true },
    },
  ]

  for (const { ruleId, trigger, nonTrigger } of cases) {
    it(`${ruleId}：条件命中时触发，条件不命中时不触发`, () => {
      expect(hasRule(trigger, ruleId)).toBe(true)
      expect(hasRule(nonTrigger, ruleId)).toBe(false)
    })
  }

  it('未提供条件时不生成提示，且空白维护项不算问题', () => {
    expect(evaluateYangzhai({})).toEqual([])
    expect(hasRule({ maintenanceIssues: ['  '] }, 'YZ-03')).toBe(false)
  })

  it('规则公开、顺序稳定并带版本与来源', () => {
    expect(YANGZHAI_RULES.map((rule) => rule.id)).toEqual([
      'YZ-01',
      'YZ-02',
      'YZ-03',
      'YZ-04',
      'YZ-05',
      'YZ-06',
      'YZ-07',
      'YZ-08',
      'YZ-09',
    ])
    expect(YANGZHAI_RULESET_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(YANGZHAI_RULE_SOURCE.sourceSection).toContain('yangzhai-classics.md')

    const hints = evaluateYangzhai({
      areaRatio: '小',
      doorSize: '大',
      doorDirectToPrivate: true,
    })
    expect(hints.every((hint) => hint.rulesetVersion === YANGZHAI_RULESET_VERSION)).toBe(true)
    expect(hints.every((hint) => hint.source === YANGZHAI_RULE_SOURCE)).toBe(true)
  })

  it('所有规则提示包含现代工程检查视角，且不含吉凶断言', () => {
    for (const rule of YANGZHAI_RULES) {
      const text = rule.evaluate(
        rule.id === 'YZ-09'
          ? { ageGenderRequested: true, hasMeasure: true }
          : cases.find((item) => item.ruleId === rule.id)?.trigger ?? {},
      )
      expect(text, rule.id).not.toBeNull()
      expect(text, rule.id).toMatch(/检查|复核|检测|测量|评估/)
      expect(text, rule.id).not.toMatch(/吉宅|凶宅|大吉|大凶|必然|注定|一定发生|致贫|致富/)
    }
  })
})
