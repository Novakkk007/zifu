/**
 * SWH 系列规则（邵伟华审订体系蒸馏）
 * 来源：docs/masters/shaoWeihua.md
 *
 * 阈值常量全部公开、可版本化。判定只基于 bazi-core 公开字段。
 */
import type { BaziChartV2 } from '../../bazi-core'

export interface SwhRule {
  id: string
  master: string
  source: string
  evaluate(chart: BaziChartV2): { title: string; text: string } | null
}

/** 公开阈值（版本化） */
export const SWH_THRESHOLDS = {
  /** 得令最低分（月令有力，deling 满分 40） */
  delingMin: 20,
  /** 得地+得势合计视为「有生助」的最低分（满分 60） */
  supportMin: 10,
  /** 失令后仍可能转中和的两处有力生助分 */
  reverseSupportMin: 24,
  /** 身强分界（与 bazi-core yongshen 的 42 分一致） */
  strongTotal: 42,
} as const

const MASTER = '邵伟华审订体系'
const SRC_65 = 'https://www.sizhuyucexue.com/thread-65-1-1.html'
const SRC_73 = 'https://www.sizhuyucexue.com/thread-73-1-1.html'
const SRC_74 = 'https://www.sizhuyucexue.com/thread-74-1-1.html'
const SRC_1336 = 'https://www.sizhuyucexue.com/thread-1336-1-1.html'

export const SWH_RULES: SwhRule[] = [
  {
    id: 'SWH-01',
    master: MASTER,
    source: SRC_65,
    evaluate(c) {
      const s = c.wuxing.strength
      if (s.deling >= SWH_THRESHOLDS.delingMin && s.dedi + s.deshi >= SWH_THRESHOLDS.supportMin) {
        return {
          title: '日主偏强倾向（月令优先审查）',
          text: `日主五行属${c.dayMasterWuxing}，月令得令（${s.deling}/40），兼有得地得势支持（${s.dedi + s.deshi}/60）。传统旺衰审查先看月令，此盘呈现偏强倾向；仍请继续核对克泄耗、合化与支持力量，此非最终强弱结论。`,
        }
      }
      return null
    },
  },
  {
    id: 'SWH-02',
    master: MASTER,
    source: SRC_65,
    evaluate(c) {
      const s = c.wuxing.strength
      if (s.deling < SWH_THRESHOLDS.delingMin && s.dedi + s.deshi >= SWH_THRESHOLDS.reverseSupportMin) {
        return {
          title: '失令但有反转可能',
          text: `日主失令（月令 ${s.deling}/40），但得地得势合计 ${s.dedi + s.deshi}/60 已构成多处有力生助。传统上「失令不即定弱」：若生助力量可抵月令之失，存在由弱转中和的可能，建议降低强弱结论置信度并做全局复核。`,
        }
      }
      return null
    },
  },
  {
    id: 'SWH-03',
    master: MASTER,
    source: SRC_74,
    evaluate(c) {
      const me = c.dayMasterWuxing
      // 官杀 = 克我者；用五行生克表
      const KE = { 木: '金', 火: '水', 土: '木', 金: '火', 水: '土' } as const
      const SHENG = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' } as const
      const keMe = KE[me]
      const shengMe = SHENG[me]
      const count = c.wuxing.count
      const strong = c.wuxing.strength.total >= SWH_THRESHOLDS.strongTotal
      if (!strong && count[keMe] >= 2.5 && count[keMe] >= count[me] * 1.2) {
        return {
          title: '身弱官杀偏多：印星优先',
          text: `日主属${me}而${keMe}（官杀）偏多（计 ${count[keMe]}），传统取用优先考察${shengMe}（印星）能否泄官杀生身；印不可用时再察比劫帮身，且两者都须检查受制与副作用。`,
        }
      }
      return null
    },
  },
  {
    id: 'SWH-04',
    master: MASTER,
    source: SRC_73,
    evaluate(c) {
      const me = c.dayMasterWuxing
      const SHENG = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' } as const
      const WOKE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' } as const
      const shengMe = SHENG[me]
      const woKe = WOKE[me]
      const count = c.wuxing.count
      const strong = c.wuxing.strength.total >= SWH_THRESHOLDS.strongTotal
      if (strong) return null
      if (count[woKe] >= 2.5 && count[woKe] >= count[shengMe] * 1.5) {
        return {
          title: '身弱财多：比劫优先',
          text: `日主属${me}而${woKe}（财星）偏多（计 ${count[woKe]}），身弱财多传统上反为累。平衡方向：先考察比劫（${me}）分财帮身，再考察印星（${shengMe}）。`,
        }
      }
      return null
    },
  },
  {
    id: 'SWH-05',
    master: MASTER,
    source: SRC_73,
    evaluate(c) {
      const me = c.dayMasterWuxing
      const SHENG = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' } as const
      const WOKE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' } as const
      const shengMe = SHENG[me]
      const woKe = WOKE[me]
      const count = c.wuxing.count
      const strong = c.wuxing.strength.total >= SWH_THRESHOLDS.strongTotal
      if (!strong) return null
      if (count[shengMe] >= 2.5 && count[shengMe] >= count[woKe] * 1.5) {
        return {
          title: '身强印多：财星制印',
          text: `日主属${me}而${shengMe}（印星）偏多（计 ${count[shengMe]}），身强印多宜抑耗。传统方向：优先考察${woKe}（财星）制印耗身，并复核官杀、食伤是否加重冲突。`,
        }
      }
      return null
    },
  },
  {
    id: 'SWH-07',
    master: MASTER,
    source: SRC_1336,
    evaluate(c) {
      if (c.shensha.length === 0) return null
      const names = c.shensha.slice(0, 3).map((s) => s.name).join('、')
      return {
        title: '神煞降权参详',
        text: `本盘命中神煞：${names}（共 ${c.shensha.length} 项）。传统运用以「原局优先、神煞佐证」为原则：神煞只作性格与行动主题的辅助参考，不与旺衰喜忌同向时权重降低，不据此作出具体事件判断。`,
      }
    },
  },
]
