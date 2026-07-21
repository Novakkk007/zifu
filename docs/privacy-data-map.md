# 隐私与数据流向图

## 数据分类与存储

| 数据 | 存储位置 | 说明 |
|---|---|---|
| 账户标识（unionId/昵称/邮箱） | `users` | OAuth 建档，删除账户时清除 |
| 生辰输入（年月日时分/城市/经纬度） | `charts.input`（JSON） | 仅登录用户落库；游客排盘不写入 |
| 命盘结果 | `charts.result` / `chart_versions` | 含规则版本，可回溯 |
| AI 解读内容 | 不落库 | 仅返回当次；`ai_readings` 只记元数据 |
| AI 日志元数据 | `ai_readings` | chartId/chartType/persona/depth/来源/token/耗时——**不含生辰与解读原文（脱敏）** |
| 资产数据 | `wallets` / `wallet_transactions` / `orders` / `payment_events` | 幂等键约束 |
| 行为审计 | `audit_logs` | 管理操作/账户删除 |

## 关键流向

1. **排盘**：浏览器 → `bazi.paipan` → 服务端 bazi-core 计算 → 登录则写 `charts` + `chart_versions` → 返回结果。游客：仅计算返回，不落库。
2. **AI 参详**：浏览器（chartId + 人格 + 深度）→ `ai.reading` → 服务端从**库中命盘**构建摘要（客户端不可提交命盘内容）→ 上游模型（若配置密钥）→ 返回解读；写脱敏日志；live 成功才扣灵签。
3. **删除账户**：`account.deleteAccount` → 依次删除本人 charts → chart_versions → ai_readings → wallet + transactions → orders + payment_events → users → 写 audit_log → 清会话 Cookie。

## 承诺

- 日志与 AI 调用不记录生辰原始数据与解读原文
- 命盘类数据仅限本人访问（服务端归属校验，越权 NOT_FOUND）
- 删除账户为物理删除，不可恢复（界面已二次确认）
- 服务条款 `/terms` 与本图保持一致；如有出入以本图为准并修订条款
