/**
 * LJM 系列（李居明通俗化体系蒸馏）
 * 来源：docs/masters/lijuMing.md
 *
 * 核心：「十神 → 生活角色主题」映射——先计算十神关系（引擎已产出），
 * 再把术语转成中性的生活主题描述，降低解读门槛。
 * 角色标签是文化解释，不是现实身份识别。
 */
import type { BaziChartV2 } from '../../bazi-core'

const MASTER = '李居明体系'
const SRC = 'https://www.likuiming.com/about/course'

/** 十神 → 中性角色主题（仅文化参详用，不映射现实身份） */
export const TEN_GOD_THEMES: Record<string, { theme: string; note: string }> = {
  比肩: { theme: '同类与并行', note: '传统以比肩象同类、伙伴与自我边界，不指向具体人物。' },
  劫财: { theme: '竞争与协作', note: '传统以劫财象竞争与利益权衡，不作现实人际关系断言。' },
  食神: { theme: '表达与滋养', note: '传统以食神象才艺表达与生活情趣，属温和输出。' },
  伤官: { theme: '突破与锋芒', note: '传统以伤官象锋芒毕露与破格创新，需结合旺衰再看。' },
  正财: { theme: '务实与积累', note: '传统以正财象稳定资源与务实经营，不指向具体收入。' },
  偏财: { theme: '机遇与流通', note: '传统以偏财象流动机会与灵活经营，不作投资建议。' },
  正官: { theme: '规则与担当', note: '传统以正官象规则、职守与自我约束。' },
  七杀: { theme: '压力与魄力', note: '传统以七杀象压力环境与决断魄力，需看制化。' },
  正印: { theme: '学习与庇护', note: '传统以正印象学识、名分与长辈式的支持。' },
  偏印: { theme: '思辨与独学', note: '传统以偏印象独特思维与冷门学问。' },
}

export interface LjmThemeHint {
  tenGod: string
  theme: string
  note: string
  /** 该十神在命盘中的出现次数（天干+藏干，来自 tenGods） */
  count: number
}

/** 命盘十神 → 主题化提示（出现次数多的优先，前 5 条） */
export function tenGodThemes(chart: BaziChartV2, max = 5): LjmThemeHint[] {
  const counts = new Map<string, number>()
  for (const t of chart.tenGods) {
    counts.set(t.tenGod, (counts.get(t.tenGod) ?? 0) + 1)
  }
  const entries: LjmThemeHint[] = []
  for (const [name, theme] of Object.entries(TEN_GOD_THEMES)) {
    const count = counts.get(name) ?? 0
    if (count > 0) {
      entries.push({ tenGod: name, theme: theme.theme, note: theme.note, count })
    }
  }
  entries.sort((a, b) => b.count - a.count)
  return entries.slice(0, max)
}

/** AI 参详上下文片段（LJM 风格主题化描述，喂给解读模型的补充语料） */
export function ljmContextText(chart: BaziChartV2): string {
  const themes = tenGodThemes(chart, 4)
  if (themes.length === 0) return ''
  const lines = themes.map(
    (t) => `${t.tenGod}（出现${t.count}次）→ 生活主题「${t.theme}」`,
  )
  return `十神主题（通俗化参详参考）：${lines.join('；')}。说明：${MASTER}，${SRC}。以上为文化解释层的角色主题，不映射现实身份。`
}

export const LJM_META = { master: MASTER, source: SRC }
