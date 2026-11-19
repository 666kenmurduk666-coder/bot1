/* Test ng layout polish (v6). Patakbuhin: node tests/layout.js. Pekeng DOM lang ito, hindi pamalit sa totoong cellphone. */
var fs = require('fs'), vm = require('vm'), path = require('path'), pub = path.join(__dirname, '..', 'public'), fails = 0, passes = 0;
function ok(c, m) { if (c) { passes++; console.log('ok  :', m); } else { fails++; console.log('FAIL:', m); } }
function node(tag) {
  var n = { tagName: (tag || 'div').toUpperCase(), style: {}, children: [], attrs: {}, className: '', innerHTML: '', textContent: '', parentNode: null, scrollTop: 0, _l: {}, focused: 0,
    appendChild: function (c) { c.parentNode = n; n.children.push(c); return c; }, remove: function () { var p = n.parentNode; if (p) { var i = p.children.indexOf(n); if (i > -1) p.children.splice(i, 1); } },
    setAttribute: function (k, v) { n.attrs[k] = v; }, getAttribute: function (k) { return k in n.attrs ? n.attrs[k] : null; }, addEventListener: function (t, f) { n._l[t] = f; },
    focus: function () { n.focused++; doc.activeElement = n; }, contains: function (x) { while (x) { if (x === n) return true; x = x.parentNode; } return false; },
    querySelectorAll: function (sel) { var out = [], cls = /^\.([\w-]+)$/.exec(sel); (function w(p) { p.children.forEach(function (c) { if (cls ? (' ' + c.className + ' ').indexOf(' ' + cls[1] + ' ') > -1 : /button|input/.test(sel) && c.tagName === 'BUTTON') out.push(c); w(c); }); })(n); return out; } };
  return n;
}
var store = {}, MOs = [], doc, win = {}, setProps = {};
var body = node('body'); doc = { body: body, head: node('head'), createElement: node, getElementById: function () { return null; }, addEventListener: function (t, f) { var a = (doc['$' + t] = doc['$' + t] || []); a.push(f); doc['_' + t] = function (e) { a.forEach(function (g) { g(e); }); }; }, readyState: 'complete', hidden: false, activeElement: null, querySelectorAll: function (s) { return body.querySelectorAll(s); }, documentElement: { style: { setProperty: function (k, v) { setProps[k] = v; } } } };
function MO(cb) { this.cb = cb; MOs.push(this); } MO.prototype.observe = function () {};
var vvl = {}; win.visualViewport = { height: 500, offsetTop: 0, addEventListener: function (t, f) { vvl[t] = f; } };
var ctx = { window: win, document: doc, localStorage: { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } },
  navigator: { hardwareConcurrency: 8 }, console: console, JSON: JSON, Math: Math, Date: Date, atob: atob, btoa: btoa, TextEncoder: TextEncoder, TextDecoder: TextDecoder, innerWidth: 400, innerHeight: 800,
  location: { reload: function () {} }, matchMedia: function () { return { matches: false }; }, confirm: function () { return true; }, URL: URL, Blob: Blob, requestAnimationFrame: function () {}, setTimeout: function () { return 1; }, setInterval: function () { return 1; }, clearTimeout: function () {}, clearInterval: function () {}, MutationObserver: MO };
win.addEventListener = function () {}; win.localStorage = ctx.localStorage; win.document = doc; win.navigator = ctx.navigator; win.innerWidth = 400; win.matchMedia = ctx.matchMedia; ctx.self = win; ctx.globalThis = ctx; vm.createContext(ctx);
['phaseB.js', 'phaseC.js', 'phaseD.js'].forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(pub, f), 'utf8'), ctx, { filename: f }); });
function ob() { MOs.forEach(function (m) { m.cb(); }); }
var dock = body.children.filter(function (c) { return /cb-dock/.test(c.className); })[0], panels = [], q = body.querySelectorAll('.cb-panel');
var tog = dock.children.filter(function (c) { return /cb-tog/.test(c.className); })[0], more = dock.children.filter(function (c) { return /cb-more/.test(c.className); });
var pills = dock.children.filter(function (c) { return /cb-pill/.test(c.className); }), bd = body.children.filter(function (c) { return /cb-bd/.test(c.className); })[0];

ok(doc.head.children.some(function (c) { return /@media \(max-width:600px\)\{\.cb-panel/.test(c.textContent); }), 'CSS naka-inject (may bottom sheet para sa phone)');
ok(q.length === 3, 'Tatlong panel ang may class cb-panel (' + q.length + ')');
ok(pills.length === 3 && !!tog, 'Tatlong pill at isang menu button');
ob(); more = dock.children.filter(function (c) { return /cb-more/.test(c.className); });
ok(more.length === 2 && !/cb-main/.test(more[0].className), 'Boss at Saya ay cb-more, Lv ang main');
ok(/cb-col/.test(dock.className), 'Sa makitid na screen (400px), collapsed ang dock sa umpisa');
ok(tog.innerHTML.indexOf('\u2630') === 0 && tog.getAttribute('aria-expanded') === 'false', 'Toggle: ☰ at aria-expanded=false');
tog.onclick(); ok(!/cb-col/.test(dock.className) && store.cbDockCol === '0' && tog.innerHTML.indexOf('\u2715') === 0, 'Toggle: bumukas, naka-save ang pinili');
tog.onclick(); ok(/cb-col/.test(dock.className) && store.cbDockCol === '1', 'Toggle: sumara ulit');
more[0].innerHTML = '\uD83C\uDF1F Boss <span>\u25CF</span>'; ob(); tog.onclick(); tog.onclick();
ok(tog.innerHTML.indexOf('cb-dot') > -1, 'May pulang tuldok sa ☰ kapag may bagong nakatago sa Boss/Saya');

var P = q[0]; ok(bd.style.display === 'none', 'Backdrop nakatago kapag walang bukas na panel');
pills[0].onclick(); ob();
ok(bd.style.display === 'block', 'Backdrop lumabas kapag may bukas na panel');
ok(P.getAttribute('role') === 'dialog' && P.getAttribute('aria-modal') === 'true', 'Panel may role=dialog at aria-modal');
ok(P.focused >= 1, 'Na-focus ang panel pagbukas');
bd.onclick(); ob(); ok(P.style.display === 'none' && bd.style.display === 'none', 'Pindot sa backdrop ay nagsasara ng panel');

pills[0].onclick(); ob(); P.scrollTop = 0;
doc._touchstart({ target: P, touches: [{ clientY: 100 }] }); doc._touchend({ changedTouches: [{ clientY: 230 }] }); ob();
ok(P.style.display === 'none', 'Swipe pababa (130px) ay nagsasara ng sheet');
pills[0].onclick(); ob(); doc._touchstart({ target: P, touches: [{ clientY: 100 }] }); doc._touchend({ changedTouches: [{ clientY: 140 }] }); ob();
ok(P.style.display === 'block', 'Maikling swipe (40px) ay hindi nagsasara');
doc._touchstart({ target: P, touches: [{ clientY: 100 }] }); P.scrollTop = 50; doc._touchend({ changedTouches: [{ clientY: 100 }] });
P.style.display = 'none'; ob();

ok(setProps['--cb-vh'] === '500px' && setProps['--cb-kb'] === '300px', 'Keyboard: --cb-vh=500px, --cb-kb=300px (800 - 500)');
win.visualViewport.height = 800; vvl.resize(); ok(setProps['--cb-kb'] === '0px', 'Keyboard: kb=0 kapag nawala');

pills[0].onclick(); ob(); var btns = [node('button'), node('button')]; btns.forEach(function (b) { P.appendChild(b); });
var prevented = 0; doc.activeElement = btns[1]; doc._keydown({ key: 'Tab', shiftKey: false, preventDefault: function () { prevented++; } });
ok(prevented === 1 && btns[0].focused >= 1, 'Tab sa huling button ay bumabalik sa una (focus trap)');
doc.activeElement = btns[0]; doc._keydown({ key: 'Tab', shiftKey: true, preventDefault: function () { prevented++; } });
ok(prevented === 2 && btns[1].focused >= 1, 'Shift+Tab sa una ay pupunta sa huli');
var outside = node('div'); body.appendChild(outside); doc.activeElement = outside; P.style.display = 'none'; ob();
console.log('\n' + passes + ' pasado, ' + fails + ' bagsak'); process.exit(fails ? 1 : 0);
