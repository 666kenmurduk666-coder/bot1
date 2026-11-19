/* Cyborg Cheebee AI Office - Phase B add-on (v4: ayos ang Spin, hatinggabi, toast, security)
   Daily reward, streak, quests, spin, mystery box, XP/level, badges, mini-games, shop, happy hour, tunog, confetti.
   Lahat ay nasa browser lang (localStorage). Hindi ginagalaw ang server, password, o totoong coins mo.
   Para patayin: CB_PHASE_B.off() sa console, o i-double-click ang REMOVE-PHASE-B.bat */
(function () {
  'use strict';
  try { if (localStorage.getItem('cbPhaseB') === 'off') return; } catch (e) {}
  if (window.CB_PHASE_B) return;
  var K = 'cbPhaseBdata', S = {}, $ = function (i) { return document.getElementById(i); };
  var weak = (navigator.hardwareConcurrency || 4) <= 4;
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(x, d) { x = Number(x); return isFinite(x) ? x : d; }
  function dayNum() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5); }
  function load() {
    try { S = JSON.parse(localStorage.getItem(K) || 'null') || {}; } catch (e) { S = {}; }
    var d = { coins: 0, xp: 0, earn: 0, streak: 0, best: 0, days: 0, last: -1, claimed: -1, spin: -1, box: -1, spins: 0,
      qday: -1, q: {}, qc: {}, dp: 0, wk: -1, wdays: 0, wclaim: 0, own: {}, badges: {}, tint: 'none', avatar: '\uD83E\uDD16',
      mute: 0, played: 0, intro: 0, eggs: 0, work: 0, wxp: 0, ol: 1 };
    if (!S || typeof S !== 'object' || Array.isArray(S)) S = {};
    for (var k in d) if (S[k] === undefined) S[k] = d[k];
    sanitize(d);
  }
  var AVS = ['\uD83E\uDD16', '\uD83D\uDC7E', '\uD83D\uDC31', '\uD83E\uDD84', '\uD83D\uDE80', '\uD83D\uDC51'], TINT_OK = ['none', 'pink', 'neon', 'pastel', 'retro'], WAVE_OK = ['sine', 'square', 'triangle'],
    BADGE_OK = ['first', 's3', 's7', 's30', 'l5', 'l10', 'rich', 'game', 'spin', 'shop', 'egg'], QK = ['login', 'game', 'spin', 'all'], EXTRA = ['log', 'quiet', 'dnd', 'vib', 'wave', 'freeze', 'charm'],
    NONNEG = ['coins', 'xp', 'earn', 'streak', 'best', 'days', 'spins', 'dp', 'wdays', 'wclaim', 'wxp', 'work', 'played', 'eggs', 'ol'];
  function pickKeys(src, ok) { var o = {}; if (src && typeof src === 'object') for (var i = 0; i < ok.length; i++) if (src[ok[i]]) o[ok[i]] = 1; return o; }
  function sanitize(d) {
    var k, o;
    for (k in S) if (!(k in d) && EXTRA.indexOf(k) < 0) delete S[k];
    for (k in d) {
      if (typeof d[k] === 'number') { S[k] = num(S[k], d[k]); if (NONNEG.indexOf(k) > -1 && S[k] < 0) S[k] = 0; }
      else if (typeof d[k] === 'object' && (!S[k] || typeof S[k] !== 'object' || Array.isArray(S[k]))) S[k] = {};
    }
    if (AVS.indexOf(S.avatar) < 0) S.avatar = d.avatar;
    if (TINT_OK.indexOf(S.tint) < 0) S.tint = 'none';
    if (S.wave !== undefined && WAVE_OK.indexOf(S.wave) < 0) delete S.wave;
    if (S.vib !== 0) delete S.vib;
    ['quiet', 'dnd'].forEach(function (q) { if (S[q]) S[q] = 1; else delete S[q]; });
    ['freeze', 'charm'].forEach(function (q) { if (S[q] !== undefined) { S[q] = num(S[q], 0); if (S[q] < 0) S[q] = 0; } });
    o = {}; for (k in S.own) if (/^[ta]:[^<>"'&]{1,8}$/.test(k) && S.own[k]) o[k] = 1; S.own = o;
    S.badges = pickKeys(S.badges, BADGE_OK); S.q = pickKeys(S.q, QK); S.qc = pickKeys(S.qc, QK);
    if (S.log !== undefined) S.log = Array.isArray(S.log) ? S.log.filter(function (r) { return Array.isArray(r); }).slice(0, 40).map(function (r) { return [num(r[0], 0), String(r[1]).slice(0, 200)]; }) : [];
  }
  function save() { try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) {} }
  load();

  /* ---------- tunog, toast, confetti ---------- */
  var ac = null;
  function beep(f, d, t) {
    if (S.mute || (S.quiet && (new Date().getHours() >= 22 || new Date().getHours() < 7))) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = t || S.wave || 'sine'; o.frequency.value = f; g.gain.value = 0.05;
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + (d || 0.12));
    } catch (e) {}
  }
  function jingle() { try { if (S.vib !== 0 && navigator.vibrate) navigator.vibrate(50); } catch (x) {} beep(523, .1); setTimeout(function () { beep(659, .1); }, 110); setTimeout(function () { beep(784, .18); }, 220); }
  var tbox = null, lastT = null;
  function toast(t) {
    try { (S.log = S.log || []).unshift([Date.now(), t]); if (S.log.length > 40) S.log.length = 40; } catch (x) {}
    if (S.dnd || !document.body) return;
    var now = Date.now();
    if (lastT && lastT.t === t && now - lastT.ts < 1500 && lastT.e.parentNode) { lastT.n++; lastT.ts = now; lastT.e.textContent = t + ' \u00D7' + lastT.n; return; }
    if (!tbox || !tbox.parentNode) {
      tbox = document.createElement('div');
      tbox.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);z-index:90;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;max-width:calc(100vw - 16px);' +
        (innerWidth < 600 ? 'bottom:calc(150px + env(safe-area-inset-bottom,0px))' : 'top:calc(70px + env(safe-area-inset-top,0px))');
      tbox.className = 'cb-toast'; tbox.setAttribute('role', 'status'); tbox.setAttribute('aria-live', 'polite');
      document.body.appendChild(tbox);
    }
    var guard = 0; while (tbox.children.length >= 3 && guard++ < 5) { try { tbox.children[0].remove(); } catch (x) { break; } }
    var e = document.createElement('div');
    e.style.cssText = 'background:#2a1f55;color:#fff;border:2px solid #a78bff;padding:8px 14px;border-radius:12px;font:600 14px system-ui;box-shadow:0 4px 18px #0008;max-width:100%;text-align:center;box-sizing:border-box';
    e.textContent = t; tbox.appendChild(e); lastT = { t: t, e: e, n: 1, ts: now };
    setTimeout(function () { try { e.remove(); } catch (x) {} }, 2600);
  }
  function confetti() {
    var em = ['\uD83C\uDF89', '\u2B50', '\uD83E\uDE99', '\uD83D\uDC96', '\u2728'], n = weak ? 14 : 34;
    for (var i = 0; i < n; i++) {
      var e = document.createElement('div');
      e.textContent = em[i % em.length];
      e.style.cssText = 'position:fixed;top:-30px;left:' + (Math.random() * 100) + 'vw;font-size:' + (16 + Math.random() * 16) + 'px;z-index:95;pointer-events:none';
      document.body.appendChild(e);
      (function (el) {
        try {
          el.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(' + (innerHeight + 60) + 'px) rotate(' + (Math.random() * 720 - 360) + 'deg)' }],
            { duration: 1600 + Math.random() * 1400, easing: 'ease-in' }).onfinish = function () { el.remove(); };
        } catch (x) { setTimeout(function () { el.remove(); }, 1800); }
      })(e);
    }
  }

  /* ---------- coins, XP, level, badges ---------- */
  function hh() { var h = new Date().getHours(); return (h >= 12 && h < 13) || (h >= 19 && h < 21); }
  var OFF = [['\uD83C\uDFE2', 'Maliit na Opisina'], ['\u2744\uFE0F', 'May Aircon'], ['\u2615', 'Coffee Bar'], ['\uD83D\uDD79\uFE0F', 'Arcade'], ['\uD83C\uDFB1', 'Pool Table'],
    ['\uD83D\uDCDA', 'Library'], ['\uD83C\uDF3F', 'Rooftop Garden'], ['\uD83D\uDE80', 'Rocket Pad'], ['\uD83C\uDFB5', 'Music Room'], ['\uD83C\uDFC6', 'Mega HQ']];
  function olv() { return Math.min(10, Math.floor(Math.sqrt(S.work / 4)) + 1); }
  function lv() { return Math.floor(Math.sqrt(S.xp / 40)) + 1; }
  var TITLES = ['Rookie', 'Trabahador', 'Masipag', 'Ka-Team', 'Manager', 'Boss', 'Big Boss', 'Legend', 'Alamat'];
  function title() { return TITLES[Math.min(lv() - 1, TITLES.length - 1)]; }
  function addCoins(n, raw) { n = Math.round(raw ? n : n * (hh() ? 2 : 1) * (1 + 0.03 * (olv() - 1)) * (S.charm > Date.now() ? 1.1 : 1)); S.coins += n; if (n > 0) S.earn += n; return n; }
  function addXP(n) {
    var wd = new Date().getDay(); if (wd === 0 || wd === 6) n *= 2; var a = lv(); S.xp += n; S.wxp += n;
    if (lv() > a) { confetti(); jingle(); toast('\u2B06\uFE0F LEVEL UP! Lv ' + lv() + ' - ' + title()); }
  }
  var BADGES = [
    ['first', '\uD83D\uDEAA', 'Unang Pasok', function () { return S.days >= 1; }],
    ['s3', '\uD83D\uDD25', '3 Araw Streak', function () { return S.best >= 3; }],
    ['s7', '\uD83D\uDD25', '7 Araw Streak', function () { return S.best >= 7; }],
    ['s30', '\uD83C\uDF0B', '30 Araw Streak', function () { return S.best >= 30; }],
    ['l5', '\u2B50', 'Level 5', function () { return lv() >= 5; }],
    ['l10', '\uD83C\uDF1F', 'Level 10', function () { return lv() >= 10; }],
    ['rich', '\uD83D\uDCB0', 'Kumita ng 1000', function () { return S.earn >= 1000; }],
    ['game', '\uD83C\uDFAE', '10 Laro', function () { return S.played >= 10; }],
    ['spin', '\uD83C\uDFA1', '5 Spin', function () { return S.spins >= 5; }],
    ['shop', '\uD83D\uDECD\uFE0F', '3 Binili', function () { return Object.keys(S.own).length >= 3; }],
    ['egg', '\uD83E\uDD5A', 'Sikreto!', function () { return S.eggs >= 7; }]
  ];
  function chk() {
    var o = olv(); if (o > S.ol) { S.ol = o; toast('\uD83C\uDFE2 Lumaki ang opisina! Office Lv ' + o + ' - ' + OFF[o - 1][1]); jingle(); confetti(); }
    for (var i = 0; i < BADGES.length; i++) {
      var b = BADGES[i];
      if (!S.badges[b[0]] && b[3]()) { S.badges[b[0]] = 1; S.xp += 30; toast('\uD83C\uDFC6 Bagong badge: ' + b[2]); jingle(); confetti(); }
    }
  }
  function commit() { chk(); save(); hud(); updHead(); }

  /* ---------- bagong araw ---------- */
  var lastDay = -1;
  function checkin() {
    var n = dayNum(), rolled = false;
    if (S.last !== n) {
      S.streak = (S.last === n - 1 || (S.last === n - 2 && S.freeze > 0 && (S.freeze--, true))) ? S.streak + 1 : 1; S.last = n; S.days++; rolled = true;
      if (S.streak > S.best) S.best = S.streak;
    }
    if (S.qday !== n) {
      S.qday = n; S.q = { login: 1 }; S.qc = {}; S.dp = 0; rolled = true;
      var wk = Math.floor((n + 3) / 7);
      if (S.wk !== wk) { S.wk = wk; S.wdays = 0; S.wclaim = 0; S.wxp = 0; }
      S.wdays++;
    }
    chk(); save();
    if (rolled && lastDay !== -1 && lastDay !== n) {
      try { window.dispatchEvent(new CustomEvent('cb-newday')); } catch (x) {}
      toast('\uD83C\uDF05 Bagong araw! Na-reset ang quests at laro.'); hud();
      if (panel.style.display === 'block') render();
    }
    lastDay = n; return rolled;
  }
  checkin();

  /* ---------- HUD (maliit na button) ---------- */
  var hudEl = document.createElement('div');
  hudEl.style.cssText = 'background:#2a1f55;color:#fff;border:2px solid #a78bff;border-radius:20px;' +
    'padding:6px 10px;min-height:44px;box-sizing:border-box;display:flex;align-items:center;font:700 13px system-ui;cursor:pointer;box-shadow:0 2px 12px #0008;user-select:none;-webkit-tap-highlight-color:transparent';
  var dockEl = document.createElement('div');
  dockEl.style.cssText = 'position:fixed;right:8px;top:calc(64px + env(safe-area-inset-top,0px));z-index:62;display:flex;flex-direction:column;align-items:flex-end;gap:8px';
  function dock(el) { dockEl.appendChild(el); }
  function dot() {
    var n = dayNum();
    if (S.claimed !== n || S.box !== n || S.spin !== n) return true;
    for (var i = 0; i < QS.length; i++) if (S.q[QS[i][0]] && !S.qc[QS[i][0]]) return true;
    return false;
  }
  function hud() {
    hudEl.innerHTML = '\uD83C\uDF81 Lv' + lv() + ' \uD83D\uDD25' + S.streak + ' \uD83E\uDE99' + S.coins + (hh() ? ' \u26A1x2' : '') +
      (dot() ? ' <span style="color:#ff5c7a">\u25CF</span>' : '');
  }
  hudEl.onclick = function () { open(); };

  /* ---------- tint (tema) ---------- */
  var tintEl = document.createElement('div');
  tintEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;mix-blend-mode:soft-light;opacity:.45';
  var TINTS = { pink: '#ff4fa0', neon: '#00ffc8', pastel: '#ffd6f0', retro: '#ffb347' };
  function applyTint() { tintEl.style.background = TINTS[S.tint] || 'transparent'; }

  /* ---------- panel ---------- */
  var BTN = 'background:#5b3df0;color:#fff;border:0;border-radius:10px;padding:8px 12px;font:700 14px system-ui;cursor:pointer;margin:3px 2px';
  var BTN2 = BTN.replace('#5b3df0', '#3a3170');
  var panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(94vw,430px);max-height:82vh;max-height:82dvh;overflow:auto;overscroll-behavior:contain;' +
    'background:#17123a;color:#fff;border:2px solid #a78bff;border-radius:16px;padding:12px;z-index:80;display:none;font:14px system-ui;box-shadow:0 10px 40px #000a';
  var cur = 'd', timers = [], M = null, spinFin = null, REG = {};
  function reg(id, fn) { REG[id] = fn; }
  function claim(id) { for (var k in REG) if (k !== id) { try { REG[k](); } catch (x) {} } }
  var TABS = [['d', '\uD83C\uDF81', 'Araw'], ['q', '\uD83D\uDCCB', 'Quests'], ['s', '\uD83C\uDFA1', 'Spin'], ['g', '\uD83C\uDFAE', 'Laro'], ['h', '\uD83D\uDED2', 'Shop'], ['o', '\uD83C\uDFE2', 'Opisina'], ['r', '\uD83E\uDD47', 'Rank'], ['b', '\uD83C\uDFC6', 'Badge']];
  var QS = [['login', '\uD83D\uDEAA', 'Pumasok ngayon'], ['game', '\uD83C\uDFAE', 'Maglaro ng 1 mini-game'], ['spin', '\uD83C\uDFA1', 'Mag-spin ng 1 beses']];
  var SHOP = [['t:pink', '\uD83C\uDF38 Pink na tema', 60], ['t:neon', '\uD83D\uDC9A Neon na tema', 80], ['t:pastel', '\uD83C\uDF80 Pastel na tema', 60], ['t:retro', '\uD83D\uDFE0 Retro na tema', 60],
    ['a:\uD83D\uDC7E', '\uD83D\uDC7E Avatar', 40], ['a:\uD83D\uDC31', '\uD83D\uDC31 Avatar', 50], ['a:\uD83E\uDD84', '\uD83E\uDD84 Avatar', 60], ['a:\uD83D\uDE80', '\uD83D\uDE80 Avatar', 100], ['a:\uD83D\uDC51', '\uD83D\uDC51 Avatar', 150]];

  function clearT() { var f = spinFin; spinFin = null; for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); clearInterval(timers[i]); } timers = []; M = null; if (f) f(); }
  function open() { checkin(); claim('B'); panel.style.display = 'block'; if (!S.intro) { S.intro = 1; save(); toast('Welcome! Kunin ang reward mo araw-araw \uD83C\uDF81'); } render(); }
  function close() { clearT(); panel.style.display = 'none'; }
  reg('B', function () { if (panel.style.display === 'block') close(); });
  function updHead() {
    var e = $('cbH'); if (!e) return;
    var L = lv(), base = 40 * (L - 1) * (L - 1), nx = 40 * L * L, p = Math.max(0, Math.min(100, (S.xp - base) / (nx - base) * 100));
    e.innerHTML = '\uD83E\uDE99 <b>' + esc(S.coins) + '</b> &nbsp; \uD83D\uDD25 <b>' + esc(S.streak) + '</b> araw &nbsp; \u2B50 ' + esc(S.xp) + ' XP' +
      '<div style="height:8px;background:#352c6b;border-radius:6px;margin-top:6px"><div style="height:8px;width:' + p + '%;background:#8f7bff;border-radius:6px"></div></div>' +
      (hh() ? '<div style="margin-top:6px;background:#ff9f1c;color:#000;border-radius:8px;padding:4px 8px;font-weight:700">\u26A1 HAPPY HOUR! Doble ang coins ngayon!</div>' : '');
  }
  function G(h) { var e = $('cbG'); if (e) e.innerHTML = h; }
  function render() {
    clearT();
    var n = dayNum(), h = '<div style="display:flex;justify-content:space-between;align-items:center"><b id="cbT" data-a="egg" style="font-size:16px">' +
      esc(S.avatar) + ' ' + title() + ' \u00B7 Lv ' + lv() + '</b><button data-a="x" style="' + BTN2 + '">\u2715</button></div><div id="cbH" style="margin:6px 0"></div><div style="display:flex;flex-wrap:wrap">';
    for (var i = 0; i < TABS.length; i++) h += '<button data-a="tab" data-v="' + TABS[i][0] + '" style="' + (cur === TABS[i][0] ? BTN : BTN2) + '">' + TABS[i][1] + ' ' + TABS[i][2] + '</button>';
    h += '</div><div style="margin-top:8px">';
    if (cur === 'd') {
      var c = 25 + 10 * Math.min(S.streak, 7);
      h += '<div style="text-align:center;padding:8px"><div style="font-size:15px">Araw ' + S.streak + ' ng streak \uD83D\uDD25</div><div style="display:flex;gap:4px;justify-content:center;margin:8px 0">';
      for (var d = 1; d <= 7; d++) h += '<div style="width:40px;padding:5px 0;border-radius:8px;background:' + (d <= ((S.streak - 1) % 7) + 1 ? '#5b3df0' : '#352c6b') + ';font-size:11px">' + (d === 7 ? '\uD83C\uDF81' : '\uD83E\uDE99') + '<br>D' + d + '</div>';
      h += '</div>' + (S.claimed === n ? '<div>\u2705 Nakuha mo na ang reward ngayon. Balik bukas!</div>' : '<button data-a="claim" style="' + BTN + ';font-size:16px">\uD83C\uDF81 Kunin ang +' + c + ' coins</button>');
      h += '<div style="margin-top:10px">' + (S.box === n ? '\uD83D\uDCE6 Nabuksan mo na ang Mystery Box ngayon' : '<button data-a="box" style="' + BTN + '">\uD83D\uDCE6 Buksan ang Mystery Box</button>') + '</div></div>';
    } else if (cur === 'q') {
      h += '<b>Quests ngayon</b>';
      var all = 1;
      for (var q = 0; q < QS.length; q++) {
        var id = QS[q][0], dn = S.q[id], cl = S.qc[id]; if (!cl) all = 0;
        h += '<div style="display:flex;justify-content:space-between;align-items:center;background:#241c52;border-radius:10px;padding:6px 10px;margin:6px 0"><span>' + QS[q][1] + ' ' + QS[q][2] + '</span>' +
          (cl ? '\u2705' : dn ? '<button data-a="qc" data-v="' + id + '" style="' + BTN + '">+40 \uD83E\uDE99</button>' : '<span style="opacity:.6">hindi pa</span>') + '</div>';
      }
      h += '<div style="background:#241c52;border-radius:10px;padding:6px 10px;margin:6px 0;display:flex;justify-content:space-between;align-items:center"><span>\uD83C\uDF1F Tapusin lahat ng 3</span>' +
        (S.qc.all ? '\u2705' : all ? '<button data-a="qc" data-v="all" style="' + BTN + '">+100 \uD83E\uDE99</button>' : '<span style="opacity:.6">+100</span>') + '</div>';
      h += '<b>Weekly</b><div style="background:#241c52;border-radius:10px;padding:6px 10px;margin:6px 0;display:flex;justify-content:space-between;align-items:center"><span>\uD83D\uDCC5 Pumasok ng 5 araw (' + Math.min(S.wdays, 5) + '/5)</span>' +
        (S.wclaim ? '\u2705' : S.wdays >= 5 ? '<button data-a="wk" style="' + BTN + '">+300 \uD83E\uDE99</button>' : '') + '</div>';
    } else if (cur === 's') {
      h += '<div style="text-align:center"><div id="cbW" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0">';
      for (var w = 0; w < WHEEL.length; w++) h += '<div data-w="' + w + '" style="background:#352c6b;border-radius:10px;padding:12px 0;font-weight:800">' + WHEEL[w] + '</div>';
      h += '</div>' + (S.spin === n ? '\u2705 Naka-spin ka na ngayon. Balik bukas!' : '<button data-a="spin" style="' + BTN + ';font-size:16px">\uD83C\uDFA1 I-SPIN (libre)</button>') + '</div>';
    } else if (cur === 'g') {
      h += '<div id="cbG">' + gameMenu() + '</div>';
    } else if (cur === 'h') {
      h += '<b>Tindahan</b> <span style="opacity:.7">(Bonus Coins)</span>' + (S.tint !== 'none' ? ' <button data-a="notint" style="' + BTN2 + '">Alisin ang tema</button>' : '');
      for (var s = 0; s < SHOP.length; s++) {
        var it = SHOP[s], own = S.own[it[0]], on = (it[0].charAt(0) === 'a' && S.avatar === it[0].slice(2)) || (it[0].charAt(0) === 't' && S.tint === it[0].slice(2));
        h += '<div style="display:flex;justify-content:space-between;align-items:center;background:#241c52;border-radius:10px;padding:6px 10px;margin:6px 0"><span>' + it[1] + '</span>' +
          (own ? (on ? '\u2705 Gamit' : '<button data-a="eq" data-v="' + it[0] + '" style="' + BTN + '">Gamitin</button>') : '<button data-a="buy" data-v="' + s + '" style="' + BTN + '">' + it[2] + ' \uD83E\uDE99</button>') + '</div>';
      }
    } else if (cur === 'o') {
      h += officeHtml();
    } else if (cur === 'r') {
      h += rankHtml();
    } else {
      h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">';
      for (var b = 0; b < BADGES.length; b++) h += '<div style="background:#241c52;border-radius:10px;padding:8px 2px;text-align:center;font-size:12px;opacity:' + (S.badges[BADGES[b][0]] ? 1 : .35) + '"><div style="font-size:26px">' + (S.badges[BADGES[b][0]] ? BADGES[b][1] : '\uD83D\uDD12') + '</div>' + BADGES[b][2] + '</div>';
      h += '</div><div style="margin-top:10px"><button data-a="mute" style="' + BTN2 + '">' + (S.mute ? '\uD83D\uDD07 Tunog: OFF' : '\uD83D\uDD0A Tunog: ON') + '</button></div>';
    }
    panel.innerHTML = h + '</div>'; updHead();
  }

  /* ---------- leaderboard (Robot players) ---------- */
  var BOTS = ['Cheebee', 'Pixel', 'Turbo', 'Nova', 'Sparky', 'Byte', 'Rusty', 'Zippy', 'Chip'];
  function botScore(i) {
    var n = dayNum(), wk = Math.floor((n + 3) / 7), d = (n + 3) % 7, sc = 0, st = .55 + i * .07;
    for (var k = 0; k <= d; k++) sc += (40 + ((wk * 31 + i * 17 + k * 13) % 110)) * st * (k === d ? (new Date().getHours() + 1) / 24 : 1);
    return Math.round(sc);
  }
  function rankRows() {
    var r = [{ n: esc(S.avatar) + ' Ikaw', s: S.wxp, me: 1 }];
    for (var i = 0; i < BOTS.length; i++) r.push({ n: '\uD83E\uDD16 ' + BOTS[i], s: botScore(i) });
    r.sort(function (a, b) { return b.s - a.s; }); return r;
  }
  function rankHtml() {
    var r = rankRows(), h = '<b>Top Players ngayong linggo</b> <span style="opacity:.7">(XP, reset tuwing Lunes)</span>', me = 0, i;
    for (i = 0; i < r.length; i++) {
      if (r[i].me) me = i;
      h += '<div style="display:flex;justify-content:space-between;background:' + (r[i].me ? '#5b3df0' : '#241c52') + ';border-radius:10px;padding:6px 10px;margin:5px 0"><span>' +
        (i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : '#' + (i + 1)) + ' ' + r[i].n + '</span><b>' + r[i].s + ' XP</b></div>';
    }
    h += me === 0 ? '<div style="text-align:center;margin-top:8px">\uD83D\uDC51 Ikaw ang #1! Ingatan ang pwesto mo!</div>' :
      '<div style="text-align:center;margin-top:8px">\uD83D\uDCAA Kulang ka pa ng <b>' + (r[me - 1].s - S.wxp + 1) + ' XP</b> para maungusan si ' + r[me - 1].n + '!</div>';
    return h + '<div style="opacity:.6;font-size:12px;margin-top:8px;text-align:center">Mga Robot player ang kalaban dito.</div>';
  }
  function officeHtml() {
    var o = olv(), h = '<div style="text-align:center;padding:6px"><div style="font-size:34px">' + OFF[o - 1][0] + '</div><b style="font-size:16px">Office Lv ' + o + ' - ' + OFF[o - 1][1] + '</b>' +
      '<div style="opacity:.85;margin:4px 0">Bonus: +' + (3 * (o - 1)) + '% sa lahat ng coins \uD83E\uDE99</div>';
    if (o < 10) { var need = 4 * o * o, base = 4 * (o - 1) * (o - 1), p = Math.max(0, Math.min(100, (S.work - base) / (need - base) * 100));
      h += '<div style="height:8px;background:#352c6b;border-radius:6px"><div style="height:8px;width:' + p + '%;background:#2ecc71;border-radius:6px"></div></div><div style="font-size:12px;opacity:.7;margin-top:4px">Gumawa pa ng ' + (need - S.work) + ' gawain para lumaki ang opisina</div>'; }
    h += '</div>';
    for (var i = 0; i < OFF.length; i++) h += '<div style="display:flex;justify-content:space-between;background:#241c52;border-radius:10px;padding:5px 10px;margin:4px 0;opacity:' + (i < o ? 1 : .4) + '"><span>' + (i < o ? OFF[i][0] : '\uD83D\uDD12') + ' Lv ' + (i + 1) + ' ' + OFF[i][1] + '</span><span>+' + (3 * i) + '%</span></div>';
    return h + '<div style="opacity:.6;font-size:12px;margin-top:6px;text-align:center">Lumalaki ang opisina sa bawat reward, quest, spin, laro, at binili.</div>';
  }

  /* ---------- spin ---------- */
  var WHEEL = [10, 25, 15, 50, 20, 100, 30, 200], WT = [20, 14, 20, 8, 16, 3, 17, 2];
  function doSpin() {
    var n = dayNum(); if (S.spin === n) return;
    S.spin = n; S.spins++; S.q.spin = 1; S.work++;
    var tot = 0, r, i; for (i = 0; i < WT.length; i++) tot += WT[i];
    r = Math.random() * tot; for (i = 0; i < WT.length; i++) { r -= WT[i]; if (r <= 0) break; } if (i >= WT.length) i = 0;
    /* ibigay at i-save ang premyo BAGO ang animation, para hindi mawala kapag isinara ang panel */
    var got = addCoins(WHEEL[i]); addXP(10); commit();
    var steps = 24 + i, k = 0, cells = panel.querySelectorAll('[data-w]');
    spinFin = function () { spinFin = null; toast('\uD83C\uDFA1 Nanalo ka ng +' + got + ' coins!'); if (WHEEL[i] >= 100) confetti(); jingle(); };
    (function go() {
      for (var c = 0; c < cells.length; c++) cells[c].style.background = (c === k % 8) ? '#8f7bff' : '#352c6b';
      beep(300 + (k % 8) * 40, .05);
      if (k >= steps) { var f = spinFin; spinFin = null; if (f) f(); render(); return; }
      k++; timers.push(setTimeout(go, 40 + k * 6));
    })();
  }

  /* ---------- mini-games ---------- */
  function gameMenu() {
    return '<div style="text-align:center"><div style="opacity:.8;margin-bottom:6px">Coins at XP sa unang 10 laro bawat araw, kasama ang \uD83C\uDFB2 Saya (' + Math.min(S.dp, 10) + '/10)</div>' +
      '<button data-a="mem" style="' + BTN + '">\uD83E\uDDE0 Memory</button><button data-a="tap" style="' + BTN + '">\uD83E\uDD16 Tap the Bot</button><button data-a="rea" style="' + BTN + '">\u26A1 Reaction</button></div>';
  }
  function finish(msg, coins) {
    S.dp++; var ok = S.dp <= 10, got = 0;
    if (ok) { S.played++; S.q.game = 1; S.work++; if (coins > 0) got = addCoins(coins); addXP(10); }
    jingle(); if (got >= 50) confetti();
    G('<div style="text-align:center;padding:10px"><div style="font-size:16px">' + msg + '</div><div style="margin:8px 0">' + (got ? '+' + got + ' \uD83E\uDE99' : (!ok ? 'Tapos na ang coins at XP sa laro ngayon' : '')) + '</div>' +
      '<button data-a="gm" style="' + BTN + '">\u21A9 Balik</button></div>');
    commit();
  }
  function memStart() {
    var em = ['\uD83E\uDD16', '\u2615', '\uD83D\uDE80', '\uD83C\uDFAE', '\u2B50', '\uD83C\uDF55', '\uD83C\uDFA7', '\uD83D\uDC8E'];
    M = { d: em.concat(em).sort(function () { return Math.random() - .5; }), o: [], f: {}, m: 0, l: 0, n: 0 }; memDraw();
  }
  function memDraw() {
    var h = '<div style="text-align:center">Galaw: ' + M.m + '</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px">';
    for (var i = 0; i < 16; i++) h += '<button data-a="mc" data-v="' + i + '" style="' + (M.f[i] ? BTN2 : BTN) + ';height:56px;font-size:26px">' + ((M.f[i] || M.o.indexOf(i) > -1) ? M.d[i] : '\u2753') + '</button>';
    G(h + '</div>');
  }
  function memClick(i) {
    if (!M || M.l || M.f[i] || M.o.indexOf(i) > -1) return;
    M.o.push(i); beep(500, .05); memDraw();
    if (M.o.length === 2) {
      M.m++;
      if (M.d[M.o[0]] === M.d[M.o[1]]) {
        M.f[M.o[0]] = 1; M.f[M.o[1]] = 1; M.o = []; M.n++; beep(800, .1); memDraw();
        if (M.n === 8) { var mv = M.m; M = null; finish('\uD83E\uDDE0 Tapos! ' + mv + ' galaw', Math.max(15, 80 - mv * 3)); }
      } else {
        M.l = 1; timers.push(setTimeout(function () { if (M) { M.o = []; M.l = 0; memDraw(); } }, 650));
      }
    }
  }
  var T = null;
  function tapDraw() {
    G('<div style="text-align:center">\u23F1 ' + T.t + 's &nbsp; Score: ' + T.s + '</div><div style="position:relative;height:190px;background:#241c52;border-radius:12px;margin-top:6px">' +
      '<button data-a="tb" style="' + BTN + ';position:absolute;left:' + T.x + '%;top:' + T.y + '%;font-size:26px">\uD83E\uDD16</button></div>');
  }
  function tapStart() {
    T = { t: 10, s: 0, x: 40, y: 40 }; tapDraw();
    timers.push(setInterval(function () {
      if (!T) return; T.t--;
      if (T.t <= 0) { var sc = T.s; clearT(); T = null; finish('\uD83E\uDD16 Score: ' + sc, Math.min(100, sc * 3)); } else tapDraw();
    }, 1000));
  }
  var R = null;
  function reaStart() {
    R = { st: 'w' }; G('<div data-a="rb" style="background:#a8243b;border-radius:12px;padding:50px 0;text-align:center;font-size:18px;font-weight:800">Hintayin ang GREEN...</div>');
    timers.push(setTimeout(function () {
      if (!R) return; R.st = 'g'; R.t = Date.now(); beep(700, .1);
      G('<div data-a="rb" style="background:#1e9e4f;border-radius:12px;padding:50px 0;text-align:center;font-size:20px;font-weight:800">TAP NA!</div>');
    }, 1000 + Math.random() * 2000));
  }
  function reaTap() {
    if (!R) return;
    if (R.st === 'w') { R = null; clearT(); finish('\u274C Masyado kang maaga!', 0); return; }
    var ms = Date.now() - R.t; R = null;
    finish('\u26A1 ' + ms + ' ms', ms < 300 ? 60 : ms < 450 ? 40 : ms < 700 ? 25 : 10);
  }

  /* ---------- aksyon ---------- */
  panel.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-a]') : null; if (!t) return;
    if (t.getAttribute('data-a') !== 'x') checkin();
    var a = t.getAttribute('data-a'), v = t.getAttribute('data-v'), n = dayNum(), g;
    if (a === 'x') return close();
    if (a === 'tab') { cur = v; return render(); }
    if (a === 'claim' && S.claimed !== n) {
      S.claimed = n; S.work++; var c = 25 + 10 * Math.min(S.streak, 7); g = addCoins(c); addXP(15);
      if (S.streak % 7 === 0) { g += addCoins(200); addXP(50); toast('\uD83C\uDF89 7-araw bonus! +200'); }
      jingle(); confetti(); toast('\uD83C\uDF81 +' + g + ' coins!'); commit(); return render();
    }
    if (a === 'box' && S.box !== n) {
      S.box = n; S.work++; var r = Math.random();
      if (r < .05) { g = addCoins(500); toast('\uD83D\uDC8E JACKPOT! +' + g + ' coins!'); confetti(); }
      else if (r < .35) { addXP(60); toast('\u2B50 +60 XP!'); }
      else { g = addCoins(30 + Math.floor(Math.random() * 91)); toast('\uD83D\uDCE6 +' + g + ' coins!'); }
      jingle(); commit(); return render();
    }
    if (a === 'spin') return doSpin();
    if (a === 'qc') {
      if (S.qc[v]) return;
      S.work++; if (v === 'all') { S.qc.all = 1; g = addCoins(100); addXP(50); }
      else if (S.q[v]) { S.qc[v] = 1; g = addCoins(40); addXP(20); } else return;
      jingle(); toast('+' + g + ' coins'); commit(); return render();
    }
    if (a === 'wk' && !S.wclaim && S.wdays >= 5) { S.wclaim = 1; S.work += 3; g = addCoins(300); addXP(100); jingle(); confetti(); toast('\uD83D\uDCC5 +' + g + ' coins!'); commit(); return render(); }
    if (a === 'buy') {
      var it = SHOP[+v]; if (!it || S.own[it[0]]) return;
      if (S.coins < it[2]) { beep(180, .2, 'square'); return toast('Kulang ang coins \uD83E\uDE99'); }
      S.coins -= it[2]; S.own[it[0]] = 1; S.work += 2; jingle(); toast('\u2705 Nabili!'); commit(); return act2(it[0]);
    }
    if (a === 'eq') { if (!S.own[v]) return; return act2(v); }
    if (a === 'notint') { S.tint = 'none'; applyTint(); commit(); return render(); }
    if (a === 'mute') { S.mute = S.mute ? 0 : 1; save(); return render(); }
    if (a === 'egg') { S.eggs++; if (S.eggs === 7) { addCoins(77, 1); toast('\uD83E\uDD5A Nahanap mo ang sikreto! +77'); confetti(); } commit(); return; }
    if (a === 'gm') { clearT(); return G(gameMenu()); }
    if (a === 'mem') return memStart();
    if (a === 'mc') return memClick(+v);
    if (a === 'tap') return tapStart();
    if (a === 'tb') { if (T) { T.s++; T.x = Math.floor(Math.random() * 78); T.y = Math.floor(Math.random() * 70); beep(600, .04); tapDraw(); } return; }
    if (a === 'rea') return reaStart();
    if (a === 'rb') return reaTap();
  });
  function act2(id) {
    if (id.charAt(0) === 'a') S.avatar = id.slice(2); else { S.tint = id.slice(2); applyTint(); }
    commit(); render();
  }

  /* ---------- layout polish (v5): iisang dock menu, bottom sheet sa phone, focus, keyboard ---------- */
  var CSS = ':root{--cb-bg:#17123a;--cb-card:#2a1f55;--cb-line:#a78bff;--cb-acc:#5b3df0;--cb-ok:#2ecc71;--cb-warn:#ff9f1c;--cb-r:16px;--cb-kb:0px;--cb-vh:100dvh}' +
    '.cb-pill,.cb-tog,.cb-panel button{touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .12s ease,box-shadow .12s ease}' +
    '.cb-pill:active,.cb-tog:active,.cb-panel button:active{transform:scale(.96)}' +
    '.cb-pill,.cb-panel,.cb-toast div{font-variant-numeric:tabular-nums}' +
    '.cb-panel{border-radius:var(--cb-r)!important;scrollbar-width:thin;scrollbar-color:var(--cb-line) transparent;animation:cbIn .14s ease-out}' +
    '.cb-panel::-webkit-scrollbar{width:6px}.cb-panel::-webkit-scrollbar-thumb{background:var(--cb-line);border-radius:6px}' +
    '.cb-panel button{min-height:44px}' +
    '.cb-panel input,.cb-panel textarea,.cb-panel select{font-size:16px!important;max-width:100%;box-sizing:border-box}' +
    '.cb-pill:focus-visible,.cb-tog:focus-visible,.cb-panel :focus-visible{outline:3px solid #ffd166;outline-offset:2px}' +
    '.cb-bd{position:fixed;inset:0;background:rgba(8,4,24,.55);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);z-index:79;display:none}' +
    '.cb-tog{position:relative;background:var(--cb-card);color:#fff;border:2px solid var(--cb-line);border-radius:20px;min-height:44px;min-width:44px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font:700 18px system-ui;cursor:pointer;box-shadow:0 2px 12px #0008;user-select:none;order:1}' +
    '.cb-tog .cb-dot{position:absolute;top:3px;right:7px;color:#ff5c7a;font-size:12px}' +
    '.cb-main{order:0}.cb-more{order:2}.cb-dock.cb-col .cb-more{display:none!important}' +
    '@keyframes cbIn{from{opacity:0}to{opacity:1}}@keyframes cbUp{from{translate:0 24px;opacity:0}to{translate:0 0;opacity:1}}' +
    '@media (hover:hover){.cb-pill:hover,.cb-tog:hover{box-shadow:0 0 14px var(--cb-line)!important}}' +
    '@media (min-width:900px){.cb-panel{width:min(94vw,520px)!important}}' +
    '@media (orientation:landscape) and (max-height:500px){.cb-panel{max-height:94vh!important;width:min(96vw,640px)!important}}' +
    '@media (max-width:600px){.cb-panel{left:0!important;right:0!important;top:auto!important;bottom:var(--cb-kb)!important;transform:none!important;width:100%!important;max-width:100%!important;max-height:calc(var(--cb-vh) - 16px)!important;border-radius:var(--cb-r) var(--cb-r) 0 0!important;border-bottom:0!important;box-sizing:border-box!important;padding:12px max(12px,env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))!important;animation:cbUp .18s ease-out}}' +
    '@media (prefers-reduced-motion:reduce){.cb-panel{animation:none!important}.cb-pill,.cb-tog,.cb-panel button{transition:none!important}}';
  function addC(e, c) { var s = ' ' + (e.className || '') + ' '; if (s.indexOf(' ' + c + ' ') < 0) e.className = ((e.className || '') + ' ' + c).replace(/^\s+/, ''); }
  function polish() {
    var doc = document, lastOpen = null, lastFocus = null, tog = null, bd = null;
    try { var st = doc.createElement('style'); st.textContent = CSS; (doc.head || doc.body).appendChild(st); } catch (e) {}
    try { dockEl.className = 'cb-dock'; hudEl.className = 'cb-pill cb-main'; panel.className = 'cb-panel'; } catch (e) {}
    function panels() { try { return doc.querySelectorAll ? doc.querySelectorAll('.cb-panel') : []; } catch (e) { return []; } }
    function openPanel() { var ps = panels(); for (var i = 0; i < ps.length; i++) if (ps[i].style && ps[i].style.display === 'block') return ps[i]; return null; }
    /* Perf fix (2026-11-20): this observer used to fire on sync()'s OWN DOM
       writes (bd.style.display, dot()'s innerHTML, aria attributes), creating an
       endless MutationObserver loop that froze the whole page. Disconnect while
       applying changes, then re-observe for genuine external changes. */
    var mo = null, OBS = { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] };
    function sync() {
      if (mo) { try { mo.disconnect(); } catch (e) {} }
      try {
        var p = openPanel(), ps = panels();
        for (var i = 0; i < ps.length; i++) { if (!ps[i].getAttribute('role')) ps[i].setAttribute('role', 'dialog'); if (!ps[i].getAttribute('aria-label')) ps[i].setAttribute('aria-label', 'Panel'); ps[i].setAttribute('aria-modal', 'true'); ps[i].setAttribute('tabindex', '-1'); }
        if (bd) bd.style.display = p ? 'block' : 'none';
        if (p && p !== lastOpen) { lastFocus = doc.activeElement; try { p.focus({ preventScroll: true }); } catch (e) {} }
        if (!p && lastOpen) { try { if (lastFocus && lastFocus.focus && doc.body.contains && doc.body.contains(lastFocus)) lastFocus.focus({ preventScroll: true }); } catch (e) {} lastFocus = null; }
        lastOpen = p;
        for (var j = 0; j < dockEl.children.length; j++) { var c = dockEl.children[j]; if (c !== tog && (c.className || '').indexOf('cb-main') < 0) addC(c, 'cb-more'); }
        dot();
      } catch (e) {}
      if (mo) { try { mo.observe(doc.body, OBS); } catch (e) {} }
    }
    function dot() {
      if (!tog) return;
      var col = (dockEl.className || '').indexOf('cb-col') > -1, has = false;
      for (var i = 0; i < dockEl.children.length; i++) { var c = dockEl.children[i]; if (c !== tog && (c.className || '').indexOf('cb-more') > -1 && String(c.innerHTML || c.textContent || '').indexOf('\u25CF') > -1) has = true; }
      tog.innerHTML = (col ? '\u2630' : '\u2715') + (col && has ? '<span class="cb-dot">\u25CF</span>' : '');
      tog.setAttribute('aria-expanded', col ? 'false' : 'true');
    }
    try {
      bd = doc.createElement('div'); bd.className = 'cb-bd'; bd.onclick = function () { claim('__none'); }; doc.body.appendChild(bd);
      tog = doc.createElement('div'); tog.className = 'cb-tog'; tog.setAttribute('role', 'button'); tog.setAttribute('tabindex', '0'); tog.setAttribute('aria-label', 'Buksan o isara ang menu');
      var pref = null; try { pref = localStorage.getItem('cbDockCol'); } catch (e) {}
      if (pref === '1' || (pref === null && innerWidth < 600)) addC(dockEl, 'cb-col');
      tog.onclick = function () {
        var col = (dockEl.className || '').indexOf('cb-col') > -1;
        dockEl.className = col ? dockEl.className.replace(/\s*cb-col/, '') : dockEl.className + ' cb-col';
        try { localStorage.setItem('cbDockCol', col ? '0' : '1'); } catch (e) {}
        dot();
      };
      tog.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog.onclick(); } };
      dockEl.appendChild(tog);
    } catch (e) {}
    try {
      if (typeof MutationObserver === 'function') {
        mo = new MutationObserver(sync);
        mo.observe(doc.body, OBS);
      } else setInterval(sync, 500);
    } catch (e) {}
    try {
      doc.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return; var p = openPanel(); if (!p) return;
        var f = p.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]'); if (!f.length) { e.preventDefault(); return; }
        var first = f[0], last = f[f.length - 1], a = doc.activeElement;
        if (!p.contains || !p.contains(a)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
      });
      doc.addEventListener('focusin', function (e) {
        var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.closest && t.closest('.cb-panel')) setTimeout(function () { try { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} }, 300);
      });
      var vv = window.visualViewport;
      if (vv) {
        var upd = function () { var s = doc.documentElement.style; s.setProperty('--cb-vh', vv.height + 'px'); s.setProperty('--cb-kb', Math.max(0, innerHeight - vv.height - vv.offsetTop) + 'px'); };
        vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd); upd();
      }
      var y0 = null;
      doc.addEventListener('touchstart', function (e) { var p = openPanel(); y0 = null; if (p && innerWidth <= 600 && p.scrollTop <= 0 && e.target && p.contains && p.contains(e.target) && e.touches && e.touches[0]) y0 = e.touches[0].clientY; }, { passive: true });
      doc.addEventListener('touchend', function (e) { if (y0 !== null && e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientY - y0 > 90) claim('__none'); y0 = null; }, { passive: true });
    } catch (e) {}
    sync();
  }

  /* ---------- simula ---------- */
  function boot() {
    document.body.appendChild(tintEl); dockEl.appendChild(hudEl); document.body.appendChild(dockEl); document.body.appendChild(panel);
    applyTint(); hud(); polish();
    setInterval(function () { checkin(); hud(); }, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { checkin(); hud(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.style.display === 'block') close(); });
    if (!S.intro) setTimeout(open, 1500);
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
  window.CB_PHASE_B = { api: { S: function () { return S; }, dayNum: dayNum, addCoins: addCoins, addXP: addXP, toast: toast, confetti: confetti, jingle: jingle, beep: beep, commit: commit, olv: olv, lv: lv, esc: esc, checkin: checkin, dock: dock, reg: reg, claim: claim }, off: function () { try { localStorage.setItem('cbPhaseB', 'off'); } catch (e) {} location.reload(); }, on: function () { try { localStorage.removeItem('cbPhaseB'); } catch (e) {} location.reload(); } };
})();
