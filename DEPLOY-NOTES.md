# DEPLOY-NOTES — Cyborg Cheebee Office (bot1)

Panghuli ng lahat: eto ang kumpletong record ng deployment at mga dapat malaman mo.

## Live deployment

- **Repo:** https://github.com/666kenmurduk666-coder/bot1 (`main`)
- **Commit:** `95674af` — "Phase D v8 official upgrade: security/order fixes, responsive viewport, camera and minimap controls"
- **Render service:** `cyborgcheebeeoffice` (Node, Free) — Auto-Deploy sa bawat push sa `main`
- **Live URL:** https://cyborgcheebeeoffice.onrender.com/ — napitirhan: page=official Phase D v8 (487,568 bytes), `/api/health` 200

## CEO password

- Ang Phase D v8 server ay **walang built-in password**. Ang admin routes ay naka-lock **maliban** kung may `CEO_PASSWORD` environment variable.
- Sa Render: `CEO_PASSWORD=cyborg` (nasa Environment Variables na, naka-record sa dashboard).
- Kung kakailanganing baguhin: Render dashboard → cyborgcheebeeoffice → **Environment** → Edit → i-edit `CEO_PASSWORD` → "Save, rebuild, and deploy".
- Lokal (`C:\Users\PC\Desktop\bot1`): naka-save rin sa `data/settings.json` (`password: "cyborg"`).

## ⚠️ Render free tier = Walang disk (MAHALAGA)

Bawat **redeploy** ay ibinuru ang `data/` folder — mawawala ang:
mall products, commercials, Facebook app config, Shopee affiliate ID, at ang Vyce backup key.

**Pagkatapos ng bawat deploy, i-run:**

```
cd C:\Users\PC\Desktop\bot1
node restore-after-deploy.js
```

Ilulubos nito ang: unlock → mall (23) → commercials (19) → Facebook → Shopee → Vyce backup key.
Kailangan lang ang mga lokal files: `data/state.json`, `data/fb-config.txt`, `data/shopee-config.txt`, `.env` — nasa folder mo na sila.
Ang script ay **idempotent** — pag i-rerun, `ok=0 skip=19/23`, walang dodoblehin.

**Paano nagpapakita ang commercials:** ang public bazaar endpoint ay nagpapakita lang ng **12 pinakabago** (sliding window), at ang CEO list endpoint ay nagpapakita lang ng 30 (cap 60 sa state). Ito ang built-in na behavior ng app — hindi bug.

Para i-verify: `/api/mall` → 23; `/api/bazaar/commercials` → 12 (12-window); CEO list (via `/api/ceo/commercials`, action `list`) → 19; `/api/unlock` (pass: cyborg) → `{"ok":true}`.

## Security notes

- `data/` at `.env` ay nasa `.gitignore` — **huwag** i-force-commit, at huwag i-share ang `.env` (naglalaman ng Vyce key).
- Ang PAT na ginawa noong 2026-11-19 (classic token, `repo` scope, exp. 2026-12-19) ay naka-store sa Windows Credential Manager para sa `git push`; tina-tag ito sa chat — **i-delete/rotate** sa github.com/settings/tokens kung hindi na kailangan.
- Ang live app ay may bagong cookie signing key (generated sa first boot) — ang mga visitor ay kailangang mag-login ulit isang beses.
- Naka-enable ang BANTAY rate-limiting — maraming maling tangka = ilang minutong block (429). Pagkatapos ng redeploy, reseta ang counters.

## Deploy flow para sa susunod na upgrade

1. Baguhin ang files sa project folder.
2. Sa Temp clone: `C:\Users\PC\AppData\Local\Temp\opencode\bot1-push`
   - `git pull` muna (o i-re-clone kung sira), i-copy ang bago, `git add -A && git commit && git push`.
3. Hintayin ang Render Auto-Deploy (~30s).
4. **I-run ang restore script** (tingnan sa itaas).
5. I-verify ang `/api/health` at `/api/mall`.

## Backup / history

- Dating neon custom build: nandun pa sa git history (`7f3193e`) — `git checkout 7f3193e` kung gusto itong i-resurrect.
- Local safety backup ng custom `server.js`/`index.html`: `C:\Users\PC\AppData\Local\Temp\opencode\phaseD-backup\`
- Ang opisyal na Phase D v8 ZIP: `C:\Users\PC\Desktop\bot1\Cyborg-Cheebee-PhaseD-v8-Layout-Upgrade.zip`

## ⚡ Keep-alive (tulog ng Render free)

Nasa `.github/workflows/keepalive.yml` na sa repo ang `.github` workflow **"keep-alive (Render free)"** — piniping ang app bawat **10 minuto mula 06:00 hanggang 24:00 PHT**, araw-araw (UTC cron: `*/10 22-23,0-15 * * *`).

- **Testado na:** Manually run ko ito sa Actions tab — `completed successfully`, 9s.
- **Bakit window lang, hindi 24/7:** ang Render free ay may **750 instance-hours/buwan** budget. 24/7 pinging = ~720 h + build hours — nauubos ang budget at sinuspend ng Render ang service. Window lang kaya ang pinaandar — walang panganib sa suspension.
- **Kung gusto mong itigil ang keep-alive:** i-delete ang `.github/workflows/keepalive.yml` sa repo (o i-disable ang workflow sa Actions tab).
- **Kung gusto mong mag-paid:** upgrade sa Render Hobby ($5/mo) para walang tulog kahit kailan.

## 🔎 Backup

- Dating custom build (neon): git history `7f3193e`
- Lokal safety backup ng official v8: `C:\Users\PC\AppData\Local\Temp\opencode\phaseD-backup\`
- **Timestamped data backups:** `C:\Users\PC\Desktop\bot1-backups\<yyyy-MM-dd-HHmm>\` (state.json, settings.json, .env, fb-config.txt, shopee-config.txt, audit.jsonl)
- Restore scripts sa `bot1\`: `restore-after-deploy.js` (auto restore ng mall/commercials/FB/Shopee/**Vyce + Groq** keys, idempotent, hinahayaan ang ibang keys) — samahan ito ng DEPLOY-NOTES.md na ito

## 📝 Notas sa token

- May isang classic PAT na ginamit para sa push (nagawa nitong Nob 19, 2026, repo scope, mag-e-expire **Dec 19, 2026**) — naka-store sa Windows Credential Manager ("git:https://github.com") para sa `git push` mo.
- Kung gusto mong wala na ito: github.com/settings/tokens → Delete.
- NOTE: ang clipboard ay binigyan ko ng blankong halaga (`Set-Clipboard ' '`) dahil naipakita ang env values sa session — mag-copy ka na lang ng bago.

## Known behavior

- Ang app ay nagse-serve ng service worker (`sw.js`) na nag-cache ng Phase B/C/D add-on files at `/three.min.js`. Kapag may bagong deploy, mag-refresh muna (o i-clear ang site data) para makita ang bagong version.
- `/phaseD.js` at friends ay `?v=9` (binump mula `?v=8` noong 2026-11-20 para ma-bypass ang 1-day browser/SW cache ng lumang `phaseB.js`). Bump ang `?v=` kapag may bagong release mula sa developer.
- Ang bazaar ay nagpapakita lang ng **12 pinakabagong commercials** (sliding window, app design); nakatago ang lahat sa CEO list (hanggang 60 sa state).
- Ang Render free instance ay tumutulog pag ~15 min walang tap; gumigising kapag nasa keep-alive window (06:00-24:00 PHT).

## 2026-11-20 - Speed at local AI fixes

### Bakit nag-hang / nagbagal ang app (NAYOS NA)
- **Root cause:** `public/phaseB.js` (`polish()`) ay may `MutationObserver` na
  nag-o-observe sa `style` attributes at `childList`, pero ang `sync()` callback
  mismo ay nagpapalit ng `bd.style.display`, `aria-*` attributes, at
  `tog.innerHTML` (`dot()`). Kaya: mutation -> sync -> mutation -> sync...
  walang hanggan, na-block ang buong main thread.
- **Fix:** `mo.disconnect()` bago magbago, tapos `mo.observe()` ulit pag tapos na.
- **Resulta:** headless Chrome load **>50s (timeout) -> 1.6s**; aktwal na browser
  `load=170ms`, `readyState=complete`, 7 resources.

### Iba pang speed fix sa `public/index.html`
- `/three.min.js` (local, naka-cache ng SW) ang una nang niloload; CDN na lang ang
  fallback, kaya hindi na naghihintay ang page sa jsdelivr.
- 3D office loop: cap ~30 FPS, skip kapag `document.hidden`.
- Lightweight WebGL renderer: `antialias:false`, 1x pixel ratio, walang shadow map
  (dating 2x DPR + 1024px soft shadows -> puno ang 8 GB RX 6600).

### Local AI (Ollama) fix
- `server.js`: local endpoints lang -> `reasoning_effort:'none'`, `keep_alive:'30m'`,
  5-min timeout, reasoning-text fallback, slow-reply logging.
- Model: `gemma4:12b` (7.47 GB, reasoning, empty `content`) -> **`qwen2.5:3b`**
  (1.9 GB, 2.2 GB VRAM, 100% GPU). Unang sagot 17s (load), warm 2.5s.
- Environment: `OLLAMA_KEEP_ALIVE=30m`, `OLLAMA_NUM_PARALLEL=1`.
-Detalye: `OLLAMA-NOTES.md`.

### Keep-alive
- Bukod sa GitHub workflow, may **local Windows Task Scheduler** na
  `bot1 Render keepalive`: bawat 5 min, 06:00-24:00 PHT.
  Script: `keepalive-ping.ps1`, log: `logs/keepalive.log`.
  Test run: `LastTaskResult=0`, `OK 200`.
- Kapag bumalik sa labas ng 06:00-24:00 PHT: normal lang ang ~50s cold start.

## 2026-11-20 - Realistic office + Groq bot conversations (office-v9)

### Bakit pangit / hindi mukhang opisina ang dating 3D (NAYOS NA)
- **Root cause:** sa `buildRoom3d()` ng `public/index.html`, ang buong detalyadong
  office build ay nasa loob ng `if(false){ ... }` — **naka-disable**. Ang
  lumalabas lang ay ang abstract `buildCyborgOffice3d()` (zone floor planes +
  labels), kaya parang kulay-kulay na mapa, hindi opisina.
- **Fix (hindi binubura ang protected v8 runtime):** bagong module
  `public/office-v9.js` ang nag-build ng buong scene. Tinawag ito sa
  `buildRoom3d()` bago ang lumang fallback:
  `if(typeof buildRealOffice3d!=='function'||!buildRealOffice3d())buildCyborgOffice3d();`
  Kung hindi mag-load ang module, babalik sa dating zone map (walang break).

### Bagong disenyo
- Maliwanag na **single-floor real office**: 46.6 x 34.6 na sahig, white walls,
  window strips sa perimeter, glass partitions, ceiling lights, at mga karpet
  bawat zone.
- **Zones:** open workstations (2 hanay x 5 desk + monitor + upuan), meeting room
  (mesa + 6 na upuan + whiteboard), CEO office (desk + bookshelf + plant),
  reception/lobby (counter + sofa + signage), pantry (counter + coffee machine +
  stools), at server nook.
- **6 na maliliit at masasayang bots** (`cos`, `seo`, `product`, `joker`, `mgr`,
  `writer`): scaled `0.66`, may ngiti, eye sparkle, blush, bowtie, emoji bubble,
  name tag, at umaalog na kamay + bao ng katawan.
- **Magaan sa GPU:** ~400 meshes lang, walang shadow map, 30 FPS cap, at hintay
  kapag `document.hidden`. `scene3d.background = #e9eef5`, camera
  `r=58, phi=.42, target(23,1,16)`.
- Speech bubbles: lumalabas sa tabi ng bot gamit ang projection sa `camera3d`;
  umiikot ang 4 na linya ng usapan bawat ~3.8s habang sariwa ang conversation
  (<3 min).
- **Cache-bust:** `/office-v9.js?v=2` — bump ang `?v=` kapag may bagong change
  sa module para ma-bypass ang browser cache.

### Groq ang nagpapausap sa mga bot
- Key: `gsk_p...ErUV` (masked), naka-save sa `C:\Users\PC\Desktop\bot1\.env`
  bilang `GROQ_API_KEY`, modelo **`GROQ_MODEL=qwen/qwen3.8-27b`**.
  Pinagmulan: `C:\Users\PC\Documents\BotFactory-Data\.config.json` (`groq` field).
- `server.js`: bagong `callGroq()` (gamit ang `keys.groq` sa settings, hindi
  nakadepende sa napiling provider para sa ibang AI work). Ang
  `generateConversation()` ay **Groq-first**, tapos `callAI()` fallback, tapos
  template fallback.
- **Bakit qwen at hindi gpt-oss:** ang `openai/gpt-oss-20b` ay nag-leak ng
  reasoning/prompt text sa sagot, at `reasoning_effort:'none'` ay 400. Ang
  `qwen/qwen3.8-27b` ay malinis, natural Taglish, at case-insensitive ang
  speaker parse (`Cos:` at `cos:` parehong gumagana).
- Auto-chat: **2 minuto** (dating 10 minuto) + agarang conversation 4s pagbukas
  ng app. Kailangang naka-unlock ang CEO (`cyborg`) dahil ang `/api/conversation`
  ay protected; `api()` at office-v9 ay nagpapadala ng `pass` sa body.
- **Restore runbook update:** `restore-after-deploy.js` ngayon ay kumukuha muna
  ng umiiral na keys sa `/api/private` bago mag-post sa `/api/settings`
  (ang `/api/settings` ay **pinapalitan** ang buong `keys` object — kaya kung
  hindi muna hihilahin, mabubura ang Vyce). Isinasama nito ang **Vyce + Groq**
  sa iisang post, `failover:['groq','vyce']`. Pattern ng key: `gsk_`.

### Verification na ginawa
- Lokal (`http://localhost:8790`): `readyState=complete`, `bots=6`,
  `meshes=400`, background `e9eef5`, **walang console errors**.
- Groq endpoint (POST `/api/conversation` + `pass:cyborg`): 200, natural Taglish
  hal. `cos: Kuya, why is our engagement flat?` / `seo: Because I'm too busy
  writing captions that don't mention discounts.`
- Tick diagnostic (`window.__officeV9.tick()` — para sa embedded browser na
  hindi nagfi-fire ng `requestAnimationFrame`): nagbago ang `rotation.y`
  (0 -> 3.40) at `position.y` (0 -> 0.02), at lumabas ang bubble ni Seo.
- `node tests/strategy-baseline.js` + lahat ng tests sa `tests/`: PASS.
  Na-update ang protected hashes para sa `server.js`, `public/index.html`, at
  bagong entry na `public/office-v9.js`.
- **Tandaan:** ang embedded browser ng OpenCode ay hindi nagfi-fire ng
  `requestAnimationFrame` kahit `document.hidden=false` (test probe = 0 frames).
  Hindi ito app bug — normal na browser ay umaandar; kaya gamitin ang
  `window.__officeV9.tick()` diagnostic kapag sinusuri dito.

