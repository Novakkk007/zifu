/**
 * 引擎释义系统接线测试 + 红线固化。
 *
 * A. 数据完整性：glossary.json 覆盖 BAZI_LINKS 全部术语；books 字段与
 *    contracts/glossary-bridge 的 getBooksForTerm() 严格一致（不允自创映射）。
 * B. 释义风格红线：释义为通识性定义，不得出现典籍名书名号引用，
 *    且不得包含 books.json 中任何典籍原文句子（项目有假引文前科）。
 * C. AI 链路红线：AI prompt 链路的入口模块（ai.ts / chart-summary.ts / ai-router.ts）
 *    的传递依赖闭包中不得出现 glossary 数据（glossary.json / glossary-bridge /
 *    GlossaryTooltip）。任何人把术语数据接进 prompt 组装，本测试立刻变红。
 */
import { describe, expect, it } from "vitest"
import * as fs from "node:fs"
import * as path from "node:path"
import { BAZI_LINKS, getBooksForTerm } from "@contracts/glossary-bridge"
import GLOSSARY from "@/data/glossary.json"
import BOOKS from "@/data/books.json"

type GlossaryEntry = { def: string; books: string[] }
const GLOSSARY_MAP = GLOSSARY as unknown as Record<string, GlossaryEntry>
const realBookIds = new Set((BOOKS as { id: string }[]).map((b) => b.id))

/** BAZI_LINKS 引用的全部术语（去重） */
const baziTerms = [...new Set(BAZI_LINKS.flatMap((l) => l.glossaryTerms))]

describe("glossary.json 数据完整性", () => {
  it("覆盖 BAZI_LINKS 全部术语（天干10+地支12+格局4+岁运2+十神9=37）", () => {
    expect(baziTerms).toHaveLength(37)
    for (const term of baziTerms) {
      const entry = GLOSSARY_MAP[term]
      expect(entry, `缺词条「${term}」`).toBeDefined()
      expect(typeof entry.def, `「${term}」缺 def`).toBe("string")
      expect(entry.def.length, `「${term}」def 为空`).toBeGreaterThan(0)
      expect(Array.isArray(entry.books), `「${term}」缺 books`).toBe(true)
    }
  })

  it("books 字段与 glossary-bridge 映射严格一致且不自创", () => {
    for (const [term, entry] of Object.entries(GLOSSARY_MAP)) {
      const expected = [...getBooksForTerm(term)].sort()
      const actual = [...entry.books].sort()
      expect(actual, `「${term}」books 与 bridge 映射不一致`).toEqual(expected)
      for (const id of entry.books) {
        expect(realBookIds.has(id), `「${term}」引用了不存在的典籍 ${id}`).toBe(true)
      }
    }
  })

  it("词条无冗余：仅收录 bridge 引用范围内的术语", () => {
    for (const term of Object.keys(GLOSSARY_MAP)) {
      expect(baziTerms, `冗余词条「${term}」（bridge 未引用，books 只能自创）`).toContain(term)
    }
  })
})

describe("释义风格红线（无典籍原文引用）", () => {
  it("释义不含书名号引用（不标注典籍出处句）", () => {
    for (const [term, entry] of Object.entries(GLOSSARY_MAP)) {
      expect(entry.def.includes("《"), `「${term}」def 出现《`).toBe(false)
      expect(entry.def.includes("》"), `「${term}」def 出现》`).toBe(false)
    }
  })

  it("释义不含 books.json 中任何典籍原文句子", () => {
    const excerpts = (BOOKS as { excerpts: { text: string }[] }[]).flatMap((b) =>
      b.excerpts.map((e) => e.text),
    )
    for (const [term, entry] of Object.entries(GLOSSARY_MAP)) {
      for (const text of excerpts) {
        expect(entry.def.includes(text), `「${term}」def 含典籍原文「${text}」`).toBe(false)
      }
    }
  })
})

/* ---------- C. AI 链路红线：传递依赖扫描 ---------- */

const ROOT = path.resolve(import.meta.dirname, "..")

/** AI prompt 链路入口：prompt 组装、命盘摘要构建、路由编排 */
const AI_CHAIN_ENTRIES = [
  "api/services/ai.ts",
  "api/services/chart-summary.ts",
  "api/ai-router.ts",
]

const ALIASES: [string, string][] = [
  ["@contracts/", "contracts/"],
  ["@assets/", "attached_assets/"],
  ["@db/", "db/"],
  ["@/", "src/"],
]

const IMPORT_RE =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g

function resolveSpec(spec: string, fromFile: string): string | null {
  let base: string | null = null
  if (spec.startsWith(".")) {
    base = path.resolve(path.dirname(fromFile), spec)
  } else {
    for (const [prefix, target] of ALIASES) {
      if (spec.startsWith(prefix)) {
        base = path.join(ROOT, target, spec.slice(prefix.length))
        break
      }
    }
  }
  if (!base) return null // 外部包（node_modules），不在红线扫描范围
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  }
  return null
}

/** 从入口模块出发的传递依赖闭包（仅跟随仓内文件） */
function transitiveDeps(entries: string[]): Set<string> {
  const seen = new Set<string>()
  const queue = entries.map((e) => path.join(ROOT, e))
  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file)) continue
    seen.add(file)
    const src = fs.readFileSync(file, "utf-8")
    for (const m of src.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2]
      if (!spec) continue
      const resolved = resolveSpec(spec, file)
      if (resolved && !seen.has(resolved)) queue.push(resolved)
    }
  }
  return seen
}

describe("AI 链路红线（术语数据不进入 prompt 组装）", () => {
  it("AI 链路传递依赖闭包中无 glossary 数据模块", () => {
    const deps = transitiveDeps(AI_CHAIN_ENTRIES)
    const offenders = [...deps].filter((f) => /glossary/i.test(path.basename(f)))
    expect(offenders, "AI 链路引用了 glossary 数据（glossary.json / glossary-bridge / GlossaryTooltip）").toEqual([])
  })

  it("AI 链路入口源码中无 glossary 字样（含动态引用、字符串路径）", () => {
    for (const entry of AI_CHAIN_ENTRIES) {
      const src = fs.readFileSync(path.join(ROOT, entry), "utf-8")
      expect(/glossary/i.test(src), `${entry} 源码出现 glossary 引用`).toBe(false)
    }
  })

  it("红线自检：扫描器确实能发现引用（注入假引用时必须变红）", () => {
    // 构造一个临时引用 glossary-bridge 的仓内文件，验证扫描器能抓到
    const probe = path.join(ROOT, "api/services/__redline_probe__.ts")
    fs.writeFileSync(probe, 'import { BAZI_LINKS } from "@contracts/glossary-bridge";\nexport const x = BAZI_LINKS;\n')
    try {
      const deps = transitiveDeps(["api/services/__redline_probe__.ts"])
      const offenders = [...deps].filter((f) => /glossary/i.test(path.basename(f)))
      expect(offenders.length).toBeGreaterThan(0)
    } finally {
      fs.unlinkSync(probe)
    }
  })
})
