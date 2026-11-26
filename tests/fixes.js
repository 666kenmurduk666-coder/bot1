/* Regression tests para sa mga ayos sa v4. Patakbuhin: node tests/fixes.js (walang browser, walang install).
   Gumagamit ng pekeng orasan at pekeng timer. Hindi ito pamalit sa pagsubok sa totoong cellphone. */
var fs = require('fs'), vm = require('vm'), path = require('path');
var pub = path.join(__dirname, '..', 'public'), fails = 0, passes = 0;
function ok(c, m) { if (c) { passes++; console.log('ok  :', m); } else { fails++; console.log('FAIL:', m); } }

function el() {
  var o = { style: {}, children: [], _l: {}, attrs: {}, innerHTML: '', textContent: '', parentNode: null,
    appendChild: function (c) { c.parentNode = o; o.children.push(c); return c; }, remove: function () { var p = o.parentNode; if (p && p.children) { var i = p.children.indexOf(o); if (i > -1) p.children.splice(i, 1); } o.parentNode = null; },
    addEventListener: function (t, f) { o._l[t] = f; }, setAttribute: function (k, v) { o.attrs[k] = v; }, getAttribute: function (k) { return o.attrs[k]; },
    animate: function () { return {}; }, click: function () {}, querySelector: function () { return el(); }, querySelectorAll: function () { return []; } };
  return o;
}

function makeEnv(seed) {
  var store = {}; seed = seed || {}; for (var k in seed) store[k] = seed[k];
  var ls = { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
  var clock = { now: Date.UTC(2026, 10, 19, 12, 0, 0) }, rnd = { v: null }, tid = 0, timers = [], inputs = {}, reloads = { n: 0 };
  function FD() { if (arguments.length === 0) return new Date(clock.now); return new (Function.prototype.bind.apply(Date, [null].concat([].slice.call(arguments))))(); }
  FD.now = function () { return clock.now; }; FD.UTC = Date.UTC; FD.parse = Date.parse; FD.prototype = Date.prototype;
  var M = Object.create(Math); M.random = function () { return rnd.v == null ? Math.random() : rnd.v; };
  var body = el(), win = { _l: {} };
  var doc = { body: body, head: el(), createElement: el, getElementById: function (id) { return inputs[id] || null; }, addEventListener: function () {}, readyState: 'complete', hidden: false };
  var ctx = { window: win, document: doc, localStorage: ls, navigator: { hardwareConcurrency: 8 }, console: console, Date: FD, Math: M, JSON: JSON,
    atob: atob, btoa: btoa, TextEncoder: TextEncoder, TextDecoder: TextDecoder, innerWidth: 400, innerHeight: 800, location: { reload: function () { reloads.n++; } },
    matchMedia: function () { return { matches: false }; }, confirm: function () { return true; }, URL: URL, Blob: Blob, requestAnimationFrame: function () {}, Notification: undefined, AudioContext: undefined,
    setTimeout: function (fn, ms) { timers.push({ id: ++tid, fn: fn, iv: false }); return tid; }, setInterval: function (fn, ms) { timers.push({ id: ++tid, fn: fn, iv: true }); return tid; },
    clearTimeout: function (id) { timers.forEach(function (t) { if (t.id === id) t.dead = true; }); }, clearInterval: function (id) { timers.forEach(function (t) { if (t.id === id) t.dead = true; }); } };
  win.addEventListener = function () {}; win.localStorage = ls; win.document = doc; win.navigator = ctx.navigator; win.innerWidth = 400; win.matchMedia = ctx.matchMedia;
  ctx.self = win; ctx.globalThis = ctx; vm.createContext(ctx);
  ['phaseB.js', 'phaseC.js', 'phaseD.js'].forEach(function (f) { try { vm.runInContext(fs.readFileSync(path.join(pub, f), 'utf8'), ctx, { filename: f }); } catch (e) { fails++; console.log('LOAD FAIL', f, e.message); } });
  var panels = body.children.filter(function (c) { return c._l.click; });
  var dock = body.children.filter(function (c) { return /z-index:62/.test(c.style.cssText || ''); })[0];
  function click(p, a, v) { p._l.click({ target: { closest: function () { return { getAttribute: function (k) { return k === 'data-a' ? a : k === 'data-v' ? v : null; } }; } } }); }
  function flush() { var g = 0; while (timers.length && g++ < 2000) { var t = timers.shift(); if (!t.dead && !t.iv) { try { t.fn(); } catch (e) { console.log('timer err', e.message); } } } }
  function toastsOnScreen() { var box = body.children.filter(function (c) { return /z-index:90/.test(c.style.cssText || ''); })[0]; return box ? box.children.filter(function (c) { return c.parentNode === box; }) : []; }
  inputs.cbDG = { innerHTML: '' };
  return { store: store, clock: clock, rnd: rnd, inputs: inputs, reloads: reloads, body: body, panels: panels, bp: panels[0], cp: panels[1], dp: panels[2], dock: dock,
    B: win.CB_PHASE_B, C: win.CB_PHASE_C, D: win.CB_PHASE_D, click: click, flush: flush, toasts: toastsOnScreen, S: function () { return win.CB_PHASE_B.api.S(); } };
}

/* ---- 1. Bato-Bato-Pik: lahat ng 9 na kombinasyon ---- */
(function () {
  var e = makeEnv(), R = e.D.rpsResult, exp = { '0,0': 'tie', '0,1': 'lose', '0,2': 'win', '1,0': 'win', '1,1': 'tie', '1,2': 'lose', '2,0': 'lose', '2,1': 'win', '2,2': 'tie' };
  for (var m = 0; m < 3; m++) for (var b = 0; b < 3; b++) ok(R(m, b) === exp[m + ',' + b], 'RPS ' + ['bato', 'papel', 'gunting'][m] + ' vs ' + ['bato', 'papel', 'gunting'][b] + ' = ' + exp[m + ',' + b]);
})();

/* ---- 2. Typing ---- */
(function () {
  var e = makeEnv(), T = e.D.typeAcc, p = 'mabilis ang daliri ko';
  ok(T(p, 'Mabilis ang daliri ko') === 1, 'Typing: hindi mahalaga ang laki ng letra (auto-capitalize)');
  ok(T(p, ' mabilis  ang daliri ko ') === 1, 'Typing: hindi pinapansin ang dagdag na espasyo');
  ok(T(p, 'xmabilis ang daliri ko') > .9, 'Typing: isang dagdag na letra sa simula ay hindi sumisira sa lahat');
  ok(T(p, '') === 0, 'Typing: walang tinype = 0%');
  ok(T(p, 'zzzzzzzz') < .5, 'Typing: basura = mababa');
  e.rnd.v = 0; e.click(e.dp, 'ty'); e.inputs.cbTy = { value: 'Mabilis ang daliri ko' };
  var c0 = e.S().coins; e.click(e.dp, 'tyo'); ok(e.S().coins > c0, 'Typing: tamang type ay may coins');
  e.click(e.dp, 'ty'); e.inputs.cbTy = { value: '' }; c0 = e.S().coins; e.click(e.dp, 'tyo'); ok(e.S().coins === c0, 'Typing: walang tinype = walang coins');
})();

/* ---- 3. Hulaan: labas sa 1-50 ---- */
(function () {
  var e = makeEnv(); e.rnd.v = 0; e.click(e.dp, 'gu');
  e.inputs.cbGu = { value: '999' }; e.click(e.dp, 'guo');
  ok(/Natitira: 6/.test(e.inputs.cbDG.innerHTML) && /1 hanggang 50/.test(e.inputs.cbDG.innerHTML), 'Hulaan: 999 ay tinanggihan at hindi binilang');
  e.inputs.cbGu = { value: '0' }; e.click(e.dp, 'guo'); ok(/Natitira: 6/.test(e.inputs.cbDG.innerHTML), 'Hulaan: 0 ay tinanggihan');
  var c0 = e.S().coins, dp0 = e.S().dp; e.inputs.cbGu = { value: '1' }; e.click(e.dp, 'guo');
  ok(e.S().coins > c0 && e.S().dp === dp0 + 1, 'Hulaan: tamang hula ay may coins at binilang');
})();

/* ---- 4. Shared limit (B+D) at XP cap ---- */
(function () {
  var e = makeEnv(); e.rnd.v = 0; e.S().dp = 10; var c0 = e.S().coins, x0 = e.S().xp;
  e.click(e.dp, 'gu'); e.inputs.cbGu = { value: '1' }; e.click(e.dp, 'guo');
  ok(e.S().coins === c0, 'Limit: pagkatapos ng 10 laro, walang coins'); ok(e.S().xp === x0, 'Limit: pagkatapos ng 10 laro, walang XP (hindi na pwedeng i-spam)'); ok(e.S().dp === 11, 'Limit: bilang ay iisa para sa B at D');
})();

/* ---- 5. Simon ---- */
(function () {
  var e = makeEnv({ cbPhaseBdata: JSON.stringify({ intro: 1 }) }); e.rnd.v = 0; e.click(e.dp, 'sm'); e.flush();
  var dp0 = e.S().dp; e.click(e.dp, 'smb', '1');
  ok(/Hindi ito binilang/.test(e.inputs.cbDG.innerHTML) && e.S().dp === dp0, 'Simon: mali sa Level 1 ay hindi binibilang');
  e.click(e.dp, 'sm'); e.flush(); e.click(e.dp, 'smb', '0');
  ok(/background:#5b3df0/.test(e.inputs.cbDG.innerHTML), 'Simon: umiilaw ang button na pinindot mo');
})();

/* ---- 6. Spin: hindi nawawala ang premyo ---- */
(function () {
  var e = makeEnv(); e.rnd.v = 0; var S = e.S(), n = e.B.api.dayNum();
  e.click(e.bp, 'tab', 's'); var c0 = S.coins; e.click(e.bp, 'spin');
  ok(S.coins > c0 && S.spin === n && S.spins === 1, 'Spin: ibinibigay ang coins at nase-save agad (bago matapos ang animation)');
  var c1 = S.coins; e.click(e.bp, 'x');
  ok(e.bp.style.display === 'none' && S.coins === c1 && S.spin === n, 'Spin: isinara ang panel sa gitna, nandoon pa rin ang premyo');
  ok(e.toasts().some(function (t) { return /Nanalo ka/.test(t.textContent); }), 'Spin: lumalabas pa rin ang toast ng premyo');
  e.flush(); ok(S.coins === c1, 'Spin: hindi dumodoble ang coins pagkatapos ng timers');
  e.click(e.bp, 'spin'); ok(S.coins === c1, 'Spin: isang beses lang bawat araw');
  ok(JSON.parse(e.store.cbPhaseBdata).spin === n, 'Spin: naka-save sa localStorage');
})();

/* ---- 7. Lampas hatinggabi ---- */
(function () {
  var e = makeEnv(), S = e.S(), B = e.B.api; var d0 = S.days, s0 = S.streak;
  S.dp = 7; S.qc.login = 1; S.claimed = B.dayNum(); S.wdays = 3;
  e.clock.now += 24 * 3600 * 1000; var rolled = B.checkin();
  ok(rolled === true, 'Hatinggabi: nakilala ang bagong araw nang walang reload');
  ok(S.streak === s0 + 1 && S.days === d0 + 1, 'Hatinggabi: tumaas ang streak (' + s0 + ' -> ' + S.streak + ') at araw (' + d0 + ' -> ' + S.days + ')');
  ok(S.q.login === 1 && !S.qc.login, 'Hatinggabi: puwedeng kunin ulit ang quest na "Pumasok ngayon"');
  ok(S.dp === 0, 'Hatinggabi: na-reset ang limit ng laro'); ok(S.claimed !== B.dayNum(), 'Hatinggabi: puwedeng kunin ang daily reward ngayon');
  ok(e.toasts().some(function (t) { return /Bagong araw/.test(t.textContent); }), 'Hatinggabi: may toast na "Bagong araw"');
  ok(B.checkin() === false, 'Hatinggabi: hindi dumodoble kapag tinawag ulit');
  e.clock.now += 3 * 24 * 3600 * 1000; B.checkin(); ok(S.streak === 1, 'Hatinggabi: nawawala ang streak kapag lumagpas ng 2 araw');
})();

/* ---- 8. Toast: hindi nagpapatong-patong ---- */
(function () {
  var e = makeEnv(), B = e.B.api; e.flush();
  B.toast('isa'); B.toast('dalawa'); B.toast('tatlo'); var t = e.toasts();
  ok(t.length <= 3 && t.length >= 2, 'Toast: nakasalansan sa iisang container (' + t.length + ' sa screen)');
  ok(t.every(function (x, i) { return t.indexOf(x) === i; }), 'Toast: magkakaibang element, hindi iisang posisyon');
  B.toast('apat'); ok(e.toasts().length <= 3, 'Toast: hindi lalampas sa 3 sa screen');
  var e2 = makeEnv(); e2.B.api.toast('+2 coins'); e2.B.api.toast('+2 coins'); e2.B.api.toast('+2 coins');
  var m = e2.toasts().filter(function (x) { return /\+2 coins/.test(x.textContent); });
  ok(m.length === 1 && /\u00D73/.test(m[0].textContent), 'Toast: pinagsasama ang magkakaparehong toast (×3)');
})();

/* ---- 9. Panel manager at dock ---- */
(function () {
  var e = makeEnv(), pills = e.dock ? e.dock.children.filter(function (c) { return (c.className || '').indexOf('cb-tog') < 0; }) : [];
  ok(e.dock && pills.length === 3 && e.dock.children.length === 4, 'Dock: iisang container: tatlong pill + menu button (' + (e.dock ? e.dock.children.length : 0) + ')');
  ok(e.dock.children.every(function (c) { return !/position:fixed/.test(c.style.cssText); }), 'Dock: walang nakapirming pixel na top sa bawat pill');
  pills[0].onclick(); ok(e.bp.style.display === 'block', 'Panel B bukas');
  pills[1].onclick(); ok(e.bp.style.display === 'none' && e.cp.style.display === 'block', 'Nagbukas ang C, nagsara ang B');
  pills[2].onclick(); ok(e.cp.style.display === 'none' && e.dp.style.display === 'block', 'Nagbukas ang D, nagsara ang C');
})();

/* ---- 10. HTML injection ---- */
(function () {
  var X = '<img src=x onerror=alert(1)>', Q = '"><script>alert(1)</script>';
  var seed = {
    cbPhaseBdata: JSON.stringify({ avatar: X, coins: '<script>alert(2)</script>', tint: Q, wave: X, own: { 'a:<b>': 1 }, badges: { '<i>': 1 }, log: [[1, X]], xp: X }),
    cbPhaseCdata: JSON.stringify({ bots: [{ n: X, lv: 1, en: 100 }, { n: 'Pixel', lv: '<b>', en: Q }], bd: Q, floors: X }),
    cbPhaseDdata: JSON.stringify({ goal: Q, hs: { mr: '<b>x', sm: X }, lastF: X, unk: [X], errs: [[1, X]], poll: { '<x>': 5, posts: X }, stk: { '<x>': 1 }, rh: X })
  };
  var e = makeEnv(seed), bad = /<img|<script/, hits = [];
  function scan(p, name) { if (bad.test(p.innerHTML)) hits.push(name); }
  'dqsghorb'.split('').forEach(function (t) { e.click(e.bp, 'tab', t); scan(e.bp, 'B:' + t); });
  'bsxhg'.split('').forEach(function (t) { e.click(e.cp, 'tab', t); scan(e.cp, 'C:' + t); });
  'gfpualx'.split('').forEach(function (t) { e.click(e.dp, 'tab', t); scan(e.dp, 'D:' + t); });
  e.click(e.dp, 'tab', 'l'); ['d', 'k', 't', 'b'].forEach(function (t) { e.click(e.dp, 'sub', t); scan(e.dp, 'D:l/' + t); });
  ok(!hits.length, 'XSS: walang hindi-na-escape na payload sa B, C, D (' + (hits.join(',') || 'wala') + ')');
  var S = e.S(); ok(S.tint === 'none' && S.wave === undefined && S.avatar === '\uD83E\uDD16', 'XSS: tint, wave at avatar ay binalik sa ligtas na halaga');
  ok(typeof S.xp === 'number' && isFinite(S.xp) && typeof S.coins === 'number', 'XSS: numeric na ang coins at XP');
  e.click(e.dp, 'tab', 'x'); ok(/&lt;img/.test(e.dp.innerHTML) && !/<img/.test(e.dp.innerHTML), 'XSS: nakikita bilang teksto lang ang payload sa Log');
  var cd = JSON.parse(e.store.cbPhaseCdata || '{}'); e.click(e.cp, 'tab', 'b'); ok(/Cheebee/.test(e.cp.innerHTML) && /Pixel/.test(e.cp.innerHTML), 'XSS: bot na may malisyosong pangalan ay napalitan ng ligtas na pangalan');
})();

/* ---- 11. Backup code: kasama ang D, round trip, validation ---- */
(function () {
  var e = makeEnv(); e.click(e.dp, 'tab', 'f'); e.click(e.dp, 'ck'); /* may data sa D (sticker/cookie) */
  e.click(e.cp, 'tab', 'g'); e.click(e.cp, 'exp');
  var m = /<textarea[^>]*>([^<]*)<\/textarea>/.exec(e.cp.innerHTML), code = m && m[1];
  ok(!!code && code.length > 20, 'Backup: nakagawa ng code');
  var o = JSON.parse(Buffer.from(code, 'base64').toString('utf8'));
  ok(o.v === 3 && !!o.b && !!o.c && !!o.d && !!o.h, 'Backup: kasama na ang data ng Phase D at checksum');
  var snap = { b: e.store.cbPhaseBdata, c: e.store.cbPhaseCdata, d: e.store.cbPhaseDdata };
  e.store.cbPhaseBdata = '{"coins":1}'; e.store.cbPhaseDdata = '{"goal":5}';
  e.inputs.cbBk = { value: code }; var r0 = e.reloads.n; e.click(e.cp, 'imp');
  ok(e.reloads.n === r0 + 1 && e.store.cbPhaseBdata === snap.b && e.store.cbPhaseDdata === snap.d, 'Backup: round trip, naibalik ang B at D');
  ok(!!e.store.cbUndo, 'Backup: may undo na naka-save bago mag-restore');
  var before = JSON.stringify(e.store), r1 = e.reloads.n;
  ['!!!hindi base64', Buffer.from('hello').toString('base64'), Buffer.from('[1,2]').toString('base64'), Buffer.from(JSON.stringify({ b: '[1]' })).toString('base64'), Buffer.from(JSON.stringify({ v: 3, b: '{"coins":999999}', h: 'deadbeef' })).toString('base64'), ''].forEach(function (bad, i) {
    e.inputs.cbBk = { value: bad }; e.click(e.cp, 'imp');
  });
  ok(e.reloads.n === r1, 'Backup: sirang code ay hindi nag-reload o nag-apply');
  var after = JSON.parse(JSON.stringify(e.store)); var b2 = JSON.parse(before); ok(after.cbPhaseBdata === b2.cbPhaseBdata && after.cbPhaseDdata === b2.cbPhaseDdata, 'Backup: hindi na-overwrite ang progress ng sirang code');
})();

/* ---- 12. Birthday ---- */
(function () {
  var e = makeEnv(); function bd() { return JSON.parse(e.store.cbPhaseCdata).bd; }
  e.click(e.cp, 'tab', 'g'); e.inputs.cbBd = { value: '13-45' }; e.click(e.cp, 'bd'); ok(bd() === '', 'Birthday: 13-45 ay tinanggihan');
  e.inputs.cbBd = { value: '02-30' }; e.click(e.cp, 'bd'); ok(bd() === '', 'Birthday: 02-30 ay tinanggihan');
  e.inputs.cbBd = { value: '03-25' }; e.click(e.cp, 'bd'); ok(bd() === '03-25', 'Birthday: 03-25 ay tinanggap');
  e.inputs.cbBd = { value: '11-19' }; e.click(e.cp, 'bd'); ok(bd() === '03-25', 'Birthday: isang beses lang puwedeng baguhin kada taon');
  var e2 = makeEnv(); e2.click(e2.cp, 'tab', 'g'); e2.inputs.cbBd = { value: '11-19' }; e2.click(e2.cp, 'bd');
  var c = JSON.parse(e2.store.cbPhaseCdata); ok(c.bdy === 2026, 'Birthday: kung ngayon mo itinakda, walang bonus ngayong taon');
})();

console.log('\n' + passes + ' pasado, ' + fails + ' bagsak');
process.exit(fails ? 1 : 0);
