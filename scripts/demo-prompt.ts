/** 本地演示：查看分引擎 buildPrompt 与 fallback 输出（vite-node 运行） */
import { generateReading } from "../api/services/ai";

// buildPrompt 不导出，通过 live 路径的 fetch mock 观察太重——这里演示 fallback 与断言引擎差异
const samples = [
  { chartType: "bazi", chartSummary: "四柱：庚午年 辛巳月 丙午日 乙未时；日主丙火，生于巳月得令；五行火旺。", persona: "scholar" as const, depth: "pro" as const },
  { chartType: "liuyao", chartSummary: "本卦：水天需（坤宫游魂，五行属土）；变卦：泽火革；月建：巳；日辰：午。", persona: "hermit" as const, depth: "plain" as const },
  { chartType: "draw", chartSummary: "第一百签（上上）：欲求生富贵，须下死工夫。", persona: "scholar" as const, depth: "plain" as const },
];

for (const s of samples) {
  const r = await generateReading(s);
  console.log(`\n================ ${s.chartType} · ${s.persona}/${s.depth} · source=${r.source} ================`);
  console.log(r.text);
}
