/* Smoke test para sa Phase B + D. Patakbuhin: node tests/smoke.js  (hindi kailangan ng browser) */
var fs = require('fs'), vm = require('vm'), path = require('path');
function el() {
  var o = { style: {}, children: [], _l: {}, attrs: {}, innerHTML: '', textContent: '', parentNode: null,
    appendChild: function (c) { c.parentNode = o; o.children.push(c); return c; }, remove: function () { o.parentNode = null; },
    addEventListener: function (t, f) { o._l[t] = f; }, setAttribute: function (k, v) { o.attrs[k] = v; }, getAttribute: function (k) { return o.attrs[k]; },
    animate: function () { return {}; }, click: function () {}, closest: function () { return null; }, querySelector: function () { return el(); }, querySelectorAll: function () { return []; },
    classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } } };
  return o;
}
var store = {}, ls = { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
var body = el(), win = { _l: {} };
var doc = { body: body, head: el(), createElement: el, getElementById: function () { return null; }, addEventListener: function () {}, readyState: 'complete' };
var ctx = { window: win, document: doc, localStorage: ls, navigator: { hardwareConcurrency: 8 }, console: console, setTimeout: function () { return 0; }, clearTimeout: function () {}, setInterval: function () { return 0; }, Date: Date, Math: Math, atob: atob, btoa: btoa, TextEncoder: TextEncoder, TextDecoder: TextDecoder, JSON: JSON, innerWidth: 400, innerHeight: 800, location: { reload: function () {} }, matchMedia: function () { return { matches: false }; }, confirm: function () { return true; }, URL: URL, Blob: Blob, requestAnimationFrame: function () {}, Notification: undefined, AudioContext: undefined };
win.addEventListener = function () {}; win.localStorage = ls; win.document = doc; win.navigator = ctx.navigator; win.innerWidth = 400; win.matchMedia = ctx.matchMedia;
ctx.self = win; ctx.globalThis = ctx; vm.createContext(ctx);
var pub = path.join(__dirname, '..', 'public'), fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }
['phaseB.js', 'phaseD.js'].forEach(function (f) { try { vm.runInContext(fs.readFileSync(path.join(pub, f), 'utf8'), ctx, { filename: f }); } catch (e) { fails++; console.log('LOAD FAIL', f, e.message); } });
var D = win.CB_PHASE_D; ok(!!win.CB_PHASE_B, 'Phase B loaded'); ok(!!D, 'Phase D loaded');
if (D) {
  var st = D.selfTest(); ok(st.ok, 'selfTest ' + JSON.stringify(st.problems));
  var panel = body.children.filter(function (c) { return c._l.click && c.attrs['aria-label'] === 'Saya at Premyo'; })[0]; ok(!!panel, 'panel may click handler');
  var inputs = {};
  doc.getElementById = function (id) { return inputs[id] || null; };
  function click(a, v) { panel._l.click({ target: { closest: function () { return { getAttribute: function (k) { return k === 'data-a' ? a : k === 'data-v' ? v : null; } }; } } }); }
  (function f(l) { return l.reduce(function (a, c) { return a.concat([c], f(c.children || [])); }, []); })(body.children).filter(function (c) { return c.attrs['aria-label'] === 'Buksan ang Saya at Premyo'; })[0].onclick();
  ['g', 'f', 'p', 'u', 'a', 'l', 'x'].forEach(function (t) { click('tab', t); ok(panel.innerHTML.length > 50, 'tab ' + t + ' render'); });
  click('tab', 'g');
  ['rps', 'ttt', 'mr', 'sm', 'ty', 'hg', 'gu', 're', 'dif'].forEach(function (g) { click(g); click('gm'); });
  click('dif'); click('ttt'); for (var i = 0; i < 9; i++) click('tt', i); click('gm');
  click('gu'); inputs.cbGu = { value: '25' }; click('guo'); click('gm');
  click('re'); click('rec'); click('gm');
  click('hg'); 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (c) { click('hgl', c); });
  click('tab', 'p'); click('ln', 3); click('tab', 'l'); click('sub', 't'); click('supq', 0); inputs.cbSup = { value: 'xyz' }; click('sup'); click('sub', 'k'); for (var j = 0; j < 8; j++) click('cs', j);
  click('sub', 'b'); click('pl', 'posts'); click('pl', 'rank'); click('tab', 'a'); click('rh', 22); click('tab', 'x'); click('ex');
  var d = JSON.parse(store.cbPhaseDdata); console.log(JSON.stringify({voted:d.voted,poll:d.poll,cdone:d.cdone,course:d.course,unk:d.unk,rh:d.rh}));
  var bk = JSON.parse(store.cbBackupLast || '{}'); ok(!!bk.d && !!bk.b, 'auto-backup kasama ang Phase D');
  ok(typeof d.bot === 'object' && d.tips === undefined, 'bot cap data, walang tips');
  ok(d.errs.length === 0, 'walang error sa Log: ' + JSON.stringify(d.errs));
  ok(d.voted > -1 && d.poll.posts === 1 && !d.poll.rank, 'poll isang boto bawat araw');
  ok(d.cdone === 1, 'kurso: tapos (8 aralin)');
  ok(d.unk.length === 1, 'hindi nasagot na tanong na-save');
}
console.log(fails ? '\n' + fails + ' FAILED' : '\nLAHAT NG TEST AY PASADO'); process.exit(fails ? 1 : 0);
