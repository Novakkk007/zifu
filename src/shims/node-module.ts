/**
 * node:module 浏览器占位 shim。
 *
 * contracts/engines/hecan-core/index.ts 顶层 `import { createRequire } from 'node:module'`
 * （仅供 defaultEngineLoader 服务端动态探测引擎用）。浏览器直跑时前端固定传入
 * 静态 loader，createRequire 永远不会被真正调用——此 shim 仅为让 Vite/Rollup
 * 浏览器构建可解析该命名导出；防御性实现被调用时显式报错。
 */
export function createRequire(url: string | URL): (spec: string) => unknown {
  return (spec: string): unknown => {
    throw new Error(`createRequire 在浏览器环境不可用（尝试以 ${String(url)} 为锚加载 ${spec}）`)
  }
}
