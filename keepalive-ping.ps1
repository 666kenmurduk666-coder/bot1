# Local keep-alive para sa Render free tier.
# Tumutakbo bawat 5 minuto, 06:00-24:00 PHT (via Task Scheduler).
$url  = 'https://cyborgcheebeeoffice.onrender.com/api/health'
$log  = 'C:\Users\PC\Desktop\bot1\logs\keepalive.log'
$dir  = Split-Path -Parent $log
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
try {
  $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 90
  $line = "$ts OK $($r.StatusCode)"
} catch {
  $line = "$ts FAIL $($_.Exception.Message)"
}
Add-Content -Path $log -Value $line -ErrorAction SilentlyContinue
if ((Get-Item $log -ErrorAction SilentlyContinue).Length -gt 200000) {
  Get-Content $log -Tail 500 | Set-Content $log
}
