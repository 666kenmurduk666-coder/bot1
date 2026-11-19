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
  'server.js': '0e95e81fd5671d24078b58314ec4630fe7cf1f41194564bb0a5ac33ab1f51a4d',
  // APPLY-PHASE-D.bat (the documented install step) injects the phaseB/C/D <script> tags, so the post-install hash differs from the packaged baseline. This is the expected, installed state.
  // Perf fix (2026-11-20): load three.min.js locally first (no CDN wait),
  // cap the 3D office loop to ~30 FPS, pause when hidden, and use a light
  // renderer (no MSAA / 1x DPR / no shadows) so weak GPUs do not stall.
  // Cache-bust bump v8 -> v9 so returning browsers cannot reuse the old
  // phaseB.js that contained the self-triggering MutationObserver freeze.
  'public/index.html': '4065618f0bab6150075b3fe4b8abeca4f62189132b1347ab18cd0fc4a2e257aa',
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
