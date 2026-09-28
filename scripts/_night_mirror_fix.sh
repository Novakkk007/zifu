#!/bin/bash
# 八字轮收尾补漏：gh-pages 镜像重推 + 双站生产探针复核
cd /f/紫府文件/zifu-v9/zifu || exit 1
TMP=/c/Users/asus/AppData/Local/Temp/zifu-ghmirror
echo "== temp repo state =="
(cd $TMP && git log --oneline -1 && git status -s | head -3)
echo "LOCAL_SHA=$(cd $TMP && git rev-parse HEAD)"
echo "REMOTE_SHA=$(git ls-remote https://github.com/Novakkk007/zifu.git gh-pages 2>/dev/null | cut -f1)"
echo "== mirror push retry =="
PUSHED=0
for i in 1 2 3; do
  if (cd $TMP && git -c http.postBuffer=524288000 -c http.version=HTTP/1.1 push -f https://github.com/Novakkk007/zifu.git HEAD:gh-pages 2>&1 | tail -3); then
    PUSHED=$i
    break
  fi
  echo "attempt $i failed; sleep"; sleep 12
done
echo "MIRROR_PUSHED_ATTEMPT=$PUSHED"
echo "REMOTE_SHA_AFTER=$(git ls-remote https://github.com/Novakkk007/zifu.git gh-pages 2>/dev/null | cut -f1)"
echo "== probe CF =="
BAZI_BASE=https://zifu.pages.dev node scripts/shot-bazi.cjs > /c/Users/asus/layout-audit/probe-cf.log 2>&1 || true
echo "CF views=$(grep -a -c '==VIEW' /c/Users/asus/layout-audit/probe-cf.log) errs=$(grep -a -c 'ERROR' /c/Users/asus/layout-audit/probe-cf.log)"
grep -a -A2 '"bands"' /c/Users/asus/layout-audit/probe-cf.log | grep -a -m4 '"h"'
echo "== probe GH =="
sleep 25
BAZI_BASE=https://novakkk007.github.io/zifu node scripts/shot-bazi.cjs > /c/Users/asus/layout-audit/probe-gh.log 2>&1 || true
echo "GH views=$(grep -a -c '==VIEW' /c/Users/asus/layout-audit/probe-gh.log) errs=$(grep -a -c 'ERROR' /c/Users/asus/layout-audit/probe-gh.log)"
grep -a -A2 '"bands"' /c/Users/asus/layout-audit/probe-gh.log | grep -a -m4 '"h"'
echo "== done $(date +%H:%M:%S) =="
