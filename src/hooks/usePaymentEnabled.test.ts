/**
 * usePaymentEnabled 单测：配置拉取解析、fail-closed 语义、模块级缓存。
 * （node 环境即可运行——核心逻辑为纯异步函数，不依赖 DOM。）
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPaymentEnabled,
  getPaymentEnabled,
  resetPaymentEnabledCacheForTest,
  RUNTIME_CONFIG_PATH,
  type FetchLike,
} from "./usePaymentEnabled";

function jsonResponse(ok: boolean, body: unknown) {
  return { ok, json: () => Promise.resolve(body) };
}

beforeEach(() => {
  resetPaymentEnabledCacheForTest();
});

describe("usePaymentEnabled · 配置拉取", () => {
  it("服务端返回 paymentEnabled=true → true，且请求打到 /api/config", async () => {
    const f = vi.fn().mockResolvedValue(jsonResponse(true, { paymentEnabled: true }));
    await expect(fetchPaymentEnabled(f as FetchLike)).resolves.toBe(true);
    expect(f).toHaveBeenCalledWith(RUNTIME_CONFIG_PATH, expect.anything());
  });

  it("paymentEnabled=false 或字段缺失 → false", async () => {
    const off = vi.fn().mockResolvedValue(jsonResponse(true, { paymentEnabled: false }));
    await expect(fetchPaymentEnabled(off as FetchLike)).resolves.toBe(false);
    const missing = vi.fn().mockResolvedValue(jsonResponse(true, {}));
    await expect(fetchPaymentEnabled(missing as FetchLike)).resolves.toBe(false);
  });

  it("fail-closed：网络异常 / 非 2xx / 非法响应体 → false", async () => {
    const boom = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(fetchPaymentEnabled(boom as FetchLike)).resolves.toBe(false);
    const notOk = vi.fn().mockResolvedValue(jsonResponse(false, { paymentEnabled: true }));
    await expect(fetchPaymentEnabled(notOk as FetchLike)).resolves.toBe(false);
    const badJson = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error("bad json")),
    });
    await expect(fetchPaymentEnabled(badJson as FetchLike)).resolves.toBe(false);
  });
});

describe("usePaymentEnabled · 模块级缓存", () => {
  it("并发去重 + 结果缓存：多次调用仅发一次请求", async () => {
    const f = vi.fn().mockResolvedValue(jsonResponse(true, { paymentEnabled: true }));
    const [a, b] = await Promise.all([
      getPaymentEnabled(f as FetchLike),
      getPaymentEnabled(f as FetchLike),
    ]);
    expect(a).toBe(true);
    expect(b).toBe(true);
    await expect(getPaymentEnabled(f as FetchLike)).resolves.toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("失败同样缓存为 false（fail-closed）；重置缓存后可重试", async () => {
    const f = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(getPaymentEnabled(f as FetchLike)).resolves.toBe(false);
    await expect(getPaymentEnabled(f as FetchLike)).resolves.toBe(false);
    expect(f).toHaveBeenCalledTimes(1);
    resetPaymentEnabledCacheForTest();
    f.mockResolvedValue(jsonResponse(true, { paymentEnabled: true }));
    await expect(getPaymentEnabled(f as FetchLike)).resolves.toBe(true);
  });
});
