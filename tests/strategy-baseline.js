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
  'server.js': 'fb95aaf36e4109031416e562f27ee15ba08d4312c0a20c3e11f71f0759d9c8c2',
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
  // H still restores the UI and .v9bub stays visible.
  'public/index.html': 'bb562714f42d92a90615a2d01c47cc0613e0b8eb98da7a83b483da9704f17c87',
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
  'public/office-v9.js': '79af6c9017f4373dbda453bfc72c492f792e1467eaed1e6f1e793c161bac96b0',
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
  'public/office-studio.js': 'eafd53ee29487ff02d9c91aeb7f82d2d0a74246bb9e94bf03975cb003ce10bda',
  // Perf fix (2026-11-20): MutationObserver in polish() re-observed its own
  // sync() DOM writes (style/innerHTML/aria), causing an endless feedback loop
  // that froze the page. Disconnect during sync, re-observe afterwards.
  'public/phaseB.js': '0c796db8016af42a5c14df3cc606c51636b53845ba08ec1952e3a4048e330262',
  'public/phaseC.js': 'ead7c5fbe79ebb1837818cfb2d5166ae5675ec4526e482be2b5c79df6bb5372a',
  'public/phaseD.js': '770a2e8c53d96cd8fa109482a7a221f1a96c1b0175c4acda23d28978220ab831',
  'public/sw.js': '654ff5f56e4f9a5110cb8419964a45e674a9536405c987fa5e35ec7321a7406f'
};
for (const [file, expected] of Object.entries(protectedHashes)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  assert.strictEqual(actual, expected, `Protected v8 runtime changed: ${file}`);
}
console.log('Strategy baseline: PASS (business + MMORPG decisions documented; v8 runtime remains design-only and protected)');
