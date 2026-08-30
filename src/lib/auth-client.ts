/**
 * 紫府账号钱包客户端（匿名设备账号 + 灵签）
 * 设备 ID 本地生成（指纹+随机），无需密码；灵签余额由服务端 DO 原子记账。
 */
const AUTH_URL = 'https://zifu-auth-worker.novakk.workers.dev'
const DEVICE_KEY = 'zifu:deviceId'
const NICK_KEY = 'zifu:nick'

export interface WalletInfo {
  ok: boolean
  balance?: number
  nick?: string
  error?: string
}

function deviceId(): string {
  let d = localStorage.getItem(DEVICE_KEY)
  if (!d) {
    const fp = [
      navigator.userAgent.length.toString(36),
      navigator.language,
      new Date().getTimezoneOffset().toString(36),
    ].join('|')
    d = `zf-${btoa(unescape(encodeURIComponent(fp))).slice(0, 12)}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(DEVICE_KEY, d)
  }
  return d
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${AUTH_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': deviceId(),
      ...(init?.headers ?? {}),
    },
  })
  return (await res.json()) as T
}

export function hasDevice(): boolean {
  return Boolean(localStorage.getItem(DEVICE_KEY))
}

/** 我的钱包（注册即赠 36 灵签） */
export async function myWallet(): Promise<WalletInfo> {
  return call('/me')
}

/** 设置昵称 */
export async function setNick(nick: string): Promise<WalletInfo> {
  const r = await call<WalletInfo>('/nick', { method: 'POST', body: JSON.stringify({ nick }) })
  if (r.ok && r.nick) localStorage.setItem(NICK_KEY, r.nick)
  return r
}

export function localNick(): string {
  return localStorage.getItem(NICK_KEY) ?? '缘主'
}

/** 扣灵签（服务端原子）——如余额不足返回 error */
export async function chargeLingqian(amount: number): Promise<WalletInfo> {
  return call('/charge', { method: 'POST', body: JSON.stringify({ amount }) })
}

/** 充值（支付通道未开放时为体验赠签） */
export async function rechargeLingqian(): Promise<WalletInfo> {
  return call('/recharge', { method: 'POST', body: JSON.stringify({}) })
}
