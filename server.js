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
    groq: 'openai/gpt-oss-20b', openai: 'gpt-4o-mini'
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
state.bazaarSecret = 'cyborg-bz-stable-v1';
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
    mall: state.mall, orders: state.orders.slice(-200),
    accounts: state.accounts, hires: state.hires,
    visitors: state.visitors, bazaarSecret: state.bazaarSecret,
    bazaarShares: state.bazaarShares.slice(-300), bazaarStats: state.bazaarStats,
    campaigns: state.campaigns, payouts: state.payouts.slice(-300),
    redemptions: state.redemptions.slice(-300), commercials: state.commercials.slice(-60)
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
  if (!/JSON/.test(system)) system += ' Always write in casual TAGLISH — natural Tagalog mixed with English, like Filipino office workers chatting. Use proper Tagalog spelling and grammar. Keep it natural, short, and friendly.';
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
    const priceMeta = html.match(/<meta[^>]+(?:property|name)=["'](?:product:price:amount|og:price:amount)["'][^>]+content=["']([0-9][0-9.,]*)/i)
      || html.match(/"price"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/i) || [];
    const priceRaw = priceMeta[1] || '';
    const price = Math.max(0, Math.min(1e7, Number(String(priceRaw).replace(/,/g, '')) || 0));
    return { title: title.slice(0, 200), description: desc.slice(0, 400), price: Math.round(price * 100) / 100 };
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

function bazaarDay() {
  const d = new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' });
}
function fbCfg() {
  const d = readJSON(SETTINGS_FILE, {});
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
      pod: { desk: 0, pc: 0, chair: 0, plant: 0, sign: 0, shelf: 0 }
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
    allDone: CORE_TASK_IDS.every(id => d.done[id])
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
  const s = crypto.createHmac('sha256', String(state.bazaarSecret || 'cyborg')).update(p).digest('base64url');
  return p + '.' + s;
}
function readBazaarToken(tok) {
  try {
    const parts = String(tok || '').split('.');
    if (parts.length !== 2) return null;
    const want = crypto.createHmac('sha256', String(state.bazaarSecret || 'cyborg')).update(parts[0]).digest('base64url');
    if (want !== parts[1]) return null;
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
function setBazaarCookie(res, id, name, picture) {
  const max = 30 * 86400;
  const v = state.visitors[id] || {};
  res.setHeader('Set-Cookie', 'bz=' + encodeURIComponent(signBazaarToken({ id: id, name: String(name || v.name || '').slice(0, 60), picture: String(picture || v.picture || '').slice(0, 500), exp: Date.now() + max * 1000 })) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + max);
}

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
    mall: state.mall, orders: state.orders.slice(-50),
    conversations: state.conversations,
    activity: state.activity, stopped: state.stopped, running: state.running,
    // ⚠️ PUBLIC: hinding-hindi isasama ang aktwal na API keys — CEO lang kumukuha via /api/private
    setup: { hasKey: !!s.apiKey, model: s.model, provider: s.provider, baseUrl: s.baseUrl,
      keys: {}, failover: s.failover }
  };
}

let limitsCache = { at: 0, data: null };

// ===== 🛡️ ANTI-HACKER SHIELD: rate limiting + brute-force lockout (per IP) =====
const guard = new Map(); // ip -> {n, t0, bad, lastBad}
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

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:' + PORT);
  const p = u.pathname;
  try {
    // ===== 🛡️ ANTI-HACKER SHIELD (hawak ni BANTAY, ang guard bot): flood + brute-force lockout =====
    const ip = (req.socket.remoteAddress || 'x').toString();
    const ghOld = guard.get(ip), nowMs = Date.now();
    if (ghOld && ghOld.bad >= 10 && ghOld.lastBad && nowMs - ghOld.lastBad < 600000) {
      // locked out: bisita mode lang — PERO ang TOTOONG CEO na may tamang password, papasukin!
      if (req.method === 'POST' && p !== '/api/orders' && !p.startsWith('/api/bazaar/') && !p.startsWith('/api/fb/')) {
        if (p === '/api/unlock') {
          const b = await body(req);
          if (String(b.pass || '') === String(readJSON(SETTINGS_FILE, {}).password || 'cyborg')) {
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
    // ===== SECURITY: password lock sa lahat ng CEO actions (bisita: tingin lang) =====
    if (req.method === 'POST' && p.startsWith('/api/') && p !== '/api/unlock' && p !== '/api/orders'
        && !p.startsWith('/api/bazaar/') && !p.startsWith('/api/fb/')) {
      const b = await body(req);
      const real = String(readJSON(SETTINGS_FILE, {}).password || 'cyborg');
      if (String(b.pass || '') !== real) {
        guardBumpBad(ip);
        log('Blocked ' + p + ' — wrong or missing CEO password', 'security');
        return sendJSON(res, 403, { ok: false, error: 'Locked! CEO password required.' });
      }
      req._body = b;
    }
    if (p === '/api/unlock' && req.method === 'POST') {
      const b = await body(req);
      const ok = String(b.pass || '') === String(readJSON(SETTINGS_FILE, {}).password || 'cyborg');
      if (ok) log('CEO logged in — office unlocked', 'security');
      else guardBumpBad(ip);
      return sendJSON(res, ok ? 200 : 403, { ok });
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
    if (p === '/api/accounts' && req.method === 'GET') {
      if (String(u.searchParams.get('pass') || '') !== String(readJSON(SETTINGS_FILE, {}).password || 'cyborg'))
        return sendJSON(res, 403, { ok: false, error: 'CEO password required.' });
      return sendJSON(res, 200, { accounts: state.accounts });
    }
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
    if (p === '/api/orders' && req.method === 'GET') return sendJSON(res, 200, { orders: state.orders.slice(-50) });
    if (p === '/api/orders' && req.method === 'POST') {
      const b = await body(req);
      const items = Array.isArray(b.items) ? b.items.filter(x => x && x.name).slice(0, 30)
        .map(x => ({ name: cleanTxt(x.name), price: Math.max(0, Math.min(1e7, Number(x.price) || 0)), qty: Math.max(1, Math.min(10, Number(x.qty) || 1)) })) : [];
      if (!items.length) return sendJSON(res, 400, { ok: false, error: 'Walang laman ang cart!' });
      const total = items.reduce((s, x) => s + (Number(x.price) || 0) * (Number(x.qty) || 1), 0);
      const code = 'CB-' + Math.floor(100000 + Math.random() * 900000);
      const ref = String(b.ref || '').slice(0, 50);
      const sr = ref ? state.bazaarShares.find(s => s.id === ref) : null;
      const order = { code, items, total, status: 'bayad-na', at: Date.now(), ref: sr ? ref : '' };
      state.orders.push(order); state.orders = state.orders.slice(-200);
      if (sr) {
        const buyer = sr.vid && state.visitors[sr.vid];
        const cut = buyer ? LEVEL_CUT[levelFor(buyer.xp).index] : LEVEL_CUT[0];
        const gross = Math.round(total * BAZAAR_COMMISSION_RATE * 100) / 100;
        const paid = Math.max(5, Math.round(gross * cut));
        sr.clicks = (sr.clicks || 0) + 1;
        sr.orders = (sr.orders || 0) + 1;
        sr.paid = (sr.paid || 0) + paid;
        state.bazaarStats.orders++;
        state.bazaarStats.gross = Math.round((state.bazaarStats.gross + gross) * 100) / 100;
        state.bazaarStats.visitorPaid += paid;
        state.bazaarStats.officeNet = Math.round((state.bazaarStats.officeNet + Math.max(0, gross - paid)) * 100) / 100;
        state.bazaarStats.earned = state.bazaarStats.officeNet;
        if (buyer) {
          buyer.earned = (buyer.earned || 0) + paid;
          buyer.paidOrders = (buyer.paidOrders || 0) + 1;
          grantVisitor(buyer, paid, 5);
          markVisitorTask(buyer, 'order', sr.id);
          log('💰 ' + cleanTxt(buyer.name) + ' earned ' + paid + ' tokens (' + Math.round(cut * 100) + '% cut) from order ' + code, 'bazaar');
        }
      }
      saveStateNow();
      log('🧾 Mall order ' + code + ' — ₱' + total + ' (' + items.length + ' item/s) BAYAD NA ✓' + (sr ? ' 👑 ref=' + sr.id : ''), 'mall');
      return sendJSON(res, 200, { ok: true, order });
    }

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
      if (String(u.searchParams.get('pass') || '') !== String(readJSON(SETTINGS_FILE, {}).password || 'cyborg'))
        return sendJSON(res, 403, { ok: false, error: 'CEO password required.' });
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
        setBazaarCookie(res, cv.id, cv.name, cv.picture);
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
          // code already consumed by a prior callback (e.g. browser reload): if user is
          // already logged in via cookie, just send them to the office instead of an error
          if (String(fe.message || '').indexOf('used') >= 0 && visitorIdFrom(req)) {
            res.writeHead(302, { Location: '/?bazaar=1' });
            return res.end();
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
        setBazaarCookie(res, v.id, v.name, v.picture);
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
    if (p === '/api/bazaar/demo' && req.method === 'POST') {
      const c = fbCfg();
      if (c.id && c.secret && c.redirect) return sendJSON(res, 200, { ok: false, error: 'Demo is off — use Facebook login.' });
      const b = await body(req);
      const name = cleanTxt(b.name || 'Guest') || 'Guest';
      const id = 'demo_' + crypto.createHash('sha1').update('bazaar:' + name.toLowerCase()).digest('hex').slice(0, 12);
      const v = getOrCreateVisitor(id, name, '');
      setBazaarCookie(res, v.id, v.name, v.picture);
      return sendJSON(res, 200, { ok: true, visitor: visitorView(v) });
    }
    if (p === '/api/bazaar/checkin' && req.method === 'POST') {
      const b = await body(req);
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Facebook login muna.' });
      const d = ensureVisitorDay(v);
      if (d.done.checkin) return sendJSON(res, 200, { ok: true, already: true, visitor: visitorView(v) });
      const r = markVisitorTask(v, 'checkin', 'checkin');
      log('🛒 ' + cleanTxt(v.name) + ' checked in (Day ' + d.date + ')', 'bazaar');
      return sendJSON(res, 200, { ok: true, result: r, visitor: visitorView(v) });
    }
    if (p === '/api/bazaar/task' && req.method === 'POST') {
      const b = await body(req);
      const id = visitorIdFrom(req), v = id && state.visitors[id];
      if (!v) return sendJSON(res, 200, { ok: false, error: 'Facebook login muna.' });
      const type = String(b.type || '');
      if (!BAZAAR_TASKS.some(t => t.id === type)) return sendJSON(res, 200, { ok: false, error: 'Unknown task' });
      const r = markVisitorTask(v, type, b.key);
      return sendJSON(res, 200, { ok: true, result: r, visitor: visitorView(v) });
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
      res.setHeader('Set-Cookie', 'bzref=' + sid + '; Path=/; SameSite=Lax; Max-Age=' + (30 * 86400));
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
      res.setHeader('Set-Cookie', 'bzref=' + sid + '; Path=/; SameSite=Lax; Max-Age=' + (30 * 86400));
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
      const real = String(readJSON(SETTINGS_FILE, {}).password || 'cyborg');
      if (String(b.pass || '') !== real) return sendJSON(res, 403, { ok: false, error: 'CEO password required.' });
      const cur = readJSON(SETTINGS_FILE, {});
      const id = String(b.fbAppId || '').trim();
      const secret = String(b.fbAppSecret || '').trim();
      const redirect = String(b.fbRedirectUri || '').trim();
      if (id) cur.fbAppId = id;
      if (secret) cur.fbAppSecret = secret;
      if (redirect) cur.fbRedirectUri = redirect;
      writeJSON(SETTINGS_FILE, cur);
      log('🔵 Facebook login credentials updated (server-side only)', 'CEO');
      return sendJSON(res, 200, {
        ok: true,
        configured: !!(cur.fbAppId && cur.fbAppSecret && cur.fbRedirectUri),
        redirect: cur.fbRedirectUri || ''
      });
    }
    // 🔌 CEO CONNECTIONS — status lang ang ipinapadala; secrets hindi lumalabas sa browser
    if (p === '/api/ceo/connections' && req.method === 'POST') {
      const cfg = readJSON(SETTINGS_FILE, {});
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
          url: 'https://seller.shopee.ph/edu/pwb/affiliate',
          hint: 'Affiliate ID / token + mga product link',
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
