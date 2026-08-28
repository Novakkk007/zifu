# 来源记录 — bazi-skill（八字 skill 交叉校验源）

- 仓库：https://github.com/jinchenma94/bazi-skill（四柱八字命理分析 Skill）
- 许可证：MIT License（可复用，借结构/口诀不引原文）
- 复核日期：2026-08-29（吸收轮）
- 复核结论：✅ 通过（作为「二级独立口径交叉校验源」吸收；**未引发任何规则改动**）
- 复核代理：Hermes 每日吸收循环

## 吸收定性

本仓库是一套 Claude Code 用八字 skill：`SKILL.md` + `references/`（shensha-table / dayun-rules /
classical-texts / shichen-table / wuxing-tables）+ `scripts/pai_pan.py`（排盘脚本，自称「唯一神煞口径」）。

对紫府的价值定位：**独立于 zhenyi / mingyu 的又一份 MIT 神煞查法源**，用于交叉校验紫府
`contracts/bazi-core/rules/shensha.ts`（SHENSHA_RULESET_VERSION，40 种）的**普通神煞**口径——
紫府此前以稀缺神煞为主做了对拍（zhenyi+mingyu），本库补齐了常见神煞的一处独立对照。

## 交叉校验结论（逐项核对）

紫府普通神煞规则的查法与 bazi-skill 高度一致，**绝大多数口径吻合**（不逐一列，代表性对照）：

| 神煞 | 紫府（shensha.ts） | bazi-skill（shensha-table.md） | 结论 |
|---|---|---|---|
| 天乙贵人（庚） | 庚→{丑,未}（《渊海子平》通行歌诀版，variant 已明示不用「庚辛逢马虎」变体） | 庚→{丑,未,寅,午}（取「甲戊庚牛羊」与「庚辛逢虎马」**并集**，pai_pan.py L152） | ⚠️ 口径差异，紫府胜 |
| 华盖 / 驿马 / 劫煞 / 灾煞 / 亡神 / 桃花 | 三合局本位（X×局见墓/驿/劫/灾/亡/沐） | 同三合局本位 | ✅ 一致 |
| 天德 / 月德 | 按月起天干 | 同（月支三合起天德/月德） | ✅ 一致 |
| 羊刃 / 禄神 / 金舆 | 按日干查支 | 同 | ✅ 一致 |
| 孤辰 / 寡宿 | 按年支 | 同 | ✅ 一致 |
| 空亡（旬空） | 按日柱所在旬 | 同 | ✅ 一致 |
| 元辰 | 分阴阳年×男女双表 | 同（阳男阴女/阴男阳女双表） | ✅ 一致 |
| 血刃 / 天医 | 长生态位 | 同 | ✅ 一致 |
| 大运顺逆 | 阳男阴女顺、阴男阳女逆 | 同 | ✅ 一致 |
| 起运年龄 | 数到节 ÷3 | 同（十二节列表一致） | ✅ 一致 |
| 时辰（子时归属） | 紫府用 `dayRollover: 'zichu'`（子初换日，23:00） | bazi-skill 用**夜子时归次日**（23:00 后次日） | ✅ 一致（子初换日） |

### 关键发现：天乙贵人「庚」的双表口径差异

- **紫府**：`庚 → 丑未`（《渊海子平》「甲戊庚牛羊」**通行歌诀版**）。variant 字段已明示
  「古歌另有『甲戊兼牛羊，庚辛逢马虎』变体，本库不取」——即熟知此变体但**有意不取通行版**。
- **bazi-skill**：`庚 → 丑未 + 寅午`（把「庚辛逢虎马」并进庚，pai_pan.py L152）。

判定：以**问真八字金标**为准。紫府 `wenzhen-paipan-audit.ts` 对拍 **四柱/神煞/综合 100%**，
已证明紫府「庚→丑未」通行版与问真实现一致；bazi-skill 的「庚→并集」属于把**变体诗并集过度放缩**
的二级来源写法，为过度包容、非通行权威口径。**故不采用 bazi-skill 的庚并集写法，维持紫府现状，
不 bump 规则集版本、不改断言。**

## 应用（第三段落地）

本期为**交叉校验型吸收**，原则「借结构、不引原文、不因二级源覆盖已对拍一致的实现」：

1. **未改动** `contracts/bazi-core/rules/shensha.ts` —— 天乙贵人庚维持问真对拍一致的通行版。
2. **未新增断言** —— 二级源不充当黄金真值，避免把 bazi-skill 的并集写法固化进测试。
3. **留存本交叉校验记录**（本 SOURCE.md），使「普通神煞 vs 独立 MIT 源」的对拍结论可追溯。

## 保持 watch（recorded，未吸收）

- `miounet11/life-kline`（Apache-2.0）：`assets/data/celebrity_cases.json` 含名人生辰数据，
  但生日精确到「时」多为排盘工具推定值、**非权威**，不适合作对拍金标夹具（红线：不编造来源）。
- `ziweiknows/ziwei-chart`（GPL-3.0）：GPL 传染 + 紫微真太阳时超出本期 bazi-core 重点。watch。

## 相关引用

- 神煞规则集：`contracts/bazi-core/rules/shensha.ts`（SHENSHA_RULESET_VERSION）
- 问真对拍框架：`api/bazi-core/wenzhen-paipan-audit.ts`（npm run audit:wenzhen）
- 神煞对拍出生例：`api/bazi-core/shensha-paipan-audit.ts`
- 上一批稀缺神煞交叉校验：`docs/absorbed/scarce-shensha-reference/SOURCE.md`（zhenyi+mingyu）
- 复核源全文留档：`F:/紫府文件/tasks/absorb/repos/bazi-skill-review/`
