/**
 * 统一时间协议（全引擎共用）
 *
 * 目标（Codex V9 审查）：
 * - 全引擎同一套 IANA 时区校验：无效时区一律 400（路由层捕获 InvalidTimezoneError 转换）
 * - 统一小时 ↔ 时辰支序换算约定（子时 23:00–00:59，支序 0=子 … 11=亥）
 * - 统一换日规则类型（子初 zichu / 午夜 midnight）
 *
 * 使用方式：引擎路由在校验入参时调用 assertValidIanaTimezone；
 * 需要时辰支序的引擎（紫微/七政等）用 hourToBranch 从墙钟小时派生，
 * 不再各自维护私有的 hourBranch 口径。
 */

/** 换日规则：zichu=子初（23:00）换日；midnight=午夜（00:00）换日 */
export const DAY_ROLLOVERS = ["zichu", "midnight"] as const;
export type DayRollover = (typeof DAY_ROLLOVERS)[number];

export class InvalidTimezoneError extends Error {
  readonly timezone: string;
  constructor(timezone: string) {
    super(`无效的 IANA 时区：${timezone}`);
    this.name = "InvalidTimezoneError";
    this.timezone = timezone;
  }
}

/**
 * 校验 IANA 时区标识（运行时 Intl 数据库校验，不维护私有清单）。
 * 空值（undefined/null/空串）视为未提供，直接放行——
 * 各引擎自行决定缺省时区（默认 Asia/Shanghai）。
 */
export function assertValidIanaTimezone(
  ianaTimezone: string | undefined | null,
): void {
  if (ianaTimezone === undefined || ianaTimezone === null || ianaTimezone === "") {
    return;
  }
  try {
    // Intl 会在时区标识非法时抛 RangeError
    new Intl.DateTimeFormat("en-US", { timeZone: ianaTimezone });
  } catch {
    throw new InvalidTimezoneError(ianaTimezone);
  }
}

/**
 * 墙钟小时 → 时辰支序（0=子 … 11=亥）。
 * 统一约定：子时覆盖 23:00–00:59，丑时 01:00–02:59，依此类推。
 * （23:00–23:59 属次日早子时还是当日晚子时由换日规则决定，
 *   支序换算本身不涉换日。）
 */
export function hourToBranch(hour: number): number {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`无效的小时：${hour}`);
  }
  if (hour === 23) return 0; // 夜子
  return Math.floor((hour + 1) / 2) % 12;
}

/** 时辰支序 → 代表性墙钟小时（子→0、丑→2、寅→4 … 亥→22；仅作展示/换算参考） */
export function branchToRepresentativeHour(branch: number): number {
  if (!Number.isInteger(branch) || branch < 0 || branch > 11) {
    throw new Error(`无效的时辰支序：${branch}`);
  }
  return (branch * 2) % 24;
}
