/* office-studio.js — Office Studio v1 (v30 app)
   New HQ Layout Editor + the lightweight Office Studio feature set:
   undo/redo, tools, snap/zoom/pan, inspector, presets, themes, photo presets,
   bot cards, adaptive detail guard, chat quick actions and accessibility.
   Loaded after the main app so it can extend globals without touching the
   protected Phase D v8 runtime. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  var STUDIO_CSS = [
    '#officeStudioCss{display:none}',
    '.ed-badge{font-size:9px;padding:2px 6px;border-radius:99px;background:#2f7a55;color:#d8ffe9;vertical-align:middle;margin-left:5px}',
    '.ed-sub{font-size:11px;color:var(--mut);margin:0 0 8px}',
    '.ed-top{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap}',
    '.ed-top .grow{flex:1;min-width:180px}',
    '.ed-status{font-size:10px;padding:3px 9px;border-radius:99px;background:#1e3a5f;color:#a9d4ff;white-space:nowrap}',
    '.ed-status.busy{background:#5a4620;color:var(--gold)}',
    '.ed-status.ok{background:#1f4a35;color:#7fe0ab}',
    '.ed-roombar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:7px 0}',
    '.ed-roombar input{width:auto;min-width:70px;padding:4px 7px;font-size:11px}',
    '.ed-roombar label{display:inline-flex;align-items:center;gap:4px;margin:0;font-size:10px}',
    '.ed-toolbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:7px;background:#101827;border:1px solid #2a3550;border-radius:10px;margin:8px 0}',
    '.ed-toolbar button,.ed-toolbar select{font-size:11px;padding:5px 9px}',
    '.ed-toolbar button.on{background:var(--gold);color:#1a1200;border-color:var(--gold);font-weight:700}',
    '.ed-toolbar .sep{width:1px;height:21px;background:#35425f;margin:0 3px}',
    '.ed-palette{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:6px;margin:6px 0 10px}',
    '.ed-group{grid-column:1/-1;font-size:9px;letter-spacing:.14em;color:#6f87b5;margin-top:4px}',
    '.ed-palette button{font-size:11px;padding:6px 7px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ed-palette button.on{background:var(--gold);color:#1a1200;border-color:var(--gold);font-weight:700}',
    '.ed-main{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:10px;align-items:start}',
    '@media(max-width:820px){.ed-main{grid-template-columns:1fr}}',
    '.ed-canvas-wrap{position:relative;overflow:auto;max-width:100%;border-radius:10px;border:1px solid #2c3a58;background:#0d1220}',
    '#lay{display:block;cursor:crosshair;max-width:none}',
    '.ed-inspector{background:#101827;border:1px solid #2a3550;border-radius:10px;padding:10px;font-size:11px}',
    '.ed-inspector h4{margin:0 0 7px;font-size:11px;color:#cfe0ff}',
    '.ed-inspector label{margin:5px 0 2px}',
    '.ed-inspector input[type=number]{padding:4px 6px;font-size:11px}',
    '.ed-inspector .bar{margin:7px 0 0;gap:5px}',
    '.ed-inspector button{font-size:10px;padding:5px 7px}',
    '.ed-foot{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;font-size:10px;color:var(--mut)}',
    '.ed-foot kbd{background:#1b2337;border:1px solid #3a4866;border-bottom-width:2px;border-radius:4px;padding:1px 5px;font-size:9px;color:#cfe0ff}',
    '#botCard{position:absolute;z-index:10002;left:10px;top:56px;width:222px;max-width:70vw;display:none;pointer-events:auto;cursor:default;font-size:12px;line-height:1.4}',
    '#botCard .bc-top{display:flex;gap:8px;align-items:center}',
    '#botCard .bc-emo{font-size:21px}',
    '#botCard .bc-name{font-weight:800;color:#18344f}',
    '#botCard .bc-meta{font-size:10px;color:#47657f;margin-top:2px}',
    '#botCard .bc-grid{display:grid;grid-template-columns:auto 1fr;gap:2px 7px;margin:7px 0;font-size:10px}',
    '#botCard .bc-grid b{color:#2f6f7a}',
    '#botCard .bc-actions{display:flex;gap:5px}',
    '#botCard button{font-size:10px;padding:3px 7px;border-radius:6px}',
    '#mmoChatQuick{display:flex;gap:3px;padding:1px 3px 2px;border-top:1px solid #263754}',
    '#mmoChatQuick button{flex:1;min-width:0;padding:1px 0;font-size:10px;line-height:14px;background:#172a49;border:1px solid #2f5fa8;border-radius:4px;color:#dceaff}',
    'body[data-office-theme="fiesta"]{--acc:#c94f8a;--gold:#ffb43d}',
    'body[data-office-theme="pasko"]{--acc:#2f9d6a;--gold:#d94f4f}',
    'body[data-office-theme="rainy"]{--acc:#4a7fb0;--gold:#8fb8ff}',
    'body.a11y{font-size:15px}',
    'body.a11y .v9bub{font-size:17px;border-width:3px;box-shadow:0 0 0 2px #ffd34d,0 8px 24px #0b183c66}',
    'body.a11y button,body.a11y input,body.a11y select{font-size:13px;min-height:30px}',
    'body.a11y #mmoChat{width:240px!important;height:130px!important}',
    'body.a11y #officeCamHint{font-size:12px;background:rgba(7,13,29,.94)}'
  ].join('\n');
  var css = document.createElement('style');
  css.id = 'officeStudioCss'; css.textContent = STUDIO_CSS; document.head.appendChild(css);

  var GROUPS = [
    { n: 'WORK', types: ['desk', 'ceo_desk', 'monitor', 'whiteboard', 'server', 'bookshelf', 'chair', 'table'] },
    { n: 'TECH & STAGE', types: ['holo', 'portal', 'stage', 'neon', 'arcade', 'vending'] },
    { n: 'LOUNGE', types: ['sofa', 'beanbag', 'coffee', 'counter', 'plant'] },
    { n: 'SPORT & PLAY', types: ['court', 'hoop', 'pool', 'treadmill', 'weights', 'bench'] }
  ];
  var COLORS = {
    desk: '#c77f3b', ceo_desk: '#e8b04a', table: '#7a5a34', chair: '#6b7488',
    court: '#c8863c', bench: '#b07a3c', treadmill: '#3a4256', weights: '#9aa4b8',
    coffee: '#c87a32', pool: '#1e7fa0', arcade: '#6a4aa8', hoop: '#ff7a3a',
    beanbag: '#2bb3d6', plant: '#3fa34a', server: '#3a4256', whiteboard: '#dde6f5',
    sofa: '#8a4a7a', bookshelf: '#7a5230', monitor: '#4b8dff', holo: '#66d9ff',
    portal: '#7cf7ff', stage: '#2a3a63', neon: '#bff4ff', counter: '#a86a34', vending: '#2b6fa8'
  };
  var SIZES = {
    pool: [4, 3.4], court: [13, 9], table: [2, 1.4], bench: [2, 1],
    weights: [2, 1], desk: [1.5, 1], ceo_desk: [1.5, 1], coffee: [2.4, 1],
    treadmill: [1, 1.8], sofa: [1.4, 1], whiteboard: [2, 1]
  };
  var JOB_EMO = {
    greet: '💬', wave: '👋', type: '⌨️', pack: '📦', joke: '😂', plan: '📋',
    write: '✍️', design: '🎨', review: '🔍', showcase: '🖼️', walk: '🚶'
  };
  var PRESETS = {
    hq: function () { return null; },
    studio: function () {
      return [{ id: 'r' + Date.now(), name: 'OPEN STUDIO 🎬', w: 16, h: 12, floor: 'conf', items: [
        { id: 's1', type: 'stage', a: 6, b: 1, label: 'Stage' },
        { id: 's2', type: 'neon', a: 2, b: 1, label: '' },
        { id: 's3', type: 'neon', a: 12, b: 1, label: '' },
        { id: 's4', type: 'desk', a: 2, b: 5, label: 'Edit A' },
        { id: 's5', type: 'desk', a: 5, b: 5, label: 'Edit B' },
        { id: 's6', type: 'desk', a: 8, b: 5, label: 'Color' },
        { id: 's7', type: 'monitor', a: 11, b: 5, label: 'Preview' },
        { id: 's8', type: 'sofa', a: 2, b: 9, label: '' },
        { id: 's9', type: 'coffee', a: 6, b: 9, label: '' },
        { id: 's10', type: 'plant', a: 13, b: 9, label: '' }
      ] }];
    },
    farm: function () {
      return [{ id: 'r' + Date.now(), name: 'FARM CAMPUS 🌾', w: 18, h: 13, floor: 'hq', items: [
        { id: 'f1', type: 'plant', a: 1, b: 2, label: 'Plot 1' },
        { id: 'f2', type: 'plant', a: 5, b: 2, label: 'Plot 2' },
        { id: 'f3', type: 'plant', a: 9, b: 2, label: 'Plot 3' },
        { id: 'f4', type: 'plant', a: 13, b: 2, label: 'Plot 4' },
        { id: 'f5', type: 'table', a: 3, b: 7, label: 'Pack table' },
        { id: 'f6', type: 'counter', a: 8, b: 7, label: 'Farm stand' },
        { id: 'f7', type: 'bench', a: 13, b: 7, label: '' },
        { id: 'f8', type: 'ceo_desk', a: 8, b: 11, label: 'Barn office' }
      ] }];
    }
  };

  var tool = 'select', snap = store.get('ccStudioSnap', .5), zoom = 1, panX = 0, panY = 0;
  var hover = null, spaceDown = false, panning = null, dragging = null;
  var undo = [], redo = [], statusTimer = null;
  var perfFrames = 0, perfT0 = 0, lowStreak = 0, highStreak = 0, fps = 0;

  function setStatus(msg, kind) {
    var el = $('edStatus'); if (!el) return;
    el.textContent = msg;
    el.className = 'ed-status' + (kind ? ' ' + kind : '');
    clearTimeout(statusTimer);
    if (kind !== 'busy') statusTimer = setTimeout(function () { el.textContent = 'Ready · autosave on'; el.className = 'ed-status'; }, 3200);
  }
  function room() {
    if (!S || !S.layout || !S.layout.rooms) return null;
    return S.layout.rooms.find(function (r) { return r.id === editRoom; }) || S.layout.rooms[0];
  }
  function cell() { return 40 * zoom; }
  function origin() { return { x: 16 + panX, y: 16 + panY }; }
  function itemSize(it) { return SIZES[it.type] || [1, 1]; }
  function itemRect(it) {
    var c = cell(), o = origin(), s = itemSize(it);
    return { x: o.x + it.a * c, y: o.y + it.b * c, w: s[0] * c, h: s[1] * c };
  }
  function canvasPos(e) {
    var lay = $('lay'), r = lay.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (lay.width / r.width), y: (e.clientY - r.top) * (lay.height / r.height) };
  }
  function toGrid(p) {
    var c = cell(), o = origin(), r = room();
    var a = Math.round(((p.x - o.x) / c) / snap) * snap;
    var b = Math.round(((p.y - o.y) / c) / snap) * snap;
    if (r) { a = Math.max(0, Math.min(r.w - .5, a)); b = Math.max(0, Math.min(r.h - .5, b)); }
    return { a: +a.toFixed(2), b: +b.toFixed(2) };
  }
  function hitItem(p) {
    var r = room(); if (!r) return null;
    return (r.items || []).slice().reverse().find(function (it) {
      var q = itemRect(it);
      return p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h;
    }) || null;
  }
  function snapshot() { return S && S.layout ? JSON.stringify(S.layout) : null; }
  function pushHistory() {
    var s = snapshot(); if (!s) return;
    undo.push(s); if (undo.length > 60) undo.shift(); redo.length = 0;
  }
  function save(msg) { if (typeof autoSaveLayout === 'function') autoSaveLayout(); setStatus(msg || 'Saving…', 'busy'); }
  function undoFn() {
    if (!undo.length) { setStatus('Nothing to undo'); return; }
    var s = snapshot(); if (s) redo.push(s);
    S.layout = JSON.parse(undo.pop()); save('Undo'); drawEditor();
  }
  function redoFn() {
    if (!redo.length) { setStatus('Nothing to redo'); return; }
    var s = snapshot(); if (s) undo.push(s);
    S.layout = JSON.parse(redo.pop()); save('Redo'); drawEditor();
  }
  function deleteSelected() {
    var r = room(); if (!r || !selEditItem) return;
    pushHistory();
    var i = r.items.indexOf(selEditItem);
    if (i >= 0) r.items.splice(i, 1);
    selEditItem = null; save('Deleted'); drawEditor();
  }

  function buildShell() {
    var card = document.querySelector('#v-layout .card');
    if (!card || card.dataset.studio) return;
    card.dataset.studio = '1';
    card.innerHTML = [
      '<div class="ed-top"><div class="grow"><h2>HQ Layout Editor <span class="ed-badge">STUDIO v1</span></h2>',
      '<p class="ed-sub">Bagong editor — pumili ng tool, i-click ang grid, drag para ilipat. Right-click = delete.</p></div>',
      '<span class="ed-status" id="edStatus">Ready · autosave on</span></div>',
      '<div class="ed-roombar"><div class="room-tabs" id="editRoomTabs" style="display:flex;gap:5px;flex-wrap:wrap"></div>',
      '<span style="flex:1"></span><label>Room <input id="edRoomName" maxlength="28"></label>',
      '<label>W <input id="edRoomW" type="number" min="6" max="40" style="width:52px"></label>',
      '<label>H <input id="edRoomH" type="number" min="6" max="40" style="width:52px"></label>',
      '<button id="addRoom">+ Room</button><button id="delRoom">− Room</button></div>',
      '<div class="ed-toolbar">',
      '<button data-tool="select" class="on" title="Select / move (V)">🖱 Select</button>',
      '<button data-tool="place" title="Place item (B)">＋ Place</button>',
      '<button data-tool="erase" title="Erase item (E)">⌫ Erase</button>',
      '<button data-tool="pan" title="Pan canvas (Space-drag or Pan tool)">✋ Pan</button>',
      '<span class="sep"></span>',
      '<button id="edUndo" title="Undo (Ctrl+Z)">↶ Undo</button><button id="edRedo" title="Redo (Ctrl+Y)">↷ Redo</button>',
      '<span class="sep"></span>',
      '<label style="display:inline-flex;align-items:center;gap:4px;margin:0;font-size:10px">Snap <select id="edSnap"><option value="0.5">½ cell</option><option value="1">1 cell</option><option value="0.25">¼ cell</option></select></label>',
      '<label style="display:inline-flex;align-items:center;gap:4px;margin:0;font-size:10px">Zoom <input id="edZoom" type="range" min="0.6" max="1.6" step="0.1" value="1" style="width:82px"></label>',
      '<span class="sep"></span>',
      '<select id="edPreset" title="Load a layout preset"><option value="">Preset…</option><option value="hq">Default HQ</option><option value="studio">Open Studio</option><option value="farm">Farm Campus</option></select>',
      '<select id="edTheme" title="Office theme"><option value="default">☀️ Default</option><option value="fiesta">🎉 Fiesta</option><option value="rainy">🌧️ Rainy</option><option value="pasko">🎄 Pasko</option></select>',
      '<label style="display:inline-flex;align-items:center;gap:4px;margin:0;font-size:10px"><input id="edPerf" type="checkbox" style="width:auto"> Auto detail</label>',
      '<label style="display:inline-flex;align-items:center;gap:4px;margin:0;font-size:10px"><input id="edA11y" type="checkbox" style="width:auto"> A11y</label>',
      '<button id="edPreview" title="Open this room in the 3D office">▶ Preview 3D</button>',
      '</div>',
      '<h3>Add item — pick, then click the grid</h3><div class="palette ed-palette" id="palette"></div>',
      '<div class="ed-main"><div class="ed-canvas-wrap"><canvas id="lay" width="520" height="440" aria-label="HQ layout grid"></canvas></div>',
      '<aside class="ed-inspector"><h4>Selected item</h4>',
      '<input id="itemLabel" placeholder="Label (e.g. Dev desk)">',
      '<label>X <input id="edPosX" type="number" step="0.5" style="width:70px"></label>',
      '<label>Y <input id="edPosY" type="number" step="0.5" style="width:70px"></label>',
      '<label style="display:flex;gap:6px;align-items:center;margin-top:7px"><input id="edLock" type="checkbox" style="width:auto"> Lock position</label>',
      '<div class="bar"><button id="edDup">Duplicate</button><button id="edDel" class="danger">Delete</button></div>',
      '<div class="hint" id="edCoord" style="margin-top:8px">x: — · y: —</div>',
      '<div class="hint" id="edFps" style="margin-top:4px">FPS: —</div></aside></div>',
      '<div class="bar"><button class="run" id="saveLayout">Save layout</button><button id="resetLayout2">Reset to default</button>',
      '<span class="hint" id="layHint"></span></div>',
      '<div class="ed-foot"><span><kbd>V</kbd> select</span><span><kbd>B</kbd> place</span><span><kbd>E</kbd> erase</span>',
      '<span><kbd>Space</kbd> pan</span><span><kbd>Del</kbd> delete</span><span><kbd>Ctrl+Z</kbd> undo</span>',
      '<span><kbd>Esc</kbd> cancel</span><span><kbd>Wheel</kbd> zoom</span></div>'
    ].join('');

    qsa('[data-tool]', card).forEach(function (b) {
      b.onclick = function () { setTool(b.dataset.tool); };
    });
    $('edUndo').onclick = undoFn;
    $('edRedo').onclick = redoFn;
    $('edSnap').value = String(snap);
    $('edSnap').onchange = function () { snap = Number(this.value) || .5; store.set('ccStudioSnap', snap); drawEditor(); };
    $('edZoom').oninput = function () { zoom = Number(this.value) || 1; drawEditor(); };
    $('edPreset').onchange = function () {
      var fn = PRESETS[this.value]; this.value = '';
      if (!fn || !S) return;
      if (!confirm('Palitan ang layout ng preset? Pwede pa i-undo.')) return;
      pushHistory();
      var rooms = fn();
      if (rooms) S.layout.rooms = rooms;
      else if (typeof api === 'function') { api('/api/layout/reset', { method: 'POST', body: '{}' }).then(function () { if (typeof refresh === 'function') refresh(); }); }
      editRoom = S.layout.rooms[0].id; selEditItem = null; save('Preset loaded'); drawEditor();
    };
    $('edTheme').onchange = function () { applyTheme(this.value); };
    $('edPerf').onchange = function () { setPerfGuard(this.checked); };
    $('edA11y').onchange = function () { setA11y(this.checked); };
    $('edPreview').onclick = function () { if (typeof setView === 'function') setView('office'); };
    $('addRoom').onclick = function () {
      if (!S) return; pushHistory();
      var n = S.layout.rooms.length + 1;
      S.layout.rooms.push({ id: 'r' + Date.now(), name: 'Room ' + n, w: 10, h: 9, floor: 'conf', items: [] });
      editRoom = S.layout.rooms[S.layout.rooms.length - 1].id; selEditItem = null; save('Room added'); drawEditor();
    };
    $('delRoom').onclick = function () {
      if (!S || S.layout.rooms.length <= 1) return; pushHistory();
      var i = S.layout.rooms.findIndex(function (r) { return r.id === editRoom; });
      if (i >= 0) S.layout.rooms.splice(i, 1);
      editRoom = S.layout.rooms[0].id; selEditItem = null; save('Room deleted'); drawEditor();
    };
    $('edRoomName').onchange = function () { var r = room(); if (!r) return; pushHistory(); r.name = this.value.trim() || r.name; save('Room renamed'); drawEditor(); };
    $('edRoomW').onchange = function () { var r = room(); if (!r) return; pushHistory(); r.w = Math.max(6, Math.min(40, Number(this.value) || r.w)); save('Room resized'); drawEditor(); };
    $('edRoomH').onchange = function () { var r = room(); if (!r) return; pushHistory(); r.h = Math.max(6, Math.min(40, Number(this.value) || r.h)); save('Room resized'); drawEditor(); };
    $('itemLabel').onchange = function () { if (!selEditItem) return; pushHistory(); selEditItem.label = this.value.trim(); save('Label updated'); drawEditor(); };
    $('edPosX').onchange = function () { if (!selEditItem) return; pushHistory(); selEditItem.a = Math.max(0, Number(this.value) || 0); save('Moved'); drawEditor(); };
    $('edPosY').onchange = function () { if (!selEditItem) return; pushHistory(); selEditItem.b = Math.max(0, Number(this.value) || 0); save('Moved'); drawEditor(); };
    $('edLock').onchange = function () { if (!selEditItem) return; pushHistory(); selEditItem.locked = this.checked; save('Lock updated'); drawEditor(); };
    $('edDup').onclick = function () {
      var r = room(); if (!r || !selEditItem) return; pushHistory();
      var c = clone(selEditItem); c.id = 'i' + Date.now(); c.a += 1; c.b += 1; c.label = (c.label || '') + ' copy';
      r.items.push(c); selEditItem = c; save('Duplicated'); drawEditor();
    };
    $('edDel').onclick = deleteSelected;
    $('saveLayout').onclick = async function () {
      if (!S) return;
      if (typeof api === 'function') {
        var res = await api('/api/layout', { method: 'POST', body: JSON.stringify({ layout: S.layout }) });
        setStatus(res && res.ok ? 'Saved' : 'Save error', res && res.ok ? 'ok' : 'busy');
        if (typeof refresh === 'function') await refresh();
      }
      drawEditor();
    };
    $('resetLayout2').onclick = async function () {
      if (!confirm('I-reset ang layout sa default?')) return;
      if (typeof api === 'function') await api('/api/layout/reset', { method: 'POST', body: '{}' });
      if (typeof refresh === 'function') await refresh();
      editRoom = 'hq'; selEditItem = null; setStatus('Reset', 'ok'); drawEditor();
    };

    bindCanvas();
    var theme = store.get('ccStudioTheme', 'default');
    $('edTheme').value = theme;
    applyTheme(theme, true);
    setPerfGuard(store.get('ccStudioPerf', true), true);
    setA11y(store.get('ccStudioA11y', false), true);
  }

  function setTool(t) {
    tool = t;
    if (t !== 'place') selItem = null;
    qsa('[data-tool]').forEach(function (b) { b.classList.toggle('on', b.dataset.tool === t); });
    if ($('lay')) drawEditor();
  }

  function drawEditor() {
    if (!S || typeof view === 'undefined' || view !== 'layout') return;
    var r = room(), lay = $('lay'); if (!r || !lay) return;
    var c = cell(), o = origin(), w = r.w * c + 32, h = r.h * c + 32;
    lay.width = w; lay.height = h;
    var x = lay.getContext('2d');
    x.fillStyle = '#0d1220'; x.fillRect(0, 0, w, h);
    for (var a = 0; a < r.w; a++) for (var b = 0; b < r.h; b++) {
      x.fillStyle = (a + b) % 2 ? '#1b2233' : '#202b42';
      x.fillRect(o.x + a * c, o.y + b * c, c - 1, c - 1);
    }
    x.strokeStyle = '#0b0f18'; x.lineWidth = 6; x.strokeRect(o.x - 3, o.y - 3, r.w * c + 6, r.h * c + 6);
    x.strokeStyle = '#3a4a68'; x.lineWidth = 2; x.strokeRect(o.x - 1, o.y - 1, r.w * c + 2, r.h * c + 2);

    var tabs = $('editRoomTabs');
    if (tabs) {
      tabs.innerHTML = S.layout.rooms.map(function (z) {
        return '<button class="' + (z.id === editRoom ? 'on' : '') + '" data-er="' + esc(z.id) + '">' + esc(z.name) + '</button>';
      }).join('');
      qsa('[data-er]', tabs).forEach(function (btn) { btn.onclick = function () { editRoom = btn.dataset.er; selEditItem = null; drawEditor(); }; });
    }
    var pal = $('palette');
    if (pal) {
      pal.innerHTML = GROUPS.map(function (g) {
        return '<div class="ed-group">' + g.n + '</div>' + g.types.map(function (t) {
          var label = (ITEMS.find(function (i) { return i[0] === t; }) || [t, t])[1];
          return '<button data-it="' + t + '" class="' + (selItem === t ? 'on' : '') + '">' + label + '</button>';
        }).join('');
      }).join('');
      qsa('[data-it]', pal).forEach(function (btn) {
        btn.onclick = function () { selItem = btn.dataset.it; setTool('place'); selItem = btn.dataset.it; drawEditor(); };
      });
    }
    var rn = $('edRoomName'), rw = $('edRoomW'), rh = $('edRoomH');
    if (rn && document.activeElement !== rn) rn.value = r.name || '';
    if (rw && document.activeElement !== rw) rw.value = r.w;
    if (rh && document.activeElement !== rh) rh.value = r.h;

    (r.items || []).forEach(function (it) {
      var q = itemRect(it);
      x.globalAlpha = it.locked ? .5 : .88;
      x.fillStyle = COLORS[it.type] || '#888';
      x.fillRect(q.x, q.y, q.w - 3, q.h - 3);
      x.globalAlpha = 1;
      if (it.type === 'court') {
        x.strokeStyle = '#fff5dc'; x.lineWidth = 2; x.strokeRect(q.x + 6, q.y + 6, q.w - 15, q.h - 15);
        x.beginPath(); x.moveTo(q.x + q.w / 2, q.y + 6); x.lineTo(q.x + q.w / 2, q.y + q.h - 9); x.stroke();
        x.beginPath(); x.arc(q.x + q.w / 2, q.y + q.h / 2, c * .8, 0, 7); x.stroke();
      }
      var icon = ((ITEMS.find(function (i) { return i[0] === it.type; }) || ['', '⬛'])[1].match(/\S/) || ['⬛'])[0];
      x.fillStyle = '#fff'; x.font = '12px sans-serif';
      x.fillText(icon, q.x + 4, q.y + 14);
      if (q.w > 58) { x.font = '9px sans-serif'; x.fillText(String(it.label || it.type).slice(0, 12), q.x + 4, q.y + q.h - 6); }
      if (it.locked) { x.fillStyle = '#ffd34d'; x.font = '10px sans-serif'; x.fillText('🔒', q.x + q.w - 15, q.y + 12); }
      if (selEditItem === it) { x.strokeStyle = '#ffd34d'; x.lineWidth = 2; x.strokeRect(q.x - 1, q.y - 1, q.w - 1, q.h - 1); }
    });

    if (hover) {
      var g = toGrid(hover), hc = itemSize({ type: selItem || 'desk' });
      x.strokeStyle = tool === 'erase' ? '#ff9b97' : '#8fd0ff'; x.lineWidth = 1;
      x.strokeRect(o.x + g.a * c, o.y + g.b * c, hc[0] * c - 3, hc[1] * c - 3);
      var coord = $('edCoord'); if (coord) coord.textContent = 'x: ' + g.a + ' · y: ' + g.b;
    }
    var lab = $('itemLabel'), px = $('edPosX'), py = $('edPosY'), lk = $('edLock');
    if (lab && document.activeElement !== lab) lab.value = selEditItem ? (selEditItem.label || '') : '';
    if (px && document.activeElement !== px) px.value = selEditItem ? selEditItem.a : '';
    if (py && document.activeElement !== py) py.value = selEditItem ? selEditItem.b : '';
    if (lk) lk.checked = !!(selEditItem && selEditItem.locked);
    var hint = $('layHint');
    if (hint) hint.textContent = r.name + ' · ' + r.w + '×' + r.h + ' · ' + (r.items || []).length + ' items' +
      (selItem ? ' · placing: ' + selItem : '') + (selEditItem ? ' · selected: ' + (selEditItem.label || selEditItem.type) : '') + ' · ' + tool;
  }
  window.drawEditor = drawEditor;

  function bindCanvas() {
    var lay = $('lay'); if (!lay || lay.dataset.bound) return; lay.dataset.bound = '1';
    lay.addEventListener('mousemove', function (e) {
      if (!S || view !== 'layout') return;
      var p = canvasPos(e); hover = p;
      if (panning) { panX = panning.px + (e.clientX - panning.x); panY = panning.py + (e.clientY - panning.y); drawEditor(); return; }
      if (dragging && !dragging.locked) {
        var g = toGrid(p); dragging.a = g.a; dragging.b = g.b; drawEditor(); return;
      }
      drawEditor();
    });
    lay.addEventListener('mouseleave', function () { hover = null; drawEditor(); });
    lay.addEventListener('mousedown', function (e) {
      if (!S || view !== 'layout') return;
      var p = canvasPos(e), r = room(); if (!r) return;
      if (tool === 'pan' || spaceDown || e.button === 1) { panning = { x: e.clientX, y: e.clientY, px: panX, py: panY }; e.preventDefault(); return; }
      if (e.button !== 0) return;
      if (tool === 'place' && selItem) {
        pushHistory(); var g = toGrid(p);
        var it = { id: 'i' + Date.now(), type: selItem, a: g.a, b: g.b, label: '' };
        r.items.push(it); selEditItem = it; save('Placed ' + selItem); drawEditor(); return;
      }
      var hit = hitItem(p);
      if (tool === 'erase') {
        if (hit) { pushHistory(); r.items.splice(r.items.indexOf(hit), 1); if (selEditItem === hit) selEditItem = null; save('Erased'); drawEditor(); }
        return;
      }
      selEditItem = hit; dragging = hit && !hit.locked ? hit : null;
      if (hit) pushHistory();
      drawEditor(); e.preventDefault();
    });
    window.addEventListener('mouseup', function () {
      if (panning) { panning = null; return; }
      if (dragging) { dragging = null; save('Moved'); }
    });
    lay.addEventListener('contextmenu', function (e) {
      if (!S || view !== 'layout') return; e.preventDefault();
      var hit = hitItem(canvasPos(e)), r = room(); if (!hit || !r) return;
      pushHistory(); r.items.splice(r.items.indexOf(hit), 1); if (selEditItem === hit) selEditItem = null; save('Deleted'); drawEditor();
    });
    lay.addEventListener('wheel', function (e) {
      if (view !== 'layout') return;
      e.preventDefault(); zoom = Math.max(.6, Math.min(1.6, zoom * (e.deltaY > 0 ? .92 : 1.08)));
      var z = $('edZoom'); if (z) z.value = String(zoom); drawEditor();
    }, { passive: false });
    lay.addEventListener('dblclick', function () { var lab = $('itemLabel'); if (lab) lab.focus(); });
  }

  document.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    // H is reserved by the app for Hide UI — never intercept it.
    if (typeof view === 'undefined' || view !== 'layout') return;
    var take = function () { e.preventDefault(); e.stopPropagation(); };
    if (e.code === 'Space') { spaceDown = true; take(); return; }
    var k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { take(); e.shiftKey ? redoFn() : undoFn(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { take(); redoFn(); return; }
    if (k === 'v') { take(); setTool('select'); return; }
    if (k === 'b') { take(); setTool('place'); return; }
    if (k === 'e') { take(); setTool('erase'); return; }
    if (k === 'escape') { take(); selItem = null; selEditItem = null; setTool('select'); return; }
    if ((k === 'delete' || k === 'backspace') && selEditItem) { take(); deleteSelected(); return; }
    if (selEditItem && k.indexOf('arrow') === 0 && !selEditItem.locked) {
      take(); pushHistory();
      var d = e.shiftKey ? 1 : .5;
      if (k === 'arrowleft') selEditItem.a -= d;
      if (k === 'arrowright') selEditItem.a += d;
      if (k === 'arrowup') selEditItem.b -= d;
      if (k === 'arrowdown') selEditItem.b += d;
      save('Nudged'); drawEditor();
    }
  });
  document.addEventListener('keyup', function (e) { if (e.code === 'Space') spaceDown = false; });

  // ---------- Office Studio feature set ----------
  function applyTheme(name, silent) {
    var theme = name || 'default';
    window.__officeTheme = theme;
    document.body.dataset.officeTheme = theme;
    store.set('ccStudioTheme', theme);
    var v9 = window.__officeV9;
    if (v9 && typeof v9.setTheme === 'function') v9.setTheme(theme);
    if (!silent) toast('🎨 Theme: ' + theme + ' (background guards unchanged)');
  }
  function setPerfGuard(on, silent) {
    store.set('ccStudioPerf', !!on);
    window.__officePerfGuard = !!on;
    if (!on) setDetail('high');
    if (!silent) toast('⚙️ Auto detail ' + (on ? 'ON' : 'OFF'));
  }
  function setA11y(on, silent) {
    document.body.classList.toggle('a11y', !!on);
    store.set('ccStudioA11y', !!on);
    if (!silent) toast('♿ Accessibility ' + (on ? 'ON' : 'OFF'));
  }
  function setDetail(level) {
    window.__officeDetail = level === 'low' ? 'low' : 'high';
    var v9 = window.__officeV9;
    if (v9 && typeof v9.setDetail === 'function') v9.setDetail(level);
    setStatus(level === 'low' ? 'Auto detail: lightweight' : 'Auto detail: full', level === 'low' ? 'busy' : 'ok');
  }
  function perfLoop() {
    requestAnimationFrame(perfLoop);
    if (!renderer3d || document.hidden) { perfT0 = performance.now(); perfFrames = renderer3d ? renderer3d.info.render.frame : 0; return; }
    var t = performance.now();
    if (!perfT0) { perfT0 = t; perfFrames = renderer3d.info.render.frame; return; }
    if (t - perfT0 < 3000) return;
    fps = (renderer3d.info.render.frame - perfFrames) * 1000 / (t - perfT0);
    perfFrames = renderer3d.info.render.frame; perfT0 = t;
    var el = $('edFps'); if (el) el.textContent = 'FPS: ' + fps.toFixed(1);
    if (!window.__officePerfGuard) return;
    if (fps < 24) { lowStreak++; highStreak = 0; } else if (fps > 27) { highStreak++; lowStreak = 0; } else { lowStreak = highStreak = 0; }
    if (lowStreak >= 2 && window.__officeDetail !== 'low') { lowStreak = 0; setDetail('low'); }
    if (highStreak >= 2 && window.__officeDetail === 'low') { highStreak = 0; setDetail('high'); }
  }

  function addPhotoTools() {
    var tools = $('officeCamTools'); if (!tools || tools.dataset.studio) return; tools.dataset.studio = '1';
    var defs = [
      ['camHero', '📷 Hero', 'Hero view — clear office + bots', function () { setOfficeCamera({ x: 23, y: 1.2, z: 17, theta: 2.22, phi: .61, r: 36 }); }],
      ['camDesk', '📷 Desk', 'Desk-level close view', function () { setOfficeCamera({ x: 23, y: 1.2, z: 25, theta: 2.65, phi: .88, r: 15 }); }],
      ['camAir', '📷 Aerial', 'Top-down campus view', function () { setOfficeCamera({ x: 23, y: 1.2, z: 17, theta: 2.2, phi: .2, r: 60 }); }]
    ];
    defs.forEach(function (d) {
      var b = document.createElement('button'); b.id = d[0]; b.title = d[2]; b.textContent = d[1];
      b.onclick = function () { d[3](); toast('📷 ' + d[2]); }; tools.appendChild(b);
    });
    var f = document.createElement('button');
    f.id = 'camFreeze'; f.title = 'Freeze bots for a clean screenshot'; f.textContent = '⏸ Freeze';
    f.onclick = function () {
      window.__officeFreeze = !window.__officeFreeze;
      f.textContent = window.__officeFreeze ? '▶ Unfreeze' : '⏸ Freeze';
      toast(window.__officeFreeze ? '⏸ Bots frozen — perfect screenshot mode' : '▶ Bots moving again');
    };
    tools.appendChild(f);
  }

  function addChatQuick() {
    var body = $('mmoChatBody'), foot = $('mmoChatFoot');
    if (!body || !foot || $('mmoChatQuick')) return;
    var q = document.createElement('div'); q.id = 'mmoChatQuick';
    ['👍', '❤️', '😂', '🎉', '@'].forEach(function (em) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = em;
      b.title = em === '@' ? 'Mention a bot' : 'Insert ' + em;
      b.onclick = function () {
        var inp = $('mmoChatIn'); if (!inp) return;
        inp.value = (inp.value + (em === '@' ? '@' : ' ' + em)).slice(0, 120);
        inp.focus();
      };
      q.appendChild(b);
    });
    body.insertBefore(q, foot);
  }

  function addBotCard() {
    var host = $('oc3d'); if (!host || $('botCard')) return;
    var card = document.createElement('div');
    card.id = 'botCard'; card.className = 'v9bub';
    card.innerHTML = '<div class="bc-top"><span class="bc-emo" id="bcEmo">🤖</span><div><div class="bc-name" id="bcName">Bot</div><div class="bc-meta" id="bcMeta">Now working</div></div></div>' +
      '<div class="bc-grid"><b>Job</b><span id="bcJob">—</span><b>Next</b><span id="bcNext">—</span><b>Route</b><span id="bcRoute">—</span></div>' +
      '<div class="bc-actions"><button id="bcTalk">💬 Talk</button><button id="bcFollow">🎯 Follow</button><button id="bcClose">✕</button></div>';
    host.appendChild(card);
    $('bcClose').onclick = function () { card.style.display = 'none'; };
    $('bcTalk').onclick = function () {
      var box = $('mmoChat'), inp = $('mmoChatIn');
      if (box) box.classList.remove('min');
      if (inp) { inp.value = '@' + ($('bcName').textContent || 'bot') + ' '; inp.focus(); }
      card.style.display = 'none';
    };
    $('bcFollow').onclick = function () {
      var b = card._bot;
      if (b && cam3d) { cam3d.target.set(b.group.position.x, 1.2, b.group.position.z); cam3d.r = 12; cam3d.lastUser = Date.now(); toast('🎯 Sinusundan si ' + b.n); }
    };
  }
  function showBotCard(b) {
    var card = $('botCard'); if (!card || !b) return;
    card._bot = b;
    var route = b.route || [];
    var next = route[(b.wp + 1) % Math.max(1, route.length)];
    $('bcEmo').textContent = JOB_EMO[b.job] || '🤖';
    $('bcName').textContent = b.n || 'Bot';
    $('bcMeta').textContent = (b.mood ? b.mood + ' · ' : '') + (b.walking ? 'walking' : 'working');
    $('bcJob').textContent = b.job || 'idle';
    $('bcNext').textContent = next ? (next.job || 'stop') + ' @ ' + next.x + ',' + next.z : '—';
    $('bcRoute').textContent = route.length + ' stops';
    card.style.display = 'block';
  }
  function hookBotPicking() {
    var dom = renderer3d && renderer3d.domElement; if (!dom || dom.dataset.studioPick) return; dom.dataset.studioPick = '1';
    window.addEventListener('mouseup', function (e) {
      var card = $('botCard');
      if (card && e.target && e.target.nodeType && card.contains(e.target)) return;
      if (e.button !== 0 || !camera3d || !window.__officeV9) return;
      if (typeof view === 'undefined' || view !== 'office') return;
      var r = dom.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      var nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -((e.clientY - r.top) / r.height) * 2 + 1;
      camera3d.updateMatrixWorld(true);
      var best = null, bd = .055;
      window.__officeV9.bots.forEach(function (b) {
        if (!b.group) return;
        var v = new THREE.Vector3(b.group.position.x, b.group.position.y + 1.1, b.group.position.z).project(camera3d);
        var d = Math.hypot(v.x - nx, v.y - ny);
        if (d < bd) { bd = d; best = b; }
      });
      if (best) { showBotCard(best); e.stopPropagation(); }
      else if (card) card.style.display = 'none';
    }, true);
  }

  function tryStudioFarmInteract() {
    var v9 = window.__officeV9;
    if (!v9 || !v9.crops || !v9.crops.length || typeof careAct !== 'function') return false;
    var usingPlayer = (typeof playerMode !== 'undefined' && playerMode && typeof player !== 'undefined' && player);
    var px = usingPlayer ? player.x : (cam3d ? cam3d.target.x : 23);
    var pz = usingPlayer ? player.z : (cam3d ? cam3d.target.z : 17);
    var best = null, bd = 3.6;
    v9.crops.forEach(function (c) {
      var d = Math.hypot(c.x - px, c.z - pz);
      if (d < bd) { bd = d; best = c; }
    });
    if (!best) return false;
    var st = (typeof CARE_STATE !== 'undefined' && CARE_STATE.farm || [])[best.idx];
    if (st && st.dead) { toast('🌱 Replanting plot ' + (best.idx + 1)); careAct('replant', null, best.idx); }
    else if (st && st.needWater) { toast('💧 Nag-water ng plot ' + (best.idx + 1)); careAct('water', null, best.idx); }
    else { toast('🌾 Harvest ng plot ' + (best.idx + 1)); careAct('harvest', null, best.idx); }
    return true;
  }
  function hookFarm() {
    var base = window.interactFarm;
    window.interactFarm = function () {
      if (tryStudioFarmInteract()) return true;
      return base ? base.apply(this, arguments) : false;
    };
    // Capture before the app's global E handler so crops win when in range.
    document.addEventListener('keydown', function (e) {
      if (typeof view === 'undefined' || view !== 'office') return;
      if (!e.key || e.key.toLowerCase() !== 'e') return;
      if (tryStudioFarmInteract()) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  // ---------- Batch 1 world controls ----------
  var WORLD_FEATURES = [
    ['rooftop', '🏙 Rooftop'], ['basement', '🔒 Vault'], ['elevator', '🛗 Elevator'],
    ['walkway', '🚶 Walkway'], ['holo', '👾 Holo AI'], ['wet', '💧 Wet floor'],
    ['neon', '💡 Neon'], ['drones', '🚁 Drones']
  ];
  function addWorldBar() {
    var card = document.querySelector('#v-layout .card');
    if (!card || $('edWorldBar')) return;
    var v9 = window.__officeV9;
    var saved = store.get('ccStudioWorld', {});
    var features = {};
    WORLD_FEATURES.forEach(function (f) {
      features[f[0]] = saved.features ? (saved.features[f[0]] !== false) : (saved[f[0]] !== false);
    });
    var bar = document.createElement('div');
    bar.className = 'ed-toolbar'; bar.id = 'edWorldBar';
    bar.innerHTML =
      '<span class="ed-group" style="margin:0">🌍 WORLD</span>' +
      '<label style="display:inline-flex;align-items:center;gap:4px;margin:0;font-size:10px">Time ' +
        '<select id="wNight"><option value="auto">Auto</option><option value="day">☀️ Araw</option><option value="night">🌙 Gabi</option></select></label>' +
      '<label style="display:inline-flex;align-items:center;gap:4px;margin:0;font-size:10px">Weather ' +
        '<select id="wWeather"><option value="clear">☀️ Clear</option><option value="rain">🌧️ Ulan</option><option value="storm">⛈️ Bagyo + kidlat</option></select></label>' +
      '<label style="display:inline-flex;align-items:center;gap:4px;margin:0;font-size:10px">Season ' +
        '<select id="wSeason"><option value="default">Default</option><option value="pasko">🎄 Pasko</option>' +
        '<option value="fiesta">🎉 Fiesta</option><option value="rainy">🌧️ Rainy</option></select></label>' +
      '<span class="sep"></span>' +
      WORLD_FEATURES.map(function (f) {
        return '<button data-wf="' + f[0] + '" title="Toggle ' + f[1] + '">' + f[1] + '</button>';
      }).join('');
    var first = card.querySelector('.ed-toolbar');
    if (first && first.nextSibling) card.insertBefore(bar, first.nextSibling);
    else card.appendChild(bar);

    $('wNight').value = saved.nightMode || 'auto';
    $('wWeather').value = saved.weather || 'clear';
    $('wSeason').value = saved.season || 'default';
    function persist() {
      saved.nightMode = $('wNight').value; saved.weather = $('wWeather').value;
      saved.season = $('wSeason').value; saved.features = features;
      store.set('ccStudioWorld', saved);
    }
    $('wNight').onchange = function () {
      if (v9 && typeof v9.setNight === 'function') v9.setNight(this.value === 'auto' ? 'auto' : this.value === 'night');
      persist(); toast('🌗 Oras: ' + this.options[this.selectedIndex].text + ' (guard values unchanged)');
    };
    $('wWeather').onchange = function () {
      if (v9 && typeof v9.setWeather === 'function') v9.setWeather(this.value);
      persist(); toast('🌦️ Weather: ' + this.options[this.selectedIndex].text);
    };
    $('wSeason').onchange = function () {
      if (v9 && typeof v9.setSeason === 'function') v9.setSeason(this.value);
      persist(); toast('🎊 Season: ' + this.options[this.selectedIndex].text);
    };
    qsa('[data-wf]', bar).forEach(function (b) {
      var k = b.dataset.wf;
      b.classList.toggle('on', features[k] !== false);
      b.onclick = function () {
        features[k] = !features[k];
        b.classList.toggle('on', features[k]);
        if (v9 && typeof v9.setWorldFeature === 'function') v9.setWorldFeature(k, features[k]);
        persist(); toast((features[k] ? '✅ ' : '🚫 ') + b.textContent.trim() + (features[k] ? ' ON' : ' OFF'));
      };
    });
    // Apply the persisted state once the 3D module is ready.
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var api9 = window.__officeV9;
      if (api9 && typeof api9.setWorldFeature === 'function') {
        WORLD_FEATURES.forEach(function (f) { api9.setWorldFeature(f[0], features[f[0]] !== false); });
        if (typeof api9.setWeather === 'function') api9.setWeather(saved.weather || 'clear');
        if (typeof api9.setSeason === 'function') api9.setSeason(saved.season || 'default');
        if (typeof api9.setNight === 'function') {
          var nm = saved.nightMode || 'auto';
          api9.setNight(nm === 'auto' ? 'auto' : nm === 'night');
        }
        clearInterval(iv);
      }
      if (tries > 60) clearInterval(iv);
    }, 250);
  }

  var BOT_FEATURES = [
    ['barista', '☕ Barista'], ['plants', '🌱 Plants'], ['fish', '🐠 Fish'],
    ['skyline', '🌃 Skyline'], ['ceiling', '☁️ Ceiling'], ['nameplates', '🏷 Names'],
    ['status', '💬 Status'], ['idle', '😴 Idle'], ['outfits', '🎩 Outfits'],
    ['pets', '🐾 Pets']
  ];
  function addBotBar() {
    var card = document.querySelector('#v-layout .card');
    if (!card || $('edBotBar')) return;
    var v9 = window.__officeV9;
    var saved = store.get('ccStudioBots', {});
    var features = {};
    BOT_FEATURES.forEach(function (f) { features[f[0]] = saved.features ? (saved.features[f[0]] !== false) : (saved[f[0]] !== false); });
    var bar = document.createElement('div');
    bar.className = 'ed-toolbar'; bar.id = 'edBotBar';
    bar.innerHTML = '<span class="ed-group" style="margin:0">🤖 BOT</span>' +
      BOT_FEATURES.map(function (f) {
        return '<button data-bf="' + f[0] + '" title="Toggle ' + f[1] + '">' + f[1] + '</button>';
      }).join('');
    var world = $('edWorldBar');
    if (world && world.nextSibling) card.insertBefore(bar, world.nextSibling);
    else if (world) card.appendChild(bar);
    else {
      var first = card.querySelector('.ed-toolbar');
      if (first && first.nextSibling) card.insertBefore(bar, first.nextSibling);
      else card.appendChild(bar);
    }
    qsa('[data-bf]', bar).forEach(function (b) {
      var k = b.dataset.bf;
      b.classList.toggle('on', features[k] !== false);
      b.onclick = function () {
        features[k] = !features[k];
        b.classList.toggle('on', features[k]);
        if (v9 && typeof v9.setBotFeature === 'function') v9.setBotFeature(k, features[k]);
        store.set('ccStudioBots', { features: features });
        toast((features[k] ? '✅ ' : '🚫 ') + b.textContent.trim() + (features[k] ? ' ON' : ' OFF'));
      };
    });
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var api9 = window.__officeV9;
      if (api9 && typeof api9.setBotFeature === 'function') {
        BOT_FEATURES.forEach(function (f) { api9.setBotFeature(f[0], features[f[0]] !== false); });
        clearInterval(iv);
      }
      if (tries > 60) clearInterval(iv);
    }, 250);
  }

  // ---------- boot ----------
  function boot() {
    if (document.querySelector('#v-layout .card')) buildShell();
    addWorldBar();
    addBotBar();
    addPhotoTools();
    addChatQuick();
    addBotCard();
    hookFarm();
    perfLoop();
    var retry = 0;
    var iv = setInterval(function () {
      retry++;
      addWorldBar();
      addBotBar();
      if (renderer3d && window.__officeV9) { hookBotPicking(); clearInterval(iv); }
      if (retry > 80) clearInterval(iv);
    }, 250);
    // Re-render the editor if the main app calls drawEditor on view changes.
    var baseRenderView = window.renderView;
    if (typeof baseRenderView === 'function') {
      window.renderView = function () { baseRenderView.apply(this, arguments); if (typeof view !== 'undefined' && view === 'layout') setTimeout(drawEditor, 0); };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
