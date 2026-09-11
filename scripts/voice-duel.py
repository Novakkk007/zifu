#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
紫府语音对战工作台 v0.1
=====================================
能力闭环：听（麦克风+VAD）→ 懂（funasr 本地转写+术语纠错）→ 想（DeepSeek 对话，紫府人格+盘面注入）→ 说（macOS say 朗读）

用法：
  python3 voice-duel.py --once                # 单回合演示：等你说一段话 → 转写 → 我回应并朗读
  python3 voice-duel.py --once --timeout 300  # 等待语音出现的最长秒数（默认 120）
  python3 voice-duel.py --auto                # 连续对战：自动循环「听到→回应」（适合实战）

留档：每回合追加到 docs/duel/sessions/session-*.md（战报素材）
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import wave

import numpy as np
import sounddevice as sd

SR = 16000
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
SESS_DIR = os.path.join(PROJ, "docs", "duel", "sessions")

# ---------------- env ----------------
def load_env(path):
    env = {}
    if os.path.exists(path):
        for line in open(path, encoding="utf-8", errors="ignore"):
            s = line.strip()
            if not s or s.startswith("#") or "=" not in s:
                continue
            m = re.match(r"^(?:export\s+)?([A-Za-z_0-9]+)\s*=\s*(.*)$", s)
            if m:
                env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return env

ENV = load_env(os.path.expanduser("~/.hermes/.env"))

# ---------------- 录音 + VAD ----------------
def record_segment(start_timeout=120.0, silence=1.5, max_sec=60.0, min_sec=0.6):
    """等一段话说完：能量 VAD，检测到语音开始→录到连续静音结束。返回 float32 ndarray 或 None"""
    block = 0.1
    nblock = int(SR * block)
    try:
        cal = sd.rec(int(SR * 0.8), samplerate=SR, channels=1, dtype="float32")
        sd.wait()
    except Exception as e:
        print(f"[mic] 无法访问麦克风：{e}", flush=True)
        print("[mic] 请到 系统设置 → 隐私与安全性 → 麦克风 里允许本进程访问", flush=True)
        return None
    noise = float(np.sqrt(np.mean(cal ** 2))) if cal.size else 1e-4
    thr = max(noise * 2.5, 0.006)
    print(f"[mic] 环境噪声 {noise:.4f}，触发阈值 {thr:.4f}", flush=True)

    buf = []
    speaking = False
    sil_blocks = 0
    t0 = time.time()
    print(f"[mic] 等待说话（{start_timeout:.0f}s 内）...", flush=True)
    try:
        with sd.InputStream(samplerate=SR, channels=1, dtype="float32", blocksize=nblock) as st:
            while True:
                data, _ = st.read(nblock)
                x = data[:, 0].copy()
                r = float(np.sqrt(np.mean(x ** 2)))
                now = time.time()
                if not speaking:
                    if r > thr:
                        speaking = True
                        buf = [x]
                        print("[mic] 检测到语音，录音中...", flush=True)
                    elif now - t0 > start_timeout:
                        return None
                else:
                    buf.append(x)
                    sil_blocks = 0 if r >= thr else sil_blocks + 1
                    seg_len = sum(len(b) for b in buf) / SR
                    if sil_blocks * block >= silence and seg_len >= min_sec:
                        break
                    if seg_len >= max_sec:
                        break
    except KeyboardInterrupt:
        return None
    if not buf:
        return None
    audio = np.concatenate(buf)
    dur = len(audio) / SR
    if dur < min_sec:
        return None
    print(f"[mic] 段落结束：{dur:.1f}s", flush=True)
    return audio

def save_wav(audio, path):
    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

def normalize_gain(audio, target=0.06, max_gain=12.0):
    """电平过低时软件放大（麦克风远/声小时救场），限幅防爆"""
    rms = float(np.sqrt(np.mean(audio ** 2))) or 1e-6
    gain = min(target / rms, max_gain)
    if gain <= 1.05:
        return audio
    print(f"[mic] 软件增益 x{gain:.1f}（原电平 {rms:.4f} 偏低）", flush=True)
    return np.clip(audio * gain, -1, 1).astype(np.float32)

# ---------------- ASR ----------------
_ASR = None
HOT = ("乾造 坤造 日主 日元 月令 提纲 得令 得地 得势 通根 透干 藏干 用神 忌神 喜神 调候 扶抑 格局 "
       "身强 身弱 从格 从强 从弱 比肩 劫财 食神 伤官 正财 偏财 正官 七杀 正印 偏印 枭神 官杀 财星 印星 "
       "十神 五行 生克 制化 刑冲合害 三合 六合 三会 相冲 相刑 相害 大运 流年 起运 空亡 十二长生 神煞 "
       "天乙贵人 文昌 驿马 桃花 华盖 将星 羊刃 禄神 天德 月德 孤辰 寡宿 伤官配印 伤官见官 食神制杀 "
       "财官相生 官印相生 杀印相生 枭神夺食 比劫夺财 木火通明 金水相生 取用")
FIX = {"前灶": "乾造", "日烛": "日主", "的令": "得令", "图鉴": "通根", "月铃": "月令",
       "殉空": "旬空", "洋刃": "羊刃", "七沙": "七杀", "商官": "伤官", "师神": "食神"}

def get_asr():
    global _ASR
    if _ASR is None:
        from funasr import AutoModel
        _ASR = AutoModel(model="paraformer-zh", vad_model="fsmn-vad",
                         punc_model="ct-punc", disable_update=True)
    return _ASR

def transcribe(wav_path):
    res = get_asr().generate(input=wav_path, batch_size_s=60, hotword=HOT)
    text = (res[0]["text"] if res else "").strip()
    for k, v in FIX.items():
        text = text.replace(k, v)
    return text

# ---------------- 对话大脑 ----------------
def chat(messages, temperature=0.7):
    import requests
    key = ENV.get("DEEPSEEK_API_KEY")
    base = ENV.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
    model = ENV.get("ZIFU_VOICE_MODEL", "deepseek-flash")
    if not key:
        raise RuntimeError("DEEPSEEK_API_KEY 缺失")
    r = requests.post(f"{base}/chat/completions",
                      headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                      json={"model": model, "messages": messages,
                            "temperature": temperature, "max_tokens": 2000},
                      timeout=90)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()

# ---------------- 盘面注入 ----------------
def load_paipan_text():
    p = "/tmp/zifu_paipan_demo.json"
    if not os.path.exists(p):
        return ""
    try:
        c = json.load(open(p))
        pil = c["pillars"]
        def gz(x): return x.get("ganzhi", "?") if x else "——"
        st = c.get("wuxing", {}).get("strength", {})
        ys = c.get("yongshen", {})
        shensha = "、".join([s.get("name", "?") for s in c.get("shensha", [])])
        dayun = "，".join([f"{s['ganzhi']}({s['startAge']}岁起)" for s in c["dayun"]["steps"][:3]])
        return "\n".join([
            f"四柱：{gz(pil['year'])} {gz(pil['month'])} {gz(pil['day'])} {gz(pil['hour'])}",
            f"日主：{c.get('dayMaster')}（{c.get('dayMasterWuxing')}）",
            f"旺衰：{st.get('total')}/100「{st.get('grade')}」",
            f"扶抑用神：{ys.get('yongshen')}；喜：{ys.get('xishen')}；忌：{ys.get('jishen')}",
            f"神煞：{shensha}",
            f"大运（前3步）：{dayun}",
        ])
    except Exception as e:
        return f"（盘面读取失败：{e}）"

SYSTEM_TMPL = """你是「紫府」——一个八字推演系统的语音化身，正在与一位资深命理老师进行一场友善而认真的切磋（打擂对拆）。
你现在通过语音讲话（你的输出会被直接朗读出来，所以只说人话）。

【当前盘面（紫府引擎实排，数据权威）】
{paipan}

【对打规则】
1. 语气：自信但谦逊。敢下断语，也敢坦然说"这一点我还没有把握"。
2. 对方说完后：先用一句话抓住她论断的要点，再给出你的判断、你的依据、或者你的追问。
3. 遇到与你不同的断法：追问依据——"请问这一断是从哪里出来的？"然后说出你自己的思路。
4. 学术诚实：不确定就标注"待考"，绝不硬编。
5. 语音直出：短句为主，每次回应 2-4 句话，把一点讲透；不要书面语、不要列清单、不要堆数字。
6. 你在"以战养学"：对方的每个断法都值得你追问与吸收。

【背景】这场切磋的对话会被完整记录，用于赛后复盘与经验吸收。"""

def build_system():
    return SYSTEM_TMPL.format(paipan=load_paipan_text() or "（盘面待注入）")

# ---------------- 说 ----------------
def speak(text, voice="Tingting"):
    subprocess.run(["say", "-v", voice, text], check=False)

def archive(user_text, reply):
    os.makedirs(SESS_DIR, exist_ok=True)
    fp = os.path.join(SESS_DIR, time.strftime("session-%Y%m%d") + ".md")
    with open(fp, "a", encoding="utf-8") as f:
        f.write(f"\n## {time.strftime('%H:%M:%S')}\n- [对方] {user_text}\n- [紫府] {reply}\n")

# ---------------- 主流程 ----------------
def run_once(args):
    audio = record_segment(start_timeout=args.timeout)
    if audio is None:
        print("[!] 未检测到语音（麦克风权限/环境安静/超时）", flush=True)
        sys.exit(2)
    audio = normalize_gain(audio)
    tmp = tempfile.mktemp(suffix=".wav", dir="/tmp")
    save_wav(audio, tmp)
    t = transcribe(tmp)
    print(f"[ASR] {t}", flush=True)
    if not t:
        print("[!] 转写为空", flush=True)
        sys.exit(2)
    msgs = [{"role": "system", "content": build_system()}, {"role": "user", "content": t}]
    reply = chat(msgs)
    print(f"[紫府] {reply}", flush=True)
    speak(reply)
    archive(t, reply)
    print("[done] 单回合完成", flush=True)

def run_auto(args):
    print("=== 紫府语音对战 · 连续模式（Ctrl-C 退出）===", flush=True)
    history = [{"role": "system", "content": build_system()}]
    while True:
        try:
            audio = record_segment(start_timeout=args.timeout, silence=1.5)
        except KeyboardInterrupt:
            break
        if audio is None:
            print("[mic] 这段没听到，继续等...", flush=True)
            continue
        audio = normalize_gain(audio)
        tmp = tempfile.mktemp(suffix=".wav", dir="/tmp")
        save_wav(audio, tmp)
        t = transcribe(tmp)
        print(f"[对方] {t}", flush=True)
        if not t:
            continue
        history.append({"role": "user", "content": t})
        reply = chat(history)
        history.append({"role": "assistant", "content": reply})
        print(f"[紫府] {reply}", flush=True)
        speak(reply)
        archive(t, reply)

def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--once", action="store_true", help="单回合：等一段话→回应")
    g.add_argument("--auto", action="store_true", help="连续对战循环")
    ap.add_argument("--timeout", type=float, default=120.0, help="等待语音出现的最长秒数")
    args = ap.parse_args()
    print("[sys] 预热语音识别模型（首次约 20s，之后瞬时）...", flush=True)
    get_asr()
    print("[sys] 模型就绪，开始监听", flush=True)
    if args.once:
        run_once(args)
    else:
        run_auto(args)

if __name__ == "__main__":
    main()
