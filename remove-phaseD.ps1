$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$p = Join-Path $root 'public\index.html'
if (-not (Test-Path $p)) { Write-Host 'WALA ang public\index.html.'; exit 1 }
$t = [IO.File]::ReadAllText($p)
$pat = '<script src="/phaseD\.js(\?v=[^"]*)?"></script>'
if (-not [regex]::IsMatch($t, $pat)) { Write-Host 'Wala namang Phase D sa index.html. Walang binago.'; exit 0 }
$t = [regex]::Replace($t, $pat, '')
[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'TAPOS! Naalis ang Phase D. (Naiwan ang Phase B at C.)'
