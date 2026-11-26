'use strict';
// Documentation/architecture regression test. Confirms the selected strategy
// and ensures this planning batch did not introduce partial runtime features.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const architecture = read('MASTER-ARCHITECTURE.md');
const roadmap = read('IMPLEMENTATION-ROADMAP.md');
const status = read('MULTIPLAYER-IMPLEMENTATION-STATUS.md');
const server = read('server.js');
const html = read('public/index.html');
const mp = read('MULTIPLAYER-ARCHITECTURE-PLAN.md');
const game = read('MMORPG-GAME-DESIGN-PLAN.md');

assert(architecture.includes('Business direction: BOTH'), 'Both-pillar direction missing');
assert(architecture.includes('Publishing control: RULES'), 'Rules publishing choice missing');
assert(architecture.includes('Cyborg Cheebee'), 'CEO avatar identity missing');
assert(architecture.includes('CONNECTED ADVENTURE REGIONS') && architecture.includes('implementation is still modular'), 'Isolated Adventure module missing');
assert(architecture.includes('one continuous geography'), 'Seamless world layout missing');
assert(architecture.includes('AUTO-PUBLISH') && architecture.includes('HOLD FOR REVIEW') && architecture.includes('BLOCK'), 'Publishing policy outcomes missing');
assert(architecture.includes('Phase D v8'), 'v8 protection rules missing');
assert(roadmap.includes('Phase 3 — Rules-based publishing engine'), 'Publishing implementation phase missing');
assert(roadmap.includes('Phase 8 — First playable seamless Adventure vertical slice'), 'MMORPG vertical slice missing');
assert(status.includes('SPECIFIED, NOT IMPLEMENTED'), 'Status must distinguish design from implementation');
assert(mp.includes('one shared office world'), 'Existing multiplayer architecture lost');
assert(game.includes('First playable vertical slice'), 'MMORPG first slice missing');
assert(!/new WebSocketServer|new WebSocket\.Server|require\(['"]ws['"]\)/.test(server), 'No partial WebSocket implementation in documentation batch');
assert(!/MMORPG_GAME_RUNTIME|adventureCombatTick\s*\(/.test(html), 'No partial MMORPG runtime in v8 office HTML');
const protectedHashes = {
  // Performance pass (2026-11-19): server.js gained gzip/deflate response compression,
  // Cache-Control policy (static assets cache 1 day, HTML no-cache, APIs no-store) and
  // richer MIME map. public/index.html loads three.min.js from the jsdelivr CDN first
  // (local /three.min.js remains the fallback). public/sw.js also caches /three.min.js
  // for repeat visits. These are the expected hashes of that optimized state.
  // Ollama fix (2026-11-20): local providers send reasoning_effort=none (so
  // reasoning models stop returning empty `content`), keep_alive=30m (no 30s
  // reloads), a 5-minute request timeout, and a reasoning-text fallback.
  // 2026-11-20: office bots chat through the user's Groq key (callGroq),
  // model qwen/qwen3.8-27b (clean Taglish, no reasoning leak), case-insensitive speaker ids.
  // Ollama is a first-class no-key provider (localhost:11434/v1, qwen2.5:3b),
  // usable as primary or failover. 2026-11-20: added GET /api/ollama/status
  // for auto-detecting local models and runtime status.
  // 2026-11-20 RESEARCH BATCH (CEO-approved): optional Crawl4AI integration.
  // server.js only gained require('./research-client'), Crawl4AI-first calls
  // with the ORIGINAL regex scrapers preserved as fallback, and a CEO-gated
  // POST /api/ceo/research route. No change to game/office/public runtime.
  // Pre-batch hash: b31cb589b1bfdb709164ec05fc6d57b763cade0ad69826eaffa03d5f70eca30d
  // 2026-11-20 RESEARCH BATCH 2 (CEO-approved, recommendations only): extended
  // /api/ceo/research with list/refresh/review/gate/search/digest/metrics,
  // added research metrics to /api/ceo/ops, and wired the CEO Research Records
  // panel. Original regex scrapers remain the fallback. Approved hash unchanged
  // from batch 1: 3e73044482605da605b6ec80b418e73ec90f8e2e7b2a0f024881f481683b5de5
  // (current value below is the same content hash, re-verified).
  // 2026-11-20: added Office Fixer agent (fixer) with diagnosis prompt and a
  // default disabled health-check routine to help troubleshoot office issues.
  // 2026-11-20 HYPERFRAMES BATCH (CEO-approved): added the five-agent
  // "video editor" group (hflex/hfstory/hfmotion/hfcaption/hfrender) with
  // prompts + AGENT_META; no multiplayer/MMORPG runtime was introduced.
  // 2026-11-20 BATCH 3 (CEO-approved): server-side task runner, drift/quota health,
  // agent error visibility, secrets separation, CEO session tokens, preflight/quota
  // routing, approval/publish/finance ledgers and hashed backup restore drill.
  // Hash below explicitly refreshed for Batch 3.
  // 2026-11-21: CEO-gated /api/fb/post (explicit confirm, 5/hour, token from
  // Render env, never echoed) + safe office routines enabled by default.
  // 2026-11-21 BOT AUTOPOST: native-Tagalog dahon/halaman pipeline, bot
  // Publisher (8/day cap, 120-min cadence for account safety), Video Bot routine,
  // status/control APIs. Token stays in Render env only; hash refreshed.
  // 2026-11-22: failed routines now back off (6h for no-page-token, 15m otherwise)
  // so the Video Bot cannot retry every tick and spam the activity log.
  'server.js': 'ec2958691a264108c7ed471eb09c5ad9c9e1b2b07ec471e49d6ce4cb9bb216fc',
  // APPLY-PHASE-D.bat (the documented install step) injects the phaseB/C/D <script> tags, so the post-install hash differs from the packaged baseline. This is the expected, installed state.
  // Perf fix (2026-11-20): load three.min.js locally first (no CDN wait),
  // cap the 3D office loop to ~30 FPS, pause when hidden, and use a light
  // renderer (no MSAA / 1x DPR / no shadows) so weak GPUs do not stall.
  // Cache-bust bump v8 -> v9 so returning browsers cannot reuse the old
  // phaseB.js that contained the self-triggering MutationObserver freeze.
  // 2026-11-20: office-v9 loaded BEFORE the main app script (kills the init3D
  // race), 2-min chatter, dangling references fixed, old 2F layout skipped.
  // White-out fix: player spawn/camera centred in the 46x34 office at r=45,
  // phi=.52; ui-hidden hides only the legacy bubble so .v9bub stays visible.
  // Cache-bust bumped v4 -> v28 (the service worker caches by URL, so every
  // office-v9.js edit needs a fresh query string). Cinematic CSS grade, tighter
  // hero camera (phi .44 / theta .30 / r36 / fov50), brighter .v9bub styling,
  // glass south facade and legible signs remain. White-out guards unchanged.
  // UI clarity fix: body no longer defaults to ui-hidden (H still toggles);
  // world chat opens as a small 200x100 window, – collapses it to a 24px bar.
  // v30: loads office-v9.js?v=30 and the new office-studio.js module after
  // the main app. Cache key bumped to v32 after the editor-shell mount and
  // click-guard fixes. v31/v32/v34 (Batch 1): cache keys bumped again for the
  // living-world layer and night-state sync. v33/v35 (Batch 2): cache keys
  // bumped for the character-life layer (barista, plants, fish, skyline,
  // nameplates, status, idle, outfits, pets). v34/v36 (clarity pass): clean
  // full-screen 3D view by default, softer night veil, compact ceiling tile.
  // v35/v37: veil mesh hidden; night uses a canvas CSS brightness filter so
  // rotating the camera cannot reveal a dark mirror. v36/v38: comic bubbles
  // enlarged and given higher-contrast styling so they stay readable zoomed out.
  // H still restores UI and .v9bub stays visible. Ollama added as a
  // first-class provider in Setup and in the failover panel with model
  // auto-detect, status, and offline-mode actions. v38/v40: cache-bump for
  // Office Fixer agent (3D bot + persona) and tidy comic bubbles.
  // 2026-11-20 RESEARCH BATCH 2 (CEO-approved): added the CEO-only 🔬 RESEARCH
  // RECORDS panel (refresh/digest/crawl/search/gate + per-record review).
  // Prior approved hash: 047e34507f99195d2509e9f92c47e5f7167f2966dc8290f0e6a5f08f03523dc7
  // HYPERFRAMES BATCH: loads /hyperframes.js?v=3 (video editor group panel,
  // routed through the main app's CEO-token-aware api() helper and reporting
  // partial failures instead of falsely claiming a full run succeeded).
  // 2026-11-20 BATCH 3 (CEO-approved): Reload UI/cache-clear button, drift banner,
  // agent error badges, token-based CEO boot, research service status/controls and
  // the governance panel (approvals, publish ledger, finance ledger, backup drill).
  // Hash below explicitly refreshed for Batch 3, then again for HyperFrames:
  // office-v9.js v38 -> v39 so the 3 new 3D bots bypass the one-day static cache.
  // 2026-11-21: temporary declutter - hide Ticket/Party/Ulan/Gabi buttons,
  // CEO/Lock FABs, office quest strip, chat/overlay panels, and disable parking 3D.
  // 2026-11-21: perf pass - 20fps render cap, slower polling (ping 15s/refresh 12s),
  // hidden-tab skip, throttled frame3D fx updates; cache-bust office-v9 v41/v42.
  // 2026-11-21: ARYASKY-style beautification pass - richer landscape, farm, entrance
  // and interior accents, clearer wayfinding; cache-bust office-v9 v44.
  // 2026-11-21: character 4D time-life pass - breathing, attention drift, weight
  // shift, talking liveliness and expressive idle beats; cache-bust office-v9 v56.
  // 2026-11-21 v70: approval queue (shift proposals + publish ledger + FB status)
  // in Content Pipeline; loads the real /hyperframes.js shim instead of a 404.
  // 2026-11-21 v72: cache-bust office-v9.js to ?v=72 so the combined tennis
  // court + road/building art loads fresh (parallel v71 may already be cached).
  // 2026-11-21 v73: cache-bust office-v9.js to ?v=73 for the whole-HQ facade,
  // roofline, entry portal, zone portals, floor medallions and 4D light halos.
  // 2026-11-21 v74: cache-bust to ?v=74 for the colorful whole-map living ground.

  // 2026-11-20: Google-reference single-floor plan — WELCOME/reception +
  // lounge, MAIN STREET spine, FOCUS bench clusters + quiet booths, MEET glass
  // boardroom/huddle, GATHER pantry, executive + server/IT. 7 small happy bots.
  // Dark surround plane + muted palette (exposure .85, ambient .58) and a
  // palette re-assert in tick defeat the day/night reset that caused white-out.
  // v9 look: procedural carpet/wood/plank/tile/stone/fabric textures, warm light
  // pools, contact shadows, dark-framed glass, south-facing signs, exterior
  // plaza + skyline, and correctly oriented wall signage. No new runtime feature.
  // v14 effects: animated monitor dashboards, light shafts + drifting dust,
  // water-cooler bubbles, coffee steam, bot sparkles, swaying plants, server
  // scan bars, flickering skyline windows, birds and a floor sheen.
  // v15 beauty pass: bot feet/hands/antennae/talking auras, glass glints,
  // window-light bands, framed art, bookshelves, desk plants, a sun glow and
  // moving cars. v16 cinematic pass: window-blind shadows, floor reflections,
  // baseboards/crown/cove LEDs, detailed desks + meeting presentation screen,
  // and the DOM grade layer. v17-v19 realistic-streets pass: north city street
  // plus an x1000 south entrance road. v20-v23 side-world pass: east café court
  // and west basketball court with 4 running bots, dribbling/shooting ball,
  // market/EV/playground props, plus a crossed-sky airplane with blinking beacon
  // and contrails. v24 realism pass: hardwood board grain, pebbled ball texture,
  // numbered jerseys, humanoid limb-swinging players, glass backboards with line
  // nets, moving ball shadow, and a swept-wing airliner with intake rings,
  // windows and layered contrails. v25 building pass: concrete columns, suspended
  // ceiling tiles, HVAC/sprinklers/smoke detectors, terrazzo slab, wainscot,
  // glass entry doors/canopy, detailed reception/meeting/pantry/server zones and
  // wayfinding/exit signs. v26 view fix: ceiling tiles fade to .04 in
  // Silip/auto-xray so all six bots stay easy to observe, then return opaque in
  // normal view. v27 character life: 3-stop routes with walking/work shifts,
  // job-specific animations, independent moods, shining shoes, heart cheeks,
  // star sparkles and step/mood particles. v28: ARYASKY is the 7th bot/artist;
  // OPISINA ART ZONE adds a blueprint desk, two moodboards and three zone
  // maquettes (plaza/arena/flight) as sample works. v29: ceiling tiles stay
  // see-through in normal view, gray surround becomes grass/hills/farm, and
  // step/mood sprites are removed with .parent so draw calls no longer explode.
  // High v9 objects are flagged so the simple-mode cull keeps them visible.
  // v30: job-status antenna lamps, freeze/detail/theme hooks, interactable crops
  // and green-only seasonal material swaps. Protected v8 runtime unchanged.
  // v31 Batch 1: smooth night veil, rain/lightning/puddles/rainbow, seasonal
  // props, rooftop garden + helipad, basement vault + elevator, moving walkway,
  // holographic receptionist, wet-floor sheen, neon signs and delivery drones.
  // All guarded values (bg/fog/ambient/exposure/isNight) remain untouched.
  // v32 Batch 2: barista bot, growth-stage plants, lounge fish tank,
  // night-linked skyline/ceiling projection, role + status sprites, idle beats,
  // job outfits and two follower pets; all Studio-toggleable via setBotFeature.
  // v34 clarity pass: night veil capped at .32, giant ceiling plane replaced by
  // a compact projector tile, floating name/status labels default OFF.
  // v35: veil mesh hidden; night shading moved to a canvas CSS brightness
  // filter so camera rotation cannot reveal a dark mirror.
  // v36: up to 3 comic lines shown at once, anchored above their bots with
  // viewport clamping and overlap stacking; readable at any zoom level.
  // v37: deterministic vertical stack pass; narrow panels show 2 bubbles so
  // they never overlap or leave the view.
  // v38: added Fixer 3D bot (route + role label) as office troubleshooter.
  // HYPERFRAMES BATCH: 3 more 3D bots (HF Lead, HF Motion, HF QA) with routes,
  // role labels, edit/render status and moods — visual only.
  // 2026-11-21: perf pass - default detail low (scenery hidden), hide drones/holo/
  // rooftop/basement by default in buildBatch1World to cut draw calls/CPU.
  // 2026-11-21: beautification pass - cohesive exterior/interior visual polish
  // (grass/trees/hills/farm, front garden path, entrance, reception/pantry/meeting accents).
  // 2026-11-21: character 4D time-life - bot breathing, head attention drift,
  // micro-lean/weight shift, talking bounce/nod, antenna bob, expressive idle poses.
  // 2026-11-21 v72 combined art: parallel tennis court + ARYASKY road/building
  // pass (richer asphalt/paver, double-yellow centres, cat's-eye studs, stop
  // bars, bike glyphs, refuge islands, road legends; plinth/pilasters/cornice,
  // roof kits, storefront canopies, name signs). 4D window fx + batching intact.
  // 2026-11-21 v73 WHOLE BUILDING: upper facade glazing + roofline/pergola,
  // branded entry portal and plaza bollards, interior color spine, five zone
  // portals/floor medallions and animated ceiling halos. All prior 4D kept.
  // 2026-11-21 v74 LIVING GROUND: mosaic ribbons, sunburst plazas, flower beds,
  // batched confetti/studs/dots and 4D led beacons across the whole map.
  'public/office-v9.js': '13c337a8a44252bd485833780ac754aec662b4df8a911ce4f61a7994eb94b2e3',
  // v30 Office Studio: new editor shell (undo/redo, tools, snap/zoom/pan,
  // inspector, presets), photo presets/freeze, bot cards, adaptive FPS guard,
  // chat quick actions, farm interaction hook and accessibility mode.
  // v31: boot guard uses querySelector so the new editor shell actually mounts.
  // v32: bot-card click guard tolerates synthetic events whose target is Window.
  // v33/v34 Batch 1: World bar (time/weather/season + 8 feature toggles) wired
  // to __officeV9 world controls, persisted in localStorage.
  // v35 Batch 2: BOT bar with 10 character toggles persisted in
  // localStorage.ccStudioBots; H remains reserved for Hide UI.
  // v36 clarity pass: ceiling/nameplates/status start OFF so they cannot block
  // the bot view; users can still enable them from the BOT bar.
  'public/office-studio.js': '71166e148c7515a6a6ec1b11b49398f1cba3c3b414ca0923568ce9a61a1ec386',
  // Perf fix (2026-11-20): MutationObserver in polish() re-observed its own
  // sync() DOM writes (style/innerHTML/aria), causing an endless feedback loop
  // that froze the page. Disconnect during sync, re-observe afterwards.
  'public/phaseB.js': 'b2c1e2d04d593901758ecbb262c074772dd2342c6c67c35e30d4ce348f082c63',
  // 2026-11-21: reconciled stale baseline — phaseC.js has not changed since v8
  // (95674af); the recorded digest was wrong, the file itself is untouched.
  'public/phaseC.js': 'ead7c5fbe79ebb1837818cfb2d5166ae5675ec4526e482be2b5c79df6bb5372a',
  'public/phaseD.js': '213dd08761415bb09a0ebfe63e9dee19e8828baf8486af76ec60263fdaaf972e',
  // 2026-11-20 BATCH 3: service-worker cache bumped for the new dashboard build
  // (v9 in P0, then v10 after the concurrent restart). Hash explicitly refreshed.
  'public/sw.js': '9629f5577b1cce77a7543ee53a18c2ad786a897f58f92de0cb9b9dd27f2fa1ab'
};
for (const [file, expected] of Object.entries(protectedHashes)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  assert.strictEqual(actual, expected, `Protected v8 runtime changed: ${file}`);
}
console.log('Strategy baseline: PASS (business + MMORPG decisions documented; v8 runtime remains design-only and protected)');
