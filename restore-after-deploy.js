#!/usr/bin/env node
/* restore-after-deploy.js — ibalik ang lahat ng nawawalang runtime data sa Render pagkatapos ng redeploy.
   Render free tier: walang persistent disk, kaya mabubura ang data/state.json sa BAWAT deploy.
   Gawain: mall items, commercials, Facebook config, Shopee affiliate ID, Groq/OVH keys.
   Kailangan: node (>=18, may fetch), CEO_PASSWORD sa env o lokal na data/settings.json,
   at ang mga lokal na file na ito:
   - data/state.json        (mall at commercials data, galling sa lokal na server)
   - data/fb-config.txt     (FB_APP_ID, FB_APP_SECRET, FB_REDIRECT_URI)
   - data/shopee-config.txt (SHOPEE_AFF_ID)
   - .env                   (GROQ_API_KEY [+ GROQ_MODEL], OPENROUTER_API_KEY kung may key)

   Gamitin: node restore-after-deploy.js [LIVE_URL]
   Default: https://cyborgcheebeeoffice.onrender.com
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = process.argv[2] || 'https://cyborgcheebeeoffice.onrender.com';
const ROOT = __dirname;
const state = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'state.json'), 'utf8'));

function readKv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const fb = readKv(path.join(ROOT, 'data', 'fb-config.txt'));
const shopee = readKv(path.join(ROOT, 'data', 'shopee-config.txt'));
const envfile = readKv(path.join(ROOT, '.env'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(p, obj) {
  const r = await fetch(BASE + p, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  });
  const text = await r.text();
  let j = {}; try { j = JSON.parse(text); } catch (e) {}
  return { status: r.status, ok: j.ok === true, err: j.error || j.message || '', raw: j };
}
const get = async (p) => {
  const r = await fetch(BASE + p);
  return r.json().catch(() => ({}));
};

(async () => {
  console.log('== RESTORE AFTER DEPLOY => ' + BASE + ' ==');
  // Password: env CEO_PASSWORD muna, kung wala ay lokal na settings.json. Hindi na hardcode.
  let localSettings = null;
  try { localSettings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'settings.json'), 'utf8')); } catch (e) {}
  const ceoPass = process.env.CEO_PASSWORD || (localSettings && localSettings.password) || '';
  const u = await post('/api/unlock', { pass: ceoPass });
  console.log('UNLOCK', u.status, u.ok ? 'OK' : 'FAIL — ' + u.err + ' (Render env ba ang CEO_PASSWORD?)');
  if (!u.ok) process.exit(1);

  // Mall: idagdag ang mga nawawala (i-skip ang umiiral na pareho ang pangalan)
  const cloud = (await get('/api/mall')).mall || [];
  const names = new Set(cloud.map((x) => String(x.name)));
  let ok = 0, fail = 0;
  for (const m of state.mall) {
    if (names.has(String(m.name))) continue;
    const r = await post('/api/mall', {
      pass: ceoPass, name: String(m.name), price: Number(m.price) || 0,
      emoji: String(m.emoji || ''), url: String(m.url || ''), cat: String(m.cat || ''), caption: String(m.caption || '')
    });
    if (r.ok) ok++; else { fail++; console.log('MALL_FAIL', r.status, r.err, String(m.name).slice(0, 40)); }
    await sleep(350);
  }
  console.log('MALL ok=' + ok + ' fail=' + fail);

  // Commercials (i-skip ang mga kasing-titulo na; gamitin ang CEO list para kumpletong dedup)
  // Note: ang live server ay nag-nonormalize ng titles (em-dash -> hyphen), kaya i-normalize rin dito.
  const norm = (s) => String(s || '').toLowerCase()
    .replace(/[\u2013\u2014\u2212-]/g, '-')   // en/em/minus dashes -> hyphen
    .replace(/\s+/g, ' ')
    .trim();
  const ceoList = await post('/api/ceo/commercials', { pass: ceoPass, action: 'list' });
  const existing = (ceoList.raw && ceoList.raw.commercials) || [];
  const existingTitles = new Set(existing.map((x) => norm(x.title)));
  let cOk = 0, cFail = 0, cSkip = 0;
  for (const c of state.commercials) {
    if (existingTitles.has(norm(c.title))) { cSkip++; continue; }
    let featured = null;
    if (c.featured) featured = { name: String(c.featured.name || ''), price: Number(c.featured.price) || 0, url: String(c.featured.url || '') };
    const r = await post('/api/ceo/commercials', {
      pass: ceoPass, action: 'create', bot: String(c.bot || ''), angle: String(c.angle || ''),
      title: String(c.title || ''), cta: String(c.cta || ''), url: String(c.url || ''), featured
    });
    if (r.ok) cOk++; else { cFail++; console.log('CM_FAIL', r.status, r.err, String(c.title || '').slice(0, 40)); }
    await sleep(350);
  }
  console.log('COMMERCIALS ok=' + cOk + ' fail=' + cFail + ' skip=' + cSkip);

  // Facebook config
  if (fb.FB_APP_ID && fb.FB_APP_SECRET) {
    const r = await post('/api/ceo/setup-fb', {
      pass: ceoPass, fbAppId: fb.FB_APP_ID, fbAppSecret: fb.FB_APP_SECRET, fbRedirectUri: fb.FB_REDIRECT_URI || (BASE + '/api/fb/callback')
    });
    console.log('FACEBOOK', r.status, r.ok ? 'OK' : 'FAIL — ' + r.err);
  } else console.log('FACEBOOK SKIP (walang data/fb-config.txt)');

  // Shopee affiliate
  if (shopee.SHOPEE_AFF_ID) {
    const r = await post('/api/ceo/setup-shopee', { pass: ceoPass, shopeeAffId: shopee.SHOPEE_AFF_ID });
    console.log('SHOPEE', r.status, r.ok ? 'OK' : 'FAIL — ' + r.err);
  } else console.log('SHOPEE SKIP (walang data/shopee-config.txt)');

  // AI keys — /api/settings REPLACES the whole keys object, so merge every
  // source first: live keys, locally saved CEO keys, then .env fallbacks.
  // Render wipes data/ on every deploy; this is what keeps the keys alive.
  let keys = {};
  try {
    const pv = await post('/api/private', { pass: ceoPass });
    if (pv.ok && pv.raw && pv.raw.keys && typeof pv.raw.keys === 'object') keys = pv.raw.keys;
  } catch (e) {}

  let localFailover = null;
  try {
    const local = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'settings.json'), 'utf8'));
    if (local.keys && typeof local.keys === 'object') {
      Object.keys(local.keys).forEach(function (p) {
        const v = local.keys[p];
        if (v && (typeof v === 'string' ? v : v.apiKey)) keys[p] = v;
      });
    }
    if (Array.isArray(local.failover) && local.failover.length) localFailover = local.failover;
  } catch (e) {}

  // Vyce TINANGGAL — 503 ang cloud nito. Huwag idagdag muli mula sa .env.
  if (envfile.GROQ_API_KEY) {
    keys.groq = { apiKey: envfile.GROQ_API_KEY, model: envfile.GROQ_MODEL || 'qwen/qwen3.8-27b' };
  }
  // Ollama needs no secret. Registered so the local fallback is always ready.
  if (!keys.ollama) keys.ollama = { apiKey: 'ollama', baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5:3b' };
  if (Object.keys(keys).length) {
    // OVH ang tanging failover sa live — hindi maabot ng Render ang localhost:11434.
    const failover = (localFailover || ['ovh']).filter(function (p) { return !!keys[p] && p !== 'ollama' && p !== 'vyce'; });
    const r = await post('/api/settings', { pass: ceoPass, keys, failover: failover });
    console.log('AI KEYS', Object.keys(keys).join(', '), 'failover=' + (failover.join(', ') || 'none'),
      r.status, r.ok ? 'OK' : 'FAIL — ' + r.err);
  } else console.log('AI KEYS SKIP (walang key sa settings.json o .env)');

  const fm = (await get('/api/mall')).mall || [];
  const fc = (await get('/api/bazaar/commercials')).commercials || [];
  console.log('== FINAL: mall=' + fm.length + ' commercials=' + fc.length + ' ==');
})().catch((e) => { console.error('RESTORE ERROR:', e.message); process.exit(1); });
