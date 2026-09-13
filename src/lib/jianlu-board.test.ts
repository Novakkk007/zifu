import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { JianluRecord } from './jianlu'
import {
  ANON_ID_KEY,
  BOARD_NAME_KEY,
  BOARD_OPTIN_KEY,
  DEFAULT_BOARD_NAME,
  buildSubmitPayload,
  getAnonId,
  getBoardName,
  isBoardOptIn,
  parseBoardData,
  sanitizeName,
  setBoardName,
  setBoardOptIn,
} from './jianlu-board'

// Mock localStorage（node 环境无 DOM，挂到 globalThis）
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  })
  mockLocalStorage.getItem.mockReturnValue(null)
})

afterEach(() => {
  vi.resetAllMocks()
})

function makeRecord(over: Partial<JianluRecord> = {}): JianluRecord {
  return {
    wins: 12,
    total: 15,
    streak: 2,
    gatesCleared: 3,
    modeWins: { arena: 8, duel: 4, debate: 0 },
    createdAt: '2026-09-01T00:00:00.000Z',
    ...over,
  }
}

describe('匿名标识', () => {
  it('由 crypto.randomUUID 派生 16 位十六进制 id 并持久化', () => {
    const rng = vi.fn(() => '01234567-89ab-cdef-0123-456789abcdef')
    const id = getAnonId(rng)
    expect(id).toBe('0123456789abcdef')
    expect(id).toMatch(/^[a-f0-9]{16}$/)
    expect(rng).toHaveBeenCalledTimes(1)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(ANON_ID_KEY, '0123456789abcdef')
  })

  it('再次调用返回缓存的同一 id，不重复生成', () => {
    const rng = vi.fn(() => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    mockLocalStorage.getItem.mockReturnValue('deadbeef01234567')
    const id = getAnonId(rng)
    expect(id).toBe('deadbeef01234567')
    expect(rng).not.toHaveBeenCalled()
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('隐私模式（localStorage 不可用）返回派生的一次性 id', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    const rng = vi.fn(() => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
    const id = getAnonId(rng)
    expect(id).toBe('bbbbbbbbbbbbbbbb')
    expect(rng).toHaveBeenCalledTimes(1)
  })
})

describe('假名', () => {
  it('sanitizeName 去控制符、去首尾空白、限 16 字', () => {
    expect(sanitizeName('  清风剑客  ')).toBe('清风剑客')
    expect(sanitizeName('a\u0000b\nc')).toBe('abc')
    expect(sanitizeName('一二三四五六七八九十一二三四五六七八九')).toBe('一二三四五六七八九十一二三四五六')
    expect(sanitizeName('')).toBe('')
  })

  it('getBoardName / setBoardName 净化后持久化', () => {
    expect(getBoardName()).toBe('')
    const clean = setBoardName('  青 衣  ')
    expect(clean).toBe('青 衣')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(BOARD_NAME_KEY, '青 衣')
  })
})

describe('不上榜开关', () => {
  it('默认不上榜；主动开启后持久化', () => {
    expect(isBoardOptIn()).toBe(false)
    setBoardOptIn(true)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(BOARD_OPTIN_KEY, '1')
    mockLocalStorage.getItem.mockReturnValue('1')
    expect(isBoardOptIn()).toBe(true)
  })
})

describe('提交载荷（零隐私白名单）', () => {
  it('只含假名与战绩，不含生辰', () => {
    const p = buildSubmitPayload(makeRecord(), '  清风剑客 ')
    expect(p.name).toBe('清风剑客')
    expect(p.wins).toBe(12)
    expect(p.total).toBe(15)
    expect(p.gates).toBe(3)
    expect(p.rankName).toBe('二流剑客')
    expect(p.id).toMatch(/^[a-f0-9]{16}$/)
    expect(Object.keys(p)).toEqual(['id', 'name', 'wins', 'total', 'gates', 'rankName'])
  })

  it('空假名回退「无名剑客」；峰数收敛到 0-7', () => {
    const p = buildSubmitPayload(makeRecord({ gatesCleared: 9 }), '   ')
    expect(p.name).toBe(DEFAULT_BOARD_NAME)
    expect(p.gates).toBe(7)
  })
})

describe('榜单解析（不可信输入防御）', () => {
  it('解析服务端榜单响应', () => {
    const data = parseBoardData({
      available: true,
      weekKey: '2026-09-07',
      total: [{ name: '清风剑客', wins: 88, gates: 7, rankName: '剑道高手' }],
      week: [{ name: '无名剑客', wins: 3, gates: 1, rankName: '三流剑客', weekWins: 3 }],
      sects: [{ sect: '子平格局派', gate: '藏剑峰', items: [] }],
    })
    expect(data.available).toBe(true)
    expect(data.weekKey).toBe('2026-09-07')
    expect(data.total).toHaveLength(1)
    expect(data.total[0].name).toBe('清风剑客')
    expect(data.week[0].weekWins).toBe(3)
    expect(data.sects).toHaveLength(1)
    expect(data.sects[0].sect).toBe('子平格局派')
  })

  it('对非法输入降级为空榜 + 提示', () => {
    const a = parseBoardData(null)
    expect(a.available).toBe(false)
    expect(a.total).toEqual([])
    expect(a.sects).toEqual([])
    expect(typeof a.note).toBe('string')

    const b = parseBoardData({ available: true, total: [{ name: 1 }], week: null, sects: 'oops' })
    expect(b.available).toBe(true)
    expect(b.total).toEqual([])
    expect(b.week).toEqual([])
    expect(b.sects).toEqual([])
  })
})
