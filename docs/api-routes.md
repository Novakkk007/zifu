# API 路由表（tRPC）

Base: `/api/trpc` · 传输: superjson · 鉴权: OAuth 会话 Cookie（JWT）

| 路由 | 类型 | 鉴权 | 输入 | 输出 | 说明 |
|---|---|---|---|---|---|
| `ping` | query | 公开 | — | `{ ok, ts }` | 健康检查 |
| `auth.me` | query | 登录 | — | `User` | 当前用户 |
| `auth.logout` | mutation | 登录 | — | `{ success }` | 登出 |
| `bazi.paipan` | mutation | 公开（登录则落库+版本快照） | `BirthInput`（公历/农历·闰月/年月日时分/性别/城市/经纬度/IANA时区/真太阳时/换日规则） | `{ chart, chartId, persisted }` | 服务端排盘（bazi-core 1.1.0） |
| `bazi.history` | query | 登录 | — | `Chart[]`（≤50 倒序） | 我的命盘 |
| `bazi.remove` | mutation | 登录 | `{ id }` | `{ success }` | 删除（归属校验） |
| `bazi.recompute` | mutation | 登录 | `{ chartId }` | `{ chart, versionId }` | 按当前规则重算并生成 chart_versions 快照 |
| `ai.reading` | mutation | **登录** | `{ chartId, persona, depth, idempotencyKey? }` | `{ text, source: live\|fallback, model, tokens, latencyMs }` | 服务端从库存命盘构建摘要（不信任客户端数据）；20 次/日 + 5 次/分限流；仅 live 成功扣 1 灵签（幂等）；fallback 免费 |
| `billing.wallet` | query | 登录 | — | `{ balance, transactions[] }` | 钱包余额+流水（新用户一次性发放 36 灵签，幂等） |
| `billing.recharge` | mutation | 登录 | `{ amountFen, idempotencyKey }` | `Order(created)` | **支付渠道预留**：仅落待支付订单，未接真实支付，绝不伪造支付成功 |
| `billing.orders` | query | 登录 | — | `Order[]` | 我的订单（含 refunded/failed 状态） |
| `billing.simulateCallback` | mutation | 管理员 | `{ orderNo, eventId }` | `{ applied, duplicated }` | 支付回调幂等演练通道（payment_events 按 eventId 去重） |
| `billing.adminAuditLogs` | query | 管理员 | — | `AuditLog[]` | 审计日志 |
| `account.deleteAccount` | mutation | 登录 | — | `{ success }` | 删除本人全部数据（命盘/版本/AI日志/钱包/订单）+ 写审计 + 清会话 |

## 错误码约定

| code | 场景 |
|---|---|
| `UNAUTHORIZED` | 未登录（含 ai.reading 游客调用） |
| `FORBIDDEN` | 角色不足 / 灵签余额不足 |
| `BAD_REQUEST` | 输入非法（无效日期、非法闰月组合） |
| `NOT_FOUND` | 记录不存在或不属于当前用户（含越权删除/越权重算/越权解读） |
| `TOO_MANY_REQUESTS` | AI 额度超限（20/日）或频率超限（5/分） |
| `BAD_GATEWAY` | AI 上游异常（超时/非 2xx/返回体异常） |

## 数据表（v6）

| 表 | 说明 |
|---|---|
| `users` | OAuth 用户 |
| `charts` | 命盘记录（含 rulesetVersion / algorithmVersion 独立字段） |
| `chart_versions` | 命盘版本快照（输入/结果 JSON + 规则/算法版本） |
| `ai_readings` | AI 调用日志（脱敏：只记 chartId/chartType/来源/token/耗时，不记生辰） |
| `wallets` | 灵签钱包（balance） |
| `wallet_transactions` | 钱包流水（idempotencyKey 唯一约束防重复入账） |
| `orders` | 订单（orderNo 唯一，status 含 refunded） |
| `payment_events` | 支付回调事件（eventId 唯一约束 = 回调幂等锚点，verified 标记） |
| `audit_logs` | 审计日志（管理操作/账户删除等） |
