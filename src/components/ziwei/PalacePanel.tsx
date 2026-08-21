import { useState } from "react";
import DirectAiChat from "@/components/DirectAiChat";
import type {
  ZiweiChartData,
  ZiweiPalace,
  ZiweiStar,
} from "@contracts/engines/ziwei-core";
import { PALACE_DUTY } from "@/components/ziwei/logic";
import { cn } from "@/lib/utils";

type PalacePanelProps = {
  chart: ZiweiChartData;
};

function palaceLabel(name: string): string {
  return name.endsWith("宫") ? name : `${name}宫`;
}

function starLabel(star: ZiweiStar): string {
  return `${star.name}${star.hua ? `化${star.hua}` : ""}`;
}

function joinedStars(stars: ZiweiStar[], emptyText: string): string {
  return stars.length > 0 ? stars.map(starLabel).join("、") : emptyText;
}

export function buildPalaceChartSummary(
  chart: ZiweiChartData,
  palace: ZiweiPalace
): string {
  const sihua = chart.sihua
    .map(item => `${item.star}化${item.hua}落${palaceLabel(item.palaceName)}`)
    .join("、");
  const majors = joinedStars(palace.majors, "无正曜，可合参对宫");

  return [
    `紫微斗数命盘摘要：${chart.genderKind}，${chart.ju.name}，命宫${chart.mingGongGanzhi}，命主${chart.mingZhu}，身主${chart.shenZhu}。`,
    `生年四化：${sihua || "无四化资料"}。`,
    `本次参详：${palaceLabel(palace.name)}（${palace.ganzhi}宫），宫位所主为“${PALACE_DUTY[palace.name] ?? "人生相应面向"}”，主星${majors}。`,
    "请以先生口吻逐层讲述此宫，仅作传统文化参详与自我观察，不作具体事件断言，不替代医疗、法律或投资意见。",
  ].join("");
}

export default function PalacePanel({ chart }: PalacePanelProps) {
  const [selected, setSelected] = useState<ZiweiPalace | null>(null);
  const [showChat, setShowChat] = useState(false);
  const chartKey = [
    chart.rulesetVersion,
    `${chart.solar.year}-${chart.solar.month}-${chart.solar.day}`,
    chart.input.hourBranch,
    chart.input.gender,
  ].join(":");

  const selectPalace = (palace: ZiweiPalace) => {
    setSelected(palace);
    setShowChat(false);
  };

  return (
    <section
      className="mt-16 border-t border-golddim/20 pt-14"
      aria-labelledby="ziwei-palace-panel-title"
    >
      <div className="text-center">
        <p className="font-latin text-[11px] font-medium uppercase tracking-[0.34em] text-golddim">
          PALACE READING
        </p>
        <h2
          id="ziwei-palace-panel-title"
          className="mt-3 font-serif text-[26px] font-bold tracking-[0.12em] text-inktext sm:text-[30px]"
        >
          十二宫讲述
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[13px] leading-[1.9] text-inkmuted">
          择一宫观星曜落处，请先生围绕此宫作文化参详
        </p>
      </div>

      <div className="mt-9 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {chart.palaces.map(palace => {
          const isSelected = selected?.branchIdx === palace.branchIdx;
          return (
            <button
              key={palace.branchIdx}
              type="button"
              onClick={() => selectPalace(palace)}
              aria-pressed={isSelected}
              className={cn(
                "min-w-0 rounded-xl border p-3 text-left transition-colors sm:p-4",
                isSelected
                  ? "border-gold bg-gold/10 shadow-[0_10px_30px_rgba(108,80,34,0.08)]"
                  : "border-golddim/20 bg-silk2/45 hover:border-gold/55 hover:bg-gold/5"
              )}
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <h3 className="truncate font-serif text-[15px] font-bold tracking-[0.08em] text-inktext sm:text-[16px]">
                  {palaceLabel(palace.name)}
                </h3>
                <span className="shrink-0 text-[10.5px] text-inkmuted/75">
                  {palace.ganzhi}
                </span>
              </div>
              <p
                className="mt-3 truncate text-[12.5px] font-medium text-golddim"
                title={joinedStars(palace.majors, "无正曜")}
              >
                {joinedStars(palace.majors, "无正曜")}
              </p>
              <p
                className="mt-1.5 truncate text-[11.5px] text-inkmuted"
                title={joinedStars(palace.minors, "暂无小星")}
              >
                {joinedStars(palace.minors, "暂无小星")}
              </p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-7">
          {!showChat ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-[12.5px] leading-[1.8] text-inkmuted">
                已选 {palaceLabel(selected.name)} · 主星
                {joinedStars(selected.majors, "无正曜")}
              </p>
              <button
                type="button"
                onClick={() => setShowChat(true)}
                className="min-h-11 rounded-xl border border-gold/60 bg-gold/10 px-7 py-2.5 font-serif text-[14px] font-bold tracking-[0.1em] text-golddim transition-colors hover:bg-gold/20"
              >
                请先生讲此宫
              </button>
            </div>
          ) : (
            <div className="min-w-0 overflow-hidden">
              <DirectAiChat
                key={`${chartKey}:${selected.branchIdx}`}
                chartSummary={buildPalaceChartSummary(chart, selected)}
                title={`先生讲${palaceLabel(selected.name)}`}
                autoStart
                storageKey={`zifu:ziwei-palace:${chartKey}:${selected.branch}`}
                followups={[
                  `这一宫的主星特质该怎样理解？`,
                  `此宫与对宫该怎样合参？`,
                  `我可以从此宫得到什么自我观察？`,
                ]}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
