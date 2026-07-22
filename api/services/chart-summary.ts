/**
 * chartSummaryForAi — 将命盘结果压缩为结构化文本摘要，供 AI 参详使用。
 *
 * 设计原则：
 * - 只含排盘「结果」（四柱、日主、五行、旺衰、用神、关键神煞 / 卦象 / 宫星 / 课传 等），
 *   不含任何原始出生信息（出生年月日时分 / 城市 / 经纬度），
 *   因此摘要可以安全地发往第三方模型服务。
 * - 输出为稳定的多行文本，便于直接拼入 prompt。
 * - 前端如需同样的摘要，可基于 paipan 返回的 chart 对象自行构建，
 *   无需额外 tRPC 接口（注意 chart.input 回显了原始出生信息，
 *   请勿将整个 chart 对象直接发给 AI，应只发送本函数产出字段对应的内容）。
 *
 * 多引擎分发：
 * - 八字（BaziChartV2，含 pillars 字段）走专有结构化摘要；
 * - 其他引擎落库的是 EngineResult 信封（{meta, data}），按 meta.engine
 *   在 ENGINE_SUMMARIZERS 注册表中查找对应摘要函数；
 * - 未登记的引擎回退为通用占位摘要（保证 ai.reading 不 500）。
 */
import type { BaziChartV2, Wuxing } from "@contracts/bazi-core";
import type { EngineResult } from "@contracts/engines/engine-result";
import type { QizhengChartData } from "@contracts/engines/qizheng-core";
import { qimenSummaryForAi } from "@contracts/engines/qimen-core";
import type { QimenChart } from "@contracts/engines/qimen-core";

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

/* ------------------------------------------------------------------ */
/* 六爻摘要（data 结构见 contracts/engines/liuyao-core）                 */
/* ------------------------------------------------------------------ */

interface LiuyaoYaoSummary {
  name: string;
  ganzhi: string;
  wuxing: string;
  liuqin: string;
  liushen: string;
  moving: boolean;
  xunKong: boolean;
  mark: "世" | "应" | null;
  bian: { ganzhi: string; wuxing: string; liuqin: string } | null;
}

interface LiuyaoChartSummary {
  question: string | null;
  benGua: { name: string; gua: string; yao: string[] };
  bianGua: { name: string } | null;
  huGua: { name: string };
  gong: string;
  gongWuxing: string;
  gongKind: string;
  movingIdx: number[];
  yaos: LiuyaoYaoSummary[];
  yueJian: string;
  riChen: string;
  xunKong: [string, string];
}

function liuyaoSummaryForAi(result: EngineResult<LiuyaoChartSummary>): string {
  const d = result.data;
  const lines: string[] = [];
  lines.push(`术数：六爻纳甲（${result.meta.ruleVariant}）`);
  lines.push(
    `本卦：${d.benGua.name}（${d.gong}宫${d.gongKind}，五行属${d.gongWuxing}）` +
      `${d.bianGua ? `；变卦：${d.bianGua.name}` : "（六爻安静，无变卦）"}；互卦：${d.huGua.name}`,
  );
  lines.push(`月建：${d.yueJian}；日辰：${d.riChen}；旬空：${d.xunKong.join("、")}`);
  lines.push(`卦辞：${d.benGua.gua}`);
  if (d.movingIdx.length > 0) {
    lines.push(`动爻爻辞：${d.movingIdx.map((i) => d.benGua.yao[i]).join("／")}`);
  }
  lines.push(
    `装卦（自下而上）：${d.yaos
      .map(
        (y) =>
          `${y.name} ${y.liushen} ${y.liuqin}${y.ganzhi}${y.wuxing}` +
          `${y.mark ? `（${y.mark}）` : ""}${y.moving ? "（动）" : ""}${y.xunKong ? "（空）" : ""}` +
          `${y.bian ? `→变${y.bian.liuqin}${y.bian.ganzhi}${y.bian.wuxing}` : ""}`,
      )
      .join("；")}`,
  );
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* 紫微摘要（data 结构见 contracts/engines/ziwei-core）                  */
/* ------------------------------------------------------------------ */

interface ZiweiPalaceSummary {
  name: string;
  ganzhi: string;
  isMing: boolean;
  isShen: boolean;
  majors: { name: string; hua?: string }[];
  minors: { name: string; hua?: string }[];
}

interface ZiweiChartSummary {
  genderKind: string;
  ju: { name: string; num: number };
  mingGongGanzhi: string;
  shenBranch: string;
  mingZhu: string;
  shenZhu: string;
  palaces: ZiweiPalaceSummary[];
  sihua: { star: string; hua: string; branch: string; palaceName: string }[];
}

function ziweiSummaryForAi(result: EngineResult<ZiweiChartSummary>): string {
  const d = result.data;
  const lines: string[] = [];
  lines.push(`术数：紫微斗数（${result.meta.ruleVariant}）`);
  lines.push(
    `${d.genderKind}；五行局：${d.ju.name}；命宫：${d.mingGongGanzhi}；身宫：${d.shenBranch}；命主：${d.mingZhu}；身主：${d.shenZhu}`,
  );
  lines.push(
    `生年四化：${d.sihua.map((s) => `${s.star}化${s.hua}在${s.palaceName}（${s.branch}）`).join("；")}`,
  );
  lines.push(
    `十二宫：${d.palaces
      .map((p) => {
        const stars = [
          ...p.majors.map((s) => s.name + (s.hua ? `化${s.hua}` : "")),
          ...p.minors.map((s) => s.name + (s.hua ? `化${s.hua}` : "")),
        ].join("、");
        return `${p.name}（${p.ganzhi}）${p.isMing ? "【命】" : ""}${p.isShen ? "【身】" : ""}：${stars || "（无正曜）"}`;
      })
      .join("；")}`,
  );
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* 大六壬摘要（data 结构见 contracts/engines/daliuren-core）             */
/* ------------------------------------------------------------------ */

interface DaliurenChartSummary {
  dayGanzhi: string;
  hourGanzhi: string;
  xunShou: string;
  xunkong: [string, string];
  yuejiang: { branch: string; name: string; zhongqi: string };
  lessons: { ke: number; shang: string; xia: string; general: string }[];
  chuan: {
    label: string;
    branch: string;
    ganzhi: string;
    dunGan: string;
    wuxing: string;
    liuqin: string;
    general: string;
    isXunkong: boolean;
  }[];
  method: { gate: string; name: string; condition: string };
}

function daliurenSummaryForAi(result: EngineResult<DaliurenChartSummary>): string {
  const d = result.data;
  const lines: string[] = [];
  lines.push(`术数：大六壬（${result.meta.ruleVariant}）`);
  lines.push(
    `日柱：${d.dayGanzhi}；时柱：${d.hourGanzhi}；${d.xunShou}，旬空：${d.xunkong.join("、")}；月将：${d.yuejiang.name}（${d.yuejiang.branch}将，${d.yuejiang.zhongqi}后换将）`,
  );
  lines.push(
    `四课：${d.lessons.map((l) => `第${l.ke}课 ${l.shang}/${l.xia}（乘${l.general}）`).join("；")}`,
  );
  lines.push(
    `三传：${d.chuan
      .map(
        (c) =>
          `${c.label} ${c.ganzhi}${c.isXunkong ? "（空）" : ""}·${c.liuqin}·${c.wuxing}·乘${c.general}`,
      )
      .join(" → ")}`,
  );
  lines.push(`起课法：${d.method.name}（${d.method.gate}）——${d.method.condition}`);
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* 注册表与分发                                                         */
/* ------------------------------------------------------------------ */

/**
 * 非八字引擎摘要注册表（按 EngineResult.meta.engine 分发）。
 * 集成点：新增引擎的摘要函数在此登记即可接入 ai.reading，无需改动分发逻辑。
 */
type EngineSummarizer = (result: EngineResult<never>) => string;
const ENGINE_SUMMARIZERS: Record<string, EngineSummarizer> = {
  qizheng: qizhengSummaryForAi as EngineSummarizer,
  qimen: ((r: EngineResult<QimenChart>) =>
    qimenSummaryForAi(r.data)) as EngineSummarizer,
  liuyao: liuyaoSummaryForAi as EngineSummarizer,
  ziwei: ziweiSummaryForAi as EngineSummarizer,
  daliuren: daliurenSummaryForAi as EngineSummarizer,
};

/** 非八字命盘（EngineResult 信封等）→ 摘要；未登记引擎给占位摘要避免 500 */
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
  // 兼容非八字引擎的落库结果（EngineResult 信封）
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
