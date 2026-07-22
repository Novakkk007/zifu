/**
 * chartSummaryForAi — 将 BaziChartV2 压缩为结构化文本摘要，供 AI 参详使用。
 *
 * 设计原则：
 * - 只含排盘「结果」（四柱、日主、五行、旺衰、用神、关键神煞），
 *   不含任何原始出生信息（出生年月日时分 / 城市 / 经纬度），
 *   因此摘要可以安全地发往第三方模型服务。
 * - 输出为稳定的多行文本，便于直接拼入 prompt。
 * - 前端如需同样的摘要，可基于 bazi.paipan 返回的 chart 对象自行构建，
 *   无需额外 tRPC 接口（注意 chart.input 回显了原始出生信息，
 *   请勿将整个 chart 对象直接发给 AI，应只发送本函数产出字段对应的内容）。
 */
import type { BaziChartV2, Wuxing } from "@contracts/bazi-core";
import type { EngineResult } from "@contracts/engines/engine-result";
import type { QizhengChartData } from "@contracts/engines/qizheng-core";

const WUXING_ORDER: Wuxing[] = ["金", "木", "水", "火", "土"];

/** 七政四余 EngineResult → 结构化摘要（不含原始出生时刻，仅排盘结果） */
function qizhengSummaryForAi(result: EngineResult<QizhengChartData>): string {
  const d = result.data;
  const lines: string[] = [];
  lines.push(`术数：七政四余（${result.meta.ruleVariant}）`);
  lines.push(
    `十一曜躔度：${d.stars
      .map(
        (s) =>
          `${s.name}在${s.zodiac}${s.zodiacDegree.toFixed(1)}°·${s.mansion}宿${s.mansionDegree.toFixed(2)}度${s.retrograde ? "（逆）" : ""}`,
      )
      .join("；")}`,
  );
  lines.push(`命宫：${d.minggong.branch}（${d.minggong.zodiac}，${d.minggong.mansion}宿）；身宫：${d.shengong.branch}；命主星：${d.mingzhu}`);
  return lines.join("\n");
}

/**
 * 非八字引擎摘要注册表（按 EngineResult.meta.engine 分发）。
 * 集成点：liuyao/ziwei/qimen/daliuren/hecan 等引擎的摘要函数
 * 在此登记即可接入 ai.reading，无需改动分发逻辑。
 */
type EngineSummarizer = (result: EngineResult<never>) => string;
const ENGINE_SUMMARIZERS: Record<string, EngineSummarizer> = {
  qizheng: qizhengSummaryForAi as EngineSummarizer,
};

/** 非八字命盘（EngineResult 信封等）→ 摘要；无法识别时给占位摘要避免 500 */
function fallbackSummaryForAi(chart: unknown): string {
  if (chart && typeof chart === "object" && "meta" in chart && "data" in chart) {
    const r = chart as EngineResult<unknown>;
    const engine = String(r.meta?.engine ?? "");
    const summarizer = ENGINE_SUMMARIZERS[engine];
    if (summarizer) {
      try {
        return summarizer(r as EngineResult<never>);
      } catch {
        // fallthrough → 通用摘要
      }
    }
    return `术数：${engine || "未知"}（${String(r.meta?.ruleVariant ?? "")}）\n（该引擎暂不支持结构化摘要，AI 参详基于通用模板。）`;
  }
  return "（命盘数据格式无法识别，AI 参详基于通用模板。）";
}

export function chartSummaryForAi(chart: BaziChartV2): string {
  // 兼容非八字引擎的落库结果（如七政四余 EngineResult 信封）
  if (!chart || typeof chart !== "object" || !("pillars" in chart)) {
    return fallbackSummaryForAi(chart);
  }
  const { pillars } = chart;
  const pillarParts = [pillars.year, pillars.month, pillars.day, pillars.hour]
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => `${p.label}${p.ganzhi}`);

  const lines: string[] = [];
  lines.push(`四柱：${pillarParts.join(" ")}${pillars.hour ? "" : "（时辰未知，未排时柱）"}`);
  lines.push(`日主：${chart.dayMaster}（${chart.dayMasterWuxing}）`);

  const counts = WUXING_ORDER.map((w) => `${w}${chart.wuxing.count[w].toFixed(1)}`).join(" ");
  const missing = chart.wuxing.missing.length > 0 ? `；缺${chart.wuxing.missing.join("、")}` : "";
  lines.push(`五行分布：${counts}${missing}`);

  const s = chart.wuxing.strength;
  lines.push(`旺衰：${s.grade}（总分 ${s.total}/100；得令${s.deling} 得地${s.dedi} 得势${s.deshi}）`);

  const y = chart.yongshen;
  lines.push(`用神：${y.yongshen}；喜神：${y.xishen.join("、")}；忌神：${y.jishen.join("、")}`);

  if (chart.shensha.length > 0) {
    lines.push(`神煞：${chart.shensha.map((h) => h.name).join("、")}`);
  }

  return lines.join("\n");
}
