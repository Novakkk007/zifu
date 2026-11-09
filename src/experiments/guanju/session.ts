/**
 * 观居示例只写入 sessionStorage。失败时返回文案，不抛到界面外。
 */
import {
  DIRECTIONS,
  EXAMPLE_ID,
  FOCUSES,
  SAMPLE_VERSION,
  type Direction,
  type Focus,
} from "@/experiments/guanju/sample"

export const SESSION_KEY = "zifu:guanju:session:v1"

export const SESSION_COPY = {
  saved: "已保存到本次会话。未上传云端；关闭会话可能清除。",
  replaced: "已写回本次会话中的同一份方案，没有另存一份。未上传云端；关闭会话可能清除。",
  writeFail: "未能写入本次会话。页面上的内容还在，但没有保存，关闭后可能丢失。",
  readFail: "未能读取本次会话。",
  clearFail: "未能清除本次会话，请重试。",
  cleared: "已清除本次示例。会话里没有可重新打开的方案。",
  empty: "本次会话中没有已保存的示例。",
  reopened: "已重新打开本次会话中的方案。",
  stale: "已存示例的版本与当前页面不一致，没有打开。可以清除后重来。",
  cloud: "未上传云端；关闭会话可能清除。",
} as const

export type SessionRecord = {
  sampleVersion: typeof SAMPLE_VERSION
  exampleId: typeof EXAMPLE_ID
  direction: Direction
  focuses: Focus[]
  checks: Record<string, boolean>
}

export type SessionRead =
  | { ok: true; record: SessionRecord | null }
  | { ok: false; message: string }

export type SessionWrite =
  | { ok: true; replaced: boolean; message: string }
  | { ok: false; message: string }

const DIRECTION_IDS = new Set<string>(DIRECTIONS.map((item) => item.id))
const FOCUS_IDS = new Set<string>(FOCUSES.map((item) => item.id))

function storage(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null
  } catch {
    return null
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function parseSession(raw: string): SessionRead {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return { ok: false, message: SESSION_COPY.readFail }
  }
  if (!isPlainObject(parsed)) return { ok: false, message: SESSION_COPY.readFail }
  if (parsed.sampleVersion !== SAMPLE_VERSION) {
    return { ok: false, message: SESSION_COPY.stale }
  }
  if (parsed.exampleId !== EXAMPLE_ID) return { ok: false, message: SESSION_COPY.readFail }
  if (typeof parsed.direction !== "string" || !DIRECTION_IDS.has(parsed.direction)) {
    return { ok: false, message: SESSION_COPY.readFail }
  }
  if (!Array.isArray(parsed.focuses) || parsed.focuses.length === 0) {
    return { ok: false, message: SESSION_COPY.readFail }
  }
  const focuses: Focus[] = []
  for (const item of parsed.focuses) {
    if (typeof item !== "string" || !FOCUS_IDS.has(item) || focuses.includes(item as Focus)) {
      return { ok: false, message: SESSION_COPY.readFail }
    }
    focuses.push(item as Focus)
  }
  if (!isPlainObject(parsed.checks)) return { ok: false, message: SESSION_COPY.readFail }
  const checks: Record<string, boolean> = {}
  const entries = Object.entries(parsed.checks)
  if (entries.length > 12) return { ok: false, message: SESSION_COPY.readFail }
  for (const [key, value] of entries) {
    if (!/^obs-[a-z]+$/.test(key) || typeof value !== "boolean") {
      return { ok: false, message: SESSION_COPY.readFail }
    }
    checks[key] = value
  }
  return {
    ok: true,
    record: {
      sampleVersion: SAMPLE_VERSION,
      exampleId: EXAMPLE_ID,
      direction: parsed.direction as Direction,
      focuses,
      checks,
    },
  }
}

export function readSession(): SessionRead {
  const store = storage()
  if (!store) return { ok: false, message: SESSION_COPY.readFail }
  try {
    const raw = store.getItem(SESSION_KEY)
    if (raw === null) return { ok: true, record: null }
    return parseSession(raw)
  } catch {
    return { ok: false, message: SESSION_COPY.readFail }
  }
}

export function writeSession(record: SessionRecord): SessionWrite {
  const store = storage()
  if (!store) return { ok: false, message: SESSION_COPY.writeFail }
  const payload: SessionRecord = {
    sampleVersion: SAMPLE_VERSION,
    exampleId: EXAMPLE_ID,
    direction: record.direction,
    focuses: record.focuses,
    checks: record.checks,
  }
  try {
    const replaced = store.getItem(SESSION_KEY) !== null
    store.setItem(SESSION_KEY, JSON.stringify(payload))
    return {
      ok: true,
      replaced,
      message: replaced ? SESSION_COPY.replaced : SESSION_COPY.saved,
    }
  } catch {
    return { ok: false, message: SESSION_COPY.writeFail }
  }
}

export function clearSession(): { ok: true; message: string } | { ok: false; message: string } {
  const store = storage()
  if (!store) return { ok: false, message: SESSION_COPY.clearFail }
  try {
    store.removeItem(SESSION_KEY)
    return { ok: true, message: SESSION_COPY.cleared }
  } catch {
    return { ok: false, message: SESSION_COPY.clearFail }
  }
}
