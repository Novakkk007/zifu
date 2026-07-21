# 神煞注册表 v2（shensha-rules）

> 代码位置：`contracts/bazi-core/rules/shensha.ts`（`SHENSHA_REGISTRY`，12 条）。
> 版本：RULESET 1.1.0（条目 `rulesetVersion` 字段与库版本同步，有测试断言）。
>
> v2 要点：
> - 每条神煞为结构化条目：`ruleId / name / variant / inputBasis / targetPosition /
>   multipleHitPolicy / rulesetVersion / verse / source / modernExplanation / testFixtures`。
> - **多命中策略统一为 `list-all`**：同一神煞命中多柱时，`BaziChartV2.shensha`
>   中出现多条记录（每柱一条 `{ name, pillar, char, ... }`），禁止合并为布尔。
>   示例：天乙贵人同时命中年支与日支 → 2 条 `name='天乙贵人'` 记录。
> - `verse`（原始口诀）与 `source`（传统出处）为后台字段，保留在类型中，前端可选择不展示。
> - `modernExplanation` 为前台简洁说明：原创、注明「传统」、无迷信断言。
> - 每条 ≥1 个测试夹具，由 `api/bazi-core/shensha-registry.test.ts` 逐条执行。

## 12 煞总表

| ruleId | 名称 | 流派变体 | 口诀 | 起例（inputBasis） | 命中柱位（targetPosition） | 多命中策略 | 测试夹具（四柱 → 命中） |
|---|---|---|---|---|---|---|---|
| shensha.tianyi.v1 | 天乙贵人 | 「甲戊庚牛羊」通行歌诀版（古歌另有变体，不取） | 甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎，此是贵人方。 | 日干（dayStem） | 四柱地支（anyBranch） | list-all | 辛丑/辛卯/甲寅/庚午 → 年支；辛亥/辛卯/丁酉/庚戌 → 年支+日支 |
| shensha.wenchang.v1 | 文昌贵人 | 通行歌诀版 | 甲乙巳午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见兔入云梯。 | 日干（dayStem） | 四柱地支 | list-all | 乙巳/戊寅/甲午/甲子 → 年支 |
| shensha.taiji.v1 | 太极贵人 | 通行歌诀版 | 甲乙生人子午中，丙丁鸡兔定亨通，戊己两干临四季，庚辛寅亥禄丰隆，壬癸巳申偏喜美。 | 日干（dayStem） | 四柱地支 | list-all | 戊午/庚申/甲子/乙丑 → 年支+日支 |
| shensha.taohua.v1 | 桃花（咸池） | 日支起例（兼顾年支）通行版 | 申子辰在酉，寅午戌在卯，巳酉丑在午，亥卯未在子。 | 日支（dayBranch） | 四柱地支 | list-all | 甲子/丁卯/戊寅/壬子 → 月支 |
| shensha.yima.v1 | 驿马 | 日支起例（兼顾年支）通行版 | 申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳。 | 日支（dayBranch） | 四柱地支 | list-all | 甲寅/壬申/壬子/庚子 → 年支 |
| shensha.huagai.v1 | 华盖 | 日支起例（兼顾年支）通行版 | 申子辰见辰，寅午戌见戌，巳酉丑见丑，亥卯未见未。 | 日支（dayBranch） | 四柱地支 | list-all | 甲子/丙寅/庚午/丙戌 → 时支 |
| shensha.yangren.v1 | 羊刃 | 阳刃为主、阴干刃在辰戌丑未并存流派说（按禄前一位并录） | 甲刃在卯，丙戊刃在午，庚刃在酉，壬刃在子；阴干刃在辰戌丑未（流派之说）。 | 日干（dayStem） | 四柱地支 | list-all | 辛丑/辛卯/甲寅/庚午 → 月支 |
| shensha.lushen.v1 | 禄神 | 通行版（十干禄） | 甲禄在寅，乙禄在卯，丙戊禄在巳，丁己禄在午，庚禄在申，辛禄在酉，壬禄在亥，癸禄在子。 | 日干（dayStem） | 四柱地支 | list-all | 辛丑/辛卯/甲寅/庚午 → 日支 |
| shensha.kongwang.v1 | 空亡 | 以日柱旬空为准（年柱旬空流派不取） | 甲子旬中戌亥空，甲戌旬中申酉空，甲申旬中午未空，甲午旬中辰巳空，甲辰旬中寅卯空，甲寅旬中子丑空。 | 日柱旬（dayJiazi） | 年月时支（nonDayBranch） | list-all | 辛丑/辛卯/甲寅/庚午 → 年支；甲子/丙寅/甲子/庚午 → 不命中 |
| shensha.tiande.v1 | 天德贵人 | 通行歌诀版（正丁二坤宫） | 正丁二坤（申）宫，三壬四辛同，五亥六甲上，七癸八寅逢，九丙十居乙，子巳丑庚中。 | 月支（monthBranch） | 四柱天干或地支（anyStemOrBranch） | list-all | 甲寅/丙寅/戊申/丁巳 → 时干；甲子/丁卯/戊午/庚申 → 时支 |
| shensha.yuede.v1 | 月德贵人 | 三合月德通行版 | 寅午戌月在丙，申子辰月在壬，亥卯未月在甲，巳酉丑月在庚。 | 月支（monthBranch） | 四柱天干（anyStem） | list-all | 戊子/甲寅/戊午/丙辰 → 时干 |
| shensha.jiangxing.v1 | 将星 | 日支起例（兼顾年支）通行版 | 申子辰见子，寅午戌见午，巳酉丑见酉，亥卯未见卯。 | 日支（dayBranch） | 四柱地支 | list-all | 甲子/癸酉/辛巳/戊子 → 月支 |

## 输出类型（v2，破坏性变更）

```ts
interface ShenshaHit {
  ruleId: string            // 对应注册表 ruleId
  name: string
  pillar: string            // 单次命中的柱位：'年支' | '月支' | '日支' | '时支' | '年干' | ...
  char: string              // 命中字
  variant: string           // 流派变体标注
  basis: string             // 起例说明
  verse: string             // 原始口诀（后台字段）
  source: string            // 传统出处（后台字段）
  modernExplanation: string // 前台现代化说明（原创）
  rulesetVersion: string
}
```

- v1 的 `hitPositions: string[]` / `hitChars: string[]` / `rule` / `explanation` 已移除；
  同一神煞多命中由「一条记录数组字段」改为「多条记录」。
- 时辰未知时神煞仍按三柱计算（凡起例不涉及未知数据者），命中不涉及时柱。

## 测试
- `api/bazi-core/shensha-registry.test.ts`：注册表元数据（12 条、ruleId 唯一、版本同步）+
  12 个 describe 逐煞执行 `testFixtures`。
- `api/bazi-core/shensha.test.ts`：真实命盘命中断言 + 天乙贵人双柱多命中（2023-04-05 癸卯年癸巳日 → 年支+日支 2 条记录）。
