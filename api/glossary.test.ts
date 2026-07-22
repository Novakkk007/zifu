import { describe, expect, it } from "vitest"
import {
  lookupGlossary, getRelatedBooks,
  STEM_GLOSSARY, BRANCH_GLOSSARY, SHEN_GLOSSARY, EXTRA_GLOSSARY, ALL_GLOSSARY,
} from "@contracts/glossary"

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

  it("十二地支全部有释义", () => {
    const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
    for (const b of branches) {
      const entry = BRANCH_GLOSSARY[b]
      expect(entry, `缺失地支 ${b} 的释义`).toBeDefined()
      expect(entry.short.length).toBeGreaterThan(0)
      expect(entry.detail.length).toBeGreaterThan(80)
      expect(entry.related.length).toBeGreaterThan(2)
      expect(entry.source?.book, `${b} 缺失典籍出处`).toBeDefined()
    }
    expect(Object.keys(BRANCH_GLOSSARY)).toHaveLength(12)
  })

  it("常见神煞/格局术语有释义", () => {
    const terms = ["正官", "七杀", "正印", "食神", "伤官", "正财", "偏财", "比肩", "劫财"]
    for (const t of terms) {
      const entry = SHEN_GLOSSARY[t]
      expect(entry, `缺失术语 ${t} 的释义`).toBeDefined()
      expect(entry.short.length).toBeGreaterThan(0)
    }
  })

  it("补充术语（日主/格局/大运/流年/纳音/身强身弱）有释义", () => {
    const terms = ["日主", "身强身弱", "格局", "大运", "流年", "纳音"]
    for (const t of terms) {
      const entry = EXTRA_GLOSSARY[t]
      expect(entry, `缺失补充术语 ${t} 的释义`).toBeDefined()
      expect(entry.short.length).toBeGreaterThan(0)
    }
    expect(Object.keys(EXTRA_GLOSSARY)).toHaveLength(6)
  })

  it("ALL_GLOSSARY 合并了所有四组词典", () => {
    const total =
      Object.keys(STEM_GLOSSARY).length +
      Object.keys(BRANCH_GLOSSARY).length +
      Object.keys(SHEN_GLOSSARY).length +
      Object.keys(EXTRA_GLOSSARY).length
    // 10 天干 + 12 地支 + 9 神煞 + 6 补充 = 37
    expect(Object.keys(ALL_GLOSSARY)).toHaveLength(total)
  })

  it("所有条目不出现绝对断语", () => {
    const forbidden = ["命中注定", "必有大灾", "必定", "必然会", "一定会死"]
    for (const [, entry] of Object.entries(ALL_GLOSSARY)) {
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
    for (const [, entry] of Object.entries(ALL_GLOSSARY)) {
      if (entry.source) {
        expect(validBooks, `${entry.term} 引典 "${entry.source.book}" 不在公版书单中`)
          .toContain(entry.source.book)
      }
    }
  })

  it("lookupGlossary 按 ALL_GLOSSARY 查找", () => {
    expect(lookupGlossary("甲")?.short).toContain("参天大树")
    expect(lookupGlossary("子")?.short).toContain("午夜")
    expect(lookupGlossary("正官")?.short).toContain("规则")
    expect(lookupGlossary("日主")?.short).toContain("命主")
    expect(lookupGlossary("纳音")?.short).toContain("六十甲子")
    expect(lookupGlossary("不存在")).toBeUndefined()
  })

  it("getRelatedBooks 返回关联典籍列表", () => {
    const books = getRelatedBooks("正官")
    expect(books.length).toBeGreaterThan(0)
    expect(books).toContain("子平真诠")
  })
})
