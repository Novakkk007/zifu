/**
 * 紫微十四主星 · 先生类比（紫府语言重述）。
 * 素材来源：mingli-master（MIT，learnwithu）星曜参照 + 传统紫微通识；
 * 紫府语言重述：只作文化象征类比，不作行为断言。
 */
export const STAR_ANALOGY: Record<string, string> = {
  紫微: '帝星——走到哪里都自带主心骨，担得起事，也背得起名分',
  天机: '军师星——脑子快，点子多，总在琢磨下一步',
  太阳: '烈日——光明磊落，肯照亮别人，也要学会歇一歇',
  武曲: '将星——刚直务实，认准了的事九头牛拉不回',
  天同: '福星——性子宽和，能化烦为闲，最会过日子',
  廉贞: '判官星——眼里揉不得沙子，爱憎都写在脸上',
  天府: '府库星——稳重能守，是家里家外最靠得住的那个',
  太阴: '月亮——细腻温润，心里有本别人看不见的账',
  贪狼: '桃花星——多才多艺，什么都有兴趣，样样都想试试',
  巨门: '口舌星——心里话藏不住，说破才有意思',
  天相: '印星——端方持重，帮人办事最让人放心',
  天梁: '寿星——老成持重，天生愿意帮人收拾摊子',
  七杀: '破军星——敢打敢拼，越是难局越来劲',
  破军: '先锋星——敢为天下先，破旧立新的一把好手',
}

/** 命宫主星 → 先生类比一句话（无主星时返回 null） */
export function mingPalaceAnalogy(majorStars: string[]): string | null {
  if (majorStars.length === 0) return null
  const names = majorStars.map((s) => STAR_ANALOGY[s] ?? null).filter(Boolean)
  if (names.length === 0) return null
  return `命宫主星气质：${names.join('；')}。`
}
