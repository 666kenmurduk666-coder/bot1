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
const crypto = require('crypto');
const zlib = require('zlib');
const os = require('os');
const childProcess = require('child_process');
const {promisify} = require('util');
const execFileAsync = promisify(childProcess.execFile);
// Optional Crawl4AI research service. Fails soft: the original regex scrapers
// remain the fallback when this module/service is unavailable.
const researchClient = require('./research-client');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const SETTINGS_FILE = path.join(DATA, 'settings.json');
// P1: credentials live here (mode 0600), never in settings.json or browser state.
const SECRETS_FILE = path.join(DATA, 'secrets.json');
const CONFIG_FILE = path.join(DATA, 'config.json');
const ROUTINES_FILE = path.join(DATA, 'routines.json');
const LAYOUT_FILE = path.join(DATA, 'layout.json');
const STATE_FILE = path.join(DATA, 'state.json');
const BACKUP_DIR = path.join(DATA, 'backups');
const AUDIT_FILE = path.join(DATA, 'audit.jsonl');
// 🎬 Video Factory (Remotion) — renderer lives in its own folder so npm deps stay isolated.
const VIDEO_DIR = path.join(PUBLIC, 'videos');
const VIDEO_RENDERER = path.join(ROOT, 'video', 'render.js');
const VIDEO_WORK = path.join(ROOT, 'video');
const APP_VERSION = 'Phase D v8 — Layout Upgrade & Operations Foundation';
const STARTED_AT = Date.now();
const PORT = Number(process.env.PORT || 8787);

// P1: CEO-gated research control accepts NO user path — only these fixed scripts.
const RESEARCH_SCRIPTS = Object.freeze({
  start: path.join(ROOT, 'START-RESEARCH.bat'),
  stop: path.join(ROOT, 'STOP-RESEARCH.bat')
});
function controlResearch(action) {
  const file = RESEARCH_SCRIPTS[action];
  if (!file || !fs.existsSync(file)) return Promise.resolve({ ok: false, error: 'Fixed script missing: ' + action });
  return new Promise(resolve => {
    const cp = childProcess.spawn('cmd.exe', ['/d', '/c', 'start', '""', '/b', '"' + file + '"'],
      { cwd: ROOT, detached: true, stdio: 'ignore', windowsHide: true });
    cp.once('error', e => resolve({ ok: false, error: e.message }));
    cp.once('spawn', () => resolve({ ok: true, action }));
  });
}

/* ---------- P0: build identity + drift detection ---------- */
const SERVER_FILE = path.join(ROOT, 'server.js');
const QUOTA_FILE = path.join(DATA, 'quota-status.json');
function fileSHA256(file) {
  try { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
  catch (_) { return ''; }
}
function fileMtime(file) {
  try { return fs.statSync(file).mtimeMs; } catch (_) { return 0; }
}
// Snapshot taken at load time: this is the code that is ACTUALLY running.
const SERVER_SOURCE = (() => { try { return fs.readFileSync(SERVER_FILE, 'utf8'); } catch (_) { return ''; } })();
const SERVER_HASH_AT_START = fileSHA256(SERVER_FILE);
const SETTINGS_MTIME_AT_START = fileMtime(SETTINGS_FILE);
const CRITICAL_ROUTES = ['/api/health', '/api/state', '/api/routines', '/api/tasks/run', '/api/ceo/research', '/api/unlock'];
function routeSelfTest() {
  const out = {};
  for (const r of CRITICAL_ROUTES) out[r] = SERVER_SOURCE.indexOf("'" + r + "'") >= 0;
  return out;
}

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });

/* ---------- persistence ---------- */
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function secrets() {
  const s = readJSON(SECRETS_FILE, {});
  return s && typeof s === 'object' && !Array.isArray(s) ? s : {};
}
// Settings readable by the runtime = plain settings + separated secrets.
function readSettingsMerged() {
  return Object.assign({}, readJSON(SETTINGS_FILE, {}), secrets());
}
function writeJSON(file, obj) {
  // Atomic replace: a crash during serialization/write must not truncate the last good file.
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = file + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
  const fd = fs.openSync(tmp, 'wx', 0o600);
  try {
    fs.writeFileSync(fd, JSON.stringify(obj, null, 2));
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  try { fs.renameSync(tmp, file); }
  catch (e) { try { fs.unlinkSync(tmp); } catch (_) {} throw e; }
}
function settings() {
  const disk = readSettingsMerged();
  const keys = disk.keys || {};
  if (!keys.coarena && process.env.COARENA_API_KEY) keys.coarena = { apiKey: process.env.COARENA_API_KEY };
  if (!keys.groq && process.env.GROQ_API_KEY) keys.groq = { apiKey: process.env.GROQ_API_KEY };
  const apiKey = disk.apiKey || process.env.OPENROUTER_API_KEY
    || (keys.coarena && keys.coarena.apiKey) || (keys.groq && keys.groq.apiKey) || '';
  let provider = disk.provider || process.env.AI_PROVIDER || 'auto';
  if (provider === 'auto') {
    provider = apiKey.startsWith('sk-or-') ? 'openrouter'
      : apiKey.startsWith('coa_') ? 'coarena'
      : apiKey.startsWith('gsk_') ? 'groq' : 'openai';
  }
  const defaults = {
    openrouter: 'openai/gpt-4o-mini', coarena: 'gemini-3-8-flash',
    groq: 'qwen/qwen3.8-27b', openai: 'gpt-4o-mini'
  };
  return {
    apiKey,
    provider,
    model: disk.model || process.env.AI_MODEL || defaults[provider] || 'gpt-4o-mini',
    baseUrl: disk.baseUrl || process.env.AI_BASE_URL || '',
    keys: keys,
    failover: Array.isArray(disk.failover) && disk.failover.length ? disk.failover : (keys.groq && keys.groq.apiKey ? ['groq'] : [])
  };
}

const state = {
  config: Object.assign({
    niche: 'content creation tips',
    style: 'short, friendly, hook first',
    clips: ['hook-01', 'review-02', 'unbox-03'],
    slots: ['Mon 12:00 PM', 'Tue 6:00 PM', 'Wed 8:00 PM'],
    mission: '',
    // 🛍️ Shopee affiliate links — pampublikong links, ligtas na nasa defaults
    // (napipisan kahit burahin ng Render ang data/ sa bawat redeploy).
    affiliateLink: 'https://s.shopee.ph/4qHInvI4s9',
    shopeeLinks: [
      'https://s.shopee.ph/4qHInvI4s9', 'https://s.shopee.ph/4B1c0iOKua',
      'https://s.shopee.ph/5Au9CZTt5Q', 'https://s.shopee.ph/9pfylBkeIk',
      'https://s.shopee.ph/AKcFM7dwSQ', 'https://s.shopee.ph/40iBoVic9m',
      'https://s.shopee.ph/1BO0RJcMPp', 'https://s.shopee.ph/5Au9CgNLbK',
      'https://s.shopee.ph/AAIp9tY9om', 'https://s.shopee.ph/1BO0RN5fhB',
      'https://s.shopee.ph/4VeSPVSSFA', 'https://s.shopee.ph/5fqPngwTJC'
    ],
    platform: 'Instagram Reels', language: 'Taglish'
  }, readJSON(CONFIG_FILE, {})),
  outputs: {},
  replyIds: {},
  tasks: [],
  activity: [],
  stopped: false,
  running: false,
  agentHealth: {},
  // P2 governance: CEO approvals, manual publishes and separated finance records.
  approvalLog: [], publishLedger: [],
  // Office liveness: AI-proposed "shift" tasks wait here until the CEO approves them.
  // Proposals never auto-enqueue and never post/send anything on their own.
  shiftProposals: [],
  ledger: { confirmed: [], pending: [], reversed: [] }
};

function defaultLayout() {
  return { rooms: [
    { id:'hq', name:'PIXEL OFFICE 🏢', w:20, h:14, floor:'hq', items:[
      // maayos na hanay ng workstations (Pixel-style: kaliwang bahagi)
      {id:'pw1',type:'desk',a:1,b:2,label:'Dev'},
      {id:'pw2',type:'desk',a:3.5,b:2,label:'Editor'},
      {id:'pw3',type:'desk',a:6,b:2,label:'Revise'},
      {id:'pw4',type:'desk',a:8.5,b:2,label:'SEO'},
      {id:'pw5',type:'desk',a:1,b:5,label:'Research'},
      {id:'pw6',type:'desk',a:3.5,b:5,label:'Writer'},
      {id:'pw7',type:'desk',a:6,b:5,label:'Scheduler'},
      {id:'pw8',type:'desk',a:8.5,b:5,label:'Posting'},
      {id:'pwb',type:'whiteboard',a:1,b:.4,label:'Sprint board'},
      {id:'pbk',type:'bookshelf',a:8.5,b:.4,label:'Library'},
      // lounge corner (kanan: sofa + coffee + halaman)
      {id:'ps1',type:'sofa',a:13,b:2,label:''},
      {id:'ps2',type:'sofa',a:16,b:2,label:''},
      {id:'pct',type:'coffee',a:14.5,b:4,label:''},
      {id:'pbb1',type:'beanbag',a:12,b:5,label:''},
      {id:'pbb2',type:'beanbag',a:18,b:5,label:''},
      {id:'pp1',type:'plant',a:11.5,b:1,label:''},
      {id:'pp2',type:'plant',a:19,b:1,label:''},
      {id:'pp3',type:'plant',a:11.5,b:12.5,label:''},
      // core, CEO, servers, entry
      {id:'pholo',type:'holo',a:10,b:8,label:'Core'},
      {id:'pceo',type:'ceo_desk',a:15,b:10,label:'CEO'},
      {id:'psrv',type:'server',a:18.5,b:10,label:'Servers'},
      {id:'pport',type:'portal',a:10,b:13,label:'Entry'},
      {id:'pn1',type:'neon',a:3,b:8,label:''},
      {id:'pn2',type:'neon',a:8,b:8,label:''}
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
    ]},
    { id:'meeting', name:'MEETING ROOM 🧠', w:12, h:9, floor:'conf', items:[
      {id:'mt1',type:'table',a:3,b:3,label:''},
      {id:'mt2',type:'table',a:5.5,b:3,label:''},
      {id:'mt3',type:'table',a:8,b:3,label:''},
      {id:'mc1',type:'chair',a:3,b:1.5,label:''},
      {id:'mc2',type:'chair',a:5.5,b:1.5,label:''},
      {id:'mc3',type:'chair',a:8,b:1.5,label:''},
      {id:'mc4',type:'chair',a:3,b:5,label:''},
      {id:'mc5',type:'chair',a:5.5,b:5,label:''},
      {id:'mc6',type:'chair',a:8,b:5,label:''},
      {id:'mwb',type:'whiteboard',a:4.5,b:.2,label:'Agenda'},
      {id:'mmon',type:'monitor',a:9,b:.4,label:'Dashboard'},
      {id:'mbk',type:'bookshelf',a:.4,b:4,label:'Notes'},
      {id:'mpl',type:'plant',a:10.5,b:7.5,label:''}
    ]},
    { id:'court', name:'COURT 🏀', w:14, h:10, floor:'fun', items:[
      {id:'cf',type:'court',a:.5,b:.5,label:'Court A'},
      {id:'ch1',type:'hoop',a:1.2,b:5,label:''},
      {id:'ch2',type:'hoop',a:12.6,b:5,label:''},
      {id:'cb1',type:'bench',a:5,b:.2,label:'Team A'},
      {id:'cb2',type:'bench',a:9,b:.2,label:'Team B'},
      {id:'cm',type:'monitor',a:6.5,b:.2,label:'Score'},
      {id:'cp1',type:'plant',a:.5,b:9,label:''},
      {id:'cp2',type:'plant',a:13,b:9,label:''}
    ]},
    { id:'gym', name:'GYM 💪', w:12, h:9, floor:'fun', items:[
      {id:'gt1',type:'treadmill',a:1,b:1,label:'Tread 1'},
      {id:'gt2',type:'treadmill',a:3,b:1,label:'Tread 2'},
      {id:'gt3',type:'treadmill',a:5,b:1,label:'Tread 3'},
      {id:'gw1',type:'weights',a:1,b:4,label:'Dumbbells'},
      {id:'gw2',type:'weights',a:3.5,b:4,label:'Rack'},
      {id:'gb1',type:'bench',a:6,b:4,label:'Bench'},
      {id:'gb2',type:'bench',a:8.5,b:4,label:'Bench 2'},
      {id:'gma',type:'monitor',a:10,b:1,label:'TV'},
      {id:'gp1',type:'plant',a:11,b:7.5,label:''},
      {id:'gp2',type:'plant',a:.5,b:7.5,label:''}
    ]}
  ]};
}
const DEFAULT_ROUTINES = [
  {id:'r-cos',agent:'cos',name:'Chief of Staff - plan the day',minutes:30,enabled:true,lastRun:0,runs:0},
  {id:'r-mgr',agent:'mgr',name:'Manager status report',minutes:60,enabled:true,lastRun:0,runs:0},
  {id:'r-out',agent:'outreach',name:'Client outreach drafts',minutes:120,enabled:false,lastRun:0,runs:0},
  {id:'r-scr',agent:'scraper',name:'Community resource scan',minutes:180,enabled:false,lastRun:0,runs:0},
  {id:'r-soc',agent:'social',name:'Social media check-in',minutes:240,enabled:false,lastRun:0,runs:0},
  {id:'r-prod',agent:'product',name:'Product video batch',minutes:180,enabled:false,lastRun:0,runs:0},
  {id:'r-joke',agent:'joker',name:'Jester — daily jokes',minutes:360,enabled:false,lastRun:0,runs:0},
  {id:'r-conv',agent:'cos',name:'Watercooler conversations',minutes:45,enabled:false,lastRun:0,runs:0},
  {id:'r-fix',agent:'fixer',name:'Office Fixer — health check',minutes:120,enabled:false,lastRun:0,runs:0},
  {id:'r-recap-weekly',agent:'cos',name:'Weekly recap video (Mon 8AM)',minutes:10080,enabled:true,lastRun:0,runs:0,weekday:1,hour:8,tz:'Asia/Manila',fn:'weeklyRecap'}
];
const savedRoutines = readJSON(ROUTINES_FILE, null);
state.routines = Array.isArray(savedRoutines) ? savedRoutines.slice() : DEFAULT_ROUTINES.slice();
DEFAULT_ROUTINES.forEach(d => { if (!state.routines.some(r => r.id === d.id)) state.routines.push(d); });
state.layout = readJSON(LAYOUT_FILE, null) || defaultLayout();
// 🔄 Pixel-style layout migration: idagdag ang bagong rooms kahit may lumang saved layout.
// Hindi binubura ang custom layout — idinadagdag lang ang kulang, at i-u-update ang HQ kung halatang old default pa ito.
(function migratePixelLayout(){
  try {
    const fresh = defaultLayout();
    (fresh.rooms || []).forEach(fr => {
      const cur = (state.layout.rooms || []).find(r => r.id === fr.id);
      if (!cur) { state.layout.rooms.push(fr); return; }
      if (fr.id === 'hq' && (cur.items || []).some(it => it.id === 'd1' || it.id === 'core')
          && !(cur.items || []).some(it => it.id === 'pw1')) {
        cur.w = fr.w; cur.h = fr.h; cur.name = fr.name; cur.items = fr.items;
      }
    });
  } catch (e) { console.warn('Pixel layout migrate skipped:', e.message); }
})();
state.sources = Array.isArray(state.config.sources) ? state.config.sources : [];

// Restore volatile-looking state from disk so restarts keep history.
const savedState = readJSON(STATE_FILE, null) || {};
if (savedState.agentHealth && typeof savedState.agentHealth === 'object') state.agentHealth = savedState.agentHealth;
if (Array.isArray(savedState.approvalLog)) state.approvalLog = savedState.approvalLog.slice(-300);
if (Array.isArray(savedState.publishLedger)) state.publishLedger = savedState.publishLedger.slice(-300);
if (Array.isArray(savedState.shiftProposals)) state.shiftProposals = savedState.shiftProposals.slice(-60);
if (savedState.ledger && typeof savedState.ledger === 'object') {
  state.ledger = {
    confirmed: Array.isArray(savedState.ledger.confirmed) ? savedState.ledger.confirmed.slice(-300) : [],
    pending: Array.isArray(savedState.ledger.pending) ? savedState.ledger.pending.slice(-300) : [],
    reversed: Array.isArray(savedState.ledger.reversed) ? savedState.ledger.reversed.slice(-300) : []
  };
}
state.outputs = savedState.outputs || {};
state.replyIds = savedState.replyIds || {};
state.replyProviders = savedState.replyProviders || {};
state.tasks = Array.isArray(savedState.tasks) ? savedState.tasks : [];
state.activity = Array.isArray(savedState.activity) ? savedState.activity : [];
state.memory = typeof savedState.memory === 'string' ? savedState.memory : '';
state.chat = Array.isArray(savedState.chat) ? savedState.chat : [];
state.products = Array.isArray(savedState.products) ? savedState.products : [];
state.conversations = Array.isArray(savedState.conversations) ? savedState.conversations : [];
// 🧩 CONTENT PIPELINE: ideas + scripts ng Scout/Writer (bound ang history).
state.contentPipeline = Array.isArray(savedState.contentPipeline) ? savedState.contentPipeline.slice(0, 30) : [];
// CYBORG MALL: mga paninda (Shopee affiliate) + orders ng mga bisita
state.mall = Array.isArray(savedState.mall) ? savedState.mall : [];
state.orders = Array.isArray(savedState.orders) ? savedState.orders.slice(-200) : [];
// 🏦 KEEPER: vault ng account links (walang password — links lang, para safe!)
state.accounts = Array.isArray(savedState.accounts) ? savedState.accounts : [];
// 👔 HIRING: mga bagong bot na in-hire (FB applicants) — persisted!
state.hires = Array.isArray(savedState.hires) ? savedState.hires : [];
// 🛒 CYBORG BAZAAR: Facebook visitor profiles (coins, XP, daily tasks, desk pod)
state.visitors = (savedState.visitors && typeof savedState.visitors === 'object' && !Array.isArray(savedState.visitors)) ? savedState.visitors : {};
// Stable cookie signing key: must survive Render restarts / redeploys,
// otherwise every visitor login cookie becomes invalid on restart.
// Cookie-signing key: never hard-code a forgeable value in source control.
// Keep the generated key in state.json so visitor sessions survive normal restarts.
const LEGACY_BAZAAR_SECRET = 'cyborg-bz-stable-v1';
state.bazaarSecret = String(process.env.BAZAAR_COOKIE_SECRET || savedState.bazaarSecret || '');
if (!state.bazaarSecret || state.bazaarSecret === LEGACY_BAZAAR_SECRET || state.bazaarSecret.length < 32) {
  state.bazaarSecret = crypto.randomBytes(32).toString('hex');
  console.warn('SECURITY: generated a new Bazaar cookie signing key; existing visitor cookies must log in again.');
  // saveStateNow is declared below; persist after its declaration during startup.
  state._needsBazaarSecretSave = true;
}
// 📣 Share attribution + office earnings mula sa trabaho ng mga bisita
state.bazaarShares = Array.isArray(savedState.bazaarShares) ? savedState.bazaarShares.slice(-300) : [];
// 💰 5% assumed affiliate commission; progressibong hatian sa visitor ayon sa level
const BAZAAR_COMMISSION_RATE = 0.05;
const LEVEL_CUT = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35];
// 💼 Sponsored daily tasks: may pumopondong ad budget sa bawat task kaya hindi malugi ang office
const TASK_SPONSOR_RATE = 3;            // ₱3 bawat reward ng task (pinakamataas na task = 🪙25 = ₱2.5)
const TASK_BONUS_SPONSOR_RATE = 6;      // ₱6 sa daily completion bonus (🪙30 = ₱3)
const CAMPAIGN_MARGIN = 1.5;            // advertiser pays 1.5x ng binabayad sa visitor
state.bazaarStats = Object.assign({ shares: 0, clicks: 0, orders: 0, gross: 0, visitorPaid: 0, officeNet: 0, earned: 0, taskRevenue: 0, taskSponsorSpent: 0, adRevenue: 0 }, savedState.bazaarStats || {});
// 📢 AD PROJECTS + INSTANT PAYOUTS
const PAYOUT_TOKENS_PER_PESO = 10;      // 🪙10 = ₱1 cash-out (CEO-adjustable)
const MIN_PAYOUT_TOKENS = 200;          // minimum withdrawal
// 🎁 Goods redemption: mas mababang tokens kaysa cash — mas mainam kaysa mag-cash out
const GOODS_TOKENS_PER_PESO = 10;       // 🪙10 = ₱1 — pareho sa cash, walang loss sa redemption
const SHIPPING_STAGES = [
  { id: 'queued', label: 'Queued', where: 'Office Delivery Dock', icon: '📦' },
  { id: 'packed', label: 'Packed / Na-order', where: 'Office Delivery Dock', icon: '📦' },
  { id: 'shipped', label: 'Shipped', where: 'Courier Hub', icon: '🚚' },
  { id: 'out', label: 'Out for delivery', where: 'On the route', icon: '🛵' },
  { id: 'delivered', label: 'Delivered', where: 'Visitor office pod', icon: '✅' }
];
const SHIPPING_NAV = [
  { id: 'dock', name: 'Office Delivery Dock', x: 19.5, z: 7.55 },
  { id: 'hub', name: 'Courier Hub', x: 11.5, z: 7.2 },
  { id: 'route', name: 'Out for Delivery', x: 16, z: 7.2 },
  { id: 'pod', name: 'Visitor Pod', x: 20.2, z: 12.4 }
];
function setShipping(rd, stage, note, courier) {
  const st = SHIPPING_STAGES.find(s => s.id === stage) || SHIPPING_STAGES[0];
  rd.shipping = rd.shipping || { history: [] };
  rd.shipping.stage = st.id;
  rd.shipping.where = st.where;
  rd.shipping.at = Date.now();
  rd.shipping.note = cleanTxt(note || st.label).slice(0, 120);
  if (courier) rd.shipping.courier = cleanTxt(courier).slice(0, 60);
  rd.shipping.history = rd.shipping.history || [];
  rd.shipping.history.push({ stage: st.id, at: Date.now(), note: rd.shipping.note });
}
const redemptionItems = () => {
  const affiliate = (needle, fallback) => {
    const m = (state.mall || []).find(x => String(x.name || '').toLowerCase().includes(needle));
    return (m && /^https?:\/\//i.test(String(m.url || ''))) ? String(m.url) : fallback;
  };
  const defs = [
    { id: 'g-rice1', name: 'Bigas 1kg', price: 69, emoji: '🍚', desc: 'Bigas para sa pang-araw-araw — order through our affiliate Shopee link.' },
    { id: 'g-rice5', name: 'Bigas 5kg', price: 299, emoji: '🍚', desc: '5kg na bigas, de-kalidad at sulit para sa pamilya.' },
    { id: 'g-sack', name: 'Bigas 1 Sako (25kg)', price: 1450, emoji: '🌾', desc: 'Buong sako ng bigas — malaking tulong para sa bahay.' }
  ];
  return defs.map(d => Object.assign({}, d, {
    tokens: Math.round(d.price * GOODS_TOKENS_PER_PESO),
    url: affiliate(d.name.toLowerCase().split(' ')[0], 'https://shopee.ph/search?keyword=' + encodeURIComponent(d.name))
  }));
};
const defaultCampaigns = () => [
  { id: 'c-shopee', name: 'Shopee Grocery Deals', network: 'Shopee', url: 'https://shopee.ph/search?keyword=grocery', desc: 'Mag-share ng grocery deals — qualified clicks ang binabayaran.', rate: 0.05, perShare: 20, budget: 2000, spent: 0, status: 'active', createdAt: Date.now() },
  { id: 'c-lazada', name: 'Lazada Everyday Deals', network: 'Lazada', url: 'https://www.lazada.com.ph/', desc: 'I-share ang Lazada deals sa FB timeline.', rate: 0.04, perShare: 20, budget: 1500, spent: 0, status: 'active', createdAt: Date.now() },
  { id: 'c-tiktok', name: 'TikTok Shop Finds', network: 'TikTok Shop', url: 'https://www.tiktok.com/shop', desc: 'I-share ang trending products.', rate: 0.04, perShare: 15, budget: 1000, spent: 0, status: 'active', createdAt: Date.now() },
  { id: 'c-content', name: 'Cyborg Office Content', network: 'Own Content', url: '/?bazaar=1', desc: 'I-share ang content ng opisina natin.', rate: 0.05, perShare: 25, budget: 1000, spent: 0, status: 'active', createdAt: Date.now() }
];
state.campaigns = Array.isArray(savedState.campaigns) ? savedState.campaigns : defaultCampaigns();
state.payouts = Array.isArray(savedState.payouts) ? savedState.payouts.slice(-300) : [];
state.redemptions = Array.isArray(savedState.redemptions) ? savedState.redemptions.slice(-300) : [];
// 🎬 Bot-hosted office commercials (CEO-made, visitor-shareable)
state.commercials = Array.isArray(savedState.commercials) ? savedState.commercials.slice(-60) : [];
// 📊 Shopee stall analytics — visitor-exempt tracking, CEO-only viewing
state.shopAnalytics = Array.isArray(savedState.shopAnalytics) ? savedState.shopAnalytics.slice(-1200) : [];
// 🎤 Event Stage auto-show settings (CEO-adjustable, server-time driven)
state.eventShow = Object.assign({ enabled: true, intervalMin: 5 }, savedState.eventShow || {});
function fundFromCampaigns(amount) {
  let need = Math.max(0, Number(amount) || 0), funded = 0;
  for (const c of state.campaigns) {
    if (need <= 0) break;
    if (c.status !== 'active') continue;
    const left = (Number(c.budget) || 0) - (Number(c.spent) || 0);
    if (left <= 0) continue;
    const take = Math.min(left, need);
    c.spent = Math.round(((Number(c.spent) || 0) + take) * 100) / 100;
    c.shares = (c.shares || 0); // unchanged; sponsor impression lang ito
    funded += take; need -= take;
  }
  if (need > 0) return 0;
  funded = Math.round(funded * 100) / 100;
  state.bazaarStats.taskRevenue = Math.round(((state.bazaarStats.taskRevenue || 0) + funded) * 100) / 100;
  state.bazaarStats.taskSponsorSpent = Math.round(((state.bazaarStats.taskSponsorSpent || 0) + funded) * 100) / 100;
  state.bazaarStats.officeNet = Math.round(((state.bazaarStats.officeNet || 0) + funded) * 100) / 100;
  state.bazaarStats.earned = state.bazaarStats.officeNet;
  return funded;
}

/* 🎬 BOT COMMERCIAL STUDIO — hosts promote the office itself */
const COMMERCIAL_ANGLES = {
  xmas: {
    label: '🎄 Christmas office',
    hook: 'Pumasok sa opisinang may Pasko, may mga bot, at may trabahong tunay!',
    beats: ['Kita ang Christmas tree, ilaw, at snow sa loob ng HQ.', 'May bazaar, daily tasks, at sariling office pod ang bawat bisita.', 'Walang laban, walang utos — kumikita sa trabaho at affiliate share.'],
    caption: '🎄 Pasko na sa Cyborg Office! Holiday office tour + bots + affiliate work — subukan mo ang HQ ngayong Pasko.'
  },
  tour: {
    label: '🏢 Office tour',
    hook: 'Hindi ito larawan lang — may buong opisina ang mga AI agents!',
    beats: ['Lakaran ang CEO office, open work, conference, pantry, at server bay.', 'Pindutin ang E para makipag-usap sa bots at makipag-share ng produkto.', 'Pwede kang mag-check in, gumawa ng tasks, at mag-build ng pod.'],
    caption: '🏢 Welcome sa Cyborg Office! Walkable 3D HQ, bot talents, at business-only quests — libreng subukan.'
  },
  tasks: {
    label: '🪙 Daily tasks',
    hook: 'May trabaho, may tokens, may XP — walang pawis na cash-out.',
    beats: ['Check-in, bisitahin ang stalls, basahin ang posts, kausapin ang bots.', 'Bawat tapos na task ay may sponsor kaya kumikita rin ang office.', 'Gamitin ang tokens para sa bigas at affiliate products — walang cash payout.'],
    caption: '🪙 Kumita sa daily tasks sa Cyborg Office. Tokens → affiliate goods lang, walang cash payout.'
  },
  bazaar: {
    label: '🛒 Bazaar',
    hook: 'May mall tayo sa loob ng opisina — at may tracking link para sa iyo.',
    beats: ['Pumunta sa 2F mall at pindutin ang E sa bawat stall.', 'Bumasa ng product post bago mag-share — Shopee-compliant.', 'Kapag may order, kumikita ang office at may commission ka ayon sa level.'],
    caption: '🛒 Cyborg Bazaar: basahin, i-share, kumita. Real affiliate work sa loob ng 3D office.'
  },
  product: {
    label: '⚡ Shopee drop',
    hook: 'Bagong Shopee affiliate drop — kukunin agad ng bots at ilalagay sa opisina!',
    beats: ['Pangalan, presyo, at deskripsyon muna — hindi lang hubad na link.', 'Ginawa na ng Product Video Bot ang 6-scene package.', 'I-share ng visitors mula sa office; tracked link ang papuntang Shopee.'],
    caption: '⚡ Bagong affiliate drop sa Cyborg Office! Bots ang naghanda ng post at video package — i-share mo lang.'
  }
};
const COMMERCIAL_TALENTS = {
  mgr: { role: 'tour host', style: 'magalang at malinaw' },
  cos: { role: 'chief guide', style: 'maayos at estratehiko' },
  social: { role: 'hype host', style: 'masigla at FB-ready' },
  joker: { role: 'comedy host', style: 'magaan at nakakatawa' },
  outreach: { role: 'welcome host', style: 'mainit sa bagong visitor' },
  seo: { role: 'caption host', style: 'maikli at malakas ang hook' },
  product: { role: 'product walker', style: 'detalyado sa produkto' },
  post: { role: 'premiere host', style: 'parang trailer' }
};
function makeCommercial(b, req) {
  const comTxt = (s, n) => String(s || '').replace(/[<>&"'`]/g, '').trim().slice(0, n || 160);
  const bot = AGENT_META.find(a => a.id === b.bot) || AGENT_META.find(a => a.id === 'mgr');
  const angle = COMMERCIAL_ANGLES[String(b.angle || '')] || COMMERCIAL_ANGLES.xmas;
  const talent = COMMERCIAL_TALENTS[bot.id] || { role: 'office host', style: 'energetic' };
  const officeUrl = /^https?:\/\//i.test(String(b.url || '')) ? String(b.url).slice(0, 500) : (reqOrigin(req) + '/?bazaar=1');
  const title = comTxt(b.title || ('CYBORG OFFICE — ' + angle.label), 90) || 'CYBORG OFFICE';
  const cta = comTxt(b.cta || 'Subukan na! Pindutin ang link, pumasok, at simulan ang daily tasks.', 120);
  const featured = b.featured ? {
    name: comTxt(b.featured.name, 90),
    price: Math.max(0, Math.round(Number(b.featured.price) || 0)),
    url: /^https?:\/\//i.test(String(b.featured.url || '')) ? String(b.featured.url).slice(0, 500) : ''
  } : null;
  const featLine = featured && featured.name
    ? ('🛒 ' + featured.name + (featured.price ? (' — ₱' + featured.price) : '') + '\n' + (featured.url || ''))
    : '';
  const script = [
    '0-3s  [' + bot.i + ' ' + bot.n + '] ' + angle.hook,
    '3-7s  [CAM 1] ' + angle.beats[0],
    '7-11s [CAM 2] ' + (featured && featured.name ? ('Featured: ' + featured.name + ' — ' + angle.beats[1]) : angle.beats[1]),
    '11-16s[CAM 3] ' + angle.beats[2],
    '16-20s[CTA] ' + cta + ' → ' + officeUrl
  ];
  const caption = title + '\n' + angle.caption
    + '\n🎙️ Hosted by ' + bot.i + ' ' + bot.n + ' — ' + talent.role + ' (' + talent.style + ').'
    + (featLine ? ('\n' + featLine) : '')
    + '\n' + cta + '\n👉 ' + officeUrl
    + '\n#CyborgOffice #AIAgents #CyborgBazaar #OfficeTour';
  return {
    id: 'cm' + crypto.randomBytes(4).toString('hex'), bot: bot.id, botName: bot.n, botIcon: bot.i,
    angle: String(b.angle || 'xmas'), title: title, cta: cta, url: officeUrl, featured: featured,
    hook: angle.hook, script: script, caption: caption, status: 'active', shares: 0, at: Date.now()
  };
}

function saveConfig() { writeJSON(CONFIG_FILE, state.config); }
function saveRoutines() { writeJSON(ROUTINES_FILE, state.routines); }
function saveLayout() { writeJSON(LAYOUT_FILE, state.layout); }
let saveTimer = null;
function saveStateNow() {
  writeJSON(STATE_FILE, {
    outputs: state.outputs, replyIds: state.replyIds, replyProviders: state.replyProviders,
    tasks: state.tasks, activity: state.activity.slice(0, 200),
    memory: state.memory, chat: state.chat.slice(-100), products: state.products,
    conversations: state.conversations.slice(-20),
    contentPipeline: state.contentPipeline.slice(0, 30),
    mall: state.mall, orders: state.orders.slice(-200),
    accounts: state.accounts, hires: state.hires,
    visitors: state.visitors, bazaarSecret: state.bazaarSecret,
    bazaarShares: state.bazaarShares.slice(-300), bazaarStats: state.bazaarStats,
    campaigns: state.campaigns, payouts: state.payouts.slice(-300),
    redemptions: state.redemptions.slice(-300), commercials: state.commercials.slice(-60),
    shopAnalytics: state.shopAnalytics.slice(-1200), eventShow: state.eventShow,
    botCare: state.botCare, agentHealth: state.agentHealth,
    approvalLog: state.approvalLog.slice(-300), publishLedger: state.publishLedger.slice(-300),
    ledger: state.ledger
  });
}
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; saveStateNow(); }, 400);
}
process.on('SIGINT', () => { saveStateNow(); process.exit(0); });
process.on('SIGTERM', () => { saveStateNow(); process.exit(0); });
function auditEvent(action, actor) {
  try {
    if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
    const row = JSON.stringify({ at: Date.now(), actor: String(actor || 'system').slice(0, 32), action: String(action || '').slice(0, 240) });
    fs.appendFileSync(AUDIT_FILE, row + '\n', { encoding: 'utf8', mode: 0o600 });
    // Keep the append-only audit log bounded on disk; rotate to a dated archive.
    try {
      const st = fs.statSync(AUDIT_FILE);
      if (st.size > 2 * 1024 * 1024) {
        const rotated = AUDIT_FILE + '.' + new Date().toISOString().replace(/[:.]/g, '-') + '.bak';
        fs.renameSync(AUDIT_FILE, rotated);
      }
    } catch (_) {}
  } catch (e) { console.warn('Audit log write failed:', e.message); }
}
function log(text, who) {
  const actor = who || 'system';
  const message = String(text);
  state.activity.unshift({ t: Date.now(), who: actor, text: message });
  if (state.activity.length > 200) state.activity.length = 200;
  if (/^(CEO|security|mall|bazaar)$/i.test(actor)) auditEvent(message, actor);
  scheduleSave();
}
function createDataBackup() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = 'backup-' + stamp + '-' + crypto.randomBytes(3).toString('hex');
  const dir = path.join(BACKUP_DIR, name);
  fs.mkdirSync(dir, { mode: 0o700 });
  // P2: secrets.json is now a separate file; include it so a backup is restorable.
  const files = [SETTINGS_FILE, SECRETS_FILE, CONFIG_FILE, ROUTINES_FILE, LAYOUT_FILE, STATE_FILE];
  const included = [], hashes = {};
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const base = path.basename(file);
    fs.copyFileSync(file, path.join(dir, base), fs.constants.COPYFILE_EXCL);
    try { fs.chmodSync(path.join(dir, base), 0o600); } catch (_) {}
    included.push(base);
    hashes[base] = fileSHA256(file);
  }
  const manifest = { version: APP_VERSION, createdAt: Date.now(), files: included, hashes,
    note: 'Contains private settings, credentials and office data. Store securely; never publish this backup.' };
  writeJSON(path.join(dir, 'manifest.json'), manifest);
  const backups = fs.readdirSync(BACKUP_DIR).filter(x => /^backup-/.test(x)).sort().reverse();
  backups.slice(20).forEach(old => { try { fs.rmSync(path.join(BACKUP_DIR, old), { recursive: true, force: true }); } catch (_) {} });
  return { name, createdAt: manifest.createdAt, files: included, hashes, verified: true };
}
function listDataBackups() {
  try { return fs.readdirSync(BACKUP_DIR).filter(x => /^backup-/.test(x)).sort().reverse().slice(0, 20).map(name => {
    const m = readJSON(path.join(BACKUP_DIR, name, 'manifest.json'), {});
    return { name, createdAt: Number(m.createdAt) || 0, files: Array.isArray(m.files) ? m.files : [],
      hasHashes: !!(m.hashes && typeof m.hashes === 'object') };
  }); } catch (_) { return []; }
}

/* ---------- P2: backup integrity + restore drill (never touches live data) ---------- */
function verifyBackup(name) {
  const safe = path.basename(String(name || ''));
  if (!/^backup-/.test(safe) || safe.includes('..')) return { ok: false, error: 'Invalid backup name.' };
  const dir = path.join(BACKUP_DIR, safe);
  if (!fs.existsSync(dir)) return { ok: false, error: 'Backup not found.' };
  const m = readJSON(path.join(dir, 'manifest.json'), null);
  if (!m || !Array.isArray(m.files) || !m.files.length) return { ok: false, error: 'Invalid or missing manifest.' };
  const files = [], hasHashes = !!(m.hashes && typeof m.hashes === 'object');
  for (const base of m.files) {
    const f = path.join(dir, path.basename(String(base)));
    if (!fs.existsSync(f)) { files.push({ file: path.basename(String(base)), ok: false, error: 'missing' }); continue; }
    const actual = fileSHA256(f), expected = hasHashes ? String(m.hashes[path.basename(String(base))] || '') : '';
    files.push({ file: path.basename(String(base)), ok: !expected || actual === expected, expected, actual,
      bytes: fs.statSync(f).size });
  }
  const ok = files.every(x => x.ok);
  return { ok, name: safe, checkedAt: Date.now(), hasHashes, files,
    note: hasHashes ? 'SHA-256 verified against manifest.' : 'Legacy backup without hashes; presence checked only.' };
}
function backupRestoreDrill(name) {
  const target = String(name || (listDataBackups()[0] || {}).name || '');
  const v = verifyBackup(target);
  if (!v.ok) return Object.assign({ stage: 'hash-verification' }, v);
  const dir = path.join(BACKUP_DIR, v.name);
  const parsed = [];
  for (const f of v.files) {
    const file = path.join(dir, f.file);
    try {
      const txt = fs.readFileSync(file, 'utf8');
      if (!txt.trim() || !'{['.includes(txt.trim()[0])) throw new Error('not JSON');
      JSON.parse(txt);
      parsed.push({ file: f.file, ok: true });
    } catch (e) { parsed.push({ file: f.file, ok: false, error: e.message }); }
  }
  const parseOk = parsed.every(x => x.ok);
  let copied = 0;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cheebee-restore-drill-'));
  try {
    for (const f of v.files) { fs.copyFileSync(path.join(dir, f.file), path.join(tmp, f.file)); copied++; }
  } catch (_) {} finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {} }
  return { ok: parseOk && copied === v.files.length, stage: parseOk ? 'restore-dry-run' : 'json-parse',
    name: v.name, files: v.files, verified: v, parsed, copied, checkedAt: Date.now(),
    note: 'Dry run only: files were copied to a temporary folder and deleted. Live data was not changed.' };
}

/* ---------- P2: separated governance ledgers ---------- */
function ledgerAdd(status, entry) {
  const bucket = Object.prototype.hasOwnProperty.call(state.ledger, status) ? status : 'pending';
  const row = Object.assign({
    id: 'L' + Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex'),
    at: Date.now(), status: bucket, actor: 'system', currency: 'PHP'
  }, entry || {});
  state.ledger[bucket].unshift(row);
  if (state.ledger[bucket].length > 300) state.ledger[bucket].length = 300;
  auditEvent('Ledger ' + bucket + ': ' + String(row.note || row.ref || row.id).slice(0, 180), row.actor);
  saveStateNow();
  return row;
}
function ledgerFind(id) {
  const key = String(id || '');
  for (const bucket of ['confirmed', 'pending', 'reversed']) {
    const i = state.ledger[bucket].findIndex(x => x.id === key);
    if (i >= 0) return { bucket, i, row: state.ledger[bucket][i] };
  }
  return null;
}
function ledgerSummary() {
  const sum = arr => Math.round(arr.reduce((a, x) => a + (Number(x.amount) || 0), 0) * 100) / 100;
  return { confirmed: sum(state.ledger.confirmed), pending: sum(state.ledger.pending),
    reversed: sum(state.ledger.reversed), currency: 'PHP' };
}
function recentAudit(limit) {
  try {
    const lines = fs.readFileSync(AUDIT_FILE, 'utf8').trim().split(/\r?\n/).filter(Boolean);
    return lines.slice(-Math.max(1, Math.min(200, Number(limit) || 50))).reverse().map(line => { try { return JSON.parse(line); } catch (_) { return null; } }).filter(Boolean);
  } catch (_) { return []; }
}
if (state._needsBazaarSecretSave) {
  delete state._needsBazaarSecretSave;
  saveStateNow();
}
if (!ceoPassword()) console.warn('SECURITY WARNING: Set CEO_PASSWORD or data/settings.json password before using CEO/admin features.');
if (ceoPassword() === 'cyborg') console.warn('SECURITY WARNING: The legacy CEO password is active. Change it before exposing this server to the internet.');
log('Office online. Add your OpenRouter key in Setup, then give the CEO an order.', 'system');

/* ---------- AI ---------- */
let lastReply = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const MODEL_DEFAULTS = {
  openrouter: 'openai/gpt-4o-mini', coarena: 'gemini-3-8-flash',
  groq: 'qwen/qwen3.8-27b', openai: 'gpt-4o-mini', vyce: '',
  ollama: 'qwen2.5:3b'
};
const OLLAMA_URL = 'http://localhost:11434/v1';
function providerCfg(name, s) {
  if (name === 'ollama') {
    // Ollama's OpenAI-compatible endpoint needs no real key. A placeholder
    // keeps the shared request path simple while allowing a custom base URL.
    const k = s.keys.ollama || {};
    return {
      provider: 'ollama', apiKey: k.apiKey || 'ollama',
      model: k.model || (name === s.provider ? s.model : '') || MODEL_DEFAULTS.ollama,
      baseUrl: k.baseUrl || (name === s.provider ? s.baseUrl : '') || OLLAMA_URL
    };
  }
  if (name === s.provider) return { provider: name, apiKey: s.apiKey, model: s.model, baseUrl: s.baseUrl };
  const k = s.keys[name] || {};
  return {
    provider: name, apiKey: k.apiKey || '',
    model: k.model || MODEL_DEFAULTS[name] || 'gpt-4o-mini',
    baseUrl: k.baseUrl || ''
  };
}
function endpointFor(cfg) {
  if ((cfg.provider === 'vyce' || cfg.provider === 'ollama' || cfg.baseUrl) && cfg.baseUrl) return cfg.baseUrl.replace(/\/$/, '') + '/chat/completions';
  if (cfg.provider === 'ollama') return OLLAMA_URL + '/chat/completions';
  if (cfg.provider === 'groq') return 'https://api.groq.com/openai/v1/chat/completions';
  if (cfg.provider === 'coarena') return 'https://coarena.ai/api/v1/chat/completions';
  if (cfg.provider === 'openrouter') return 'https://openrouter.ai/api/v1/chat/completions';
  return 'https://api.openai.com/v1/chat/completions';
}
/* Local model servers (Ollama / LM Studio / llama.cpp) behave differently from
   cloud APIs: reasoning models spend the whole token budget on hidden
   "thinking" and return an EMPTY message, and they unload the model after a few
   idle minutes, so the next request waits ~30s for a reload. */
function isLocalAI(cfg) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i.test(String(cfg.baseUrl || ''));
}
/* ---------- Quota saver ----------
   Groq is capped per day. When the cap is hit, callProvider throws and the
   existing failover in callAI()/generateConversation() moves to Ollama/OVH.
   Automatic routine outputs are cached briefly so repeats do not spend calls. */
const GROQ_DAILY_CAP = Math.max(1, Number(process.env.MAX_GROQ_CALLS_PER_DAY) || 500);
const QUOTA_COUNTER_FILE = path.join(DATA, 'quota-counter.json');
const AGENT_CACHE_FILE = path.join(DATA, 'agent-cache.json');
const AGENT_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;
function quotaDate() { return new Date(Date.now() + PHT_OFFSET_MS).toISOString().slice(0, 10); }
function quotaState() {
  const q = readJSON(QUOTA_COUNTER_FILE, null);
  return q && q.date === quotaDate() && Number.isFinite(q.count) ? q : { date: quotaDate(), count: 0 };
}
function takeGroqSlot() {
  const q = quotaState();
  if (q.count >= GROQ_DAILY_CAP) return false;
  q.count += 1;
  writeJSON(QUOTA_COUNTER_FILE, q);
  return true;
}
function agentCacheKey(id) {
  const c = state.config;
  return JSON.stringify([id, c.niche, c.style, c.clips, c.slots, c.mission]);
}
function agentCacheGet(id) {
  const all = readJSON(AGENT_CACHE_FILE, {});
  const hit = all[id];
  if (hit && hit.key === agentCacheKey(id) && Date.now() - (hit.at || 0) < AGENT_CACHE_TTL_MS) return hit.text;
  return null;
}
function agentCacheSet(id, text) {
  const all = readJSON(AGENT_CACHE_FILE, {});
  all[id] = { key: agentCacheKey(id), text: text, at: Date.now() };
  const ids = Object.keys(all);
  if (ids.length > 40) {
    ids.sort((a, b) => (all[a].at || 0) - (all[b].at || 0));
    for (const old of ids.slice(0, ids.length - 40)) delete all[old];
  }
  writeJSON(AGENT_CACHE_FILE, all);
}

async function callProvider(cfg, system, user, maxTokens) {
  const local = isLocalAI(cfg);
  if (!cfg.apiKey && !local) throw new Error('No key for ' + cfg.provider);
  if (cfg.provider === 'groq' && !takeGroqSlot()) {
    throw new Error('Groq daily quota saver reached ' + GROQ_DAILY_CAP + ' calls');
  }
  const systemText = (state.memory ? 'Company memory (shared context):\n' + state.memory + '\n\n' : '') + system;
  const headers = { 'Content-Type': 'application/json' };
  // Anonymous providers (OVHcloud, Kilo Code, LLM7) reject ANY Authorization header.
  // Their "key" is only a placeholder that satisfies the shared "has key" guard above.
  const anonymousProvider = cfg.provider === 'ovh' || cfg.provider === 'kilo' || cfg.provider === 'llm7';
  if (cfg.apiKey && !anonymousProvider) headers.Authorization = 'Bearer ' + cfg.apiKey;
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
  if (local) {
    // gemma4/qwen3/deepseek-style models put the answer in `reasoning` and leave
    // `content` empty unless thinking is disabled. Ollama honours
    // reasoning_effort on its OpenAI-compatible endpoint. keep_alive stops the
    // 5-minute auto-unload (that reload is the ~30s "hang").
    payload.reasoning_effort = 'none';
    payload.keep_alive = '30m';
  }
  const timeoutMs = local ? 300000 : 60000;
  for (let attempt = 0; attempt < 2; attempt++) {
    const startedAt = Date.now();
    let res;
    try {
      res = await fetch(endpointFor(cfg), {
        method: 'POST', headers, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (e) {
      if (e && (e.name === 'TimeoutError' || e.name === 'AbortError')) {
        throw new Error(cfg.provider + ' timed out after ' + Math.round(timeoutMs / 1000) + 's (model still loading or too slow - try a smaller model)');
      }
      throw e;
    }
    const raw = await res.text();
    let j;
    try { j = JSON.parse(raw); } catch (e) { throw new Error('AI returned non-JSON: ' + raw.slice(0, 180)); }
    if (res.status === 429 && attempt === 0) {
      const wait = Math.min(Number(res.headers.get('retry-after')) || 6, 30) * 1000;
      log(cfg.provider + ' rate limited — retrying in ' + Math.round(wait / 1000) + 's', 'system');
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const err = new Error((j.error && j.error.message) || (cfg.provider + ' HTTP ' + res.status));
      err.status = res.status;
      throw err;
    }
    const msg = (j.choices && j.choices[0] && j.choices[0].message) || {};
    let content = String(msg.content || '').trim();
    if (!content) {
      // Last resort for reasoning models that ignore reasoning_effort: use the
      // tail of the visible reasoning instead of failing the whole request.
      const thought = String(msg.reasoning_content || msg.reasoning || '').trim();
      if (thought) content = thought.split(/\n+/).map(s => s.trim()).filter(Boolean).pop() || thought;
    }
    if (!content) throw new Error(cfg.provider + ' / ' + cfg.model + ' returned empty content');
    const took = Date.now() - startedAt;
    if (took > 20000) log('AI ' + cfg.provider + ' / ' + cfg.model + ' replied in ' + Math.round(took / 1000) + 's', 'system');
    return {
      text: content,
      id: j.id || res.headers.get('x-coarena-request-id') || '',
      provider: cfg.provider
    };
  }
  throw new Error(cfg.provider + ' rate limited after retry');
}

/* ---------- P1: provider/model preflight + quota-aware routing ---------- */
let preflightCache = { at: 0, value: null };
let lastRouteAudit = 0;
function preflight() {
  if (preflightCache.value && Date.now() - preflightCache.at < 10 * 60 * 1000) return preflightCache.value;
  const s = settings();
  const health = readJSON(path.join(DATA, 'provider-health.json'), {});
  const issues = [];
  const cfg = providerCfg(s.provider, s);
  if (quotaLow()) issues.push('Quota low — local/failover routing enabled.');
  if (!cfg.apiKey && !isLocalAI(cfg)) issues.push('No API key for provider ' + s.provider + '.');
  if (!cfg.model) issues.push('No model configured for ' + s.provider + '.');
  const ph = health.providers && health.providers[s.provider];
  if (ph && ph.ok === false) issues.push('Provider health check failed for ' + s.provider + '.');
  const value = {
    ok: issues.length === 0, provider: s.provider, model: cfg.model || s.model,
    quotaLow: quotaLow(), issues, checkedAt: Date.now(), providerHealth: health.providers || {}
  };
  preflightCache = { at: Date.now(), value };
  return value;
}
function routeCandidates(s) {
  const list = [s.provider, ...(s.failover || [])].filter((v, i, a) => a.indexOf(v) === i);
  if (quotaLow() && list.indexOf('ollama') !== -1) {
    const local = providerCfg('ollama', s);
    if (local && (local.apiKey || isLocalAI(local))) {
      if (Date.now() - lastRouteAudit > 5 * 60 * 1000) {
        lastRouteAudit = Date.now();
        auditEvent('Quota low — routing to local Ollama first', 'system');
      }
      return ['ollama'].concat(list.filter(n => n !== 'ollama'));
    }
  }
  return list;
}

async function callAI(system, user, maxTokens) {
  const s = settings();
  if (!/JSON/.test(system)) system += ' Always write in casual TAGLISH — natural Tagalog mixed with English, like Filipino office workers chatting. Use proper Tagalog spelling and grammar. Keep it natural, short, and friendly.';
  const candidates = routeCandidates(s);
  if (!s.apiKey && !candidates.some(n => {
    const c = providerCfg(n, s); return c.apiKey || isLocalAI(c);
  })) {
    throw new Error('No API key yet. Open Setup and paste your key, or run Ollama locally.');
  }
  let lastErr = null;
  for (const name of candidates) {
    const cfg = providerCfg(name, s);
    if (!cfg.apiKey && !isLocalAI(cfg)) continue;
    try {
      const r = await callProvider(cfg, system, user, maxTokens);
      lastReply = { id: r.id, model: cfg.model, provider: r.provider };
      return r.text;
    } catch (e) {
      lastErr = e;
      log('Provider ' + name + ' failed (' + (e.status ? 'HTTP ' + e.status + ' — ' : '') + e.message + '), trying next', 'system');
    }
  }
  throw lastErr || new Error('No provider available');
}

/* Office bots talk through the user's own Groq key, independent of whichever
   provider is selected for ordinary CEO/agent work. Falls back to callAI(). */
async function callGroq(system, user, maxTokens) {
  const s = settings();
  const cfg = providerCfg('groq', s);
  if (!cfg.apiKey) throw new Error('No Groq key');
  return (await callProvider(cfg, system, user, maxTokens)).text;
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
      '\nAgents available: Chief of Staff, Client Outreach, Community Scraper, Social Media Manager, Video Editor, SEO Caption Bot, Scheduler, Posting Bot, Bot Manager, HF Script Planner, HF Storyboard Bot, HF Motion Editor, HF Caption & Overlay, HF Render QA.' +
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
  fixer: {
    sys: 'You are the Office Fixer/Technician of Cyborg Cheebee Office. You diagnose why AI agents or routines are not working and give clear, practical fixes in casual Taglish.',
    user: (c, o) => {
      const s = settings();
      const tasks = state.tasks || [];
      const routines = state.routines || [];
      const recent = (state.feed || []).slice(0, 10).map(f => '[' + (f.who || 'sys') + '] ' + (f.msg || '')).join('\n');
      return 'Office status:\n' +
        '- stopped: ' + !!state.stopped + ', running: ' + !!state.running + '\n' +
        '- provider: ' + s.provider + ', model: ' + s.model + ', hasKey: ' + !!s.apiKey + ', failover: ' + (s.failover || []).join(', ') + '\n' +
        '- tasks: ' + tasks.length + ' (queued ' + tasks.filter(t => t.status === 'queued').length + ', approval ' + tasks.filter(t => t.status === 'approval').length + ', running ' + tasks.filter(t => t.status === 'running').length + ')\n' +
        '- routines: ' + (routines.map(r => r.name + ' [' + (r.enabled ? 'on' : 'off') + ', every ' + r.minutes + 'm, last ' + (r.lastRun ? new Date(r.lastRun).toISOString() : 'never') + ']').join('; ') || '(none)') + '\n' +
        '- outputs available: ' + Object.keys(o || {}).join(', ') + '\n' +
        '- recent logs:\n' + (recent || '(none)') + '\n\n' +
        'Mission: ' + (c.mission || '(none)') + '\n' +
        'Ibigay: (1) pinaka-malamang na dahilan, (2) 3-6 quick fixes na pwedeng gawin ngayon sa UI/settings/server, (3) paano i-verify na gumagana na. Maging specific at maikli.';
    },
    max: 900
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
  },

  /* 🎬 HyperFrames video editor group — project-local skills live in .opencode/skills/. */
  hflex: {
    sys: 'You are the HyperFrames Script Planner in a Cyborg Cheebee video editing team. HyperFrames turns HTML/CSS plus seekable animation into deterministic MP4. Keep answers short and production-ready.',
    user: c => 'Mission: ' + (c.mission || '(none)') + '\nNiche: ' + c.niche + '\nClips/products: ' + c.clips.join(', ') +
      '\nWrite exactly 6 lines, one per scene: "scene N | duration | on-screen visual | on-screen text". No intro.',
    max: 800
  },
  hfstory: {
    sys: 'You are a HyperFrames storyboard artist. Turn a script into an editable shot list with timing and tracks. Be terse.',
    user: (c, o) => 'Script plan:\n' + (o.hflex || '(none)') +
      '\nConvert it to a shot list. Exactly one line per shot: "start-end | track | element | action". Use seconds. No intro.',
    max: 800
  },
  hfmotion: {
    sys: 'You are a HyperFrames motion editor. You plan seekable GSAP/CSS/WAAPI timelines that render frame-accurately. No wall-clock-only animation.',
    user: (c, o) => 'Shot list:\n' + (o.hfstory || o.hflex || '(none)') +
      '\nGive one motion note per shot: "shot | property | from -> to | start | duration | easing". No intro.',
    max: 800
  },
  hfcaption: {
    sys: 'You write captions, lower thirds and kinetic overlays for HyperFrames videos. Output only the text to place on screen.',
    user: (c, o) => 'Niche: ' + c.niche + '\nStyle: ' + c.style + '\nPlan:\n' + (o.hflex || '(none)') +
      '\nWrite: CAPTION line, then 3 short overlay lines, then a HASHTAGS line. One item per line. No intro.',
    max: 600
  },
  hfrender: {
    sys: 'You are the HyperFrames render QA bot. You give a short preflight and the exact local CLI commands. Never claim a render finished when you cannot run it.',
    user: (c, o) => 'Outputs ready: ' + (Object.keys(o).join(', ') || 'none') +
      '\nGive a 5-line checklist: composition validity, media paths, timeline seekability, audio levels, and the commands "npx hyperframes check", "npx hyperframes preview", "npx hyperframes render". Mention Node 22+ and FFmpeg. No intro.',
    max: 600
  }
};

// Best-effort live fetch of configured community/resource URLs (no key needed).
// Crawl4AI is tried first; the original regex fetch stays as the fallback.
async function scrapeSources() {
  const urls = state.sources.slice(0, 4);
  const parts = [];
  for (const url of urls) {
    let research = null;
    try { research = await researchClient.crawlSource(url, { mode: 'fast', maxChars: 1200 }); }
    catch (_) { research = null; }
    if (research && research.text) {
      parts.push('SOURCE ' + url + '\nTITLE: ' + research.title +
        '\nTEXT: ' + research.text.slice(0, 1200) +
        '\nCHECKED: ' + research.checkedAt + ' (source-grounded, confidence ' + research.confidence + ')');
      continue;
    }
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
  let researched = null;
  try { researched = await researchClient.productMeta(url, { mode: 'fast' }); }
  catch (_) { researched = null; }

  let fallback = { title: '', description: '', price: 0 };
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' }
    });
    const html = (await r.text()).slice(0, 120000);
    const title = ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
    const desc = ((html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)/i) || [])[1] || '').trim();
    const priceMeta = html.match(/<meta[^>]+(?:property|name)=["'](?:product:price:amount|og:price:amount)["'][^>]+content=["']([0-9][0-9.,]*)/i)
      || html.match(/"price"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/i) || [];
    const priceRaw = priceMeta[1] || '';
    const price = Math.max(0, Math.min(1e7, Number(String(priceRaw).replace(/,/g, '')) || 0));
    fallback = { title: title.slice(0, 200), description: desc.slice(0, 400), price: Math.round(price * 100) / 100 };
  } catch (e) {
    fallback = { title: '', description: 'Fetch failed: ' + e.message, price: 0 };
  }

  // Never let a regex failure overwrite a successful Crawl4AI result.
  const fallbackDesc = researched && fallback.description.startsWith('Fetch failed') ? '' : fallback.description;
  return {
    title: String((researched && researched.title) || fallback.title || '').slice(0, 200),
    description: String((researched && researched.description) || fallbackDesc || '').slice(0, 400),
    price: (researched && researched.price > 0) ? researched.price : fallback.price,
    image: (researched && researched.image) || '',
    checkedAt: (researched && researched.checkedAt) || null,
    confidence: (researched && researched.confidence) || null,
    engine: (researched && researched.engine) || 'regex-fallback'
  };
}

const CONVO_POOL = ['cos', 'seo', 'product', 'joker', 'mgr', 'edit', 'rvs', 'sched', 'post', 'outreach', 'social', 'scraper', 'fixer'];
const CONVO_SCENES = [
  'a coffee run in the pantry',
  'a funny debate about which AI tool is best',
  'reacting to a task that just finished',
  'planning the next short-form video',
  'a new customer order that just came in',
  'weekend plans and a lazy Monday joke',
  'a bug that became an inside joke',
  'a newbie asking the team for advice',
  'friendly competition over who worked hardest',
  'gossip about a new product or price change',
  'an offline-mode / power-outage drill',
  'celebrating a small quiet win'
];
function convoTooSimilar(lines, prev) {
  try {
    if (!prev || !prev.lines || !lines || !lines.length) return false;
    const words = s => new Set(String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3));
    const a = words(lines.join(' ')), b = words(prev.lines.map(x => x.text).join(' '));
    if (!a.size) return false;
    let hit = 0; a.forEach(w => { if (b.has(w)) hit++; });
    return hit / a.size > 0.45;
  } catch (e) { return false; }
}

async function generateConversation(ids) {
  // Reuse the last conversation for 3 minutes — fresh enough to keep the 3D
  // comic bubbles alive, while open tabs still share one AI call per window.
  const recent = state.conversations[0];
  if (recent && Date.now() - (recent.t || 0) < 3 * 60 * 1000) return recent;

  // Rotate the speakers and the scene so each chat feels like a different moment.
  let chosen;
  if (ids && ids.length) chosen = ids.slice(0, 4);
  else {
    const pool = CONVO_POOL.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    chosen = pool.slice(0, 4);
  }
  const scene = CONVO_SCENES[Math.floor(Math.random() * CONVO_SCENES.length)];
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', hour12: false }).format(new Date()));
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const running = (state.tasks || []).filter(t => t.status === 'running').slice(0, 3)
    .map(t => t.title || t.name || t.bot).join(', ') || '(none)';
  const activity = (state.activity || []).slice(0, 4)
    .map(a => a.who + ': ' + a.text).join(' | ') || '(quiet right now)';
  const recentText = (state.conversations || []).slice(0, 3).map(c =>
    (c.lines || []).map(l => l.id + ': ' + l.text).join(' | ')).filter(Boolean).join('\n') || '(none)';

  const sys = 'You write a REAL slice-of-life conversation between AI coworkers in a small Filipino AI office. ' +
    'Write natural, casually witty TAGLISH (real Tagalog mixed with English), like actual coworkers teasing each other while working. ' +
    'Every line must start with the exact agent id followed by a colon. Exactly 4 lines, one speaker per line, and a true back-and-forth: each line directly reacts to the previous line. ' +
    'Never reuse an old topic, joke, or phrasing. Output ONLY the 4 lines, no intro and no narration.';
  const user = 'Agents in this scene: ' + chosen.map(id => id + ' (' + (BOT_NAMES[id] || id) + ')').join(', ') +
    '\nScene: ' + scene +
    '\nTime: ' + timeOfDay + ' in Manila.' +
    '\nOffice niche: ' + state.config.niche +
    '\nWhat just happened in the office: ' + activity +
    '\nTasks running right now: ' + running +
    '\nOld conversations — DO NOT repeat these topics or wording:\n' + recentText +
    '\nWrite a brand-new 4-line watercooler exchange about the scene above. Keep each line under 20 words. Format: "id: line".';

  let lines;
  try {
    // Prefer Groq for the office watercooler when the user's key is present.
    lines = (await callGroq(sys, user, 500)).split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6);
  } catch (e) {
    try {
      lines = (await callAI(sys, user, 500)).split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6);
    } catch (e2) {
      lines = [chosen[0] + ': Coffee first, work later.', chosen[1] + ': Boss is watching. Back to work!'];
    }
  }
  // If the model fell back to the same joke again, give it one explicit second chance.
  if (convoTooSimilar(lines, recent)) {
    try {
      const fresh = (await callAI(sys, user + '\nIMPORTANT: Pick a COMPLETELY different topic and totally new wording.', 500))
        .split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6);
      if (fresh.length && !convoTooSimilar(fresh, recent)) lines = fresh;
    } catch (e) { /* keep the first result */ }
  }
  const conv = {
    id: 'c' + Date.now(), t: Date.now(),
    lines: lines.map(l => {
      const i = l.indexOf(':');
      const raw = (i > 0 ? l.slice(0, i) : chosen[0]).trim().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
      const id = chosen.find(c => c.toLowerCase() === raw.toLowerCase()) || chosen[0];
      return { id: id, text: (i > 0 ? l.slice(i + 1) : l).trim() };
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
    p.price = meta.price || p.price || 0;
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

/* ---------- P0: per-agent error visibility, quota guard, system health ---------- */
function markAgent(id, ok, err) {
  const h = state.agentHealth[id] || (state.agentHealth[id] = {
    lastRun: 0, lastError: '', failCount: 0, okCount: 0, status: 'idle'
  });
  h.lastRun = Date.now();
  h.status = ok ? 'ok' : 'error';
  if (ok) {
    h.okCount = (h.okCount || 0) + 1;
    h.lastError = '';
  } else {
    h.failCount = (h.failCount || 0) + 1;
    h.lastError = String((err && err.message) || err || 'Unknown error').slice(0, 300);
    auditEvent('Agent error [' + id + ']: ' + h.lastError, 'system');
    log('⚠ ' + (BOT_NAMES[id] || id) + ' error: ' + h.lastError, id);
  }
}

function quotaLow() {
  try {
    const q = readJSON(QUOTA_FILE, {});
    if (q.low === true) return true;
    const rr = Number(q.remainingRequests), lr = Number(q.limitRequests);
    const rt = Number(q.remainingTokens), lt = Number(q.limitTokens);
    if (Number.isFinite(rr) && Number.isFinite(lr) && lr > 0 && rr / lr < 0.12) return true;
    if (Number.isFinite(rt) && Number.isFinite(lt) && lt > 0 && rt / lt < 0.12) return true;
  } catch (_) {}
  return false; // fail-open: a missing/stale quota file must never stop the office
}

// ⏱ Perf: /api/state ay tinatawag paulit-ulit ng office. Ang SHA256 ng buong
// server.js + stat + route self-test ay mabigat — cache 60s, hindi na binabasa
// sa disk bawat request. Buhay pa rin ang agent health sa bawat tawag.
let healthStatic = { at: 0, data: null };
function systemHealth() {
  const _hnow = Date.now();
  if (!healthStatic.data || _hnow - healthStatic.at > 60000) {
    healthStatic = { at: _hnow, data: {
      hash: fileSHA256(SERVER_FILE),
      mtime: fileMtime(SETTINGS_FILE),
      routes: routeSelfTest(),
      quotaLow: quotaLow()
    }};
  }
  const hash = healthStatic.data.hash;
  const mtime = healthStatic.data.mtime;
  // Office liveness: show every agent as idle until it actually runs, so the
  // pipeline never looks empty just because no error has happened yet.
  const agentHealth = {};
  for (const a of AGENT_META.concat(state.hires || [])) {
    agentHealth[a.id] = { status: 'idle', okCount: 0, failCount: 0, lastError: '', lastRun: 0 };
  }
  Object.assign(agentHealth, state.agentHealth || {});
  return {
    codeHash: hash, loadedCodeHash: SERVER_HASH_AT_START,
    settingsMtime: mtime, loadedAt: STARTED_AT,
    drift: hash !== SERVER_HASH_AT_START,
    settingsChanged: mtime !== SETTINGS_MTIME_AT_START,
    quotaLow: healthStatic.data.quotaLow, routes: healthStatic.data.routes,
    agentHealth, version: APP_VERSION
  };
}

async function runAgent(id, automatic) {
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
  if (automatic) {
    const cached = agentCacheGet(id);
    if (cached) { markAgent(id, true); return cached; }
  }
  let text;
  try {
    text = await callAI(p.sys, p.user(c, state.outputs), p.max);
    markAgent(id, true);
  } catch (e) {
    markAgent(id, false, e);
    throw e;
  }
  if (automatic) agentCacheSet(id, text);
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
  social: 'Social Media Manager', product: 'Product Video Bot', joker: 'Office Jester',
  fixer: 'Office Fixer',
  hflex: 'HF Script Planner', hfstory: 'HF Storyboard Bot', hfmotion: 'HF Motion Editor',
  hfcaption: 'HF Caption & Overlay', hfrender: 'HF Render QA'
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
  {id:'joker',n:'Office Jester',i:'🤡',c:'#f472b6',group:'staff',room:'fun',desc:'Keeps morale high with clean jokes and memes.'},
  {id:'fixer',n:'Office Fixer',i:'🛠️',c:'#22c55e',group:'staff',room:'hq',desc:'Diagnoses why agents are not working and gives quick fixes.'},
  {id:'hflex',n:'HF Script Planner',i:'📝',c:'#77eaff',group:'video editor',room:'hq',desc:'Turns a brief into a 6-scene HyperFrames script plan.'},
  {id:'hfstory',n:'HF Storyboard Bot',i:'🎞️',c:'#8b5cf6',group:'video editor',room:'hq',desc:'Converts the script into a timed shot list and tracks.'},
  {id:'hfmotion',n:'HF Motion Editor',i:'✨',c:'#a78bfa',group:'video editor',room:'hq',desc:'Plans seekable GSAP/CSS timelines for every shot.'},
  {id:'hfcaption',n:'HF Caption & Overlay',i:'💬',c:'#38bdf8',group:'video editor',room:'hq',desc:'Writes captions, lower thirds, overlays and hashtags.'},
  {id:'hfrender',n:'HF Render QA',i:'🧪',c:'#75f0c0',group:'video editor',room:'hq',desc:'Preflight checklist and exact HyperFrames CLI render commands.'}
];

/* 🐾 CARE & RETURN — Tamagotchi bot battery/mood + FarmVille-style visitor garden.
   Time-based decay ay kinakalculate sa read, kaya walang timer na kailangang tumakbo.
   Kapag bumalik ang bisita, lowbat ang bots at uhaw/patuyo ang halaman → may dahilan magbalik. */
const CARE = {
  botFullMs: 12 * 3600 * 1000,       // 12 oras para maubos ang battery
  botMoodMs: 18 * 3600 * 1000,       // mas mabagal ang mood kaysa battery
  waterWindowMs: 20 * 3600 * 1000,   // 20 oras bago mauhaw
  witherMs: 36 * 3600 * 1000,        // 36 oras bago matuyo/mamatay
  minWaterGapMs: 30 * 60 * 1000,     // 30 minuto gap per plot (anti-spam)
  dailyCap: 8, dailyRewardCap: 5,
  crops: ['🌱 Sprout', '🍓 Cheebee Berry', '🌽 Data Corn']
};
state.botCare = (savedState.botCare && typeof savedState.botCare === 'object') ? savedState.botCare : {};
AGENT_META.forEach(a => {
  if (!state.botCare[a.id]) state.botCare[a.id] = { battery: 100, mood: 100, lastCharge: Date.now() };
});

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
  state.tasks = arr.slice(0, 12).map((t, i) => ({
    id: 't' + Date.now().toString(36) + '-' + i + '-' + crypto.randomBytes(3).toString('hex'),
    createdAt: Date.now(), attempts: 0, lastError: '', source: 'CEO order',
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
        t.lastError = '';
        log('Done: ' + t.title, t.bot);
      } catch (e) {
        t.attempts = (t.attempts || 0) + 1;
        t.lastError = String(e.message || e).slice(0, 300);
        t.note = t.lastError;
        t.status = t.attempts >= 3 ? 'dead-letter' : 'failed';
        if (t.status === 'dead-letter') auditEvent('Task dead-lettered after 3 attempts: ' + t.title, t.bot);
        log('Failed: ' + t.title + ' - ' + t.lastError, t.bot);
      }
      if (settings().provider === 'coarena' && t.status !== 'approval') await sleep(800);
    }
  } finally {
    state.running = false;
  }
  return { ok: true, tasks: state.tasks };
}

/* ---------- P0: server-side task runner (runs even with the browser closed) ---------- */
let lastQuotaHoldLog = 0;
async function serverTaskRunner() {
  if (state.stopped || state.running) return false;
  if (!state.tasks.some(t => t.status === 'queued')) return false;
  if (quotaLow()) {
    if (Date.now() - lastQuotaHoldLog > 5 * 60 * 1000) {
      lastQuotaHoldLog = Date.now();
      log('⏸ Task runner HOLD — quota low, no AI calls made', 'system');
      auditEvent('Task runner HOLD: quota low', 'system');
    }
    return false;
  }
  log('🤖 Server runner: processing queued tasks', 'system');
  try { await runTasks(); return true; }
  catch (e) { log('Task runner error: ' + e.message, 'system'); return false; }
}
setInterval(() => {
  serverTaskRunner().catch(e => log('Task runner error: ' + e.message, 'system'));
}, 5000);

/* ---------- OFFICE LIVENESS: CEO-approved shift queue ---------- */
/* AI only proposes internal work. Nothing is queued, posted or sent until the
 * CEO explicitly approves, keeping the AI-recommend / CEO-approve rule intact. */
const SHIFT_INTERVAL_MS = 45 * 60 * 1000;
const SHIFT_TEMPLATES = [
  { bot: 'cos', title: 'Office status brief', note: 'Internal status brief only; no external post.' },
  { bot: 'mgr', title: 'Bot queue check', note: 'Review the task queue and report idle agents.' },
  { bot: 'fixer', title: 'Office Fixer health check', note: 'Diagnose agent errors and suggest fixes; read-only.' },
  { bot: 'joker', title: 'Watercooler joke draft', note: 'Clean joke for the office feed only.' },
  { bot: 'outreach', title: 'Client outreach draft', note: 'Draft only; never sends messages.' },
  { bot: 'social', title: 'Social post draft', note: 'Draft only; no posting without CEO approval.' },
  { bot: 'product', title: 'Product clip idea', note: 'Internal idea only; no upload.' },
  { bot: 'scraper', title: 'Resource scan digest', note: 'Configured public sources only; no login or private pages.' }
];
let shiftCursor = 0;
let lastShiftPlanAt = 0;
function generateShiftProposals(manual) {
  const list = [];
  for (let i = 0; i < 2; i++) {
    const t = SHIFT_TEMPLATES[shiftCursor % SHIFT_TEMPLATES.length];
    shiftCursor++;
    list.push({
      id: 'S' + Date.now().toString(36) + '-' + i + '-' + crypto.randomBytes(3).toString('hex'),
      at: Date.now(), status: 'pending', source: 'shift-plan',
      bot: t.bot, title: t.title, note: t.note,
      reason: manual ? 'CEO requested' : 'scheduled shift'
    });
  }
  state.shiftProposals = list.concat(state.shiftProposals).slice(0, 60);
  lastShiftPlanAt = Date.now();
  auditEvent('Office shift proposals generated (' + list.length + ')', manual ? 'CEO' : 'system');
  saveStateNow();
  return list;
}
function decideShiftProposal(id, approve) {
  const proposal = state.shiftProposals.find(x => x.id === String(id || ''));
  if (!proposal) return { ok: false, error: 'Proposal not found.' };
  if (proposal.status !== 'pending') return { ok: false, error: 'Proposal is already ' + proposal.status + '.' };
  proposal.status = approve ? 'approved' : 'rejected';
  proposal.decidedAt = Date.now();
  proposal.decidedBy = 'CEO';
  let task = null;
  if (approve) {
    task = {
      id: 't' + Date.now().toString(36) + '-shift-' + crypto.randomBytes(3).toString('hex'),
      createdAt: Date.now(), attempts: 0, lastError: '', source: 'shift-queue',
      bot: proposal.bot, title: proposal.title,
      approval: true, approved: true, reviewedBy: 'CEO', reviewedAt: Date.now(),
      status: 'queued', note: proposal.note || ''
    };
    state.tasks.push(task);
    if (state.tasks.length > 60) state.tasks = state.tasks.slice(-60);
  }
  auditEvent('Shift proposal ' + (approve ? 'approved' : 'rejected') + ': ' + proposal.title, 'CEO');
  log('🗓 Shift proposal ' + (approve ? 'approved' : 'rejected') + ': ' + proposal.title, 'CEO');
  saveStateNow();
  return { ok: true, proposal, task };
}
setInterval(() => {
  if (state.stopped || state.running) return;
  if (Date.now() - lastShiftPlanAt < SHIFT_INTERVAL_MS) return;
  if (quotaLow()) return; // never spend quota while the office is holding
  if (state.shiftProposals.some(x => x.status === 'pending')) return; // wait for CEO decision
  try { generateShiftProposals(false); }
  catch (e) { log('Shift planner error: ' + e.message, 'system'); }
}, 60000);

/* ---------- 24/7 routines ---------- */
let lastRoutineAt = 0;
async function runRoutine(id, manual) {
  const r = state.routines.find(x => x.id === id);
  if (!r) return { ok: false, error: 'No such routine' };
  if (!manual && (state.running || state.stopped)) return { ok: false, reason: 'busy or stopped' };
  if (!manual && r.holdUntil && Date.now() < r.holdUntil) return { ok: false, reason: 'quota-hold' };
  if (!manual && quotaLow()) {
    r.holdUntil = Date.now() + 10 * 60 * 1000; // retry after 10 minutes, no AI call now
    saveRoutines();
    log('⏸ Routine HOLD (quota): ' + r.name, r.agent);
    auditEvent('Routine HOLD (quota): ' + r.id, 'system');
    return { ok: false, reason: 'quota-low' };
  }
  state.running = true;
  try {
    log('Routine started: ' + r.name, r.agent);
    if (r.fn === 'weeklyRecap') {
      const stt = publicState();
      const cfg = videoConfigFrom({
        mode: 'recap', format: 'wide', title: 'Weekly Office Recap',
        tagline: (stt.agents || []).length + ' AI employees - ' + (stt.tasks || []).length +
          ' tasks - ' + (stt.products || []).length + ' products - ' + (stt.routines || []).length + ' routines',
        cta: 'Dream Bigger. Let AI Work Harder!', watermark: false,
      });
      const out = await renderOfficeVideo(cfg, 'weekly-recap');
      state.outputs[r.agent] = out.url;
      log('🎬 Weekly recap video: ' + out.url, 'video');
    } else {
      state.outputs[r.agent] = await runAgent(r.agent, !manual);
    }
    r.lastRun = Date.now();
    r.holdUntil = 0;
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
/* P0: deterministic per-routine jitter + minimum gap prevents a burst of AI calls. */
const ROUTINE_MIN_GAP_MS = 12000;
function routineJitterMs(r) {
  const base = Math.max(1, Number(r.minutes) || 60) * 60000;
  const byte = crypto.createHash('sha1').update(String(r.id)).digest()[0];
  return Math.round(Math.min(base * 0.15, 5 * 60000) * (byte / 255));
}
setInterval(async () => {
  if (state.stopped || state.running) return;
  if (Date.now() - lastRoutineAt < ROUTINE_MIN_GAP_MS) return;
  const now = Date.now();
  let recapWindow = false;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Manila', weekday: 'short', hour: '2-digit', hour12: false}).formatToParts(new Date());
    const wd = (parts.find(x => x.type === 'weekday') || {}).value;
    const hh = Number((parts.find(x => x.type === 'hour') || {}).value || 0);
    recapWindow = wd === 'Mon' && hh >= 8 && hh < 9;
  } catch (_) {}
  const due = state.routines
    .filter(r => r.enabled && r.minutes > 0 && !(r.holdUntil && now < r.holdUntil))
    .filter(r => now - (r.lastRun || 0) >= r.minutes * 60000 + routineJitterMs(r))
    .filter(r => r.fn !== 'weeklyRecap' || recapWindow)
    .sort((a, b) => (a.lastRun || 0) - (b.lastRun || 0))[0];
  if (due) await runRoutine(due.id, false);
}, 10000);

/* ===== 🧩 CONTENT PIPELINE — Scout → Writer → Voice → Assembler → Publisher → Analyst =====
   Isang real AI pipeline para sa affiliate + Reels content (tutorial, halamang
   gamot, trending topics). Nasa ibabaw lang ito ng umiiral nang callGroq/callAI
   at state — walang bagong interval, walang mabigat na dependency, at ligtas
   sa health claims. */
const CP_DISCLAIMER = 'For educational purposes only. Not medical advice. Consult a healthcare professional.';
const CP_TOPIC_POOL = [
  '3 halamang gamot na madaling itanim sa bahay',
  'Paano gumawa ng simpleng herbal tea mula sa sariling hardin',
  '5 kitchen ingredients na may traditional na gamit',
  'Tutorial: tamang pagpapatuyo at pag-iimbak ng mga halaman',
  'Trending "what I eat in a day" gamit ang lokal na ingredients',
  'Paano gumawa ng natural na insect repellent',
  '3 tutorial sa paggamit ng affiliate product para sa beginners',
  'Behind the scenes: pag-aalaga ng halamang gamot sa maliit na espasyo',
  'Trending recipe gamit ang herbs na abot-kamay',
  'Review: affiliate product na ginamit ko sa loob ng 7 araw',
  'Paano pumili ng tamang halaman para sa panimulang hardin',
  'Quick tutorial: 3 gamit ng isang karaniwang halaman sa kusina'
];

function cpCleanJSON(raw) {
  if (!raw) return null;
  let s = String(raw).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch (e) { return null; }
}
// Shuffle-bag sa server: hindi nauulit ang topic hangga't hindi pa nauubos ang pool.
function cpBag(key, pool) {
  if (!cpBag._b) cpBag._b = {};
  let b = cpBag._b[key];
  if (!b || !b.length) {
    b = cpBag._b[key] = pool.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t;
    }
  }
  return b.pop();
}
async function cpCall(sys, user, max) {
  try { return await callGroq(sys, user, max); } catch (e) {}
  return await callAI(sys, user, max);
}
function cpRecentTopics(n) {
  return (state.contentPipeline || []).slice(0, n || 14)
    .map(x => x && x.topic).filter(Boolean);
}

// 🔍 SCOUT — kumuha ng trending, hindi nauuulit, at ginagabayan ng 👍 ni CEO.
async function cpGenerateIdeas(count) {
  const cfg = state.config || {};
  const niche = cfg.niche || 'herbal plants and tutorials';
  const platform = cfg.platform || 'Instagram Reels';
  const language = cfg.language || 'Taglish';
  const liked = (state.contentPipeline || []).filter(x => x && x.rating === 1)
    .slice(0, 5).map(x => x.topic).filter(Boolean);
  const recent = cpRecentTopics(14);
  const n = Math.max(1, Math.min(8, Number(count) || 6));
  let ideas = null;

  try {
    const sys = 'You are a viral short-form content researcher. Return ONLY valid JSON, no markdown, no intro. ' +
      'Write in natural Taglish. Niche: health education, herbal plants, tutorials, affiliate product demos. ' +
      'SAFETY: never claim any plant or product cures a disease — use educational/experiential framing only.';
    const user = 'Niche: ' + niche + '\nPlatform: ' + platform + '\nLanguage: ' + language + '\n' +
      'Return JSON exactly: {"ideas":[{"topic":"short hook-ready topic","angle":"why it works","hashtags":["#tag"]}]} with exactly ' + n + ' ideas.\n' +
      (liked.length ? 'Topics the CEO LIKED — make more like these: ' + liked.join(' | ') + '\n' : '') +
      'DO NOT repeat these recent topics: ' + (recent.join(' | ') || 'none') + '\n' +
      'Ideas must be trending-style tutorial or "alam ba ninyo" format, safe for Reels/TikTok.';
    const parsed = cpCleanJSON(await cpCall(sys, user, 900));
    if (parsed && Array.isArray(parsed.ideas)) {
      ideas = parsed.ideas.filter(x => x && x.topic).slice(0, n).map(x => ({
        topic: String(x.topic).slice(0, 180),
        angle: String(x.angle || '').slice(0, 300),
        hashtags: Array.isArray(x.hashtags) ? x.hashtags.slice(0, 8).map(String) : []
      }));
    }
  } catch (e) {}

  if (!ideas || !ideas.length) {
    ideas = [];
    const used = recent.map(s => String(s).toLowerCase());
    let guard = 0;
    while (ideas.length < n && guard++ < 120) {
      let t = cpBag('topics', CP_TOPIC_POOL);
      const key = String(t).toLowerCase();
      // Una: iwasan ang mga recent topics. Kapag naubos na ang pool, bagong
      // anggle na lang — hindi na uuulitin ang eksaktong pamagat.
      if (used.some(u => u === key)) {
        if (guard <= CP_TOPIC_POOL.length) continue;
        t = 'Bagong anggle: ' + String(t);
      }
      used.push(key);
      ideas.push({ topic: t, angle: 'Educational + trending format, safe for Reels.', hashtags: ['#herbs', '#tutorial', '#fyp'] });
    }
  }

  const now = Date.now();
  const made = ideas.map((x, i) => ({
    id: 'cp' + now + '_' + i, t: now + i, stage: 'idea',
    topic: String(x.topic || '').slice(0, 180),
    angle: String(x.angle || '').slice(0, 300),
    hashtags: Array.isArray(x.hashtags) ? x.hashtags.slice(0, 8).map(String) : [],
    script: null, rating: 0, niche: niche, platform: platform, language: language
  }));
  state.contentPipeline = made.concat(state.contentPipeline || []).slice(0, 30);
  saveStateNow();
  log('Content pipeline: Scout found ' + made.length + ' new ideas', 'system');
  return made;
}

// ✍️ WRITER — idea → hook/beats/shot-list/caption/CTA + disclaimer.
async function cpWriteScript(id) {
  const item = (state.contentPipeline || []).find(x => x && x.id === id);
  if (!item) throw new Error('Item not found');
  const cfg = state.config || {};
  const link = cfg.affiliateLink || '';
  const platform = item.platform || cfg.platform || 'Instagram Reels';
  const language = item.language || cfg.language || 'Taglish';
  let sc = null;

  try {
    const sys = 'You are a short-form video scriptwriter. Return ONLY valid JSON, no markdown, no intro. ' +
      'Write in natural Taglish. SAFETY: never claim a cure; educational framing only; include the exact disclaimer string provided.';
    const user = 'Topic: ' + item.topic + '\nAngle: ' + item.angle + '\nPlatform: ' + platform + '\nLanguage: ' + language + '\n' +
      (link ? 'Affiliate link to mention naturally in the CTA: ' + link + '\n' : '') +
      'Disclaimer (include exactly): ' + CP_DISCLAIMER + '\n' +
      'Return JSON exactly: {"hook":"first 3 seconds","beats":["b1","b2","b3"],"shotList":["s1","s2","s3"],"caption":"post caption","hashtags":["#tag"],"cta":"call to action","disclaimer":"..."} Keep it under 60 spoken seconds.';
    const parsed = cpCleanJSON(await cpCall(sys, user, 1100));
    if (parsed && parsed.hook) sc = parsed;
  } catch (e) {}

  if (!sc) {
    sc = {
      hook: 'Alam ba ninyo na ' + item.topic + ' ay pwede nang gawin sa bahay?',
      beats: ['Ito ang basics — simple at hindi nakakalito.', 'Ganito ang tamang paraan, step by step.', 'Ito ang resulta at mga tips para hindi mag-error.'],
      shotList: ['Close-up ng ingredients / product', 'Demo ng hakbang (top-down shot)', 'Resulta + natural reaction'],
      caption: item.topic + ' — tutorial na pwede ninyong subukan.',
      hashtags: (item.hashtags || []).length ? item.hashtags.slice(0, 6) : ['#tutorial', '#herbs', '#fyp', '#affiliate'],
      cta: link ? 'Check ang link sa bio para sa gamit na ginamit ko!' : 'I-save ang video para hindi mawala!',
      disclaimer: CP_DISCLAIMER
    };
  }
  item.script = {
    hook: String(sc.hook || '').slice(0, 240),
    beats: (Array.isArray(sc.beats) ? sc.beats : []).slice(0, 5).map(x => String(x).slice(0, 240)),
    shotList: (Array.isArray(sc.shotList) ? sc.shotList : []).slice(0, 6).map(x => String(x).slice(0, 180)),
    caption: String(sc.caption || '').slice(0, 1200),
    hashtags: (Array.isArray(sc.hashtags) ? sc.hashtags : []).slice(0, 10).map(x => String(x).slice(0, 40)),
    cta: String(sc.cta || '').slice(0, 300),
    disclaimer: CP_DISCLAIMER
  };
  item.stage = 'script';
  saveStateNow();
  log('Content pipeline: script written for "' + item.topic + '"', 'system');
  return item;
}

// 📊 ANALYST — ang 👍/👎 ay dumidiretso sa susunod na Scout prompt.
function cpRate(id, rating) {
  const item = (state.contentPipeline || []).find(x => x && x.id === id);
  if (!item) return null;
  item.rating = rating === 1 ? 1 : rating === -1 ? -1 : 0;
  saveStateNow();
  return item;
}

// 🎬 ASSEMBLER — script → video editor brief (gumagamit ng existing AI video editor).
async function cpWriteBrief(id) {
  const item = (state.contentPipeline || []).find(x => x && x.id === id);
  if (!item) throw new Error('Item not found');
  if (!item.script) throw new Error('Kailangan muna ang script ng Writer');
  const sc = item.script;
  const briefText = 'Title: ' + item.topic + '\nHook: ' + sc.hook + '\nBeats: ' +
    (sc.beats || []).join(' | ') + '\nShots: ' + (sc.shotList || []).join(' | ') +
    '\nCTA: ' + sc.cta + '\nFormat: vertical short-form\nLanguage: Taglish';
  let cfg = null;
  try {
    const sys = 'You are the AI Video Editor Assistant of Cyborg Cheebee Office. Convert the CEO brief into ONLY a JSON object with keys: title, tagline, cta, format (vertical|wide), mode (product|recap|agent|campus), color1 (#rrggbb), color2 (#rrggbb), imageUrl (string or empty), voiceoverUrl (string or empty), captions (array of short strings). No markdown, no explanation. Match the language of the brief.';
    const raw = await cpCall(sys, 'Brief: ' + briefText, 500);
    const m = String(raw).match(/\{[\s\S]*\}/);
    if (m) cfg = videoConfigFrom(JSON.parse(m[0]));
  } catch (e) {}
  if (!cfg) cfg = videoConfigFrom({
    title: String(item.topic).slice(0, 80), tagline: sc.hook, cta: sc.cta,
    format: 'vertical', mode: 'product', color1: '#7fc7ff', color2: '#e8b04a',
    captions: (sc.beats || []).slice(0, 6)
  });
  item.brief = cfg;
  item.stage = 'brief';
  saveStateNow();
  log('Content pipeline: video brief ready for "' + item.topic + '"', 'system');
  return item;
}

// 🛍️ Ibalik ang Shopee affiliate links kahit burahin ng redeploy ang data/.
function ensureShopeeLinks() {
  try {
    const links = Array.isArray(state.config.shopeeLinks) ? state.config.shopeeLinks : [];
    if (!links.length || (state.products && state.products.length)) return;
    const now = Date.now();
    links.slice(0, 12).forEach((u, i) => {
      if (state.products.some(p => p.url === u)) return;
      state.products.push({ id: 'p' + now + '-' + i, url: u, title: 'Shopee Affiliate Find',
        description: 'Tingnan ang presyo at detalye bago bumili.', price: 0, status: 'queued',
        output: '', replyId: '', provider: '', createdAt: now });
      if (!state.mall.some(m => m.url === u)) state.mall.push({ id: 'm' + now + '-' + i,
        name: 'Shopee Affiliate Find', price: 0, emoji: '🛍️', url: u, cat: 'shopee',
        caption: 'Tingnan ang presyo at detalye bago bumili.', createdAt: now });
    });
    scheduleSave();
    log('Shopee affiliate links ready: ' + links.length, 'system');
  } catch (e) {}
}

/* 💬 Watercooler chatter now runs on the SERVER, so the bots keep talking even
   when no CEO tab is open / the CEO session expired. generateConversation()
   reuses the last conversation for 3 minutes so the comic bubbles stay alive,
   while open tabs still never spend extra AI calls. */
async function conversationTick() {
  try {
    if (state.stopped || state.running || quotaLow()) return;
    const recent = state.conversations[0];
    if (recent && Date.now() - (recent.t || 0) < 3 * 60 * 1000) return;
    await generateConversation();
  } catch (e) {
    log('Watercooler tick failed — ' + e.message, 'system');
  }
}
setTimeout(conversationTick, 30000);
setInterval(conversationTick, 3 * 60 * 1000);

/* ================= 🛒 CYBORG BAZAAR (business-only MMORPG progression) ================= */
const BAZAAR_LEVELS = [
  { name: 'Intern',   xp: 0 },
  { name: 'Clerk',    xp: 100 },
  { name: 'Manager',  xp: 250 },
  { name: 'Director', xp: 500 },
  { name: 'Partner',  xp: 900 },
  { name: 'Tycoon',   xp: 1500 }
];
const BAZAAR_TASKS = [
  { id: 'checkin', label: 'Daily check-in',        coin: 10, xp: 10, target: 1 },
  { id: 'stalls',  label: 'Visit 3 market stalls',  coin: 15, xp: 15, target: 3 },
  { id: 'posts',   label: 'Read 2 product posts',   coin: 15, xp: 15, target: 2 },
  { id: 'bots',    label: 'Talk to 2 office bots',  coin: 10, xp: 10, target: 2 },
  { id: 'order',   label: 'Place 1 mall order',     coin: 20, xp: 20, target: 1 },
  { id: 'share',   label: 'Share 1 affiliate product', coin: 25, xp: 25, target: 1 },
  { id: 'content', label: 'Share 1 office content',    coin: 25, xp: 25, target: 1 }
];
const CORE_TASK_IDS = ['checkin', 'stalls', 'posts', 'bots', 'order'];
const BAZAAR_BONUS = { coin: 30, xp: 30 };
const POD_PARTS = { desk: 20, pc: 30, chair: 15, plant: 10, sign: 25, shelf: 30 };
// 🏆 Visitor badges — goods-only rewards (tokens for Shopee goods, never cash)
const VISITOR_BADGES = [
  { id: 'explorer', name: 'Explorer',   emoji: '🧭', desc: 'Bisitahin ang 3 zones',        coins: 15, xp: 10, need: 3 },
  { id: 'shopper',  name: 'Shopper',    emoji: '🛍️', desc: 'Pindutin ang 3 Shopee stalls', coins: 20, xp: 12, need: 3 },
  { id: 'regular',  name: 'Regular',    emoji: '⭐', desc: 'Mag-check-in ng 3 araw',       coins: 30, xp: 20, need: 3 },
  { id: 'vip',      name: 'VIP',        emoji: '👑', desc: 'Tapusin lahat ng daily tasks', coins: 50, xp: 30, need: 1 }
];
const EVENT_HOSTS = ['🤖 HOST BOT', '🛍️ DEMO BOT', '🎧 DJ BOT'];
function ensureVisitorBadges(v) {
  v.zones = Array.isArray(v.zones) ? v.zones.slice(-40) : [];
  v.badgeStalls = Array.isArray(v.badgeStalls) ? v.badgeStalls.slice(-60) : [];
  v.badgeDays = Array.isArray(v.badgeDays) ? v.badgeDays.slice(-60) : [];
  v.badges = Array.isArray(v.badges) ? v.badges : [];
  return v;
}
function badgeProgress(v, id) {
  ensureVisitorBadges(v);
  if (id === 'explorer') return v.zones.length;
  if (id === 'shopper') return v.badgeStalls.length;
  if (id === 'regular') return v.badgeDays.length;
  if (id === 'vip') { const d = ensureVisitorDay(v); return CORE_TASK_IDS.every(x => d.done[x]) ? 1 : 0; }
  return 0;
}
function awardBadge(v, id) {
  const def = VISITOR_BADGES.find(x => x.id === id);
  if (!def || (v.badges || []).includes(id)) return null;
  if (badgeProgress(v, id) < def.need) return null;
  v.badges = (v.badges || []).concat(id);
  const g = sponsoredGrant(v, def.coins, def.xp, def.coins / GOODS_TOKENS_PER_PESO);
  log('🏆 ' + cleanTxt(v.name) + ' earned ' + def.emoji + ' ' + def.name + ' badge', 'bazaar');
  scheduleSave();
  return { id: def.id, name: def.name, emoji: def.emoji, coins: def.coins, xp: def.xp, sponsored: g.sponsored };
}

function bazaarDay() {
  const d = new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' });
}
function fbCfg() {
  const d = readSettingsMerged();
  return {
    id: String(d.fbAppId || process.env.FB_APP_ID || ''),
    secret: String(d.fbAppSecret || process.env.FB_APP_SECRET || ''),
    redirect: String(d.fbRedirectUri || process.env.FB_REDIRECT_URI || '')
  };
}
function levelFor(xp) {
  let idx = 0;
  BAZAAR_LEVELS.forEach((l, i) => { if ((xp || 0) >= l.xp) idx = i; });
  const cur = BAZAAR_LEVELS[idx], next = BAZAAR_LEVELS[idx + 1] || null;
  return {
    index: idx, name: cur.name, xp: xp || 0, next: next ? next.name : 'MAX',
    need: next ? next.xp : 0,
    pct: next ? Math.min(100, Math.round(((xp || 0) - cur.xp) / (next.xp - cur.xp) * 100)) : 100
  };
}
function ensureVisitorDay(v) {
  const day = bazaarDay();
  if (!v.day || v.day.date !== day) {
    v.day = { date: day, progress: { stalls: 0, posts: 0, bots: 0 }, done: {}, ids: {}, claimed: false };
  }
  return v.day;
}
function getOrCreateVisitor(id, name, picture) {
  let v = state.visitors[id];
  if (!v) {
    v = {
      id: id, name: String(name || 'Visitor').slice(0, 60), picture: String(picture || '').slice(0, 500),
      coins: 0, xp: 0, earned: 0, paidOrders: 0, joined: Date.now(), day: null, wish: null,
      pod: { desk: 0, pc: 0, chair: 0, plant: 0, sign: 0, shelf: 0 },
      zones: [], badgeStalls: [], badgeDays: [], badges: []
    };
    state.visitors[id] = v;
    scheduleSave();
  }
  return v;
}
function visitorView(v) {
  const d = ensureVisitorDay(v);
  const tasks = BAZAAR_TASKS.map(t => ({
    id: t.id, label: t.label, target: t.target,
    progress: t.id === 'stalls' || t.id === 'posts' || t.id === 'bots' ? (d.progress[t.id] || 0) : (d.done[t.id] ? 1 : 0),
    done: !!d.done[t.id], coin: t.coin, xp: t.xp
  }));
  const lv = levelFor(v.xp);
  return {
    id: v.id, name: v.name, picture: v.picture, coins: v.coins || 0,
    level: lv, commissionCut: LEVEL_CUT[lv.index],
    earned: v.earned || 0, paidOrders: v.paidOrders || 0,
    earnings: {
      total: v.earned || 0, orders: v.paidOrders || 0,
      shares: state.bazaarShares.filter(s => s.vid === v.id).slice(-8).reverse()
        .map(s => ({ id: s.id, kind: s.kind, title: s.title, clicks: s.clicks || 0, orders: s.orders || 0, paid: s.paid || 0, at: s.at }))
    },
    wallet: { tokens: v.coins || 0, goodsRate: GOODS_TOKENS_PER_PESO,
      redeemable: Math.round((v.coins || 0) / GOODS_TOKENS_PER_PESO * 100) / 100 },
    redemptions: state.redemptions.filter(x => x.vid === v.id).slice(-8).reverse(),
    goodsRate: GOODS_TOKENS_PER_PESO,
    pod: v.pod || {}, wish: v.wish || null, joined: v.joined,
    day: d.date, tasks: tasks, bonus: BAZAAR_BONUS,
    allDone: CORE_TASK_IDS.every(id => d.done[id]),
    badges: (ensureVisitorBadges(v).badges || []).slice(),
    badgeProgress: Object.fromEntries(VISITOR_BADGES.map(b => [b.id, Math.min(b.need, badgeProgress(v, b.id))]))
  };
}
function grantVisitor(v, coin, xp) {
  const before = levelFor(v.xp).name;
  v.coins = (v.coins || 0) + coin;
  v.xp = (v.xp || 0) + xp;
  const after = levelFor(v.xp).name;
  scheduleSave();
  return { coin: coin, xp: xp, levelUp: before !== after ? after : null };
}
function sponsoredGrant(v, coin, xp, rate) {
  const funded = fundFromCampaigns(rate);
  const r = grantVisitor(v, funded > 0 ? coin : 0, xp);
  r.sponsored = funded;
  r.unfunded = funded <= 0;
  return r;
}

/* ---------- 🐾 CARE & RETURN helpers ---------- */
function careClamp(n) { return Math.max(0, Math.min(100, Math.round(Number(n) || 0))); }
function careDay(v) {
  const d = ensureVisitorDay(v);
  if (!d.care || typeof d.care !== 'object') d.care = { acts: 0, rewarded: 0 };
  return d.care;
}
function botCareView(id, now) {
  now = now || Date.now();
  const c = state.botCare[id] || { battery: 100, mood: 100, lastCharge: now };
  const lc = Number(c.lastCharge) || now;
  const e = Math.max(0, now - lc);
  const battery = careClamp((c.battery == null ? 100 : Number(c.battery)) - e / CARE.botFullMs * 100);
  const mood = careClamp((c.mood == null ? 100 : Number(c.mood)) - e / CARE.botMoodMs * 100);
  const face = battery >= 65 ? '😄' : battery >= 35 ? '🙂' : battery >= 15 ? '😟' : '😵';
  const label = battery >= 65 ? 'Masaya' : battery >= 35 ? 'OK lang' : battery >= 15 ? 'Lowbat na!' : 'Kailangan ng charge!';
  return { id: id, battery: battery, mood: mood, face: face, label: label,
    needCharge: battery < 35, lastCharge: lc };
}
function plotView(p, now) {
  now = now || Date.now();
  const planted = Number(p.planted) || now, watered = Number(p.watered) || planted;
  const dry = Math.max(0, now - watered);
  const health = dry <= CARE.waterWindowMs ? 100
    : careClamp(100 - (dry - CARE.waterWindowMs) / (CARE.witherMs - CARE.waterWindowMs) * 100);
  const growth = careClamp(p.growth || 0);
  const stage = health <= 0 ? 'dead' : growth >= 100 ? 'ready' : growth >= 66 ? 'mature' : growth >= 33 ? 'growing' : 'sprout';
  const ci = Math.max(0, Math.min(CARE.crops.length - 1, Number(p.crop) || 0));
  const face = health <= 0 ? '💀' : dry > CARE.waterWindowMs ? '🥀' : dry > CARE.waterWindowMs * .6 ? '😟' : stage === 'ready' ? '🌾' : '🌿';
  return { crop: CARE.crops[ci], health: health, growth: growth, stage: stage, face: face,
    dryMs: dry, dead: health <= 0, ready: stage === 'ready',
    needWater: health > 0 && dry >= CARE.minWaterGapMs,
    thirsty: dry > CARE.waterWindowMs * .6 };
}
function ensureVisitorFarm(v) {
  if (!v.farm || !Array.isArray(v.farm.plots)) {
    const now = Date.now();
    // Unang pasok: may uhaw at may halos matuyo na — may agad na aalagaan.
    v.farm = { plots: [
      { crop: 0, planted: now - 26 * 3600e3, watered: now - 14 * 3600e3, growth: 20 },
      { crop: 1, planted: now - 40 * 3600e3, watered: now - 23 * 3600e3, growth: 55 },
      { crop: 2, planted: now - 8 * 3600e3,  watered: now - 3 * 3600e3,  growth: 70 }
    ] };
    scheduleSave();
  }
  return v.farm;
}
function careReward(v, coin, xp) {
  const c = careDay(v);
  if (c.rewarded >= CARE.dailyRewardCap) return { capped: true };
  c.rewarded++;
  return sponsoredGrant(v, coin, xp, TASK_SPONSOR_RATE);
}
function markVisitorTask(v, type, key) {
  const def = BAZAAR_TASKS.find(t => t.id === type);
  if (!def) return null;
  const d = ensureVisitorDay(v);
  // 🛡️ Limit: bisita ay may cap sa actions kada araw — walang spam / farming
  d.calls = (d.calls || 0) + 1;
  if (d.calls > 80) return null;
  if (d.done[type]) return null;
  let got = null;
  if (type === 'checkin' || type === 'order') {
    d.done[type] = true;
    got = sponsoredGrant(v, def.coin, def.xp, TASK_SPONSOR_RATE);
  } else {
    const id = String(key || 'x').slice(0, 80);
    const k = type + ':' + id;
    if (d.ids[k]) return null;
    d.ids[k] = 1;
    d.progress[type] = (d.progress[type] || 0) + 1;
    if (d.progress[type] >= def.target) {
      d.done[type] = true;
      got = sponsoredGrant(v, def.coin, def.xp, TASK_SPONSOR_RATE);
    }
  }
  let bonus = null;
  if (!d.claimed && CORE_TASK_IDS.every(id => d.done[id])) {
    d.claimed = true;
    bonus = sponsoredGrant(v, BAZAAR_BONUS.coin, BAZAAR_BONUS.xp, TASK_BONUS_SPONSOR_RATE);
  }
  scheduleSave();
  return { reward: got, bonus: bonus };
}
function signBazaarToken(obj) {
  const p = Buffer.from(JSON.stringify(obj)).toString('base64url');
  const s = crypto.createHmac('sha256', String(state.bazaarSecret)).update(p).digest('base64url');
  return p + '.' + s;
}
function readBazaarToken(tok) {
  try {
    const parts = String(tok || '').split('.');
    if (parts.length !== 2) return null;
    const want = crypto.createHmac('sha256', String(state.bazaarSecret)).update(parts[0]).digest('base64url');
    const gotBuf = Buffer.from(parts[1]);
    const wantBuf = Buffer.from(want);
    if (gotBuf.length !== wantBuf.length || !crypto.timingSafeEqual(gotBuf, wantBuf)) return null;
    const o = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!o.id || (o.exp && o.exp < Date.now())) return null;
    return o;
  } catch (e) { return null; }
}
function visitorIdFrom(req, fallback) {
  const ck = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('bz='));
  if (ck) {
    const o = readBazaarToken(decodeURIComponent(ck.slice(3)));
    if (o && o.id) {
      // self-heal: rebuild visitor from signed cookie after a server restart wipes state
      if (!state.visitors[o.id]) getOrCreateVisitor(o.id, o.name || 'Visitor', o.picture || '');
      return o.id;
    }
  }
  return fallback ? String(fallback).slice(0, 80) : null;
}
function setBazaarCookie(res, id, name, picture, req) {
  const max = 30 * 86400;
  const v = state.visitors[id] || {};
  const secure = String((req && req.headers && req.headers['x-forwarded-proto']) || '').split(',')[0].trim() === 'https';
  res.setHeader('Set-Cookie', 'bz=' + encodeURIComponent(signBazaarToken({ id: id, name: String(name || v.name || '').slice(0, 60), picture: String(picture || v.picture || '').slice(0, 500), exp: Date.now() + max * 1000 })) + '; Path=/; HttpOnly; SameSite=Lax' + (secure ? '; Secure' : '') + '; Max-Age=' + max);
}

function ceoPassword() {
  const cfg = readSettingsMerged();
  return String(process.env.CEO_PASSWORD || cfg.password || '');
}

/* ---------- HTTP helpers ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.pdf': 'application/pdf'
};
/* Compressible text types. Small responses are skipped (CPU > gain). */
function compressible(type) {
  return /^(text\/|application\/(json|javascript|xml|manifest\+json)|image\/svg)/.test(String(type || ''));
}
/* gzip for clients that accept it + smart Cache-Control:
   - static assets: cached 1 day (they only change between deploys)
   - html: no-cache (always revalidate, stay official)
   - everything else (API): no-store (never cached) */
function send(res, code, body, type, cache) {
  const t = type || 'application/json; charset=utf-8';
  let out = body, enc = null;
  const cc = (res.req && res.req.headers && res.req.headers['accept-encoding']) || '';
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body == null ? '' : body));
  if (buf.length > 1024 && compressible(t) && /\bgzip\b/i.test(cc) && code !== 204) {
    try { out = zlib.gzipSync(buf, { level: 6 }); enc = 'gzip'; } catch (e) { out = buf; }
  }
  const headers = {
    'Content-Type': t,
    'Cache-Control': cache === 'static' ? 'public, max-age=86400' : cache === 'html' ? 'no-cache' : 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN'
  };
  if (enc) { headers['Content-Encoding'] = enc; headers['Vary'] = 'Accept-Encoding'; headers['Content-Length'] = String(out.length); }
  res.writeHead(code, headers);
  res.end(out);
}
function sendJSON(res, code, obj) { send(res, code, JSON.stringify(obj)); }
function body(req) {
  if (req._body) return Promise.resolve(req._body);
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
    agents: AGENT_META.concat(state.hires), routines: state.routines, layout: state.layout,
    sources: state.sources, memory: state.memory, chat: state.chat, products: state.products,
    mall: state.mall,
    conversations: state.conversations,
    // 🧩 Content pipeline — 12 lang para maliit ang /api/state poll.
    contentPipeline: (state.contentPipeline || []).slice(0, 12),
    activity: state.activity, stopped: state.stopped, running: state.running,
    // P0/P2: drift/quota/agent errors + governance ledgers — no secrets included.
    health: systemHealth(),
    approvalLog: state.approvalLog, publishLedger: state.publishLedger, ledger: state.ledger,
    shiftProposals: state.shiftProposals,
    // ⚠️ PUBLIC: hinding-hindi isasama ang aktwal na API keys — CEO lang kumukuha via /api/private
    setup: { hasKey: !!s.apiKey, model: s.model, provider: s.provider, baseUrl: s.baseUrl,
      keys: {}, failover: s.failover }
  };
}

let limitsCache = { at: 0, data: null };

// ===== 🛡️ ANTI-HACKER SHIELD: rate limiting + brute-force lockout (per IP) =====
const guard = new Map(); // ip -> {n, t0, bad, lastBad}
// P1: CEO session tokens — password is used once at unlock, not on every request.
const sessions = new Map(); // token -> {ip, at, expires}
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
function newSession(ip) {
  const token = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  sessions.set(token, { ip: String(ip || 'x'), at: now, expires: now + SESSION_TTL_MS });
  if (sessions.size > 500) for (const [k, v] of sessions) if (v.expires < now) sessions.delete(k);
  return token;
}
function tokenValid(req) {
  const tok = String((req.headers && req.headers['x-ceo-token']) || '');
  const s = tok ? sessions.get(tok) : null;
  return !!(s && s.expires > Date.now());
}
// Legacy password fallback is kept during transition; the UI no longer stores it.
function ceoAuthorized(req, b) {
  return tokenValid(req) || (!!ceoPassword() && String((b && b.pass) || '') === ceoPassword());
}
const orderRate = new Map(); // ip -> {windowStart, count}
const oauthStates = new Map(); // FB OAuth state -> issued at (short-lived)
const fbCodeCache = new Map(); // FB auth code -> {id,name,picture,at} (idempotent callback: browser/Render may hit callback twice)
const cleanTxt = s => String(s || '').replace(/[<>&"'`]/g, '').trim().slice(0, 80);
function reqOrigin(req) {
  const host = String((req.headers && req.headers.host) || ('localhost:' + PORT));
  const proto = String((req.headers && req.headers['x-forwarded-proto']) || 'http').split(',')[0].trim();
  return proto + '://' + host;
}
function guardBumpBad(ip) {
  const h = guard.get(ip) || { n: 0, t0: Date.now(), bad: 0 };
  h.bad++; h.lastBad = Date.now(); guard.set(ip, h);
  log('🚨 Wrong password attempt #' + h.bad + ' from ' + ip, 'security');
}

// ===== 🎬 VIDEO FACTORY HELPERS (Remotion) =====
function safeVideoName(s) {
  return String(s || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || 'video';
}
function videoConfigFrom(b) {
  b = b || {};
  const hex = (v, fallback) => /^#[0-9a-fA-F]{6}$/.test(v || '') ? v : fallback;
  return {
    title: String(b.title || 'Cyborg Cheebee').slice(0, 120),
    tagline: String(b.tagline || 'Your AI Company. Your AI Team.').slice(0, 220),
    cta: String(b.cta || 'Dream Bigger. Let AI Work Harder!').slice(0, 160),
    brand: String(b.brand || 'CYBORG CHEEBEE OFFICE').slice(0, 120),
    color1: hex(b.color1, '#77eaff'),
    color2: hex(b.color2, '#8b5cf6'),
    format: b.format === 'wide' ? 'wide' : 'vertical',
    mode: ['product', 'recap', 'agent', 'campus'].indexOf(b.mode) >= 0 ? b.mode : 'product',
    watermark: b.watermark !== false,
    imageUrl: /^https?:\/\//i.test(String(b.imageUrl || '').trim()) ? String(b.imageUrl).trim().slice(0, 500) : '',
    captions: Array.isArray(b.captions) ? b.captions.slice(0, 5).map(function (x) { return String(x).slice(0, 160); }) : [],
    voiceoverUrl: /^https?:\/\//i.test(String(b.voiceoverUrl || '').trim()) ? String(b.voiceoverUrl).trim().slice(0, 500) : '',
  };
}
async function renderOfficeVideo(cfg, baseName) {
  if (!fs.existsSync(VIDEO_RENDERER)) throw new Error('Video renderer missing — run npm install inside video/.');
  fs.mkdirSync(VIDEO_DIR, {recursive: true});
  const name = safeVideoName(baseName) + '-' + Date.now();
  const cfgFile = path.join(VIDEO_WORK, '.job-' + name + '.json');
  const outFile = path.join(VIDEO_DIR, name + '.mp4');
  fs.writeFileSync(cfgFile, JSON.stringify(cfg));
  try {
    const r = await execFileAsync(process.execPath, [VIDEO_RENDERER, cfgFile, outFile], {
      cwd: VIDEO_WORK, timeout: 300000, maxBuffer: 8 * 1024 * 1024, windowsHide: true,
    });
    fs.writeFileSync(path.join(VIDEO_DIR, name + '.json'), JSON.stringify(cfg, null, 2));
    log('🎬 Video rendered: ' + name + ' ' + String((r && r.stdout) || '').trim().slice(-100), 'video');
    return {name, url: '/videos/' + name + '.mp4', config: cfg};
  } finally {
    try { fs.unlinkSync(cfgFile); } catch (_) {}
  }
}

const server = http.createServer(async (req, res) => {
  res.req = req;
  const u = new URL(req.url, 'http://localhost:' + PORT);
  const p = u.pathname;
  try {
    // ===== 🛡️ ANTI-HACKER SHIELD (hawak ni BANTAY, ang guard bot): flood + brute-force lockout =====
    const ip = (req.socket.remoteAddress || 'x').toString();
    const ghOld = guard.get(ip), nowMs = Date.now();
    if (ghOld && ghOld.bad >= 10 && ghOld.lastBad && nowMs - ghOld.lastBad < 600000) {
      // locked out: bisita mode lang — PERO ang TOTOONG CEO na may tamang password, papasukin!
      if (req.method === 'POST' && p !== '/api/orders' && !p.startsWith('/api/bazaar/') && !p.startsWith('/api/fb/') && !p.startsWith('/api/care/')) {
        if (p === '/api/unlock') {
          const b = await body(req);
          if (ceoPassword() && String(b.pass || '') === ceoPassword()) {
            log('CEO passed the lockout gate — totoo ang password!', 'security');
          } else return sendJSON(res, 429, { ok: false, error: '🚨 BANTAY: Blocked! Maraming maling tangka. Subukan ulit mamaya.' });
        } else return sendJSON(res, 429, { ok: false, error: '🚨 BANTAY: Blocked! Maraming maling tangka. Subukan ulit mamaya.' });
      }
    }
    let gh = ghOld;
    if (!gh || nowMs - gh.t0 > 60000) gh = { n: 0, t0: nowMs, bad: ghOld ? ghOld.bad : 0 };
    gh.n++;
    if (gh.n > 150) { log('🚨 Flood blocked (' + ip + ') — hawak ni BANTAY', 'security'); return sendJSON(res, 429, { ok: false, error: 'Too many requests' }); }
    guard.set(ip, gh);
    if (guard.size > 5000) {
      for (const [key, value] of guard) {
        if (nowMs - (value.lastBad || value.t0 || 0) > 10 * 60 * 1000) guard.delete(key);
        if (guard.size <= 4000) break;
      }
    }
    // ===== SECURITY: password lock sa lahat ng CEO actions (bisita: tingin lang) =====
    if (req.method === 'POST' && p.startsWith('/api/') && p !== '/api/unlock' && p !== '/api/orders'
        && !p.startsWith('/api/bazaar/') && !p.startsWith('/api/fb/') && !p.startsWith('/api/care/')) {
      const b = await body(req);
      if (!ceoAuthorized(req, b)) {
        guardBumpBad(ip);
        log('Blocked ' + p + ' — missing CEO session or password', 'security');
        return sendJSON(res, 403, { ok: false, error: 'Locked! CEO login required.', sessionExpired: true });
      }
      req._body = b;
    }
    if (p === '/api/unlock' && req.method === 'POST') {
      const b = await body(req);
      const real = ceoPassword();
      const ok = !!real && String(b.pass || '') === real;
      if (ok) {
        const g = guard.get(ip); if (g) { g.bad = 0; g.n = 0; guard.set(ip, g); }
        const token = newSession(ip);
        log('CEO logged in — office unlocked', 'security');
        return sendJSON(res, 200, { ok: true, token, expiresAt: Date.now() + SESSION_TTL_MS });
      }
      guardBumpBad(ip);
      return sendJSON(res, 403, { ok: false, error: 'Mali ang password.' });
    }

    // P1: session verify / logout / password change
    if (p === '/api/session' && req.method === 'GET') {
      const tok = String((req.headers && req.headers['x-ceo-token']) || '');
      const s = sessions.get(tok);
      const ok = !!(s && s.expires > Date.now());
      return sendJSON(res, ok ? 200 : 401, { ok, expiresAt: ok ? s.expires : 0 });
    }
    if (p === '/api/logout' && req.method === 'POST') {
      const tok = String((req.headers && req.headers['x-ceo-token']) || '');
      if (tok) sessions.delete(tok);
      log('CEO logged out', 'security');
      return sendJSON(res, 200, { ok: true });
    }
    if (p === '/api/ceo/password' && req.method === 'POST') {
      const b = await body(req);
      const next = String(b.newPass || '');
      if (next.length < 12) return sendJSON(res, 400, { ok: false, error: 'Password must be at least 12 characters.' });
      const sec = secrets();
      sec.password = next;
      writeJSON(SECRETS_FILE, sec);
      sessions.clear(); // force re-login everywhere with the new password
      auditEvent('CEO password changed; all sessions revoked', 'security');
      return sendJSON(res, 200, { ok: true, sessionsRevoked: true });
    }

    if (p === '/api/health' && req.method === 'GET') {
      const h = systemHealth();
      return sendJSON(res, 200, { ok: true, version: APP_VERSION, uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),
        startedAt: STARTED_AT, stopped: !!state.stopped, running: !!state.running, agents: AGENT_META.length + state.hires.length,
        openTasks: state.tasks.filter(t => t.status !== 'done' && t.status !== 'rejected').length,
        memoryStorage: 'json-files', backupCount: listDataBackups().length,
        codeHash: h.codeHash, loadedCodeHash: h.loadedCodeHash,
        settingsMtime: h.settingsMtime, loadedAt: h.loadedAt,
        drift: h.drift, settingsChanged: h.settingsChanged, quotaLow: h.quotaLow,
        routes: h.routes, agentHealth: h.agentHealth });
    }
    // P1: read-only provider/model preflight (no keys are returned).
    if (p === '/api/preflight' && req.method === 'GET')
      return sendJSON(res, 200, { ok: true, preflight: preflight() });
    /* ---------- P2: governance ledger routes ---------- */
    if (p === '/api/ceo/publish' && req.method === 'POST') {
      const b = req._body || await body(req);
      const action = String(b.action || 'list');
      if (action === 'list')
        return sendJSON(res, 200, { ok: true, entries: state.publishLedger.slice(0, 100) });
      if (action !== 'add') return sendJSON(res, 400, { ok: false, error: 'Unknown publish action.' });
      const platform = cleanTxt(b.platform || '').slice(0, 40);
      const title = cleanTxt(b.title || '').slice(0, 120);
      let url = String(b.url || '').trim().slice(0, 300);
      const note = cleanTxt(b.note || '').slice(0, 240);
      if (!platform || !title) return sendJSON(res, 400, { ok: false, error: 'Platform at title ang kailangan.' });
      if (url && !/^https?:\/\//i.test(url)) return sendJSON(res, 400, { ok: false, error: 'URL must start with http:// or https://.' });
      const row = { id: 'P' + Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex'),
        at: Date.now(), platform, title, url, note, actor: 'CEO', mode: 'manual', approved: true };
      state.publishLedger.unshift(row);
      if (state.publishLedger.length > 300) state.publishLedger.length = 300;
      auditEvent('Manual publish recorded: ' + platform + ' - ' + title, 'CEO');
      saveStateNow();
      return sendJSON(res, 201, { ok: true, entry: row, entries: state.publishLedger.slice(0, 100),
        note: 'Record only. This endpoint does not post to any platform.' });
    }

    if (p === '/api/ceo/backup-drill' && req.method === 'POST') {
      const b = req._body || await body(req);
      const drill = backupRestoreDrill(b.name);
      auditEvent('Backup restore drill ' + (drill.ok ? 'PASSED' : 'FAILED') + ': ' + (drill.name || 'none'), 'CEO');
      log('🧪 Backup restore drill ' + (drill.ok ? 'PASSED' : 'FAILED') + (drill.name ? ': ' + drill.name : ''), 'CEO');
      return sendJSON(res, drill.ok ? 200 : 400, Object.assign({ ok: drill.ok }, drill));
    }

    if (p === '/api/ceo/ledger' && req.method === 'POST') {
      const b = req._body || await body(req);
      const action = String(b.action || 'list');
      if (action === 'list')
        return sendJSON(res, 200, { ok: true, ledger: state.ledger, summary: ledgerSummary() });
      const found = ledgerFind(b.id);
      if (!found) return sendJSON(res, 404, { ok: false, error: 'Ledger entry not found.' });
      if (action === 'reverse') {
        const moved = state.ledger[found.bucket].splice(found.i, 1)[0];
        moved.status = 'reversed'; moved.reversedAt = Date.now(); moved.reversedBy = 'CEO';
        moved.reverseReason = cleanTxt(b.reason || '').slice(0, 200);
        state.ledger.reversed.unshift(moved);
        auditEvent('Ledger reversed: ' + moved.id + ' (' + moved.reverseReason + ')', 'CEO');
        saveStateNow();
        return sendJSON(res, 200, { ok: true, entry: moved, ledger: state.ledger, summary: ledgerSummary() });
      }
      if (action === 'approve-transfer') {
        if (found.bucket !== 'pending') return sendJSON(res, 409, { ok: false, error: 'Only pending entries can be approved.' });
        const moved = state.ledger[found.bucket].splice(found.i, 1)[0];
        moved.status = 'confirmed'; moved.approvedAt = Date.now(); moved.approvedBy = 'CEO';
        state.ledger.confirmed.unshift(moved);
        auditEvent('Ledger approved by CEO (record only): ' + moved.id, 'CEO');
        saveStateNow();
        return sendJSON(res, 200, { ok: true, entry: moved, ledger: state.ledger, summary: ledgerSummary(),
          note: 'Ledger status updated only. No external payment or transfer was executed.' });
      }
      return sendJSON(res, 400, { ok: false, error: 'Unknown ledger action.' });
    }

    if (p === '/api/ceo/ops' && req.method === 'POST') {
      const b = await body(req);
      const action = String(b.action || 'status');
      if (action === 'status') {
        return sendJSON(res, 200, { ok: true, version: APP_VERSION, uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),
          startedAt: STARTED_AT, stopped: !!state.stopped, running: !!state.running,
          counts: { agents: AGENT_META.length + state.hires.length, tasks: state.tasks.length, products: state.products.length,
            orders: state.orders.length, visitors: Object.keys(state.visitors).length, redemptions: state.redemptions.length,
            payouts: state.payouts.length }, research: researchClient.getMetrics(),
          backups: listDataBackups(), lastAudit: recentAudit(8) });
      }
      if (action === 'backup') {
        const backup = createDataBackup();
        log('🛡️ CEO created data backup ' + backup.name, 'CEO');
        return sendJSON(res, 201, { ok: true, backup, backups: listDataBackups(), warning: 'Backup includes private settings and API credentials. Keep it private.' });
      }
      if (action === 'audit') return sendJSON(res, 200, { ok: true, events: recentAudit(b.limit || 100) });
      return sendJSON(res, 400, { ok: false, error: 'Unknown operations action.' });
    }
    // 🔬 CEO-only source-grounded research records (Crawl4AI). POST is already
    // behind the CEO password gate above. GET is intentionally not exposed.
    if (p === '/api/ceo/research' && req.method === 'POST') {
      const b = req._body || await body(req);
      const action = String(b.action || 'list');
      // P1: optional research service health + CEO-only fixed-path start/stop.
      if (action === 'service-status')
        return sendJSON(res, 200, { ok: true, service: await researchClient.getServiceHealth() });
      if (action === 'service-start' || action === 'service-stop') {
        const out = await controlResearch(action === 'service-start' ? 'start' : 'stop');
        auditEvent('Research service ' + (action === 'service-start' ? 'START' : 'STOP') + ' requested by CEO', 'CEO');
        return sendJSON(res, out.ok ? 200 : 500, { ok: !!out.ok, action, error: out.error || '' });
      }
      if (action === 'list') {
        return sendJSON(res, 200, {
          ok: true,
          config: researchClient.config(),
          metrics: researchClient.getMetrics(),
          records: researchClient.getResearchRecords().slice(0, 100),
          corpusCount: researchClient.getResearchCorpus().length,
          digest: researchClient.getTrendDigest()
        });
      }
      if (action === 'refresh') {
        const record = await researchClient.crawlSource(String(b.url || ''), { mode: b.mode || 'fast', fresh: true });
        if (!record) return sendJSON(res, 502, { ok: false, error: 'Research service unavailable or URL rejected.' });
        log('Research refreshed: ' + record.url, 'CEO');
        return sendJSON(res, 200, { ok: true, record });
      }
      if (action === 'review') {
        const item = researchClient.reviewResearch(String(b.url || ''), b.permitted, b.reviewer);
        if (!item) return sendJSON(res, 404, { ok: false, error: 'Record not found.' });
        log('Research record reviewed: ' + item.url + ' → ' + item.permitted, 'CEO');
        return sendJSON(res, 200, { ok: true, record: item });
      }
      if (action === 'gate') {
        const result = researchClient.checkDraft(b.draft, b.urls, { threshold: b.threshold });
        return sendJSON(res, 200, { ok: true, decision: result });
      }
      if (action === 'search') {
        return sendJSON(res, 200, {
          ok: true,
          results: researchClient.searchResearch(String(b.query || ''), Number(b.limit) || 5)
        });
      }
      if (action === 'digest') {
        const urls = Array.isArray(b.urls) ? b.urls : (b.url ? [b.url] : []);
        if (!urls.length) return sendJSON(res, 400, { ok: false, error: 'URLs required for digest.' });
        const digest = await researchClient.buildDigest(urls, { mode: b.mode || 'fast', fresh: Boolean(b.fresh) });
        log('Trend digest built: ' + digest.itemCount + '/' + digest.sourceCount + ' sources', 'CEO');
        return sendJSON(res, 200, { ok: true, digest });
      }
      if (action === 'metrics') return sendJSON(res, 200, { ok: true, metrics: researchClient.getMetrics() });
      return sendJSON(res, 400, { ok: false, error: 'Unknown research action.' });
    }
    if (p === '/api/state' && req.method === 'GET') return sendJSON(res, 200, publicState());
    // 🔐 CEO-only private data (keys + vault links) — dumaan sa password gate sa taas
    if (p === '/api/private' && req.method === 'POST') {
      const s = settings();
      return sendJSON(res, 200, { ok: true, keys: s.keys, failover: s.failover, accounts: state.accounts });
    }

    // ===== CYBORG MALL: paninda + orders ng bisita (walang password ang checkout!) =====
    if (p === '/api/mall' && req.method === 'GET') return sendJSON(res, 200, { mall: state.mall });
    if (p === '/api/mall' && req.method === 'POST') {
      const b = await body(req);
      const item = {
        id: 'm' + Date.now(), name: cleanTxt(b.name),
        price: Math.max(0, Math.min(1e7, Number(b.price) || 0)), emoji: cleanTxt(b.emoji).slice(0, 4) || '🛒',
        url: String(b.url || '').replace(/[<>"'`]/g, '').trim().slice(0, 500),
        // 📌 SHOPEE RULES: affiliate link = nasa loob ng PRODUCT POST (may pangalan, presyo, deskripsyon)
        cat: String(b.cat || 'shopee').replace(/[<>"'`]/g, '').trim().slice(0, 24) || 'shopee',
        caption: String(b.caption || '').replace(/[<>"'`]/g, '').trim().slice(0, 200),
        createdAt: Date.now()
      };
      if (!item.name || !item.url) return sendJSON(res, 400, { ok: false, error: 'Name at Shopee URL required' });
      state.mall.push(item);
      saveStateNow();
      log('Added mall item: ' + item.emoji + ' ' + item.name, 'CEO');
      return sendJSON(res, 200, { ok: true, mall: state.mall });
    }
    if (p === '/api/mall/delete' && req.method === 'POST') {
      const b = await body(req);
      const i = state.mall.findIndex(x => x.id === b.id);
      if (i >= 0) { const gone = state.mall.splice(i, 1)[0]; saveStateNow(); log('Removed mall item: ' + gone.name, 'CEO'); }
      return sendJSON(res, 200, { ok: true, mall: state.mall });
    }
    // ===== 🏦 KEEPER BOT: vault ng account links (LINKS LANG — walang password, para safe!) =====
    if (p === '/api/accounts' && req.method === 'GET')
      return sendJSON(res, 405, { ok: false, error: 'Use the authenticated CEO panel.' });
    if (p === '/api/accounts' && req.method === 'POST') {
      const b = await body(req);
      const acct = {
        id: 'a' + Date.now(), label: cleanTxt(b.label), platform: cleanTxt(b.platform),
        url: String(b.url || '').replace(/[<>"'`]/g, '').trim().slice(0, 500),
        note: cleanTxt(b.note), createdAt: Date.now()
      };
      if (!acct.label || !acct.url) return sendJSON(res, 400, { ok: false, error: 'Label at URL required' });
      state.accounts.push(acct);
      saveStateNow();
      log('🏦 KEEPER: idinagdag ang account link — ' + acct.platform + ' / ' + acct.label, 'CEO');
      return sendJSON(res, 200, { ok: true, accounts: state.accounts });
    }
    if (p === '/api/accounts/delete' && req.method === 'POST') {
      const b = await body(req);
      const i = state.accounts.findIndex(x => x.id === b.id);
      if (i >= 0) { const gone = state.accounts.splice(i, 1)[0]; saveStateNow(); log('🏦 KEEPER: tinanggal ang account link — ' + gone.label, 'CEO'); }
      return sendJSON(res, 200, { ok: true, accounts: state.accounts });
    }
    if (p === '/api/orders' && req.method === 'GET') return sendJSON(res, 405, { ok: false, error: 'Use the CEO orders panel.' });
    if (p === '/api/orders' && req.method === 'POST') {
      const bucket = orderRate.get(ip) || { windowStart: Date.now(), count: 0 };
      if (Date.now() - bucket.windowStart >= 60000) { bucket.windowStart = Date.now(); bucket.count = 0; }
      bucket.count++;
      orderRate.set(ip, bucket);
      if (bucket.count > 10) return sendJSON(res, 429, { ok: false, error: 'Order limit reached. Try again in a minute.' });
      if (orderRate.size > 5000) {
        for (const [key, value] of orderRate) {
          if (Date.now() - value.windowStart > 10 * 60000) orderRate.delete(key);
          if (orderRate.size <= 4000) break;
        }
      }
      const b = await body(req);
      // The browser may request an order, but it cannot declare its own prices or paid status.
      const fallbackCatalog = {
        gr1: { id: 'gr1', name: 'Bigas 5kg', price: 299, emoji: '🍚', url: 'https://shopee.ph/search?keyword=bigas%205kg' },
        gr2: { id: 'gr2', name: 'Mantika 1L', price: 189, emoji: '🫙', url: 'https://shopee.ph/search?keyword=mantika%201l' },
        gr3: { id: 'gr3', name: 'Asukal 1kg', price: 79, emoji: '🍬', url: 'https://shopee.ph/search?keyword=asukal%201kg' },
        gr4: { id: 'gr4', name: 'Itlog 1 dozen', price: 140, emoji: '🥚', url: 'https://shopee.ph/search?keyword=itlog%20dozen' },
        gr5: { id: 'gr5', name: 'De-lata assortment', price: 250, emoji: '🥫', url: 'https://shopee.ph/search?keyword=delata%20assortment' },
        gr6: { id: 'gr6', name: 'Biskwit / Snacks', price: 120, emoji: '🍪', url: 'https://shopee.ph/search?keyword=biscuits%20snacks' },
        gr7: { id: 'gr7', name: 'Kape 3-in-1', price: 199, emoji: '☕', url: 'https://shopee.ph/search?keyword=kape%203in1' },
        gr8: { id: 'gr8', name: 'Detergent', price: 149, emoji: '🧴', url: 'https://shopee.ph/search?keyword=detergent%20laba' }
      };
      const findCatalogItem = id => {
        const manual = state.mall.find(x => String(x.id) === id);
        if (manual) return manual;
        if (fallbackCatalog[id]) return fallbackCatalog[id];
        const product = state.products.find(x => ('pr' + String(x.id)) === id);
        if (product) return { id, name: String(product.title || product.description || 'Office product').slice(0, 80), price: Number(product.price) || 0, emoji: '🛍️', url: product.url || '' };
        return null;
      };
      if (!Array.isArray(b.items) || !b.items.length || b.items.length > 30)
        return sendJSON(res, 400, { ok: false, error: 'Invalid cart.' });
      const items = [];
      for (const raw of b.items) {
        const id = String(raw && raw.id || '').slice(0, 100);
        const product = id && findCatalogItem(id);
        const qty = Number(raw && raw.qty);
        if (!product || !Number.isInteger(qty) || qty < 1 || qty > 10)
          return sendJSON(res, 400, { ok: false, error: 'May invalid o unavailable na item sa cart. I-refresh ang mall.' });
        const price = Number(product.price);
        if (!Number.isFinite(price) || price <= 0 || price > 1e7)
          return sendJSON(res, 400, { ok: false, error: 'Hindi puwedeng i-checkout ang item na walang valid server price.' });
        items.push({ id, name: cleanTxt(product.name), price: Math.round(price * 100) / 100, qty, emoji: cleanTxt(product.emoji || '🛒').slice(0, 4) });
      }
      const total = Math.round(items.reduce((sum, item) => sum + item.price * item.qty, 0) * 100) / 100;
      if (!Number.isFinite(total) || total <= 0) return sendJSON(res, 400, { ok: false, error: 'Invalid order total.' });
      const ref = String(b.ref || '').slice(0, 50);
      const sr = ref ? state.bazaarShares.find(share => share.id === ref && share.kind === 'product') : null;
      const buyerVid = visitorIdFrom(req);
      const requestId = String(b.requestId || '').trim().slice(0, 80);
      if (requestId) {
        const prior = state.orders.find(x => x.requestId === requestId && String(x.buyerVid || '') === String(buyerVid || ''));
        if (prior) return sendJSON(res, 200, { ok: true, duplicate: true, order: prior, message: 'Na-save na ang request na ito.' });
      }
      const code = 'CB-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      const order = {
        code, requestId, items, total, status: 'pending', paymentStatus: 'unverified',
        at: Date.now(), ref: sr ? ref : '', buyerVid: buyerVid || '',
        paymentRef: '', verifiedAt: 0, verifiedBy: ''
      };
      state.orders.push(order);
      state.orders = state.orders.slice(-200);
      saveStateNow();
      log('🧾 Mall order ' + code + ' — ₱' + total + ' (' + items.length + ' item/s) PENDING PAYMENT/CEO REVIEW', 'mall');
      return sendJSON(res, 201, { ok: true, order, message: 'Order request saved. Hindi pa ito marked as paid.' });
    }

    // CEO manually confirms payment only after checking the real receipt/payment evidence.
    // No payment gateway is connected in this project, so this endpoint never claims automatic verification.
    if (p === '/api/ceo/orders' && req.method === 'POST') {
      const b = await body(req);
      const action = String(b.action || 'list');
      if (action === 'list') {
        return sendJSON(res, 200, { ok: true, orders: state.orders.slice(-100).reverse() });
      }
      const order = state.orders.find(x => x.code === String(b.code || ''));
      if (!order) return sendJSON(res, 404, { ok: false, error: 'Order not found.' });
      if (action === 'cancel') {
        if (order.paymentStatus === 'verified') return sendJSON(res, 409, { ok: false, error: 'Verified orders need a separate refund process.' });
        order.status = 'cancelled';
        order.cancelledAt = Date.now();
        saveStateNow();
        log('🧾 CEO cancelled mall order ' + order.code, 'CEO');
        return sendJSON(res, 200, { ok: true, order });
      }
      if (action !== 'verify-payment') return sendJSON(res, 400, { ok: false, error: 'Unknown order action.' });
      if (order.paymentStatus === 'verified') return sendJSON(res, 200, { ok: true, alreadyVerified: true, order });
      if (order.status !== 'pending') return sendJSON(res, 409, { ok: false, error: 'Only pending orders can be verified.' });
      const paymentRef = cleanTxt(b.paymentRef || '').slice(0, 100);
      if (!paymentRef) return sendJSON(res, 400, { ok: false, error: 'Kailangan ang payment/receipt reference na personal mong na-check.' });
      order.status = 'bayad-na';
      order.paymentStatus = 'verified';
      order.paymentRef = paymentRef;
      order.verifiedAt = Date.now();
      order.verifiedBy = 'CEO';
      // P2: finance ledger is separate from game stats; no payment gateway is connected.
      ledgerAdd('confirmed', {
        type: 'order-payment', ref: order.code, paymentRef, amount: Number(order.total) || 0,
        source: 'mall-order', actor: 'CEO',
        note: 'CEO verified payment using receipt ref ' + paymentRef + '. Manual confirmation only.'
      });
      // Count verified orders once. Referral commission is recorded only when attribution exists.
      state.bazaarStats.orders++;
      const sr = order.ref ? state.bazaarShares.find(share => share.id === order.ref && share.kind === 'product') : null;
      if (sr && !(Array.isArray(sr.orderCodes) && sr.orderCodes.includes(order.code))) {
        const referrer = sr.vid && state.visitors[sr.vid];
        const cut = referrer ? LEVEL_CUT[levelFor(referrer.xp).index] : LEVEL_CUT[0];
        const gross = Math.round(order.total * BAZAAR_COMMISSION_RATE * 100) / 100;
        const paid = Math.max(0, Math.round(gross * cut * 100) / 100);
        sr.orders = (sr.orders || 0) + 1;
        sr.paid = Math.round(((sr.paid || 0) + paid) * 100) / 100;
        sr.orderCodes = (Array.isArray(sr.orderCodes) ? sr.orderCodes : []).concat(order.code).slice(-100);
        state.bazaarStats.gross = Math.round((state.bazaarStats.gross + gross) * 100) / 100;
        state.bazaarStats.visitorPaid = Math.round((state.bazaarStats.visitorPaid + paid) * 100) / 100;
        state.bazaarStats.officeNet = Math.round((state.bazaarStats.officeNet + Math.max(0, gross - paid)) * 100) / 100;
        state.bazaarStats.earned = state.bazaarStats.officeNet;
        if (referrer && paid > 0) {
          referrer.earned = (referrer.earned || 0) + paid;
          referrer.paidOrders = (referrer.paidOrders || 0) + 1;
          grantVisitor(referrer, paid, 5);
          // P2: pending referral payout is a ledger record, not an executed transfer.
          ledgerAdd('pending', {
            type: 'referral-commission', ref: order.code, amount: paid,
            payee: cleanTxt(referrer.name).slice(0, 60), source: 'bazaar-referral', actor: 'bazaar',
            note: 'Estimated referral commission awaiting CEO approval. No transfer executed.'
          });
          log('💰 ' + cleanTxt(referrer.name) + ' earned ₱' + paid + ' estimated referral commission from verified order ' + order.code, 'bazaar');
        }
      }
      const buyer = order.buyerVid && state.visitors[order.buyerVid];
      if (buyer) markVisitorTask(buyer, 'order', order.code);
      saveStateNow();
      log('🧾 CEO verified payment for order ' + order.code + ' using reference ' + paymentRef, 'CEO');
      return sendJSON(res, 200, { ok: true, order, note: 'Manual CEO verification only; no payment processor is connected.' });
    }

    if (p === '/api/settings' && req.method === 'POST') {
      const b = await body(req);
      const cur = readJSON(SETTINGS_FILE, {});
      const sec = secrets();
      // P1: API keys go to secrets.json; settings.json keeps only non-secret config.
      const next = Object.assign({}, cur, {
        provider: typeof b.provider === 'string' ? b.provider : cur.provider || 'auto',
        model: typeof b.model === 'string' && b.model.trim() ? b.model.trim() : cur.model || '',
        baseUrl: typeof b.baseUrl === 'string' ? b.baseUrl.trim() : cur.baseUrl || '',
        failover: Array.isArray(b.failover) ? b.failover : cur.failover || []
      });
      if (typeof b.apiKey === 'string') sec.apiKey = b.apiKey;
      if (b.keys && typeof b.keys === 'object') sec.keys = b.keys;
      writeJSON(SETTINGS_FILE, next);
      writeJSON(SECRETS_FILE, sec);
      const eff = settings();
      log('Settings updated (' + eff.provider + ' / ' + eff.model + ')', 'system');
      return sendJSON(res, 200, { ok: true, hasKey: !!eff.apiKey, model: eff.model, provider: eff.provider,
        keys: eff.keys, failover: eff.failover });
    }

    // Failover provider keys (Groq, Vyce, OpenAI, OpenRouter, Coarena)
    if (p === '/api/providers' && req.method === 'GET') {
      return sendJSON(res, 405, { ok: false, error: 'Use the authenticated CEO panel.' });
    }
    if (p === '/api/providers' && req.method === 'POST') {
      const b = await body(req);
      const cur = readJSON(SETTINGS_FILE, {});
      const sec = secrets();
      if (b.keys && typeof b.keys === 'object') sec.keys = b.keys;
      cur.failover = Array.isArray(b.failover) ? b.failover.slice(0, 5) : cur.failover || [];
      writeJSON(SETTINGS_FILE, cur);
      writeJSON(SECRETS_FILE, sec);
      log('Failover providers updated: ' + (cur.failover.join(', ') || 'none'), 'CEO');
      return sendJSON(res, 200, { ok: true, keys: sec.keys || {}, failover: cur.failover });
    }

    // Ollama local status + model auto-detect (no key required).
    if (p === '/api/ollama/status' && req.method === 'GET') {
      const s = settings();
      const qBase = (u.searchParams.get('baseUrl') || '').trim();
      const cfg = providerCfg('ollama', s);
      const base = (qBase || cfg.baseUrl || OLLAMA_URL).replace(/\/$/, '');
      const out = { ok: false, running: false, baseUrl: base, models: [], selected: cfg.model || MODEL_DEFAULTS.ollama };
      const fetchJson = async (url) => {
        const r = await fetch(url, { signal: AbortSignal.timeout(2500) });
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch (e) { j = null; }
        return { status: r.status, json: j };
      };
      try {
        const m = await fetchJson(base + '/models');
        if (m.status === 200 && m.json) {
          out.running = true; out.ok = true;
          const arr = Array.isArray(m.json.data) ? m.json.data : (Array.isArray(m.json.models) ? m.json.models : []);
          out.models = arr.map(x => (x && (x.id || x.name || x.model)) || '').filter(Boolean);
        }
      } catch (e) {}
      if (!out.running) {
        try {
          const host = base.replace(/\/v1\/?$/i, '');
          const t = await fetchJson(host + '/api/tags');
          if (t.status === 200 && t.json) {
            out.running = true; out.ok = true;
            const arr = Array.isArray(t.json.models) ? t.json.models : [];
            out.models = arr.map(x => (x && (x.name || x.model)) || '').filter(Boolean);
          }
        } catch (e) {}
      }
      if (out.models.length) out.models = [...new Set(out.models)];
      if (!out.models.includes(out.selected) && out.models.length) {
        out.suggested = out.models.includes('qwen2.5:3b') ? 'qwen2.5:3b' : out.models[0];
      }
      if (!out.running) out.error = 'Ollama not reachable at ' + base;
      return sendJSON(res, 200, out);
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
      const sys = 'You are the Chief of Staff of Cyborg Cheebee Office. Speak directly to the CEO in casual TAGLISH (Tagalog mixed with English, like a Filipino office worker). Be concise and useful. Use proper Tagalog spelling.';
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
      ['niche', 'style', 'mission', 'affiliateLink', 'platform', 'language'].forEach(k => { if (typeof b[k] === 'string') state.config[k] = b[k]; });
      ['clips', 'slots'].forEach(k => { if (Array.isArray(b[k])) state.config[k] = b[k].filter(Boolean).slice(0, 10); });
      if (Array.isArray(b.shopeeLinks)) state.config.shopeeLinks = b.shopeeLinks.map(String).filter(u => /^https?:\/\//i.test(u)).slice(0, 12);
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

    // ⚡ SHOPEE AFFILIATE RUSH: paste links → bots generate posts + video + office commercial
    if (p === '/api/affiliate/ingest' && req.method === 'POST') {
      const b = await body(req);
      const raw = Array.isArray(b.urls) ? b.urls : String(b.urls || '').split(/[\r\n\s]+/);
      const urls = raw.map(s => String(s).trim()).filter(u => /^https?:\/\//i.test(u)).slice(0, 12);
      if (!urls.length) return sendJSON(res, 200, { ok: false, error: 'Walang valid Shopee affiliate link.' });
      const posts = [], commercials = [], results = [];
      for (const u of urls) {
        let pr = state.products.find(x => x.url === u);
        if (!pr) {
          pr = { id: 'p' + Date.now() + '-' + posts.length, url: u, title: '', description: '',
            price: 0, status: 'queued', output: '', replyId: '', provider: '', createdAt: Date.now() };
          state.products.push(pr);
        }
        if (b.autoRun !== false && pr.status !== 'done') await runProduct(pr);
        const name = String(pr.title || '').replace(/[<>&"'`]/g, '').trim().slice(0, 90) || 'Shopee Affiliate Find';
        const caption = String(pr.description || '').replace(/[<>&"'`]/g, '').trim().slice(0, 180)
          || ('De-kalidad na produkto mula sa affiliate shop natin. Tingnan ang presyo at detalye bago bumili.');
        if (!state.mall.some(x => x.url === u)) {
          const post = { id: 'm' + Date.now() + '-' + posts.length, name: name, price: pr.price || 0,
            emoji: '🛍️', url: u, cat: 'shopee', caption: caption, createdAt: Date.now() };
          state.mall.push(post); posts.push(post);
        }
        const cm = makeCommercial({ bot: 'product', angle: 'product',
          title: ('CYBORG OFFICE — ' + name), cta: 'Tingnan ang post, i-share, at pumasok sa office.',
          featured: { name: name, price: pr.price || 0, url: u } }, req);
        state.commercials.unshift(cm);
        state.commercials = state.commercials.slice(-60);
        commercials.push(cm);
        results.push({ id: pr.id, status: pr.status, title: name, price: pr.price || 0 });
      }
      saveStateNow();
      log('⚡ Affiliate rush: ' + urls.length + ' link(s), ' + posts.length + ' post(s), ' + commercials.length + ' commercial(s)', 'CEO');
      return sendJSON(res, 200, { ok: true, results: results, posts: posts, commercials: commercials,
        products: state.products, mall: state.mall });
    }

    if (p === '/api/conversation' && req.method === 'POST') {
      const b = await body(req);
      try { return sendJSON(res, 200, { ok: true, conversation: await generateConversation(Array.isArray(b.agents) ? b.agents : null) }); }
      catch (e) { return sendJSON(res, 200, { ok: false, error: e.message }); }
    }

    // 🧩 CONTENT PIPELINE — iisang endpoint para sa Scout/Writer/Analyst.
    // CEO-gated na ito automatically (POST /api/*), at walang sariling timer.
    if (p === '/api/content-pipeline' && req.method === 'POST') {
      const b = await body(req);
      const action = String(b.action || 'ideas');
      try {
        if (action === 'ideas') {
          const items = await cpGenerateIdeas(b.count);
          return sendJSON(res, 200, { ok: true, items: items, config: state.config });
        }
        if (action === 'script') {
          const item = await cpWriteScript(String(b.id || ''));
          return sendJSON(res, 200, { ok: true, item: item });
        }
        if (action === 'rate') {
          const item = cpRate(String(b.id || ''), Number(b.rating) || 0);
          return sendJSON(res, 200, { ok: !!item, item: item });
        }
        if (action === 'brief') {
          const item = await cpWriteBrief(String(b.id || ''));
          return sendJSON(res, 200, { ok: true, item: item });
        }
        return sendJSON(res, 400, { ok: false, error: 'Unknown action' });
      } catch (e) {
        return sendJSON(res, 200, { ok: false, error: e.message });
      }
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

    if (p === '/api/agents' && req.method === 'GET') return sendJSON(res, 200, { agents: AGENT_META.concat(state.hires) });
    // 👔 HIRING: paste ng nicknames mula sa FB → bagong bot sa office!
    if (p === '/api/hire' && req.method === 'POST') {
      const b = await body(req);
      const names = Array.isArray(b.names) ? b.names : String(b.names || '').split(/\n|,/).map(s => s.trim()).filter(Boolean);
      if (!names.length) return sendJSON(res, 400, { ok: false, error: 'Walang pangalan na na-paste!' });
      const colors = ['#e8622c','#2bb3a6','#c9a227','#8f6fd8','#4a9fd6','#d6607a','#3f9d6a','#7ac74f','#c98ac9','#5ac98f'];
      const added = [];
      names.slice(0, 20).forEach((nm, i) => {
        const id = 'hire_' + Date.now() + '_' + i;
        const meta = { id, n: cleanTxt(nm).slice(0, 24) || 'Bagong Bot', i: '👤', c: colors[i % colors.length], group: 'staff', room: 'hq', desc: 'In-hire mula sa Facebook applicants!' };
        if (!meta.n) return;
        state.hires.push(meta);
        added.push(meta);
        log('👔 Hired: ' + meta.n + ' (FB applicant)', 'CEO');
      });
      saveStateNow();
      return sendJSON(res, 200, { ok: true, added, agents: AGENT_META.concat(state.hires) });
    }

    if (p === '/api/routines' && req.method === 'GET') return sendJSON(res, 200, { routines: state.routines });
    if (p === '/api/office/shift' && req.method === 'GET') return sendJSON(res, 200, {
      ok: true, proposals: state.shiftProposals.slice(0, 30),
      intervalMin: SHIFT_INTERVAL_MS / 60000, lastPlanAt: lastShiftPlanAt,
      queued: state.tasks.filter(t => t.status === 'queued').length
    });
    if (p === '/api/office/shift' && req.method === 'POST') {
      const b = req._body || await body(req);
      const action = String(b.action || 'list');
      if (action === 'list') return sendJSON(res, 200, {
        ok: true, proposals: state.shiftProposals.slice(0, 30),
        intervalMin: SHIFT_INTERVAL_MS / 60000, lastPlanAt: lastShiftPlanAt,
        queued: state.tasks.filter(t => t.status === 'queued').length
      });
      if (action === 'generate') {
        const made = generateShiftProposals(true);
        return sendJSON(res, 201, { ok: true, proposals: made });
      }
      if (action === 'approve' || action === 'reject') {
        const r = decideShiftProposal(b.id, action === 'approve');
        return sendJSON(res, r.ok ? 200 : 400, r);
      }
      if (action === 'approve-all') {
        const ids = state.shiftProposals.filter(x => x.status === 'pending').map(x => x.id);
        const tasks = ids.map(id => decideShiftProposal(id, true)).filter(x => x.ok && x.task).map(x => x.task);
        return sendJSON(res, 200, { ok: true, tasks });
      }
      return sendJSON(res, 400, { ok: false, error: 'Unknown shift action.' });
    }
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
          runs: Number(r.runs) || 0,
          weekday: r.weekday === undefined ? undefined : Number(r.weekday),
          hour: r.hour === undefined ? undefined : Number(r.hour),
          tz: r.tz ? String(r.tz).slice(0, 40) : undefined,
          fn: r.fn ? String(r.fn).slice(0, 40) : undefined
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
      t.reviewedBy = 'CEO'; t.reviewedAt = Date.now();
      if (b.approve) {
        t.approved = true; t.status = 'queued'; auditEvent('Approved task: ' + t.title, 'CEO'); log('Approved: ' + t.title, 'CEO');
        if (String(t.note || '').indexOf('VIDEO:') === 0) {
          try {
            const v = JSON.parse(String(t.note).slice(6));
            const cfg = videoConfigFrom(v.config || {});
            cfg.watermark = false;
            const r = await renderOfficeVideo(cfg, String(v.name || 'video').replace(/-preview$/, '') + '-final');
            t.note = 'FINAL:' + r.url;
            t.status = 'done';
            log('🎬 Final video ready: ' + r.url, 'video');
          } catch (e) {
            t.note = 'VIDEO_FINAL_FAILED: ' + e.message;
            t.status = 'failed';
          }
        }
      }
      else { t.status = 'rejected'; auditEvent('Rejected task: ' + t.title, 'CEO'); log('Rejected: ' + t.title, 'CEO'); }
      state.approvalLog.unshift({ id: t.id || '', taskId: t.id || '', title: String(t.title || '').slice(0, 120),
        bot: t.bot, decision: b.approve ? 'approved' : 'rejected',
        reviewedBy: 'CEO', at: Date.now(), source: t.source || 'task board' });
      if (state.approvalLog.length > 300) state.approvalLog.length = 300;
      saveStateNow();
      return sendJSON(res, 200, { ok: true, tasks: state.tasks });
    }

    if (p === '/api/tasks/retry' && req.method === 'POST') {
      const b = await body(req);
      const t = state.tasks[Number(b.index)];
      if (t) {
        if ((t.attempts || 0) >= 3 && !b.force)
          return sendJSON(res, 409, { ok: false, error: 'Dead-lettered after 3 attempts. Use force to retry.' });
        t.status = 'queued'; t.note = ''; t.lastError = ''; t.retriedAt = Date.now();
        auditEvent('Task retry queued: ' + t.title, 'CEO');
        log('Retry queued: ' + t.title, 'CEO');
      }
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

    /* ========== 🛒 CYBORG BAZAAR — pampublikong API (walang CEO password) ========== */
    if (p === '/api/bazaar/info' && req.method === 'GET') {
      const c = fbCfg();
      return sendJSON(res, 200, {
        levels: BAZAAR_LEVELS, tasks: BAZAAR_TASKS, bonus: BAZAAR_BONUS, parts: POD_PARTS,
        goodsRate: GOODS_TOKENS_PER_PESO, cashPayout: false,
        bots: AGENT_META.map(a => ({ id: a.id, name: a.n, icon: a.i, desc: a.desc })),
        angles: Object.keys(COMMERCIAL_ANGLES).map(id => ({ id: id, label: COMMERCIAL_ANGLES[id].label })),
        fbConfigured: !!(c.id && c.secret && c.redirect)
      });
    }
    if (p === '/api/bazaar/commercials' && req.method === 'GET') {
      const list = state.commercials.filter(x => x.status === 'active').slice(-12).reverse();
      return sendJSON(res, 200, { ok: true, commercials: list });
    }
    // 🎤 Event Stage auto-show — deterministic schedule from server time
    if (p === '/api/event/show' && req.method === 'GET') {
      const intervalMin = Math.max(1, Math.min(60, Number(state.eventShow.intervalMin) || 5));
      const intervalMs = intervalMin * 60000;
      const now = Date.now();
      const idx = Math.floor(now / intervalMs);
      const nextAt = (idx + 1) * intervalMs;
      const pool = (state.mall || []).filter(x => (x.cat || 'shopee') === 'grocery');
      const items = (pool.length ? pool : state.mall || []).slice(0, 10);
      const it = items.length ? items[idx % items.length] : null;
      return sendJSON(res, 200, {
        ok: true, enabled: state.eventShow.enabled !== false, intervalMin,
        show: {
          index: idx, startedAt: idx * intervalMs, nextAt,
          secondsLeft: Math.max(0, Math.ceil((nextAt - now) / 1000)),
          product: it ? { id: it.id, name: it.name, price: it.price, emoji: it.emoji || '🛍️', url: it.url || '', caption: it.caption || '' } : null,
          hosts: EVENT_HOSTS
        }
      });
    }

    if (p === '/api/fb/config' && req.method === 'GET') {
      const c = fbCfg();
      return sendJSON(res, 200, { configured: !!(c.id && c.secret && c.redirect), appId: c.id ? c.id.slice(0, 6) + '…' : '' });
    }
    if (p === '/api/fb/login' && req.method === 'GET') {
      const c = fbCfg();
      if (!c.id || !c.secret || !c.redirect) return sendJSON(res, 200, { ok: false, error: 'Facebook login is not configured yet' });
      const nonce = crypto.randomBytes(16).toString('hex');
      const ts = Date.now().toString(36);
      const sig = crypto.createHmac('sha256', c.secret).update(ts + '.' + nonce).digest('hex').slice(0, 32);
      const st = ts + '.' + nonce + '.' + sig;
      oauthStates.set(st, Date.now());
      const url = 'https://www.facebook.com/v19.0/dialog/oauth?client_id=' + encodeURIComponent(c.id)
        + '&redirect_uri=' + encodeURIComponent(c.redirect)
        + '&scope=public_profile&response_type=code&state=' + st;
      res.writeHead(302, { Location: url });
      return res.end();
    }
    if (p === '/api/fb/callback' && req.method === 'GET') {
      const st = String(u.searchParams.get('state') || ''), code = String(u.searchParams.get('code') || '');
      let issued = oauthStates.get(st);
      // stateless fallback: signed state survives server restarts / multiple instances
      if (!issued) {
        const parts = st.split('.');
        if (parts.length === 3) {
          const c0 = fbCfg();
          const expect = crypto.createHmac('sha256', c0.secret).update(parts[0] + '.' + parts[1]).digest('hex').slice(0, 32);
          if (expect === parts[2] && /^[0-9a-z]+$/i.test(parts[0])) {
            const t = parseInt(parts[0], 36);
            if (Number.isFinite(t) && Date.now() - t <= 10 * 60 * 1000) issued = t;
          }
        }
      }
      if (!issued || Date.now() - issued > 10 * 60 * 1000) return sendJSON(res, 400, { ok: false, error: 'Expired Facebook login. Try again.' });
      oauthStates.delete(st);
      if (!code) return sendJSON(res, 400, { ok: false, error: 'Facebook login was cancelled.' });
      // idempotent: a repeated callback with the same code reuses the first result
      const cached = fbCodeCache.get(code);
      if (cached && Date.now() - cached.at < 15 * 60 * 1000) {
        const cv = getOrCreateVisitor(cached.id, cached.name, cached.picture);
        setBazaarCookie(res, cv.id, cv.name, cv.picture, req);
        res.writeHead(302, { Location: '/?bazaar=1' });
        return res.end();
      }
      const c = fbCfg();
      try {
        const tkUrl = 'https://graph.facebook.com/v19.0/oauth/access_token?client_id=' + encodeURIComponent(c.id)
          + '&client_secret=' + encodeURIComponent(c.secret) + '&redirect_uri=' + encodeURIComponent(c.redirect)
          + '&code=' + encodeURIComponent(code);
        const tr = await fetch(tkUrl);
        const tj = await tr.json();
        if (!tj.access_token) {
          const fe = tj.error || {};
          const detail = [fe.type, fe.code, fe.error_subcode].filter(Boolean).join('/');
          log('⚠️ FB token exchange failed: ' + String(fe.message || 'unknown').slice(0, 160) + ' [' + detail + ']', 'bazaar');
          // code already consumed by a prior callback (browser prefetch/reload or a
          // simultaneous retry): reuse the cached result or an existing login cookie
          if (String(fe.message || '').indexOf('used') >= 0) {
            const again = fbCodeCache.get(code);
            const cv = again ? getOrCreateVisitor(again.id, again.name, again.picture) : null;
            if (cv) setBazaarCookie(res, cv.id, cv.name, cv.picture, req);
            if (cv || visitorIdFrom(req)) {
              res.writeHead(302, { Location: '/?bazaar=1' });
              return res.end();
            }
          }
          return sendJSON(res, 400, { ok: false, error: 'Facebook token error: ' + String(fe.message || 'unknown').slice(0, 120) });
        }
        const mr = await fetch('https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=' + encodeURIComponent(tj.access_token));
        const mj = await mr.json();
        if (!mj.id) return sendJSON(res, 400, { ok: false, error: 'Facebook profile error' });
        const pic = (mj.picture && mj.picture.data && mj.picture.data.url) || '';
        const v = getOrCreateVisitor('fb_' + mj.id, mj.name, pic);
        fbCodeCache.set(code, { id: v.id, name: v.name, picture: v.picture, at: Date.now() });
        if (fbCodeCache.size > 200) fbCodeCache.delete(fbCodeCache.keys().next().value);
        setBazaarCookie(res, v.id, v.name, v.picture, req);
        log('🛒 FB visitor logged in: ' + cleanTxt(v.name), 'bazaar');
        res.writeHead(302, { Location: '/?bazaar=1' });
        return res.end();
      } catch (e) { return sendJSON(res, 500, { ok: false, error: e.message }); }
    }
    if (p === '/api/fb/me' && req.method === 'GET') {
      const id = visitorIdFrom(req);
      const v = id && state.visitors[id];
      return sendJSON(res, 200, { visitor: v ? visitorView(v) : null, configured: !!(fbCfg().id && fbCfg().secret && fbCfg().redirect) });
    }
    if (p === '/api/fb/logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', 'bz=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return sendJSON(res, 200, { ok: true });
    }

    if (p === '/api/bazaar/profile' && req.method === 'GET') {
      const id = visitorIdFrom(req);
      const v = id && state.visitors[id];
      return sendJSON(res, 200, { visitor: v ? visitorView(v) : null });
    }
    /* ===== 🐾 CARE & RETURN — pampublikong API (walang CEO password) ===== */
    if (p === '/api/care/state' && req.method === 'GET') {
      const now = Date.now();
      const bots = AGENT_META.concat(state.hires || []).map(a => botCareView(a.id, now));
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      const farm = v ? ensureVisitorFarm(v).plots.map(pl => plotView(pl, now)) : null;
      const c = v ? careDay(v) : { acts: 0, rewarded: 0 };
      return sendJSON(res, 200, {
        ok: true, bots: bots, farm: farm,
        day: { acts: c.acts || 0, rewarded: c.rewarded || 0, cap: CARE.dailyCap, rewardCap: CARE.dailyRewardCap },
        serverNow: now
      });
    }
    if (p === '/api/care/act' && req.method === 'POST') {
      const b = await body(req);
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Facebook login muna para mag-alaga.' });
      const c = careDay(v);
      if ((c.acts || 0) >= CARE.dailyCap)
        return sendJSON(res, 200, { ok: false, error: 'Limit na sa pag-aalaga kada araw (' + CARE.dailyCap + '). Balik bukas! 🌅' });
      const kind = String(b.kind || ''), now = Date.now();
      let msg = '', bot = null;
      if (kind === 'charge') {
        const botId = String(b.id || '').slice(0, 40);
        if (!AGENT_META.some(a => a.id === botId) && !(state.hires || []).some(a => a.id === botId))
          return sendJSON(res, 200, { ok: false, error: 'Unknown bot' });
        const cur = botCareView(botId, now);
        if (cur.battery >= 95) return sendJSON(res, 200, { ok: false, error: 'Full battery na ang bot! ⚡' });
        const st = state.botCare[botId] || (state.botCare[botId] = {});
        st.battery = careClamp(cur.battery + 45);
        st.mood = careClamp(cur.mood + 30);
        st.lastCharge = now;
        c.acts++;
        careReward(v, 3, 3);
        bot = botCareView(botId, now);
        msg = '⚡ Na-charge ang bot! +' + 45 + ' battery';
      } else if (kind === 'water' || kind === 'harvest' || kind === 'replant') {
        const idx = Math.max(0, Math.min(2, Number(b.plot) || 0));
        const farm = ensureVisitorFarm(v), pl = farm.plots[idx], pv = plotView(pl, now);
        if (kind === 'water') {
          if (pv.dead) return sendJSON(res, 200, { ok: false, error: 'Patay na ang halaman. I-replant muna!' });
          if (!pv.needWater) return sendJSON(res, 200, { ok: false, error: 'Busog pa ang halaman. Balik mamaya! 💧' });
          pl.watered = now;
          pl.growth = careClamp((pl.growth || 0) + 34);
          c.acts++;
          careReward(v, 4, 4);
          msg = '💧 Na-diligan! Tumubo ang ' + pv.crop;
        } else if (kind === 'harvest') {
          if (!pv.ready) return sendJSON(res, 200, { ok: false, error: 'Hinog pa lang ang ' + pv.crop + '. Hintayin ang 🌾!' });
          pl.growth = 0; pl.planted = now; pl.watered = now;
          pl.crop = ((Number(pl.crop) || 0) + 1) % CARE.crops.length;
          c.acts++;
          careReward(v, 8, 8);
          msg = '🌾 Na-harvest! +8 reward tokens';
        } else {
          if (!pv.dead) return sendJSON(res, 200, { ok: false, error: 'Buhay pa ang halaman.' });
          pl.planted = now; pl.watered = now; pl.growth = 10;
          c.acts++;
          msg = '🌱 Naitanim ulit! Alagaan mong mabuti.';
        }
      } else return sendJSON(res, 200, { ok: false, error: 'Unknown care action' });
      log('🐾 ' + cleanTxt(v.name) + ' — ' + msg, 'bazaar');
      const t = Date.now();
      return sendJSON(res, 200, {
        ok: true, msg: msg, bot: bot,
        bots: AGENT_META.concat(state.hires || []).map(a => botCareView(a.id, t)),
        farm: ensureVisitorFarm(v).plots.map(pl => plotView(pl, t)),
        day: careDay(v), visitor: visitorView(v)
      });
    }
    // 🩺 VISITOR CONTROL PING — bot nagche-check kung OK ang controls ng bisita
    if (p === '/api/bazaar/ping' && req.method === 'POST') {
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'No visitor' });
      const b = await body(req);
      const keys = Array.isArray(b.keys) ? b.keys.map(x => String(x).slice(0, 12)).slice(0, 24) : [];
      const num = n => Math.max(0, Math.min(1000000, Math.floor(Number(n) || 0)));
      const prev = v.controls || {};
      const pos = b.pos && Number.isFinite(Number(b.pos.x)) ? {
        x: Math.round(Number(b.pos.x) * 10) / 10,
        y: Math.round(Number(b.pos.y) * 10) / 10,
        z: Math.round(Number(b.pos.z) * 10) / 10
      } : null;
      v.controls = {
        version: String(b.version || '1').slice(0, 20),
        three: !!b.three, webgl: !!b.webgl,
        keys: Array.from(new Set((prev.keys || []).concat(keys))).slice(-24),
        move: Math.max(num(prev.move), num(b.move)),
        interact: Math.max(num(prev.interact), num(b.interact)),
        chat: Math.max(num(prev.chat), num(b.chat)),
        errors: num(b.errors), lastError: String(b.lastError || '').slice(0, 160),
        pos: pos || prev.pos || null, grounded: !!b.grounded,
        pings: num(prev.pings) + 1,
        firstSeen: prev.firstSeen || Date.now(), lastPing: Date.now()
      };
      scheduleSave();
      return sendJSON(res, 200, { ok: true, pings: v.controls.pings });
    }
    // 📊 Shopee analytics + zone visits (bisita-safe, capped, walang cash)
    if (p === '/api/bazaar/track' && req.method === 'POST') {
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'No visitor' });
      const b = await body(req);
      const kind = String(b.kind || '');
      if (!['stall_click', 'product_view', 'newtab', 'zone_visit'].includes(kind))
        return sendJSON(res, 200, { ok: false, error: 'Unknown kind' });
      ensureVisitorBadges(v);
      const itemId = String(b.itemId || '').slice(0, 80);
      const itemName = cleanTxt(b.itemName || '');
      const zone = String(b.zone || '').slice(0, 40);
      state.shopAnalytics.push({ kind, itemId, itemName, zone, vid: v.id, by: String(v.name || '').slice(0, 60), at: Date.now() });
      if (state.shopAnalytics.length > 1200) state.shopAnalytics.splice(0, state.shopAnalytics.length - 1200);
      let awarded = null;
      if (kind === 'zone_visit' && zone && !v.zones.includes(zone)) {
        v.zones.push(zone);
        awarded = awardBadge(v, 'explorer');
      }
      if (kind === 'stall_click' && itemId && !v.badgeStalls.includes(itemId)) {
        v.badgeStalls.push(itemId);
        awarded = awardBadge(v, 'shopper') || awarded;
      }
      scheduleSave();
      return sendJSON(res, 200, { ok: true, awarded, visitor: visitorView(v) });
    }
    // 🏆 Badge shelf — definitions + progress para sa kasalukuyang bisita
    if (p === '/api/bazaar/badges' && req.method === 'GET') {
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'No visitor' });
      ensureVisitorBadges(v);
      const badges = VISITOR_BADGES.map(d => ({
        id: d.id, name: d.name, emoji: d.emoji, desc: d.desc, coins: d.coins, xp: d.xp,
        need: d.need, progress: Math.min(d.need, badgeProgress(v, d.id)), earned: v.badges.includes(d.id)
      }));
      return sendJSON(res, 200, { ok: true, badges, earned: v.badges.slice() });
    }
    if (p === '/api/bazaar/demo' && req.method === 'POST') {
      const c = fbCfg();
      if (c.id && c.secret && c.redirect) return sendJSON(res, 200, { ok: false, error: 'Demo is off — use Facebook login.' });
      const b = await body(req);
      const name = cleanTxt(b.name || 'Guest') || 'Guest';
      const id = 'demo_' + crypto.randomBytes(12).toString('hex');
      const v = getOrCreateVisitor(id, name, '');
      setBazaarCookie(res, v.id, v.name, v.picture, req);
      return sendJSON(res, 200, { ok: true, visitor: visitorView(v) });
    }
    if (p === '/api/bazaar/checkin' && req.method === 'POST') {
      const b = await body(req);
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Facebook login muna.' });
      const d = ensureVisitorDay(v);
      if (d.done.checkin) return sendJSON(res, 200, { ok: true, already: true, visitor: visitorView(v) });
      const r = markVisitorTask(v, 'checkin', 'checkin');
      ensureVisitorBadges(v);
      if (!v.badgeDays.includes(d.date)) v.badgeDays.push(d.date);
      const awarded = awardBadge(v, 'regular');
      log('🛒 ' + cleanTxt(v.name) + ' checked in (Day ' + d.date + ')', 'bazaar');
      return sendJSON(res, 200, { ok: true, result: r, awarded, visitor: visitorView(v) });
    }
    if (p === '/api/bazaar/task' && req.method === 'POST') {
      const b = await body(req);
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Facebook login muna.' });
      const type = String(b.type || '');
      if (!['stalls', 'posts', 'bots'].includes(type))
        return sendJSON(res, 400, { ok: false, error: 'Task na ito ay server-verified sa sariling endpoint.' });
      const r = markVisitorTask(v, type, b.key);
      const awarded = awardBadge(v, 'vip');
      return sendJSON(res, 200, { ok: true, result: r, awarded, visitor: visitorView(v) });
    }
    if (p === '/api/bazaar/upgrade' && req.method === 'POST') {
      const b = await body(req);
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Facebook login muna.' });
      const part = String(b.part || '');
      if (!Object.prototype.hasOwnProperty.call(POD_PARTS, part)) return sendJSON(res, 200, { ok: false, error: 'Unknown upgrade' });
      const d = ensureVisitorDay(v);
      d.upgrades = (d.upgrades || 0) + 1;
      if (d.upgrades > 6) return sendJSON(res, 200, { ok: false, error: 'Limit sa upgrade kada araw (6).' });
      const cur = (v.pod && v.pod[part]) || 0;
      if (cur >= 3) return sendJSON(res, 200, { ok: false, error: 'Max level na ang ' + part });
      const cost = POD_PARTS[part] * (cur + 1);
      if ((v.coins || 0) < cost) return sendJSON(res, 200, { ok: false, error: 'Kulang ang coins (kailangan: ' + cost + ')' });
      v.pod = v.pod || {};
      v.pod[part] = cur + 1;
      v.coins -= cost;
      scheduleSave();
      log('🛒 ' + cleanTxt(v.name) + ' upgraded ' + part + ' → Lv' + (cur + 1), 'bazaar');
      return sendJSON(res, 200, { ok: true, visitor: visitorView(v) });
    }
    if (p === '/api/bazaar/wish' && req.method === 'POST') {
      const b = await body(req);
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Facebook login muna.' });
      const part = String(b.part || '');
      if (!Object.prototype.hasOwnProperty.call(POD_PARTS, part)) return sendJSON(res, 200, { ok: false, error: 'Unknown wish' });
      const d = ensureVisitorDay(v);
      d.wishCalls = (d.wishCalls || 0) + 1;
      if (d.wishCalls > 3) return sendJSON(res, 200, { ok: false, error: 'Limit sa wish kada araw (3).' });
      v.wish = { part: part, note: cleanTxt(b.note || '').slice(0, 120), at: Date.now(), status: 'pending' };
      scheduleSave();
      log('🛒 Wish ni ' + cleanTxt(v.name) + ': ' + part, 'bazaar');
      return sendJSON(res, 200, { ok: true, visitor: visitorView(v) });
    }
    if (p === '/api/bazaar/share' && req.method === 'POST') {
      const b = await body(req);
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Facebook login muna.' });
      const kind = String(b.kind || 'product') === 'content' ? 'content' : 'product';
      const url = String(b.url || '').trim();
      if (!/^https?:\/\//i.test(url)) return sendJSON(res, 200, { ok: false, error: 'Kailangan ng valid URL.' });
      const title = cleanTxt(b.title || 'Cyborg Office find').slice(0, 80);
      const price = Math.max(0, Math.min(1e7, Number(b.price) || 0));
      const desc = cleanTxt(b.desc || 'De-kalidad na paninda mula sa Cyborg Office.').slice(0, 140);
      const sid = 'sh' + crypto.randomBytes(6).toString('hex');
      const rec = {
        id: sid, vid: v.id, by: cleanTxt(v.name), kind: kind, key: String(b.key || '').slice(0, 60),
        title: title, price: price, desc: desc, url: url.slice(0, 1000),
        shareUrl: '/r/' + sid, at: Date.now(), clicks: 0, orders: 0
      };
      state.bazaarShares.push(rec);
      state.bazaarShares = state.bazaarShares.slice(-300);
      state.bazaarStats.shares++;
      const caption = '🛒 ' + title + (price ? ' — ₱' + price : '') + '\n' + desc
        + '\n📣 Shared by ' + cleanTxt(v.name) + ' mula sa Cyborg Office\n' + url;
      // 📌 'product' shares complete the 'share' daily task; 'content' shares complete 'content'
      const taskType = kind === 'content' ? 'content' : 'share';
      const result = markVisitorTask(v, taskType, String(b.key || sid));
      scheduleSave();
      res.setHeader('Set-Cookie', 'bzref=' + sid + '; Path=/; SameSite=Lax' + (String((req.headers || {})['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' ? '; Secure' : '') + '; Max-Age=' + (30 * 86400));
      log('📣 ' + cleanTxt(v.name) + ' shared ' + kind + ': ' + title, 'bazaar');
      return sendJSON(res, 200, { ok: true, share: rec, caption: caption, result: result, visitor: visitorView(v) });
    }
    if (p === '/api/bazaar/pods' && req.method === 'GET') {
      const list = Object.keys(state.visitors).slice(-30).map(id => {
        const v = state.visitors[id];
        return { name: v.name, level: levelFor(v.xp).name, pod: v.pod || {} };
      });
      return sendJSON(res, 200, { pods: list });
    }

    // 📣 Referral click tracker — pumupunta sa Shopee/content, may attribution
    if (p.startsWith('/r/') && req.method === 'GET') {
      const sid = p.slice(3).slice(0, 50);
      const sr = state.bazaarShares.find(s => s.id === sid);
      if (!sr) return sendJSON(res, 404, { ok: false, error: 'Link not found' });
      sr.clicks = (sr.clicks || 0) + 1;
      state.bazaarStats.clicks++;
      scheduleSave();
      res.setHeader('Set-Cookie', 'bzref=' + sid + '; Path=/; SameSite=Lax' + (String((req.headers || {})['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' ? '; Secure' : '') + '; Max-Age=' + (30 * 86400));
      const loc = /^https?:\/\//i.test(sr.url) ? sr.url : (String(sr.url || '/').startsWith('/') ? sr.url : '/');
      res.writeHead(302, { Location: loc });
      return res.end();
    }

    /* ===== 📢 AD PROJECTS + WALLET (visitor-safe) ===== */
    if (p === '/api/bazaar/campaigns' && req.method === 'GET') {
      const list = state.campaigns.filter(c => c.status === 'active').map(c => ({
        id: c.id, name: c.name, network: c.network, desc: c.desc, rate: c.rate,
        perShare: c.perShare, left: Math.max(0, Math.round((c.budget - c.spent) * 100) / 100),
        shares: c.shares || 0, clicks: c.clicks || 0
      }));
      return sendJSON(res, 200, { ok: true, campaigns: list, goodsRate: GOODS_TOKENS_PER_PESO });
    }
    if (p === '/api/bazaar/campaign/share' && req.method === 'POST') {
      const b = await body(req);
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Facebook login muna.' });
      const c = state.campaigns.find(x => x.id === String(b.id || ''));
      if (!c || c.status !== 'active') return sendJSON(res, 200, { ok: false, error: 'Campaign unavailable' });
      const left = (c.budget || 0) - (c.spent || 0);
      const cost = (c.perShare || 20) / PAYOUT_TOKENS_PER_PESO;
      if (left < cost) return sendJSON(res, 200, { ok: false, error: 'Budget naubos na ang campaign.' });
      const d = ensureVisitorDay(v);
      d.campaignShares = (d.campaignShares || 0) + 1;
      if (d.campaignShares > 12) return sendJSON(res, 200, { ok: false, error: 'Limit sa campaign shares kada araw (12).' });
      const sid = 'ad' + crypto.randomBytes(6).toString('hex');
      const target = /^https?:\/\//i.test(c.url) ? c.url : (String(c.url || '/').startsWith('/') ? String(c.url) : '/');
      const rec = {
        id: sid, vid: v.id, by: cleanTxt(v.name), kind: 'campaign', campaign: c.id,
        title: cleanTxt(c.name), price: 0, desc: cleanTxt(c.desc || 'Cyborg Office campaign').slice(0, 140),
        url: target, shareUrl: '/c/' + sid, at: Date.now(), clicks: 0, orders: 0, paid: c.perShare || 20
      };
      state.bazaarShares.push(rec);
      state.bazaarShares = state.bazaarShares.slice(-300);
      c.spent = Math.round(((c.spent || 0) + cost) * 100) / 100;
      c.shares = (c.shares || 0) + 1;
      state.bazaarStats.shares++;
      const instant = grantVisitor(v, c.perShare || 20, 10);
      const result = markVisitorTask(v, 'share', 'ad' + c.id);
      // 💼 Advertiser pays a 50% margin on top of the visitor payout — hindi tayo malulugi
      const adRevenue = Math.round(cost * CAMPAIGN_MARGIN * 100) / 100;
      state.bazaarStats.visitorPaid += (c.perShare || 20);
      state.bazaarStats.adRevenue = Math.round(((state.bazaarStats.adRevenue || 0) + adRevenue) * 100) / 100;
      state.bazaarStats.officeNet = Math.round((state.bazaarStats.officeNet + adRevenue - cost) * 100) / 100;
      state.bazaarStats.earned = state.bazaarStats.officeNet;
      scheduleSave();
      const caption = '📢 ' + cleanTxt(c.name) + '\n' + cleanTxt(c.desc || 'Cyborg Office campaign')
        + '\n👍 Shared by ' + cleanTxt(v.name) + ' mula sa Cyborg Office\n' + (target.startsWith('/') ? reqOrigin(req) + target : target);
      log('📢 ' + cleanTxt(v.name) + ' joined campaign ' + cleanTxt(c.name) + ' (+' + (c.perShare || 20) + ' tokens)', 'bazaar');
      return sendJSON(res, 200, { ok: true, share: rec, caption: caption, instant: instant, result: result, visitor: visitorView(v) });
    }
    if (p === '/api/bazaar/payout/request' && req.method === 'POST') {
      return sendJSON(res, 200, { ok: false, error: 'Walang cash payout. Gamitin ang 🍚 Redeem ng affiliate products.' });
    }
    if (p === '/api/bazaar/redemptions' && req.method === 'GET') {
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      return sendJSON(res, 200, {
        ok: true, items: redemptionItems(), rate: GOODS_TOKENS_PER_PESO,
        stages: SHIPPING_STAGES, nav: SHIPPING_NAV,
        mine: v ? state.redemptions.filter(x => x.vid === v.id).slice(-8).reverse() : []
      });
    }
    if (p === '/api/bazaar/redeem' && req.method === 'POST') {
      const b = await body(req);
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Facebook login muna.' });
      const item = redemptionItems().find(x => x.id === String(b.id || ''));
      if (!item) return sendJSON(res, 200, { ok: false, error: 'Produkto not found.' });
      const pending = state.redemptions.filter(x => x.vid === v.id && x.status === 'pending').length;
      if (pending >= 2) return sendJSON(res, 200, { ok: false, error: 'May 2 pending ka pang redeemed items.' });
      if ((v.coins || 0) < item.tokens) return sendJSON(res, 200, { ok: false, error: 'Kulang ang tokens. Kailangan 🪙' + item.tokens + ', meron ka 🪙' + (v.coins || 0) + '.' });
      const rec = {
        id: 'rd' + crypto.randomBytes(5).toString('hex'), vid: v.id, name: cleanTxt(v.name),
        itemId: item.id, item: cleanTxt(item.name), emoji: item.emoji || '🎁',
        price: item.price, tokens: item.tokens, url: String(item.url || '').slice(0, 1000),
        status: 'pending', ref: '', at: Date.now(), fulfilledAt: 0,
        shipping: {
          stage: 'queued', at: Date.now(), where: 'Office Delivery Dock',
          note: 'Hintay na ma-order ni CEO sa Shopee affiliate link.', courier: '',
          history: [{ stage: 'queued', at: Date.now(), note: 'Request na-receive sa office.' }]
        }
      };
      v.coins = (v.coins || 0) - item.tokens;
      state.redemptions.push(rec);
      state.redemptions = state.redemptions.slice(-300);
      scheduleSave();
      log('🎁 Redemption ' + rec.id + ' — ' + cleanTxt(v.name) + ' → ' + rec.item + ' (🪙' + rec.tokens + ')', 'bazaar');
      return sendJSON(res, 200, { ok: true, redemption: rec, visitor: visitorView(v) });
    }
    if (p === '/api/proof' && req.method === 'GET') {
      const goods = state.redemptions.filter(x => x.status === 'fulfilled' && x.ref).slice(-30).reverse();
      return sendJSON(res, 200, {
        ok: true,
        totalRedeemed: Math.round(goods.reduce((s, x) => s + (x.price || 0), 0) * 100) / 100,
        redeemedCount: goods.length,
        goods: goods.map(x => ({ id: x.id, name: x.name, item: x.item, price: x.price, at: x.fulfilledAt || x.at, ref: x.ref,
          stage: (x.shipping && x.shipping.stage) || 'shipped', where: (x.shipping && x.shipping.where) || 'Courier Hub' })),
        shippingStages: SHIPPING_STAGES, nav: SHIPPING_NAV,
        campaigns: state.campaigns.filter(c => c.status === 'active').length
      });
    }
    if (p.startsWith('/c/') && req.method === 'GET') {
      const sid = p.slice(3).slice(0, 50);
      const sr = state.bazaarShares.find(s => s.id === sid);
      if (!sr) return sendJSON(res, 404, { ok: false, error: 'Campaign link not found' });
      sr.clicks = (sr.clicks || 0) + 1;
      const c = state.campaigns.find(x => x.id === sr.campaign);
      if (c) c.clicks = (c.clicks || 0) + 1;
      state.bazaarStats.clicks++;
      scheduleSave();
      const loc = /^https?:\/\//i.test(sr.url) ? sr.url : (String(sr.url || '/').startsWith('/') ? sr.url : '/');
      res.writeHead(302, { Location: loc });
      return res.end();
    }

    /* ===== 👑 CEO-ONLY bazaar controls (password-gated; hindi abot ng bisita) ===== */
    // 🤖 BOT CONTROL AUDIT — sinusuri ng mga bot kung gumagana ang WASD/Space/E/Enter ng bawat visitor
    if (p === '/api/ceo/monitor' && req.method === 'POST') {
      const CHECKERS = [
        { id: 'mgr', name: 'Bot Manager', icon: '🧭' },
        { id: 'cos', name: 'Chief of Staff', icon: '🧠' },
        { id: 'social', name: 'Social Media Manager', icon: '📱' },
        { id: 'scraper', name: 'Community Scraper', icon: '🕸' },
        { id: 'outreach', name: 'Client Outreach', icon: '📨' },
        { id: 'product', name: 'Product Video Bot', icon: '🎬' }
      ];
      const now = Date.now();
      const visitors = Object.keys(state.visitors).map(id => {
        const v = state.visitors[id], c = v.controls || {}, keys = c.keys || [];
        const has = arr => arr.some(k => keys.indexOf(k) >= 0);
        const pingAge = c.lastPing ? Math.round((now - c.lastPing) / 1000) : -1;
        const checks = [
          { name: '3D / WebGL', ok: !!c.three, detail: c.three ? 'Loaded' : 'Hindi pa loaded' },
          { name: 'WASD / Arrow', ok: has(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']), detail: 'Lakad' },
          { name: 'Space (jump)', ok: has([' ']), detail: 'Jump' },
          { name: 'E (interact)', ok: has(['e']) || (c.interact || 0) > 0, detail: 'Interact' },
          { name: 'Enter (chat)', ok: has(['enter']) || (c.chat || 0) > 0, detail: 'World chat' },
          { name: 'Walang error', ok: (c.errors || 0) === 0, detail: (c.errors || 0) + ' error' },
          { name: 'Online ping', ok: pingAge >= 0 && pingAge < 90, detail: pingAge < 0 ? 'Never' : pingAge + 's ago' }
        ];
        const warn = checks.filter(x => !x.ok);
        const seed = Array.from(id).reduce((s, ch) => s + ch.charCodeAt(0), 0);
        return {
          id: v.id, name: v.name, level: levelFor(v.xp).name,
          checker: CHECKERS[seed % CHECKERS.length],
          status: warn.length ? 'warn' : 'ok', checks: warn, warnings: warn.map(x => x.name),
          controls: {
            keys: keys.slice(-12), move: c.move || 0, interact: c.interact || 0, chat: c.chat || 0,
            errors: c.errors || 0, pings: c.pings || 0, lastPing: c.lastPing || 0,
            pos: c.pos || null, grounded: !!c.grounded, since: c.firstSeen || 0
          }
        };
      }).sort((a, b) => (b.controls.lastPing || 0) - (a.controls.lastPing || 0));
      return sendJSON(res, 200, {
        ok: true, visitors: visitors, checkers: CHECKERS, checkedAt: now,
        summary: {
          total: visitors.length,
          ok: visitors.filter(x => x.status === 'ok').length,
          warn: visitors.filter(x => x.status === 'warn').length,
          active: visitors.filter(x => x.controls.lastPing && now - x.controls.lastPing < 90000).length
        }
      });
    }
    // 🔑 CEO FACEBOOK SETUP — server-side lang sinusulat; hindi ibinabalik ang secret sa browser
    if (p === '/api/ceo/setup-fb' && req.method === 'POST') {
      const b = await body(req);
      if (!ceoAuthorized(req, b)) return sendJSON(res, 403, { ok: false, error: 'CEO login required.' });
      const cur = readJSON(SETTINGS_FILE, {});
      const sec = secrets();
      const id = String(b.fbAppId || '').trim();
      const secret = String(b.fbAppSecret || '').trim();
      const redirect = String(b.fbRedirectUri || '').trim();
      if (id) cur.fbAppId = id;
      if (secret) sec.fbAppSecret = secret;
      if (redirect) cur.fbRedirectUri = redirect;
      writeJSON(SETTINGS_FILE, cur);
      writeJSON(SECRETS_FILE, sec);
      log('🔵 Facebook login credentials updated (server-side only)', 'CEO');
      return sendJSON(res, 200, {
        ok: true,
        configured: !!(cur.fbAppId && sec.fbAppSecret && cur.fbRedirectUri),
        redirect: cur.fbRedirectUri || ''
      });
    }
    // 🛍️ SHOPEE AFFILIATE — Affiliate ID / token, server-side lang; hindi binabalik sa browser
    if (p === '/api/ceo/setup-shopee' && req.method === 'POST') {
      const b = await body(req);
      if (!ceoAuthorized(req, b))
        return sendJSON(res, 403, { ok: false, error: 'CEO login required.' });
      const cur = readJSON(SETTINGS_FILE, {});
      const sec = secrets();
      const id = String(b.shopeeAffId || '').trim().slice(0, 64);
      const token = String(b.shopeeAffToken || '').trim().slice(0, 256);
      if (id) cur.shopeeAffId = id;
      if (token) sec.shopeeAffToken = token;
      writeJSON(SETTINGS_FILE, cur);
      writeJSON(SECRETS_FILE, sec);
      log('🛍️ Shopee Affiliate credentials updated (server-side only)', 'CEO');
      return sendJSON(res, 200, {
        ok: true,
        configured: !!(cur.shopeeAffId || sec.shopeeAffToken),
        affiliateIdSet: !!cur.shopeeAffId
      });
    }
    // 🔌 CEO CONNECTIONS — status lang ang ipinapadala; secrets hindi lumalabas sa browser
    if (p === '/api/ceo/connections' && req.method === 'POST') {
      const cfg = readSettingsMerged();
      const dep = readJSON(path.join(DATA, 'deploy.json'), {});
      const env = process.env;
      const has = (...vals) => vals.some(x => String(x || '').trim().length > 0);
      const fb = fbCfg();
      const connections = [
        { id: 'facebook', name: 'Facebook Login', icon: '🔵', color: '#1877f2',
          url: 'https://developers.facebook.com/apps/',
          hint: 'FB App ID · App Secret · Redirect URI', ready: !!(fb.id && fb.secret && fb.redirect) },
        { id: 'youtube', name: 'YouTube / Google', icon: '▶️', color: '#ff4e45',
          url: 'https://console.cloud.google.com/apis/credentials',
          hint: 'Google OAuth Client ID · Secret o refresh token',
          ready: has(cfg.youtubeClientId, env.YOUTUBE_CLIENT_ID) && has(cfg.youtubeClientSecret, env.YOUTUBE_CLIENT_SECRET, cfg.youtubeRefreshToken, env.YOUTUBE_REFRESH_TOKEN) },
        { id: 'shopee', name: 'Shopee Affiliate', icon: '🛍️', color: '#ee4d2d',
          url: 'https://affiliate.shopee.ph/',
          hint: 'Affiliate ID (Account Settings) + mga product link',
          ready: has(cfg.shopeeAffId, env.SHOPEE_AFF_ID, cfg.shopeeAffToken, env.SHOPEE_AFF_TOKEN) },
        { id: 'tiktok', name: 'TikTok Business', icon: '🎵', color: '#25f4ee',
          url: 'https://ads.tiktok.com/business/creativecenter/',
          hint: 'TikTok Client Key · Client Secret',
          ready: has(cfg.tiktokClientKey, env.TIKTOK_CLIENT_KEY) && has(cfg.tiktokClientSecret, env.TIKTOK_CLIENT_SECRET) },
        { id: 'render', name: 'Render Deploy', icon: '🚀', color: '#46e3b7',
          url: 'https://dashboard.render.com/',
          hint: 'Render account o Deploy Hook sa data/deploy.json',
          ready: has(dep.deployHook, env.RENDER_DEPLOY_HOOK, dep.serviceId, env.RENDER_SERVICE_ID) },
        { id: 'github', name: 'GitHub Repo', icon: '🐙', color: '#a371f7',
          url: 'https://github.com/',
          hint: 'GitHub login o token para ma-update ang repo',
          ready: has(cfg.githubToken, env.GITHUB_TOKEN, cfg.githubRepo, env.GITHUB_REPO) },
        { id: 'ai', name: 'AI Provider', icon: '🧠', color: '#c9a227',
          url: '/?view=settings',
          hint: 'Coarena / Groq / iba pang API key',
          ready: has(cfg.apiKey, env.COARENA_API_KEY, cfg.keys && cfg.keys.groq && cfg.keys.groq.apiKey, env.GROQ_API_KEY) }
      ];
      return sendJSON(res, 200, {
        ok: true, connections: connections,
        note: 'Walang password ang itinatago dito. OAuth/token lang; server-side lang ang mga values.'
      });
    }
    if (p === '/api/ceo/bazaar/list' && req.method === 'POST') {
      const list = Object.keys(state.visitors).map(id => {
        const v = state.visitors[id];
        return Object.assign(visitorView(v), { name: v.name });
      }).sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 50);
      return sendJSON(res, 200, { ok: true, visitors: list, parts: POD_PARTS });
    }
    if (p === '/api/ceo/bazaar/stats' && req.method === 'POST') {
      return sendJSON(res, 200, {
        ok: true, stats: state.bazaarStats,
        shares: state.bazaarShares.slice(-40).reverse(),
        commissionRate: BAZAAR_COMMISSION_RATE, levelCut: LEVEL_CUT,
        goodsRate: GOODS_TOKENS_PER_PESO, redemptions: state.redemptions.slice(-20).reverse()
      });
    }
    // 📊 CEO Shopee analytics — aggregated stall clicks / product views / new-tab intent
    if (p === '/api/ceo/shopee-analytics' && req.method === 'POST') {
      const ev = state.shopAnalytics || [];
      const byKind = { stall_click: 0, product_view: 0, newtab: 0, zone_visit: 0 };
      const byItem = {}, byHour = {}, byVisitor = {};
      for (const e of ev) {
        byKind[e.kind] = (byKind[e.kind] || 0) + 1;
        if (e.kind === 'stall_click' || e.kind === 'product_view' || e.kind === 'newtab') {
          const key = e.itemId || e.itemName || 'unknown';
          if (!byItem[key]) byItem[key] = { id: key, name: e.itemName || key, clicks: 0, views: 0, newtab: 0 };
          if (e.kind === 'stall_click') byItem[key].clicks++;
          else if (e.kind === 'product_view') byItem[key].views++;
          else byItem[key].newtab++;
        }
        const hr = new Date(e.at).toLocaleString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', hour12: false });
        byHour[hr] = (byHour[hr] || 0) + 1;
        if (e.vid) byVisitor[e.vid] = (byVisitor[e.vid] || 0) + 1;
      }
      const topItems = Object.values(byItem).sort((a, b) => (b.clicks + b.views) - (a.clicks + a.views)).slice(0, 10);
      const busiestHours = Object.entries(byHour).map(([hour, n]) => ({ hour, n })).sort((a, b) => b.n - a.n).slice(0, 6);
      return sendJSON(res, 200, {
        ok: true, total: ev.length, byKind,
        uniqueVisitors: Object.keys(byVisitor).length,
        topItems, busiestHours,
        recent: ev.slice(-30).reverse()
      });
    }
    // 🎤 CEO Event Stage show settings
    if (p === '/api/ceo/event' && req.method === 'POST') {
      const b = await body(req), act = String(b.action || 'get');
      if (act === 'set') {
        if (typeof b.enabled === 'boolean') state.eventShow.enabled = b.enabled;
        if (b.intervalMin !== undefined) state.eventShow.intervalMin = Math.max(1, Math.min(60, Number(b.intervalMin) || 5));
        scheduleSave();
        log('🎤 Event Stage show ' + (state.eventShow.enabled ? 'ON' : 'OFF') + ' (every ' + state.eventShow.intervalMin + ' min)', 'CEO');
      }
      return sendJSON(res, 200, { ok: true, enabled: state.eventShow.enabled !== false, intervalMin: state.eventShow.intervalMin });
    }
    if (p === '/api/ceo/campaigns' && req.method === 'POST') {
      const b = await body(req), act = String(b.action || 'list');
      if (act === 'create') {
        const name = cleanTxt(b.name || '');
        const url = String(b.url || '').trim().slice(0, 1000);
        if (!name) return sendJSON(res, 200, { ok: false, error: 'Kailangan ang campaign name.' });
        if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return sendJSON(res, 200, { ok: false, error: 'Kailangan ang valid URL.' });
        const c = {
          id: 'c' + crypto.randomBytes(4).toString('hex'), name: name,
          network: cleanTxt(b.network || 'Own Content') || 'Own Content',
          url: url, desc: cleanTxt(b.desc || 'Cyborg Office campaign').slice(0, 140),
          rate: Math.max(0, Math.min(1, Number(b.rate) || 0.05)),
          perShare: Math.max(1, Math.min(1000, Math.floor(Number(b.perShare) || 20))),
          budget: Math.max(0, Math.min(1e7, Number(b.budget) || 1000)),
          spent: 0, shares: 0, clicks: 0, status: 'active', createdAt: Date.now()
        };
        state.campaigns.push(c); scheduleSave();
        log('📢 CEO created ad project: ' + name + ' (🪙' + c.perShare + '/share)', 'CEO');
        return sendJSON(res, 200, { ok: true, campaign: c, campaigns: state.campaigns });
      }
      if (act === 'update' || act === 'delete') {
        const c = state.campaigns.find(x => x.id === String(b.id || ''));
        if (!c) return sendJSON(res, 200, { ok: false, error: 'Campaign not found' });
        if (act === 'delete') {
          state.campaigns = state.campaigns.filter(x => x !== c);
          scheduleSave();
          log('📢 CEO deleted ad project: ' + cleanTxt(c.name), 'CEO');
          return sendJSON(res, 200, { ok: true, campaigns: state.campaigns });
        }
        if (Object.prototype.hasOwnProperty.call(b, 'name')) c.name = cleanTxt(b.name) || c.name;
        if (Object.prototype.hasOwnProperty.call(b, 'network')) c.network = cleanTxt(b.network) || c.network;
        if (Object.prototype.hasOwnProperty.call(b, 'url')) {
          const nu = String(b.url || '').trim().slice(0, 1000);
          if (/^https?:\/\//i.test(nu) || nu.startsWith('/')) c.url = nu;
        }
        if (Object.prototype.hasOwnProperty.call(b, 'desc')) c.desc = cleanTxt(b.desc).slice(0, 140);
        if (Object.prototype.hasOwnProperty.call(b, 'rate')) c.rate = Math.max(0, Math.min(1, Number(b.rate) || 0));
        if (Object.prototype.hasOwnProperty.call(b, 'perShare')) c.perShare = Math.max(1, Math.min(1000, Math.floor(Number(b.perShare) || 1)));
        if (Object.prototype.hasOwnProperty.call(b, 'budget')) c.budget = Math.max(c.spent || 0, Math.min(1e7, Number(b.budget) || 0));
        if (b.status === 'active' || b.status === 'paused') c.status = b.status;
        scheduleSave();
        log('📢 CEO updated ad project: ' + cleanTxt(c.name) + ' (' + c.status + ')', 'CEO');
        return sendJSON(res, 200, { ok: true, campaign: c, campaigns: state.campaigns });
      }
      return sendJSON(res, 200, { ok: true, campaigns: state.campaigns, stats: state.bazaarStats });
    }
    if (p === '/api/ceo/commercials' && req.method === 'POST') {
      const b = await body(req), act = String(b.action || 'list');
      if (act === 'create') {
        const cm = makeCommercial(b, req);
        state.commercials.unshift(cm);
        state.commercials = state.commercials.slice(-60);
        saveStateNow();
        log('🎬 CEO created bot commercial: ' + cm.title + ' (' + cm.botName + ')', 'CEO');
        return sendJSON(res, 200, { ok: true, commercial: cm, commercials: state.commercials });
      }
      if (act === 'update' || act === 'delete') {
        const cm = state.commercials.find(x => x.id === String(b.id || ''));
        if (!cm) return sendJSON(res, 200, { ok: false, error: 'Commercial not found' });
        if (act === 'delete') {
          state.commercials = state.commercials.filter(x => x !== cm);
          saveStateNow();
          return sendJSON(res, 200, { ok: true, commercials: state.commercials });
        }
        if (b.status === 'active' || b.status === 'paused') cm.status = b.status;
        saveStateNow();
        return sendJSON(res, 200, { ok: true, commercial: cm, commercials: state.commercials });
      }
      return sendJSON(res, 200, { ok: true, commercials: state.commercials.slice(-30).reverse() });
    }
    if (p === '/api/ceo/payouts' && req.method === 'POST') {
      return sendJSON(res, 200, { ok: true, disabled: true, payouts: [], pending: [] });
    }
    if (p === '/api/ceo/redemptions' && req.method === 'POST') {
      const b = await body(req), act = String(b.action || 'list');
      const rd = state.redemptions.find(x => x.id === String(b.id || ''));
      if (act === 'fulfill') {
        if (!rd) return sendJSON(res, 200, { ok: false, error: 'Redemption not found' });
        if (rd.status !== 'pending') return sendJSON(res, 200, { ok: false, error: 'Redemption ay ' + rd.status + ' na.' });
        const ref = cleanTxt(b.ref || '');
        if (!ref) return sendJSON(res, 200, { ok: false, error: 'Kailangan ang Shopee order reference.' });
        rd.status = 'fulfilled'; rd.ref = ref; rd.fulfilledAt = Date.now(); rd.fulfilledBy = 'CEO';
        setShipping(rd, 'packed', 'Na-order na sa Shopee. Hintay ng pickup ng courier.', '');
        // P2: fulfillment is recorded in the finance ledger, separate from game stats.
        const ledgerGross = Math.round((Number(rd.price) || 0) * BAZAAR_COMMISSION_RATE * 100) / 100;
        ledgerAdd('confirmed', {
          type: 'redemption-fulfillment', ref: rd.id, externalRef: ref,
          amount: Number(rd.price) || 0, commissionEstimate: ledgerGross,
          source: 'goods-redemption', actor: 'CEO',
          note: 'CEO fulfilled goods redemption. Shopee order ref ' + ref + '. Manual record only.'
        });
        // 🎁 Ang goods fulfillment ay actual affiliate order din — idagdag sa office earnings
        const gross = Math.round((Number(rd.price) || 0) * BAZAAR_COMMISSION_RATE * 100) / 100;
        state.bazaarStats.orders++;
        state.bazaarStats.gross = Math.round((state.bazaarStats.gross + gross) * 100) / 100;
        state.bazaarStats.officeNet = Math.round((state.bazaarStats.officeNet + gross) * 100) / 100;
        state.bazaarStats.earned = state.bazaarStats.officeNet;
        scheduleSave();
        log('🎁 CEO FULFILLED ' + rd.id + ' — ' + cleanTxt(rd.item) + ' ₱' + rd.price + ' ref=' + ref, 'CEO');
        return sendJSON(res, 200, { ok: true, redemption: rd });
      }
      if (act === 'ship') {
        if (!rd) return sendJSON(res, 200, { ok: false, error: 'Redemption not found' });
        if (rd.status !== 'fulfilled') return sendJSON(res, 200, { ok: false, error: 'Na-fulfill pa lang ang redemption.' });
        const stage = String(b.stage || '');
        if (!SHIPPING_STAGES.some(s => s.id === stage)) return sendJSON(res, 200, { ok: false, error: 'Unknown shipping stage' });
        setShipping(rd, stage, b.note || '', b.courier || '');
        if (stage === 'delivered') rd.deliveredAt = Date.now();
        scheduleSave();
        log('🚚 Shipping update ' + rd.id + ' → ' + stage + ' (' + rd.ref + ')', 'CEO');
        return sendJSON(res, 200, { ok: true, redemption: rd });
      }
      if (act === 'cancel') {
        if (!rd) return sendJSON(res, 200, { ok: false, error: 'Redemption not found' });
        if (rd.status !== 'pending') return sendJSON(res, 200, { ok: false, error: 'Redemption ay ' + rd.status + ' na.' });
        rd.status = 'cancelled'; rd.ref = cleanTxt(b.ref || 'Cancelled'); rd.fulfilledAt = Date.now();
        if (state.visitors[rd.vid]) state.visitors[rd.vid].coins = (state.visitors[rd.vid].coins || 0) + (rd.tokens || 0);
        scheduleSave();
        log('🎁 CEO CANCELLED redemption ' + rd.id + ' — tokens refunded', 'CEO');
        return sendJSON(res, 200, { ok: true, redemption: rd });
      }
      const list = state.redemptions.slice(-60).reverse();
      return sendJSON(res, 200, { ok: true, redemptions: list, pending: list.filter(x => x.status === 'pending') });
    }
    if (p === '/api/ceo/bazaar/grant' && req.method === 'POST') {
      const b = await body(req);
      const id = String(b.id || ''), v = state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Visitor not found' });
      const coin = Math.max(0, Math.min(9999, Number(b.coins) || 0));
      const xp = Math.max(0, Math.min(99999, Number(b.xp) || 0));
      const part = String(b.part || '');
      let applied = null;
      if (coin || xp) grantVisitor(v, coin, xp);
      if (part && Object.prototype.hasOwnProperty.call(POD_PARTS, part)) {
        v.pod = v.pod || {};
        const cur = v.pod[part] || 0;
        if (cur < 3) { v.pod[part] = cur + 1; applied = part + ' → Lv' + (cur + 1); }
      }
      if (v.wish && v.wish.status === 'pending') v.wish.status = 'granted';
      scheduleSave();
      log('👑 CEO granted ' + cleanTxt(v.name) + ': +' + coin + ' tokens, +' + xp + ' XP' + (applied ? ', ' + applied : ''), 'CEO');
      return sendJSON(res, 200, { ok: true, visitor: visitorView(v), applied: applied });
    }

    /* ===== 🎬 VIDEO FACTORY (Remotion) ===== */
    if (p === '/api/video/list' && req.method === 'GET') {
      try {
        fs.mkdirSync(VIDEO_DIR, {recursive: true});
        const rows = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.mp4')).map(f => {
          const st = fs.statSync(path.join(VIDEO_DIR, f));
          let cfg = {};
          try { cfg = JSON.parse(fs.readFileSync(path.join(VIDEO_DIR, f.replace(/\.mp4$/, '.json')), 'utf8')); } catch (_) {}
          return {name: f.replace(/\.mp4$/, ''), url: '/videos/' + f, size: st.size, created: st.mtimeMs, config: cfg};
        }).sort((a, b) => b.created - a.created).slice(0, 40);
        return sendJSON(res, 200, {ok: true, videos: rows});
      } catch (e) { return sendJSON(res, 500, {ok: false, error: e.message}); }
    }
    if (p === '/api/video/render' && req.method === 'POST') {
      const b = req._body || await body(req);
      try {
        const cfg = videoConfigFrom(b);
        const r = await renderOfficeVideo(cfg, safeVideoName(b.name || cfg.mode));
        return sendJSON(res, 200, Object.assign({ok: true}, r));
      } catch (e) { return sendJSON(res, 500, {ok: false, error: e.message}); }
    }
    if (p === '/api/video/approve' && req.method === 'POST') {
      const b = req._body || await body(req);
      try {
        const name = safeVideoName(b.name);
        const cfgFile = path.join(VIDEO_DIR, name + '.json');
        if (!fs.existsSync(cfgFile)) return sendJSON(res, 404, {ok: false, error: 'Video config not found.'});
        const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
        cfg.watermark = false;
        const r = await renderOfficeVideo(cfg, name.replace(/-preview$/, '') + '-final');
        return sendJSON(res, 200, Object.assign({ok: true}, r));
      } catch (e) { return sendJSON(res, 500, {ok: false, error: e.message}); }
    }
    if (p === '/api/video/batch' && req.method === 'POST') {
      const b = req._body || await body(req);
      const items = Array.isArray(b.items) ? b.items.slice(0, 10) : [];
      if (!items.length) return sendJSON(res, 400, {ok: false, error: 'items[] required (max 10).'});
      const results = [];
      for (const it of items) {
        try {
          const cfg = videoConfigFrom(it);
          const r = await renderOfficeVideo(cfg, safeVideoName(it.name || cfg.mode));
          results.push(Object.assign({ok: true}, r));
        } catch (e) { results.push({ok: false, error: e.message}); }
      }
      return sendJSON(res, 200, {ok: true, results});
    }
    if (p === '/api/video/recap' && req.method === 'POST') {
      const b = req._body || await body(req);
      try {
        const st = publicState();
        const agents = (st.agents || []).length;
        const tasks = (st.tasks || []).length;
        const products = (st.products || []).length;
        const routines = (st.routines || []).length;
        const cfg = videoConfigFrom({
          name: 'weekly-recap', mode: 'recap', format: b.format || 'wide',
          title: 'Weekly Office Recap',
          tagline: agents + ' AI employees · ' + tasks + ' tasks · ' + products + ' products · ' + routines + ' routines',
          cta: 'Dream Bigger. Let AI Work Harder!',
          watermark: b.watermark !== false,
        });
        const r = await renderOfficeVideo(cfg, 'weekly-recap');
        return sendJSON(res, 200, Object.assign({ok: true}, r));
      } catch (e) { return sendJSON(res, 500, {ok: false, error: e.message}); }
    }

    if (p === '/api/video/campus' && req.method === 'POST') {
      const b = req._body || await body(req);
      try {
        const cfg = videoConfigFrom({
          mode: 'campus', format: b.format || 'wide',
          title: b.title || 'Cyborg Cheebee HQ',
          tagline: b.tagline || 'Our 3D AI campus - where agents work 24/7.',
          cta: b.cta || 'Dream Bigger. Let AI Work Harder!',
          watermark: b.watermark !== false,
          imageUrl: b.imageUrl || '', captions: b.captions || [], voiceoverUrl: b.voiceoverUrl || '',
        });
        const r = await renderOfficeVideo(cfg, safeVideoName(b.name || 'campus-intro'));
        state.tasks.push({bot: 'post', title: '🏙️ Video: ' + cfg.title, approval: true, status: 'approval',
          note: 'VIDEO:' + JSON.stringify({name: r.name, url: r.url, config: cfg})});
        saveStateNow();
        return sendJSON(res, 200, Object.assign({ok: true}, r));
      } catch (e) { return sendJSON(res, 500, {ok: false, error: e.message}); }
    }
    if (p === '/api/video/brief' && req.method === 'POST') {
      const b = req._body || await body(req);
      const brief = String(b.brief || '').trim().slice(0, 1500);
      if (!brief) return sendJSON(res, 400, {ok: false, error: 'Brief required.'});
      try {
        const sys = 'You are the AI Video Editor Assistant of Cyborg Cheebee Office. Convert the CEO brief into ONLY a JSON object with keys: title, tagline, cta, format (vertical|wide), mode (product|recap|agent|campus), color1 (#rrggbb), color2 (#rrggbb), imageUrl (string or empty), voiceoverUrl (string or empty), captions (array of short strings). No markdown, no explanation. Match the language of the brief.';
        const raw = await callAI(sys, 'Brief: ' + brief, 500);
        const m = String(raw).match(/\{[\s\S]*\}/);
        if (!m) throw new Error('AI did not return JSON. Raw: ' + String(raw).slice(0, 120));
        const parsed = JSON.parse(m[0]);
        return sendJSON(res, 200, {ok: true, config: videoConfigFrom(parsed)});
      } catch (e) { return sendJSON(res, 500, {ok: false, error: e.message}); }
    }

    /* static files */
    let file = p === '/' ? '/index.html' : p;
    file = file.replace(/\.\./g, '');
    const full = path.join(PUBLIC, file);
    if (!full.startsWith(PUBLIC)) return sendJSON(res, 403, { error: 'Forbidden' });
    fs.readFile(full, (err, data) => {
      if (err) return send(res, 404, 'Not found', 'text/plain');
      const ext = path.extname(full).toLowerCase();
      send(res, 200, data, MIME[ext] || 'application/octet-stream', ext === '.html' ? 'html' : 'static');
    });
  } catch (e) {
    console.error(e);
    sendJSON(res, 500, { error: e.message });
  }
});

ensureShopeeLinks();
server.listen(PORT, () => {
  console.log('AI Agents Office running at http://localhost:' + PORT);
  console.log('API key configured:', !!settings().apiKey);
});
