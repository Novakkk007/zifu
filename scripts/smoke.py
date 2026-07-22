#!/usr/bin/env python3
"""紫府 9 引擎本地冒烟：游客模式（无 DB/无 OAuth）逐项验证。"""
import json, urllib.request, urllib.error, sys

BASE = "http://localhost:3000"

def trpc(proc, payload):
    body = json.dumps({"json": payload}).encode()
    req = urllib.request.Request(f"{BASE}/api/trpc/{proc}", data=body,
                                 headers={"content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            d = json.loads(r.read())
            j = d.get("result", {}).get("data", {}).get("json", {})
            return 200, j
    except urllib.error.HTTPError as e:
        return e.code, e.read()[:500].decode(errors="replace")
    except Exception as e:
        return None, str(e)

birth = {"calendar":"solar","year":1990,"month":5,"day":15,"hour":14,"minute":30,
         "gender":"male","useTrueSolarTime":False,"dayRollover":"zichu"}

results = []
def report(name, ok, detail):
    results.append((name, ok, detail))
    print(f"{'✓' if ok else '✗'} {name}: {detail}")

# 1. 八字
s, r = trpc("bazi.paipan", birth)
if s == 200:
    c = r.get("chart", r)
    fp = c.get("fourPillars") or c.get("pillars") or {}
    meta = r.get("result", r).get("meta", {})
    report("bazi.paipan", True, f"ruleset={c.get('rulesetVersion')} precision={meta.get('precision', '?')} 四柱keys={list(fp) if isinstance(fp, dict) else fp}")
else:
    report("bazi.paipan", False, f"{s} {str(r)[:200]}")

# 2. 六爻 coinToss×6 → cast
coins, ok = [], True
for i in range(1, 7):
    s, r = trpc("liuyao.coinToss", {"tossIndex": i})
    if s != 200:
        report("liuyao.coinToss", False, f"{s} {str(r)[:200]}"); ok = False; break
    d = r.get("result", r).get("data", r)
    coins.extend(d.get("coins", []))
if ok:
    s, r = trpc("liuyao.cast", {"coins": coins, "question": "冒烟测试"})
    if s == 200:
        d = r.get("result", r).get("data", r); meta = r.get("result", r).get("meta", {})
        g = d.get("benGua") or d.get("hexagram") or {}
        name = g.get("name") if isinstance(g, dict) else g
        report("liuyao.cast", True, f"precision={meta.get('precision')} 本卦={name} coins={coins}")
    else:
        report("liuyao.cast", False, f"{s} {str(r)[:200]}")

# 3. 紫微（hourBranch：0=子 … 7=未；14:30 为未时）
s, r = trpc("ziwei.paipan", {"calendar":"solar","year":1990,"month":5,"day":15,"hourBranch":7,"gender":"male"})
if s == 200:
    meta = r.get("result", r).get("meta", {})
    report("ziwei.paipan", True, f"precision={meta.get('precision')} variant={meta.get('ruleVariant')}")
else:
    report("ziwei.paipan", False, f"{s} {str(r)[:200]}")

# 4. 奇门（输入 schema 未知，先探）
s, r = trpc("qimen.qiju", {"datetime": "1990-05-15T14:30:00+08:00"})
if s != 200:
    s, r = trpc("qimen.qiju", {"year":1990,"month":5,"day":15,"hour":14,"minute":30})
if s == 200:
    meta = r.get("result", r).get("meta", {})
    report("qimen.qiju", True, f"precision={meta.get('precision')}")
else:
    report("qimen.qiju", False, f"{s} {str(r)[:260]}")

# 5. 大六壬（datetime 为 object）
s, r = trpc("daliuren.qike", {"datetime":{"year":1990,"month":5,"day":15,"hour":14,"minute":30},"ianaTimezone":"Asia/Shanghai"})
if s == 200:
    meta = r.get("result", r).get("meta", {})
    report("daliuren.qike", True, f"precision={meta.get('precision')}")
else:
    report("daliuren.qike", False, f"{s} {str(r)[:260]}")

# 6. 七政四余（datetime 为 ISO 字符串）
s, r = trpc("qizheng.paipan", {"datetime":"1990-05-15T14:30:00+08:00","gender":"male"})
if s == 200:
    meta = r.get("result", r).get("meta", {})
    report("qizheng.paipan", True, f"precision={meta.get('precision')} warnings={meta.get('warnings')}")
else:
    report("qizheng.paipan", False, f"{s} {str(r)[:260]}")

# 7. 合盘
birth2 = dict(birth, year=1992, month=8, day=20, gender="female")
s, r = trpc("hepan.analyze", {"personA": birth, "personB": birth2})
if s == 200:
    meta = r.get("result", r).get("meta", {})
    report("hepan.analyze", True, f"precision={meta.get('precision')}")
else:
    report("hepan.analyze", False, f"{s} {str(r)[:200]}")

# 8. 三术合参
s, r = trpc("hecan.analyze", birth)
if s == 200:
    d = r.get("result", r).get("data", r); meta = r.get("result", r).get("meta", {})
    report("hecan.analyze", True, f"precision={meta.get('precision')} availableArts={d.get('availableArts')}")
else:
    report("hecan.analyze", False, f"{s} {str(r)[:200]}")

# 9. 灵签（需登录，预期 401/403 而非 500）
s, r = trpc("draws.lingqian", {})
report("draws.lingqian(游客应被拒)", s in (401, 403), f"HTTP {s}（预期 401/403，证明鉴权生效）")

print("\n=== 汇总 ===")
passed = sum(1 for _, ok, _ in results if ok)
print(f"{passed}/{len(results)} 通过")
sys.exit(0 if passed == len(results) else 1)
