/**
 * 六爻前端展示辅助（纯展示层）。
 * 推演逻辑已全部迁至服务端引擎 @contracts/engines/liuyao-core（确定性装卦）+
 * api/liuyao-router.ts（CSPRNG 掷币）；本文件只保留爻值展示工具。
 */

/** 摇卦一爻的数值：6 老阴(动) / 7 少阳 / 8 少阴 / 9 老阳(动) */
export type Toss = 6 | 7 | 8 | 9

export const YAO_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

export function isYang(t: Toss): boolean {
  return t === 7 || t === 9
}
export function isMoving(t: Toss): boolean {
  return t === 6 || t === 9
}
export function yaoLabel(t: Toss): string {
  switch (t) {
    case 6:
      return '老阴 · 动'
    case 7:
      return '少阳 · 静'
    case 8:
      return '少阴 · 静'
    case 9:
      return '老阳 · 动'
  }
}
