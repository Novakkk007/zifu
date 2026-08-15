# 紫府自动化搭建方案 · Hermes 枢纽架构

> 2026-08-16 定稿 · 执行负责人：Hermes · 批准：用户
> 本文档是跨 agent 协作的自动化框架说明书，与 `docs/specs/charter-v1.md`（三模型宪章）配套。

## 一、架构总览

```
用户（验收官）
│  每周 1-2 次：看外网链接 + 效果截图 + 一句话批复
│
▼
┌─────────────── Hermes 枢纽（控制中枢）───────────────┐
│ 大脑：当前可用模型（deepseek 系），不依赖外部 key       │
│ 职责：拆任务 / 派活 / 验收 / 合并 / 部署 / 日报        │
│ 机制：cron 定时巡检 + 文件总线（F:\紫府文件\tasks\）    │
└──────┬──────────────────┬──────────────────┘
       │ CLI 驱动          │ CLI 驱动
       ▼                  ▼
  ┌─ Codex 工人 ─┐   ┌─ OpenClaw 工人 ─┐
  │ 已认证 ChatGPT │   │ DashScope 千问    │
  │ 任务：src/api  │   │ 任务：文档/数据/   │
  │ 实现、修复、    │   │ 测试用例、文案、   │
  │ 审计报告        │   │ 独立小功能        │
  └───────────────┘   └──────────────────┘
       │ 产出写回 outbox
       ▼
  CI gates（GitHub）四道门 → 合并 → gh-pages 部署 → 用户验收
```

**Kimi 桌面应用**：留在链条外，作为用户的私人战略顾问（它在平台有完整对话历史与项目上下文）。用户在其中讨论大方向后，把结论贴给 Hermes，由 Hermes 写入仓库文档。链条不依赖、不阻塞它。

## 二、分工表

| 角色 | 大脑 | 领地（任务类型） | 驱动方式 |
|---|---|---|---|
| **Hermes** | 当前可用模型 | contracts 引擎/历法算法、任务拆解、调度、PR/合并/部署、日报 | 自身 |
| **Codex** | ChatGPT（已认证） | src/api 集成实现、bug 修复、独立审计、E2E 脚本 | `codex exec` headless |
| **OpenClaw** | DashScope 千问 | 文档整理、数据/词条、测试用例扩充、文案 | `openclaw` CLI headless |
| **CI** | — | 四道门（check/lint/test/build）+ audit，合并唯一闸门 | GitHub Actions |
| **用户** | — | 效果确认、战略决策、金标准则裁决 | 聊天框 |

**规则**：算法正确性 Hermes 管，实现细节 Codex 干，资料整理 OpenClaw 包，能否上线 CI 说了算，方向用户拍板。

## 三、单轮工作流（任务从生到死）

```
1. 需求产生（用户提 / Hermes 发现）→ 拆解成任务卡片 → tasks/inbox/T-xxx.md
   卡片字段：id、标题、领地（hermes/codex/openclaw）、验收标准、
            涉及文件、约束红线、预期测试数、优先级

2. Hermes cron 每 2 小时巡检：
   - inbox 有新卡片 → 按领地派发
     · hermes  → Hermes 自己做
     · codex   → codex exec "读卡片 + 完成任务"
     · openclaw → openclaw 命令派发
   - outbox 有交付 → 验收

3. 验收（Hermes 执行）：
   - 本地跑测试（带 KIMI_AUTH_URL/KIMI_OPEN_URL 占位注入）
   - diff 审查 + 红线检查（术语不进 AI prompt / 无假引文 / CSPRNG）
   - 通过 → 分支 push → 开 PR → CI gates 自动跑

4. CI 绿 → GitHub API squash 合并 → gh-pages 重新部署

5. 日报（每天 9am）：进度汇总 + 验收链接 + 待决策问题
```

**关键设计**：每一轮工人交付都经 CI 硬门——不绿不进 master。外网站点永远只展示验证过的版本。

## 四、调度机制（cron · 24小时执行）

| 任务 | 频率 | 内容 |
|---|---|---|
| 任务流水线 | 每 30min | 派发空闲工人 + 验收 outbox + PR 监视/合并/部署 |
| 每日测试 | 凌晨 3 点 | master 全量测试 + audit 快照 |
| 日报 | 早 9 点 | 进度 + 验收链接 + 决策问题 |

**模型分工（成本最低原则）**：调度/验收/日报用 DeepSeek chat（机械性，≈¥0.5/天）；
复杂推理按需切 Kimi K3；Codex 用 ChatGPT 订阅（边际 0）；OpenClaw 用 DashScope。
工人为后台长任务（15-60min/个），超时 90 分钟收回重派，夜间照常运行。

## 五、文件总线协议（F:\紫府文件\tasks\）

```
tasks/
├── README.md          # 本协议
├── inbox/             # 待派发任务卡片（Hermes 写入，工人认领）
├── outbox/            # 工人交付报告（工人写入，Hermes 验收）
├── accepted/          # 验收通过的任务（归档）
└── log/               # 运行日志
```

- 任务卡片命名：`T-<日期>-<编号>-<领地>.md`（如 `T-20260816-01-codex.md`）
- 工人交付后把卡片移动到 `outbox/`，交付报告附验收证据（测试数、改动文件清单）
- Hermes 验收通过 → 卡片移入 `accepted/`，commit 消息引用任务 ID

## 六、驱动命令速查

```bash
# Codex（headless，工作目录 = 仓库）
codex exec "读 F:/紫府文件/tasks/inbox/T-xxx.md 并完成其中任务"

# OpenClaw（F:\OpenClaw 全局安装）
openclaw "读 F:/紫府文件/tasks/inbox/T-xxx.md 并完成其中任务"

# 测试（必须带环境变量）
KIMI_AUTH_URL=http://127.0.0.1:9999 KIMI_OPEN_URL=http://127.0.0.1:9999 npx vitest run

# 部署（gh-pages）
VITE_BASE=/zifu/ npm run build && npx gh-pages -d dist/public
```

## 七、约束与红线（派发给任何工人时都必须带）

1. 唯一真相源 = GitHub master；一切工作从 master HEAD 拉分支
2. 测试只增不减，删测试须写明理由
3. 术语数据（glossary.json 等）永远不进 AI prompt 链
4. 无假玄学数据、无确定性生死病灾断言、引文仅限公版原文
5. 随机性一律 CSPRNG，禁止 Math.random
6. 交付块固定四要素：基线 SHA / 变更清单 / 验证证据 / 已知缺口
