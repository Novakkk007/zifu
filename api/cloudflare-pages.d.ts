/**
 * Cloudflare Pages Functions 平台全局类型（最小声明）
 * ---------------------------------------------------------------------------
 * 为什么不装 @cloudflare/workers-types：
 *   官方包会整包注入 Workers 全局（含整套 web 全局声明），与本目录（api/）的
 *   Node 侧代码互相干扰——实测引入后 api/kimi/auth.ts 与 api/queries/orders.ts 的
 *   `randomBytes(32)`（来自 node:crypto）会报 “Expected 0 arguments, but got 1”。
 *   本项目只需要 functions/ 用到的两个平台类型，故就地声明，保持 Node 类型环境干净。
 *
 * 维护约定：
 *   1. functions/ 若要用新的平台能力（R2 / D1 / ExecutionContext / ScheduledEvent 等），
 *      在此按需补声明；能对得上官方签名就照抄官方签名（见注释中的泛型默认值）。
 *   2. 本文件所在目录（api/）已被 tsconfig.server.json 的 include 覆盖，
 *      新增 .d.ts 只要放在 api | contracts | db 下即自动生效。
 *   3. 若将来 functions/ 大幅复杂化，应改为给 functions/ 单独开一个 tsconfig 项目
 *      并只在该项目里引官方 workers-types，而不是把官方全局灌进整个 server 项目。
 */

/** KV 命名空间（Pages/Workers 绑定）。get 的泛型默认 any：与官方签名一致，仅默认值不同。 */
declare type KVNamespace = {
  get<ExpectedValue = any>(key: string, type?: 'text' | 'json'): Promise<ExpectedValue | null>
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; expiration?: number; metadata?: unknown },
  ): Promise<void>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string; expiration?: number; metadata?: unknown }[]
    list_complete: boolean
    cursor?: string
  }>
}

/** Pages Functions 的调用上下文（按官方 EventContext 形状，含测试用到的全部字段）。 */
declare type PagesContext<Env = unknown> = {
  request: Request
  env: Env
  params: Record<string, string | string[]>
  data: Record<string, unknown>
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>
  waitUntil: (promise: Promise<unknown>) => void
  passThroughOnException: () => void
}

/** Pages Functions 处理函数类型：export const onRequest: PagesFunction<Env> = ... */
declare type PagesFunction<Env = unknown> = (
  context: PagesContext<Env>,
) => Response | Promise<Response>
