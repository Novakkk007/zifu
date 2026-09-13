import { describe, it, expect, beforeEach } from 'vitest'
import {
  JIE_MAX_WINS,
  copyToClipboard,
  decodeGateQuestion,
  encodeGateQuestion,
  isJieSolved,
  jianluJieLink,
  jianluJiePath,
  jieSolvedCount,
  markJieSolved,
} from './jianlu-code'

// node 环境无 DOM——localStorage 用行为真实的内存实现挂到 globalThis
const store = new Map<string, string>()
const mockLocalStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v)
  },
  removeItem: (k: string) => {
    store.delete(k)
  },
  clear: () => {
    store.clear()
  },
}

beforeEach(() => {
  store.clear()
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  })
})

describe('encodeGateQuestion', () => {
  it('生成标准口令「紫府问剑·关号·题号」', () => {
    expect(encodeGateQuestion(0, 0)).toBe('紫府问剑·壹·壹')
    expect(encodeGateQuestion(1, 2)).toBe('紫府问剑·贰·叁')
    expect(encodeGateQuestion(6, 0)).toBe('紫府问剑·柒·壹')
    expect(encodeGateQuestion(6, 2)).toBe('紫府问剑·柒·叁')
  })

  it('越界返回空串', () => {
    expect(encodeGateQuestion(-1, 0)).toBe('')
    expect(encodeGateQuestion(7, 0)).toBe('')
    expect(encodeGateQuestion(0, 3)).toBe('')
    expect(encodeGateQuestion(0, -1)).toBe('')
    expect(encodeGateQuestion(0.5, 1)).toBe('')
    expect(encodeGateQuestion(NaN, 0)).toBe('')
  })

  it('全题库 21 题口令可往返解码', () => {
    for (let g = 0; g < 7; g++) {
      for (let q = 0; q < 3; q++) {
        expect(decodeGateQuestion(encodeGateQuestion(g, q))).toEqual({ gateIdx: g, qIdx: q })
      }
    }
  })
})

describe('decodeGateQuestion（容错解析）', () => {
  it('标准口令', () => {
    expect(decodeGateQuestion('紫府问剑·贰·叁')).toEqual({ gateIdx: 1, qIdx: 2 })
  })

  it('无分隔符 / 中文小写数字 / 阿拉伯数字', () => {
    expect(decodeGateQuestion('紫府问剑贰叁')).toEqual({ gateIdx: 1, qIdx: 2 })
    expect(decodeGateQuestion('二·三')).toEqual({ gateIdx: 1, qIdx: 2 })
    expect(decodeGateQuestion('23')).toEqual({ gateIdx: 1, qIdx: 2 })
    expect(decodeGateQuestion('壹贰')).toEqual({ gateIdx: 0, qIdx: 1 })
  })

  it('容忍完整 URL 尾巴与首尾空白', () => {
    expect(
      decodeGateQuestion('https://zifu.pages.dev/jianlu/jie/%E7%B4%AB%E5%BA%9C%E9%97%AE%E5%89%91%C2%B7%E5%A3%B9%C2%B7%E8%B4%B0')
    ).toEqual({ gateIdx: 0, qIdx: 1 })
    expect(decodeGateQuestion('  紫府问剑·壹·贰  ')).toEqual({ gateIdx: 0, qIdx: 1 })
  })

  it('非法口令返回 null', () => {
    expect(decodeGateQuestion(null)).toBeNull()
    expect(decodeGateQuestion('')).toBeNull()
    expect(decodeGateQuestion(undefined)).toBeNull()
    expect(decodeGateQuestion('紫府问剑·捌·壹')).toBeNull()
    expect(decodeGateQuestion('紫府问剑·壹')).toBeNull()
    expect(decodeGateQuestion('紫府问剑·壹·肆')).toBeNull() // 题号越界（>叁）
    expect(decodeGateQuestion('壹贰叁')).toBeNull()
    expect(decodeGateQuestion('随便一句')).toBeNull()
  })
})

describe('防刷：每 (关,题) 终身只计 1 胜', () => {
  it('初始零已接', () => {
    expect(isJieSolved(0, 0)).toBe(false)
    expect(jieSolvedCount()).toBe(0)
  })

  it('接剑后标记生效且幂等', () => {
    markJieSolved(0, 0)
    expect(isJieSolved(0, 0)).toBe(true)
    expect(jieSolvedCount()).toBe(1)
    markJieSolved(0, 0) // 重复接剑不重复计数
    expect(jieSolvedCount()).toBe(1)
  })

  it('不同题独立计数', () => {
    markJieSolved(0, 0)
    markJieSolved(0, 1)
    markJieSolved(6, 2)
    expect(jieSolvedCount()).toBe(3)
    expect(isJieSolved(6, 2)).toBe(true)
    expect(isJieSolved(5, 2)).toBe(false)
  })

  it('21 题全接后到上限', () => {
    for (let g = 0; g < 7; g++) {
      for (let q = 0; q < 3; q++) {
        markJieSolved(g, q)
      }
    }
    expect(jieSolvedCount()).toBe(21)
    expect(JIE_MAX_WINS).toBe(21)
  })

  it('存储损坏时静默降级不抛错', () => {
    store.set('zifu:jianlu:jie-solved', 'not json')
    expect(isJieSolved(0, 0)).toBe(false)
    expect(jieSolvedCount()).toBe(0)
    expect(() => markJieSolved(0, 0)).not.toThrow()
    expect(jieSolvedCount()).toBe(1)
  })
})

describe('分享链接与剪贴板', () => {
  it('接剑路径带 base 前缀并编码口令', () => {
    const code = '紫府问剑·壹·贰'
    expect(jianluJiePath(code)).toBe(`/jianlu/jie/${encodeURIComponent(code)}`)
  })

  it('node 环境（无 window）返回相对路径', () => {
    expect(jianluJieLink('紫府问剑·壹·贰')).toBe(jianluJiePath('紫府问剑·壹·贰'))
  })

  it('剪贴板不可用时返回 false 不抛错', async () => {
    expect(await copyToClipboard('任意')).toBe(false)
  })
})
