# -*- coding: utf-8 -*-
"""紫府 · 公开渠道八字案例收集管道（Hermes 自实现 v2）
来源：Bing 搜索公开命理论坛帖子（无需登录）。
输出：F:\\紫府文件\\tasks\\cases\\found-YYYY-MM-DD.json（脱敏：只存生辰+反馈摘要）
用法：python zifu_cases.py [关键词]
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime

OUT_DIR = r'F:\紫府文件\tasks\cases'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

# 生辰提取模式（优先级从高到低）
PATTERNS = [
    # 完整公历：1990年5月15日 / 1990-05-15 / 1990.5.15
    re.compile(r'(1[89]\d{2}|20[0-2]\d)\s*[年\-\./]\s*(\d{1,2})\s*[月\-\./]\s*(\d{1,2})\s*[日号]?'),
    # 农历：农历1990年五月初五
    re.compile(r'农历\s*(1[89]\d{2}|20[0-2]\d)\s*年\s*([一二三四五六七八九十]{1,3})\s*月'),
]
HOUR_PATTERNS = [
    re.compile(r'(子|丑|寅|卯|辰|巳|午|未|申|酉|戌|亥)\s*时'),
    re.compile(r'(\d{1,2})\s*[点时]\s*(\d{1,2})?\s*分?'),
]
GENDER_PATTERNS = [
    re.compile(r'(男|女)[^\u4e00-\u9fff]?'),
    re.compile(r'性别[：:\s]*(男|女)'),
]


def fetch_bing(keyword: str, page: int = 0) -> str:
    q = urllib.parse.quote(keyword)
    url = f'https://cn.bing.com/search?q={q}&first={page * 10}'
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', 'ignore')


def baidu_search_urls(keyword: str) -> list:
    """百度搜索 → 结果 URL 列表（跟随跳转）"""
    from baidu_search import baidu_search
    out = []
    for r in baidu_search(keyword, 8):
        link = r['url']
        try:
            req = urllib.request.Request(link, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=15) as resp:
                out.append((resp.geturl(), r['title']))
        except Exception:
            continue
    return out


def bing_result_urls(html: str) -> list:
    """提取 Bing 搜索结果的外部 URL（跳过 bing/微软域名）"""
    urls = []
    for m in re.finditer(r'<a[^>]+href="(https?://[^"]+)"', html):
        u = m.group(1)
        if any(dom in u for dom in ('bing.com', 'microsoft.com', 'go.microsoft')):
            continue
        if '?' in u and 'r.bing.com' in u:
            continue
        urls.append(u)
    seen, out = set(), []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out[:6]


def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        html = r.read().decode('utf-8', 'ignore')
    # 去 HTML 标签，保留文本
    text = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', html)
    text = re.sub(r'<[^>]+>', ' ', text)
    return re.sub(r'\s+', ' ', text)[:20000]


def extract_cases(text: str) -> list:
    cases = []
    for m in PATTERNS[0].finditer(text):
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if not (1900 <= y <= 2026 and 1 <= mo <= 12 and 1 <= d <= 31):
            continue
        # 上下文窗口（匹配前后 120 字）
        ctx = text[max(0, m.start() - 120):m.end() + 120]
        hour = None
        for hm in HOUR_PATTERNS:
            hm_ = hm.search(ctx)
            if hm_:
                zh = {'子': 0, '丑': 1, '寅': 3, '卯': 5, '辰': 7, '巳': 9,
                      '午': 11, '未': 13, '申': 15, '酉': 17, '戌': 19, '亥': 21}
                if hm_.group(1) in zh:
                    hour = zh[hm_.group(1)]
                elif hm_.group(1).isdigit():
                    hour = int(hm_.group(1))
                break
        gender = None
        for gm in GENDER_PATTERNS:
            g = gm.search(ctx)
            if g:
                gender = g.group(1) if '性别' not in g.group(0) else g.group(1)
                if gender in ('男', '女'):
                    break
                gender = None
        cases.append({
            'solar': f'{y:04d}-{mo:02d}-{d:02d}',
            'hour': hour,
            'minute': None,
            'gender': gender,
            'source': 'bing-public',
            'note': ctx[:150].replace('\n', ' '),  # 公开反馈摘要（截断，脱敏）
        })
    return cases


def main():
    kw = sys.argv[1] if len(sys.argv) > 1 else '求看八字 1990年 时辰 男'
    all_cases = []
    seen = set()
    urls = baidu_search_urls(kw)
    print(f'百度结果 {len(urls)} 个')
    for u, title in urls:
        try:
            text = fetch_page(u)
        except Exception:
            continue
        if any(k in text[:300] for k in ('免费排盘', '在线排盘', '起名网', '测吉凶', '快速注册', '登录')):
            continue
        cases = extract_cases(text)
        for c in cases:
            key = (c['solar'], c['hour'])
            if key not in seen:
                seen.add(key)
                all_cases.append(c)
                print(f'  ✅ {c["solar"]} 时辰{c["hour"]} 性别{c["gender"]} ← {title[:35]}')
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f'found-{datetime.now().strftime("%Y-%m-%d")}.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump({'date': datetime.now().strftime('%Y-%m-%d'), 'keyword': kw,
                   'cases': all_cases}, f, ensure_ascii=False, indent=2)
    print(f'✅ 共 {len(all_cases)} 条去重案例 → {out}')


if __name__ == '__main__':
    main()
