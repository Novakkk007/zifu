import { describe, expect, it } from "vitest";
import type { DayunStep, LiunianInfo } from "@contracts/bazi-core";
import { buildDaYunContext, liunianWithinStep } from "./DaYunPanel";

const step: DayunStep = {
  index: 2,
  ganzhi: "甲辰",
  jiaziIdx: 40,
  stemTenGod: "正印",
  nayin: "覆灯火",
  startAge: 21.5,
  endAge: 31.4,
  startYear: 2020,
  endYear: 2029,
  isCurrent: true,
};

const liunian: LiunianInfo[] = [
  {
    year: 2019,
    ganzhi: "己亥",
    jiaziIdx: 35,
    stemTenGod: "伤官",
    age: 20,
    isCurrent: false,
  },
  {
    year: 2020,
    ganzhi: "庚子",
    jiaziIdx: 36,
    stemTenGod: "食神",
    age: 21,
    isCurrent: false,
  },
  {
    year: 2029,
    ganzhi: "己酉",
    jiaziIdx: 45,
    stemTenGod: "伤官",
    age: 30,
    isCurrent: true,
  },
  {
    year: 2030,
    ganzhi: "庚戌",
    jiaziIdx: 46,
    stemTenGod: "食神",
    age: 31,
    isCurrent: false,
  },
];

describe("DaYunPanel helpers", () => {
  it("按大运起止公历年（含边界）筛选流年", () => {
    expect(liunianWithinStep(liunian, step).map(item => item.year)).toEqual([
      2020, 2029,
    ]);
  });

  it("把选中大运与所辖流年写入先生参详语境", () => {
    const context = buildDaYunContext("四柱：测试命盘", step, liunian);

    expect(context).toContain("这步大运是2020年-2029年，行甲辰运");
    expect(context).toContain("2029年己酉（伤官），当前流年");
    expect(context).toContain("不作具体事件断言");
    expect(context).not.toContain("2030年庚戌");
  });
});
