#!/usr/bin/env node
/* quota-watch.js — sinusuri ang natitirang Groq quota via isang maliit na request.
   FILL: 1 chat request bawat run. Sinusulat ang data/quota-status.json.
   Hindi nare-print ang API key.
   Gamitin: node quota-watch.js                                            */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SETTINGS = path.join(ROOT, 'data', 'settings.json');
const OUT = path.join(ROOT, 'data', 'quota-status.json');
const URL = 'https://api.groq.com/openai/v1/chat/completions';
const LOW_REQUESTS = 100;
const LOW_RATIO = 0.1; // 10% na lang ng window ang natitira (tokens ay per-minute sa Groq)

function settings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); } catch (_) { return {}; }
}
function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

(async () => {
  const s = settings();
  const keys = s.keys || {};
  const key = (keys.groq && keys.groq.apiKey) ||
    (String(s.apiKey || '').startsWith('gsk_') ? s.apiKey : '');
  const model = (keys.groq && keys.groq.model) || 'qwen/qwen3.8-27b';
  if (!key) throw new Error('walang Groq key sa settings.json');

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({
      model, messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      max_tokens: 8, temperature: 0
    }),
    signal: AbortSignal.timeout(20000)
  });
  const text = await res.text();
  let j = {};
  try { j = JSON.parse(text); } catch (_) {}

  const remainingRequests = num(res.headers.get('x-ratelimit-remaining-requests'));
  const limitRequests = num(res.headers.get('x-ratelimit-limit-requests'));
  const remainingTokens = num(res.headers.get('x-ratelimit-remaining-tokens'));
  const limitTokens = num(res.headers.get('x-ratelimit-limit-tokens'));
  const low = (remainingRequests != null && remainingRequests < LOW_REQUESTS) ||
    (remainingTokens != null && limitTokens != null && remainingTokens / limitTokens < LOW_RATIO);

  const out = {
    checkedAt: new Date().toISOString(),
    ok: res.ok, status: res.status,
    remainingRequests, limitRequests, remainingTokens, limitTokens,
    low, warning: low ? 'Groq quota mababa na — mag-prepare sa Ollama fallback' : ''
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');

  if (!res.ok) {
    const msg = (j.error && j.error.message) || ('HTTP ' + res.status);
    console.log('QUOTA groq=FAIL ' + String(msg).slice(0, 120));
    process.exitCode = 1;
    return;
  }
  console.log('QUOTA groq=OK requests=' +
    (remainingRequests == null ? '?' : remainingRequests + '/' + (limitRequests == null ? '?' : limitRequests)) +
    ' tokens=' + (remainingTokens == null ? '?' : remainingTokens + '/' + (limitTokens == null ? '?' : limitTokens)) +
    (low ? ' WARNING: ' + out.warning : ''));
})().catch((e) => { console.error('QUOTA ERROR: ' + e.message); process.exit(1); });
