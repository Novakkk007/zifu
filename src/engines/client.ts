/**
 * 浏览器直跑引擎适配层 · 拆分自 client.ts（V12 拆 chunk，路由级按需加载）。
 * 等价性由 api/browser-client-parity.test.ts 守护。
 */

export * from './client/shared'
export * from './client/bazi'
export * from './client/ziwei'
export * from './client/liuyao'
export * from './client/qimen'
export * from './client/qizheng'
export * from './client/daliuren'
export * from './client/hepan'
export * from './client/hecan'
export * from './client/draws'
