import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import DirectAiChat from "@/components/DirectAiChat";
import type {
  HexagramData,
  LiuyaoChart,
  LiuyaoYao,
} from "@/components/liuyao/api";
import { cn } from "@/lib/utils";
import { daXiangOf } from "@contracts/engines/liuyao-core";

const LIUYAO_FOLLOWUPS = [
  "世应与动爻之间，应当怎样理解？",
  "本卦到变卦，卦意发生了什么变化？",
  "结合六亲看，眼下有哪些可留意之处？",
];

/** 《周易》六十四卦符号按文王卦序排列于 Unicode U+4DC0—U+4DFF。 */
export function hexagramSymbol(id: number): string {
  if (!Number.isInteger(id) || id < 1 || id > 64) return "卦";
  return String.fromCodePoint(0x4dc0 + id - 1);
}

function yaoOverview(yao: LiuyaoYao): string {
  const marks = [
    yao.mark,
    yao.moving ? "动" : null,
    yao.xunKong ? "空" : null,
  ].filter(Boolean);
  const changed = yao.bian
    ? `→${yao.bian.liuqin}${yao.bian.ganzhi}${yao.bian.wuxing}`
    : "";
  return `${yao.name}${yao.liuqin}${yao.ganzhi}${yao.wuxing}${marks.length ? `（${marks.join("、")}）` : ""}${changed}`;
}

/** 直连先生只接收必要卦象摘要；末尾显式收束为文化阐释，不作事件断言。 */
export function buildLiuyaoChartSummary(chart: LiuyaoChart): string {
  const benXiang = daXiangOf(chart.benGua.id) ?? "未收录";
  const bian = chart.bianGua;
  const lines = [
    "【六爻卦象专用语境】请只按六爻卦象讲解，不套用八字格局、旺衰、用神或岁运模板。",
    chart.question ? `所问：${chart.question}` : "所问：未填写具体问事",
    `本卦：《${chart.benGua.name}》${hexagramSymbol(chart.benGua.id)}；大象曰：“${benXiang}”`,
    bian
      ? `变卦：《${bian.name}》${hexagramSymbol(bian.id)}；大象曰：“${daXiangOf(bian.id) ?? "未收录"}”`
      : "变卦：六爻安静，无变卦",
    `卦宫：${chart.gong}宫（${chart.gongWuxing}）${chart.gongKind}；世在${chart.yaos[chart.shiIndex]?.name ?? "未标"}，应在${chart.yaos[chart.yingIndex]?.name ?? "未标"}`,
    `六亲世应概览（自下而上）：${chart.yaos.map(yaoOverview).join("；")}`,
    "讲解要求：结合本卦、变卦、大象辞、六亲与世应说明传统文化寓意；说明多种可能与人的可为之处，不预测必然结果，不作具体事件断言，不替代医疗、法律或投资意见。",
  ];
  return lines.join("\n");
}

function HexagramMeaning({
  hex,
  kind,
}: {
  hex: HexagramData;
  kind: "本卦" | "变卦";
}) {
  const daXiang = daXiangOf(hex.id);
  return (
    <article className="min-w-0 rounded-xl border border-golddim/25 bg-silk px-5 py-6 sm:px-7">
      <div className="flex items-center gap-4">
        <span
          className="font-serif text-[44px] leading-none text-golddim sm:text-[52px]"
          role="img"
          aria-label={`${hex.name}卦象符号`}
        >
          {hexagramSymbol(hex.id)}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.28em] text-inkmuted">
            {kind}
          </p>
          <h3 className="mt-1 font-serif text-[22px] font-bold tracking-[0.1em] text-inktext sm:text-[26px]">
            {hex.name}
          </h3>
          <p className="mt-1 text-[12px] tracking-[0.12em] text-inkmuted">
            {hex.upper}上 · {hex.lower}下
          </p>
        </div>
      </div>
      <blockquote className="mt-5 border-l-2 border-gold pl-4 font-serif text-[15px] leading-[2] text-inktext sm:text-[16px]">
        <span className="mr-2 text-golddim">大象曰</span>
        {daXiang ?? "此卦大象辞暂未收录。"}
      </blockquote>
    </article>
  );
}

function RelationsOverview({ chart }: { chart: LiuyaoChart }) {
  return (
    <div className="mt-8 rounded-xl border border-golddim/20 bg-silk px-4 py-5 sm:px-7">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="font-serif text-[17px] font-semibold tracking-[0.12em] text-inktext">
          六亲 · 世应
        </h3>
        <p className="text-[11.5px] leading-relaxed text-inkmuted">
          由上爻至初爻；六亲以本卦宫五行推定
        </p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[...chart.yaos].reverse().map(yao => (
          <div
            key={yao.index}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5",
              yao.mark === "世"
                ? "border-gold/60 bg-gold/10"
                : yao.mark === "应"
                  ? "border-golddim/45 bg-silk2"
                  : "border-golddim/15 bg-silk2/60"
            )}
          >
            <span className="w-8 shrink-0 text-[11.5px] text-inkmuted">
              {yao.name}
            </span>
            <span className="min-w-0 flex-1 truncate font-serif text-[13.5px] text-inktext">
              {yao.liuqin} · {yao.ganzhi}
              {yao.wuxing}
            </span>
            {yao.mark && (
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-gold/10 font-serif text-[12px] font-bold text-golddim">
                {yao.mark}
              </span>
            )}
            {yao.moving && (
              <span className="shrink-0 text-[11px] font-medium text-golddim">
                动
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GuaciPanel({ chart }: { chart: LiuyaoChart }) {
  const [showChat, setShowChat] = useState(false);
  const chartSummary = buildLiuyaoChartSummary(chart);
  const chatId = `liuyao-direct-chat-${chart.castAt.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <section className="mx-auto mt-12 max-w-5xl rounded-2xl border border-golddim/30 bg-silk2 p-4 shadow-card sm:p-7 lg:p-9">
      <header className="text-center">
        <p className="font-latin text-[11px] uppercase tracking-[0.34em] text-golddim">
          HEXAGRAM MEANING
        </p>
        <h2 className="mt-2 font-serif text-[24px] font-bold tracking-[0.12em] text-inktext sm:text-[30px]">
          卦象详解
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-[12.5px] leading-[1.9] text-inkmuted">
          大象辞录自《周易·象传》公版原文；六亲、世应依本次装卦结果简要列示。
        </p>
      </header>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <HexagramMeaning hex={chart.benGua} kind="本卦" />
        {chart.bianGua ? (
          <HexagramMeaning hex={chart.bianGua} kind="变卦" />
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-golddim/30 bg-silk px-5 py-8 text-center">
            <span
              className="font-serif text-[40px] leading-none text-golddim/60"
              aria-hidden
            >
              静
            </span>
            <p className="mt-4 font-serif text-[18px] tracking-[0.14em] text-inktext">
              六爻安静
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-inkmuted">
              本次无动爻，故无变卦。
            </p>
          </div>
        )}
      </div>

      <RelationsOverview chart={chart} />

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => setShowChat(shown => !shown)}
          aria-expanded={showChat}
          aria-controls={chatId}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/70 bg-gold/10 px-6 py-3 text-[14px] font-medium tracking-[0.1em] text-golddim transition-colors hover:bg-gold/20 sm:px-8"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {showChat ? "收起先生解卦" : "请先生解卦"}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              showChat && "rotate-180"
            )}
            aria-hidden
          />
        </button>
        <p className="mt-3 text-[11.5px] leading-relaxed text-inkmuted">
          先生讲卦仅作传统文化参详，不作具体事件断言。
        </p>
      </div>

      {showChat && (
        <div id={chatId} className="mt-7 overflow-hidden rounded-xl">
          <DirectAiChat
            chartSummary={chartSummary}
            title="先生解卦 · 可继续追问"
            persona="scholar"
            depth="pro"
            autoStart
            storageKey={`zifu:liuyao-chat:${chart.castAt}`}
            followups={LIUYAO_FOLLOWUPS}
          />
        </div>
      )}
    </section>
  );
}
