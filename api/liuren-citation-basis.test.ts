import { describe, expect, it } from "vitest";
import {
  LIREN_CITATION_NOTES,
  LIREN_ERRATA,
  applyCitationNotes,
  checkCitationNotes,
} from "@contracts/engines/masters-rules/citation-basis";
import { computeDaliuren } from "@contracts/engines/daliuren-core";

/**
 * 引文依据分流 + 校勘记 金标（课题13b §4/§5 可核对性缺口 → 规则化，T-20260929）
 *
 * 缺口：source 混装「原文照录」与「算法约定自述」，回查公版只能前缀命中，判不出引文漂移。
 * 手法：把两条「非原文」结论写成断言 —— 谁再把「中气换将」标成原文，测试即红。
 */

const at = (year: number, month: number, day: number, hour: number, minute = 0) => ({
  year, month, day, hour, minute,
});

/** daliuren-core PROVENANCE 六条规则（与引擎同源，引擎输出即事实来源） */
const engineProvenance = () => computeDaliuren(at(2024, 3, 20, 10)).meta.provenance;

describe("引文依据分流（R1–R4）", () => {
  it("引擎输出的每条 provenance 均带 basis，且 quote/convention 与 basis 相符", () => {
    const prov = engineProvenance();
    const check = checkCitationNotes(prov, LIREN_CITATION_NOTES);
    expect(check).toEqual({
      missingBasis: [],
      quoteMissing: [],
      conventionMissing: [],
      notesWithoutRule: [],
      rulesWithoutNote: [],
    });
    for (const p of prov) {
      expect(["原文", "约定", "混合"]).toContain(p.basis);
      if (p.basis === "原文" || p.basis === "混合") expect(p.quote?.length).toBeGreaterThan(0);
      if (p.basis === "约定" || p.basis === "混合") expect(p.convention?.length).toBeGreaterThan(0);
    }
  });

  it("缺注/多注一律报错（R4：不得「先混着用」）", () => {
    const prov = engineProvenance();
    expect(checkCitationNotes(prov, LIREN_CITATION_NOTES.slice(0, 5)).rulesWithoutNote.length).toBe(1);
    expect(
      checkCitationNotes(prov.slice(0, 5), LIREN_CITATION_NOTES).notesWithoutRule,
    ).toEqual(["daliuren.liuqin.dungan"]);
    expect(() =>
      applyCitationNotes(prov, [
        ...LIREN_CITATION_NOTES.slice(0, 5),
        { ruleId: "x.unknown", basis: "原文", quote: "x" },
      ]),
    ).toThrow(/不合规/);
    expect(() =>
      applyCitationNotes(prov, [
        ...LIREN_CITATION_NOTES.slice(0, 5),
        { ruleId: "daliuren.liuqin.dungan", basis: "约定" }, // 缺 convention
      ]),
    ).toThrow(/convention/);
  });

  it("§3.4/§4 结论固化：「中气换将」「月将加占时」为算法约定，不得标为原文", () => {
    const byId = new Map(LIREN_CITATION_NOTES.map((n) => [n.ruleId, n]));
    const zhongqi = byId.get("daliuren.yuejiang.zhongqi")!;
    const jiashi = byId.get("daliuren.tiandipan.jiashi")!;
    const dungan = byId.get("daliuren.liuqin.dungan")!;
    expect(zhongqi.basis).toBe("混合");
    expect(zhongqi.convention).toContain("中气换将");
    expect(zhongqi.convention).toContain("原书无此直述句");
    expect(jiashi.convention).toContain("非原文成句");
    expect(dungan.basis).toBe("约定");
    expect(dungan.convention).toContain("自述语");
    // 反例：这三条的 basis 一旦被改成纯「原文」，上面的 convention/quote 缺失检查即失败
    for (const n of [zhongqi, jiashi, dungan]) expect(n.basis).not.toBe("原文");
  });

  it("贵人诀条以原文照录（含卷二「背天门、向地户」），quote 非自述语", () => {
    const guiren = LIREN_CITATION_NOTES.find((n) => n.ruleId === "daliuren.tianjiang.guiren")!;
    expect(guiren.basis).toBe("原文");
    expect(guiren.quote).toContain("甲戊庚牛羊");
    expect(guiren.quote).toContain("六辛逢马虎");
    expect(guiren.quote).toContain("背天门");
    expect(guiren.convention).toBeUndefined();
  });
});

describe("校勘记（R5：改字留痕）", () => {
  it("三条校记齐备，且讹字/校订字逐字可对", () => {
    expect(LIREN_ERRATA.map((e) => e.id)).toEqual(["LIREN-E01", "LIREN-E02", "LIREN-E03"]);
    const e01 = LIREN_ERRATA[0];
    expect([e01.raw, e01.corrected]).toEqual(["丙戊课己不须论", "丙戊课巳不须论"]);
    expect(e01.basis).toContain("分明不用四正神");
    const e03 = LIREN_ERRATA[2];
    expect([e03.raw, e03.corrected]).toEqual(["六壬逢马虎午寅", "六辛逢马虎午寅"]);
    expect(e03.applied).toBe(true);
    // 引擎已取校订字（辛寄午/寅），而非讹字之「六壬」
    for (const e of LIREN_ERRATA) expect(e.basis.length).toBeGreaterThan(10);
  });
});
