import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import * as jose from "jose";
import * as cookie from "cookie";
import { randomBytes, randomUUID } from "node:crypto";
import { env } from "../lib/env";
import { getSessionCookieOptions } from "../lib/cookies";
import { Session } from "@contracts/constants";
import { Errors } from "@contracts/errors";
import { signSessionToken, verifySessionToken } from "./session";
import { users as kimiUsers } from "./platform";
import { findUserByUnionId, upsertUser } from "../queries/users";
import {
  consumeOAuthState,
  createAuthSession,
  createOAuthState,
  findOAuthState,
  findValidAuthSession,
  pruneExpiredOAuthStates,
} from "../queries/auth-sessions";
import type { TokenResponse } from "./types";

async function exchangeAuthCode(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.appId,
    redirect_uri: redirectUri,
    client_secret: env.appSecret,
  });

  const resp = await fetch(`${env.kimiAuthUrl}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<TokenResponse>;
}

// dev/测试环境未配 KIMI_AUTH_URL 时（中文路径 + 空值），new URL 会抛 Invalid URL 崩掉 dev server
// 保护：非法/缺失时延迟到真正校验时再抛业务错误
let jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null
function getJwks() {
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(new URL(`${env.kimiAuthUrl}/api/.well-known/jwks.json`))
  }
  return jwks
}

async function verifyAccessToken(
  accessToken: string,
): Promise<{ userId: string; clientId: string }> {
  const { payload } = await jose.jwtVerify(accessToken, getJwks());
  const userId = payload.user_id as string;
  const clientId = payload.client_id as string;
  if (!userId) {
    throw new Error("user_id missing from access token");
  }
  return { userId, clientId };
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    console.warn("[auth] No session cookie found in request.");
    throw Errors.forbidden("Invalid authentication token.");
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }
  // access JWT 只证明身份；会话行（未撤销、未过期）才是登录态的裁决者
  const authSession = await findValidAuthSession(claim.sid);
  if (!authSession) {
    throw Errors.forbidden("Session expired or revoked. Please re-login.");
  }
  const user = await findUserByUnionId(claim.unionId);
  if (!user) {
    throw Errors.forbidden("User not found. Please re-login.");
  }
  return user;
}

/** 从请求推导本站回调地址（只信自己的 origin，不信客户端传入） */
function selfRedirectUri(req: Request): string {
  const url = new URL(req.url);
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || url.host;
  return `${proto}://${host}/api/oauth/callback`;
}

function buildAuthorizeUrl(redirectUri: string, state: string): string {
  const url = new URL(`${env.kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", env.appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);
  return url.toString();
}

/**
 * OAuth 起点（GET /api/oauth/begin）：
 * 服务端生成 CSPRNG 随机 state 并落库（10 分钟有效、一次性），
 * 然后 302 到授权页——state 不再由前端构造，登录 CSRF 防线的第一环。
 */
export function createOAuthBeginHandler() {
  return async (c: Context) => {
    const redirectUri = selfRedirectUri(c.req.raw);
    const state = randomBytes(32).toString("hex");
    await createOAuthState(state, redirectUri);
    void pruneExpiredOAuthStates();
    return c.redirect(buildAuthorizeUrl(redirectUri, state), 302);
  };
}

export function createOAuthCallbackHandler() {
  return async (c: Context) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");
    const errorDescription = c.req.query("error_description");

    if (error) {
      if (error === "access_denied") {
        return c.redirect("/", 302);
      }
      return c.json(
        { error, error_description: errorDescription },
        400,
      );
    }

    if (!code || !state) {
      return c.json({ error: "code and state are required" }, 400);
    }

    // --- state 校验：存在、未过期、未使用；原子消费防重放 ---
    const row = await findOAuthState(state);
    if (!row) {
      return c.json({ error: "invalid state" }, 400);
    }
    if (row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      return c.json({ error: "state expired or already used" }, 400);
    }
    const consumed = await consumeOAuthState(state);
    if (consumed !== 1) {
      return c.json({ error: "state replay detected" }, 400);
    }
    // redirect_uri 必须等于 begin 时本站推导并绑定的地址
    const redirectUri = row.redirectUri;
    if (redirectUri !== selfRedirectUri(c.req.raw)) {
      return c.json({ error: "redirect uri mismatch" }, 400);
    }

    try {
      const tokenResp = await exchangeAuthCode(code, redirectUri);
      const { userId } = await verifyAccessToken(tokenResp.access_token);
      const userProfile = await kimiUsers.getProfile(tokenResp.access_token);
      if (!userProfile) {
        throw new Error("Failed to fetch user profile from Kimi Open");
      }

      await upsertUser({
        unionId: userId,
        name: userProfile.name,
        avatar: userProfile.avatar_url,
        lastSignInAt: new Date(),
      });
      const user = await findUserByUnionId(userId);
      if (!user) {
        throw new Error("User provisioning failed");
      }

      // 建可撤销会话（30d）+ 短期 access JWT（2h）
      const sid = randomUUID();
      await createAuthSession(sid, user.id);
      const token = await signSessionToken({
        unionId: userId,
        clientId: env.appId,
        sid,
      });

      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      return c.redirect("/", 302);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      return c.json({ error: "OAuth callback failed" }, 500);
    }
  };
}

export { exchangeAuthCode, verifyAccessToken };
