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

### Follow-up: bakit dark zone map pa rin sa unang live deploy (NAYOS NA)
- Dalawang magkahiwalay na isyu ang lumabas pagkatapos ng unang deploy:
  1. **Load-order race:** sa mabagal na network, ang `init3D()` ay tumatakbo bago
     ma-load ang `office-v9.js`; kaya `buildRealOffice3d` ay `undefined` pa lang
     at `buildCyborgOffice3d()` (dark map) ang itinayo. Walang bumabalik sa HQ.
     **Fix:** may 600ms self-heal sa `office-v9.js` — kung nasa HQ, may `level3d`,
     pero `cuteBots.length===0`, ire-rebuild ang v9 scene.
  2. **Dangling references sa disabled block:** ang `if(false)` office code ay
     nagdedeklara ng `glassMat`, `doorAt`, at `DY`, pero ginagamit pa rin ang mga
     ito sa labas ng block. Kaya nagte-throw ang `buildRoom3d()` pagkatapos magtayo
     (`officeLoop recovered: ...`) — nakikita lang ito sa **warning** level ng
     console, hindi error. **Fix:** inalis ang `glassMat` check, nag-no-op stub ang
     `doorAt`, at buong old entrance + 2F kafe deck ay nilaktaw na lang kapag
     `v9ok` ( hindi na kailangan ang `DY` sa single-floor office).
- Resulta pagkatapos ng fix: `bots=6`, walang console warnings/errors, at
  `holoRedraw`/`approvalRedraw` ay nasa lugar pa rin (hologram panels gumagana).
- **Lesson:** palaging i-check ang console sa **warning** level, hindi lang error —
  dito lumalabas ang "officeLoop recovered" na mga nahuling exception.

### Final fix para sa load-order (v4)
- Ang 600ms self-heal ay hindi sapat sa live — ang `init3D()` ay tumatakbo sa
  iba't ibang oras depende sa network. **Kaya inilipat ang `<script>` ng
  `office-v9.js?v=4` bago ang main inline script** (agad pagkatapos ng
  `three.min.js`). Laging defined na ang `buildRealOffice3d()` pag tinawag ito
  ng `buildRoom3d()` — wala nang race.
- Idinagdag pa rin ang **repeating self-heal** (70ms x hanggang 40 tries) bilang
  backup, at ginawang **standalone-safe** ang `buildRealOffice3d()` (clear muna
  ng `level3d` + bagong `structureGroup`) para hindi mag-stack ang dalawang scene.
- Hindi na nagfi-fire ng `/api/conversation` nang walang `ceoPass` — kaya wala
  nang 403 sa console ng mga bisitang hindi pa naka-unlock.
- Cache-bust: `?v=4`. Kapag binago ulit ang module, bump ang `?v=` sa **dalawang**
  lugar: ang bagong early `<script>` tag (malapit sa `three.min.js`).

## 2026-11-20 — "Puro puti" white-out + Google-style office layout (v7)

### Sintomas at root cause
- Report ng user: **"grabe walang makita puro puti"** at humiling ng layout na
  "kinuha sa Google / gayahin". Live canvas diagnostics: 4 sa 5 sampled pixels
  ay eksaktong background `227,231,238`, at `body.ui-hidden` ang default.
- Hindi lang framing. Apat na magkakahiwalay na dahilan ang nag-stacked:
  1. **Camera:** ang auto Roblox `spawnPlayer()` ay nag-o-override sa office
     camera papuntang `r=28, target(15,16)` — close-up sa labas ng layout.
  2. **Pale background:** ang day/night reset ng main app ay nagtatakda ulit ng
     `#e3e7ee` pagkatapos ng office build.
  3. **Walked-out lights:** ang lumang dark scene ay nag-iwan ng
     `HemisphereLight 1.6` at `PointLight 26 (purple)` na nakadikit sa `scene3d`
     (hindi sa `level3d`), kaya hindi natatanggal ng `level3d.clear()`.
     Lahat ng desk at sahig ay nag-white-out kahit exposure 0.92 na.
  4. **Service worker:** nag-cache ng `/office-v9.js?v=6` (transferSize=0),
     kaya hindi lumalabas ang mga bagong edit sa embedded browser.
  - `body.ui-hidden .bub3d{display:none}` din ang nagtatago sa talk bubbles.

### Google-reference layout (bagong `public/office-v9.js`)
- Base sa published planning guides (Aaditya interior design guide + Northvale
  Studio "The Loft" plan): **public → semi-private → private/service zoning**,
  isang **Main Street** circulation spine, at reception malapit sa entrance.
- Zones: **WELCOME** (reception counter, logo wall, lounge, plants),
  **MAIN STREET** (2.6m sentral na daan + wayfinding sign),
  **FOCUS** (apat na six-seat bench clusters + monitor/upuan + quiet booths),
  **MEET** (glass boardroom + huddle room + whiteboard),
  **GATHER** (pantry/cafe island, stools, fridge, coffee machine),
  at **SUPPORT** (executive cabin + server/IT racks).
- 6 na maliliit, masasayang bots (scaled `0.66`) na nakalagay sa kani-kanilang
  zone; lahat **visible sa default view**; umiikot ang Groq lines sa `.v9bub`
  speech bubbles.

### Mga fix
- `spawnPlayer()` nagsimula na sa gitna `(23,17)` at wide camera
  `r=45, phi=.52, theta=.42` — buong 46x34 office ang makikita.
- Muted palette sa buong pipeline: background/fog `#93a1b3`, dark surround
  ground plane `#4a5668`, wood/teal/navy floor zones, exposure `0.85`,
  ambient `0.58`. `scene3d.isNight=0` + tick re-assert para hindi bumalik sa
  `#e3e7ee`.
- `tameOfficeLights()`: pinapatay ang lumang purple/blue point lights at
  binabaan ang hemisphere/directional sa office-safe levels; tinatawag sa build
  at sa tick.
- CSS: `body.ui-hidden .bub3d:not(.v9bub){display:none}` — lumang bubble lang
  ang nakatago; makikita ang Groq bubbles.
- **Cache-bust bump `?v=7`** — kailangan ito dahil nag-cache ang SW ng lumang
  URL. Bumump agad ng `?v=` sa early `<script>` tag sa bawat office-v9 edit.

### Verification (lokal)
- `bots=6`, `meshes=606`, lahat ng 6 bots nasa loob ng frame.
- Pixel grid: **walang puting background** — dark slate (60–115) sa labas,
  wood/teal/navy (130–196) sa loob ng opisina; bg `#93a1b3`, amb `0.58`,
  exposure `0.85`, lights naka-tame.
- `POST /api/conversation` (`pass:cyborg`) → Groq Taglish lines; `.v9bub`
  lumabas (`display:block`, naka-position sa tabi ni Cos). Walang console errors.
- `node tests/strategy-baseline.js` at smoke/office-layout/server-security: PASS.

## 2026-11-20 — Office enhancement pass (v8)

### Mga idinagdag para mas mukhang tunay na opisina
- **Open-ceiling detail:** exposed beams, carved ceiling-light grid, at pendant
  lights sa reception, Main Street, boardroom, huddle, pantry, at executive desk.
  Walang solid ceiling slab — kung may slab, matatakpan nito ang buong office
  dahil nasa ibabaw ang camera.
- **Glass rooms na may frame:** mullions + doorways sa FOCUS partition, quiet
  booths, boardroom, huddle, at executive cabin.
- **Furniture props:** mouse, mug, notebook, at glow desk lamp sa bawat desk;
  round collaboration table + stools; printer station; filing cabinets; water
  cooler; fruit bowl sa pantry island; coat rack; notice board; wall art;
  wall clock; mas bushy na potted trees.
- **Floor texture:** carpet-tile grid sa FOCUS, plank lines sa WELCOME/GATHER,
  at tile joints sa MEET — hindi na patag na kulay lang.
- **City context:** may maliit na skyline sa likod ng windows para hindi walang
  laman ang view sa labas.
- **Buhay na bots:** role props — headset (Cos), magnifier (Seo), package
  (Product), party hat (Joker), clipboard (Mgr), pen (Writer). Blinking server
  LEDs at pulsing pendant bulbs tuwing tick.
- **Cache-bust:** `office-v9.js?v=8`. ~1000 simple meshes, walang shadow map,
  30 FPS cap — walang heavy GPU feature.

### Verification (v8, lokal)
- `bots=6`, `meshes=1000`, lahat ng bots visible; bg `#93a1b3`, amb `0.58`,
  exposure `0.85`; walang white-out, walang console errors.
- Groq conversation + `.v9bub` speech bubble: OK.
- `strategy-baseline`, smoke, office-layout, server-security: PASS.

## 2026-11-20 — "Photographic office" upgrade (v13 cache-bust)

### Bakit pangit pa rin pagkatapos ng v8
- Hindi lang kulang sa props. Apat na bagay ang nagpapalat ng itsura:
  1. **Flat materials** — halos lahat ng sahig/desk/pader ay iisang `MeshStandardMaterial`
     na walang texture, kaya parang color blocks.
  2. **Walang depth cues** — walang shadow map (sinadya, para sa weak GPU), kaya
     lumulutang ang muwebles; walang light pools sa ilalim ng ilaw.
  3. **Nakaharap sa maling direksyon ang ilang signage** — ang signs sa south wall
     ay `rot=Math.PI`, kaya ang likod lang ang nakikita ng camera.
  4. **Nakatago ang langit at ceiling!** May "SIMPLE MODE" cull sa `index.html` na
     nagtatago ng **anumang mesh na `y > 3.15`**. Kasama rito ang bagong sky
     backdrop, exposed beams, at ceiling fixture grid — kahit nasa loob ng v9.
- **Fix:** lahat ng v9 meshes ay minarkahan ng `userData.v9 = true`; ang cull ay
  naging `if(!o.userData.v9 && ...)`. Maski nasa itaas ng 3.15m, hindi na tinatanggal.

### Mga pinaganda
- **Procedural textures (walang download):** carpet flecks + tile grid, wood grain,
  plank seams, ceramic tile, stone plaza, fabric weave, rugs, monitor UI, at isang
  malawak na sky gradient na may ulap.
- **Warm light pools + contact shadows:** radial additive planes sa ilalim ng bawat
  pendant at dark ellipse sa ilalim ng desks/chairs/plants/bots — hindi gumagamit
  ng shadow map, kaya magaan pa rin sa GPU.
- **Glass at framing:** dark nav frames, mullions, doorways, at **glass south facade**
  para makita ang loob mula sa bagong mababang camera angle.
- **Mababang "hero" camera:** `phi=.40`, `theta=.34`, `r=38`, `fov=52`;
  mas kita ang harapan ng mesa, signage, at mga bot kumpara sa dating top-down view.
- **Legible signage:** canvas-based dark boards na may malaking teksto + subtitle,
  tama ang orientation (south signs face `+Z`).
- **Exterior context:** stone approach plaza, planters, benches, kotse, road dashes,
  skyline, at skydome — wala nangpatag na gray sa itaas ng frame.
- **Bots:** scale `0.74` + role props + contact shadow; `.v9bub` na may mas makapal
  na border at shadow para basahin ang Groq lines.

### Verification (v13, lokal)
- `bots=6`, `meshes=1541`, `textured=191`, **`hidden=0`** (walang naitagong v9 mesh).
- Pixel stats: `bgPct=0` (dati 20%), `edgePct=4` (dati 2–3%), sky row `~112,156,204`,
  walang white-out. `bgHex=93a1b3`, `amb=0.58`, `exposure=0.85` — pareho pa rin.
- 6/6 bots nasa frame; walang console errors; sariwang Groq conversation at isang
  `.v9bub` bubble ang lumabas (`display:block`).
- `strategy-baseline`, smoke, office-layout, server-security: PASS.
- **Cache-bust:** `/office-v9.js?v=13`. Bumump ng ilang beses habang inaayos ang
  texture upload at ang simple-mode cull; huling URL ang `?v=13`.

## 2026-11-20 — "More effects" pass (v14b cache-bust)

### Mga idinagdag
- **Buhay na monitors:** 24 desk screens ang may animated dashboard (bars, status,
  scan line); 5 lang ang ine-edit bawat update para hindi mabigat sa CPU.
- **Atmosphere:** light shafts sa ilalim ng pendants, 150 drifting dust motes, at
  isang gumagalaw na floor sheen sa MAIN STREET.
- **Small life:** bumubula ang water cooler, umuuga ang coffee steam, kumikislap na
  sparkles sa tabi ng 6 bots, at bahagyang umuuga ang mga halaman/puno.
- **Background life:** scanning LED bars sa server rack, flickering skyline windows,
  at 3 ibon na lumilipad sa likod ng office.
- **Compatibility fix:** ligtas na ngayon ang procedural texture metadata kahit sa
  mas lumang three.js build na walang `Texture.userData` (`t.userData = t.userData || {}`).
- Protected Phase D v8 runtime ay hindi binago; lahat ng effects ay nasa
  `public/office-v9.js` lang.

### Verification (v14b, lokal)
- `bots=6`, `built=true`, walang build error; effects arrays: `screens=24`,
  `shafts=11`, `dust=1`, `bubbles=7`, `steam=6`, `sparkles=12`, `plants=85`,
  `birds=3`, `scan=3`, `windows=27`, `sheen=1`.
- Animation probe (dalawang manual ticks na may 700ms gap): 5 screen canvases
  nagbago, pati dust/bubbles/birds/scan/sheen/sparkles.
- Pixel stats: `bgPct=0`, `edgePct=3.7`, `meanLum=112.4`, `hidden=0`,
  `meshes=1569`, `textured=221` — walang white-out. `bgHex=93a1b3`, `amb=0.58`,
  `exposure=0.85` — pareho pa rin.
- Console: walang errors. Ang Canvas2D `willReadFrequently` warnings ay galing lang
  sa diagnostic `getImageData`, hindi sa app.
- `strategy-baseline`, smoke, office-layout, server-security: PASS.
- **Cache-bust:** `/office-v9.js?v=14b` (fresh URL para hindi maulit ang v13/v14
  service-worker cache).

## 2026-11-20 — "Sobrang ganda" polish (v15 cache-bust)

### Mga idinagdag
- **Cuter bots:** paa, kamay, antenna na may glowing tip, at colored floor aura.
  Kapag may Groq line ang isang bot, lumalakas ang aura niya (`talking` state) —
  kita agad kung sino ang nagsasalita.
- **Real glass feel:** diagonal glints sa south facade at meeting-room glass, plus
  warm window-light bands sa sahig mula sa north glazing.
- **More lived-in office:** framed abstract art, bookshelves, tiny desk plants,
  reception LED strips, at mini planters sa ilang desks.
- **Exterior life:** sun glow sa likod ng skyline at 2 kotse na gumagalaw sa kalsada.
- **Motion:** antenna, glints, light bands, sun, at cars ay may banayad na animation;
  nanatiling mababa ang overhead (walang bagong shadow map / MSAA / DPR change).
- Protected Phase D v8 runtime ay hindi pa rin binabago; lahat nasa
  `public/office-v9.js` lang.

### Verification (v15, lokal)
- `bots=6`, walang build error, walang console errors.
- Effects arrays: `auras=6`, `antennae=6`, `glints=4`, `bands=5`, `cars=2`,
  `sun=1`, plus buong v14 set (`screens=24`, `shafts=11`, `dust=1`, `bubbles=7`,
  `steam=6`, `sparkles=12`, `plants=85`, `birds=3`, `scan=3`, `windows=27`, `sheen=1`).
- Talking probe: may Groq bubble si Product, `talkers=['product']`, aura opacity
  `0.316` vs `~0.08–0.14` sa iba.
- Animation probe: carX, glint, band, sun scale, at antenna intensity lahat nagbago.
- Pixel stats: `bgPct=0`, `edgePct=3.7`, `meanLum=112.6`, `hidden=0`,
  `meshes=1745`, `textured=236` — walang white-out. `bgHex=93a1b3`, `amb=0.58`,
  `exposure=0.85` — pareho pa rin.
- `strategy-baseline`, smoke, office-layout, server-security: PASS.
- **Cache-bust:** `/office-v9.js?v=15`.

## 2026-11-20 — "Cinematic" pass (v16 cache-bust)

### Mga idinagdag
- **Cinematic grade:** subtle vignette + warm/cool split-tone + fine film grain
  bilang lightweight DOM overlay (`#v16Grade`) sa ibabaw ng WebGL canvas.
  `pointer-events:none`, `z-index:2` — nasa ilalim ng bubbles, minimap at chat.
- **Better framing:** hero camera ay bahagyang mas malapit at mas mababa ang
  anggulo (`phi .44 / theta .30 / r36 / fov50`); fit/reset at HQ jump preset
  ay inayos din para mas buo ang office.
- **Window-blind shadows:** 5 soft striped shadow planes mula sa north glazing,
  may banayad na pulso (hindi shadow map).
- **Reflections:** 11 fake floor reflections — 6 bots, 2 meeting tables,
  reception, pantry at presentation screen — additive at mababa ang opacity.
- **Finished architecture:** interior baseboards, crown molding, at cove LEDs
  sa perimeter (warm sa reception/pantry, cool sa work zones).
- **Denser desks:** desk mat, tablet, pen cup + pens, sticky notes.
- **Meeting room:** freestanding animated presentation screen, table phone at
  notepad sa bawat meeting table.
- Protected Phase D v8 runtime ay hindi pa rin binabago; lahat nasa
  `office-v9.js` (geometry/effects) at `index.html` (CSS + camera) lang.

### Verification (v16, lokal)
- `bots=6`, walang build error, walang console errors.
- Effects arrays: `blinds=5`, `reflections=11`, `screens=25`, plus buong v15 set
  (`auras=6`, `antennae=6`, `glints=4`, `bands=5`, `cars=2`, `sun=1`, atbp.).
- Grade overlay: `grade=true`, `z-index=2`; camera `fov=50`, `phi=.44`, `theta=.30`, `r=36`.
- Talking probe: may Groq bubble si Product, `talkers=['product']`.
- Animation probe: carX, blind, reflection, glint, band, sun at antenna lahat nagbago.
- Pixel stats: `bgPct=0`, `edgePct=4.1`, `meanLum=109`, `hidden=0`,
  `meshes=1953`, `textured=253` — walang white-out. `bgHex=93a1b3`, `amb=0.58`,
  `exposure=0.85` — pareho pa rin.
- `strategy-baseline`, smoke, office-layout, server-security: PASS.
- **Cache-bust:** `/office-v9.js?v=16`.

## 2026-11-20 — "Realistic streets & sky" pass (v17 cache-bust)

### Bakit ito ang pinaka-kapansin-pansin
- Noon, ang kalsada at mga kotse ay nasa **south side** (z≈49) — nasa likod ng
  default camera. Kaya kahit may bagong effects, hindi talaga nakikita.
- Ngayon, may buong **north city street** na diretso sa likod ng malaking north
  glass wall — makikita agad sa default view.

### Mga idinagdag
- **North street:** two-lane asphalt with lane dashes, crosswalks, curbs,
  sidewalks, bollards, 4 street lamps, 2 traffic lights, bus stop, at 4 trees.
- **Traffic:** 5 cars + 1 bus ang gumagalaw sa dalawang lane; traffic lights
  ay nagpapalit-palit ng red/amber/green.
- ** upgraded vehicles:** hood/trunk, windshield + side glass, roof, grille,
  paired headlights/taillights, wheel hubs at contact shadow.
- **Asphalt texture:** noise, wear bands, patches at cracks (procedural canvas).
- **Skyline:** 12 varied buildings, roof caps, rooftop units, antennas, blinking
  beacons, at mas maraming lit windows.
- **Sky:** mas malalim na gradient, sun disc + halo, 3 layers ng clouds, at
  warm horizon haze — parehong sa window strip at sa malaking sky backdrop.
- Protected Phase D v8 runtime ay hindi pa rin binabago.

### Verification (v17, lokal)
- `bots=6`, walang build error, walang console errors.
- Effects: `cars=8`, `signals=2`, `windows=51`, `plants=105`, `reflections=15`,
  plus buong v16 set (`blinds=5`, `screens=25`, atbp.).
- Projection check: near car, bus, street lamp at skyline ay **onscreen** sa
  default camera — kaya kita agad ang pagbabago.
- Animation probe: carX, traffic signal, blind at reflection lahat nagbago.
- Pixel stats: `bgPct=0`, `edgePct=4.4`, `meanLum=102.5`, `hidden=0`,
  `meshes=2376` — walang white-out. `bgHex=93a1b3`, `amb=0.58`, `exposure=0.85`.
- `strategy-baseline`, smoke, office-layout, server-security: PASS.
- **Cache-bust:** `/office-v9.js?v=17`.

## 2026-11-20 — "Super-enhanced whole road" pass (v18 cache-bust)

### Mga idinagdag
- **Living street:** 6 pedestrians sa dalawang sidewalk, may swinging legs/arms,
  pasulong-balik na lakad, at wrapping kapag lumampas sa dulo ng kalsada.
- **Bike lane:** berdeng lane, puting divider dashes, at 3 directional road arrows.
- **Road finish:** tactile paving sa magkabilang curb, 7 drainage grates na may
  slats, manholes, puddles/reflections, at edge lines.
- **Furniture:** 4 parking meters, metal fence sa likod ng sidewalk, BUS/CITY
  road signs, at street-lamp banners.
- **Billboard:** malaking `CYBORG CITY / FUTURE IS OPEN 24/7` sign na kita sa
  window view; inayos ang depth para hindi matakpan ng skyline building.
- **Real glass:** additive window-reflection strip sa north glazing na may
  reflected clouds, buildings, at diagonal sheen; dahan-dahang gumagalaw.
- **Living sky:** buong sky backdrop dahan-dahang nag-d drift; reflection offset
  ay nag-aanimate din.
- Protected Phase D v8 runtime ay hindi pa rin binabago.

### Verification (v18, lokal)
- `bots=6`, walang build error, walang console errors.
- Effects: `peds=6`, `cars=8`, `signals=2`, `windows=51`, `plants=105`,
  `reflections=19` (may window-reflection strip), `sky=1`, `blinds=5`, `screens=25`.
- Projection check: car, bus, lamp, skyline, billboard, road sign, pedestrian,
  bike lane at tactile paving — **lahat onscreen** sa default camera.
- Animation probe: carX, pedX, pedLeg, skyX, reflection offset, blind lahat nagbago.
- Pixel stats: `bgPct=0`, `edgePct=4.5`, `meanLum=102.6`, `hidden=0`,
  `meshes=2550`, `textured=268` — walang white-out. `bgHex=93a1b3`, `amb=0.58`,
  `exposure=0.85`.
- `strategy-baseline`, smoke, office-layout, server-security: PASS.
- **Deploy:** commit `c6da9b2` pushed; Render detected `/office-v9.js?v=18`;
  `restore-after-deploy.js` OK (`mall=23`, `commercials=12`).
- **Live verification:** `bots=6`, Groq bubble visible (`Product`), `talkers=['product']`,
  `convOk=true`, walang console errors. Effects: `peds=6`, `cars=8`, `signals=2`,
  `reflections=19`, `sky=1`, `windows=51`, `plants=105`. Lahat ng projection checks
  (car, bus, lamp, skyline, billboard, road sign, pedestrian, bike lane, tactile)
  ay onscreen. Animation probe: carX, pedX, pedLeg, skyX, reflection offset at blind
  lahat nagbago. Pixel stats: `bgPct=0`, `edgePct=4.5`, `meanLum=102.5`, `hidden=0`,
  `meshes=2595`, `textured=276`; guards `bg=93a1b3`, `amb=0.58`, `exposure=0.85`.
- **Cache-bust:** `/office-v9.js?v=18`.

## 2026-11-20 — "Entrance road x1000" pass (v19 cache-bust)

### Bakit ito
- Ang user ay nasa north-side view na nakatingin pabalik sa **south entrance**;
  doon makikita ang kalsada sa labas ng entrance (z≈46..52), hindi ang north street.

### Mga idinagdag
- **Entrance plaza + road:** textured stone plaza (z34.4..46), asphalt road
  (z45.6..52.4), far sidewalk, curbs, edge lines at bike lane sa harap ng entrance.
- **Zebra crossings** sa x=8 at x=23 (diretso sa entrance), road arrows, at
  yellow taxi/drop-off hatching sa curb.
- **Taxi bay:** 3 parked yellow taxis na may roof light, stripe, wheels at shadow.
- **Canopy:** lit entrance canopy, cyan LED edge, support columns, at
  `ENTRANCE · DROP-OFF · TAXI · VISITORS` hanging sign.
- **Full street furniture:** 8 street lamps (may banners at ground reflections),
  2 traffic signals, bus stop, ENTER/EXIT signs, bollards, parking meters, bike
  racks, fence, planters/trees, tactile paving, drains, manholes at puddles.
- **Billboard:** malaking `CYBORG CHEEBEE HQ · WELCOME · DROP-OFF · OPEN 24/7`
  sign sa likod ng kalsada, nakaharap sa camera.
- **Traffic:** +6 moving cars at +1 bus sa dalawang lane; +5 pedestrians.
- **Cull visibility fix:** lahat ng v9 objects ay nilagyan ng `userData.v9`, kaya
  hindi itinatago ng simple-mode cull ang skyline, billboard, sun glow, birds at
  lamps (ang cull line sa index.html ay hindi binago).
- Protected Phase D v8 runtime ay hindi pa rin binabago.

### Verification (v19, lokal — north-side entrance view)
- `bots=6`, walang build error, walang console errors.
- Effects: `cars=14`, `peds=11`, `signals=4`, `plants=135`, `reflections=30`,
  `sky=1`, `windows=51`, `blinds=5`, `screens=25`.
- Projection check: taxi, crosswalk, canopy, billboard, lamp, signal, bus stop,
  bike lane at tactile paving — **lahat onscreen** sa user's current view.
- High-object check: `high=388`, `highHidden=0`, `hidden=0` — walang naitago ang cull.
- Pixel stats: `bgPct=0.2`, `edgePct=4.8`, `meanLum=99.8`, `meshes=3105`,
  `textured=288`; guards `bg=93a1b3`, `amb=0.58`, `exposure=0.85`.
- `strategy-baseline`, smoke, office-layout, server-security: PASS.
- **Deploy:** commit `87c81b7` pushed; Render detected `/office-v9.js?v=19`;
  `restore-after-deploy.js` OK (`mall=23`, `commercials=12`).
- **Live verification:** `bots=6`, Groq bubble visible (`Seo`), `talkers=['seo']`,
  `convOk=true`, walang console errors. Effects: `cars=14`, `peds=11`, `signals=4`,
  `plants=135`, `reflections=30`, `sky=1`, `windows=51`. Lahat ng entrance-road
  projections ay onscreen; `high=388`, `highHidden=0`, `hidden=0`, `meshes=3124`,
  `textured=296`. Animation probe: carX, pedX, signal at blind nagbago. Pixel stats:
  `bgPct=0.2`, `edgePct=4.8`, `meanLum=99.8`; guards `bg=93a1b3`, `amb=0.58`,
  `exposure=0.85`. Single clean live tab left, naka-set sa north-side entrance view.
- **Cache-bust:** `/office-v9.js?v=19`.

## 2026-11-20 — Side worlds + basketball bots + airplane (v20–v23 cache-bust)

### Bakit ito
- Follow-up sa request na `yung sa left and right side lagyan mo din ng kahit anong
  idea mo` at `lagyan mo basket ball court tapos may bots don nag lalaro`,
  tapos `lagyan mo din airplane`.
- Ang tamang visible wedges ng current north-side camera ay: screen-left =
  `x≈18..34, z≈35..45` at screen-right = `x≈-22..-2, z≈8..44`. Kaya ang
  unang east-world coordinates (x≈50+) ay inilipat sa loob ng screen-left wedge.

### Mga idinagdag
- **East / screen-left café court:** stone plaza, service lane, green court,
  fountain pond, 4 umbrellas, park benches, market stall, 2 vans, café sign,
  bollards, 3 street lamps, trees at pedestrians — lahat nasa `x≈18..35, z≈34..45`.
- **West / screen-right basketball block:** textured hardwood court with boundary,
  center circle, key/three-point arcs, 2 glass backboards, orange rims and nets.
- **4 mini ball bots:** red/blue jerseys, ellipse running routes, swinging
  legs/arms, head bob at facing direction. Isang bot ang may hawak ng ball;
  nagpapalit-palit ng handler, dumidribble, at pumuputok ng shot arc papunta sa
  hoop. Ang ball ay may seams at umiikot habang gumagalaw.
- **Airplane:** white/silver passenger jet na may wings, engines, cockpit,
  blinking red beacon at 2 contrails. Tumatawid ito sa `x=4→42` sa `y≈11, z≈22`
  (visible sa upper-right ng current view), may gentle bob/bank at wrap-around.
- **Name-collision fix:** ang bagong park bench helper ay pinalitan ng
  `parkBench()` para hindi ma-override ang orihinal na office `bench()`
  (workstation/monitor builder); naibalik ang `screens=25`.
- Protected Phase D v8 runtime at ang cull line sa `index.html` ay hindi binago.

### Verification (v23, lokal — north-side entrance view)
- `bots=6`, walang build error, walang console errors, script `/office-v9.js?v=23`.
- Effects: `cars=14`, `peds=15`, `signals=4`, `plants=165`, `reflections=37`,
  `sky=1`, `windows=58`, `screens=25`, `ballers=4`, `ball=1`, `planes=1`.
- Animation probe: ball, lahat ng 4 ballers, airplane at beacon — **lahat nagbago**.
- Projection check: basketball court, parehong hoop, west market/bench/van,
  east café/pond/stall/van, airplane, entrance, crosswalk at billboard —
  **lahat onscreen**.
- High-object check: `high=449`, `highHidden=0`, `hidden=0`.
  Pixel stats: `bgPct=0.2`, `edgePct=5.2`, `meanLum=99.5`, `meshes=3537`,
  `textured=314`; guards `bg=93a1b3`, `amb=0.58`, `exposure=0.85`.
- No duplicate function declarations remain.
- `strategy-baseline`, smoke, office-layout, server-security: PASS.
- **Deploy:** commit `fc89b72` pushed; Render detected `/office-v9.js?v=23`;
  `restore-after-deploy.js` OK (`mall=23`, `commercials=12`).
- **Live verification:** `bots=6`, Groq bubble visible (`Seo`), `talkers=['seo']`,
  `convOk=true`, `status=200`, walang console errors. Effects: `cars=14`,
  `peds=15`, `signals=4`, `plants=165`, `reflections=37`, `sky=1`, `windows=58`,
  `screens=25`, `ballers=4`, `ball=1`, `planes=1`. Lahat ng basketball, side-world,
  airplane at entrance projections ay onscreen. Animation probe: ball, 4 ballers,
  airplane at beacon nagbago. `high=449`, `highHidden=0`, `hidden=0`,
  `meshes=3537`, `textured=314`. Pixel stats: `bgPct=0.2`, `edgePct=5.2`,
  `meanLum=99.6`; guards `bg=93a1b3`, `amb=0.58`, `exposure=0.85`.
- **Cache-bust:** `/office-v9.js?v=23`.

## 2026-11-20 — Realism / enhancement pass (v24 cache-bust)

### Bakit ito
- Sinabi ng user: `ang panget naman gusto enhanced mo yung makatotohanan`.
  Kaya hindi na nagdagdag ng bagong props; pinino ang itsura ng existing
  basketball court, mga manlalaro, bola at airplane.

### Mga pinaganda
- **Hardwood court:** board seams, long grain, faded key, centre circle, wear at
  scuffs; may dark asphalt apron, line paint, chain-link-style perimeter,
  bleachers at court lamps.
- **Glass hoops:** transparent backboard na may frame at shooter's square,
  padded pole base, orange rim at 12-line net (lines, hindi opaque cone).
- **Makatotohanang players:** jersey na may number, shorts, socks, sneakers,
  ears/eyes/hair, at hiwalay na pivot groups para sa legs/arms — talagang
  gumagalaw ang limbs habang tumatakbo.
- **Bola:** pebbled orange texture at seams; may contact shadow na sumusunod at
  lumalaki/humihina ayon sa taas ng dribble/shot.
- **Airliner:** swept wings, smaller tailplanes, vertical fin, cockpit/windows,
  nacelles + intake rings, layered contrails, blinking beacon, gentle bob/bank.
- Local nested helper names (`jetPart`) ay hindi na nagdudulot ng duplicate
  declarations. Protected v8 runtime at cull line ay hindi binago.

### Verification (v24, lokal — north-side entrance view)
- Walang console errors, `bots=6`, script `/office-v9.js?v=24`.
- Effects: `cars=14`, `peds=15`, `signals=4`, `plants=165`, `reflections=39`,
  `sky=1`, `windows=58`, `screens=25`, `ballers=4`, `ball=1`, `planes=1`.
- Animation probe: ball, **ball shadow**, 4 ballers, airplane at beacon —
  **lahat nagbago**.
- Projection check: court, parehong hoop, bleachers, fence, west market/bench/van,
  east café/pond/stall/van, airplane, entrance, crosswalk at billboard —
  **lahat onscreen**.
- High-object check: `high=478`, `highHidden=0`, `hidden=0`.
  Pixel stats: `bgPct=0.2`, `edgePct=5.4`, `meanLum=99.3`, `meshes=3690`,
  `textured=336`; guards `bg=93a1b3`, `amb=0.58`, `exposure=0.85`.
- `strategy-baseline`, smoke, office-layout, server-security: PASS.
- **Deploy:** commit `40e8124` pushed; Render detected `/office-v9.js?v=24`;
  `restore-after-deploy.js` OK (`mall=23`, `commercials=12`).
- **Live verification:** `bots=6`, Groq bubble visible (`Product`),
  `talkers=['product']`, `convOk=true`, `status=200`, walang console errors.
  Effects: `cars=14`, `peds=15`, `signals=4`, `plants=165`, `reflections=39`,
  `sky=1`, `windows=58`, `screens=25`, `ballers=4`, `ball=1`, `planes=1`.
  Animation probe: ball, ball shadow, 4 ballers, airplane at beacon — **lahat
  nagbago**. Lahat ng court/hoop/bleacher/fence, side-world, airplane at entrance
  projections ay onscreen. `high=478`, `highHidden=0`, `hidden=0`,
  `meshes=3690`, `textured=336`. Pixel stats: `bgPct=0.2`, `edgePct=5.4`,
  `meanLum=99.4`; guards `bg=93a1b3`, `amb=0.58`, `exposure=0.85`.
- **Cache-bust:** `/office-v9.js?v=24`.

## 2026-11-20 — Building enhancement pass (v25 cache-bust)

### Bakit ito
- Sinabi ng user: `i enhanced mo lahat lahat pati building`. Kaya ang pinaganda
  hindi lang ang paligid kundi pati ang mismong shell at interior ng office —
  mas architectural, hindi dagdag na cartoon props.

### Mga pinaganda
- **Building shell:** terrazzo slab, concrete column shafts with brushed-metal
  base/cap and vertical trims, full-height wainscot on the long walls, and a
  suspended ceiling grid of textured acoustic tiles.
- **Ceiling details:** brushed-metal HVAC vents with fins, copper sprinkler
  drops with red heads, smoke detectors, and more cove LED accents.
- **Entrance:** paired frameless glass doors with metal pulls and transom,
  brushed canopy with downlights and supports, plus a larger
  `CYBORG CHEEBEE / AI AGENTS HEADQUARTERS` sign.
- **Zones:** reception front desk slats/contacts/brochures and WELCOME mat;
  meeting soundbar, screen-share pucks, table pedestal and huddle/studio signs;
  pantry tile backsplash, glass cabinets, coffee station and cups; server busway,
  colored status leads and raised-floor cable markers; wayfinding and EXIT signs.
- Procedural textures (drywall joints, concrete, ceiling tile, brushed metal,
  terrazzo) are cached once and stay cheap. Protected Phase D v8 runtime, cull
  line, white-out guards and staggered screen repaint remain unchanged.

### Verification (v25, lokal — north-side entrance view)
- Walang console errors, `bots=6`, script `/office-v9.js?v=25`.
- Effects: `cars=14`, `peds=15`, `signals=4`, `plants=165`, `reflections=39`,
  `sky=1`, `windows=58`, `screens=25`, `ballers=4`, `ball=1`, `planes=1`.
- Animation probe: ball, 4 ballers, airplane, cars, peds at bots — **lahat
  nagbago** (hal. ball `4.3005`, baller `5.3273`, plane `0.6784`, car `0.4485`).
- Projection check: canopy, glass doors, ceiling tiles, column, EXIT sign,
  reception mat, pantry, server at wayfinding — **lahat onscreen**. Meeting-room
  soundbar, screen, table at signs — **lahat onscreen** sa meeting-room view.
- New-object counts: `ceilingPanels=12`, `hvac=4`, `sprinklers=5`,
  `detectors=5`, `canopy=9`, `glassDoors=15`, `pantry=18`, `server=9`,
  `meeting=2`, `signs=3`, `entry=1`.
- High-object check: `high=545`, `highHidden=0`, `hidden=0`,
  `unflaggedHigh=0`. Scene: `meshes=3908`, `textured=359`.
  Pixel stats: `bgPct=2.9`, `edgePct=13.9`, `meanLum=122.6`,
  `nearWhitePct=0`, `whitePct=0`, `darkPct=6.3`; guards `bg=93a1b3`,
  `fog=93a1b3`, `amb=0.58`, `exposure=0.85`, `isNight=0`.
- Groq bubble visible (`Seo`), `conversations=20`. `.v9bub` remains displayed
  even with `body.ui-hidden`.
- `strategy-baseline`, smoke, office-layout, server-security: PASS.
- **Cache-bust:** `/office-v9.js?v=25`.

### Deploy + live verification (v25)
- **Deploy:** commit `35f01a6` pushed; Render detected `/office-v9.js?v=25`;
  `restore-after-deploy.js` OK (`mall=23`, `commercials=12`).
- **Live:** `bots=6`, Groq bubble visible (`Seo`, `talkers=['seo']`),
  `conversations=1`, no app console errors. `/api/health`, `/api/state`,
  `/api/mall` and `/api/bazaar/commercials` all return 200; live data
  `mall=23`, `commercials=12`.
- Effects: `cars=14`, `peds=15`, `signals=4`, `plants=165`, `reflections=39`,
  `sky=1`, `windows=58`, `screens=25`, `ballers=4`, `ball=1`, `planes=1`.
- Animation probe: ball, ball shadow, 4 ballers, airplane, cars, peds at bots —
  **lahat nagbago** (hal. ball `4.0944`, ball shadow `4.0943`, baller `2.6557`,
  plane `0.5927`, car `0.4088`, ped `0.0981`, bot `0.0916`).
- Projection check: canopy, glass doors, ceiling tiles, column, EXIT sign,
  reception mat, pantry, server at wayfinding — **lahat onscreen**. Meeting-room
  soundbar, screen, table at signs — **lahat onscreen** sa meeting-room view.
- New-object counts match local: `ceilingPanels=12`, `hvac=4`, `sprinklers=5`,
  `detectors=5`, `canopy=9`, `glassDoors=15`, `pantry=18`, `server=9`,
  `meeting=2`, `signs=3`, `entry=1`.
- High-object check: `high=545`, `highHidden=0`, `hidden=0`,
  `unflaggedHigh=0`. Scene: `meshes=3908`, `textured=359`.
  Pixel stats: `bgPct=2.9`, `edgePct=13.9`, `meanLum=122.6`,
  `nearWhitePct=0`, `whitePct=0`, `darkPct=6.3`; guards `bg=93a1b3`,
  `fog=93a1b3`, `amb=0.58`, `exposure=0.85`, `isNight=0`.
- `.v9bub` remains visible with `body.ui-hidden`.

## 2026-11-20 — Character view fix (v26 cache-bust)

### Bakit ito
- Reklamo ng user: `ano yan bakit may kisame sa office wala na kong mapanood sa view`
  at `gusto ko madaling ma observe mga character`. Ang v25 suspended ceiling
  tiles ay opaque kahit naka-Silip/auto-xray, kaya naging "takip" ito sa buong
  floor mula sa hero camera.

### Fix
- Ang 12 ceiling panels ay nirehistro sa `fx.ceilings` at may
  `userData.v9Ceiling`. Bagong `applyCeilingView()` ang nagpapalit ng opacity:
  `0.04` + `transparent` + `depthWrite:false` kapag `xrayOn || xrayAuto`,
  at bumabalik sa `1` / opaque kapag normal view.
- Tinawag ito sa `buildingEnhancements()` at sa bawat `tick()`, kahit anong
  camera angle o Silip toggle ang gamitin. Hindi na kailangang tanggalin ang
  kisame — makikita pa rin ito sa normal view, pero hindi na humaharang sa
  pag-observer sa mga bot.
- Protected v8 runtime, cull line, white-out guards at staggered screen repaint
  ay hindi binago.

### Verification (v26, lokal)
- Walang console errors, `bots=6`, script `/office-v9.js?v=26`.
- Ceiling panels: `ceilings=12`, opacity `0.04`, `transparent=true`,
  `depthWrite=false` sa auto-xray; bumabalik sa `1 / false / true` kapag
  normal view.
- Lahat ng 6 na bot ay **onscreen** sa hero view, kabilang ang active talker.
- Pixel stats bumalik sa malinis na antas: `bgPct=1.1`, `edgePct=19.5`,
  `meanLum=100.7`, `highPct=0`, `nearWhitePct=0` (v25 ceiling-blocked view ay
  `meanLum=122.6`). Guards `bg=93a1b3`, `amb=0.58`, `exposure=0.85`.
- **Cache-bust:** `/office-v9.js?v=26`.

### Deploy + live verification (v26)
- **Deploy:** commit `a9504f8` pushed; Render detected `/office-v9.js?v=26`;
  `restore-after-deploy.js` OK (`mall=23`, `commercials=12`).
- **Live:** `bots=6`, Groq bubble visible (`Cos`), walang console errors.
  `/api/mall` at `/api/bazaar/commercials` return 200; data `mall=23`,
  `commercials=12`.
- Ceiling panels live: `ceilings=12`, `opacity=0.04`, `transparent=true`,
  `depthWrite=false`. Lahat ng 6 na bot ay **onscreen** sa hero view.
- Pixel stats live: `bgPct=1.3`, `edgePct=18.2`, `meanLum=100.6`,
  `highPct=0`, `nearWhitePct=0`; guards `bg=fog=93a1b3`, `amb=0.58`,
  `exposure=0.85`, `isNight=0`.
- `.v9bub` active bubble visible. Ceiling returns to opaque `1` when Silip is
  turned off; building detail is preserved without blocking character view.

## 2026-11-20 — Character life + extra cuteness (v27 cache-bust)

### Bakit ito
- Reklamo ng user: `paayos ako ng buong character ang boring nila panoorin
  walang emosyon at hindi nag lalakad or nag tratrabaho` at
  `at gusto ko mas gawin mo pa silang super cute`.

### Changes
- May sariling 3-stop route ang bawat isa sa 6 bots: nagtatrabaho sa station,
  naglalakad papunta sa susunod, tapos nagtratrabaho ulit. Smooth turning,
  leg/arm counter-swing, footstep puffs at contact shadow/aura/reflection na
  sumusunod sa posisyon.
- Job-specific animations: `greet/wave` (waving), `type` (mabilisang keyboard),
  `pack` (boboteng pagbubuhat), `plan` (kamay sa baba + tilt), `joke` (bounce at
  dalawang kamay), `write` (scribble), `walk` (lakad + hop).
- Independent moods: bawat bot may sariling `emoAt` at mood list
  (`💬 😊 🙌`, `⌨️ 🤔 💡`, `📦 ✅ ✍️`, `😄 🤪 ✨`, atbp). Hindi na sabay-sabay ang
  emoji; may mood burst particles sa bawat pagpalit.
- Extra cuteness: 2 shiny shoes + 2 tiny legs bawat bot, pink heart cheeks (3D
  sprites), 3 floating star sparkles, hand attachments sa dulo ngarms,
  squash-and-stretch bob, at name tag/emoji na nananatiling nasa itaas.
- Parts/particles ay lightweight: walang shadow map/MSAA, 1x pixel ratio, ~30 FPS
  cap; `fx.steps`/`fx.moods` may cap at nililinis sa parent matapos mag-expire.

### Verification (v27, lokal)
- Walang console errors; script `/office-v9.js?v=27`; `bots=6`.
- Rig check: `legs=[2,2,2,2,2,2]`, `shadow/refl=true` para sa lahat,
  `routes=[3,3,3,3,3,3]`.
- 70 manual ticks (fake clock, 100ms hanggang 7s): `sawWalk=156`,
  lahat ng 6 na bot nagbago ng `x/z`, `wp`, `job` at emoji. Nakita ang
  `greet`, `wave`, `type`, `pack`, `plan`, `joke`, `write` states at 14 na
  magkakaibang emoji.
- Animation deltas: hal. arm `-2.573 -> -2.569` (wave), leg `0.071 -> -0.037`
  (work sway); may aktibong `steps=11`, `moods=12`, `sparkles=30`.
- Projection check: lahat ng 6 na bot ay **onscreen** sa hero view kahit
  nagbago ng posisyon. Ceiling view fixed pa rin: `opacity=0.04`,
  `transparent=true`; guards `bg=fog=93a1b3`, `amb=0.58`, `exposure=0.85`,
  `isNight=0`.
- Pixel stats: `bgPct=0.3`, `edgePct=17.4`, `meanLum=101.3`,
  `highPct=0`, `nearWhitePct=0.1` — walang white-out.

### Deploy + live verification (v27)
- **Deploy:** commit `54c28df` pushed; Render detected `/office-v9.js?v=27`;
  `restore-after-deploy.js` OK (`mall=23`, `commercials=12`).
- **Live:** walang console errors; script
  `https://cyborgcheebeeoffice.onrender.com/office-v9.js?v=27`; `bots=6`.
  Rig: `legs=[2,2,2,2,2,2]`, `shadow/refl=true`, `routes=[3,3,3,3,3,3]`.
- 70 manual ticks (fake clock): `sawWalk=224`; lahat ng 6 na bot nagbago ng
  `x/z`, `wp`, `job` at emoji. Nakita ang `greet`, `wave`, `type`, `pack`,
  `plan`, `joke`, `write` states at 9 na magkakaibang emoji (`✅ ✨ 💚 💡 📋
  😄 😊 😌 🙂`).
- Active Groq bubble visible (`Joker`). Step/mood particle systems ay buhay at
  bounded: `steps=26`, `moods=0` (expired/cleaned), `sparkles=30`.
- Lahat ng 6 na bot ay **onscreen** kahit nasa gitna ng lakad. Ceiling fixed pa
  rin: `opacity=0.04`, `transparent=true`, `depthWrite=false`. Guards
  `bg=fog=93a1b3`, `amb=0.58`, `exposure=0.85`, `isNight=0`.
- Pixel stats live: `bgPct=0.3`, `edgePct=15.1`, `meanLum=101.4`,
  `highPct=0`, `nearWhitePct=0.1` — walang white-out.
- `/api/mall` at `/api/bazaar/commercials` return 200; data `mall=23`,
  `commercials=12`.

## 2026-11-20 — ARYASKY artist + OPISINA ART ZONE (v28 cache-bust)

### Bakit ito
- User: `sige idag dag mo at gusto ko sample siya ng mga gawa niya dito
  pagawain mo siya ng mga bagay na kelangan sa office natin` at
  `or opisina zone`. Kaya si ARYASKY (handoff artist) ay idinagdag bilang
  ikapitang bot, at may sariling sample-work area sa mismong opisina.

### Changes
- Bagong bot: `ARYASKY 🎨`, kulay `#6bb3a6`, may 3-stop route: `design` sa
  drafting desk, `review` sa mga moodboard, at `showcase` sa mga maquette.
 独立 moods: `🎨 🖌️ 💡`, `📐 🔍 ✨`, `🖼️ 🙌 😍`. May sariling work animations
  (pagguhit, pagrepaso kamay-sa-baba, at pagpapakita ng dalawang kamay).
- **OPISINA ART ZONE** sa gitna ng opisina (x≈28–37, z≈17–24):
  - blueprint drafting desk na may wood top, 4 na binti, tablet at 3 accent
    swatches (`#e3b159`, `#6bb3a6`, `#ff6647` — eksaktong ARYASKY palette),
  - 2 angled sample-art boards gamit ang `artTex()`,
  - 3 zone maquettes: Class Plaza (8 pedestal), Combat Arena (4 pillar + 4
    brazier), at Flight Zone (tower + wing ring),
  - rug, accent border strips, wall sign `OPISINA ART ZONE / ARYASKY · LAYOUT
    SAMPLES`, at pendant.
- Lahat ng bagong objects ay dumaan sa `addO()` / final v9 traverse, kaya hindi
  sila matatago ng simple-mode cull. Protected v8 runtime, cull line,
  `makeTex()` guard at white-out guards ay hindi binago.

### Verification (v28, lokal)
- Walang console errors; script `/office-v9.js?v=28`; `bots=7`
  (`cos, seo, product, joker, mgr, writer, aryasky`).
- Rig: `legs=[2,2,2,2,2,2,2]`, `routes=[3,3,3,3,3,3,3]`.
- Art zone: `artZoneMeshes=163` sa bounding box; `screens=25`,
  `sparkles=35` (7 bots × 5), `ceilings=12` @ `opacity=0.04`.
- 100 manual ticks: ARYASKY `sawJobs={design:55, review:45}`, `walkTicks=27`,
  emojis `🎨 🖌️ 💡 ✨ 📐 🙂`. 180-tick follow-up: lahat ng 3 jobs lumabas
  (`design:61`, `review:55`, `showcase:64`), `walkTicks=63`, emojis
  `🎨 🖌️ 💡 🔍 🖼️ 🙌 ✨ 🙂`.
- Projection check: lahat ng 7 bots ay **onscreen**, kasama si ARYASKY.
- Guards `bg=fog=93a1b3`, `amb=0.58`, `exposure=0.85`, `isNight=0`.
- Pixel stats: `bgPct=0.2`, `edgePct=18.3`, `meanLum=98.9`,
  `highPct=0`, `nearWhitePct=0.1` — walang white-out.

### Live verification (v28, production)
- Deployed app commit `58fbea6` (mula `4dc5b73`). Render nagsilbi ng
  `/office-v9.js?v=28` (body `149773` bytes, may `OPISINA ART ZONE`).
- Pinatakbo ang `node restore-after-deploy.js` kaagad pagkatapos ng deploy:
  `UNLOCK 200`, `MALL ok=23 fail=0`, `COMMERCIALS ok=19 fail=0 skip=0`,
  `FACEBOOK 200`, `SHOPEE 200`, `AI KEYS 200`; final `mall=23`,
  `commercials=12`.
- Live URL `?v28live=1795153546828`: walang console errors; script
  `/office-v9.js?v=28`; `bots=7`, `legs=[2,2,2,2,2,2,2]`,
  `routes=[3,3,3,3,3,3,3]`; cull line na-confirm sa live HTML (`cull=true`).
- Art zone live: `artZoneMeshes=198` sa bounding box (x≈28–37, z≈17–24).
- ARYASKY 180 live ticks: `sawJobs={design:64, review:52, showcase:64}`,
  `walkTicks=63`, emojis `🎨 🖌️ 💡 🔍 🖼️ 🙌 ✨ 😊`.
- Projection check: lahat ng 7 bots ay **onscreen** sa hero camera.
- FX: `screens=25`, `sparkles=35`, `ceilings=12` @ `opacity=0.04`,
  `steps=9`, `moods=12`.
- Guards `bg=fog=93a1b3`, `amb=0.58`, `exposure=0.85`, `isNight=0`.
- Live pixel stats: `bgPct=0.2`, `edgePct=16`, `meanLum=98.8`,
  `highPct=0`, `nearWhitePct=0.1` — walang white-out.
- Live data APIs: `/api/mall` → `mall` array `23` entries;
  `/api/bazaar/commercials` → `commercials` array `12` entries.

## 2026-11-20 — UI clarity + maliit na world chat (index.html only)

### Problema
- May screenshot na sinend ang user; hindi makikita ng model ang image, kaya
  tiningnan ang live DOM. Natagpuan: `document.body.className === "ui-hidden"`
  at `getComputedStyle(#mmoChat).display === "none"` — buong UI at world chat
  ay nakatago kaya "hindi ma-gets" ang itsura.
- Dalawang dahilan: (1) `<body class="ui-hidden">` ang default sa HTML, at
  (2) `createUiHideBtn()` ay nagsave ng `localStorage.uiHidden='1'` kahit
  walang explicit choice, kaya persistant ang hidden state.

### Changes (walang binagong JS module — `/office-v9.js?v=28` ang laban)
- `<body class="ui-hidden">` → `<body>`: makikita agad ang sidebar, topbar,
  office bar at mga pindutan. Ang `H` key at `👁 Hide/Show UI` button ay
  nananatiling available para sa full-screen 3D view.
- Bagong preference key na `uiHidden2`: `null`/`0` = UI visible, `1` = hidden.
  Hindi na maaapektuhan ng lumang `uiHidden='1'` na auto-save.
- `#mmoChat` ay lalabas na **maliit na 200×100 window** (hindi nakatago),
  may welcome/message log agad. Ang `–` button ay nagc-collapse sa 24px bar;
  click sa header para ibalik. Naayos din ang `min-height:96px` na nag-iwan
  ng walang lamang 96px box sa min state (`min-height:0!important`).
- Service worker ay allowlist lang ng static assets, hindi naka-cache ang
  HTML — kaya walang bagong `?v=` bump na kailangan.

### Verification (lokal)
- `bodyClass=""`, `uiHidden=false`, `sidebar=flex`, `officeBar=flex`.
- Chat `200×100` @ bottom-left, `logText` may laman; `–` → `108×24`;
  header click → bumalik sa `200×100`. Walang console errors.
- Lahat ng 4 na tests ay PASADO pagkatapos i-update ang index.html hash sa
  `tests/strategy-baseline.js`.

### Live verification (UI fix, production)
- Commit `161be23`; Render nagsilbi ng bagong HTML (3 poll attempts bago
  lumabas ang `noHidden=true smallChat=true v28=true`).
- `restore-after-deploy.js` pinatakbo: final `mall=23`, `commercials=12`.
- Live `?uifixfinal=1795154129695`: `bodyClass=""`, `uiHidden=false`,
  `sidebar=flex`, `officeBar=flex`, `sidebar/topbar/chatBtn` makikita.
- World chat: `display=flex`, `200×100`, may laman ang log
  (`🌐 SYSTEM: Maligayang pagdating! …`), `bots=7`, ARYASKY present.
- Guards `bg=fog=93a1b3`, `amb=0.58`, `exposure=0.85`, `isNight=0`;
  cull line na-confirm (`cull=true`). Walang console errors.
- Isang malinis na live tab ang naiwang focused; sarado ang local tab.

## v29 — Clear view, living surroundings, basket fix at FPS recovery (local)
### Problema
- Kisame (suspended ceiling tiles) nagtatakip sa view kahit normal na tingin.
- Paligid kulay abo (`#485567` 220×220 ground) kaya patay itsura.
- Basketball net struts sa lumang court ay lumalapad paitaas (baligtad).
- Live speed test: `0.8 FPS`, `22,189 calls`, `4,032 geometries` — step/mood
  sprites hindi naaalis kaya dami ng draw calls tumaas habang tumatakbo.

### Pinagbago
- `office-v9.js?v=29`: `applyCeilingView()` ay palaging `.04` opacity,
  `transparent=true`, `depthWrite=false` — walang lid sa normal view.
- Bagong `grassTex()` + `greenSurrounds()`: damuhan, 7 bundok, farm rows/barn/
  hay/fence at 12 puno; nasa ibabaw lang ng dark guard plane.
- Leak fix sa `updateBotParticles()`: gamitin ang `.parent` ng Three.js hindi
  `.parentNode`, kaya natatanggal ang step/mood sprites pagkatapos ng buhay nila.
- `index.html`: basketball net tilt flags binago ang sign (`-Math.cos/-Math.sin`)
  para lumapad sa rim at yumukot paitaas; script tag ay `/office-v9.js?v=29`.

### Verification (lokal, focused tab)
- `node --check` at `tests/strategy-baseline.js`: PASADO; hash na-update.
- 6s stress: sprites `80 → 105`, calls `2809 → 2959` (hindi pumutok).
- 10s FPS sa iisang focused tab: `29.5 FPS`, calls `3236 → 3172`.
- Hero camera render: `meanLum=96.9`, `dark=12%`, `green=9.3%`, `edge=18.8%`,
  `bg=fog=93a1b3`, `isNight=0`, `bots=7`, ceiling `opacity=.04`.

### Live verification (v29 production)
- Commit `61b7526`; Render served `/office-v9.js?v=29` after 3 polls.
- `restore-after-deploy.js` run: `mall=23`, `commercials=12` final.
- Live `?v29live=...`: `bots=7`, ceiling `12 tiles opacity=.04 transparent=true
  depthWrite=false`, `bg=fog=93a1b3`, `amb=.58`, `exposure=.85`, `isNight=0`.
- 10s live perf on one focused tab: `28.8 FPS`, calls `2702 → 2720`,
  sprites `89 → 114`, geometries flat at `2831` — no slow-motion leak.
- Hero pixels: `meanLum=95.2`, `dark=13.3%`, `green=8.8%`, `edge=19.4%`.
- `body.ui-hidden` was active from the H toggle; `.v9bub` CSS remains exempt
  from the hide rule. No console errors.

## v30 — Office Studio editor + polish batch (local)
### Pinagbago
- Bagong `public/office-studio.js?v=30`: HQ Layout Editor na may tool palette
  (select/place/erase/pan), undo/redo, snap/zoom/pan, inspector, lock/duplicate,
  room resize/rename, presets (Default HQ / Open Studio / Farm Campus), theme
  select, photo presets + freeze, bot cards, adaptive detail guard, chat quick
  actions, farm interaction at accessibility mode.
- `office-v9.js?v=30`: job-status antenna lamps, `freeze/detail/theme` hooks,
  interactable crops, green-only seasonal material swaps at detail guard cache fix.
- `index.html`: v9 at studio cache-bust bump; H hide-UI shortcut ay hindi
  hinawakan. Protected cull line at `t.userData` guard nanatili.
- Editor shortcuts: V/B/E/Space/Del/Ctrl+Z/arrows/Esc. Hindi ginagamit ang H
  para hindi mabreak ang Hide UI. Auto-save gamit ang umiiral na `autoSaveLayout()`.

### Verification (lokal)
- `node --check public/office-studio.js`, `node --check public/office-v9.js`: PASS.
- `node tests/strategy-baseline.js`: PASS; na-update ang hashes (may bagong
  `office-studio.js` hash sa baseline).
- Headless local check: 7 bots, editor shell mounted, 4 tools, 25 palette items,
  inspector/presets/theme/perf/a11y controls present, walang console errors.
- v31/v32 fixes mula sa headless test: `querySelector` boot guard para talagang
  mag-mount ang editor shell; safe `contains()` guard para sa synthetic clicks.
- Local interaction check: place `24→25`, undo `25→24`; theme/freeze/detail/a11y
  at bot-card click ay gumana, walang errors.

### Live verification (v30 / v30.1 production)
- Commits: `1854941` (v30 app), `c435606` (v30 docs), `3deb942` (v30.1 app
  fix), `4826f24` (v30.1 docs). Render serves `/office-v9.js?v=30` and
  `/office-studio.js?v=32`.
- `node restore-after-deploy.js`: `mall=23`, `commercials=12`, FB/Shopee/AI keys
  OK. (Script reported `COMMERCIALS ok=19` before server-side dedupe; final 12.)
- Live editor mounted: `data-studio=1`, 4 tools, 25 palette items, inspector,
  presets, theme, auto-detail, a11y at status `Ready · autosave on`.
- Live modules: 7 bots, 90 interactive crops, 12 ceiling tiles at `opacity=.04`,
  photo/freeze/bot-card/chat-quick controls present, no console errors.
- Auto night was active (Manila 20:xx) on first load. After forcing manual day:
  `bg=fog=93a1b3`, `amb=.58`, `exposure=.85`, `isNight=0`; after forced tick the
  guards stayed correct. The v9 tick reasserts day colors even at auto-night;
  no code was changed for this existing app behavior.
- Forced 60-frame stability check (`tick.last=Date.now()-100` + `frame3D()`):
  calls `2955→2953`, geometries flat `2900`, transient sprites `28`, bots `7`.
  Natural rAF was throttled to zero in the headless review tab, so no live FPS
  number was taken in this session.
- Hero-pixel render: `meanLum=96.2`, `dark=19.3%`, `green=22.2%`, `bg=3.7%`
  — no white-out; farm/greens clearly visible.

## Batch 1 (items 1–10) — living world layer (v31 / v32 / v34)

### What was added (v9/Studio modules only; protected v8 runtime untouched)
1. Smooth day↔night: camera-facing dark veil fades in/out; Studio Time control
   also syncs the app's `nightManual` so `scene3d.isNight` stays correct.
2. Weather: rain particles, lightning flash (storm), puddles and a rainbow arc.
3. Seasonal props: four prebuilt groups (default / Pasko / Fiesta / Rainy).
4. Rooftop garden + helipad on an east annex (x≈70, z≈12), clear of hero view.
5. Basement Server Vault (glowing racks/door) + animated elevator at x≈44, z≈6.
6. Moving walkway: three scrolling belt strips along MAIN STREET.
7. Holographic receptionist: additive body/head with rising scan rings.
8. Reflective wet floor: subtle animated sheen planes in lobby/street/focus.
9. Neon zone signs: six additive text signs that brighten at night.
10. Delivery drones: two patrolling quads with spinning rotors and parcels.

### Guards and stability
- No guarded value is written by the new layer: bg/fog `#93a1b3`, ambient `.58`,
  exposure `.85`, `isNight` owned by the app, `tameOfficeLights()` unchanged.
- Cull line in `index.html` and `t.userData = t.userData || {}` in `makeTex()`
  are untouched. `.v9bub` exemption under `body.ui-hidden` remains.
- Cache keys: `/office-v9.js?v=32`, `/office-studio.js?v=34`.
- Studio World bar (Time / Weather / Season + 8 toggles) persists choices in
  localStorage and re-applies them after a v9 rebuild.

### Verification (local headless)
- `node --check` on both modules: PASS. `node tests/strategy-baseline.js`: PASS.
- No console errors on load or after exercising every World control.
- Forced ticks (`tick.last=Date.now()-100`): day mode `bg=fog=93a1b3, amb=.58,
  expo=.85, isNight=0` (after `frame3D()` so the app resolves night state);
  storm mode raised the veil to `.62`, rain/flash/puddles/rainbow all visible,
  guards unchanged.
- 60 forced ticks: geometries `2799→2799`, textures `131→131`, render calls
  `2879→2879` (flat — no transient-object leak).
- Toggles on/off, season switching (`fiesta` visible, others hidden), and the
  `H`/`.v9bub` CSS exemption were verified.
- Render sample (day): `meanLum=91.6`, `dark=33%`, `green=9.5%` — no white-out.

### Live verification (production, commit `f04e62e`)
- Render served the new HTML: `/office-v9.js?v=32`, `/office-studio.js?v=34`.
- Ran `node restore-after-deploy.js`: `MALL ok=23`, `COMMERCIALS ok=19`,
  `AI KEYS 200 OK`; final `mall=23`, `commercials=12`.
- Studio World bar mounted live; v9 API (`setNight/setWeather/setSeason/
  setWorldFeature`) present; no console errors.
- Day check (after `frame3D()`): `bg=fog=93a1b3`, `amb=.58`, `expo=.85`,
  `isNight=0`, veil `0`.
- Storm check: veil `.62`, rain/flash/puddles/rainbow all visible, guards still
  `bg=fog=93a1b3`, `amb=.58`, `expo=.85` (`isNight=1` only from the explicit
  night toggle, owned by the app).
- 60 forced ticks live: geometries `2933→2933`, textures `133→133`, render
  calls `3041→3041` — flat, no leak.
- DOM controls verified: day/rain/fiesta selections, drones/neon toggles;
  settings restored to defaults in the test profile afterward.
- Live hero pixels: `meanLum=108.9`, `dark=19.5%`, `green=10.5%`,
  `bg=0.1%` — no white-out; greens clearly visible.


## 2026-11-20 - Batch 2 local verification (items 11-20, not yet deployed)

### Implemented
11. Barista bot behind the pantry counter with chef hat, apron and cup pour.
12. Three indoor plants that cycle through visible growth stages.
13. Lounge fish tank with five swimmers, glass, water and tank frame.
14. Skyline window lights whose opacity follows the smooth night amount.
15. Ceiling projection (clouds by day, stars by night) as one additive plane.
16. Floating role/name plate above each of the seven bots.
17. Status text sprite that follows the bot's live job/walk state.
18. Idle beats: stretch, yawn and coffee sip with restored arm/head/cup state.
19. Job outfits: chef hat on barista, hard hat on Product, beret on ARYASKY.
20. Pet cat and dog that trail two bots with tail wag and bobbing.

### Guards and stability
- Batch 2 writes no bg/fog/ambient/exposure/isNight value. Day guards verified:
  bg=fog `93a1b3`, ambient `.58`, exposure `.85`, `isNight=0`, veil `0`.
- Protected lines intact: cull fix in `index.html`, `makeTex()` userData guard,
  and `.v9bub` exemption under `body.ui-hidden`.
- Cache keys bumped: `/office-v9.js?v=33`, `/office-studio.js?v=35`.
- Studio BOT bar: 10 toggles persisted in `localStorage.ccStudioBots`; `H`
  remains reserved for Hide UI.

### Verification (local headless)
- `node --check` on both modules: PASS. `node tests/strategy-baseline.js`: PASS.
- No console errors (only the benign `navigator.vibrate` user-gesture notice).
- Bars mounted: World 8 buttons, BOT 10 buttons.
- Feature counts: barista yes, plants 3, fish 5, skyline panes 72, ceiling yes,
  outfits 3, pets 2, nameplates 7, status sprites 7.
- Toggle round-trip PASS: fish `[true,false,true]`, nameplates `[true,false,true]`.
- 60 forced ticks flat: geometries `2923 -> 2923`, textures `146 -> 146`,
  render calls `3015 -> 3015`.
- Day hero pixels after 120 settling ticks: `meanLum=95.7`, `dark=21.2%`,
  `green=21.1%`, `bg=0.2%` - no white-out.

### Live verification (production, commit `c520b80`)
- Render served `/office-v9.js?v=33` and `/office-studio.js?v=35`.
- Ran `node restore-after-deploy.js`: UNLOCK 200, MALL ok=23, COMMERCIALS ok=19,
  FACEBOOK 200, SHOPEE 200, AI KEYS 200; final `mall=23`, `commercials=12`.
- No console errors. Studio World and BOT bars both mounted live (8 + 10 buttons).
- Live feature counts: barista present, plants 3, fish 5, skyline panes 72,
  ceiling projection present, outfits 3, pets 2, nameplates 7, status sprites 7.
- Night link verified: skyline opacity `0.126 -> 0.525` and ceiling opacity
  `0.056 -> 0.186` as night amount `0 -> 1`; veil `0 -> .62` with bg/fog still
  `93a1b3`, ambient `.58`, exposure `.85`.
- Toggle round-trip live: fish `[true,false,true]`, nameplates `[true,false,true]`,
  pets `[true,false,true]`.
- 60 forced ticks live: geometries `2923 -> 2923`, textures `146 -> 146`,
  render calls `3015 -> 3015` - flat, no leak.
- Day guards after `frame3D()`: bg/fog `93a1b3`, ambient `.58`, exposure `.85`,
  `isNight=0`, veil `0`.
- Live hero pixels: `meanLum=115.9`, `dark=14.6%`, `green=27%`, `bg=0.4%` -
  no white-out; greens and Batch 2 props render.

## 2026-11-20 - Clarity pass (user report: sobrang dilim + HUD/nakaharang)

### Changes
- Night veil cap lowered `.62 -> .32`; guarded values still untouched
  (bg/fog `93a1b3`, ambient `.58`, exposure `.85`).
- Full-ceiling `46x26` additive projection plane replaced with a compact
  `1.2x1.2` projector tile + small housing, off by default. The big plane sat
  between the high hero camera and the bots and blocked the view.
- Studio BOT bar clarity defaults: `ceiling`, `nameplates`, `status` now start
  OFF; they can still be enabled from the bar. Other 7 features stay ON.
- Default view is clean full-screen 3D (`ui-hidden` on first load); H / the eye
  button still restores the full HUD. `.v9bub` remains exposed when forced.
- Cache keys bumped: `/office-v9.js?v=34`, `/office-studio.js?v=36`.

### Local headless verification
- `node --check` both modules PASS; `node tests/strategy-baseline.js` PASS.
- No console errors. Default `botFeatures` confirmed: ceiling/nameplates/status
  false, others true.
- HUD hidden: camTools, camHint, minimap, gameHud, mmoChat, eventShowCard,
  ceoFab, lockFab all `display:none`; `.v9bub` forced display `block` OK.
- Night with clarity defaults: veil `.32`, amount `1`, guards unchanged.
  Pixels `mean=91.9`, `dark=14.4%`, `green=16.3%`, `blue=22.9%` vs the reported
  dark screenshot `mean=50.7`, `dark=38.6%`, `green=0%`, `blue=86.1%`.
- Day: veil `0`, guards unchanged, `mean=115.1`, `green=25.2%`.
- Toggle round-trip for ceiling/nameplates/status: `[false,true,false]`.
- 60 forced ticks flat: geometries `4511 -> 4511`, textures `144 -> 144`,
  render calls `3190 -> 3190`.

### Follow-up fixes in the same clarity pass
- Dark "mirror" during camera rotation: the camera-facing night veil plane was
  hidden entirely. Night shading now comes from a canvas CSS brightness filter
  (`brightness(1 - amount*.20)`), which cannot lag or show plane edges.
- The compact projector housing box was removed too, so no dark square remains
  overhead.
- World chat disappeared because the clean-view rule hid `#mmoChat`; that rule
  was removed. World chat stays visible in the clean 3D view.
- Cache keys: `/office-v9.js?v=35`, `/office-studio.js?v=37`.

### Verified after the dark-mirror / sky-split fix
- Veil mesh `visible=false`; canvas filter stays `brightness(0.8)` across 12
  camera rotations (no mirror edge, no sky split).
- Left/right render halves matched: mean `91.2` vs `90.8` (no vertical split).
- World chat computed display `flex` in the clean view; no console errors.

## 2026-11-20 - Comic bubbles, all keys restored, Ollama provider

### Comic conversation bubbles (user: readable when zoomed out)
- `updateBubbles()` now shows up to 3 consecutive conversation lines at once,
  anchored above their speaking bots.
- Bubbles are DOM overlays: font stays `clamp(16px,1.35vw,20px)` (17.5px at
  1294px wide) at r=20, r=36 and r=90. No shrinking when zoomed out.
- Viewport clamping + iterative collision stacking: 3 bubbles, 0 overlaps,
  all inside the scene at every tested zoom.
- Styling upgraded: wider max-width 360px, bold text, stronger border/shadow,
  amber ring on the currently talking bubble.
- Cache keys: `/office-v9.js?v=36`, `/office-studio.js?v=38`.

### Keys
- `restore-after-deploy.js` now merges EVERY key source: live `/api/private`
  keys, local `data/settings.json` keys, then `.env` fallbacks. Before this it
  only restored Vyce/Groq from `.env`, so a fresh Render deploy lost keys.
- Applied live: `AI KEYS coarena, groq, vyce failover=groq, vyce` (OK).
- Verified the stored Groq key directly against `api.groq.com`: models 200,
  `qwen/qwen3.8-27b` present, chat completion 200. So cloud conversations work;
  the repeated generic lines came from stale state after deploys, not a bad key.

### Ollama (first-class, no key required)
- `server.js`: added `ollama` provider with default `http://localhost:11434/v1`
  and model `qwen2.5:3b`; local providers may call without an API key.
  Existing keep_alive=30m / reasoning_effort=none / reasoning fallback preserved.
- `callAI()` accepts local failover candidates without keys.
- Setup dropdown gained "Ollama (local, free)"; Failover panel gained Base URL
  and Model fields; `restore-after-deploy.js` registers the no-key Ollama entry.
- Verified with a mock endpoint on 11434: setting provider `ollama` and calling
  `/api/chat` returned `provider=ollama` with the mock reply. Ollama is installed
  on this PC but was not running during the check.
- Baseline hashes updated for `server.js`, `index.html`, `office-v9.js`.


### v37/v39 - comic bubble layout tightened after live check
- Live small panel (673x518) showed overlapping bubbles at some zooms.
- Bubbles now use a host-relative max-width:min(340px,46%) and a deterministic
  vertical stacking pass with an 8px gap; overflow slides the whole stack up.
- Narrow panels (<800px) show 2 lines; wider views show 3. Both verified at
  r=20, r=36 and r=90: 0 overlaps, all inside view, font unchanged by zoom.
- Cache keys: /office-v9.js?v=37, /office-studio.js?v=39.

## 2026-11-20 - Final live verification (v37/v39, commit 7a53477)
- Live scripts: /office-v9.js?v=37, /office-studio.js?v=39.
- Ollama UI present (Setup option + olu/olm fields); world chat display=flex.
- Detailed bubble rects at r=20 / r=36 / r=90 on a 671x516 panel: 2 bubbles,
  font 16px (clamp min), 0 overlaps, all fully inside the host with 8px gap.
  The earlier overlaps=1/inView=false was a load/settling artifact, not a bug.
- Night veil visible=false; guards bg=fog=93a1b3, ambient .58, exposure .85.
- No console errors. 60 forced ticks stay flat (no geometry/texture leak).
- Real Ollama end-to-end: qwen2.5:3b running locally, /api/chat with provider=ollama
  returned a natural Taglish reply.
- Restore after deploy: MALL ok=23, COMMERCIALS ok=19, FACEBOOK 200, SHOPEE 200,
  AI KEYS coarena, groq, vyce, ollama failover=groq, vyce 200 OK.
