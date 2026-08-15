# 生产部署指南（Docker）

紫府是前后端一体化应用：Vite 构建前端至 `dist/public`，esbuild 将 `api/boot.ts` 打包为单文件 `dist/boot.js`（ESM、全量 bundle，约 3.1MB），由 Hono + `@hono/node-server` 同进程托管 API 与静态资源。仓库根目录的 `Dockerfile` 采用多阶段构建（node:22 基底），产出可直接运行的生产镜像。

## 一、镜像设计要点

| 项 | 结论 |
| --- | --- |
| 基底镜像 | `node:22-bookworm-slim`（build / runtime 两阶段共用） |
| build 阶段 | `npm ci` → `npm run build`（vite build + esbuild 打包 boot.ts） |
| runtime 阶段 | `npm ci --omit=dev` + 复制 `dist/`、`db/`、`drizzle.config.ts` |
| runtime 依赖结论 | `dist/boot.js` 已全量 bundle，仅 node 内置模块外置；但 mysql2 内部存在可选动态 require（`require('mysql2/promise')` 等），且 drizzle 迁移依赖 `drizzle-orm`/`mysql2`/`dotenv`，故保留生产 `node_modules`（实测最稳妥，勿裁剪为空） |
| 迁移工具 | `drizzle-kit` 属 devDependency，runtime 阶段全局安装同版本 `drizzle-kit@0.31.8` 供容器内迁移 |
| 运行用户 | 非 root（node 官方镜像内置 `node` 用户，uid=1000） |
| 端口 | `EXPOSE 3000`；`api/boot.ts` 读取 `process.env.PORT || 3000`，平台注入 PORT 时自动生效 |
| 启动命令 | `CMD ["node", "dist/boot.js"]`，`ENV NODE_ENV=production` |
| 健康检查 | 镜像内置 `HEALTHCHECK` 打 `/healthz` |

## 二、构建与运行

```bash
# 构建（VITE_* 构建期固化进前端 bundle，按部署环境传入）
docker build \
  --build-arg VITE_APP_ID=<你的OAuth应用ID> \
  --build-arg VITE_KIMI_AUTH_URL=https://auth.kimi.com \
  -t zifu:latest .

# 运行（.env 严禁打进镜像，用 --env-file 或 -e 注入）
docker run -d --name zifu \
  --env-file .env.production \
  -p 3000:3000 \
  zifu:latest

# 验证
curl http://127.0.0.1:3000/healthz   # {"ok":true,...}
curl http://127.0.0.1:3000/readyz    # database=up 才 ok:true
```

## 三、环境变量全表

来源：`api/lib/env.ts`、`.env.example`。标 ★ 的变量在 `NODE_ENV=production` 下缺失即抛错、进程退出。

| 名称 | 必填 | 说明 | 示例 |
| --- | --- | --- | --- |
| `NODE_ENV` | ★（必须 `production`） | 只有 `production` 时 boot.ts 才启动监听；否则进程秒退 | `production` |
| `PORT` | 否 | 监听端口，缺省 3000；Render 等平台自动注入 | `3000` |
| `APP_ENV` | 否 | 部署环境标识：`preview`/`staging`/`production`（缺省 development）。preview/development 下支付与 AI 计费强制 fail-closed | `production` |
| `COMMIT_SHA` | 否 | 部署版本号，注入到 /healthz、/readyz；Render 自动给 `RENDER_GIT_COMMIT` | `e19c169` |
| `APP_ID` | ★ | Kimi OAuth 应用 ID（门户申请） | `19f855f3-xxxx-8000-000072f61336` |
| `APP_SECRET` | ★ | Kimi OAuth 应用密钥 | `<secret>` |
| `KIMI_AUTH_URL` | ★ | Kimi OAuth 授权端 | `https://auth.kimi.com` |
| `KIMI_OPEN_URL` | ★ | Kimi Open API 端 | `https://open.kimi.com` |
| `OWNER_UNION_ID` | 否 | 站点属主 unionId（管理权限判定） | `coeanp1kqq4ttrkvo6s0` |
| `DATABASE_URL` | ★ | MySQL/TiDB 连接串（drizzle + mysql2） | `mysql://user:pass@host:4000/dbname` |
| `PAYMENT_ENABLED` | 否 | 支付总闸（fail-closed）：仅 `APP_ENV=staging\|production` 且显式 `true` 才开放 | `false` |
| `AI_BILLING_ENABLED` | 否 | AI 计费闸：staging/production 缺省开启，显式 `false` 关闭 | `true` |
| `AI_API_KEY` | 否 | AI 参详（OpenAI 兼容协议）；缺省自动降级模板引擎（免费，source=fallback） | `sk-...` |
| `AI_BASE_URL` | 否 | AI 接口地址 | `https://api.openai.com/v1` |
| `AI_MODEL` | 否 | AI 模型 | `gpt-4o-mini` |
| `AI_TIMEOUT_MS` | 否 | AI 请求超时 | `30000` |
| `CORS_ALLOWED_ORIGINS` | 否 | 跨域白名单（逗号分隔）；同源部署留空，默认不放行任何跨域 | `https://example.com` |

**构建期变量（--build-arg，运行时改无效）**：`VITE_APP_ID`、`VITE_KIMI_AUTH_URL` —— vite 构建时固化进前端 bundle，改 OAuth 应用/地址必须重新构建镜像。

## 四、数据库迁移

`db/migrations/` 下为 drizzle-kit 生成的 SQL（当前两个）。镜像内已带 `db/`、`drizzle.config.ts` 与全局 drizzle-kit：

```bash
# 方式一：容器内执行（DATABASE_URL 已注入）
docker exec zifu drizzle-kit migrate

# 方式二：一次性容器执行（与部署解耦，推荐 CI 先行）
docker run --rm --env-file .env.production zifu:latest drizzle-kit migrate

# 方式三：宿主机完整 dev 依赖下执行（本地/CI）
npm run db:migrate
```

## 五、健康检查

| 端点 | 用途 | 语义 |
| --- | --- | --- |
| `GET /healthz` | 存活探针（liveness） | 进程存活即 200，返回 `{"ok":true,"env","preview","commitSha","ts"}` |
| `GET /readyz` | 就绪探针（readiness） | 数据库 `SELECT 1` 通过 + 引擎已注册 + 环境正确才 200，否则 503（`database:"down"`） |

镜像 `HEALTHCHECK` 指向 `/healthz`；编排平台（K8s/Render）建议 liveness 用 `/healthz`、readiness 用 `/readyz`。

## 六、TiDB 连接注意事项

- 协议为 MySQL 兼容，驱动 mysql2，连接串格式 `mysql://user:password@host:4000/database`（TiDB 默认端口 **4000**，不是 3306）。
- **TiDB Serverless 公网连接强制 TLS**：在连接串追加 `?ssl={"rejectUnauthorized":true}`（mysql2 风格 ssl 参数），或走私有网络（如 privatelink endpoint）时在安全组/网络策略放行 4000。
- drizzle 迁移与运行时共用同一 `DATABASE_URL`，迁移容器必须能连通同一数据库。
- 连接串含特殊字符（密码中的 `@`、`/`、`#`）需 URL encode，否则解析错位。

## 七、常见坑（真实踩过）

1. **NODE_ENV 必须是 `production`，否则进程秒退**：`api/boot.ts` 仅在 `isProduction` 时调用 `serve()` 启动监听；NODE_ENV 缺失或非 production 时进程打完模块加载即正常退出（exit 0），容器表现为无限重启且无任何报错日志。Dockerfile 已内置 `ENV NODE_ENV=production`，自行编排（compose/k8s）覆盖 env 时务必保留。
2. **必填环境变量缺失即抛错退出**：`NODE_ENV=production` 下 `APP_ID`/`APP_SECRET`/`DATABASE_URL`/`KIMI_AUTH_URL`/`KIMI_OPEN_URL` 任一缺失，`api/lib/env.ts` 直接 throw。看日志第一行 `Missing required environment variable: XXX` 即是。
3. **`.env` 不进镜像**：`.dockerignore` 已排除 `.env`/`.env.*`；运行时用 `--env-file` 或编排平台 secret 注入。注意 `.env.example` 被 `!.env.example` 显式保留。
4. **静态资源依赖工作目录**：`serveStatic` 使用相对路径 `./dist/public`，必须以 `/app` 为 cwd 启动（镜像 WORKDIR 已保证）；自行 `docker exec ... sh` 手动起进程时注意 cd。
5. **VITE_* 构建期固化**：前端 OAuth 地址写在 bundle 里，运行时改环境变量无效，必须 `--build-arg` 重新构建。
6. **迁移工具不在生产依赖里**：`drizzle-kit` 是 devDependency，runtime 阶段全局安装了一份；勿在容器内跑 `npm run db:migrate`（会找本地 node_modules 的 drizzle-kit），用全局 `drizzle-kit migrate`。
7. **测试环境注入**：本地跑 `npm run test` 需注入 `KIMI_AUTH_URL=http://127.0.0.1:9999 KIMI_OPEN_URL=http://127.0.0.1:9999`（非 production 不强制校验，但部分用例读取）。
