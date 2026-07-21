import * as schema from "@db/schema";
import { getDb } from "./connection";

export interface WriteAuditLogInput {
  userId?: number | null;
  action: string;
  targetType?: string;
  targetId?: string;
  /** 附加信息（对象将序列化为 JSON；不得包含敏感原始输入） */
  meta?: unknown;
}

/** 写审计日志；失败不阻塞主流程（仅记录 console） */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  try {
    await getDb()
      .insert(schema.auditLogs)
      .values({
        userId: input.userId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        meta: input.meta === undefined ? null : JSON.stringify(input.meta),
      });
  } catch (err) {
    console.error("[audit] persist failed:", err);
  }
}
