#!/bin/bash
# 收尾补漏 v3：SSH 通道推镜像 + CF/GH 生产探针（shot-bazi 已改 domcontentloaded）
cd /f/紫府文件/zifu-v9/zifu || exit 1
TMP=/c/Users/asus/AppData/Local/Temp/zifu-ghmirror
LOCAL_SHA=$(cd $TMP && git rev-parse HEAD 2>/dev/null)
echo "LOCAL_SHA=$LOCAL_SHA"
echo "=== [0] ssh availability ==="
ls -la ~/.ssh/ 2>/dev/null | head -9
timeout 25 ssh -T git@github.com -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 2>&1 | head -2
echo "=== [1] ssh push attempts ==="
SSHOK=0
for i in 1 2; do
  OUT=$(cd $TMP && GIT_SSH_COMMAND="ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20" git push -f git@github.com:Novakkk007/zifu.git HEAD:gh-pages 2>&1)
  RC=$?
  echo "-- ssh attempt $i rc=$RC --"; echo "$OUT" | tail -4
  RSHA=$(git ls-remote https://github.com/Novakkk007/zifu.git gh-pages 2>/dev/null | cut -f1)
  echo "remote_sha_now=$RSHA"
  if [ -n "$LOCAL_SHA" ] && [ "$RSHA" = "$LOCAL_SHA" ]; then SSHOK=1; break; fi
  sleep 10
done
echo "SSH_PUSH_OK=$SSHOK"
echo "=== [2] CF probe (domcontentloaded) ==="
BAZI_BASE=https://zifu.pages.dev node scripts/shot-bazi.cjs > /c/Users/asus/layout-audit/probe-cf.log 2>&1 || true
echo "CF views=$(grep -a -c '==VIEW' /c/Users/asus/layout-audit/probe-cf.log) errs=$(grep -a -c 'ERROR' /c/Users/asus/layout-audit/probe-cf.log)"
grep -a -A8 '"bands"' /c/Users/asus/layout-audit/probe-cf.log | grep -a '"h"' | head -6
echo "=== [3] GH probe ==="
if [ "$SSHOK" = "1" ]; then sleep 40; fi
BAZI_BASE=https://novakkk007.github.io/zifu node scripts/shot-bazi.cjs > /c/Users/asus/layout-audit/probe-gh.log 2>&1 || true
echo "GH views=$(grep -a -c '==VIEW' /c/Users/asus/layout-audit/probe-gh.log) errs=$(grep -a -c 'ERROR' /c/Users/asus/layout-audit/probe-gh.log)"
grep -a -A8 '"bands"' /c/Users/asus/layout-audit/probe-gh.log | grep -a '"h"' | head -6
echo "=== end $(date +%H:%M:%S) ==="
