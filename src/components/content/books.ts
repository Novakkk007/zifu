/**
 * 藏经阁书目数据加载。
 * tsconfig 未开 resolveJsonModule，经 Vite `?raw` 内联 JSON 字符串后解析，
 * 数据源仍是规范的 src/data/books.json。
 */
import raw from '@/data/books.json?raw'

export type BookCategory = '易占' | '子平' | '星命' | '三式'

export type BookExcerpt = {
  text: string
  source: string
}

export type Book = {
  id: string
  title: string
  dynasty: string
  author: string
  category: BookCategory
  intro: string
  route: string
  excerpts: BookExcerpt[]
}

export const BOOKS: Book[] = JSON.parse(raw) as Book[]

export const BOOK_CATEGORIES: ('全部' | BookCategory)[] = ['全部', '易占', '子平', '星命', '三式']
