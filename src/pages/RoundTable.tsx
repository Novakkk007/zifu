import { useState } from "react";
import { motion } from "framer-motion";
import { useEngine } from "@/hooks/useEngine";
import { paipanBazi } from "@/engines/client/bazi";
import { buildChartSummary } from "@/lib/ai-direct";
import type { PaipanPayload } from "@/components/bazi-v2/api";
import {
  ROUNDTABLE_SCHOOLS,
  runRoundTable,
  parseRoundTable,
  buildFollowUpPrompt,
  type RoundTableResult,
} from "@/lib/roundtable";
import { usePageMeta } from "@/lib/page-meta";

const SEAT_ANGLES = [270, 322, 14, 66, 118, 170, 222]; // 环形均布（从正上起）

export default function RoundTablePage() {
  usePageMeta(
    "论命圆桌 · 紫府",
    "七大命理流派同盘论命——子平格局、三命通会、神峰通考、渊海子平、盲派、千里命稿、金口诀，各执一脉，共观一盘。"
  );

  const [solar, setSolar] = useState(true);
  const [year, setYear] = useState("2009");
  const [month, setMonth] = useState("8");
  const [day, setDay] = useState("29");
  const [hour, setHour] = useState("2");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RoundTableResult | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [summary, setSummary] = useState("");
  // 追问状态：{seatIndex, q, reply, busy}
  const [followUp, setFollowUp] = useState<Record<number, { q: string; reply: string; busy: boolean }>>({});

  const paipan = useEngine(paipanBazi, {
    onSuccess: async (data) => {
      const chart = (data as { chart: unknown }).chart;
      if (!chart) return;
      const s = buildChartSummary(chart);
      setSummary(s);
      setLoading(true);
      setError("");
      try {
        const res = await runRoundTable(s, question || undefined);
        setResult(parseRoundTable(res.content));
      } catch (e) {
        setError(e instanceof Error ? e.message : "圆桌暂未开席，请稍后再试");
      } finally {
        setLoading(false);
      }
    },
    onError: (e) => setError(e?.message ?? "排盘失败"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setFollowUp({});
    const y = Number(year), mo = Number(month), d = Number(day), h = Number(hour);
    // 中文校验（24 点 = 午夜 0 点，用户常见输入）
    if (!y || y < 1900 || y > 2100) {
      setError("年份请填 1900-2100 之间的数字");
      return;
    }
    if (!mo || mo < 1 || mo > 12) {
      setError("月份请填 1-12 之间的数字");
      return;
    }
    if (!d || d < 1 || d > 31) {
      setError("日期请填 1-31 之间的数字");
      return;
    }
    if (h === 24) {
      setError("");
      paipan.mutate({
        calendar: solar ? "solar" : "lunar",
        year: y, month: mo, day: d, hour: 0, minute: 0,
        gender, useTrueSolarTime: false, dayRollover: "zichu", title: "论命圆桌",
      });
      return;
    }
    if (isNaN(h) || h < 0 || h > 23) {
      setError("时辰请填 0-23 之间的数字（24 点即午夜 0 点）");
      return;
    }
    const payload: PaipanPayload = {
      calendar: solar ? "solar" : "lunar",
      year: y, month: mo, day: d, hour: h, minute: 0,
      gender,
      useTrueSolarTime: false,
      dayRollover: "zichu",
      title: "论命圆桌",
    };
    paipan.mutate(payload);
  };

  const askFollowUp = async (idx: number) => {
    const f = followUp[idx];
    if (!f || !f.q.trim() || f.busy || !result) return;
    const seat = result.seats[idx];
    setFollowUp((prev) => ({ ...prev, [idx]: { ...f, busy: true } }));
    try {
      const res = await runRoundTable(
        buildFollowUpPrompt(summary, seat.school, seat.content, f.q)
      );
      setFollowUp((prev) => ({ ...prev, [idx]: { ...prev[idx], reply: res.content, busy: false } }));
    } catch (e) {
      setFollowUp((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], reply: e instanceof Error ? e.message : "该席暂未回应", busy: false },
      }));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-center font-serif text-[26px] font-bold tracking-[0.14em] text-golddim">
        论 命 圆 桌
      </p>
      <p className="mt-2 text-center text-[13px] leading-relaxed text-inkmuted">
        七席法脉，同观一盘。子平格局、三命通会、神峰通考、渊海子平、盲派、千里命稿、金口诀——
        <br />
        各持其法，各言其见；共识与分歧，一并呈上。
      </p>

      <form
        onSubmit={submit}
        className="mx-auto mt-8 max-w-xl rounded-2xl border border-golddim/25 bg-silk2 p-6 shadow-card"
      >
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="flex gap-1 rounded-lg bg-silk p-1">
            {[
              { k: true, t: "公历" },
              { k: false, t: "农历" },
            ].map((o) => (
              <button
                key={String(o.k)}
                type="button"
                onClick={() => setSolar(o.k)}
                className={`flex-1 rounded-md px-3 py-1.5 text-[12px] tracking-[0.1em] ${
                  solar === o.k ? "bg-golddim text-white" : "text-inkmuted"
                }`}
              >
                {o.t}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg bg-silk p-1">
            {[
              { k: "male", t: "男命" },
              { k: "female", t: "女命" },
            ].map((o) => (
              <button
                key={o.k}
                type="button"
                onClick={() => setGender(o.k as "male" | "female")}
                className={`flex-1 rounded-md px-3 py-1.5 text-[12px] tracking-[0.1em] ${
                  gender === o.k ? "bg-golddim text-white" : "text-inkmuted"
                }`}
              >
                {o.t}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { label: "年", v: year, set: setYear, ph: "2009" },
            { label: "月", v: month, set: setMonth, ph: "8" },
            { label: "日", v: day, set: setDay, ph: "29" },
            { label: "时", v: hour, set: setHour, ph: "2" },
          ].map((f) => (
            <label key={f.label} className="block">
              <span className="text-[11.5px] tracking-[0.14em] text-inkmuted">{f.label}</span>
              <input
                value={f.v}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.ph}
                className="mt-1 w-full rounded-lg border border-golddim/20 bg-silk px-3 py-2 text-center text-[15px] font-bold text-inktext outline-none focus:border-golddim"
              />
            </label>
          ))}
        </div>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="想请圆桌特别留意什么？（可选，如：事业、感情、今年运势）"
          className="mt-4 w-full rounded-lg border border-golddim/20 bg-silk px-3 py-2.5 text-[13px] text-inktext outline-none focus:border-golddim"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-golddim py-3 font-serif text-[15px] font-bold tracking-[0.2em] text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "七席正在入座……" : "开 席"}
        </button>
        {error && <p className="mt-3 text-center text-[12.5px] text-red-400">{error}</p>}
      </form>

      {loading && (
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2">
            {ROUNDTABLE_SCHOOLS.map((s, i) => (
              <span
                key={s.id}
                className="animate-pulse rounded-full border border-golddim/40 px-3 py-1 font-serif text-[12px] tracking-[0.1em] text-golddim"
                style={{ animationDelay: `${i * 0.35}s` }}
              >
                {s.name}
              </span>
            ))}
          </div>
          <p className="mt-4 font-serif text-[15px] tracking-[0.2em] text-golddim">七席入座 · 各执其法</p>
        </div>
      )}

      {result && (
        <div className="mt-12">
          {/* 先生开场（三句好话——先扬后抑） */}
          {result.opening && (
            <div className="mx-auto max-w-2xl rounded-2xl border border-golddim/30 bg-silk2 p-5 text-center shadow-card">
              <p className="font-serif text-[13px] font-bold tracking-[0.18em] text-golddim">先生开场</p>
              <p className="mt-2 whitespace-pre-line font-serif text-[14.5px] leading-[2] text-inktext">
                {result.opening}
              </p>
            </div>
          )}
          {/* 圆桌主视觉：中心命盘 + 7 席环绕（桌面）/ 纵向（移动） */}
          <div className="relative hidden md:block" style={{ height: 620 }}>
            {/* 桌面 */}
            <div
              className="absolute left-1/2 top-1/2 z-10 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-golddim/50 bg-silk2 text-center shadow-card"
            >
              <span className="text-[10.5px] tracking-[0.24em] text-inkmuted">今日命盘</span>
              <span className="mt-1 font-serif text-[15px] font-bold tracking-[0.12em] text-golddim">
                {gender === "male" ? "乾造" : "坤造"}
              </span>
              <span className="mt-1 text-[11.5px] text-inktext">
                {year}-{month}-{day} {hour}时
              </span>
              <span className="mt-1 text-[10.5px] text-inkmuted">七席同观 · 共识可参</span>
            </div>
            {result.seats.map((seat, i) => {
              const meta = ROUNDTABLE_SCHOOLS[i];
              const ang = (SEAT_ANGLES[i] * Math.PI) / 180;
              const x = 50 + 38 * Math.cos(ang);
              const y = 50 + 38 * Math.sin(ang);
              const f = followUp[i];
              return (
                <motion.div
                  key={seat.school}
                  initial={{ opacity: 0, scale: 0.7, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute w-[215px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-golddim/25 bg-silk2 p-3 shadow-card transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(201,166,86,0.45)]"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-[13px] font-bold tracking-[0.08em] text-golddim">
                      第{i + 1}席 · {seat.school}
                    </span>
                  </div>
                  <span className="text-[10px] text-inkmuted">{meta?.school}</span>
                  <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-[1.7] text-inktext">
                    {seat.content}
                  </p>
                  <button
                    onClick={() =>
                      setFollowUp((prev) => ({
                        ...prev,
                        [i]: prev[i] ?? { q: "", reply: "", busy: false },
                      }))
                    }
                    className="mt-1.5 text-[10.5px] tracking-[0.08em] text-golddim hover:underline"
                  >
                    深问此席 →
                  </button>
                  {f && (
                    <div className="mt-2 border-t border-golddim/15 pt-2">
                      <input
                        value={f.q}
                        onChange={(e) =>
                          setFollowUp((prev) => ({ ...prev, [i]: { ...prev[i], q: e.target.value } }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && askFollowUp(i)}
                        placeholder="问这一席……"
                        className="w-full rounded border border-golddim/20 bg-silk px-2 py-1.5 text-[11.5px] text-inktext outline-none"
                      />
                      <button
                        onClick={() => askFollowUp(i)}
                        disabled={f.busy}
                        className="mt-1.5 w-full rounded bg-golddim/80 py-1 text-[11px] tracking-[0.1em] text-white disabled:opacity-40"
                      >
                        {f.busy ? "思量中……" : "深谈"}
                      </button>
                      {f.reply && (
                        <p className="mt-1.5 whitespace-pre-line text-[11px] leading-[1.7] text-inkmuted">
                          {f.reply}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* 移动端：纵向堆叠（默认 2 席，其余折叠——减少首屏压力） */}
          <div className="grid gap-4 md:hidden">
            {result.seats.map((seat, i) => {
              const meta = ROUNDTABLE_SCHOOLS[i];
              const f = followUp[i];
              if (i >= 2 && !mobileExpanded) return null;
              return (
                <div key={seat.school} className="rounded-2xl border border-golddim/20 bg-silk2 p-4 shadow-card">
                  <span className="font-serif text-[14px] font-bold tracking-[0.1em] text-golddim">
                    第{i + 1}席 · {seat.school}
                  </span>
                  <span className="ml-2 text-[10.5px] text-inkmuted">{meta?.school}</span>
                  <p className="mt-2 whitespace-pre-line font-serif text-[13px] leading-[1.85] text-inktext">
                    {seat.content}
                  </p>
                  <button
                    onClick={() =>
                      setFollowUp((prev) => ({
                        ...prev,
                        [i]: prev[i] ?? { q: "", reply: "", busy: false },
                      }))
                    }
                    className="mt-2 text-[11px] tracking-[0.08em] text-golddim hover:underline"
                  >
                    深问此席 →
                  </button>
                  {f && (
                    <div className="mt-2 border-t border-golddim/15 pt-2">
                      <input
                        value={f.q}
                        onChange={(e) =>
                          setFollowUp((prev) => ({ ...prev, [i]: { ...prev[i], q: e.target.value } }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && askFollowUp(i)}
                        placeholder="问这一席……"
                        className="w-full rounded border border-golddim/20 bg-silk px-2 py-1.5 text-[12px] text-inktext outline-none"
                      />
                      <button
                        onClick={() => askFollowUp(i)}
                        disabled={f.busy}
                        className="mt-1.5 w-full rounded bg-golddim/80 py-1.5 text-[11.5px] tracking-[0.1em] text-white disabled:opacity-40"
                      >
                        {f.busy ? "思量中……" : "深谈"}
                      </button>
                      {f.reply && (
                        <p className="mt-1.5 whitespace-pre-line text-[12px] leading-[1.75] text-inkmuted">
                          {f.reply}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {result.seats.length > 2 && (
              <button
                type="button"
                onClick={() => setMobileExpanded((v) => !v)}
                className="w-full rounded-xl border border-golddim/30 bg-silk py-3 text-[12.5px] tracking-[0.12em] text-golddim transition hover:bg-silk2"
              >
                {mobileExpanded ? "收起其余席位 ↑" : `展开其余 ${result.seats.length - 2} 席 ↓`}
              </button>
            )}
          </div>

          {result.consensus && (
            <div className="mt-8 rounded-2xl border border-golddim/30 bg-silk p-6 shadow-card">
              <p className="font-serif text-[14px] font-bold tracking-[0.14em] text-golddim">
                共识与分歧
              </p>
              <p className="mt-3 whitespace-pre-line text-[13.5px] leading-[1.9] text-inktext">
                {result.consensus}
              </p>
            </div>
          )}
          {result.closing && (
            <div className="mt-4 rounded-2xl border border-golddim/15 bg-silk p-5 text-center">
              <p className="font-serif text-[13.5px] leading-[1.9] text-inktext">{result.closing}</p>
              <p className="mt-2 text-[11px] tracking-[0.2em] text-inkmuted">—— 先生收束</p>
            </div>
          )}
          <p className="mt-6 text-center text-[11px] text-inkmuted">
            圆桌各家所论皆传统命理文化的观察视角，仅供文化研习，不作任何决策建议。
          </p>
        </div>
      )}
    </div>
  );
}
