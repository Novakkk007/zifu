# V9 商业化整改计划（基于 Codex 对 hermes 基线 1bd84f6 的审查）

## 背景：分叉事实
- Codex 审查对象 = hermes `1bd84f6`（308 文件/334 测试），其 P0 清单≈我已在 `60cf525` 完成的 V8 安全硬化 → hermes 基线不含 V8 硬化，两线分叉
- 本计划以 `60cf525`（342 测试）为基线执行 V9，hermes 的 8 个本地 commit 待用户提供 bundle 后再合并
- 已核实 Codex 验证结论与我的对账一致：348→实际 308 文件、334 测试

## 阶段 0：取证 triage（本人）
核实 Codex 每条问题在本基线的真实状态，输出三分表：✅已完成 / 🆕新工作 / ⚠️部分完成

## 阶段 1：P0 残留（本人，worktree 内直接改）
- simulateCallback 不得接受调用方 verified:true；preview 只允许测试回调，禁止模拟支付成功
- P0 其余 6 项已在 60cf525 完成 → 逐条给出证据回应

## 阶段 2：P1 新增（本人 + coder subagent 并行）
- 反馈：地点/经纬度脱敏补齐、P0/P1 管理员通知机制
- sidebar 骨架视觉随机 → 固定值
- page-interaction-matrix.md 统一至 V8（与 feature-status.md 一致）
- 每日时令/百宝袋：保留演示标识 + 清查商业文案（禁"精准预测/真实择日"）
- 统一输入模型：9 引擎 BirthInput 一致化（calendar/hour/minute/isLeapMonth/ianaTimezone/经纬度/useTrueSolarTime/unknownHour）、Intl.DateTimeFormat 校验 IANA（无效 400）、早晚子时统一、DST 边界测试
- AI 硬化：删客户端 chartSummary 入参、prompt 注入防护、输出长度/schema/HTML-链接过滤、禁杜撰引文、页面不显书名出处、限流改 DB 持久化、日额度原子计数+日界定义、fallback 明示"演示引擎·非 AI 生成"
- 安全头：CSP/HSTS/nosniff/Referrer-Policy/frame-ancestors/CORS allowlist；body limit 50MB→分级（表单 64-256KB）；日志卫生（不记 token/cookie/生辰/模型原文）

## 阶段 3：依赖治理（本人）
- npm audit / --omit=dev / outdated 取证；逐项升级（禁 audit fix --force）；registry 策略记录；Browserslist 更新

## 阶段 4：P2 品牌与性能（coder subagent）
- Logo：读取用户上传的「最终品牌母版」确认稿，BrandLogo 统一渲染，删旧资产，金色 token 化
- 性能：manualChunks + 路由懒加载 + 星历库按需 + 首页不加载全引擎
- 引擎准确性：元数据补全（engine/version/school/precision/ruleset）+ 无法验证项标 approximate/demo；外部样本对拍方案设计

## 阶段 5：验收与交付（本人）
- 四关 + npm audit 双跑 + preview 冒烟（含新增安全头/输入校验/反馈通知）
- 补测试：时区无效/DST/统一输入、AI 注入防护、安全头存在性、simulateCallback verified 拒收
- git archive + MANIFEST.sha256 + bundle + build_version + 逐条验收报告

## 红线
- 不重写已有页面、不伪造功能、不把"测试通过"写成"算法绝对准确"
- 每项改动先取证后动手；删测试换绿禁止
