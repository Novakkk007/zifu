import { describe, expect, it } from "vitest"
import { lookupGlossary, getRelatedBooks, STEM_GLOSSARY, SHEN_GLOSSARY } from "@contracts/glossary"

describe("glossary 术语辞典", () => {
  it("十天干全部有释义", () => {
    const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
    for (const s of stems) {
      const entry = STEM_GLOSSARY[s]
      expect(entry, `缺失天干 ${s} 的释义`).toBeDefined()
      expect(entry.short.length).toBeGreaterThan(0)
      expect(entry.detail.length).toBeGreaterThan(50)
      expect(entry.related.length).toBeGreaterThan(0)
    }
    expect(Object.keys(STEM_GLOSSARY)).toHaveLength(10)
  })

  it("常见神煞/格局术语有释义", () => {
    const terms = ["正官", "七杀", "正印", "食神", "伤官", "正财", "偏财", "比肩", "劫财"]
    for (const t of terms) {
      const entry = SHEN_GLOSSARY[t]
      expect(entry, `缺失术语 ${t} 的释义`).toBeDefined()
      expect(entry.short.length).toBeGreaterThan(0)
    }
  })

  it("每条约 ≤4 句不出现绝对断语", () => {
    const forbidden = ["命中注定", "必有大灾", "必定", "必然会", "一定会死"]
    for (const [, entry] of Object.entries({ ...STEM_GLOSSARY, ...SHEN_GLOSSARY })) {
      const text = entry.short + entry.detail
      for (const word of forbidden) {
        expect(text, `${entry.term} 出现绝对断语 "${word}"`).not.toContain(word)
      }
    }
  })

  it("所有引典出处都是公版书名", () => {
    const validBooks = [
      "滴天髓", "子平真诠", "三命通会", "渊海子平",
      "穷通宝鉴", "周易", "增删卜易", "卜筮正宗",
      "果老星宗", "紫微斗数全书", "六壬大全", "烟波钓叟歌",
    ]
    for (const [, entry] of Object.entries({ ...STEM_GLOSSARY, ...SHEN_GLOSSARY })) {
      if (entry.source) {
        expect(validBooks, `${entry.term} 引典 "${entry.source.book}" 不在公版书单中`)
          .toContain(entry.source.book)
      }
    }
  })

  it("lookupGlossary 可查到已有术语", () => {
    expect(lookupGlossary("甲")?.short).toContain("参天大树")
    expect(lookupGlossary("正官")?.short).toContain("规则")
    expect(lookupGlossary("不存在")).toBeUndefined()
  })

  it("getRelatedBooks 返回关联典籍列表", () => {
    const books = getRelatedBooks("正官")
    expect(books.length).toBeGreaterThan(0)
    expect(books).toContain("子平真诠")
  })
})
