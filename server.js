'use strict';
/*
  AI Agents Office - local backend
  - Serves the dashboard in public/
  - Runs "real" agents by calling OpenRouter (Anthropic-compatible / Chat Completions)
  - Keeps the API key on the server (never in the browser)
  Run: node server.js   then open http://localhost:8787
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const SETTINGS_FILE = path.join(DATA, 'settings.json');
const CONFIG_FILE = path.join(DATA, 'config.json');
const ROUTINES_FILE = path.join(DATA, 'routines.json');
const LAYOUT_FILE = path.join(DATA, 'layout.json');
const STATE_FILE = path.join(DATA, 'state.json');
const PORT = Number(process.env.PORT || 8787);

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });

/* ---------- persistence ---------- */
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function writeJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}
function settings() {
  const disk = readJSON(SETTINGS_FILE, {});
  const keys = disk.keys || {};
  if (!keys.coarena && process.env.COARENA_API_KEY) keys.coarena = { apiKey: process.env.COARENA_API_KEY };
  if (!keys.groq && process.env.GROQ_API_KEY) keys.groq = { apiKey: process.env.GROQ_API_KEY };
  const apiKey = disk.apiKey || process.env.OPENROUTER_API_KEY || '';
  let provider = disk.provider || process.env.AI_PROVIDER || 'auto';
  if (provider === 'auto') {
    provider = apiKey.startsWith('sk-or-') ? 'openrouter'
      : apiKey.startsWith('coa_') ? 'coarena'
      : apiKey.startsWith('gsk_') ? 'groq' : 'openai';
  }
  const defaults = {
    openrouter: 'openai/gpt-4o-mini', coarena: 'claude-haiku-5-5',
    groq: 'openai/gpt-oss-20b', openai: 'gpt-4o-mini'
  };
  return {
    apiKey,
    provider,
    model: disk.model || process.env.AI_MODEL || defaults[provider] || 'gpt-4o-mini',
    baseUrl: disk.baseUrl || process.env.AI_BASE_URL || '',
    keys: keys,
    failover: Array.isArray(disk.failover) ? disk.failover : []
  };
}

const state = {
  config: Object.assign({
    niche: 'content creation tips',
    style: 'short, friendly, hook first',
    clips: ['hook-01', 'review-02', 'unbox-03'],
    slots: ['Mon 12:00 PM', 'Tue 6:00 PM', 'Wed 8:00 PM'],
    mission: ''
  }, readJSON(CONFIG_FILE, {})),
  outputs: {},
  replyIds: {},
  tasks: [],
  activity: [],
  stopped: false,
  running: false
};

function defaultLayout() {
  return { rooms: [
    { id:'hq', name:'Main HQ', w:13, h:13, floor:'hq', items:[
      {id:'core',type:'holo',a:6,b:6,label:'Core'},
      {id:'d1',type:'desk',a:2,b:2,label:'Drop'},
      {id:'d2',type:'desk',a:5,b:1.5,label:'Editor'},
      {id:'d3',type:'desk',a:9,b:2,label:'Revise'},
      {id:'d4',type:'desk',a:1.5,b:6,label:'SEO'},
      {id:'d5',type:'desk',a:10,b:6,label:'Scheduler'},
      {id:'d6',type:'desk',a:2,b:10,label:'Posting'},
      {id:'stage',type:'stage',a:5.5,b:10,label:'Demo stage'},
      {id:'ceo',type:'ceo_desk',a:9,b:9,label:'CEO'},
      {id:'portal',type:'portal',a:6,b:12,label:'Entry'},
      {id:'n1',type:'neon',a:3.5,b:4,label:''},
      {id:'n2',type:'neon',a:9,b:4,label:''},
      {id:'srv',type:'server',a:12,b:2,label:'Servers'}
    ]},
    { id:'cafeteria', name:'Cafeteria', w:10, h:9, floor:'cafe', items:[
      {id:'c1',type:'coffee',a:1,b:1,label:'Coffee'},
      {id:'cnt',type:'counter',a:3,b:1,label:'Snack bar'},
      {id:'vnd',type:'vending',a:8,b:1,label:'Drinks'},
      {id:'t1',type:'table',a:2,b:4,label:'Table 1'},
      {id:'t2',type:'table',a:6,b:4,label:'Table 2'},
      {id:'t3',type:'table',a:4,b:7,label:'Table 3'},
      {id:'b1',type:'beanbag',a:1,b:7,label:''},
      {id:'b2',type:'beanbag',a:8,b:6,label:''},
      {id:'pl2',type:'plant',a:9,b:8,label:''}
    ]},
    { id:'fun', name:'Fun Room', w:11, h:9, floor:'fun', items:[
      {id:'p1',type:'pool',a:1,b:1,label:'Pool'},
      {id:'a1',type:'arcade',a:6,b:1,label:'Arcade'},
      {id:'h1',type:'hoop',a:8,b:5,label:'Hoop'},
      {id:'s1',type:'sofa',a:1,b:6,label:'Sofa'},
      {id:'pl3',type:'plant',a:10,b:8,label:''}
    ]},
    { id:'conference', name:'Conference Room', w:9, h:8, floor:'conf', items:[
      {id:'ct',type:'table',a:2,b:2,label:'Board table'},
      {id:'wb2',type:'whiteboard',a:7,b:1,label:'Strategy'},
      {id:'bk',type:'bookshelf',a:7,b:5,label:'Library'},
      {id:'mn',type:'monitor',a:1,b:6,label:'Dashboard'}
    ]}
  ]};
}
const DEFAULT_ROUTINES = [
  {id:'r-cos',agent:'cos',name:'Chief of Staff — plan the day',minutes:30,enabled:true,lastRun:0,runs:0},
  {id:'r-mgr',agent:'mgr',name:'Manager status report',minutes:60,enabled:true,lastRun:0,runs:0},
  {id:'r-out',agent:'outreach',name:'Client outreach drafts',minutes:120,enabled:false,lastRun:0,runs:0},
  {id:'r-scr',agent:'scraper',name:'Community resource scan',minutes:180,enabled:false,lastRun:0,runs:0},
  {id:'r-soc',agent:'social',name:'Social media check-in',minutes:240,enabled:false,lastRun:0,runs:0},
  {id:'r-prod',agent:'product',name:'Product video batch',minutes:180,enabled:false,lastRun:0,runs:0},
  {id:'r-joke',agent:'joker',name:'Jester — daily jokes',minutes:360,enabled:false,lastRun:0,runs:0},
  {id:'r-conv',agent:'cos',name:'Watercooler conversations',minutes:45,enabled:false,lastRun:0,runs:0}
];
const savedRoutines = readJSON(ROUTINES_FILE, null);
state.routines = Array.isArray(savedRoutines) ? savedRoutines.slice() : DEFAULT_ROUTINES.slice();
DEFAULT_ROUTINES.forEach(d => { if (!state.routines.some(r => r.id === d.id)) state.routines.push(d); });
state.layout = readJSON(LAYOUT_FILE, null) || defaultLayout();
state.sources = Array.isArray(state.config.sources) ? state.config.sources : [];

// Restore volatile-looking state from disk so restarts keep history.
const savedState = readJSON(STATE_FILE, null) || {};
state.outputs = savedState.outputs || {};
state.replyIds = savedState.replyIds || {};
state.replyProviders = savedState.replyProviders || {};
state.tasks = Array.isArray(savedState.tasks) ? savedState.tasks : [];
state.activity = Array.isArray(savedState.activity) ? savedState.activity : [];
state.memory = typeof savedState.memory === 'string' ? savedState.memory : '';
state.chat = Array.isArray(savedState.chat) ? savedState.chat : [];
state.products = Array.isArray(savedState.products) ? savedState.products : [];
state.conversations = Array.isArray(savedState.conversations) ? savedState.conversations : [];

function saveConfig() { writeJSON(CONFIG_FILE, state.config); }
function saveRoutines() { writeJSON(ROUTINES_FILE, state.routines); }
function saveLayout() { writeJSON(LAYOUT_FILE, state.layout); }
let saveTimer = null;
function saveStateNow() {
  writeJSON(STATE_FILE, {
    outputs: state.outputs, replyIds: state.replyIds, replyProviders: state.replyProviders,
    tasks: state.tasks, activity: state.activity.slice(0, 200),
    memory: state.memory, chat: state.chat.slice(-100), products: state.products,
    conversations: state.conversations.slice(-20)
  });
}
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; saveStateNow(); }, 400);
}
process.on('SIGINT', () => { saveStateNow(); process.exit(0); });
process.on('SIGTERM', () => { saveStateNow(); process.exit(0); });
function log(text, who) {
  state.activity.unshift({ t: Date.now(), who: who || 'system', text: String(text) });
  if (state.activity.length > 200) state.activity.length = 200;
  scheduleSave();
}
log('Office online. Add your OpenRouter key in Setup, then give the CEO an order.', 'system');

/* ---------- AI ---------- */
let lastReply = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const MODEL_DEFAULTS = {
  openrouter: 'openai/gpt-4o-mini', coarena: 'gemini-3-8-flash',
  groq: 'openai/gpt-oss-20b', openai: 'gpt-4o-mini', vyce: ''
};
function providerCfg(name, s) {
  if (name === s.provider) return { provider: name, apiKey: s.apiKey, model: s.model, baseUrl: s.baseUrl };
  const k = s.keys[name] || {};
  return {
    provider: name, apiKey: k.apiKey || '',
    model: k.model || MODEL_DEFAULTS[name] || 'gpt-4o-mini',
    baseUrl: k.baseUrl || ''
  };
}
function endpointFor(cfg) {
  if ((cfg.provider === 'vyce' || cfg.baseUrl) && cfg.baseUrl) return cfg.baseUrl.replace(/\/$/, '') + '/chat/completions';
  if (cfg.provider === 'groq') return 'https://api.groq.com/openai/v1/chat/completions';
  if (cfg.provider === 'coarena') return 'https://coarena.ai/api/v1/chat/completions';
  if (cfg.provider === 'openrouter') return 'https://openrouter.ai/api/v1/chat/completions';
  return 'https://api.openai.com/v1/chat/completions';
}
async function callProvider(cfg, system, user, maxTokens) {
  if (!cfg.apiKey) throw new Error('No key for ' + cfg.provider);
  const systemText = (state.memory ? 'Company memory (shared context):\n' + state.memory + '\n\n' : '') + system;
  const headers = { 'Authorization': 'Bearer ' + cfg.apiKey, 'Content-Type': 'application/json' };
  if (cfg.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'http://localhost:' + PORT;
    headers['X-Title'] = 'Cyborg Cheebee Office';
  }
  const payload = {
    model: cfg.model,
    messages: [{ role: 'system', content: systemText }, { role: 'user', content: user }],
    max_tokens: cfg.provider === 'coarena' ? (maxTokens || 800) * 2 : (maxTokens || 800),
    temperature: 0.7
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(endpointFor(cfg), { method: 'POST', headers, body: JSON.stringify(payload) });
    const raw = await res.text();
    let j;
    try { j = JSON.parse(raw); } catch (e) { throw new Error('AI returned non-JSON: ' + raw.slice(0, 180)); }
    if (res.status === 429 && attempt === 0) {
      const wait = Math.min(Number(res.headers.get('retry-after')) || 6, 30) * 1000;
      log(cfg.provider + ' rate limited — retrying in ' + Math.round(wait / 1000) + 's', 'system');
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error((j.error && j.error.message) || (cfg.provider + ' HTTP ' + res.status));
    const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!content) throw new Error('AI returned empty content');
    return {
      text: content.trim(),
      id: j.id || res.headers.get('x-coarena-request-id') || '',
      provider: cfg.provider
    };
  }
  throw new Error(cfg.provider + ' rate limited after retry');
}

async function callAI(system, user, maxTokens) {
  const s = settings();
  const candidates = [s.provider, ...s.failover].filter((v, i, a) => a.indexOf(v) === i);
  if (!s.apiKey && !candidates.some(n => providerCfg(n, s).apiKey)) {
    throw new Error('No API key yet. Open Setup and paste your key.');
  }
  let lastErr = null;
  for (const name of candidates) {
    const cfg = providerCfg(name, s);
    if (!cfg.apiKey) continue;
    try {
      const r = await callProvider(cfg, system, user, maxTokens);
      lastReply = { id: r.id, model: cfg.model, provider: r.provider };
      return r.text;
    } catch (e) {
      lastErr = e;
      log('Provider ' + name + ' failed, trying next: ' + e.message, 'system');
    }
  }
  throw lastErr || new Error('No provider available');
}

const PROMPTS = {
  edit: {
    sys: 'You are a video editor for short-form vertical clips. Be concise and practical.',
    user: c => 'Niche: ' + c.niche + '\nClips: ' + c.clips.join(', ') +
      '\nGive exactly one short edit note per clip, one clip per line. Format: "clip: note". No intro.',
    max: 600
  },
  rvs: {
    sys: 'You are a revision editor. Tighten hooks and pacing. Be concise.',
    user: (c, o) => 'Edit plan:\n' + (o.edit || '(none)') +
      '\nRewrite it with a stronger first 2 seconds and better pacing. One line per clip. No intro.',
    max: 600
  },
  seo: {
    sys: 'You write captions and hashtags for short-form video. Output only the captions, nothing else.',
    user: c => 'Niche: ' + c.niche + '\nCaption style: ' + c.style +
      '\nClips: ' + c.clips.join(', ') +
      '\nFor each clip write a caption and a hashtag line. Separate clips with a blank line. ' +
      'Line 1 = caption. Line 2 = hashtags only.',
    max: 1000
  },
  sched: {
    sys: 'You are a scheduling agent. Return only one line per clip.',
    user: c => 'Clips: ' + c.clips.join(', ') + '\nPreferred slots: ' + c.slots.join(', ') +
      '\nAssign each clip one slot, in order. Format: "clip -> slot". No intro.',
    max: 500
  },
  mgr: {
    sys: 'You are the manager of a small AI agent company. Report to the CEO in plain language.',
    user: (c, o) => 'Mission: ' + (c.mission || '(none)') + '\nNiche: ' + c.niche +
      '\nClips: ' + c.clips.join(', ') + '\nFinished agent outputs: ' + (Object.keys(o).join(', ') || 'none') +
      '\nOpen tasks: ' + state.tasks.filter(t => t.status !== 'done').length +
      '\nWrite a 2-3 sentence status report. Mention what is ready and what needs the CEO.',
    max: 500
  },
  cos: {
    sys: 'You are the Chief of Staff of a small AI agent company. You set priorities, delegate, and keep the CEO informed.',
    user: (c, o) => 'Mission: ' + (c.mission || '(none)') + '\nNiche: ' + c.niche +
      '\nAgents available: Chief of Staff, Client Outreach, Community Scraper, Social Media Manager, Video Editor, SEO Caption Bot, Scheduler, Posting Bot, Bot Manager.' +
      '\nOpen tasks: ' + state.tasks.filter(t => t.status !== 'done').length +
      '\nRoutines enabled: ' + state.routines.filter(r => r.enabled).map(r => r.name).join(', ') +
      '\nWrite today\'s plan: exactly 3 priorities. Format one line each: "priority — owner". No intro.',
    max: 700
  },
  outreach: {
    sys: 'You write short, friendly, personalized client outreach messages. Never sound spammy.',
    user: c => 'Niche: ' + c.niche + '\nMission: ' + (c.mission || '(none)') +
      '\nWrite 3 outreach drafts: one to a brand, one to a creator, one to a local business. ' +
      'Each 2-3 sentences with a clear ask. Format: "Type: message". No intro.',
    max: 800
  },
  scraper: {
    sys: 'You are a research agent. Return only a short resource list, no prose.',
    user: (c, o) => {
      const found = state.lastScrape || '';
      return 'Niche: ' + c.niche + '\nConfigured source URLs: ' + (state.sources.length ? state.sources.join(', ') : '(none)') +
        '\nText gathered from those sources:\n' + (found || '(no live fetch available — suggest likely resources)' ) +
        '\nList 6 useful resources (communities, tools, newsletters, subreddits) with a one-line reason each. ' +
        'Format: "name — reason". Prefix each with [suggested] if no live source confirmed it.';
    },
    max: 900
  },
  social: {
    sys: 'You manage social media accounts. Draft platform-specific posts with a posting time.',
    user: (c, o) => 'Niche: ' + c.niche + '\nStyle: ' + c.style +
      '\nCaptions available:\n' + (o.seo || '(none)') + '\nSlots: ' + c.slots.join(', ') +
      '\nWrite one post per platform: TikTok, Facebook, Instagram, YouTube. ' +
      'Format one line per platform: "Platform (time): text". No intro.',
    max: 900
  },
  joker: {
    sys: 'You are the Office Jester of an AI company. You write short, clean, good-natured jokes about office life and AI agents. No insults about real people.',
    user: () => 'Niche: ' + state.config.niche + '\nWrite 3 short jokes (1-2 lines each) about AI agents working in an office. Keep it light and funny. Format one joke per line.',
    max: 600
  },
  product: {
    sys: 'You are a product video director for short-form affiliate videos. Produce a ready-to-shoot package, not prose.',
    user: () => {
      const p = state.productCtx || {};
      return 'Product URL: ' + (p.url || '') +
        '\nPage title: ' + (p.title || '(not available)') +
        '\nPage description: ' + (p.description || '(not available)') +
        '\nNiche: ' + state.config.niche + '\nStyle: ' + state.config.style +
        '\n\nCreate a 6-scene vertical video (9:16, 30-40s). Output exactly:\n' +
        'HOOK: one punchy line\nSCENES:\n1. visual | on-screen text | voiceover\n2. … (through 6)\n' +
        'CAPTION: one line\nHASHTAGS: one line\nCTA: one line';
    },
    max: 1400
  }
};

// Best-effort live fetch of configured community/resource URLs (no key needed).
async function scrapeSources() {
  const urls = state.sources.slice(0, 4);
  const parts = [];
  for (const url of urls) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'AI-Agents-Office/1.0' } });
      const html = (await r.text()).slice(0, 60000);
      const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200);
      parts.push('SOURCE ' + url + '\nTITLE: ' + title.replace(/<[^>]+>/g, '').trim() + '\nTEXT: ' + text);
    } catch (e) {
      parts.push('SOURCE ' + url + '\nFETCH FAILED: ' + e.message);
    }
  }
  return parts.join('\n\n');
}

async function fetchProductMeta(url) {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' }
    });
    const html = (await r.text()).slice(0, 120000);
    const title = ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
    const desc = ((html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)/i) || [])[1] || '').trim();
    return { title: title.slice(0, 200), description: desc.slice(0, 400) };
  } catch (e) {
    return { title: '', description: 'Fetch failed: ' + e.message };
  }
}

async function generateConversation(ids) {
  const chosen = (ids && ids.length ? ids : ['cos', 'seo', 'product', 'joker']).slice(0, 4);
  const sys = 'You write a short, natural office conversation between AI coworkers in the Philippines. Write in casual but CORRECT TAGLISH (natural Tagalog mixed with English), like real Filipino office workers. Use proper Tagalog spelling and grammar. Each line must start with the agent id exactly as given, followed by a colon. Exactly 4 lines, one speaker per line, natural turn-taking (a reply reacts to the previous line). Keep it light and funny. Output only the lines.';
  const user = 'Agents: ' + chosen.map(id => id + ' (' + (BOT_NAMES[id] || id) + ')').join(', ') +
    '\nOffice: Cyborg Cheebee Office. Niche: ' + state.config.niche +
    '\nWrite 4 short lines of casual watercooler talk. Format: "id: line".';
  let lines;
  try {
    lines = (await callAI(sys, user, 500)).split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6);
  } catch (e) {
    lines = [chosen[0] + ': Coffee first, work later.', chosen[1] + ': Boss is watching. Back to work!'];
  }
  const conv = {
    id: 'c' + Date.now(), t: Date.now(),
    lines: lines.map(l => {
      const i = l.indexOf(':');
      const id = (i > 0 ? l.slice(0, i) : chosen[0]).trim();
      return { id: chosen.includes(id) ? id : chosen[0], text: (i > 0 ? l.slice(i + 1) : l).trim() };
    })
  };
  state.conversations.unshift(conv);
  if (state.conversations.length > 20) state.conversations.length = 20;
  saveStateNow();
  log('Watercooler conversation generated', 'system');
  return conv;
}

async function runProduct(p) {
  p.status = 'running';
  saveStateNow();
  try {
    const meta = await fetchProductMeta(p.url);
    p.title = meta.title || p.title || p.url.split('/').filter(Boolean).pop().slice(0, 60);
    p.description = meta.description || '';
    state.productCtx = p;
    p.output = await runAgent('product');
    p.replyId = state.replyIds.product || '';
    p.provider = state.replyProviders.product || '';
    p.status = 'done';
    log('Product video package ready: ' + p.title, 'product');
  } catch (e) {
    p.status = 'failed';
    p.output = 'ERROR: ' + e.message;
    log('Product video failed: ' + e.message, 'product');
  }
  saveStateNow();
  return p;
}

async function runAgent(id) {
  const c = state.config;
  if (id === 'drop') return c.clips.length + ' clips ready:\n' + c.clips.join(', ');
  if (id === 'post') {
    return c.clips.map((x, i) => x + ' queued for TikTok, Facebook, Instagram, YouTube (' +
      (c.slots[i] || 'next free slot') + ')').join('\n');
  }
  if (id === 'scraper') {
    state.lastScrape = await scrapeSources();
    log(state.sources.length ? 'Scraped ' + state.sources.length + ' configured sources' : 'No live sources configured — using AI suggestions', 'scraper');
  }
  const p = PROMPTS[id];
  if (!p) return 'No output for this agent.';
  const text = await callAI(p.sys, p.user(c, state.outputs), p.max);
  if (lastReply && lastReply.id) {
    state.replyIds[id] = lastReply.id;
    state.replyProviders[id] = lastReply.provider;
    scheduleSave();
  }
  return text;
}

const ORDER = ['drop', 'edit', 'rvs', 'seo', 'sched', 'post', 'mgr'];
const BOT_NAMES = {
  drop: 'Drop videos', edit: 'Video Editor', rvs: 'RVS Revise', seo: 'SEO Caption Bot',
  sched: 'Scheduler Bot', post: 'Posting Bot', mgr: 'Bot Manager',
  cos: 'Chief of Staff', outreach: 'Client Outreach', scraper: 'Community Scraper',
  social: 'Social Media Manager', product: 'Product Video Bot', joker: 'Office Jester'
};
const AGENT_META = [
  {id:'drop',n:'Drop videos',i:'🎬',c:'#3f9d6a',group:'pipeline',room:'hq',desc:'Raw clips land here.'},
  {id:'edit',n:'Video Editor',i:'✂',c:'#d69a4a',group:'pipeline',room:'hq',desc:'Plans a vertical cut per clip.'},
  {id:'rvs',n:'RVS Revise',i:'🔁',c:'#4aa39a',group:'pipeline',room:'hq',desc:'Tightens hook and pacing.'},
  {id:'seo',n:'SEO Caption Bot',i:'🔵',c:'#5b7fd6',group:'pipeline',room:'hq',desc:'Writes captions and hashtags.'},
  {id:'sched',n:'Scheduler Bot',i:'🗓',c:'#8a6fd6',group:'pipeline',room:'hq',desc:'Assigns posting slots.'},
  {id:'post',n:'Posting Bot',i:'📮',c:'#d6607a',group:'pipeline',room:'hq',desc:'Prepares the posting prompt. Publishing needs approval.'},
  {id:'mgr',n:'Bot Manager',i:'🧭',c:'#3f9d6a',group:'staff',room:'conference',desc:'Reports status to the CEO.'},
  {id:'cos',n:'Chief of Staff',i:'🧠',c:'#e8b04a',group:'staff',room:'conference',desc:'Sets priorities and delegates to agents.'},
  {id:'outreach',n:'Client Outreach',i:'📨',c:'#4a9fd6',group:'staff',room:'hq',desc:'Drafts personalized client messages.'},
  {id:'scraper',n:'Community Scraper',i:'🕸',c:'#7ac74f',group:'staff',room:'hq',desc:'Fetches configured URLs and lists useful resources.'},
  {id:'social',n:'Social Media Manager',i:'📱',c:'#d6607a',group:'staff',room:'hq',desc:'Drafts per-platform posts with times.'},
  {id:'product',n:'Product Video Bot',i:'🎬',c:'#4fd1c5',group:'staff',room:'hq',desc:'Turns product links into ready-to-shoot video packages.'},
  {id:'joker',n:'Office Jester',i:'🤡',c:'#f472b6',group:'staff',room:'fun',desc:'Keeps morale high with clean jokes and memes.'}
];

async function runAll() {
  if (state.running || state.stopped) return { ok: false, reason: state.stopped ? 'stopped' : 'busy' };
  state.running = true;
  log('Full pipeline started', 'system');
  try {
    for (const id of ORDER) {
      if (state.stopped) { log('Stopped by CEO during ' + BOT_NAMES[id], 'system'); break; }
      log(BOT_NAMES[id] + ' working...', id);
      try {
        state.outputs[id] = await runAgent(id);
        log(BOT_NAMES[id] + ' finished', id);
      } catch (e) {
        state.outputs[id] = 'ERROR: ' + e.message;
        log(BOT_NAMES[id] + ' failed: ' + e.message, id);
      }
      if (settings().provider === 'coarena') await sleep(800);
    }
  } finally {
    state.running = false;
  }
  return { ok: true, outputs: state.outputs };
}

async function planOrder(order) {
  const sys = 'You are the operations manager of an AI agent company that makes short-form video posts. ' +
    'Agents (id: job): drop: raw clips, edit: cut clips, rvs: revise edit, seo: write captions, ' +
    'sched: pick posting slots, post: publish, mgr: report. ' +
    'Given the CEO order, output ONLY a JSON array of tasks, max 12. Each item: ' +
    '{"bot":"seo","title":"Write caption for hook-01","approval":false}. ' +
    'Set approval true ONLY for "post" tasks. No prose, no markdown.';
  const user = 'CEO order: ' + order + '\nNiche: ' + state.config.niche +
    '\nClips: ' + state.config.clips.join(', ') + '\nSlots: ' + state.config.slots.join(', ');
  let arr = null;
  try {
    const txt = await callAI(sys, user, 1400);
    const cleaned = txt.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) arr = parsed;
  } catch (e) {
    log('AI planning failed, used local plan: ' + e.message, 'manager');
  }
  if (!arr) {
    arr = [];
    state.config.clips.forEach((clip, i) => {
      arr.push({ bot: 'edit', title: 'Edit ' + clip, approval: false });
      arr.push({ bot: 'seo', title: 'Write caption for ' + clip, approval: false });
      arr.push({ bot: 'sched', title: 'Schedule ' + clip + ' (' + (state.config.slots[i] || 'next free') + ')', approval: false });
      arr.push({ bot: 'post', title: 'Publish ' + clip, approval: true });
    });
  }
  state.tasks = arr.slice(0, 12).map(t => ({
    bot: t.bot || 'mgr',
    title: t.title || 'Untitled task',
    approval: !!t.approval,
    status: 'queued',
    note: ''
  }));
  state.config.mission = order;
  saveConfig();
  log('CEO order planned: ' + state.tasks.length + ' tasks', 'manager');
  return state.tasks;
}

async function runTasks() {
  if (state.running || state.stopped) return { ok: false };
  state.running = true;
  try {
    for (let i = 0; i < state.tasks.length; i++) {
      const t = state.tasks[i];
      if (state.stopped) break;
      if (t.status !== 'queued') continue;
      if (t.approval && !t.approved) {
        t.status = 'approval';
        log('Approval needed: ' + t.title, 'manager');
        continue;
      }
      t.status = 'running';
      log('Running: ' + t.title, t.bot);
      try {
        state.outputs[t.bot] = await runAgent(t.bot);
        t.status = 'done';
        log('Done: ' + t.title, t.bot);
      } catch (e) {
        t.status = 'failed';
        t.note = e.message;
        log('Failed: ' + t.title + ' - ' + e.message, t.bot);
      }
      if (settings().provider === 'coarena' && t.status !== 'approval') await sleep(800);
    }
  } finally {
    state.running = false;
  }
  return { ok: true, tasks: state.tasks };
}

/* ---------- 24/7 routines ---------- */
let lastRoutineAt = 0;
async function runRoutine(id, manual) {
  const r = state.routines.find(x => x.id === id);
  if (!r) return { ok: false, error: 'No such routine' };
  if (!manual && (state.running || state.stopped)) return { ok: false, reason: 'busy or stopped' };
  state.running = true;
  try {
    log('Routine started: ' + r.name, r.agent);
    state.outputs[r.agent] = await runAgent(r.agent);
    r.lastRun = Date.now();
    r.runs = (r.runs || 0) + 1;
    lastRoutineAt = Date.now();
    saveRoutines();
    log('Routine finished: ' + r.name, r.agent);
    return { ok: true, output: state.outputs[r.agent] };
  } catch (e) {
    log('Routine failed: ' + r.name + ' — ' + e.message, r.agent);
    return { ok: false, error: e.message };
  } finally {
    state.running = false;
  }
}
setInterval(async () => {
  if (state.stopped || state.running) return;
  if (Date.now() - lastRoutineAt < 7000) return;
  const due = state.routines.find(r => r.enabled && r.minutes > 0 &&
    Date.now() - (r.lastRun || 0) >= r.minutes * 60000);
  if (due) await runRoutine(due.id, false);
}, 10000);

/* ---------- HTTP helpers ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};
function send(res, code, body, type) {
  res.writeHead(code, {
    'Content-Type': type || 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}
function sendJSON(res, code, obj) { send(res, code, JSON.stringify(obj)); }
function body(req) {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve({}); }
    });
  });
}
function publicState() {
  const s = settings();
  return {
    config: state.config, outputs: state.outputs, tasks: state.tasks,
    replyIds: state.replyIds, replyProviders: state.replyProviders,
    agents: AGENT_META, routines: state.routines, layout: state.layout,
    sources: state.sources, memory: state.memory, chat: state.chat, products: state.products,
    conversations: state.conversations,
    activity: state.activity, stopped: state.stopped, running: state.running,
    setup: { hasKey: !!s.apiKey, model: s.model, provider: s.provider, baseUrl: s.baseUrl,
      keys: s.keys, failover: s.failover }
  };
}

let limitsCache = { at: 0, data: null };

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:' + PORT);
  const p = u.pathname;
  try {
    if (p === '/api/state' && req.method === 'GET') return sendJSON(res, 200, publicState());

    if (p === '/api/settings' && req.method === 'POST') {
      const b = await body(req);
      const cur = readJSON(SETTINGS_FILE, {});
      const next = {
        apiKey: typeof b.apiKey === 'string' ? b.apiKey : cur.apiKey || '',
        provider: typeof b.provider === 'string' ? b.provider : cur.provider || 'auto',
        model: typeof b.model === 'string' && b.model.trim() ? b.model.trim() : cur.model || '',
        baseUrl: typeof b.baseUrl === 'string' ? b.baseUrl.trim() : cur.baseUrl || '',
        keys: b.keys && typeof b.keys === 'object' ? b.keys : cur.keys || {},
        failover: Array.isArray(b.failover) ? b.failover : cur.failover || []
      };
      writeJSON(SETTINGS_FILE, next);
      const eff = settings();
      log('Settings updated (' + eff.provider + ' / ' + eff.model + ')', 'system');
      return sendJSON(res, 200, { ok: true, hasKey: !!eff.apiKey, model: eff.model, provider: eff.provider,
        keys: eff.keys, failover: eff.failover });
    }

    // Failover provider keys (Groq, Vyce, OpenAI, OpenRouter, Coarena)
    if (p === '/api/providers' && req.method === 'GET') {
      const s = settings();
      return sendJSON(res, 200, { keys: s.keys, failover: s.failover, primary: s.provider });
    }
    if (p === '/api/providers' && req.method === 'POST') {
      const b = await body(req);
      const cur = readJSON(SETTINGS_FILE, {});
      cur.keys = b.keys && typeof b.keys === 'object' ? b.keys : cur.keys || {};
      cur.failover = Array.isArray(b.failover) ? b.failover.slice(0, 5) : cur.failover || [];
      writeJSON(SETTINGS_FILE, cur);
      log('Failover providers updated: ' + (cur.failover.join(', ') || 'none'), 'CEO');
      return sendJSON(res, 200, { ok: true, keys: cur.keys, failover: cur.failover });
    }

    // Coarena usage/limits, cached for 30 seconds
    if (p === '/api/limits' && req.method === 'GET') {
      const s = settings();
      const cfg = s.provider === 'coarena' ? { apiKey: s.apiKey } : (s.keys.coarena || {});
      if (!cfg.apiKey) return sendJSON(res, 200, { ok: false, error: 'No Coarena key' });
      if (limitsCache.data && Date.now() - limitsCache.at < 30000) return sendJSON(res, 200, limitsCache.data);
      try {
        const r = await fetch('https://coarena.ai/api/v1/limits', { headers: { 'Authorization': 'Bearer ' + cfg.apiKey } });
        const j = await r.json();
        const d = j.data || {};
        limitsCache = { at: Date.now(), data: {
          ok: r.ok, provider: 'coarena', plan: d.plan, free: d.free,
          usdPerDay: d.usd_per_day, usedUsd: d.today && d.today.used_usd,
          leftUsd: d.today && d.today.left_usd, requests: d.today && d.today.requests,
          rpm: d.requests_per_minute_key, concurrency: d.concurrency,
          resetsAt: d.today && d.today.resets_at,
          canAsk: d.can_ask
        } };
        return sendJSON(res, 200, limitsCache.data);
      } catch (e) {
        return sendJSON(res, 200, { ok: false, error: e.message });
      }
    }

    // Shared company memory given to every agent
    if (p === '/api/memory' && req.method === 'GET') return sendJSON(res, 200, { memory: state.memory });
    if (p === '/api/memory' && req.method === 'POST') {
      const b = await body(req);
      state.memory = typeof b.memory === 'string' ? b.memory.slice(0, 12000) : '';
      saveStateNow();
      log('Company memory updated (' + state.memory.length + ' chars)', 'CEO');
      return sendJSON(res, 200, { ok: true, memory: state.memory });
    }

    // CEO chat with the Chief of Staff
    if (p === '/api/chat' && req.method === 'GET') return sendJSON(res, 200, { chat: state.chat });
    if (p === '/api/chat' && req.method === 'POST') {
      const b = await body(req);
      const msg = String(b.message || '').trim();
      if (!msg) return sendJSON(res, 400, { ok: false, error: 'Empty message' });
      state.chat.push({ role: 'user', text: msg, t: Date.now() });
      const history = state.chat.slice(-12).map(m => (m.role === 'user' ? 'CEO: ' : 'Chief of Staff: ') + m.text).join('\n');
      const sys = 'You are the Chief of Staff of Cyborg Cheebee Office. Speak directly to the CEO, be concise and useful.';
      const ctx = 'Company memory:\n' + (state.memory || '(none)') +
        '\n\nAgent outputs:\n' + Object.keys(state.outputs).map(k => k + ': ' + String(state.outputs[k]).slice(0, 500)).join('\n') +
        '\n\nTasks: ' + state.tasks.filter(t => t.status !== 'done').map(t => t.title + ' (' + t.status + ')').join('; ') +
        '\n\nConversation:\n' + history;
      try {
        const answer = await callAI(sys, ctx, 800);
        state.chat.push({ role: 'assistant', text: answer, t: Date.now(), provider: lastReply && lastReply.provider });
        saveStateNow();
        return sendJSON(res, 200, { ok: true, answer, provider: lastReply && lastReply.provider });
      } catch (e) {
        return sendJSON(res, 200, { ok: false, error: e.message });
      }
    }
    if (p === '/api/chat/clear' && req.method === 'POST') {
      state.chat = []; saveStateNow();
      return sendJSON(res, 200, { ok: true });
    }

    if (p === '/api/config' && req.method === 'POST') {
      const b = await body(req);
      ['niche', 'style', 'mission'].forEach(k => { if (typeof b[k] === 'string') state.config[k] = b[k]; });
      ['clips', 'slots'].forEach(k => { if (Array.isArray(b[k])) state.config[k] = b[k].filter(Boolean).slice(0, 10); });
      if (Array.isArray(b.sources)) {
        state.sources = b.sources.map(s => String(s).trim()).filter(Boolean).slice(0, 6);
        state.config.sources = state.sources;
      }
      saveConfig();
      log('Company profile updated', 'system');
      return sendJSON(res, 200, { ok: true, config: state.config });
    }

    if (p === '/api/products' && req.method === 'GET') return sendJSON(res, 200, { products: state.products });
    if (p === '/api/products' && req.method === 'POST') {
      const b = await body(req);
      const raw = Array.isArray(b.urls) ? b.urls : String(b.urls || '').split(/\s+/);
      let added = 0;
      raw.map(s => String(s).trim()).filter(Boolean).slice(0, 20).forEach(u => {
        if (!state.products.some(x => x.url === u)) {
          state.products.push({
            id: 'p' + Date.now() + '-' + added, url: u, title: '', description: '',
            status: 'queued', output: '', replyId: '', provider: '', createdAt: Date.now()
          });
          added++;
        }
      });
      saveStateNow();
      log('Added ' + added + ' product link(s)', 'CEO');
      return sendJSON(res, 200, { ok: true, added, products: state.products });
    }
    if (p === '/api/product/delete' && req.method === 'POST') {
      const b = await body(req);
      const i = state.products.findIndex(x => x.id === b.id);
      if (i >= 0) state.products.splice(i, 1);
      saveStateNow();
      return sendJSON(res, 200, { ok: true, products: state.products });
    }
    if (p === '/api/product/run' && req.method === 'POST') {
      const b = await body(req);
      let targets = [];
      if (b.all) targets = state.products.filter(x => x.status !== 'done');
      else { const pr = state.products.find(x => x.id === b.id); if (pr) targets = [pr]; }
      if (!targets.length) return sendJSON(res, 200, { ok: false, error: 'No products to run' });
      const out = [];
      for (const pr of targets) {
        if (state.stopped) break;
        out.push(await runProduct(pr));
        if (settings().provider === 'coarena') await sleep(800);
      }
      return sendJSON(res, 200, { ok: true, products: state.products, results: out.map(r => ({ id: r.id, status: r.status, title: r.title })) });
    }

    if (p === '/api/conversation' && req.method === 'POST') {
      const b = await body(req);
      try { return sendJSON(res, 200, { ok: true, conversation: await generateConversation(Array.isArray(b.agents) ? b.agents : null) }); }
      catch (e) { return sendJSON(res, 200, { ok: false, error: e.message }); }
    }

    if (p === '/api/agent' && req.method === 'POST') {
      const b = await body(req);
      const id = String(b.id || '');
      if (!AGENT_META.some(a => a.id === id)) return sendJSON(res, 400, { ok: false, error: 'Unknown agent' });
      try {
        state.outputs[id] = await runAgent(id);
        log(BOT_NAMES[id] + ' finished', id);
        return sendJSON(res, 200, { ok: true, id, output: state.outputs[id] });
      } catch (e) {
        return sendJSON(res, 200, { ok: false, id, error: e.message });
      }
    }

    if (p === '/api/agents' && req.method === 'GET') return sendJSON(res, 200, { agents: AGENT_META });

    if (p === '/api/routines' && req.method === 'GET') return sendJSON(res, 200, { routines: state.routines });
    if (p === '/api/routines' && req.method === 'POST') {
      const b = await body(req);
      if (Array.isArray(b.routines)) {
        state.routines = b.routines.slice(0, 12).map(r => ({
          id: String(r.id || ('r-' + Date.now())),
          agent: String(r.agent || 'mgr'),
          name: String(r.name || 'Unnamed routine'),
          minutes: Math.max(1, Number(r.minutes) || 60),
          enabled: !!r.enabled,
          lastRun: Number(r.lastRun) || 0,
          runs: Number(r.runs) || 0
        }));
        saveRoutines();
        log('Routines updated (' + state.routines.filter(r => r.enabled).length + ' active)', 'CEO');
      }
      return sendJSON(res, 200, { ok: true, routines: state.routines });
    }
    if (p === '/api/routine/run' && req.method === 'POST') {
      const b = await body(req);
      const r = await runRoutine(String(b.id || ''), true);
      return sendJSON(res, 200, r);
    }

    if (p === '/api/layout' && req.method === 'GET') return sendJSON(res, 200, { layout: state.layout });
    if (p === '/api/layout' && req.method === 'POST') {
      const b = await body(req);
      if (b.layout && Array.isArray(b.layout.rooms)) {
        state.layout = b.layout;
        saveLayout();
        log('HQ layout saved', 'CEO');
      }
      return sendJSON(res, 200, { ok: true, layout: state.layout });
    }
    if (p === '/api/layout/reset' && req.method === 'POST') {
      state.layout = defaultLayout();
      saveLayout();
      log('HQ layout reset to default', 'CEO');
      return sendJSON(res, 200, { ok: true, layout: state.layout });
    }

    if (p === '/api/run-all' && req.method === 'POST') return sendJSON(res, 200, await runAll());

    if (p === '/api/ceo/order' && req.method === 'POST') {
      const b = await body(req);
      const order = String(b.order || '').trim();
      if (!order) return sendJSON(res, 400, { ok: false, error: 'Order is empty' });
      try { return sendJSON(res, 200, { ok: true, tasks: await planOrder(order) }); }
      catch (e) { return sendJSON(res, 200, { ok: false, error: e.message }); }
    }

    if (p === '/api/tasks/run' && req.method === 'POST') return sendJSON(res, 200, await runTasks());

    if (p === '/api/tasks/decision' && req.method === 'POST') {
      const b = await body(req);
      const t = state.tasks[Number(b.index)];
      if (!t) return sendJSON(res, 400, { ok: false });
      if (b.approve) { t.approved = true; t.status = 'queued'; log('Approved: ' + t.title, 'CEO'); }
      else { t.status = 'rejected'; log('Rejected: ' + t.title, 'CEO'); }
      return sendJSON(res, 200, { ok: true, tasks: state.tasks });
    }

    if (p === '/api/tasks/retry' && req.method === 'POST') {
      const b = await body(req);
      const t = state.tasks[Number(b.index)];
      if (t) { t.status = 'queued'; t.note = ''; }
      return sendJSON(res, 200, { ok: true, tasks: state.tasks });
    }

    if (p === '/api/stop' && req.method === 'POST') {
      state.stopped = !state.stopped;
      log(state.stopped ? 'EMERGENCY STOP - all work halted' : 'Resumed', 'CEO');
      return sendJSON(res, 200, { ok: true, stopped: state.stopped });
    }

    if (p === '/api/reset' && req.method === 'POST') {
      state.outputs = {}; state.tasks = []; state.replyIds = {};
      log('Outputs and tasks cleared', 'system');
      return sendJSON(res, 200, { ok: true });
    }

    // Rate a Coarena reply: {"agent":"seo","rating":"up","tags":["helpful"],"note":"..."}
    if (p === '/api/feedback' && req.method === 'POST') {
      const b = await body(req);
      const agent = String(b.agent || '');
      const rid = state.replyIds[agent] || String(b.request_id || '');
      if (!rid) return sendJSON(res, 400, { ok: false, error: 'No reply found to rate' });
      const prov = state.replyProviders[agent] || settings().provider;
      const payload = { request_id: rid, rating: b.rating === 'down' || b.rating === 'bad' || b.rating === '-1' ? 'down' : 'up' };
      if (Array.isArray(b.tags)) payload.tags = b.tags.slice(0, 8);
      if (typeof b.note === 'string') payload.note = b.note.slice(0, 2000);
      if (prov !== 'coarena') {
        log('Rated ' + agent + ' reply locally (' + prov + '): ' + payload.rating, 'CEO');
        return sendJSON(res, 200, { ok: true, local: true, result: { provider: prov, rating: payload.rating } });
      }
      try {
        const cfg = providerCfg('coarena', settings());
        const fr = await fetch('https://coarena.ai/api/v1/feedback', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + cfg.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const ft = await fr.text();
        let fj; try { fj = JSON.parse(ft); } catch (e) { fj = { raw: ft.slice(0, 200) }; }
        if (!fr.ok) return sendJSON(res, 200, { ok: false, error: fj.error?.message || ('HTTP ' + fr.status) });
        log('Rated ' + agent + ' reply: ' + payload.rating, 'CEO');
        return sendJSON(res, 200, { ok: true, result: fj });
      } catch (e) {
        return sendJSON(res, 200, { ok: false, error: e.message });
      }
    }

    /* static files */
    let file = p === '/' ? '/index.html' : p;
    file = file.replace(/\.\./g, '');
    const full = path.join(PUBLIC, file);
    if (!full.startsWith(PUBLIC)) return sendJSON(res, 403, { error: 'Forbidden' });
    fs.readFile(full, (err, data) => {
      if (err) return send(res, 404, 'Not found', 'text/plain');
      send(res, 200, data, MIME[path.extname(full)] || 'application/octet-stream');
    });
  } catch (e) {
    console.error(e);
    sendJSON(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log('AI Agents Office running at http://localhost:' + PORT);
  console.log('API key configured:', !!settings().apiKey);
});
