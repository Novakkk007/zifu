/**
 * 神煞注册表 v5 夹具测试：40 煞各一个 describe，
 * 逐条执行注册表内 testFixtures，断言命中柱位（list-all）。
 */
import { describe, expect, it } from 'vitest'
import {
  BRANCHES,
  RULESET_VERSION,
  SHENSHA_REGISTRY,
  SHENSHA_RULESET_VERSION,
  STEMS,
  findJiazi,
} from '@contracts/bazi-core'
import type { ShenshaContext, ShenshaFixtureInput } from '@contracts/bazi-core'

const LABELS = ['年柱', '月柱', '日柱', '时柱'] as const

/** 由夹具四柱干支构造 ShenshaContext（时柱 null 表示时辰未知） */
function ctxFromFixture(input: ShenshaFixtureInput): ShenshaContext {
  const pillars = input.pillars.map((gz, i) => {
    if (gz === null) return null
    const stemIdx = STEMS.indexOf(gz[0] as (typeof STEMS)[number])
    const branchIdx = BRANCHES.indexOf(gz[1] as (typeof BRANCHES)[number])
    expect(stemIdx, `非法天干：${gz}`).toBeGreaterThanOrEqual(0)
    expect(branchIdx, `非法地支：${gz}`).toBeGreaterThanOrEqual(0)
    // 合法甲子组合须同奇偶
    expect(stemIdx % 2, `非法甲子组合：${gz}`).toBe(branchIdx % 2)
    return { label: LABELS[i], stemIdx, branchIdx }
  })
  const day = pillars[2]!
  const present = pillars.filter((p): p is NonNullable<typeof p> => p !== null)
  return {
    gender: input.gender ?? 'male',
    dayStemIdx: day.stemIdx,
    dayBranchIdx: day.branchIdx,
    yearBranchIdx: pillars[0]!.branchIdx,
    monthBranchIdx: pillars[1]!.branchIdx,
    dayJiaziIdx: findJiazi(day.stemIdx, day.branchIdx),
    pillars: present,
  }
}

describe('神煞注册表元数据', () => {
  it('注册表恰好 59 条（v1.5.0 新增 19 稀缺神煞），ruleId 唯一且格式规范', () => {
    expect(SHENSHA_REGISTRY).toHaveLength(59)
    const ids = SHENSHA_REGISTRY.map((d) => d.ruleId)
    expect(new Set(ids).size).toBe(59)
    for (const id of ids) expect(id).toMatch(/^shensha\.[a-z]+\.v1$/)
  })

  it('每条条目字段完整：变体/起例/柱位类型/版本/口诀/出处/现代化说明/夹具', () => {
    for (const def of SHENSHA_REGISTRY) {
      expect(def.variant.length, def.name).toBeGreaterThan(0)
      expect(def.basis.length, def.name).toBeGreaterThan(0)
      expect(def.verse.length, def.name).toBeGreaterThan(0)
      expect(def.source.length, def.name).toBeGreaterThan(0)
      expect(def.modernExplanation.length, def.name).toBeGreaterThan(0)
      expect(def.multipleHitPolicy).toBe('list-all')
      expect(['1.4.0', '1.5.0']).toContain(def.rulesetVersion)
      expect(def.testFixtures.length, `${def.name} 至少 1 个夹具`).toBeGreaterThanOrEqual(1)
    }
  })

  it('条目 rulesetVersion 与库 RULESET_VERSION 同步（1.4.0）', () => {
    expect(SHENSHA_RULESET_VERSION).toBe(RULESET_VERSION)
    expect(RULESET_VERSION).toBe('1.5.0')
  })
})

for (const def of SHENSHA_REGISTRY) {
  describe(`神煞夹具：${def.name}（${def.ruleId}）`, () => {
    it('起例依据与命中柱位类型标注有效', () => {
      expect([
        'yearStem',
        'dayStem',
        'yearBranch',
        'dayBranch',
        'monthBranch',
        'dayJiazi',
        'pillarStems',
      ]).toContain(def.inputBasis)
      expect([
        'anyBranch',
        'anyStem',
        'anyStemOrBranch',
        'nonDayBranch',
        'dayPillar',
        'hourBranch',
      ]).toContain(def.targetPosition)
    })
    def.testFixtures.forEach((fx, i) => {
      it(`夹具 #${i + 1}：${fx.input.pillars.join(' / ')} → [${fx.expectHits.join(', ')}]`, () => {
        const ctx = ctxFromFixture(fx.input)
        const hits = def.find(ctx)
        expect(hits.map((h) => h.position)).toEqual(fx.expectHits)
        // 命中字与柱位干支一致
        for (const h of hits) {
          const pillarIdx = LABELS.findIndex((l) => l.startsWith(h.position[0]))
          const gz = fx.input.pillars[pillarIdx]!
          const expectedChar = h.position === '日柱' ? gz : h.position.endsWith('干') ? gz[0] : gz[1]
          expect(h.char).toBe(expectedChar)
        }
      })
    })
  })
}
