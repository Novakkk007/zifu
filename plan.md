# 紫府工程执行计划（滚动更新）

## 已完成
- [x] v1 前端：16 页全量复刻结构 + 原创文案 + 紫府品牌 + 三主题（版本 0746dd3）
- [x] v2 全栈纵切片：OAuth + users/charts/ai_readings + bazi.paipan + ai.reading + 18 测试（版本 05f4578）
- [x] 第二轮代码审计（AUDIT.md，Codex 10 项核实 + 自审 4 项）

## 进行中（第三轮：八字真实纵切片）
- [ ] contracts/bazi-core 共享算法库（真实节气/真太阳时/大运/神煞/称骨 + 边界测试）
- [ ] 后端 bazi.paipan v2 接入共享库 + 权限测试补齐 + 删除死代码 Auth.tsx
- [ ] /bazi 页面重写：服务端驱动 + 人生轨迹图/五行生克/十神明细/专业细盘/称骨/神煞 + AI live-fallback 明示
- [ ] 文档对齐（README/.env.example/docs/api-routes.md）

## 后续
- [ ] 灵签计费与支付（orders/wallet_accounts/wallet_ledger/payment_events + 幂等）
- [ ] 六爻服务端随机源 / 紫微真实安星 / 真实星历服务（七政/天体图）
- [ ] 三术合参真实流程（立命→择术→互证）
