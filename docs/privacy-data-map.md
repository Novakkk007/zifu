# 隐私与数据流向图

更新：v8（2026-07-22）

## 数据分类与存储

| 数据 | 存储位置 | 说明 |
|---|---|---|
| 账户标识（unionId/昵称/邮箱） | `users` | OAuth 建档，删除账户时清除 |
| OAuth 一次性 state | `oauth_states` | **V8 新增**：10 分钟过期，原子消费后即标记 usedAt；不含个人信息 |
| 会话行（sid/过期/撤销标记） | `sessions` | **V8 新增**：30 天过期；logout/refresh 旋转/删除账户时撤销或删除；JWT 本体 2 小时短期 |
| 生辰输入（年月日时分/城市/经纬度） | `charts.input`（JSON） | 仅登录用户落库；游客排盘不写入 |
| 命盘结果 | `charts.result` / `chart_versions` | 含规则版本，可回溯 |
| AI 解读内容 | 不落库 | 仅返回当次；`ai_readings` 只记元数据 |
| AI 日志元数据 | `ai_readings` | chartId/chartType/persona/depth/来源/token/耗时——**不含生辰与解读原文（脱敏）** |
| 资产数据 | `wallets` / `wallet_transactions` / `orders` / `payment_events` | 幂等键约束 + V8 事务化条件原子扣减 |
| 反馈内容 | `feedback` | **V8 新增**：提交前服务端 5 字段脱敏守卫（阿拉伯日期/农历中文数字/干支四柱连写/时辰+分钟/生于 X 点），含生辰即拒收；删除账户时 userId 置 null **匿名化保留**（用于产品改进，不关联身份） |
| 行为审计 | `audit_logs` | 管理操作/账户删除 |

## 关键流向

1. **OAuth 登录**：`/api/oauth/begin` 服务端生成 CSPRNG state 落库 → 授权页 → callback 校验 state（存在/未过期/未使用 → 原子消费防重放 → redirect_uri 一致性）→ token 交换 → 建会话行（30d）+ 签 2h JWT → cookie。JWT 不含生辰，仅 unionId/clientId/sid。
2. **会话续期**：access JWT 过期 → `auth.refresh`（宽限验签）→ 校验会话行未撤销 → 撤销旧 sid 建新 sid（旋转）→ 新 cookie。logout 服务端撤销会话行，被盗 JWT 两小时后自然失效且 refresh 已旋转。
3. **排盘**：浏览器 → 各引擎路由 → 服务端真实计算 → 登录则写 `charts` + `chart_versions` → 返回结果。游客：仅计算返回，不落库。
4. **AI 参详**：浏览器（chartId + 人格 + 深度）→ `ai.reading` → 服务端从**库中命盘**构建摘要（客户端不可提交命盘内容）→ 上游模型（若配置密钥）→ 返回解读；写脱敏日志；live 成功才扣灵签（事务化幂等）。
5. **反馈**：widget 自动采集 route/UA/视口/commitSha → 服务端脱敏守卫（拒收含生辰内容）→ 限流 → 落 `feedback`；管理员收件箱状态流转。
6. **删除账户**：`account.deleteAccount` **单事务**：charts → chart_versions → ai_readings → wallet + transactions → orders + payment_events → sessions（强制下线）→ feedback.userId 置 null（匿名化）→ users → 写 audit_log → 清会话 Cookie。

## 承诺

- 日志与 AI 调用不记录生辰原始数据与解读原文
- 反馈系统服务端强制脱敏，含生辰内容的反馈直接拒收
- 命盘类数据仅限本人访问（服务端归属校验，越权 NOT_FOUND）
- 删除账户为物理删除（反馈匿名化保留除外），不可恢复（界面已二次确认）
- readyz 探针不向外泄露数据库错误原文（只进服务端日志）
- 服务条款 `/terms` 与本图保持一致；如有出入以本图为准并修订条款
