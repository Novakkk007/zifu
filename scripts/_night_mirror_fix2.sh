#!/bin/bash
# 收尾补漏 v2：镜像推送多配置重试 + CF探针排障 + 双站复探
cd /f/紫府文件/zifu-v9/zifu || exit 1
TMP=/c/Users/asus/AppData/Local/Temp/zifu-ghmirror
LOCAL_SHA=$(cd $TMP && git rev-parse HEAD)
echo "LOCAL_SHA=$LOCAL_SHA"
echo "=== [diag] CF probe log (first 600 chars) ==="
head -c 600 /c/Users/asus/layout-audit/probe-cf.log 2>/dev/null
echo
echo "=== [diag] net ==="
curl -s -o /dev/null -w "github.com %{http_code} %{time_total}s\n" --max-time 20 https://github.com/ || echo github-fail
curl -s -o /dev/null -w "zifu.pages.dev %{http_code} %{time_total}s\n" --max-time 20 https://zifu.pages.dev/ || echo cf-fail
echo "=== [1] mirror push retries (variants) ==="
PUSH_OK=0
for i in 1 2 3 4; do
  case $i in
    1) CFG="-c http.postBuffer=524288000 -c http.version=HTTP/1.1 -c pack.threads=1" ;;
    2) CFG="-c http.postBuffer=524288000 -c pack.threads=1" ;;
    3) CFG="-c http.postBuffer=524288000 -c http.version=HTTP/1.1 -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=60" ;;
    4) CFG="-c http.postBuffer=524288000 -c http.version=HTTP/1.1 -c pack.threads=1 -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=60" ;;
  esac
  OUT=$(cd $TMP && git $CFG push -f https://github.com/Novakkk007/zifu.git HEAD:gh-pages 2>&1)
  RC=$?
  echo "-- attempt $i rc=$RC --"; echo "$OUT" | tail -3
  RSHA=$(git ls-remote https://github.com/Novakkk007/zifu.git gh-pages 2>/dev/null | cut -f1)
  echo "remote_sha_now=$RSHA"
  if [ "$RSHA" = "$LOCAL_SHA" ]; then PUSH_OK=1; break; fi
  sleep 15
done
echo "MIRROR_PUSH_OK=$PUSH_OK"
echo "=== [2] CF probe retry ==="
BAZI_BASE=https://zifu.pages.dev node scripts/shot-bazi.cjs > /c/Users/asus/layout-audit/probe-cf.log 2>&1 || true
echo "CF views=$(grep -a -c '==VIEW' /c/Users/asus/layout-audit/probe-cf.log) errs=$(grep -a -c 'ERROR' /c/Users/asus/layout-audit/probe-cf.log)"
head -c 400 /c/Users/asus/layout-audit/probe-cf.log
echo
grep -a -A8 '"bands"' /c/Users/asus/layout-audit/probe-cf.log | grep -a '"h"' | head -6
echo "=== [3] GH probe (only if mirror pushed) ==="
if [ "$PUSH_OK" = "1" ]; then
  sleep 30
  BAZI_BASE=https://novakkk007.github.io/zifu node scripts/shot-bazi.cjs > /c/Users/asus/layout-audit/probe-gh.log 2>&1 || true
  echo "GH views=$(grep -a -c '==VIEW' /c/Users/asus/layout-audit/probe-gh.log) errs=$(grep -a -c 'ERROR' /c/Users/asus/layout-audit/probe-gh.log)"
  grep -a -A8 '"bands"' /c/Users/asus/layout-audit/probe-gh.log | grep -a '"h"' | head -6
else
  echo "skip (mirror not pushed)"
fi
echo "=== end $(date +%H:%M:%S) ==="
