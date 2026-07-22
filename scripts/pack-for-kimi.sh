#!/bin/bash
# 把紫府核心源码按模块拼接为若干 .md 纯文本（供 Kimi/Codex 直接全文读取）
SRC=/Users/huangjunmian/zifu-palace
OUT=/Users/huangjunmian/Desktop/zifu-for-kimi
rm -rf "$OUT" && mkdir -p "$OUT"
cd "$SRC"

pack() { # $1=输出名；其余=git ls-files 路径模式（精确列举，不用排除法）
  local name=$1; shift
  local files=$(git ls-files "$@" | grep -v -E '\.(png|webp|jpg|ico|woff2?)$|package-lock' | sort -u)
  {
    echo "# 紫府源码包 · $name"
    echo ""
    echo "> 本文档由脚本拼接，每个文件以 \`===== 路径 =====\` 分隔。项目上下文先读 docs/review-notes.md。"
    for f in $files; do
      echo ""
      echo "===== $f ====="
      echo '```'
      cat "$f"
      echo '```'
    done
  } > "$OUT/$name"
  echo "$name → $(du -h "$OUT/$name" | cut -f1) ($(echo "$files" | wc -w | tr -d ' ') 个文件)"
}

pack "01-项目上下文与配置.md" \
  README.md info.md plan.md .env.example components.json \
  package.json tsconfig.json tsconfig.app.json tsconfig.node.json tsconfig.server.json \
  vite.config.ts vitest.config.ts tailwind.config.js postcss.config.js eslint.config.js \
  drizzle.config.ts index.html docs/
pack "02-术数引擎-contracts.md" contracts/
pack "03-后端-api.md" api/ ":!:api/*.test.ts" ":!:api/bazi-core"
pack "04-后端测试.md" "api/*.test.ts" api/bazi-core/
pack "05-数据库-db.md" db/
pack "06-前端-pages.md" src/pages/
pack "07-前端-components.md" src/components/
pack "08-前端-其他.md" src/hooks/ src/lib/ src/providers/ src/data/ src/const.ts src/main.tsx src/App.tsx src/index.css
pack "09-脚本-scripts.md" scripts/
