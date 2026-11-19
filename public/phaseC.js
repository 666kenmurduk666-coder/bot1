/* Cyborg Cheebee AI Office - Phase C add-on (kailangan ang Phase B)
   Tycoon na Opisina Boss, idle income, story quests, piggy bank, season pass, shop, backup.
   Lahat ay nasa browser lang. Para patayin: CB_PHASE_C.off() o REMOVE-PHASE-C.bat */
(function () {
  'use strict';
  try { if (localStorage.getItem('cbPhaseC') === 'off') return; } catch (e) {}
  var B = window.CB_PHASE_B && window.CB_PHASE_B.api;
  if (!B || window.CB_PHASE_C) return;
  var K = 'cbPhaseCdata', C = {}, $ = function (i) { return document.getElementById(i); };
  var NAMES = ['Cheebee', 'Pixel', 'Turbo', 'Nova', 'Sparky', 'Byte', 'Rusty', 'Zippy', 'Chip', 'Bolt', 'Gizmo', 'Echo'];
  function load() {
    try { C = JSON.parse(localStorage.getItem(K) || 'null') || {}; } catch (e) { C = {}; }
    var d = { bots: [{ n: 'Cheebee', lv: 1, en: 100 }, { n: 'Pixel', lv: 1, en: 100 }, { n: 'Turbo', lv: 1, en: 100 }], floors: 1, pend: 0, tick: Date.now(), seen: Date.now(),
      broken: 0, ot: 0, pig: 0, drop: 0, scr: -1, pd: -1, pc: 0, max: 0, ms: {}, prof: [], ch: 0, ann: {}, pass: 0, bd: '', bdy: -1, bdc: -1, e0d: -1, e0: 0 };
    if (!C || typeof C !== 'object' || Array.isArray(C)) C = {};
    for (var k in d) if (C[k] === undefined) C[k] = d[k];
    sanitize(d);
  }
  var BN = /^[A-Za-z0-9 _\-]{1,12}$/;
  function num(x, d) { x = Number(x); return isFinite(x) ? x : d; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function validBd(v) { if (!/^\d\d-\d\d$/.test(v)) return false; var m = +v.slice(0, 2), dd = +v.slice(3, 5); return m >= 1 && m <= 12 && dd >= 1 && dd <= [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function keysOf(src, ok) { var o = {}; if (src && typeof src === 'object') for (var i = 0; i < ok.length; i++) if (src[ok[i]]) o[ok[i]] = 1; return o; }
  function sanitize(d) {
    var k;
    for (k in C) if (!(k in d)) delete C[k];
    for (k in d) if (typeof d[k] === 'number') C[k] = num(C[k], d[k]);
    C.floors = clamp(Math.round(C.floors), 1, 3); C.pend = clamp(C.pend, 0, 1e6); C.pig = clamp(C.pig, 0, 1e9); C.ch = clamp(Math.round(C.ch), 0, 99);
    C.pass = clamp(Math.round(C.pass), 0, 30); C.pc = Math.max(0, C.pc); C.max = Math.max(0, C.max);
    C.broken = C.broken ? 1 : 0; C.ot = C.ot ? 1 : 0;
    if (!Array.isArray(C.bots) || !C.bots.length) C.bots = d.bots;
    C.bots = C.bots.slice(0, 9).map(function (b, i) { b = b && typeof b === 'object' ? b : {}; return { n: (typeof b.n === 'string' && BN.test(b.n)) ? b.n : NAMES[i % NAMES.length], lv: clamp(Math.round(num(b.lv, 1)), 1, 10), en: clamp(num(b.en, 100), 0, 100) }; });
    if (typeof C.bd !== 'string' || !validBd(C.bd)) C.bd = '';
    C.ms = keysOf(C.ms, ['25', '50', '100']); C.ann = keysOf(C.ann, ['7', '30', '100']);
    C.prof = (Array.isArray(C.prof) ? C.prof : []).filter(function (r) { return r && typeof r === 'object'; }).slice(-7).map(function (r) { return { d: num(r.d, 0), v: Math.max(0, num(r.v, 0)) }; });
  }
  function save() { try { localStorage.setItem(K, JSON.stringify(C)); } catch (e) {} }
  load();
  var S = B.S(), esc = B.esc;
  function dn() { return B.dayNum(); }

  /* ---------- tycoon ---------- */
  function rate(b) { return b.lv * (b.en > 20 ? 1 : .4) * (C.ot ? 1.5 : 1) * (C.broken ? .5 : 1); }
  function total() { var t = 0; for (var i = 0; i < C.bots.length; i++) t += rate(C.bots[i]); return t; }
  function dayCheck() {
    var n = dn();
    if (C.pd !== n) { C.pd = n; C.pc = 0; C.ms = {}; }
    if (C.e0d !== n) { C.e0d = n; C.e0 = S.earn; }
  }
  function tick() {
    dayCheck();
    var t = Date.now(), h = Math.min(8, (t - C.tick) / 36e5), i, b;
    if (h > 0.0003) {
      var p = 0;
      for (i = 0; i < C.bots.length; i++) { b = C.bots[i]; p += rate(b) * h; b.en = Math.max(0, b.en - (C.ot ? 10 : 4) * h); }
      C.pend = Math.min(C.pend + p, Math.max(total(), 1) * 8);
      if (!C.broken && h >= 1 && Math.random() < .25 * Math.min(h, 3)) C.broken = 1;
    }
    C.tick = t; C.seen = t; save();
  }
  function stars() { return Math.min(5, 1 + Math.floor((B.olv() + C.bots.length) / 4)); }
  function rank(l) { return l < 3 ? 'Junior' : l < 5 ? 'Senior' : l < 8 ? 'Manager' : l < 10 ? 'Director' : 'CEO'; }
  function upCost(l) { return Math.round(40 * Math.pow(l, 1.6)); }
  function spend(n) { if (S.coins < n) { B.beep(180, .2, 'square'); B.toast('Kulang ang coins 🪙'); return false; } S.coins -= n; return true; }
  function collect() {
    tick(); var n = Math.floor(C.pend);
    if (n < 1) return B.toast('Wala pang naipon, hintayin ang mga bot');
    C.pend -= n; var g = B.addCoins(n); C.pig += Math.round(g * .1); C.pc += n; C.max = Math.max(C.max, C.pc); S.work++;
    var d = dn(), last = C.prof[C.prof.length - 1];
    if (last && last.d === d) last.v += g; else { C.prof.push({ d: d, v: g }); if (C.prof.length > 7) C.prof.shift(); }
    [25, 50, 100].forEach(function (m) { if (C.pc >= m && !C.ms[m]) { C.ms[m] = 1; B.confetti(); B.jingle(); B.toast('🚀 ' + m + ' posts na ngayong araw!'); } });
    B.addXP(Math.ceil(n / 10)); B.toast('+' + g + ' 🪙 mula sa ' + n + ' posts'); B.commit(); save(); render();
  }

  /* ---------- datos ---------- */
  var CH = [['Kunin ang daily reward', function () { return S.claimed > -1; }, 50], ['Maglaro ng 3 mini-game', function () { return S.played >= 3; }, 80],
    ['Mag-spin ng 3 beses', function () { return S.spins >= 3; }, 100], ['Umabot sa Office Lv 3', function () { return B.olv() >= 3; }, 150],
    ['Pumasok ng 7 araw', function () { return S.days >= 7; }, 300], ['100 posts sa isang araw', function () { return C.max >= 100; }, 500]];
  var ANN = [[7, 150], [30, 600], [100, 2000]];
  var SH = [['❄️ Streak Freeze (iligtas ang streak ng 1 araw)', 80], ['🍀 Lucky Charm (+10% coins, 1 oras)', 60], ['🍱 Super Lunch (puno ang energy ng lahat)', 40]];
  var TIPS = ['I-upgrade ang mesa ng bot para dumami ang posts!', 'Pahingahin ang bots kapag pagod, bumabagal sila.', 'Tuwing Linggo mo lang mababasag ang Piggy Bank.',
    'Happy Hour ay 12-1 NN at 7-9 NG, doble ang coins!', 'Ayusin agad ang sirang makina para hindi bumagal.', 'Overtime = mas mabilis pero mas mabilis mapagod.', 'Kolektahin ang Coin Drop kada oras!'];
  var BTN = 'background:#5b3df0;color:#fff;border:0;border-radius:10px;padding:8px 12px;font:700 14px system-ui;cursor:pointer;margin:3px 2px';
  var BTN2 = BTN.replace('#5b3df0', '#3a3170'), ROW = 'display:flex;justify-content:space-between;align-items:center;background:#241c52;border-radius:10px;padding:6px 10px;margin:5px 0';
  var TABS = [['b', '🏢', 'Boss'], ['s', '📖', 'Story'], ['x', '🎟️', 'Bonus'], ['h', '🛒', 'Shop'], ['g', '⚙️', 'Setting']];
  var cur = 'b', tmp = '';

  /* ---------- UI ---------- */
  var hudEl = document.createElement('div'); hudEl.className = 'cb-pill';
  hudEl.style.cssText = 'background:#2a1f55;color:#fff;border:2px solid #a78bff;border-radius:20px;padding:6px 10px;min-height:44px;box-sizing:border-box;display:flex;align-items:center;font:700 13px system-ui;cursor:pointer;box-shadow:0 2px 12px #0008;user-select:none';
  function hud() { hudEl.innerHTML = '🌟 Boss' + ((C.pend >= 10 || Date.now() - C.drop >= 36e5) ? ' <span style="color:#ff5c7a">●</span>' : ''); }
  var panel = document.createElement('div'); panel.className = 'cb-panel';
  panel.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(94vw,430px);max-height:82vh;max-height:82dvh;overflow:auto;overscroll-behavior:contain;background:#17123a;color:#fff;border:2px solid #a78bff;border-radius:16px;padding:12px;z-index:81;display:none;font:14px system-ui;box-shadow:0 10px 40px #000a';
  hudEl.onclick = function () { if (B.checkin) B.checkin(); if (B.claim) B.claim('C'); tick(); panel.style.display = 'block'; render(); };
  if (B.reg) B.reg('C', function () { panel.style.display = 'none'; });
  function bar(p, c) { return '<div style="height:8px;background:#352c6b;border-radius:6px"><div style="height:8px;width:' + Math.max(0, Math.min(100, p)) + '%;background:' + (c || '#8f7bff') + ';border-radius:6px"></div></div>'; }
  function fnv(x) { var h = 0x811c9dc5; for (var i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); }
  function b64e(x) { var by = new TextEncoder().encode(x), bin = ''; for (var i = 0; i < by.length; i++) bin += String.fromCharCode(by[i]); return btoa(bin); }
  function b64d(x) { var bin = atob(x), by = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) by[i] = bin.charCodeAt(i); return new TextDecoder().decode(by); }
  function cd(ms) { var m = Math.max(0, Math.ceil(ms / 60000)); return Math.floor(m / 60) + 'h ' + (m % 60) + 'm'; }

  function tabBoss() {
    var h = '<div style="text-align:center;padding:4px"><b>Reputation: ' + '⭐'.repeat(stars()) + '</b> &nbsp; Palapag ' + C.floors + '/3</div>';
    h += '<div style="' + ROW + '"><span>📝 Posts ngayon: <b>' + C.pc + '/100</b></span><span>Naipon: <b>' + Math.floor(C.pend) + '</b></span></div>' + bar(C.pc, '#2ecc71');
    h += '<div style="text-align:center;margin:8px 0"><button data-a="col" style="' + BTN + ';font-size:16px">💰 Kolektahin (' + Math.floor(C.pend) + ' posts)</button></div>';
    h += '<div style="text-align:center;opacity:.8">Bilis: ' + total().toFixed(1) + ' posts/oras</div>';
    if (C.broken) h += '<div style="' + ROW + ';background:#6b1d2b"><span>🔧 Sira ang makina! Mabagal ang trabaho</span><button data-a="fix" style="' + BTN + '">Ayusin 20🪙</button></div>';
    h += '<div style="text-align:center"><button data-a="ot" style="' + (C.ot ? BTN : BTN2) + '">⏱️ Overtime: ' + (C.ot ? 'ON (x1.5)' : 'OFF') + '</button><button data-a="rest" style="' + BTN2 + '">☕ Pahingahin lahat 10🪙</button></div>';
    for (var i = 0; i < C.bots.length; i++) {
      var b = C.bots[i];
      h += '<div style="' + ROW + '"><div style="flex:1"><b>🤖 ' + esc(b.n) + '</b> · ' + rank(b.lv) + ' · Lv ' + b.lv + '<div style="font-size:11px;opacity:.8">🔋 ' + Math.round(b.en) + '%</div>' + bar(b.en, b.en > 20 ? '#2ecc71' : '#e74c3c') + '</div>' +
        (b.lv < 10 ? '<button data-a="up" data-v="' + i + '" style="' + BTN + '">⬆ ' + upCost(b.lv) + '🪙</button>' : '<span>MAX</span>') + '</div>';
    }
    if (C.bots.length < 3 * C.floors) h += '<button data-a="hire" style="' + BTN + '">➕ Mag-hire ng bot (' + (100 * C.bots.length) + '🪙)</button>';
    else if (C.floors < 3) h += '<button data-a="floor" style="' + BTN + '">🏗️ Dagdag na palapag (' + (500 * C.floors * C.floors) + '🪙)</button>';
    var mx = 1, i2; for (i2 = 0; i2 < C.prof.length; i2++) mx = Math.max(mx, C.prof[i2].v);
    h += '<div style="margin-top:10px"><b>📈 Kita (huling 7 araw)</b><div style="display:flex;align-items:flex-end;gap:4px;height:60px;margin-top:6px">';
    for (i2 = 0; i2 < C.prof.length; i2++) h += '<div title="' + C.prof[i2].v + '" style="flex:1;background:#8f7bff;border-radius:4px 4px 0 0;height:' + (C.prof[i2].v / mx * 100) + '%"></div>';
    return h + '</div></div>';
  }
  function tabStory() {
    var h = '<b>📖 Kwento ng Opisina</b>';
    for (var i = 0; i < CH.length; i++) {
      var done = i < C.ch, ok = i === C.ch && CH[i][1]();
      h += '<div style="' + ROW + ';opacity:' + (i > C.ch ? .4 : 1) + '"><span>' + (done ? '✅' : i > C.ch ? '🔒' : '📌') + ' Ch ' + (i + 1) + ': ' + CH[i][0] + '</span>' +
        (ok ? '<button data-a="ch" style="' + BTN + '">+' + CH[i][2] + '🪙</button>' : '') + '</div>';
    }
    return h + (C.ch >= CH.length ? '<div style="text-align:center;margin-top:8px">🎉 Tapos mo na ang kwento! Abangan ang Chapter 2.</div>' : '');
  }
  function tabBonus() {
    var n = dn(), now = Date.now(), t = S.days, i, h = '<div style="' + ROW + '"><span>⏰ Coin Drop kada oras</span>' +
      (now - C.drop >= 36e5 ? '<button data-a="drop" style="' + BTN + '">+15🪙</button>' : '<span>' + cd(36e5 - (now - C.drop)) + '</span>') + '</div>';
    h += '<div style="' + ROW + '"><span>🎟️ Scratch Card araw-araw</span>' + (C.scr === n ? '<span>✅ Tapos na</span>' : '<button data-a="scr" style="' + BTN + '">Kaskasin</button>') + '</div>';
    var pc = Math.round(C.pig), sun = new Date().getDay() === 0;
    h += '<div style="' + ROW + '"><span>🐷 Piggy Bank: <b>' + pc + '🪙</b></span>' + (sun && pc >= 1 ? '<button data-a="pig" style="' + BTN + '">Basagin!</button>' : '<span style="opacity:.7">Linggo lang</span>') + '</div>';
    var av = Math.max(0, Math.min(30, t) - C.pass);
    h += '<div style="' + ROW + '"><span>🎫 Season Pass: Tier ' + Math.min(30, t) + '/30</span>' + (av ? '<button data-a="pass" style="' + BTN + '">Kunin ' + av + ' tier</button>' : '<span>✅</span>') + '</div>';
    for (i = 0; i < ANN.length; i++) h += '<div style="' + ROW + '"><span>🎂 ' + ANN[i][0] + ' araw na pasok</span>' + (C.ann[ANN[i][0]] ? '✅' : t >= ANN[i][0] ? '<button data-a="ann" data-v="' + i + '" style="' + BTN + '">+' + ANN[i][1] + '🪙</button>' : '<span style="opacity:.6">' + t + '/' + ANN[i][0] + '</span>') + '</div>';
    var hr = new Date().getHours(), nh = hr < 12 ? 12 : hr < 19 ? 19 : 36, d0 = new Date(); d0.setHours(0, 0, 0, 0);
    var tm = nh === 36 ? d0.getTime() + 36e5 * 36 : d0.getTime() + nh * 36e5;
    h += '<div style="margin-top:8px;opacity:.85">⚡ Susunod na Happy Hour: ' + cd(tm - now) + '<br>🌅 Reset ng quests: ' + cd(d0.getTime() + 864e5 - now) + '</div>';
    return h + '<div style="margin-top:6px;opacity:.85">🎁 Bukas na reward: +' + (25 + 10 * Math.min(S.streak + 1, 7)) + '🪙</div>';
  }
  function tabShop() {
    var h = '<b>🛒 Shop</b> <span style="opacity:.7">(may Daily Deal: 50% off!)</span>', deal = dn() % 3;
    for (var i = 0; i < SH.length; i++) h += '<div style="' + ROW + '"><span>' + SH[i][0] + (i === deal ? ' 🔥' : '') + '</span><button data-a="buy" data-v="' + i + '" style="' + BTN + '">' + (i === deal ? Math.round(SH[i][1] / 2) : SH[i][1]) + '🪙</button></div>';
    return h + '<div style="opacity:.8;margin-top:6px">Freeze mo: ' + (S.freeze || 0) + (S.charm > Date.now() ? ' · 🍀 Aktibo pa' : '') + '</div>';
  }
  function tabSet() {
    var h = '<b>📊 Buod ngayong araw</b><div style="' + ROW + '"><span>🪙 Nakuha: ' + (S.earn - C.e0) + '</span><span>📝 Posts: ' + C.pc + '</span><span>⭐ Lv ' + B.lv() + '</span></div>';
    h += '<div style="' + ROW + '"><span>🔕 Do Not Disturb (walang pop-up)</span><button data-a="dnd" style="' + (S.dnd ? BTN : BTN2) + '">' + (S.dnd ? 'ON' : 'OFF') + '</button></div>';
    h += '<div style="' + ROW + '"><span>🎂 Birthday (MM-DD)</span><span><input id="cbBd" value="' + esc(C.bd) + '" maxlength="5" style="width:60px;border-radius:6px;border:0;padding:4px"><button data-a="bd" style="' + BTN + '">OK</button></span></div>';
    h += '<div style="margin-top:8px"><b>💾 Backup</b><div><button data-a="exp" style="' + BTN + '">Gumawa ng code</button><button data-a="imp" style="' + BTN2 + '">I-restore</button></div>' +
      '<textarea id="cbBk" rows="3" style="width:100%;border-radius:8px;border:0;padding:6px;margin-top:4px;box-sizing:border-box" placeholder="Dito lalabas o i-paste ang code">' + esc(tmp) + '</textarea><div style="font-size:12px;opacity:.75;margin-top:4px">⚠️ Huwag mag-import ng code mula sa hindi mo kilala.</div></div>';
    return h;
  }
  function render() {
    var h = '<div style="display:flex;justify-content:space-between;align-items:center"><b>🌟 Opisina Boss</b><button data-a="x" style="' + BTN2 + '">✕</button></div>' +
      '<div style="background:#241c52;border-radius:10px;padding:6px 10px;margin:6px 0">🤖 <i>Cheebee: ' + TIPS[(Math.floor(Date.now() / 45000)) % TIPS.length] + '</i></div>' +
      '<div style="margin:4px 0">🪙 <b>' + S.coins + '</b></div><div style="display:flex;flex-wrap:wrap">';
    for (var i = 0; i < TABS.length; i++) h += '<button data-a="tab" data-v="' + TABS[i][0] + '" style="' + (cur === TABS[i][0] ? BTN : BTN2) + '">' + TABS[i][1] + ' ' + TABS[i][2] + '</button>';
    h += '</div><div style="margin-top:6px">' + (cur === 'b' ? tabBoss() : cur === 's' ? tabStory() : cur === 'x' ? tabBonus() : cur === 'h' ? tabShop() : tabSet()) + '</div>';
    panel.innerHTML = h; hud();
  }
  function done(m) { if (m) B.toast(m); B.jingle(); B.commit(); save(); render(); }

  panel.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-a]') : null; if (!t) return;
    var a = t.getAttribute('data-a'), v = t.getAttribute('data-v'), n = dn(), g, i;
    if (a === 'x') { panel.style.display = 'none'; return; }
    if (a === 'tab') { cur = v; tmp = ''; return render(); }
    tick();
    if (a === 'col') return collect();
    if (a === 'up') { var b = C.bots[+v]; if (b.lv < 10 && spend(upCost(b.lv))) { b.lv++; S.work++; B.confetti(); return done('⬆ ' + b.n + ' ay ' + rank(b.lv) + ' na!'); } return; }
    if (a === 'hire') { if (C.bots.length < 3 * C.floors && spend(100 * C.bots.length)) { C.bots.push({ n: NAMES[C.bots.length % NAMES.length], lv: 1, en: 100 }); S.work += 2; return done('🤖 May bagong bot!'); } return; }
    if (a === 'floor') { if (C.floors < 3 && spend(500 * C.floors * C.floors)) { C.floors++; S.work += 5; B.confetti(); return done('🏗️ Bagong palapag!'); } return; }
    if (a === 'fix') { if (spend(20)) { C.broken = 0; return done('🔧 Ayos na!'); } return; }
    if (a === 'rest') { if (spend(10)) { for (i = 0; i < C.bots.length; i++) C.bots[i].en = Math.min(100, C.bots[i].en + 40); return done('☕ Presko na ang mga bot!'); } return; }
    if (a === 'ot') { C.ot = C.ot ? 0 : 1; save(); return render(); }
    if (a === 'ch') { if (C.ch < CH.length && CH[C.ch][1]()) { g = B.addCoins(CH[C.ch][2], 1); B.addXP(40); B.confetti(); C.ch++; return done('📖 +' + g + ' 🪙'); } return; }
    if (a === 'drop') { if (Date.now() - C.drop >= 36e5) { C.drop = Date.now(); g = B.addCoins(15); return done('⏰ +' + g + ' 🪙'); } return; }
    if (a === 'scr') { if (C.scr !== n) { C.scr = n; var P = [5, 10, 20, 40, 100, 250], W = [30, 28, 20, 12, 8, 2], r = Math.random() * 100; for (i = 0; i < W.length; i++) { r -= W[i]; if (r <= 0) break; } g = B.addCoins(P[Math.min(i, 5)]); if (g >= 100) B.confetti(); return done('🎟️ +' + g + ' 🪙'); } return; }
    if (a === 'pig') { if (new Date().getDay() === 0 && C.pig >= 1) { g = B.addCoins(Math.round(C.pig), 1); C.pig = 0; B.confetti(); return done('🐷 Nabasag! +' + g + ' 🪙'); } return; }
    if (a === 'pass') { var tr = Math.min(30, S.days), sum = 0; for (i = C.pass + 1; i <= tr; i++) sum += 20 + i * 2 + (i % 5 === 0 ? 100 : 0); if (sum) { C.pass = tr; g = B.addCoins(sum, 1); B.confetti(); return done('🎫 +' + g + ' 🪙'); } return; }
    if (a === 'ann') { var an = ANN[+v]; if (S.days >= an[0] && !C.ann[an[0]]) { C.ann[an[0]] = 1; g = B.addCoins(an[1], 1); B.confetti(); return done('🎂 +' + g + ' 🪙'); } return; }
    if (a === 'buy') { var p = SH[+v][1] / (+v === n % 3 ? 2 : 1); if (spend(Math.round(p))) { if (+v === 0) S.freeze = (S.freeze || 0) + 1; else if (+v === 1) S.charm = Date.now() + 36e5; else for (i = 0; i < C.bots.length; i++) C.bots[i].en = 100; S.work++; return done('✅ Nabili!'); } return; }
    if (a === 'dnd') { S.dnd = S.dnd ? 0 : 1; B.commit(); return render(); }
    if (a === 'bd') {
      var bv = ($('cbBd') || {}).value || '';
      if (!validBd(bv)) return B.toast('Format: MM-DD, halimbawa 03-25');
      var cy = new Date().getFullYear(), t0 = new Date(), tm0 = ('0' + (t0.getMonth() + 1)).slice(-2) + '-' + ('0' + t0.getDate()).slice(-2);
      if (C.bd && C.bd !== bv && C.bdc === cy) return B.toast('Isang beses lang puwedeng baguhin ang birthday kada taon');
      if (C.bd !== bv) { C.bd = bv; C.bdc = cy; if (bv === tm0) C.bdy = cy; }
      save(); return B.toast('Naka-save ang birthday 🎂');
    }
    if (a === 'exp') { try { var pk = { v: 3, b: localStorage.getItem('cbPhaseBdata'), c: localStorage.getItem(K), d: localStorage.getItem('cbPhaseDdata') }; pk.h = fnv(String(pk.b) + '|' + String(pk.c) + '|' + String(pk.d)); tmp = b64e(JSON.stringify(pk)); } catch (e) { tmp = 'Hindi nagawa'; } return render(); }
    if (a === 'imp') {
      try {
        var raw = (($('cbBk') || {}).value || '').trim(); if (!raw || raw.length > 300000) throw new Error('code');
        var o = JSON.parse(b64d(raw)); if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('shape');
        var js = {}; ['b', 'c', 'd'].forEach(function (k) { var x = o[k]; if (x == null) return; if (typeof x !== 'string' || x.length > 150000) throw new Error('size'); var j = JSON.parse(x); if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('shape'); js[k] = j; });
        if (!js.b && !js.c && !js.d) throw new Error('empty');
        if (o.h !== undefined && o.h !== fnv(String(o.b) + '|' + String(o.c) + '|' + String(o.d))) throw new Error('checksum');
        var pv = js.b ? Math.round(Number(js.b.coins) || 0) : '?', pl = js.b ? Math.floor(Math.sqrt(Math.max(0, Number(js.b.xp) || 0) / 40)) + 1 : '?', ps = js.b ? Math.round(Number(js.b.streak) || 0) : '?';
        if (!confirm('Ibabalik ang progress:\nCoins: ' + pv + '\nLevel: ' + pl + '\nStreak: ' + ps + '\n\nPapalitan nito ang progress mo ngayon. Tuloy?')) return;
        localStorage.setItem('cbUndo', JSON.stringify({ b: localStorage.getItem('cbPhaseBdata'), c: localStorage.getItem(K), d: localStorage.getItem('cbPhaseDdata'), t: Date.now() }));
        if (o.b) localStorage.setItem('cbPhaseBdata', o.b); if (o.c) localStorage.setItem(K, o.c); if (o.d) localStorage.setItem('cbPhaseDdata', o.d); location.reload();
      } catch (e) { B.toast('Mali o sira ang code. Walang nabago.'); } return;
    }
  });

  /* ---------- simula ---------- */
  function lucky() {
    var e = document.createElement('div');
    e.style.cssText = 'position:fixed;left:50%;bottom:calc(130px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#ff9f1c;color:#000;border-radius:14px;padding:10px 16px;font:800 15px system-ui;z-index:95;cursor:pointer;box-shadow:0 4px 18px #0008';
    e.textContent = '🍀 LUCKY HOUR! Pindutin para sa regalo!';
    e.onclick = function () { var g = B.addCoins(50); B.confetti(); B.jingle(); B.toast('🍀 +' + g + ' 🪙'); B.commit(); try { e.remove(); } catch (x) {} };
    document.body.appendChild(e); setTimeout(function () { try { e.remove(); } catch (x) {} }, 20000);
    setTimeout(lucky, (20 + Math.random() * 20) * 60000);
  }
  function boot() {
    if (B.dock) B.dock(hudEl); else document.body.appendChild(hudEl);
    document.body.appendChild(panel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.style.display === 'block') panel.style.display = 'none'; });
    var away = Date.now() - C.seen; tick(); hud();
    if (away > 36e5 && C.pend >= 1) setTimeout(function () { B.toast('🤖 Habang wala ka, may ' + Math.floor(C.pend) + ' posts na handa!'); }, 3500);
    var d = new Date(), md = ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    if (C.bd === md && C.bdy !== d.getFullYear()) { C.bdy = d.getFullYear(); save(); setTimeout(function () { var g = B.addCoins(500, 1); B.confetti(); B.jingle(); B.toast('🎂 Maligayang Kaarawan! +' + g + ' 🪙'); B.commit(); }, 5000); }
    setInterval(function () { tick(); hud(); }, 60000);
    setTimeout(lucky, (15 + Math.random() * 15) * 60000);
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
  window.CB_PHASE_C = { off: function () { try { localStorage.setItem('cbPhaseC', 'off'); } catch (e) {} location.reload(); }, on: function () { try { localStorage.removeItem('cbPhaseC'); } catch (e) {} location.reload(); } };
})();
