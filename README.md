# 紫府 Zifu Palace · 古籍数字化 AI 推演平台

以《周易》《滴天髓》《三命通会》等公版术数典籍原文为知识根基的术数推演平台。
按次计费、无订阅。东方玄学 × 现代极简。

> 古籍数字化 · AI 参详 — 仅供文化研究与体验，不构成任何决策建议。

当前版本：**v13**（2026-08-16）—— V11 全引擎真实化 + V12 精密历法+时区+拆chunk + V13 术语词典+个人中心+命盘保存+E2E。功能真实度总表见 `docs/feature-status.md`。

## 功能清单

### 九引擎推演系统
- **八字（Bazi）**：立春换年、真实节气换月、子时换日、真太阳时、五虎遁/五鼠遁、大运顺逆与精确起运、十神/藏干/纳音/十二长生、合冲刑害破、日主旺衰量化、扶抑用神、神煞注册表、袁天罡称骨
- **六爻（Liuyao）**：铜钱起卦、装卦、世应、六亲、动爻、变卦、用神、旺衰、旬空、月建、日辰、飞伏、游魂、归魂
- **紫微（Ziwei）**：命盘排布、十四主星、六吉六煞、四化、宫位、大限流年、小限、流年四化
- **奇门（Qimen）**：转盘/飞盘、置闰、超神、接气、阴阳遁、八门、九星、八神、三奇六仪、值符值使、格局判断
- **大六壬（Daliuren）**：课体、三传、四课、天地盘、神将、贵人、发用、课格、类象、占断
- **七政（Qizheng）**：七政四余、星命推演、宫位、星曜、相位、大限流年、小限
- **合盘（Hecan）**：八字合婚、紫微合盘、六爻合盘、命理匹配度分析
- **合参（Hepan）**：多术综合分析、交叉验证、优势互补、矛盾调和
- **灵签（Draws）**：古籍灵签库、抽签算法、解签逻辑、签文匹配

### 个人中心
- 收藏管理：保存喜欢的推演结果、命盘、签文
- 历史记录：自动保存所有推演历史，支持搜索和筛选
- 偏好设置：个性化界面主题、默认推演参数、通知设置

### 命盘保存
- 自动保存：每次推演完成后自动保存到个人历史
- 手动收藏：一键收藏重要命盘结果
- 历史管理：按时间、类型、关键词搜索和管理保存的命盘

## 部署方式

### 本地开发部署
```bash
npm ci               # 锁定依赖（部署环境必须使用 ci，不用 install）
cp .env.example .env # 填入数据库与 OAuth 凭据
npm run db:push      # 同步表结构（或 db:generate + 执行 db/migrations/*.sql）
npm run dev          # 开发（前后端一体，:3000）
```

### 生产部署
```bash
npm run build        # 生产构建（前端 dist/ + 服务端 dist/boot.js）
npm start            # 生产运行
```

### 隧道预览（外网访问）
- 使用 `ngrok` 或类似工具创建隧道：`ngrok http 3000`
- 在 `.env` 文件中设置 `APP_ENV=preview` 和 `PREVIEW_URL=https://your-ngrok-url.ngrok.io`
- 预览模式下支付与 AI 计费强制关闭（fail-closed），页面显示预览横幅
- 隧道预览用于团队协作评审和远程演示

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