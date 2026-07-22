import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { sql } from "drizzle-orm";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { createOAuthCallbackHandler } from "./kimi/auth";
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

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

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
    checks.database = "down";
    checks.databaseError = err instanceof Error ? err.message : String(err);
    return c.json({ ok: false, ...checks }, 503);
  }
});

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
