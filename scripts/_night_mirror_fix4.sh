#!/bin/bash
# 收尾补漏 v4：delta 推送镜像（浅取远程 tip → 新构建叠加提交 → 只传增量）+ 生产探针终检
cd /f/紫府文件/zifu-v9/zifu || exit 1
echo "== [diag] probe-cf.log head =="
head -c 500 /c/Users/asus/layout-audit/probe-cf.log 2>/dev/null
echo
echo "== [diag] dist size =="
du -sh dist/public 2>/dev/null | tail -1
echo "== [1] delta mirror push =="
T2=/c/Users/asus/AppData/Local/Temp/zifu-ghmirror2
rm -rf $T2 && mkdir -p $T2 && cd $T2
git init -q
git remote add origin https://github.com/Novakkk007/zifu.git
git config user.name Hermes && git config user.email hermes@zifu.dev
git fetch -q --depth=1 origin gh-pages 2>&1 | tail -2
git checkout -q -B gh-pages FETCH_HEAD 2>&1 | tail -2
echo "shallow_tip=$(git rev-parse --short HEAD 2>/dev/null)"
find . -maxdepth 1 ! -name .git ! -name . -exec rm -rf {} +
cp -r /f/紫府文件/zifu-v9/zifu/dist/public/. ./
git add -A
git commit -q -m "deploy: bazi first-screen rhythm (T-20260916)" 2>&1 | tail -2
NEWC=$(git rev-parse HEAD 2>/dev/null)
echo "new_commit=${NEWC:0:10}"
OUT=$(git -c http.postBuffer=524288000 -c http.version=HTTP/1.1 -c pack.threads=1 push -f origin HEAD:gh-pages 2>&1)
RC=$?
echo "push rc=$RC"; echo "$OUT" | tail -4
cd /f/紫府文件/zifu-v9/zifu
RSHA=$(git ls-remote https://github.com/Novakkk007/zifu.git gh-pages 2>/dev/null | cut -f1)
echo "remote_sha_after=$RSHA"
MIRROR_OK=0
[ -n "$NEWC" ] && [ "$RSHA" = "$NEWC" ] && MIRROR_OK=1
echo "MIRROR_OK=$MIRROR_OK"
echo "== [2] CF probe final =="
BAZI_BASE=https://zifu.pages.dev node scripts/shot-bazi.cjs > /c/Users/asus/layout-audit/probe-cf.log 2>&1 || true
head -c 300 /c/Users/asus/layout-audit/probe-cf.log 2>/dev/null
echo
grep -a -A8 '"bands"' /c/Users/asus/layout-audit/probe-cf.log | grep -a '"h"' | head -6
echo "== [3] GH probe final =="
sleep 40
BAZI_BASE=https://novakkk007.github.io/zifu node scripts/shot-bazi.cjs > /c/Users/asus/layout-audit/probe-gh.log 2>&1 || true
head -c 200 /c/Users/asus/layout-audit/probe-gh.log 2>/dev/null
echo
grep -a -A8 '"bands"' /c/Users/asus/layout-audit/probe-gh.log | grep -a '"h"' | head -6
echo "== [4] conditional notes =="
REFS="C:/Users/asus/AppData/Local/hermes/skills/development/zifu-palace-engineering/references/ui-motion-visual-qa.md"
if [ "$MIRROR_OK" = "0" ]; then
  printf '%s\n' '- 补记（09-16 凌晨）：gh-pages 镜像大包上传被网络重置（send-pack disconnect；temp-repo 全量 root 提交必然失败）——正解=delta 推（浅取远程 tip → 叠加新构建提交 → 只传增量）；小 delta 的 https 推送可行（主仓分支推送当晚即此模式成功）。' >> "$REFS"
  echo "note: mirror lag appended to refs"
fi
echo "== end $(date +%H:%M:%S) =="
