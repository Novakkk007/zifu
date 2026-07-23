#!/usr/bin/env python3
"""
紫府自托管字体下载工具

从 Google Fonts 下载所需字体的 woff2 文件到 public/fonts/

用法：
  python3 scripts/download-fonts.py

输出：
  public/fonts/noto-serif-sc-400.woff2
  public/fonts/noto-serif-sc-600.woff2
  ...（共 12 个文件，约 8-15MB 总计）

备选方案（本脚本网络不通时）：
  1. 打开 https://gwfh.mranftl.com/fonts
  2. 搜索 Noto Serif SC / Noto Sans SC / Cormorant Garamond
  3. 选 charset: latin + chinese-simplified
  4. 下载 woff2，放入 public/fonts/
"""

import os
import urllib.request
import json

FONTS_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "fonts")

# Google Fonts CSS API → woff2 URL 映射
# 每个字体取一个 woff2 CSS，解析出实际文件 URL
FONT_REQUESTS = [
    # font-family, weights, subset hint
    ("Noto Serif SC", [400, 600, 700, 900]),
    ("Noto Sans SC", [300, 400, 500]),
    ("Cormorant Garamond", [400, 500], ["400i", "500i"]),
]

def download_google_font_css(family, weight, italic=False):
    """通过 Google Fonts CSS API 获取 woff2 URL"""
    style = "italic" if italic else "normal"
    url = (
        f"https://fonts.googleapis.com/css2"
        f"?family={family.replace(' ', '+')}:wght@{weight}"
        f"&display=swap"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    css = urllib.request.urlopen(req).read().decode("utf-8")
    # 解析 url() 中的 woff2 链接
    import re
    urls = re.findall(r"url\((https://[^)]+\.woff2)\)", css)
    if urls:
        return urls[0]
    return None

def main():
    os.makedirs(FONTS_DIR, exist_ok=True)
    downloaded = 0

    for family, weights, *italics in FONT_REQUESTS:
        italic_weights = italics[0] if italics else []
        for w in weights:
            # normal
            url = download_google_font_css(family, w)
            if url:
                ext = "i.woff2" if False else ".woff2"
                fname = family.lower().replace(" ", "-") + f"-{w}{ext}"
                # strip italic suffix from normal weights
                fname = fname.replace(".woff2", ".woff2")
                path = os.path.join(FONTS_DIR, fname)
                print(f"  ⬇ {fname} ← {url[:80]}...")
                urllib.request.urlretrieve(url, path)
                downloaded += 1
            else:
                print(f"  ✗ {family} {w}: no woff2 URL found")

        for w in italic_weights:
            w_int = int(w.replace("i", ""))
            url = download_google_font_css(family, w_int, italic=True)
            if url:
                fname = family.lower().replace(" ", "-") + f"-{w}.woff2"
                path = os.path.join(FONTS_DIR, fname)
                print(f"  ⬇ {fname} ← {url[:80]}...")
                urllib.request.urlretrieve(url, path)
                downloaded += 1

    print(f"\n✅ 下载完成：{downloaded} 个字体文件 → {FONTS_DIR}")
    print("现在把 index.html 中的 Google Fonts <link> 替换为：")
    print('  <link rel="stylesheet" href="/fonts/fonts.css" />')
    print("（注释掉原来的 Google Fonts <link> 即可）")

if __name__ == "__main__":
    main()
