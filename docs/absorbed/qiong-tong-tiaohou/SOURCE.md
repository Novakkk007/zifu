# 来源记录 — 穷通宝鉴调候查法（Brhiza/mingyu 交叉校验）

- 仓库：https://github.com/Brhiza/mingyu（命语，364⭐）
- 许可证：**packages/core 为 MIT**（`packages/core/LICENSE`）；根目录未见 SPDX，**交叉校验只取 packages/core**
- 复核日期：2026-08-31（吸收轮）
- 复核结论：✅ 通过（作为「穷通宝鉴调候二级系统化口径」吸收；**引发一项参考层落库，未改动已在产的 tiaohou.ts 契约**）
- 复核代理：Hermes 每日吸收循环

## 吸收定性

mingyu 在 `packages/core/src/bazi/baziTherapeuticRules/climateRules/` 提供一套 **10 天干 × 12 月令的系统化调候规则**（132 个 .ts 文件：
jia/yi/bing/ding/wu/ji/geng/xin/ren/gui 各 12 月 + general），每条规则的 `description` / `hint` 明示源自《穷通宝鉴》
（公版古籍，清·余春台整理，作者逝世远超 50 年），并直接引录穷通宝鉴正文短句（如「丙火生子月，壬水为尊，戊土为佐」
「甲木生于子月，三者全透，鼎甲可期」）。

对紫府的价值定位：紫府 `contracts/engines/masters-rules/tiaohou.ts`（TIAOHOU_TABLE，120 格）是一张**五行层级粗蒸馏表**
（春取火/秋取水/夏取水/冬取火 + 若干分干特例），源自库内 `docs/classics/qiong_tong_bao_jian.md`（75 行粗概览）。
mingyu 提供的是**逐干逐月的首要用神 + 次序**（含 年月支判局特例），是穷通宝鉴更接近原书的调候口径。
本日将其作为**参考查法层**落库，供后续先生提示词与调候契约做更精细化的依据；契约本体不经二级源贸然改动（见「口径状态」）。

## 交叉校验结论（逐格抽样对照）

以下为 mingyu「首要用神（favorableOrder[0]）」与紫府 `tiaohou.ts`「need 五行」的对照（月份按十二月令，选取典型格）：

| 日干 | 月令 | 紫府 tiaohou.ts（need） | mingyu/穷通宝鉴（首要次序） | 结论 |
|---|---|---|---|---|
| 甲 | 辰 | 火（春取火） | 金（先取庚金裁木成器） | ⚠️ 口径分歧（粗表春化过度） |
| 甲 | 巳/午 | 水 | 水>火>金（先癸后丁，庚佐） | ✅ 首要用神一致 |
| 甲 | 丑 | 火 | 火>水（先丙后癸） | ✅ 首要用神一致 |
| 丙 | 亥/子/丑 | 木（甲木生扶） | 水>土（壬水为尊，戊土为佐） | ⚠️ 口径分歧（穷通宝鉴为壬/戊） |
| 丁 | 子/丑 | 木 | 木>金（甲木为尊，庚佐） | ✅ 首要用神一致 |
| 壬 | 寅 | 火（spring） | 金（先庚次丙，酌戊） | ⚠️ 口径分歧 |
| 壬 | 亥/子 | 土 | 土>火（戊土为堤，丙佐暖） | ✅ 首要用神一致 |

> 完整逐干逐月纲目见同目录 `TIAOHOU_TABLE.md`（穷通宝鉴口径，mingyu MIT 交叉校验）。

## 口径状态（重要红线）

- 本表为**参考查法**，非已入运行契约。凡与紫府 `tiaohou.ts` 分歧处，是否修约需**再以问真/独立公版原文复核后**再定；
  不因单一二级源覆盖已上线实现在产输出。
- 因分歧集中在「月份边界特例」与「岁运判局」（如甲木辰月当令湿土非春木，穷通宝鉴取庚金裁木），
  属于穷通宝鉴本身的非单一值判局，**不宜**用单值五行表硬套——这正是紫府现行粗表的已知局限，记录在案。
- 现契约 `tiaohou.ts` **本日不动**，相关测试/断言亦不改（第4段要求「改了规则必须改断言」在本期无触发）。

## 应用（第三段落地）

1. **新增参考层**：`docs/absorbed/qiong-tong-tiaohou/TIAOHOU_TABLE.md` —— 穷通宝鉴逐干逐月调候纲目（首要用神+次序+hint），
   引文明示《穷通宝鉴》、交叉校验标记 mingyu(MIT)。
2. **留存本交叉校验记录**（本 SOURCE.md），使「穷通宝鉴调候 vs mingyu(MIT) 系统化口径」的对拍结论可追溯。
3. **未改** `contracts/engines/masters-rules/tiaohou.ts` —— 不经二级源覆盖已上线契约；分歧列为后续修约候选。

## 保持 watch（recorded，未吸收）

- `Brhiza/mingyu` 的 `baziEnhancement/classicPatterns.ts`（《渊海子平》《三命通会》《子平真诠》格局库）——
  格局识别依赖复杂条件匹配器，超出本日聚焦，且其结构在现代判局层，留作后续「格局对拍」候选。
- mingyu 的 神煞（`baziShenSha`）已于 2026-08-28 在 `scarce-shensha-reference/` 收录，本日不重复。

## 相关引用

- 调候契约：`contracts/engines/masters-rules/tiaohou.ts`（TIAOHOU_TABLE）
- 现存穷通宝鉴概览：`docs/classics/qiong_tong_bao_jian.md`（75 行蒸馏）
- 复核源留档：`F:/紫府文件/tasks/absorb/repos/mingyu/`
- 提取脚本：`C:/Users/asus/AppData/Local/hermes/scripts/zifu_mingyu_tiaohou_extract.py`
