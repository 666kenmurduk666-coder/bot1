# AUTO-FIX.ps1 — awtomatikong inaayos ang Ollama at ang live Render settings.
# Tinatawag ito ng CHECK-BOTS.bat. Walang kailangang i-type.
$ErrorActionPreference = 'SilentlyContinue'
$root = 'C:\Users\PC\Desktop\bot1'
$log  = Join-Path $root 'logs\autofix.log'
$live = 'https://cyborgcheebeeoffice.onrender.com'

function Say-Msg($m) {
  Write-Output $m
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $m"
  Add-Content -Path $log -Value $line
}

Say-Msg '--- AUTO-FIX start ---'

# 1) Ollama: buhayin kung huminto.
$ollama = Get-Process -Name ollama -ErrorAction SilentlyContinue
if (-not $ollama) {
  $exe = 'C:\Users\PC\AppData\Local\Programs\Ollama\ollama.exe'
  if (Test-Path $exe) {
    Start-Process -FilePath $exe -ArgumentList 'serve' -WindowStyle Hidden
    Start-Sleep -Seconds 4
    Say-Msg 'FIXED  Ollama auto-started'
  } else {
    Say-Msg 'WARN   Ollama exe not found — skip local fallback'
  }
} else {
  Say-Msg 'OK     Ollama running'
}

# 2) Live Render settings: itakda ulit sa tamang provider kung nag-drift.
try {
  $set = Get-Content (Join-Path $root 'data\settings.json') -Raw | ConvertFrom-Json
  $state = Invoke-RestMethod -Uri "$live/api/state" -TimeoutSec 40
  $badProvider = $state.setup.provider -ne $set.provider
  $badFailover = (($state.setup.failover -join ',') -ne 'ovh')

  if ($badProvider -or $badFailover) {
    $body = @{
      pass     = $set.password
      provider = $set.provider
      apiKey   = $set.apiKey
      model    = $set.model
      baseUrl  = ''
      keys     = @{
        groq   = $set.keys.groq
        ovh    = $set.keys.ovh
        ollama = $set.keys.ollama
      }
      failover = @('ovh')
    } | ConvertTo-Json -Depth 6
    $r = Invoke-RestMethod -Uri "$live/api/settings" -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 60
    Say-Msg "FIXED  Live provider=$($r.provider) failover=$($r.failover -join ',')"
  } else {
    Say-Msg "OK     Live provider=$($state.setup.provider) failover=ovh"
  }
} catch {
  Say-Msg "WARN   Live settings check failed: $($_.Exception.Message)"
}

# 3) Patakbuhin agad ang agents (walang click).
try {
  $pw = (Get-Content (Join-Path $root 'data\settings.json') -Raw | ConvertFrom-Json).password
  $rb = @{ pass = $pw } | ConvertTo-Json
  $a = Invoke-RestMethod -Uri "$live/api/run-all" -Method Post -Body $rb -ContentType 'application/json' -TimeoutSec 180
  Say-Msg "OK     Agents ran (ok=$($a.ok))"
} catch {
  Say-Msg "WARN   Run-all failed: $($_.Exception.Message)"
}

Say-Msg '--- AUTO-FIX done ---'
