/**
 * 问真八字对拍校准工具。
 *
 * 默认读取 F:\紫府文件\tasks\cases 下的 JSON 命例，也可把目录作为第一个命令行参数传入：
 * npm run audit:wenzhen -- D:\path\to\cases
 */
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { computeChartV2 } from "../../contracts/bazi-core/bazi";
import type { Gender } from "../../contracts/bazi-core/types";

export const DEFAULT_CASES_DIR = String.raw`F:\紫府文件\tasks\cases`;

const STEMS = "甲乙丙丁戊己庚辛壬癸";
const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
const PILLAR_LABELS = ["年柱", "月柱", "日柱", "时柱"] as const;

export interface WenzhenGolden {
  /** 问真八字显示的四柱，依次为年、月、日、时柱。 */
  ganzhi: string;
  /** 问真八字显示的神煞名称；同名多柱只写一次。 */
  shensha: string[];
}

export interface WenzhenCase {
  name: string;
  solar: string;
  hour: number;
  minute: number;
  gender: Gender;
  golden: WenzhenGolden;
  sample?: boolean;
}

export interface PillarComparison {
  pillar: (typeof PILLAR_LABELS)[number];
  expected: string;
  actual: string;
  matches: boolean;
}

export interface WenzhenCaseAudit {
  file: string;
  input: WenzhenCase;
  pillars: PillarComparison[];
  expectedShensha: string[];
  actualShensha: string[];
  missingShensha: string[];
  extraShensha: string[];
  matchedShensha: string[];
  pillarMatchRate: number;
  shenshaMatchRate: number;
  overallMatchRate: number;
}

export interface WenzhenAuditError {
  file: string;
  message: string;
}

export interface WenzhenDirectoryAudit {
  directory: string;
  filesFound: number;
  cases: WenzhenCaseAudit[];
  errors: WenzhenAuditError[];
  averagePillarMatchRate: number | null;
  averageShenshaMatchRate: number | null;
  averageOverallMatchRate: number | null;
}

function fail(message: string): never {
  throw new Error(`命例格式错误：${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "")
    fail(`${field} 必须是非空字符串`);
  return value.trim();
}

function requireInteger(
  value: unknown,
  field: string,
  min: number,
  max: number
): number {
  if (
    !Number.isInteger(value) ||
    (value as number) < min ||
    (value as number) > max
  ) {
    fail(`${field} 必须是 ${min}-${max} 的整数`);
  }
  return value as number;
}

function validateSolar(value: unknown): string {
  const solar = requireString(value, "solar");
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(solar);
  if (!match) fail("solar 必须使用 YYYY-MM-DD 格式");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    fail("solar 不是有效的公历日期");
  }
  return solar;
}

function parseGoldenGanzhi(value: unknown): string {
  const ganzhi = requireString(value, "golden.ganzhi");
  const pillars = ganzhi.split(/\s+/);
  const ganzhiPattern = new RegExp(`^[${STEMS}][${BRANCHES}]$`);
  if (
    pillars.length !== 4 ||
    pillars.some(pillar => !ganzhiPattern.test(pillar))
  ) {
    fail("golden.ganzhi 必须是以空格分隔的四个干支，例如“甲子 丙寅 戊辰 庚午”");
  }
  return pillars.join(" ");
}

function uniqueNames(names: string[]): string[] {
  return [...new Set(names.map(name => name.trim()).filter(Boolean))];
}

/** 校验来自 JSON.parse 的未知值，失败时给出可定位字段的中文错误。 */
export function parseWenzhenCase(value: unknown): WenzhenCase {
  if (!isRecord(value)) fail("JSON 根节点必须是对象");
  if (!isRecord(value.golden)) fail("golden 必须是对象");
  if (value.gender !== "male" && value.gender !== "female") {
    fail("gender 必须是 male 或 female");
  }
  if (!Array.isArray(value.golden.shensha))
    fail("golden.shensha 必须是字符串数组");
  const shensha = value.golden.shensha.map((item, index) =>
    requireString(item, `golden.shensha[${index}]`)
  );
  if (value.sample !== undefined && typeof value.sample !== "boolean") {
    fail("sample 必须是布尔值");
  }

  return {
    name: requireString(value.name, "name"),
    solar: validateSolar(value.solar),
    hour: requireInteger(value.hour, "hour", 0, 23),
    minute: requireInteger(value.minute, "minute", 0, 59),
    gender: value.gender,
    golden: {
      ganzhi: parseGoldenGanzhi(value.golden.ganzhi),
      shensha: uniqueNames(shensha),
    },
    ...(value.sample === undefined ? {} : { sample: value.sample }),
  };
}

function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 100;
  return Math.round((numerator / denominator) * 10_000) / 100;
}

/** 对单个已校验命例执行四柱与神煞集合对比。 */
export function auditWenzhenCase(
  input: WenzhenCase,
  file = "<memory>"
): WenzhenCaseAudit {
  const [year, month, day] = input.solar.split("-").map(Number);
  const chart = computeChartV2({
    calendar: "solar",
    year,
    month,
    day,
    hour: input.hour,
    minute: input.minute,
    gender: input.gender,
    useTrueSolarTime: false,
    dayRollover: "zichu",
  });
  const expectedPillars = input.golden.ganzhi.split(" ");
  const actualPillars = [
    chart.pillars.year.ganzhi,
    chart.pillars.month.ganzhi,
    chart.pillars.day.ganzhi,
    chart.pillars.hour?.ganzhi ?? "（时柱缺失）",
  ];
  const pillars = PILLAR_LABELS.map((pillar, index) => ({
    pillar,
    expected: expectedPillars[index]!,
    actual: actualPillars[index]!,
    matches: expectedPillars[index] === actualPillars[index],
  }));

  // 问真输入目前只有神煞名称，没有柱位；因此按去重后的名称集合对比。
  const expectedShensha = uniqueNames(input.golden.shensha);
  const actualShensha = uniqueNames(chart.shensha.map(hit => hit.name));
  const expectedSet = new Set(expectedShensha);
  const actualSet = new Set(actualShensha);
  const matchedShensha = expectedShensha.filter(name => actualSet.has(name));
  const missingShensha = expectedShensha.filter(name => !actualSet.has(name));
  const extraShensha = actualShensha.filter(name => !expectedSet.has(name));
  const shenshaUnionSize = new Set([...expectedShensha, ...actualShensha]).size;
  const pillarMatchRate = percentage(
    pillars.filter(item => item.matches).length,
    pillars.length
  );
  const shenshaMatchRate = percentage(matchedShensha.length, shenshaUnionSize);

  return {
    file,
    input,
    pillars,
    expectedShensha,
    actualShensha,
    missingShensha,
    extraShensha,
    matchedShensha,
    pillarMatchRate,
    shenshaMatchRate,
    overallMatchRate:
      Math.round(((pillarMatchRate + shenshaMatchRate) / 2) * 100) / 100,
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return (
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) / values.length) * 100
    ) / 100
  );
}

/**
 * 扫描目录内所有 .json 文件。空目录或不存在的目录返回空结果；单个坏文件只记录错误，
 * 不阻断其余命例。
 */
export async function auditWenzhenDirectory(
  directory = DEFAULT_CASES_DIR
): Promise<WenzhenDirectoryAudit> {
  const resolvedDirectory = resolve(directory);
  let names: string[] = [];
  try {
    const entries = await readdir(resolvedDirectory, { withFileTypes: true });
    names = entries
      .filter(
        entry => entry.isFile() && entry.name.toLowerCase().endsWith(".json")
      )
      .map(entry => entry.name)
      .sort((a, b) => a.localeCompare(b, "zh-CN"));
  } catch (error) {
    if (!isRecord(error) || error.code !== "ENOENT") throw error;
  }

  const cases: WenzhenCaseAudit[] = [];
  const errors: WenzhenAuditError[] = [];
  for (const name of names) {
    try {
      const text = await readFile(resolve(resolvedDirectory, name), "utf8");
      const input = parseWenzhenCase(JSON.parse(text) as unknown);
      cases.push(auditWenzhenCase(input, name));
    } catch (error) {
      errors.push({
        file: name,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    directory: resolvedDirectory,
    filesFound: names.length,
    cases,
    errors,
    averagePillarMatchRate: average(cases.map(item => item.pillarMatchRate)),
    averageShenshaMatchRate: average(cases.map(item => item.shenshaMatchRate)),
    averageOverallMatchRate: average(cases.map(item => item.overallMatchRate)),
  };
}

function namesOrNone(names: string[]): string {
  return names.length > 0 ? names.join("、") : "无";
}

/** 生成适合命令行与任务报告粘贴的中文文本。 */
export function formatWenzhenAudit(result: WenzhenDirectoryAudit): string {
  const lines = [
    "=== 问真八字对拍校准 ===",
    `命例目录：${result.directory}`,
    `JSON 文件：${result.filesFound}；成功：${result.cases.length}；错误：${result.errors.length}`,
  ];

  if (result.filesFound === 0)
    lines.push("未发现 JSON 命例；请按 README 收集后重跑。");
  for (const error of result.errors)
    lines.push(`\n[错误] ${error.file}：${error.message}`);
  for (const item of result.cases) {
    lines.push(
      `\n--- ${item.input.name}${item.input.sample ? "（样例）" : ""} · ${item.file} ---`
    );
    lines.push(
      `公历：${item.input.solar} ${String(item.input.hour).padStart(2, "0")}:${String(item.input.minute).padStart(2, "0")} · ${item.input.gender}`
    );
    lines.push("四柱对比：");
    for (const pillar of item.pillars) {
      lines.push(
        `  ${pillar.matches ? "✓" : "✗"} ${pillar.pillar}：问真 ${pillar.expected} / 紫府 ${pillar.actual}`
      );
    }
    lines.push(`神煞（问真）：${namesOrNone(item.expectedShensha)}`);
    lines.push(`神煞（紫府）：${namesOrNone(item.actualShensha)}`);
    lines.push(`缺少：${namesOrNone(item.missingShensha)}`);
    lines.push(`多出：${namesOrNone(item.extraShensha)}`);
    lines.push(
      `一致率：四柱 ${item.pillarMatchRate}% / 神煞 ${item.shenshaMatchRate}% / 综合 ${item.overallMatchRate}%`
    );
  }

  if (result.cases.length > 0) {
    lines.push(
      `\n=== 汇总平均：四柱 ${result.averagePillarMatchRate}% / 神煞 ${result.averageShenshaMatchRate}% / 综合 ${result.averageOverallMatchRate}% ===`
    );
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  const result = await auditWenzhenDirectory(
    process.argv[2] ?? DEFAULT_CASES_DIR
  );
  console.log(formatWenzhenAudit(result));
  if (result.errors.length > 0) process.exitCode = 1;
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isDirectExecution) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
