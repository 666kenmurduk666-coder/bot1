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
  // race), 2-min chatter, cache-bust v4, dangling references fixed, old 2F
  // layout skipped when v9 is active.
  'public/index.html': '2227686e0d99c0478a219b7385c3c66cfaa1d80338936839eaabfe794fc41bed',
  // 2026-11-20: realistic single-floor office, 6 happy bots, standalone-safe
  // rebuild, repeating self-heal, no doomed 403 conversation fetch.
  'public/office-v9.js': '5feeb50ed958bc149389951a6d7102cb43d0425cc49c999482316294ad32f245',
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
