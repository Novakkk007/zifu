# 项目信息（已对齐全栈现状）

## 定位
「紫府 Zifu Palace」古籍数字化 AI 推演平台。公版典籍为根，AI 逐句引经参详，按次计费、无订阅。

## 架构现状（v2 全栈）
- 前端：React 19 + Vite + Tailwind + shadcn/ui（三主题 CSS 变量：墨青/紫檀/玄墨）
- 后端：Hono + tRPC + Drizzle + MySQL + OAuth 鉴权（已嫁接，见 .backend-features.json）
- 算法：contracts/bazi-core 前后端共用纯函数库（lunar-typescript 真实节气/农历）
- AI：OpenAI 兼容适配器，AI_API_KEY 未配置自动降级模板（source=fallback 明示）

## 功能真实度分级
- 已真实接通：OAuth 登录、用户表、八字排盘 API、排盘历史/删除（归属校验）、AI 调用日志
- 演示模式（页面有标注）：紫微安星、七政星历、奇门、大六壬、六爻随机源、合盘评分
- 待接入：灵签计费、支付、真实星历服务

## 合规
全站文案原创；古籍引文均公版典籍并注明出处；结构评分类可视化附免责声明。
