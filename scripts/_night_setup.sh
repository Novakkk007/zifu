#!/bin/bash
# 夜间自检 setup：杀旧巡检 → 确保 dev server → bazi 截图度量 → 重启巡检（新日志 audit2）
cd /f/紫府文件/zifu-v9/zifu || exit 1
echo "== [1] kill stale audit =="
taskkill //F //PID 49592 2>/dev/null
powershell -Command "Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { \$_.CommandLine -like '*layout_audit*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force; Write-Output ('killed ' + \$_.ProcessId) }" 2>/dev/null
echo "== [2] dev server =="
if ! curl -s -o /dev/null --max-time 3 http://localhost:3000/; then
  echo "server down -> starting"
  (nohup npm run dev > "C:/Users/asus/AppData/Local/Temp/zifu-dev.log" 2>&1 &)
fi
UP=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 4
  if curl -s -o /dev/null --max-time 4 http://localhost:3000/; then UP=1; break; fi
done
echo "DEV up=$UP"
curl -s -o /dev/null -w "DEV code=%{http_code}\n" --max-time 5 http://localhost:3000/
netstat -an 2>/dev/null | grep ":3000" | head -3
echo "== [3] bazi shots =="
node scripts/shot-bazi.cjs
echo "== [4] restart audit (new log) =="
(nohup python "C:/Users/asus/AppData/Local/hermes/scripts/layout_audit.py" > "C:/Users/asus/AppData/Local/Temp/zifu-audit2.log" 2>&1 &)
echo "SETUP DONE $(date +%H:%M:%S)"
