import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useEngine } from "@/hooks/useEngine";
import { paipanBazi } from "@/engines/client/bazi";
import { buildChartSummary } from "@/lib/ai-direct";
import type { PaipanPayload } from "@/components/bazi-v2/api";
import { runGuanzhao } from "@/lib/guanzhao";
import { usePageMeta } from "@/lib/page-meta";

export default function GuanzhaoPage() {
  usePageMeta(
    "观照见性 · 紫府",
    "相由心生，AI 观照参详——以生辰为底色，如月照水，映照当下的你。不下断语，不预言祸福。"
  );

  // URL 带盘（八字页「去观照」跳入）——初始值直接读取
  const urlInit = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()
  const urlYear = urlInit.get('year')
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  const [year, setYear] = useState(urlYear ?? "1990");
  const [month, setMonth] = useState(urlInit.get('month') ?? "6");
  const [day, setDay] = useState(urlInit.get('day') ?? "15");
  const [hour, setHour] = useState(urlInit.get('hour') ?? "12");
  const [gender, setGender] = useState<"male" | "female">(
    urlInit.get('gender') === 'female' ? "female" : "male"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");

  const paipan = useEngine(paipanBazi, {
    onSuccess: async (data) => {
      const chart = (data as { chart: unknown }).chart;
      if (!chart) return;
      setLoading(true);
      setError("");
      try {
        const res = await runGuanzhao(buildChartSummary(chart), name || undefined, focus || undefined);
        setContent(res.content);
      } catch (e) {
        setError(e instanceof Error ? e.message : "观照未成，请稍后再试");
      } finally {
        setLoading(false);
      }
    },
    onError: (e) => setError(e?.message ?? "排盘失败"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setContent("");
    const y = Number(year), mo = Number(month), d = Number(day), h = Number(hour);
    if (!y || y < 1900 || y > 2100) return setError("年份请填 1900-2100 之间的数字");
    if (!mo || mo < 1 || mo > 12) return setError("月份请填 1-12 之间的数字");
    if (!d || d < 1 || d > 31) return setError("日期请填 1-31 之间的数字");
    if (h === 24) {
      paipan.mutate({
        calendar: "solar", year: y, month: mo, day: d, hour: 0, minute: 0,
        gender, useTrueSolarTime: false, dayRollover: "zichu", title: "观照见性",
      });
      return;
    }
    if (isNaN(h) || h < 0 || h > 23) return setError("时辰请填 0-23 之间的数字（24 点即午夜 0 点）");
    const payload: PaipanPayload = {
      calendar: "solar",
      year: y, month: mo, day: d, hour: h, minute: 0,
      gender,
      useTrueSolarTime: false,
      dayRollover: "zichu",
      title: "观照见性",
    };
    paipan.mutate(payload);
  };

  // 从八字页「去观照」跳入：URL 带盘自动排盘（仅首次）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const y = sp.get('year')
    if (!y) return
    const mo = Number(sp.get('month')), d = Number(sp.get('day'))
    if (!mo || !d) return
    paipan.mutate({
      calendar: sp.get('calendar') === 'lunar' ? 'lunar' : 'solar',
      year: Number(y), month: mo, day: d,
      hour: Number(sp.get('hour') ?? 12), minute: Number(sp.get('minute') ?? 0),
      gender: sp.get('gender') === 'female' ? 'female' : 'male',
      useTrueSolarTime: false, dayRollover: 'zichu', title: '观照见性',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-deep2">
      {/* 夜穹呼吸光 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(520px 320px at 20% 10%, rgba(201,164,92,0.09), transparent 65%)," +
            "radial-gradient(560px 360px at 82% 86%, rgba(122,88,180,0.11), transparent 65%)",
          animation: "zifu-breathe 9s ease-in-out infinite",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center font-serif text-[28px] font-bold tracking-[0.26em] text-goldbright"
        >
          观 照
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="mt-3 text-center text-[13px] leading-[2] tracking-[0.08em] text-silkmuted"
        >
          照见 · 照亮 · 照护
          <br />
          看盘里困住你的循环，点一盏灯——不下断语，不预言祸福。
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          onSubmit={submit}
          className="mx-auto mt-10 max-w-xl rounded-2xl border border-golddim/30 bg-silk2/70 p-6 shadow-[0_0_40px_rgba(201,164,92,0.07)] backdrop-blur-sm"
        >
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[11.5px] tracking-[0.14em] text-inkmuted">称谓（可选）</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如何称呼你"
              className="mt-1 w-full rounded-lg border border-golddim/20 bg-silk px-3 py-2.5 text-[13px] text-inktext outline-none focus:border-golddim"
            />
          </label>
          <label className="block">
            <span className="text-[11.5px] tracking-[0.14em] text-inkmuted">想被照见的主题（可选）</span>
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="如：最近的困惑"
              className="mt-1 w-full rounded-lg border border-golddim/20 bg-silk px-3 py-2.5 text-[13px] text-inktext outline-none focus:border-golddim"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1 rounded-lg bg-silk p-1">
            {[
              { k: "male", t: "男" },
              { k: "female", t: "女" },
            ].map((o) => (
              <button
                key={o.k}
                type="button"
                onClick={() => setGender(o.k as "male" | "female")}
                className={`rounded-md px-4 py-1.5 text-[12.5px] tracking-[0.1em] ${
                  gender === o.k ? "bg-golddim text-white" : "text-inkmuted"
                }`}
              >
                {o.t}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-inkmuted">生辰（公历）</div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {[
            { label: "年", v: year, set: setYear, ph: "1990" },
            { label: "月", v: month, set: setMonth, ph: "6" },
            { label: "日", v: day, set: setDay, ph: "15" },
            { label: "时", v: hour, set: setHour, ph: "12" },
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
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-golddim py-3 font-serif text-[15px] font-bold tracking-[0.2em] text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "点灯中……" : "照 见"}
        </button>
        {error && <p className="mt-3 text-center text-[12.5px] text-red-400">{error}</p>}
        </motion.form>

        {loading && (
          <div className="mt-12 text-center">
            <p className="animate-pulse font-serif text-[15px] tracking-[0.2em] text-golddim">
              灯已点起 · 月在水中
            </p>
          </div>
        )}

        {content && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="mt-10 rounded-2xl border border-gold/25 bg-silk2/60 p-8 shadow-[0_0_44px_rgba(201,164,92,0.1)] backdrop-blur-sm"
          >
            <p className="whitespace-pre-line text-center font-serif text-[15.5px] leading-[2.1] text-silktext">
              {content}
            </p>
            <p className="mt-6 text-center text-[11px] tracking-[0.2em] text-inkmuted">
              —— 先生观照 · 相由心生
            </p>
          </motion.div>
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
