import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  auditWenzhenDirectory,
  formatWenzhenAudit,
  type WenzhenCase,
} from "./wenzhen-paipan-audit";

const temporaryDirectories: string[] = [];

const SAMPLES: WenzhenCase[] = [
  {
    name: "样例甲",
    solar: "1990-06-15",
    hour: 12,
    minute: 0,
    gender: "male",
    sample: true,
    golden: {
      ganzhi: "庚午 壬午 辛亥 甲午",
      shensha: ["天乙贵人", "太极贵人", "天德贵人", "金舆", "词馆"],
    },
  },
  {
    name: "样例乙",
    solar: "2003-02-14",
    hour: 8,
    minute: 0,
    gender: "female",
    sample: true,
    golden: {
      ganzhi: "癸未 甲寅 戊午 丙辰",
      shensha: [
        "天乙贵人",
        "太极贵人",
        "羊刃",
        "月德贵人",
        "将星",
        "天喜",
        "元辰（大耗）",
        "金舆",
        "寡宿",
        "红艳煞",
        "学堂",
        "天厨",
        "勾绞煞",
      ],
    },
  },
];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "wenzhen-audit-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map(directory => rm(directory, { recursive: true }))
  );
});

describe("问真八字对拍", () => {
  it("空目录返回可读的空结果，不抛错", async () => {
    const directory = await temporaryDirectory();
    const result = await auditWenzhenDirectory(directory);

    expect(result.filesFound).toBe(0);
    expect(result.cases).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.averageOverallMatchRate).toBeNull();
    expect(formatWenzhenAudit(result)).toContain("未发现 JSON 命例");
  });

  it("读取两个样例并得到完整一致结果", async () => {
    const directory = await temporaryDirectory();
    await Promise.all(
      SAMPLES.map((sample, index) =>
        writeFile(
          join(directory, `sample-${index + 1}.json`),
          JSON.stringify(sample),
          "utf8"
        )
      )
    );

    const result = await auditWenzhenDirectory(directory);

    expect(result.filesFound).toBe(2);
    expect(result.errors).toEqual([]);
    expect(result.cases).toHaveLength(2);
    expect(result.cases.every(item => item.input.sample)).toBe(true);
    expect(result.cases.every(item => item.pillarMatchRate === 100)).toBe(true);
    expect(result.cases.every(item => item.shenshaMatchRate === 100)).toBe(
      true
    );
    expect(result.averageOverallMatchRate).toBe(100);
  });

  it("坏命例记录错误但不阻断有效命例", async () => {
    const directory = await temporaryDirectory();
    await writeFile(join(directory, "bad.json"), "{not json", "utf8");
    await writeFile(
      join(directory, "good.json"),
      JSON.stringify(SAMPLES[0]),
      "utf8"
    );

    const result = await auditWenzhenDirectory(directory);

    expect(result.filesFound).toBe(2);
    expect(result.cases).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.file).toBe("bad.json");
  });
});
