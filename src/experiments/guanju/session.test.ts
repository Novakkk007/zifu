import { afterEach, describe, expect, it, vi } from "vitest"
import { SAMPLE_VERSION, type Direction, type Focus } from "@/experiments/guanju/sample"
import {
  SESSION_COPY,
  SESSION_KEY,
  clearSession,
  parseSession,
  readSession,
  writeSession,
  type SessionRecord,
} from "@/experiments/guanju/session"

function record(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    sampleVersion: SAMPLE_VERSION,
    exampleId: "A",
    direction: "south",
    focuses: ["light"],
    checks: { "obs-light": true },
    ...overrides,
  }
}

function installStorage(initial?: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(initial ?? {}))
  const setItem = vi.fn((key: string, value: string) => {
    map.set(key, value)
  })
  const store = {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem,
    removeItem: (key: string) => {
      map.delete(key)
    },
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size
    },
  }
  Object.defineProperty(globalThis, "sessionStorage", {
    value: store,
    configurable: true,
  })
  return { map, setItem }
}

afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(globalThis, "sessionStorage")
})

describe("观居会话", () => {
  it("保存后可以读回，再次保存覆盖同一份", () => {
    const { map, setItem } = installStorage()
    const first = writeSession(record())
    expect(first).toMatchObject({ ok: true, replaced: false, message: SESSION_COPY.saved })
    const second = writeSession(record({ direction: "east" as Direction, focuses: ["air"] as Focus[] }))
    expect(second).toMatchObject({ ok: true, replaced: true, message: SESSION_COPY.replaced })
    expect(map.size).toBe(1)
    expect(setItem).toHaveBeenCalledTimes(2)
    const read = readSession()
    expect(read).toMatchObject({
      ok: true,
      record: { direction: "east", focuses: ["air"], sampleVersion: SAMPLE_VERSION, exampleId: "A" },
    })
    const stored = JSON.parse(map.get(SESSION_KEY) ?? "{}") as Record<string, unknown>
    expect(Object.keys(stored).sort()).toEqual(["checks", "direction", "exampleId", "focuses", "sampleVersion"])
  })

  it("清除后重开为空", () => {
    installStorage()
    writeSession(record())
    expect(clearSession()).toMatchObject({ ok: true, message: SESSION_COPY.cleared })
    expect(readSession()).toEqual({ ok: true, record: null })
  })

  it("版本不一致或坏数据会说明读失败，而不是当成空会话", () => {
    installStorage({ [SESSION_KEY]: JSON.stringify({ ...record(), sampleVersion: "old" }) })
    expect(readSession()).toEqual({ ok: false, message: SESSION_COPY.stale })
    expect(parseSession("{")).toEqual({ ok: false, message: SESSION_COPY.readFail })
    expect(parseSession(JSON.stringify({ sampleVersion: SAMPLE_VERSION, exampleId: "B" }))).toEqual({
      ok: false,
      message: SESSION_COPY.readFail,
    })
  })

  it("写入抛错时提示失败，不声称已保存", () => {
    installStorage()
    const store = globalThis.sessionStorage
    store.setItem = () => {
      throw new Error("quota")
    }
    expect(writeSession(record())).toEqual({ ok: false, message: SESSION_COPY.writeFail })
  })

  it("没有 sessionStorage 时读写和清除都给出失败", () => {
    Reflect.deleteProperty(globalThis, "sessionStorage")
    expect(readSession()).toEqual({ ok: false, message: SESSION_COPY.readFail })
    expect(writeSession(record())).toEqual({ ok: false, message: SESSION_COPY.writeFail })
    expect(clearSession()).toEqual({ ok: false, message: SESSION_COPY.clearFail })
  })
})
