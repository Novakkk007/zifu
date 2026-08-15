import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SafeStorage, STORAGE_KEYS } from './storage'
import type { FavoriteItem, HistoryItem, Preferences } from './storage'

// Mock localStorage（node 环境无 DOM，挂到 globalThis）
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Setup mock
beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.resetAllMocks()
})

describe('SafeStorage', () => {
  describe('isSupported', () => {
    it('should return true when localStorage is available', () => {
      expect(SafeStorage.isSupported()).toBe(true)
    })

    it('should return false when localStorage is not available', () => {
      // Mock localStorage to throw error
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      expect(SafeStorage.isSupported()).toBe(false)
    })
  })

  describe('get', () => {
    it('should return default value when key does not exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      const result = SafeStorage.get<string>('test-key', 'default')
      expect(result).toBe('default')
    })

    it('should return parsed value when key exists', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ hello: 'world' }))
      const result = SafeStorage.get<{ hello: string }>('test-key', { hello: 'default' })
      expect(result).toEqual({ hello: 'world' })
    })

    it('should return default value when parsing fails', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')
      const result = SafeStorage.get<string>('test-key', 'default')
      expect(result).toBe('default')
    })
  })

  describe('set', () => {
    it('should set value in localStorage', () => {
      SafeStorage.set('test-key', { hello: 'world' })
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ hello: 'world' })
      )
    })

    it('should handle errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })
      SafeStorage.set('test-key', { hello: 'world' })
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should remove key from localStorage', () => {
      SafeStorage.remove('test-key')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key')
    })

    it('should handle errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Cannot remove')
      })
      SafeStorage.remove('test-key')
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
    })
  })
})

// Test constants
describe('STORAGE_KEYS', () => {
  it('should have correct keys', () => {
    expect(STORAGE_KEYS.FAVORITES).toBe('zifu:favorites')
    expect(STORAGE_KEYS.HISTORY).toBe('zifu:history')
    expect(STORAGE_KEYS.PREFS).toBe('zifu:prefs')
  })
})

// Test type definitions
describe('Type definitions', () => {
  it('should define FavoriteItem correctly', () => {
    const item: FavoriteItem = {
      id: '123',
      type: 'bazi',
      title: 'Test',
      createdAt: new Date().toISOString(),
      payload: {},
    }
    expect(item.id).toBeDefined()
  })

  it('should define HistoryItem correctly', () => {
    const item: HistoryItem = {
      id: '123',
      type: 'bazi',
      title: 'Test',
      createdAt: new Date().toISOString(),
      payload: {},
    }
    expect(item.id).toBeDefined()
  })

  it('should define Preferences correctly', () => {
    const prefs: Preferences = {
      defaultGender: 'male',
      useTrueSolarTime: true,
      theme: 'dark',
      language: 'zh-CN',
    }
    expect(prefs.defaultGender).toBeDefined()
  })
})