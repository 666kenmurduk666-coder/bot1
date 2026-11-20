# SETUP-FINAL.md — bot1 one-page guide

**Rule ng bahay:** AI recommends, CEO approves. Kapag may pag-aalinlangan, pindutin lang ang `CHECK-BOTS.bat`.

## 1. Gusto ko lang ng check — ano ang gagawin ko?

**I-double-click ang `CHECK-BOTS.bat`** sa folder ng bot1.

Lalabas ang:
```
OK   Ollama tumatakbo
[OK] Groq ... [OK] Ollama ... [OK] OVHcloud ...
PROVIDER_HEALTH groq=OK ollama=OK ovh=OK
QUOTA groq=OK requests=xxx/1000
```

| Nakita mo | Ibig sabihin | Gawin |
|---|---|---|
| `OK` lahat | Gumagana lahat | Wala. Pahinga. |
| `OpenRouter ... FAIL` | **Normal 'yan** — walang API key | Huwag alalahanin |
| `Ollama ... FAIL` | Huminto ang local AI | Awtomatikong ire-restart ng keepalive (5 min) o i-double-click ang Ollama app |
| `Groq ... FAIL` | Baka naubos quota o may issue sa key | Hintayin ang fallback sa Ollama/OVH; tingnan ang `data\quota-status.json` |
| `OVHcloud ... FAIL` | Baka 2 RPM/IP limit | Hintayin ng kaunti, hindi ito pang-24/7 |

## 1b. Kung "ayaw magtrabaho" ang bots

**Nangyari sa'yo:** ang live app (Render) ay naka-set sa ibang provider (`coarena / gemini-3-8-flash`), kaya 2 lang agents ang may output. **Naayos na** — ginawa ko nang `groq / qwen/qwen3.8-27b`, at pinatakbo ko ang agents (8 na ang may output).

| Dahilan | Status |
|---|---|
| Maling provider sa Render | ✅ Naayos remotely: `groq / qwen/qwen3.8-27b` |
| Kailangang i-click ang 24/7 mode | ✅ **Auto-run na tuwing :10 at :40** — GitHub Actions + `keepalive-ping.ps1`. Walang click, kahit patay ang PC. |
| Render disk bumubura pag restart | ✅ Auto-heal tuwing :10/:40 + 06:05 PHT via `keepalive-ping.ps1` |
| Deploy ng auto-on na `index.html` | ✅ Naka-push na sa `main`; live ay may 10-min interval na |

Kung bumalik ang problema, i-double-click ang `CHECK-BOTS.bat` — awtomatiko nitong inaayos ang Ollama, provider, at run-all (`AUTO-FIX.ps1`). Detail: `logs\autofix.log` at `logs\keepalive.log`.

## 1c. Mga bagong auto-tools (5 suggestions — LAHAT tapos)

| # | Tool | Status |
|---|---|---|
| 1 | `auto-run.yml` (GitHub Actions) | ✅ Cron `:10/:40`, 06:00–24:00 PHT. Tested: `ok:true`, 8 agents. Password nasa **GitHub Secret** (naka-mask sa public logs). |
| 2 | `CHECK-BOTS.bat` + `AUTO-FIX.ps1` | ✅ Double-click lang — check **at** auto-fix (Ollama + live settings + run-all). |
| 3 | `/private` command | ✅ OpenCode command gamit ang `ollama/qwen2.5:3b` — offline, walang cloud. |
| 4 | Vyce key | ✅ Tinanggal sa `settings.json` at `restore-after-deploy.js`. Hindi na bumabalik. |
| 5 | OpenRouter 4th layer | ✅ `enable-openrouter.js` handa na (dry-run default). **Hindi pa aktibo** — kailangan ng tunay na `sk-or-...` key sa `data/openrouter.key`. Kapag may key: `node enable-openrouter.js --apply`. |

**Tandaan:** Ang password ay hindi na hardcode sa anumang file sa public repo — nasa GitHub Secret at lokal na `data\settings.json` lang.

## 2. Sino-sino ang AI providers?

| Order | Provider | Papel |
|---|---|---|
| 1 | **Groq** | Mabilis, may key, pang-araw-araw |
| 2 | **Ollama** | Lokal sa PC, private, walang cloud |
| 3 | **OVHcloud** | Walang key, EU, emergency lang (2 requests/minute) |

Hindi mo na kailangang pumili — awtomatikong nagfa-failover ang app.

## 3. Private data

Password, API key, customer name, payment details → **Ollama lang**. Basahin ang `PRIVACY-PROVIDER-RULES.md`.

## 4. Quota-saver (para hindi maubos ang 1,000/day ng Groq)

**Awtomatikong naka-on.** Hindi mo kailangang i-configure.

| Ginawa | Dati | Ngayon |
|---|---|---|
| Daily Groq cap | walang limit | **500 calls/araw**, tapos automatic sa Ollama → OVH |
| Bots chat (watercooler) | bawat 2 min (~720/day) | bawat 10 min (~144/day) |
| Maraming tab na bukas | bawat tab nag-c-call | 10-minutong reuse ng huling conversation |
| Routine: Chief of Staff | bawat 30 min | bawat 60 min |
| Routine: Manager | bawat 60 min | bawat 120 min |
| Ulit-ulit na routine output | wala | 2-oras na cache |
| Patay na `vyce` sa failover | nandoon pa | **tinanggal** |

Kung maabot ang 500, **hindi mag-e-error ang app** — sa Ollama/OVH na ito papunta. Makikita ang count sa `data\quota-counter.json`.

Kung gusto mong ibang limit, pwede ang environment variable `MAX_GROQ_CALLS_PER_DAY` (default: 500).

> Tandaan: ang 4 na quota-check request araw-araw (`quota-watch.js`) ay hiwalay sa count na 'to — maliit lang 'yon.

## 5. OpenCode chat (sa'yo, hindi sa bot1)

| Gusto mo | I-type |
|---|---|
| Mabilis, araw-araw | Normal lang mag-chat |
| Mas magaling, mahirap tanong | `/smart` + tanong |
| Pinakamalalim | `/deep` + tanong |
| Parang bumagal | `/reload` o mag-new session |

Hindi na kailangang i-restart ang OpenCode pagkatapos ng config change.

## 6. Kung may nag-error

1. I-double-click ang `CHECK-BOTS.bat` — dito makikita ang problema.
2. Tingnan ang `logs\keepalive.log` (huling 20 lines).
3. Tingnan ang `data\provider-health.json` at `data\quota-status.json`.
4. Kung kailangang i-rollback, nasa `backups\` ang lahat ng file bago binago.

## 7. Mga file na ginawa

| File | Gamit |
|---|---|
| `CHECK-BOTS.bat` | Double-click checker |
| `check-providers.js` | Buong provider test (read-only) |
| `provider-health.js` | Light health check (walang token) |
| `quota-watch.js` | Groq quota check (1 request) |
| `keepalive-ping.ps1` | 5-min scheduler + Ollama auto-restart |
| `Ollama-AutoStart.cmd` (Startup folder) | Auto-start Ollama pag-login |
| `quota-counter.json` | Bilang ng Groq calls ngayong araw |
| `agent-cache.json` | 2-oras na cache ng routine output |
| `FREE-PROVIDERS.md` | List ng 15 providers |
| `PRIVACY-PROVIDER-RULES.md` | Alin ang ligtas sa alin |
| `docs\free-llm-apis\` | Runbook mula sa ZIP |

---
*Huling update: 2026-11-20. Kung may bago, sabihin mo lang at ako na ang mag-a-update.*
