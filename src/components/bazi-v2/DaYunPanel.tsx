import { useState } from "react";
import type { BaziChartV2, DayunStep, LiunianInfo } from "@contracts/bazi-core";
import DirectAiChat from "@/components/DirectAiChat";
import { buildChartSummary } from "@/components/bazi-v2/api";
import { cn } from "@/lib/utils";

export function liunianWithinStep(
  liunian: LiunianInfo[],
  step: DayunStep
): LiunianInfo[] {
  return liunian.filter(
    item => item.year >= step.startYear && item.year <= step.endYear
  );
}

export function buildDaYunContext(
  chartSummary: string,
  step: DayunStep,
  liunian: LiunianInfo[]
): string {
  const years = liunianWithinStep(liunian, step);
  const liunianText = years
    .map(
      item =>
        `${item.year}年${item.ganzhi}（${item.stemTenGod}）${item.isCurrent ? "，当前流年" : ""}`
    )
    .join("；");

  return [
    chartSummary,
    `本次专参：这步大运是${step.startYear}年-${step.endYear}年，行${step.ganzhi}运（天干十神${step.stemTenGod}，${step.startAge}-${step.endAge}岁）。`,
    liunianText ? `本步所辖流年：${liunianText}。` : "",
    "请依岁运五原则讲周期、讲可为处，低谷给希望、高峰存谦敬，话留三分并以人为主体；只作传统文化参详，不作具体事件断言。",
  ]
    .filter(Boolean)
    .join("\n");
}

function chartKey(chart: BaziChartV2): string {
  const pillars = [
    chart.pillars.year,
    chart.pillars.month,
    chart.pillars.day,
    chart.pillars.hour,
  ]
    .map(pillar => pillar?.ganzhi ?? "空")
    .join("-");
  return `${pillars}-${chart.rulesetVersion}`;
}

export default function DaYunPanel({ chart }: { chart: BaziChartV2 }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected =
    chart.dayun.steps.find(step => step.index === selectedIndex) ?? null;
  const selectedLiunian = selected
    ? liunianWithinStep(chart.liunian, selected)
    : [];
  const baseSummary = buildChartSummary(chart);
  const key = chartKey(chart);

  return (
    <section
      aria-labelledby="dayun-panel-title"
      className="min-w-0 overflow-hidden rounded-xl border border-golddim/25 bg-silk2 shadow-card"
    >
      <div className="border-b border-golddim/20 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-golddim">
              Luck Timeline
            </p>
            <h2
              id="dayun-panel-title"
              className="mt-1 font-serif text-[20px] font-black tracking-[0.12em] text-inktext"
            >
              大运流年详批
            </h2>
          </div>
          <p className="text-[12px] leading-relaxed text-inkmuted">
            {chart.dayun.forward ? "顺排" : "逆排"} · {chart.dayun.startAge}{" "}
            岁起运 · 点选十年运程请先生参详
          </p>
        </div>
      </div>

      <div className="px-3 py-5 sm:px-5">
        <p className="mb-3 px-1 text-[11px] tracking-[0.08em] text-inkmuted sm:hidden">
          左右滑动查看十步大运 →
        </p>
        <div
          className="max-w-full overflow-x-auto overscroll-x-contain pb-3"
          style={{ WebkitOverflowScrolling: "touch" }}
          aria-label="十步大运时间轴"
        >
          <ol className="flex min-w-max items-stretch px-1">
            {chart.dayun.steps.map((step, index) => {
              const active = selectedIndex === step.index;
              return (
                <li
                  key={step.index}
                  className="relative flex w-[154px] shrink-0 pt-4"
                >
                  {index > 0 && (
                    <span
                      className="absolute left-0 right-1/2 top-[22px] h-px bg-golddim/35"
                      aria-hidden="true"
                    />
                  )}
                  {index < chart.dayun.steps.length - 1 && (
                    <span
                      className="absolute left-1/2 right-0 top-[22px] h-px bg-golddim/35"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    aria-pressed={active}
                    aria-label={`${step.startYear}年至${step.endYear}年${step.ganzhi}大运${step.isCurrent ? "，当前大运" : ""}`}
                    onClick={() => setSelectedIndex(step.index)}
                    className={cn(
                      "relative z-10 mx-1 flex min-h-[154px] w-[146px] flex-col items-center rounded-xl border px-3 pb-4 pt-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goldbright",
                      active
                        ? "border-gold bg-deep text-silk shadow-lg"
                        : step.isCurrent
                          ? "border-gold/70 bg-gold/10 text-inktext shadow-card hover:bg-gold/15"
                          : "border-golddim/25 bg-silk text-inktext hover:border-gold/55 hover:bg-gold/5"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute -top-1.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2",
                        active || step.isCurrent
                          ? "border-goldbright bg-gold"
                          : "border-golddim bg-silk2"
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "font-serif text-[23px] font-black tracking-[0.14em]",
                        active && "text-goldbright"
                      )}
                    >
                      {step.ganzhi}
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-[12px] font-medium",
                        active ? "text-goldbright" : "text-golddim"
                      )}
                    >
                      {step.stemTenGod}
                    </span>
                    <span
                      className={cn(
                        "mt-3 text-[11.5px]",
                        active ? "text-silkmuted" : "text-inkmuted"
                      )}
                    >
                      {step.startYear}–{step.endYear}
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-[11.5px]",
                        active ? "text-silkmuted" : "text-inkmuted"
                      )}
                    >
                      {step.startAge}–{step.endAge} 岁
                    </span>
                    {step.isCurrent && (
                      <span className="mt-2 rounded-full border border-gold/60 px-2 py-0.5 text-[10px] tracking-[0.1em] text-golddim">
                        当前大运
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {selected && (
        <div className="border-t border-golddim/20 bg-silk px-3 py-5 sm:px-5 sm:py-6">
          <div className="mb-5 min-w-0 rounded-lg border border-golddim/20 bg-silk2 px-4 py-3">
            <p className="font-serif text-[15px] font-bold text-inktext">
              {selected.ganzhi}运 · {selected.startYear}–{selected.endYear}
            </p>
            <div
              className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1"
              aria-label="本步大运所辖流年"
            >
              {selectedLiunian.length > 0 ? (
                selectedLiunian.map(year => (
                  <span
                    key={year.year}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-[11.5px]",
                      year.isCurrent
                        ? "border-gold bg-gold/10 font-medium text-golddim"
                        : "border-golddim/25 text-inkmuted"
                    )}
                  >
                    {year.year} · {year.ganzhi}
                    {year.isCurrent ? " · 今" : ""}
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-inkmuted">
                  本盘流年数据未覆盖此阶段
                </span>
              )}
            </div>
          </div>

          <DirectAiChat
            key={`${key}-${selected.index}`}
            chartSummary={buildDaYunContext(
              baseSummary,
              selected,
              chart.liunian
            )}
            title={`先生参详 · ${selected.ganzhi}大运`}
            autoStart
            storageKey={`zifu:xiansheng-chat:dayun:${key}:${selected.index}`}
          />
        </div>
      )}
    </section>
  );
}
