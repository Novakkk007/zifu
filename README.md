# 紫府 Zifu Palace · 古籍数字化 AI 推演平台

以《周易》《滴天髓》《三命通会》等公版术数典籍原文为知识根基的术数推演平台。
按次计费、无订阅。东方玄学 × 现代极简。

> 古籍数字化 · AI 参详 — 仅供文化研究与体验，不构成任何决策建议。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 · TypeScript · Vite 7 · Tailwind CSS 3.4 · shadcn/ui · Framer Motion · GSAP · Lenis |
| 后端 | Hono · tRPC 11 · superjson |
| 数据库 | MySQL · Drizzle ORM |
| 鉴权 | OAuth 2.0（JWT 会话） |
| 算法 | `contracts/bazi-core/` 前后端共用纯函数库 · lunar-typescript（真实节气/农历） |
| AI | OpenAI 兼容协议适配器（环境变量驱动，未配置密钥自动降级模板引擎） |
| 测试 | Vitest（算法边界 + API + 适配器） |

## 快速开始

```bash
npm install
cp .env.example .env   # 填入数据库与 OAuth 凭据
npm run db:push        # 同步表结构
npm run dev            # 开发（前后端一体，:3000）
```

```bash
npm run build          # 生产构建（前端 dist/ + 服务端 dist/boot.js）
npm start              # 生产运行
```

## 验收命令

```bash
npm run check          # TypeScript 全量类型检查
npm run lint           # ESLint
npm run test           # Vitest（算法边界/权限/AI 适配器）
npm run build          # 构建正确性门禁
```

## 目录结构

```
contracts/            前后端共享边界
  bazi-core/          八字算法核心库（单一算法源，RULESET_VERSION 版本化规则注册表）
src/                  前端（页面/组件/主题系统）
api/                  后端 tRPC 路由与服务
  router.ts           路由注册表（见 docs/api-routes.md）
  services/           AI 适配器等
db/                   Drizzle schema 与迁移
docs/                 项目文档
```

## 算法说明

八字排盘规则集中于 `contracts/bazi-core/rules/`（版本化注册表）：
立春换年、真实节气换月、子时换日（可配子初/午夜）、真太阳时（经度+均时差）、
五虎遁/五鼠遁、大运顺逆与精确起运、十神/藏干/纳音/十二长生（阳顺阴逆）、
合冲刑害破、日主旺衰量化、扶抑用神、神煞注册表、袁天罡称骨。

结构评分类可视化（人生轨迹图）为**传统规则结构可视化，不是客观财富、健康或人生结果预测**。

## 演示模式声明

以下模块当前为演示级实现并在页面显著标注，未冒充真实：
七政四余（星历近似）、奇门遁甲、大六壬、紫微斗数安星、六爻随机源（客户端）。
AI 参详在未配置 `AI_API_KEY` 时输出降级模板，界面明示 `fallback` 状态。
