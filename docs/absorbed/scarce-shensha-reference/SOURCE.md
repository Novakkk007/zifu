# SOURCE

## 收录内容
`SCARCE_SHENSHA.md` —— 紫府神煞规则集（`contracts/bazi-core/rules/shensha.ts`，v1.4.0，40 种）**尚未收录**的稀缺神煞查法参考表（国印贵人/飞刃/天德合/月德合/披麻/吊客/丧门/十灵日/九丑日/六秀日/八专日/孤鸾煞/天转日/地转日/四废日/拱禄/童子煞/德秀贵人），供后续问真对拍与规则扩展使用。

## 来源仓库（均 MIT，可复用，借结构不引原文）
1. **ZHENYI-ORG/zhenyi-bazi-paipan** (GitHub, MIT, 2026-08-26 更新)
   - 文件：`src/data/shensha-rules.json`（78 规则 / 59 类）、`tests/regression-vectors.json`（8 组真实生辰回归夹具）
   - 口径：结构化神煞规则引擎，与问真八字口径高一致。子代理逐条核对：天乙(双表)/元辰(男丁未女巳)/太极(4表)/驿马/将星/华盖/劫煞/亡神 等与紫府 SHENSHA 现行规则集一致。
2. **Brhiza/mingyu（命语）** (GitHub, packages/core 为 MIT, 2026-08-27 更新)
   - 文件：`packages/core` 的 `baziShenSha`（`variants.ts` 显式 `referenceProfile: 'wenzhen' | 'classical'`，**默认问真 55 项查法**）、`baziShenShaData.ts`（数百项神煞分类表，含太岁/流年系：官符·白虎·吊客·披麻·飞廉·六厄·勾绞·大耗·小耗 等，本日未逐项收录落库，记录在案）
   - 方法论：其《算法依据索引》红线（不整本复制古籍、不伪造命中、不把未实现流派写成既成事实、二手口诀不得直接覆盖现有实现）与紫府吸收红线高度一致，作为范本参考。

## 吸收日期
2026-08-28

## 口径状态（重要红线）
本表为**参考查法**，非已入规则集。凡标注【待问真对拍】者，尚未与紫府「问真八字」金标逐项机器对拍，**不得**直接并入 `shensha.ts` / bump `SHENSHA_RULESET_VERSION` / 用作断言。推荐优先入规则集候选：**国印贵人、月德合**（两源一致 + 已有夹具命中）。

## 可作对拍种子的真实生辰夹具（源自 zhenyi regression-vectors.json，MIT）
| id | 公历 | 时辰 | 性别 | 要点 | 期望稀缺神煞（摘） |
|---|---|---|---|---|---|
| solar-normal | 1990-06-15 | 12:00 | 男 | 真太阳时 | 月德合·十灵日·孤鸾煞·正学堂·天德贵人 |
| west-cross-midnight | 2000-01-01 | 00:05 | 女 | 乌鲁木齐真太阳时跨日 | 德秀贵人·披麻·飞刃·丧门·四废日·孤鸾煞·童子煞 |
| east-late-night | 2000-01-01 | 23:55 | 男 | 真太阳时跨年 | 六秀日·八专日·童子煞·德秀贵人 |
| lichun-before | 2024-02-04 | 16:20 | 女 | 立春前 | 国印贵人·吊客·天德合·月德合·德秀贵人 |
| lichun-after | 2024-02-04 | 17:30 | 男 | 立春后 | 国印贵人·吊客·八专日·天罗·童子煞 |
| lunar-newyear | 2020-01-01 | 12:00 | 女 | 农历春节 | 飞刃·丧门·童子煞 |
| lunar-leap | 2020-04-01 | 08:30 | 男 | 农历闰月 | 飞刃·丧门·天德合·德秀贵人 |
| solar-midnight | — | — | — | （最后一组见源文件 515 行） | — |

完整字段（含 qiyun/jiaoyun/四柱）见源：`F:/紫府文件/tasks/absorb/repos/zhenyi-bazi-paipan/tests/regression-vectors.json`。

## 本日已判定【跳过】的候选（不吸收，记录在案）
- **6tail/lunar-javascript**（1649⭐）——紫府历法引擎依赖的 `lunar-typescript` 即 6tail 官方 TS 移植版，**与紫府历法同源**，建对拍=自己验证自己，无新增金标点。跳过（仅记 watch）。
- **china-testing/bazi**（1487⭐）——`sizi.py` 大量内嵌古籍风格断语 + README 推广现代作者（梁湘润/陆致极/朱鹊桥）付费书 = 版权红线。跳过。
- **chiweng2009/chantuan-shensha**——自称复刻陈抟APP，但训练/评测**真值不在仓库、无法独立验证**，口径与问真多处偏离。仅记 watch，不作为金标。
- **hhszzzz/taibu**（492⭐）——多为 AGPL + 神煞口径多处偏离问真（学堂年柱纳音/词馆临官/天乙表误标）。仅记 watch（其先生prompt 编排可略参考）。

## 相关引用
- 问真八字对拍框架：`api/bazi-core/wenzhen-paipan-audit.ts`（npm run audit:wenzhen）
- 神煞规则集：`contracts/bazi-core/rules/shensha.ts`（SHENSHA_RULESET_VERSION=1.4.0）
