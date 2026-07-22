/**
 * 三术合参 · 端到端集成测试（真实引擎，非 mock loader）
 * 验证 ziwei-core / qizheng-core 的 hecanSynthesize 协议实现
 * 与 hecan-core 编排器组合后三术全部真实可用。
 */
import { describe, expect, it } from "vitest";
import type { BirthInput } from "@contracts/bazi-core";
import { synthesizeHecan } from "@contracts/engines/hecan-core";
import type { HecanEngineLoader } from "@contracts/engines/hecan-core";
import { hecanSynthesize as ziweiSynthesize } from "@contracts/engines/ziwei-core";
import { hecanSynthesize as qizhengSynthesize } from "@contracts/engines/qizheng-core";

const staticLoader: HecanEngineLoader = async (art) =>
  art === "ziwei"
    ? { hecanSynthesize: ziweiSynthesize }
    : { hecanSynthesize: qizhengSynthesize };

const input: BirthInput = {
  calendar: "solar",
  year: 1990,
  month: 6,
  day: 15,
  hour: 10,
  minute: 30,
  gender: "male",
  useTrueSolarTime: false,
  dayRollover: "zichu",
};

describe("三术合参 · 真实引擎集成", () => {
  it("三术全部可用且均为 validated（无 unavailable 伪造缺口）", async () => {
    const s = await synthesizeHecan(input, { loadEngine: staticLoader });
    expect(s.report.availableArts).toBe(3);
    for (const art of s.report.arts) {
      expect(art.precision).toBe("validated");
      expect(art.keyPoints.length).toBeGreaterThan(0);
    }
    expect(s.warnings).toHaveLength(0);
  });

  it("ziwei 贡献：五行局/命宫干支/四化完整", async () => {
    const s = await synthesizeHecan(input, { loadEngine: staticLoader });
    const zw = s.report.arts.find((a) => a.art === "ziwei");
    expect(zw).toBeDefined();
    expect(zw!.wuxingFocus).toMatch(/^[金木水火土]$/);
    expect(zw!.mingGongBranch).toMatch(/^[子丑寅卯辰巳午未申酉戌亥]$/);
    expect(zw!.keyPoints.join("")).toContain("五行局");
    expect(zw!.keyPoints.join("")).toContain("四化");
  });

  it("qizheng 贡献：命宫/命主星/日月躔度完整", async () => {
    const s = await synthesizeHecan(input, { loadEngine: staticLoader });
    const qz = s.report.arts.find((a) => a.art === "qizheng");
    expect(qz).toBeDefined();
    expect(qz!.mingGongBranch).toMatch(/^[子丑寅卯辰巳午未申酉戌亥]$/);
    expect(qz!.keyPoints.join("")).toContain("命主星");
    expect(qz!.keyPoints.join("")).toContain("太阳");
  });

  it("时辰未知：ziwei/qizheng 降级 unavailable（不伪造），bazi 仍真实", async () => {
    const s = await synthesizeHecan({ ...input, hour: null }, { loadEngine: staticLoader });
    const zw = s.report.arts.find((a) => a.art === "ziwei");
    const qz = s.report.arts.find((a) => a.art === "qizheng");
    expect(zw!.precision).toBe("unavailable");
    expect(qz!.precision).toBe("unavailable");
    expect(zw!.keyPoints).toHaveLength(0);
    expect(s.report.arts.find((a) => a.art === "bazi")!.precision).toBe("validated");
    expect(s.warnings.length).toBeGreaterThan(0);
  });

  it("农历输入（含闰月）：三术均可排", async () => {
    const lunar: BirthInput = {
      calendar: "lunar",
      year: 1990,
      month: 5,
      day: 23,
      hour: 10,
      minute: 30,
      gender: "female",
      isLeapMonth: true, // 1990 年闰五月
      useTrueSolarTime: false,
      dayRollover: "zichu",
    };
    const s = await synthesizeHecan(lunar, { loadEngine: staticLoader });
    expect(s.report.availableArts).toBe(3);
  });

  it("互证结果：三题均有结论且 overallTier 合法", async () => {
    const s = await synthesizeHecan(input, { loadEngine: staticLoader });
    expect(s.report.crossChecks.length).toBe(3);
    expect(["triple", "double", "single"]).toContain(s.report.overallTier);
  });
});
