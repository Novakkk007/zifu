# 紫府 Zifu Palace · 综合审查报告

> 审查时间：2026-07-23 ｜ 审查人：Hermes (Windows) ｜ 基线：master @ `d56757e`（v8 + 10 commit + 代码分割+ErrorBoundary）

---

## 一、环境验证（Windows 迁移确认）

| 项目 | 状态 | 说明 |
|---|---|---|
| git 仓库 | ✅ 71 commits | bundle clone 完备，HEAD = `d56757e` |
| npm ci | ✅ 609 packages | Windows npm 10.9.8 + Node 22.23.1 |
| `npm run test` | ✅ **334/334** | 22 test files，9.3s |
| `tsc -b` | ✅ **0 error** | TypeScript 5.9.3 |
| `npm run lint` | ✅ **0 error** | ESLint 9 |
| `npm run build` | ✅ 通过 | Vite 7 frontend + esbuild server |
| `npm run dev` | ✅ :3000 就绪 | healthz OK，tRPC 可达（ping 成功） |
| 路径 | ✅ `F:\紫府文件\zifu-palace\` | F: 盘 1.9TB |

---

## 二、本次会话的代码变更

### ✅ 已完成

| 变更 | 文件 | 效果 |
|---|---|---|
| **代码分割**（React.lazy） | `src/App.tsx` | 主入口 1,495KB → 722KB（**-52%**），15 页面独立分包 |
| **Suspense 加载态** | `src/App.tsx` | 路由切换时显示旋转加载动画，风格对齐金墨主题 |
| **ErrorBoundary** | `src/components/ErrorBoundary.tsx` + `src/main.tsx` | 单组件崩溃不再白屏；提供重试/刷新/调试详情 |
| **git commit** | — | `d56757e` perf: 代码分割 + ErrorBoundary |

### 📦 构建产物对比

```
代码分割前:  index-xxx.js  1,495KB (gzip 455KB)
代码分割后:
  index-xxx.js    722KB (gzip 237KB)  ← 主入口
  index-xxx.js    303KB (gzip 101KB)  ← vendor shared
  Bazi-xxx.js     110KB (gzip  27KB)  ← 八字页
  Ziwei-xxx.js     35KB (gzip  11KB)  ← 紫微页
  Liuyao-xxx.js    35KB (gzip  10KB)  ← 六爻页
  ... 其余页面各 25-35KB
```

---

## 三、优势盘点（本已做得好的）

| 维度 | 评价 |
|---|---|
| 引擎算法 | 🏆 **9 引擎全部真实算法**（八字/六爻/紫微/奇门/大六壬/七政/合盘/合参/灵签），`precision: validated` |
| 测试覆盖 | 🏆 334 测试，覆盖算法边界 + API + 权限 + AI 适配器 |
| 视觉设计 | 🏆 4 套主题（金靛/墨/紫/玄），定制动画（浮符/金呼吸/字形漂移），金墨配色成熟 |
| 前端技术 | ✅ React 19 + Vite 7 + Tailwind + shadcn/ui + Framer Motion + GSAP |
| 后端架构 | ✅ Hono + tRPC 11 + Drizzle ORM + MySQL，结构清晰 |
| 红线合规 | ✅ 不伪造、不断语、不杜撰引文、脱敏——有明确的代码级实施 |
| 游客模式 | ✅ 9 引擎 API 全部 publicQuery，无需注册即可排盘 |
| 跨平台 | ✅ 字体回退栈覆盖 Apple/Windows/Linux/Android |
| SEO 基础 | ✅ `<title>` + `<meta description>` + OG tags + favicon/Apple icon |
| 品牌资产 | ✅ SVG logo（favicon/horizontal/mark）+ ComfyUI 生成候选图 |

---

## 四、与「市场最佳」的差距（需改进）

### 🔴 阻断性（用户看不到 / 搜不到）

| # | 问题 | 影响 | 建议方案 |
|---|---|---|---|
| 1 | **SPA 无 SSR** | 搜索引擎只看到空 `<div id="root">`；百度/搜狗等国内引擎不执行 JS，完全搜不到 | 短期：`vite-plugin-ssr`(Vike) 或 `react-snap` 预渲染；中期：迁移 Next.js |
| 2 | **无 sitemap.xml / robots.txt** | 搜索引擎不知道有哪些页面可爬 | 添加 `public/sitemap.xml` + `public/robots.txt`，随构建自动生成 |
| 3 | **无结构化数据** | 无 Rich Snippets，搜索结果只显示标题链接 | 为 9 引擎页添加 `Schema.org/WebApplication` |

### 🟠 高优先级（体验/维护）

| # | 问题 | 现状 | 建议 |
|---|---|---|---|
| 4 | **无 PWA 支持** | 有 icon 但无 manifest + service worker | `vite-plugin-pwa` 一行配置即可 |
| 5 | **Google Fonts 外链阻塞渲染** | 页头 `<link>` 加载 Noto Serif SC 等 3 字体 | 自托管到 `public/fonts/`，避免跨境 CDN 超时 |
| 6 | **每日时令 /daily（🟠 演示）** | 839 行臃肿组件，混入大量 JS 计算 | 拆分为独立真实算法模块 + API 路由 |
| 7 | **百宝袋 /toolkit（🟠 演示）** | 6 个小工具均为客户端 JS 实现 | 同上，真实化后服务端计算 |
| 8 | **npm audit 18 漏洞** | 1 low / 8 moderate / 9 high（多为 dev 传递依赖） | `npm audit fix` 可修 ~12 个，剩余需手动升级 |
| 9 | **无 per-page meta title** | 所有页面 share `<title>紫府...</title>` | `react-helmet-async` 或 `@tanstack/react-router` |
| 10 | **无 Error Tracking** | 用户遇错只能手动反馈 | Sentry 免费 tier 或自建 |

### 🟡 中优先级（体验加分）

| # | 问题 | 建议 |
|---|---|---|
| 11 | **无 i18n** | 当前全中文，加英文可拓展海外华人市场 |
| 12 | **无社区/分享** | 排盘结果不可分享链接/图片 |
| 13 | **无入门引导** | 新用户面对 11 个引擎不知道从哪里开始 |
| 14 | **无暗色模式自动跟随** | 有主题切换但未跟随系统 `prefers-color-scheme` |
| 15 | **藏经阁内容浅** | 12 部典籍仅 intro，无检索/交叉引用/原文全文 |

---

## 五、「市场最佳」路线图

### Phase 1：地基（本周 ~ 2 天）
```
□ sitemap.xml + robots.txt（自动生成）
□ PWA manifest + service worker（离线支持）
□ 自托管 Google Fonts（消除外链阻塞）
□ per-page <title> + <meta>（react-helmet-async）
□ npm audit fix（修复可修漏洞）
```

### Phase 2：性能壁垒（1 周）
```
□ 分包优化（manualChunks 拆分 vendor/react/trpc）
□ 图片懒加载 + WebP 转换
□ vite-plugin-compression（brotli 额外 -15%）
□ Lighthouse 95+（当前 FCP/LCP 未测但估计 ~80）
```

### Phase 3：内容壁垒（2 周）
```
□ 藏经阁扩展：12→24 部典籍 + 全文检索 + 交叉引用
□ 入门指南：八字入门 / 六爻入门 / etc. 教学页
□ 每日时令真实化：拆出 daily-core，接入真实万年历 API
□ 百宝袋真实化：6 小工具 → 服务端计算
□ 玄学百科：术语辞典（天干/地支/十神...）
```

### Phase 4：SEO + 分发（1 周）
```
□ Vike SSR 或 Next.js 迁移（关键页 SSR）
□ Schema.org 结构化数据
□ 分享功能：排盘结果生成图片 → 社交分享
□ Open Graph 各引擎独立封面图
```

### Phase 5：商业化（按需）
```
□ 支付真实接入（微信/支付宝）
□ AI 参详接入真模型（OpenAI/Claude 兼容）
□ 用户画像 + 行为分析（PostHog 自建）
□ 会员体系 + 历史记录导出
```

---

## 六、三路审查分派（更新版）

现在我有完整的代码分割改进和审查发现，以下是给 Codex + Kimi 的最终分派指令：

### 给 Codex 的审查指令

```markdown
# 紫府 Zifu Palace · 工程审查（Codex）

你收到的是完整源码包（348 文件，已包含代码分割+ErrorBoundary）。

## 必审 5 项

1. **构建分包审计**
   - `vite.config.ts` 无 manualChunks，vendor chunk 仍 722KB
   - 建议：提具体 manualChunks 方案（react/vendor/trpc/framer 独立拆）

2. **npm audit 处置**
   - 18 vulnerabilities，逐个评估是否可以 `npm audit fix`
   - 标注哪些有 breaking changes

3. **支付骨架安全**
   - `api/billing-router.ts` + `api/queries/*ts`
   - PAYMENT_ENABLED 硬闸是否所有路径一致？
   - 幂等键 `idempotencyKey` 是否正确防重复？

4. **AI 注入面**
   - `api/services/ai.ts` buildPrompt：用户生辰直接拼入 prompt 有无注入风险？
   - AI 返回内容到前端前有无 XSS 消毒？

5. **输入校验覆盖**
   - 所有 `*-router.ts` 的 Zod schema 覆盖度
   - 是否有原始 `req.body` 直接使用（绕过 Zod）的入口？

## 输出格式
每项：`[文件:行号] 严重度(HIGH/MED/LOW) 发现 + 建议`
```

### 给 Kimi 的审查指令

```markdown
# 紫府 Zifu Palace · 中文内容审查（Kimi）

你有 10 个 md 投喂模块。请审查以下面向用户的中文内容。

## 必审 4 项

1. **AI 参详提示词**（ai-frameworks.ts）
   - 九术解读框架是否覆盖各自核心术语？
   - 有没有暗示"算命/预测"的句式？

2. **藏经阁典籍**（books.json）
   - 12 部 intro "成书背景+内容纲要"是否准确？
   - 3 条原文节选是否公版（无现代杜撰）？

3. **全局红线巡视**
   - 所有对客文案是否有"命中注定"、"必有大灾"等绝对断语？
   - 演示级功能（🟠 每日时令、百宝袋）页面标注是否诚实？

4. **fallback 模板**（ai.ts fallbackReading）
   - 各引擎降级文案是否可读、不误导？
   - 是否明确标注 "AI 未配置，当前为模板解读"？

## 输出格式
每条：`[文件:行号] 问题：描述 + 修改建议`
```

---

## 七、我接下来的工作

1. **等 Codex + Kimi 审查结果** → 汇总去重，分严重度
2. **Phase 1 地基改进** → sitemap / PWA / fonts / per-page title
3. **Windows 外网隧道** → 装 cloudflared，起生产构建，公开预览
4. **每日时令真实化** → 当前代码已有 base（ganzhi.ts + almanac.ts），主要是 UI 重构 + API 化
5. **提交综合报告给 Mac Hermes** → 同步代码分割等改进回 Mac 仓库

---

*审查报告由 Hermes (Windows) 生成于 2026-07-23。项目代码位于 `F:\紫府文件\zifu-palace\`，dev server 保持运行于 `localhost:3000`。*
