'use strict';
// Design regression test: confirms the selected MMORPG direction is recorded
// and that the v8 runtime remains free of a partial/pretend MMORPG integration.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const design = fs.readFileSync(path.join(root, 'MMORPG-GAME-DESIGN-PLAN.md'), 'utf8');
const status = fs.readFileSync(path.join(root, 'MULTIPLAYER-IMPLEMENTATION-STATUS.md'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');

assert(design.includes('**World style:** Open world.'), 'Open-world decision missing');
assert(design.includes('**Combat:** Action combat'), 'Action-combat decision missing');
assert(design.includes('**World integration:** Seamless connected geography'), 'Seamless-world decision missing');
assert(design.includes('## 9. Seamless travel across the Mega World'), 'Seamless travel architecture missing');
assert(design.includes('Cyborg Cheebee'), 'CEO identity missing');
assert(design.includes('First playable vertical slice'), 'Vertical slice missing');
assert(design.includes('Non-negotiable v8 safety rules'), 'v8 safety rules missing');
assert(status.includes('MMORPG:') && status.includes('DESIGN CONFIRMED'), 'Implementation status not updated');
assert(!/Adventure World.*live|live.*Adventure World/i.test(status), 'Design must not claim live MMORPG features');
assert(!/new WebSocketServer|new WebSocket\.Server|require\(['"]ws['"]\)/.test(server), 'No partial WebSocket implementation in this design-only phase');
assert(!/MMORPG_GAME_RUNTIME|adventureCombatTick\s*\(/.test(html), 'No partial MMORPG runtime in the v8 office HTML');
console.log('MMORPG design baseline: PASS (decisions documented; v8 runtime untouched)');
