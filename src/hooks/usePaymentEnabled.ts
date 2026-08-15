import { useEffect, useState } from "react";

/**
 * 付费入口开关（fail-closed）。
 *
 * 启动时拉取 `GET /api/config` 的 `{ paymentEnabled }`，模块级缓存，全应用共享一次请求。
 * 任何失败（网络异常 / 非 2xx / 响应结构不符）一律按 false 处理——与后端
 * `computePaymentEnabled` 的 fail-closed 哲学一致：支付未显式开启时，
 * 前端隐藏/降级所有充值付费入口。
 */

export interface RuntimeConfig {
  paymentEnabled: boolean;
}

export const RUNTIME_CONFIG_PATH = "/api/config";

/** 支付未开启时的统一降级文案（对齐 AiReadingSection 既有「充值通道即将开放」风格） */
export const RECHARGE_CLOSED_HINT = "充值通道即将开放，敬请期待";

/** 最小 fetch 形态（便于测试注入替身） */
export type FetchLike = (
  input: string,
  init?: { headers?: Record<string, string> },
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

/** 拉取并解析运行时配置；任何异常或异常结构均回落 false（fail-closed） */
export async function fetchPaymentEnabled(
  fetchImpl: FetchLike = globalThis.fetch,
): Promise<boolean> {
  try {
    const res = await fetchImpl(RUNTIME_CONFIG_PATH, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as Partial<RuntimeConfig> | null;
    return data?.paymentEnabled === true;
  } catch {
    return false;
  }
}

let inflight: Promise<boolean> | null = null;
let resolved: boolean | null = null;

/** 全应用共享的配置获取：并发去重 + 结果缓存（含失败结果，fail-closed 后不再抖动） */
export function getPaymentEnabled(fetchImpl?: FetchLike): Promise<boolean> {
  if (resolved !== null) return Promise.resolve(resolved);
  if (!inflight) {
    inflight = fetchPaymentEnabled(fetchImpl).then((v) => {
      resolved = v;
      inflight = null;
      return v;
    });
  }
  return inflight;
}

/** 测试专用：清空模块级缓存 */
export function resetPaymentEnabledCacheForTest(): void {
  inflight = null;
  resolved = null;
}

/**
 * React hook：支付是否开启。
 * 加载完成前一律返回 false（fail-closed：付费入口先隐藏，确认开启后才显示）。
 */
export function usePaymentEnabled(): boolean {
  const [enabled, setEnabled] = useState<boolean>(resolved === true);
  useEffect(() => {
    let alive = true;
    void getPaymentEnabled().then((v) => {
      if (alive) setEnabled(v);
    });
    return () => {
      alive = false;
    };
  }, []);
  return enabled;
}
