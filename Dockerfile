# syntax=docker/dockerfile:1
# 紫府 全栈一体化生产镜像
# 阶段1: vite build（前端 -> dist/public）+ esbuild 打包 api/boot.ts -> dist/boot.js（ESM，全量 bundle）
# 阶段2: 仅生产依赖 + dist + 迁移资产，非 root 运行
# 详细说明见 docs/guides/deploy.md

########## Stage 1: build ##########
FROM node:22-bookworm-slim AS build
WORKDIR /app

# 先复制依赖清单，最大化利用层缓存
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 再复制源码构建
COPY . .

# VITE_* 在构建期固化进前端 bundle，运行时修改无效；部署时用 --build-arg 覆盖
ARG VITE_APP_ID=""
ARG VITE_KIMI_AUTH_URL=""
ENV VITE_APP_ID=${VITE_APP_ID} \
    VITE_KIMI_AUTH_URL=${VITE_KIMI_AUTH_URL}

RUN npm run build

########## Stage 2: runtime ##########
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

# 仅生产依赖。实测结论：dist/boot.js 已被 esbuild 全量 bundle（约 3.1MB，
# 仅 node 内置模块外置），但 mysql2 内部存在可选动态 require（require('mysql2/promise') 等），
# 且 drizzle 迁移需要 drizzle-orm/mysql2/dotenv，因此保留生产 node_modules 是最稳妥方案。
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# drizzle-kit 位于 devDependencies，--omit=dev 后不存在；
# 全局安装同版本 drizzle-kit 以便容器内执行数据库迁移：docker exec <c> drizzle-kit migrate
# drizzle.config.ts 中 import "dotenv/config" 可正常解析（dotenv 是生产依赖）。
RUN npm install -g drizzle-kit@0.31.8 --no-audit --no-fund && npm cache clean --force

# 构建产物 + 迁移资产（db/migrations SQL 与 drizzle 配置）
COPY --from=build /app/dist ./dist
COPY db ./db
COPY drizzle.config.ts ./drizzle.config.ts

# 非 root 运行（node 官方镜像内置 uid=1000 的 node 用户）
USER node

# 默认端口；平台注入 PORT 时以环境变量为准（api/boot.ts: process.env.PORT || 3000）
ENV PORT=3000
EXPOSE 3000

# 存活探针：/healthz 进程存活即 200（就绪探针 /readyz 含数据库检查，供流量切换前验收）
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# 注意：NODE_ENV 必须为 production，否则 boot.ts 不启动监听、进程秒退（见 deploy.md 常见坑）
CMD ["node", "dist/boot.js"]
