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

const WUXING_ORDER: Wuxing[] = ["金", "木", "水", "火", "土"];

export function chartSummaryForAi(chart: BaziChartV2): string {
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
