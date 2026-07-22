# 页面交互矩阵（v9）

状态口径与 docs/feature-status.md 一致：🟢 服务端真实计算/真实数据｜🟡 接口骨架｜🟠 演示（页面有标注）

| 页面 | 路由 | 主要交互 | 数据来源 | 状态标注 |
|---|---|---|---|---|
| 首页 | / | Hero 动效/功能矩阵导航/反馈入口/预览横幅（preview 环境） | 静态+健康探针 | — |
| 八字排盘 | /bazi | 表单（历法/分钟/城市/经纬度/IANA时区/真太阳时/换日规则）→ 排盘 → 摘要带 → 细盘 6 Tabs → 轨迹图节点点击 → AI 详批 → 历史/重算 | tRPC 真实（bazi-core 1.1.0） | 🟢 |
| 八字合盘 | /bazi/hepan | 双人表单 → 对照盘 → 契合分析 | hepan-core@1 服务端真实计算 | 🟢 |
| 三术合参 | /hecan | 合参表单 → 三环图/互证分析 | hecan-core@1 服务端真实计算 | 🟢 |
| 六爻起卦 | /liuyao | 摇币×6（服务端 CSPRNG）→ 本卦变卦 → 卦辞 | liuyao-core@1.0.0 服务端真实起卦 | 🟢 |
| 紫微斗数 | /ziwei | 生辰表单（hour/minute 或兼容 hourBranch、unknownHour）→ 十二宫盘 → 宫位抽屉/大限流年 | ziwei-core@1.0.0 服务端真实安星 | 🟢 |
| 七政四余 | /qizheng | 星环图 → 星曜列表/宫位 | qizheng-core@1 + astronomy-engine（VSOP87 级真实星历） | 🟢 |
| 奇门遁甲 | /qimen | 起局盘（时家转盘·拆补法） | qimen-core@1 服务端真实排盘 | 🟢 |
| 大六壬 | /daliuren | 天地盘/四课三传 | daliuren-core@1.0.0 服务端真实起课 | 🟢 |
| 每日时令 | /daily | 日柱/宜忌/时辰吉凶/月历 | 本地干支算法 | 🟠 演示（页面标注，无商业化精准表述） |
| 百宝袋 | /toolkit | 6 小工具切换 | 前端演示 | 🟠 演示（页面标注） |
| 藏经阁 | /wiki | 分类筛选/典籍抽屉 | 公版典籍节选 | — |
| 主创说 | /talks | 文章阅读 | 静态原创 | — |
| 服务条款 | /terms | 阅读 | 静态 | — |
| 登录 | /login | OAuth 跳转（服务端一次性 state） | OAuth | 🟢 |
| 用户中心 | /account | 资料/钱包/订单/命盘/删除账户/反馈收件箱（管理员） | tRPC 真实（事务化） | 🟢 |

## 通用交互规范
- 按钮 5 变体 × 8 态（default/hover/active/focus/disabled/loading/success/error），防重复提交
- 表单：label/错误/提示齐全，focus 金环，移动 ≥44px 触控
- 弹层：focus trap + ESC + 遮罩点击关闭
- Tabs：滑动 + 键盘箭头
- 全部循环动画尊重 prefers-reduced-motion
- 空态/错误态/加载骨架三态齐全
- 反馈 widget 全站浮动入口（5 字段脱敏守卫 + 限流 5 条/10 分钟）
- preview 环境：预览横幅（版本 + 支付关闭标识）常驻
