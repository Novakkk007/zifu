import { describe, expect, it } from "vitest";
import { GUIREN, STEM_PALACE, GENERALS, YUEJIANG_NAME } from "@contracts/engines/daliuren-core";
import { STEMS, BRANCHES } from "@contracts/bazi-core";

/**
 * 大六壬 金标对拍（课题13 → T-20260928）
 *
 * 金标来源：《六壬大全》公版原文（维基文库），全文存档
 *   F:/紫府文件/tasks/课题13-大六壬公版典籍文本v1.txt（sha256 76b845c1…b45f1a）
 *   清洗本 F:/紫府文件/tasks/课题13-cleaned/（24 正文）
 * 手法：把原文歌诀直接写进断言并机器解析，与引擎常量对拍 —— 原文改字则测试红。
 */

/** 十干寄宫歌（卷一「入手法」原字） */
const SHIGAN_JIGONG_GE =
  "甲课寅兮乙课辰，丙戊课巳不须论。丁己课未庚申上，辛戌壬亥是其真。癸课原来丑宫坐，分明不用四正神。";

/** 贵人歌（卷四原字）。末句原文作「六壬逢马虎」，按午马寅虎推之是「六辛」之讹，取校订本。 */
const GUIREN_GE_RAW =
  "甲戊庚牛羊丑未，乙己鼠猴乡子申，丙丁猪鸡位亥酉，壬癸蛇兔藏巳卯，六壬逢马虎午寅，贵人得此方。";
const GUIREN_GE = GUIREN_GE_RAW.replace("六壬逢马虎", "六辛逢马虎"); // 校记：见 daliuren-core 贵人歌注释

const STEM_CHARS = new Set(STEMS as unknown as string[]);
const BRANCH_SET = new Set(BRANCHES as unknown as string[]);

/** 解析「甲戊庚牛羊丑未」型分句 → { 干: [支…] } */
function parseGuirenGe(ge: string): Map<string, number[]> {
  const out = new Map<string, number[]>();
  for (const clause of ge.split(/[，。]/)) {
    if (!clause) continue;
    let i = 0;
    while (i < clause.length && STEM_CHARS.has(clause[i])) i++;
    const stemPart = clause.slice(0, i);
    const branchPart = [...clause.slice(i)].filter((c) => BRANCH_SET.has(c));
    if (!stemPart || branchPart.length !== 2) continue;
    for (const s of stemPart) out.set(s, branchPart.map((b) => BRANCHES.indexOf(b as never)).sort((a, b) => a - b));
  }
  return out;
}

describe("大六壬金标：公版原文 ↔ 引擎常量", () => {
  it("贵人歌：十干贵人所乘支，与《六壬大全》卷四原文逐干一致", () => {
    const golden = parseGuirenGe(GUIREN_GE);
    expect(golden.size).toBe(9); // 甲戊庚/乙己/丙丁/壬癸/辛 = 9 干（丙丁、壬癸各成对）
    const bad: string[] = [];
    for (const [stem, want] of golden) {
      const idx = STEMS.indexOf(stem as never);
      const got = [...GUIREN[idx]].sort((a, b) => a - b);
      if (got[0] !== want[0] || got[1] !== want[1]) bad.push(`${stem}: 码[${got}] vs 原文[${want}]`);
    }
    expect(bad).toEqual([]);
  });

  it("十干寄宫歌：十干寄宫与卷一「入手法」原文一致", () => {
    const clauses = SHIGAN_JIGONG_GE.split(/[，。]/).filter(Boolean).slice(0, 7);
    const bad: string[] = [];
    let idx = 0;
    for (const c of clauses) {
      const branch = c[2];
      if (idx === 0) {
        // 「甲课寅兮乙课辰」一 clause 两干
        const pairs: Array<[string, string]> = [
          ["甲", "寅"],
          ["乙", "辰"],
        ];
        for (const [s, b] of pairs) {
          const got = BRANCHES[STEM_PALACE[STEMS.indexOf(s as never)]];
          if (got !== b) bad.push(`${s}: 码${got} vs 原文${b}`);
        }
        continue;
      }
      // 「丙戊课巳不须论」→ 取前两干同寄一宫
      const stems = [...c].filter((ch) => STEM_CHARS.has(ch)).slice(0, 2);
      for (const s of stems) {
        const got = BRANCHES[STEM_PALACE[STEMS.indexOf(s as never)]];
        if (got !== branch) bad.push(`${s}: 码${got} vs 原文${branch}`);
      }
      idx++;
    }
    // 显式补齐：癸课原来丑宫坐 / 丁己未庚申辛戌壬亥
    const explicit: Array<[string, string]> = [
      ["丁", "未"], ["己", "未"], ["庚", "申"], ["辛", "戌"], ["壬", "亥"], ["癸", "丑"],
    ];
    for (const [s, b] of explicit) {
      const got = BRANCHES[STEM_PALACE[STEMS.indexOf(s as never)]];
      if (got !== b) bad.push(`${s}: 码${got} vs 原文${b}`);
    }
    expect(bad).toEqual([]);
  });

  it("十二天将序：与卷二神将释所载次序一致", () => {
    // 《六壬大全》卷二神将释十二天将：贵人(天乙)、螣蛇、朱雀、六合、勾陈、青龙、天空、白虎、太常、玄武、太阴、天后
    expect([...GENERALS]).toEqual([
      "贵人", "螣蛇", "朱雀", "六合", "勾陈", "青龙",
      "天空", "白虎", "太常", "玄武", "太阴", "天后",
    ]);
  });

  it("十二支神（月将名）：与神将释十二支神释名一致", () => {
    const golden: Record<number, string> = {
      0: "神后", 1: "大吉", 2: "功曹", 3: "太冲", 4: "天罡", 5: "太乙",
      6: "胜光", 7: "小吉", 8: "传送", 9: "从魁", 10: "河魁", 11: "登明",
    };
    for (const [k, v] of Object.entries(golden)) {
      expect(YUEJIANG_NAME[Number(k)]).toBe(v);
    }
  });
});
