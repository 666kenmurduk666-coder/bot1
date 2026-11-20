#!/usr/bin/env node
/* enable-openrouter.js — 4th failover layer (OpenRouter).
   Dry-run default. Walang key = walang gagawin. Hindi ipapakita ang key sa screen.
   Gamitin:
     node enable-openrouter.js              -> check lang (dry-run)
     node enable-openrouter.js --apply      -> i-save sa local + live kung may tunay na key
   Key sources (in order): env OPENROUTER_API_KEY, then data/openrouter.key
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const LIVE = 'https://cyborgcheebeeoffice.onrender.com';
const APPLY = process.argv.includes('--apply');

function readKey() {
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()) {
    return process.env.OPENROUTER_API_KEY.trim();
  }
  const f = path.join(ROOT, 'data', 'openrouter.key');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch (e) { return ''; }
}
function mask(k) { return k ? k.slice(0, 7) + '...' + k.slice(-4) + ' (len ' + k.length + ')' : '(wala)'; }
function valid(k) {
  return /^sk-or-[A-Za-z0-9_-]{20,}$/.test(k) && !/YOUR_KEY|PLACEHOLDER|EXAMPLE/i.test(k);
}

(async () => {
  const key = readKey();
  console.log('OPENROUTER KEY:', mask(key));

  if (!key) {
    console.log('RESULT: SKIP — walang key. Libre ang OpenRouter pero kailangan ng account key.');
    console.log('        Ilagay ang key sa data/openrouter.key o env OPENROUTER_API_KEY, tapos i-run ulit.');
    return;
  }
  if (!valid(key)) {
    console.log('RESULT: SKIP — placeholder lang ang key. Hindi ito gagamitin.');
    return;
  }

  const localFile = path.join(ROOT, 'data', 'settings.json');
  const settings = JSON.parse(fs.readFileSync(localFile, 'utf8'));
  settings.keys = settings.keys || {};
  const failover = Array.isArray(settings.failover) ? settings.failover.slice() : [];

  console.log('PLAN: keys.openrouter =', mask(key));
  console.log('PLAN: failover =', failover.concat(['openrouter']).join(' -> '), '(4th layer)');

  if (!APPLY) {
    console.log('RESULT: DRY-RUN lang. Gamitin ang --apply para i-save.');
    return;
  }

  settings.keys.openrouter = { apiKey: key, model: 'openai/gpt-4o-mini' };
  if (failover.indexOf('openrouter') === -1) failover.push('openrouter');
  settings.failover = failover;
  fs.writeFileSync(localFile, JSON.stringify(settings, null, 2), 'utf8');
  console.log('SAVED: local settings.json (key naka-mask sa screen)');

  // I-apply din sa live Render, pero huwag i-change ang primary provider.
  try {
    const body = {
      pass: settings.password,
      keys: { openrouter: settings.keys.openrouter },
      failover: failover
    };
    const r = await fetch(LIVE + '/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    console.log('LIVE:', r.status, j.ok !== false ? 'OK' : 'FAIL', 'failover=' + ((j.failover || failover).join(',')));
  } catch (e) {
    console.log('LIVE: WARN — ' + e.message + ' (local saved na, live retry via CHECK-BOTS.bat)');
  }
})().catch(e => { console.error('ERROR:', e.message); process.exitCode = 1; });
