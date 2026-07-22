# 紫府 Zifu Palace · 古籍数字化 AI 推演平台

以《周易》《滴天髓》《三命通会》等公版术数典籍原文为知识根基的术数推演平台。
按次计费、无订阅。东方玄学 × 现代极简。

> 古籍数字化 · AI 参详 — 仅供文化研究与体验，不构成任何决策建议。

当前版本：**v9**（2026-07-22）—— V7 全引擎真实化 + V8 预览环境/安全硬化 + V9 商业化整改（安全头/统一时间协议/AI 硬化/依赖漏洞清零/品牌统一/前端分包）。功能真实度总表见 `docs/feature-status.md`。

## 依赖与 registry 策略（V9）

- 安装/CI 使用内部镜像 registry（锁文件记录）；**安全审计须走官方源**：`npm audit --registry=https://registry.npmjs.org`（镜像未实现 audit 端点）
- 漏洞治理原则：不执行 `npm audit fix --force`；逐项升级 + 四关验证；嵌套传递依赖用 `package.json` `overrides` 收敛
- 当前基线：`npm audit` 与 `npm audit --omit=dev` 均为 **0 vulnerabilities**

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 · TypeScript · Vite 7 · Tailwind CSS 3.4 · shadcn/ui · Framer Motion · GSAP · Lenis |
| 后端 | Hono · tRPC 11 · superjson |
| 数据库 | MySQL · Drizzle ORM（正式 migrations：`db/migrations/`） |
| 鉴权 | OAuth 2.0 · 服务端一次性 state（防 CSRF/重放）· 短期 JWT（2h）+ 可撤销会话（30d）+ refresh 旋转 |
| 算法 | `contracts/bazi-core/` + `contracts/engines/`（liuyao/ziwei/qimen/daliuren/qizheng/hecan/hepan/draws 八引擎，前后端共用纯函数库）· lunar-typescript · astronomy-engine（VSOP87 级星历） |
| AI | OpenAI 兼容协议适配器（环境变量驱动，未配置密钥自动降级模板引擎） |
| 测试 | Vitest（342 项：算法边界 + API + 适配器 + 安全硬化 + 商业化事务） |

## 快速开始

```bash
npm ci               # 锁定依赖（部署环境必须使用 ci，不用 install）
cp .env.example .env # 填入数据库与 OAuth 凭据
npm run db:push      # 同步表结构（或 db:generate + 执行 db/migrations/*.sql）
npm run dev          # 开发（前后端一体，:3000）
```

```bash
npm run build        # 生产构建（前端 dist/ + 服务端 dist/boot.js）
npm start            # 生产运行
```

## 环境闸门（V8）

| 变量 | 说明 |
|---|---|
| `APP_ENV` | `preview` / `development` / `production`；preview/development 下支付与 AI 计费 **fail-closed 强制关闭**，与开关配置无关 |
| `PAYMENT_ENABLED` | 支付闸门（仅 production 且显式 `true` 才开启） |
| `AI_BILLING_ENABLED` | AI 计费闸门（preview/development 强制关闭） |
| `COMMIT_SHA` | 部署版本标识（兼容 `RENDER_GIT_COMMIT`），显示于 /healthz 与页脚 |

部署探针：`GET /healthz`（存活+版本）· `GET /readyz`（DB 连通 + 路由注册表 + 闸门状态，异常原文脱敏只进服务端日志）。

## 验收命令

```bash
npm run check        # TypeScript 全量类型检查
npm run lint         # ESLint
npm run test         # Vitest（342 项全绿为门禁）
npm run build        # 构建正确性门禁
```

## 目录结构

```
contracts/            前后端共享边界
  bazi-core/          八字算法核心库（RULESET_VERSION 1.1.0 版本化规则注册表）
  engines/            八引擎：liuyao/ziwei/qimen/daliuren/qizheng/hecan/hepan/draws-core
src/                  前端（页面/组件/主题系统/反馈 widget/预览横幅）
api/                  后端 tRPC 路由与服务
  router.ts           路由注册表（14 路由，见 docs/api-routes.md）
  kimi/               OAuth（一次性 state）/ 会话（短期 JWT + refresh 旋转）
  queries/            事务化数据访问（钱包/订单/会话）
  services/           AI 适配器 · chart-summary 统一引擎摘要注册表
db/                   Drizzle schema 与正式 migrations
docs/                 项目文档
```

## 算法说明

八字排盘规则集中于 `contracts/bazi-core/rules/`（版本化注册表）：
立春换年、真实节气换月、子时换日（可配子初/午夜）、真太阳时（经度+均时差）、
五虎遁/五鼠遁、大运顺逆与精确起运、十神/藏干/纳音/十二长生（阳顺阴逆）、
合冲刑害破、日主旺衰量化、扶抑用神、神煞注册表、袁天罡称骨。

其余七术引擎（六爻/紫微/奇门/大六壬/七政/合盘/合参/灵签）均为服务端真实计算，
版本常量落库于各 chart 的 `algorithmVersion` 字段，全量对照见 `docs/feature-status.md`。

结构评分类可视化（人生轨迹图）为**传统规则结构可视化，不是客观财富、健康或人生结果预测**。

## 演示模式声明

仅「每日时令/百宝袋」小工具为演示级实现并在页面标注。
AI 参详在未配置 `AI_API_KEY` 时输出降级模板，界面明示 `fallback` 状态。
preview/development 环境下支付与 AI 计费强制关闭（fail-closed），预览横幅明示。
