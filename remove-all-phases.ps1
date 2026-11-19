$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$p = Join-Path $root 'public\index.html'
$bak = Join-Path $root 'index.backup-before-phaseD.html'
if (-not (Test-Path $p)) { Write-Host 'WALA ang public\index.html.'; exit 1 }
$t = [IO.File]::ReadAllText($p)
foreach ($f in 'phaseB','phaseC','phaseD') { $t = [regex]::Replace($t, '<script src="/' + $f + '\.js(\?v=[^"]*)?"></script>', '') }
[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'TAPOS! Naalis ang Phase B, C at D sa index.html. Hindi binura ang progress mo sa browser.'
if (Test-Path $bak) { Write-Host 'May original na backup din: index.backup-before-phaseD.html' }
