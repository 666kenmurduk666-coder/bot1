/* Cyborg Cheebee AI Office - Phase D add-on (kailangan ang Phase B)
   Mga laro, saya, premyo, ulat, alerto, aral, at log. Lahat ay nasa browser lang.
   Para patayin: CB_PHASE_D.off() o REMOVE-PHASE-D.bat */
(function () {
  'use strict';
  try { if (localStorage.getItem('cbPhaseD') === 'off') return; } catch (e) {}
  var B = window.CB_PHASE_B && window.CB_PHASE_B.api;
  if (!B) { try { console.warn('Phase D: kailangan ang Phase B (public/phaseB.js). Patakbuhin ulit ang APPLY-PHASE-D.bat.'); } catch (e) {} return; }
  if (window.CB_PHASE_D) return;
  var K = 'cbPhaseDdata', D = {}, S = B.S(), esc = B.esc, $ = function (i) { return document.getElementById(i); };
  function dn() { return B.dayNum(); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuf(a) { return a.slice().sort(function () { return Math.random() - .5; }); }
  function load() {
    try { D = JSON.parse(localStorage.getItem(K) || 'null') || {}; } catch (e) { D = {}; }
    var d = { t: { day: -1 }, cookie: -1, stk: {}, chest: -1, chests: 0, mis: { day: -1, l: [], c: {}, rr: 0 }, lucky: -1, hist: {}, e0: { d: -1, v: 0 }, goal: 0, mg: { m: -1, v: 0 }, course: {}, poll: {}, bk: -1, recap: -1, bot: { day: -1, n: 0 }, ver: 2, hs: {}, unk: [], voted: -1, rh: 21, errs: [], diff: 'e', cdone: 0 };
    if (!D || typeof D !== 'object' || Array.isArray(D)) D = {};
    for (var k in d) if (D[k] === undefined) D[k] = d[k];
    sanitize(d);
  }
  var HS_OK = ['mr', 'sm', 'ty', 'hg', 'gu'], POLL_OK = ['posts', 'rank', 'look', 'games'];
  function num(x, d) { x = Number(x); return isFinite(x) ? x : d; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
  function keysOf(src, ok) { var o = {}; src = obj(src); for (var i = 0; i < ok.length; i++) if (src[ok[i]]) o[ok[i]] = 1; return o; }
  function sanitize(d) {
    var k, i, o, m, T0 = { day: -1, plays: 0, ck: 0, dn: 0, tip: 0, ttt: 0, ln: 0, hgw: 0, mrp: 0, les: 0 };
    for (k in D) if (!(k in d) && k !== 'lastF') delete D[k];
    for (k in d) if (typeof d[k] === 'number') D[k] = num(D[k], d[k]);
    o = {}; for (k in T0) o[k] = num(obj(D.t)[k], T0[k]); D.t = o;
    D.stk = keysOf(D.stk, STK);
    o = {}; for (i = 0; i < HS_OK.length; i++) if (obj(D.hs)[HS_OK[i]]) o[HS_OK[i]] = clamp(num(D.hs[HS_OK[i]], 0), 0, 1e6); D.hs = o;
    o = {}; for (i = 0; i < POLL_OK.length; i++) if (obj(D.poll)[POLL_OK[i]]) o[POLL_OK[i]] = clamp(Math.round(num(D.poll[POLL_OK[i]], 0)), 0, 1e6); D.poll = o;
    o = {}; for (i = 0; i < COURSE.length; i++) if (obj(D.course)[i]) o[i] = 1; D.course = o;
    m = obj(D.mis); D.mis = { day: num(m.day, -1), l: (Array.isArray(m.l) ? m.l : []).map(Number).filter(function (x) { return x >= 0 && x < MIS.length && x % 1 === 0; }).slice(0, 3), c: keysOf(m.c, idxs().map(String)), rr: m.rr ? 1 : 0 };
    o = {}; var hk = Object.keys(obj(D.hist)).filter(function (x) { return /^\d{1,6}$/.test(x); }).slice(-5); hk.forEach(function (x) { o[x] = num(D.hist[x], 0); }); D.hist = o;
    m = obj(D.e0); D.e0 = { d: num(m.d, -1), v: num(m.v, 0) }; m = obj(D.mg); D.mg = { m: num(m.m, -1), v: num(m.v, 0) }; m = obj(D.bot); D.bot = { day: num(m.day, -1), n: clamp(Math.round(num(m.n, 0)), 0, 99) };
    D.unk = (Array.isArray(D.unk) ? D.unk : []).filter(function (x) { return typeof x === 'string'; }).map(function (x) { return x.slice(0, 80); }).slice(0, 20);
    D.errs = (Array.isArray(D.errs) ? D.errs : []).filter(function (r) { return Array.isArray(r); }).map(function (r) { return [num(r[0], 0), String(r[1]).slice(0, 200)]; }).slice(0, 10);
    D.diff = D.diff === 'h' ? 'h' : 'e'; D.rh = [20, 21, 22].indexOf(D.rh) > -1 ? D.rh : 21;
    D.goal = clamp(Math.round(D.goal), 0, 1e9); D.chests = Math.max(0, D.chests); D.cdone = D.cdone ? 1 : 0;
    if (D.lastF !== undefined && FORT.indexOf(D.lastF) < 0) delete D.lastF;
  }
  function save() { try { localStorage.setItem(K, JSON.stringify(D)); } catch (e) { if (!window.__cbQ) { window.__cbQ = 1; try { B.toast('⚠️ Puno na ang storage ng browser. I-export ang progress mo.'); } catch (x) {} } } }

  var JOKES = ['Bakit malungkot ang computer? Kasi na-crash ang puso niya. 💔', 'Anong paboritong kanta ng bot? "Bot-bot Pilit"! 🎵', 'Bakit laging puyat ang WiFi? Kasi walang tulog ang signal! 📶',
    'Ano ang sabi ng keyboard sa mouse? "Click tayo!" 🖱️', 'Bakit magaling ang bot sa math? Kasi may calcu-lover! 🧮', 'Anong ulam ng bot? Chip-sog! 🍲', 'Bakit nag-gym ang laptop? Para mag-Windows-press! 💪', 'Ano ang paborito ng bot na inumin? Byte-ter na kape! ☕'];
  var FORT = ['Ang sipag ngayon ay kita bukas.', 'May magandang balita sa susunod na post mo!', 'Ang swerte mo ay nasa tamang hook.', 'Isang viral reel ang paparating.', 'Maging pare-pareho, at darating ang tagumpay.', 'Ngiti muna bago mag-post!', 'Ang maliit na hakbang ngayon ay malaking benta bukas.', 'Pahinga ka rin, bida!'];
  var STK = ['🌟', '🚀', '🐱', '🦄', '🍕', '🎧', '💎', '🌈', '🔥', '🎈', '🍀', '👑'];
  var TIPS = ['Gawing malinaw ang unang 3 segundo ng reel. Doon nagpapasya ang manonood.', 'Isang produkto, isang mensahe bawat reel.', 'Mag-post sa parehong oras araw-araw para masanay ang followers.', 'Gumamit ng totoong kuwento: "Bakit ko ito binili".',
    'Maglagay ng malinaw na call to action: "I-click ang link sa bio".', 'Subukan ang 2 bersyon ng caption at ihambing ang resulta.', 'Mas mabuti ang 5 magagandang reel kaysa 20 pabaya.', 'Bantayan kung aling produkto ang pinakamaraming click.', 'Sagutin ang comments, dumadami ang tiwala.', 'Magpahinga paminsan-minsan, hindi mo kailangang maubos.',
    'Itala ang mga ideya sa isang listahan para hindi ka maubusan.', 'Gamitin ang parehong istilo ng thumbnail para madaling makilala.', 'Tingnan ang mga comment: doon galing ang susunod na ideya.', 'Mag-batch: gumawa ng 5 reel sa isang upuan.', 'Isulat ang presyo at pakinabang sa unang 5 segundo.', 'Mag-check ng link bago mag-post. Ang sirang link ay nawawalang benta.', 'Ihambing ang numero kada linggo, hindi kada oras.', 'Magtanong sa dulo para dumami ang comments.', 'Ipakita ang produkto na ginagamit, hindi lang nakatayo.', 'Magdiwang ng maliit na panalo. Nakakatulong sa pagpapatuloy.'];
  var COURSE = [['Aralin 1: Ano ang affiliate?', 'Ibinabahagi mo ang link ng produkto. Kapag may bumili gamit ang link mo, may komisyon ka.'], ['Aralin 2: Ang Hook', 'Ang hook ay ang unang linya o eksena na pumipigil sa pag-scroll.'],
    ['Aralin 3: Ang tamang produkto', 'Piliin ang produktong kailangan ng tao, may magandang reviews, at madaling ipakita.'], ['Aralin 4: Pare-parehong pag-post', 'Mas mahalaga ang pagiging pare-pareho kaysa sa pagiging perpekto.'], ['Aralin 5: Suriin ang numero', 'Tingnan ang views, clicks, at benta. Ulitin ang gumagana at itigil ang hindi.'],
    ['Aralin 6: Ang Caption', 'Maikli, malinaw, at may isang utos lang. Unahin ang pakinabang sa manonood, hindi ang produkto.'], ['Aralin 7: Ang Tiwala', 'Magsabi ng totoo tungkol sa produkto, pati ang kahinaan nito. Ang tapat na review ang nagpapabalik sa tao.'], ['Aralin 8: Ang Sariling Sistema', 'Gumawa ng lingguhang gawain: magplano, mag-post, magsuri, mag-ayos. Ulitin.']];
  var GLOSS = [['Hook', 'Unang linya na nakakaagaw ng pansin'], ['CTA', 'Utos sa manonood, hal. "I-click ang link"'], ['CTR', 'Ilang porsyento ng nakakita ang nag-click'], ['Komisyon', 'Bahagi ng benta na mapupunta sa iyo'], ['Conversion', 'Bilang ng nag-click na bumili'], ['Niche', 'Tiyak na paksa o grupo ng tao'], ['Engagement', 'Likes, comments, shares'], ['Viral', 'Mabilis na kumakalat'], ['Reach', 'Ilang tao ang nakakita ng post mo'], ['Impression', 'Ilang beses lumabas ang post, kahit ng parehong tao'], ['Algorithm', 'Panuntunan ng app kung ano ang ipapakita sa tao'], ['Caption', 'Sulat sa ilalim ng post']];
  var FAQ = [['password', 'Huwag ibahagi kanino man ang password mo, kahit sa nagpapakilalang tulong.'], ['coins', 'Bonus Coins ay laro lang at naka-save sa browser na ito. Hindi ito totoong pera.'], ['streak', 'Para hindi mawala ang streak, pumasok araw-araw o bumili ng Streak Freeze sa Boss > Shop.'],
    ['alisin', 'Para alisin ang add-on, i-double-click ang REMOVE-PHASE na .bat file.'], ['backup', 'Sa tab na Log, may auto-backup araw-araw na maibabalik.'], ['reels', 'Ang laro ay hindi nagpo-post ng totoong reels. Hiwalay ito sa system mo.'],
    ['laro', 'Pindutin ang 🎲 Saya > Laro. Unang 10 laro bawat araw ang may coins.'], ['install', 'Android: menu ⋮ > Add to Home screen. iPhone: Share > Add to Home Screen.'], ['offline', 'Maaaring mabuksan offline ang mga na-load nang file, pero kailangan ng internet ang server mo.'], ['export', 'Sa tab na Log: I-export para mag-download ng backup file, I-import para ibalik.']];
  var WORDS = ['KAPE', 'BULAKLAK', 'OPISINA', 'SAGING', 'TINDAHAN', 'MAGANDA', 'PAGKAIN', 'KAIBIGAN', 'ROBOT', 'ARAW', 'PUSO', 'BAHAY', 'MASAYA', 'PAARALAN', 'DAGAT', 'PANGARAP', 'KUMPUTER', 'SIPAG'];
  var PHRASES = ['mabilis ang daliri ko', 'magandang umaga sa lahat', 'sipag at tiyaga ang puhunan', 'kape muna bago trabaho', 'isang hakbang kada araw', 'huwag sumuko kailanman', 'ang bida ay masipag'];
  var MIS = [['🎮 Maglaro ng 2 laro', function () { return D.t.plays >= 2; }], ['🥠 Buksan ang Fortune Cookie', function () { return D.t.ck; }], ['💃 Mag-Dance Party', function () { return D.t.dn; }],
    ['💡 Basahin ang Tip of the Day', function () { return D.t.tip; }], ['❎ Manalo sa Tic-Tac-Toe', function () { return D.t.ttt; }], ['🍀 Subukan ang Lucky Number', function () { return D.t.ln; }],
    ['🔤 Manalo sa Hangman', function () { return D.t.hgw; }], ['🧮 Perfect sa Math Rush (5/5)', function () { return D.t.mrp; }], ['🎓 Magbasa ng 1 aralin', function () { return D.t.les; }]];
  var TROPH = { first: ['🚪', 'Unang Pasok'], s3: ['🔥', '3 Araw'], s7: ['🔥', '7 Araw'], s30: ['🌋', '30 Araw'], l5: ['⭐', 'Lv 5'], l10: ['🌟', 'Lv 10'], rich: ['💰', '1000 Coins'], game: ['🎮', '10 Laro'], spin: ['🎡', '5 Spin'], shop: ['🛍️', '3 Binili'], egg: ['🥚', 'Sikreto'] };

  load();
  function newDay() {
    var n = dn(), d = new Date();
    if (D.t.day !== n) D.t = { day: n, plays: 0, ck: 0, dn: 0, tip: 0, ttt: 0, ln: 0, hgw: 0, mrp: 0, les: 0 };
    if (D.e0.d !== n) { if (D.e0.d > -1) { D.hist[D.e0.d] = S.earn - D.e0.v; var ks = Object.keys(D.hist).sort(); while (ks.length > 5) delete D.hist[ks.shift()]; } D.e0 = { d: n, v: S.earn }; }
    var m = d.getFullYear() * 12 + d.getMonth(); if (D.mg.m !== m) D.mg = { m: m, v: S.earn };
    if (D.mis.day !== n) D.mis = { day: n, l: shuf(idxs()).slice(0, 3), c: {}, rr: 0 };
    save();
  }
  newDay();

  var BTN = 'background:#5b3df0;color:#fff;border:0;border-radius:10px;padding:8px 12px;font:700 14px system-ui;cursor:pointer;margin:3px 2px';
  var BTN2 = BTN.replace('#5b3df0', '#3a3170'), ROW = 'display:flex;justify-content:space-between;align-items:center;background:#241c52;border-radius:10px;padding:6px 10px;margin:5px 0;gap:6px';
  var TABS = [['g', '🎮', 'Laro'], ['f', '🎉', 'Saya'], ['p', '🏆', 'Premyo'], ['u', '📊', 'Ulat'], ['a', '🔔', 'Alerto'], ['l', '📚', 'Aral'], ['x', '🧾', 'Log']];
  var cur = 'g', sub = 'd', gm = null, timers = [], deferred = null, supMsg = '';

  var hudEl = document.createElement('div'); hudEl.className = 'cb-pill';
  hudEl.style.cssText = 'background:#2a1f55;color:#fff;border:2px solid #a78bff;border-radius:20px;padding:6px 10px;min-height:44px;box-sizing:border-box;display:flex;align-items:center;font:700 13px system-ui;cursor:pointer;box-shadow:0 2px 12px #0008;user-select:none';
  hudEl.textContent = '🎲 Saya'; hudEl.setAttribute('role', 'button'); hudEl.setAttribute('tabindex', '0'); hudEl.setAttribute('aria-label', 'Buksan ang Saya at Premyo');
  var panel = document.createElement('div'); panel.className = 'cb-panel';
  panel.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(94vw,430px);max-height:82vh;max-height:82dvh;overflow:auto;overscroll-behavior:contain;background:#17123a;color:#fff;border:2px solid #a78bff;border-radius:16px;padding:12px;z-index:82;display:none;font:14px system-ui;box-shadow:0 10px 40px #000a';
  hudEl.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hudEl.onclick(); } };
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Saya at Premyo');
  hudEl.onclick = function () { if (B.checkin) B.checkin(); if (B.claim) B.claim('D'); newDay(); panel.style.display = 'block'; render(); };
  if (B.reg) B.reg('D', function () { clr(); panel.style.display = 'none'; });
  function clr() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; gm = null; }
  function bar(p) { return '<div style="height:8px;background:#352c6b;border-radius:6px"><div style="height:8px;width:' + Math.max(0, Math.min(100, p)) + '%;background:#2ecc71;border-radius:6px"></div></div>'; }
  function G(h) { var e = $('cbDG'); if (e) e.innerHTML = h; }
  function done(m) { if (m) B.toast(m); B.jingle(); B.commit(); save(); render(); }

  function logErr(w, e) { try { D.errs.unshift([Date.now(), w + ': ' + ((e && e.message) || e)]); D.errs = D.errs.slice(0, 10); save(); } catch (x) {} }
  function dl(name, text) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { try { a.remove(); } catch (x) {} }, 500); }
  function RM() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function idxs() { return MIS.map(function (_, i) { return i; }); }
  function hsLine() { var n = { mr: 'Math', sm: 'Simon', ty: 'WPM', hg: 'Hangman', gu: 'Hulaan' }, o = []; for (var k in n) if (D.hs[k]) o.push(n[k] + ' ' + esc(D.hs[k])); return o.length ? '<div style="opacity:.7;font-size:12px;margin-top:6px">🏅 ' + o.join(' · ') + '</div>' : ''; }
  /* ---------- mga laro ---------- */
  function menu() {
    return '<div style="text-align:center"><div style="opacity:.8;margin-bottom:6px">Coins at XP sa unang 10 laro bawat araw, kasama ang 🎮 Laro ng Phase B (' + Math.min(S.dp, 10) + '/10)</div>' +
      [['rps', '✊ Bato-Bato-Pik'], ['ttt', '❎ Tic-Tac-Toe'], ['mr', '🧮 Math Rush'], ['sm', '🎵 Simon Says'], ['ty', '⌨️ Typing'], ['hg', '🔤 Hangman'], ['gu', '🔢 Hulaan']].map(function (g) { return '<button data-a="' + g[0] + '" style="' + BTN + '">' + g[1] + '</button>'; }).join('') + hsLine() + '<div style="margin-top:6px"><button data-a="dif" style="' + BTN2 + '">❎ Tic-Tac-Toe: ' + (D.diff === 'h' ? 'Mahirap (mas malaking premyo)' : 'Madali') + '</button></div></div>';
  }
  function fin(msg, coins, won, score) {
    var gk = gm && gm.k; if (gk && score != null && isFinite(score) && (!D.hs[gk] || score > D.hs[gk])) D.hs[gk] = score;
    D.t.plays++; S.dp++; var got = 0, okp = S.dp <= 10; if (okp) { S.played++; S.q.game = 1; S.work++; if (coins > 0) got = B.addCoins(coins); }
    if (won) D.t.ttt = D.t.ttt || (gm && gm.k === 'ttt' ? 1 : 0);
    if (okp) B.addXP(8); B.jingle(); save(); B.commit(); gm = null;
    G('<div style="text-align:center;padding:10px"><div style="font-size:16px">' + msg + '</div><div style="margin:8px 0">' + (got ? '+' + got + ' 🪙' : (!okp ? 'Tapos na ang coins at XP sa laro ngayon' : '')) + '</div><button data-a="gm" style="' + BTN + '">↩ Balik</button></div>');
  }
  var WL = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  function win(b, p) { for (var i = 0; i < 8; i++) if (b[WL[i][0]] === p && b[WL[i][1]] === p && b[WL[i][2]] === p) return true; return false; }
  function tDraw() {
    var h = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
    for (var i = 0; i < 9; i++) h += '<button data-a="tt" data-v="' + i + '" style="' + BTN2 + ';height:64px;font-size:28px">' + (gm.b[i] || '·') + '</button>';
    G(h + '</div>');
  }
  function botMove(b) {
    var i, t;
    for (var p = 0; p < 2; p++) { var m = p ? 'X' : 'O'; for (i = 0; i < 9; i++) if (!b[i]) { b[i] = m; var w = win(b, m); b[i] = ''; if (w) return i; } }
    if (!b[4]) return 4; t = []; for (i = 0; i < 9; i++) if (!b[i]) t.push(i); return pick(t);
  }
  function mmx(b, isO) {
    if (win(b, 'O')) return 1; if (win(b, 'X')) return -1; if (b.indexOf('') < 0) return 0;
    var best = isO ? -9 : 9, i, sc;
    for (i = 0; i < 9; i++) if (!b[i]) { b[i] = isO ? 'O' : 'X'; sc = mmx(b, !isO); b[i] = ''; best = isO ? Math.max(best, sc) : Math.min(best, sc); }
    return best;
  }
  function bestMove(b) { var bi = -1, bs = -9, i, sc; for (i = 0; i < 9; i++) if (!b[i]) { b[i] = 'O'; sc = mmx(b, false); b[i] = ''; if (sc > bs) { bs = sc; bi = i; } } return bi; }
  function botPick(b) { return (D.diff === 'h' && Math.random() < .75) ? bestMove(b) : botMove(b); }
  function mrQ() {
    var a = 2 + Math.floor(Math.random() * 11), b = 2 + Math.floor(Math.random() * 9), op = pick(['+', '-', '×']), r = op === '+' ? a + b : op === '-' ? a - b : a * b, o = [r];
    while (o.length < 4) { var x = r + Math.floor(Math.random() * 11) - 5; if (o.indexOf(x) < 0) o.push(x); }
    gm.q = a + ' ' + op + ' ' + b; gm.r = r; gm.o = shuf(o);
  }
  function mrDraw() { G('<div style="text-align:center;font-size:22px;margin:8px">' + gm.q + ' = ?</div><div style="text-align:center">' + gm.o.map(function (x) { return '<button data-a="mro" data-v="' + x + '" style="' + BTN + ';font-size:18px;min-width:64px">' + x + '</button>'; }).join('') + '</div><div style="text-align:center;opacity:.7">Tanong ' + (gm.n + 1) + '/5 · Tama: ' + gm.ok + '</div>'); }
  var CL = ['🔴', '🟢', '🔵', '🟡'];
  function smDraw(lit) { G('<div style="text-align:center;margin-bottom:6px">Level ' + gm.s.length + (gm.show ? ' · Panoorin...' : ' · Ulitin!') + '</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' + CL.map(function (c, i) { return '<button data-a="smb" data-v="' + i + '" style="' + (lit === i ? BTN : BTN2) + ';height:70px;font-size:34px;opacity:' + (lit === i || !gm.show ? 1 : .6) + '">' + c + '</button>'; }).join('') + '</div>'); }
  function smRound() {
    gm.s.push(Math.floor(Math.random() * 4)); gm.p = 0; gm.show = true; smDraw(-1);
    gm.s.forEach(function (c, i) {
      timers.push(setTimeout(function () { if (gm) { smDraw(c); B.beep(300 + c * 120, .15); } }, 700 + i * 650));
      timers.push(setTimeout(function () { if (gm) smDraw(-1); }, 700 + i * 650 + 400));
    });
    timers.push(setTimeout(function () { if (gm) { gm.show = false; smDraw(-1); } }, 700 + gm.s.length * 650));
  }
  function hgDraw() {
    var w = gm.w.split('').map(function (c) { return gm.g[c] ? c : '_'; }).join(' ');
    G('<div style="text-align:center;font-size:26px;letter-spacing:3px;margin:8px">' + w + '</div><div style="text-align:center">❤️ ' + gm.l + '</div><div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:6px">' +
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(function (c) { return '<button data-a="hgl" data-v="' + c + '" style="' + (gm.g[c] ? BTN2 : BTN) + ';padding:6px 8px;margin:1px;opacity:' + (gm.g[c] ? .4 : 1) + '">' + c + '</button>'; }).join('') + '</div>');
  }
  function tyDraw() {
    G('<div style="text-align:center">I-type ang pangungusap (hindi mahalaga ang laki ng letra):<div style="font-size:17px;margin:8px;background:#241c52;border-radius:8px;padding:8px">' + gm.p + '</div><input id="cbTy" style="width:90%;padding:8px;border-radius:8px;border:0" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"><br><button data-a="tyo" style="' + BTN + '">✔ Tapos</button></div>');
    var ti = $('cbTy');
    if (ti) { ti.addEventListener('input', function () { if (gm && gm.k === 'ty' && !gm.t0) gm.t0 = Date.now(); }); ti.addEventListener('paste', function (e) { e.preventDefault(); }); }
  }

  function guDraw(hint) { G('<div style="text-align:center">Hulaan ang numero (1-50). Natitira: ' + (6 - gm.t) + '<div style="margin:8px;font-size:16px">' + (hint || '') + '</div><input id="cbGu" type="number" min="1" max="50" inputmode="numeric" style="width:90px;padding:8px;border-radius:8px;border:0"><br><button data-a="guo" style="' + BTN + '">Hulaan</button></div>'); }
  var BEATS = { 0: 2, 1: 0, 2: 1 }; /* 0=bato, 1=papel, 2=gunting: bato>gunting, papel>bato, gunting>papel */
  function rpsResult(me, bt) { return me === bt ? 'tie' : (BEATS[me] === bt ? 'win' : 'lose'); }
  function normT(x) { return String(x).toLowerCase().replace(/\s+/g, ' ').trim(); }
  function lev(a, b) { var m = a.length, n = b.length, i, j, p = [], prev, t; for (j = 0; j <= n; j++) p[j] = j; for (i = 1; i <= m; i++) { prev = p[0]; p[0] = i; for (j = 1; j <= n; j++) { t = p[j]; p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); prev = t; } } return p[n]; }
  function typeAcc(p, inp) { p = normT(p); inp = normT(inp); if (!inp) return 0; return Math.max(0, 1 - lev(p, inp) / Math.max(p.length, 1)); }
  function gameAct(a, v) {
    var i;
    if (a === 'dif') { D.diff = D.diff === 'h' ? 'e' : 'h'; save(); return G(menu()); }
    if (a === 'gu') { gm = { k: 'gu', n: 1 + Math.floor(Math.random() * 50), t: 0 }; return guDraw(''); }
    if (a === 'guo') { if (!gm || gm.k !== 'gu') return; var gv = parseInt(($('cbGu') || {}).value, 10); if (!(gv >= 1 && gv <= 50)) return guDraw('Pumili ng 1 hanggang 50 lang.'); gm.t++; if (gv === gm.n) return fin('🔢 Tama! ' + gm.n + ' sa ' + gm.t + ' hulaan', Math.max(3, 21 - gm.t * 3), 0, 7 - gm.t); if (gm.t >= 6) return fin('Ang sagot ay ' + gm.n, 2); return guDraw(gv < gm.n ? '⬆️ Mas mataas' : '⬇️ Mas mababa'); }
    if (a === 'gm') { clr(); return G(menu()); }
    if (a === 'rps') { gm = { k: 'rps' }; return G('<div style="text-align:center;font-size:16px">Pumili:<br>' + ['✊', '✋', '✌️'].map(function (e, j) { return '<button data-a="rp" data-v="' + j + '" style="' + BTN + ';font-size:30px">' + e + '</button>'; }).join('') + '</div>'); }
    if (a === 'rp') { var me = +v; if (!(me >= 0 && me <= 2)) return; var bt = Math.floor(Math.random() * 3), E = ['✊', '✋', '✌️'], res = rpsResult(me, bt); return res === 'tie' ? G('<div style="text-align:center">' + E[me] + ' vs ' + E[bt] + '<br>Tabla!<br><button data-a="rps" style="' + BTN + '">Ulit</button></div>') : fin(E[me] + ' vs ' + E[bt] + (res === 'win' ? ' · NANALO KA! 🎉' : ' · Talo, ulit!'), res === 'win' ? 8 : 2); }
    if (a === 'ttt') { gm = { k: 'ttt', b: ['', '', '', '', '', '', '', '', ''] }; return tDraw(); }
    if (a === 'tt') { if (!gm || gm.k !== 'ttt' || gm.b[+v]) return; gm.b[+v] = 'X'; if (win(gm.b, 'X')) { D.t.ttt = 1; return fin('❎ Panalo ka sa Tic-Tac-Toe! 🎉', D.diff === 'h' ? 30 : 15, 1); } if (gm.b.indexOf('') < 0) return fin('Tabla!', D.diff === 'h' ? 10 : 5); gm.b[botPick(gm.b)] = 'O'; if (win(gm.b, 'O')) return fin('Natalo ka. Ulit!', 2); if (gm.b.indexOf('') < 0) return fin('Tabla!', D.diff === 'h' ? 10 : 5); return tDraw(); }
    if (a === 'mr') { gm = { k: 'mr', n: 0, ok: 0 }; mrQ(); return mrDraw(); }
    if (a === 'mro') { if (!gm || gm.k !== 'mr') return; if (+v === gm.r) gm.ok++; B.beep(+v === gm.r ? 800 : 200, .08); gm.n++; if (gm.n >= 5) { if (gm.ok === 5) D.t.mrp = 1; return fin('🧮 ' + gm.ok + '/5 tama', gm.ok * 4, 0, gm.ok); } mrQ(); return mrDraw(); }
    if (a === 'sm') { gm = { k: 'sm', s: [], p: 0, show: true }; return smRound(); }
    if (a === 'smb') { if (!gm || gm.k !== 'sm' || gm.show) return; B.beep(300 + (+v) * 120, .1); if (+v !== gm.s[gm.p]) { if (gm.s.length <= 1) { clr(); return G('<div style="text-align:center;padding:10px">🎵 Mali sa Level 1. Hindi ito binilang bilang laro.<br><button data-a="sm" style="' + BTN + '">Ulit</button><button data-a="gm" style="' + BTN2 + '">↩ Balik</button></div>'); } return fin('🎵 Umabot ka sa Level ' + (gm.s.length - 1), Math.min(gm.s.length - 1, 10) * 5, 0, gm.s.length - 1); }
      smDraw(+v); timers.push(setTimeout(function () { if (gm && gm.k === 'sm' && !gm.show) smDraw(-1); }, 220)); gm.p++; if (gm.p >= gm.s.length) { gm.show = true; timers.push(setTimeout(function () { if (gm) smRound(); }, 600)); } return; }
    if (a === 'ty') { gm = { k: 'ty', p: pick(PHRASES), t: Date.now(), t0: 0 }; return tyDraw(); }
    if (a === 'tyo') { if (!gm || gm.k !== 'ty') return; var inp = ($('cbTy') || {}).value || '', sec = (Date.now() - (gm.t0 || gm.t)) / 1000, acc = typeAcc(gm.p, inp), wpm = Math.min(150, Math.round(gm.p.split(' ').length / Math.max(sec, 1) * 60)); return fin('⌨️ ' + Math.round(acc * 100) + '% tama · ' + wpm + ' WPM', acc >= .9 ? Math.min(40, Math.round(wpm / 2)) : acc >= .5 ? 3 : 0, 0, acc >= .9 ? wpm : null); }
    if (a === 'hg') { gm = { k: 'hg', w: pick(WORDS), g: {}, l: 6 }; return hgDraw(); }
    if (a === 'hgl') { if (!gm || gm.k !== 'hg' || gm.g[v]) return; gm.g[v] = 1; if (gm.w.indexOf(v) < 0) gm.l--; var all = gm.w.split('').every(function (c) { return gm.g[c]; }); if (all) { D.t.hgw = 1; return fin('🔤 Tama! ' + gm.w, 10 + gm.l * 4, 0, gm.l); } if (gm.l <= 0) return fin('Ang sagot: ' + gm.w, 2); return hgDraw(); }
  }

  /* ---------- saya ---------- */
  function dance() {
    D.t.dn = D.t.dn || 0; var first = !D.t.dn; D.t.dn = 1;
    var em = ['🤖', '💃', '🕺', '🎉', '🤖', '🎶', '✨', '💃'];
    em.forEach(function (c, i) {
      var e = document.createElement('div'); e.textContent = c;
      e.style.cssText = 'position:fixed;bottom:20px;left:' + (8 + i * 11) + 'vw;font-size:40px;z-index:95;pointer-events:none';
      document.body.appendChild(e);
      try { if (!RM()) e.animate([{ transform: 'translateY(0) rotate(-12deg)' }, { transform: 'translateY(-70px) rotate(12deg)' }], { duration: 450 + i * 40, iterations: 16, direction: 'alternate' }); } catch (x) {}
      setTimeout(function () { try { e.remove(); } catch (x) {} }, 7500);
    });
    [523, 659, 784, 659, 523, 784, 880, 784].forEach(function (f, i) { setTimeout(function () { B.beep(f, .15, 'triangle'); }, i * 450); });
    if (first) { B.addCoins(10); B.addXP(10); }
    B.toast('💃 Dance Party!' + (first ? ' +10 🪙' : '')); B.commit(); save(); render();
  }
  var botOn = false;
  function walker() {
    setTimeout(walker, (10 + Math.random() * 10) * 60000);
    var n = dn(); if (D.bot.day !== n) D.bot = { day: n, n: 0 };
    if (botOn || document.hidden || panel.style.display === 'block' || D.bot.n >= 5) return;
    botOn = true;
    var e = document.createElement('div'); e.textContent = '🧑‍💼';
    e.style.cssText = 'position:fixed;bottom:calc(70px + env(safe-area-inset-bottom,0px));left:0;font-size:36px;z-index:70;cursor:pointer';
    function end() { botOn = false; try { e.remove(); } catch (x) {} }
    e.onclick = function () { var g = B.addCoins(1 + Math.floor(Math.random() * 3)); D.bot.n++; save(); B.beep(700, .1); B.toast('🧑‍💼 Customer bot: +' + g + ' 🪙 (' + D.bot.n + '/5 ngayon)'); B.commit(); e.onclick = null; e.textContent = '😊'; setTimeout(end, 800); };
    document.body.appendChild(e);
    try { var an = e.animate([{ transform: 'translateX(-60px)' }, { transform: 'translateX(' + (innerWidth + 60) + 'px)' }], { duration: 14000, easing: 'linear' }); an.onfinish = end; } catch (x) { setTimeout(end, 3000); }
  }
  function fun() {
    var n = dn(), h = '<div style="' + ROW + '"><span>😂 Joke of the Day</span></div><div style="padding:6px 10px">' + JOKES[n % JOKES.length] + '</div>';
    h += '<div style="' + ROW + '"><span>🥠 Fortune Cookie</span>' + (D.cookie === n ? '<span>✅</span>' : '<button data-a="ck" style="' + BTN + '">Buksan</button>') + '</div>';
    if (D.cookie === n && D.lastF) h += '<div style="padding:4px 10px;opacity:.9">"' + esc(D.lastF) + '"</div>';
    h += '<div style="' + ROW + '"><span>💃 Dance Party</span><button data-a="dn" style="' + BTN + '">Sayaw!</button></div>';
    h += '<div style="margin-top:6px"><b>🎴 Sticker Collection (' + Object.keys(D.stk).length + '/' + STK.length + ')</b><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;font-size:26px">';
    STK.forEach(function (s) { h += '<span style="opacity:' + (D.stk[s] ? 1 : .25) + '">' + (D.stk[s] ? s : '❔') + '</span>'; });
    return h + '</div></div><div style="opacity:.7;font-size:12px;margin-top:8px">Minsan may Customer bot na maglalakad sa screen. Pindutin para sa coins!</div>';
  }
  function giveSticker() { var s = pick(STK), isNew = !D.stk[s]; D.stk[s] = 1; return isNew ? s : ''; }

  /* ---------- premyo ---------- */
  function prizes() {
    var n = dn(), wk = S.wk, h = '<b>🎁 Weekly Chest</b><div style="' + ROW + '"><span>📦 Pumasok ng 5 araw (' + Math.min(S.wdays, 5) + '/5)</span>' +
      (D.chest === wk ? '<span>✅</span>' : S.wdays >= 5 ? '<button data-a="chest" style="' + BTN + '">Buksan!</button>' : '') + '</div>';
    h += '<b>🎯 Misyon ngayon</b> <span style="opacity:.7">(+30🪙 bawat isa)</span>';
    D.mis.l.forEach(function (idx, j) {
      var ok = MIS[idx][1](), c = D.mis.c[idx];
      h += '<div style="' + ROW + '"><span>' + MIS[idx][0] + '</span>' + (c ? '✅' : ok ? '<button data-a="mc" data-v="' + idx + '" style="' + BTN + '">+30</button>' : (D.mis.rr < 1 ? '<button data-a="rr" data-v="' + j + '" style="' + BTN2 + '">🔄</button>' : '<span style="opacity:.5">hindi pa</span>')) + '</div>';
    });
    h += '<div style="' + ROW + '"><span>🍀 Lucky Number (pumili ng 1-9)</span></div>';
    if (D.lucky === n) h += '<div style="padding:4px 10px">✅ Nasubukan mo na ngayon</div>'; else { h += '<div style="text-align:center">'; for (var i = 1; i <= 9; i++) h += '<button data-a="ln" data-v="' + i + '" style="' + BTN + ';padding:6px 10px">' + i + '</button>'; h += '</div>'; }
    var wd = new Date().getDay(); h += '<div style="margin-top:6px">' + ((wd === 0 || wd === 6) ? '⚡ <b>DOUBLE XP WEEKEND</b> ngayon!' : '⚡ Double XP tuwing Sabado at Linggo') + '</div>';
    var wx = S.wxp, tt = wx >= 600 ? '👑 Reel King' : wx >= 300 ? '🔗 Link Master' : wx >= 100 ? '⚡ Masipag' : '🌱 Baguhan';
    h += '<div style="margin-top:6px">Titulo ngayong linggo: <b>' + tt + '</b> (' + wx + ' XP)</div><b style="display:block;margin-top:8px">🏆 Trophy Room</b><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px">';
    for (var k in TROPH) h += '<div style="background:#241c52;border-radius:10px;padding:6px 2px;text-align:center;font-size:11px;opacity:' + (S.badges[k] ? 1 : .3) + '"><div style="font-size:22px">' + (S.badges[k] ? TROPH[k][0] : '🔒') + '</div>' + TROPH[k][1] + '</div>';
    return h + '</div><div style="margin-top:6px;opacity:.8">📦 Chest na nabuksan: ' + esc(D.chests) + ' · 🎴 Sticker: ' + Object.keys(D.stk).length + '/' + STK.length + '</div>';
  }

  /* ---------- ulat ---------- */
  function report() {
    var n = dn(), pc = 0; try { var c = JSON.parse(localStorage.getItem('cbPhaseCdata') || '{}'); if (c.pd === n) pc = Number(c.pc) || 0; } catch (e) {}
    var qd = (S.qc.login ? 1 : 0) + (S.qc.game ? 1 : 0) + (S.qc.spin ? 1 : 0) + (S.qc.all ? 1 : 0), sc = Math.round(Math.min(100, pc) * .5 + qd / 4 * 30 + (S.claimed === n ? 20 : 0));
    var gr = sc >= 85 ? 'A' : sc >= 70 ? 'B' : sc >= 55 ? 'C' : sc >= 40 ? 'D' : 'F', today = S.earn - D.e0.v, y = D.hist[n - 1] || 0, ar = today > y ? '↑' : today < y ? '↓' : '=';
    var h = '<div style="text-align:center;padding:8px"><div style="font-size:54px;font-weight:800;color:' + (gr === 'A' ? '#2ecc71' : gr === 'F' ? '#e74c3c' : '#f1c40f') + '">' + gr + '</div><div>Report Card ngayong araw (' + sc + '/100)</div></div>';
    h += '<div style="' + ROW + '"><span>🪙 Kinita ngayon</span><b>' + today + ' ' + ar + '</b></div><div style="' + ROW + '"><span>🌅 Kahapon</span><b>' + y + '</b></div>';
    h += '<div style="' + ROW + '"><span>📝 Posts (Boss)</span><b>' + pc + '/100</b></div><div style="' + ROW + '"><span>✅ Quests tapos</span><b>' + qd + '/4</b></div><div style="' + ROW + '"><span>🔥 Streak</span><b>' + S.streak + ' araw</b></div>';
    var gp = D.goal ? Math.round((S.earn - D.mg.v) / D.goal * 100) : 0;
    h += '<b style="display:block;margin-top:8px">🎯 Goal ngayong buwan (coins)</b>' + (D.goal ? bar(gp) + '<div style="font-size:12px;opacity:.8">' + (S.earn - D.mg.v) + ' / ' + D.goal + ' (' + gp + '%)</div>' : '') +
      '<div style="margin-top:4px"><input id="cbGoal" type="number" value="' + esc(D.goal || '') + '" placeholder="hal. 5000" style="width:100px;padding:6px;border-radius:8px;border:0"> <button data-a="goal" style="' + BTN + '">I-set</button></div>';
    return h;
  }

  /* ---------- alerto ---------- */
  function alerts() {
    var perm = (typeof Notification !== 'undefined') ? Notification.permission : 'wala';
    function tg(a, on, t) { return '<div style="' + ROW + '"><span>' + t + '</span><button data-a="' + a + '" style="' + (on ? BTN : BTN2) + '">' + (on ? 'ON' : 'OFF') + '</button></div>'; }
    var h = tg('qh', S.quiet, '🌙 Quiet hours (walang tunog 10PM-7AM)') + tg('vb', S.vib !== 0, '📳 Vibration sa cellphone');
    h += '<div style="' + ROW + '"><span>🔊 Tunog</span><span>' + [['sine', 'Malambot'], ['square', 'Retro'], ['triangle', 'Masaya']].map(function (w) { return '<button data-a="wv" data-v="' + w[0] + '" style="' + ((S.wave || 'sine') === w[0] ? BTN : BTN2) + ';padding:6px 8px">' + w[1] + '</button>'; }).join('') + '</span></div>';
    h += '<div style="' + ROW + '"><span>🔔 Notification (kapag bukas ang laro)</span>' + (perm === 'granted' ? '<span>✅</span>' : perm === 'denied' ? '<span style="opacity:.6">Hinarang</span>' : '<button data-a="nt" style="' + BTN + '">Payagan</button>') + '</div>';
    h += '<div style="' + ROW + '"><span>🌙 Recap sa gabi</span><span>' + [20, 21, 22].map(function (x) { return '<button data-a="rh" data-v="' + x + '" style="' + (D.rh === x ? BTN : BTN2) + ';padding:6px 8px">' + (x - 12) + 'PM</button>'; }).join('') + '</span></div>';
    h += '<div style="' + ROW + '"><span>📲 I-install bilang app</span>' + (deferred ? '<button data-a="ins" style="' + BTN + '">I-install</button>' : '<span style="font-size:12px;opacity:.7;text-align:right">Android: menu ⋮ → Add to Home screen. iPhone: Share → Add to Home Screen</span>') + '</div>';
    return h + '<div style="opacity:.7;font-size:12px;margin-top:8px">Paalala: gumagana lang ang mga alerto habang bukas ang laro. Para sa install, kailangan ng https o localhost.</div>';
  }

  /* ---------- aral ---------- */
  function learn() {
    var n = dn(), h = '<div style="display:flex;flex-wrap:wrap">' + [['d', '💡 Tip'], ['k', '🎓 Kurso'], ['t', '❓ Tanong'], ['b', '📰 Balita']].map(function (t) { return '<button data-a="sub" data-v="' + t[0] + '" style="' + (sub === t[0] ? BTN : BTN2) + '">' + t[1] + '</button>'; }).join('') + '</div>', i;
    if (sub === 'd') {
      h += '<div style="' + ROW + ';display:block"><b>💡 Tip of the Day</b><div style="margin-top:4px">' + TIPS[n % TIPS.length] + '</div></div>' + (D.t.tip ? '<div>✅ Nabasa na</div>' : '<button data-a="tip" style="' + BTN + '">Nabasa ko na (+5 XP)</button>');
      h += '<div style="' + ROW + ';display:block;margin-top:10px"><b>📖 Case Study</b><div style="margin-top:4px;opacity:.9">Si Ana ay nag-post ng 1 reel kada araw sa loob ng 30 araw, laging may malinaw na hook at isang link lang. Pagkatapos ng isang buwan, dumoble ang clicks niya, hindi dahil sa swerte kundi dahil sa pagiging pare-pareho. (Halimbawa lang ito.)</div></div>';
    } else if (sub === 'k') {
      for (i = 0; i < COURSE.length; i++) h += '<div style="' + ROW + ';display:block"><b>' + COURSE[i][0] + (D.course[i] ? ' ✅' : '') + '</b><div style="margin:4px 0;opacity:.9">' + COURSE[i][1] + '</div>' + (D.course[i] ? '' : '<button data-a="cs" data-v="' + i + '" style="' + BTN + '">Nabasa ko (+20 XP)</button>') + '</div>';
    } else if (sub === 't') {
      h += '<div style="margin:6px 0"><input id="cbSup" placeholder="Magtanong (hal. password, coins)" style="width:68%;padding:7px;border-radius:8px;border:0"> <button data-a="sup" style="' + BTN + '">Tanong</button></div>' + (supMsg ? '<div style="background:#241c52;border-radius:10px;padding:8px">🤖 ' + supMsg + '</div>' : '') + FAQ.map(function (f, j) { return '<button data-a="supq" data-v="' + j + '" style="' + BTN2 + ';padding:5px 8px">' + f[0] + '</button>'; }).join('');
      h += '<b style="display:block;margin-top:8px">📘 Glossary</b>'; for (i = 0; i < GLOSS.length; i++) h += '<div style="padding:3px 6px"><b>' + GLOSS[i][0] + '</b>: ' + GLOSS[i][1] + '</div>';
    } else {
      h += '<b style="display:block;margin-top:6px">🆕 Ano ang bago</b><div style="padding:4px 8px">• Phase D: mga laro, saya, premyo, ulat, alerto<br>• Phase C: tycoon na Opisina Boss<br>• Phase B: daily reward, quests, spin, shop</div>';
      h += '<b style="display:block;margin-top:8px">🗺️ Roadmap</b><div style="padding:4px 8px">✅ Daily rewards · ✅ Tycoon · ✅ Mga laro<br>🔜 Konekta sa totoong posts at Shopee links<br>🔜 Totoong leaderboard ng mga player<br>🔜 Mas magandang itsura ng opisina</div>';
      h += '<b style="display:block;margin-top:8px">🗳️ Poll: Ano ang gusto mong sunod?</b>';
      [['posts', 'Totoong posts sa Boss'], ['rank', 'Totoong leaderboard'], ['look', 'Magandang opisina'], ['games', 'Dagdag na laro']].forEach(function (o) { h += '<div style="' + ROW + '"><span>' + o[1] + '</span><button data-a="pl" data-v="' + o[0] + '" style="' + BTN2 + '">👍 ' + (D.poll[o[0]] || 0) + '</button></div>'; });
    }
    return h;
  }

  /* ---------- log ---------- */
  function logTab() {
    var h = '<b>🧾 Huling nangyari</b>', L = S.log || [];
    if (!L.length) h += '<div style="opacity:.7;padding:6px">Wala pa.</div>';
    L.slice(0, 15).forEach(function (r) { var d = new Date(r[0]); h += '<div style="padding:3px 6px;font-size:13px"><span style="opacity:.6">' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '</span> ' + esc(r[1]) + '</div>'; });
    return h + '<div style="margin-top:10px"><b>💾 Auto-backup</b><div style="opacity:.8;font-size:13px">' + (D.bk > -1 ? 'May backup mula ' + (dn() - D.bk === 0 ? 'ngayon' : (dn() - D.bk) + ' araw na ang nakalipas') : 'Wala pa') + '</div><button data-a="rst" style="' + BTN2 + '">↩ I-restore ang huling backup</button></div>' + logExtra();
  }

  function logExtra() {
    var h = '<div style="margin-top:10px"><b>🧰 Data</b><div><button data-a="ex" style="' + BTN + '">📤 I-export</button><button data-a="im" style="' + BTN2 + '">📥 I-import</button><button data-a="rs" style="' + BTN2 + '">🗑 I-reset ang Phase D</button>' + (hasUndo() ? '<button data-a="undo" style="' + BTN2 + '">↩ I-undo ang huling restore</button>' : '') + '</div></div>';
    if (D.unk.length) h += '<div style="margin-top:10px"><b>❓ Tanong na hindi nasagot</b>' + D.unk.slice(0, 8).map(function (q) { return '<div style="font-size:13px;padding:2px 6px">' + esc(q) + '</div>'; }).join('') + '</div>';
    if (D.errs.length) h += '<div style="margin-top:10px"><b>⚠️ Errors</b>' + D.errs.slice(0, 5).map(function (r) { return '<div style="font-size:12px;opacity:.8;padding:2px 6px">' + esc(r[1]) + '</div>'; }).join('') + '</div>';
    return h;
  }
  function selfTest() {
    var bad = [], fns = { menu: menu, fun: fun, prizes: prizes, report: report, alerts: alerts, learn: learn, logTab: logTab };
    ['S', 'dayNum', 'addCoins', 'addXP', 'toast', 'confetti', 'jingle', 'beep', 'commit', 'lv'].forEach(function (k) { if (typeof B[k] !== 'function') bad.push('B.' + k); });
    for (var k in fns) { try { if (typeof fns[k]() !== 'string') bad.push(k + ' hindi string'); } catch (e) { bad.push(k + ': ' + e.message); } }
    if (!panel.parentNode) bad.push('panel wala sa page');
    return { ok: !bad.length, problems: bad };
  }
  function render() {
    clr();
    var h = '<div style="display:flex;justify-content:space-between;align-items:center"><b>🎲 Saya at Premyo</b><button data-a="x" aria-label="Isara" style="' + BTN2 + '">✕</button></div><div style="margin:4px 0">🪙 <b>' + S.coins + '</b> &nbsp; ⭐ Lv ' + B.lv() + '</div><div style="display:flex;flex-wrap:wrap">';
    for (var i = 0; i < TABS.length; i++) h += '<button data-a="tab" data-v="' + TABS[i][0] + '" style="' + (cur === TABS[i][0] ? BTN : BTN2) + ';padding:6px 8px">' + TABS[i][1] + ' ' + TABS[i][2] + '</button>';
    h += '</div><div style="margin-top:8px">' + (cur === 'g' ? '<div id="cbDG">' + menu() + '</div>' : cur === 'f' ? fun() : cur === 'p' ? prizes() : cur === 'u' ? report() : cur === 'a' ? alerts() : cur === 'l' ? learn() : logTab()) + '</div>';
    panel.innerHTML = h;
  }

  function hasUndo() { try { return !!localStorage.getItem('cbUndo'); } catch (e) { return false; } }
  function chkJ(x) { if (x == null) return null; if (typeof x !== 'string' || x.length > 150000) throw new Error('mali ang laki'); var j = JSON.parse(x); if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('mali ang laman'); return j; }
  function applySnap(o, label) {
    var jb = chkJ(o.b), jc = chkJ(o.c), jd = chkJ(o.d); if (!jb && !jc && !jd) throw new Error('walang laman');
    var pv = jb ? Math.round(Number(jb.coins) || 0) : '?', pl = jb ? Math.floor(Math.sqrt(Math.max(0, Number(jb.xp) || 0) / 40)) + 1 : '?', ps = jb ? Math.round(Number(jb.streak) || 0) : '?';
    if (!confirm(label + '\nCoins: ' + pv + ' · Level: ' + pl + ' · Streak: ' + ps + '\n\nPapalitan nito ang progress mo ngayon. Tuloy?')) return;
    localStorage.setItem('cbUndo', JSON.stringify({ b: localStorage.getItem('cbPhaseBdata'), c: localStorage.getItem('cbPhaseCdata'), d: localStorage.getItem(K), t: Date.now() }));
    if (o.b) localStorage.setItem('cbPhaseBdata', o.b); if (o.c) localStorage.setItem('cbPhaseCdata', o.c); if (o.d) localStorage.setItem(K, o.d); location.reload();
  }
  function onPanel(ev) {
    var t = ev.target.closest ? ev.target.closest('[data-a]') : null; if (!t) return;
    var a = t.getAttribute('data-a'), v = t.getAttribute('data-v'), n = dn(), g, i;
    newDay();
    if (a === 'x') { clr(); panel.style.display = 'none'; return; }
    if (a === 'tab') { cur = v; return render(); }
    if (cur === 'g' && a !== 'tab') return gameAct(a, v);
    if (a === 'ck') { if (D.cookie !== n) { D.cookie = n; D.t.ck = 1; D.lastF = pick(FORT); var s = giveSticker(); g = B.addCoins(10); B.addXP(5); return done('🥠 +' + g + ' 🪙' + (s ? ' · Bagong sticker ' + s : '')); } return; }
    if (a === 'dn') return dance();
    if (a === 'chest') { if (D.chest !== S.wk && S.wdays >= 5) { D.chest = S.wk; D.chests++; g = B.addCoins(200 + Math.floor(Math.random() * 201), 1); var s2 = giveSticker(); B.addXP(60); B.confetti(); return done('📦 +' + g + ' 🪙' + (s2 ? ' · ' + s2 : '')); } return; }
    if (a === 'mc') { var ix = +v; if (MIS[ix] && !D.mis.c[ix] && MIS[ix][1]()) { D.mis.c[ix] = 1; g = B.addCoins(30, 1); B.addXP(15); S.work++; return done('🎯 +' + g + ' 🪙'); } return; }
    if (a === 'rr') { if (!(+v >= 0 && +v < D.mis.l.length)) return; if (D.mis.rr < 1) { var pool = idxs().filter(function (x) { return D.mis.l.indexOf(x) < 0; }); D.mis.l[+v] = pick(pool); D.mis.rr = 1; save(); return render(); } return; }
    if (a === 'ln') { if (!(+v >= 1 && +v <= 9)) return; if (D.lucky !== n) { D.lucky = n; D.t.ln = 1; var m = Math.ceil(Math.random() * 9); if (m === +v) { g = B.addCoins(100); B.confetti(); return done('🍀 TAMA! +' + g + ' 🪙'); } g = B.addCoins(5); return done('Ang numero ay ' + m + '. +' + g + ' 🪙'); } return; }
    if (a === 'goal') { D.goal = Math.max(0, parseInt(($('cbGoal') || {}).value, 10) || 0); save(); return render(); }
    if (a === 'qh') { S.quiet = S.quiet ? 0 : 1; B.commit(); return render(); }
    if (a === 'vb') { S.vib = S.vib === 0 ? 1 : 0; B.commit(); return render(); }
    if (a === 'wv') { if (['sine', 'square', 'triangle'].indexOf(v) < 0) return; S.wave = v; B.commit(); B.beep(660, .2); return render(); }
    if (a === 'nt') { try { Notification.requestPermission().then(function () { render(); }); } catch (e) {} return; }
    if (a === 'ins') { if (deferred) { deferred.prompt(); deferred = null; } return; }
    if (a === 'rh') { if ([20, 21, 22].indexOf(+v) < 0) return; D.rh = +v; save(); return render(); }
    if (a === 'ex') { try { dl('cheebee-progress-' + n + '.json', JSON.stringify({ v: 2, t: Date.now(), b: localStorage.getItem('cbPhaseBdata'), c: localStorage.getItem('cbPhaseCdata'), d: localStorage.getItem(K) })); B.toast('📤 Na-export'); } catch (e) { logErr('export', e); } return; }
    if (a === 'im') { var fi = document.createElement('input'); fi.type = 'file'; fi.accept = '.json,application/json'; fi.onchange = function () { var f = fi.files && fi.files[0]; if (!f) return; if (f.size > 300000) { B.toast('⚠️ Masyadong malaki ang file. Walang nabago.'); return; } var rd = new FileReader(); rd.onload = function () { try { var o = JSON.parse(rd.result); if (!o || typeof o !== 'object' || o.v !== 2) throw new Error('hindi tamang file'); applySnap(o, 'Mula sa file'); } catch (e) { logErr('import', e); B.toast('⚠️ Hindi mabasa ang file. Walang nabago.'); } }; rd.readAsText(f); }; fi.click(); return; }
    if (a === 'rs') { if (confirm('Buburahin ang data ng Phase D (laro, sticker, misyon). Hindi apektado ang coins mo. Tuloy?')) { try { localStorage.removeItem(K); } catch (e) {} location.reload(); } return; }
    if (a === 'supq') { supMsg = FAQ[+v] ? FAQ[+v][1] : supMsg; return render(); }
    if (a === 'sub') { sub = v; return render(); }
    if (a === 'tip') { if (!D.t.tip) { D.t.tip = 1; B.addXP(5); return done(); } return; }
    if (a === 'cs') { if (!COURSE[+v]) return; if (!D.course[+v]) { D.course[+v] = 1; D.t.les = 1; B.addXP(20); var all = true; for (i = 0; i < COURSE.length; i++) if (!D.course[i]) all = false; if (all && !D.cdone) { D.cdone = 1; B.addCoins(150, 1); B.confetti(); B.toast('🎓 Tapos ang kurso! +150 🪙'); } return done(); } return; }
    if (a === 'sup') { var q = (($('cbSup') || {}).value || '').toLowerCase(); supMsg = 'Hindi ko alam iyan. Tingnan ang Glossary o ang tab na Balita.'; var hit = 0; for (i = 0; i < FAQ.length; i++) if (q.indexOf(FAQ[i][0]) > -1) { supMsg = FAQ[i][1]; hit = 1; break; } if (!hit && q) { D.unk.unshift(q.slice(0, 80)); D.unk = D.unk.slice(0, 20); save(); } return render(); }
    if (a === 'pl') { if (POLL_OK.indexOf(v) < 0) return; if (D.voted === n) { B.toast('Nakaboto ka na ngayon. Balik bukas!'); return; } D.voted = n; D.poll[v] = (D.poll[v] || 0) + 1; save(); return render(); }
    if (a === 'rst') { try { var bk = JSON.parse(localStorage.getItem('cbBackupLast') || 'null'); if (bk && typeof bk === 'object') applySnap(bk, 'Huling auto-backup'); else B.toast('Wala pang backup'); } catch (e) { B.toast('⚠️ Sira ang backup. Walang nabago.'); } return; }
    if (a === 'undo') { try { var ud = JSON.parse(localStorage.getItem('cbUndo') || 'null'); if (ud && typeof ud === 'object') applySnap(ud, 'Bago ang huling restore'); } catch (e) { B.toast('⚠️ Walang mabalikan.'); } return; }
  }
  panel.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return; var id = e.target && e.target.id, m = { cbGu: 'guo', cbSup: 'sup', cbGoal: 'goal', cbTy: 'tyo' };
    if (!m[id]) return; e.preventDefault();
    try { onPanel({ target: { closest: function () { return { getAttribute: function (k) { return k === 'data-a' ? m[id] : null; } }; } } }); } catch (x) { logErr('key', x); }
  });
  panel.addEventListener('click', function (ev) { try { onPanel(ev); } catch (e) { logErr('click', e); try { B.toast('⚠️ May error. Tingnan ang Log.'); } catch (x) {} } });

  /* ---------- simula ---------- */
  function boot() {
    if (B.dock) B.dock(hudEl); else document.body.appendChild(hudEl);
    document.body.appendChild(panel);
    window.addEventListener('cb-newday', function () { try { newDay(); if (panel.style.display === 'block') render(); } catch (x) {} });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.style.display === 'block') { clr(); panel.style.display = 'none'; } });
    window.addEventListener('error', function (e) { if (e && /phaseD/.test(e.filename || '')) logErr('js', e.error || e.message); });
    var n = dn(), hr = new Date().getHours();
    if (D.bk !== n) { try { localStorage.setItem('cbBackupLast', JSON.stringify({ b: localStorage.getItem('cbPhaseBdata'), c: localStorage.getItem('cbPhaseCdata'), d: localStorage.getItem(K) })); D.bk = n; save(); } catch (e) {} }
    setTimeout(function () {
      if (S.claimed !== n) {
        if (hr >= 19) B.toast('⚠️ Kunin ang daily reward para hindi mawala ang streak!');
        try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('🎁 May reward ka na!', { body: 'Pasok na sa opisina.' }); } catch (e) {}
      }
    }, 4500);
    setInterval(function () {
      var d = new Date();
      if (d.getHours() === D.rh && D.recap !== dn()) { D.recap = dn(); save(); B.toast('🌙 Recap: kumita ka ng ' + (S.earn - D.e0.v) + ' 🪙 ngayon. Magaling!'); }
    }, 60000);
    setTimeout(walker, (1 + Math.random()) * 60000);
    try {
      var l = document.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.webmanifest'; document.head.appendChild(l); var ai = document.createElement('link'); ai.rel = 'apple-touch-icon'; ai.href = '/icon-192.png'; document.head.appendChild(ai); var tc = document.createElement('meta'); tc.name = 'theme-color'; tc.content = '#5b3df0'; document.head.appendChild(tc);
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(function () {});
      window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });
    } catch (e) {}
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
  window.CB_PHASE_D = { selfTest: selfTest, rpsResult: rpsResult, typeAcc: typeAcc, off: function () { try { localStorage.setItem('cbPhaseD', 'off'); } catch (e) {} location.reload(); }, on: function () { try { localStorage.removeItem('cbPhaseD'); } catch (e) {} location.reload(); } };
})();
