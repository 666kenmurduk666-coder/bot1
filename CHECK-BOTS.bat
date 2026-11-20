@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   BOT1 QUICK CHECK - double-click lang, walang i-type
echo ============================================================
echo.
echo [0/5] AUTO-FIX - awtomatikong inaayos...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0AUTO-FIX.ps1"
echo.
echo [1/5] Ollama process...
powershell -NoProfile -Command "$p = Get-Process -Name ollama -ErrorAction SilentlyContinue; if ($p) { Write-Output 'OK   Ollama tumatakbo' } else { Write-Output 'FAIL Ollama HUMINTO - susubukang i-restart'; Start-Process -FilePath 'C:\Users\PC\AppData\Local\Programs\Ollama\ollama.exe' -ArgumentList 'serve' -WindowStyle Hidden }"
echo.
echo [2/5] Provider check...
node check-providers.js
echo.
echo       PAALALA: Ang OpenRouter FAIL ay NORMAL lang - walang key. OK lang 'yan.
echo.
echo [3/5] Health check...
node provider-health.js
echo.
echo [4/5] Groq quota...
node quota-watch.js
echo.
echo ============================================================
echo   Tapos na. OK = gumagana, FAIL = kailangang ayusin.
echo   Detalye: FREE-PROVIDERS.md at SETUP-FINAL.md
echo ============================================================
pause
