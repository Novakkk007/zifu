import { and, eq, isNull, lt } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

/* ---------------- OAuth 一次性 state ---------------- */

export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 分钟

export async function createOAuthState(state: string, redirectUri: string) {
  await getDb().insert(schema.oauthStates).values({
    state,
    redirectUri,
    expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
  });
}

export async function findOAuthState(state: string) {
  const rows = await getDb()
    .select()
    .from(schema.oauthStates)
    .where(eq(schema.oauthStates.state, state))
    .limit(1);
  return rows.at(0);
}

/**
 * 原子消费 state：仅当未使用时标记 usedAt。
 * 返回受影响行数——0 表示已被消费（重放）或不存在。
 */
export async function consumeOAuthState(state: string): Promise<number> {
  const res = await getDb()
    .update(schema.oauthStates)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.oauthStates.state, state),
        isNull(schema.oauthStates.usedAt),
      ),
    );
  return Number(res[0]?.affectedRows ?? 0);
}

/** 机会主义清理过期 state（每次 begin 时顺带执行，失败不阻塞） */
export async function pruneExpiredOAuthStates() {
  try {
    await getDb()
      .delete(schema.oauthStates)
      .where(lt(schema.oauthStates.expiresAt, new Date()));
  } catch (err) {
    console.warn("[oauth] prune expired states failed:", err);
  }
}

/* ---------------- 可撤销会话 ---------------- */

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

export async function createAuthSession(id: string, userId: number) {
  await getDb().insert(schema.sessions).values({
    id,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
}

/** 有效会话：存在、未撤销、未过期 */
export async function findValidAuthSession(id: string) {
  const rows = await getDb()
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, id))
    .limit(1);
  const s = rows.at(0);
  if (!s || s.revokedAt || s.expiresAt.getTime() <= Date.now()) return undefined;
  return s;
}

export async function revokeAuthSession(id: string) {
  await getDb()
    .update(schema.sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.sessions.id, id), isNull(schema.sessions.revokedAt)));
}

/** 撤销某用户全部会话（删除账户 / 强制下线用） */
export async function revokeAllAuthSessions(userId: number) {
  await getDb()
    .update(schema.sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(schema.sessions.userId, userId), isNull(schema.sessions.revokedAt)),
    );
}
