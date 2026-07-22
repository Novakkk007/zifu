import * as jose from "jose";
import { env } from "../lib/env";
import type { SessionPayload } from "./types";

const JWT_ALG = "HS256";

/**
 * access JWT 短期化：2 小时。
 * 真实会话有效期（30d）与撤销由 sessions 表承载——JWT 只证明身份，
 * 每个受信请求都会在 authenticateRequest 中校验会话行未撤销未过期。
 */
export const ACCESS_TOKEN_TTL = "2h";

/** refresh 路径允许的签名宽限：会话行（30d）才是真正的有效期裁决者 */
export const REFRESH_CLOCK_TOLERANCE_SEC = 30 * 24 * 60 * 60;

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.appSecret);
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(secretKey());
}

function toPayload(payload: jose.JWTPayload): SessionPayload | null {
  const { unionId, clientId, sid } = payload;
  if (!unionId || !clientId || !sid) {
    console.warn("[session] JWT payload missing required fields.");
    return null;
  }
  return { unionId, clientId, sid } as SessionPayload;
}

/** 严格校验（受信请求路径）：签名 + 2h 有效期 */
export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    console.warn("[session] No token provided for verification.");
    return null;
  }
  try {
    const { payload } = await jose.jwtVerify(token, secretKey(), {
      algorithms: [JWT_ALG],
    });
    return toPayload(payload);
  } catch (error) {
    console.warn("[session] JWT verification failed:", error);
    return null;
  }
}

/**
 * 宽限校验（仅 refresh/logout 路径使用）：
 * 签名必须有效，但允许过期（上限 30d）——有效期与撤销由 sessions 表裁决。
 */
export async function verifySessionTokenForRefresh(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, secretKey(), {
      algorithms: [JWT_ALG],
      clockTolerance: REFRESH_CLOCK_TOLERANCE_SEC,
    });
    return toPayload(payload);
  } catch (error) {
    console.warn("[session] JWT refresh-path verification failed:", error);
    return null;
  }
}
