# API 路由表（tRPC）

Base: `/trpc` · 传输: superjson · 鉴权: OAuth 会话 Cookie（JWT）

| 路由 | 类型 | 鉴权 | 输入 | 输出 | 说明 |
|---|---|---|---|---|---|
| `ping` | query | 公开 | — | `{ ok, ts }` | 健康检查 |
| `auth.me` | query | 登录 | — | `User` | 当前用户信息 |
| `auth.logout` | mutation | 登录 | — | `{ success }` | 登出（清会话 Cookie） |
| `bazi.paipan` | mutation | 公开（登录则落库） | `BirthInput`（历法/年月日时分/性别/城市/经纬度/真太阳时/闰月/换日规则） | `{ chart, chartId, persisted }` | 服务端八字排盘（bazi-core 真实算法） |
| `bazi.history` | query | 登录 | — | `Chart[]`（≤50，倒序） | 我的排盘历史 |
| `bazi.remove` | mutation | 登录 | `{ id }` | `{ success }` | 删除我的记录（归属校验，越权 NOT_FOUND） |
| `ai.reading` | mutation | 公开 | `{ chartType, chartSummary, persona, depth }` | `{ text, source: live\|fallback, model, tokens, latencyMs }` | AI 参详；无密钥自动降级模板，调用日志落库 |

## 错误码约定

| tRPC code | 场景 |
|---|---|
| `UNAUTHORIZED` | 未登录访问受保护路由 |
| `FORBIDDEN` | 角色不足 |
| `BAD_REQUEST` | 输入非法（如无效日期） |
| `NOT_FOUND` | 记录不存在或不属于当前用户 |
| `BAD_GATEWAY` | AI 上游服务异常（超时/非 2xx/返回体异常） |

## 数据表

| 表 | 说明 |
|---|---|
| `users` | OAuth 用户（unionId/角色/最近登录） |
| `charts` | 排盘记录（userId/类型/输入/结果 JSON，结果含 rulesetVersion） |
| `ai_readings` | AI 调用日志（来源 live/fallback、token、耗时——计费锚点） |
