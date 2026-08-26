// 先生专栏数据单一来源（2026-08-26 接实：Column.tsx 原为 mock 死数据 → columns.json）
import columnsData from './columns.json'

export interface ColumnArticle {
  id: string
  title: string
  excerpt: string
  content: string
  date: string
  draft?: boolean
}

/** 先生专栏全部文章（自 columns.json 载入，单一数据源） */
export const COLUMN_ARTICLES: ColumnArticle[] = columnsData as ColumnArticle[]

/** 仅已发布文章 */
export function getPublishedArticles(): ColumnArticle[] {
  return COLUMN_ARTICLES.filter((a) => !a.draft)
}
