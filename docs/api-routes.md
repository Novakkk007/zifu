# API 路由表（tRPC + REST）

Base: `/api/trpc` · 传输: superjson · 鉴权: OAuth 会话 Cookie（短期 JWT + 可撤销会话）

更新：v9（2026-07-22）

## 全局安全策略（V9 新增）

- **安全响应头**（全站）：`Content-Security-Policy`（default-src 'self'，frame-ancestors 'none' 等）、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`X-Frame-Options: DENY`；`Strict-Transport-Security` 仅 production 下发
- **请求体限额（分级）**：`/api/trpc/feedback.submit` 64KB；其余 `/api/*` 256KB（历史 50MB 已收紧）；超限 413
- **CORS**：同源部署默认不签发 CORS 头；仅 `CORS_ALLOWED_ORIGINS`（逗号分隔白名单）显式配置时对 `/api/*` 放行白名单 origin（绝不用 `*`）
- **统一时间协议**（`contracts/engines/time-protocol.ts`）：全引擎 IANA 时区经 `Intl.DateTimeFormat` 运行时校验，**无效时区一律 400**；时辰支序统一 `hourToBranch`（子时 23:00–00:59）换算；紫微优选 `hour(0-23)+minute` 输入，`hourBranch` 降级为兼容字段，`unknownHour` 须显式声明
- **支付事件验签语义**：`processPaymentEvent` 的 `verified` 默认 false（fail-closed）；未验签事件只落库存档，不驱动状态机、不入账；`simulateCallback` 不接受调用方传 verified，payload 强制 `[SIMULATED]` 标记

## REST 端点（非 tRPC）

| 端点 | 说明 |
|---|---|
| `GET /healthz` | 存活探针：`{ ok, env, preview, commitSha, ts }` |
| `GET /readyz` | 就绪探针：DB `SELECT 1` + 14 路由注册表 + 支付/AI 计费闸门状态；异常原文脱敏（只进服务端日志，响应仅 `database:"down"`） |
| `GET /api/oauth/begin` | OAuth 起点：服务端生成 CSPRNG 一次性 state（oauth_states 表，10 分钟有效）+ redirect_uri 服务端绑定，302 至授权页 |
| `GET /api/oauth/callback` | OAuth 回调：state 存在/未过期/未使用校验 → 原子消费（防重放）→ redirect_uri 一致性校验 → token 交换 → 建会话行 + 签 2h JWT |

## tRPC 路由

| 路由 | 类型 | 鉴权 | 说明 |
|---|---|---|---|
| `ping` | query | 公开 | 健康检查 |
| `auth.me` | query | 登录 | 当前用户 |
| `auth.refresh` | mutation | 公开（宽限验 JWT） | 会话旋转：撤销旧 sid 建新 sid，重发 cookie；前端 401 自动续期 |
| `auth.logout` | mutation | 登录 | 服务端撤销会话行 + 清 cookie |
| `bazi.paipan` | mutation | 公开（登录则落库+版本快照） | 服务端排盘（bazi-core 1.1.0 / computeChartV2@1） |
| `bazi.history` / `bazi.remove` / `bazi.recompute` | — | 登录 | 命盘历史/删除（归属校验）/重算（chart_versions 快照） |
| `liuyao.coinToss` / `liuyao.cast` / `liuyao.detail` | — | 公开/公开/登录 | 六爻：摇卦随机源/起卦/详情（liuyao-core@1.0.0） |
| `ziwei.paipan` / `ziwei.detail` | — | 公开/登录 | 紫微安星（ziwei-core@1.0.0）；**V9 统一输入：hour/minute 优选，hourBranch 兼容，unknownHour 显式声明** |
| `qimen.qiju` | mutation | 公开 | 奇门起局（qimen-core@1） |
| `daliuren.qike` | mutation | 公开 | 大六壬起课（daliuren-core@1.0.0） |
| `qizheng.paipan` | mutation | 公开 | 七政四余排盘（qizheng-core@1，astronomy-engine 真实星历） |
| `hepan.analyze` | mutation | 公开 | 合盘（hepan-core@1） |
| `hecan.analyze` | mutation | 公开 | 三术合参（hecan-core@1） |
| `draws.lingqian` | mutation | 登录 | 灵签抽取（draws-core@1，CSPRNG，幂等扣费） |
| `ai.reading` | mutation | 登录 | 服务端从库存命盘构建摘要（**V9：客户端 chartType/chartSummary 废弃字段已删除**）；20 次/日（**按服务器本地日**）+ 5 次/分限流（**V9：数据库计数，多实例一致**）；仅 live 成功扣 1 灵签（事务化幂等）；fallback 免费；**V9：prompt 注入防护（数据隔离+禁引书名/作者/原文）+ 输出净化（HTML/脚本/链接剥除 + 4000 字截断）** |
| `billing.wallet` | query | 登录 | 钱包余额+流水（新用户一次性发放 36 灵签，幂等） |
| `billing.recharge` | mutation | 登录 | **支付渠道预留**：仅落待支付订单；preview 环境 fail-closed 强制关闭 |
| `billing.orders` | query | 登录 | 我的订单 |
| `billing.simulateCallback` | mutation | 管理员 | 支付回调幂等演练（单事务）；**V9：不接受调用方 verified，payload 强制 [SIMULATED] 标记；preview 禁用** |
| `billing.adminAuditLogs` | query | 管理员 | 审计日志 |
| `account.deleteAccount` | mutation | 登录 | **事务化**删除本人全部数据 + 会话强制下线 + 反馈匿名化 + 审计 |
| `feedback.submit` | mutation | 公开 | 反馈提交；5 字段全脱敏守卫（生辰/农历/干支四柱/时辰/**V9：经纬度坐标/出生地**）；限流 5 条/10 分钟；**V9：P0/P1 写审计日志 + 服务端告警（feedback.urgent）** |
| `feedback.list` | query | 管理员 | 反馈收件箱（status 过滤 + limit/offset 分页） |
| `feedback.updateStatus` | mutation | 管理员 | 反馈状态流转 + adminNote |

## 错误码约定

| code | 场景 |
|---|---|
| `UNAUTHORIZED` | 未登录 / 会话已撤销或过期（前端自动 refresh 一次） |
| `FORBIDDEN` | 角色不足 / 灵签余额不足 |
| `BAD_REQUEST` | 输入非法 / OAuth state 伪造、过期、重放、redirect 不匹配 / 反馈含生辰信息 |
| `NOT_FOUND` | 记录不存在或不属于当前用户 |
| `TOO_MANY_REQUESTS` | AI 额度超限（20/日）/ 频率超限（5/分）/ 反馈限流（5 条/10 分钟） |
| `BAD_GATEWAY` | AI 上游异常 |

## 数据表（v8，12 表 · 正式 migrations 纳管）

| 表 | 说明 |
|---|---|
| `users` | OAuth 用户 |
| `oauth_states` | **V8 新增** OAuth 一次性 state（10 分钟过期，usedAt 原子消费防重放） |
| `sessions` | **V8 新增** 可撤销会话行（sid · 30d · revokedAt；refresh 旋转/logout/删账户时撤销） |
| `charts` | 命盘记录（含 rulesetVersion / algorithmVersion 独立字段） |
| `chart_versions` | 命盘版本快照 |
| `ai_readings` | AI 调用日志（脱敏：不记生辰） |
| `wallets` / `wallet_transactions` | 灵签钱包/流水（idempotencyKey 唯一约束；**V8 事务化条件原子扣减**） |
| `orders` / `payment_events` | 订单/支付事件（eventId 唯一 = 回调幂等锚点；**V8 单事务处理**） |
| `audit_logs` | 审计日志 |
| `feedback` | **V8 新增** 用户反馈（feature/severity/route/browser/device/commitSha/algorithmVersion/status/adminNote；删账户时 userId 置 null 匿名化） |
