import { describe, expect, it } from "vitest"
import { getEngineLinks, getBooksForTerm, ENGINE_GLOSSARY_MAP } from "@contracts/glossary-bridge"
import BOOKS from "@/data/books.json"

/** 从真实 books.json 提取所有有效 ID */
const realBookIds = new Set(BOOKS.map((b: { id: string }) => b.id))

describe("glossary-bridge bridge", () => {
  it("all 8 engines mapped", () => {
    expect(Object.keys(ENGINE_GLOSSARY_MAP)).toHaveLength(8)
  })

  it("bazi has 6 link groups", () => {
    expect(getEngineLinks("bazi")).toHaveLength(6)
  })

  it("unknown engine returns []", () => {
    expect(getEngineLinks("nonexistent")).toEqual([])
  })

  it("book IDs match real books.json", () => {
    for (const links of Object.values(ENGINE_GLOSSARY_MAP)) {
      for (const link of links) {
        for (const bid of link.books) {
          expect(realBookIds, `unknown ID "${bid}"`).toContain(bid)
        }
      }
    }
  })

  it("getBooksForTerm works for 正官", () => {
    const books = getBooksForTerm("正官")
    expect(books.length).toBeGreaterThan(0)
    expect(books).toContain("ziping")
  })
})
