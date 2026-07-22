# 给代码审查者的上下文说明（REVIEW NOTES）

> 本文档面向接手审查的 AI/工程师，帮助快速建立全局认识，聚焦高价值审查点。

## 项目一句话

紫府 Zifu Palace：以公版术数典籍为知识根基的 **AI 术数推演平台**（React 19 + Hono/tRPC 11 + MySQL/Drizzle + Vite 7 全栈单体）。

## 当前基线状态（本包 = master @ 本地优化轮）

- 九大术数引擎（八字/六爻/紫微/奇门/大六壬/七政四余/合盘/三术合参/观音灵签）全部为**服务端真实算法**，`precision: validated`，非 mock
- 验证基线：`npx tsc -b` 0 error · `npm run lint` 0 error · `npm run test` **334 全绿** · `npm run build` 通过
- 游客模式 9 引擎排盘 API 全部 publicQuery、不触 DB（已实测冒烟 9/9）
- 本地无外网依赖可跑通；OAuth(Kimi)/MySQL/AI_API_KEY 未配时分别降级：游客不可登录 / 不落库 / AI 降级模板

## 本包相对 v8（b905cdf）的新增（本地优化轮 6 commit）

1. `fix: JWKS 惰性构造`——api/kimi/auth.ts 原模块顶层 `new URL`，未配 OAuth 时 import 即崩（阻断性）
2. `feat(ai): 分引擎参详提示词工程`——api/services/ai-frameworks.ts 新增；ai.ts 重写 buildPrompt/fallbackReading
3. `fix(ai): hepan/hecan 落库外壳拆壳分发`——chart-summary.ts 新增 unwrapEngineEnvelope + 2 个摘要函数 + 2 测试
4. `feat(wiki): 藏经阁内容深化`——src/data/books.json（12 部典籍 intro + 公版原文节选）
5. `docs: feature-status 对齐 v8`
6. `chore: 本地脚本`——scripts/smoke.py（9 引擎冒烟）/ shoot-b3.mjs（puppeteer 截图）/ demo-prompt.ts

## 已知待办/弱点（请重点审查这些方向）

| 方向 | 现状 | 期待 |
|---|---|---|
| 每日时令 /daily、百宝袋 /toolkit | 仅余的两个 🟠 演示级模块 | 真实化方案评估 |
| 构建产物 | 单 chunk 3.1MB 警告 | manualChunks 分包策略 |
| 依赖漏洞 | npm audit 18 个（1 low/8 mod/9 high，多为传递依赖） | 处置优先级 |
| 支付链路 | 仅骨架（表/路由/幂等），PAYMENT_ENABLED 硬闸关闭 | 接入前的安全审查 |
| AI 参详 | 提示词已分引擎，但未经真实模型回归测试 | prompt 质量/注入面审查 |
| 输入模型 | hour 以"时辰支"输入（0-11），minute 仅用于真太阳时 | UX 与算法边界审查 |
| dev/prod 差异 | 已修探针路由；其余 vite-dev-server 边界 | 残留差异排查 |

## 审查时请遵守的项目红线

- **不伪造**：引擎缺数据时输出 unavailable 空态，绝不伪造星曜/宫位/度数
- **不断语**：不作生死疾病灾祸确定性断语；归因句式（「按某书之法」）
- **不杜撰引文**：引典只限公版原文；合盘权重为公开模型（非古籍定数）须标注
- 脱敏：日志/反馈不记录生辰原始数据；chartSummary 不含出生信息

## 快速复现

```bash
npm ci                # 依赖（lock 内 registry 已指向 npmmirror，可按需改回）
npm run test          # 334 全绿（DB 被 vi.mock，无需真实 MySQL）
npm run dev           # :3000 前后端一体；游客可排全部 9 引擎
python3 scripts/smoke.py   # 9 引擎 API 冒烟（需 dev server 在跑）
npm run build && npm start # 生产模式（需 APP_ID 等环境变量，见 .env.example）
```
