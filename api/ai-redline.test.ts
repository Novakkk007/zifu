import { describe, expect, it } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const AI_FILES = ["api/services/ai.ts", "api/services/chart-summary.ts", "api/ai-router.ts"]
const EDU_IMPORTS = ["glossary", "glossary-bridge", "daily-core", "books", "GlossaryTooltip"]
const REDLINE = ["《滴天髓》", "《子平真诠》", "《三命通会》", "《渊海子平》", "参天大树", "藤萝花草"]

describe("AI 红线隔离", () => {
  it("AI 管道不 import 教育数据", () => {
    for (const f of AI_FILES) {
      const c = readFileSync(resolve(__dirname, "..", f), "utf-8")
      for (const m of EDU_IMPORTS) {
        expect(c, `${f} imports ${m}`).not.toContain(m)
      }
    }
  })
  it("AI 管道不含红线文本", () => {
    for (const f of AI_FILES) {
      const c = readFileSync(resolve(__dirname, "..", f), "utf-8")
      for (const t of REDLINE) {
        expect(c.includes(t), `${f} contains "${t}"`).toBe(false)
      }
    }
  })
  it("chart-summary 不含典籍引用", () => {
    const c = readFileSync(resolve(__dirname, "..", "api/services/chart-summary.ts"), "utf-8")
    expect(c).not.toMatch(/《[^》]+》/)
  })
  it("AI 管道无 getBooksForTerm / getEngineLinks", () => {
    for (const f of AI_FILES) {
      const c = readFileSync(resolve(__dirname, "..", f), "utf-8")
      expect(c).not.toContain("getBooksForTerm")
      expect(c).not.toContain("getEngineLinks")
    }
  })
})
