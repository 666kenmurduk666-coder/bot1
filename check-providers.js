#!/usr/bin/env node
/* check-providers.js — READ-ONLY. Sinusubukan ang Groq / Ollama / OpenRouter endpoints.
   Hindi nito binabago ang settings at hindi nare-print ang buong API key (huling 4 digits lang).
   Gamitin: node check-providers.js
   Optional: OPENROUTER_FREE_MODEL=model:free node check-providers.js            */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SETTINGS = path.join(ROOT, 'data', 'settings.json');
const ENV = path.join(ROOT, '.env');
const OR_FREE_MODEL = process.env.OPENROUTER_FREE_MODEL || 'nvidia/nemotron-3.5-lightning:free';
const OLLAMA_URL = 'http://localhost:11434/v1';

function readKv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; }
}
function pick() {
  for (const v of arguments) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
}
function mask(k) {
  if (!k) return 'none';
  return String(k).slice(0, 7) + '…' + String(k).slice(-4);
}
function isLocal(url) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i.test(String(url || ''));
}

function buildConfigs() {
  const disk = readJSON(SETTINGS, {});
  const keys = disk.keys || {};
  const env = readKv(ENV);
  const g = keys.groq || {};
  const o = keys.ollama || {};
  const r = keys.openrouter || {};
  const groqKey = pick(g.apiKey, process.env.GROQ_API_KEY, env.GROQ_API_KEY);
  const orKey = pick(
    String(disk.apiKey || '').startsWith('sk-or-') ? disk.apiKey : '',
    r.apiKey, process.env.OPENROUTER_API_KEY, env.OPENROUTER_API_KEY
  );
  return [
    { name: 'groq', label: 'Groq', apiKey: groqKey, baseUrl: 'https://api.groq.com/openai/v1',
      model: pick(g.model, process.env.GROQ_MODEL, env.GROQ_MODEL, 'qwen/qwen3.8-27b') },
    { name: 'ollama', label: 'Ollama (local)', apiKey: 'ollama', baseUrl: pick(o.baseUrl, env.OLLAMA_BASE_URL, OLLAMA_URL),
      model: pick(o.model, env.OLLAMA_MODEL, 'qwen2.5:3b') },
    { name: 'openrouter', label: 'OpenRouter', apiKey: orKey, baseUrl: 'https://openrouter.ai/api/v1',
      model: pick(r.model, OR_FREE_MODEL) },
    { name: 'ovh', label: 'OVHcloud (no key)', apiKey: (keys.ovh && keys.ovh.apiKey) || 'ovh',
      baseUrl: (keys.ovh && keys.ovh.baseUrl) || 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1',
      model: (keys.ovh && keys.ovh.model) || 'gpt-oss-20b', maxTokens: 200 }
  ];
}

async function probe(c) {
  if (!c.apiKey && !isLocal(c.baseUrl)) return { ok: false, why: 'walang API key' };
  const local = isLocal(c.baseUrl);
  const headers = { 'Content-Type': 'application/json' };
  const anonymous = c.name === 'ovh' || c.name === 'kilo' || c.name === 'llm7';
  if (c.apiKey && !anonymous) headers.Authorization = 'Bearer ' + c.apiKey;
  if (c.name === 'openrouter') {
    headers['HTTP-Referer'] = 'http://localhost:8787';
    headers['X-Title'] = 'Cyborg Cheebee Office - provider check';
  }
  const payload = {
    model: c.model,
    messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    max_tokens: c.maxTokens || 24,
    temperature: 0
  };
  if (local) {
    payload.reasoning_effort = 'none';
    payload.keep_alive = '30m';
  }
  const t = Date.now();
  try {
    const res = await fetch(c.baseUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST', headers, body: JSON.stringify(payload),
      signal: AbortSignal.timeout(local ? 60000 : 15000)
    });
    const raw = await res.text();
    if (!res.ok) {
      let msg = '';
      try { msg = (JSON.parse(raw).error || {}).message || ''; } catch (_) {}
      return { ok: false, why: 'HTTP ' + res.status + (msg ? ' — ' + msg.slice(0, 140) : '') };
    }
    const j = JSON.parse(raw);
    const m = (j.choices && j.choices[0] && j.choices[0].message) || {};
    const content = String(m.content || '').trim();
    const thought = String(m.reasoning_content || m.reasoning || '').trim();
    const answer = content || (thought.split(/\n+/).pop() || '');
    if (!answer) return { ok: false, why: 'empty content' };
    return { ok: true, ms: Date.now() - t, answer: answer.slice(0, 60) };
  } catch (e) {
    const why = e && e.name === 'TimeoutError' ? 'timeout' : String((e && e.message) || e).slice(0, 140);
    return { ok: false, why };
  }
}

(async () => {
  console.log('== PROVIDER CHECK (read-only) ==');
  const results = [];
  for (const c of buildConfigs()) {
    const r = await probe(c);
    results.push(Object.assign({ name: c.name, label: c.label, model: c.model, key: mask(c.apiKey) }, r));
    const status = r.ok ? 'OK  ' : 'FAIL';
    const detail = r.ok ? r.ms + 'ms  "' + r.answer + '"' : r.why;
    console.log('[' + status + '] ' + c.label.padEnd(16) + c.model.padEnd(48) + mask(c.apiKey).padEnd(16) + detail);
  }
  const alive = results.filter((r) => r.ok).map((r) => r.name);
  console.log('\nBuhay: ' + (alive.join(', ') || 'wala'));
  console.log('Mungkahing failover order: ' + (alive.length ? alive.join(', ') : 'walang buhay na provider'));
  process.exitCode = alive.length ? 0 : 1;
})().catch((e) => { console.error('CHECK ERROR:', e.message); process.exit(1); });
