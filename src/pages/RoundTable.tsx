import { useEffect, useRef, useState } from "react";
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
import RoundTableStage from "@/components/RoundTableStage";

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
  const [progress, setProgress] = useState(0);
  // 进度节流：流式每块都回调会疯狂闪跳——≥700ms 或 +60 字才更新一次
  const progressGate = useRef({ last: 0, shown: 0 });
  const throttledProgress = (n: number) => {
    const now = Date.now();
    if (now - progressGate.current.last > 700 || n - progressGate.current.shown > 60) {
      progressGate.current = { last: now, shown: n };
      setProgress(n);
    }
  };
  const [error, setError] = useState("");
  const [result, setResult] = useState<RoundTableResult | null>(null);
  // 视图：stage=动态演出 / text=静态全文
  const [viewMode, setViewMode] = useState<'stage' | 'text'>('stage');
  // 保留本次页面选择，重演时沿用打字速度。
  const [typewriterSpeed, setTypewriterSpeed] = useState(34);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [summary, setSummary] = useState("");
  // 追问状态：{seatIndex, q, reply, busy}
  const [followUp, setFollowUp] = useState<Record<number, { q: string; reply: string; busy: boolean }>>({});

  // 从八字页「开圆桌」跳入：URL 带盘自动排盘+开席（仅首次）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const y = sp.get('year')
    if (!y) return
    const mo = Number(sp.get('month')), d = Number(sp.get('day'))
    const h = Number(sp.get('hour') ?? 12), min = Number(sp.get('minute') ?? 0)
    if (!mo || !d) return
    setSolar(sp.get('calendar') !== 'lunar')
    setGender(sp.get('gender') === 'female' ? 'female' : 'male')
    setYear(y)
    setMonth(String(mo))
    setDay(String(d))
    setHour(String(h))
    paipan.mutate({
      calendar: sp.get('calendar') === 'lunar' ? 'lunar' : 'solar',
      year: Number(y), month: mo, day: d, hour: h, minute: min,
      gender: sp.get('gender') === 'female' ? 'female' : 'male',
      useTrueSolarTime: false, dayRollover: 'zichu', title: '论命圆桌',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const paipan = useEngine(paipanBazi, {
    onSuccess: async (data) => {
      const chart = (data as { chart: unknown }).chart;
      if (!chart) return;
      const s = buildChartSummary(chart);
      setSummary(s);
      setLoading(true);
      setProgress(0);
      setError("");
      try {
        const res = await runRoundTable(s, question || undefined, undefined, throttledProgress);
        setResult(parseRoundTable(res.content));
        setViewMode('stage');
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
    <div className="relative min-h-screen overflow-hidden bg-deep2">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(560px 340px at 15% 8%, rgba(201,164,92,0.09), transparent 65%)," +
            "radial-gradient(600px 380px at 86% 90%, rgba(122,88,180,0.1), transparent 65%)",
          animation: "zifu-breathe 9s ease-in-out infinite",
        }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10">
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
        className="mx-auto mt-8 max-w-xl rounded-2xl border border-golddim/30 bg-silk2/70 p-6 shadow-[0_0_40px_rgba(201,164,92,0.08)] backdrop-blur-sm"
      >
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="flex gap-1 rounded-lg bg-deep3/80 p-1">
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
          <div className="flex gap-1 rounded-lg bg-deep3/80 p-1">
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
                className="mt-1 w-full rounded-lg border border-golddim/25 bg-deep3/70 px-3 py-2 text-center text-[15px] font-bold text-inktext outline-none focus:border-golddim"
              />
            </label>
          ))}
        </div>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="想请圆桌特别留意什么？（可选，如：事业、感情、今年运势）"
          className="mt-4 w-full rounded-lg border border-golddim/25 bg-deep3/70 px-3 py-2.5 text-[13px] text-inktext outline-none focus:border-golddim"
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
        <div className="mt-10">
          {/* 七席环坐 · 逐个入席（循环动画——思考期氛围） */}
          <div className="relative mx-auto h-[300px] max-w-[420px] overflow-hidden rounded-2xl border border-golddim/20 bg-silk2/60 sm:h-[330px]">
            <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-golddim/40 bg-silk text-center">
              <span className="text-[11px] tracking-[0.2em] text-inkmuted">候茶</span>
              <span className="mt-1 font-serif text-[13px] tracking-[0.12em] text-golddim">七席待开</span>
            </div>
            {ROUNDTABLE_SCHOOLS.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 14, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.45, duration: 0.55 }}
                className="absolute text-center"
                style={{
                  left: `${[8, 2, 14, 68, 82, 78, 42][i]}%`,
                  top: `${[8, 34, 66, 66, 34, 8, 78][i]}%`,
                  transform: 'translateX(-50%)',
                  width: 74,
                }}
              >
                <span
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-[15px] transition-shadow ${
                    progress > 0 && Math.floor(progress / 160) % 7 === i
                      ? 'border-gold bg-gold/10 shadow-[0_0_20px_rgba(201,164,92,0.6)]'
                      : 'border-golddim/40 bg-silk'
                  }`}
                >
                  {['📜', '📚', '🧭', '🌊', '🕯️', '🧧', '🔮'][i]}
                </span>
                <span className="mt-1 block text-[10.5px] leading-tight tracking-[0.03em] text-inkmuted">
                  {s.name.length > 5 ? s.name.slice(0, 5) : s.name}
                </span>
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-center font-serif text-[15px] tracking-[0.2em] text-golddim">七席入座 · 各执其法</p>
          <p className="mt-3 text-center text-[12.5px] leading-[1.9] text-inkmuted">
            {progress > 0
              ? `先生已落笔 ${progress} 字——好话不怕慢，先沏杯茶。`
              : '先生正与七席同观一盘，约需一两分钟——好话不怕慢，先沏杯茶。'}
          </p>
        </div>
      )}

      {result && (
        <div className="mt-12">
          {/* 视图切换条 */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setViewMode('stage')}
              className={`rounded-full border px-4 py-1.5 text-[12px] tracking-[0.1em] transition-colors ${
                viewMode === 'stage' ? 'border-gold/60 bg-gold/10 text-goldbright' : 'border-golddim/25 text-inkmuted hover:text-golddim'
              }`}
            >
              演出重演
            </button>
            <button
              onClick={() => setViewMode('text')}
              className={`rounded-full border px-4 py-1.5 text-[12px] tracking-[0.1em] transition-colors ${
                viewMode === 'text' ? 'border-gold/60 bg-gold/10 text-goldbright' : 'border-golddim/25 text-inkmuted hover:text-golddim'
              }`}
            >
              查看全文
            </button>
            <label className="flex items-center gap-2 text-[12px] text-inkmuted">
              打字速度
              <select
                value={typewriterSpeed}
                onChange={(e) => setTypewriterSpeed(Number(e.target.value))}
                className="rounded-full border border-golddim/30 bg-silk px-3 py-1.5 text-golddim focus-visible:outline focus-visible:outline-golddim"
              >
                <option value={68}>舒缓</option>
                <option value={34}>标准</option>
                <option value={17}>快速</option>
                <option value={0}>即时</option>
              </select>
            </label>
          </div>

          {viewMode === 'stage' ? (
            <RoundTableStage
              result={result}
              typewriterSpeed={typewriterSpeed}
              onFinish={() => setViewMode('text')}
              onSkip={() => setViewMode('text')}
            />
          ) : (
          <>
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
          </>
          )}
        </div>
      )}
      </div>

      <style>{`
        @keyframes zifu-breathe {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
