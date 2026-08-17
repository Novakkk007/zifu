import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * 安全的 localStorage 封装，带 try/catch 保护（隐私模式不崩）
 */
export class SafeStorage {
  /** 环境是否支持 localStorage（隐私模式/无 DOM 环境返回 false） */
  static isSupported(): boolean {
    try {
      const testKey = '__storage_test__'
      globalThis.localStorage.setItem(testKey, 'test')
      globalThis.localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * 安全读取 localStorage
   * @param key 键名
   * @param defaultValue 默认值
   * @returns 存储的值或默认值
   */
  static get<T>(key: string, defaultValue: T): T {
    if (!this.isSupported()) {
      return defaultValue
    }

    try {
      const value = globalThis.localStorage.getItem(key)
      if (value === null) {
        return defaultValue
      }
      return JSON.parse(value) as T
    } catch (e) {
      console.warn(`SafeStorage.get failed for key ${key}:`, e)
      return defaultValue
    }
  }

  /**
   * 安全写入 localStorage
   * @param key 键名
   * @param value 值
   * @returns 写入成功时为 true，不支持或写入失败时为 false
   */
  static set<T>(key: string, value: T): boolean {
    if (!this.isSupported()) {
      return false
    }

    try {
      globalThis.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.warn(`SafeStorage.set failed for key ${key}:`, e)
      return false
    }
  }

  /**
   * 安全删除 localStorage
   * @param key 键名
   */
  static remove(key: string): void {
    if (!this.isSupported()) {
      return
    }

    try {
      globalThis.localStorage.removeItem(key)
    } catch (e) {
      console.warn(`SafeStorage.remove failed for key ${key}:`, e)
    }
  }
}

/**
 * React Hook: 使用 SafeStorage 的状态管理
 * @param key 键名
 * @param initialValue 初始值
 * @returns [value, setValue]
 */
export function useSafeStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`useSafeStorage failed to parse ${key}:`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.warn(`useSafeStorage failed to set ${key}:`, error)
    }
  }

  useEffect(() => {
    // 同步到 localStorage
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`useSafeStorage failed to sync ${key}:`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

// 导出常用键名常量
export const STORAGE_KEYS = {
  FAVORITES: 'zifu:favorites',
  HISTORY: 'zifu:history',
  PREFS: 'zifu:prefs',
  RESTORE: 'zifu:restore',
  FENGSHUI_FORM: 'zifu:fengshui-form',
} as const

export const RESTORE_ROUTES = {
  bazi: '/bazi',
  liuyao: '/liuyao',
  ziwei: '/ziwei',
} as const

export type RestoreType = keyof typeof RESTORE_ROUTES

export type RestoreItem = {
  type: RestoreType
  title: string
  payload: unknown
}

/** 将个人中心选中的命盘暂存到当前标签页，供目标排盘页恢复。 */
export function saveRestoreItem(item: RestoreItem): boolean {
  try {
    globalThis.sessionStorage.setItem(STORAGE_KEYS.RESTORE, JSON.stringify(item))
    return true
  } catch (e) {
    console.warn('saveRestoreItem failed:', e)
    return false
  }
}

/**
 * 一次性读取当前页面对应的恢复数据。类型不匹配时保留数据，避免误消费；
 * 匹配或数据损坏时清除，防止刷新后重复恢复。
 */
export function consumeRestoreItem(type: RestoreType): RestoreItem | null {
  try {
    const raw = globalThis.sessionStorage.getItem(STORAGE_KEYS.RESTORE)
    if (!raw) return null

    const item = JSON.parse(raw) as Partial<RestoreItem>
    if (item.type !== type) return null

    globalThis.sessionStorage.removeItem(STORAGE_KEYS.RESTORE)
    if (typeof item.title !== 'string' || !('payload' in item)) return null

    return item as RestoreItem
  } catch (e) {
    console.warn('consumeRestoreItem failed:', e)
    try {
      globalThis.sessionStorage.removeItem(STORAGE_KEYS.RESTORE)
    } catch {
      // sessionStorage 不可用时无需继续处理
    }
    return null
  }
}

// 类型定义
export type FavoriteItem = {
  id: string
  type: string
  title: string
  createdAt: string
  payload: unknown
}

export type HistoryItem = {
  id: string
  type: string
  title: string
  createdAt: string
  payload: unknown
}

export type Preferences = {
  defaultGender?: 'male' | 'female' | 'other'
  useTrueSolarTime?: boolean
  theme?: 'dark' | 'light' | 'auto'
  language?: 'zh-CN' | 'en-US'
}
