#!/bin/bash
# 紫府页面截图：Chrome headless，多页面多尺寸
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE="http://localhost:3000"
OUT="/Users/huangjunmian/zifu-palace/shots"
mkdir -p "$OUT"

shoot() { # $1=路由 $2=宽度 $3=高度 $4=标签
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --window-size="$2,$3" --virtual-time-budget=9000 \
    --screenshot="$OUT/$4.png" "$BASE$1" 2>/dev/null
  echo "$4.png $(stat -f%z "$OUT/$4.png" 2>/dev/null) bytes"
}

# 桌面 1440
shoot "/" 1440 2400 home-desktop
shoot "/bazi" 1440 1800 bazi-desktop
shoot "/hecan" 1440 1800 hecan-desktop
shoot "/ziwei" 1440 1800 ziwei-desktop
shoot "/liuyao" 1440 1800 liuyao-desktop
shoot "/wiki" 1440 1800 wiki-desktop
# 移动 390
shoot "/" 390 3000 home-mobile
shoot "/bazi" 390 1600 bazi-mobile
