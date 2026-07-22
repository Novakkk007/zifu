/**
 * 紫微斗数引擎黄金命例测试（北派-全书安星法）
 *
 * fixture 验证方式：手工按《紫微斗数全书》安星口诀推盘后，
 * 与独立实现 iztro（全书安星法）全量对拍 300 例一致
 * （命宫/身宫/五行局/十四主星/辅星/四化/大限区间逐项比对），
 * 从中抽取 4 例固化为黄金命例。
 */
import { describe, expect, it } from "vitest";
import { Solar } from "lunar-typescript";
import {
  locateZiwei,
  paipanZiwei,
  MAJOR_STARS,
  PALACE_NAMES,
  SIHUA,
  HUA_ORDER,
  type ZiweiChartData,
  type ZiweiInput,
} from "@contracts/engines/ziwei-core";

function paipan(input: ZiweiInput): ZiweiChartData {
  return paipanZiwei(input).data;
}

function palaceAt(chart: ZiweiChartData, branch: string) {
  const p = chart.palaces.find((x) => x.branch === branch);
  if (!p) throw new Error(`缺少宫位 ${branch}`);
  return p;
}

const majorNames = (chart: ZiweiChartData, branch: string) =>
  palaceAt(chart, branch).majors.map((s) => s.name).sort();
const minorNames = (chart: ZiweiChartData, branch: string) =>
  palaceAt(chart, branch).minors.map((s) => s.name).sort();

describe("locateZiwei 商数定位法（含补数规则）", () => {
  it.each([
    // [生日, 局数, 期望支序(子=0)] —— 全书安紫微歌诀表值
    [1, 2, 1], // 水二局初一：丑（补1为奇，商1-1=0 → 寅前一位）
    [2, 2, 2], // 水二局初二：寅
    [3, 2, 2], // 水二局初三：寅（补1，商2-1=1）
    [4, 2, 3], // 水二局初四：卯
    [1, 4, 11], // 金四局初一：亥（补3为奇，商1-3=-2）
    [2, 4, 4], // 金四局初二：辰（补2为偶，商1+2=3）
    [1, 5, 6], // 土五局初一：午（补4为偶，商1+4=5）
    [1, 6, 9], // 火六局初一：酉（补5为奇，商1-5=-4）
    [2, 6, 6], // 火六局初二：午（补4为偶，商1+4=5）
    [5, 5, 2], // 土五局初五：寅（整除，商1）
    [15, 4, 4], // 金四局十五：辰（补1，商4-1=3）
    [25, 5, 6], // 土五局廿五：午（整除，商5）
  ])("生日 %i ÷ 局数 %i → 支序 %i", (day, ju, expected) => {
    expect(locateZiwei(day, ju)).toBe(expected);
  });
});

describe("黄金命例（手工安星核验）", () => {
  it("命例A：甲子年(1984)正月初一 子时 男 —— 命宫丙寅 火六局 紫微居酉", () => {
    const c = paipan({ calendar: "lunar", year: 1984, month: 1, day: 1, hourBranch: 0, gender: "male", currentYear: 2026 });
    expect(c.yearGanzhi).toBe("甲子");
    expect(c.mingBranch).toBe("寅");
    expect(c.shenBranch).toBe("寅"); // 命身同宫
    expect(c.mingGongGanzhi).toBe("丙寅");
    expect(c.ju).toEqual({ name: "火六局", num: 6, nayin: "炉中火" });
    expect(c.ziweiBranch).toBe("酉");
    expect(c.tianfuBranch).toBe("未");
    expect(c.mingZhu).toBe("禄存"); // 命宫支寅
    expect(c.shenZhu).toBe("火星"); // 年支子
    // 主星宫位（紫微系逆布 + 天府系顺布）
    expect(majorNames(c, "酉")).toEqual(["紫微", "贪狼"]);
    expect(majorNames(c, "申")).toEqual(["天机", "太阴"]);
    expect(majorNames(c, "未")).toEqual(["天府"]);
    expect(majorNames(c, "午")).toEqual(["太阳"]);
    expect(majorNames(c, "巳")).toEqual(["武曲", "破军"]);
    expect(majorNames(c, "丑")).toEqual(["七杀", "廉贞"]);
    expect(majorNames(c, "辰")).toEqual(["天同"]);
    expect(majorNames(c, "戌")).toEqual(["巨门"]);
    expect(majorNames(c, "亥")).toEqual(["天相"]);
    expect(majorNames(c, "子")).toEqual(["天梁"]);
    expect(majorNames(c, "寅")).toEqual([]); // 命宫无正曜
    // 辅星
    expect(minorNames(c, "寅")).toEqual(["天马", "火星", "禄存"]);
    expect(minorNames(c, "辰")).toEqual(["左辅", "文曲"]);
    expect(minorNames(c, "戌")).toEqual(["右弼", "文昌", "铃星"]);
    expect(minorNames(c, "丑")).toEqual(["天魁", "陀罗"]);
    expect(minorNames(c, "卯")).toEqual(["擎羊", "红鸾"]);
    expect(minorNames(c, "亥")).toEqual(["地劫", "地空"]);
    // 生年四化（甲：廉贞禄、破军权、武曲科、太阳忌）
    expect(c.sihua).toEqual([
      { star: "廉贞", hua: "禄", branch: "丑", palaceName: "兄弟" },
      { star: "破军", hua: "权", branch: "巳", palaceName: "田宅" },
      { star: "武曲", hua: "科", branch: "巳", palaceName: "田宅" },
      { star: "太阳", hua: "忌", branch: "午", palaceName: "官禄" },
    ]);
    // 大限：阳男顺行，起限 6 虚岁
    expect(c.daxian.direction).toBe("顺行");
    expect(c.daxian.startAge).toBe(6);
    expect(c.daxian.steps[0]).toMatchObject({ branch: "寅", palaceName: "命宫", startAge: 6, endAge: 15, ganzhi: "丙寅" });
    expect(c.daxian.steps[1]).toMatchObject({ branch: "卯", palaceName: "父母", startAge: 16, endAge: 25 });
  });

  it("命例B：庚午年(1990)五月初五 卯时 女 —— 命宫己卯 土五局 紫府同宫居寅", () => {
    const c = paipan({ calendar: "lunar", year: 1990, month: 5, day: 5, hourBranch: 3, gender: "female", currentYear: 2026 });
    expect(c.yearGanzhi).toBe("庚午");
    expect(c.mingBranch).toBe("卯");
    expect(c.shenBranch).toBe("酉");
    expect(c.mingGongGanzhi).toBe("己卯");
    expect(c.ju.name).toBe("土五局");
    expect(c.ju.num).toBe(5);
    expect(c.ziweiBranch).toBe("寅");
    expect(c.tianfuBranch).toBe("寅"); // 紫府同宫
    expect(majorNames(c, "寅")).toEqual(["天府", "紫微"]);
    expect(majorNames(c, "卯")).toEqual(["太阴"]); // 命宫主星
    expect(majorNames(c, "酉")).toEqual(["天同"]);
    expect(majorNames(c, "子")).toEqual(["破军"]);
    expect(c.mingZhu).toBe("文曲"); // 命宫支卯
    expect(c.shenZhu).toBe("火星"); // 年支午
    // 辅星
    expect(minorNames(c, "未")).toEqual(["天钺", "文昌", "文曲", "陀罗"]);
    expect(minorNames(c, "申")).toEqual(["地空", "天马", "左辅", "禄存"]);
    expect(minorNames(c, "丑")).toEqual(["天魁"]);
    expect(minorNames(c, "午")).toEqual(["右弼", "铃星"]);
    expect(minorNames(c, "辰")).toEqual(["火星"]);
    // 四化（庚：太阳禄、武曲权、太阴科、天同忌）
    expect(c.sihua).toEqual([
      { star: "太阳", hua: "禄", branch: "亥", palaceName: "财帛" },
      { star: "武曲", hua: "权", branch: "戌", palaceName: "疾厄" },
      { star: "太阴", hua: "科", branch: "卯", palaceName: "命宫" },
      { star: "天同", hua: "忌", branch: "酉", palaceName: "迁移" },
    ]);
    // 大限：阳女逆行，起限 5 虚岁
    expect(c.daxian.direction).toBe("逆行");
    expect(c.daxian.steps[0]).toMatchObject({ branch: "卯", palaceName: "命宫", startAge: 5, endAge: 14 });
    expect(c.daxian.steps[1]).toMatchObject({ branch: "寅", palaceName: "兄弟", startAge: 15, endAge: 24 });
    expect(c.daxian.steps[2]).toMatchObject({ branch: "丑", palaceName: "夫妻", startAge: 25, endAge: 34 });
  });

  it("命例C：庚子年(2020)闰四月十五 子时 男 —— 闰月按当月计，命宫辛巳 金四局 天梁坐命", () => {
    const c = paipan({ calendar: "lunar", year: 2020, month: 4, day: 15, hourBranch: 0, gender: "male", isLeapMonth: true, currentYear: 2026 });
    expect(c.yearGanzhi).toBe("庚子");
    expect(c.lunar).toEqual({ year: 2020, month: -4, day: 15, isLeapMonth: true });
    // 闰四月十五 → 公历 2020-06-06（lunar-typescript 换算）
    expect(c.solar).toEqual({ year: 2020, month: 6, day: 6 });
    expect(c.mingBranch).toBe("巳");
    expect(c.mingGongGanzhi).toBe("辛巳");
    expect(c.ju.name).toBe("金四局");
    expect(c.ju.num).toBe(4);
    expect(c.ziweiBranch).toBe("辰");
    expect(majorNames(c, "辰")).toEqual(["天相", "紫微"]);
    expect(majorNames(c, "巳")).toEqual(["天梁"]); // 命宫主星
    expect(c.mingZhu).toBe("武曲"); // 命宫支巳
    expect(c.shenZhu).toBe("火星"); // 年支子
    // 四化（庚）
    expect(c.sihua).toEqual([
      { star: "太阳", hua: "禄", branch: "丑", palaceName: "财帛" },
      { star: "武曲", hua: "权", branch: "子", palaceName: "疾厄" },
      { star: "太阴", hua: "科", branch: "丑", palaceName: "财帛" },
      { star: "天同", hua: "忌", branch: "亥", palaceName: "迁移" },
    ]);
    // 阳男顺行，金四局起限 4
    expect(c.daxian.direction).toBe("顺行");
    expect(c.daxian.steps[0]).toMatchObject({ branch: "巳", palaceName: "命宫", startAge: 4, endAge: 13 });
    expect(c.daxian.steps[1]).toMatchObject({ branch: "午", palaceName: "父母", startAge: 14, endAge: 23 });
  });

  it("命例D：公历2000-01-01 午时 男 —— 农历己卯年冬月廿五，命宫庚午 土五局 紫微坐命", () => {
    const c = paipan({ calendar: "solar", year: 2000, month: 1, day: 1, hourBranch: 6, gender: "male", currentYear: 2026 });
    // 公历 → 农历 1999 年十一月廿五（lunar-typescript）
    expect(c.lunar).toEqual({ year: 1999, month: 11, day: 25, isLeapMonth: false });
    expect(c.yearGanzhi).toBe("己卯");
    expect(c.mingBranch).toBe("午");
    expect(c.mingGongGanzhi).toBe("庚午");
    expect(c.ju.name).toBe("土五局");
    expect(c.ziweiBranch).toBe("午"); // 紫微坐命
    expect(majorNames(c, "午")).toEqual(["紫微"]);
    expect(majorNames(c, "寅")).toEqual(["天相", "武曲"]);
    expect(majorNames(c, "戌")).toEqual(["天府", "廉贞"]);
    expect(c.mingZhu).toBe("破军"); // 命宫支午
    expect(c.shenZhu).toBe("天同"); // 年支卯
    // 四化（己：武曲禄、贪狼权、天梁科、文曲忌）
    expect(c.sihua).toEqual([
      { star: "武曲", hua: "禄", branch: "寅", palaceName: "财帛" },
      { star: "贪狼", hua: "权", branch: "子", palaceName: "迁移" },
      { star: "天梁", hua: "科", branch: "卯", palaceName: "子女" },
      { star: "文曲", hua: "忌", branch: "戌", palaceName: "官禄" },
    ]);
    // 阴男逆行，起限 5
    expect(c.daxian.direction).toBe("逆行");
    expect(c.daxian.steps[0]).toMatchObject({ branch: "午", palaceName: "命宫", startAge: 5, endAge: 14 });
    expect(c.daxian.steps[1]).toMatchObject({ branch: "巳", palaceName: "兄弟", startAge: 15, endAge: 24 });
  });

  it("公历输入与等价农历输入结果一致", () => {
    // 2020-06-06 = 庚子年闰四月十五
    const a = paipan({ calendar: "solar", year: 2020, month: 6, day: 6, hourBranch: 0, gender: "male", currentYear: 2026 });
    const b = paipan({ calendar: "lunar", year: 2020, month: 4, day: 15, hourBranch: 0, gender: "male", isLeapMonth: true, currentYear: 2026 });
    expect(a.lunar).toEqual(b.lunar);
    expect(a.mingBranch).toBe(b.mingBranch);
    expect(a.palaces).toEqual(b.palaces);
  });
});

describe("生年四化表全量（十干）", () => {
  // 1984 甲子 … 1993 癸酉 覆盖十干；固定月日时，仅年干影响四化
  const years = [1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993];
  it.each(years.map((y, i) => ({ y, stemIdx: i })))(
    "$y 年四化与十干四化诀一致（落宫随星）",
    ({ y, stemIdx }) => {
      const c = paipan({ calendar: "lunar", year: y, month: 6, day: 15, hourBranch: 4, gender: "male", currentYear: 2026 });
      const expectStars = SIHUA[stemIdx];
      expect(c.sihua).toHaveLength(4);
      c.sihua.forEach((entry, i) => {
        expect(entry.star).toBe(expectStars[i]);
        expect(entry.hua).toBe(HUA_ORDER[i]);
        // 落宫确为该星所在宫
        const p = palaceAt(c, entry.branch);
        const star = [...p.majors, ...p.minors].find((s) => s.name === entry.star);
        expect(star?.hua).toBe(entry.hua);
        expect(entry.palaceName).toBe(p.name);
      });
    },
  );
});

describe("大限方向（阳男阴女顺行，阴男阳女逆行）", () => {
  it.each([
    { year: 1984, gender: "male" as const, dir: "顺行" }, // 甲（阳）男
    { year: 1984, gender: "female" as const, dir: "逆行" }, // 阳女
    { year: 1985, gender: "male" as const, dir: "逆行" }, // 乙（阴）男
    { year: 1985, gender: "female" as const, dir: "顺行" }, // 阴女
  ])("$year 年 $gender → $dir", ({ year, gender, dir }) => {
    const c = paipan({ calendar: "lunar", year, month: 3, day: 8, hourBranch: 2, gender, currentYear: 2026 });
    expect(c.daxian.direction).toBe(dir);
    const second = c.daxian.steps[1];
    if (dir === "顺行") {
      // 顺行：第二限入父母宫（命宫顺行一宫）
      expect(second.palaceName).toBe("父母");
      expect(second.branchIdx).toBe((c.mingBranchIdx + 1) % 12);
    } else {
      // 逆行：第二限入兄弟宫
      expect(second.palaceName).toBe("兄弟");
      expect(second.branchIdx).toBe((c.mingBranchIdx + 11) % 12);
    }
    // 起限虚岁 = 五行局数，每限十年
    expect(c.daxian.steps[0].startAge).toBe(c.ju.num);
    for (let i = 0; i < 12; i++) {
      expect(c.daxian.steps[i].startAge).toBe(c.ju.num + i * 10);
      expect(c.daxian.steps[i].endAge).toBe(c.ju.num + i * 10 + 9);
    }
  });
});

describe("闰月处理", () => {
  it("农历闰月输入：month 记负、警告说明、按当月安星", () => {
    const res = paipanZiwei({ calendar: "lunar", year: 2020, month: 4, day: 15, hourBranch: 0, gender: "male", isLeapMonth: true, currentYear: 2026 });
    expect(res.data.lunar.month).toBe(-4);
    expect(res.meta.warnings.some((w) => w.includes("闰月"))).toBe(true);
    // 同年闰四月与四月（非闰）安星一致（闰月按当月计）
    const normal = paipan({ calendar: "lunar", year: 2020, month: 4, day: 15, hourBranch: 0, gender: "male", isLeapMonth: false, currentYear: 2026 });
    expect(res.data.mingBranch).toBe(normal.mingBranch);
    expect(res.data.palaces).toEqual(normal.palaces);
  });

  it("公历落在闰月的日期同样按当月安星并给出警告", () => {
    // 2020-05-23 = 闰四月初一
    const l = Solar.fromYmd(2020, 5, 23).getLunar();
    expect(l.getMonth()).toBe(-4);
    const res = paipanZiwei({ calendar: "solar", year: 2020, month: 5, day: 23, hourBranch: 3, gender: "female", currentYear: 2026 });
    expect(res.data.lunar.month).toBe(-4);
    expect(res.meta.warnings.some((w) => w.includes("闰月"))).toBe(true);
  });
});

describe("确定性与不变量", () => {
  const input: ZiweiInput = { calendar: "lunar", year: 1993, month: 8, day: 20, hourBranch: 7, gender: "female", currentYear: 2026 };

  it("同一输入两次排盘 data 完全一致（确定性，无随机源）", () => {
    const a = paipanZiwei(input);
    const b = paipanZiwei(input);
    expect(a.data).toEqual(b.data);
  });

  it("EngineResult 信封：北派 variant / validated / 溯源齐全", () => {
    const res = paipanZiwei(input);
    expect(res.meta.engine).toBe("ziwei");
    expect(res.meta.ruleVariant).toBe("北派紫微-全书安星法");
    expect(res.meta.precision).toBe("validated");
    expect(res.meta.algorithmVersion).toBe("ziwei-core@1.0.0");
    expect(res.meta.provenance.length).toBeGreaterThanOrEqual(9);
    expect(res.meta.provenance.every((p) => p.source.includes("紫微斗数全书"))).toBe(true);
  });

  it.each([
    { calendar: "lunar" as const, year: 1984, month: 1, day: 1, hourBranch: 0, gender: "male" as const, currentYear: 2026 },
    { calendar: "lunar" as const, year: 1990, month: 5, day: 5, hourBranch: 3, gender: "female" as const, currentYear: 2026 },
    { calendar: "solar" as const, year: 2000, month: 1, day: 1, hourBranch: 6, gender: "male" as const, currentYear: 2026 },
    input,
  ])("不变量：十四主星各居一宫不重复、十二宫完整（%j)", (inp) => {
    const c = paipan(inp);
    // 十四主星：每颗恰好出现一次
    const allMajors = c.palaces.flatMap((p) => p.majors.map((s) => s.name));
    expect(allMajors).toHaveLength(14);
    expect(new Set(allMajors)).toEqual(new Set(MAJOR_STARS));
    // 十二宫完整：地支全覆盖、宫名全覆盖、干支有效
    expect(c.palaces).toHaveLength(12);
    expect(new Set(c.palaces.map((p) => p.branch)).size).toBe(12);
    expect(new Set(c.palaces.map((p) => p.name))).toEqual(new Set(PALACE_NAMES));
    for (const p of c.palaces) {
      expect(p.ganzhi).toBe(`${p.stem}${p.branch}`);
      expect(p.daxian.endAge - p.daxian.startAge).toBe(9);
    }
    // 命宫/身宫唯一
    expect(c.palaces.filter((p) => p.isMing)).toHaveLength(1);
    expect(c.palaces.filter((p) => p.isShen)).toHaveLength(1);
    expect(palaceAt(c, c.mingBranch).isMing).toBe(true);
    expect(palaceAt(c, c.shenBranch).isShen).toBe(true);
    // 大限 12 步覆盖全部宫位且首尾相接
    expect(c.daxian.steps).toHaveLength(12);
    expect(new Set(c.daxian.steps.map((s) => s.branchIdx)).size).toBe(12);
    // 四化恰为 禄权科忌 各一
    expect(c.sihua.map((s) => s.hua)).toEqual(["禄", "权", "科", "忌"]);
  });
});
