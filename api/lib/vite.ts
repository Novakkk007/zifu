import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { compress } from "hono/compress";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");

  /**
   * gzip 压缩：1.4MB JS bundle → ~400KB，对慢链路（隧道/移动网）是数量级差异。
   * 注册在 serveStatic 之前，洋葱模型下静态响应均经压缩（API 路由在 boot.ts 中
   * 先于本函数注册并已返回，不受影响）。
   */
  app.use("*", compress());

  /** vite 构建产物文件名带内容 hash：长缓存 immutable，二次访问零请求 */
  app.use("/assets/*", async (c, next) => {
    await next();
    if (c.res.status === 200) {
      c.header("Cache-Control", "public, max-age=31536000, immutable");
    }
  });

  app.use("*", serveStatic({ root: "./dist/public" }));

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    return c.html(content);
  });
}
