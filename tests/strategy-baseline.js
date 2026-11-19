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
  'server.js': '3e55c511dce75333e14069667df2922a3902e59a498308893f597508f55a4f4e',
  // APPLY-PHASE-D.bat (the documented install step) injects the phaseB/C/D <script> tags, so the post-install hash differs from the packaged baseline. This is the expected, installed state.
  'public/index.html': '5010097fb2b65761624bb570569d76e62979dd4ae599ec708ee46119b878d65a',
  'public/phaseB.js': 'a2a812460b1eb146f4f4c20baee97ec5343452198025c123e67c698b7fbd2dde',
  'public/phaseC.js': 'ead7c5fbe79ebb1837818cfb2d5166ae5675ec4526e482be2b5c79df6bb5372a',
  'public/phaseD.js': '770a2e8c53d96cd8fa109482a7a221f1a96c1b0175c4acda23d28978220ab831',
  'public/sw.js': 'a83e7e6bb01d484cadc404ce321eeb8d95f4c581deb5c21c1b9602611f8b0c29'
};
for (const [file, expected] of Object.entries(protectedHashes)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  assert.strictEqual(actual, expected, `Protected v8 runtime changed: ${file}`);
}
console.log('Strategy baseline: PASS (business + MMORPG decisions documented; v8 runtime remains design-only and protected)');
