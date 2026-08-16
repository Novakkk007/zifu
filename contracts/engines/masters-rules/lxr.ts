/**
 * LXR 系列规则（梁湘润子平体系蒸馏）
 * 来源：docs/masters/liangXiangrun.md
 *
 * 核心思想：「三轨」——调候、格局、扶抑三个传统观察维度，
 * 同向则提权重，冲突则保留多候选降置信度。
 */
import type { BaziChartV2 } from '../../bazi-core'

export interface LxrRule {
  id: string
  master: string
  source: string
  evaluate(chart: BaziChartV2): { title: string; text: string } | null
}

const MASTER = '梁湘润体系'
const SRC_BOOKS = 'https://books.google.com/books?id=Dc4rQwAACAAJ'
const SRC_CHINYUAN = 'https://www.chinyuan.com.tw/all_book/more?id=9322'

/** 月支季节 → 传统调候方向（冬取火暖、夏取水润，春秋不强制） */
const SEASON_TIAOHOU: Record<string, { season: string; wuxing: string; name: string } | null> = {
  寅: { season: '春', wuxing: '木', name: '木旺' },
  卯: { season: '春', wuxing: '木', name: '木旺' },
  辰: { season: '春', wuxing: '木', name: '木旺' },
  巳: { season: '夏', wuxing: '水', name: '夏火旺需润' },
  午: { season: '夏', wuxing: '水', name: '夏火旺需润' },
  未: { season: '夏', wuxing: '水', name: '夏火旺需润' },
  申: { season: '秋', wuxing: '金', name: '金旺' },
  酉: { season: '秋', wuxing: '金', name: '金旺' },
  戌: { season: '秋', wuxing: '金', name: '金旺' },
  亥: { season: '冬', wuxing: '火', name: '冬水寒需暖' },
  子: { season: '冬', wuxing: '火', name: '冬水寒需暖' },
  丑: { season: '冬', wuxing: '火', name: '冬水寒需暖' },
}

/** 五行生克（用于冲突判定：调候五行与扶抑用神的关系） */
const WUXING_SHENG: Record<string, string> = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' }
const WUXING_KE: Record<string, string> = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' }

export const LXR_RULES: LxrRule[] = [
  {
    id: 'LXR-01',
    master: MASTER,
    source: SRC_BOOKS,
    evaluate(c) {
      const monthBranch = c.pillars.month?.branch
      if (!monthBranch) return null
      const th = SEASON_TIAOHOU[monthBranch]
      if (!th || (th.season !== '夏' && th.season !== '冬')) return null
      const ys = c.yongshen.yongshen
      if (ys === th.wuxing || WUXING_SHENG[th.wuxing] === ys) {
        return {
          title: '三轨同向：调候与扶抑一致',
          text: `月支${monthBranch}属${th.season}（${th.name}），传统调候取${th.wuxing}；扶抑法用神为${ys}，两轨方向一致。传统上同向证据可提高该平衡方向的参详权重——仍属文化参详，不代表现实事件必然发生。`,
        }
      }
      return null
    },
  },
  {
    id: 'LXR-02',
    master: MASTER,
    source: SRC_CHINYUAN,
    evaluate(c) {
      const monthBranch = c.pillars.month?.branch
      if (!monthBranch) return null
      const th = SEASON_TIAOHOU[monthBranch]
      if (!th || (th.season !== '夏' && th.season !== '冬')) return null
      const ys = c.yongshen.yongshen
      const conflict = ys === WUXING_KE[th.wuxing] || th.wuxing === WUXING_KE[ys]
      if (conflict) {
        return {
          title: '三轨冲突：调候与扶抑相悖',
          text: `月支${monthBranch}属${th.season}，传统调候方向取${th.wuxing}，而扶抑法用神为${ys}，两轨方向相反。传统上遇此情形应保留多个候选并降低唯一用神的置信度，不宜合并为单一定论。`,
        }
      }
      return null
    },
  },
  {
    id: 'LXR-04',
    master: MASTER,
    source: SRC_BOOKS,
    evaluate(c) {
      const g = c.wuxing.strength.grade
      if (g === '偏强' || g === '偏弱') {
        return {
          title: '旺衰层限定说明',
          text: `本盘旺衰量化等级「${g}」（总分 ${c.wuxing.strength.total}/100）。此结论只用于扶抑层面的参考，不能覆盖调候或格局层面的判断——不同观察维度结论不同时，以并列呈现为准。`,
        }
      }
      return null
    },
  },
]
