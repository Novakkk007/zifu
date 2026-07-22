# 功能真实度状态总表

标记口径：🟢 已真实接通（服务端真实计算/真实数据）｜🟡 接口骨架（服务端在、外部依赖未配）｜🟠 演示模式（本地近似/哈希 mock，页面有标注）｜🔴 未实现

更新：v8（2026-07-22）—— V7 全引擎真实化 + V8 预览环境/安全硬化

## 引擎层（V7 全部真实化）

| 功能 | 状态 | 说明 |
|---|---|---|
| 八字排盘（算法） | 🟢 | bazi-core 1.1.0：真实节气换年换月、真太阳时、IANA 时区（历史夏令时）、大运精确起运、十神/藏干/纳音/长生/合冲刑害/旺衰量化/扶抑用神/12 神煞注册表（逐柱多命中）/袁天罡称骨 |
| 六爻起卦 | 🟢 | liuyao-core@1.0.0：服务端真实起卦（时间/数字/摇卦），六亲/世应/变卦/伏神全量计算 |
| 紫微斗数安星 | 🟢 | ziwei-core@1.0.0：服务端真实安星，十四主星/辅星/四化/大限流年 |
| 奇门遁甲 | 🟢 | qimen-core@1：服务端真实排盘，转盘奇门、值符值使、九星八门九神 |
| 大六壬 | 🟢 | daliuren-core@1.0.0：服务端真实起课，四课三传/天将/月将加时 |
| 七政四余 | 🟢 | qizheng-core@1：astronomy-engine（VSOP87 级）真实星历，七政四余躔度/命宫/限度 |
| 三术合参 | 🟢 | hecan-core@1：服务端合参引擎（奇门+六壬+六爻互证），探测协议统一注册表 |
| 合盘 | 🟢 | hepan-core@1：双人命盘合参（八字/紫微） |
| 灵签 | 🟢 | draws-core@1：服务端签文库 + 钱包扣费链路 |
| 真实星历服务（天体位置） | 🟢 | astronomy-engine（VSOP87 级精度），替代原近似历表 |
| chart-summary 统一注册表 | 🟢 | ENGINE_SUMMARIZERS：全引擎排盘摘要统一出口，供 AI 参详/合参复用 |

## 账户与安全层（V8 硬化）

| 功能 | 状态 | 说明 |
|---|---|---|
| OAuth 登录 | 🟢 | Kimi OAuth 2.0；**V8：服务端 CSPRNG 一次性 state（oauth_states 表，10 分钟有效，原子消费防重放，redirect_uri 服务端绑定）** |
| 会话管理 | 🟢 | **V8：短期 access JWT（2h，sid claim）+ 可撤销会话行（sessions 表，30d）+ refresh 旋转（撤销旧会话建新会话）+ logout 服务端撤销；删除账户强制下线** |
| 用户表 / 用户中心 | 🟢 | 资料/钱包/订单/命盘/删除账户（**V8 事务化**，反馈匿名化保留） |
| 部署探针 | 🟢 | **V8 新增** `/healthz`（存活+版本）/ `/readyz`（DB SELECT 1 + 路由注册表 + 闸门状态，异常原文脱敏只进服务端日志） |
| 环境闸门 | 🟢 | **V8 新增** APP_ENV（preview/development/production）；`computePaymentEnabled`/`computeAiBillingEnabled` 纯函数 **fail-closed：preview/development 环境无论配置如何强制关闭支付与 AI 计费** |
| 反馈系统 | 🟢 | **V8 新增** 全链路：反馈 widget → feedback 表 → 管理收件箱（状态流转+adminNote）；5 字段全脱敏守卫（生辰日期/农历/干支四柱/时辰）；限流 5 条/10 分钟；分页 |
| 幂等键生成 | 🟢 | **V8**：全部 crypto.randomUUID（CSPRNG），清除 Math.random 残留 |

## 商业化层

| 功能 | 状态 | 说明 |
|---|---|---|
| AI 参详通道 | 🟡 | 服务端摘要+鉴权+额度(20/日)+限频(5/分)+**V8 事务化幂等扣费**+脱敏日志；未配 AI_API_KEY 时降级模板（fallback，界面明示） |
| 灵签钱包/流水 | 🟢 | **V8 事务化**：条件原子扣减（防并发透支）+ 幂等键防重复入账；注册赠 36（一次性幂等） |
| 订单/支付事件/回调幂等 | 🟡 | **V8 事务化**：单事务落事件+条件状态机+充值入账；支付渠道预留，未接真实支付，绝不伪造支付成功；**preview 环境支付强制关闭（fail-closed）** |
| 支付/退款真实链路 | 🔴 | 渠道对接属下一阶段（结构已事务就绪） |

## 数据与工程

| 功能 | 状态 | 说明 |
|---|---|---|
| 命盘历史/删除/重算 | 🟢 | 归属校验；重算生成 chart_versions 快照 |
| 规则/算法版本标注 | 🟢 | RULESET_VERSION + 各引擎 ALGORITHM_VERSION，落库独立字段 |
| 正式 migrations | 🟢 | **V8 新增** db/migrations/0000（12 表全量）+ 0001（feedback.adminNote），SQL 入库纳管 |
| 人生轨迹图（结构分） | 🟢 | 规则化三因子评分（透明可解释），显著免责声明 |
| 每日时令/百宝袋 | 🟠 | 演示级小工具（页面标注） |

## 已清除的历史债（V8）

- 死 mock 删除：`sanshi/qizheng.ts`（mock 引擎）、`sanshi/daliuren.ts`（死代码）；astro.ts 精简为几何/常量工具
- 5 处 Math.random 幂等键 → crypto.randomUUID
- OAuth state 前端自构（base64 redirect，无 CSRF 防护）→ 服务端一次性 state
- JWT 1 年期 → 2h + refresh 旋转
- readyz 泄露 DB 异常原文 → 脱敏
- 钱包/订单/删账户无事务 → 全事务化
