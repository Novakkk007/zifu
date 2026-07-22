import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { sql } from "drizzle-orm";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { createOAuthBeginHandler, createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

/** 已注册的核心引擎/业务路由（readyz 汇报用；显式列举避免依赖 tRPC 内部结构） */
const REGISTERED_ROUTERS = [
  "auth",
  "bazi",
  "liuyao",
  "ziwei",
  "daliuren",
  "qizheng",
  "qimen",
  "hepan",
  "hecan",
  "draws",
  "ai",
  "billing",
  "account",
  "feedback",
];

/**
 * 安全响应头（全站）。
 * CSP 允许 self + inline style（Tailwind/shadcn 运行时内联样式所需）
 * + data:/blob: 图片（SVG 资产与图表）；脚本仅 self。
 * HSTS 仅在生产环境下发（预览/开发常为 http）。
 */
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("X-Frame-Options", "DENY");
  c.header(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  if (env.appEnv === "production") {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
});

/**
 * 请求体限额（分级）：
 * - 反馈提交 64KB（标题+描述+复现步骤足够）
 * - 其余 API 256KB（排盘/AI/订单均为小 JSON；历史 50MB 属于过度放行）
 * 静态资源与 GET 不受影响。
 */
const KB = 1024;
app.use("/api/trpc/feedback.submit", bodyLimit({ maxSize: 64 * KB }));
app.use("/api/*", bodyLimit({ maxSize: 256 * KB }));

/**
 * CORS：本应用前后端同源部署，默认不签发任何 CORS 头（跨域请求浏览器自然拦截）。
 * 仅当 CORS_ALLOWED_ORIGINS 显式配置白名单（逗号分隔）时才对 /api/* 放行，
 * 且仅放行白名单 origin（allowlist，绝不用 *）。
 */
const corsAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (corsAllowedOrigins.length > 0) {
  const { cors } = await import("hono/cors");
  app.use(
    "/api/*",
    cors({ origin: corsAllowedOrigins, credentials: true, maxAge: 600 }),
  );
}

/**
 * 存活探针：进程存活即 200。
 * 部署平台（Render 等）健康检查可指向此路径。
 */
app.get("/healthz", (c) =>
  c.json({
    ok: true,
    env: env.appEnv,
    preview: env.isPreview,
    commitSha: env.commitSha,
    ts: Date.now(),
  }),
);

/**
 * 就绪探针：数据库可连接 + 引擎已注册 + 环境正确才 200，否则 503。
 * 用于部署后验收与流量切换前的就绪判断。
 */
app.get("/readyz", async (c) => {
  const checks: Record<string, unknown> = {
    env: env.appEnv,
    preview: env.isPreview,
    commitSha: env.commitSha,
    routers: REGISTERED_ROUTERS,
    paymentEnabled: env.paymentEnabled,
    aiBillingEnabled: env.aiBillingEnabled,
  };
  try {
    await getDb().execute(sql`SELECT 1`);
    checks.database = "up";
    return c.json({ ok: true, ...checks });
  } catch (err) {
    // 脱敏：不向访客暴露数据库异常原文（含连接串/主机等敏感信息），仅记录服务端日志
    console.error("[readyz] database check failed:", err);
    checks.database = "down";
    return c.json({ ok: false, ...checks }, 503);
  }
});

app.get("/api/oauth/begin", createOAuthBeginHandler());
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
