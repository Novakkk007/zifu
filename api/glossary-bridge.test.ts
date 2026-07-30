import { describe, expect, it } from "vitest"
import { getEngineLinks, getBooksForTerm, ENGINE_GLOSSARY_MAP } from "@contracts/glossary-bridge"

describe("glossary-bridge 引擎桥接", () => {
  it("八字引擎有 6 组映射", () => {
    expect(ENGINE_GLOSSARY_MAP.bazi).toHaveLength(6)
  })

  it("六爻引擎有 2 组映射", () => {
    expect(ENGINE_GLOSSARY_MAP.liuyao).toHaveLength(2)
  })

  it("所有 8 引擎都有映射", () => {
    expect(Object.keys(ENGINE_GLOSSARY_MAP)).toHaveLength(8)
  })

  it("getEngineLinks 返回正确映射", () => {
    const links = getEngineLinks("bazi")
    expect(links.length).toBe(6)
    expect(links[0].engineField).toContain("pillars")
  })

  it("不存在的引擎返回空数组", () => {
    expect(getEngineLinks("nonexistent")).toEqual([])
  })

  it("getBooksForTerm——「正官」关联典籍", () => {
    const books = getBooksForTerm("正官")
    expect(books.length).toBeGreaterThan(0)
    expect(books).toContain("ziping")
  })

  it("getBooksForTerm——「日主」关联多引擎的典籍", () => {
    const books = getBooksForTerm("日主")
    expect(books.length).toBeGreaterThan(1)
  })

  it("每个映射的 books 都是 books.json 中存在的 ID", () => {
    const valid = [
      "ditiansui", "ziping", "qiongtong", "sanming", "yuanhai",
      "zhouyi", "zengshan", "bushi",
      "ziweiquanshu", "guolaoxingzong", "yanbodiaosouge", "liurendaquan",
    ]
    for (const links of Object.values(ENGINE_GLOSSARY_MAP)) {
      for (const link of links) {
        for (const b of link.books) {
          expect(valid).toContain(b)
        }
      }
    }
  })
})
