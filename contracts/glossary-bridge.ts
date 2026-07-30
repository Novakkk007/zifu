/**
 * 引擎输出 → 术语 → 典籍 桥接表
 *
 * 每个引擎的输出字段映射到 glossary 术语和藏经阁典籍，
 * 用于：① 排盘结果页的「释义」Tab；② 术语→典籍跳转链接。
 *
 * 数据结构：
 * - engineField: 引擎输出中的字段路径 (如 "pillars[].stem"）
 * - glossaryTerms: 该字段对应的术语（用于 GlossaryTooltip）
 * - books: 讨论该字段的公版典籍（用于藏经阁互链）
 */

export interface EngineGlossaryLink {
  /** 引擎输出字段路径 */
  engineField: string
  /** 匹配的 glossary 术语 key */
  glossaryTerms: string[]
  /** 关联典籍 ID（books.json 中的 id） */
  books: string[]
}

/** 八字引擎 → 术语映射 */
export const BAZI_LINKS: EngineGlossaryLink[] = [
  {
    engineField: "pillars[].stem",
    glossaryTerms: ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
    books: ["ditiansui", "ziping", "qiongtong", "sanming", "yuanhai"],
  },
  {
    engineField: "pillars[].branch",
    glossaryTerms: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"],
    books: ["sanming", "ziping", "yuanhai"],
  },
  {
    engineField: "pillars[].shensha[]",
    glossaryTerms: [],
    books: ["sanming", "yuanhai"],
  },
  {
    engineField: "wuxingAnalysis",
    glossaryTerms: ["身强身弱", "格局", "日主", "纳音"],
    books: ["ditiansui", "ziping", "qiongtong"],
  },
  {
    engineField: "dayun[]",
    glossaryTerms: ["大运", "流年"],
    books: ["ziping", "sanming"],
  },
  {
    engineField: "pillarRelations",
    glossaryTerms: ["正官", "七杀", "正印", "食神", "伤官", "正财", "偏财", "比肩", "劫财"],
    books: ["ziping", "sanming", "yuanhai"],
  },
]

/** 六爻引擎 → 术语映射 */
export const LIUYAO_LINKS: EngineGlossaryLink[] = [
  {
    engineField: "hexagram",
    glossaryTerms: [],
    books: ["zhouyi", "zengshan", "bushi"],
  },
  {
    engineField: "yao[]",
    glossaryTerms: [],
    books: ["zhouyi", "zengshan"],
  },
]

/** 紫微引擎 → 术语映射 */
export const ZIWEI_LINKS: EngineGlossaryLink[] = [
  {
    engineField: "palaces[]",
    glossaryTerms: [],
    books: ["ziweiquanshu"],
  },
]

/** 七政引擎 → 术语映射 */
export const QIZHENG_LINKS: EngineGlossaryLink[] = [
  {
    engineField: "stars[]",
    glossaryTerms: [],
    books: ["guolaoxingzong"],
  },
]

/** 奇门引擎 → 术语映射 */
export const QIMEN_LINKS: EngineGlossaryLink[] = [
  {
    engineField: "plate",
    glossaryTerms: [],
    books: ["yanbodiaosouge"],
  },
]

/** 六壬引擎 → 术语映射 */
export const DALIUREN_LINKS: EngineGlossaryLink[] = [
  {
    engineField: "lessons",
    glossaryTerms: [],
    books: ["liurendaquan"],
  },
]

/** 合盘引擎 → 术语映射 */
export const HEPAN_LINKS: EngineGlossaryLink[] = [
  {
    engineField: "compatibility",
    glossaryTerms: ["日主", "格局"],
    books: ["ziping", "sanming"],
  },
]

/** 合参引擎 → 术语映射 */
export const HECAN_LINKS: EngineGlossaryLink[] = [
  {
    engineField: "analysis",
    glossaryTerms: ["日主", "格局", "正官", "正印"],
    books: ["ditiansui", "ziping", "sanming"],
  },
]

/** 所有引擎映射 */
export const ENGINE_GLOSSARY_MAP: Record<string, EngineGlossaryLink[]> = {
  bazi: BAZI_LINKS,
  liuyao: LIUYAO_LINKS,
  ziwei: ZIWEI_LINKS,
  qizheng: QIZHENG_LINKS,
  qimen: QIMEN_LINKS,
  daliuren: DALIUREN_LINKS,
  hepan: HEPAN_LINKS,
  hecan: HECAN_LINKS,
}

/** 根据引擎类型查映射 */
export function getEngineLinks(engineType: string): EngineGlossaryLink[] {
  return ENGINE_GLOSSARY_MAP[engineType] ?? []
}

/** 根据术语查该术语关联的所有典籍 ID */
export function getBooksForTerm(term: string): string[] {
  const books = new Set<string>()
  for (const links of Object.values(ENGINE_GLOSSARY_MAP)) {
    for (const link of links) {
      if (link.glossaryTerms.includes(term)) {
        for (const b of link.books) books.add(b)
      }
    }
  }
  return [...books]
}
