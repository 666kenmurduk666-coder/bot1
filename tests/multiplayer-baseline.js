'use strict';
// Batch 0 safety/specification checks. These deliberately do not pretend that
// multiplayer transport or remote avatars are already implemented.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const plan = fs.readFileSync(path.join(root, 'MULTIPLAYER-ARCHITECTURE-PLAN.md'), 'utf8');
const status = fs.readFileSync(path.join(root, 'MULTIPLAYER-IMPLEMENTATION-STATUS.md'), 'utf8');

// Existing v8 foundations must remain present.
assert(server.includes("const server = http.createServer"), 'Existing HTTP server must remain intact');
assert(server.includes("/api/health"), 'Existing health endpoint must remain intact');
assert(html.includes('function spawnPlayer()'), 'Existing local player spawn must remain intact');
assert(html.includes('function despawnPlayer()'), 'Existing local player despawn must remain intact');
assert(html.includes('function mmoSend'), 'Existing local office chat must remain intact');

// Confirmed multiplayer design must be explicit and stable.
assert(plan.includes('one shared office world'), 'Shared-world decision missing');
assert(plan.includes('open/public entry'), 'Public-entry decision missing');
assert(plan.includes('free movement'), 'Free-movement decision missing');
assert(status.includes('Cyborg Cheebee'), 'CEO avatar decision missing');
assert(status.includes('NOT STARTED / BLOCKED'), 'Transport gate must be honestly marked');

// This baseline package must not claim a live multiplayer transport exists.
assert(!/new WebSocketServer|new WebSocket\.Server|require\(['"]ws['"]\)/.test(server),
  'Do not leave a half-installed WebSocket dependency in the runnable v8 server');

console.log('Multiplayer Batch 0 baseline: PASS (v8 preserved; transport not yet enabled)');
