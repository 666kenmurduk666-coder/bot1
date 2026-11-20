#!/usr/bin/env node
/* provider-health.js — LIGHT health check (GET /models lang, walang token consumption).
   Sinusulat ang data/provider-health.json. Hindi nare-print ang API key.
   Gamitin: node provider-health.js                                        */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SETTINGS = path.join(ROOT, 'data', 'settings.json');
const OUT = path.join(ROOT, 'data', 'provider-health.json');
const OLLAMA_URL = 'http://localhost:11434/v1';

function settings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); } catch (_) { return {}; }
}
async function getJson(url, headers) {
  const t = Date.now();
  const res = await fetch(url, {
    headers: headers || {},
    signal: AbortSignal.timeout(10000)
  });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch (_) {}
  return {
    ok: res.ok, status: res.status, ms: Date.now() - t, body,
    remainingRequests: res.headers.get('x-ratelimit-remaining-requests') || ''
  };
}

(async () => {
  const s = settings();
  const keys = s.keys || {};
  const groqKey = (keys.groq && keys.groq.apiKey) ||
    (String(s.apiKey || '').startsWith('gsk_') ? s.apiKey : '');
  const ollamaUrl = String((keys.ollama && keys.ollama.baseUrl) || OLLAMA_URL).replace(/\/$/, '');
  const result = { checkedAt: new Date().toISOString(), providers: {} };

  if (groqKey) {
    try {
      const r = await getJson('https://api.groq.com/openai/v1/models',
        { Authorization: 'Bearer ' + groqKey });
      result.providers.groq = { ok: r.ok, status: r.status, ms: r.ms,
        modelCount: r.body && Array.isArray(r.body.data) ? r.body.data.length : null,
        remainingRequests: r.remainingRequests };
    } catch (e) {
      result.providers.groq = { ok: false, error: String((e && e.message) || e).slice(0, 140) };
    }
  } else {
    result.providers.groq = { ok: false, error: 'walang Groq key' };
  }

  try {
    const r = await getJson(ollamaUrl + '/models');
    const ids = (r.body && Array.isArray(r.body.data) ? r.body.data : [])
      .map((m) => m.id).filter(Boolean);
    result.providers.ollama = {
      ok: r.ok, status: r.status, ms: r.ms,
      model: (keys.ollama && keys.ollama.model) || 'qwen2.5:3b',
      modelLoaded: ids.some((id) => String(id).indexOf('qwen2.5:3b') === 0)
    };
  } catch (e) {
    result.providers.ollama = { ok: false, error: String((e && e.message) || e).slice(0, 140) };
  }

  const ovhUrl = String((keys.ovh && keys.ovh.baseUrl) ||
    'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1').replace(/\/$/, '');
  try {
    const r = await getJson(ovhUrl + '/models');
    result.providers.ovh = {
      ok: r.ok, status: r.status, ms: r.ms,
      model: (keys.ovh && keys.ovh.model) || 'gpt-oss-20b',
      modelCount: r.body && Array.isArray(r.body.data) ? r.body.data.length : null
    };
  } catch (e) {
    result.providers.ovh = { ok: false, error: String((e && e.message) || e).slice(0, 140) };
  }

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
  const g = result.providers.groq.ok ? 'OK' : 'FAIL';
  const o = result.providers.ollama.ok ? 'OK' : 'FAIL';
  const v = result.providers.ovh.ok ? 'OK' : 'FAIL';
  console.log('PROVIDER_HEALTH groq=' + g + ' ollama=' + o + ' ovh=' + v);
})().catch((e) => { console.error('HEALTH ERROR: ' + e.message); process.exit(1); });
