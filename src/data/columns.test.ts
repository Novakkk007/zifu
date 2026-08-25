import { describe, expect, it } from 'vitest'
import { COLUMN_ARTICLES, getPublishedArticles } from './columns'

describe('columns 先生专栏数据（自 columns.json 单一源）', () => {
  it('columns.json 文章非空且字段完整', () => {
    expect(COLUMN_ARTICLES.length).toBeGreaterThan(0)
    for (const a of COLUMN_ARTICLES) {
      expect(a.id).toBeTruthy()
      expect(a.title).toBeTruthy()
      expect(a.content).toBeTruthy()
      expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(a.excerpt).toBeTruthy()
    }
  })

  it('日期合法（真实年月日，非占位）', () => {
    for (const a of COLUMN_ARTICLES) {
      const d = new Date(a.date + 'T00:00:00')
      expect(Number.isNaN(d.getTime())).toBe(false)
    }
  })

  it('已发布文章不少于 1 篇（页面列表非空）', () => {
    expect(getPublishedArticles().length).toBeGreaterThanOrEqual(1)
  })

  it('id 唯一', () => {
    const ids = COLUMN_ARTICLES.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
