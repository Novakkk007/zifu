import * as cookie from "cookie";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { env } from "./lib/env";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken, verifySessionTokenForRefresh } from "./kimi/session";
import { findUserByUnionId } from "./queries/users";
import {
  createAuthSession,
  findValidAuthSession,
  revokeAuthSession,
} from "./queries/auth-sessions";

function readSessionToken(headers: Headers): string | undefined {
  return cookie.parse(headers.get("cookie") || "")[Session.cookieName];
}

function clearSessionCookie(ctx: { req: Request; resHeaders: Headers }) {
  const opts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, "", {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: 0,
    }),
  );
}

function setSessionCookie(
  ctx: { req: Request; resHeaders: Headers },
  token: string,
) {
  const opts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),

  /**
   * 刷新登录态：access JWT（2h）过期后，
   * 凭未撤销未过期的会话行（30d）换发新 JWT；会话无效则清 cookie 并 401。
   */
  refresh: publicQuery.mutation(async ({ ctx }) => {
    const token = readSessionToken(ctx.req.headers);
    const claim = token ? await verifySessionTokenForRefresh(token) : null;
    if (!claim) {
      clearSessionCookie(ctx);
      throw new TRPCError({ code: "UNAUTHORIZED", message: "会话无效，请重新登录。" });
    }
    const authSession = await findValidAuthSession(claim.sid);
    if (!authSession) {
      clearSessionCookie(ctx);
      throw new TRPCError({ code: "UNAUTHORIZED", message: "会话已过期或被撤销，请重新登录。" });
    }
    const user = await findUserByUnionId(claim.unionId);
    if (!user) {
      clearSessionCookie(ctx);
      throw new TRPCError({ code: "UNAUTHORIZED", message: "用户不存在，请重新登录。" });
    }
    // 旋转会话：撤销旧会话行，建立新会话行（防重放旧 refresh）
    await revokeAuthSession(claim.sid);
    const sid = randomUUID();
    await createAuthSession(sid, user.id);
    const newToken = await signSessionToken({
      unionId: claim.unionId,
      clientId: env.appId,
      sid,
    });
    setSessionCookie(ctx, newToken);
    return user;
  }),

  /** 登出：撤销服务端会话行（真正可撤销）+ 清 cookie */
  logout: authedQuery.mutation(async ({ ctx }) => {
    const token = readSessionToken(ctx.req.headers);
    const claim = token ? await verifySessionTokenForRefresh(token) : null;
    if (claim) {
      await revokeAuthSession(claim.sid);
    }
    clearSessionCookie(ctx);
    return { success: true };
  }),
});
