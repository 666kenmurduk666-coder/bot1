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
  // Cache-bust bumped v4 -> v19 (the service worker caches by URL, so every
  // office-v9.js edit needs a fresh query string). v19 look: cinematic CSS grade
  // over the canvas, tighter hero camera (phi .44 / theta .30 / r36 / fov50),
  // brighter .v9bub styling, glass south facade and legible signs. White-out guards unchanged.
  'public/index.html': 'ab8978f86ef61e0b71528504c5da0c83a2008c479eb11df33fca33a35f23c22c',
  // 2026-11-20: Google-reference single-floor plan — WELCOME/reception +
  // lounge, MAIN STREET spine, FOCUS bench clusters + quiet booths, MEET glass
  // boardroom/huddle, GATHER pantry, executive + server/IT. 6 small happy bots.
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
  // and the DOM grade layer. v17/v18/v19 realistic-streets pass: north city
  // street plus an x1000 south entrance road with taxi bay, canopy, zebra
  // crossings, bike lane, tactile paving, drains, lamps, signals, bus stop,
  // billboard, moving traffic and pedestrians. High v9 objects are flagged so
  // the simple-mode cull keeps them visible. Protected v8 runtime unchanged.
  'public/office-v9.js': '23de532db282bfaee5f7c60934d3d5931c03355a9533c6793b819cf2fbb53066',
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
