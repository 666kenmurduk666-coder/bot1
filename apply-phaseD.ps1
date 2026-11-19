$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$p = Join-Path $root 'public\index.html'
if (-not (Test-Path $p)) { Write-Host 'WALA ang public\index.html. Ilagay ang mga file na ito sa mismong folder ng proyekto mo (kung nasaan ang server.js).'; exit 1 }
foreach ($f in 'phaseB.js','phaseC.js','phaseD.js') { if (-not (Test-Path (Join-Path $root ('public\' + $f)))) { Write-Host ('WALA ang public\' + $f + '. I-extract ang buong zip sa folder ng proyekto.'); exit 1 } else { Write-Host ('Nakita: public\' + $f) } }
$t = [IO.File]::ReadAllText($p)
$bak = Join-Path $root 'index.backup-before-phaseD.html'
$old = Join-Path $root 'public\index.backup-before-phaseD.html'
if (Test-Path $old) { if (-not (Test-Path $bak)) { Move-Item $old $bak } else { Remove-Item $old } }
if (-not (Test-Path $bak)) { Copy-Item $p $bak }
$i = $t.LastIndexOf('</body>')
if ($i -lt 0) { Write-Host 'Hindi ko nakita ang </body> sa index.html. Wala akong binago.'; exit 1 }
$v = '8'
$add = ''
foreach ($f in 'phaseB','phaseC','phaseD') {
  $pat = '<script src="/' + $f + '\.js(\?v=[^"]*)?"></script>'
  $new = '<script src="/' + $f + '.js?v=' + $v + '"></script>'
  if ([regex]::IsMatch($t, $pat)) { $t = [regex]::Replace($t, $pat, $new) } else { $add += $new }
}
$i = $t.LastIndexOf('</body>')
if ($add -ne '') { $t = $t.Insert($i, $add) }
[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'TAPOS! Nailagay/na-update ang Phase B, C at D. I-refresh ang browser. May backup sa index.backup-before-phaseD.html (nasa labas ng public, hindi ibinibigay ng server)'
