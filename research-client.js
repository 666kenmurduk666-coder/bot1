'use strict';

/**
 * Cyborg Cheebee - Research client (Node side)
 * ===========================================
 * Talks to the optional local Crawl4AI service (or Crawl4AI Cloud) and
 * ALWAYS fails soft. If the service is unavailable, callers keep using the
 * original regex-based scrapers in server.js.
 *
 * Settings (data/settings.json, all optional):
 *   researchMode:    "off" | "local" | "cloud"   (default: "local")
 *   researchServiceUrl: "http://127.0.0.1:8011"
 *   researchRecord:  true | false                (default: true)
 *   researchKillSwitch: true                     (emergency stop)
 *
 * Cloud mode uses CRAWL4AI_KEY from the environment. Never put that key in
 * browser-visible state or in this file.
 */

const fs = require('fs');
const path = require('path');

// RESEARCH_DATA_DIR is only used by tests; production always uses ./data.
const DATA_DIR = process.env.RESEARCH_DATA_DIR
  ? path.resolve(process.env.RESEARCH_DATA_DIR)
  : path.join(__dirname, 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const RECORDS_FILE = path.join(DATA_DIR, 'research.json');
const CORPUS_FILE = path.join(DATA_DIR, 'research-corpus.json');
const DIGEST_FILE = path.join(DATA_DIR, 'trend-digest.json');
const DEFAULT_SERVICE = 'http://127.0.0.1:8011';
const CLOUD_URL = 'https://api.crawl4ai.com/scrape';
const TIMEOUT_MS = 25000;
const MAX_ATTEMPTS = Math.max(1, Math.min(3, Number(process.env.RESEARCH_MAX_ATTEMPTS) || 2));
const MIN_INTERVAL_MS = Math.max(0, Number(process.env.RESEARCH_MIN_INTERVAL_MS) || 0);
const CACHE_TTL = 30 * 60 * 1000;
const MAX_RECORDS = 300;

const memoryCache = new Map();
const lastHostHit = new Map();
const metrics = {
  crawls: 0, crawlFailures: 0, products: 0, productFailures: 0,
  cacheHits: 0, gateChecks: 0, searches: 0, digests: 0,
  startedAt: Date.now()
};
let lastWarning = 0;

function warn(message) {
  const now = Date.now();
  if (now - lastWarning < 60000) return;
  lastWarning = now;
  console.warn('[research-client] ' + message);
}

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) || {};
  } catch (_) {
    return {};
  }
}

function config() {
  const s = readSettings();
  return {
    mode: String(s.researchMode || process.env.CRAWL4AI_MODE || 'local').toLowerCase(),
    serviceUrl: String(s.researchServiceUrl || process.env.RESEARCH_SERVICE_URL || DEFAULT_SERVICE).replace(/\/+$/, ''),
    record: s.researchRecord !== false && process.env.CRAWL4AI_RECORD !== '0',
    killSwitch: s.researchKillSwitch === true || process.env.RESEARCH_KILL_SWITCH === '1',
    key: process.env.CRAWL4AI_KEY || ''
  };
}

function enabled() {
  const c = config();
  return c.mode !== 'off' && !c.killSwitch;
}

function safeUrl(raw) {
  if (typeof raw !== 'string') return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch (_) {
    return null;
  }
}

function cacheGet(key) {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.t > CACHE_TTL) {
    memoryCache.delete(key);
    return null;
  }
  metrics.cacheHits++;
  return hit.v;
}

function cacheSet(key, value) {
  memoryCache.set(key, { t: Date.now(), v: value });
  if (memoryCache.size > 150) memoryCache.delete(memoryCache.keys().next().value);
}

async function respectHostInterval(url) {
  if (!MIN_INTERVAL_MS) return;
  let host = '';
  try { host = new URL(url).host; } catch (_) { return; }
  const wait = MIN_INTERVAL_MS - (Date.now() - (lastHostHit.get(host) || 0));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastHostHit.set(host, Date.now());
}

async function postJson(url, payload, headers = {}) {
  const r = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.json();
}

async function postWithRetry(url, payload, headers = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await postJson(url, payload, headers);
    } catch (e) {
      lastError = e;
      // Do not retry client errors (bad URL, robots block, auth failure).
      if (/HTTP 4\d\d/.test(e.message)) break;
      if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 400 * attempt));
    }
  }
  throw lastError;
}

function normalizeCrawl(data, url) {
  if (!data || data.ok === false) return null;
  const markdown = String(data.markdown || data.text || '').slice(0, 20000);
  if (!markdown.trim()) return null;
  return {
    engine: data.engine || 'crawl4ai',
    url: data.url || url,
    finalUrl: data.finalUrl || data.url || url,
    title: String(data.title || '').slice(0, 300),
    markdown,
    text: String(data.text || markdown).slice(0, 12000),
    facts: Array.isArray(data.facts) ? data.facts.slice(0, 8) : [],
    confidence: Number.isFinite(data.confidence) ? data.confidence : 0.5,
    statusCode: data.statusCode || null,
    checkedAt: data.checkedAt || new Date().toISOString(),
    cached: Boolean(data.cached)
  };
}

function normalizeProduct(data, url) {
  if (!data || data.ok === false) return null;
  const title = String(data.title || '').slice(0, 200);
  if (!title && !data.description) return null;
  return {
    engine: data.engine || 'crawl4ai',
    url: data.url || url,
    title,
    description: String(data.description || '').slice(0, 500),
    price: Math.max(0, Math.min(1e7, Number(data.price) || 0)),
    image: String(data.image || '').slice(0, 500),
    checkedAt: data.checkedAt || new Date().toISOString(),
    confidence: Number.isFinite(data.confidence) ? data.confidence : 0.5
  };
}

async function callLocal(endpoint, payload) {
  const c = config();
  return await postWithRetry(c.serviceUrl + endpoint, payload);
}

async function callCloud(url) {
  const c = config();
  if (!c.key) return null;
  const data = await postWithRetry(CLOUD_URL, { url }, { Authorization: 'Bearer ' + c.key });
  const markdown = String(data.markdown || '').slice(0, 20000);
  if (!markdown.trim()) return null;
  return {
    engine: 'crawl4ai-cloud',
    url,
    finalUrl: url,
    title: String(data.title || (markdown.split('\n').find(Boolean) || '')).slice(0, 300),
    markdown,
    text: markdown,
    facts: [],
    confidence: 0.7,
    statusCode: 200,
    checkedAt: new Date().toISOString(),
    cached: false
  };
}

async function crawlSource(rawUrl, options = {}) {
  const url = safeUrl(rawUrl);
  if (!url || !enabled()) return null;

  const key = 'crawl|' + url;
  const hit = cacheGet(key);
  if (hit) return hit;

  metrics.crawls++;
  try {
    await respectHostInterval(url);
    let record = null;
    if (config().mode === 'cloud') {
      record = await callCloud(url);
    } else {
      const data = await callLocal('/crawl', {
        url,
        mode: options.mode || 'fast',
        fresh: Boolean(options.fresh),
        maxChars: options.maxChars || 12000
      });
      record = normalizeCrawl(data, url);
    }
    if (record) {
      cacheSet(key, record);
      if (config().record) {
        appendRecord(record, 'crawl');
        appendCorpus(record);
      }
    }
    return record;
  } catch (e) {
    metrics.crawlFailures++;
    warn('crawl failed for ' + url + ': ' + e.message);
    return null;
  }
}

async function productMeta(rawUrl, options = {}) {
  const url = safeUrl(rawUrl);
  if (!url || !enabled() || config().mode === 'cloud') return null; // cloud /scrape has no product schema

  const key = 'product|' + url;
  const hit = cacheGet(key);
  if (hit) return hit;

  metrics.products++;
  try {
    await respectHostInterval(url);
    const data = await callLocal('/product', { url, mode: options.mode || 'fast', fresh: Boolean(options.fresh) });
    const record = normalizeProduct(data, url);
    if (record) {
      cacheSet(key, record);
      if (config().record) appendRecord(record, 'product');
    }
    return record;
  } catch (e) {
    metrics.productFailures++;
    warn('product meta failed for ' + url + ': ' + e.message);
    return null;
  }
}

/* ---------- persistence ---------- */
function readJSON(file, fallback) {
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    return value == null ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

function writeJSONAtomic(file, value) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = file + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function readRecords() {
  const value = readJSON(RECORDS_FILE, []);
  return Array.isArray(value) ? value : [];
}

function appendRecord(record, kind) {
  try {
    const records = readRecords();
    records.unshift({
      kind,
      engine: record.engine,
      url: record.url,
      finalUrl: record.finalUrl || record.url,
      title: record.title || '',
      facts: record.facts || [],
      confidence: record.confidence,
      checkedAt: record.checkedAt,
      description: record.description || '',
      price: record.price || 0,
      image: record.image || '',
      charCount: String(record.markdown || record.text || '').length,
      permitted: 'unknown',
      reviewedBy: null
    });
    if (records.length > MAX_RECORDS) records.length = MAX_RECORDS;
    writeJSONAtomic(RECORDS_FILE, records);
  } catch (e) {
    warn('could not write research records: ' + e.message);
  }
}

function reviewResearch(rawUrl, permitted, reviewer) {
  const url = safeUrl(rawUrl);
  if (!url) return null;
  const records = readRecords();
  const item = records.find(r => r.url === url || r.finalUrl === url);
  if (!item) return null;
  item.permitted = permitted === true || permitted === 'true' ? 'yes' : 'no';
  item.reviewedBy = String(reviewer || 'CEO').slice(0, 80);
  writeJSONAtomic(RECORDS_FILE, records);
  return item;
}

/* ---------- RAG-lite corpus (keyword retrieval with citations) ---------- */
function appendCorpus(record) {
  try {
    const corpus = readJSON(CORPUS_FILE, []);
    const text = String(record.markdown || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const chunks = [];
    const size = 600;
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
      if (chunks.length >= 40) break;
    }
    const existing = corpus.findIndex(x => x.url === record.url);
    const entry = {
      url: record.url,
      title: record.title || '',
      checkedAt: record.checkedAt,
      chunks
    };
    if (existing >= 0) corpus[existing] = entry; else corpus.unshift(entry);
    if (corpus.length > 120) corpus.length = 120;
    writeJSONAtomic(CORPUS_FILE, corpus);
  } catch (e) {
    warn('could not write research corpus: ' + e.message);
  }
}

const STOPWORDS = new Set(('ang ang mga ng sa para at ay ito iyan ni na man din lang mula tungkol about with from that this for the and are was were have has with your our their there here what when which who how why not you how can will would should data page site links link more information use used using make made need may can also only into than then them they its been being does did doing over under about above after before between during each other some such no nor own same so too very s t just don now').split(/\s+/));
function tokens(text) {
  return String(text || '').toLowerCase().match(/[a-z0-9]{3,}/g)
    .filter(w => !STOPWORDS.has(w));
}

function searchResearch(rawQuery, limit = 5) {
  metrics.searches++;
  const query = tokens(rawQuery);
  if (!query.length) return [];
  const corpus = readJSON(CORPUS_FILE, []);
  const results = [];
  for (const entry of corpus) {
    entry.chunks.forEach((text, i) => {
      const hay = tokens(text);
      const set = new Set(hay);
      let score = 0;
      for (const q of query) if (set.has(q)) score += 1 + (q.length >= 6 ? 0.5 : 0);
      for (const q of query) if (String(entry.title || '').toLowerCase().includes(q)) score += 0.4;
      if (score > 0) results.push({
        url: entry.url, title: entry.title, checkedAt: entry.checkedAt,
        chunkIndex: i, score: Math.round(score * 100) / 100,
        excerpt: text.slice(0, 320)
      });
    });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, Math.max(1, Math.min(20, Number(limit) || 5)));
}

/* ---------- groundedness gate ---------- */
function checkDraft(draft, sourceUrls, options = {}) {
  metrics.gateChecks++;
  const text = String(draft || '').trim();
  if (!text) return { decision: 'HOLD', coverage: 0, reasons: ['Walang draft na sinuri.'], evidence: [] };
  const lower = text.toLowerCase();
  const banned = ['guaranteed profit', '100% sure', 'click here to earn', 'fake account', 'buy followers'];
  const hits = banned.filter(x => lower.includes(x));
  if (hits.length) {
    return { decision: 'BLOCK', coverage: 0, reasons: banned.map(x => 'Prohibited claim: ' + x), evidence: [] };
  }

  const urls = (Array.isArray(sourceUrls) ? sourceUrls : [sourceUrls])
    .map(safeUrl).filter(Boolean).slice(0, 6);
  const records = readRecords();
  const corpus = readJSON(CORPUS_FILE, []);
  const evidence = [];
  let sourceText = '';
  for (const url of urls) {
    const rec = records.find(r => r.url === url || r.finalUrl === url);
    const cor = corpus.find(c => c.url === url);
    if (cor) { sourceText += ' ' + cor.chunks.join(' '); evidence.push({ url, title: cor.title }); }
    else if (rec) { sourceText += ' ' + rec.facts.join(' ') + ' ' + rec.title; evidence.push({ url, title: rec.title }); }
  }
  if (!sourceText.trim()) {
    return { decision: 'HOLD', coverage: 0, reasons: ['Walang naka-index na source para sa URL na ibinigay.'], evidence };
  }
  const sourceSet = new Set(tokens(sourceText));
  const draftTokens = tokens(text);
  const matched = draftTokens.filter(w => sourceSet.has(w));
  const coverage = draftTokens.length ? matched.length / draftTokens.length : 0;
  const threshold = Number(options.threshold) || 0.35;
  let decision = coverage >= 0.6 ? 'AUTO' : coverage >= threshold ? 'HOLD' : 'HOLD';
  const reasons = [
    'Token coverage: ' + (coverage * 100).toFixed(0) + '% (' + matched.length + '/' + draftTokens.length + ')',
    decision === 'AUTO' ? 'May sapat na source support; draft pa rin ang output.' : 'Kulang ang source support — kailangan ng CEO review.'
  ];
  return { decision, coverage: Math.round(coverage * 100) / 100, reasons, evidence: evidence.slice(0, 6) };
}

/* ---------- daily digest ---------- */
async function buildDigest(rawUrls, options = {}) {
  const urls = (Array.isArray(rawUrls) ? rawUrls : [rawUrls]).map(safeUrl).filter(Boolean).slice(0, 10);
  const items = [];
  for (const url of urls) {
    const record = await crawlSource(url, { mode: options.mode || 'fast', fresh: Boolean(options.fresh) });
    if (record) items.push({
      url: record.url, title: record.title, checkedAt: record.checkedAt,
      confidence: record.confidence, facts: record.facts.slice(0, 3)
    });
  }
  items.sort((a, b) => b.confidence - a.confidence);
  const digest = {
    generatedAt: new Date().toISOString(),
    sourceCount: urls.length,
    itemCount: items.length,
    items,
    notice: 'Recommendations only. CEO approval required before publishing.'
  };
  metrics.digests++;
  try { writeJSONAtomic(DIGEST_FILE, digest); } catch (e) { warn('digest write failed: ' + e.message); }
  return digest;
}

function getMetrics() {
  return Object.assign({}, metrics, {
    uptimeSeconds: Math.floor((Date.now() - metrics.startedAt) / 1000),
    killSwitch: config().killSwitch,
    mode: config().mode
  });
}

/* ---------- P1: optional service health (never throws) ---------- */
async function getServiceHealth() {
  const cfg = config();
  const out = {
    ok: false, running: false, mode: cfg.mode, url: cfg.serviceUrl,
    killSwitch: cfg.killSwitch, checkedAt: new Date().toISOString(), detail: ''
  };
  if (cfg.mode === 'off') { out.detail = 'Research mode is off.'; return out; }
  if (cfg.mode === 'cloud') {
    out.running = !!cfg.key; out.ok = !!cfg.key;
    out.detail = cfg.key ? 'Cloud mode configured.' : 'Cloud mode needs CRAWL4AI_KEY.';
    return out;
  }
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 1500);
    const r = await fetch(cfg.serviceUrl + '/health', { signal: ctl.signal });
    clearTimeout(timer);
    out.status = r.status;
    out.running = r.ok;
    out.ok = r.ok;
    out.detail = r.ok ? (await r.text().catch(() => '')).slice(0, 200) : 'HTTP ' + r.status;
  } catch (e) {
    out.detail = e && e.name === 'AbortError' ? 'timeout' : String(e && e.message || e).slice(0, 200);
  }
  return out;
}

module.exports = {
  crawlSource,
  productMeta,
  getResearchRecords: readRecords,
  getResearchCorpus: () => readJSON(CORPUS_FILE, []),
  getTrendDigest: () => readJSON(DIGEST_FILE, null),
  searchResearch,
  checkDraft,
  buildDigest,
  reviewResearch,
  config,
  isEnabled: enabled,
  getMetrics,
  getServiceHealth
};
