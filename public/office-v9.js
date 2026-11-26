/* office-v9.js — Cyborg Cheebee Office.
   v9 "photographic" + v14/v15/v16 effects + v17-v23 "realistic streets" plus
   v24 court/ball/airliner realism and a v25 building pass: concrete columns,
   suspended ceiling tiles, HVAC vents, sprinklers, glass entry doors/canopy,
   wainscot, terrazzo, wayfinding and detailed reception/meeting/pantry/server
   zones. v26 view fix: ceiling tiles fade out in Silip/auto-xray so the bots
   stay easy to observe. v27 character life: walking routes, job-specific work
   animations, independent per-bot moods and extra cute shoes/hearts/sparkles.
   v28: ARYASKY joins as the 7th bot/artist and builds the OPISINA ART ZONE —
   blueprint desk, moodboards and zone maquettes as sample works. North city
   street, x1000 entrance road and east/west side worlds remain.
   v29: ceiling tiles are permanently see-through, the gray surround becomes
   grass/hills/farm, and the step/mood sprite leak is fixed (use .parent, not
   .parentNode) so draw calls stay flat instead of climbing into the thousands.
   v30: job-status antenna cues, freeze/detail/theme hooks and interactable
   crops for the new Office Studio editor.
   Window reflections, blind shadows, richer trim and cinematic grade remain.
   Layout still follows published planning concepts: WELCOME -> MAIN STREET ->
   FOCUS / MEET / GATHER -> SUPPORT. Loaded BEFORE the main app script. */
(function () {
  'use strict';

  var BOTS = [
    { id: 'cos',     n: 'Cos 💬',     c: '#f472b6', x: 23, z: -26, face: Math.PI },
    { id: 'seo',     n: 'Seo 🔍',     c: '#4a9fd6', x: 23, z: -26, face: 0 },
    { id: 'product', n: 'Product 📦', c: '#f0b429', x: 23, z: -26, face: 0 },
    { id: 'mgr',     n: 'Mgr 📋',     c: '#3f9d6a', x: 23, z: 60,   face: Math.PI / 2 },
    { id: 'writer',  n: 'Writer ✍️', c: '#e8622c', x: 23, z: 60,   face: -Math.PI / 2 },
    { id: 'aryasky', n: 'ARYASKY 🎨', c: '#6bb3a6', x: 23, z: -26, face: Math.PI },
    { id: 'fixer',   n: 'Fixer 🛠️',  c: '#22c55e', x: -20, z: 17, face: 0 },
    { id: 'hflex',   n: 'HF Lead 📝', c: '#77eaff', x: -20, z: 17, face: 0 },
    { id: 'hfmotion',n: 'HF Motion ✨', c: '#a78bfa', x: 66, z: 17, face: 0 },
    { id: 'hfrender',n: 'HF QA 🧪',   c: '#75f0c0', x: 66, z: 17, face: 0 },
    // Useful production bots (already wired to server routines)
    { id: 'tagedit',  n: 'Tagalog Editor', c: '#ff9b5f', x: 23, z: -26, face: Math.PI },
    { id: 'bantay',   n: 'Bantay Safety',  c: '#ff5c7a', x: 23, z: 60, face: Math.PI },
    { id: 'scout',    n: 'Dahon Scout',    c: '#7cf0c8', x: 23, z: 60, face: Math.PI },
    { id: 'videoed',  n: 'Video Editor',   c: '#a78bfa', x: -20, z: 17, face: 0 },
    { id: 'publisher',n: 'Publisher',      c: '#ffd34d', x: 66, z: 17, face: 0 },
    { id: 'analytics',n: 'Analytics',      c: '#63e6ff', x: 66, z: 17, face: 0 },
    { id: 'community',n: 'Community',      c: '#b07cff', x: 23, z: -26, face: -Math.PI / 2 }
  ];
  var EMOS = ['😊', '😄', '🤩', '✨', '💚', '🙌'];
  // Each bot gets its own route and work shift, so nobody just stands still.
  var BOT_ROUTES = {
    cos: [
      { x: 23, z: 27.5, job: 'greet', dur: 4200, face: Math.PI },
      { x: 19.5, z: 30.2, job: 'wave', dur: 3200, face: -.6 },
      { x: 26.5, z: 29.4, job: 'greet', dur: 3600, face: 2.4 }
    ],
    seo: [
      { x: 10, z: 10.5, job: 'type', dur: 5000, face: 0 },
      { x: 14, z: 10.5, job: 'plan', dur: 3400, face: -1.2 },
      { x: 12, z: 14.2, job: 'type', dur: 3600, face: Math.PI }
    ],
    product: [
      { x: 18, z: 10.5, job: 'pack', dur: 4600, face: 0 },
      { x: 21, z: 8.2, job: 'plan', dur: 3200, face: 1.1 },
      { x: 16, z: 14, job: 'pack', dur: 3800, face: Math.PI }
    ],
    joker: [
      { x: 13, z: 23.2, job: 'joke', dur: 3800, face: Math.PI },
      { x: 18, z: 22, job: 'wave', dur: 3000, face: -1.4 },
      { x: 10, z: 27, job: 'joke', dur: 3600, face: .6 }
    ],
    mgr: [
      { x: 36, z: 11, job: 'plan', dur: 4800, face: Math.PI / 2 },
      { x: 40, z: 12.5, job: 'plan', dur: 3400, face: -1 },
      { x: 33, z: 8, job: 'type', dur: 3600, face: 2.2 }
    ],
    writer: [
      { x: 36, z: 28, job: 'write', dur: 5000, face: -Math.PI / 2 },
      { x: 40, z: 30, job: 'write', dur: 3400, face: 1.2 },
      { x: 33, z: 26, job: 'pack', dur: 3600, face: 2.4 }
    ],
    aryasky: [
      { x: 30.1, z: 21.3, job: 'design', dur: 4600, face: Math.PI },
      { x: 32.6, z: 21.8, job: 'review', dur: 3600, face: -0.5 },
      { x: 35.0, z: 20.6, job: 'showcase', dur: 3800, face: -1.1 }
    ],
    fixer: [
      { x: 16, z: 14.5, job: 'look', dur: 3600, face: 0 },
      { x: 14.8, z: 15.8, job: 'type', dur: 3200, face: -0.4 },
      { x: 17.2, z: 16.0, job: 'wave', dur: 3000, face: .5 },
      { x: 16, z: 14.5, job: 'greet', dur: 3400, face: 0 }
    ],
    hflex: [
      { x: 24, z: 10.5, job: 'plan', dur: 4600, face: 0 },
      { x: 26.5, z: 13, job: 'review', dur: 3400, face: -0.6 },
      { x: 23, z: 8.5, job: 'greet', dur: 3600, face: 2.2 }
    ],
    hfmotion: [
      { x: 28, z: 10.5, job: 'edit', dur: 4800, face: 0 },
      { x: 30, z: 12.5, job: 'edit', dur: 3200, face: -1 },
      { x: 26, z: 14, job: 'review', dur: 3800, face: 2.4 }
    ],
    hfrender: [
      { x: 32, z: 10.5, job: 'render', dur: 4400, face: 0 },
      { x: 34, z: 13, job: 'type', dur: 3400, face: -1.1 },
      { x: 29, z: 9, job: 'render', dur: 3800, face: 2.1 }
    ]
  };
  var MOODS = {
    greet: ['💬', '😊', '🙌'], wave: ['😄', '✨', '💚'], type: ['⌨️', '🤔', '💡'],
    pack: ['📦', '😄', '🙌'], joke: ['😄', '🤪', '✨'], plan: ['📋', '✅', '😌'],
    write: ['✍️', '💡', '😊'], design: ['🎨', '🖌️', '💡'],
    review: ['📐', '🔍', '✨'], showcase: ['🖼️', '🙌', '😍'],
    edit: ['✂️', '🎬', '💡'], render: ['🧪', '⏱️', '🎞️'],
    walk: ['😊', '✨', '🙂']
  };
  var cuteBots = [], animId = null, animParts = [], _bubV = null;
  // Layer state containers (previously undeclared -> silent builder failures)
  var ISLANDS = [[-17.6,-24.3],[17.6,-24.3],[-28.5,9.3],[28.5,9.3],[0,30]];
  var fallfx = [];
  var xmasfx = { lights:[], gifts:[], snow:[], tree:null, star:null };
  var megav = { meteors:[], asteroids:null, galaxy:null, footRings:[], rimMats:[] };
  var specBots = [];
  var mb2 = { lastEvent:0, event:'', danceUntil:0, paradeUntil:0 };
  var TEX = {}, screenCounter = 0;
  var fx = { shafts: [], screens: [], dust: null, bubbles: [], steam: [], plants: [], sparkles: [], birds: [], scan: [], windows: [], sheen: null,
    auras: [], antennae: [], glints: [], bands: [], cars: [], sun: null, sky: null,
    blinds: [], reflections: [], signals: [], peds: [], ballers: [], ball: null, planes: [], ceilings: [], steps: [], moods: [],
    scenery: [], crops: [], softScenery: [],
    // Batch 1 world layer (all optional, none touch the white-out guards).
    night: null, weather: { rain: null, flash: null, puddles: [], rainbow: null },
    seasons: {}, walkways: [], holo: [], wet: [], neon: [], drones: [], rooftop: null, basement: null, elevator: null,
    // Batch 2 character layer (items 11-20).
    barista: null, growthPlants: [], fish: null, skylineLights: [], ceilingProj: null,
    pets: [], outfits: [],
    botFeatures: { barista: true, plants: true, fish: true, skyline: true, ceiling: false,
      nameplates: false, status: false, idle: true, outfits: true, pets: true } };
  // v30 job cues: the antenna tip reads like a tiny status lamp.
  var JOB_HINTS = {
    greet: ['#7cf7ff', .85], wave: ['#7cf7ff', 1.1], type: ['#8fd0ff', 1.4],
    pack: ['#ffd34d', 1.0], joke: ['#ff9fc0', 1.5], plan: ['#b9d7ff', .7],
    write: ['#8fd0ff', 1.2], design: ['#c9a6ff', 1.3], review: ['#ff9b97', .9],
    showcase: ['#ffd34d', 1.6], walk: ['#ffffff', .7]
  };
  // v30 seasonal material swaps only touch green scenery materials. The
  // white-out guards (bg/fog/ambient/exposure/night) are never changed here.
  var THEME_HSL = {
    default: { h: 0, s: 0, l: 0 },
    fiesta: { h: .07, s: .18, l: .02 },
    rainy: { h: .56, s: -.22, l: -.07 },
    pasko: { h: -.03, s: .1, l: -.01 }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rnd(seed) {
    return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  }
  function addO(o) {
    o.userData.v9 = true; // protect v9 geometry from the old >3.15m "simple mode" cull
    var parent = (typeof structureGroup !== 'undefined' && structureGroup) ? structureGroup : g.level;
    parent.add(o); return o;
  }
  function solid(c, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .62, metalness: .1 }, opts || {}));
  }
  function box(w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof mat === 'string' ? solid(mat) : mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return addO(m);
  }
  function bx(w, h, d, c, x, y, z, glow) {
    return box(w, h, d, glow ? solid(c, { emissive: c, emissiveIntensity: .55 }) : solid(c), x, y, z);
  }
  function cyl(r, h, c, x, y, z, glow) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14),
      glow ? solid(c, { emissive: c, emissiveIntensity: .7 }) : solid(c));
    m.position.set(x, y, z); m.castShadow = true; return addO(m);
  }
  function floor(w, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), typeof mat === 'string' ? solid(mat) : mat);
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; return addO(m);
  }
  function planeAt(w, d, mat, x, y, z, rotY) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2; m.rotation.z = rotY || 0;
    m.position.set(x, y, z); return addO(m);
  }

  /* ---------- procedural textures: cheap, crisp, no image downloads ---------- */
  function makeTex(key, painter, rx, ry) {
    var ck = key + '|' + (rx || 1) + '|' + (ry || 1);
    if (TEX[ck]) return TEX[ck];
    var cv = document.createElement('canvas'); cv.width = cv.height = 256;
    var q = cv.getContext('2d'); painter(q, 256);
    var t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    t.needsUpdate = true;
    t.userData = t.userData || {}; // older three builds do not initialise Texture.userData
    t.userData.cv = cv; t.userData.q = q;
    TEX[ck] = t; return t;
  }
  // Wide, high-resolution canvas for the exterior bot-output billboard.
  function makeBoardTex(key, w, h) {
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var q = cv.getContext('2d');
    var t = new THREE.CanvasTexture(cv);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.needsUpdate = true;
    t.userData = { cv: cv, q: q };
    return t;
  }
  function carpetTex(base, line, rx, ry) {
    return makeTex('carpet-' + base + '-' + line + '-v2', function (q, S) {
      q.fillStyle = base; q.fillRect(0, 0, S, S);
      var r = rnd(19);
      for (var i = 0; i < 3400; i++) {
        q.fillStyle = 'rgba(255,255,255,' + (.02 + r() * .08).toFixed(3) + ')';
        q.fillRect(r() * S, r() * S, 1.5, 1.5);
      }
      q.globalAlpha = .3; q.strokeStyle = line; q.lineWidth = 2;
      for (var p = 0; p <= S; p += 32) {
        q.beginPath(); q.moveTo(p, 0); q.lineTo(p, S); q.stroke();
        q.beginPath(); q.moveTo(0, p); q.lineTo(S, p); q.stroke();
      }
      q.globalAlpha = .12; q.lineWidth = 1;
      for (var p2 = 16; p2 <= S; p2 += 32) {
        q.beginPath(); q.moveTo(p2, 0); q.lineTo(p2, S); q.stroke();
        q.beginPath(); q.moveTo(0, p2); q.lineTo(S, p2); q.stroke();
      }
      q.globalAlpha = 1;
    }, rx, ry);
  }
  function woodTex(base, dark, rx, ry) {
    return makeTex('wood-' + base + '-' + dark, function (q, S) {
      q.fillStyle = base; q.fillRect(0, 0, S, S);
      var r = rnd(31);
      for (var y = 0; y < S; y += 6) {
        q.strokeStyle = 'rgba(255,255,255,' + (.03 + r() * .05).toFixed(3) + ')';
        q.lineWidth = 1 + r() * 2; q.beginPath();
        for (var x = 0; x <= S; x += 8) q.lineTo(x, y + Math.sin(x / 23 + y) * 2.2);
        q.stroke();
      }
      q.strokeStyle = dark; q.globalAlpha = .22; q.lineWidth = 2;
      for (var k = 0; k < 5; k++) {
        var yy = 24 + r() * 210; q.beginPath(); q.moveTo(0, yy); q.lineTo(S, yy + r() * 5 - 2.5); q.stroke();
      }
      q.globalAlpha = 1;
    }, rx, ry);
  }
  function plankTex(rx, ry) {
    return makeTex('plank', function (q, S) {
      q.fillStyle = '#c3a276'; q.fillRect(0, 0, S, S);
      var r = rnd(7);
      for (var x = 0; x < S; x += 32) {
        q.fillStyle = (x / 32) % 2 ? '#b99a70' : '#c9a97d'; q.fillRect(x, 0, 30, S);
        q.fillStyle = 'rgba(80,55,30,.35)'; q.fillRect(x + 30, 0, 2, S);
        for (var k = 0; k < 8; k++) {
          q.fillStyle = 'rgba(255,255,255,' + (.025 + r() * .05).toFixed(3) + ')';
          q.fillRect(x + 2 + r() * 25, r() * S, 1, 18 + r() * 40);
        }
      }
    }, rx, ry);
  }
  function tileTex(rx, ry) {
    return makeTex('tile', function (q, S) {
      q.fillStyle = '#c9d2dc'; q.fillRect(0, 0, S, S);
      q.fillStyle = 'rgba(255,255,255,.28)'; q.fillRect(0, 0, S, 4);
      q.strokeStyle = '#9ba9ba'; q.lineWidth = 2;
      for (var p = 0; p <= S; p += 32) {
        q.beginPath(); q.moveTo(p, 0); q.lineTo(p, S); q.stroke();
        q.beginPath(); q.moveTo(0, p); q.lineTo(S, p); q.stroke();
      }
    }, rx, ry);
  }
  function stoneTex(rx, ry) {
    return makeTex('stone-v2', function (q, S) {
      q.fillStyle = '#b9b2a5'; q.fillRect(0, 0, S, S);
      var r = rnd(43);
      for (var i = 0; i < 1800; i++) {
        q.fillStyle = r() > .5 ? 'rgba(255,255,255,.09)' : 'rgba(60,55,50,.07)';
        q.fillRect(r() * S, r() * S, 2 + r() * 3, 2 + r() * 3);
      }
      q.strokeStyle = '#8f887c'; q.lineWidth = 2;
      for (var p = 0; p <= S; p += 64) {
        q.beginPath(); q.moveTo(p, 0); q.lineTo(p, S); q.stroke();
        q.beginPath(); q.moveTo(0, p); q.lineTo(S, p); q.stroke();
      }
      // ARYASKY: offset paver highlight gives the sidewalk real depth from above.
      q.strokeStyle = 'rgba(255,255,255,.16)'; q.lineWidth = 1;
      for (var p2 = 2; p2 <= S; p2 += 64) {
        q.beginPath(); q.moveTo(p2, 0); q.lineTo(p2, S); q.stroke();
        q.beginPath(); q.moveTo(0, p2); q.lineTo(S, p2); q.stroke();
      }
    }, rx, ry);
  }
  function asphaltTex(rx, ry) {
    return makeTex('asphalt-v2', function (q, S) {
      q.fillStyle = '#33383f'; q.fillRect(0, 0, S, S);
      var r = rnd(77);
      for (var i = 0; i < 5200; i++) {
        var v = r();
        q.fillStyle = v > .72 ? 'rgba(212,222,232,.075)' : v > .4 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.11)';
        var s = 1 + r() * 2.8;
        q.fillRect(r() * S, r() * S, s, s);
      }
      // ARYASKY: longitudinal tire wear, patched repairs and a fine hairline crack.
      q.fillStyle = 'rgba(212,220,228,.035)';
      for (var k = 0; k < 5; k++) q.fillRect(0, 24 + k * 52, S, 12);
      q.fillStyle = 'rgba(14,17,22,.30)';
      q.fillRect(S * .12, S * .26, S * .28, S * .13);
      q.fillRect(S * .60, S * .64, S * .32, S * .11);
      q.strokeStyle = 'rgba(10,12,16,.55)'; q.lineWidth = 2;
      q.beginPath(); q.moveTo(0, S * .56); q.lineTo(S * .28, S * .51);
      q.lineTo(S * .56, S * .59); q.lineTo(S, S * .53); q.stroke();
      q.strokeStyle = 'rgba(255,255,255,.055)'; q.lineWidth = 1;
      q.beginPath(); q.moveTo(S * .20, S * .82); q.lineTo(S * .44, S * .79); q.stroke();
    }, rx, ry);
  }
  function fabricTex(base, rx, ry) {
    return makeTex('fabric-' + base, function (q, S) {
      q.fillStyle = base; q.fillRect(0, 0, S, S);
      q.strokeStyle = 'rgba(255,255,255,.07)'; q.lineWidth = 1;
      for (var p = 0; p < S; p += 5) {
        q.beginPath(); q.moveTo(p, 0); q.lineTo(p, S); q.stroke();
        q.beginPath(); q.moveTo(0, p); q.lineTo(S, p); q.stroke();
      }
    }, rx, ry);
  }
  function rugTex(base, accent, rx, ry) {
    return makeTex('rug-' + base + '-' + accent + '-v2', function (q, S) {
      q.fillStyle = base; q.fillRect(0, 0, S, S);
      q.strokeStyle = accent; q.lineWidth = 9; q.strokeRect(13, 13, S - 26, S - 26);
      q.lineWidth = 3; q.strokeRect(28, 28, S - 56, S - 56);
      q.globalAlpha = .45; q.lineWidth = 5;
      for (var p = -S; p < S * 2; p += 46) {
        q.beginPath(); q.moveTo(p, 0); q.lineTo(p + S, S); q.stroke();
      }
      q.globalAlpha = .22; q.lineWidth = 2;
      for (var p2 = -S; p2 < S * 2; p2 += 46) {
        q.beginPath(); q.moveTo(p2 + 22, 0); q.lineTo(p2 + 22 + S, S); q.stroke();
      }
      q.globalAlpha = .18;
      q.strokeStyle = '#ffffff'; q.lineWidth = 2;
      q.beginPath(); q.arc(S / 2, S / 2, S * 0.18, 0, Math.PI * 2); q.stroke();
      q.globalAlpha = 1;
    }, rx, ry);
  }
  function skyTex() {
    return makeTex('sky', function (q, S) {
      var g = q.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0, '#4f83bf'); g.addColorStop(.42, '#8db9df');
      g.addColorStop(.78, '#c9dff0'); g.addColorStop(1, '#f2e4cf');
      q.fillStyle = g; q.fillRect(0, 0, S, S);
      // low hazy sun to the left
      var sg = q.createRadialGradient(S * .22, S * .28, 2, S * .22, S * .28, S * .34);
      sg.addColorStop(0, 'rgba(255,246,214,.95)'); sg.addColorStop(.18, 'rgba(255,226,170,.42)');
      sg.addColorStop(1, 'rgba(255,220,160,0)');
      q.fillStyle = sg; q.fillRect(0, 0, S, S);
      var r = rnd(11);
      for (var i = 0; i < 16; i++) {
        var cx = r() * S, cy = 30 + r() * (S - 70), rw = 34 + r() * 80, rh = 8 + r() * 16;
        var cg = q.createRadialGradient(cx, cy, 1, cx, cy, rw);
        cg.addColorStop(0, 'rgba(255,255,255,' + (.28 + r() * .26).toFixed(2) + ')');
        cg.addColorStop(1, 'rgba(255,255,255,0)');
        q.save(); q.translate(cx, cy); q.scale(1, rh / rw); q.translate(-cx, -cy);
        q.fillStyle = cg; q.beginPath(); q.arc(cx, cy, rw, 0, 6.3); q.fill(); q.restore();
      }
      q.fillStyle = 'rgba(255,244,222,.16)'; q.fillRect(0, S * .82, S, S * .18);
    }, 1, 1);
  }
  function glowTex() {
    return makeTex('glow', function (q, S) {
      var g = q.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
      g.addColorStop(0, 'rgba(255,244,214,.95)');
      g.addColorStop(.35, 'rgba(255,216,150,.42)');
      g.addColorStop(1, 'rgba(255,200,120,0)');
      q.fillStyle = g; q.fillRect(0, 0, S, S);
    }, 1, 1);
  }
  function dotTex() {
    return makeTex('dot', function (q, S) {
      var g = q.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(.45, 'rgba(255,255,255,.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      q.fillStyle = g; q.fillRect(0, 0, S, S);
    }, 1, 1);
  }
  function blindTex() {
    return makeTex('blind-v2', function (q, S) {
      q.clearRect(0, 0, S, S);
      for (var i = 0; i < 7; i++) {
        var y = 8 + i * 36, h = 18;
        var g = q.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, 'rgba(12,22,40,0)');
        g.addColorStop(.35, 'rgba(12,22,40,.55)');
        g.addColorStop(.5, 'rgba(12,22,40,.82)');
        g.addColorStop(.65, 'rgba(12,22,40,.55)');
        g.addColorStop(1, 'rgba(12,22,40,0)');
        q.fillStyle = g; q.fillRect(0, y, S, h);
        q.fillStyle = 'rgba(255,255,255,.04)';
        q.fillRect(0, y + 1, S, 2);
      }
    }, 1, 1);
  }
  function windowReflectionTex() {
    return makeTex('winrefl', function (q, S) {
      var W = S, H = S;
      q.clearRect(0, 0, W, H);
      var g = q.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(190,222,246,.55)');
      g.addColorStop(.45, 'rgba(150,195,230,.18)');
      g.addColorStop(1, 'rgba(255,236,206,.12)');
      q.fillStyle = g; q.fillRect(0, 0, W, H);
      var r = rnd(137);
      // reflected clouds, squashed into the narrow strip
      for (var i = 0; i < 14; i++) {
        var cx = r() * W, cy = 20 + r() * H * .55, rw = 40 + r() * 100, rh = 10 + r() * 20;
        var cg = q.createRadialGradient(cx, cy, 1, cx, cy, rw);
        cg.addColorStop(0, 'rgba(255,255,255,' + (.22 + r() * .22).toFixed(2) + ')');
        cg.addColorStop(1, 'rgba(255,255,255,0)');
        q.save(); q.translate(cx, cy); q.scale(1, rh / rw); q.translate(-cx, -cy);
        q.fillStyle = cg; q.beginPath(); q.arc(cx, cy, rw, 0, 6.3); q.fill(); q.restore();
      }
      // reflected buildings along the bottom edge
      q.fillStyle = 'rgba(38,54,78,.32)';
      for (var bx = 0; bx < W;) {
        var bw = 28 + r() * 46, bh = 20 + r() * 42;
        q.fillRect(bx, H - bh, bw, bh); bx += bw + 5 + r() * 12;
      }
      // diagonal glass sheen
      q.strokeStyle = 'rgba(255,255,255,.20)'; q.lineWidth = 12;
      for (var s = -W; s < W * 1.5; s += 240) {
        q.beginPath(); q.moveTo(s, H); q.lineTo(s + H * 1.3, 0); q.stroke();
      }
    }, 1, 1);
  }
  function windowReflection() {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(46, 2.5),
      new THREE.MeshBasicMaterial({ map: windowReflectionTex(), transparent: true, opacity: .24,
        depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false }));
    m.position.set(23, 1.95, .20); m.renderOrder = 3; addO(m);
    fx.sky = fx.sky || {}; fx.sky.refl = m;
    fx.reflections.push({ m: m, base: .24, p: 9.3 });
  }
  function glintTex() {
    return makeTex('glint', function (q, S) {
      q.clearRect(0, 0, S, S);
      q.save(); q.translate(S / 2, S / 2); q.rotate(-.52);
      var g = q.createLinearGradient(-S / 2, 0, S / 2, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(.42, 'rgba(255,255,255,.05)');
      g.addColorStop(.5, 'rgba(255,255,255,.72)');
      g.addColorStop(.58, 'rgba(255,255,255,.05)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      q.fillStyle = g; q.fillRect(-S, -S * 2, S * 2, S * 4); q.restore();
    }, 1, 1);
  }
  function artTex(seed) {
    return makeTex('art-' + seed, function (q, S) {
      var r = rnd(seed * 37 + 11);
      var pal = [['#e8d6b8', '#3f7d78', '#c96f5e', '#2f3d52'],
                 ['#d9e4ef', '#4a7fb0', '#e0a83a', '#3f5a76'],
                 ['#efe1cf', '#8f6fd8', '#3f9d6a', '#b07b3d']][seed % 3];
      q.fillStyle = pal[0]; q.fillRect(0, 0, S, S);
      for (var i = 0; i < 5; i++) {
        q.globalAlpha = .55 + r() * .35; q.fillStyle = pal[1 + (i % 3)];
        if (i % 2) { q.beginPath(); q.arc(r() * S, r() * S, 28 + r() * 68, 0, 6.3); q.fill(); }
        else q.fillRect(r() * S * .7, r() * S * .7, 46 + r() * 90, 18 + r() * 60);
      }
      q.globalAlpha = .5; q.strokeStyle = pal[3]; q.lineWidth = 3;
      for (var k = 0; k < 4; k++) {
        q.beginPath(); q.moveTo(r() * S, r() * S); q.lineTo(r() * S, r() * S); q.stroke();
      }
      q.globalAlpha = 1;
    }, 1, 1);
  }
  function blueprintTex() {
    return makeTex('blueprint', function (q, S) {
      q.fillStyle = '#173b46'; q.fillRect(0, 0, S, S);
      q.strokeStyle = 'rgba(150,215,205,.22)'; q.lineWidth = 1;
      for (var i = 0; i <= S; i += 16) {
        q.beginPath(); q.moveTo(i, 0); q.lineTo(i, S); q.stroke();
        q.beginPath(); q.moveTo(0, i); q.lineTo(S, i); q.stroke();
      }
      q.strokeStyle = '#e3b159'; q.lineWidth = 6; q.strokeRect(26, 26, S - 52, S - 52);
      q.fillStyle = 'rgba(107,179,166,.85)';
      q.fillRect(58, 62, 68, 62); q.fillRect(150, 62, 48, 62);
      q.fillStyle = 'rgba(255,102,71,.8)'; q.fillRect(58, 150, 140, 40);
      q.fillStyle = 'rgba(227,177,89,.9)'; q.fillRect(58, 206, 48, 28);
      q.strokeStyle = '#eaf6ff'; q.lineWidth = 3;
      q.beginPath(); q.moveTo(34, 130); q.lineTo(S - 34, 130); q.stroke();
      q.beginPath(); q.moveTo(138, 40); q.lineTo(138, S - 40); q.stroke();
    }, 1, 1);
  }
  function wallTex() {
    return makeTex('wall', function (q, S) {
      q.fillStyle = '#e6e2da'; q.fillRect(0, 0, S, S);
      var r = rnd(5);
      for (var i = 0; i < 1300; i++) {
        q.fillStyle = 'rgba(110,108,100,' + (.012 + r() * .024).toFixed(3) + ')';
        q.fillRect(r() * S, r() * S, 2, 2);
      }
      // subtle drywall panel joints read as real architectural seams at distance
      for (var p = 0; p <= S; p += 64) {
        q.fillStyle = 'rgba(96,102,108,.10)'; q.fillRect(p, 0, 1, S);
        q.fillStyle = 'rgba(255,255,255,.16)'; q.fillRect(p + 1, 0, 1, S);
      }
      q.fillStyle = 'rgba(96,102,108,.07)'; q.fillRect(0, 128, S, 1);
    }, 6, 3);
  }
  function concreteTex() {
    return makeTex('concrete', function (q, S) {
      q.fillStyle = '#d9dad5'; q.fillRect(0, 0, S, S);
      var r = rnd(13);
      for (var i = 0; i < 1600; i++) {
        q.fillStyle = 'rgba(72,84,96,' + (.012 + r() * .03).toFixed(3) + ')';
        q.fillRect(r() * S, r() * S, 2 + r() * 3, 2 + r() * 3);
      }
      q.strokeStyle = 'rgba(88,98,108,.10)'; q.lineWidth = 2;
      for (var p = 0; p <= S; p += 64) {
        q.beginPath(); q.moveTo(p, 0); q.lineTo(p, S); q.stroke();
        q.beginPath(); q.moveTo(0, p); q.lineTo(S, p); q.stroke();
      }
    }, 2, 2);
  }
  function grassTex() {
    return makeTex('grass', function (q, S) {
      var r = rnd(907);
      q.fillStyle = '#4f8a4a'; q.fillRect(0, 0, S, S);
      for (var i = 0; i < 2200; i++) {
        q.fillStyle = i % 4 === 0 ? 'rgba(146,196,118,.26)' : i % 3 ? 'rgba(104,156,86,.24)' : 'rgba(43,92,50,.28)';
        q.fillRect(r() * S, r() * S, 2 + r() * 5, 1.5 + r() * 4);
      }
      for (var k = 0; k < 22; k++) {
        q.fillStyle = k % 3 ? 'rgba(232,214,150,.14)' : 'rgba(255,245,200,.10)';
        q.beginPath(); q.arc(r() * S, r() * S, 3 + r() * 10, 0, 6.3); q.fill();
      }
      // subtle path-like highlights
      for (var j = 0; j < 120; j++) {
        q.fillStyle = 'rgba(180,210,150,.08)';
        q.fillRect(r() * S, r() * S, 6 + r() * 18, 1 + r() * 2);
      }
    }, 14, 14);
  }
  function ceilingTex() {
    return makeTex('ceiling-tile-v2', function (q, S) {
      q.fillStyle = '#e9edf0'; q.fillRect(0, 0, S, S);
      var r = rnd(23);
      for (var i = 0; i < 2200; i++) {
        q.fillStyle = 'rgba(86,102,118,' + (.015 + r() * .04).toFixed(3) + ')';
        q.fillRect(r() * S, r() * S, 2, 2);
      }
      q.strokeStyle = 'rgba(118,132,146,.34)'; q.lineWidth = 5;
      q.strokeRect(0, 0, S, S);
      q.strokeStyle = 'rgba(255,255,255,.55)'; q.lineWidth = 2;
      q.beginPath(); q.moveTo(5, 5); q.lineTo(S - 5, 5); q.stroke();
      // subtle inner tile cross
      q.strokeStyle = 'rgba(118,132,146,.12)'; q.lineWidth = 2;
      q.beginPath(); q.moveTo(S / 2, 8); q.lineTo(S / 2, S - 8); q.stroke();
      q.beginPath(); q.moveTo(8, S / 2); q.lineTo(S - 8, S / 2); q.stroke();
    }, 1, 1);
  }
  function metalTex() {
    return makeTex('brushed-metal', function (q, S) {
      q.fillStyle = '#aeb8c4'; q.fillRect(0, 0, S, S);
      var r = rnd(41);
      for (var y = 0; y < S; y += 2) {
        q.fillStyle = 'rgba(255,255,255,' + (.02 + r() * .05).toFixed(3) + ')';
        q.fillRect(0, y, S, 1);
      }
      for (var i = 0; i < 260; i++) {
        q.fillStyle = 'rgba(58,72,90,' + (.015 + r() * .028).toFixed(3) + ')';
        q.fillRect(r() * S, r() * S, 1 + r() * 12, 1);
      }
    }, 1, 1);
  }
  function terrazzoTex() {
    return makeTex('terrazzo', function (q, S) {
      q.fillStyle = '#d8dad3'; q.fillRect(0, 0, S, S);
      var r = rnd(67), cols = ['#8d9aa6', '#b98d6d', '#6f7d8c', '#f2eee4'];
      for (var i = 0; i < 950; i++) {
        q.fillStyle = cols[Math.floor(r() * cols.length)];
        q.globalAlpha = .32 + r() * .4;
        q.beginPath(); q.ellipse(r() * S, r() * S, 1 + r() * 4, 1 + r() * 2, r() * 6.3, 0, 6.3); q.fill();
      }
      q.globalAlpha = 1;
    }, 4, 3);
  }

  /* ---------- depth cues: contact shadow + warm light pool ---------- */
  function shadow(x, z, rx, rz, op) {
    var m = new THREE.Mesh(new THREE.CircleGeometry(1, 20),
      new THREE.MeshBasicMaterial({ color: '#0a1220', transparent: true, opacity: op || .16, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.scale.set(rx, rz, 1);
    m.position.set(x, .011, z); m.renderOrder = 1; return addO(m);
  }
  function lightPool(x, z, r, color) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2),
      new THREE.MeshBasicMaterial({ map: glowTex(), color: color || '#ffd6a0', transparent: true,
        opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, .017, z); m.renderOrder = 2; return addO(m);
  }
  function lightShaft(x, z, r, color) {
    var m = new THREE.Mesh(new THREE.ConeGeometry(r, 2.42, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: color || '#ffd7a0', transparent: true, opacity: .06,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set(x, 1.21, z); m.renderOrder = 3; addO(m);
    fx.shafts.push({ m: m, p: x + z });
  }
  function dustField() {
    var pos = [], ph = [], N = 150;
    for (var i = 0; i < N; i++) {
      pos.push(2 + Math.random() * 42, .4 + Math.random() * 2.7, 1 + Math.random() * 32);
      ph.push(Math.random() * 6.3);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({ map: dotTex(), color: '#ffe9c0', size: .09,
      transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    var pts = new THREE.Points(geo, mat); addO(pts);
    fx.dust = { pts: pts, pos: pos, ph: ph };
  }
  function coffeeSteam(x, z) {
    for (var i = 0; i < 2; i++) {
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: '#fff2dd',
        transparent: true, opacity: .16, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false }));
      s.position.set(x + (i ? .035 : -.035), 1.13 + i * .1, z + .04);
      s.scale.set(.13, .2, 1); s.renderOrder = 4; addO(s);
      fx.steam.push({ m: s, x: s.position.x, z: z, base: s.position.y, p: x + i * 2.1 });
    }
  }
  function birds() {
    for (var i = 0; i < 3; i++) {
      var g = new THREE.Group();
      var mat = solid('#334155', { roughness: 1 });
      [-1, 1].forEach(function (side) {
        var w = new THREE.Mesh(new THREE.BoxGeometry(.3, .025, .02), mat);
        w.position.x = side * .14; w.rotation.z = side * .3; w.userData.v9 = true; g.add(w);
      });
      var body = new THREE.Mesh(new THREE.SphereGeometry(.045, 6, 4), mat);
      body.userData.v9 = true; g.add(body);
      g.position.set(-12 + i * 9, 5.6 + i * .9, -12 - i * 2);
      g.scale.setScalar(.75 + i * .12); addO(g);
      fx.birds.push({ g: g, base: g.position.y, p: i * 2.1, sp: .45 + i * .12 });
    }
  }
  function floorSheen() {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.15),
      new THREE.MeshBasicMaterial({ map: dotTex(), color: '#fff0cc', transparent: true, opacity: .08,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(4, .026, 23.2); m.renderOrder = 4; addO(m);
    fx.sheen = m;
  }
  function botSparkles(group, idx) {
    for (var i = 0; i < 2; i++) {
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: i ? '#fff0a8' : '#ffffff',
        transparent: true, opacity: .5, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false }));
      s.position.set(i ? .42 : -.42, 1.35 + i * .28, .12);
      s.scale.setScalar(.1 + i * .03); s.userData.v9 = true; group.add(s);
      fx.sparkles.push({ m: s, base: s.position.x, p: idx * 1.7 + i * 2.4 });
    }
  }

  /* ---------- v15 beauty details ---------- */
  function botFlair(group, bot, idx) {
    [-1, 1].forEach(function (side) {
      var foot = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), solid(bot.c));
      foot.scale.set(1, .45, 1.35); foot.position.set(side * .17, .035, .12);
      foot.userData.v9 = true; group.add(foot);
    });
    var armL = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .34, 8), solid(bot.c));
    armL.position.set(-.3, .72, .08); armL.rotation.z = .85; armL.userData.v9 = true; group.add(armL);
    // Hand rides at the end of the left arm, so typing/waving reads clearly.
    var handL = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), solid('#f7f3ec'));
    handL.position.set(0, -.17, 0); handL.userData.v9 = true; armL.add(handL);
    var stalk = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .2, 6), solid('#4b5a70'));
    stalk.position.set(0, 1.02, 0); stalk.userData.v9 = true; group.add(stalk);
    var tip = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8),
      solid(bot.c, { emissive: bot.c, emissiveIntensity: .85 }));
    tip.position.set(0, 1.15, 0); tip.userData.v9 = true; group.add(tip);
    fx.antennae.push({ m: tip, p: idx * 1.3 });
    var aura = new THREE.Mesh(new THREE.RingGeometry(.34, .48, 24),
      new THREE.MeshBasicMaterial({ color: bot.c, transparent: true, opacity: .12,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    aura.rotation.x = -Math.PI / 2; aura.position.set(bot.x, .028, bot.z); aura.renderOrder = 3; addO(aura);
    fx.auras.push({ m: aura, p: idx * 1.9 });
    var refl = reflection(bot.x, bot.z + .1, .75, .95, bot.c, 0, .075);
    return { armL: armL, aura: aura, tip: tip, refl: refl };
  }
  function cuteRig(group, bot, idx) {
    // Tiny legs with shiny shoes make the walk readable even from the hero camera.
    var legs = [];
    [-1, 1].forEach(function (side) {
      var pivot = new THREE.Group();
      pivot.position.set(side * .13, .22, .02); pivot.userData.v9 = true;
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .045, .24, 8), solid(bot.c));
      leg.position.y = -.12; leg.userData.v9 = true; pivot.add(leg);
      var shoe = new THREE.Mesh(new THREE.SphereGeometry(.095, 8, 6), solid('#2b3a4f'));
      shoe.scale.set(1, .5, 1.5); shoe.position.set(0, -.245, .055);
      shoe.userData.v9 = true; pivot.add(shoe);
      var shine = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 4), solid('#ffffff'));
      shine.position.set(0, -.235, .13); shine.userData.v9 = true; pivot.add(shine);
      group.add(pivot); legs.push(pivot);
    });
    // Heart cheeks + floating star confetti: small, cheap, very cute.
    [-1, 1].forEach(function (side) {
      var heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: '#ff9fc0',
        transparent: true, opacity: .5, depthWrite: false, toneMapped: false }));
      heart.position.set(side * .245, .4, .36); heart.scale.set(.12, .12, 1);
      heart.userData.v9 = true; group.add(heart);
    });
    for (var i = 0; i < 3; i++) {
      var a = idx * 1.7 + i * 2.1;
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(),
        color: i === 1 ? '#fff0a8' : '#ffffff', transparent: true, opacity: .45,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      s.position.set(Math.cos(a) * .55, 1.12 + (i - 1) * .16, Math.sin(a) * .3);
      s.scale.setScalar(.08 + i * .015); s.userData.v9 = true; group.add(s);
      fx.sparkles.push({ m: s, base: s.position.x, p: a });
    }
    return { legs: legs };
  }
  function stepPuff(b, now) {
    if (fx.steps.length > 40) return;
    for (var i = 0; i < 2; i++) {
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(),
        color: i ? '#d9f4ff' : '#ffffff', transparent: true, opacity: .5,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      s.position.set(b.group.position.x + (i ? -.12 : .12), .06 + i * .03, b.group.position.z);
      s.scale.setScalar(.12); s.renderOrder = 4; addO(s);
      fx.steps.push({ m: s, t0: now, life: 520 + i * 120, base: s.position.y });
    }
  }
  function moodPop(b, now) {
    if (fx.moods.length > 36) return;
    for (var i = 0; i < 3; i++) {
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(),
        color: i === 1 ? '#ffe9a8' : b.tip ? b.tip.material.color.getHex() : '#ffffff',
        transparent: true, opacity: .55, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false }));
      s.position.set(b.group.position.x + (i - 1) * .13, 1.5 + i * .05, b.group.position.z);
      s.scale.setScalar(.09); s.renderOrder = 4; addO(s);
      fx.moods.push({ m: s, t0: now, life: 780, baseX: s.position.x, baseY: s.position.y, p: i });
    }
  }
  function turnTo(cur, target, t) {
    var d = ((target - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return cur + d * Math.max(0, Math.min(1, t));
  }
  function setBotMood(b, kind, now, pop) {
    var list = MOODS[kind] || MOODS.walk;
    var em = list[Math.floor(now / 1100 + b.phase * 3) % list.length];
    b.mood = kind;
    if (em === b.lastEmoji) return;
    b.lastEmoji = em;
    try { setEmo(b.emo, em); } catch (e) {}
    if (pop) moodPop(b, now);
  }
  function startBotWork(b, now) {
    var st = b.route[b.wp];
    b.walking = false;
    b.job = st.job;
    b.face = st.face == null ? b.face : st.face;
    b.jobUntil = now + (st.dur || 3500);
    b.emoAt = now;
    setBotMood(b, b.job, now, true);
  }
  function startBotWalk(b, now) {
    var next = (b.wp + 1) % b.route.length;
    var st = b.route[next];
    var dx = st.x - b.group.position.x, dz = st.z - b.group.position.z;
    b.walking = true;
    b.nextWp = next;
    b.walkFrom = { x: b.group.position.x, z: b.group.position.z };
    b.walkTo = { x: st.x, z: st.z };
    b.walkDur = Math.max(750, Math.min(2600, Math.sqrt(dx * dx + dz * dz) / (b.speed || 1.15) * 1000));
    b.walkStart = now;
    b.stepAt = 0;
    setBotMood(b, 'walk', now, true);
  }
  function animateBotWork(b, now, i) {
    var t = now + b.phase * 900;
    var life = now / 1000 + b.phase;
    // v56 character 4D time-life: breathing presence, attention drift, micro-lean.
    if (b.head) {
      b.head.rotation.y = Math.sin(life * 0.58) * 0.1 + Math.sin(life * 1.25) * 0.03;
      b.head.rotation.x = Math.sin(life * 0.72 + 1.1) * 0.035 + Math.sin(life * 1.7) * 0.01;
      b.head.rotation.z = Math.sin(life * 0.44 + 0.6) * 0.018;
    }
    b.group.rotation.x = Math.sin(life * 0.82) * 0.012;
    switch (b.job) {
      case 'wave':
      case 'greet':
        if (b.arm) b.arm.rotation.z = -2.25 + Math.sin(t / 190) * .34;
        if (b.armL) b.armL.rotation.z = .8 + Math.sin(t / 620) * .12;
        b.group.position.y = b.baseY + Math.abs(Math.sin(t / 310)) * .08;
        b.group.rotation.z = Math.sin(t / 740) * .035;
        break;
      case 'type':
        if (b.arm) { b.arm.rotation.z = -.58 + Math.sin(t / 135) * .2; b.arm.rotation.x = .22 + Math.cos(t / 170) * .12; }
        if (b.armL) { b.armL.rotation.z = .58 - Math.sin(t / 155) * .18; b.armL.rotation.x = .18 + Math.sin(t / 190) * .12; }
        b.group.rotation.z = Math.sin(t / 830) * .025;
        break;
      case 'pack':
        if (b.arm) b.arm.rotation.z = -1.18 + Math.sin(t / 270) * .34;
        if (b.armL) b.armL.rotation.z = 1.18 - Math.sin(t / 270) * .34;
        b.group.position.y = b.baseY + Math.abs(Math.sin(t / 400)) * .045;
        b.group.rotation.z = Math.sin(t / 390) * .06;
        break;
      case 'plan':
        if (b.arm) b.arm.rotation.z = -1.72 + Math.sin(t / 880) * .1;
        if (b.armL) b.armL.rotation.z = .46 + Math.sin(t / 1120) * .1;
        b.group.rotation.z = Math.sin(t / 1030) * .055;
        break;
      case 'joke':
        if (b.arm) b.arm.rotation.z = -1.9 + Math.sin(t / 230) * .5;
        if (b.armL) b.armL.rotation.z = 1.9 - Math.sin(t / 230) * .5;
        b.group.position.y = b.baseY + Math.abs(Math.sin(t / 220)) * .1;
        b.group.rotation.z = Math.sin(t / 330) * .085;
        break;
      case 'write':
        if (b.arm) { b.arm.rotation.z = -.68 + Math.sin(t / 125) * .24; b.arm.rotation.x = .28 + Math.cos(t / 150) * .18; }
        if (b.armL) b.armL.rotation.z = .56 + Math.sin(t / 700) * .08;
        b.group.rotation.z = Math.sin(t / 760) * .03;
        break;
      case 'design':
        if (b.arm) { b.arm.rotation.z = -.62 + Math.sin(t / 140) * .24; b.arm.rotation.x = .3 + Math.cos(t / 175) * .16; }
        if (b.armL) { b.armL.rotation.z = .6 - Math.sin(t / 185) * .16; b.armL.rotation.x = .18; }
        b.group.rotation.z = Math.sin(t / 880) * .035;
        break;
      case 'review':
        if (b.arm) b.arm.rotation.z = -1.68 + Math.sin(t / 920) * .1;
        if (b.armL) b.armL.rotation.z = .5 + Math.sin(t / 1080) * .1;
        b.group.rotation.z = Math.sin(t / 1020) * .05;
        break;
      case 'showcase':
        if (b.arm) b.arm.rotation.z = -2.0 + Math.sin(t / 260) * .42;
        if (b.armL) b.armL.rotation.z = 2.0 - Math.sin(t / 260) * .42;
        b.group.position.y = b.baseY + Math.abs(Math.sin(t / 350)) * .07;
        b.group.rotation.z = Math.sin(t / 420) * .06;
        break;
      default:
        if (b.arm) b.arm.rotation.z = -.85 + Math.sin(t / 330) * .32;
        if (b.armL) b.armL.rotation.z = .85 - Math.sin(t / 330) * .32;
        b.group.position.y = b.baseY + Math.sin(life * 1.15) * .018;
        b.group.rotation.z = Math.sin(life * 0.52) * .03;
    }
    if (b.legs) {
      b.legs[0].rotation.x = Math.sin(t / 700) * .08 + Math.sin(life * 1.6) * .01;
      b.legs[1].rotation.x = -Math.sin(t / 700) * .08 - Math.sin(life * 1.6) * .01;
    }
  }
  function updateBotParticles(now) {
    var i;
    for (i = fx.steps.length - 1; i >= 0; i--) {
      var a = fx.steps[i], p = (now - a.t0) / a.life;
      if (p >= 1) {
        // Three.js Object3D uses .parent (not .parentNode). The old check never
        // removed these sprites, so thousands accumulated and killed the FPS.
        if (a.m.parent) a.m.parent.remove(a.m);
        a.m.material.dispose(); fx.steps.splice(i, 1); continue;
      }
      a.m.position.y = a.base + p * .16;
      a.m.material.opacity = .45 * (1 - p);
      a.m.scale.setScalar(.1 + p * .2);
    }
    for (i = fx.moods.length - 1; i >= 0; i--) {
      var q = fx.moods[i], r = (now - q.t0) / q.life;
      if (r >= 1) {
        if (q.m.parent) q.m.parent.remove(q.m);
        q.m.material.dispose(); fx.moods.splice(i, 1); continue;
      }
      q.m.position.y = q.baseY + r * .48;
      q.m.position.x = q.baseX + (q.p - 1) * r * .22;
      q.m.material.opacity = .6 * (1 - r);
      q.m.scale.setScalar(.08 + r * .1);
    }
  }
  function miniDeskPlant(g2, x, z) {
    var pot = new THREE.Mesh(new THREE.CylinderGeometry(.055, .045, .09, 8), solid('#c07a52'));
    pot.position.set(x, .85, z); pot.userData.v9 = true; g2.add(pot);
    for (var i = 0; i < 5; i++) {
      var leaf = new THREE.Mesh(new THREE.ConeGeometry(.042, .155, 5), solid(i % 2 ? '#3f9d6a' : '#57ad78'));
      leaf.position.set(x + (i - 2) * .018, .965, z);
      leaf.rotation.z = (i - 2) * .22; leaf.userData.v9 = true; g2.add(leaf);
    }
    var peb = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 5), solid('#d8c39a'));
    peb.position.set(x + .02, .895, z + .02); peb.userData.v9 = true; g2.add(peb);
  }
  function glassGlint(x, y, z, w, h, rot) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: glintTex(), color: '#eaf6ff', transparent: true, opacity: .12,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(x, y, z); m.rotation.y = rot || 0; m.rotation.z = -.16;
    m.renderOrder = 3; addO(m); fx.glints.push({ m: m, p: x + z });
  }
  function windowBand(x, z, w, d, rot) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ map: glowTex(), color: '#ffe4b5', transparent: true, opacity: .13,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot || 0; m.position.set(x, .02, z);
    m.renderOrder = 3; addO(m); fx.bands.push({ m: m, p: x + z });
  }
  function sunGlow() {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: '#ffd89a', transparent: true,
      opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    s.position.set(8, 11.5, -27); s.scale.set(6, 6, 1); s.renderOrder = 1; addO(s);
    fx.sun = s;
  }
  function wallFrame(x, y, z, w, h, rot, seed) {
    var g2 = new THREE.Group();
    var back = new THREE.Mesh(new THREE.BoxGeometry(w + .1, h + .1, .06), solid('#2c3648'));
    back.userData.v9 = true; g2.add(back);
    var face = new THREE.Mesh(new THREE.BoxGeometry(w, h, .02),
      new THREE.MeshBasicMaterial({ map: artTex(seed) }));
    face.position.z = .041; face.userData.v9 = true; g2.add(face);
    // picture light
    var lightBar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, .03, .06), solid('#3f4f63', { metalness: .35, roughness: .4 }));
    lightBar.position.set(0, h / 2 + .1, .07); lightBar.userData.v9 = true; g2.add(lightBar);
    var glow = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, .015, .02), solid('#ffe8b8', { emissive: '#ffd89a', emissiveIntensity: .45 }));
    glow.position.set(0, h / 2 + .085, .1); glow.userData.v9 = true; g2.add(glow);
    g2.position.set(x, y, z); g2.rotation.y = rot || 0; addO(g2);
  }
  function bookshelf(x, z, rot) {
    var g2 = new THREE.Group();
    var wood = solid('#8b5e34', { map: woodTex('#8b5e34', '#634122', 1, 1), roughness: .6 });
    var back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, .38), wood);
    back.userData.v9 = true; g2.add(back);
    var cols = ['#c94f4f', '#4a7fb0', '#3f9d6a', '#e0a83a', '#8f6fd8', '#e8e2d4', '#5f8fa8'];
    for (var sh = 0; sh < 4; sh++) {
      var shelf = new THREE.Mesh(new THREE.BoxGeometry(1.5, .05, .4), solid('#6d4929'));
      shelf.position.y = -0.72 + sh * .48; shelf.userData.v9 = true; g2.add(shelf);
      for (var bk = 0; bk < 7; bk++) {
        var bh = .26 + (bk % 4) * .045;
        var b = new THREE.Mesh(new THREE.BoxGeometry(.13, bh, .23),
          solid(cols[(sh * 7 + bk) % cols.length]));
        b.position.set(-.6 + bk * .2, -.72 + sh * .48 + .025 + bh / 2, .06);
        b.rotation.z = (bk % 5 === 0) ? .09 : (bk % 7 === 0 ? -.06 : 0); b.userData.v9 = true; g2.add(b);
      }
    }
    // small decor on top
    var vase = new THREE.Mesh(new THREE.CylinderGeometry(.055, .07, .18, 8), solid('#6cc2f0', { roughness: .35 }));
    vase.position.set(.35, .92, .04); vase.userData.v9 = true; g2.add(vase);
    var sprig = new THREE.Mesh(new THREE.SphereGeometry(.09, 7, 6), solid('#5ea86b', { roughness: .9 }));
    sprig.position.set(.35, 1.04, .04); sprig.userData.v9 = true; g2.add(sprig);
    var frame = new THREE.Mesh(new THREE.BoxGeometry(.22, .16, .02), solid('#d8c6a4'));
    frame.position.set(-.28, .88, .05); frame.rotation.z = -.08; frame.userData.v9 = true; g2.add(frame);
    g2.position.set(x, 1.02, z); g2.rotation.y = rot || 0; addO(g2);
  }
  function car(x, z, dir, color) {
    shadow(x, z, 1.25, .62, .12);
    var g2 = new THREE.Group();
    var paint = solid(color, { metalness: .5, roughness: .3 });
    var glass = solid('#b9d7ea', { transparent: true, opacity: .68, metalness: .25, roughness: .12 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.34, .38, 1.02), paint);
    body.position.y = .37; body.userData.v9 = true; g2.add(body);
    var lower = new THREE.Mesh(new THREE.BoxGeometry(2.12, .16, 1.04), solid('#242c38'));
    lower.position.y = .21; lower.userData.v9 = true; g2.add(lower);
    var hood = new THREE.Mesh(new THREE.BoxGeometry(.64, .1, 1.0), paint);
    hood.position.set(dir * .8, .58, 0); hood.userData.v9 = true; g2.add(hood);
    var trunk = new THREE.Mesh(new THREE.BoxGeometry(.5, .09, 1.0), paint);
    trunk.position.set(-dir * .88, .57, 0); trunk.userData.v9 = true; g2.add(trunk);
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.18, .34, .86), glass);
    cabin.position.set(-dir * .06, .77, 0); cabin.userData.v9 = true; g2.add(cabin);
    var roof = new THREE.Mesh(new THREE.BoxGeometry(1.02, .045, .8), paint);
    roof.position.set(-dir * .06, .95, 0); roof.userData.v9 = true; g2.add(roof);
    [-.44, .44].forEach(function (dz) {
      var side = new THREE.Mesh(new THREE.BoxGeometry(.98, .24, .02), glass);
      side.position.set(-dir * .06, .77, dz); side.userData.v9 = true; g2.add(side);
      var head = new THREE.Mesh(new THREE.BoxGeometry(.07, .1, .2),
        solid('#fff3c8', { emissive: '#ffd98a', emissiveIntensity: 1.1 }));
      head.position.set(dir * 1.19, .44, dz * .7); head.userData.v9 = true; g2.add(head);
      var tail = new THREE.Mesh(new THREE.BoxGeometry(.06, .09, .2),
        solid('#e2694f', { emissive: '#e2523a', emissiveIntensity: .9 }));
      tail.position.set(-dir * 1.19, .44, dz * .7); tail.userData.v9 = true; g2.add(tail);
    });
    var grille = new THREE.Mesh(new THREE.BoxGeometry(.04, .12, .52), solid('#2f394b'));
    grille.position.set(dir * 1.2, .36, 0); grille.userData.v9 = true; g2.add(grille);
    // side mirrors and rear plate
    [-.54, .54].forEach(function (dz) {
      var mirror = new THREE.Mesh(new THREE.BoxGeometry(.08, .06, .1), paint);
      mirror.position.set(dir * .36, .68, dz); mirror.userData.v9 = true; g2.add(mirror);
    });
    var plate = new THREE.Mesh(new THREE.BoxGeometry(.03, .08, .28), solid('#f4f6f8'));
    plate.position.set(-dir * 1.185, .34, 0); plate.userData.v9 = true; g2.add(plate);
    [-.68, .68].forEach(function (dx) {
      [-.49, .49].forEach(function (dz) {
        var w = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .11, 12), solid('#1b2029'));
        w.rotation.x = Math.PI / 2; w.position.set(dx, .22, dz); w.userData.v9 = true; g2.add(w);
        var hub = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .12, 10), solid('#9aa5b3', { metalness: .6 }));
        hub.rotation.x = Math.PI / 2; hub.position.set(dx, .22, dz); hub.userData.v9 = true; g2.add(hub);
      });
    });
    g2.position.set(x, 0, z); addO(g2);
    fx.cars.push({ g: g2, dir: dir, speed: .9 + Math.random() * .5, phase: x * 0.7 + z * 0.31 });
  }
  function bus(x, z, dir) {
    shadow(x, z, 2.7, .8, .13);
    var g2 = new THREE.Group();
    var paint = solid('#d8c9a6', { metalness: .35, roughness: .45 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(5.1, 1.3, 1.42), paint);
    body.position.y = 1.0; body.userData.v9 = true; g2.add(body);
    var strip = new THREE.Mesh(new THREE.BoxGeometry(4.6, .5, 1.44),
      solid('#9fc8e0', { transparent: true, opacity: .72, metalness: .3, roughness: .12 }));
    strip.position.y = 1.38; strip.userData.v9 = true; g2.add(strip);
    var sign = new THREE.Mesh(new THREE.BoxGeometry(1.1, .16, .05),
      solid('#5fd6ff', { emissive: '#5fd6ff', emissiveIntensity: .8 }));
    sign.position.set(dir * 1.9, 1.42, .74); sign.userData.v9 = true; g2.add(sign);
    [-1.6, 0, 1.6].forEach(function (dx) {
      [-.7, .7].forEach(function (dz) {
        var w = new THREE.Mesh(new THREE.CylinderGeometry(.29, .29, .12, 12), solid('#1b2029'));
        w.rotation.x = Math.PI / 2; w.position.set(dx, .3, dz); w.userData.v9 = true; g2.add(w);
      });
    });
    [-.42, .42].forEach(function (dz) {
      var head = new THREE.Mesh(new THREE.BoxGeometry(.08, .14, .22),
        solid('#fff3c8', { emissive: '#ffd98a', emissiveIntensity: 1.0 }));
      head.position.set(dir * 2.57, .78, dz); head.userData.v9 = true; g2.add(head);
    });
    g2.position.set(x, 0, z); addO(g2);
    fx.cars.push({ g: g2, dir: dir, speed: .55 + Math.random() * .2, phase: x * 0.5 + z * 0.27 });
  }

  /* ---------- v16 cinematic detail ---------- */
  function blindShadow(x, z, w, d, rot) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ map: blindTex(), color: '#0b1728', transparent: true, opacity: .16,
        depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot || 0;
    m.position.set(x, .016, z); m.renderOrder = 2; addO(m);
    fx.blinds.push({ m: m, p: x + z });
    return m;
  }
  function reflection(x, z, w, d, color, rot, op) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ map: glowTex(), color: color || '#ffe6bd', transparent: true,
        opacity: op || .06, blending: THREE.AdditiveBlending, depthWrite: false,
        side: THREE.DoubleSide, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot || 0;
    m.position.set(x, .013, z); m.renderOrder = 2; addO(m);
    fx.reflections.push({ m: m, base: op || .06, p: x + z });
    return m;
  }
  function roomTrim() {
    // Interior baseboards + crown molding give the big volume a finished edge.
    box(46.8, .14, .09, '#4b5566', 23, .07, 33.90);
    box(46.8, .14, .09, '#4b5566', 23, .07, .30);
    box(.09, .14, 34.8, '#4b5566', .30, .07, 17);
    box(.09, .14, 34.8, '#4b5566', 45.70, .07, 17);
    box(46.8, .09, .14, '#e8e4dc', 23, 2.92, 33.90);
    box(46.8, .09, .14, '#e8e4dc', 23, 2.92, .30);
    box(.14, .09, 34.8, '#e8e4dc', .30, 2.92, 17);
    box(.14, .09, 34.8, '#e8e4dc', 45.70, 2.92, 17);
    // Cove LEDs tucked under the ceiling: warm at reception/pantry, cool at work zones.
    [[45.4, .035, .05, '#ffdca8', 23, 3.02, 33.84, 0],
     [45.4, .035, .05, '#bfe4ff', 23, 3.02, .38, 1.1],
     [.05, .035, 33.5, '#bfe4ff', .38, 3.02, 17, 2.2],
     [.05, .035, 33.5, '#ffdca8', 45.62, 3.02, 17, 3.3]].forEach(function (a) {
      var l = bx(a[0], a[1], a[2], a[3], a[4], a[5], a[6], true);
      animParts.push({ m: l, k: 'led', p: a[7] });
    });
  }
  function ceilingPanel(w, d, x, z) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
      solid('#ffffff', { map: ceilingTex(), roughness: .96, metalness: 0, side: THREE.DoubleSide }));
    m.rotation.x = Math.PI / 2; m.position.set(x, 3.285, z);
    m.userData.v9Ceiling = true;
    if (fx.ceilings) fx.ceilings.push(m);
    return addO(m);
  }
  function applyCeilingView() {
    // v29: the suspended tiles stay in the scene but are ALWAYS see-through.
    // No more lid over the floor in the normal view — every bot and zone is
    // visible from the hero camera without needing Silip/xray.
    var op = .04;
    if (!fx.ceilings) return;
    fx.ceilings.forEach(function (m) {
      if (!m || !m.material) return;
      if (m.material.opacity === op && m.material.transparent === true && m.material.depthWrite === false) return;
      m.material.transparent = true;
      m.material.opacity = op;
      m.material.depthWrite = false;
      m.material.needsUpdate = true;
    });
  }
  function hvacVent(x, z) {
    box(1.05, .05, .68, solid('#aeb8c4', { map: metalTex(), metalness: .55, roughness: .35 }), x, 3.24, z);
    box(.86, .02, .5, '#4c5a6b', x, 3.21, z);
    for (var i = -3; i <= 3; i++) box(.04, .015, .48, '#8e9bab', x + i * .12, 3.205, z);
    box(.9, .012, .05, '#6f7d8c', x, 3.198, z);
    box(.92, .01, .02, '#aab6c2', x, 3.196, z + .22);
  }
  function fireSprinkler(x, z) {
    cyl(.022, .12, '#b8792e', x, 3.19, z);
    cyl(.055, .012, '#d8dde2', x, 3.245, z);
    var b = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6),
      solid('#d94f3d', { emissive: '#7a1f14', emissiveIntensity: .25 }));
    b.position.set(x, 3.11, z); addO(b);
  }
  function smokeDetector(x, z) {
    cyl(.14, .035, '#e8ecef', x, 3.25, z);
    cyl(.05, .04, '#7d8b9a', x, 3.23, z);
    bx(.018, .018, .018, '#5fd6ff', x + .06, 3.232, z + .06, true);
  }
  function exitSign(x, y, z, rot, label) {
    var txt = label || 'EXIT';
    var t = makeTex('exit-' + txt, function (q, S) {
      q.fillStyle = '#0e5b3d'; q.fillRect(0, 0, S, S);
      q.fillStyle = '#d8ffe8'; q.font = 'bold 108px Arial, sans-serif';
      q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(txt, S / 2, S / 2);
    }, 1, 1);
    var g2 = new THREE.Group();
    var back = new THREE.Mesh(new THREE.BoxGeometry(1.02, .36, .05), solid('#163a2e'));
    g2.add(back);
    var face = new THREE.Mesh(new THREE.BoxGeometry(.96, .3, .02),
      new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
    face.position.z = .036; g2.add(face);
    g2.position.set(x, y, z); g2.rotation.y = rot || 0; addO(g2);
  }
  function column(x, z) {
    shadow(x, z, .42, .42, .1);
    box(.56, .12, .56, solid('#aeb8c4', { map: metalTex(), metalness: .5, roughness: .4 }), x, .06, z);
    box(.28, 3.04, .28, solid('#ffffff', { map: concreteTex(), roughness: .88 }), x, 1.62, z);
    box(.48, .1, .48, solid('#aeb8c4', { map: metalTex(), metalness: .5, roughness: .4 }), x, 3.19, z);
    [-.15, .15].forEach(function (dx) {
      box(.03, 3.0, .03, '#c6ced7', x + dx, 1.62, z + .15);
      box(.03, 3.0, .03, '#c6ced7', x + dx, 1.62, z - .15);
    });
  }
  function wainscot(x, z, w, d, color) {
    box(w, .92, d, solid(color || '#dfe3e6', { map: wallTex(), roughness: .9 }), x, .55, z);
    box(w + .04, .06, d + .04, '#b7c0ca', x, 1.04, z);
  }
  function glassDoors(cx, z) {
    var frame = '#223047';
    [-1.3, 1.3].forEach(function (dx) {
      glass(2.45, 2.28, .06, cx + dx, 1.22, z, .26, '#cfe6f2');
      box(.07, 2.38, .1, frame, cx + dx - 1.25, 1.2, z);
      box(.07, 2.38, .1, frame, cx + dx + 1.25, 1.2, z);
      box(2.5, .08, .1, frame, cx + dx, 2.42, z);
      box(2.5, .08, .1, frame, cx + dx, .06, z);
      var hx = cx + dx + (dx < 0 ? .98 : -.98);
      cyl(.026, .48, solid('#aeb8c4', { map: metalTex(), metalness: .7, roughness: .28 }), hx, 1.15, z + .08, true);
      box(.26, .05, .05, '#8b97a5', hx, 1.39, z + .08);
      box(.26, .05, .05, '#8b97a5', hx, .91, z + .08);
      box(2.2, .22, .02, '#7d8b9a', cx + dx, .18, z + .04);
    });
    glass(5.2, .42, .06, cx, 2.72, z, .2, '#cfe6f2');
    box(5.3, .07, .1, frame, cx, 2.95, z);
    box(5.3, .1, .22, '#8b97a5', cx, .04, z);
    bx(5.1, .025, .05, '#6fd0c4', cx, .02, z - .14, true);
  }
  function entranceCanopy(cx, z) {
    box(10.4, .16, 2.3, solid('#2f3d52', { metalness: .35, roughness: .4 }), cx, 3.18, z + 1.15);
    box(10.6, .08, 2.45, solid('#aeb8c4', { map: metalTex(), metalness: .55, roughness: .35 }), cx, 3.3, z + 1.15);
    bx(9.8, .03, 1.8, '#fff4d8', cx, 3.09, z + 1.15, true);
    [-3.4, 0, 3.4].forEach(function (dx) { bx(2.2, .03, .07, '#ffe1a8', cx + dx, 3.08, z + 2.15, true); });
    [-4.6, 4.6].forEach(function (dx) {
      cyl(.045, 2.85, '#8b97a5', cx + dx, 1.62, z + 2.05);
      box(.16, .12, .5, '#8b97a5', cx + dx, 3.02, z + 1.5);
      shadow(cx + dx, z + 2.05, .2, .2, .1);
    });
    wallSign('CYBORG CHEEBEE', 'AI AGENTS HEADQUARTERS', cx, 3.58, z + 2.32, 6.2, .8, 0, '#3f9d9a');
  }
  function receptionDetails() {
    for (var i = 0; i < 9; i++) box(.035, .62, .035, '#6e4a2c', 20.4 + i * .65, .55, 29.51);
    box(4.9, .08, .05, '#d8c6a4', 23, .92, 29.49);
    wallSign('CYBORG', 'RECEPTION', 23, .48, 29.47, 1.9, .42, 0, '#3f9d9a');
    box(.36, .02, .24, '#e7e9ec', 22.5, 1.13, 30);
    cyl(.025, .02, '#8b97a5', 23.1, 1.13, 30);
    cyl(.05, .14, '#d9c39a', 24.1, 1.18, 30.05);
    // service bell
    cyl(.07, .03, '#e8b04a', 21.9, 1.125, 30.02);
    cyl(.02, .025, '#f4f6f8', 21.9, 1.15, 30.02);
    // small greenery accent on reception side
    cyl(.04, .12, '#5b4632', 24.55, 1.16, 30.08);
    var recLeaf = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), solid('#4f9a63', { roughness: .9 }));
    recLeaf.position.set(24.55, 1.3, 30.08); addO(recLeaf);
    var t = makeTex('welcome-mat', function (q, S) {
      q.fillStyle = '#2f4a52'; q.fillRect(0, 0, S, S);
      q.strokeStyle = '#8fb6b2'; q.lineWidth = 8; q.strokeRect(10, 10, S - 20, S - 20);
      q.fillStyle = '#e8f2ef'; q.font = 'bold 52px Arial, sans-serif';
      q.textAlign = 'center'; q.fillText('WELCOME', S / 2, S / 2 + 18);
    }, 1, 1);
    planeAt(2.6, 1.15, solid('#ffffff', { map: t, roughness: 1 }), 23, .014, 31.7);
    box(.55, .9, .35, '#6e7c8f', 19.6, .45, 31.9);
    ['#e8eef5', '#dce8df', '#f0e4cf'].forEach(function (c, k) {
      box(.42, .24, .02, c, 19.6, .35 + k * .27, 32.09);
    });
  }
  function meetingDetails() {
    box(1.3, .12, .16, '#1b2537', 37, 2.62, 4.93);
    cyl(.07, .07, '#3f9d9a', 37, 2.62, 5.03, true);
    cyl(.34, .05, '#2f3d52', 37, .86, 7.5);
    cyl(.2, .02, '#5c6f86', 37, .9, 7.5);
    box(1.2, .05, .08, '#d9dde2', 37, 1.05, .42);
    ['#c94f5f', '#3f9d9a', '#2f4a6d'].forEach(function (c, i) { cyl(.02, .24, c, 36.7 + i * .3, 1.14, .48); });
    // small tabletop greenery
    cyl(.05, .1, '#8b5e34', 35.7, .91, 7.5);
    var meetLeaf = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), solid('#4ca86a', { roughness: .9 }));
    meetLeaf.position.set(35.7, 1.04, 7.5); addO(meetLeaf);
    wallSign('HUDDLE', 'SCREEN SHARE', 43.2, 1.75, 16.35, 1.8, .5, -Math.PI / 2, '#5f7fa8');
    wallSign('STUDIO', 'MEETING', 29.12, 1.7, 9.5, .85, .28, Math.PI / 2, '#3f6fa8');
  }
  function pantryDetails() {
    box(7.2, .95, .06, solid('#ffffff', { map: tileTex(5, 2), roughness: .45 }), 37, 1.55, 32.82);
    [34.8, 39.2].forEach(function (x) {
      box(2.2, .72, .42, '#8b5e34', x, 2.28, 32.5);
      glass(2.1, .6, .05, x, 2.28, 32.74, .26, '#cfe6f2');
      box(.05, .66, .05, '#d8c6a4', x, 2.28, 32.78);
    });
    box(.5, .22, .32, '#2f3d52', 34.5, 1.42, 28.1);
    cyl(.05, .12, '#aeb8c4', 34.5, 1.18, 28.1);
    cyl(.12, .14, '#f2eee4', 34.5, 1.06, 28.1);
    box(.04, .6, .04, '#b9c3cd', 39.8, 1.72, 32.79);
    box(2.4, .06, .35, '#a9793f', 34.5, 2.05, 28.2);
    for (var i = 0; i < 5; i++) cyl(.08, .12, '#f2eee4', 33.6 + i * .45, 2.14, 28.2);
    // fruit bowl accent
    cyl(.18, .05, '#f2eee4', 35.4, 2.11, 28.18);
    ['#ff7a59', '#ffd27d', '#79e0b2'].forEach(function (c, i) {
      var fruit = new THREE.Mesh(new THREE.SphereGeometry(.055, 7, 6), solid(c, { roughness: .55 }));
      fruit.position.set(35.32 + i * .08, 2.16, 28.16 + (i % 2 ? .03 : -.02)); addO(fruit);
    });
  }
  function serverDetails() {
    box(7.4, .08, .5, solid('#aeb8c4', { map: metalTex(), metalness: .6, roughness: .3 }), 5, 2.72, 25.5);
    box(7.4, .05, .05, '#7d8b9a', 5, 2.78, 25.25);
    box(7.4, .05, .05, '#7d8b9a', 5, 2.78, 25.75);
    for (var i = 0; i < 6; i++) {
      box(.04, .04, .35, ['#c94f5f', '#3f9d9a', '#e0a83a', '#4a7fb0'][i % 4], 2.1 + i * 1.1, 2.66, 25.5);
    }
    for (var k = 0; k < 7; k++) box(.9, .012, .06, '#b08a3d', 1.6 + k * 1.1, .016, 26.4);
  }
  function wayfinding() {
    exitSign(18.9, 2.72, 33.76, 0, 'EXIT');
    exitSign(28.7, 2.72, 33.76, 0, 'EXIT');
    exitSign(37, 2.75, 16.62, 0, 'EXIT');
    wallSign('← WELCOME', 'MAIN STREET →', 12, 2.72, 23.2, 3.2, .55, 0, '#3f9d9a');
    wallSign('MEET →', '← FOCUS', 33, 2.72, 23.2, 3.0, .55, 0, '#5f7fa8');;
    wallSign('CEO', 'EXECUTIVE', 11.12, 1.7, 27.5, .8, .3, Math.PI / 2, '#b08a3d');
  }
  function greenSurrounds() {
    // v29: the flat gray surround becomes a living landscape. The dark guard
    // plane stays underneath; a green ground sits just above it.
    var sceneryStart = structureGroup ? structureGroup.children.length : 0;
    floor(220, 220, solid('#ffffff', { map: grassTex(), roughness: 1, metalness: 0 }), 23, -.20, 17);

    // Rolling hills (bundok) — flattened spheres, cheap from the hero camera.
    [[-40, 70, 24, 8, 17, '#4f8550'], [4, 88, 30, 11, 20, '#5b9858'],
     [60, 82, 26, 9, 18, '#4a7f4b'], [100, 52, 22, 7, 16, '#6aa864'],
     [-46, -34, 20, 7, 15, '#588f55'], [78, -40, 24, 8, 17, '#4e834d'],
     [24, 108, 34, 12, 22, '#568d54'], [-78, 44, 18, 6, 13, '#5f9960'],
     [116, 14, 20, 7, 15, '#4d8650']].forEach(function (h) {
      var hill = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), solid(h[5], { roughness: 1 }));
      hill.scale.set(h[2], h[3], h[4]);
      hill.position.set(h[0], -h[3] * .5, h[1]);
      addO(hill);
    });

    // Farm belt south of the office: tilled rows, barn, hay bales, fence.
    for (var fr = 0; fr < 6; fr++) {
      var fz = 52 + fr * 3.4;
      box(30, .16, 1.8, solid(fr % 2 ? '#7a5838' : '#856243', { roughness: 1 }), 46, -.09, fz);
      for (var fc = 0; fc < 15; fc++) {
        var cropCol = fr % 3 === 0 ? '#4ea657' : fr % 3 === 1 ? '#6fc05f' : '#5ab06a';
        var crop = bx(.58, .5 + (fr % 2) * .18, .58, cropCol, 32 + fc * 2, .22, fz);
        // v30: crops are interactable (E = water/harvest via the app).
        crop.userData.v9FarmCrop = true;
        fx.crops.push({ m: crop, x: 32 + fc * 2, z: fz, idx: fr % 3 });
      }
    }
    box(6.2, 3.1, 5.2, '#b04a3d', 66, 1.5, 58);
    box(6.8, .38, 5.8, '#7a2f28', 66, 3.22, 58);
    box(.18, .3, 5.4, '#e3c07a', 62.9, 3.35, 58);
    box(.18, .3, 5.4, '#e3c07a', 69.1, 3.35, 58);
    bx(1.8, 2.05, .1, '#f1e3c2', 66, 1.08, 55.38, true);
    bx(.22, 2.05, .1, '#8b5e34', 65.05, 1.08, 55.38);
    bx(.22, 2.05, .1, '#8b5e34', 66.95, 1.08, 55.38);
    [[62, 50], [64, 52], [66, 50], [68, 51.5]].forEach(function (p, i) { cyl(.72, 1.08, i % 2 ? '#ddb85f' : '#d2a94f', p[0], .54, p[1]); });
    for (var ff = 0; ff < 15; ff++) {
      var fx2 = 31 + ff * 2.3;
      cyl(.09, .98, '#d6c28f', fx2, .49, 49);
      if (ff < 14) box(2.3, .1, .1, '#ccb67f', fx2 + 1.15, .64, 49);
    }

    // Trees around the perimeter make the place feel alive.
    [[-34, 52], [-10, 62], [8, 66], [76, 50], [88, 68], [-40, 20],
     [82, 18], [34, -20], [62, -26], [-12, -24], [16, 76], [54, 74],
     [-58, 6], [96, 36], [-22, 84], [72, 84]]
      .forEach(function (p, i) { tree(p[0], p[1], 1.45 + (i % 3) * .35); });

    // Soft garden accents near the office approach (low-poly, scenery-tagged).
    [[10, 37.5], [36, 37.5], [6, 41], [40, 41], [23, 38.5]].forEach(function (p, i) {
      var cols = ['#6fbf72', '#5cae63', '#7acb7d', '#66b86d'];
      for (var b = 0; b < 3; b++) {
        var bush = new THREE.Mesh(new THREE.SphereGeometry(.42 + (b % 2) * .12, 8, 6),
          solid(cols[(i + b) % cols.length], { roughness: .95 }));
        bush.position.set(p[0] + (b - 1) * .45, .22 + b * .04, p[1] + (b % 2 ? .18 : -.12));
        addO(bush);
        fx.softScenery.push({ m: bush, ph: i * 1.3 + b * .7, baseY: bush.position.y });
      }
      if (i % 2 === 0) {
        var flower = new THREE.Mesh(new THREE.SphereGeometry(.14, 7, 5), solid(i % 4 ? '#ffd27d' : '#ff9fc4', { roughness: .7 }));
        flower.position.set(p[0] + .2, .48, p[1] + .05); addO(flower);
        fx.softScenery.push({ m: flower, ph: i * 1.9, baseY: flower.position.y, bloom: true });
      }
    });
    for (var sp = 0; sp < 7; sp++) {
      var stone = new THREE.Mesh(new THREE.CylinderGeometry(.38, .42, .06, 7), solid('#c8c2b6', { roughness: .98 }));
      stone.position.set(23, -.13, 36.2 + sp * 1.35); addO(stone);
    }

    // ---- Whole-land enhancement: richer hills, groves, meadows and farm detail ----
    // Extra rolling hills to fill north/east/west horizons (low-poly, static scenery).
    [[-86, 76, 22, 7, 16, '#4b7f4c'], [110, 86, 28, 10, 19, '#5a9357'],
     [-70, -58, 24, 8, 17, '#527f52'], [96, -56, 26, 9, 18, '#4f8851'],
     [-98, 18, 18, 6, 14, '#5d9660'], [124, -18, 20, 7, 15, '#4c8450'],
     [48, -72, 30, 10, 20, '#568d56'], [-18, -78, 26, 8, 18, '#4e8451'],
     [86, 108, 24, 8, 17, '#5a9458'], [-54, 104, 28, 9, 19, '#4f8652']].forEach(function (h) {
      var hill = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9), solid(h[5], { roughness: 1 }));
      hill.scale.set(h[2], h[3], h[4]);
      hill.position.set(h[0], -h[3] * .5, h[1]);
      addO(hill);
    });

    // Tree groves framing the campus and open fields (kept off roads/courts/buildings).
    [[-28, -6], [-36, -14], [-44, -4], [-52, -16], [58, -26], [66, -22], [74, -30],
     [82, -10], [90, -24], [-60, 30], [-68, 22], [-54, 42], [92, 46], [100, 38],
     [108, 52], [-18, 92], [2, 96], [18, 100], [46, 96], [64, 92], [82, 98],
     [-44, 58], [-52, 68], [62, 60], [70, 68], [38, -44], [12, -50], [-8, -44],
     [56, 8], [64, 14], [72, 6], [-30, 46], [-38, 54]]
      .forEach(function (p, i) { tree(p[0], p[1], 1.15 + (i % 4) * .22); });

    // Flower meadows and wildflower clusters across open grass.
    [[-24, 78, '#ffd27d'], [-6, 72, '#ff9fc4'], [14, 82, '#fff1a8'], [34, 86, '#ff9fc4'],
     [52, 78, '#ffd27d'], [70, 74, '#f7b3ff'], [-62, 54, '#fff1a8'], [-72, 36, '#ffd27d'],
     [86, 60, '#ff9fc4'], [96, 72, '#ffd27d'], [-48, -26, '#fff1a8'], [-64, -12, '#ff9fc4'],
     [86, -34, '#ffd27d'], [104, -6, '#f7b3ff'], [58, -36, '#fff1a8'], [26, -34, '#ff9fc4'],
     [-14, -56, '#ffd27d'], [8, -62, '#fff1a8'], [64, -58, '#ff9fc4']].forEach(function (m, i) {
      for (var f = 0; f < 6; f++) {
        var a = f * 1.047 + i * .4, rr = .35 + (f % 3) * .22;
        var fl = new THREE.Mesh(new THREE.SphereGeometry(.08 + (f % 2) * .03, 6, 5),
          solid(f % 3 === 0 ? m[2] : (f % 3 === 1 ? '#ffffff' : '#ffd27d'), { roughness: .75 }));
        fl.position.set(m[0] + Math.cos(a) * rr, -.12, m[1] + Math.sin(a) * rr);
        addO(fl);
      }
      var leaf = new THREE.Mesh(new THREE.SphereGeometry(.55, 7, 6), solid('#4f9a55', { roughness: 1 }));
      leaf.position.set(m[0], -.15, m[1]); leaf.scale.y = .25; addO(leaf);
    });

    // Rock clusters and natural accents for land texture.
    [[-50, 84, .9], [-76, -30, 1.1], [104, 24, .8], [74, -46, 1.0], [-8, 94, .85],
     [92, 88, .95], [116, 64, .75], [-88, 60, 1.05], [40, -58, .9], [-32, -66, .8]].forEach(function (r, i) {
      for (var k = 0; k < 3; k++) {
        var rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.22 * r[2] + k * .08, 0),
          solid(k === 1 ? '#9aa3aa' : '#8e989f', { roughness: .98 }));
        rock.position.set(r[0] + (k - 1) * .32, -.12 + k * .03, r[1] + (k % 2 ? .18 : -.14));
        rock.rotation.set(i * .4, k * .9, i * .2); addO(rock);
      }
    });

    // Extra farm richness: more crop rows, a small irrigation pond, and field edging.
    for (var fr = -22; fr <= 44; fr += 6) {
      for (var c = 0; c < 4; c++) {
        var cp = new THREE.Mesh(new THREE.SphereGeometry(.22, 7, 6), solid(c % 2 ? '#4a8a46' : '#6aa84f', { roughness: .95 }));
        cp.position.set(-18 + c * 2.6, -.08, fr); addO(cp);
      }
    }
    pond(52, 66, 2.4);
    cyl(.09, 2.2, '#8b6a46', 46, 1.0, 64); cyl(.09, 2.2, '#8b6a46', 58, 1.0, 64);
    box(12.2, .08, .08, '#c9b07a', 52, 1.9, 64);

    // Scenic garden nook in open east-north field (near tennis side but clear of court).
    [[60, -6], [64, -2], [56, -2]].forEach(function (p) { plant(p[0], p[1], 1.05); });
    parkBench(60, -10);
    shadow(60, -6, 1.2, .8, .08);

    // v30 performance guard: everything above can be hidden in one switch.
    if (structureGroup) {
      for (var si = sceneryStart; si < structureGroup.children.length; si++) {
        var so = structureGroup.children[si];
        if (so) { so.userData.v9Scenery = true; fx.scenery.push(so); }
      }
    }
    applyDetailLevel(true);
    batchStaticDetails();
  }
  /* ---------- v74 LIVING GROUND: colorful whole-map ground layer ----------
     Static color zones sit above the grass plane (-.20) and below the HQ slab
     (-.03). Tiny plain meshes are merged by batchStaticDetails(). Walang bagong
     fx array: the few gentle beacons use the existing animParts 'led' channel,
     kaya lahat ng dating 4D motion ay buong-buo pa rin.
  -------------------------------------------------------------------------- */
  function vividGroundTex(kind) {
    if (kind === 'mosaic') return makeTex('vivid-mosaic-v1', function (q, S) {
      q.fillStyle = '#2f7d6a'; q.fillRect(0, 0, S, S);
      var r = rnd(4211), cols = ['#e3b159', '#6bb3a6', '#ff6647', '#7fc4d8', '#b28fd6', '#9ccf6a', '#f6e3b4'];
      var cell = S / 8;
      for (var gy = 0; gy < 8; gy++) for (var gx = 0; gx < 8; gx++) {
        q.fillStyle = cols[Math.floor(r() * cols.length)];
        q.globalAlpha = .55 + r() * .35;
        q.fillRect(gx * cell + 2, gy * cell + 2, cell - 4, cell - 4);
      }
      q.globalAlpha = 1; q.strokeStyle = 'rgba(255,255,255,.26)'; q.lineWidth = 2;
      for (var p = 0; p <= S; p += cell) {
        q.beginPath(); q.moveTo(p, 0); q.lineTo(p, S); q.stroke();
        q.beginPath(); q.moveTo(0, p); q.lineTo(S, p); q.stroke();
      }
    }, 1, 1);
    if (kind === 'sun') return makeTex('vivid-sun-v1', function (q, S) {
      var r = rnd(88), cols = ['#e3b159', '#ff6647', '#6bb3a6', '#7fc4d8', '#b28fd6', '#9ccf6a', '#f6e3b4'];
      q.fillStyle = '#2e6f63'; q.fillRect(0, 0, S, S);
      var cx = S / 2, cy = S / 2, step = Math.PI / 12;
      for (var i = 0; i < 24; i++) {
        q.fillStyle = cols[i % cols.length]; q.globalAlpha = .5 + r() * .2;
        q.beginPath(); q.moveTo(cx, cy);
        q.arc(cx, cy, S * .72, i * step, (i + 1) * step); q.closePath(); q.fill();
      }
      q.globalAlpha = 1;
      for (var k = 0; k < 5; k++) {
        q.strokeStyle = 'rgba(255,255,255,' + (.12 + k * .08) + ')'; q.lineWidth = 3;
        q.beginPath(); q.arc(cx, cy, 28 + k * 26, 0, 6.3); q.stroke();
      }
    }, 1, 1);
    return makeTex('vivid-petal-v1', function (q, S) {
      q.fillStyle = '#3f8a58'; q.fillRect(0, 0, S, S);
      var r = rnd(612), cols = ['#ff6647', '#e3b159', '#b28fd6', '#f6e3b4', '#7fc4d8', '#ff9fc0'];
      for (var i = 0; i < 110; i++) {
        var px = r() * S, py = r() * S, rad = 3 + r() * 6;
        q.globalAlpha = .55 + r() * .4; q.fillStyle = cols[Math.floor(r() * cols.length)];
        for (var p = 0; p < 5; p++) {
          var a = p * 1.2566;
          q.beginPath(); q.arc(px + Math.cos(a) * rad, py + Math.sin(a) * rad, rad * .55, 0, 6.3); q.fill();
        }
        q.fillStyle = '#e3b159'; q.beginPath(); q.arc(px, py, rad * .42, 0, 6.3); q.fill();
      }
      q.globalAlpha = 1;
    }, 1, 1);
  }
  function livingGround() {
    var Y = -.194;
    var cols = ['#e3b159', '#6bb3a6', '#ff6647', '#7fc4d8', '#b28fd6', '#9ccf6a', '#ff9fc0', '#f6e3b4'];
    var r = rnd(20261121);
    var mosaic = solid('#ffffff', { map: vividGroundTex('mosaic'), roughness: .96, metalness: 0 });
    var sun = solid('#ffffff', { map: vividGroundTex('sun'), roughness: .96, metalness: 0 });
    var petal = solid('#ffffff', { map: vividGroundTex('petal'), roughness: .98, metalness: 0 });
    var beds = [[55, 30, 15, 11], [-26, 36, 13, 10], [38, -22, 13, 9], [2, -30, 12, 9], [64, 44, 12, 10]];

    // 1. festival sunburst plazas in the open meadows
    [[60, 17, 22, 22], [-30, 17, 20, 20], [23, -24, 24, 20], [14, 78, 24, 16]].forEach(function (a) {
      floor(a[2], a[3], sun, a[0], Y, a[1]);
    });
    // 2. flower / petal garden beds
    beds.forEach(function (a) { floor(a[2], a[3], petal, a[0], Y + .001, a[1]); });
    // 3. mosaic ribbon paths wrapping the HQ (clear of its footprint and the roads)
    [[15, -18, 100, 5], [-30, 20, 5, 82], [62, 20, 5, 82], [15, 82, 100, 5]].forEach(function (a) {
      floor(a[2], a[3], mosaic, a[0], Y + .002, a[1]);
    });
    // 4. tiny batched confetti, path studs and flower dots (plain materials, no extra userData)
    for (var s = -32; s <= 62; s += 2.4) {
      var si = Math.round(s / 2.4);
      bx(.085, .014, .085, cols[(si % cols.length + cols.length) % cols.length], s, Y + .012, -15.9);
      bx(.085, .014, .085, cols[(si + 3) % cols.length], s, Y + .012, -20.1);
      bx(.085, .014, .085, cols[(si + 5) % cols.length], s, Y + .012, 80.9);
    }
    for (var z2 = -18; z2 <= 58; z2 += 2.4) {
      var zi = Math.round(z2 / 2.4);
      bx(.085, .014, .085, cols[(zi + 1) % cols.length], -28.3, Y + .012, z2);
      bx(.085, .014, .085, cols[(zi + 4) % cols.length], 63.7, Y + .012, z2);
    }
    for (var i = 0; i < 240; i++) {
      var x = -42 + r() * 118, z = -34 + r() * 126;
      if (x > -2 && x < 48 && z > -2 && z < 36) continue;
      bx(.055, .009, .055, cols[Math.floor(r() * cols.length)], x, Y + .008, z);
    }
    beds.forEach(function (a) {
      for (var k = 0; k < 34; k++) {
        var fx2 = a[0] + (r() - .5) * (a[2] - 1.2), fz2 = a[1] + (r() - .5) * (a[3] - 1.2);
        cyl(.042, .014, cols[Math.floor(r() * cols.length)], fx2, Y + .014, fz2);
      }
    });
    // 5. gently pulsing color beacons — existing 4D 'led' channel, no new fx array
    [[60, 17], [-30, 17], [23, -24], [14, 78], [-30, 60], [62, 60]].forEach(function (p, i) {
      var b = cyl(.1, .06, cols[i % cols.length], p[0], Y + .04, p[1], true);
      animParts.push({ m: b, k: 'led', p: i * 1.7 });
    });
  }
  // ⏱ Pinagsasama ang maliliit na HINDI gumagalaw na detalye (bolts, trims,
  // butones) sa iisang InstancedMesh bawat materyal. Bumababa ang draw calls
  // nang ~30% nang hindi nagbabago ang itsura. HINDI hinihawakan ang anumang
  // nasa animated fx arrays, bots, o scenery — buong-buo ang lahat ng 4D.
  // I-off lang kung kailangan: window.__officeNoBatch = true bago mag-build.
  function batchStaticDetails() {
    if (typeof window !== 'undefined' && window.__officeNoBatch === true) return;
    try {
      if (typeof THREE === 'undefined' || !THREE.InstancedMesh || !(scene3d || g.level)) return;
      var marked = new Set();
      function mark(o) { if (o && o.traverse) marked.add(o); }
      if (typeof cuteBots !== 'undefined') cuteBots.forEach(function (b) { mark(b.group); mark(b.statusSprite); mark(b.roleTag); });
      ['shafts','screens','bubbles','steam','plants','sparkles','birds','scan','windows',
       'auras','antennae','glints','bands','cars','blinds','reflections','signals','peds','ballers',
       'planes','ceilings','steps','moods','walkways','holo','wet','neon','drones','growthPlants',
       'skylineLights','pets','outfits','softScenery','crops','scenery'].forEach(function (k) {
        var v = fx[k]; if (!v || !v.length) return;
        for (var i = 0; i < v.length; i++) { var x = v[i]; mark(x && (x.g || x.m || x.group || x.obj || x)); }
      });
      ['dust','sun','sky','sheen','night','ball','barista','fish','ceilingProj','rooftop','basement','elevator'].forEach(function (k) { mark(fx[k]); });
      if (fx.weather) {
        ['rain','flash','rainbow'].forEach(function (k) { mark(fx.weather[k]); });
        if (fx.weather.puddles) fx.weather.puddles.forEach(function (x) { mark(x && (x.m || x)); });
      }
      if (typeof animParts !== 'undefined') animParts.forEach(function (p) { mark(p && (p.m || p.g || p.o)); });
      // ⏱ index.html animated groups din — puno, bandila, usok, hayop,
      // butterfly, ulan, atbp. Baka masama ang maliliit na bahagi nila.
      // Hiwalay na guard: kung may hindi available na global, hindi
      // inaalis ang buong batching pass — ang core reduction tuloy pa rin.
      try {
        if (typeof g !== 'undefined' && g) {
          ['trees','flags','steam','clouds','birds','animals','butterflies','puddles','stars',
           'windParts','turf','grass','flowers','mist','deliveryParcels'].forEach(function (k) {
            var v = g[k]; if (!v) return;
            if (Array.isArray(v)) v.forEach(function (x) { mark(x && (x.f1 || x.f2 || x.f || x.m || x.s || x.grp || x.group || x)); });
            else mark(v);
          });
        }
        if (typeof rainDrops !== 'undefined' && rainDrops) rainDrops.forEach(function (x) { mark(x); });
        if (typeof chars3d !== 'undefined' && chars3d) chars3d.forEach(function (c) { mark(c && c.group); });
        if (typeof cityMovers3d !== 'undefined' && cityMovers3d) cityMovers3d.forEach(function (x) { mark(x && (x.g || x.group || x.m)); });
      } catch (e) {}
      var all = [];
      (scene3d || g.level).traverse(function (o) { all.push(o); });
      all.forEach(function (o) { // mark buong ancestry ng mga gumagalaw
        var p = o.parent;
        while (p) { if (marked.has(p)) { marked.add(o); break; } p = p.parent; }
      });
      (scene3d || g.level).updateMatrixWorld(true);
      var buckets = {};
      all.forEach(function (o) {
        if (!o.isMesh || marked.has(o) || !o.geometry || !o.material) return;
        var u = o.userData || {};
        for (var k in u) if (k !== 'v9' && k !== 'v9BaseHex') return; // may espesyal na papel
        var m = o.material;
        if (Array.isArray(m) || m.map || m.alphaMap || m.transparent || m.opacity < 1 ||
            (m.emissive && m.emissive.getHex() > 0) || m.vertexColors ||
            (typeof THREE.FrontSide !== 'undefined' && m.side !== THREE.FrontSide) ||
            (m.userData && m.userData.windShader)) return;
        var gg = o.geometry;
        if (!gg.boundingSphere) gg.computeBoundingSphere();
        var rad = (gg.boundingSphere && gg.boundingSphere.radius) || 0;
        if (rad >= .12) return; // malalaki o animated-scale props — huwag galawin
        var sig = gg.type + '|' + JSON.stringify(gg.parameters || {}) + '|' + m.type + '|' +
                  (m.color ? m.color.getHexString() : '') + '|' + (m.roughness || 0) + '|' + (m.metalness || 0);
        (buckets[sig] = buckets[sig] || []).push(o);
      });
      var made = 0, saved = 0;
      Object.keys(buckets).forEach(function (sig) {
        var items = buckets[sig];
        if (items.length < 4 || !items[0].parent) return;
        try {
          var parent = items[0].parent;
          var inst = new THREE.InstancedMesh(items[0].geometry, items[0].material, items.length);
          var inv = new THREE.Matrix4().copy(parent.matrixWorld).invert(), mat = new THREE.Matrix4();
          for (var i = 0; i < items.length; i++) {
            mat.multiplyMatrices(inv, items[i].matrixWorld);
            inst.setMatrixAt(i, mat);
          }
          inst.instanceMatrix.needsUpdate = true;
          inst.userData.v9 = true;
          if (inst.computeBoundingSphere) inst.computeBoundingSphere();
          parent.add(inst);
          items.forEach(function (o) { if (o.parent) o.parent.remove(o); });
          made++; saved += items.length - 1;
        } catch (e) {}
      });
      batchStaticDetails.stats = { batches: made, savedDraws: saved };
      try { window.__officeBatchStats = batchStaticDetails.stats; } catch (e) {}
    } catch (e) {}
  }
  function applyDetailLevel(force) {
    var low = (typeof window !== 'undefined' && window.__officeDetail !== 'high');
    var count = fx.scenery.length;
    if (!force && applyDetailLevel.last === low && applyDetailLevel.count === count) return;
    applyDetailLevel.last = low;
    applyDetailLevel.count = count;
    fx.scenery.forEach(function (m) { if (m) m.visible = !low; });
  }
  function applyThemeVisuals(theme) {
    var cfg = THEME_HSL[theme] || THEME_HSL.default;
    var i = 0;
    fx.scenery.forEach(function (root) {
      if (!root || !root.traverse) return;
      root.traverse(function (o) {
        var mat = o.material;
        if (!mat || !mat.color) return;
        if (!o.userData.v9BaseHex) o.userData.v9BaseHex = mat.color.getHexString();
        if (theme === 'default') { mat.color.set('#' + o.userData.v9BaseHex); return; }
        var c = new THREE.Color('#' + o.userData.v9BaseHex), hsl = { h: 0, s: 0, l: 0 };
        c.getHSL(hsl);
        var greenish = hsl.h > .18 && hsl.h < .48 && hsl.s > .12;
        if (!greenish) return;
        if (theme === 'pasko') {
          mat.color.set((i++ % 2) ? '#d94f4f' : '#2f9d6a');
          return;
        }
        c.setHSL((hsl.h + cfg.h + 1) % 1,
          Math.max(.05, Math.min(1, hsl.s + cfg.s)),
          Math.max(.08, Math.min(.95, hsl.l + cfg.l)));
        mat.color.copy(c);
      });
    });
  }
  function buildingEnhancements() {
    wainscot(.36, 17, .06, 33.6, '#dfe3e6');
    wainscot(45.64, 17, .06, 33.6, '#dfe3e6');
    wainscot(8.7, 33.82, 16.8, .06, '#dfe3e6');
    wainscot(41.7, 33.82, 8.8, .06, '#dfe3e6');
    [6, 15, 24, 33, 42].forEach(function (x) { column(x, 4.2); column(x, 22.8); });
    [10.5, 19.5, 28.5, 37.5].forEach(function (x) {
      [8.5, 17, 25.5].forEach(function (z) { ceilingPanel(8.2, 7.4, x, z); });
    });
    applyCeilingView();
    [[10.5, 12.5], [28.5, 12.5], [19.5, 26.5], [37.5, 26.5]].forEach(function (p) { hvacVent(p[0], p[1]); });
    [[6, 4.2], [15, 22.8], [24, 4.2], [33, 22.8], [42, 4.2]].forEach(function (p) {
      fireSprinkler(p[0], p[1]); smokeDetector(p[0] + 1.4, p[1]);
    });
    glassDoors(23, 34);
    entranceCanopy(23, 34);
    receptionDetails(); meetingDetails(); pantryDetails(); serverDetails(); wayfinding();
  }
  function aryaskyArtZone() {
    // OPISINA ART ZONE — ARYASKY's sample works: moodboards, zone maquettes,
    // a live drafting desk and the exact ARYASKY accent palette.
    planeAt(9.2, 7.2, solid('#ffffff', { map: rugTex('#1f4f4a', '#e3b159', 2, 2), roughness: .95 }), 32.5, .012, 20.5);
    bx(9.2, .02, .05, '#e3b159', 32.5, .024, 16.95, true);
    bx(9.2, .02, .05, '#6bb3a6', 32.5, .024, 24.05, true);
    bx(.05, .02, 7.2, '#ff6647', 28.0, .024, 20.5, true);
    bx(.05, .02, 7.2, '#e3b159', 37.0, .024, 20.5, true);
    wallSign('OPISINA ART ZONE', 'ARYASKY · LAYOUT SAMPLES', 32.5, 2.5, 16.62, 4.8, 1.0, 0, '#6bb3a6');
    pendant(32.5, 20.5, '#6bb3a6');

    // Drafting desk with a real blueprint surface and the 3 accent swatches.
    [[29.0, 19.75], [29.0, 20.95], [31.2, 19.75], [31.2, 20.95]].forEach(function (p) {
      box(.09, .72, .09, '#5a4632', p[0], .36, p[1]);
    });
    box(2.6, .12, 1.5, solid('#8b5e34', { map: woodTex('#8b5e34', '#634122', 2, 1) }), 30.1, .78, 20.35);
    box(2.45, .03, 1.35, '#d9e4ef', 30.1, .86, 20.35);
    var plan = new THREE.Mesh(new THREE.BoxGeometry(2.3, .02, 1.2),
      new THREE.MeshBasicMaterial({ map: blueprintTex(), toneMapped: false }));
    plan.position.set(30.1, .89, 20.35); addO(plan);
    ['#e3b159', '#6bb3a6', '#ff6647'].forEach(function (c, i) {
      box(.34, .014, .18, c, 29.25 + i * .42, .9, 21.0);
    });
    box(.75, .05, .48, '#1b2537', 31.1, .91, 20.95);
    bx(.65, .02, .38, '#6bb3a6', 31.1, .945, 20.95, true);
    officeChair(30.1, 21.95, Math.PI, '#3f7d78');

    // Three layout maquettes: Class Plaza, Combat Arena and Flight Zone.
    [33.0, 35.0, 37.0].forEach(function (x, i) {
      box(.9, .75, .9, '#2f3d52', x, .375, 19.2);
      box(.96, .03, .96, '#d9e4ef', x, .77, 19.2);
      bx(.7, .02, .05, ['#e3b159', '#6bb3a6', '#ff6647'][i], x, .795, 19.68, true);
    });
    for (var k = 0; k < 8; k++) {
      var a = k / 8 * Math.PI * 2;
      cyl(.045, .12, ['#e3b159', '#6bb3a6', '#ff6647', '#e8d6b8'][k % 4],
        33 + Math.cos(a) * .28, .86, 19.2 + Math.sin(a) * .28);
    }
    var core = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6),
      solid('#e3b159', { emissive: '#e3b159', emissiveIntensity: .8 }));
    core.position.set(33, .87, 19.2); addO(core);
    [[-.3, -.3], [-.3, .3], [.3, -.3], [.3, .3]].forEach(function (p, j) {
      box(.09, .22, .09, '#8b96a5', 35 + p[0], .89, 19.2 + p[1]);
      var brazier = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6),
        solid(j % 2 ? '#e3b159' : '#ff6647', { emissive: '#ff6647', emissiveIntensity: .9 }));
      brazier.position.set(35 + p[0], 1.03, 19.2 + p[1]); addO(brazier);
    });
    box(.5, .02, .5, '#6b7a8c', 35, .8, 19.2);
    cyl(.06, .55, '#6bb3a6', 37, 1.05, 19.2);
    var wingRing = new THREE.Mesh(new THREE.TorusGeometry(.26, .02, 8, 20),
      solid('#e3b159', { emissive: '#e3b159', emissiveIntensity: .6 }));
    wingRing.rotation.x = Math.PI / 2; wingRing.position.set(37, 1.28, 19.2); addO(wingRing);
    box(.6, .02, .6, '#8b96a5', 37, .8, 19.2);

    // Two angled sample-art boards so the work is readable from the hero camera.
    function board(x, z, seed, col) {
      box(1.7, .12, .9, '#0f1b2e', x, .55, z);
      box(.12, .55, .12, '#5a4632', x, .28, z + .25);
      box(.12, .55, .12, '#5a4632', x, .28, z - .25);
      var back = new THREE.Mesh(new THREE.BoxGeometry(1.54, 1.04, .04), solid('#0f1b2e'));
      back.rotation.x = -Math.PI / 2 - .55; back.position.set(x, 1.02, z); addO(back);
      var face = new THREE.Mesh(new THREE.BoxGeometry(1.44, .94, .025),
        new THREE.MeshBasicMaterial({ map: artTex(seed), toneMapped: false }));
      face.rotation.x = -Math.PI / 2 - .55; face.position.set(x, 1.04, z - .02); addO(face);
      bx(1.4, .02, .05, col, x, .72, z + .35, true);
    }
    board(32.0, 21.9, 1, '#e3b159');
    board(34.2, 21.9, 2, '#6bb3a6');
  }
  // v73 WHOLE-BUILDING PASS — the main HQ gets a complete architectural skin,
  // a real roofline, a branded entry portal, interior zone portals and gentle
  // 4D light halos. Nothing existing is removed or converted to flat 3D.
  function wholeBuildingEnhancements() {
    var gold = '#e3b159', teal = '#6bb3a6', coral = '#ff6647';
    var metal = solid('#aeb8c4', { map: metalTex(), metalness: .55, roughness: .35 });
    var stone = solid('#e8e4dc', { map: concreteTex(), roughness: .88 });
    var dark = solid('#2f3d52', { metalness: .35, roughness: .42 });

    function led(w, h, d, c, x, y, z, phase) {
      var m = bx(w, h, d, c, x, y, z, true);
      animParts.push({ m: m, k: 'led', p: phase == null ? x + y + z : phase });
      return m;
    }
    function glowCyl(r, h, c, x, y, z, phase) {
      var m = cyl(r, h, c, x, y, z, true);
      animParts.push({ m: m, k: 'led', p: phase == null ? x + z : phase });
      return m;
    }
    function halo(x, z, r, c, y, phase) {
      var m = new THREE.Mesh(new THREE.TorusGeometry(r, .026, 6, 40),
        solid(c, { emissive: c, emissiveIntensity: .5 }));
      m.rotation.x = Math.PI / 2; m.position.set(x, y, z); addO(m);
      animParts.push({ m: m, k: 'led', p: phase == null ? x + z : phase });
      return m;
    }
    function medallion(x, z, r, c1, c2) {
      [[r - .07, r, c1], [r * .55, r * .55 + .035, c2]].forEach(function (a) {
        var m = new THREE.Mesh(new THREE.RingGeometry(a[0], a[1], 40, 1),
          new THREE.MeshBasicMaterial({ color: a[2], transparent: true, opacity: .72,
            side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
        m.rotation.x = -Math.PI / 2; m.position.set(x, .019, z); addO(m);
      });
    }
    function portal(x, z, along, w, title, sub, accent) {
      if (along === 'x') {
        [-w / 2, w / 2].forEach(function (dx) {
          box(.16, 2.6, .18, metal, x + dx, 1.3, z);
          led(.035, 2.4, .04, accent, x + dx, 1.3, z + .11, x + dx);
        });
        box(w + .34, .16, .2, metal, x, 2.62, z);
        led(w - .12, .035, .05, accent, x, 2.52, z + .12, x);
        wallSign(title, sub, x, 2.96, z + .14, Math.min(w * .62, 3.2), .52, 0, accent);
      } else {
        [-w / 2, w / 2].forEach(function (dz) {
          box(.18, 2.6, .16, metal, x, 1.3, z + dz);
          led(.04, 2.4, .035, accent, x + .11, 1.3, z + dz, z + dz);
        });
        box(.2, .16, w + .34, metal, x, 2.62, z);
        led(.05, .035, w - .12, accent, x + .12, 2.52, z, z);
        wallSign(title, sub, x + .14, 2.96, z, Math.min(w * .62, 3.2), .52, -Math.PI / 2, accent);
      }
    }
    function totem(x, z, title, sub, accent) {
      box(.5, 1.7, .32, dark, x, .85, z);
      box(.58, .08, .4, metal, x, 1.74, z);
      wallSign(title, sub, x, 1.3, z + .2, .92, .5, 0, accent);
      led(.42, .03, .04, accent, x, .18, z + .21, x);
    }
    function roofPlanter(x, z, s) {
      box(1.25 * s, .34 * s, .7 * s, solid('#8b5e34', { map: woodTex('#8b5e34', '#634122', 1, 1) }), x, 6.3, z);
      [[-.35, .58], [0, .66], [.35, .58]].forEach(function (p, i) {
        var leaf = new THREE.Mesh(new THREE.SphereGeometry(.24 * s, 8, 6),
          solid(['#2f8c56', '#3da167', '#287a4c'][i], { roughness: .88 }));
        leaf.position.set(x + p[0] * s, 6.65 + p[1] * s * .2, z); addO(leaf);
      });
    }

    // ---- 1. upper facade band + roofline (transparent so the open HQ stays readable) ----
    glass(46.4, 2.35, .14, 23, 4.45, 34.2, .24, '#bcd9ec');
    glass(.14, 2.35, 34.2, -.14, 4.45, 17, .2, '#bcd9ec');
    glass(.14, 2.35, 34.2, 46.14, 4.45, 17, .2, '#bcd9ec');
    glass(46.4, 2.35, .14, 23, 4.45, -.14, .18, '#bcd9ec');
    for (var ux = 1; ux <= 45; ux += 3.1) box(.06, 2.3, .08, '#2e3a4d', ux, 4.45, 34.29);
    for (var uz = 1; uz <= 33; uz += 3.1) {
      box(.08, 2.3, .06, '#2e3a4d', -.22, 4.45, uz);
      box(.08, 2.3, .06, '#2e3a4d', 46.22, 4.45, uz);
    }
    box(47.2, .18, .34, metal, 23, 5.75, 34.22);
    box(47.2, .3, .28, stone, 23, 5.98, 34.22);
    box(.3, .3, 34.6, stone, -.22, 5.98, 17);
    box(.3, .3, 34.6, stone, 46.22, 5.98, 17);
    box(47.2, .18, .3, metal, 23, 6.15, 34.22);
    box(47.2, .18, .3, metal, 23, 6.15, -.22);
    box(.18, .18, 34.6, metal, -.22, 6.15, 17);
    box(.18, .18, 34.6, metal, 46.22, 6.15, 17);
    [6, 15, 24, 33, 42].forEach(function (x, i) {
      led(.09, 2.45, .1, [gold, teal, gold, coral, teal][i], x, 4.45, 34.36, i * 1.3);
    });
    led(46.6, .04, .05, teal, 23, 3.14, 34.17, 4.1);
    wallSign('CYBORG CHEEBEE HQ', 'AI AGENTS · OPEN 24/7', 23, 4.55, 34.44, 7.4, 1.05, 0, gold);
    [6, 14, 22, 30, 38, 44].forEach(function (x) { roofPlanter(x, 34.72, .86); });
    [10, 18, 27].forEach(function (x) {
      var panel = box(2.6, .08, 1.45, solid('#1d2b42', { metalness: .55, roughness: .3 }), x, 6.34, 33.7);
      panel.rotation.x = -.32;
      led(2.4, .025, .05, teal, x, 6.29, 34.4, x);
    });
    cyl(.035, 1.1, '#8b97a5', 43.6, 6.72, 33.9);
    glowCyl(.09, .09, coral, 43.6, 7.32, 33.9, 2.7);

    // ---- 2. branded entry portal + plaza details ----
    [19.2, 26.8].forEach(function (x) {
      box(.42, 3.55, .42, stone, x, 1.78, 34.42);
      box(.5, .12, .5, metal, x, 3.62, 34.42);
      led(.04, 2.85, .05, teal, x + (x < 23 ? .24 : -.24), 1.75, 34.66, x);
    });
    box(8.1, .34, .48, stone, 23, 3.64, 34.42);
    led(7.7, .04, .06, gold, 23, 3.44, 34.7, 5.5);
    totem(15.4, 36.5, 'WELCOME', 'RECEPTION →', teal);
    totem(30.6, 36.5, 'TOURS', 'MAIN STREET →', gold);
    plant(17.1, 37.3, .82); plant(28.9, 37.3, .82);
    for (var bx2 = 8; bx2 <= 38; bx2 += 5) {
      cyl(.1, .62, '#2f3d52', bx2, .31, 40.6);
      glowCyl(.075, .035, bx2 % 10 ? gold : teal, bx2, .65, 40.6, bx2);
    }

    // ---- 3. interior circulation: color spine, medallions, zone portals ----
    bx(38, .014, .045, teal, 23, .021, 22.86, true);
    bx(38, .014, .045, gold, 23, .021, 23.54, true);
    for (var sx = 5; sx <= 41; sx += 4) bx(1.1, .016, .04, gold, sx, .024, 23.2, true);
    medallion(23, 30.4, 1.45, teal, gold);
    medallion(14, 11, 1.2, gold, teal);
    medallion(37, 10, 1.2, '#5f7fa8', teal);
    medallion(37, 29, 1.2, coral, gold);
    medallion(32.5, 20.5, 1.1, teal, coral);
    portal(23, 26.6, 'x', 5.2, 'RECEPTION', 'LOBBY · FRONT DESK', teal);
    portal(23, 19.4, 'x', 5.2, 'FOCUS', 'OPEN WORK · QUIET', gold);
    portal(29, 23.2, 'z', 4.2, 'MEET', 'STUDIO · HUDDLE', '#5f7fa8');
    portal(37, 23.2, 'z', 4.2, 'GATHER', 'PANTRY · COFFEE', coral);
    portal(32.5, 17.2, 'x', 4.6, 'ART ZONE', 'ARYASKY SAMPLES', teal);
    halo(23, 30.4, 1.15, teal, 3.42, 1.1);
    halo(14, 11, 1.05, gold, 3.42, 2.2);
    halo(37, 10, 1.05, '#5f7fa8', 3.42, 3.3);
    halo(37, 29, 1.05, coral, 3.42, 4.4);
    halo(32.5, 20.5, .95, teal, 3.42, 5.5);
    [6, 15, 24, 33, 42].forEach(function (x, i) {
      led(.04, .03, 34.2, [gold, teal, gold, coral, teal][i], x, 3.27, 17, i * 1.7);
    });
    plant(10.5, 22.2, .7); plant(35.5, 22.2, .7);
  }
  function presentationScreen(x, z, rot) {
    var g2 = new THREE.Group();
    var frame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.42, .09), solid('#1b2537'));
    frame.position.y = 1.76; frame.userData.v9 = true; g2.add(frame);
    var scr = new THREE.Mesh(new THREE.BoxGeometry(2.52, 1.24, .03),
      new THREE.MeshBasicMaterial({ map: screenTex(screenCounter++), toneMapped: false }));
    scr.position.set(0, 1.76, .06); scr.userData.v9 = true; g2.add(scr);
    var post = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1.05, 8), solid('#4b586b'));
    post.position.y = .52; post.userData.v9 = true; g2.add(post);
    var foot = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .5), solid('#3b475b'));
    foot.position.y = .04; foot.userData.v9 = true; g2.add(foot);
    // webcam and speaker bar
    var cam = new THREE.Mesh(new THREE.BoxGeometry(.12, .06, .05), solid('#2f394b'));
    cam.position.set(0, 2.52, .08); cam.userData.v9 = true; g2.add(cam);
    var camLens = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .02, 8), solid('#5fd6ff', { emissive: '#5fd6ff', emissiveIntensity: .3 }));
    camLens.rotation.x = Math.PI / 2; camLens.position.set(0, 2.52, .11); camLens.userData.v9 = true; g2.add(camLens);
    var speaker = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .05), solid('#2c3648'));
    speaker.position.set(0, 1.06, .06); speaker.userData.v9 = true; g2.add(speaker);
    for (var si = -2; si <= 2; si++) {
      var dot = new THREE.Mesh(new THREE.BoxGeometry(.03, .015, .01), solid('#5d6b7d'));
      dot.position.set(si * .12, 1.06, .09); dot.userData.v9 = true; g2.add(dot);
    }
    g2.position.set(x, 0, z); g2.rotation.y = rot || 0; addO(g2);
    reflection(x, z, 1.5, .7, '#7fc7ff', rot || 0, .05);
  }
  function deskDetails(g2, di) {
    var mat = new THREE.Mesh(new THREE.BoxGeometry(.92, .012, .32), solid('#2f3d52', { roughness: .95 }));
    mat.position.set(0, .816, .22); mat.userData.v9 = true; g2.add(mat);
    var tablet = bx(.36, .22, .025, '#5fd6ff', .56, 1.02, -.04, true);
    tablet.rotation.z = -.12; tablet.rotation.x = -.28; tablet.userData.v9 = true; g2.add(tablet);
    var pad = new THREE.Mesh(new THREE.BoxGeometry(.28, .01, .2), solid('#4a5668', { roughness: .95 }));
    pad.position.set(-.42, .815, .18); pad.userData.v9 = true; g2.add(pad);
    var cup = new THREE.Mesh(new THREE.CylinderGeometry(.065, .055, .13, 8), solid('#3f5a76'));
    cup.position.set(.72, .875, -.2); cup.userData.v9 = true; g2.add(cup);
    [-.03, .02, .06].forEach(function (ox, k) {
      var pen = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .2, 5),
        solid(['#e0a83a', '#c94f4f', '#79e0b2'][k]));
      pen.position.set(.72 + ox, .98, -.2 + ox * .4); pen.rotation.z = ox * 2;
      pen.userData.v9 = true; g2.add(pen);
    });
    if (di % 2 === 0) {
      var n1 = box(.09, .09, .012, '#ffe08a', -.26, 1.45, -.18); n1.userData.v9 = true; g2.add(n1);
      var n2 = box(.09, .09, .012, '#ff9fc4', -.11, 1.45, -.18); n2.userData.v9 = true; g2.add(n2);
    } else {
      var photo = box(.11, .08, .012, '#dfe6ee', -.18, 1.45, -.18); photo.userData.v9 = true; g2.add(photo);
    }
  }
  function tableCenterpiece(x, z) {
    cyl(.18, .045, '#2f3d52', x, .88, z);
    bx(.12, .02, .12, '#6cc2f0', x, .91, z, true);
    cyl(.14, .03, '#3f4f63', x, .885, z);
    cyl(.03, .02, '#79e0b2', x, .905, z);
    var notes = new THREE.Mesh(new THREE.BoxGeometry(.34, .02, .24), solid('#f2eee4'));
    notes.rotation.y = .24; notes.position.set(x + .62, .87, z); notes.userData.v9 = true; addO(notes);
    var pen = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .26, 6), solid('#3f5a76'));
    pen.rotation.y = .24; pen.rotation.z = Math.PI / 2; pen.position.set(x + .62, .89, z + .04);
    pen.userData.v9 = true; addO(pen);
    cyl(.045, .06, '#8b5e34', x - .58, .89, z + .04);
    var succ = new THREE.Mesh(new THREE.SphereGeometry(.07, 7, 6), solid('#63b07a', { roughness: .85 }));
    succ.position.set(x - .58, .95, z + .04); succ.userData.v9 = true; addO(succ);
  }
  function ensureGrade() {
    var host = document.getElementById('oc3d');
    if (!host || document.getElementById('v16Grade')) return;
    var el = document.createElement('div');
    el.id = 'v16Grade'; el.setAttribute('aria-hidden', 'true');
    host.appendChild(el);
  }

  /* ---------- legible signage (fixed orientation: south signs face +Z) ---------- */
  function signTexture(txt, sub, accent) {
    var cv = document.createElement('canvas'); cv.width = 640; cv.height = 180;
    var q = cv.getContext('2d');
    q.fillStyle = '#16243a'; q.fillRect(0, 0, 640, 180);
    q.fillStyle = accent || '#3f9d9a'; q.fillRect(0, 0, 16, 180);
    q.fillStyle = 'rgba(255,255,255,.08)'; q.fillRect(16, 0, 624, 5);
    q.textBaseline = 'middle'; q.textAlign = 'left';
    q.fillStyle = '#ffffff'; q.font = 'bold 52px Arial, sans-serif';
    q.fillText(txt, 40, 72, 580);
    q.fillStyle = '#b9c8dc'; q.font = '24px Arial, sans-serif';
    q.fillText(sub || '', 42, 128, 570);
    var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true; return t;
  }
  function wallSign(txt, sub, x, y, z, w, h, rot, accent) {
    var grp = new THREE.Group();
    var back = new THREE.Mesh(new THREE.BoxGeometry(w + .12, h + .12, .07), solid('#0f1b2e'));
    grp.add(back);
    [[-w / 2, h / 2], [w / 2, h / 2], [-w / 2, -h / 2], [w / 2, -h / 2]].forEach(function (p) {
      var bolt = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .02, 6), solid('#8b97a5', { metalness: .5, roughness: .35 }));
      bolt.rotation.x = Math.PI / 2; bolt.position.set(p[0], p[1], .04); grp.add(bolt);
    });
    var face = new THREE.Mesh(new THREE.BoxGeometry(w, h, .02),
      new THREE.MeshBasicMaterial({ map: signTexture(txt, sub, accent) }));
    face.position.z = .046; grp.add(face);
    grp.position.set(x, y, z); grp.rotation.y = rot || 0; addO(grp); return grp;
  }

  /* ---------- architecture helpers ---------- */
  function glass(w, h, d, x, y, z, op, color) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({
      color: color || '#bcd9ec', transparent: true, opacity: op || .3, roughness: .08,
      metalness: .25, side: THREE.DoubleSide, depthWrite: false
    }));
    m.position.set(x, y, z); return addO(m);
  }
  function mullion(x, z, along, h) {
    var H = h || 2.5;
    if (along === 'x') box(.07, H, .09, '#2e3a4d', x, H / 2, z);
    else box(.09, H, .07, '#2e3a4d', x, H / 2, z);
  }
  function doorway(x, z, along) {
    var c = '#223047';
    if (along === 'x') {
      box(.1, 2.32, .13, c, x - .76, 1.16, z);
      box(.1, 2.32, .13, c, x + .76, 1.16, z);
      box(1.62, .12, .13, c, x, 2.38, z);
    } else {
      box(.13, 2.32, .1, c, x, 1.16, z - .76);
      box(.13, 2.32, .1, c, x, 1.16, z + .76);
      box(.13, .12, 1.62, c, x, 2.38, z);
    }
    bx(1.3, .025, .05, '#6fd0c4', x, .02, z, true);
  }
  function pendant(x, z, col) {
    cyl(.014, .66, '#3d495c', x, 3.02, z);
    var shade = new THREE.Mesh(new THREE.ConeGeometry(.38, .3, 14, 1, true),
      solid(col || '#b07b3d', { side: THREE.DoubleSide, roughness: .45, metalness: .35 }));
    shade.position.set(x, 2.62, z); shade.rotation.x = Math.PI; addO(shade);
    var trim = new THREE.Mesh(new THREE.TorusGeometry(.35, .012, 6, 18), solid('#f3e3c2', { metalness: .35, roughness: .4 }));
    trim.rotation.x = Math.PI / 2; trim.position.set(x, 2.47, z); addO(trim);
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8),
      solid('#fff1c9', { emissive: '#ffd489', emissiveIntensity: .9 }));
    bulb.position.set(x, 2.44, z); addO(bulb);
    lightPool(x, z, 2.7, '#ffd7a0');
    lightShaft(x, z, 1.55, col === '#3f6fa8' || col === '#5f7fa8' ? '#bcdcff' : '#ffd7a0');
    animParts.push({ m: bulb, k: 'bulb', p: x + z });
  }
  function strip(x1, z1, x2, z2, c, w) {
    var dx = x2 - x1, dz = z2 - z1, len = Math.sqrt(dx * dx + dz * dz);
    var m = new THREE.Mesh(new THREE.BoxGeometry(w || .025, .012, len), solid(c));
    m.position.set((x1 + x2) / 2, .02, (z1 + z2) / 2);
    m.rotation.y = Math.atan2(dx, dz); return addO(m);
  }

  /* ---------- furniture ---------- */
  function plant(x, z, s) {
    var k = s || 1;
    shadow(x, z, .42 * k, .34 * k, .13);
    cyl(.24 * k, .42 * k, '#a06d43', x, .21 * k, z);
    cyl(.255 * k, .03, '#c89a6b', x, .41 * k, z);
    cyl(.19 * k, .05, '#7a5236', x, .44 * k, z);
    var cols = ['#2f8c56', '#3da167', '#287a4c'];
    for (var i = 0; i < 5; i++) {
      var a = i * 1.256;
      var l = new THREE.Mesh(new THREE.ConeGeometry(.34 * k, 1.05 * k, 7),
        solid(cols[i % 3], { roughness: .85 }));
      l.position.set(x + Math.cos(a) * .22 * k, .94 * k + (i % 2) * .16 * k, z + Math.sin(a) * .22 * k);
      l.rotation.z = Math.cos(a) * .22; l.rotation.x = Math.sin(a) * .22; addO(l);
      fx.plants.push({ m: l, bz: l.rotation.z, bx: l.rotation.x, p: i * 1.3 + x });
    }
    if ((Math.abs(Math.round(x * 10 + z * 7)) % 3) === 0) {
      var bud = new THREE.Mesh(new THREE.SphereGeometry(.06 * k, 7, 6), solid('#ffd27d', { roughness: .7 }));
      bud.position.set(x + .06 * k, 1.12 * k, z - .04 * k); addO(bud);
    }
  }
  function tree(x, z, s) {
    var k = s || 1;
    shadow(x, z, .85 * k, .65 * k, .14);
    cyl(.34 * k, .5 * k, '#7a5230', x, .25 * k, z);
    cyl(.075 * k, 1.55 * k, '#5b4632', x, 1.28 * k, z);
    [[0, 1.82, .76], [.54, 1.46, .66], [-.52, 1.52, .64], [.1, 2.3, .58], [-.18, 2.04, .5], [.26, 1.98, .46]].forEach(function (p, i) {
      var cols = ['#2f8558', '#3a9d68', '#2d7a52', '#46a86f', '#2f7f59', '#3f9363'];
      var leaf = new THREE.Mesh(new THREE.SphereGeometry(p[2] * k, 9, 7),
        solid(cols[i % cols.length], { roughness: .88 }));
      leaf.position.set(x + p[0] * k, p[1] * k, z); addO(leaf);
      fx.plants.push({ m: leaf, bz: leaf.rotation.z, bx: leaf.rotation.x, p: i * 1.1 + z });
    });
    // occasional blossom clusters
    if ((Math.abs(Math.round(x * 13 + z * 7)) % 4) === 0) {
      [[.12, 2.02, '#ffd1e3'], [-.2, 1.7, '#ffe8f2'], [.28, 1.85, '#ffd1e3']].forEach(function (b) {
        var bl = new THREE.Mesh(new THREE.SphereGeometry(.09 * k, 6, 5), solid(b[2], { roughness: .8 }));
        bl.position.set(x + b[0] * k, b[1] * k, z + .08 * k); addO(bl);
      });
    }
  }
  function sofa(x, z, col, rot) {
    shadow(x, z, 1.35, .7, .15);
    var g2 = new THREE.Group();
    var fm = solid(col, { map: fabricTex(col, 2, 2), roughness: .9, metalness: 0 });
    var seat = new THREE.Mesh(new THREE.BoxGeometry(2.3, .42, .95), fm); seat.position.y = .34; g2.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(2.3, .66, .22), fm); back.position.set(0, .76, -.4); g2.add(back);
    [-.94, .94].forEach(function (px) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(.2, .52, .95), solid('#5d6b7d'));
      arm.position.set(px, .54, 0); g2.add(arm);
      var foot = new THREE.Mesh(new THREE.BoxGeometry(.1, .16, .1), solid('#384457'));
      foot.position.set(px, .08, .35); g2.add(foot);
    });
    var cushion = new THREE.Mesh(new THREE.BoxGeometry(.8, .14, .72), solid('#d9c9a8'));
    cushion.position.set(-.5, .6, .04); cushion.rotation.z = -.22; g2.add(cushion);
    // throw blanket draped over right arm
    var throwB = new THREE.Mesh(new THREE.BoxGeometry(.62, .02, .86), solid('#e8d7b8', { roughness: .95 }));
    throwB.position.set(.68, .58, -.02); throwB.rotation.z = .12; throwB.rotation.y = -.08; g2.add(throwB);
    var throwFold = new THREE.Mesh(new THREE.BoxGeometry(.18, .02, .5), solid('#f1e4cc', { roughness: .95 }));
    throwFold.position.set(.92, .62, -.18); throwFold.rotation.z = .45; g2.add(throwFold);
    g2.position.set(x, 0, z); g2.rotation.y = rot || 0; addO(g2);
  }
  function officeChair(x, z, rot, col) {
    shadow(x, z, .42, .38, .12);
    var g2 = new THREE.Group();
    var cm = solid(col || '#41536b', { map: fabricTex(col || '#41536b', 1, 1), roughness: .9, metalness: 0 });
    cyl(.05, .42, '#2f394b', x, .21, z);
    var seat = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .11, 14), cm); seat.position.y = .47; g2.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(.6, .66, .13), cm); back.position.set(0, .86, .28); g2.add(back);
    [-.34, .34].forEach(function (px) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(.07, .05, .38), solid('#2f394b'));
      arm.position.set(px, .7, .06); g2.add(arm);
      var post = new THREE.Mesh(new THREE.BoxGeometry(.05, .2, .05), solid('#2f394b'));
      post.position.set(px, .59, .16); g2.add(post);
    });
    var base = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .05, 12), solid('#2f394b'));
    base.position.y = .06; g2.add(base);
    // caster wheels
    for (var ci = 0; ci < 5; ci++) {
      var ca = ci * Math.PI * 2 / 5;
      var spoke = new THREE.Mesh(new THREE.BoxGeometry(.04, .03, .18), solid('#2f394b'));
      spoke.position.set(Math.cos(ca) * .18, .04, Math.sin(ca) * .18);
      spoke.rotation.y = -ca; spoke.userData.v9 = true; g2.add(spoke);
      var wheel = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .03, 8), solid('#1f2733'));
      wheel.rotation.z = Math.PI / 2; wheel.rotation.y = ca;
      wheel.position.set(Math.cos(ca) * .26, .035, Math.sin(ca) * .26);
      wheel.userData.v9 = true; g2.add(wheel);
    }
    g2.position.set(x, 0, z); g2.rotation.y = rot || 0; addO(g2);
  }
  function desk(x, z, rot) {
    shadow(x, z, 1.05, .62, .14);
    var g2 = new THREE.Group();
    var wm = solid('#c39a67', { map: woodTex('#c39a67', '#8b653e', 2, 1), roughness: .5 });
    var top = new THREE.Mesh(new THREE.BoxGeometry(1.85, .09, .86), wm); top.position.y = .76; g2.add(top);
    [-.8, .8].forEach(function (px) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(.09, .72, .74), solid('#606e80', { metalness: .5, roughness: .35 }));
      leg.position.set(px, .38, 0); g2.add(leg);
    });
    var mon = new THREE.Mesh(new THREE.BoxGeometry(.88, .54, .06), solid('#1c2637', { roughness: .35 }));
    mon.position.set(0, 1.17, -.22); g2.add(mon);
    var standNeck = new THREE.Mesh(new THREE.BoxGeometry(.08, .28, .05), solid('#2f394b'));
    standNeck.position.set(0, .95, -.22); g2.add(standNeck);
    var standBase = new THREE.Mesh(new THREE.BoxGeometry(.36, .03, .22), solid('#2f394b', { metalness: .4, roughness: .35 }));
    standBase.position.set(0, .815, -.2); g2.add(standBase);
    var di = screenCounter++;
    var scr = new THREE.Mesh(new THREE.BoxGeometry(.78, .44, .02),
      new THREE.MeshBasicMaterial({ map: screenTex(di), toneMapped: false }));
    scr.position.set(0, 1.17, -.18); g2.add(scr);
    var kb = new THREE.Mesh(new THREE.BoxGeometry(.66, .03, .22), solid('#e7e9ec'));
    kb.position.set(0, .83, .23); g2.add(kb);
    var mug = new THREE.Mesh(new THREE.CylinderGeometry(.07, .06, .14, 10), solid('#f0ece2'));
    mug.position.set(-.62, .88, -.2); g2.add(mug);
    var lampArm = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .4, 6), solid('#5b6472'));
    lampArm.position.set(-.72, 1.03, -.24); lampArm.rotation.z = .5; g2.add(lampArm);
    var lampHead = new THREE.Mesh(new THREE.ConeGeometry(.13, .15, 10),
      solid('#f0c777', { emissive: '#ffd98a', emissiveIntensity: .65 }));
    lampHead.position.set(-.84, 1.23, -.24); lampHead.rotation.x = Math.PI; g2.add(lampHead);
    // cable grommet/cap
    var grom = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .012, 10), solid('#5d6b7d', { metalness: .35, roughness: .4 }));
    grom.position.set(.55, .81, .08); g2.add(grom);
    if (di % 4 === 0) miniDeskPlant(g2, .62, -.22);
    deskDetails(g2, di);
    g2.position.set(x, 0, z); g2.rotation.y = rot || 0; addO(g2);
  }
  function paintScreen(q, S, idx, step) {
    var accent = ['#5fd6ff', '#79e0b2', '#ffd27d', '#ff9fc4'][idx % 4];
    var g = q.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, '#2a6f9e'); g.addColorStop(.55, '#1b4e7c'); g.addColorStop(1, '#102c4a');
    q.fillStyle = g; q.fillRect(0, 0, S, S);
    q.fillStyle = 'rgba(8,20,38,.55)'; q.fillRect(0, 0, S, 34);
    q.fillStyle = accent; q.fillRect(0, 0, S, 4);
    q.fillStyle = 'rgba(255,255,255,.88)'; q.font = 'bold 13px sans-serif';
    q.fillText('CHEEBEE OS', 14, 23);
    q.fillStyle = 'rgba(255,255,255,.45)'; q.fillText('live', S - 34, 23);
    // BIG readable CYBEE brand on every desk monitor
    q.fillStyle = 'rgba(6,16,32,.72)'; q.fillRect(46, 38, S - 52, S - 42);
    q.save();
    q.textAlign = 'center'; q.textBaseline = 'middle';
    q.font = 'bold ' + Math.round(S * .40) + 'px Arial Black, Arial, sans-serif';
    q.shadowColor = accent; q.shadowBlur = S * .09;
    q.fillStyle = accent; q.fillText('CYBEE', S / 2, S * .46, S * .86);
    q.shadowBlur = 0;
    q.fillStyle = 'rgba(255,255,255,.95)';
    q.font = 'bold ' + Math.round(S * .095) + 'px Arial';
    q.fillText('AI OFFICE  ·  LIVE', S / 2, S * .68, S * .8);
    q.restore();
    q.fillStyle = 'rgba(8,20,38,.42)'; q.fillRect(0, 34, 42, S - 34);
    for (var n = 0; n < 5; n++) {
      q.fillStyle = n === (idx + step) % 5 ? accent : 'rgba(255,255,255,.23)';
      q.fillRect(11, 50 + n * 38, 20, 20);
      q.fillStyle = 'rgba(255,255,255,.35)'; q.fillRect(7, 57 + n * 38, 28, 3);
    }
    q.fillStyle = 'rgba(255,255,255,.82)'; q.fillRect(56, 48, 90, 8); q.fillRect(56, 63, 140, 4);
    q.fillStyle = 'rgba(255,255,255,.35)'; q.fillRect(56, 76, S - 66, 1);
    for (var k = 0; k < 8; k++) {
      var hh = 18 + 46 * (.5 + .5 * Math.sin(step * .7 + k * 1.3 + idx));
      q.fillStyle = k % 3 === 0 ? accent : 'rgba(120,220,255,.55)';
      q.fillRect(58 + k * 23, 208 - hh, 15, hh);
      q.fillStyle = 'rgba(255,255,255,.18)'; q.fillRect(58 + k * 23, 210, 15, 2);
    }
    q.strokeStyle = 'rgba(255,255,255,.2)'; q.lineWidth = 1;
    q.beginPath(); q.moveTo(56, 210); q.lineTo(S - 10, 210); q.stroke();
    q.fillStyle = 'rgba(8,20,38,.45)'; q.fillRect(56, 222, S - 66, 25);
    q.fillStyle = '#79e0b2'; q.fillRect(63, 231, 7, 7);
    q.fillStyle = 'rgba(255,255,255,.7)'; q.fillRect(78, 233, 84, 4); q.fillRect(170, 233, 30, 4);
    var sy = 40 + ((step * 11 + idx * 23) % 170);
    q.fillStyle = 'rgba(255,255,255,.10)'; q.fillRect(42, sy, S - 42, 9);
    q.fillStyle = 'rgba(255,255,255,.045)'; q.fillRect(0, 0, S, S);
  }
  function screenTex(idx) {
    idx = idx || 0;
    var t = makeTex('screen-' + idx, function (q, S) { paintScreen(q, S, idx, idx); }, 1, 1);
    if (!t.userData.fxScreen) {
      t.userData.fxScreen = true;
      fx.screens.push({ t: t, q: t.userData.q, idx: idx, step: idx });
    }
    return t;
  }

  /* ---------- exterior BOT OUTPUT WALL (large hologram signboard) ---------- */
  var BOARD_NAMES = {
    drop: 'Drop Videos', edit: 'Video Editor', rvs: 'RVS Revise', seo: 'SEO Caption Bot',
    sched: 'Scheduler Bot', post: 'Posting Bot', mgr: 'Bot Manager', cos: 'Chief of Staff',
    outreach: 'Client Outreach', scraper: 'Community Scraper', social: 'Social Media Manager',
    product: 'Product Video Bot', joker: 'Office Jester', fixer: 'Office Fixer',
    hflex: 'HF Script Planner', hfstory: 'HF Storyboard Bot', hfmotion: 'HF Motion Editor',
    hfcaption: 'HF Caption & Overlay', hfrender: 'HF Render QA'
  };
  var boardState = { tex: null, q: null, W: 1024, H: 512, names: {}, timer: null, lastUpdate: '' };
  function boardShort(s, n) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }
  function paintBoard(q, W, H, payload) {
    var items = (payload && payload.items) || [];
    var names = (payload && payload.names) || {};
    var time = (payload && payload.time) || '';
    var grad = q.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0d2b4a'); grad.addColorStop(.55, '#10203d'); grad.addColorStop(1, '#1b1238');
    q.fillStyle = grad; q.fillRect(0, 0, W, H);
    q.fillStyle = 'rgba(95,214,255,.10)';
    for (var gy = 96; gy < H; gy += 46) q.fillRect(0, gy, W, 1);
    q.fillStyle = '#5fd6ff'; q.fillRect(0, 0, W, 7);
    q.fillStyle = '#a78bfa'; q.fillRect(0, 7, W, 3);
    q.textBaseline = 'middle'; q.textAlign = 'left';
    // ONE huge CYBEE sign with every office report
    q.textAlign = 'left'; q.textBaseline = 'middle';
    q.shadowColor = '#5fd6ff'; q.shadowBlur = 22;
    q.fillStyle = '#ffffff'; q.font = 'bold 86px Arial Black, Arial, sans-serif';
    q.fillText('CYBEE', 42, 62, 520);
    q.shadowBlur = 0;
    q.fillStyle = '#5fd6ff'; q.font = 'bold 22px Arial, sans-serif';
    q.fillText('OFFICE REPORTS  ·  LIVE', 46, 116, 620);
    q.textAlign = 'right'; q.fillStyle = '#79e0b2'; q.font = 'bold 20px Arial, sans-serif';
    q.fillText(time || 'CONNECTING', W - 40, 70);
    q.textAlign = 'left';
    q.fillStyle = 'rgba(255,255,255,.18)'; q.fillRect(44, 142, W - 88, 2);
    if (!items.length) {
      q.fillStyle = 'rgba(255,255,255,.62)'; q.font = '26px Arial, sans-serif';
      q.fillText('Waiting for office reports…', 48, 190, 900);
      q.fillStyle = 'rgba(255,255,255,.34)'; q.font = '18px Arial, sans-serif';
      q.fillText('Run an agent or the full pipeline to light up this wall.', 48, 228, 900);
    } else {
      var accent = ['#5fd6ff', '#79e0b2', '#ffd27d', '#ff9fc4', '#a78bfa'];
      items.slice(0, 10).forEach(function (it, i) {
        var y = 168 + i * 34;
        q.fillStyle = 'rgba(8,16,34,.68)'; q.fillRect(44, y - 14, W - 88, 30);
        q.fillStyle = accent[i % accent.length]; q.fillRect(44, y - 14, 6, 30);
        q.fillStyle = '#ffffff'; q.font = 'bold 17px Arial, sans-serif';
        q.fillText(names[it.id] || it.name || it.id, 62, y, 230);
        q.fillStyle = 'rgba(255,255,255,.78)'; q.font = '16px Arial, sans-serif';
        q.fillText(boardShort(it.text, 100), 300, y, W - 360);
      });
    }
    q.fillStyle = 'rgba(255,255,255,.28)'; q.font = '16px Arial, sans-serif';
    q.fillText('AUTO-REFRESH · 45s', 46, H - 26);
  }
  function refreshBoard() {
    if (!boardState.tex || document.hidden) return;
    fetch('/api/state', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var outputs = (j && j.outputs) || {};
        var items = Object.keys(outputs).filter(function (id) { return outputs[id]; }).sort().slice(0, 7).map(function (id) {
          return { id: id, name: BOARD_NAMES[id] || boardState.names[id] || id, text: boardShort(outputs[id], 120) };
        });
        // Include recent office activity so every report is on the one big sign
        var acts=(j && j.activity || []).slice(0,6).map(function(a){
          return { id:'ACT', name:'OFFICE', text:boardShort((a.who||'')+': '+(a.text||''),120) };
        });
        items=items.concat(acts).slice(0,10);
        var stamp = new Date().toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' });
        paintBoard(boardState.q, boardState.W, boardState.H, { items: items, names: boardState.names, time: stamp });
        boardState.tex.needsUpdate = true;
        boardState.lastUpdate = new Date().toISOString();
      })
      .catch(function () {
        paintBoard(boardState.q, boardState.W, boardState.H, { items: [], time: 'OFFLINE · RETRY' });
        boardState.tex.needsUpdate = true;
      });
  }
  function botOutputBoard() {
    if (boardState.timer) { clearInterval(boardState.timer); boardState.timer = null; }
    var W = 1024, H = 512;
    var tex = makeBoardTex('bot-output-board-' + Date.now(), W, H);
    boardState.tex = tex; boardState.q = tex.userData.q; boardState.W = W; boardState.H = H;
    boardState.names = {}; boardState.lastUpdate = '';
    paintBoard(boardState.q, W, H, { items: [], time: 'CONNECTING' });
    var grp = new THREE.Group();
    var frame = new THREE.Mesh(new THREE.BoxGeometry(11.7, 5.3, .24),
      solid('#0b1424', { emissive: '#0a2340', emissiveIntensity: .35 }));
    frame.position.set(0, 5.55, 0); grp.add(frame);
    var scr = new THREE.Mesh(new THREE.BoxGeometry(11.2, 4.8, .04),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .97, toneMapped: false }));
    scr.position.set(0, 5.55, .15); grp.add(scr);
    function edge(w, h, x, y, color) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .14),
        solid(color, { emissive: color, emissiveIntensity: .6 }));
      m.position.set(x, y, .16); grp.add(m);
    }
    edge(11.7, .09, 0, 8.22, '#5fd6ff');
    edge(11.7, .09, 0, 2.88, '#5fd6ff');
    edge(.09, 5.3, -5.85, 5.55, '#a78bfa');
    edge(.09, 5.3, 5.85, 5.55, '#a78bfa');
    [-5.2, 5.2].forEach(function (px) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 2.9, 12), solid('#4b586b'));
      post.position.set(px, 1.45, 0); grp.add(post);
      var foot = new THREE.Mesh(new THREE.BoxGeometry(1.1, .14, .8), solid('#2e3a4d'));
      foot.position.set(px, .07, 0); grp.add(foot);
    });
    grp.position.set(23, 0, 66); grp.rotation.y = 0; grp.scale.setScalar(1.55); addO(grp);
    reflection(23, 66, 9.5, 2.1, '#5fd6ff', 0, .09);
    fetch('/api/agents', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      ((j && j.agents) || []).forEach(function (a) {
        if (a && a.id) boardState.names[a.id] = a.n || a.name || a.id;
      });
      refreshBoard();
    }).catch(refreshBoard);
    boardState.timer = setInterval(refreshBoard, 45000);
  }
  function bench(cx, cz) {
    planeAt(8.4, 4.3, solid('#ffffff', { map: carpetTex('#6f8f8b', '#3f6662', 4, 2), roughness: .95, metalness: 0 }), cx, .008, cz);
    [-1.35, 1.35].forEach(function (dz, i) {
      [-2.4, 0, 2.4].forEach(function (dx) {
        desk(cx + dx, cz + dz, i ? Math.PI : 0);
        officeChair(cx + dx, cz + (i ? dz - 1.25 : dz + 1.25), i ? 0 : Math.PI);
      });
    });
    box(7.9, .46, .1, solid('#3f6f69', { map: fabricTex('#3f6f69', 4, 1), roughness: .95 }), cx, .95, cz);
    box(8, .06, .16, '#2e3a4d', cx, .72, cz);
    // soft end-cap greenery
    box(.22, .14, .22, '#d9c39a', cx - 3.85, .81, cz);
    var benchLeaf = new THREE.Mesh(new THREE.SphereGeometry(.14, 7, 6), solid('#5ca86b', { roughness: .9 }));
    benchLeaf.position.set(cx - 3.85, .95, cz); benchLeaf.userData.v9 = true; addO(benchLeaf);
  }
  function meetingTable(x, z, w) {
    shadow(x, z, w / 2 + .5, 1.25, .17);
    box(w, .13, 1.8, solid('#9a6d40', { map: woodTex('#9a6d40', '#6d4a29', 3, 1), roughness: .45 }), x, .79, z);
    // edge band and cable ports
    box(w + .02, .02, 1.82, '#6d4a29', x, .86, z);
    [-w * 0.22, w * 0.22].forEach(function (ox) {
      cyl(.05, .015, '#4b586b', x + ox, .862, z);
      cyl(.032, .016, '#2f394b', x + ox, .863, z);
    });
    [-w / 2 + .5, w / 2 - .5].forEach(function (px) {
      box(.16, .72, 1.2, '#4b586b', x + px, .38, z);
    });
    var n = Math.max(2, Math.round(w / 1.3));
    for (var i = 0; i < n; i++) {
      var px = x - w / 2 + .7 + i * ((w - 1.4) / (n - 1 || 1));
      officeChair(px, z - 1.45, 0, '#35455c'); officeChair(px, z + 1.45, Math.PI, '#35455c');
    }
    tableCenterpiece(x, z);
    reflection(x, z, w * .8, 1.5, '#ffe6bd', 0, .045);
  }
  function roundTable(x, z) {
    shadow(x, z, 1.2, 1.2, .15);
    cyl(.9, .1, '#a9793f', x, .77, z);
    cyl(.11, .72, '#4b586b', x, .38, z);
    cyl(.09, .08, '#d9c39a', x, .86, z);
    var bloom = new THREE.Mesh(new THREE.SphereGeometry(.08, 7, 6), solid('#ff9fc4', { roughness: .7 }));
    bloom.position.set(x, .93, z); addO(bloom);
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2;
      officeChair(x + Math.cos(a) * 1.5, z + Math.sin(a) * 1.5, a + Math.PI / 2, '#4b6a86');
    }
  }
  function serverRack(x, z) {
    shadow(x, z, .6, .5, .14);
    box(.9, 2.3, .76, solid('#2c3648', { metalness: .55, roughness: .35 }), x, 1.15, z);
    box(.78, 2.14, .02, '#1b2433', x, 1.15, z + .39);
    for (var i = 0; i < 7; i++) {
      var led = bx(.5, .055, .02, i % 2 ? '#5fd0a0' : '#69b6e8', x, .42 + i * .27, z + .405, true);
      animParts.push({ m: led, k: 'led', p: i * .7 + x });
      box(.62, .012, .02, '#4b5a70', x, .53 + i * .27, z + .405);
    }
    // subtle cable bundle
    cyl(.04, .18, '#2f3d52', x - .22, .09, z + .46);
    cyl(.03, .14, '#4a7fb0', x - .12, .07, z + .48);
    var scan = new THREE.Mesh(new THREE.PlaneGeometry(.64, .055),
      new THREE.MeshBasicMaterial({ color: '#9aeaff', transparent: true, opacity: .34,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    scan.position.set(x, 1.1, z + .42); scan.renderOrder = 3; addO(scan);
    fx.scan.push({ m: scan, x: x, p: x });
  }
  function cabinet(x, z, col) {
    shadow(x, z, .72, .42, .13);
    box(1.2, 1.95, .55, col || '#6e7c8f', x, .98, z);
    [-.42, .42].forEach(function (oy) {
      box(1.04, .82, .025, '#8492a5', x, 1.35 + oy, z + .29);
      box(.06, .16, .03, '#dbe2ea', x + .4, 1.35 + oy, z + .31);
      box(.18, .03, .02, '#d6dde6', x - .25, 1.35 + oy, z + .31);
    });
  }
  function printer(x, z) {
    shadow(x, z, .62, .48, .13);
    box(1.0, .82, .72, '#d5dbe1', x, .41, z);
    box(.9, .15, .64, '#3b475b', x, .9, z);
    box(.74, .025, .48, '#f4f5f7', x, 1.0, z + .06);
    bx(.3, .04, .02, '#6cc2f0', x + .22, .95, z + .37, true);
    // output paper stack
    box(.42, .06, .28, '#f7f8fa', x - .12, 1.03, z + .18);
    box(.38, .01, .24, '#e8ecf1', x - .12, 1.065, z + .16);
  }
  function waterCooler(x, z) {
    shadow(x, z, .35, .3, .12);
    box(.5, 1.0, .44, '#e4eaf0', x, .5, z);
    var bottle = new THREE.Mesh(new THREE.CylinderGeometry(.21, .21, .4, 14),
      solid('#79c9e8', { transparent: true, opacity: .58, roughness: .18, metalness: .05 }));
    bottle.position.set(x, 1.2, z); addO(bottle);
    cyl(.22, .035, '#c8d8e4', x, 1.41, z);
    box(.24, .06, .2, '#5d6b7d', x, .82, z + .24);
    // cup holder/stack
    box(.18, .16, .14, '#d9e2ea', x + .28, .38, z + .16);
    for (var c = 0; c < 3; c++) cyl(.055, .03, '#f4f6f8', x + .28, .48 + c * .03, z + .16);
    var bm = new THREE.MeshBasicMaterial({ color: '#eaffff', transparent: true, opacity: .5,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    for (var i = 0; i < 7; i++) {
      var r = .045 + (i % 3) * .018;
      var b = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 5), bm.clone());
      var a = i * 2.4;
      b.position.set(x + Math.cos(a) * .09, 1.04 + (i % 4) * .08, z + Math.sin(a) * .09);
      b.renderOrder = 3; addO(b);
      fx.bubbles.push({ m: b, x0: b.position.x, z0: b.position.z, base: 1.02 + (i % 4) * .08, p: i * 1.7, sp: .35 + (i % 3) * .12 });
    }
  }
  function fruitBowl(x, z) {
    cyl(.32, .085, '#e2cfaa', x, .955, z);
    cyl(.28, .02, '#f4e6c8', x, .995, z);
    [[-.12, .02, '#d95f55'], [.1, .06, '#f0b63c'], [0, -.12, '#6fbe63'], [.13, -.09, '#e07a4a'], [-.02, .08, '#8ccf6a']].forEach(function (p) {
      var f = new THREE.Mesh(new THREE.SphereGeometry(.072, 8, 6), solid(p[2], { roughness: .55 }));
      f.position.set(x + p[0], 1.04, z + p[1]); addO(f);
    });
  }
  function wallBoard(x, y, z, title) {
    box(2.6, 1.45, .08, '#2f3d52', x, y, z);
    box(2.42, 1.28, .02, '#f4f6f8', x, y, z + .05);
    box(2.42, .1, .03, '#3f9d9a', x, y + .62, z + .06);
    if (title) wallSign(title, 'TEAM NOTES & IDEAS', x, y + 1.15, z + .08, 2.3, .58, 0, '#3f9d9a');
    [-.7, .1, .75].forEach(function (px, i) {
      box(.62, .035, .02, ['#c94f4f', '#4a7fb0', '#3f9d6a'][i], x + px, y + .15 - i * .28, z + .07);
    });
    [[-.25, .42, '#ffe08a'], [.05, .36, '#ff9fc4'], [.32, .45, '#b7f0a1']].forEach(function (n) {
      box(.18, .18, .012, n[2], x + n[0], y + n[1], z + .07);
    });
    box(.22, .02, .08, '#5d6b7d', x + .82, y - .58, z + .08);
    cyl(.015, .18, '#2f3d52', x + .78, y - .56, z + .12);
  }
  function clock(x, y, z) {
    var c = cyl(.28, .07, '#f4f6f8', x, y, z); c.rotation.x = Math.PI / 2;
    cyl(.29, .035, '#2f3d52', x, y, z - .02).rotation.x = Math.PI / 2;
    box(.025, .19, .02, '#2f3d52', x, y + .09, z + .05);
    box(.14, .025, .02, '#2f3d52', x + .06, y, z + .05);
    [[0, .22], [.22, 0], [0, -.22], [-.22, 0]].forEach(function (p) {
      box(.018, .05, .015, '#2f3d52', x + p[0], y + p[1], z + .045);
    });
  }
  function coatRack(x, z) {
    cyl(.035, 1.75, '#3d495c', x, .88, z);
    cyl(.28, .05, '#3d495c', x, .04, z);
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2;
      box(.2, .12, .34, ['#4a7fb0', '#3f9d6a', '#b07b3d', '#8f6fd8'][i],
        x + Math.cos(a) * .22, 1.5, z + Math.sin(a) * .22);
    }
    // umbrella/cane detail
    cyl(.02, .95, '#2f3d52', x + .12, .48, z - .08);
    cyl(.11, .03, '#5f7fa8', x + .12, .96, z - .08);
  }

  /* ---------- exterior context so the camera never sees empty gray ---------- */
  function skyline() {
    var heights = [10, 15, 12, 20, 13, 18, 9, 16, 22, 14, 19, 11];
    for (var i = 0; i < heights.length; i++) {
      var x = -22 + i * 7.4, h = heights[i], d = 4 + (i % 3);
      box(5.6, h, d, solid(i % 2 ? '#5d6b84' : '#68778f', { roughness: .9 }), x, h / 2, -15);
      box(.14, h - .2, d + .04, '#4d5a71', x - 2.82, h / 2, -15);
      box(5.8, .16, d + .2, '#9aa6b8', x, h + .08, -15);
      if (i % 2 === 0) box(.95, .5, .95, '#6e7b90', x + .9, h + .36, -15);
      if (i % 3 === 0) {
        cyl(.035, 1.4, '#8b97a5', x - 1.2, h + .9, -15);
        var beacon = bx(.13, .13, .13, '#ff6b6b', x - 1.2, h + 1.66, -15, true);
        animParts.push({ m: beacon, k: 'led', p: i * 1.7 });
      }
      for (var wy = 2; wy < h - 1; wy += 1.8) {
        for (var wx = -1.8; wx <= 1.8; wx += 1.5) {
          var lit = (Math.round(wy * 10) + Math.round(wx * 10) + i * 3) % 4 !== 0;
          var win = bx(.52, .36, .03, lit ? '#ffd89a' : '#cfe0ee', x + wx, wy, -15 + d / 2 + .02, true);
          if ((Math.round(wy * 10) + Math.round(wx * 10) + i * 3) % 5 === 0) {
            fx.windows.push({ m: win, p: i + wx + wy });
          }
        }
      }
    }
    billboard();
  }
  function skyBackdrop() {
    var cv = document.createElement('canvas'); cv.width = 1536; cv.height = 768;
    var q = cv.getContext('2d');
    var g = q.createLinearGradient(0, 0, 0, 768);
    g.addColorStop(0, '#3569a8'); g.addColorStop(.35, '#6f9fce');
    g.addColorStop(.68, '#b9d6ea'); g.addColorStop(1, '#f4e2c8');
    q.fillStyle = g; q.fillRect(0, 0, 1536, 768);
    var sx = 380, sy = 210;
    var sg = q.createRadialGradient(sx, sy, 4, sx, sy, 300);
    sg.addColorStop(0, 'rgba(255,250,225,1)');
    sg.addColorStop(.10, 'rgba(255,235,185,.72)');
    sg.addColorStop(.36, 'rgba(255,220,160,.2)');
    sg.addColorStop(1, 'rgba(255,220,160,0)');
    q.fillStyle = sg; q.fillRect(0, 0, 1536, 768);
    q.fillStyle = 'rgba(255,252,235,.9)'; q.beginPath(); q.arc(sx, sy, 26, 0, 6.3); q.fill();
    var r = rnd(91);
    for (var layer = 0; layer < 3; layer++) {
      for (var i = 0; i < 15; i++) {
        var cx = r() * 1536, cy = 100 + layer * 155 + r() * 85;
        var rw = 70 + r() * 150, rh = 15 + r() * 30;
        var cg = q.createRadialGradient(cx, cy, 2, cx, cy, rw);
        cg.addColorStop(0, 'rgba(255,255,255,' + (.38 - layer * .07 + r() * .14).toFixed(2) + ')');
        cg.addColorStop(1, 'rgba(255,255,255,0)');
        q.save(); q.translate(cx, cy); q.scale(1, rh / rw); q.translate(-cx, -cy);
        q.fillStyle = cg; q.beginPath(); q.arc(cx, cy, rw, 0, 6.3); q.fill(); q.restore();
      }
    }
    var hg = q.createLinearGradient(0, 620, 0, 768);
    hg.addColorStop(0, 'rgba(255,240,215,0)');
    hg.addColorStop(1, 'rgba(255,238,210,.45)');
    q.fillStyle = hg; q.fillRect(0, 620, 1536, 148);
    var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
    var m = new THREE.Mesh(new THREE.PlaneGeometry(260, 110),
      new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, depthWrite: false, fog: false, toneMapped: false }));
    m.position.set(23, 30, -34); addO(m);
    fx.sky = fx.sky || {}; fx.sky.m = m;
  }
  function exterior() {
    floor(80, 16, solid('#ffffff', { map: stoneTex(10, 2), roughness: .95, metalness: 0 }), 23, .004, 41);
    floor(80, 6, solid('#3a4352', { roughness: .95 }), 23, .002, 49);
    for (var i = -8; i <= 16; i++) box(2.2, .02, .11, '#c8cdd4', i * 3, .014, 49);
    car(-6, 48.9, 1, '#4a7fb0'); car(38, 49.1, -1, '#c94f5f');
    [-2, 14, 30, 46].forEach(function (x) {
      box(3.4, .5, 1.3, '#8b9bab', x, .25, 36.6);
      box(3.1, .12, 1.05, '#5c6d7e', x, .56, 36.6);
      tree(x - 1.1, 37.2, .72); tree(x + 1.1, 37.2, .72);
    });
    [7, 23, 39].forEach(function (x) {
      shadow(x, 46.2, 1.35, .7, .18);
      box(2.5, .42, 1.15, solid('#c94f5f', { metalness: .4, roughness: .4 }), x, .36, 46.2);
      box(1.25, .38, 1.0, solid('#263449', { metalness: .4 }), x - .15, .72, 46.2);
      box(.08, .16, .9, '#f6e6b0', x + 1.26, .42, 46.2, true);
      box(.08, .16, .9, '#e2694f', x - 1.26, .42, 46.2, true);
    });
    // Lush entrance landscaping: planters, flowers and edging along the south plaza.
    [[-6, 37.8], [2, 37.8], [18, 37.8], [28, 37.8], [44, 37.8], [52, 37.8]].forEach(function (p, i) {
      box(1.4, .18, .5, '#8b97a5', p[0], .09, p[1]);
      for (var f = 0; f < 4; f++) {
        var fm = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 5),
          solid(['#ffd27d', '#ff9fc4', '#fff1a8', '#f7b3ff'][(i + f) % 4], { roughness: .75 }));
        fm.position.set(p[0] - .45 + f * .3, .22, p[1]); addO(fm);
      }
    });
    [[-4, 42.5], [12, 42.5], [34, 42.5], [50, 42.5]].forEach(function (p) { plant(p[0], p[1], .85); });
  }
  function parkedTaxi(x, z) {
    shadow(x, z, 1.3, .62, .13);
    var g2 = new THREE.Group();
    var yellow = solid('#e0a83a', { metalness: .45, roughness: .35 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.3, .4, 1.05), yellow);
    body.position.y = .38; body.userData.v9 = true; g2.add(body);
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.15, .35, .86),
      solid('#b9d7ea', { transparent: true, opacity: .7, metalness: .2 }));
    cabin.position.set(-.1, .76, 0); cabin.userData.v9 = true; g2.add(cabin);
    [-.5, .5].forEach(function (dz) {
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(2.32, .08, .1), solid('#2f394b'));
      stripe.position.set(0, .47, dz); stripe.userData.v9 = true; g2.add(stripe);
    });
    var top = new THREE.Mesh(new THREE.BoxGeometry(.55, .16, .3),
      solid('#5fd6ff', { emissive: '#5fd6ff', emissiveIntensity: .9 }));
    top.position.set(-.1, 1.0, 0); top.userData.v9 = true; g2.add(top);
    [-.68, .68].forEach(function (dx) {
      [-.5, .5].forEach(function (dz) {
        var w = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .1, 12), solid('#1b2029'));
        w.rotation.x = Math.PI / 2; w.position.set(dx, .21, dz); w.userData.v9 = true; g2.add(w);
        var hub = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .11, 10), solid('#9aa5b3', { metalness: .6 }));
        hub.rotation.x = Math.PI / 2; hub.position.set(dx, .21, dz); hub.userData.v9 = true; g2.add(hub);
      });
    });
    g2.position.set(x, 0, z); addO(g2);
  }
  function entranceBillboard() {
    var cv = document.createElement('canvas'); cv.width = 1024; cv.height = 384;
    var q = cv.getContext('2d');
    var g = q.createLinearGradient(0, 0, 1024, 384);
    g.addColorStop(0, '#10365f'); g.addColorStop(.5, '#2f6f9e'); g.addColorStop(1, '#3f9d9a');
    q.fillStyle = g; q.fillRect(0, 0, 1024, 384);
    q.fillStyle = 'rgba(255,255,255,.07)';
    for (var i = 0; i < 9; i++) q.fillRect(i * 130, 0, 54, 384);
    q.fillStyle = '#ffe6a8'; q.font = 'bold 78px sans-serif'; q.textAlign = 'center';
    q.fillText('CYBORG CHEEBEE HQ', 512, 160);
    q.fillStyle = '#ffffff'; q.font = '40px sans-serif';
    q.fillText('WELCOME · DROP-OFF · OPEN 24/7', 512, 242);
    var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
    box(10.4, 3.9, .16, '#2e3a4d', 23, 7.4, 54.6);
    box(.18, 5.6, .18, '#4a5668', 18, 2.8, 54.6);
    box(.18, 5.6, .18, '#4a5668', 28, 2.8, 54.6);
    var m = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.5),
      new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(23, 7.4, 54.48); m.rotation.y = Math.PI; m.userData.v9 = true; addO(m);
  }
  /* ---------- ARYASKY road detailing helpers (static + batch-friendly) ---------- */
  function roadStuds(x0, x1, z, step, color) {
    // Reflective cat's-eye studs. Tiny boxes so batchStaticDetails() merges them.
    step = step || 4;
    for (var x = x0; x <= x1; x += step) {
      box(.14, .025, .1, '#dfe7ec', x, .028, z);
      box(.07, .01, .045, color || '#f6d98a', x, .046, z);
    }
  }
  function centerLine(x0, x1, z, dashed) {
    // Double solid-yellow centre line; the inner dashes guide traffic.
    [-.12, .12].forEach(function (dz) { box(x1 - x0, .014, .06, '#e8d9a0', (x0 + x1) / 2, .021, z + dz, true); });
    if (dashed) for (var x = x0; x <= x1; x += 4) box(2.1, .014, .05, '#f2e4bd', x, .023, z, true);
  }
  function stopBar(x, z, w) {
    // Thick white stop bar spanning the lanes, painted before a zebra crossing.
    box(.24, .016, w || 2.8, '#eef2f4', x, .021, z);
  }
  function bikeGlyph(x, z) {
    // Bicycle symbol painted on the green lane — clear from the Tycoon view.
    [-.24, .24].forEach(function (dx) {
      var wh = new THREE.Mesh(new THREE.TorusGeometry(.13, .02, 6, 12), solid('#eef2f4', { roughness: .9 }));
      wh.rotation.x = Math.PI / 2; wh.position.set(x + dx, .026, z); wh.userData.v9 = true; addO(wh);
    });
    [.42, -.42].forEach(function (a) {
      var fr = new THREE.Mesh(new THREE.BoxGeometry(.5, .016, .035), solid('#eef2f4', { roughness: .9 }));
      fr.position.set(x, .026, z); fr.rotation.y = a; fr.userData.v9 = true; addO(fr);
    });
  }
  function refugeIsland(x, z, w) {
    // Raised pedestrian refuge: striped amber curbs + a lit bollard.
    var ww = w || 1.2;
    floor(ww, 1.7, solid('#ffffff', { map: stoneTex(2, 1), roughness: .95 }), x, .022, z);
    box(ww + .14, .1, 1.84, '#c9cfd6', x, .06, z);
    for (var i = -2; i <= 2; i++) box(.1, .012, .62, '#e0b34a', x + i * (ww / 5), .117, z);
    cyl(.07, .66, '#8b97a5', x, .43, z);
    cyl(.09, .08, '#3f9d9a', x, .8, z, true);
  }
  function roadText(x, z, text, w, d, rot) {
    // Flat painted road legend — no occlusion, reads beautifully top-down.
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    var q = cv.getContext('2d');
    q.clearRect(0, 0, 512, 128);
    q.fillStyle = 'rgba(238,242,244,.88)'; q.font = 'bold 76px sans-serif';
    q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(text, 256, 68);
    var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w || 5, d || 1.25),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot || 0;
    m.position.set(x, .026, z); m.userData.v9 = true; addO(m);
  }
  function entranceRoad() {
    // Super-detailed street directly outside the south entrance (z ~ 46..52).
    floor(70, 11.6, solid('#ffffff', { map: stoneTex(14, 1), roughness: .95 }), 23, .004, 40.2);
    floor(70, 6.8, solid('#ffffff', { map: asphaltTex(16, 2), roughness: .96, metalness: .02 }), 23, .003, 49);
    floor(70, 2.8, solid('#ffffff', { map: stoneTex(14, 1), roughness: .95 }), 23, .004, 53.7);
    // curbs + bike lane + edge lines
    box(70, .14, .18, '#b9c1c9', 23, .07, 45.55);
    box(70, .14, .18, '#b9c1c9', 23, .07, 52.45);
    floor(70, .9, solid('#4a7f6e', { roughness: .95 }), 23, .008, 46.6);
    for (var bxd = -8; bxd <= 58; bxd += 3) box(1.3, .012, .07, '#eef2f4', bxd, .014, 46.9);
    box(70, .012, .09, '#d4dbe0', 23, .014, 47.1);
    box(70, .012, .09, '#d4dbe0', 23, .014, 51.9);
    centerLine(-8, 58, 49.3, true); // ARYASKY: double-yellow with dashed guide
    roadStuds(-8, 58, 47.4, 4, '#f6d98a'); // amber near lane
    roadStuds(-8, 58, 51.2, 4, '#e8624f'); // red far lane
    // Zebra crossings right in front of the entrance and the side gate.
    [8, 23].forEach(function (cx) {
      for (var z = 46.1; z <= 51.9; z += .72) box(2.4, .015, .34, '#eef2f4', cx, .017, z);
      stopBar(cx - 1.9, 48.1, 2.8); // stop line for the near (+x) lane
      stopBar(cx + 1.9, 50.7, 2.8); // stop line for the far (-x) lane
    });
    // ARYASKY: bicycle symbols on the green lane + centre refuges + road legend.
    [0, 12, 26, 40, 52].forEach(function (bx2) { bikeGlyph(bx2, 46.6); });
    refugeIsland(15.5, 49.3, 1.2);
    refugeIsland(30.5, 49.3, 1.2);
    roadText(41, 49.3, 'CYBORG AVE →', 7, 1.5);
    [2, 17, 32].forEach(function (ax) { roadArrow(ax, 48.3, 1); });
    // Taxi / drop-off hatching along the entrance curb.
    for (var hx = -2; hx <= 34; hx += 2.2) {
      var hatch = box(1.2, .012, .5, '#e0b34a', hx, .018, 45.95);
      hatch.rotation.y = -.5;
    }
    // tactile paving, drains, manholes, wet reflections
    floor(70, .42, solid('#ffffff', { map: tactileTex(), roughness: .95 }), 23, .012, 45.25);
    floor(70, .42, solid('#ffffff', { map: tactileTex(), roughness: .95 }), 23, .012, 52.75);
    for (var gx = -4; gx <= 52; gx += 7) {
      box(.62, .022, .3, '#39414c', gx, .019, 45.68);
      for (var sl = -1; sl <= 1; sl++) box(.04, .006, .26, '#78828f', gx + sl * .16, .03, 45.68);
    }
    [4, 19, 34].forEach(function (mx) {
      cyl(.3, .03, '#59616c', mx, .018, 49.4);
      cyl(.22, .032, '#707a86', mx, .02, 49.4);
    });
    [6, 20, 32].forEach(function (px) { reflection(px, 50.7, 2.2, .8, '#bcd9ec', 0, .06); });
    // bollards, parking meters, bike racks
    for (var bxi = -2; bxi <= 34; bxi += 3.5) cyl(.07, .5, '#8b97a5', bxi, .25, 45.15);
    [4, 16, 28].forEach(function (mx) {
      cyl(.06, .8, '#5d6b7d', mx, .4, 45.15);
      box(.18, .24, .12, '#3f9d9a', mx, .86, 45.15, true);
    });
    [12, 18].forEach(function (rx) {
      [-.4, .4].forEach(function (dz) { cyl(.04, .5, '#8b97a5', rx, .25, 44.4 + dz); });
      box(.9, .04, .04, '#9aa6b3', rx, .5, 44.4);
    });
    // entrance canopy, lit edge and hanging sign
    box(13, .14, 2.6, solid('#2e3a4d', { metalness: .4 }), 23, 3.25, 35.3);
    box(12.4, .05, .1, '#5fd6ff', 23, 3.15, 36.55, true);
    [17, 29].forEach(function (px) {
      cyl(.1, 3.1, '#4a5668', px, 1.55, 36.4);
      box(.4, .1, .4, '#2e3a4d', px, 3.12, 36.4);
    });
    wallSign('ENTRANCE', 'DROP-OFF · TAXI · VISITORS', 23, 2.85, 36.62, 4.6, 1.0, Math.PI, '#3f9d9a');
    bx(4.2, .03, .05, '#6bb3a6', 23, 2.38, 36.56, true);
    // street furniture and greenery
    [6, 18, 30].forEach(function (px) {
      box(2.0, .4, 1.0, '#8b5e34', px, .2, 35.6);
      plant(px - .6, 35.55, .72); plant(px, 35.65, .66); plant(px + .6, 35.55, .72);
    });
    [-2, 10, 22, 34].forEach(function (lx) {
      streetLamp(lx, 44.9, 48.6);
      streetLamp(lx, 53.2, 49.5);
    });
    trafficLight(9, 45.4); trafficLight(29, 45.4);
    busStop(32, 44.3);
    roadSign(6, 45.1, 'ENTER', '#3f9d9a');
    roadSign(26, 45.1, 'EXIT', '#b08a3d');
    fence(-4, 16, 54.9); fence(20, 34, 54.9);
    entranceBillboard();
    // moving traffic + a row of parked taxis
    car(-8, 48.1, 1, '#c94f5f'); car(6, 48.1, 1, '#4a7fb0'); car(20, 48.1, 1, '#e0a83a');
    car(-2, 50.7, -1, '#3f9d6a'); bus(14, 50.7, -1); car(30, 50.7, -1, '#8f6fd8');
    [4, 16, 28].forEach(function (tx) { parkedTaxi(tx, 45.8); });
    // people using the entrance and the far sidewalk
    pedestrian(2, 44.2, 1, '#c94f4f');
    pedestrian(18, 44.2, -1, '#4a7fb0');
    pedestrian(31, 44.2, 1, '#3f9d6a');
    pedestrian(8, 54.2, -1, '#e0a83a');
    pedestrian(24, 54.2, 1, '#8f6fd8');
    // Greenery along the far south sidewalk and approach edges.
    [[-10, 54.6], [0, 54.6], [10, 54.6], [30, 54.6], [44, 54.6], [56, 54.6]].forEach(function (p, i) {
      tree(p[0], p[1], .72 + (i % 2) * .12);
    });
    [[-4, 53.2], [6, 53.2], [16, 53.2], [30, 53.2], [42, 53.2], [54, 53.2]].forEach(function (p, i) {
      for (var f = 0; f < 3; f++) {
        var fb = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 5),
          solid(['#ffd27d', '#ff9fc4', '#7fd3a1'][(i + f) % 3], { roughness: .8 }));
        fb.position.set(p[0] - .25 + f * .25, .06, p[1]); addO(fb);
      }
    });
  }
  function pond(cx, cz, r) {
    var rim = new THREE.Mesh(new THREE.RingGeometry(r, r + .26, 28), solid('#b9c1c9', { roughness: .8 }));
    rim.rotation.x = -Math.PI / 2; rim.position.set(cx, .011, cz); addO(rim);
    var water = new THREE.Mesh(new THREE.CircleGeometry(r, 28),
      solid('#6fb2cc', { roughness: .14, metalness: .25, transparent: true, opacity: .92 }));
    water.rotation.x = -Math.PI / 2; water.position.set(cx, .013, cz); addO(water);
    reflection(cx, cz, r * 1.5, r * 1.5, '#bcd9ec', 0, .07);
    var f = new THREE.Mesh(new THREE.CylinderGeometry(.16, .28, .5, 10), solid('#9aa6b3'));
    f.position.set(cx, .26, cz); addO(f);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: '#dff4ff',
      transparent: true, opacity: .35, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false }));
    s.position.set(cx, .78, cz); s.scale.set(1.4, 1.4, 1); addO(s);
    // lily pads and edge stones
    [[-.35, .28, .18], [.32, -.22, .15], [.05, .38, .12]].forEach(function (p) {
      var pad = new THREE.Mesh(new THREE.CircleGeometry(p[2], 12), solid('#4f9a63', { roughness: .85 }));
      pad.rotation.x = -Math.PI / 2; pad.position.set(cx + p[0] * r, .016, cz + p[1] * r); addO(pad);
    });
    [[.9, .1], [-.85, -.2], [.2, -.92]].forEach(function (p) {
      var stone = new THREE.Mesh(new THREE.SphereGeometry(.09, 7, 6), solid('#aeb8c4', { roughness: .9 }));
      stone.scale.y = .55; stone.position.set(cx + p[0] * r, .02, cz + p[1] * r); addO(stone);
    });
  }
  function parkBench(x, z) {
    box(1.3, .1, .45, '#a9793f', x, .45, z);
    box(1.3, .5, .08, '#7d5634', x, .7, z - .2);
    // armrests and seat slats detail
    [-.58, .58].forEach(function (dx) {
      box(.06, .12, .38, '#6e4a2c', x + dx, .56, z);
      box(.08, .45, .08, '#4a5668', x + dx, .22, z);
    });
    [-.22, 0, .22].forEach(function (dz) { box(1.18, .015, .02, '#8b653e', x, .505, z + dz * .35); });
  }
  function umbrella(x, z, color) {
    cyl(.04, 2.2, '#4a5668', x, 1.1, z);
    var c = new THREE.Mesh(new THREE.ConeGeometry(1.1, .5, 10), solid(color, { roughness: .85 }));
    c.position.set(x, 2.2, z); addO(c);
    // finial and base weight
    var finial = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), solid('#d8c39a', { metalness: .35, roughness: .4 }));
    finial.position.set(x, 2.47, z); addO(finial);
    box(1.0, .08, 1.0, '#b9c1c9', x, .76, z);
    cyl(.08, .7, '#8b97a5', x, .38, z);
    cyl(.18, .06, '#6e7c8f', x, .05, z);
  }
  function marketStall(x, z, color) {
    box(2.4, .9, 1.2, solid('#e8e4dc'), x, .45, z);
    box(2.6, .12, 1.5, solid(color, { roughness: .8 }), x, 2.15, z);
    // canopy valance
    box(2.62, .14, .06, color, x, 2.03, z + .74);
    [-1.2, 1.2].forEach(function (dx) {
      [-.65, .65].forEach(function (dz) { cyl(.05, 2.1, '#5d6b7d', x + dx, 1.05, z + dz); });
    });
    box(1.6, .5, .06, color, x, 1.2, z + .63);
    // counter crate
    box(.42, .18, .28, '#8b5e34', x - .55, .99, z + .18);
    [[- .62, .18, '#e0a83a'], [-.48, .2, '#d95f55'], [-.55, .26, '#6fbe63']].forEach(function (f) {
      var fr = new THREE.Mesh(new THREE.SphereGeometry(.055, 7, 6), solid(f[2], { roughness: .6 }));
      fr.position.set(x + f[0], 1.11, z + f[1]); addO(fr);
    });
    var led = bx(.18, .12, .18, '#ffd98a', x, 2.0, z + .5, true);
    animParts.push({ m: led, k: 'led', p: x });
  }
  function parkedVan(x, z, color, rot) {
    shadow(x, z, 1.45, .75, .13);
    var g2 = new THREE.Group();
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.25, 1.25), solid(color, { metalness: .35, roughness: .45 }));
    body.position.y = .78; body.userData.v9 = true; g2.add(body);
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(.95, .9, 1.18),
      solid('#b9d7ea', { transparent: true, opacity: .7, metalness: .2 }));
    cabin.position.set(1.05, 1.12, 0); cabin.userData.v9 = true; g2.add(cabin);
    var stripe = new THREE.Mesh(new THREE.BoxGeometry(2.82, .12, .1), solid('#f4f6f8'));
    stripe.position.set(0, .6, .62); stripe.userData.v9 = true; g2.add(stripe);
    // lights, door line, plate
    [-.38, .38].forEach(function (dz) {
      var head = new THREE.Mesh(new THREE.BoxGeometry(.05, .12, .18), solid('#fff3c8', { emissive: '#ffd98a', emissiveIntensity: .8 }));
      head.position.set(1.42, .68, dz); head.userData.v9 = true; g2.add(head);
      var tail = new THREE.Mesh(new THREE.BoxGeometry(.05, .12, .18), solid('#e2694f', { emissive: '#e2523a', emissiveIntensity: .7 }));
      tail.position.set(-1.42, .68, dz); tail.userData.v9 = true; g2.add(tail);
    });
    box(.02, .7, .02, '#4b586b', -.15, .78, .64);
    box(.08, .03, .03, '#8b97a5', -.22, .82, .64);
    box(.03, .08, .26, '#f4f6f8', -1.41, .52, 0);
    [-.9, .9].forEach(function (dx) {
      [-.62, .62].forEach(function (dz) {
        var w = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .12, 10), solid('#1b2029'));
        w.rotation.x = Math.PI / 2; w.position.set(dx, .28, dz); w.userData.v9 = true; g2.add(w);
        var hub = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .13, 8), solid('#9aa5b3', { metalness: .55 }));
        hub.rotation.x = Math.PI / 2; hub.position.set(dx, .28, dz); hub.userData.v9 = true; g2.add(hub);
      });
    });
    g2.rotation.y = rot || Math.PI / 2; g2.position.set(x, 0, z); addO(g2);
  }
  function sideBuilding(x, z, w, h, d, color, name) {
    // ARYASKY: cohesive city block — plinth, pilasters, cornice, roof parapet,
    // framed windows, glowing storefront canopy, roof kit and a name sign.
    // The original 4D window lit-flicker registration (fx.windows) is preserved.
    box(w, h, d, solid(color, { roughness: .9 }), x, h / 2, z);
    // foundation plinth + corner pilasters give the mass real structure
    box(w + .16, .34, d + .16, '#4d5a71', x, .17, z);
    [-1, 1].forEach(function (s) {
      box(.22, h - .34, .22, '#5b6980', x + s * (w / 2 - .1), (h + .34) / 2, z + d / 2 - .1);
    });
    // cornice band + roof parapet with caps
    box(w + .28, .18, d + .28, '#8592a6', x, h - .22, z);
    box(w + .2, .16, d + .2, '#9aa6b8', x, h + .08, z);
    [-1, 1].forEach(function (s) {
      box(w + .2, .34, .14, '#77849a', x, h + .28, z + s * (d / 2));
      box(.14, .34, d + .2, '#77849a', x + s * (w / 2), h + .28, z);
    });
    box(.12, h - .2, d + .04, '#4d5a71', x - w / 2 - .06, h / 2, z);
    // rooftop kit: original AC + vent pipes + water tank + beacon antenna
    box(.7, .35, .5, '#8b97a5', x + w * .18, h + .34, z - d * .1);
    cyl(.12, .02, '#6e7c8f', x + w * .18, h + .53, z - d * .1);
    [[-.3, -.28], [.32, .3]].forEach(function (p) {
      cyl(.1, .5, '#6e7c8f', x + w * p[0], h + .3, z + d * p[1]);
      cyl(.14, .05, '#8b97a5', x + w * p[0], h + .57, z + d * p[1]);
    });
    cyl(.34, .62, '#7b8798', x - w * .26, h + .46, z - d * .2);
    cyl(.38, .07, '#9aa6b8', x - w * .26, h + .8, z - d * .2);
    cyl(.02, .9, '#9aa6b8', x + w * .34, h + .6, z - d * .32);
    cyl(.07, .06, '#e8624f', x + w * .34, h + 1.05, z - d * .32, true);
    // ground-floor storefront: steps, original door, glowing canopy, sign
    box(w * .7, .08, .5, '#9aa6b8', x - w * .12, .04, z + d / 2 + .2);
    box(.8, 1.35, .06, '#4b586b', x - w * 0.22, .68, z + d / 2 + .04);
    box(.06, .02, .02, '#d8c39a', x - w * 0.12, .72, z + d / 2 + .08);
    box(w * .82, .09, .85, '#2e3a4d', x - w * .05, 2.12, z + d / 2 + .42);
    bx(w * .82, .03, .05, '#5fd6ff', x - w * .05, 2.04, z + d / 2 + .84, true);
    [-1, 1].forEach(function (s) {
      cyl(.045, 2.1, '#8b97a5', x - w * .05 + s * w * .38, 1.05, z + d / 2 + .8);
    });
    if (name) wallSign(name, 'CYBORG CITY', x - w * .05, 2.55, z + d / 2 + .47,
      Math.min(w * .7, 2.6), .5, 0, '#3f9d9a');
    // planters flanking the entrance (use existing 4D plant sway)
    [-1, 1].forEach(function (s) {
      var px = x + s * (w / 2 - .45);
      box(.5, .32, .5, '#8b5e34', px, .16, z + d / 2 + .45);
      plant(px, z + d / 2 + .45, .42);
    });
    // framed windows — static frame/sill + original animated lit pane
    for (var wy = 1.8; wy < h - 1; wy += 1.9) {
      for (var wx = -w / 2 + 1; wx <= w / 2 - 1; wx += 1.4) {
        var lit = (Math.round(wy * 10) + Math.round(wx * 10) + Math.round(x)) % 4 !== 0;
        box(.55, .44, .02, '#3d495c', x + wx, wy, z + d / 2 + .015);
        box(.58, .04, .08, '#9aa6b8', x + wx, wy - .24, z + d / 2 + .05);
        var win = bx(.45, .34, .03, lit ? '#ffd89a' : '#cfe0ee', x + wx, wy, z + d / 2 + .04, true);
        if ((Math.round(wy) + Math.round(wx) + Math.round(x)) % 5 === 0) fx.windows.push({ m: win, p: x + wx + wy });
      }
    }
  }
  function courtTex() {
    return makeTex('court-hd', function (q, S) {
      q.fillStyle = '#a96b41'; q.fillRect(0, 0, S, S);
      var r = rnd(91);
      // individual hardwood boards with seams + long grain
      for (var x = 0; x < S; x += 22) {
        q.fillStyle = r() > .5 ? 'rgba(255,232,198,.055)' : 'rgba(60,30,12,.06)';
        q.fillRect(x, 0, 21, S);
        q.fillStyle = 'rgba(52,27,12,.28)'; q.fillRect(x + 21, 0, 1, S);
        for (var g = 0; g < 14; g++) {
          var yy = r() * S;
          q.strokeStyle = 'rgba(88,50,22,.13)'; q.lineWidth = 1;
          q.beginPath(); q.moveTo(x + 2, yy);
          q.bezierCurveTo(x + 8, yy - 7, x + 14, yy + 9, x + 20, yy); q.stroke();
        }
      }
      // faded painted key + centre circle, then fine wear/scuffs
      q.fillStyle = 'rgba(38,88,108,.13)'; q.fillRect(0, S * .34, S, S * .32);
      q.strokeStyle = 'rgba(255,248,232,.78)'; q.lineWidth = 2;
      q.beginPath(); q.arc(S / 2, S / 2, 37, 0, 6.3); q.stroke();
      q.fillStyle = 'rgba(255,248,232,.14)'; q.font = 'bold 20px sans-serif';
      q.textAlign = 'center'; q.fillText('CYBORG COURT', S / 2, S * .17);
      for (var i = 0; i < 1100; i++) {
        q.fillStyle = r() > .5 ? 'rgba(255,255,255,.045)' : 'rgba(22,10,4,.055)';
        q.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 3);
      }
    }, 1, 1);
  }
  function ballTex() {
    return makeTex('ball-pebble', function (q, S) {
      q.fillStyle = '#d46a32'; q.fillRect(0, 0, S, S);
      var r = rnd(77);
      for (var i = 0; i < 1400; i++) {
        q.fillStyle = r() > .5 ? 'rgba(255,205,150,.10)' : 'rgba(70,28,10,.12)';
        q.beginPath(); q.arc(r() * S, r() * S, .6 + r() * 1.5, 0, 6.3); q.fill();
      }
    }, 1, 1);
  }
  function jerseyTex(color, num) {
    return makeTex('jersey-' + color + '-' + num, function (q, S) {
      q.fillStyle = color; q.fillRect(0, 0, S, S);
      q.fillStyle = 'rgba(255,255,255,.10)'; q.fillRect(0, 0, 22, S);
      q.fillRect(S - 22, 0, 22, S);
      q.strokeStyle = 'rgba(255,255,255,.5)'; q.lineWidth = 7;
      q.strokeRect(5, 5, S - 10, S - 10);
      q.fillStyle = 'rgba(255,255,255,.92)'; q.font = 'bold 126px sans-serif';
      q.textAlign = 'center'; q.fillText(num, S / 2, S * .66);
    }, 1, 1);
  }
  function contrailTex() {
    return makeTex('contrail', function (q, S) {
      var g = q.createLinearGradient(0, 0, S, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(.35, 'rgba(226,241,255,.30)');
      g.addColorStop(.72, 'rgba(255,255,255,.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      q.fillStyle = g; q.fillRect(0, S * .34, S, S * .32);
    }, 1, 1);
  }
  function umbrellaTex(color) {
    return makeTex('umbrella-' + color, function (q, S) {
      q.fillStyle = color; q.fillRect(0, 0, S, S);
      q.fillStyle = 'rgba(255,255,255,.42)';
      for (var i = 0; i < S; i += 42) q.fillRect(i, 0, 21, S);
    }, 1, 1);
  }
  function miniBallBot(x, z, color, phase, rx, rz) {
    shadow(x, z, .34, .22, .17);
    var g2 = new THREE.Group();
    var skin = solid('#d3a278', { roughness: .82 });
    var jersey = solid('#ffffff', { map: jerseyTex(color, String(11 + Math.floor(phase * 3))), roughness: .86 });
    var shorts = solid('#2b3a4f', { roughness: .9 });
    var shoe = solid('#f0f2f4', { roughness: .72 });
    function part(geo, mat, px, py, pz) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz); m.userData.v9 = true; g2.add(m); return m;
    }
    part(new THREE.CylinderGeometry(.17, .22, .52, 14), jersey, 0, .88, 0);
    part(new THREE.SphereGeometry(.18, 12, 9), jersey, 0, 1.1, 0);
    part(new THREE.CylinderGeometry(.21, .19, .24, 14), shorts, 0, .62, 0);
    part(new THREE.SphereGeometry(.145, 14, 10), skin, 0, 1.36, 0);
    part(new THREE.SphereGeometry(.15, 14, 10, 0, 6.3, 0, 1.35), solid('#3a2d28'), 0, 1.4, 0);
    [-.145, .145].forEach(function (ex) { part(new THREE.SphereGeometry(.035, 8, 6), skin, ex, 1.35, 0); });
    [-.05, .05].forEach(function (ex) { part(new THREE.SphereGeometry(.017, 8, 6), solid('#1b2430'), ex, 1.38, .132); });
    var legs = [], arms = [];
    [-.1, .1].forEach(function (dx) {
      var lp = new THREE.Group(); lp.position.set(dx, .58, 0); g2.add(lp);
      var thigh = new THREE.Mesh(new THREE.CylinderGeometry(.075, .065, .3, 10), skin);
      thigh.position.y = -.15; lp.add(thigh);
      var sock = new THREE.Mesh(new THREE.CylinderGeometry(.065, .06, .16, 10), solid('#f4f6f8'));
      sock.position.y = -.38; lp.add(sock);
      var sneaker = new THREE.Mesh(new THREE.BoxGeometry(.13, .09, .22), shoe);
      sneaker.position.set(0, -.49, .05); lp.add(sneaker);
      legs.push(lp);
      var ap = new THREE.Group(); ap.position.set(dx * 1.9, 1.05, 0); g2.add(ap);
      var upper = new THREE.Mesh(new THREE.CylinderGeometry(.05, .045, .25, 9), jersey);
      upper.position.y = -.13; ap.add(upper);
      var fore = new THREE.Mesh(new THREE.CylinderGeometry(.042, .038, .24, 9), skin);
      fore.position.y = -.37; ap.add(fore);
      var hand = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), skin);
      hand.position.y = -.5; ap.add(hand);
      arms.push(ap);
    });
    g2.position.set(x, 0, z); addO(g2);
    fx.ballers.push({ g: g2, baseX: x, baseZ: z, phase: phase,
      rx: rx, rz: rz, sp: .65 + (phase % 3) * .12, legs: legs, arms: arms });
  }
  function basketballCourt(cx, cz) {
    var lineMat = solid('#f7f4e9', { transparent: true, opacity: .86, roughness: .9 });
    var frameMat = solid('#f4f6f8', { roughness: .5, metalness: .1 });
    function stripe(w, d, x, z) { return box(w, .012, d, lineMat, x, .015, z); }
    // dark apron then a sealed hardwood surface
    floor(13.6, 17.6, solid('#ffffff', { map: asphaltTex(4, 5), roughness: .96 }), cx, .004, cz);
    floor(12.4, 16.4, solid('#ffffff', { map: courtTex(), roughness: .6, metalness: .02 }), cx, .007, cz);
    stripe(12.4, .07, cx, cz - 8.2); stripe(12.4, .07, cx, cz + 8.2);
    stripe(.07, 16.4, cx - 6.2, cz); stripe(.07, 16.4, cx + 6.2, cz);
    stripe(12.4, .07, cx, cz);
    var mid = new THREE.Mesh(new THREE.RingGeometry(1.42, 1.52, 36),
      new THREE.MeshBasicMaterial({ color: '#f7f4e9', transparent: true, opacity: .86, side: THREE.DoubleSide }));
    mid.rotation.x = -Math.PI / 2; mid.position.set(cx, .017, cz); addO(mid);
    [cz - 8.2, cz + 8.2].forEach(function (hz, hi) {
      var keyZ = hz + (hi ? -2.4 : 2.4);
      floor(3.4, 4.8, solid('#2f6f86', { transparent: true, opacity: .12, roughness: .9 }), cx, .011, keyZ);
      stripe(3.4, .08, cx, keyZ);
      stripe(.08, 4.8, cx - 1.7, keyZ); stripe(.08, 4.8, cx + 1.7, keyZ);
      var arc = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.29, 36, 1,
        hi ? Math.PI * 1.15 : Math.PI * .15, Math.PI * .7),
        new THREE.MeshBasicMaterial({ color: '#f7f4e9', transparent: true, opacity: .86, side: THREE.DoubleSide }));
      arc.rotation.x = -Math.PI / 2; arc.position.set(cx, .017, hz); addO(arc);

      // glass backboard with painted frame + shooter's square
      var boardZ = hz + (hi ? -.55 : .55);
      var poleZ = hz + (hi ? -1.15 : 1.15);
      var faceZ = boardZ + (hi ? .05 : -.05);
      var glass = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.55, .06),
        solid('#cfe8f2', { transparent: true, opacity: .34, roughness: .06,
          metalness: .15, side: THREE.DoubleSide, depthWrite: false }));
      glass.position.set(cx, 3.25, boardZ); glass.userData.v9 = true; addO(glass);
      box(2.82, .07, .09, frameMat, cx, 4.03, boardZ);
      box(2.82, .07, .09, frameMat, cx, 2.47, boardZ);
      box(.07, 1.56, .09, frameMat, cx - 1.38, 3.25, boardZ);
      box(.07, 1.56, .09, frameMat, cx + 1.38, 3.25, boardZ);
      box(.72, .055, .07, frameMat, cx, 3.18, faceZ);
      box(.055, .5, .07, frameMat, cx - .36, 2.93, faceZ);
      box(.055, .5, .07, frameMat, cx + .36, 2.93, faceZ);
      cyl(.11, 3.5, '#4a5668', cx, 1.75, poleZ);
      box(.12, .12, Math.abs(poleZ - boardZ) + .2, '#4a5668', cx, 3.15, (poleZ + boardZ) / 2);
      box(.55, .55, .55, solid('#2f3d52', { roughness: .9 }), cx, 1.15, poleZ);

      var rimZ = hz + (hi ? -.15 : .15);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(.32, .035, 10, 24),
        solid('#e8622c', { metalness: .55, roughness: .35 }));
      rim.rotation.x = Math.PI / 2; rim.position.set(cx, 2.95, rimZ); addO(rim);
      box(.12, .1, Math.abs(boardZ - rimZ) + .1, '#e8622c', cx, 2.95, (boardZ + rimZ) / 2);
      var netPts = [];
      for (var k = 0; k < 12; k++) {
        var a = k / 12 * 6.283, b = (k + 1) / 12 * 6.283;
        var rt = .31, rb = .19, yt = 2.92, yb = 2.5;
        netPts.push(new THREE.Vector3(cx + Math.cos(a) * rt, yt, rimZ + Math.sin(a) * rt),
          new THREE.Vector3(cx + Math.cos(b) * rb, yb, rimZ + Math.sin(b) * rb),
          new THREE.Vector3(cx + Math.cos(b) * rt, yt, rimZ + Math.sin(b) * rt),
          new THREE.Vector3(cx + Math.cos(a) * rb, yb, rimZ + Math.sin(a) * rb));
      }
      var net = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(netPts),
        new THREE.LineBasicMaterial({ color: '#f4f6f8', transparent: true, opacity: .72 }));
      addO(net);
    });
    // chain-link-style perimeter, bleachers and court lighting
    [-6.8, 6.8].forEach(function (dx) {
      for (var pz = cz - 8.6; pz <= cz + 8.6; pz += 2.15) cyl(.035, 2.2, '#8b97a5', cx + dx, 1.1, pz);
      box(.06, .06, 17.4, '#8b97a5', cx + dx, 2.2, cz);
    });
    [cz - 8.6, cz + 8.6].forEach(function (pz) {
      for (var px = cx - 6.8; px <= cx + 6.8; px += 2.15) cyl(.035, 2.2, '#8b97a5', px, 1.1, pz);
      box(13.7, .06, .06, '#8b97a5', cx, 2.2, pz);
    });
    for (var row = 0; row < 3; row++) {
      box(5.4, .18, .5, solid('#5d6b84', { roughness: .9 }), cx - 3.8, .35 + row * .3, cz - 9.5 - row * .55);
      box(5.4, .3, .12, '#8b97a5', cx - 3.8, .2 + row * .3, cz - 9.1 - row * .55);
    }
    streetLamp(cx - 7.4, cz - 8.8, cz - 8.8);
    streetLamp(cx + 7.4, cz + 8.8, cz + 8.8);
    parkBench(cx + 7.4, cz);
    miniBallBot(cx - 3.2, cz - 2.4, '#c94f5f', 0, 2.4, 3.0);
    miniBallBot(cx + 3.0, cz + 2.2, '#4a7fb0', 1.7, 2.2, 3.2);
    miniBallBot(cx + 2.6, cz - 4.0, '#c94f5f', 3.1, 2.6, 2.2);
    miniBallBot(cx - 2.8, cz + 4.2, '#4a7fb0', 4.6, 2.3, 2.6);
    var ball = new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 12),
      solid('#ffffff', { map: ballTex(), roughness: .9 }));
    ball.position.set(cx, .3, cz); addO(ball);
    var seam = new THREE.Mesh(new THREE.TorusGeometry(.17, .012, 8, 18), solid('#3b2b22'));
    seam.rotation.x = Math.PI / 2; ball.add(seam);
    var seam2 = new THREE.Mesh(new THREE.TorusGeometry(.17, .012, 8, 18), solid('#3b2b22'));
    seam2.rotation.y = Math.PI / 2; ball.add(seam2);
    ball.cx = cx; ball.cz = cz; ball.cycle = -1; ball.shotStart = 0;
    ball.from = null; ball.to = null;
    ball.shadow = shadow(cx, cz, .24, .16, .22);
    fx.ball = ball;
  }
  function tennisCourt(cx, cz) {
    var lineMat = solid('#f7f4e9', { transparent: true, opacity: .9, roughness: .9 });
    function stripe(w, d, x, z) { return box(w, .012, d, lineMat, x, .016, z); }
    // apron + hard court surface
    floor(11.4, 20.4, solid('#ffffff', { map: asphaltTex(3, 5), roughness: .96 }), cx, .004, cz);
    floor(10.2, 19.2, solid('#3f8f63', { roughness: .82, metalness: .02 }), cx, .007, cz);
    // outer doubles lines
    stripe(10.2, .08, cx, cz - 9.6); stripe(10.2, .08, cx, cz + 9.6);
    stripe(.08, 19.2, cx - 5.1, cz); stripe(.08, 19.2, cx + 5.1, cz);
    // singles sidelines
    stripe(.07, 19.2, cx - 4.1, cz); stripe(.07, 19.2, cx + 4.1, cz);
    // service lines + center service line
    stripe(8.2, .07, cx, cz - 4.2); stripe(8.2, .07, cx, cz + 4.2);
    stripe(.07, 8.4, cx, cz);
    // center marks
    stripe(.07, .45, cx, cz - 9.38); stripe(.07, .45, cx, cz + 9.38);
    // net posts + net
    [-5.5, 5.5].forEach(function (px) {
      cyl(.05, 1.05, '#4a5668', cx + px, .525, cz);
      box(.12, .08, .12, '#7d8b9a', cx + px, 1.03, cz);
    });
    var net = new THREE.Mesh(new THREE.BoxGeometry(11.0, .72, .04),
      solid('#eaf0f4', { transparent: true, opacity: .55, roughness: .95 }));
    net.position.set(cx, .64, cz); net.userData.v9 = true; addO(net);
    var tape = box(11.0, .05, .06, '#f4f6f8', cx, 1.0, cz);
    tape.userData.v9 = true;
  }
  function airplane() {
    var g2 = new THREE.Group();
    var shell = solid('#f2f5f7', { metalness: .45, roughness: .3 });
    var trim = solid('#2f7d86', { metalness: .4, roughness: .32 });
    var glassMat = solid('#162b40', { transparent: true, opacity: .78, roughness: .06,
      metalness: .55, side: THREE.DoubleSide });
    var metal = solid('#9aa6b3', { metalness: .75, roughness: .28 });
    function jetPart(geo, mat, x, y, z, rx, ry, rz) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0);
      m.userData.v9 = true; g2.add(m); return m;
    }
    function wingGeo(sign, span, root, tip, sweep) {
      var p = [[root * .45, 0], [-root * .55, 0],
        [-sweep - tip * .6, span * sign], [-sweep + tip * .4, span * sign]];
      var v = [];
      function tri(a, b, c) { v.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
      var top = p.map(function (q) { return [q[0], .028, q[1]]; });
      var bot = p.map(function (q) { return [q[0], -.028, q[1]]; });
      tri(top[0], top[1], top[2]); tri(top[0], top[2], top[3]);
      tri(bot[2], bot[1], bot[0]); tri(bot[3], bot[2], bot[0]);
      for (var i = 0; i < 4; i++) {
        var j = (i + 1) % 4;
        tri(top[i], bot[i], bot[j]); tri(top[i], bot[j], top[j]);
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      geo.computeVertexNormals(); return geo;
    }
    // smooth fuselage, rounded nose and tapered tail
    jetPart(new THREE.CylinderGeometry(.19, .21, 2.4, 16), shell, 0, 0, 0, 0, 0, Math.PI / 2);
    var nose = jetPart(new THREE.SphereGeometry(.2, 16, 10), shell, 1.18, 0, 0);
    nose.scale.set(1.5, 1, 1);
    jetPart(new THREE.ConeGeometry(.2, .5, 16), shell, -1.35, 0, 0, 0, 0, Math.PI / 2);
    jetPart(new THREE.BoxGeometry(2.2, .045, .02), trim, 0, -.025, .205);
    jetPart(new THREE.BoxGeometry(2.2, .045, .02), trim, 0, -.025, -.205);
    var cockpit = jetPart(new THREE.SphereGeometry(.13, 12, 9), glassMat, .85, .1, 0);
    cockpit.scale.set(1.9, .72, 1.05);
    for (var wx = -.55; wx <= .66; wx += .22) {
      jetPart(new THREE.SphereGeometry(.022, 8, 6), glassMat, wx, .075, .186);
      jetPart(new THREE.SphereGeometry(.022, 8, 6), glassMat, wx, .075, -.186);
    }
    // swept main wings + smaller tailplanes + vertical fin
    jetPart(wingGeo(1, 1.75, 1.1, .75, .45), shell, -.05, -.02, 0);
    jetPart(wingGeo(-1, 1.75, 1.1, .75, .45), shell, -.05, -.02, 0);
    jetPart(wingGeo(1, .7, .55, .35, .25), shell, -1.15, .02, 0);
    jetPart(wingGeo(-1, .7, .55, .35, .25), shell, -1.15, .02, 0);
    jetPart(new THREE.BoxGeometry(.52, .58, .055), trim, -1.25, .38, 0, 0, 0, .18);
    // nacelles, intake rings and pylons
    [-.98, .98].forEach(function (dz) {
      jetPart(new THREE.CylinderGeometry(.13, .155, .48, 14), metal, -.12, -.16, dz, 0, 0, Math.PI / 2);
      jetPart(new THREE.TorusGeometry(.135, .025, 8, 18), metal, .13, -.16, dz, 0, Math.PI / 2, 0);
      jetPart(new THREE.CircleGeometry(.115, 16), solid('#162231', { roughness: .9 }), .135, -.16, dz, 0, Math.PI / 2, 0);
      jetPart(new THREE.BoxGeometry(.26, .16, .08), shell, -.05, -.03, dz * .62, 0, .15, 0);
    });
    var beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: '#ff5f5f',
      transparent: true, opacity: .8, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false }));
    beacon.position.set(-1.5, .48, 0); beacon.scale.set(.4, .4, 1); g2.add(beacon);
    var trails = [];
    [-.98, .98].forEach(function (dz) {
      [0, 1].forEach(function (k) {
        var tr = new THREE.Sprite(new THREE.SpriteMaterial({ map: contrailTex(), color: '#e6f4ff',
          transparent: true, opacity: .22 - k * .06, blending: THREE.AdditiveBlending,
          depthWrite: false, toneMapped: false }));
        tr.position.set(-1.55 - k * .9, -.14 - k * .02, dz);
        tr.scale.set(2.8 + k * 1.4, .2 + k * .09, 1); g2.add(tr); trails.push(tr);
      });
    });
    g2.scale.setScalar(1.15);
    g2.position.set(4, 11, 22); g2.rotation.y = .18; addO(g2);
    fx.planes.push({ g: g2, x0: 4, x1: 42, y: 11, z: 22, sp: 2.6,
      beacon: beacon, trails: trails, phase: 1.7 });
  }
  function aiDevStudioAnnex() {
    // Separate, wide AI Dev Studio Annex - UE5-inspired clean tech aesthetic (feasible/low-poly).
    var cx = 74, cz = 8;
    var W = 26, D = 18;
    // Platform / polished dark floor
    floor(W + 2, D + 2, solid('#1b222c', { roughness: .55, metalness: .18 }), cx, .01, cz);
    floor(W - .4, D - .4, solid('#202a36', { roughness: .35, metalness: .22 }), cx, .018, cz);
    // subtle floor emissive grid lines
    for (var gx = cx - 11; gx <= cx + 11; gx += 2.2) box(.03, .006, D - 1.2, '#3bd1ff', gx, .022, cz);
    for (var gz = cz - 7.5; gz <= cz + 7.5; gz += 2.2) box(W - 1.2, .006, .03, '#3bd1ff', cx, .022, gz);
    // Glass walls + metal frame
    var glassMat = solid('#9fd7ff', { transparent: true, opacity: .14, roughness: .08, metalness: .1 });
    var frameMat = solid('#5f7085', { roughness: .35, metalness: .55 });
    var wallH = 3.6;
    // back wall (north side of annex)
    box(W, wallH, .18, frameMat, cx, wallH / 2, cz - D / 2);
    box(W - .4, 2.8, .08, glassMat, cx, 1.8, cz - D / 2 + .08);
    // side walls
    box(.18, wallH, D, frameMat, cx - W / 2, wallH / 2, cz);
    box(.18, wallH, D, frameMat, cx + W / 2, wallH / 2, cz);
    box(.08, 2.6, D - .8, glassMat, cx - W / 2 + .08, 1.7, cz);
    box(.08, 2.6, D - .8, glassMat, cx + W / 2 - .08, 1.7, cz);
    // front wall with wide entrance gap
    box(9, wallH, .18, frameMat, cx - 8.5, wallH / 2, cz + D / 2);
    box(9, wallH, .18, frameMat, cx + 8.5, wallH / 2, cz + D / 2);
    box(8.6, 2.6, .08, glassMat, cx - 8.5, 1.7, cz + D / 2 - .08);
    box(8.6, 2.6, .08, glassMat, cx + 8.5, 1.7, cz + D / 2 - .08);
    // entrance header beam + neon
    box(8.2, .22, .28, frameMat, cx, 3.3, cz + D / 2);
    box(7.6, .06, .06, '#63e6ff', cx, 3.16, cz + D / 2 - .18);
    box(7.6, .06, .06, '#9b7bff', cx, 3.04, cz + D / 2 - .18);

    // Roof frame + soft emissive ceiling panels
    box(W + .3, .14, D + .3, solid('#394656', { roughness: .45, metalness: .35 }), cx, wallH + .08, cz);
    for (var px = cx - 8; px <= cx + 8; px += 8) {
      for (var pz = cz - 4.5; pz <= cz + 4.5; pz += 4.5) {
        box(4.8, .08, 2.2, solid('#dfefff', { emissive: '#bfe7ff', emissiveIntensity: .9, roughness: .4 }), px, wallH - .08, pz);
      }
    }
    // neon perimeter accents
    box(W - .6, .05, .05, '#63e6ff', cx, .12, cz - D / 2 + .25);
    box(W - .6, .05, .05, '#63e6ff', cx, .12, cz + D / 2 - .25);
    box(.05, .05, D - .6, '#9b7bff', cx - W / 2 + .25, .12, cz);
    box(.05, .05, D - .6, '#9b7bff', cx + W / 2 - .25, .12, cz);

    // Large display wall (UE5-style command screen)
    box(14.5, 2.6, .12, solid('#111923', { roughness: .35, metalness: .2 }), cx, 1.95, cz - D / 2 + .32);
    var screenMat = solid('#1a88b8', { emissive: '#58d8ff', emissiveIntensity: .45, roughness: .2, metalness: .15 });
    box(13.8, 2.1, .06, screenMat, cx, 1.95, cz - D / 2 + .39);
    box(13.8, .04, .04, '#9fefff', cx, 2.95, cz - D / 2 + .43);
    box(13.8, .04, .04, '#9fefff', cx, .95, cz - D / 2 + .43);
    box(.04, 2.1, .04, '#9fefff', cx - 6.9, 1.95, cz - D / 2 + .43);
    box(.04, 2.1, .04, '#9fefff', cx + 6.9, 1.95, cz - D / 2 + .43);

    function stationLabel(text, x, y, z, ry, col) {
      var c = document.createElement('canvas'); c.width = 512; c.height = 128;
      var q = c.getContext('2d');
      q.fillStyle = 'rgba(10,18,28,.82)'; q.fillRect(0, 0, 512, 128);
      q.strokeStyle = col || '#63e6ff'; q.lineWidth = 8; q.strokeRect(6, 6, 500, 116);
      q.fillStyle = '#eaf7ff'; q.font = 'bold 34px Arial'; q.textAlign = 'center'; q.textBaseline = 'middle';
      q.fillText(text, 256, 64);
      var tex = new THREE.CanvasTexture(c);
      var m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .55), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; m.userData.v9 = true; addO(m);
    }

    function devBot(x, z, color, role, accent) {
      // simple stylized bot figure (visual, lightweight)
      shadow(x, z, .55, .45, .12);
      var g = new THREE.Group();
      var bodyMat = solid(color, { roughness: .45, metalness: .2 });
      var dark = solid('#243246', { roughness: .5, metalness: .25 });
      var base = new THREE.Mesh(new THREE.CylinderGeometry(.28, .34, .2, 12), dark); base.position.y = .1; g.add(base);
      var torso = new THREE.Mesh(new THREE.BoxGeometry(.5, .55, .34), bodyMat); torso.position.y = .5; g.add(torso);
      var head = new THREE.Mesh(new THREE.BoxGeometry(.42, .34, .34), solid('#eef4f8', { roughness: .35, metalness: .1 })); head.position.y = .95; g.add(head);
      var visor = new THREE.Mesh(new THREE.BoxGeometry(.34, .12, .04), solid(accent || '#63e6ff', { emissive: accent || '#63e6ff', emissiveIntensity: .9, roughness: .2 })); visor.position.set(0, .95, .18); g.add(visor);
      var antenna = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .18, 6), dark); antenna.position.set(0, 1.2, 0); g.add(antenna);
      var tip = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 8), solid(accent || '#63e6ff', { emissive: accent || '#63e6ff', emissiveIntensity: 1.2 })); tip.position.set(0, 1.31, 0); g.add(tip);
      [-.32, .32].forEach(function (sx) {
        var arm = new THREE.Mesh(new THREE.BoxGeometry(.1, .42, .1), bodyMat); arm.position.set(sx, .52, .05); arm.rotation.x = -.45; g.add(arm);
      });
      g.position.set(x, 0, z); g.rotation.y = Math.PI; addO(g);
      stationLabel(role, x, 1.62, z, 0, accent || '#63e6ff');
    }

    // Stations layout (wide, separated)
    var roles = [
      { role: 'GAME PLANNING', c: '#4a90d9', a: '#63e6ff' },
      { role: 'SCRIPT GENERATION', c: '#7a6fd6', a: '#b59cff' },
      { role: 'CODE ORGANIZATION', c: '#3f9d9a', a: '#6ff0df' },
      { role: '3D ASSET CONCEPTS', c: '#d08a45', a: '#ffc06a' },
      { role: 'UI DESIGN', c: '#d6607a', a: '#ff9fba' },
      { role: 'TESTING PLANS', c: '#5cab6e', a: '#8ff0a8' },
      { role: 'BUG ANALYSIS', c: '#c94f4f', a: '#ff8b8b' }
    ];
    var leftX = cx - 7.5, rightX = cx - 2.5, midX = cx + 2.5, farX = cx + 7.5;
    var rowZ1 = cz - 3.2, rowZ2 = cz + 2.2;
    var pos = [
      [leftX, rowZ1], [rightX, rowZ1], [midX, rowZ1], [farX, rowZ1],
      [leftX, rowZ2], [rightX, rowZ2], [midX, rowZ2]
    ];
    pos.forEach(function (p, i) {
      var r = roles[i];
      desk(p[0], p[1], Math.PI);
      officeChair(p[0], p[1] + 1.05, 0, '#3a4658');
      devBot(p[0], p[1] + .95, r.c, r.role, r.a);
    });

    // Integration station (right side)
    var ix = cx + 9.5, iz = cz - 1;
    desk(ix, iz, Math.PI / 2);
    officeChair(ix - 1.0, iz, Math.PI / 2, '#3a4658');
    devBot(ix - .95, iz, '#4f6d8f', 'ROBLOX INTEGRATION', '#63e6ff');
    box(2.2, 1.2, .08, solid('#121b26', { roughness: .35, metalness: .2 }), ix + .2, 1.8, iz - 1.35);
    box(2.0, .9, .04, solid('#45c8ff', { emissive: '#45c8ff', emissiveIntensity: .35 }), ix + .2, 1.8, iz - 1.3);
    stationLabel('AUTOMATED / TOOL EXECUTION', ix + .2, 2.62, iz - 1.25, 0, '#63e6ff');

    // CEO Final Approval area (front center)
    var ax = cx, az = cz + 5.6;
    box(3.2, .12, 1.4, solid('#2a3442', { roughness: .4, metalness: .25 }), ax, .78, az);
    box(3.4, .08, 1.6, solid('#43556d', { roughness: .35, metalness: .35 }), ax, .86, az);
    officeChair(ax, az + 1.1, 0, '#243247');
    stationLabel('FINAL APPROVAL: IKAW (CEO)', ax, 1.55, az - .1, 0, '#ffd27d');
    box(.08, 1.4, .08, '#8fa3b8', ax - 1.5, .7, az - .6);
    box(.08, 1.4, .08, '#8fa3b8', ax + 1.5, .7, az - .6);
    box(3.1, .06, .06, '#ffd27d', ax, 1.42, az - .6);

    // Annex sign
    stationLabel('AI DEV STUDIO ANNEX', cx, 3.35, cz + D / 2 - .25, Math.PI, '#63e6ff');
    // exterior approach path
    floor(3.2, 8, solid('#9eaab6', { roughness: .92 }), cx, .012, cz + D / 2 + 4.2);
    plant(cx - 6, cz + D / 2 + 1.2, .9); plant(cx + 6, cz + D / 2 + 1.2, .9);
    tree(cx - 10, cz + D / 2 + 2.2, .9); tree(cx + 10, cz + D / 2 + 2.2, .9);
  }

  function megaWorldCommandZone() {
    // Separate Cyborg Cheebee Mega World command/planning zone (feasible in-office representation).
    var cx = 74, cz = 34;
    var W = 28, D = 20;
    var wallH = 3.8;
    var frameMat = solid('#56657a', { roughness: .35, metalness: .55 });
    var glassMat = solid('#a8dfff', { transparent: true, opacity: .12, roughness: .08, metalness: .12 });
    var darkMat = solid('#151c27', { roughness: .45, metalness: .18 });
    var panelMat = solid('#101924', { roughness: .35, metalness: .2 });
    floor(W + 2.4, D + 2.4, solid('#171f2a', { roughness: .58, metalness: .16 }), cx, .01, cz);
    floor(W - .2, D - .2, solid('#1d2733', { roughness: .38, metalness: .2 }), cx, .018, cz);
    for (var gx = cx - 12; gx <= cx + 12; gx += 2.4) box(.03, .006, D - 1.4, '#5de2ff', gx, .022, cz);
    for (var gz = cz - 8.5; gz <= cz + 8.5; gz += 2.4) box(W - 1.4, .006, .03, '#b07cff', cx, .022, gz);
    // Frame/glass shell
    box(W, wallH, .18, frameMat, cx, wallH / 2, cz - D / 2);
    box(W - .4, 2.9, .08, glassMat, cx, 1.85, cz - D / 2 + .08);
    box(.18, wallH, D, frameMat, cx - W / 2, wallH / 2, cz);
    box(.18, wallH, D, frameMat, cx + W / 2, wallH / 2, cz);
    box(.08, 2.7, D - .8, glassMat, cx - W / 2 + .08, 1.75, cz);
    box(.08, 2.7, D - .8, glassMat, cx + W / 2 - .08, 1.75, cz);
    box(10, wallH, .18, frameMat, cx - 9, wallH / 2, cz + D / 2);
    box(10, wallH, .18, frameMat, cx + 9, wallH / 2, cz + D / 2);
    box(9.6, 2.7, .08, glassMat, cx - 9, 1.75, cz + D / 2 - .08);
    box(9.6, 2.7, .08, glassMat, cx + 9, 1.75, cz + D / 2 - .08);
    box(8.4, .24, .3, frameMat, cx, 3.45, cz + D / 2);
    box(7.8, .06, .06, '#63e6ff', cx, 3.3, cz + D / 2 - .18);
    box(7.8, .06, .06, '#ff8df0', cx, 3.18, cz + D / 2 - .18);
    box(W + .3, .14, D + .3, solid('#394656', { roughness: .45, metalness: .35 }), cx, wallH + .08, cz);
    for (var px = cx - 9; px <= cx + 9; px += 9) {
      for (var pz = cz - 5; pz <= cz + 5; pz += 5) {
        box(5.2, .08, 2.4, solid('#deefff', { emissive: '#bfe7ff', emissiveIntensity: .75, roughness: .4 }), px, wallH - .08, pz);
      }
    }
    box(W - .8, .05, .05, '#63e6ff', cx, .12, cz - D / 2 + .25);
    box(W - .8, .05, .05, '#63e6ff', cx, .12, cz + D / 2 - .25);
    box(.05, .05, D - .8, '#ff8df0', cx - W / 2 + .25, .12, cz);
    box(.05, .05, D - .8, '#ff8df0', cx + W / 2 - .25, .12, cz);

    function megaLabel(text, x, y, z, ry, col, w, h, fs) {
      var c = document.createElement('canvas'); c.width = 512; c.height = 128;
      var q = c.getContext('2d');
      q.fillStyle = 'rgba(8,14,24,.84)'; q.fillRect(0, 0, 512, 128);
      q.strokeStyle = col || '#63e6ff'; q.lineWidth = 8; q.strokeRect(6, 6, 500, 116);
      q.fillStyle = '#eaf7ff'; q.font = 'bold ' + (fs || 34) + 'px Arial';
      q.textAlign = 'center'; q.textBaseline = 'middle';
      q.fillText(text, 256, 64);
      var tex = new THREE.CanvasTexture(c);
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w || 2.2, h || .55), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; m.userData.v9 = true; addO(m);
    }
    function megaBoard(title, lines, x, y, z, ry, w, h, accent) {
      var c = document.createElement('canvas'); c.width = 1024; c.height = 512;
      var q = c.getContext('2d');
      q.fillStyle = '#0b1420'; q.fillRect(0, 0, 1024, 512);
      q.strokeStyle = accent || '#63e6ff'; q.lineWidth = 10; q.strokeRect(8, 8, 1008, 496);
      q.fillStyle = accent || '#63e6ff'; q.fillRect(20, 20, 984, 64);
      q.fillStyle = '#08111b'; q.font = 'bold 34px Arial'; q.textAlign = 'left'; q.textBaseline = 'middle';
      q.fillText(title, 36, 52);
      q.font = '24px Arial'; q.fillStyle = '#e7f5ff';
      for (var i = 0; i < lines.length; i++) {
        q.fillStyle = i % 2 ? '#d8ecff' : '#9fdcff';
        q.fillText(lines[i], 36, 128 + i * 42, 952);
      }
      var tex = new THREE.CanvasTexture(c);
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w || 4.6, h || 2.3), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; m.userData.v9 = true; addO(m);
      var frame = new THREE.Mesh(new THREE.BoxGeometry((w || 4.6) + .12, (h || 2.3) + .12, .08), darkMat);
      frame.position.set(x, y, z - (ry ? .01 : .04)); frame.rotation.y = ry || 0; frame.userData.v9 = true; addO(frame);
    }

    // Main master prompt wall
    box(16.8, 3.0, .14, panelMat, cx, 2.0, cz - D / 2 + .34);
    megaBoard('CYBORG CHEEBEE MEGA WORLD - OFFICIAL MASTER PROMPT',
      ['Roblox Studio + Luau | PC | Sci-Fi Cyborg MMORPG | UE5 = benchmark/reference',
       'Mode: Research -> Audit -> Design -> CEO Approval -> Implementation -> Test -> Validation',
       'Goal: Complete game experience, original tech design, gameplay depth, immersion, performance, player value',
       'Not a claim that Roblox became UE5. Honest, documented, CEO-approved development only.'],
      cx, 2.05, cz - D / 2 + .42, 0, 10.8, 2.25, '#63e6ff');

    // Key systems board
    megaBoard('MAX FEASIBLE IN-OFFICE SYSTEMS / PILLARS',
      ['P1 Foundation: audit, architecture, config, security, persistence, logging',
       'P2 Core: character, combat, inventory, skills, NPCs, quests, world systems',
       'P3 Visual: lighting, atmosphere, materials, weather, VFX, cinematic, animation',
       'P4 Advanced: intelligent NPCs, events, physics, factions, guilds, economy, social',
       'P5 Optimization: presets, profiling, multiplayer/security/regression, release validation',
       'Feasibility: NATIVE / CUSTOM / APPROXIMATION / LIMITED / UNSUPPORTED'],
      cx - 6.8, 1.85, cz - 2.2, Math.PI / 2, 6.2, 2.7, '#b07cff');

    // Roadmap / outputs board
    megaBoard('MASTER PROMPT ROADMAP (PARTS 1-21)',
      ['P1-4: Role, Vision, Research, 100-point Roblox vs UE5 audit',
       'P5-7: Graphics engine, 100 immersion reqs, 1,000 advanced suggestions',
       'P8-14: MMORPG systems, code quality, scripts, architecture, perf/multiplayer',
       'P15-19: Testing/validation, status system, recovery, priorities, CEO approval',
       'P20-21: Required outputs, final 3 recommendations, non-negotiable rules',
       'Full prompt: public/mega-world-master-prompt.md (viewable in office UI)'],
      cx + 6.8, 1.85, cz - 2.2, -Math.PI / 2, 6.2, 2.7, '#ff9b5f');

    // Center holographic core
    var coreBase = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.7, .35, 20), solid('#243247', { roughness: .45, metalness: .35 }));
    coreBase.position.set(cx, .18, cz + 1.2); coreBase.userData.v9 = true; addO(coreBase);
    var coreRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, .06, 12, 40), solid('#63e6ff', { emissive: '#63e6ff', emissiveIntensity: 1.1, roughness: .2 }));
    coreRing.position.set(cx, .72, cz + 1.2); coreRing.rotation.x = Math.PI / 2; coreRing.userData.v9 = true; addO(coreRing);
    var coreRing2 = new THREE.Mesh(new THREE.TorusGeometry(.72, .045, 12, 36), solid('#ff8df0', { emissive: '#ff8df0', emissiveIntensity: 1.0, roughness: .2 }));
    coreRing2.position.set(cx, 1.02, cz + 1.2); coreRing2.rotation.x = Math.PI / 2; coreRing2.userData.v9 = true; addO(coreRing2);
    var core = new THREE.Mesh(new THREE.OctahedronGeometry(.42, 0), solid('#8fefff', { emissive: '#63e6ff', emissiveIntensity: 1.2, roughness: .15, metalness: .2, transparent: true, opacity: .92 }));
    core.position.set(cx, 1.45, cz + 1.2); core.userData.v9 = true; addO(core);
    animParts.push({ m: core, k: 'spin', s: .7 });
    animParts.push({ m: coreRing, k: 'spinFlat', s: .35 });
    animParts.push({ m: coreRing2, k: 'spinFlatR', s: .45 });

    megaLabel('CYBORG CHEEBEE MEGA WORLD', cx, 3.5, cz + D / 2 - .25, Math.PI, '#63e6ff', 5.2, .7, 30);
    megaLabel('AI RECOMMENDS | CEO APPROVES | DEVELOPER IMPLEMENTS | QA VALIDATES', cx, 1.1, cz + 5.2, 0, '#ffd27d', 8.8, .55, 22);
    megaLabel('FULL MASTER PROMPT: OPEN "MEGA WORLD" BUTTON', cx, .62, cz + 6.2, 0, '#9fffa8', 6.2, .45, 24);

    // Pillar markers
    var pillars = [
      ['GRAPHICS', -10.5, -6.5, '#63e6ff'], ['WORLD', -6.3, -6.5, '#7cf0c8'], ['CHARACTER', -2.1, -6.5, '#ff9fd0'],
      ['COMBAT', 2.1, -6.5, '#ff9b5f'], ['NPC/AI', 6.3, -6.5, '#b07cff'], ['ECONOMY', 10.5, -6.5, '#ffd27d']
    ];
    pillars.forEach(function (p) {
      var px = cx + p[1], pz = cz + p[2];
      box(.9, .08, .9, solid('#223044', { roughness: .5, metalness: .25 }), px, .04, pz);
      var col = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 1.5, 10), solid(p[3], { emissive: p[3], emissiveIntensity: .35, roughness: .35, metalness: .2 }));
      col.position.set(px, .75, pz); col.userData.v9 = true; addO(col);
      var orb = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 12), solid(p[3], { emissive: p[3], emissiveIntensity: 1.1, roughness: .2 }));
      orb.position.set(px, 1.62, pz); orb.userData.v9 = true; addO(orb);
      megaLabel(p[0], px, 2.05, pz, 0, p[3], 1.8, .38, 30);
    });

    // approach path
    floor(3.4, 6.2, solid('#9eaab6', { roughness: .92 }), cx, .012, cz + D / 2 + 3.3);
    plant(cx - 7, cz + D / 2 + 1.4, .9); plant(cx + 7, cz + D / 2 + 1.4, .9);
    tree(cx - 11, cz + D / 2 + 2.8, .9); tree(cx + 11, cz + D / 2 + 2.8, .9);
  }

  function sideWorlds() {
    // ---- EAST / screen-left: café court, fountain and service lane ----
    // Kept inside the visible left wedge (x≈18..37, z≈34..46) of the user view.
    floor(17, 12, solid('#ffffff', { map: stoneTex(10, 2), roughness: .95 }), 26, .002, 40);
    floor(4, 11.8, solid('#ffffff', { map: asphaltTex(8, 4), roughness: .96, metalness: .02 }), 35, .005, 40);
    for (var ez = 35; ez <= 45; ez += 2) box(.12, .012, 1, '#e8d9a0', 35, .015, ez);
    // ARYASKY: café service lane — reflective studs + painted legend.
    for (var ez2 = 35; ez2 <= 45; ez2 += 3) {
      box(.1, .025, .14, '#dfe7ec', 34.2, .028, ez2);
      box(.045, .01, .07, '#f6d98a', 34.2, .046, ez2);
      box(.1, .025, .14, '#dfe7ec', 35.8, .028, ez2);
      box(.045, .01, .07, '#e8624f', 35.8, .046, ez2);
    }
    roadText(35, 40, 'SERVICE', 3.2, .9, Math.PI / 2);
    floor(7, 7, solid('#4f9d6a', { roughness: 1 }), 23, .006, 40);
    pond(22, 40, 1.9);
    sideBuilding(18, 43, 3, 6, 3, '#5d6b84', 'CAFÉ');
    sideBuilding(34, 43, 3, 7, 3, '#68778f', 'SERVICE');
    umbrella(21, 42, '#c94f5f'); umbrella(25, 42, '#3f9d6a');
    umbrella(21, 38, '#4a7fb0'); umbrella(25, 38, '#e0a83a');
    parkBench(23, 43); parkBench(28, 43);
    marketStall(31, 40, '#b08a3d');
    parkedVan(35, 37, '#d8d2c4', Math.PI / 2);
    parkedVan(35, 45, '#5f7fa8', Math.PI / 2);
    roadSign(19, 38, 'CAFÉ', '#3f9d9a');
    fence(18, 34, 34.4);
    for (var ex = 18; ex <= 34; ex += 2.4) cyl(.06, .4, '#8b97a5', ex, .2, 45);
    [20, 27, 33].forEach(function (px) { streetLamp(px, 40, 49); });
    [19, 30].forEach(function (px) { tree(px, 44, .55); });
    pedestrian(20, 43, -1, '#8f6fd8');
    pedestrian(31, 43, 1, '#e0a83a');

    // ---- WEST / screen-right: basketball court, market, EV bay and playground ----
    floor(21, 36, solid('#ffffff', { map: stoneTex(9, 2), roughness: .95 }), -11.5, .002, 25);
    floor(5, 36.4, solid('#ffffff', { map: asphaltTex(9, 4), roughness: .96, metalness: .02 }), -20, .005, 16.1);
    for (var wz = -1; wz <= 33; wz += 4) box(.12, .012, 1.6, '#e8d9a0', -20, .015, wz);
    // ARYASKY: market service lane — reflective studs + painted legend.
    for (var wz2 = -1; wz2 <= 33; wz2 += 3) {
      box(.1, .025, .14, '#dfe7ec', -20.8, .028, wz2);
      box(.045, .01, .07, '#f6d98a', -20.8, .046, wz2);
      box(.1, .025, .14, '#dfe7ec', -19.2, .028, wz2);
      box(.045, .01, .07, '#e8624f', -19.2, .046, wz2);
    }
    roadText(-20, 16, 'MARKET', 3.2, .9, Math.PI / 2);
    floor(14, 18, solid('#4f9d6a', { roughness: 1 }), -12, .004, 26);
    basketballCourt(-12, 26);
    sideBuilding(-22, 34, 5, 9, 4, '#68778f', 'ARENA');
    sideBuilding(-20, 15, 5, 7, 4, '#5d6b84', 'MARKET');
    marketStall(-4, 36, '#8f6fd8'); marketStall(-4, 28, '#3f9d9a');
    umbrella(-4, 20, '#e0a83a'); umbrella(-3, 24, '#c94f5f');
    parkBench(-4, 24); parkBench(-4, 32);
    [-16, -8].forEach(function (px) {
      box(.5, 1.1, .35, '#e8e4dc', px, .55, 16);
      var led = bx(.2, .18, .06, '#5fd6ff', px, .9, 15.8, true);
      animParts.push({ m: led, k: 'led', p: px });
    });
    parkedVan(-20, 22, '#c94f5f', Math.PI / 2);
    parkedVan(-20, 36, '#4a7fb0', Math.PI / 2);
    roadSign(-4, 26, 'COURT', '#e8622c');
    fence(-22, -2, 39);
    for (var wx = -21; wx <= -2; wx += 2.6) cyl(.06, .4, '#8b97a5', wx, .2, 34);
    [-18, -14, -6, -2].forEach(function (px) { tree(px, 38, .6); });
    cyl(1.1, .1, '#c94f5f', -7, .05, 15);
    cyl(.12, .6, '#8b97a5', -7, .3, 15);
    var slide = box(2.4, .12, .6, '#4a7fb0', -15, .7, 15);
    slide.rotation.z = -.25;
    [-22, -4, -2].forEach(function (px) { streetLamp(px, 24, 37); });
    pedestrian(-4, 34, 1, '#3f9d6a');
    pedestrian(-20, 34, -1, '#c94f4f');
    // Extra west-side landscaping: shrubs, flowers and a resting corner.
    [[-16, 40], [-10, 40], [-6, 38], [-2, 12], [-2, 6]].forEach(function (p) { plant(p[0], p[1], .8); });
    [[-20, 40], [-12, 42], [-4, 42], [-14, 8], [-8, 8]].forEach(function (p, i) {
      for (var f = 0; f < 3; f++) {
        var wf = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 5),
          solid(['#ffd27d', '#ff9fc4', '#fff1a8'][(i + f) % 3], { roughness: .78 }));
        wf.position.set(p[0] - .2 + f * .2, -.12, p[1]); addO(wf);
      }
    });
    parkBench(-8, 40);

    // ---- NORTH / open field: tennis court ----
    tennisCourt(48, -14);
    // Tennis court surroundings: landscaped border, shade trees and seating.
    [[42, -24], [54, -24], [42, -4], [54, -4]].forEach(function (p) { tree(p[0], p[1], .78); });
    [[40, -14], [56, -14], [48, -25], [48, -3]].forEach(function (p) { plant(p[0], p[1], .9); });
    [[41, -20], [41, -8], [55, -20], [55, -8]].forEach(function (p, i) {
      for (var f = 0; f < 4; f++) {
        var tf = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 5),
          solid(['#ffd27d', '#ffffff', '#ff9fc4', '#fff1a8'][(i + f) % 4], { roughness: .75 }));
        tf.position.set(p[0] + (f % 2 ? .18 : -.18), -.12, p[1] - .3 + f * .2); addO(tf);
      }
    });
    parkBench(39, -14); parkBench(57, -14);

    // Separate AI Dev Studio Annex (UE5-inspired, feasible/perf-safe)
    // Cyborg Cheebee Mega World master prompt command zone (max feasible in-office)
  }
  function streetLamp(x, z, rz) {
    var g2 = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, 4.0, 10), solid('#4a5668', { metalness: .6 }));
    pole.position.y = 2.0; pole.userData.v9 = true; g2.add(pole);
    var panel = new THREE.Mesh(new THREE.BoxGeometry(.08, .22, .03), solid('#5d6b7d'));
    panel.position.set(0, 1.2, .08); panel.userData.v9 = true; g2.add(panel);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, .08, .08), solid('#4a5668', { metalness: .6 }));
    arm.position.set(.5, 3.95, 0); arm.userData.v9 = true; g2.add(arm);
    var head = new THREE.Mesh(new THREE.BoxGeometry(.7, .1, .3),
      solid('#ffe9bd', { emissive: '#ffd98a', emissiveIntensity: 1.0 }));
    head.position.set(1.0, 3.86, 0); head.userData.v9 = true; g2.add(head);
    animParts.push({ m: head, k: 'led', p: x * .3 });
    var banner = new THREE.Mesh(new THREE.BoxGeometry(.04, .85, .3),
      solid(x % 2 ? '#3f9d9a' : '#b08a3d', { roughness: .9 }));
    banner.position.set(-.14, 2.75, 0); banner.userData.v9 = true; g2.add(banner);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, .22, 10), solid('#394456'));
    base.position.y = .11; base.userData.v9 = true; g2.add(base);
    g2.position.set(x, 0, z); addO(g2);
    reflection(x + 1, rz === undefined ? -7.2 : rz, 2.6, 1.4, '#ffdca8', 0, .05);
  }
  function trafficLight(x, z) {
    var g2 = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 3.3, 8), solid('#3c4758', { metalness: .5 }));
    pole.position.y = 1.65; pole.userData.v9 = true; g2.add(pole);
    var housing = new THREE.Mesh(new THREE.BoxGeometry(.34, .92, .28), solid('#222a36'));
    housing.position.set(0, 3.0, 0); housing.userData.v9 = true; g2.add(housing);
    var lamps = [];
    ['#e2523a', '#f2c14e', '#54d18a'].forEach(function (c, i) {
      var hood = new THREE.Mesh(new THREE.BoxGeometry(.24, .03, .12), solid('#1b2430'));
      hood.position.set(0, 3.38 - i * .3, .22); hood.userData.v9 = true; g2.add(hood);
      var l = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8),
        solid(c, { emissive: c, emissiveIntensity: i === 2 ? 1.0 : .06 }));
      l.position.set(0, 3.3 - i * .3, .16); l.userData.v9 = true; g2.add(l); lamps.push(l);
    });
    g2.position.set(x, 0, z); addO(g2);
    fx.signals.push({ lamps: lamps, p: x * .17 });
  }
  function busStop(x, z) {
    var g2 = new THREE.Group();
    var roof = new THREE.Mesh(new THREE.BoxGeometry(3.2, .12, 1.3), solid('#4a6a8f', { metalness: .4 }));
    roof.position.y = 2.5; roof.userData.v9 = true; g2.add(roof);
    [-1.5, 1.5].forEach(function (dx) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(.08, 2.5, .08), solid('#5d6b7d'));
      post.position.set(dx, 1.25, -.55); post.userData.v9 = true; g2.add(post);
      var glass = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.9, .03),
        solid('#b9d7ea', { transparent: true, opacity: .32, metalness: .2 }));
      glass.position.set(dx * .5, 1.3, -.56); glass.userData.v9 = true; g2.add(glass);
    });
    var bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, .1, .42), solid('#a9793f'));
    bench.position.set(0, .5, -.25); bench.userData.v9 = true; g2.add(bench);
    var sign = new THREE.Mesh(new THREE.BoxGeometry(.4, .5, .06),
      solid('#3f9d9a', { emissive: '#3f9d9a', emissiveIntensity: .45 }));
    sign.position.set(1.72, 2.0, 0); sign.userData.v9 = true; g2.add(sign);
    // small route poster and planter
    var poster = new THREE.Mesh(new THREE.BoxGeometry(.45, .55, .02), solid('#f4f6f8'));
    poster.position.set(-1.05, 1.55, -.53); poster.userData.v9 = true; g2.add(poster);
    var pot = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, .18, 8), solid('#8b5e34'));
    pot.position.set(-1.3, .09, .3); pot.userData.v9 = true; g2.add(pot);
    var leaf = new THREE.Mesh(new THREE.SphereGeometry(.16, 7, 6), solid('#5ea86b', { roughness: .9 }));
    leaf.position.set(-1.3, .28, .3); leaf.userData.v9 = true; g2.add(leaf);
    g2.position.set(x, 0, z); addO(g2);
  }
  function tactileTex() {
    return makeTex('tactile', function (q, S) {
      q.fillStyle = '#c8a86a'; q.fillRect(0, 0, S, S);
      for (var y = 14; y < S; y += 24) for (var x = 14; x < S; x += 24) {
        q.fillStyle = 'rgba(255,242,196,.95)';
        q.beginPath(); q.arc(x, y, 4.5, 0, 6.3); q.fill();
      }
    }, 22, 1);
  }
  function roadSign(x, z, label, color) {
    var g2 = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 2.2, 8), solid('#5d6b7d'));
    pole.position.y = 1.1; pole.userData.v9 = true; g2.add(pole);
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    var q = cv.getContext('2d');
    q.fillStyle = color || '#3f9d9a'; q.fillRect(0, 0, 256, 128);
    q.strokeStyle = '#f4f6f8'; q.lineWidth = 8; q.strokeRect(6, 6, 244, 116);
    q.fillStyle = '#ffffff'; q.font = 'bold 54px sans-serif';
    q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(label, 128, 68);
    var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
    var face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .5),
      new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false }));
    face.position.set(0, 2.05, .04); face.userData.v9 = true; g2.add(face);
    g2.position.set(x, 0, z); addO(g2);
  }
  function fence(x1, x2, z) {
    for (var x = x1; x <= x2; x += 1.6) {
      var p = new THREE.Mesh(new THREE.BoxGeometry(.06, .9, .06), solid('#8b97a5', { metalness: .5 }));
      p.position.set(x, .45, z); p.userData.v9 = true; addO(p);
    }
    [.38, .82].forEach(function (y) {
      var r = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, .05, .05), solid('#9aa6b3', { metalness: .5 }));
      r.position.set((x1 + x2) / 2, y, z); r.userData.v9 = true; addO(r);
    });
  }
  function billboard() {
    var cv = document.createElement('canvas'); cv.width = 1024; cv.height = 384;
    var q = cv.getContext('2d');
    var g = q.createLinearGradient(0, 0, 1024, 384);
    g.addColorStop(0, '#123a63'); g.addColorStop(.5, '#2f6f9e'); g.addColorStop(1, '#3f9d9a');
    q.fillStyle = g; q.fillRect(0, 0, 1024, 384);
    q.fillStyle = 'rgba(255,255,255,.07)';
    for (var i = 0; i < 9; i++) q.fillRect(i * 130, 0, 54, 384);
    q.fillStyle = '#ffe6a8'; q.font = 'bold 92px sans-serif'; q.textAlign = 'center';
    q.fillText('CYBORG CITY', 512, 170);
    q.fillStyle = '#ffffff'; q.font = '42px sans-serif';
    q.fillText('FUTURE IS OPEN 24/7', 512, 250);
    var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
    var frame = new THREE.Mesh(new THREE.BoxGeometry(9.3, 3.7, .14), solid('#2e3a4d'));
    frame.position.set(0, 8.5, -12.05); frame.userData.v9 = true; addO(frame);
    var m = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4),
      new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(0, 8.5, -11.94); m.userData.v9 = true; addO(m);
  }
  function pedestrian(x, z, dir, color) {
    shadow(x, z, .24, .18, .08);
    var g2 = new THREE.Group();
    var torso = new THREE.Mesh(new THREE.CylinderGeometry(.15, .19, .68, 8), solid(color, { roughness: .9 }));
    torso.position.y = .98; torso.userData.v9 = true; g2.add(torso);
    var head = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), solid('#e8c4a0', { roughness: .85 }));
    head.position.y = 1.48; head.userData.v9 = true; g2.add(head);
    var hair = new THREE.Mesh(new THREE.SphereGeometry(.145, 10, 8, 0, 6.3, 0, 1.5), solid('#3b322c'));
    hair.position.y = 1.51; hair.userData.v9 = true; g2.add(hair);
    var legs = [], arms = [];
    [-.09, .09].forEach(function (dx) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(.1, .56, .12), solid('#35455c'));
      leg.position.set(dx, .36, 0); leg.userData.v9 = true; g2.add(leg); legs.push(leg);
      var arm = new THREE.Mesh(new THREE.BoxGeometry(.08, .5, .1), solid(color, { roughness: .9 }));
      arm.position.set(dx * 2.6, 1.0, 0); arm.userData.v9 = true; g2.add(arm); arms.push(arm);
    });
    var bag = new THREE.Mesh(new THREE.BoxGeometry(.22, .24, .1), solid('#b08a3d'));
    bag.position.set(.28, .78, 0); bag.userData.v9 = true; g2.add(bag);
    g2.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    g2.position.set(x, 0, z); addO(g2);
    fx.peds.push({ g: g2, dir: dir, speed: .45 + Math.random() * .3,
      legs: legs, arms: arms, phase: x * .7 });
  }
  function roadArrow(x, z, dir) {
    var shaft = box(1.1, .014, .12, '#eef2f4', x, .013, z);
    var h1 = box(.55, .014, .12, '#eef2f4', x + dir * .6, .013, z - .19);
    var h2 = box(.55, .014, .12, '#eef2f4', x + dir * .6, .013, z + .19);
    h1.rotation.y = dir * .62; h2.rotation.y = -dir * .62;
  }
  function northStreet() {
    // Visible through the north glazing: a real two-lane city street.
    floor(70, 3.4, solid('#ffffff', { map: stoneTex(12, 1), roughness: .95 }), 23, .006, -2.1);
    floor(70, 6.4, solid('#ffffff', { map: asphaltTex(14, 2), roughness: .96, metalness: .02 }), 23, .004, -7.2);
    floor(70, 2.8, solid('#ffffff', { map: stoneTex(12, 1), roughness: .95 }), 23, .006, -11.7);
    // painted bike lane + edge lines
    floor(70, .85, solid('#4a7f6e', { roughness: .95 }), 23, .009, -4.85);
    for (var bxd = -8; bxd <= 54; bxd += 3) box(1.4, .012, .07, '#eef2f4', bxd, .013, -5.3);
    box(70, .14, .18, '#b9c1c9', 23, .07, -4.12);
    box(70, .14, .18, '#b9c1c9', 23, .07, -10.28);
    centerLine(-8, 54, -7.2, true); // ARYASKY: double-yellow with dashed guide
    roadStuds(-8, 54, -5.7, 4, '#f6d98a'); // amber near lane
    roadStuds(-8, 54, -8.7, 4, '#e8624f'); // red far lane
    box(70, .012, .09, '#d4dbe0', 23, .012, -4.6);
    box(70, .012, .09, '#d4dbe0', 23, .012, -9.8);
    [12, 34].forEach(function (cx) {
      for (var z = -4.5; z >= -9.9; z -= .72) box(2.8, .014, .34, '#eef2f4', cx, .013, z);
      stopBar(cx - 1.9, -6.2, 2.8); // near (+x) lane stop line
      stopBar(cx + 1.9, -8.4, 2.8); // far (-x) lane stop line
    });
    // ARYASKY: green-lane bicycle symbols + centre refuges + city road legend.
    [-4, 8, 22, 38, 50].forEach(function (bx2) { bikeGlyph(bx2, -4.85); });
    refugeIsland(23, -7.2, 1.2);
    roadText(44, -7.2, 'CITY ←', 6.5, 1.4);
    [8, 26, 44].forEach(function (ax) { roadArrow(ax, -6.2, 1); });
    [14, 38].forEach(function (mx) {
      cyl(.28, .03, '#59616c', mx, .014, -7.2);
      cyl(.2, .032, '#707a86', mx, .016, -7.2);
    });
    [10, 30, 50].forEach(function (px) { reflection(px, -9.9, 1.8, .7, '#bcd9ec', 0, .06); });
    // Tactile paving and drainage grates make the sidewalks feel finished.
    floor(70, .42, solid('#ffffff', { map: tactileTex(), roughness: .95 }), 23, .011, -3.78);
    floor(70, .42, solid('#ffffff', { map: tactileTex(), roughness: .95 }), 23, .011, -10.62);
    for (var gx = 2; gx <= 52; gx += 8) {
      box(.62, .022, .3, '#39414c', gx, .017, -4.02);
      for (var sl = -1; sl <= 1; sl++) box(.04, .006, .26, '#78828f', gx + sl * .16, .03, -4.02);
    }
    // Moving traffic — near lane goes right, far lane goes left.
    car(-6, -6.2, 1, '#c94f5f'); car(17, -6.2, 1, '#4a7fb0'); car(42, -6.2, 1, '#e0a83a');
    car(6, -8.4, -1, '#3f9d6a'); bus(31, -8.4, -1); car(51, -8.4, -1, '#8f6fd8');
    [2, 16, 30, 44].forEach(function (lx) {
      streetLamp(lx, -3.2);
      tree(lx + 5, -11.8, .62);
    });
    trafficLight(12, -3.6); trafficLight(34, -3.6);
    busStop(43, -2.5);
    for (var bx2 = -4; bx2 <= 50; bx2 += 6) cyl(.07, .42, '#8b97a5', bx2, .21, -3.5);
    [6, 18, 30, 42].forEach(function (mx) {
      cyl(.06, .8, '#5d6b7d', mx, .4, -3.5);
      box(.18, .24, .12, '#3f9d9a', mx, .86, -3.5, true);
    });
    roadSign(8, -2.9, 'BUS', '#3f9d9a');
    roadSign(35, -2.9, 'CITY', '#3f6f9d');
    fence(2, 18, -13.2);
    fence(24, 52, -13.2);
    // People walking on both sidewalks.
    pedestrian(4, -2.6, 1, '#c94f4f');
    pedestrian(22, -2.6, -1, '#4a7fb0');
    pedestrian(40, -2.6, 1, '#3f9d6a');
    pedestrian(10, -11.2, -1, '#e0a83a');
    pedestrian(30, -11.2, 1, '#8f6fd8');
    pedestrian(48, -11.2, -1, '#d4724f');
    // Enhanced north-street landscaping: planters, flower strips and green accents.
    [[-4, -1.5], [4, -1.5], [18, -1.5], [32, -1.5], [46, -1.5]].forEach(function (p, i) {
      box(1.2, .16, .45, '#8b97a5', p[0], .08, p[1]);
      for (var f = 0; f < 3; f++) {
        var nf = new THREE.Mesh(new THREE.SphereGeometry(.085, 6, 5),
          solid(['#ffd27d', '#ff9fc4', '#7fd3a1'][(i + f) % 3], { roughness: .78 }));
        nf.position.set(p[0] - .3 + f * .3, .2, p[1]); addO(nf);
      }
    });
    [[0, -12.2], [16, -12.2], [32, -12.2], [48, -12.2]].forEach(function (p) { plant(p[0], p[1], .75); });
    [[-2, -12.6], [12, -12.6], [24, -12.6], [36, -12.6], [52, -12.6]].forEach(function (p, i) {
      var bed = new THREE.Mesh(new THREE.SphereGeometry(.5, 7, 6), solid('#4f9a55', { roughness: 1 }));
      bed.position.set(p[0], -.14, p[1]); bed.scale.y = .22; addO(bed);
      var ff = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 5), solid(i % 2 ? '#fff1a8' : '#ff9fc4', { roughness: .75 }));
      ff.position.set(p[0] + .12, -.02, p[1]); addO(ff);
    });
  }

  /* The old scene left a 1.6 hemisphere and a purple 26-intensity point light
     glued to scene3d; level3d.clear() could not remove them. Keep ours only. */
  function tameOfficeLights() {
    if (typeof scene3d === 'undefined' || !scene3d) return;
    // ⏱ Cache ang list ng ilaw: dati buong scene (libu-libong mesh) ang
    // tinatrahan 25×/second.once lang maghanap hangga't hindi nagre-rebuild.
    if (!tameOfficeLights._lights || tameOfficeLights._scene !== scene3d) {
      var found = [];
      scene3d.traverse(function (o) { if (o.isLight) found.push(o); });
      tameOfficeLights._lights = found; tameOfficeLights._scene = scene3d;
    }
    tameOfficeLights._lights.forEach(function (o) {
      var mine = o.userData && o.userData.v9Light;
      if (o.isAmbientLight) o.intensity = .58;
      else if (o.isHemisphereLight) o.intensity = .25;
      else if (o.isDirectionalLight) o.intensity = mine ? .32 : .18;
      else if (o.isPointLight) {
        if (!mine) { o.intensity = .12; o.visible = false; }
        else o.intensity = .3;
      }
    });
  }


  // Futuristic skin: neon floor grid + holographic ceiling panels + cool rim lights.
  function futuristicSkin() {


    // Four futuristic approach roads leading out of the HQ (N/S/E/W).
    function approachRoad(x1,z1,x2,z2,accent) {
      var dx=x2-x1, dz=z2-z1, len=Math.sqrt(dx*dx+dz*dz);
      var ang=-Math.atan2(dz,dx);
      var base=new THREE.Mesh(new THREE.BoxGeometry(len,.06,3.2),solid('#2a3446',{roughness:.7,metalness:.18}));
      base.position.set((x1+x2)/2,.02,(z1+z2)/2); base.rotation.y=ang; base.userData.v9=true; addO(base);
      // glowing edge lines
      var off=1.5;
      [-off,off].forEach(function(o){
        var edge=new THREE.Mesh(new THREE.BoxGeometry(len,.02,.08),solid(accent,{emissive:accent,emissiveIntensity:.42}));
        edge.position.set((x1+x2)/2+Math.cos(ang+Math.PI/2)*o,.06,(z1+z2)/2-Math.sin(ang+Math.PI/2)*o);
        edge.rotation.y=ang; edge.userData.v9=true; addO(edge);
      });
      // dashed center line
      for(var t=.05;t<.98;t+=.09){
        var dash=new THREE.Mesh(new THREE.BoxGeometry(len*.045,.02,.12),solid('#9fe8ff',{emissive:'#9fe8ff',emissiveIntensity:.6}));
        dash.position.set(x1+dx*t,.06,z1+dz*t); dash.rotation.y=ang; dash.userData.v9=true; addO(dash);
      }
    }
    // Short roads from the round HQ edge to small agent offices.
    function agentOffice(x, z, col, agents) {
      var base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, .3, 32), solid('#2a3446', { roughness: .7, metalness: .18 }));
      base.position.set(x, .02, z); base.userData.v9 = true; addO(base);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(4.2, .06, 8, 32), solid(col, { emissive: col, emissiveIntensity: .8 }));
      rim.rotation.x = Math.PI / 2; rim.position.set(x, .18, z); rim.userData.v9 = true; addO(rim);
      // small desk + monitor
      box(2.2, .16, 1.0, '#4a5568', x, .32, z);
      box(.06, .4, .06, '#2a3446', x, .6, z-.2);
      var scr = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .7), solid(col, { emissive: col, emissiveIntensity: .6, side: THREE.DoubleSide }));
      scr.position.set(x, .9, z-.22); scr.userData.v9 = true; addO(scr);
      // agents
      var n = agents.length;
      agents.forEach(function (a, i) {
        var ax = x + (i - (n-1)/2) * 1.15, az = z + 1.2;
        var b = new THREE.Mesh(new THREE.SphereGeometry(.28, 10, 8), solid(a[1], { roughness: .45 }));
        b.position.set(ax, .5, az); b.userData.v9 = true; addO(b);
        var hd = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), solid(a[1], { roughness: .4 }));
        hd.position.set(ax, .88, az); hd.userData.v9 = true; addO(hd);
        var c = document.createElement('canvas'); c.width = 200; c.height = 56;
        var q = c.getContext('2d'); q.fillStyle = 'rgba(8,14,28,.85)'; q.fillRect(0,0,200,56);
        q.fillStyle = '#eaf7ff'; q.font = 'bold 26px Arial'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(a[0], 100, 28);
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
        sp.scale.set(1.7, .48, 1); sp.position.set(ax, 1.35, az); sp.userData.v9 = true; addO(sp);
      });
      var lab = document.createElement('canvas'); lab.width = 384; lab.height = 80;
      var lq = lab.getContext('2d'); lq.fillStyle = 'rgba(8,14,28,.85)'; lq.fillRect(0,0,384,80);
      lq.strokeStyle = col; lq.lineWidth = 5; lq.strokeRect(4,4,376,72);
      lq.fillStyle = '#fff'; lq.font = 'bold 32px Arial'; lq.textAlign = 'center'; lq.textBaseline = 'middle'; lq.fillText('AGENT OFFICE', 192, 40);
      var lsp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(lab), transparent: true }));
      lsp.scale.set(5, 1.05, 1); lsp.position.set(x, 2.0, z); lsp.userData.v9 = true; addO(lsp);
    }
    approachRoad(23,-13,23,-26,'#63e6ff');   // north (short)
    agentOffice(23,-26,'#63e6ff',[['Nazira','#f472b6'],['Milia','#f0b429']]);
    approachRoad(23,47,23,60,'#ff8df0');     // south (short)
    agentOffice(23,60,'#ff8df0',[['Rena','#7cf0c8'],['Aria','#63e6ff']]);
    approachRoad(-7,17,-20,17,'#7cf0c8');    // west (short)
    agentOffice(-20,17,'#7cf0c8',[['Kai','#8fa9ff'],['Dan','#22c55e']]);
    approachRoad(53,17,66,17,'#b07cff');     // east (short)
    agentOffice(66,17,'#b07cff',[['Faris','#c9a227'],['Hanna','#e8d9a0']]);


    if (!level3d || !structureGroup) return;
    var neon = ['#63e6ff', '#b07cff', '#ff8df0', '#7cf0c8'];
    // Glowing floor grid over the main HQ floor (x 0..46, z 0..34)
    for (var gx = 1; gx < 46; gx += 3) {
      box(.035, .012, 33, solid(gx % 2 ? '#63e6ff' : '#b07cff', { emissive: gx % 2 ? '#63e6ff' : '#b07cff', emissiveIntensity: .55, roughness: .3 }), gx, .014, 17);
    }
    for (var gz = 1; gz < 34; gz += 3) {
      box(45, .012, .035, solid(gz % 2 ? '#7cf0c8' : '#ff8df0', { emissive: gz % 2 ? '#7cf0c8' : '#ff8df0', emissiveIntensity: .5, roughness: .3 }), 23, .015, gz);
    }
    // Holographic ceiling strips
    for (var hx = 5; hx <= 42; hx += 9) {
      var strip = new THREE.Mesh(new THREE.PlaneGeometry(5.2, .5),
        new THREE.MeshBasicMaterial({ color: neon[(hx / 9) % neon.length | 0], transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false }));
      strip.rotation.x = Math.PI / 2; strip.position.set(hx, 3.05, 17); strip.userData.v9 = true; addO(strip);
    }
    // Cool rim lights along the walls (stronger than the warm guard lights, but guards stay)
    [[1, 2.5, 9], [45, 2.5, 9], [1, 2.5, 25], [45, 2.5, 25]].forEach(function (p, i) {
      var l = new THREE.PointLight(new THREE.Color(neon[i % neon.length]), .45, 30);
      l.position.set(p[0], p[1], p[2]); l.userData.v9Light = true; addO(l);
    });
    // Neon entrance portal ring
    var portal = new THREE.Mesh(new THREE.TorusGeometry(2.4, .07, 8, 40),
      solid('#63e6ff', { emissive: '#63e6ff', emissiveIntensity: 1.0, roughness: .2 }));
    portal.position.set(23, 2.1, .4); portal.userData.v9 = true; addO(portal);
    animParts.push({ m: portal, k: 'led', p: .2 });
    try {
      var c = document.createElement('canvas'); c.width = 512; c.height = 96;
      var q = c.getContext('2d');
      q.fillStyle = 'rgba(8,14,28,.7)'; q.fillRect(0,0,512,96);
      q.strokeStyle = '#63e6ff'; q.lineWidth = 5; q.strokeRect(5,5,502,86);
      q.fillStyle = '#9fffa8'; q.font = 'bold 36px Arial'; q.textAlign = 'center'; q.textBaseline = 'middle';
      q.fillText('CYBORG CHEEBEE  //  NEON HQ', 256, 48);
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
      s.scale.set(8, 1.5, 1); s.position.set(23, 3.4, .5); s.userData.v9 = true; addO(s);
    } catch (e) {}
  }


  // ---------- REFERENCE AI OFFICE SYSTEM (YouTube-style) ----------
  function refLabel(text, color, x, y, z, w, h) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 112;
    var q = c.getContext('2d');
    if (q.roundRect) { q.beginPath(); q.roundRect(4, 4, 504, 104, 26); q.fillStyle = 'rgba(8,12,26,.9)'; q.fill(); }
    else { q.fillStyle = 'rgba(8,12,26,.9)'; q.fillRect(4,4,504,104); }
    q.strokeStyle = color || '#63e6ff'; q.lineWidth = 5;
    if (q.roundRect) { q.beginPath(); q.roundRect(4,4,504,104,26); q.stroke(); } else q.strokeRect(4,4,504,104);
    q.fillStyle = '#eaf7ff'; q.font = 'bold 44px Arial'; q.textAlign = 'center'; q.textBaseline = 'middle';
    q.fillText(text, 256, 58);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
    sp.scale.set(w || 6, h || 1.3, 1); sp.position.set(x, y, z); sp.userData.v9 = true; addO(sp);
    return sp;
  }
  // ===== LIVING ROBOT EMPLOYEES — articulated walkers with autonomous AI =====
  var walkers = [];      // all living robots
  var navZones = [];     // walkable island zones {x,z,r}
  var navBridges = [];   // {x1,z1,x2,z2}
  var WALK_PHRASES = ['Kumusta!','Sige, boss!','Copy that!','Ano’ng balita?','Nice!','Mag-andar tayo!','Got it!','Hi! 👋'];


  // Role detection from name → visual accessory
  function botRole(name){
    var n=(name||'').toLowerCase();
    if(/nazira|ceo|manager|chief|cos/.test(n)) return 'boss';
    if(/milia|marketing|zara|marco/.test(n)) return 'creative';
    if(/rena|aria|data|insight|seo/.test(n)) return 'analyst';
    if(/kai|dan|systems|fixer|bantay|security/.test(n)) return 'tech';
    if(/faris|hanna|finance/.test(n)) return 'finance';
    if(/hafiz|lara|sophia|people|customer|community/.test(n)) return 'care';
    if(/chef/.test(n)) return 'chef';
    if(/doctor|health/.test(n)) return 'doctor';
    if(/dj/.test(n)) return 'dj';
    if(/janitor|clean/.test(n)) return 'janitor';
    return 'worker';
  }
  function refBot(x, z, color, name) {
    var g = new THREE.Group(); g.position.set(x, -0.02, z); g.scale.setScalar(1.28); g.userData.v9 = true; structureGroup.add(g);
    var role=botRole(name);
    var uniform=(currentTeam&&currentTeam.color)||color;   // TEAM UNIFORM COLOR
    var teamName=(currentTeam&&currentTeam.name)||'TEAM';
    var body = new THREE.Group(); g.add(body);
    // BIG round belly (chibi), short body — dwarf proportions
    var torso = new THREE.Mesh(new THREE.SphereGeometry(.5,14,12), solid(color,{roughness:.4,metalness:.08,emissive:color,emissiveIntensity:.45}));
    torso.position.y=.48; torso.scale.set(1.15,.95,1.05); torso.userData.v9=true; body.add(torso);
    var tummy = new THREE.Mesh(new THREE.SphereGeometry(.38,12,10), solid(color,{roughness:.42,metalness:.06,emissive:color,emissiveIntensity:.5}));
    tummy.position.set(0,.44,.30); tummy.scale.set(1,.8,.6); tummy.userData.v9=true; body.add(tummy);
    var belly = new THREE.Mesh(new THREE.CircleGeometry(.24,12), solid('#1a2740',{emissive:color,emissiveIntensity:.75}));
    belly.position.set(0,.44,.62); belly.userData.v9=true; body.add(belly);
    // BIG head (chibi) sitting low on the body
    var head = new THREE.Group(); head.position.y=1.02; head.scale.setScalar(1.1); body.add(head);
    var skull = new THREE.Mesh(new THREE.SphereGeometry(.40,14,12), solid(color,{roughness:.38,metalness:.08,emissive:color,emissiveIntensity:.42}));
    skull.userData.v9=true; head.add(skull);
    [-1,1].forEach(function(s){
      var e=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6), solid('#0b1020'));
      e.position.set(s*.13,.05,.35); e.userData.v9=true; head.add(e);
      var glint=new THREE.Mesh(new THREE.SphereGeometry(.026,6,6), solid('#ffffff'));
      glint.position.set(s*.13-.012,.075,.40); glint.userData.v9=true; head.add(glint);
    });
    var smile=new THREE.Mesh(new THREE.TorusGeometry(.12,.022,6,12,Math.PI), solid('#101826'));
    smile.rotation.z=Math.PI; smile.position.set(0,-.09,.37); smile.userData.v9=true; head.add(smile);
    [-1,1].forEach(function(sx){var ch=new THREE.Mesh(new THREE.SphereGeometry(.05,6,6),solid('#ff9fb0',{emissive:'#ff9fb0',emissiveIntensity:.3}));ch.position.set(sx*.24,-.06,.33);ch.userData.v9=true;head.add(ch);});
    // tiny antenna
    var ant=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.16,6),solid('#2a3446')); ant.position.set(0,.44,0); ant.userData.v9=true; head.add(ant);
    var tip=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),solid('#ffd34d',{emissive:'#ffd34d',emissiveIntensity:.9})); tip.position.set(0,.54,0); tip.userData.v9=true; head.add(tip);
    // SHORT stubby arms
    var armL=new THREE.Group(); armL.position.set(-.56,.60,0); body.add(armL);
    var armR=new THREE.Group(); armR.position.set(.56,.60,0); body.add(armR);
    [armL,armR].forEach(function(a){
      var upper=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.26,8),solid(uniform,{roughness:.5})); upper.position.y=-.13; upper.userData.v9=true; a.add(upper);
      var hand=new THREE.Mesh(new THREE.SphereGeometry(.10,8,6),solid('#f2eee4',{roughness:.6})); hand.position.y=-.28; hand.userData.v9=true; a.add(hand);
    });
    // SHORT stubby legs (dwarf)
    var legL=new THREE.Group(); legL.position.set(-.22,.30,0); g.add(legL);
    var legR=new THREE.Group(); legR.position.set(.22,.30,0); g.add(legR);
    [legL,legR].forEach(function(l){
      var shin=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.22,8),solid('#2f3a4e',{roughness:.5})); shin.position.y=-.11; shin.userData.v9=true; l.add(shin);
      var foot=new THREE.Mesh(new THREE.BoxGeometry(.26,.09,.34),solid('#202b3e',{roughness:.6})); foot.position.set(0,-.24,.05); foot.userData.v9=true; l.add(foot);
    });
    // ---- ROLE-SPECIFIC ACCESSORIES ----
    if(role==='boss'){
      var crown=new THREE.Mesh(new THREE.CylinderGeometry(.24,.30,.18,8),solid('#ffd34d',{emissive:'#ffd34d',emissiveIntensity:.7}));crown.position.y=.48;crown.userData.v9=true;head.add(crown);
    }
    if(role==='analyst'){
      [-1,1].forEach(function(sx){var lens=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,6,12),solid('#63e6ff',{emissive:'#63e6ff',emissiveIntensity:.6}));lens.position.set(sx*.13,.05,.36);lens.userData.v9=true;head.add(lens);});
    }
    if(role==='tech'){
      var badge=new THREE.Mesh(new THREE.BoxGeometry(.24,.16,.02),solid('#5fa8ff',{emissive:'#5fa8ff',emissiveIntensity:.5}));badge.position.set(0,.55,.55);badge.userData.v9=true;body.add(badge);
    }
    if(role==='finance'){
      var glasses=new THREE.Mesh(new THREE.BoxGeometry(.5,.04,.04),solid('#d8c860',{metalness:.6}));glasses.position.set(0,.06,.37);glasses.userData.v9=true;head.add(glasses);
    }
    if(role==='creative'){
      var hat=new THREE.Mesh(new THREE.ConeGeometry(.32,.32,10),solid('#ff8fb1',{roughness:.7}));hat.position.y=.48;hat.userData.v9=true;head.add(hat);
    }
    if(role==='chef'){
      var chef=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.30,12),solid('#ffffff',{roughness:.7}));chef.position.y=.50;chef.userData.v9=true;head.add(chef);
    }
    if(role==='doctor'){
      var cross1=new THREE.Mesh(new THREE.BoxGeometry(.22,.07,.02),solid('#ffffff',{emissive:'#ff5c7a',emissiveIntensity:.5}));cross1.position.set(0,.6,.55);cross1.userData.v9=true;body.add(cross1);
      var cross2=new THREE.Mesh(new THREE.BoxGeometry(.07,.22,.02),solid('#ffffff',{emissive:'#ff5c7a',emissiveIntensity:.5}));cross2.position.set(0,.6,.55);cross2.userData.v9=true;body.add(cross2);
    }
    if(role==='dj'){
      var hp1=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),solid('#2a1a3a',{metalness:.4}));hp1.position.set(-.40,.05,0);hp1.userData.v9=true;head.add(hp1);
      var hp2=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),solid('#2a1a3a',{metalness:.4}));hp2.position.set(.40,.05,0);hp2.userData.v9=true;head.add(hp2);
    }
    if(role==='care'){
      var heart=new THREE.Mesh(new THREE.SphereGeometry(.08,8,8),solid('#ff8fb1',{emissive:'#ff8fb1',emissiveIntensity:.42}));heart.position.set(0,.6,.55);heart.userData.v9=true;body.add(heart);
    }
    // carried project — glowing datapad
    var project=new THREE.Group(); project.position.set(0,1.1,.72); project.visible=false; project.userData.v9=true; body.add(project);
    var prjBody=new THREE.Mesh(new THREE.BoxGeometry(.44,.38,.28),solid('#ffd34d',{emissive:'#ffd34d',emissiveIntensity:1.2,roughness:.2,metalness:.4}));prjBody.userData.v9=true;project.add(prjBody);
    var prjGlow=new THREE.Mesh(new THREE.TorusGeometry(.32,.045,8,20),solid('#fff3b0',{emissive:'#fff3b0',emissiveIntensity:1.4}));prjGlow.position.z=.18;prjGlow.userData.v9=true;project.add(prjGlow);
    // chest screen
    // TEAM UNIFORM STRIPE (department color band across the chest)
    var stripe=new THREE.Mesh(new THREE.TorusGeometry(.47,.055,6,18,Math.PI),
      solid(uniform,{emissive:uniform,emissiveIntensity:.85,roughness:.25}));
    stripe.rotation.z=Math.PI; stripe.rotation.y=Math.PI/2; stripe.position.set(0,.52,.06); stripe.userData.v9=true; body.add(stripe);
    // ROLE NAME printed ON THE UNIFORM (chest badge with real text)
    var roleLabel=(role||'TEAM').toUpperCase();
    var roleCv=document.createElement('canvas'); roleCv.width=256; roleCv.height=64;
    var rq=roleCv.getContext('2d');
    rq.fillStyle='rgba(6,14,28,.92)'; rq.beginPath();
    if(rq.roundRect){rq.roundRect(4,4,248,56,12);rq.fill();rq.strokeStyle=color;rq.lineWidth=3;rq.stroke();}
    else {rq.fillRect(4,4,248,56);rq.strokeStyle=color;rq.lineWidth=3;rq.strokeRect(4,4,248,56);}
    rq.fillStyle='#ffffff'; rq.font='bold 30px Arial'; rq.textAlign='center'; rq.textBaseline='middle';
    rq.fillText(roleLabel,128,33);
    var chest=new THREE.Mesh(new THREE.PlaneGeometry(.62,.16),
      new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(roleCv),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    chest.position.set(0,.58,.64); chest.userData.v9=true; body.add(chest);
    // backpack
    var pack=new THREE.Mesh(new THREE.BoxGeometry(.36,.32,.18),solid('#2a3550',{roughness:.5,metalness:.4}));pack.position.set(0,.60,-.42);pack.userData.v9=true;body.add(pack);
    // joint rings
    [armL,armR,legL,legR].forEach(function(j){var ring=new THREE.Mesh(new THREE.TorusGeometry(.075,.02,6,10),solid(color,{emissive:color,emissiveIntensity:.45}));ring.rotation.x=Math.PI/2;ring.position.y=-.2;j.add(ring);});
    if (name) refLabel(name, color, x, 2.15, z, 3.0, .7);
    var bub = new THREE.Sprite(new THREE.SpriteMaterial({map:makeBubbleTex('…'),transparent:true,depthTest:false}));
    bub.scale.set(2.4,.7,1); bub.position.set(0,2.5,0); bub.visible=false; bub.userData.v9=true; g.add(bub);
    animParts.push({m:belly,k:'led',p:x*.7+z});
    var seed = walkers.length;
    var r = {
      g:g, body:body, head:head, armL:armL, armR:armR, legL:legL, legR:legR, belly:belly, tip:tip, bub:bub, project:project,
      x:x, z:z, homeX:x, homeZ:z, color:color, uniform:uniform, team:teamName, name:name||'Bot', role:role,
      phase:seed*1.7, speed:.9+(seed%4)*.18, personality:seed%5, tl:(seed%5===0||seed%5===3)?2.6:1,
      state:'work', timer:Date.now()-1000+seed*40, wp:null, path:[], zone:null, partner:null, talkFor:0,
      blink:0, look:0, lastBubble:0, decisionAt:Date.now()-500+seed*30
    };
    walkers.push(r);
    return g;
  }

  function now0(){ return (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now(); }
  function makeBubbleTex(txt){
    var c=document.createElement('canvas'); c.width=256; c.height=80;
    var q=c.getContext('2d');
    q.fillStyle='rgba(255,255,255,.96)';
    if(q.roundRect){q.beginPath();q.roundRect(6,6,244,60,22);q.fill();}
    else q.fillRect(6,6,244,60);
    q.beginPath();q.moveTo(96,64);q.lineTo(118,64);q.lineTo(104,78);q.closePath();q.fill();
    q.fillStyle='#14203a';q.font='bold 30px Arial';q.textAlign='center';q.textBaseline='middle';
    q.fillText(String(txt).slice(0,18),128,36);
    return new THREE.CanvasTexture(c);
  }
  function navAddZone(x,z,r){ navZones.push({x:x,z:z,r:r}); return navZones.length-1; }
  function navAddBridge(x1,z1,x2,z2){ navBridges.push({x1:x1,z1:z1,x2:x2,z2:z2}); }
  function pointInZone(x,z,i,margin){ var z0=navZones[i]; margin=margin||0; return Math.hypot(x-z0.x,z-z0.z) <= z0.r-margin; }
  function onBridge(x,z){
    for(var i=0;i<navBridges.length;i++){
      var b=navBridges[i],dx=b.x2-b.x1,dz=b.z2-b.z1,L=dx*dx+dz*dz; if(!L)continue;
      var t=Math.max(0,Math.min(1,((x-b.x1)*dx+(z-b.z1)*dz)/L));
      var px=b.x1+dx*t,pz=b.z1+dz*t;
      if(Math.hypot(x-px,z-pz)<1.6)return true;
    }
    return false;
  }
  function walkable(x,z){
    for(var i=0;i<navZones.length;i++) if(pointInZone(x,z,i,0.3)) return true;
    return onBridge(x,z);
  }
  function randomPointInZone(i,margin){
    var z0=navZones[i], rad=(z0.r-(margin||1.6))*Math.sqrt(Math.random()), a=Math.random()*Math.PI*2;
    return {x:z0.x+Math.cos(a)*rad, z:z0.z+Math.sin(a)*rad};
  }
  function bridgePath(fromZone,toZone){
    var pts=[];
    if(fromZone===toZone) return [randomPointInZone(toZone)];
    var f=navZones[fromZone], t=navZones[toZone], hub=navZones[0];
    pts.push({x:f.x,z:f.z});
    pts.push({x:hub.x,z:hub.z});
    pts.push({x:t.x,z:t.z});
    pts.push(toZone===0 ? {x:0,z:0} : randomPointInZone(toZone));
    return pts;
  }
  function setWalk(r, path){ r.path=path.slice(); r.wp=r.path.shift()||null; r.state='walk'; }

  function walkerTick(now, dt){
    if(!walkers.length) return;
    for(var i=0;i<walkers.length;i++){
      var r=walkers[i];
      if(now>=r.decisionAt){ decideWalker(r,now); r.decisionAt=now+1500+(r.personality%5)*480+Math.random()*900; }
      var moving=(r.state==='walk'||r.state==='travel'||r.state==='submit') && r.wp;
      if(moving){
        var dx=r.wp.x-r.x, dz=r.wp.z-r.z, d=Math.hypot(dx,dz);
        if(d<0.35){
          if(r.path.length) r.wp=r.path.shift();
          else { r.wp=null;
            if(r.state==='submit'){
              // reached Command portal — submit the project
              r.state='submitHold'; r.timer=now+2200+Math.random()*1200;
              if(r.project){ r.project.visible=false; }
              if(typeof portalPulse==='function') portalPulse(r.x,r.z,r.color);
              if(typeof teleportProject==='function') teleportProject(r.x,r.z,r.color);
              if(r.bub){ try{r.bub.material.map.dispose();r.bub.material.map=makeBubbleTex('Submitted!');r.bub.visible=true;r.lastBubble=now;}catch(e){} }
            } else { r.state=r.zone&&r.zone!==0?'work':'idle'; r.timer=now+9000+Math.random()*14000; }
          }
        } else {
          var want=Math.atan2(dx,dz), cur=r.g.rotation.y;
          var diff=Math.atan2(Math.sin(want-cur),Math.cos(want-cur));
          r.g.rotation.y = cur + Math.max(-.1,Math.min(.1,diff*.2));
          var step=Math.min(r.speed*(r.tl||1)*dt,d), nx=r.x+(dx/d)*step, nz=r.z+(dz/d)*step;
          if(walkable(nx,nz)){ r.x=nx; r.z=nz; var oldPhase=r.phase; r.phase+=step*7*(r.tl||1); if(Math.floor(r.phase/Math.PI)>Math.floor(oldPhase/Math.PI)&&typeof footRing==='function') footRing(r.x,r.z,r.color); r._blocked=0; }
          else {
            // try sliding along axes; never abandon the whole path on one blocked step
            var moved=false;
            if(walkable(nx,r.z)){ r.x=nx; moved=true; }
            else if(walkable(r.x,nz)){ r.z=nz; moved=true; }
            if(moved) r.phase+=step*5;
            r._blocked=(r._blocked||0)+1;
            if(r._blocked>50){ r.wp=null; r.state='idle'; r.timer=now+900; r._blocked=0; }
          }
        }
      }
      var walkAmp=moving?0.62:0, sw=Math.sin(r.phase)*walkAmp;
      r.legL.rotation.x=sw; r.legR.rotation.x=-sw;
      r.armL.rotation.x=-sw*.7; r.armR.rotation.x=sw*.7;
      r.body.position.y=Math.abs(Math.sin(r.phase))*.045*walkAmp + (moving?0:Math.sin(now/500+r.personality)*.02);
      if(r.state==='talk'&&r.partner) r.head.rotation.y=Math.atan2(r.partner.x-r.x,r.partner.z-r.z)-r.g.rotation.y;
      else if(!moving) r.head.rotation.y=Math.sin(now/900+r.personality)*.35;
      else r.head.rotation.y*=.9;
      r.blink=(now%4300)<130?.15:1; r.head.scale.y=r.blink;
      if(r.belly.material) r.belly.material.emissiveIntensity=.3+.35*(.5+.5*Math.sin(now/300+r.personality));
      if(r.project){ r.project.visible=(r.state==='submit'); if(r.project.visible){ r.project.rotation.y+=dt*2; r.project.position.y=1.05+Math.sin(now/200)*.05; } }
      // WORK POSE at computer: face the monitor, sit lower, typing arms
      if(r.state==='work' && r.zone && r.zone!==0){
        var wx=r.homeX, wz=r.homeZ;
        r.x += (wx-r.x)*Math.min(1,dt*2.5); r.z += (wz-r.z)*Math.min(1,dt*2.5);
        r.g.rotation.y += (Math.PI - r.g.rotation.y)*Math.min(1,dt*2.5); // face -Z toward monitor
        r.body.position.y=-.10;
        r.armL.rotation.x=-.9+Math.sin(now/90)*.18;
        r.armR.rotation.x=-.9+Math.sin(now/90+1)*.18;
        r.head.rotation.x=.12;
      } else {
        r.body.position.y = (moving?0:Math.sin(now/500+r.personality)*.02);
        r.head.rotation.x*=.9;
      }
      if(r.bub&&r.bub.visible&&now-r.lastBubble>3800) r.bub.visible=false;
      r.g.position.set(r.x,-0.04,r.z);
    }
    for(var a=0;a<walkers.length;a++) for(var b=a+1;b<walkers.length;b++){
      var A=walkers[a],B=walkers[b];
      if(A.state==='talk'||B.state==='talk'||A.state==='walk'||B.state==='walk')continue;
      if(Math.random()<.008 && Math.hypot(A.x-B.x,A.z-B.z)<1.8){
        A.state=B.state='talk';A.partner=B;B.partner=A;
        A.talkFor=B.talkFor=now+2600+Math.random()*2000;
        var ph=WALK_PHRASES[(Math.random()*WALK_PHRASES.length)|0];
        try{A.bub.material.map.dispose();A.bub.material.map=makeBubbleTex(ph);A.bub.visible=true;A.lastBubble=now;
            B.bub.material.map.dispose();B.bub.material.map=makeBubbleTex('OK!');B.bub.visible=true;B.lastBubble=now;}catch(e){}
      }
    }
  }
  function decideWalker(r,now){
    if(r.state==='submitHold'){ if(now>r.timer){ setWalk(r,[{x:r.homeX,z:r.homeZ}]); r.zone=zoneOfPoint(r.homeX,r.homeZ); } return; }
    if(r.state==='talk'){ if(now>r.talkFor){r.state='idle';r.partner=null;r.timer=now+1200;} return; }
    if((r.state==='walk'||r.state==='submit'||r.state==='submitHold'||r.state==='meeting'||r.state==='dance'||r.state==='parade')&&r.wp) return;
    if((r.state==='work'||r.state==='idle')&&now<r.timer) return;
    var p=Math.random();
    if(p<.34){ setWalk(r,[randomPointInZone(r.zone!=null?r.zone:0,1.8)]); }
    else if(p<.48 && (r.zone==null||r.zone!==0)){
      // SUBMIT PROJECT: walk through bridges to the Command portal at center
      setWalk(r, bridgePath(r.zone!=null?r.zone:0, 0));
      r.state='submit';   // set after setWalk (which sets state='walk')
      r.zone=0;
    }
    else if(p<.60){
      var cand=walkers.filter(function(o){return o!==r&&o.zone===r.zone;});
      if(cand.length){var c=cand[(Math.random()*cand.length)|0];setWalk(r,[{x:c.x+1.1,z:c.z+0.7}]);}
      else setWalk(r,[randomPointInZone(r.zone!=null?r.zone:0)]);
    } else if(p<.76){
      var from=(r.zone!=null?r.zone:0), to=(Math.random()*navZones.length)|0;
      if(to===from)to=(to+1)%navZones.length;
      setWalk(r,bridgePath(from,to)); r.zone=to; r.state='travel';
    } else if(p<.90){ setWalk(r,[{x:r.homeX,z:r.homeZ}]); }
    else { r.state='idle'; r.timer=now+1600+Math.random()*2600; }
  }

  function refDesk(x,z,color) {
    box(1.8,.14,.9,solid('#4b5a70',{roughness:.6,metalness:.2}),x,.30,z);
    box(.08,.42,.08,'#2a3446',x,.60,z-.22);
    var scr=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.9), solid(color,{emissive:color,emissiveIntensity:.95,side:THREE.DoubleSide}));
    scr.position.set(x,.92,z-.24); scr.userData.v9=true; addO(scr);
    // keyboard + mouse
    box(.65,.03,.22,solid('#cfd8e6',{roughness:.5}),x,.40,z+.14);
    box(.13,.03,.19,solid('#cfd8e6',{roughness:.5}),x+.45,.40,z+.14);
    var mug=new THREE.Mesh(new THREE.CylinderGeometry(.09,.08,.16,8),solid('#f2eee4',{roughness:.5})); mug.position.set(x-.5,.46,z+.16); mug.userData.v9=true; addO(mug);
    // ACTUAL COMPUTER (CPU tower) beside the desk
    var pc=new THREE.Group(); pc.position.set(x+.95,.58,z-.05); pc.userData.v9=true; structureGroup.add(pc);
    var cse=new THREE.Mesh(new THREE.BoxGeometry(.52,.9,.78),solid('#1e2839',{roughness:.4,metalness:.55}));
    cse.userData.v9=true; pc.add(cse);
    var side=new THREE.Mesh(new THREE.PlaneGeometry(.44,.74),solid(color,{emissive:color,emissiveIntensity:.55,transparent:true,opacity:.6,side:THREE.DoubleSide}));
    side.rotation.y=Math.PI/2; side.position.x=.27; side.userData.v9=true; pc.add(side);
    var led=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),solid('#3dff9e',{emissive:'#3dff9e',emissiveIntensity:1.5}));
    led.position.set(-.27,.28,.28); led.userData.v9=true; pc.add(led);
    animParts.push({m:led,k:'led',p:x*.5+z});
    for(var v=0;v<4;v++){ var vent=new THREE.Mesh(new THREE.BoxGeometry(.32,.02,.02),solid('#3a4a63')); vent.position.set(-.27,-.1-v*.1,.1); vent.userData.v9=true; pc.add(vent); }
  }
  var currentTeam={name:'',color:'#63e6ff'};
  function refIsland(cx,cz,R,color,title,agents) {
    currentTeam={name:title,color:color};
    // SOLID GROUND: thick slab + visible top surface so robots stand on real floor
    var slab=new THREE.Mesh(new THREE.CylinderGeometry(R,R*.9,1.2,32), solid('#171a22',{roughness:.75,metalness:.15}));
    slab.position.set(cx,-.6,cz); slab.userData.v9=true; addO(slab);
    var top=new THREE.Mesh(new THREE.CircleGeometry(R*.9,32), solid('#20242e',{roughness:.8,metalness:.12,side:THREE.DoubleSide}));
    top.rotation.x=-Math.PI/2; top.position.set(cx,.01,cz); top.userData.v9=true; addO(top);
    var rim=new THREE.Mesh(new THREE.TorusGeometry(R*1.01,.06,8,32), solid(color,{emissive:color,emissiveIntensity:.85,roughness:.3}));
    rim.rotation.x=Math.PI/2; rim.position.set(cx,0,cz); rim.userData.v9=true; addO(rim);
    var n=agents.length;
    agents.forEach(function(a,i){
      var ox=(i-(n-1)/2)*2.8;
      refDesk(cx+ox,cz+1.1,color);
      refBot(cx+ox,cz+2.0,a[1],a[0]);
    });
    // plant + whiteboard
    var p=new THREE.Mesh(new THREE.CylinderGeometry(.2,.17,.28,8),solid('#8b5e34',{roughness:.7})); p.position.set(cx-R*.5,.16,cz+R*.33); p.userData.v9=true; addO(p);
    var l=new THREE.Mesh(new THREE.SphereGeometry(.28,8,6),solid('#4f9e5c',{roughness:.8})); l.scale.y=.72; l.position.set(cx-R*.5,.5,cz+R*.33); l.userData.v9=true; addO(l);
    var bx=cx+R*.5, bz=cz-R*.3;
    box(.06,1.2,.06,'#8792a6',bx,.6,bz); box(.06,1.2,.06,'#8792a6',bx+1.5,.6,bz);
    var bd=new THREE.Mesh(new THREE.PlaneGeometry(3.0,1.5),solid('#0e1b2c',{emissive:color,emissiveIntensity:.12,side:THREE.DoubleSide}));
    bd.position.set(bx+.75,1.3,bz); bd.userData.v9=true; addO(bd);
    // Department signs removed - one big CYBEE board only.
  }
  // High-tech walkway: clean lanes, no conflicting direction.
  function refBridge(x1,z1,x2,z2,color) {
    var dx=x2-x1,dz=z2-z1,len=Math.sqrt(dx*dx+dz*dz),ang=-Math.atan2(dz,dx);
    var mx=(x1+x2)/2, mz=(z1+z2)/2;
    var base=new THREE.Mesh(new THREE.BoxGeometry(len,.12,2.8),solid('#253047',{roughness:.6,metalness:.3}));
    base.position.set(mx,-.08,mz); base.rotation.y=ang; base.userData.v9=true; addO(base);
    var surf=new THREE.Mesh(new THREE.BoxGeometry(len,.02,2.5),solid('#3a4862',{roughness:.55,metalness:.35}));
    surf.position.set(mx,.01,mz); surf.rotation.y=ang; surf.userData.v9=true; addO(surf);
    // twin glowing lane lines (symmetric — no direction implied)
    [-.85,.85].forEach(function(off){
      var line=new THREE.Mesh(new THREE.BoxGeometry(len,.015,.06),solid(color,{emissive:color,emissiveIntensity:.42}));
      var ox=Math.sin(ang)*off, oz=Math.cos(ang)*off;
      line.position.set(mx+ox,.025,mz+oz); line.rotation.y=ang; line.userData.v9=true; addO(line);
    });
    // side handrails (static, futuristic)
    [-1,1].forEach(function(side){
      var off=1.42, rx=Math.sin(ang)*off, rz=Math.cos(ang)*off;
      var rail=new THREE.Mesh(new THREE.BoxGeometry(len,.06,.07),solid('#8fa9c4',{roughness:.3,metalness:.6,emissive:color,emissiveIntensity:.3}));
      rail.position.set(mx+rx,.5,mz+rz); rail.rotation.y=ang; rail.userData.v9=true; addO(rail);
      for(var t=.05;t<=.96;t+=.2){
        var post=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.5,6),solid('#6a7a98',{metalness:.5}));
        post.position.set(x1+dx*t+rx,.26,z1+dz*t+rz); post.userData.v9=true; addO(post);
      }
    });
  }

  // ===== 3D DEPTH ENHANCEMENT (low-poly, perf-safe, no shadows) =====
  var fx3d = { pulses: [], dust: null, holo: [], cores: [] };
  function holoTexture(color, text){
    var c=document.createElement('canvas'); c.width=256; c.height=256;
    var q=c.getContext('2d');
    q.clearRect(0,0,256,256);
    q.strokeStyle=color; q.lineWidth=3; q.globalAlpha=.75;
    q.beginPath(); q.arc(128,128,110,0,Math.PI*2); q.stroke();
    q.beginPath(); q.arc(128,128,80,0,Math.PI*2); q.stroke();
    for(var i=0;i<12;i++){var a=i/12*Math.PI*2;q.beginPath();q.moveTo(128+Math.cos(a)*84,128+Math.sin(a)*84);q.lineTo(128+Math.cos(a)*106,128+Math.sin(a)*106);q.stroke();}
    q.fillStyle=color; q.font='bold 30px Arial'; q.textAlign='center'; q.textBaseline='middle';
    q.fillText(text||'',128,128);
    return new THREE.CanvasTexture(c);
  }

  // ===== MAX ENHANCEMENT LAYER =====
  var maxfx = { drones:[], scanners:[], billboards:[], rings:[] };
  function dataPanelTexture(color, title, rows){
    var c=document.createElement('canvas'); c.width=512; c.height=512;
    var q=c.getContext('2d');
    q.fillStyle='#050a12'; q.fillRect(0,0,512,512);
    var grd=q.createLinearGradient(0,0,0,512); grd.addColorStop(0,'#0d2b4a'); grd.addColorStop(1,'#070c18');
    q.fillStyle=grd; q.fillRect(0,0,512,512);
    q.strokeStyle=color; q.lineWidth=4; q.strokeRect(6,6,500,500);
    q.fillStyle=color; q.font='bold 62px Arial Black, Arial'; q.textAlign='left'; q.textBaseline='middle';
    q.shadowColor=color; q.shadowBlur=18;
    q.fillText(title||'CYBEE', 26, 62, 460);
    q.shadowBlur=0;
    q.fillStyle='rgba(255,255,255,.75)'; q.font='bold 24px Arial';
    q.fillText('MGA ULAT NG OPISINA  ·  LIVE', 28, 112, 450);
    q.fillStyle='rgba(255,255,255,.2)'; q.fillRect(24,140,464,2);
    q.fillStyle='#7cf0c8'; q.font='bold 25px Arial';
    (rows||[]).slice(0,12).forEach(function(r,i){ q.fillText(r, 30, 174+i*28, 450); });
    q.fillStyle=color; q.fillRect(24,486,12,12);
    return new THREE.CanvasTexture(c);
  }
  function maxEnhance(){
    if(!structureGroup||!level3d) return;
    maxfx.drones.length=0; maxfx.scanners.length=0; maxfx.billboards.length=0; maxfx.rings.length=0;
    var DS=[[-17.6,-24.3,'#f0a040','MARKETING'],[17.6,-24.3,'#4fd6b0','DATA & INSIGHTS'],[-28.5,9.3,'#5fa8ff','SYSTEMS'],[28.5,9.3,'#d8c860','FINANCE'],[0,30,'#ff7fb0','PEOPLE & CUSTOMERS']];
    DS.forEach(function(d,di){
      var x=d[0],z=d[1],col=d[2],nm=d[3],R=10;
      // --- 2 futuristic department towers at back edge (away from walking center) ---
      [ -1, 1 ].forEach(function(side,k){
        var tx=x+side*R*.62, tz=z-R*.55;
        var h=3.2+k*1.1;
        var tower=new THREE.Mesh(new THREE.BoxGeometry(2.0,h,1.6),solid('#2b3548',{roughness:.5,metalness:.35}));
        tower.position.set(tx,h/2,tz); tower.userData.v9=true; addO(tower);
        // glowing window strips
        for(var w=1;w<=3;w++){
          var wy=.6+w*.65;
          var win=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.22),solid(col,{emissive:col,emissiveIntensity:.9,side:THREE.DoubleSide}));
          win.position.set(tx,wy,tz+.82); win.userData.v9=true; addO(win);
        }
        var roof=new THREE.Mesh(new THREE.BoxGeometry(2.2,.12,1.8),solid(col,{emissive:col,emissiveIntensity:.7,roughness:.3}));
        roof.position.set(tx,h+.06,tz); roof.userData.v9=true; addO(roof);
        // antenna
        var ant=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.7,6),solid('#8894a8',{metalness:.6}));
        ant.position.set(tx,h+.38,tz); ant.userData.v9=true; addO(ant);
        var tip=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),solid(col,{emissive:col,emissiveIntensity:1.2}));
        tip.position.set(tx,h+.76,tz); tip.userData.v9=true; addO(tip);
        animParts.push({m:tip,k:'led',p:di+k});
      });
      // --- energy rings around island (counter-rotating) ---
      [0,1].forEach(function(i){
        var ring=new THREE.Mesh(new THREE.TorusGeometry(R*(.72+i*.12),.035,8,48),solid(col,{emissive:col,emissiveIntensity:i?.5:.8,transparent:true,opacity:.55}));
        ring.rotation.x=Math.PI/2; ring.position.set(x,.3+i*.25,z); ring.userData.v9=true; addO(ring);
        maxfx.rings.push(ring);
        animParts.push({m:ring,k:i?'spinFlatR':'spinFlat',s:.2+i*.1});
      });
      // Big report screen removed by CEO request (performance).

      // --- scanner beam sweeping above island ---
      var beam=new THREE.Mesh(new THREE.ConeGeometry(1.5,4,12,1,true),
        new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.10,side:THREE.DoubleSide,depthWrite:false,fog:false}));
      beam.position.set(x,2.0,z); beam.rotation.z=Math.PI; beam.userData.v9=true; addO(beam);
      maxfx.scanners.push({m:beam,x:x,z:z,p:di*1.3});
    });
    // --- patrol drones orbiting the whole campus ---
    for(var i=0;i<8;i++){
      var drone=new THREE.Group();
      var body=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),solid('#8fd8ff',{roughness:.3,metalness:.5,emissive:'#3aa0ff',emissiveIntensity:.4}));
      body.userData.v9=true; drone.add(body);
      [-1,1].forEach(function(sx){
        var rotor=new THREE.Mesh(new THREE.TorusGeometry(.16,.025,6,12),solid('#63e6ff',{emissive:'#63e6ff',emissiveIntensity:.9}));
        rotor.rotation.x=Math.PI/2; rotor.position.set(sx*.28,.02,0); rotor.userData.v9=true; drone.add(rotor);
      });
      var light=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),solid('#ff8df0',{emissive:'#ff8df0',emissiveIntensity:1.2}));
      light.position.y=-.2; light.userData.v9=true; drone.add(light);
      drone.userData.v9=true; structureGroup.add(drone);
      maxfx.drones.push({g:drone,r:30+i*1.5,a:Math.random()*Math.PI*2,sp:.12+Math.random()*.06,y:7+i*.6});
    }
    // --- enhanced command: layered floating platform + tall energy column + halo ---
    for(var L=0;L<3;L++){
      var pl=new THREE.Mesh(new THREE.CylinderGeometry(4.6-L*.9,4.6-L*.9,.10,8),solid('#6a5bd0',{roughness:.3,metalness:.4,emissive:'#6a5bd0',emissiveIntensity:.4,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false}));
      pl.rotation.y=Math.PI/8; pl.position.set(0,1.6+L*.8,0); pl.userData.v9=true; addO(pl);
    }
    var col=new THREE.Mesh(new THREE.CylinderGeometry(.55,.8,16,20,1,true),
      new THREE.MeshBasicMaterial({color:'#63e6ff',transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false,fog:false}));
    col.position.set(0,8,0); col.userData.v9=true; addO(col);
    animParts.push({m:col,k:'led',p:.9});
    var halo=new THREE.Mesh(new THREE.TorusGeometry(3.2,.06,10,64),solid('#ffd34d',{emissive:'#ffd34d',emissiveIntensity:1.0,roughness:.2}));
    halo.rotation.x=Math.PI/2; halo.position.set(0,4.2,0); halo.userData.v9=true; addO(halo);
    animParts.push({m:halo,k:'spinFlat',s:.3});
    // --- far shooting stars ---
    try{
      var sp=[];
      for(var q=0;q<4;q++){var st=new THREE.Mesh(new THREE.SphereGeometry(.12,6,6),new THREE.MeshBasicMaterial({color:'#ffffff',fog:false}));st.userData.v9=true;addO(st);sp.push(st);}
      maxfx.shooting=sp;
    }catch(e){}
  }
  function tickMax(now,dt){
    try{
      for(var i=0;i<maxfx.drones.length;i++){
        var d=maxfx.drones[i]; d.a+=d.sp*dt;
        d.g.position.set(Math.cos(d.a)*d.r,d.y+Math.sin(now/700+i)*.25,Math.sin(d.a)*d.r);
        d.g.rotation.y=-d.a;
      }
      for(var j=0;j<maxfx.scanners.length;j++){
        var sc=maxfx.scanners[j];
        sc.m.rotation.z=Math.PI+Math.sin(now/1600+sc.p)*.28;
        sc.m.material.opacity=.06+.06*(.5+.5*Math.sin(now/900+sc.p));
      }
      for(var k=0;k<maxfx.billboards.length;k++){
                maxfx.billboards[k].lookAt(camera3d?camera3d.position:new THREE.Vector3(0,20,40));
      }
      if(maxfx.shooting) for(var q=0;q<maxfx.shooting.length;q++){
        var t=(now/3000+q*.27)%1, st=maxfx.shooting[q];
        st.position.set(-80+t*160, 22+Math.sin(q)*6, -90+t*20);
        st.visible=t>.05&&t<.5;
      }
    }catch(e){}
  }

  function enhance3D(){
    if(!structureGroup||!level3d) return;
    fx3d.pulses.length=0; fx3d.holo.length=0; fx3d.cores.length=0;
    // --- planet arc in the far background (like the reference) ---
    try{
      var planet=new THREE.Mesh(new THREE.SphereGeometry(95,32,24),
        new THREE.MeshBasicMaterial({color:'#14294a',transparent:true,opacity:.85,fog:false}));
      planet.position.set(-120,-92,-160); planet.userData.v9=true; addO(planet);
      var atm=new THREE.Mesh(new THREE.SphereGeometry(98,32,24),
        new THREE.MeshBasicMaterial({color:'#4aa8ff',transparent:true,opacity:.10,side:THREE.BackSide,fog:false}));
      atm.position.copy(planet.position); atm.userData.v9=true; addO(atm);
    }catch(e){}
    // --- nebula sprites ---
    try{
      var nc=document.createElement('canvas'); nc.width=256; nc.height=256;
      var nq=nc.getContext('2d');
      var grd=nq.createRadialGradient(128,128,8,128,128,128);
      grd.addColorStop(0,'rgba(90,120,255,.22)'); grd.addColorStop(.5,'rgba(140,70,220,.10)'); grd.addColorStop(1,'rgba(0,0,0,0)');
      nq.fillStyle=grd; nq.fillRect(0,0,256,256);
      var nt=new THREE.CanvasTexture(nc);
      [[-70,-30,-120,1.6],[80,40,-140,1.9],[10,-50,-170,2.2]].forEach(function(p,i){
        var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:nt,transparent:true,depthWrite:false,fog:false,opacity:.9}));
        sp.scale.set(120*p[3],120*p[3],1); sp.position.set(p[0],p[1],p[2]); sp.userData.v9=true; addO(sp);
      });
    }catch(e){}
    // --- under-island glowing cores + vertical corner pylons + floating holograms ---
    function decorateIsland(x,z,R,color,name){
      var cone=new THREE.Mesh(new THREE.ConeGeometry(R*.62,3.4,16), solid('#22304a',{roughness:.7,metalness:.25,emissive:color,emissiveIntensity:.12}));
      cone.rotation.z=Math.PI; cone.position.set(x,-2.2,z); cone.userData.v9=true; addO(cone);
      var core=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0), solid(color,{emissive:color,emissiveIntensity:.9,roughness:.2,transparent:true,opacity:.9}));
      core.position.set(x,-1.4,z); core.userData.v9=true; addO(core);
      fx3d.cores.push(core);
      // 4 corner pylons (outside walkable center radius)
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(q,i){
        var px=x+q[0]*R*.66, pz=z+q[1]*R*.66;
        var pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,1.5,6),solid('#5a6b86',{roughness:.5,metalness:.4}));
        pole.position.set(px,.75,pz); pole.userData.v9=true; addO(pole);
        var lamp=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),solid(color,{emissive:color,emissiveIntensity:1.1,roughness:.2}));
        lamp.position.set(px,1.55,pz); lamp.userData.v9=true; addO(lamp);
        animParts.push({m:lamp,k:'led',p:i+q[0]+x*.1});
      });
      // floating holographic emblem above island
      var holo=new THREE.Mesh(new THREE.PlaneGeometry(4,4),
        new THREE.MeshBasicMaterial({map:holoTexture(color,name.slice(0,3)),transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide,fog:false}));
      holo.position.set(x,3.6,z); holo.userData.v9=true; addO(holo);
      fx3d.holo.push(holo);
      animParts.push({m:holo,k:'spinY',s:.25});
    }
    var DS=[[-17.6,-24.3,'#f0a040','Marketing'],[17.6,-24.3,'#4fd6b0','Data'],[-28.5,9.3,'#5fa8ff','Systems'],[28.5,9.3,'#d8c860','Finance'],[0,30,'#ff7fb0','People']];
    DS.forEach(function(d){ decorateIsland(d[0],d[1],10,d[2],d[3]); });
    // --- Command: floating core + extra height rings ---
    var cc=new THREE.Mesh(new THREE.OctahedronGeometry(.6,0),solid('#8fefff',{emissive:'#63e6ff',emissiveIntensity:1.3,roughness:.15,transparent:true,opacity:.92}));
    cc.position.set(0,3.2,0); cc.userData.v9=true; addO(cc);
    fx3d.cores.push(cc);
    animParts.push({m:cc,k:'spin',s:.7});
    [3.6,4.4].forEach(function(y,i){
      var r=new THREE.Mesh(new THREE.TorusGeometry(1.4+i*.5,.04,8,40),solid(i?'#ff8df0':'#63e6ff',{emissive:i?'#ff8df0':'#63e6ff',emissiveIntensity:1}));
      r.rotation.x=Math.PI/2; r.position.set(0,y,0); r.userData.v9=true; addO(r);
      animParts.push({m:r,k:i?'spinFlatR':'spinFlat',s:.5});
    });
    // --- bridge data pulses (animated dots flowing hub<->islands) ---
    navBridges.forEach(function(b){
      for(var k=0;k<4;k++){
        var dot=new THREE.Mesh(new THREE.SphereGeometry(.09,6,6),solid('#9fe8ff',{emissive:'#9fe8ff',emissiveIntensity:1.2,roughness:.2}));
        dot.userData.v9=true; addO(dot);
        fx3d.pulses.push({m:dot,x1:b.x1,z1:b.z1,x2:b.x2,z2:b.z2,t:Math.random(),sp:.12+Math.random()*.08,dir:Math.random()<.5?1:-1});
      }
    });
    // --- drifting light motes around the whole campus ---
    try{
      var pts=[],N=140;
      for(var i=0;i<N;i++){var a=Math.random()*Math.PI*2,r=8+Math.random()*46;pts.push(Math.cos(a)*r,1+Math.random()*14,Math.sin(a)*r);}
      var g2=new THREE.BufferGeometry(); g2.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
      var dust=new THREE.Points(g2,new THREE.PointsMaterial({color:'#8fd8ff',size:.13,transparent:true,opacity:.55,depthWrite:false,fog:false}));
      dust.userData.v9=true; addO(dust); fx3d.dust=dust;
    }catch(e){}
  }

  // ===== PORTAL PULSE + PROJECT TELEPORT FX =====
  var portalFx=[], telefx=[];
  function portalPulse(x,z,color){
    try{
      for(var i=0;i<3;i++){
        var ring=new THREE.Mesh(new THREE.TorusGeometry(.3,.05,8,24),solid(color||'#ffd34d',{emissive:color||'#ffd34d',emissiveIntensity:1.2,transparent:true,opacity:.9}));
        ring.rotation.x=Math.PI/2; ring.position.set(0,.4+i*.2,0); ring.userData.v9=true; addO(ring);
        portalFx.push({m:ring,t:0,life:900+i*120});
      }
    }catch(e){}
  }
  function tickPortal(now,dt){
    for(var i=portalFx.length-1;i>=0;i--){
      var p=portalFx[i]; p.t+=dt*1000;
      var k=p.t/p.life;
      if(k>=1){ try{p.m.parent&&p.m.parent.remove(p.m);}catch(e){} portalFx.splice(i,1); continue; }
      p.m.scale.setScalar(1+k*5); p.m.material.opacity=.9*(1-k);
    }
  }
  function teleportProject(x,z,color){
    try{
      var beam=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,10,12,1,true),
        new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false,fog:false}));
      beam.position.set(x,5,z); beam.userData.v9=true; addO(beam);
      var cube=new THREE.Mesh(new THREE.BoxGeometry(.45,.45,.45),
        solid(color,{emissive:color,emissiveIntensity:1.4,roughness:.15,transparent:true,opacity:.95}));
      cube.position.set(x,.8,z); cube.userData.v9=true; addO(cube);
      var rings=[];
      for(var i=0;i<3;i++){
        var r=new THREE.Mesh(new THREE.TorusGeometry(.5+i*.2,.04,8,24),solid(color,{emissive:color,emissiveIntensity:1.2}));
        r.rotation.x=Math.PI/2; r.position.set(x,1+i*2,z); r.userData.v9=true; addO(r); rings.push(r);
      }
      // radiant sparkles orbiting the rising project
      var sparks=[];
      for(var k=0;k<12;k++){
        var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:(function(){var c=document.createElement('canvas');c.width=32;c.height=32;var q=c.getContext('2d');var g=q.createRadialGradient(16,16,1,16,16,16);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,220,120,.8)');g.addColorStop(1,'rgba(255,200,80,0)');q.fillStyle=g;q.fillRect(0,0,32,32);return new THREE.CanvasTexture(c);})(),transparent:true,opacity:.9,depthWrite:false,fog:false}));
        sp.scale.set(.5,.5,1); sp.userData.v9=true; addO(sp); sparks.push(sp);
      }
      telefx.push({x:x,z:z,color:color,beam:beam,cube:cube,rings:rings,sparks:sparks,t:0,phase:'rise'});
    }catch(e){}
  }
  function tickTeleport(now,dt){
    for(var i=telefx.length-1;i>=0;i--){
      var e=telefx[i];
      try{
        if(e.phase==='rise'){
          e.t+=dt*1.6;
          if(e.t>=1){
            e.t=0; e.phase='streak'; e.beam.visible=false; e.cube.visible=false; e.rings.forEach(function(r){r.visible=false;});
            if(e.sparks) e.sparks.forEach(function(sp){sp.visible=false;});
            var dx=-e.x, dz=-e.z, len=Math.sqrt(dx*dx+dz*dz);
            var streak=new THREE.Mesh(new THREE.BoxGeometry(len,.10,.10),
              new THREE.MeshBasicMaterial({color:e.color,transparent:true,opacity:.9,depthWrite:false,fog:false}));
            streak.position.set(e.x/2,7,e.z/2); streak.rotation.y=-Math.atan2(dz,dx); streak.userData.v9=true; addO(streak);
            e.streak=streak;
          } else {
            e.cube.position.y=.8+e.t*9;
            e.cube.rotation.y+=dt*4; e.cube.rotation.x+=dt*2;
            e.beam.material.opacity=.42*(1-e.t*.5);
            e.rings.forEach(function(r,j){ r.position.y=1+j*2+e.t*7; r.rotation.z+=dt*2; r.material.opacity=1-e.t; });
            if(e.sparks) e.sparks.forEach(function(sp,j){
              var a=j/12*Math.PI*2+e.t*8;
              var rad=.6+e.t*1.8;
              sp.position.set(e.x+Math.cos(a)*rad,.8+e.t*9+Math.sin(a*.7)*.5,e.z+Math.sin(a)*rad);
              sp.material.opacity=.5+.5*Math.sin(now/90+j);
              sp.scale.setScalar(.35+.25*(.5+.5*Math.sin(now/120+j)));
            });
          }
        } else if(e.phase==='streak'){
          e.t+=dt*2.5;
          if(e.t>=1){
            portalPulse(0,0,e.color);
            // radiant burst at arrival
            try{
              for(var q=0;q<16;q++){
                var a=q/16*Math.PI*2;
                var burst=new THREE.Sprite(new THREE.SpriteMaterial({map:(function(){var c=document.createElement('canvas');c.width=32;c.height=32;var g2=c.getContext('2d');var gr=g2.createRadialGradient(16,16,1,16,16,16);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.4,'rgba(120,220,255,.8)');gr.addColorStop(1,'rgba(120,220,255,0)');g2.fillStyle=gr;g2.fillRect(0,0,32,32);return new THREE.CanvasTexture(c);})(),transparent:true,opacity:1,depthWrite:false,fog:false}));
                burst.scale.set(.9,.9,1); burst.position.set(0,1,0); burst.userData.v9=true; addO(burst);
                (function(b,ang){
                  var life=0; var iv=setInterval(function(){
                    life++; var t=life/30;
                    b.position.set(Math.cos(ang)*t*4, 1+Math.sin(ang)*t*3+life*.05, Math.sin(ang)*t*4);
                    b.material.opacity=1-t; b.scale.setScalar(.9+t*.6);
                    if(life>=30){clearInterval(iv);try{structureGroup.remove(b);}catch(_){}}
                  },40);
                })(burst,a);
              }
            }catch(_){}
            try{structureGroup.remove(e.streak);}catch(_){}
            e.rings.forEach(function(r){try{structureGroup.remove(r);}catch(_){}});
            try{structureGroup.remove(e.beam);}catch(_){}
            try{structureGroup.remove(e.cube);}catch(_){}
            telefx.splice(i,1); continue;
          }
          if(e.streak){ e.streak.material.opacity=.9*(1-e.t); e.streak.scale.y=1+e.t*3; }
        }
      }catch(err){ try{telefx.splice(i,1);}catch(_){}}
    }
  }

  function tick3d(now, dt){
    try{
      for(var i=0;i<fx3d.pulses.length;i++){
        var p=fx3d.pulses[i];
        p.t+=p.sp*dt*p.dir;
        if(p.t>1){p.t=1;p.dir=-1;} if(p.t<0){p.t=0;p.dir=1;}
        p.m.position.set(p.x1+(p.x2-p.x1)*p.t,.22,p.z1+(p.z2-p.z1)*p.t);
      }
      for(var j=0;j<fx3d.cores.length;j++) fx3d.cores[j].rotation.y+=.01;
      if(fx3d.dust) fx3d.dust.rotation.y+=.00006;
    }catch(e){}
  }


  var _walkLoopStarted = false;
  function startWalkLoop(){
    if(_walkLoopStarted) return; _walkLoopStarted=true;
    var last=Date.now();
    setInterval(function(){
      try{
        if(typeof view==='undefined'||view==='office'||view==='boardroom'){
          var n=Date.now(), dt=Math.min(.08,(n-last)/1000); last=n; window.__wl=(window.__wl||0)+1;
          walkerTick(n,dt); tick3d(n,dt); tickMax(n,dt); tickCiv(n,dt); tickAtm(n,dt); tickPortal(n,dt); tickTeleport(n,dt); tickJuice(n,dt); tickAlive(n,dt); tickJanitor(n,dt); tickMegaVisual(n,dt); tickMegaBehavior(n,dt); tickSpecialty(n,dt); tickUfo(n,dt); tickRealGalaxy(n,dt); tickFallingStars(n,dt); tickChristmas(n,dt); tickCinematic(n,dt); adaptiveDetail(n,dt); aiOptimizeTick(n,dt);  tickAtm(n,dt);
        }
      }catch(e){}
    }, 90);
  }


  // ===== ADVANCED CIVILIZATION LAYER =====
  var civfx = { ships:[], hover:[], ring:null };
  function shipMesh(color){
    var g=new THREE.Group();
    var hull=new THREE.Mesh(new THREE.ConeGeometry(.42,1.6,6),solid('#dfe8f5',{roughness:.28,metalness:.65,emissive:color,emissiveIntensity:.15}));
    hull.rotation.x=Math.PI/2; hull.userData.v9=true; g.add(hull);
    var cockpit=new THREE.Mesh(new THREE.SphereGeometry(.30,10,8),solid('#0e2a4a',{roughness:.12,metalness:.5,emissive:'#4fc8ff',emissiveIntensity:.35}));
    cockpit.scale.set(1,.7,1.3); cockpit.position.set(0,.16,-.15); cockpit.userData.v9=true; g.add(cockpit);
    [-1,1].forEach(function(sx){
      var wing=new THREE.Mesh(new THREE.BoxGeometry(.85,.06,.5),solid('#8fa9c4',{roughness:.3,metalness:.6}));
      wing.position.set(sx*.55,0,.25); wing.rotation.y=sx*.18; wing.userData.v9=true; g.add(wing);
      var eng=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.28,8),solid(color,{emissive:color,emissiveIntensity:1.2,roughness:.2}));
      eng.rotation.x=Math.PI/2; eng.position.set(sx*.85,0,.42); eng.userData.v9=true; g.add(eng);
      var trail=new THREE.Mesh(new THREE.ConeGeometry(.10,.9,8),new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:.35,depthWrite:false,fog:false}));
      trail.rotation.x=-Math.PI/2; trail.position.set(sx*.85,0,.95); trail.userData.v9=true; g.add(trail);
    });
    g.userData.v9=true; return g;
  }

  // ===== ATMOSPHERE + GROUND DETAIL (realistic, low-poly) =====
  var atmfx = { haze:[], glow:[] };
  function atmTexture(color){
    var c=document.createElement('canvas'); c.width=256; c.height=256;
    var q=c.getContext('2d');
    q.fillStyle='#2f3b4e'; q.fillRect(0,0,256,256);
    // subtle realistic ground speckle + concentric tech rings
    var rnd=function(){return Math.random();};
    for(var i=0;i<0;i++){
      q.fillStyle='rgba(255,255,255,'+(0.015+rnd()*0.035).toFixed(3)+')';
      q.fillRect(rnd()*256,rnd()*256,1+rnd()*2,1+rnd()*2);
    }
    q.strokeStyle=color; q.globalAlpha=.10; q.lineWidth=2;
    for(var r=24;r<128;r+=26){q.beginPath();q.arc(128,128,r,0,Math.PI*2);q.stroke();}
    q.globalAlpha=1;
    return new THREE.CanvasTexture(c);
  }

  // ===== "SUBWAY SURFERS" JUICE LAYER — coins, sparkles, parallax, trails, bounce =====
  var ju = { coins:[], sparkles:[], trails:[], parallax:[] };
  function coinTexture(){
    var c=document.createElement('canvas'); c.width=64; c.height=64;
    var q=c.getContext('2d');
    var g=q.createRadialGradient(26,26,3,32,32,32);
    g.addColorStop(0,'#fff6b0'); g.addColorStop(.5,'#ffd34d'); g.addColorStop(1,'#c98a1a');
    q.fillStyle=g; q.beginPath(); q.arc(32,32,26,0,Math.PI*2); q.fill();
    q.strokeStyle='#a86a10'; q.lineWidth=3; q.beginPath(); q.arc(32,32,26,0,Math.PI*2); q.stroke();
    q.fillStyle='#b8801a'; q.font='bold 34px Arial'; q.textAlign='center'; q.textBaseline='middle'; q.fillText('C',32,34);
    return new THREE.CanvasTexture(c);
  }
  function sparkleTexture(){
    var c=document.createElement('canvas'); c.width=32; c.height=32;
    var q=c.getContext('2d');
    var g=q.createRadialGradient(16,16,1,16,16,16);
    g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.3,'rgba(180,230,255,.7)'); g.addColorStop(1,'rgba(180,230,255,0)');
    q.fillStyle=g; q.fillRect(0,0,32,32);
    return new THREE.CanvasTexture(c);
  }

  // ===== ALIVE LAYER — fountains, flowing energy, breathing lights, day/night color, fireflies =====
  var alivefx = { jets:[], rivers:[], lights:[], trees:[], fireflies:[] };

  // ===== REALISTIC SPACE BACKDROP =====
  function spaceRealism(){
    if(!structureGroup||!level3d) return;
    // Big planet with atmosphere rim (realistic curved horizon like the reference)
    try{
      var pg=new THREE.Group(); pg.position.set(-150,-70,-230); pg.userData.v9=true; structureGroup.add(pg);
      var planet=new THREE.Mesh(new THREE.SphereGeometry(90,48,32),
        new THREE.MeshStandardMaterial({color:'#123a5e',roughness:.95,metalness:.05,emissive:'#0a2240',emissiveIntensity:.25}));
      planet.userData.v9=true; pg.add(planet);
      // atmospheric glow shell
      var atm=new THREE.Mesh(new THREE.SphereGeometry(93,48,32),
        new THREE.MeshBasicMaterial({color:'#4aa8ff',transparent:true,opacity:.14,side:THREE.BackSide,depthWrite:false,fog:false}));
      atm.userData.v9=true; pg.add(atm);
      // surface bands (gas-giant style)
      for(var i=0;i<6;i++){
        var band=new THREE.Mesh(new THREE.TorusGeometry(90.5,1.2+i*.3,6,64),
          new THREE.MeshBasicMaterial({color:i%2?'#2a6a9a':'#1a4a78',transparent:true,opacity:.3,fog:false}));
        band.rotation.x=Math.PI/2; band.rotation.y=i*.2; band.userData.v9=true; pg.add(band);
      }
      pg.userData.spin=true;
      alivefx.planet=pg;
    }catch(e){}
    // Dense realistic starfield (multiple colors, varied brightness)
    try{
      var pts=[],cols=[];
      for(var i=0;i<0;i++){
        var a=Math.random()*Math.PI*2, r=90+Math.random()*220;
        pts.push(Math.cos(a)*r,-30+Math.random()*120,Math.sin(a)*r);
        var c=new THREE.Color().setHSL(.55+Math.random()*.12,.2+Math.random()*.5,.6+Math.random()*.4);
        cols.push(c.r,c.g,c.b);
      }
      var geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
      geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
      var stars=new THREE.Points(geo,new THREE.PointsMaterial({size:.35,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,fog:false}));
      stars.userData.v9=true; addO(stars);
    }catch(e){}
    // Distant sun with glow
    try{
      var sun=new THREE.Mesh(new THREE.SphereGeometry(8,16,12),new THREE.MeshBasicMaterial({color:'#fff3c0',fog:false}));
      sun.position.set(120,70,-180); sun.userData.v9=true; addO(sun);
      var glow=new THREE.Sprite(new THREE.SpriteMaterial({map:(function(){var c=document.createElement('canvas');c.width=128;c.height=128;var q=c.getContext('2d');var g=q.createRadialGradient(64,64,3,64,64,64);g.addColorStop(0,'rgba(255,240,190,.9)');g.addColorStop(.3,'rgba(255,200,120,.35)');g.addColorStop(1,'rgba(255,200,120,0)');q.fillStyle=g;q.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})(),transparent:true,depthWrite:false,fog:false}));
      glow.scale.set(60,60,1); glow.position.copy(sun.position); glow.userData.v9=true; addO(glow);
    }catch(e){}
    // Dramatic key light from the sun direction (no shadows)
    var key=new THREE.DirectionalLight(0xfff0d0,.3); key.position.set(40,60,-30); key.userData.v9Light=true; addO(key);
  }

  function buildAlive(){
    if(!structureGroup||!level3d) return;
    alivefx.jets.length=0; alivefx.rivers.length=0; alivefx.lights.length=0; alivefx.trees.length=0; alivefx.fireflies.length=0;
    var DS=[[-17.6,-24.3,'#f0a040'],[17.6,-24.3,'#4fd6b0'],[-28.5,9.3,'#5fa8ff'],[28.5,9.3,'#d8c860'],[0,30,'#ff7fb0']];
    DS.forEach(function(d,di){
      var x=d[0],z=d[1],col=d[2],R=10;
      // --- glowing fountain at island center (water-like energy jet) ---
      var base=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.2,.18,16),solid('#3a4a66',{roughness:.4,metalness:.5}));
      base.position.set(x,.12,z); base.userData.v9=true; addO(base);
      var ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,.06,8,32),solid(col,{emissive:col,emissiveIntensity:1.0}));
      ring.rotation.x=Math.PI/2; ring.position.set(x,.24,z); ring.userData.v9=true; addO(ring);
      for(var j=0;j<8;j++){
        var drop=new THREE.Mesh(new THREE.SphereGeometry(.10,6,6),solid(col,{emissive:col,emissiveIntensity:1.2,transparent:true,opacity:.8}));
        drop.userData.v9=true; addO(drop);
        alivefx.jets.push({m:drop,x:x,z:z,p:di+j*.7,a:j/8*Math.PI*2});
      }
      // --- flowing energy river around island rim ---
      for(var e=0;e<10;e++){
        var orb=new THREE.Mesh(new THREE.SphereGeometry(.09,6,6),solid(col,{emissive:col,emissiveIntensity:1.1}));
        orb.userData.v9=true; addO(orb);
        alivefx.rivers.push({m:orb,x:x,z:z,r:R*.82,a:e/10*Math.PI*2,sp:.4+Math.random()*.2});
      }
      // --- breathing holographic trees (wave + scale) ---
      for(var k=0;k<3;k++){
        var a=k/3*Math.PI*2+di;
        var tx=x+Math.cos(a)*R*.62, tz=z+Math.sin(a)*R*.62;
        var tree=new THREE.Group(); tree.position.set(tx,0,tz); tree.userData.v9=true; structureGroup.add(tree);
        var trunk=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,1.0,6),solid('#5a6a86',{roughness:.6}));
        trunk.position.y=.5; trunk.userData.v9=true; tree.add(trunk);
        var crown=new THREE.Mesh(new THREE.ConeGeometry(.55,1.3,7),solid(col,{emissive:col,emissiveIntensity:.5,roughness:.5,transparent:true,opacity:.75}));
        crown.position.y=1.5; crown.userData.v9=true; tree.add(crown);
        alivefx.trees.push({g:tree,c:crown,p:di+k});
      }
      // --- breathing point light per island ---
      var L=new THREE.PointLight(col,.9,26); L.position.set(x,2.5,z); L.userData.v9Light=true; addO(L);
      alivefx.lights.push({l:L,p:di});
    });
    // --- fireflies drifting around Command ---
    for(var i=0;i<12;i++){
      var f=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6),solid(i%2?'#ff8df0':'#8fd8ff',{emissive:i%2?'#ff8df0':'#8fd8ff',emissiveIntensity:1.4}));
      f.userData.v9=true; addO(f);
      alivefx.fireflies.push({m:f,r:6+Math.random()*22,a:Math.random()*Math.PI*2,y:1+Math.random()*9,sp:.3+Math.random()*.4});
    }
    // --- day/night color cycle on ambient + fog (subtle, keeps guards) ---
    alivefx.ambBase=.34;
  }
  function tickAlive(now,dt){
    try{
      for(var i=0;i<alivefx.jets.length;i++){
        var j=alivefx.jets[i];
        var t=(now/700+j.p)%1;
        var h=t*2.2;
        j.m.position.set(j.x+Math.cos(j.a)*t*.7, .3+h, j.z+Math.sin(j.a)*t*.7);
        j.m.material.opacity=.9*(1-t);
        j.m.scale.setScalar(1-t*.5);
      }
      for(var r=0;r<alivefx.rivers.length;r++){
        var o=alivefx.rivers[r]; o.a+=o.sp*dt;
        o.m.position.set(o.x+Math.cos(o.a)*o.r,.25+Math.sin(now/600+r)*.12,o.z+Math.sin(o.a)*o.r);
      }
      for(var t2=0;t2<alivefx.trees.length;t2++){
        var tr=alivefx.trees[t2];
        tr.g.rotation.z=Math.sin(now/900+tr.p)*.08;
        tr.c.scale.set(1+Math.sin(now/700+tr.p)*.08,1+Math.sin(now/700+tr.p)*.12,1+Math.sin(now/700+tr.p)*.08);
      }
      for(var l=0;l<alivefx.lights.length;l++){
        alivefx.lights[l].l.intensity=.7+.4*(.5+.5*Math.sin(now/800+alivefx.lights[l].p));
      }
      for(var f=0;f<alivefx.fireflies.length;f++){
        var ff=alivefx.fireflies[f]; ff.a+=ff.sp*dt;
        ff.m.position.set(Math.cos(ff.a)*ff.r,ff.y+Math.sin(now/500+f)*.6,Math.sin(ff.a)*ff.r);
        ff.m.material.emissiveIntensity=1+Math.sin(now/300+f)*.4;
      }
      if(alivefx.planet&&alivefx.planet.userData.spin) alivefx.planet.rotation.y+=.0004;
      // subtle global color breathing (no guard values changed permanently)
      if(g&&g.amb&&typeof alivefx.ambBase==='number'){
        g.amb.intensity=alivefx.ambBase+.04*Math.sin(now/5000);
      }
    }catch(e){}
  }

  function buildJuice(){
    if(!structureGroup||!level3d) return;
    ju.coins.length=0; ju.sparkles.length=0; ju.trails.length=0; ju.parallax.length=0;
    // Floating coins removed by CEO request - cleaner scene, fewer draw calls.

    // --- sparkles around each robot + portal (reuse one texture) ---
    var stex=sparkleTexture();
    for(var i=0;i<0;i++){
      var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:stex,transparent:true,opacity:.7,depthWrite:false,fog:false}));
      sp.scale.set(.4,.4,1); sp.userData.v9=true; addO(sp);
      ju.sparkles.push({m:sp,r:20+Math.random()*35,a:Math.random()*Math.PI*2,y:1+Math.random()*8,sp:.2+Math.random()*.3});
    }
    // --- parallax star layers (3 depths, different drift speeds) ---
    [[60,.10,120],[100,.06,200],[160,.035,300]].forEach(function(L,li){
      var pts=[];
      for(var i=0;i<0;i++){var a=Math.random()*Math.PI*2,r=L[0]*.4+Math.random()*L[0];pts.push(Math.cos(a)*r,Math.random()*60-10,Math.sin(a)*r);}
      var g2=new THREE.BufferGeometry(); g2.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
      var stars=new THREE.Points(g2,new THREE.PointsMaterial({color:li===0?'#ffffff':'#8fc7ff',size:.18+li*.06,transparent:true,opacity:.8,depthWrite:false,fog:false}));
      stars.userData.v9=true; addO(stars);
      ju.parallax.push({m:stars,sp:L[1]});
    });
    // --- speed trails on flying vehicles (glowing ribbons) ---
    if(typeof civfx!=='undefined' && civfx.ships) civfx.ships.forEach(function(sh){
      var trail=new THREE.Mesh(new THREE.PlaneGeometry(.6,3),
        new THREE.MeshBasicMaterial({color:'#8fd8ff',transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false,fog:false}));
      trail.rotation.x=Math.PI/2; trail.userData.v9=true; addO(trail);
      ju.trails.push({m:trail,ship:sh.g});
    });
  }
  function tickJuice(now,dt){
    try{
      for(var i=0;i<ju.coins.length;i++){
        var c=ju.coins[i];
        c.m.rotation.y+=dt*2.4;
        c.m.position.y+=Math.sin(now/400+c.p)*.004;
        c.m.material.opacity=.75+.25*Math.sin(now/300+c.p);
      }
      for(var j=0;j<ju.sparkles.length;j++){
        var sp=ju.sparkles[j]; sp.a+=sp.sp*dt;
        sp.m.position.set(Math.cos(sp.a)*sp.r,sp.y+Math.sin(now/700+j)*.5,Math.sin(sp.a)*sp.r);
        sp.m.material.opacity=.35+.35*(.5+.5*Math.sin(now/500+j));
      }
      for(var k=0;k<ju.parallax.length;k++) ju.parallax[k].m.rotation.y+=ju.parallax[k].sp*dt;
      for(var q=0;q<ju.trails.length;q++){
        var tr=ju.trails[q];
        tr.m.position.copy(tr.ship.position);
        tr.m.position.y-=.15;
        tr.m.rotation.z=tr.ship.rotation.y;
        tr.m.material.opacity=.15+.1*Math.sin(now/200+q);
      }
      // squash & stretch bounce on walking robots (SS-style juice)
      if(typeof walkers!=='undefined') for(var w=0;w<walkers.length;w++){
        var r=walkers[w];
        if(r.state==='walk'||r.state==='submit'||r.state==='travel'){
          var b=Math.sin(r.phase)*.06;
          r.body.scale.set(1-b,1+b*1.4,1-b);
        } else if(r.body.scale.y!==1){ r.body.scale.lerp&&r.body.scale.set(1,1,1); r.body.scale.set(1,1,1); }
      }
    }catch(e){}
  }


  // ===== VIBRANT GRAPHICS LAYER — colorful nebula + saturated lighting (no heavy assets) =====
  function nebulaTexture(){
    var c=document.createElement('canvas'); c.width=1024; c.height=512;
    var q=c.getContext('2d');
    // deep-space gradient: teal -> indigo -> magenta -> dark
    var g=q.createLinearGradient(0,0,0,512);
    g.addColorStop(0,'#0a1f3c'); g.addColorStop(.35,'#122a5a'); g.addColorStop(.65,'#2a1a5e'); g.addColorStop(1,'#0d1230');
    q.fillStyle=g; q.fillRect(0,0,1024,512);
    // soft colorful nebula clouds
    var clouds=[['rgba(80,220,255,.18)',220,150,260],['rgba(180,110,255,.16)',760,180,300],['rgba(255,110,180,.13)',520,360,240],['rgba(120,255,200,.10)',900,400,220]];
    clouds.forEach(function(cl){
      var rg=q.createRadialGradient(cl[1],cl[2],5,cl[1],cl[2],cl[3]);
      rg.addColorStop(0,cl[0]); rg.addColorStop(1,'rgba(0,0,0,0)');
      q.fillStyle=rg; q.fillRect(0,0,1024,512);
    });
    // stars
    for(var i=0;i<0;i++){
      var x=Math.random()*1024,y=Math.random()*512,r=Math.random()*1.6+.2;
      q.fillStyle='rgba(255,255,255,'+(.3+Math.random()*.6).toFixed(2)+')';
      q.beginPath(); q.arc(x,y,r,0,Math.PI*2); q.fill();
    }
    // bright galaxy core
    var core=q.createRadialGradient(512,256,4,512,256,180);
    core.addColorStop(0,'rgba(255,255,255,.55)'); core.addColorStop(.2,'rgba(140,220,255,.30)'); core.addColorStop(1,'rgba(140,220,255,0)');
    q.fillStyle=core; q.fillRect(0,0,1024,512);
    var t=new THREE.CanvasTexture(c); t.needsUpdate=true; return t;
  }
  function vibrantLayer(){
    if(!scene3d||!structureGroup) return;
    // colorful sky background (texture, not flat color)
    try{ scene3d.background=nebulaTexture(); }catch(e){}
    // matching colorful fog (lighter, so far islands keep color)
    if(scene3d.fog){ scene3d.fog.color.set('#1b2c55'); scene3d.fog.near=140; scene3d.fog.far=280; }
    // vivid colored rim lights (no shadows — perf safe)
    var cols=[0x63e6ff,0xff8df0,0x7cf0c8,0xffb648,0xb07cff];
    [[-30,10,-25],[30,10,-25],[-30,10,10],[30,10,10],[0,14,30]].forEach(function(pos,i){
      var l=new THREE.PointLight(cols[i],1.1,70);
      l.position.set(pos[0],pos[1],pos[2]); l.userData.v9Light=true; addO(l);
    });
    // brighten island materials in place (saturated + emissive)
    structureGroup.traverse(function(o){
      if(!o.isMesh||!o.material||!o.material.color) return;
      var h=o.material.color.getHex();
      var targets={ '424d63':'#5a6a8c', '52607a':'#6e7fa0', '2f3a4e':'#3d4a66', '46536c':'#5a6b8c' };
      var hs=('000000'+h.toString(16)).slice(-6);
      if(targets[hs]){ o.material.color.set(targets[hs]); if(o.material.emissive){o.material.emissive.set('#1a2c4a');o.material.emissiveIntensity=.28;} }
    });
  }

  function buildAtmosphere(){
    if(!structureGroup||!level3d) return;
    atmfx.haze.length=0; atmfx.glow.length=0;
    // Atmospheric haze layers (soft glow pools above each island)
    var DS=[[-17.6,-24.3,'#f0a040'],[17.6,-24.3,'#4fd6b0'],[-28.5,9.3,'#5fa8ff'],[28.5,9.3,'#d8c860'],[0,30,'#ff7fb0']];
    DS.forEach(function(d){
      var nc=document.createElement('canvas'); nc.width=128; nc.height=128;
      var q=nc.getContext('2d');
      var gr=q.createRadialGradient(64,64,4,64,64,64);
      gr.addColorStop(0,'rgba(255,255,255,.16)'); gr.addColorStop(.5,'rgba(255,255,255,.05)'); gr.addColorStop(1,'rgba(255,255,255,0)');
      q.fillStyle=gr; q.fillRect(0,0,128,128);
      var haze=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(nc),transparent:true,opacity:.5,depthWrite:false,fog:false}));
      haze.scale.set(22,22,1); haze.position.set(d[0],1.6,d[1]); haze.userData.v9=true; addO(haze);
      atmfx.haze.push(haze);
    });
    // Command atmosphere column glow
    var cc=document.createElement('canvas'); cc.width=128; cc.height=128;
    var cq=cc.getContext('2d');
    var cg=cq.createRadialGradient(64,64,4,64,64,64);
    cg.addColorStop(0,'rgba(120,220,255,.25)'); cg.addColorStop(1,'rgba(120,220,255,0)');
    cq.fillStyle=cg; cq.fillRect(0,0,128,128);
    var cglow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cc),transparent:true,opacity:.6,depthWrite:false,fog:false}));
    cglow.scale.set(16,26,1); cglow.position.set(0,4,0); cglow.userData.v9=true; addO(cglow);
    atmfx.glow.push(cglow);
  }
  function tickAtm(now,dt){
    try{
      for(var i=0;i<atmfx.haze.length;i++) atmfx.haze[i].material.opacity=.4+.12*Math.sin(now/1300+i);
      for(var j=0;j<atmfx.glow.length;j++) atmfx.glow[j].material.opacity=.5+.14*Math.sin(now/900);
    }catch(e){}
  }

  function buildCivilization(){
    if(!structureGroup||!level3d) return;
    civfx.ships.length=0; civfx.hover.length=0;
    var DS=[[-17.6,-24.3,'#f0a040'],[17.6,-24.3,'#4fd6b0'],[-28.5,9.3,'#5fa8ff'],[28.5,9.3,'#d8c860'],[0,30,'#ff7fb0']];
    DS.forEach(function(d,di){
      var x=d[0],z=d[1],col=d[2];
      // ---- floating hover building directly above each island ----
      var hg=new THREE.Group(); hg.position.set(x,0,z); hg.userData.v9=true; structureGroup.add(hg);
      // energy tether from island to hover platform
      var tether=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,4,8),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.35,depthWrite:false,fog:false}));
      tether.position.y=4.5; tether.userData.v9=true; hg.add(tether);
      var plat=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.0,.28,12),solid('#39455c',{roughness:.5,metalness:.4,emissive:col,emissiveIntensity:.18}));
      plat.position.y=6.4; plat.userData.v9=true; hg.add(plat);
      var platRim=new THREE.Mesh(new THREE.TorusGeometry(3.5,.05,8,32),solid(col,{emissive:col,emissiveIntensity:.9}));
      platRim.rotation.x=Math.PI/2; platRim.position.y=6.55; platRim.userData.v9=true; hg.add(platRim);
      // hovering tower
      var tw=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.9,3.0,8),solid('#44506a',{roughness:.45,metalness:.45}));
      tw.position.y=8.1; tw.userData.v9=true; hg.add(tw);
      for(var w=0;w<4;w++){
        var band=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.55,.14,8),solid(col,{emissive:col,emissiveIntensity:1.0}));
        band.position.y=7.1+w*.65; band.userData.v9=true; hg.add(band);
      }
      var dome=new THREE.Mesh(new THREE.SphereGeometry(1.5,12,8,0,Math.PI*2,0,Math.PI/2),solid('#7fd8ff',{roughness:.15,metalness:.3,transparent:true,opacity:.55,emissive:col,emissiveIntensity:.25}));
      dome.position.y=9.6; dome.userData.v9=true; hg.add(dome);
      var crown=new THREE.Mesh(new THREE.TorusGeometry(.9,.05,8,24),solid(col,{emissive:col,emissiveIntensity:1.1}));
      crown.rotation.x=Math.PI/2; crown.position.y=10.2; crown.userData.v9=true; hg.add(crown);
      civfx.hover.push({g:hg,baseY:0,p:di*1.3});
    });
    // ---- central spire above Command ----
    var spire=new THREE.Group(); structureGroup.add(spire);
    var st=new THREE.Mesh(new THREE.CylinderGeometry(.35,1.1,9,8),solid('#4a3f70',{roughness:.4,metalness:.5,emissive:'#6a5bd0',emissiveIntensity:.2}));
    st.position.y=5; st.userData.v9=true; spire.add(st);
    for(var k=0;k<5;k++){
      var rb=new THREE.Mesh(new THREE.TorusGeometry(1.5-k*.18,.05,8,32),solid(k%2?'#ff8df0':'#63e6ff',{emissive:k%2?'#ff8df0':'#63e6ff',emissiveIntensity:1}));
      rb.rotation.x=Math.PI/2; rb.position.y=2+k*1.7; rb.userData.v9=true; spire.add(rb);
      animParts.push({m:rb,k:k%2?'spinFlatR':'spinFlat',s:.35+k*.05});
    }
    var sTop=new THREE.Mesh(new THREE.OctahedronGeometry(.7,0),solid('#bff4ff',{emissive:'#63e6ff',emissiveIntensity:1.3,roughness:.1}));
    sTop.position.y=10.2; sTop.userData.v9=true; spire.add(sTop);
    animParts.push({m:sTop,k:'spin',s:.6});
    // Big white campus ring removed by CEO request.
    civfx.ring=null;
    // ---- flying vehicles on smooth orbital paths ----
    var paths=[ {r:38,y:14,sp:.12},{r:46,y:19,sp:-.09},{r:33,y:11,sp:.16},{r:52,y:23,sp:-.07},{r:42,y:16,sp:.11},{r:56,y:27,sp:-.06} ];
    paths.forEach(function(pa,i){
      var ship=shipMesh(i%2?'#ff8df0':'#63e6ff');
      ship.userData.v9=true; structureGroup.add(ship);
      civfx.ships.push({g:ship,r:pa.r,y:pa.y,a:Math.random()*Math.PI*2,sp:pa.sp,tilt:Math.random()*.2});
    });
  }
  function tickCiv(now,dt){
    try{
      for(var i=0;i<civfx.ships.length;i++){
        var s=civfx.ships[i]; s.a+=s.sp*dt;
        var x=Math.cos(s.a)*s.r, z=Math.sin(s.a)*s.r;
        s.g.position.set(x,s.y+Math.sin(now/1200+i)*.4,z);
        s.g.rotation.y=-s.a+Math.PI/2;
        s.g.rotation.z=Math.sin(now/900+i)*s.tilt;
      }
      for(var j=0;j<civfx.hover.length;j++){
        var h=civfx.hover[j];
        h.g.position.y=Math.sin(now/1400+h.p)*.25;
        h.g.rotation.y=Math.sin(now/2600+h.p)*.06;
      }
      if(civfx.ring) civfx.ring.rotation.z=.25+Math.sin(now/9000)*.05;
    }catch(e){}
  }


  // ===== JANITOR BOT — roaming cleaner with broom + sparkle trail =====

  var janfx = { crew:[], sparkles:[] };
  var JAN_COLORS=['#3ec9a8','#ff8df0','#63e6ff','#ffd34d','#b07cff','#ff8f5f'];
  function buildJanitor(){
    if(!structureGroup||!level3d) return;
    janfx.crew.length=0; janfx.sparkles.length=0;
    JAN_COLORS.forEach(function(col,idx){
      var g=new THREE.Group(); g.position.set(0,0,0); g.scale.setScalar(1.3); g.userData.v9=true; structureGroup.add(g);
      var body=new THREE.Mesh(new THREE.SphereGeometry(.40,12,10),solid(col,{roughness:.5,metalness:.15,emissive:col,emissiveIntensity:.5}));
      body.position.y=.62; body.scale.y=1.1; body.userData.v9=true; g.add(body);
      var head=new THREE.Mesh(new THREE.SphereGeometry(.33,12,10),solid(col,{roughness:.45,emissive:col,emissiveIntensity:.4}));
      head.position.y=1.12; head.userData.v9=true; g.add(head);
      [-1,1].forEach(function(sx){var e=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),solid('#0b1020'));e.position.set(sx*.1,1.15,.3);e.userData.v9=true;g.add(e);});
      var cap=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.16,12),solid(col,{roughness:.6}));cap.position.y=1.42;cap.userData.v9=true;g.add(cap);
      var brim=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.04,12),solid(col));brim.position.y=1.36;brim.userData.v9=true;g.add(brim);
      var broom=new THREE.Group(); broom.position.set(.5,.5,.15); broom.rotation.z=-.4; g.add(broom);
      var handle=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.3,8),solid('#b98a4d'));handle.position.y=-.3;handle.userData.v9=true;broom.add(handle);
      var brush=new THREE.Mesh(new THREE.BoxGeometry(.5,.14,.3),solid('#e8c86a'));brush.position.y=-.95;brush.userData.v9=true;broom.add(brush);
      var cart=new THREE.Group(); cart.position.set(-.7,0,.1); cart.userData.v9=true; g.add(cart);
      var binm=new THREE.Mesh(new THREE.BoxGeometry(.7,.5,.55),solid(col,{roughness:.5,metalness:.3}));binm.position.y=.32;binm.userData.v9=true;cart.add(binm);
      [-1,1].forEach(function(sx){var w=new THREE.Mesh(new THREE.TorusGeometry(.1,.03,6,10),solid('#1a1f2c'));w.position.set(sx*.25,.08,0);w.userData.v9=true;cart.add(w);});
      // name tag
      var cv=document.createElement('canvas');cv.width=160;cv.height=40;var q=cv.getContext('2d');
      q.fillStyle='rgba(8,14,28,.85)';q.fillRect(0,0,160,40);q.fillStyle='#fff';q.font='bold 18px Arial';q.textAlign='center';q.fillText('CLEANER '+(idx+1),80,26);
      var tag=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true}));tag.scale.set(2.2,.55,1);tag.position.y=1.8;tag.userData.v9=true;g.add(tag);
      var mark=new THREE.Mesh(new THREE.CircleGeometry(.9,16),
        new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide,fog:false}));
      mark.rotation.x=-Math.PI/2; mark.position.y=.03; mark.userData.v9=true; g.add(mark);
      janfx.crew.push({g:g,broom:broom,cart:cart,color:col,phase:idx*1.7,pos:{x:0,z:0}});
    });
    // cleaning sparkles (shared pool)
    for(var i=0;i<0;i++){
      var sp=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),solid('#bfffee',{emissive:'#7fe0c8',emissiveIntensity:1.2}));
      sp.userData.v9=true; addO(sp); janfx.sparkles.push(sp);
    }
  }
  function tickJanitor(now,dt){
    if(!janfx.crew.length) return;
    var stops=[[-17.6,-24.3],[17.6,-24.3],[-28.5,9.3],[28.5,9.3],[0,30],[0,0]];
    for(var c=0;c<janfx.crew.length;c++){
      var J=janfx.crew[c];
      var legDur=6500, total=stops.length*2*legDur;
      var t=((now/ (1+ c*0.08) + J.phase*1800)%total)/legDur;
      var seg=Math.floor(t), f=t-seg, a,b;
      if(seg%2===0){ a=stops[Math.floor(seg/2)]; b=[0,0]; }
      else { a=[0,0]; b=stops[(Math.floor(seg/2)+1)%stops.length]; }
      var ox=(c%3-1)*1.4, oz=(Math.floor(c/3)-.5)*1.4;
      var x=a[0]+(b[0]-a[0])*f+ox, z=a[1]+(b[1]-a[1])*f+oz;
      if(typeof walkable==='function'&&!walkable(x,z)){x=J.pos.x;z=J.pos.z;}
      J.pos.x=x;J.pos.z=z;
      J.g.position.set(x,0,z);
      J.g.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);
      J.broom.rotation.z=-.4+Math.sin(now/160+c)*.42;
      J.cart.rotation.y=Math.sin(now/700+c)*.08;
    }
    for(var j=0;j<janfx.sparkles.length;j++){
      var jc=janfx.crew[j%janfx.crew.length], sp=janfx.sparkles[j], ang=j/10*Math.PI*2+now/600;
      sp.position.set(jc.pos.x+Math.cos(ang)*.8,.2+Math.sin(now/300+j)*.2,jc.pos.z+Math.sin(ang)*.8);
      sp.material.opacity=.5+.5*Math.sin(now/200+j);
    }
  }


  function buildMegaVisual(){
      if(!structureGroup||!level3d) return;
      megav.meteors.length=0; megav.footRings.length=0; megav.rimMats.length=0;
      // 1) Meteor shower: fast streaks with trails
      for(var m=0;m<8;m++){
        var streak=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,3.5),
          new THREE.MeshBasicMaterial({color:m%2?0xff9fc4:0x8fd8ff,transparent:true,opacity:.6,depthWrite:false,fog:false}));
        streak.userData.v9=true; addO(streak);
        megav.meteors.push({m:streak,delay:m*3200,span:2400});
      }
      // 2) Asteroid belt (instanced-ish: shared geometry+material, low count)
      var ag=new THREE.IcosahedronGeometry(.5,0), am=solid('#4a5568',{roughness:.9,metalness:.1});
      var belt=new THREE.Group(); belt.userData.v9=true; structureGroup.add(belt);
      for(var a=0;a<40;a++){
        var rock=new THREE.Mesh(ag,am);
        var ang=Math.random()*Math.PI*2, r=65+Math.random()*18;
        rock.position.set(Math.cos(ang)*r,-4+Math.random()*16,Math.sin(ang)*r);
        var sc=.4+Math.random()*1.2; rock.scale.setScalar(sc); rock.rotation.set(Math.random()*3,Math.random()*3,0);
        rock.userData.v9=true; belt.add(rock);
      }
      megav.asteroids=belt;
      // 3) Galaxy spiral sprite
      try{
        var gc=document.createElement('canvas'); gc.width=256; gc.height=256;
        var gq=gc.getContext('2d');
        var gg=gq.createRadialGradient(128,128,4,128,128,128);
        gg.addColorStop(0,'rgba(255,255,255,.5)'); gg.addColorStop(.3,'rgba(150,180,255,.2)'); gg.addColorStop(1,'rgba(80,120,255,0)');
        gq.fillStyle=gg; gq.fillRect(0,0,256,256);
        for(var i=0;i<5;i++){gq.strokeStyle='rgba(180,200,255,'+(.25-i*.04)+')';gq.lineWidth=2;gq.beginPath();gq.arc(128,128,20+i*22,i*.8,i*.8+Math.PI*1.6);gq.stroke();}
        var gal=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(gc),transparent:true,opacity:.5,depthWrite:false,fog:false}));
        gal.scale.set(90,90,1); gal.position.set(60,30,-180); gal.userData.v9=true; addO(gal);
        megav.galaxy=gal;
      }catch(e){}
      // 4) Footstep light rings pool
      for(var f=0;f<14;f++){
        var ring=new THREE.Mesh(new THREE.TorusGeometry(.2,.025,6,16),
          new THREE.MeshBasicMaterial({color:0x8fd8ff,transparent:true,opacity:0,depthWrite:false,fog:false}));
        ring.rotation.x=Math.PI/2; ring.visible=false; ring.userData.v9=true; addO(ring);
        megav.footRings.push({m:ring,life:0});
      }
      // 5) collect rim materials for pulse
      structureGroup.traverse(function(o){
        if(o.isMesh&&o.material&&o.material.emissiveIntensity>0&&o.geometry&&o.geometry.type==='TorusGeometry') megav.rimMats.push(o.material);
      });
    }

  function tickMegaVisual(now,dt){
      try{
        // meteors
        for(var i=0;i<megav.meteors.length;i++){
          var me=megav.meteors[i], t=(now+me.delay)%(me.delay+me.span)/me.span;
          if(t<.35){ me.m.visible=false; continue; }
          me.m.visible=true;
          var k=(t-.35)/.65;
          me.m.position.set(-80+k*160, 30+Math.sin(me.delay)*8, -100+k*40);
          me.m.material.opacity=.7*(1-k);
        }
        if(megav.asteroids) megav.asteroids.rotation.y+=.00008;
        if(megav.galaxy) megav.galaxy.material.rotation+=.0004;
        // foot rings fade
        for(var f=0;f<megav.footRings.length;f++){
          var r=megav.footRings[f]; if(!r.m.visible)continue;
          r.life-=dt*2; if(r.life<=0){r.m.visible=false;continue;}
          r.m.scale.setScalar(1+(1-r.life)*2.5); r.m.material.opacity=r.life*.5;
        }
        // rim pulse synced to overall activity
        if(now-(tick.rim||0)>120){
          tick.rim=now;
          var busy=0; if(typeof walkers!=='undefined') walkers.forEach(function(w){if(w.state==='walk'||w.state==='submit')busy++;});
          var glow=.3+.35*(busy/Math.max(1,walkers.length));
          for(var q=0;q<megav.rimMats.length;q++){ try{megav.rimMats[q].emissiveIntensity=glow;}catch(e){} }
        }
      }catch(e){}
    }

  function celebrate(kind){
      try{
        if(!structureGroup)return;
        for(var i=0;i<24;i++){
          var c=new THREE.Mesh(new THREE.PlaneGeometry(.18,.18),
            new THREE.MeshBasicMaterial({color:[0xffd34d,0xff8df0,0x63e6ff,0x7cf0c8][i%4],transparent:true,opacity:1,side:THREE.DoubleSide,fog:false}));
          c.position.set((Math.random()-.5)*8,4+Math.random()*3,(Math.random()-.5)*8); c.userData.v9=true; addO(c);
          (function(cc,sp){var life=0;var iv=setInterval(function(){life++;cc.position.y-=.08*sp;cc.rotation.z+=.1;cc.material.opacity=1-life/40;if(life>=40){clearInterval(iv);try{structureGroup.remove(cc);}catch(_){}}},40);})(c,1+Math.random());
        }
      }catch(e){}
    }

  function robotEvent(now){
      if(now-mb2.lastEvent<22000) return;
      if(Math.random()>.22) return;
      mb2.lastEvent=now;
      var r=Math.random();
      if(r<.3 && typeof walkers!=='undefined' && walkers.length>=3){
        // GROUP MEETING: pick 3 walkers on same island, pull them to a circle
        var host=walkers[(Math.random()*walkers.length)|0];
        var near=walkers.filter(function(w){return w!==host && w.zone===host.zone;}).slice(0,2);
        if(near.length>=2){
          var cx=host.x,cz=host.z;
          [host].concat(near).forEach(function(w,i){
            var a=i/3*Math.PI*2; w.state='meeting'; w.wp={x:cx+Math.cos(a)*1.2,z:cz+Math.sin(a)*1.2};
            w.talkFor=now+6000+Math.random()*4000;
          });
          mb2.event='meeting';
        }
      } else if(r<.6){
        // DANCE PARTY: all robots dance in place briefly
        if(typeof walkers!=='undefined') walkers.forEach(function(w){ if(w.state!=='submit'){w.state='dance';w.talkFor=now+7000;} });
        mb2.danceUntil=now+7000; mb2.event='dance'; celebrate('dance');
      } else if(r<.8){
        // PARADE: line up near Command
        if(typeof walkers!=='undefined') walkers.forEach(function(w,i){ w.state='parade'; w.wp={x:(i-6)*1.4,z:6}; });
        mb2.paradeUntil=now+9000; mb2.event='parade';
      } else {
        celebrate('random');
      }
      // XP + achievement
      mb2.xp+=5;
      if(!mb2.ach.firstEvent){mb2.ach.firstEvent=true; if(typeof window.pixiPop==='function')window.pixiPop('ACHIEVEMENT!',400,200);}
    }

  function tickMegaBehavior(now,dt){
      try{
        robotEvent(now);
        if(typeof walkers==='undefined')return;
        for(var i=0;i<walkers.length;i++){
          var w=walkers[i];
          if(w.state==='meeting'){
            if(w.wp){var dx=w.wp.x-w.x,dz=w.wp.z-w.z,d=Math.hypot(dx,dz);if(d>.2){w.x+=dx/d*Math.min(w.speed*dt,d);w.z+=dz/d*Math.min(w.speed*dt,d);} }
            w.g.rotation.y=Math.atan2(w.wp.x-w.x,w.wp.z-w.z);
            w.head.rotation.y=Math.sin(now/400)*.3;
            w.armL.rotation.x=-.5+Math.sin(now/180)*.4; w.armR.rotation.x=-.5-Math.sin(now/180)*.4;
            if(now>w.talkFor){ w.state='idle'; w.timer=now+2000; }
          } else if(w.state==='dance'){
            w.g.rotation.y+=dt*2; w.body.position.y=Math.abs(Math.sin(now/120))*0.3;
            w.armL.rotation.x=Math.sin(now/100)*1.2; w.armR.rotation.x=-Math.sin(now/100)*1.2;
            if(now>w.talkFor){w.state='idle';w.timer=now+1500;}
          } else if(w.state==='parade'){
            if(w.wp){var dx2=w.wp.x-w.x,dz2=w.wp.z-w.z,d2=Math.hypot(dx2,dz2);if(d2>.3){w.x+=dx2/d2*Math.min(w.speed*1.6*dt,d2);w.z+=dz2/d2*Math.min(w.speed*1.6*dt,d2);}}
            w.legL.rotation.x=Math.sin(now/90)*.7; w.legR.rotation.x=-Math.sin(now/90)*.7;
            if(now>mb2.paradeUntil){w.state='idle';w.timer=now+2000;}
          }
          w.g.position.set(w.x,0,w.z);
        }
      }catch(e){}
    }

  // Lightweight static specialty bot (no walker registration = no extra AI/motion cost)
  function simpleBot(x,z,color,name,prop){
    var g=new THREE.Group(); g.position.set(x,0,z); g.userData.v9=true; structureGroup.add(g);
    var body=new THREE.Mesh(new THREE.SphereGeometry(.42,10,8),solid(color,{emissive:color,emissiveIntensity:.55,roughness:.45}));
    body.position.y=.5; body.scale.set(1.1,.95,1); body.userData.v9=true; g.add(body);
    var head=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),solid(color,{emissive:color,emissiveIntensity:.45,roughness:.4}));
    head.position.y=1.05; head.userData.v9=true; g.add(head);
    [-1,1].forEach(function(sd){
      var eye=new THREE.Mesh(new THREE.SphereGeometry(.065,6,6),solid('#0b1020'));
      eye.position.set(sd*.12,1.08,.30); eye.userData.v9=true; g.add(eye);
    });
    if(prop){
      var item=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.12),solid('#ffd34d',{emissive:'#ffd34d',emissiveIntensity:.9}));
      item.position.set(0,.72,.45); item.userData.v9=true; g.add(item);
    }
    return g;
  }
  function buildSpecialtyBots(){
      if(!structureGroup||!level3d)return;
      specBots.length=0;
      var defs=[
        [-21,-19,'#ff5c7a','SECURITY','shield'],[21,-19,'#8fd8ff','CHEF','tray'],
        [-28,9,'#7cf0c8','DOCTOR','tray'],[28,9,'#ffd34d','COURIER','tray'],
        [0,26,'#b07cff','DJ','mic'],[0,5,'#63e6ff','MANAGER','shield']
      ];
      defs.forEach(function(d,i){ var g=simpleBot(d[0],d[1],d[2],d[3],d[4]); specBots.push({g:g,p:i*1.3,x:d[0],z:d[1]}); });
      // robot pets (small drone companions)
      for(var i=0;i<3;i++){
        var pet=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),solid('#ffd34d',{emissive:'#ffd34d',emissiveIntensity:1}));pet.userData.v9=true;addO(pet);
        specBots.push({pet:pet,p:i*2.1});
      }
    }

  function tickSpecialty(now,dt){
      for(var i=0;i<specBots.length;i++){
        var b=specBots[i];
        if(b.pet){ var a=now/600+b.p; b.pet.position.set(Math.cos(a)*4,2+Math.sin(now/500+i)*.5,Math.sin(a)*4); }
        else { b.g.position.y=Math.sin(now/800+b.p)*.06; b.g.rotation.y=Math.sin(now/1200+b.p)*.3; }
      }
    }

  // UFO delivery layer (declared here - was an undeclared global -> silent failure)
  var ufofx = { ships: [], docs: [] };
  function ufoShip(col){
    var g=new THREE.Group();
    var hull=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.05,.45,16),
      new THREE.MeshStandardMaterial({color:col,metalness:.55,roughness:.3,emissive:col,emissiveIntensity:.45}));
    hull.userData.v9=true; g.add(hull);
    var dome=new THREE.Mesh(new THREE.SphereGeometry(.85,12,8,0,Math.PI*2,0,Math.PI/2),
      new THREE.MeshStandardMaterial({color:'#bff6ff',metalness:.2,roughness:.15,transparent:true,opacity:.78,emissive:'#3cc8ff',emissiveIntensity:.35}));
    dome.position.y=.34; dome.userData.v9=true; g.add(dome);
    for(var i=0;i<8;i++){
      var ang=i/8*Math.PI*2;
      var lamp=new THREE.Mesh(new THREE.SphereGeometry(.12,6,6),
        new THREE.MeshBasicMaterial({color:i%2?'#ffffff':col}));
      lamp.position.set(Math.cos(ang)*1.34,-.1,Math.sin(ang)*1.34);
      lamp.userData.v9=true; g.add(lamp);
    }
    var beam=new THREE.Mesh(new THREE.ConeGeometry(1.05,4,16,1,true),
      new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,fog:false}));
    beam.rotation.x=Math.PI; beam.position.y=-2.2; beam.userData.v9=true; g.add(beam);
    g.userData.beam=beam; g.userData.v9=true; addO(g);
    return g;
  }
  function buildUfoDelivery(){
      if(!structureGroup||!level3d)return;
      ufofx.ships.length=0;ufofx.docs.length=0;
      for(var i=0;i<4;i++){
        var col=['#63e6ff','#ff8df0','#7cf0c8','#ffd34d'][i];
        var g=ufoShip(col);
        var from=(i*2)%ISLANDS.length, to=(i*2+2)%ISLANDS.length;
        ufofx.ships.push({g:g,from:from,to:to,phase:'pick',t:0,pause:2000+i*1500,
          x:ISLANDS[from][0],z:ISLANDS[from][1],y:9+i*3,color:col,doc:null,speed:.22+i*.03});
      }
    }

  function tickUfo(now,dt){
      for(var i=0;i<ufofx.ships.length;i++){
        var u=ufofx.ships[i], g=u.g, beam=g.userData.beam;
        var A=ISLANDS[u.from]||[0,0];
        var C=[0,0]; // Command hub at the center
        var E=galaxfx.earth?galaxfx.earth.position:new THREE.Vector3(78,62,-88);
        if(u.phase==='wait'){
          if(now>u.pause){u.phase='pick';u.t=0;}
          continue;
        }
        if(u.phase==='pick'){
          // fly from the island to the center to pick up the message
          u.t+=dt*.45; if(u.t>1)u.t=1;
          var sx=A[0]+(C[0]-A[0])*u.t, sz=A[1]+(C[1]-A[1])*u.t;
          g.position.set(sx,9+Math.sin(u.t*Math.PI)*3,sz);
          beam.material.opacity=.14*u.t;
          if(u.t>=1){ u.phase='vacuum'; u.t=0; }
        } else if(u.phase==='vacuum'){
          // hover at the center and suck the message up into the ship
          u.t+=dt*.6; if(u.t>1)u.t=1;
          g.position.set(C[0],8,C[1]);
          beam.material.opacity=.6*u.t;
          if(!u.doc){
            var d=new THREE.Mesh(new THREE.BoxGeometry(.45,.55,.06),solid('#f5f1e6',{emissive:'#ffd34d',emissiveIntensity:.6}));
            d.position.set(C[0],.5,C[1]); d.userData.v9=true; addO(d); u.doc=d;
          }
          u.doc.position.y=.5+u.t*6.5;
          u.doc.rotation.y+=dt*4;
          if(u.t>=1){ u.phase='carry'; u.t=0; beam.material.opacity=0; }
        } else if(u.phase==='carry'){
          // fly away to Planet Earth beside the office
          u.t+=dt*.16; if(u.t>1)u.t=1;
          var st=new THREE.Vector3(C[0],8,C[1]);
          g.position.set(
            st.x+(E.x-st.x)*u.t,
            st.y+(E.y-st.y)*u.t+Math.sin(u.t*Math.PI)*10,
            st.z+(E.z-st.z)*u.t
          );
          if(u.doc){ u.doc.position.set(g.position.x,g.position.y-1.4,g.position.z); u.doc.rotation.y+=dt*3; }
          g.rotation.y=Math.atan2(E.x-st.x,E.z-st.z);
          if(u.t>=1){ u.phase='drop'; u.t=0; }
        } else if(u.phase==='drop'){
          u.t+=dt*.7; if(u.t>1)u.t=1;
          beam.material.opacity=.5*(1-u.t);
          if(u.doc){ u.doc.position.y=g.position.y-1.4-u.t*4; }
          if(u.t>=1){
            // delivery pulse at Earth
            try{
              var ring=new THREE.Mesh(new THREE.TorusGeometry(.6,.06,8,24),solid(u.color,{emissive:u.color,emissiveIntensity:1.2,fog:false}));
              ring.rotation.x=Math.PI/2; ring.position.set(E.x,E.y-14,E.z); ring.userData.v9=true; addO(ring);
              (function(r){var l=0;var iv=setInterval(function(){l++;r.scale.setScalar(1+l*.4);r.material.opacity=1-l/25;if(l>=25){clearInterval(iv);try{structureGroup.remove(r);}catch(_){}}},40);})(ring);
            }catch(e){}
            if(u.doc){try{structureGroup.remove(u.doc);}catch(_){} u.doc=null;}
            beam.material.opacity=0;
            u.from=(u.from+2)%ISLANDS.length;
            u.phase='wait'; u.pause=now+5000+Math.random()*6000;
          }
        }
      }
    }

  var galaxfx = { planets: [], dust: null, santa: null, satellites: [], satGroup: null, earth: null, bigPlanet: null };
  function buildRealGalaxy(){
      if(!structureGroup||!level3d)return;
      galaxfx.planets.length=0; galaxfx.dust=null; galaxfx.santa=null;
      galaxfx.satellites.length=0;
      try{ if(galaxfx.satGroup&&galaxfx.satGroup.parent) galaxfx.satGroup.parent.remove(galaxfx.satGroup); }catch(e){}
      galaxfx.satGroup=null;
      // Multiple planets around the scene — varied colors/sizes, some with rings & moons
      var defs=[
        [-190,-60,-300,34,'#1e5a8a','#3a8fd0',true],   // big blue gas giant w/ ring
        [180,40,-260,22,'#7a3a2a','#c86a4a',false],    // red planet
        [-140,80,-180,14,'#2a6a5a','#4fd6a0',false],   // green planet
        [240,-30,-340,42,'#3a2a6a','#8a6ad0',true],    // purple giant w/ ring
        [60,90,-400,18,'#6a6a4a','#d8d860',false],     // sandy planet
        [-260,20,-200,10,'#4a4a5a','#aab0cc',false]    // gray moon-like
      ];
      defs.forEach(function(p,i){
        var grp=new THREE.Group(); grp.position.set(p[0],p[1],p[2]); grp.userData.v9=true; structureGroup.add(grp);
        var planet=new THREE.Mesh(new THREE.SphereGeometry(p[3],32,24),
          new THREE.MeshStandardMaterial({color:p[4],roughness:.92,metalness:.05,emissive:p[4],emissiveIntensity:.12}));
        planet.userData.v9=true; grp.add(planet);
        // atmosphere glow
        var atm=new THREE.Mesh(new THREE.SphereGeometry(p[3]*1.06,32,24),
          new THREE.MeshBasicMaterial({color:p[5],transparent:true,opacity:.12,side:THREE.BackSide,depthWrite:false,fog:false}));
        atm.userData.v9=true; grp.add(atm);
        // surface bands for gas giants
        if(p[6]){
          for(var b=0;b<5;b++){
            var band=new THREE.Mesh(new THREE.TorusGeometry(p[3]*1.01,.25+b*.12,6,48),
              new THREE.MeshBasicMaterial({color:p[5],transparent:true,opacity:.22,fog:false}));
            band.rotation.x=Math.PI/2; band.rotation.y=b*.3; band.userData.v9=true; grp.add(band);
          }
          // ring system
          var ring=new THREE.Mesh(new THREE.RingGeometry(p[3]*1.4,p[3]*2.1,48),
            new THREE.MeshBasicMaterial({color:p[5],transparent:true,opacity:.28,side:THREE.DoubleSide,fog:false}));
          ring.rotation.x=Math.PI/2.4; ring.userData.v9=true; grp.add(ring);
        }
        // moon for some planets
        if(i%2===0){
          var moon=new THREE.Mesh(new THREE.SphereGeometry(p[3]*.25,12,10),
            new THREE.MeshStandardMaterial({color:'#c9c9d6',roughness:1}));
          moon.position.set(p[3]*2.2,0,0); moon.userData.v9=true; grp.add(moon);
          grp.userData.moon=moon;
        }
        galaxfx.planets.push({g:grp,sp:.02+i*.006});
      });
      // 🎅 Santa Claus on his sleigh with a sheep - orbiting above the solar system
      try{
        var santa=new THREE.Group();
        var red=new THREE.MeshStandardMaterial({color:'#d32f2f',roughness:.6,metalness:.08,emissive:'#3a0000',emissiveIntensity:.2});
        var white=new THREE.MeshStandardMaterial({color:'#f7f7f7',roughness:.95});
        var gold=new THREE.MeshStandardMaterial({color:'#ffd54f',metalness:.7,roughness:.25});
        var dark=new THREE.MeshStandardMaterial({color:'#2b2b2b',roughness:.9});
        // sleigh / cart
        var cart=new THREE.Mesh(new THREE.BoxGeometry(6,1.5,3),red); cart.userData.v9=true; santa.add(cart);
        var backrest=new THREE.Mesh(new THREE.BoxGeometry(1,2.6,3),red); backrest.position.set(-2.6,1,0); backrest.userData.v9=true; santa.add(backrest);
        [-1.5,1.5].forEach(function(z){
          var runner=new THREE.Mesh(new THREE.TorusGeometry(3.3,.14,6,22,Math.PI),gold);
          runner.rotation.z=Math.PI/2; runner.rotation.y=Math.PI/2; runner.position.set(0,-1.1,z);
          runner.userData.v9=true; santa.add(runner);
        });
        // Santa body
        var torso=new THREE.Mesh(new THREE.CylinderGeometry(1,.85,2.2,10),red); torso.position.set(.3,1.7,0); torso.userData.v9=true; santa.add(torso);
        var belt=new THREE.Mesh(new THREE.TorusGeometry(.92,.14,6,14),dark); belt.rotation.x=Math.PI/2; belt.position.set(.3,1.35,0); belt.userData.v9=true; santa.add(belt);
        var head=new THREE.Mesh(new THREE.SphereGeometry(.7,10,8),new THREE.MeshStandardMaterial({color:'#ffc99a',roughness:.9}));
        head.position.set(.3,3.1,0); head.userData.v9=true; santa.add(head);
        var hat=new THREE.Mesh(new THREE.ConeGeometry(.78,1.2,10),red); hat.position.set(.3,4,0); hat.userData.v9=true; santa.add(hat);
        var pom=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),white); pom.position.set(.3,4.65,0); pom.userData.v9=true; santa.add(pom);
        var beard=new THREE.Mesh(new THREE.SphereGeometry(.48,10,8),white); beard.scale.set(1,1.2,.6);
        beard.position.set(.3,2.75,.45); beard.userData.v9=true; santa.add(beard);
        [-.24,.24].forEach(function(dx){
          var eye=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6),new THREE.MeshBasicMaterial({color:'#222'}));
          eye.position.set(.3+dx,3.2,.6); eye.userData.v9=true; santa.add(eye);
        });
        // 🐑 sheep riding with Santa
        var sheep=new THREE.Group();
        var wool=new THREE.Mesh(new THREE.SphereGeometry(.68,10,8),white); wool.scale.set(1.25,.9,1); wool.userData.v9=true; sheep.add(wool);
        var face=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),dark); face.position.set(.75,.05,0); face.userData.v9=true; sheep.add(face);
        for(var l=0;l<4;l++){
          var leg=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.5,6),dark);
          leg.position.set((l<2?.34:-.34),-.62,(l%2?.28:-.28)); leg.userData.v9=true; sheep.add(leg);
        }
        sheep.position.set(-1.3,1.2,1); sheep.userData.v9=true; santa.add(sheep);
        santa.userData.sheep=sheep;
        var halo=new THREE.Mesh(new THREE.SphereGeometry(5.5,12,10),
          new THREE.MeshBasicMaterial({color:'#ffcf6b',transparent:true,opacity:.05,side:THREE.BackSide,depthWrite:false,fog:false}));
        halo.userData.v9=true; santa.add(halo);
        santa.userData.v9=true; addO(santa); galaxfx.santa=santa;
      }catch(e){}
      // 🛰️ Many small satellites orbiting the solar system
      try{
        var satGroup=new THREE.Group();
        var satBody=new THREE.MeshStandardMaterial({color:'#cfd6e6',metalness:.6,roughness:.35,emissive:'#1b2b4a',emissiveIntensity:.25});
        var satPanel=new THREE.MeshStandardMaterial({color:'#2a5fb0',metalness:.3,roughness:.5,emissive:'#0e2a55',emissiveIntensity:.45});
        var satDish=new THREE.MeshStandardMaterial({color:'#e8ecf5',metalness:.2,roughness:.6,side:THREE.DoubleSide});
        for(var si=0;si<3;si++){
          var sat=new THREE.Group();
          var body=new THREE.Mesh(new THREE.BoxGeometry(.9,.7,.7),satBody); body.userData.v9=true; sat.add(body);
          [-1,1].forEach(function(side){
            var panel=new THREE.Mesh(new THREE.BoxGeometry(1.5,.06,.7),satPanel);
            panel.position.x=side*1.2; panel.userData.v9=true; sat.add(panel);
          });
          var dish=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6,0,Math.PI*2,0,Math.PI/2),satDish);
          dish.position.y=.5; dish.userData.v9=true; sat.add(dish);
          sat.userData.v9=true; satGroup.add(sat);
          galaxfx.satellites.push({g:sat,r:62+si*8,y:38+si*5,sp:.00011+si*.000016,ph:si*.7,zc:16});
        }
        satGroup.userData.v9=true; addO(satGroup); galaxfx.satGroup=satGroup;
      }catch(e){}
      // Galaxy dust clouds (colorful nebula points spread wide)
      try{
        var pts=[],cols=[];
        for(var i=0;i<6;i++){
          var a=Math.random()*Math.PI*2, r=120+Math.random()*280;
          pts.push(Math.cos(a)*r,-40+Math.random()*160,Math.sin(a)*r);
          var c=new THREE.Color().setHSL(.55+Math.random()*.25,.3+Math.random()*.4,.4+Math.random()*.4);
          cols.push(c.r,c.g,c.b);
        }
        var geo=new THREE.BufferGeometry();
        geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
        geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
        var dust=new THREE.Points(geo,new THREE.PointsMaterial({size:.6,vertexColors:true,transparent:true,opacity:.35,depthWrite:false,fog:false}));
        dust.userData.v9=true; addO(dust); galaxfx.dust=dust;
        // 🌍 Big close planet so the whole planet is visible above the office
        var bigP=new THREE.Group();
        var globe=new THREE.Mesh(new THREE.SphereGeometry(24,32,24),
          new THREE.MeshStandardMaterial({color:'#2e74b8',roughness:.85,metalness:.05,emissive:'#123a60',emissiveIntensity:.4,fog:false}));
        globe.userData.v9=true; bigP.add(globe);
        var bigAtm=new THREE.Mesh(new THREE.SphereGeometry(25.5,32,24),
          new THREE.MeshBasicMaterial({color:'#67d6ff',transparent:true,opacity:.14,side:THREE.BackSide,depthWrite:false,fog:false}));
        bigAtm.userData.v9=true; bigP.add(bigAtm);
        var bigRing=new THREE.Mesh(new THREE.RingGeometry(31,42,48),
          new THREE.MeshBasicMaterial({color:'#8fd8ff',transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false,fog:false}));
        bigRing.rotation.x=Math.PI/2.6; bigRing.userData.v9=true; bigP.add(bigRing);
        bigP.position.set(23,78,-62); bigP.userData.v9=true; addO(bigP);
        galaxfx.bigPlanet=bigP;
        // 🌍 PLANET EARTH beside the office - UFO delivery destination
        try{
          var earth=new THREE.Group();
          var cv=document.createElement('canvas'); cv.width=256; cv.height=128;
          var cx=cv.getContext('2d');
          cx.fillStyle='#1e63b0'; cx.fillRect(0,0,256,128);
          cx.fillStyle='#2f8fd0'; cx.fillRect(0,54,256,22);
          cx.fillStyle='#3fae68';
          [[42,42,34,18],[104,74,46,20],[188,38,30,16],[150,100,26,10]].forEach(function(c){
            cx.beginPath(); cx.ellipse(c[0],c[1],c[2],c[3],.4,0,Math.PI*2); cx.fill();
          });
          cx.fillStyle='#eaf6ff'; cx.globalAlpha=.55;
          [[70,30,40,7],[140,52,52,8],[210,84,36,6]].forEach(function(c){
            cx.beginPath(); cx.ellipse(c[0],c[1],c[2],c[3],0,0,Math.PI*2); cx.fill();
          });
          cx.globalAlpha=1;
          var etex=new THREE.CanvasTexture(cv);
          var globe2=new THREE.Mesh(new THREE.SphereGeometry(13,32,24),
            new THREE.MeshStandardMaterial({map:etex,roughness:.9,metalness:.02,emissive:'#0e2d52',emissiveIntensity:.14,fog:false}));
          globe2.userData.v9=true; earth.add(globe2);
          var eatm=new THREE.Mesh(new THREE.SphereGeometry(13.8,32,24),
            new THREE.MeshBasicMaterial({color:'#78d6ff',transparent:true,opacity:.1,side:THREE.BackSide,depthWrite:false,fog:false}));
          eatm.userData.v9=true; earth.add(eatm);
          earth.position.set(78,62,-88); earth.userData.v9=true; addO(earth);
          // Thin Venus-style orbital ring around Earth (not the old white campus circle)
          var vRing=new THREE.Mesh(new THREE.TorusGeometry(18.5,.09,8,96),
            new THREE.MeshBasicMaterial({color:'#ffd9a0',transparent:true,opacity:.55,depthWrite:false,fog:false}));
          vRing.rotation.x=Math.PI/2.25; vRing.rotation.z=.35; vRing.userData.v9=true; earth.add(vRing);
          var vRing2=new THREE.Mesh(new THREE.TorusGeometry(20,.04,6,96),
            new THREE.MeshBasicMaterial({color:'#7fd8ff',transparent:true,opacity:.3,depthWrite:false,fog:false}));
          vRing2.rotation.x=Math.PI/2.4; vRing2.rotation.z=-.2; vRing2.userData.v9=true; earth.add(vRing2);
          galaxfx.earth=earth;
        }catch(e){}
        // Fog starts at 120 and ends at 240 — every far galaxy mesh must opt out.
        [galaxfx.santa,galaxfx.satGroup,galaxfx.bigPlanet].concat(galaxfx.planets.map(function(x){return x.g;})).forEach(function(root){
          if(!root||!root.traverse)return;
          root.traverse(function(o){
            if(!o.material)return;
            var ms=Array.isArray(o.material)?o.material:[o.material];
            ms.forEach(function(m){ if(m) m.fog=false; });
          });
        });
      }catch(e){}
    }

  function tickRealGalaxy(now,dt){
      try{
        for(var i=0;i<galaxfx.planets.length;i++){
          var p=galaxfx.planets[i];
          p.g.rotation.y+=p.sp*dt;
          var m=p.g.userData.moon;
          if(m){ var a=now/2500+i; m.position.set(Math.cos(a)*p.g.children[0].geometry.parameters.radius*2.2,0,Math.sin(a)*p.g.children[0].geometry.parameters.radius*2.2); }
        }
        if(galaxfx.dust) galaxfx.dust.rotation.y+=.0002;
        for(var si=0;si<galaxfx.satellites.length;si++){
          var st=galaxfx.satellites[si];
          var a=now*st.sp+st.ph;
          st.g.position.set(23+Math.cos(a)*st.r,st.y+Math.sin(a*2)*6,st.zc+Math.sin(a)*st.r);
          st.g.rotation.y=-a; st.g.rotation.z=Math.sin(now/1400+st.ph)*.14;
        }
        // 🔊 Galaxy ambience: cosmic hum, Santa's sleigh bells, sheep, and orbit whoosh.
        try{
          if(typeof soundOn!=='undefined'&&soundOn&&typeof snd==='function'){
            var gt=Date.now();
            if(!window.__galaxySnd) window.__galaxySnd={cosmic:0,sleigh:0,sheep:0,orbit:0};
            if(gt-window.__galaxySnd.cosmic>15000){ snd('cosmic'); window.__galaxySnd.cosmic=gt; }
            if(gt-window.__galaxySnd.sleigh>11000){ snd('sleigh'); window.__galaxySnd.sleigh=gt; }
            if(gt-window.__galaxySnd.sheep>19000){ snd('sheep'); window.__galaxySnd.sheep=gt; }
            if(gt-window.__galaxySnd.orbit>23000){ snd('orbit'); window.__galaxySnd.orbit=gt; }
          }
        }catch(e){}
        if(galaxfx.santa){
          var sa=now/9000;
          galaxfx.santa.scale.setScalar(1.6);
          galaxfx.santa.position.set(23+Math.cos(sa)*82,66+Math.sin(now/1800)*4,16+Math.sin(sa)*82);
          galaxfx.santa.rotation.y=-sa+Math.PI/2;
          galaxfx.santa.rotation.z=Math.sin(now/2200)*.05;
          if(galaxfx.santa.userData.sheep) galaxfx.santa.userData.sheep.rotation.z=Math.sin(now/900)*.12;
        }
      }catch(e){}
    }

  function buildFallingStars(){
      if(!structureGroup||!level3d)return;
      fallfx.length=0;
      for(var i=0;i<3;i++){
        var g=new THREE.Group(); g.userData.v9=true; structureGroup.add(g);
        // bright head
        var head=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),
          new THREE.MeshBasicMaterial({color:[0xffffff,0x8fd8ff,0xffd34d,0xff9fc4][i%4],fog:false}));
        head.userData.v9=true; g.add(head);
        // glowing trail
        var trail=new THREE.Mesh(new THREE.ConeGeometry(.14,3.5,8,1,true),
          new THREE.MeshBasicMaterial({color:[0x8fd8ff,0xffd34d,0xff9fc4][i%3],transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false,fog:false}));
        trail.rotation.x=Math.PI/2; trail.position.z=-1.8; trail.userData.v9=true; g.add(trail);
        fallfx.push({g:g,head:head,trail:trail,delay:Math.random()*8000,speed:.5+Math.random()*.6,
          sx:-60+Math.random()*120, sy:20+Math.random()*45, sz:-60-Math.random()*120,
          ex:40+Math.random()*80, ey:-10-Math.random()*20});
        g.visible=false;
      }
    }

  function tickFallingStars(now,dt){
      for(var i=0;i<fallfx.length;i++){
        var f=fallfx[i];
        var cycle=9000+f.delay;
        var t=((now+f.delay)%cycle)/cycle;
        if(t>.55){f.g.visible=false;continue;}
        f.g.visible=true;
        var k=t/.55;
        f.g.position.set(
          f.sx+(f.ex-f.sx)*k,
          f.sy+(f.ey-f.sy)*k,
          f.sz+(f.ex-f.sx)*k*.35
        );
        f.g.rotation.y=Math.atan2(f.ex-f.sx,f.ey-f.sy)*.2;
        f.trail.material.opacity=.6*(1-k);
        f.head.scale.setScalar(1-k*.5);
      }
    }

  function buildChristmas(){
      if(!structureGroup||!level3d)return;
      xmasfx.lights.length=0;xmasfx.gifts.length=0;xmasfx.snow.length=0;
      // Big christmas tree at Command hub side
      var tree=new THREE.Group(); tree.position.set(0,0,30); tree.scale.setScalar(.82); tree.userData.v9=true; structureGroup.add(tree);
      var trunk=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,1,8),solid('#6b4423',{roughness:.85}));trunk.position.y=.5;trunk.userData.v9=true;tree.add(trunk);
      for(var L=0;L<4;L++){
        var cone=new THREE.Mesh(new THREE.ConeGeometry(1.8-L*.35,1.6,10),solid(L%2?'#0e6b3a':'#0a5c32',{roughness:.85}));
        cone.position.y=1.2+L*1.0; cone.userData.v9=true; tree.add(cone);
      }
      var star=new THREE.Mesh(new THREE.OctahedronGeometry(.32,0),solid('#ffd34d',{emissive:'#ffd34d',emissiveIntensity:1.5,roughness:.15}));
      star.position.y=5.3; star.userData.v9=true; tree.add(star);
      xmasfx.tree=tree; xmasfx.star=star;
      // colorful christmas lights around tree + islands (String lights)
      var lc=['#ff3b3b','#ffd34d','#3dff9e','#63e6ff','#ff8df0'];
      for(var i=0;i<16;i++){
        var ang=i/40*Math.PI*2, r=2.2;
        var bulb=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),solid(lc[i%5],{emissive:lc[i%5],emissiveIntensity:1.3}));
        bulb.position.set(0+Math.cos(ang)*r*1.5, 1+Math.sin(i*.7)*3, 30+Math.sin(ang)*r*1.5);
        bulb.userData.v9=true; addO(bulb);
        xmasfx.lights.push({m:bulb,p:i*.5});
      }
      // gifts under the tree + on islands
      var giftCols=['#ff3b3b','#3dff9e','#63e6ff','#ffd34d','#ff8df0'];
      for(var g=0;g<10;g++){
        var gi=new THREE.Group();
        var boxm=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),solid(giftCols[g%5],{roughness:.6}));gi.add(boxm);
        var ribbon=new THREE.Mesh(new THREE.BoxGeometry(.55,.08,.08),solid('#ffffff'));ribbon.position.y=.26;gi.add(ribbon);
        var ribbon2=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.55),solid('#ffffff'));ribbon2.position.y=.26;gi.add(ribbon2);
        gi.traverse(function(o){o.userData.v9=true;});
        gi.position.set(5+(Math.random()-.5)*4,.3,5+(Math.random()-.5)*4); structureGroup.add(gi);
        xmasfx.gifts.push({g:gi,p:g});
      }
      // falling "snow" sparkles across the scene
      for(var sn=0;sn<0;sn++){
        var flake=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6),solid('#ffffff',{emissive:'#ffffff',emissiveIntensity:.8,transparent:true,opacity:.8}));
        flake.position.set((Math.random()-.5)*120,Math.random()*40,(Math.random()-.5)*120);
        flake.userData.v9=true; addO(flake);
        xmasfx.snow.push({m:flake,sp:.5+Math.random()*1.5});
      }
    }

  function tickChristmas(now,dt){
      try{
        if(xmasfx.star) xmasfx.star.rotation.y+=dt*1.5;
        for(var i=0;i<xmasfx.lights.length;i++){
          var l=xmasfx.lights[i];
          l.m.material.emissiveIntensity=.6+.8*(.5+.5*Math.sin(now/250+l.p));
        }
        for(var g=0;g<xmasfx.gifts.length;g++) xmasfx.gifts[g].g.rotation.y=Math.sin(now/1500+g.p)*.12;
        for(var s=0;s<xmasfx.snow.length;s++){
          var f=xmasfx.snow[s];
          f.m.position.y-=f.sp*dt;
          f.m.position.x+=Math.sin(now/1000+s)*.01;
          if(f.m.position.y<-5) f.m.position.y=40;
        }
      }catch(e){}
    }


  // ===== PERFORMANCE GUARD: freeze static objects + adaptive detail =====
  var perfg={lastCheck:0,fps:60,low:0,frozen:false,hidden:[]};
  function optimizeStatic(){ /* disabled: freezing broke animations */ }

  function adaptiveDetail(now,dt){
    if(now-perfg.lastCheck<6000)return;
    perfg.lastCheck=now;
    try{
      var info=renderer3d&&renderer3d.info;
      var calls=info?info.render.calls:0;
      // estimate load from draw calls; if very high, hide tiny decorative meshes far away
      if(calls>700 && perfg.low<3){ perfg.low++; hideTinyDetails(); }
      else if(calls<450 && perfg.low>0){ perfg.low--; showTinyDetails(); }
    }catch(e){}
  }
  function hideTinyDetails(){
    perfg.hidden=[];
    if(!structureGroup)return;
    structureGroup.traverse(function(o){
      if(perfg.hidden.length>400)return;
      if(!o.isMesh||!o.geometry)return;
      if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      var r=o.geometry.boundingSphere?o.geometry.boundingSphere.radius:0;
      if(r<0.16 && o.visible && !o.userData.v9Keep){
        o.visible=false; perfg.hidden.push(o);
      }
    });
  }
  function showTinyDetails(){ perfg.hidden.forEach(function(o){o.visible=true;}); perfg.hidden=[]; }

  // ===== 🤖 AI OPTIMIZER: specs-based quality, downgrade only (strong = unchanged) =====
  var aiOpt={tier:'high',score:0,applied:false,last:0,lowStreak:0};
  function aiDetectSpecs(){
    var ua=navigator.userAgent||'';
    var mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    var cores=navigator.hardwareConcurrency||4;
    var mem=navigator.deviceMemory||4;
    var w=window.innerWidth||1920,h=window.innerHeight||1080;
    var score=0;
    if(mobile) score+=3;
    if(cores<=4) score+=2; else if(cores<=8) score+=1;
    if(mem<=4) score+=2; else if(mem<=8) score+=1;
    if(w<900||h<600) score+=1;
    return score;
  }
  function aiApplyTier(tier){
    if(aiOpt.tier===tier&&aiOpt.applied)return;
    aiOpt.tier=tier; aiOpt.applied=true;
    // Strong device: leave everything exactly as-is.
    if(tier==='high'){ window.__officeDetail='high'; applyDetailLevel(true); return; }
    window.__officeDetail = tier==='low'?'low':'high';
    applyDetailLevel(true);
    if(tier==='low'){
      try{ if(renderer3d&&renderer3d.setPixelRatio) renderer3d.setPixelRatio(.65); }catch(e){}
      try{
        [fx.dust,fx.pets,fx.outfits].forEach(function(o){ if(o&&o.visible!==undefined)o.visible=false; });
        if(perfg.low<1){perfg.low=1;hideTinyDetails();}
      }catch(e){}
    }
  }
  function aiOptimizeTick(now,dt){
    if(now-(aiOpt.last||0)<3000)return;
    aiOpt.last=now;
    if(!aiOpt.applied){
      aiOpt.score=aiDetectSpecs();
      aiApplyTier(aiOpt.score>=5?'low':aiOpt.score>=3?'medium':'high');
      return;
    }
    if(aiOpt.tier==='high')return; // malakas: walang binabago kahit magbago ang FPS
    var fps=dt>0?1/dt:60;
    if(fps<24)aiOpt.lowStreak++; else aiOpt.lowStreak=0;
    if(aiOpt.lowStreak>=3&&aiOpt.tier!=='low'){aiOpt.lowStreak=0;aiApplyTier('low');}
  }


  // ===== CINEMATIC LIGHTING + MATERIALS UPGRADE (perf-safe) =====
  var cinefx={t:0};
  // 🎬 UE-style look using only supported WebGL features (no ray tracing / no shadow maps)
  function unrealStyle(){
    if(!structureGroup||!level3d)return;
    // 1) filmic + sRGB color pipeline (cinematic tone response)
    try{
      if(renderer3d){
        if(THREE.ACESFilmicToneMapping!==undefined) renderer3d.toneMapping=THREE.ACESFilmicToneMapping;
        if(THREE.SRGBColorSpace!==undefined && renderer3d.outputColorSpace!==undefined) renderer3d.outputColorSpace=THREE.SRGBColorSpace;
        else if(THREE.sRGBEncoding!==undefined) renderer3d.outputEncoding=THREE.sRGBEncoding;
      }
    }catch(e){}
    // 2) cheap procedural cube env map for realistic reflections on metal surfaces
    try{
      var faces=[];
      for(var i=0;i<6;i++){
        var cv=document.createElement('canvas'); cv.width=64; cv.height=64;
        var q=cv.getContext('2d');
        var g=q.createLinearGradient(0,0,0,64);
        g.addColorStop(0,'#2d4262'); g.addColorStop(.45,'#12213a'); g.addColorStop(1,'#050a14');
        q.fillStyle=g; q.fillRect(0,0,64,64);
        q.fillStyle='rgba(150,215,255,.28)'; q.fillRect(0,6,64,7);
        q.fillStyle='rgba(255,205,150,.14)'; q.fillRect(0,40,64,4);
        faces.push(cv);
      }
      // Cube env reflections removed - too heavy on mobile.

    }catch(e){}
    // 3) subtle PBR tuning on dark floor/structures (no extra lights)
    try{
      structureGroup.traverse(function(o){
        if(!o.isMesh||!o.material||!o.material.color)return;
        var h=o.material.color.getHex();
        if(h===0x20242e||h===0x171a22||h===0x0d0d14){
          o.material.roughness=.62; o.material.metalness=.22;
        }
      });
    }catch(e){}
  }
  function cinematicUpgrade(){
    if(!structureGroup||!level3d)return;
    // 1) Multi-layer key light (warm from one side, cool fill from other)
    var key=new THREE.DirectionalLight(0xffeed0,.22); key.position.set(30,50,-20); key.userData.v9Light=true; addO(key);
    var fill=new THREE.DirectionalLight(0x7fb8ff,.14); fill.position.set(-30,30,30); fill.userData.v9Light=true; addO(fill);
    // 2) Studio rim light above Command (makes the hub pop)
    var rim=new THREE.SpotLight(0xa99cff,.35,0,Math.PI/3,.6); rim.position.set(0,20,0); rim.target.position.set(0,0,0);
    rim.userData.v9Light=true; addO(rim); addO(rim.target);
    // 3) Richer materials on island tops (subtle two-tone via vertex colors baked into canvas)
    structureGroup.traverse(function(o){
      if(!o.isMesh||!o.material||!o.material.color)return;
      // brighten slightly all dark metal surfaces for depth
      var h=o.material.color.getHex();
      if(h===0x20242e||h===0x171a22||h===0x0d0d14){
        if(o.material.emissive){o.material.emissive.set('#101a2c');o.material.emissiveIntensity=.2;}
      }
    });
  }
  function tickCinematic(now,dt){
    try{
      // very slow cinematic pulse on ambient (stays near .58 guard)
      if(g&&g.amb) g.amb.intensity=.48+.03*Math.sin(now/7000);
    }catch(e){}
  }

  function buildReferenceSystem() {
    if (!level3d || !structureGroup) return false;
    walkers.length = 0; navZones.length = 0; navBridges.length = 0;
    var CX=0, CZ=0;
    navAddZone(0,0,10.5);  // Command hub = zone 0 (bigger floor so bots stay on solid ground)
    // dark outer-space floor so nothing falls
    var ground=new THREE.Mesh(new THREE.PlaneGeometry(500,500), solid('#000000',{roughness:1,metalness:0}));
    ground.rotation.x=-Math.PI/2; ground.position.y=-2.6; ground.userData.v9=true; addO(ground);
    // stars
    try{
      var pts=[];
      for(var i=0;i<0;i++){var a=Math.random()*Math.PI*2,r=40+Math.random()*100;pts.push(Math.cos(a)*r,-6+Math.random()*50,Math.sin(a)*r);}
      var geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
      var stars=new THREE.Points(geo,new THREE.PointsMaterial({color:'#9fc7ff',size:.18,transparent:true,opacity:.85,fog:false}));
      stars.userData.v9=true; addO(stars);
    }catch(e){}
    // Command hub (octagon)
    var hub=new THREE.Mesh(new THREE.CylinderGeometry(10.5,9.5,.7,16),solid('#2c2740',{roughness:.68,metalness:.16}));
    hub.position.set(CX,-.35,CZ); hub.rotation.y=Math.PI/8; hub.userData.v9=true; addO(hub);
    var hr=new THREE.Mesh(new THREE.TorusGeometry(10.6,.07,8,16),solid('#8b7cff',{emissive:'#8b7cff',emissiveIntensity:.9}));
    hr.rotation.x=Math.PI/2; hr.position.set(CX,0,CZ); hr.userData.v9=true; addO(hr);
    var beam=new THREE.Mesh(new THREE.CylinderGeometry(.32,.5,11,16,1,true),new THREE.MeshBasicMaterial({color:'#63e6ff',transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false,fog:false}));
    beam.position.set(CX,5.5,CZ); beam.userData.v9=true; addO(beam);
    animParts.push({m:beam,k:'led',p:.4});
    [1.0,1.7,2.5].forEach(function(r,i){
      var ring=new THREE.Mesh(new THREE.TorusGeometry(r,.05,8,32),solid(i===1?'#ff8df0':'#63e6ff',{emissive:i===1?'#ff8df0':'#63e6ff',emissiveIntensity:1}));
      ring.rotation.x=Math.PI/2; ring.position.set(CX,.3+i*.35,CZ); ring.userData.v9=true; addO(ring);
      animParts.push({m:ring,k:i===1?'spinFlatR':'spinFlat',s:.45});
    });
    // CEO decision paper + operator
    box(1.0,.03,.65,solid('#f5f1e6',{roughness:.7}),CX-.9,.46,CZ+1.0);
    box(.75,.02,.04,'#c9d2e0',CX-.9,.49,CZ+.93);
    refDesk(CX,CZ+1.5,'#a98cff');
    refBot(CX,CZ+2.4,'#c08cff','Nazira');
    // Command sign removed - one big CYBEE board only.
    // 5 departments (roles from the reference video)
    var deps=[
      {x:-17.6,z:-24.3,c:'#f0a040',t:'Marketing',a:[['Milia','#f0a040'],['Zara','#ffb060'],['Marco','#b98cff']]},
      {x:17.6,z:-24.3,c:'#4fd6b0',t:'Data & Insights',a:[['Rena','#4fd6b0'],['Aria','#63e6ff']]},
      {x:-28.5,z:9.3,c:'#5fa8ff',t:'Systems',a:[['Kai','#5fa8ff'],['Dan','#4fd6b0']]},
      {x:28.5,z:9.3,c:'#d8c860',t:'Finance',a:[['Faris','#d8c860'],['Hanna','#e8d98f']]},
      {x:0,z:30,c:'#ff7fb0',t:'People & Customers',a:[['Hafiz','#ff7fb0'],['Lara','#ff9ec4'],['Sophia','#c08cff']]}
    ];
    deps.forEach(function(d){
      refIsland(d.x,d.z,10,d.c,d.t,d.a);
      refBridge(CX,CZ,d.x,d.z,d.c);
      navAddBridge(CX,CZ,d.x,d.z);
      var zi=navAddZone(d.x,d.z,10.0);
      // tag this island's robots with their zone
      for(var w=0;w<walkers.length;w++){ if(walkers[w].zone==null && Math.hypot(walkers[w].x-d.x,walkers[w].z-d.z)<11) walkers[w].zone=zi; }
    });
    // command bot belongs to hub zone 0
    walkers.forEach(function(w){ if(w.zone==null) w.zone=0; });
    // Start the living loop FIRST — a failing visual builder must never stop the robots.
    startWalkLoop();
    // Each visual layer is isolated: one failure can't block the others.
    // ⚡ DRAW-CALL CUT: heavy decorative layers disabled by CEO request (lag).
    // Kept: core, particles, life, janitors, UFO delivery, galaxy/Earth, tree, lighting.
    var layers=[ ['enhance3D',enhance3D], ['buildJuice',buildJuice], ['buildAlive',buildAlive],
      ['buildJanitor',buildJanitor], ['buildUfoDelivery',buildUfoDelivery], ['buildRealGalaxy',buildRealGalaxy],
      ['buildChristmas',buildChristmas], ['unrealStyle',unrealStyle], ['cinematicUpgrade',cinematicUpgrade] ];
    function runLayer(pair){ try{ pair[1](); }catch(e){ try{console.warn('scene layer failed:',pair[0],e&&e.message);}catch(_){}} }
    // ⚡ First open: build only the 3 essential layers now; defer the rest one per
    // idle callback so the page becomes interactive immediately (no first-open lag).
    layers.slice(0,4).forEach(runLayer);
    var rest=layers.slice(4), li=0;
    var idle=window.requestIdleCallback||function(cb){ setTimeout(cb,24); };
    function nextLayer(){ if(li>=rest.length)return; runLayer(rest[li++]); idle(nextLayer); }
    idle(function(){ idle(nextLayer); });
    return true;
  }

  function buildRealOffice3d() {
    if (typeof THREE === 'undefined' || !g || !g.level) return false;
    ensureGrade();
    tameOfficeLights._lights = null; // ⏱ i-refresh ang light cache pagkatapos mag-build
    cuteBots.forEach(function (b) { if (b.bubble && b.bubble.parentNode) b.bubble.parentNode.removeChild(b.bubble); });
    cuteBots.length = 0; animParts.length = 0; screenCounter = 0; TEX = {};
    fx = { shafts: [], screens: [], dust: null, bubbles: [], steam: [], plants: [], sparkles: [], birds: [], scan: [], windows: [], sheen: null,
      auras: [], antennae: [], glints: [], bands: [], cars: [], sun: null, sky: null,
      blinds: [], reflections: [], signals: [], peds: [], ballers: [], ball: null, planes: [], ceilings: [], steps: [], moods: [],
      scenery: [], crops: [], softScenery: [],
      night: null, weather: { rain: null, flash: null, puddles: [], rainbow: null },
      seasons: {}, walkways: [], holo: [], wet: [], neon: [], drones: [], rooftop: null, basement: null, elevator: null,
      barista: null, growthPlants: [], fish: null, skylineLights: [], ceilingProj: null,
      pets: [], outfits: [],
      botFeatures: { barista: true, plants: true, fish: true, skyline: true, ceiling: false,
        nameplates: false, status: false, idle: true, outfits: true, pets: true } };
    if (animId) { try { cancelAnimationFrame(animId); } catch (e) {} animId = null; }
    try {
      level3d.clear();
      structureGroup = new THREE.Group();
      level3d.add(structureGroup);
    } catch (e) {}

    // White-out fixes retained exactly: muted background, dark surround,
    // exposure .85, ambient .58, day/night switch pre-resolved.
    scene3d.background = new THREE.Color('#070c18');
    scene3d.fog = new THREE.Fog('#070c18', 120, 240);
    scene3d.isNight = 0;
    try { renderer3d.toneMappingExposure = .66; } catch (e) {}
    if (g.amb) { g.amb.intensity = .48; g.amb.color.set('#8fa4c4'); }
    if (g.sun) g.sun.intensity = .86;
    [[12, 3.1, 9], [34, 3.1, 9], [23, 3.1, 28]].forEach(function (p) {
      var l = new THREE.PointLight(0xffe9c0, .3, 38);
      l.position.set(p[0], p[1], p[2]); l.userData.v9Light = true; addO(l);
    });
    tameOfficeLights();
    dustField();

    // FULL REFERENCE SYSTEM: command hub + 5 department islands
    buildReferenceSystem();

    // The main app's simple-mode cull hides any unflagged object above y=3.15.
    // Everything now in level3d belongs to this v9 office, so flag it all —
    // this keeps the skyline, billboard, sun glow, birds and lamps visible.
    try {
      level3d.traverse(function (o) {
        if (!o.userData) o.userData = {};
        o.userData.v9 = true;
      });
    } catch (e) {}
    if (!animId) animId = requestAnimationFrame(tick);
    return true;
  }

  function currentConv() {
    try {
      if (typeof S !== 'undefined' && S && S.conversations && S.conversations[0]) return S.conversations[0];
    } catch (e) {}
    return null;
  }
  // Comic conversations: up to three consecutive lines, anchored above their
  // bots. Bubbles are DOM overlays, so their on-screen size never shrinks when
  // the camera zooms out. A deterministic stack pass keeps them from colliding
  // even inside a narrow office panel.
  function updateBubbles(now) {

    var conv = currentConv(), lines = null, start = 0;
    // Keep comic bubbles on screen even if a scheduled AI refresh gets skipped
    // (busy task / low quota). The server refreshes every 3 min now, so the
    // newest conversation still swaps in as soon as it arrives.
    if (conv && now - conv.t < 12 * 60 * 1000 && conv.lines && conv.lines.length) {
      lines = conv.lines;
      start = Math.floor(now / 3800) % lines.length;
    }
    var host = document.getElementById('oc3d');
    if (!host) return;
    try { if (camera3d && camera3d.updateMatrixWorld) camera3d.updateMatrixWorld(true); } catch (e) {}
    var w = host.clientWidth || 900, h = host.clientHeight || 520;
    var placed = [];
    cuteBots.forEach(function (b) {
      b.wasShown = !!b.shown;
      b.shown = false;
      if (b.bubble.style.display !== 'none') b.bubble.style.display = 'none';
      b.bubble.classList.remove('talking');
      b.talking = false;
    });
    if (!lines || typeof camera3d === 'undefined' || !camera3d) return;
    // Small panels only fit two bubbles cleanly; wider views show three.
    var count = Math.min(w < 800 ? 2 : 3, lines.length);
    for (var n = 0; n < count; n++) {
      var line = lines[(start + n) % lines.length];
      var bot = null;
      for (var i = 0; i < cuteBots.length; i++) {
        if (cuteBots[i].id === line.id) { bot = cuteBots[i]; break; }
      }
      if (!bot) continue;
      var v = _bubV || (_bubV = new THREE.Vector3()); // ⏱ iisa lang, hindi bagong object bawat frame
      v.set(bot.group.position.x, bot.group.position.y + 2.15, bot.group.position.z).project(camera3d);
      if (v.z >= 1) continue;
      var el = bot.bubble;
      var html = '<b>' + esc(bot.n) + '</b>' + esc(line.text);
      // ⏱ 4D time-life: a new line (or a freshly visible bubble) starts a fresh
      // pop-in clock; the transform below keeps it floating while it talks.
      if (el.innerHTML !== html || !bot.wasShown) { bot.bornAt = now; el.innerHTML = html; bot.bw = 0; }
      bot.shown = true;
      if (el.style.display !== 'block') el.style.display = 'block';
      el.classList.add('talking');
      // ⏱ Cache ang laki ng bubble: offsetWidth/Height ay forced layout read.
      // 25×/second itong tinatawag — sukatin lang pag nagbago ang text o pag
      // nag-resize (5s), otherwise gamitin ang naka-cache. Buhay pa rin ang galaw.
      if (!bot.bw || !bot.bh || now - (bot.measuredAt || 0) > 5000) {
        bot.bw = el.offsetWidth || 280; bot.bh = el.offsetHeight || 70; bot.measuredAt = now;
      }
      var bw = bot.bw, bh = bot.bh;
      var x0 = (v.x * .5 + .5) * w - bw / 2;
      var y0 = (-v.y * .5 + .5) * h - bh - 16;
      placed.push({
        el: el, bot: bot, w: bw, h: bh,
        x: Math.max(8, Math.min(w - bw - 8, x0)),
        y: Math.max(8, Math.min(h - bh - 8, y0))
      });
      bot.talking = true;
    }
    // Sort by desired height, then enforce a gap. If the stack is too tall,
    // slide the whole group up so every bubble stays fully inside the view.
    placed.sort(function (a, b) { return a.y - b.y; });
    for (var p = 1; p < placed.length; p++) {
      if (placed[p].y < placed[p - 1].y + placed[p - 1].h + 8) {
        placed[p].y = placed[p - 1].y + placed[p - 1].h + 8;
      }
    }
    var overflow = placed.length ? (placed[placed.length - 1].y + placed[placed.length - 1].h + 8) - h : 0;
    if (overflow > 0) placed.forEach(function (r) { r.y = Math.max(8, r.y - overflow); });
    // .bub3d is transformed translate(-50%,-100%), so anchor at bottom-center.
    placed.forEach(function (r) {
      r.el.style.left = (r.x + r.w / 2) + 'px';
      r.el.style.top = (r.y + r.h) + 'px';
      // ⏱ 4D: pop-in ease + tiny overshoot, gentle float, sway and a soft
      // talking pulse — all driven by time (the 4th dimension).
      var bot = r.bot, age = Math.max(0, now - (bot.bornAt || now));
      var t = Math.min(1, age / 300);
      var ease = 1 - Math.pow(1 - t, 3);
      var pop = Math.sin(t * Math.PI) * 0.055;
      var sc = (0.74 + 0.26 * ease + pop) * (1 + Math.sin(now / 300 + (bot.phase || 0)) * 0.012);
      var fl = Math.sin(now / 660 + (bot.phase || 0)) * 3.2;
      var sw = Math.sin(now / 1000 + (bot.phase || 0) * 1.6) * 1.3;
      r.el.style.transform = 'translate(-50%,-100%) translateY(' + fl.toFixed(2) + 'px) rotate(' + sw.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      r.el.style.opacity = Math.min(1, age / 170).toFixed(3);
    });
  }
  function tick() {
    animId = requestAnimationFrame(tick);
    if (document.hidden) return;
    // ⏱ Perf: ang 4D world ay tumatakbo lang habang nasa office/boardroom.
    // Hindi inaalis ang galaw — tinitigil lang kapag hindi nakikita.
    if (typeof view !== 'undefined' && view !== 'office' && view !== 'boardroom') return;
    var now = Date.now();
    // Perf preset: 25 FPS cap (was 30) lowers GPU/CPU load on weak machines.
    if (now - (tick.last || 0) < 40) return;
    var prevTick = tick.last || now;
    tick.last = now;
    var botDt = Math.min(.12, Math.max(0, (now - prevTick) / 1000));
    try {
      if (scene3d) {
        if (scene3d.background && typeof scene3d.background.getHex==='function' && scene3d.background.getHex()!==0x1b2c55 && !scene3d.background.isTexture) { try{scene3d.background.set('#1b2c55');}catch(e){} }
        if (scene3d.fog && scene3d.fog.color && scene3d.fog.color.getHex() !== 0x1b2c55) scene3d.fog.color.set('#1b2c55');
      }
      if (g && g.amb && Math.abs(g.amb.intensity - .48) > .01) { g.amb.intensity = .48; g.amb.color.set('#8fa4c4'); }
      tameOfficeLights();
      if (renderer3d && Math.abs(renderer3d.toneMappingExposure - .85) > .01) renderer3d.toneMappingExposure = .66;
    } catch (e) {}
    applyCeilingView();
    // ⏱ Detail check 2s na lang, hindi 25×/second (may change guard na ito).
    if (now - (applyDetailLevel._at || 0) > 2000) { applyDetailLevel._at = now; applyDetailLevel(); }
    // Batch 1 world layer — smooth night, weather, seasons and ambient life.
    // It never writes bg/fog/ambient/exposure/isNight (the guards above own them).
    updateBatch1World(now, botDt);
    // Batch 2 character layer — barista, plants, fish, skyline lights, ceiling.
    updateBatch2World(now, botDt);
    // Photo mode: keep camera/render alive but hold every bot and effect still.
    if (typeof window !== 'undefined' && window.__officeFreeze === true) return;
    cuteBots.forEach(function (b, i) {
      if (!b.walking && now >= b.jobUntil) startBotWalk(b, now);
      if (b.walking) {
        var p = Math.min(1, (now - b.walkStart) / b.walkDur);
        var ease = p * p * (3 - 2 * p);
        b.group.position.x = b.walkFrom.x + (b.walkTo.x - b.walkFrom.x) * ease;
        b.group.position.z = b.walkFrom.z + (b.walkTo.z - b.walkFrom.z) * ease;
        var heading = Math.atan2(b.walkTo.x - b.walkFrom.x, b.walkTo.z - b.walkFrom.z);
        b.face = turnTo(b.face, heading, botDt * 7);
        b.group.position.y = b.baseY + Math.abs(Math.sin(now / 150 + b.phase)) * .075;
        b.group.rotation.y = b.face;
        b.group.rotation.z = Math.sin(now / 300 + b.phase) * .05;
        b.group.rotation.x = Math.sin(now / 450 + b.phase) * .018;
        var sw = Math.sin(now / 145 + b.phase) * .6;
        if (b.legs) { b.legs[0].rotation.x = sw; b.legs[1].rotation.x = -sw; }
        if (b.arm) { b.arm.rotation.z = -.85 - sw * .45; b.arm.rotation.x = 0; }
        if (b.armL) { b.armL.rotation.z = .85 - sw * .45; b.armL.rotation.x = 0; }
        if (b.head) {
          b.head.rotation.y = Math.sin(now / 1200 + b.phase) * 0.08;
          b.head.rotation.x = Math.sin(now / 900 + b.phase) * 0.028;
          b.head.rotation.z = Math.sin(now / 1500 + b.phase) * 0.012;
        }
        if (now - b.stepAt > 260) { stepPuff(b, now); b.stepAt = now; }
        if (p >= 1) { b.wp = b.nextWp; startBotWork(b, now); }
      } else {
        var st = b.route[b.wp];
        var lifeW = now / 1000 + b.phase;
        b.group.position.x = st.x + Math.sin(lifeW * 0.43) * 0.012;
        b.group.position.z = st.z + Math.cos(lifeW * 0.37) * 0.012;
        b.group.position.y = b.baseY + Math.sin(now / 520 + b.phase) * .035;
        b.group.rotation.y = turnTo(b.group.rotation.y, b.face, botDt * 5);
        animateBotWork(b, now, i);
        if (now - b.emoAt > 1600 + (i % 3) * 320) {
          b.emoAt = now;
          setBotMood(b, b.job, now, true);
        }
      }
      var life = now / 1000 + b.phase;
      var breath = 1 + Math.sin(life * 1.15) * 0.012;
      var squash = 1 + Math.sin(now / 330 + b.phase) * (b.walking ? .035 : .018);
      // v56 character 4D: subtle breathing, talking bounce/nod, antenna life.
      if (b.talking) {
        b.group.position.y += 0.018 + Math.sin(now / 220 + b.phase) * 0.012;
        if (b.head) b.head.rotation.x += 0.03 + Math.sin(now / 190 + b.phase) * 0.015;
      }
      b.group.scale.set(b.baseScale * breath, b.baseScale * squash, b.baseScale / Math.sqrt(breath));
      if (b.tip) b.tip.position.y = 1.15 + Math.sin(life * 2.1) * 0.012 + Math.sin(life * 3.4) * 0.005;
      var pulse = .5 + .5 * Math.sin(now / 600 + i);
      if (b.aura) {
        b.aura.position.set(b.group.position.x, .028, b.group.position.z);
        b.aura.material.opacity = b.talking ? .22 + .16 * pulse : .1 + .08 * pulse;
        b.aura.scale.setScalar(b.talking ? 1.1 + .1 * pulse : 1 + .05 * pulse);
      }
      if (b.shadow) {
        b.shadow.position.set(b.group.position.x, .012, b.group.position.z);
        b.shadow.scale.setScalar(b.baseScale * (1 + Math.sin(now / 330 + b.phase) * .05));
        b.shadow.material.opacity = b.walking ? .21 : .28;
      }
      if (b.refl) {
        b.refl.position.x = b.group.position.x;
        b.refl.position.z = b.group.position.z + .1;
        b.refl.rotation.z = -b.group.rotation.y;
      }
      // v30: antenna tip doubles as a tiny job status lamp.
      if (b.tip && b.tip.material) {
        var hint = JOB_HINTS[b.job] || JOB_HINTS.walk;
        var theme = (typeof window !== 'undefined' && window.__officeTheme) || 'default';
        var col = theme === 'fiesta' ? '#ff9fc0'
          : theme === 'pasko' ? '#7cf7a0'
          : theme === 'rainy' ? '#8fb8ff' : hint[0];
        if (b.tip.material.color.getHexString() !== col.slice(1)) b.tip.material.color.set(col);
        if (b.tip.material.emissive) b.tip.material.emissive.set(col);
        b.tip.material.emissiveIntensity = hint[1] * (.78 + .28 * Math.sin(now / 230 + i));
      }
      b.tx = b.group.position.x; b.tz = b.group.position.z;
      updateBotBatch2(b, now, i);
    });
    updateBotParticles(now);
    if (now - (tick.glow || 0) > 140) {
      tick.glow = now;
      animParts.forEach(function (a) {
        var m = a.m;
        if (!m) return;
        if (a.k === 'spin') { m.rotation.y += (a.s || .5) * 0.016; m.rotation.x += (a.s || .5) * 0.008; return; }
        if (a.k === 'spinFlat') { m.rotation.z += (a.s || .3) * 0.016; return; }
        if (a.k === 'spinFlatR') { m.rotation.z -= (a.s || .3) * 0.016; return; }
        if (a.k === 'spinY') { m.rotation.y += (a.s || .3) * 0.016; return; }
        if (a.k === 'bob') { m.position.y = Math.sin(now/600 + a.p) * 0.06; return; }
        if (!m.material || m.material.emissiveIntensity === undefined) return;
        m.material.emissiveIntensity = a.k === 'led'
          ? .3 + .65 * (.5 + .5 * Math.sin(now / 240 + a.p))
          : .7 + .22 * Math.sin(now / 720 + a.p);
      });
    }
    try {
      // Animated monitor dashboards (staggered so 24 canvases never repaint at once).
      if (false && now - (tick.screens || 0) > 500 && fx.screens.length) {
        tick.screens = now;
        for (var si = 0; si < 3; si++) {
          var sc = fx.screens[(tick.screenPtr || 0) % fx.screens.length];
          tick.screenPtr = ((tick.screenPtr || 0) + 1) % fx.screens.length;
          sc.step++;
          try { paintScreen(sc.q, 256, sc.idx, sc.step); sc.t.needsUpdate = true; } catch (e) {}
        }
      }
      fx.shafts.forEach(function (a) {
        a.m.material.opacity = .04 + .03 * (.5 + .5 * Math.sin(now / 900 + a.p)) + .01 * (.5 + .5 * Math.sin(now / 2300 + a.p * .7));
      });
      if (fx.dust && fx.dust.pts) {
        var arr = fx.dust.pts.geometry.attributes.position.array;
        for (var di = 0; di < fx.dust.ph.length; di++) {
          var baseY = .4 + ((fx.dust.pos[di * 3 + 1] - .4 + now / 9000 + fx.dust.ph[di] * .4) % 2.7);
          arr[di * 3] = fx.dust.pos[di * 3] + Math.sin(now / 1600 + fx.dust.ph[di]) * .35;
          arr[di * 3 + 1] = baseY;
        }
        fx.dust.pts.geometry.attributes.position.needsUpdate = true;
      }
      fx.bubbles.forEach(function (a) {
        var ph = (now / 1000 * a.sp + a.p) % 1;
        a.m.position.y = a.base + ph * .3;
        a.m.position.x = a.x0 + Math.sin(now / 700 + a.p) * .03;
        a.m.material.opacity = .12 + .45 * Math.sin(ph * Math.PI);
        a.m.scale.setScalar(.7 + .5 * ph);
      });
      fx.steam.forEach(function (a) {
        var ph = (now / 1700 + a.p / 7) % 1;
        a.m.position.y = a.base + ph * .55;
        a.m.position.x = a.x + Math.sin(now / 900 + a.p) * .12;
        a.m.material.opacity = .18 * (1 - ph);
        a.m.scale.set(.12 + ph * .1, .2 + ph * .16, 1);
      });
      fx.sparkles.forEach(function (a) {
        if (a.baseY === undefined) a.baseY = a.m.position.y;
        var v = .5 + .5 * Math.sin(now / 520 + a.p);
        var v2 = .5 + .5 * Math.sin(now / 1300 + a.p * 1.4);
        a.m.material.opacity = .12 + .55 * v + .15 * v2;
        a.m.position.x = a.base + Math.sin(now / 900 + a.p) * .07;
        a.m.position.y = a.baseY + Math.sin(now / 1100 + a.p * .8) * .03;
        a.m.scale.setScalar(.065 + .055 * v + .02 * v2);
      });
      if (now - (tick.plants || 0) > 80) {
        tick.plants = now;
        fx.plants.forEach(function (a) {
          var breathe = .5 + .5 * Math.sin(now / 4200 + a.p * .3);
          a.m.rotation.z = a.bz + Math.sin(now / 1200 + a.p) * (.03 + .015 * breathe) + Math.sin(now / 2600 + a.p * 1.7) * .01;
          a.m.rotation.x = a.bx + Math.cos(now / 1450 + a.p) * (.025 + .012 * breathe) + Math.cos(now / 3100 + a.p * 1.3) * .008;
        });
      }
      fx.birds.forEach(function (a) {
        a.g.position.x = -12 + ((now / 1000 * a.sp + a.p * 4) % 64);
        a.g.position.y = a.base + Math.sin(now / 900 + a.p) * .25 + Math.sin(now / 2300 + a.p * 1.3) * .07;
        a.g.rotation.z = Math.sin(now / 700 + a.p) * .06;
        a.g.rotation.x = Math.sin(now / 1200 + a.p) * .035;
        var flap = .3 + Math.sin(now / 160 + a.p) * .25 + Math.sin(now / 430 + a.p) * .05;
        if (a.g.children[0]) a.g.children[0].rotation.z = flap;
        if (a.g.children[1]) a.g.children[1].rotation.z = -flap;
      });
      fx.scan.forEach(function (a) {
        a.m.position.y = .32 + ((now / 1800 + a.p * 2) % 1.7);
        a.m.material.opacity = .25 + .18 * (.5 + .5 * Math.sin(now / 500 + a.p));
      });
      if (now - (tick.windows || 0) > 260) {
        tick.windows = now;
        fx.windows.forEach(function (a) {
          if (a.m.material && a.m.material.emissiveIntensity !== undefined) {
            a.m.material.emissiveIntensity = .45 + .55 * (.5 + .5 * Math.sin(now / 730 + a.p * 2.3));
          }
        });
      }
      if (fx.sheen) {
        fx.sheen.position.x = 2 + ((now / 55) % 42);
        fx.sheen.material.opacity = .055 + .035 * (.5 + .5 * Math.sin(now / 700));
      }
      fx.antennae.forEach(function (a) {
        if (a.m.material && a.m.material.emissiveIntensity !== undefined) {
          a.m.material.emissiveIntensity = .7 + .5 * (.5 + .5 * Math.sin(now / 420 + a.p));
        }
      });
      fx.glints.forEach(function (a) {
        a.m.material.opacity = .07 + .06 * (.5 + .5 * Math.sin(now / 1100 + a.p)) + .03 * (.5 + .5 * Math.sin(now / 2700 + a.p * .6));
      });
      fx.bands.forEach(function (a) {
        a.m.material.opacity = .09 + .045 * (.5 + .5 * Math.sin(now / 1600 + a.p)) + .02 * (.5 + .5 * Math.sin(now / 3400 + a.p * .8));
      });
      fx.blinds.forEach(function (a) {
        a.m.material.opacity = .12 + .035 * (.5 + .5 * Math.sin(now / 2100 + a.p)) + .015 * (.5 + .5 * Math.sin(now / 5200 + a.p * .5));
      });
      fx.reflections.forEach(function (a) {
        a.m.material.opacity = a.base * (.78 + .28 * (.5 + .5 * Math.sin(now / 1400 + a.p)) + .12 * (.5 + .5 * Math.sin(now / 3600 + a.p * .7)));
      });
      var dt = Math.min(.12, (now - (tick.carLast || now)) / 1000);
      tick.carLast = now;
      fx.cars.forEach(function (a) {
        a.g.position.x += a.dir * a.speed * dt * 3.5;
        if (a.dir > 0 && a.g.position.x > 58) a.g.position.x = -12;
        if (a.dir < 0 && a.g.position.x < -12) a.g.position.x = 58;
        var ph = a.phase || 0;
        a.g.position.y = Math.sin(now / 380 + ph) * 0.01 + Math.sin(now / 110 + ph * 2.3) * 0.002;
        a.g.rotation.z = Math.sin(now / 520 + ph) * 0.008;
        a.g.rotation.x = Math.sin(now / 760 + ph * 1.3) * 0.004;
      });
      fx.peds.forEach(function (a) {
        a.g.position.x += a.dir * a.speed * dt * 1.35;
        if (a.dir > 0 && a.g.position.x > 56) a.g.position.x = -10;
        if (a.dir < 0 && a.g.position.x < -10) a.g.position.x = 56;
        var sw = Math.sin(now / 190 + a.phase) * .42;
        if (a.legs[0]) a.legs[0].rotation.x = sw;
        if (a.legs[1]) a.legs[1].rotation.x = -sw;
        if (a.arms[0]) a.arms[0].rotation.x = -sw * .8;
        if (a.arms[1]) a.arms[1].rotation.x = sw * .8;
        a.g.position.y = Math.abs(Math.sin(now / 220 + a.phase)) * 0.03;
        a.g.rotation.z = Math.sin(now / 640 + a.phase) * 0.028;
        a.g.rotation.x = Math.sin(now / 820 + a.phase) * 0.012;
      });
      // Basketball mini-bots: ellipse cuts, leg/arm swings, dribble and a shot arc.
      if (fx.ballers.length) {
        fx.ballers.forEach(function (a) {
          var pt = now / 1000 * a.sp + a.phase;
          var vx = Math.cos(pt) * a.rx;
          var vz = -Math.sin(pt * .83) * a.rz * .83;
          a.g.position.x = a.baseX + Math.sin(pt) * a.rx;
          a.g.position.z = a.baseZ + Math.cos(pt * .83) * a.rz;
          a.g.position.y = .02 + Math.abs(Math.sin(now / 150 + a.phase)) * .08;
          if (vx * vx + vz * vz > .0001) a.g.rotation.y = Math.atan2(vx, vz);
          a.g.rotation.x = Math.sin(now / 420 + a.phase) * 0.025;
          a.g.rotation.z = Math.sin(now / 560 + a.phase) * 0.03;
          var sw = Math.sin(now / 140 + a.phase) * .55;
          if (a.legs[0]) a.legs[0].rotation.x = sw;
          if (a.legs[1]) a.legs[1].rotation.x = -sw;
          if (a.arms[0]) a.arms[0].rotation.x = -sw * .85;
          if (a.arms[1]) a.arms[1].rotation.x = sw * .85;
        });
        var ball = fx.ball;
        if (ball) {
          var handler = fx.ballers[Math.floor(now / 3600) % fx.ballers.length];
          var cycle = Math.floor(now / 9000);
          if (ball.cycle !== cycle) {
            ball.cycle = cycle;
            ball.shotStart = now + 4200 + (cycle % 2) * 1800;
            ball.from = null; ball.to = null;
          }
          var shooting = now >= ball.shotStart && now < ball.shotStart + 1500;
          if (shooting) {
            if (!ball.from) {
              ball.from = ball.from || new THREE.Vector3();
              ball.to = ball.to || new THREE.Vector3();
              ball.from.copy(handler.g.position); ball.from.y = .65;
              ball.to.set(ball.cx, 2.95, ball.cz + (cycle % 2 ? 8.05 : -8.05));
            }
            var p = (now - ball.shotStart) / 1500;
            ball.position.lerpVectors(ball.from, ball.to, p);
            ball.position.y += Math.sin(p * Math.PI) * 2.1;
          } else {
            ball.from = null;
            var ry = handler.g.rotation.y;
            var tx = handler.g.position.x + Math.sin(ry) * .28;
            var tz = handler.g.position.z + Math.cos(ry) * .28;
            var ty = .19 + Math.abs(Math.sin(now / 150 + 1.1)) * .3;
            ball.position.x += (tx - ball.position.x) * .45;
            ball.position.z += (tz - ball.position.z) * .45;
            ball.position.y = ty;
          }
          if (ball.shadow) {
            var bh = Math.max(0, ball.position.y - .19);
            ball.shadow.position.x = ball.position.x;
            ball.shadow.position.z = ball.position.z;
            ball.shadow.scale.set(.24 + bh * .13, .16 + bh * .08, 1);
            ball.shadow.material.opacity = .22 / (1 + bh * 2.2);
          }
          ball.rotation.x += dt * 5;
          ball.rotation.z += dt * 2.2;
        }
      }
      fx.planes.forEach(function (a) {
        a.g.position.x += a.sp * dt;
        if (a.g.position.x > a.x1) a.g.position.x = a.x0;
        var ph = a.phase || 0;
        a.g.position.y = a.y + Math.sin(now / 1300) * .18 + Math.sin(now / 3700 + ph) * .05;
        a.g.position.z = a.z + Math.sin(now / 2100) * .6 + Math.sin(now / 5200 + ph) * .08;
        a.g.rotation.z = -.035 + Math.sin(now / 1800) * .045;
        a.g.rotation.x = Math.sin(now / 2400 + ph) * .012;
        a.g.rotation.y = Math.sin(now / 4100 + ph) * .01;
        if (a.beacon) a.beacon.material.opacity = .25 + .7 * (.5 + .5 * Math.sin(now / 230));
        if (a.trails) a.trails.forEach(function (t, i) {
          t.material.opacity = .12 + .06 * (.5 + .5 * Math.sin(now / 700 + i)) + .03 * (.5 + .5 * Math.sin(now / 1700 + i + ph));
        });
      });
      if (fx.sky && fx.sky.m) fx.sky.m.position.x = 23 + Math.sin(now / 17000) * 1.5;
      if (fx.sky && fx.sky.refl && fx.sky.refl.material && fx.sky.refl.material.map) {
        fx.sky.refl.material.map.offset.x = .03 * Math.sin(now / 9000);
      }
      if (now - (tick.signals || 0) > 2200) {
        tick.signals = now;
        fx.signals.forEach(function (a) {
          var active = Math.floor(now / 2200 + a.p) % 3;
          a.lamps.forEach(function (l, k) {
            if (l.material && l.material.emissiveIntensity !== undefined) {
              l.material.emissiveIntensity = k === active ? 1.2 : .05;
            }
          });
        });
      }
      if (fx.crops && fx.crops.length) {
        fx.crops.forEach(function (a) {
          var ph = a.idx * 1.7 + a.x * 0.13 + a.z * 0.11;
          a.m.rotation.z = Math.sin(now / 1400 + ph) * 0.045;
          a.m.rotation.x = Math.cos(now / 1700 + ph) * 0.03;
        });
      }
      if (fx.sun) {
        var sp = 1 + .04 * Math.sin(now / 1900);
        fx.sun.scale.set(11 * sp, 11 * sp, 1);
        if (fx.sun.material) fx.sun.material.opacity = .10 + .03 * (.5 + .5 * Math.sin(now / 2400));
      }
    } catch (e) {}
    // ⏱ 4D time-life para sa hardin — dahan-dahang hihipa ng oras (crops: nasa tick na).
    if (now - (tick.softLife || 0) > 90) {
      tick.softLife = now;
      try {
        if (fx.softScenery && fx.softScenery.length) fx.softScenery.forEach(function (s) {
          var w = Math.sin(now / 1450 + s.ph);
          s.m.rotation.z = w * .05;
          s.m.scale.y = 1 + w * .035;
          if (s.bloom) s.m.position.y = s.baseY + Math.sin(now / 900 + s.ph) * .035;
        });
      } catch (e) {}
    }
    updateBubbles(now);
  }

  setTimeout(function () {
    var conv = currentConv();
    if (conv && Date.now() - conv.t < 120000) return;
    var pass = (typeof ceoPass !== 'undefined' && ceoPass) ? ceoPass : '';
    if (!pass) return;
    try {
      fetch('/api/conversation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pass: pass }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.ok && typeof refresh === 'function') refresh(); })
        .catch(function () {});
    } catch (e) {}
  }, 4000);

  var healTries = 0;
  var healTimer = setInterval(function () {
    healTries++;
    try {
      if (typeof selRoom !== 'undefined' && selRoom === 'hq' &&
          typeof level3d !== 'undefined' && level3d && cuteBots.length === 0) buildRealOffice3d();
    } catch (e) {}
    if (cuteBots.length || healTries >= 40) clearInterval(healTimer);
  }, 700);

  /* ================= BATCH 1 — living world layer =================
     Ten optional visual upgrades. Every object here is flagged v9, uses cheap
     basic/standard materials, and stays completely independent of the
     white-out guards (bg/fog #93a1b3, ambient .58, exposure .85, isNight 0,
     tameOfficeLights). Nothing in this block writes those guarded values. */
  var _v9dir = null;
  function faceCamera(m, dist) {
    if (!camera3d || !m) return;
    try {
      camera3d.updateMatrixWorld(true);
      if (!_v9dir) _v9dir = new THREE.Vector3();
      _v9dir.set(0, 0, -1).applyQuaternion(camera3d.quaternion);
      m.position.copy(camera3d.position).addScaledVector(_v9dir, dist);
      m.quaternion.copy(camera3d.quaternion);
      var h = 2 * dist * Math.tan((camera3d.fov || 52) * Math.PI / 360) * 1.06;
      m.scale.set(h * (camera3d.aspect || 1.7), h, 1);
    } catch (e) {}
  }
  function v9Group(x, y, z) {
    var g2 = new THREE.Group(); g2.position.set(x || 0, y || 0, z || 0);
    g2.userData.v9 = true; addO(g2); return g2;
  }
  function neonSign(text, color, x, y, z, ry, w, h) {
    var key = 'neon-' + text + '-' + color;
    var tex = makeTex(key, function (q, S) {
      q.clearRect(0, 0, S, S);
      q.font = 'bold 60px Arial, sans-serif';
      q.textAlign = 'center'; q.textBaseline = 'middle';
      q.shadowColor = color; q.shadowBlur = 26;
      q.fillStyle = color; q.fillText(text, S / 2, S / 2, S * .92);
      q.shadowBlur = 0;
    }, 1, 1);
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .04),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .82,
        depthWrite: false, toneMapped: false,
        blending: THREE.AdditiveBlending, fog: false }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; m.userData.v9 = true;
    addO(m); fx.neon.push({ m: m, base: .82 }); return m;
  }
  function buildBatch1World() {
    if (!fx || fx.rooftop) return;
    var i, j, p, m, mat, grp, child;

    // ---- 1. smooth day <-> night veil (never touches guarded values) ----
    var veil = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: '#0a1633', transparent: true, opacity: 0,
        depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
    veil.renderOrder = 9998; veil.frustumCulled = false; addO(veil);
    // The old camera-facing plane showed up as a dark "mirror" when rotating.
    // Night shading now uses a canvas CSS filter; the mesh stays only as a
    // state holder for the API / verification.
    veil.visible = false;
    fx.night = { veil: veil, amount: 0, target: 0 };

    // ---- 2. weather: rain, lightning flash, puddles, rainbow ----
    var rainPts = [], rainBase = [], rndW = rnd(907);
    for (i = 0; i < 420; i++) {
      var rx = 23 + (rndW() - .5) * 62, ry = rndW() * 15, rz = 17 + (rndW() - .5) * 52;
      rainPts.push(rx, ry, rz); rainBase.push(rx, ry, rz);
    }
    var rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rainPts, 3));
    var rainMesh = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: '#c4dcff',
      size: .07, transparent: true, opacity: .55, depthWrite: false, fog: false }));
    rainMesh.visible = false; addO(rainMesh);
    fx.weather.rain = { pts: rainMesh, base: rainBase, n: rainPts.length / 3 };

    var flash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: '#dceaff', transparent: true, opacity: 0,
        depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
    flash.renderOrder = 9999; flash.frustumCulled = false; flash.visible = false; addO(flash);
    fx.weather.flash = { m: flash, power: 0, next: 0 };

    var pudPos = [[14, 30], [30, 30], [23, 23.2], [10, 23.2], [36, 23.2], [5, 28], [40, 28]];
    pudPos.forEach(function (pp, pi) {
      var base = new THREE.Mesh(new THREE.CircleGeometry(1.15, 18),
        solid('#4b5d72', { metalness: .65, roughness: .2, transparent: true, opacity: .5 }));
      base.rotation.x = -Math.PI / 2; base.position.set(pp[0], .018 + pi * .0004, pp[1]);
      base.userData.v9 = true; addO(base);
      var shine = new THREE.Mesh(new THREE.CircleGeometry(1.1, 18),
        new THREE.MeshBasicMaterial({ map: windowReflectionTex(), transparent: true,
          opacity: .34, depthWrite: false, fog: false }));
      shine.rotation.x = -Math.PI / 2; shine.position.set(pp[0], .022 + pi * .0004, pp[1]);
      shine.userData.v9 = true; addO(shine);
      fx.weather.puddles.push(base, shine);
    });
    var rainbow = new THREE.Group();
    var rbColors = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa', '#e599f7'];
    rbColors.forEach(function (c, ri) {
      var arc = new THREE.Mesh(new THREE.TorusGeometry(9 + ri * .28, .16, 5, 44, Math.PI),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .3,
          depthWrite: false, toneMapped: false, fog: false }));
      arc.userData.v9 = true; rainbow.add(arc);
    });
    rainbow.position.set(23, 5.2, -26); rainbow.visible = false;
    addO(rainbow); fx.weather.rainbow = rainbow;

    // ---- 3. seasonal props (four prebuilt, cheap groups) ----
    var seasons = { default: v9Group(0, 0, 0), pasko: v9Group(0, 0, 0),
      fiesta: v9Group(0, 0, 0), rainy: v9Group(0, 0, 0) };
    [[6, 31.5], [40, 31.5]].forEach(function (pp) {
      var t = new THREE.Mesh(new THREE.ConeGeometry(.85, 2.2, 8), solid('#2f9d6a'));
      t.position.set(pp[0], 1.25, pp[1]); t.userData.v9 = true; seasons.pasko.add(t);
      var tr = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .4, 6), solid('#7a5230'));
      tr.position.set(pp[0], .2, pp[1]); tr.userData.v9 = true; seasons.pasko.add(tr);
      for (j = 0; j < 7; j++) {
        var light = new THREE.Mesh(new THREE.SphereGeometry(.075, 6, 5),
          new THREE.MeshBasicMaterial({ color: j % 2 ? '#ffd34d' : '#ff6b6b', toneMapped: false, fog: false }));
        light.position.set(pp[0] + Math.cos(j * 1.8) * .6, .7 + j * .22, pp[1] + Math.sin(j * 1.8) * .6);
        light.userData.v9 = true; seasons.pasko.add(light);
      }
    });
    var flagCols = ['#ff6b6b', '#ffd34d', '#4dabf7', '#69db7c', '#e599f7'];
    for (i = 0; i < 10; i++) {
      var fl = new THREE.Mesh(new THREE.PlaneGeometry(.4, .46),
        new THREE.MeshBasicMaterial({ color: flagCols[i % flagCols.length], side: THREE.DoubleSide,
          transparent: true, opacity: .92, fog: false }));
      fl.position.set(4 + i * 4.2, 2.72 - Math.sin(i / 9 * Math.PI) * .34, 23.2);
      fl.userData.v9 = true; seasons.fiesta.add(fl);
    }
    [19, 23, 27].forEach(function (ux) {
      var um = new THREE.Mesh(new THREE.ConeGeometry(.85, .42, 10, 1, true),
        new THREE.MeshBasicMaterial({ color: ux === 23 ? '#e8622c' : '#4a7fb0', side: THREE.DoubleSide,
          transparent: true, opacity: .9, fog: false }));
      um.position.set(ux, 2.15, 32.4); um.userData.v9 = true; seasons.rainy.add(um);
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.9, 5), solid('#c9d2de'));
      pole.position.set(ux, 1.1, 32.4); pole.userData.v9 = true; seasons.rainy.add(pole);
    });
    Object.keys(seasons).forEach(function (k) { seasons[k].visible = (k === 'default'); });
    fx.seasons = seasons;

    // ---- 4. rooftop garden + helipad on an east annex ----
    var roof = v9Group(70, 0, 12);
    var tower = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 10), solid('#94a2b2'));
    tower.position.y = 2; tower.userData.v9 = true; roof.add(tower);
    var deck = new THREE.Mesh(new THREE.BoxGeometry(12.4, .18, 10.4), solid('#5f6f80'));
    deck.position.y = 4.08; deck.userData.v9 = true; roof.add(deck);
    var pad = new THREE.Mesh(new THREE.CircleGeometry(2.15, 24), solid('#263443'));
    pad.rotation.x = -Math.PI / 2; pad.position.set(2.6, 4.19, 0); pad.userData.v9 = true; roof.add(pad);
    [[0, .55], [0, -.55], [0, 0]].forEach(function (hp) {
      var hb = new THREE.Mesh(new THREE.BoxGeometry(hp[1] ? .16 : .16, .03, hp[1] ? 2.3 : .16),
        new THREE.MeshBasicMaterial({ color: '#f2f7ff', fog: false }));
      hb.position.set(2.6 + hp[0] + (hp[1] ? -.42 : .42), 4.21, hp[1] || 0);
      hb.rotation.y = hp[1] ? Math.PI / 2 : 0; hb.userData.v9 = true; roof.add(hb);
    });
    [-4.4, -2.2].forEach(function (px, pi2) {
      var pl = new THREE.Mesh(new THREE.BoxGeometry(1.6, .35, 7.6), solid(pi2 ? '#7a5230' : '#8b5e34'));
      pl.position.set(px, 4.35, 0); pl.userData.v9 = true; roof.add(pl);
      for (j = 0; j < 4; j++) {
        var bush = new THREE.Mesh(new THREE.SphereGeometry(.42, 7, 5), solid('#4f9a4c'));
        bush.position.set(px, 4.7, -2.8 + j * 1.85); bush.userData.v9 = true; roof.add(bush);
      }
    });
    fx.rooftop = roof;

    // ---- 5. basement Server Vault + elevator access ----
    var vault = v9Group(5, 0, 25.4);
    var vdoor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.5, .18), solid('#2d3b4c', { metalness: .6, roughness: .35 }));
    vdoor.position.set(0, 1.25, -.55); vdoor.userData.v9 = true; vault.add(vdoor);
    var vglow = new THREE.Mesh(new THREE.BoxGeometry(1.5, .12, .02),
      new THREE.MeshBasicMaterial({ color: '#7cf7ff', toneMapped: false, fog: false }));
    vglow.position.set(0, 1.75, -.44); vglow.userData.v9 = true; vault.add(vglow);
    for (i = 0; i < 4; i++) {
      var rack = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.9, .6), solid('#3a4256'));
      rack.position.set(-4.5 + i * 1.6, .95, -.6); rack.userData.v9 = true; vault.add(rack);
      for (j = 0; j < 5; j++) {
        var led = new THREE.Mesh(new THREE.BoxGeometry(.9, .045, .03),
          new THREE.MeshBasicMaterial({ color: j % 2 ? '#7cf7ff' : '#ffd34d', toneMapped: false, fog: false }));
        led.position.set(-4.5 + i * 1.6, .3 + j * .32, -.28); led.userData.v9 = true; vault.add(led);
      }
    }
    fx.basement = vault;
    var elev = v9Group(44, 0, 6);
    [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].forEach(function (ep) {
      var frame = new THREE.Mesh(new THREE.BoxGeometry(.1, 3.3, .1), solid('#9aa8b8'));
      frame.position.set(ep[0], 1.65, ep[1]); frame.userData.v9 = true; elev.add(frame);
    });
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.1, 1.9),
      new THREE.MeshBasicMaterial({ color: '#7cf7ff', transparent: true, opacity: .18,
        depthWrite: false, fog: false }));
    cabin.position.y = 1.15; cabin.userData.v9 = true; elev.add(cabin);
    var cabFloor = new THREE.Mesh(new THREE.BoxGeometry(1.9, .1, 1.9), solid('#b9c8d8'));
    cabFloor.position.y = .12; cabFloor.userData.v9 = true; elev.add(cabFloor);
    var arrow = new THREE.Mesh(new THREE.BoxGeometry(.55, .55, .03),
      new THREE.MeshBasicMaterial({ color: '#ffd34d', toneMapped: false, fog: false }));
    arrow.position.set(0, 2.85, -1.145); arrow.userData.v9 = true; elev.add(arrow);
    fx.elevator = { g: elev, cabin: cabin, floor: cabFloor };

    // ---- 6. moving walkway along MAIN STREET ----
    var beltTex = makeTex('walkway-belt', function (q, S) {
      q.fillStyle = '#3b4657'; q.fillRect(0, 0, S, S);
      q.fillStyle = '#5b6c80'; for (var yy = 0; yy < S; yy += 32) q.fillRect(0, yy, S, 9);
      q.strokeStyle = '#c9a86a'; q.lineWidth = 4; q.strokeRect(2, 2, S - 4, S - 4);
    }, 6, 2);
    [8, 23, 38].forEach(function (wx) {
      var belt = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 2.5),
        solid('#ffffff', { map: beltTex, roughness: .7, metalness: .15 }));
      belt.rotation.x = -Math.PI / 2; belt.position.set(wx, .03, 23.2);
      belt.userData.v9 = true; addO(belt);
    });
    fx.walkways.push({ map: beltTex });

    // ---- 7. holographic receptionist ----
    var holo = v9Group(25.6, 0, 29.4);
    var hb = new THREE.Mesh(new THREE.CircleGeometry(.7, 20),
      new THREE.MeshBasicMaterial({ color: '#7cf7ff', transparent: true, opacity: .3,
        depthWrite: false, fog: false }));
    hb.rotation.x = -Math.PI / 2; hb.position.y = .04; hb.userData.v9 = true; holo.add(hb);
    var hbody = new THREE.Mesh(new THREE.CylinderGeometry(.26, .4, 1.0, 9),
      new THREE.MeshBasicMaterial({ color: '#7cf7ff', transparent: true, opacity: .24,
        depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    hbody.position.y = .78; hbody.userData.v9 = true; holo.add(hbody);
    var hhead = new THREE.Mesh(new THREE.SphereGeometry(.24, 9, 7),
      new THREE.MeshBasicMaterial({ color: '#bff4ff', transparent: true, opacity: .32,
        depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    hhead.position.y = 1.5; hhead.userData.v9 = true; holo.add(hhead);
    var rings = [];
    for (i = 0; i < 3; i++) {
      var ring = new THREE.Mesh(new THREE.TorusGeometry(.42, .018, 4, 18),
        new THREE.MeshBasicMaterial({ color: '#7cf7ff', transparent: true, opacity: .4,
          depthWrite: false, fog: false }));
      ring.rotation.x = Math.PI / 2; ring.position.y = .3 + i * .5;
      ring.userData.v9 = true; holo.add(ring); rings.push(ring);
    }
    fx.holo.push({ g: holo, body: hbody, head: hhead, rings: rings });

    // ---- 8. reflective wet floor (subtle permanent lobby sheen) ----
    [[23, 30.4, 6, 4], [23, 23.2, 26, 2.3], [10, 11, 12, 8]].forEach(function (wp2, wi) {
      var wm = new THREE.Mesh(new THREE.PlaneGeometry(wp2[2], wp2[3]),
        new THREE.MeshBasicMaterial({ map: windowReflectionTex(), transparent: true,
          opacity: .1 + wi * .025, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      wm.rotation.x = -Math.PI / 2; wm.position.set(wp2[0], .016 + wi * .001, wp2[1]);
      wm.userData.v9 = true; addO(wm); fx.wet.push({ m: wm, map: wm.material.map, base: wm.material.opacity });
    });

    // ---- 9. neon zone signs ----
    neonSign('RECEPTION', '#7cf7ff', 23, 2.62, 33.66, 0, 4.6, 1.0);
    neonSign('WORK HUB', '#ffd34d', 41.8, 2.5, 23.2, -Math.PI / 2, 3.6, .85);
    neonSign('FOCUS', '#8fd0ff', 14, 2.78, .34, 0, 3.2, .8);
    neonSign('MEET', '#ff9fc0', 33, 2.78, .34, 0, 2.8, .8);
    neonSign('PANTRY', '#69db7c', 37.8, 2.6, 28.8, -Math.PI / 2, 3.0, .8);
    neonSign('FARM', '#c9a6ff', 46, 2.4, 52, Math.PI / 2, 2.8, .8);

    // ---- 10. drone package delivery ----
    [0, 1].forEach(function (di) {
      var drone = v9Group(0, 0, 0), rotors = [];
      var body = new THREE.Mesh(new THREE.BoxGeometry(.55, .16, .5), solid('#3a4256', { metalness: .5 }));
      body.userData.v9 = true; drone.add(body);
      [[-.42, -.42], [.42, -.42], [-.42, .42], [.42, .42]].forEach(function (ap) {
        var arm = new THREE.Mesh(new THREE.BoxGeometry(.5, .04, .06), solid('#8b97a8'));
        arm.position.set(ap[0] * .5, 0, ap[1] * .5); arm.rotation.y = Math.atan2(ap[1], ap[0]);
        arm.userData.v9 = true; drone.add(arm);
        var rotor = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .012, 10),
          new THREE.MeshBasicMaterial({ color: '#9fb2d0', transparent: true, opacity: .45, fog: false }));
        rotor.position.set(ap[0], .06, ap[1]); rotor.userData.v9 = true; drone.add(rotor); rotors.push(rotor);
      });
      var parcel = new THREE.Mesh(new THREE.BoxGeometry(.26, .26, .26), solid('#c98f4a'));
      parcel.position.y = -.42; parcel.userData.v9 = true; drone.add(parcel);
      var cord = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .3, 4), solid('#d8dee6'));
      cord.position.y = -.22; cord.userData.v9 = true; drone.add(cord);
      drone.visible = true; fx.drones.push({ g: drone, rotors: rotors,
        rx: 16 + di * 6, rz: 11 + di * 4, y: 6.2 + di * 1.3, phase: di * 2.3 });
    });

    // Restore any persisted Studio choices after a rebuild.
    setWeather(window.__officeWeather || 'clear');
    setSeason(window.__officeSeason || 'default');
    if (fx.night) fx.night.amount = (window.__officeNight === true) ? 1 : (nightValue() ? 1 : 0);
    // Perf: hide heavy optional features by default; can be toggled on via Studio/API.
    ['drones', 'holo', 'rooftop', 'basement'].forEach(function (k) { try { setWorldFeature(k, false); } catch (e) {} });
  }

  function nightValue() {
    if (typeof window !== 'undefined' && typeof window.__officeNight === 'boolean') return window.__officeNight;
    try {
      if (typeof nightManual !== 'undefined' && nightManual !== null) return !!nightManual;
      var hr = 14;
      try { hr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })).getHours(); } catch (e) {}
      return hr >= 18 || hr < 6;
    } catch (e) { return false; }
  }
  function setWeather(mode) {
    var m = (mode === 'rain' || mode === 'storm') ? mode : 'clear';
    window.__officeWeather = m;
    if (!fx || !fx.weather) return m;
    if (fx.weather.rain) fx.weather.rain.pts.visible = m !== 'clear';
    fx.weather.puddles.forEach(function (o) { o.visible = m !== 'clear'; });
    if (fx.weather.rainbow) fx.weather.rainbow.visible = m !== 'clear';
    if (fx.weather.flash) fx.weather.flash.m.visible = m === 'storm';
    return m;
  }
  function setSeason(name) {
    var n = (fx && fx.seasons && fx.seasons[name]) ? name : 'default';
    window.__officeSeason = n;
    if (fx && fx.seasons) Object.keys(fx.seasons).forEach(function (k) {
      if (fx.seasons[k]) fx.seasons[k].visible = (k === n);
    });
    return n;
  }
  function setNight(mode) {
    if (mode === 'auto' || mode === null || mode === undefined) {
      window.__officeNight = null;
      try { nightManual = null; } catch (e) {}
      try { var nb0 = document.getElementById('nightBtn'); if (nb0) nb0.textContent = '🌙 Gabi'; } catch (e) {}
    } else {
      var b = !!mode;
      window.__officeNight = b;
      // Keep the app's own isNight state in sync (v9 still re-asserts the
      // bg/fog/ambient/exposure guards afterwards, so no white-out).
      try { nightManual = b; } catch (e) {}
      try {
        var nb = document.getElementById('nightBtn');
        if (nb) nb.textContent = b ? '🌙 Araw' : '🌙 Gabi';
      } catch (e) {}
    }
    return window.__officeNight;
  }
  function setWorldFeature(key, on) {
    var v = !!on;
    if (!fx) return false;
    if (key === 'rooftop' && fx.rooftop) fx.rooftop.visible = v;
    else if (key === 'basement' && fx.basement) fx.basement.visible = v;
    else if (key === 'elevator' && fx.elevator) fx.elevator.g.visible = v;
    else if (key === 'walkway') fx.walkways.forEach(function (w) { w.on = v; });
    else if (key === 'holo') fx.holo.forEach(function (h) { h.g.visible = v; });
    else if (key === 'wet') fx.wet.forEach(function (w) { w.m.visible = v; });
    else if (key === 'neon') fx.neon.forEach(function (n) { n.on = v; n.m.visible = v; });
    else if (key === 'drones') fx.drones.forEach(function (d) { d.g.visible = v; });
    else return false;
    return v;
  }
  function updateBatch1World(now, dt) {
    if (!fx || !fx.night) return;
    dt = Math.max(0, Math.min(.12, dt || 0));
    var low = window.__officeDetail !== 'high';

    // 1 — smooth night: only the veil opacity moves, guards stay untouched.
    var nt = nightValue() ? 1 : 0;
    fx.night.target = nt;
    fx.night.amount += (nt - fx.night.amount) * Math.min(1, dt * 1.8 + .012);
    if (Math.abs(nt - fx.night.amount) < .002) fx.night.amount = nt;
    var veil = fx.night.veil;
    if (veil) {
      // Track opacity for diagnostics, but never render the plane. A CSS
      // brightness filter cannot lag behind camera rotation or show edges.
      veil.material.opacity = fx.night.amount * .32;
      try {
        var cv = (typeof renderer3d !== 'undefined' && renderer3d) ? renderer3d.domElement : null;
        if (cv) cv.style.filter = fx.night.amount > .002
          ? 'brightness(' + (1 - fx.night.amount * .2).toFixed(3) + ')' : '';
      } catch (e) {}
    }

    // 2 — rain + lightning + puddles shimmer + rainbow.
    var w = fx.weather || {}, storm = window.__officeWeather === 'storm';
    if (w.rain && w.rain.pts.visible && !low) {
      var arr = w.rain.pts.geometry.attributes.position.array;
      var sp = storm ? 11 : 7.5;
      for (var ri = 0; ri < w.rain.n; ri++) {
        var yi = ri * 3 + 1;
        arr[yi] -= sp * dt;
        if (arr[yi] < 0) { arr[yi] = 14 + (ri % 7) * .2; arr[ri * 3] = w.rain.base[ri * 3]; arr[ri * 3 + 2] = w.rain.base[ri * 3 + 2]; }
      }
      w.rain.pts.geometry.attributes.position.needsUpdate = true;
    }
    if (w.flash && w.flash.m.visible) {
      var fl = w.flash;
      if (!fl.next) fl.next = now + 2600 + Math.random() * 4200;
      if (now >= fl.next) { fl.power = 1; fl.next = now + 3800 + Math.random() * 6000; }
      fl.power = Math.max(0, fl.power - dt * 2.6);
      faceCamera(fl.m, 1.35);
      fl.m.material.opacity = fl.power * (.28 + .3 * (fl.power > .82 ? 1 : .5));
    }
    if (w.rainbow && w.rainbow.visible) {
      var rb = .22 + .1 * (.5 + .5 * Math.sin(now / 2600));
      w.rainbow.children.forEach(function (a, ai) { if (a.material) a.material.opacity = rb * (1 - ai * .035); });
    }

    // 6 — moving walkway texture scroll.
    fx.walkways.forEach(function (ww) {
      if (ww.on === false || low) return;
      if (ww.map) ww.map.offset.x -= dt * .24;
    });

    // 7 — holographic receptionist bob + scan rings + flicker.
    fx.holo.forEach(function (h, hi) {
      if (!h.g.visible) return;
      h.g.position.y = .05 + Math.sin(now / 900 + hi) * .06;
      var flick = .2 + .06 * Math.sin(now / 170 + hi * 3) + (Math.random() < .012 ? -.1 : 0);
      if (h.body.material) h.body.material.opacity = Math.max(.08, flick);
      if (h.head.material) h.head.material.opacity = Math.max(.1, flick + .1);
      h.rings.forEach(function (r, ri) {
        r.position.y = .25 + ((now / 2100 + ri / 3 + hi * .2) % 1) * 1.45;
        r.material.opacity = .28 + .18 * (.5 + .5 * Math.sin(now / 500 + ri));
      });
    });

    // 8 — wet floor sheen drift.
    fx.wet.forEach(function (ww, wi) {
      if (!ww.m.visible || low) return;
      if (ww.map) ww.map.offset.y = .02 * Math.sin(now / 3400 + wi);
      ww.m.material.opacity = ww.base * (.85 + .3 * (.5 + .5 * Math.sin(now / 1900 + wi)));
    });

    // 9 — neon signs: brighter at night, gentle flicker, dimmed in low detail.
    var boost = 1 + fx.night.amount * .7;
    fx.neon.forEach(function (n, ni) {
      if (n.on === false || !n.m.visible) return;
      var flick = .93 + .07 * Math.sin(now / 430 + ni * 2.7);
      if (Math.random() < .006) flick *= .55;
      n.m.material.opacity = Math.min(1, n.base * boost * flick * (low ? .7 : 1));
    });

    // 10 — drones patrol and spin their rotors.
    fx.drones.forEach(function (d, di) {
      if (!d.g.visible) return;
      var a = now / 1000 * .34 + d.phase;
      d.g.position.set(23 + Math.cos(a) * d.rx, d.y + Math.sin(now / 1200 + d.phase) * .28,
        17 + Math.sin(a) * d.rz);
      d.g.rotation.y = -a + Math.PI / 2;
      d.rotors.forEach(function (r) { r.rotation.y += dt * 26; });
    });

    // 5 — elevator cabin cycles slowly between floors.
    if (fx.elevator && fx.elevator.g.visible) {
      var ep = (Math.sin(now / 4200) + 1) / 2;
      fx.elevator.cabin.position.y = .2 + ep * 1.55;
      fx.elevator.floor.position.y = fx.elevator.cabin.position.y - 1.03;
    }
  }

  /* ================= BATCH 2 — character life layer =================
     Items 11-20, all optional and Studio-toggleable. No guarded value is
     written here; the white-out guards above keep full ownership of
     bg/fog/ambient/exposure/isNight. */
  var BATCH2_ROLE = {
    cos: 'HOST · COS', seo: 'ANALYST · SEO', product: 'OPS · PRODUCT',
    joker: 'CULTURE · JOKER', mgr: 'MANAGER · MGR', writer: 'CONTENT · WRITER',
    aryasky: 'ARTIST · ARYASKY', fixer: 'TECH · FIXER',
    hflex: 'VIDEO · HF LEAD', hfmotion: 'VIDEO · MOTION', hfrender: 'VIDEO · RENDER QA'
  };
  var BATCH2_STATUS = {
    greet: 'Greeting guests…', wave: 'Waving hi! 👋', type: 'Typing reports…',
    pack: 'Packing orders…', joke: 'Cracking jokes…', plan: 'Planning tasks…',
    write: 'Writing copy…', design: 'Designing art…', review: 'Reviewing SEO…',
    showcase: 'Showcasing work…', edit: 'Editing timeline…', render: 'Rendering MP4…',
    walk: 'On the move…'
  };
  function paintBatch2Label(q, text, color, bg) {
    q.clearRect(0, 0, 256, 64);
    q.fillStyle = bg || 'rgba(11,20,38,.86)';
    q.fillRect(2, 4, 252, 56);
    q.strokeStyle = 'rgba(255,255,255,.22)'; q.lineWidth = 2;
    q.strokeRect(2, 4, 252, 56);
    q.font = 'bold 25px sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle';
    q.lineWidth = 5; q.strokeStyle = 'rgba(4,8,18,.9)';
    q.strokeText(text, 128, 33, 236);
    q.fillStyle = color || '#ffffff'; q.fillText(text, 128, 33, 236);
  }
  function batch2LabelTexture(text, color, bg) {
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    var q = cv.getContext('2d'); paintBatch2Label(q, text, color, bg);
    var t = new THREE.CanvasTexture(cv);
    t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
    t.userData = t.userData || {}; // same guard as makeTex()
    t.userData.cv = cv; t.userData.q = q;
    return t;
  }
  function batch2LabelSprite(text, color, bg, w, h, y) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: batch2LabelTexture(text, color, bg), transparent: true,
      depthWrite: false, toneMapped: false, fog: false
    }));
    s.scale.set(w, h, 1); s.position.set(0, y, 0); s.userData.v9 = true;
    return s;
  }
  function applyBatch2Visibility() {
    var f = fx && fx.botFeatures; if (!f) return;
    if (fx.barista && fx.barista.c) fx.barista.c.group.visible = f.barista !== false;
    fx.growthPlants.forEach(function (p) { if (p.g) p.g.visible = f.plants !== false; });
    if (fx.fish && fx.fish.g) fx.fish.g.visible = f.fish !== false;
    fx.skylineLights.forEach(function (a) { if (a.m) a.m.visible = f.skyline !== false; });
    if (fx.ceilingProj) fx.ceilingProj.visible = f.ceiling !== false;
    fx.outfits.forEach(function (o) { if (o) o.visible = f.outfits !== false; });
    fx.pets.forEach(function (p) { if (p.g) p.g.visible = f.pets !== false; });
    cuteBots.forEach(function (b) {
      if (b.roleTag) b.roleTag.visible = f.nameplates !== false;
      if (b.statusSprite) b.statusSprite.visible = f.status !== false;
    });
  }
  function buildBatch2World() {
    if (!fx || fx.barista) return;
    var i, j;

    // 11 — barista bot behind the pantry/cafe counter.
    if (typeof makeChar3d === 'function') {
      try {
        var bc = makeChar3d({ id: 'barista', n: 'Barista ☕', c: '#b07b3d' }, 10.4, 4.2);
        bc.group.scale.setScalar(.62);
        bc.group.userData.v9 = true;
        bc.group.traverse(function (o) { o.userData.v9 = true; });
        if (bc.emo) bc.emo.visible = false;
        var hat = new THREE.Group();
        var band = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .14, 10), solid('#f5f0e6'));
        band.userData.v9 = true; hat.add(band);
        var puff = new THREE.Mesh(new THREE.SphereGeometry(.28, 9, 7), solid('#ffffff'));
        puff.scale.set(1, .72, 1); puff.position.y = .15; puff.userData.v9 = true; hat.add(puff);
        hat.position.set(0, 1.08, 0); hat.userData.v9 = true; bc.group.add(hat);
        var apron = new THREE.Mesh(new THREE.BoxGeometry(.46, .4, .05), solid('#7d4a2f'));
        apron.position.set(0, .34, .3); apron.userData.v9 = true; bc.group.add(apron);
        if (bc.cup) { bc.cup.visible = true; bc.cup.position.set(.36, .48, .2); }
        fx.barista = { c: bc, hat: hat };
        fx.outfits.push(hat);
      } catch (e) { fx.barista = null; }
    }
    // Counter + espresso machine stay put; they make the barista read as cafe staff.
    box(2.8, .12, .72, solid('#a9793f'), 10.4, .96, 5.05);
    box(.8, .52, .5, solid('#3a4256'), 10.4, 1.28, 5.05);
    box(.5, .05, .04, '#7cf7ff', 10.4, 1.42, 4.79);
    [9.85, 10.95].forEach(function (cx) {
      var cup = new THREE.Mesh(new THREE.CylinderGeometry(.09, .075, .14, 10), solid('#f5f0e6'));
      cup.position.set(cx, 1.09, 5.05); cup.userData.v9 = true; addO(cup);
    });

    // 12 — indoor plants with visible growth stages.
    [[8, 30], [15.5, 30.8], [35, 30.6]].forEach(function (pp, pi) {
      var gp = new THREE.Group(); gp.position.set(pp[0], 0, pp[1]); gp.userData.v9 = true; addO(gp);
      var pot = new THREE.Mesh(new THREE.CylinderGeometry(.22, .18, .34, 9), solid('#b07b52'));
      pot.position.y = .17; pot.userData.v9 = true; gp.add(pot);
      var leaves = [];
      for (i = 0; i < 4; i++) {
        var a = i * 1.57;
        var leaf = new THREE.Mesh(new THREE.ConeGeometry(.17, .62, 6),
          solid(i % 2 ? '#3f9d6a' : '#57ad78', { roughness: .9 }));
        leaf.position.set(Math.cos(a) * .12, .58 + (i % 2) * .1, Math.sin(a) * .12);
        leaf.rotation.z = Math.cos(a) * .28; leaf.userData.v9 = true;
        gp.add(leaf); leaves.push(leaf);
      }
      fx.growthPlants.push({ g: gp, leaves: leaves, p: pi * 1.9 });
    });

    // 13 — lounge fish tank with five gentle swimmers.
    var tank = new THREE.Group(); tank.position.set(7.2, 0, 28.2);
    tank.userData.v9 = true; addO(tank);
    box(2.6, .75, .8, solid('#6e7c8f'), 7.2, .38, 28.2);
    var glass = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, .7),
      new THREE.MeshBasicMaterial({ color: '#a8dcff', transparent: true, opacity: .18,
        depthWrite: false, side: THREE.DoubleSide, fog: false }));
    glass.position.y = 1.12; glass.userData.v9 = true; tank.add(glass);
    var water = new THREE.Mesh(new THREE.PlaneGeometry(2.34, .64),
      new THREE.MeshBasicMaterial({ color: '#4fa8d8', transparent: true, opacity: .3,
        depthWrite: false, side: THREE.DoubleSide, fog: false }));
    water.rotation.x = -Math.PI / 2; water.position.y = 1.58; water.userData.v9 = true; tank.add(water);
    [[-1.22, 1.12], [1.22, 1.12]].forEach(function (fr) {
      var edge = new THREE.Mesh(new THREE.BoxGeometry(.06, 1.04, .74), solid('#9fb2d0'));
      edge.position.set(fr[0], fr[1], 0); edge.userData.v9 = true; tank.add(edge);
    });
    var fishCols = ['#ffd34d', '#ff8fa8', '#7cf7ff', '#b9f07a', '#c9a6ff'];
    var fish = [];
    for (i = 0; i < 5; i++) {
      var fg = new THREE.Group(); fg.userData.v9 = true;
      var body = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6),
        new THREE.MeshBasicMaterial({ color: fishCols[i], fog: false }));
      body.scale.set(1.5, .75, .6); body.userData.v9 = true; fg.add(body);
      var tail = new THREE.Mesh(new THREE.ConeGeometry(.06, .13, 5),
        new THREE.MeshBasicMaterial({ color: fishCols[i], fog: false }));
      tail.rotation.z = Math.PI / 2; tail.position.x = -.17; tail.userData.v9 = true; fg.add(tail);
      fg.position.set(-.9 + i * .45, 1.12 + (i % 2) * .22, (i % 2) ? .13 : -.13);
      tank.add(fg); fish.push({ m: fg, x: fg.position.x, y: fg.position.y, p: i * 1.3 });
    }
    fx.fish = { g: tank, fish: fish };

    // 14 — skyline window lights that brighten with the night amount.
    var sky = new THREE.Group(); sky.userData.v9 = true; addO(sky);
    var lightCols = ['#ffd89a', '#bfe4ff', '#ffc1d8'];
    for (i = 0; i < 12; i++) {
      var bx0 = -22 + i * 7.4;
      for (j = 2; j < 15; j += 2.2) {
        var pane = new THREE.Mesh(new THREE.PlaneGeometry(.34, .24),
          new THREE.MeshBasicMaterial({ color: lightCols[(i + Math.round(j)) % 3],
            transparent: true, opacity: .1, depthWrite: false, fog: false, toneMapped: false }));
        pane.position.set(bx0 + ((Math.round(j) % 3) - 1) * 1.4, j, -12.35);
        pane.userData.v9 = true; sky.add(pane);
        fx.skylineLights.push({ m: pane, p: i + j });
      }
    }

    // 15 — subtle ceiling projection: clouds by day, stars by night.
    var projTex = makeTex('batch2-ceiling-sky', function (q, S) {
      var g2 = q.createLinearGradient(0, 0, 0, S);
      g2.addColorStop(0, 'rgba(18,38,74,.9)'); g2.addColorStop(.55, 'rgba(86,140,198,.55)');
      g2.addColorStop(1, 'rgba(238,226,204,.4)'); q.fillStyle = g2; q.fillRect(0, 0, S, S);
      var r2 = rnd(451);
      for (var c = 0; c < 12; c++) {
        var cx = r2() * S, cy = r2() * S * .7, rw = 22 + r2() * 46, rh = 6 + r2() * 12;
        var cg = q.createRadialGradient(cx, cy, 1, cx, cy, rw);
        cg.addColorStop(0, 'rgba(255,255,255,.5)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
        q.save(); q.translate(cx, cy); q.scale(1, rh / rw); q.translate(-cx, -cy);
        q.fillStyle = cg; q.beginPath(); q.arc(cx, cy, rw, 0, 6.3); q.fill(); q.restore();
      }
      for (var s = 0; s < 42; s++) {
        q.fillStyle = 'rgba(255,248,220,' + (.25 + r2() * .6).toFixed(2) + ')';
        q.fillRect(r2() * S, r2() * S, 1.4, 1.4);
      }
    }, 1, 1);
    // Kept small on purpose: a full-ceiling plane sat between the high hero
    // camera and the bots and blocked the view. This is a compact projector
    // tile only, off by default; Studio can still enable it.
    var proj = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2),
      new THREE.MeshBasicMaterial({ map: projTex, transparent: true, opacity: .08,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        toneMapped: false, fog: false }));
    proj.rotation.x = Math.PI / 2; proj.position.set(23, 3.18, 17);
    proj.renderOrder = 1; proj.userData.v9 = true; addO(proj);
    fx.ceilingProj = proj;
  }
  function makeBatch2Pet(kind, owner, color, idx) {
    if (!owner || !owner.group) return;
    var g = new THREE.Group(); g.userData.v9 = true;
    var body = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), solid(color));
    body.scale.set(1.3, .8, .9); body.position.y = .18; body.userData.v9 = true; g.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), solid(color));
    head.position.set(.2, .27, 0); head.userData.v9 = true; g.add(head);
    [-.07, .07].forEach(function (zz) {
      if (kind === 'cat') {
        var ear = new THREE.Mesh(new THREE.ConeGeometry(.055, .12, 5), solid(color));
        ear.position.set(.21, .4, zz); ear.userData.v9 = true; g.add(ear);
      } else {
        var ear2 = new THREE.Mesh(new THREE.SphereGeometry(.055, 7, 5), solid(color));
        ear2.scale.set(1.4, .7, 1); ear2.position.set(.2, .31, zz * 1.7);
        ear2.userData.v9 = true; g.add(ear2);
      }
    });
    var tail = new THREE.Mesh(new THREE.CylinderGeometry(.025, .035, .32, 6), solid(color));
    tail.position.set(-.24, .3, 0); tail.rotation.z = -.7; tail.userData.v9 = true; g.add(tail);
    g.position.set(owner.group.position.x + (idx ? .8 : -.8), 0, owner.group.position.z + .6);
    addO(g);
    fx.pets.push({ g: g, owner: owner, tail: tail, ox: idx ? .75 : -.75, oz: .65, p: idx * 2.1 });
  }
  function attachBatch2Bots() {
    if (!cuteBots.length || (cuteBots[0] && cuteBots[0].roleTag)) return;
    cuteBots.forEach(function (b, i) {
      // 16 — floating nameplate + role.
      var roleTag = batch2LabelSprite(BATCH2_ROLE[b.id] || 'TEAM', '#dff6ff',
        'rgba(15,27,48,.84)', 2.05, .34, 2.28);
      b.group.add(roleTag); b.roleTag = roleTag;
      // 17 — status text bubble, repainted only when the job changes.
      var st = batch2LabelTexture(BATCH2_STATUS[b.job] || 'Working…',
        '#ffe6a8', 'rgba(12,20,38,.88)');
      var status = new THREE.Sprite(new THREE.SpriteMaterial({
        map: st, transparent: true, depthWrite: false, toneMapped: false, fog: false
      }));
      status.scale.set(2.35, .4, 1); status.position.set(0, 1.86, 0);
      status.userData.v9 = true; b.group.add(status);
      b.statusSprite = status; b.statusT = st; b.statusQ = st.userData.q;
      b.statusText = BATCH2_STATUS[b.job] || 'Working…';
      b.idleNext = Date.now() + 4000 + i * 1700; b.idleUntil = 0; b.idleKind = '';
      // 19 — job outfits (hard hat + artist beret; chef hat is on the barista).
      if (b.id === 'product') {
        var hard = new THREE.Group();
        var dome = new THREE.Mesh(new THREE.SphereGeometry(.34, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), solid('#ffd34d'));
        dome.userData.v9 = true; hard.add(dome);
        var brim = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .035, 12), solid('#e0ad2e'));
        brim.position.y = -.02; brim.userData.v9 = true; hard.add(brim);
        hard.position.set(0, 1.0, 0); hard.userData.v9 = true; b.group.add(hard);
        fx.outfits.push(hard);
      }
      if (b.id === 'aryasky') {
        var beret = new THREE.Group();
        var cap = new THREE.Mesh(new THREE.SphereGeometry(.34, 10, 7), solid('#6bb3a6'));
        cap.scale.set(1, .38, 1); cap.userData.v9 = true; beret.add(cap);
        var nub = new THREE.Mesh(new THREE.SphereGeometry(.055, 7, 5), solid('#3f7d78'));
        nub.position.y = .14; nub.userData.v9 = true; beret.add(nub);
        beret.position.set(.06, 1.03, 0); beret.rotation.z = -.18;
        beret.userData.v9 = true; b.group.add(beret);
        fx.outfits.push(beret);
      }
    });
    // 20 — pet bots: a cat and a dog that follow two of the team.
    makeBatch2Pet('cat', cuteBots[0], '#e8b98a', 0);
    makeBatch2Pet('dog', cuteBots[3] || cuteBots[0], '#c98f4a', 1);
    applyBatch2Visibility();
  }
  function setBotFeature(key, on) {
    if (!fx || !fx.botFeatures || !(key in fx.botFeatures)) return false;
    fx.botFeatures[key] = !!on;
    applyBatch2Visibility();
    return fx.botFeatures[key];
  }
  function updateBatch2World(now, dt) {
    if (!fx) return;
    var f = fx.botFeatures || {}, low = window.__officeDetail !== 'high';
    dt = Math.max(0, Math.min(.12, dt || 0));
    // 11 — barista pours gently.
    if (fx.barista && fx.barista.c && f.barista !== false && !low) {
      if (fx.barista.c.cup) fx.barista.c.cup.rotation.z = Math.sin(now / 340) * .2;
      if (fx.barista.c.group.children[0]) fx.barista.c.group.children[0].rotation.z = Math.sin(now / 720) * .035;
    }
    // 12 — plants cycle through growth stages.
    if (f.plants !== false && !low) {
      fx.growthPlants.forEach(function (p) {
        var g = .72 + .42 * (.5 + .5 * Math.sin(now / 3600 + p.p));
        p.leaves.forEach(function (l, li) {
          l.scale.y = g * (1 + li * .04);
          l.rotation.z += 0; // base tilt is kept; only height grows
        });
      });
    }
    // 13 — fish swim inside the tank.
    if (fx.fish && f.fish !== false && !low) {
      fx.fish.fish.forEach(function (fsh) {
        fsh.m.position.x = fsh.x + Math.sin(now / 1700 + fsh.p) * .72;
        fsh.m.position.y = fsh.y + Math.sin(now / 900 + fsh.p * 1.7) * .07;
        fsh.m.rotation.y = Math.cos(now / 1700 + fsh.p) > 0 ? 0 : Math.PI;
      });
    }
    // 14/15 — night-linked skyline and ceiling projection opacities.
    var amt = fx.night ? fx.night.amount : 0;
    if (f.skyline !== false) {
      fx.skylineLights.forEach(function (a) {
        if (a.m.material) a.m.material.opacity = (low ? .12 : .08) + amt * .4
          + (low ? 0 : .05 * Math.sin(now / 800 + a.p));
      });
    }
    if (fx.ceilingProj && f.ceiling !== false && fx.ceilingProj.material) {
      fx.ceilingProj.material.opacity = .05 + amt * .13
        + (low ? 0 : .02 * Math.sin(now / 2100));
    }
    // 20 — pets trail their owners.
    if (f.pets !== false) {
      fx.pets.forEach(function (p) {
        if (!p.owner || !p.g) return;
        var tx = p.owner.group.position.x + p.ox, tz = p.owner.group.position.z + p.oz;
        var k = Math.min(1, dt * 3.4);
        p.g.position.x += (tx - p.g.position.x) * k;
        p.g.position.z += (tz - p.g.position.z) * k;
        p.g.position.y = Math.abs(Math.sin(now / 260 + p.p)) * .035;
        p.g.rotation.y = Math.atan2(p.owner.group.position.x - p.g.position.x,
          p.owner.group.position.z - p.g.position.z);
        if (p.tail) p.tail.rotation.z = -.6 + Math.sin(now / 180 + p.p) * .35;
      });
    }
  }
  function updateBotBatch2(b, now, i) {
    if (!fx || !fx.botFeatures) return;
    var f = fx.botFeatures;
    // 17 — status text follows the real job/walk state.
    if (b.statusSprite) {
      var txt = BATCH2_STATUS[b.walking ? 'walk' : b.job] || 'Working…';
      if (txt !== b.statusText) {
        if (b.statusQ) paintBatch2Label(b.statusQ, txt, '#ffe6a8', 'rgba(12,20,38,.88)');
        if (b.statusT) b.statusT.needsUpdate = true;
        b.statusText = txt;
      }
      b.statusSprite.visible = f.status !== false;
    }
    if (b.roleTag) b.roleTag.visible = f.nameplates !== false;
    // 18 — occasional stretch / yawn / coffee-sip idle beats.
    function resetIdle() {
      if (b.head) {
        b.head.scale.y = 1;
        b.head.rotation.x = 0; b.head.rotation.y = 0; b.head.rotation.z = 0;
      }
      if (b.cup) b.cup.visible = false;
      b.idleUntil = 0; b.idleKind = '';
    }
    if (f.idle === false || b.walking || !b.head || !b.cup) {
      if (b.idleUntil) { resetIdle(); b.idleNext = now + 6000; }
      return;
    }
    if (b.idleUntil && now < b.idleUntil) {
      var k = b.idleKind;
      if (k === 'stretch') {
        if (b.arm) b.arm.rotation.z = -2.8;
        if (b.armL) b.armL.rotation.z = 2.8;
        b.group.position.y = b.baseY + .07;
        b.head.scale.y = 1.08;
        b.head.rotation.x = -0.09; b.head.rotation.y = Math.sin(now / 420) * 0.03; b.head.rotation.z = 0;
      } else if (k === 'yawn') {
        b.head.scale.y = 1.2;
        b.head.rotation.x = -0.11; b.head.rotation.y = Math.sin(now / 260) * 0.04; b.head.rotation.z = Math.sin(now / 180) * 0.03;
        b.group.rotation.z = Math.sin(now / 120) * .06;
      } else {
        b.cup.visible = true;
        b.head.rotation.x = 0.085 + Math.sin(now / 220) * 0.02; b.head.rotation.y = 0.05; b.head.rotation.z = 0;
        if (b.arm) b.arm.rotation.z = -1.55 + Math.sin(now / 180) * .12;
      }
      return;
    }
    if (b.idleUntil && now >= b.idleUntil) {
      resetIdle(); b.idleNext = now + 7000 + Math.random() * 9000;
    }
    var allowed = { plan: 1, review: 1, write: 1, design: 1, type: 1, greet: 1 };
    if (!b.idleUntil && now > b.idleNext && allowed[b.job]) {
      var kinds = ['stretch', 'yawn', 'sip'];
      b.idleKind = kinds[Math.floor(now / 1000 + i) % 3];
      b.idleUntil = now + (b.idleKind === 'sip' ? 1500 : 1100);
    }
  }

  window.buildRealOffice3d = buildRealOffice3d;
  window.__officeV9 = { walkers:walkers, bots: cuteBots, rebuild: buildRealOffice3d, tick: tick,
    get fx() { return fx; },
    get crops() { return fx.crops; },
    setDetail: function (v) { window.__officeDetail = v === 'low' ? 'low' : 'high'; applyDetailLevel(true); },
    setTheme: function (v) {
      window.__officeTheme = v || 'default';
      applyThemeVisuals(window.__officeTheme);
    },
    // Batch 1 world controls (Studio-safe; never writes guarded values).
    setNight: setNight,
    setWeather: setWeather,
    setSeason: setSeason,
    setWorldFeature: setWorldFeature,
    setBotFeature: setBotFeature,
    refreshBoard: refreshBoard,
    get board() { return { lastUpdate: boardState.lastUpdate, active: !!boardState.timer }; },
    get world() {
      return { weather: window.__officeWeather || 'clear', season: window.__officeSeason || 'default',
        night: nightValue(), nightAmount: fx && fx.night ? fx.night.amount : 0,
        features: { rooftop: !!(fx && fx.rooftop && fx.rooftop.visible),
          basement: !!(fx && fx.basement && fx.basement.visible),
          elevator: !!(fx && fx.elevator && fx.elevator.g.visible),
          walkway: !!(fx && fx.walkways.length && fx.walkways[0].on !== false),
          holo: !!(fx && fx.holo.length && fx.holo[0].g.visible),
          wet: !!(fx && fx.wet.length && fx.wet[0].m.visible),
          neon: !!(fx && fx.neon.length && fx.neon[0].m.visible),
          drones: !!(fx && fx.drones.length && fx.drones[0].g.visible) },
        bots: Object.assign({}, fx && fx.botFeatures) };
    }
  };
})();
