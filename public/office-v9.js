/* office-v9.js — Cyborg Cheebee Office.
   v9 "photographic" + v14/v15/v16 effects + v17-v23 "realistic streets" plus
   v24 court/ball/airliner realism and a v25 building pass: concrete columns,
   suspended ceiling tiles, HVAC vents, sprinklers, glass entry doors/canopy,
   wainscot, terrazzo, wayfinding and detailed reception/meeting/pantry/server
   zones. North city street, x1000 entrance road and east/west side worlds remain.
   Window reflections, blind shadows, richer trim and cinematic grade remain.
   Layout still follows published planning concepts: WELCOME -> MAIN STREET ->
   FOCUS / MEET / GATHER -> SUPPORT. Loaded BEFORE the main app script. */
(function () {
  'use strict';

  var BOTS = [
    { id: 'cos',     n: 'Cos 💬',     c: '#f472b6', x: 23, z: 27.5, face: Math.PI },
    { id: 'seo',     n: 'Seo 🔍',     c: '#4a9fd6', x: 10, z: 10.5, face: 0 },
    { id: 'product', n: 'Product 📦', c: '#f0b429', x: 18, z: 10.5, face: 0 },
    { id: 'joker',   n: 'Joker 😄',   c: '#8f6fd8', x: 13, z: 23.2, face: Math.PI },
    { id: 'mgr',     n: 'Mgr 📋',     c: '#3f9d6a', x: 36, z: 11,   face: Math.PI / 2 },
    { id: 'writer',  n: 'Writer ✍️', c: '#e8622c', x: 36, z: 28,   face: -Math.PI / 2 }
  ];
  var EMOS = ['😊', '😄', '🤩', '✨', '💚', '🙌'];
  var cuteBots = [], lastEmo = 0, animId = null, animParts = [];
  var TEX = {}, screenCounter = 0;
  var fx = { shafts: [], screens: [], dust: null, bubbles: [], steam: [], plants: [], sparkles: [], birds: [], scan: [], windows: [], sheen: null,
    auras: [], antennae: [], glints: [], bands: [], cars: [], sun: null, sky: null,
    blinds: [], reflections: [], signals: [], peds: [], ballers: [], ball: null, planes: [] };

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
  function carpetTex(base, line, rx, ry) {
    return makeTex('carpet-' + base + '-' + line, function (q, S) {
      q.fillStyle = base; q.fillRect(0, 0, S, S);
      var r = rnd(19);
      for (var i = 0; i < 3200; i++) {
        q.fillStyle = 'rgba(255,255,255,' + (.025 + r() * .07).toFixed(3) + ')';
        q.fillRect(r() * S, r() * S, 1.6, 1.6);
      }
      q.globalAlpha = .32; q.strokeStyle = line; q.lineWidth = 2;
      for (var p = 0; p <= S; p += 32) {
        q.beginPath(); q.moveTo(p, 0); q.lineTo(p, S); q.stroke();
        q.beginPath(); q.moveTo(0, p); q.lineTo(S, p); q.stroke();
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
    return makeTex('stone', function (q, S) {
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
    }, rx, ry);
  }
  function asphaltTex(rx, ry) {
    return makeTex('asphalt', function (q, S) {
      q.fillStyle = '#3b4048'; q.fillRect(0, 0, S, S);
      var r = rnd(77);
      for (var i = 0; i < 4200; i++) {
        var v = r();
        q.fillStyle = v > .6 ? 'rgba(255,255,255,.055)' : 'rgba(0,0,0,.10)';
        q.fillRect(r() * S, r() * S, 1 + r() * 2.6, 1 + r() * 2.6);
      }
      // wear bands + patchwork
      q.fillStyle = 'rgba(255,255,255,.025)';
      for (var k = 0; k < 4; k++) q.fillRect(0, 30 + k * 58, S, 16);
      q.fillStyle = 'rgba(18,22,28,.28)'; q.fillRect(S * .18, S * .3, S * .26, S * .14);
      q.fillRect(S * .62, S * .66, S * .3, S * .1);
      q.strokeStyle = 'rgba(10,12,16,.5)'; q.lineWidth = 2;
      q.beginPath(); q.moveTo(0, S * .54); q.lineTo(S * .3, S * .5);
      q.lineTo(S * .55, S * .58); q.lineTo(S, S * .52); q.stroke();
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
    return makeTex('rug-' + base + '-' + accent, function (q, S) {
      q.fillStyle = base; q.fillRect(0, 0, S, S);
      q.strokeStyle = accent; q.lineWidth = 9; q.strokeRect(13, 13, S - 26, S - 26);
      q.lineWidth = 3; q.strokeRect(28, 28, S - 56, S - 56);
      q.globalAlpha = .5; q.lineWidth = 6;
      for (var p = -S; p < S * 2; p += 46) {
        q.beginPath(); q.moveTo(p, 0); q.lineTo(p + S, S); q.stroke();
      }
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
    return makeTex('blind', function (q, S) {
      q.clearRect(0, 0, S, S);
      for (var i = 0; i < 6; i++) {
        var y = 12 + i * 42, h = 22;
        var g = q.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, 'rgba(12,22,40,0)');
        g.addColorStop(.5, 'rgba(12,22,40,.85)');
        g.addColorStop(1, 'rgba(12,22,40,0)');
        q.fillStyle = g; q.fillRect(0, y, S, h);
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
  function ceilingTex() {
    return makeTex('ceiling-tile', function (q, S) {
      q.fillStyle = '#e9edf0'; q.fillRect(0, 0, S, S);
      var r = rnd(23);
      for (var i = 0; i < 1900; i++) {
        q.fillStyle = 'rgba(86,102,118,' + (.018 + r() * .035).toFixed(3) + ')';
        q.fillRect(r() * S, r() * S, 2, 2);
      }
      q.strokeStyle = 'rgba(118,132,146,.34)'; q.lineWidth = 5;
      q.strokeRect(0, 0, S, S);
      q.strokeStyle = 'rgba(255,255,255,.55)'; q.lineWidth = 2;
      q.beginPath(); q.moveTo(5, 5); q.lineTo(S - 5, 5); q.stroke();
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
      var hand = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), solid('#f7f3ec'));
      hand.position.set(side * .36, .72, .08); hand.userData.v9 = true; group.add(hand);
    });
    var armL = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .34, 8), solid(bot.c));
    armL.position.set(-.3, .72, .08); armL.rotation.z = .85; armL.userData.v9 = true; group.add(armL);
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
    reflection(bot.x, bot.z + .1, .75, .95, bot.c, 0, .075);
    return { armL: armL, aura: aura, tip: tip };
  }
  function miniDeskPlant(g2, x, z) {
    var pot = new THREE.Mesh(new THREE.CylinderGeometry(.055, .045, .09, 8), solid('#c07a52'));
    pot.position.set(x, .85, z); pot.userData.v9 = true; g2.add(pot);
    for (var i = 0; i < 4; i++) {
      var leaf = new THREE.Mesh(new THREE.ConeGeometry(.045, .16, 5), solid(i % 2 ? '#3f9d6a' : '#57ad78'));
      leaf.position.set(x + (i - 1.5) * .022, .96, z);
      leaf.rotation.z = (i - 1.5) * .3; leaf.userData.v9 = true; g2.add(leaf);
    }
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
      opacity: .38, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    s.position.set(8, 11.5, -27); s.scale.set(11, 11, 1); s.renderOrder = 1; addO(s);
    fx.sun = s;
  }
  function wallFrame(x, y, z, w, h, rot, seed) {
    var g2 = new THREE.Group();
    var back = new THREE.Mesh(new THREE.BoxGeometry(w + .1, h + .1, .06), solid('#2c3648'));
    back.userData.v9 = true; g2.add(back);
    var face = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: artTex(seed), side: THREE.DoubleSide }));
    face.position.z = .04; face.userData.v9 = true; g2.add(face);
    g2.position.set(x, y, z); g2.rotation.y = rot || 0; addO(g2);
  }
  function bookshelf(x, z, rot) {
    var g2 = new THREE.Group();
    var wood = solid('#8b5e34', { map: woodTex('#8b5e34', '#634122', 1, 1), roughness: .6 });
    var back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, .38), wood);
    back.userData.v9 = true; g2.add(back);
    var cols = ['#c94f4f', '#4a7fb0', '#3f9d6a', '#e0a83a', '#8f6fd8', '#e8e2d4'];
    for (var sh = 0; sh < 4; sh++) {
      var shelf = new THREE.Mesh(new THREE.BoxGeometry(1.5, .05, .4), solid('#6d4929'));
      shelf.position.y = -0.72 + sh * .48; shelf.userData.v9 = true; g2.add(shelf);
      for (var bk = 0; bk < 7; bk++) {
        var b = new THREE.Mesh(new THREE.BoxGeometry(.14, .3 + (bk % 3) * .05, .24),
          solid(cols[(sh * 7 + bk) % cols.length]));
        b.position.set(-.6 + bk * .2, -.53 + sh * .48, .06);
        b.rotation.z = (bk % 4 === 0) ? .11 : 0; b.userData.v9 = true; g2.add(b);
      }
    }
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
    [-.68, .68].forEach(function (dx) {
      [-.49, .49].forEach(function (dz) {
        var w = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .11, 12), solid('#1b2029'));
        w.rotation.x = Math.PI / 2; w.position.set(dx, .22, dz); w.userData.v9 = true; g2.add(w);
        var hub = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .12, 10), solid('#9aa5b3', { metalness: .6 }));
        hub.rotation.x = Math.PI / 2; hub.position.set(dx, .22, dz); hub.userData.v9 = true; g2.add(hub);
      });
    });
    g2.position.set(x, 0, z); addO(g2);
    fx.cars.push({ g: g2, dir: dir, speed: .9 + Math.random() * .5 });
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
    fx.cars.push({ g: g2, dir: dir, speed: .55 + Math.random() * .2 });
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
    m.rotation.x = Math.PI / 2; m.position.set(x, 3.285, z); return addO(m);
  }
  function hvacVent(x, z) {
    box(1.05, .05, .68, solid('#aeb8c4', { map: metalTex(), metalness: .55, roughness: .35 }), x, 3.24, z);
    box(.86, .02, .5, '#4c5a6b', x, 3.21, z);
    for (var i = -2; i <= 2; i++) box(.045, .015, .48, '#8e9bab', x + i * .16, 3.205, z);
    box(.9, .012, .05, '#6f7d8c', x, 3.198, z);
  }
  function fireSprinkler(x, z) {
    cyl(.022, .12, '#b8792e', x, 3.19, z);
    var b = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6),
      solid('#d94f3d', { emissive: '#7a1f14', emissiveIntensity: .25 }));
    b.position.set(x, 3.11, z); addO(b);
  }
  function smokeDetector(x, z) {
    cyl(.14, .035, '#e8ecef', x, 3.25, z);
    cyl(.05, .04, '#7d8b9a', x, 3.23, z);
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
    var face = new THREE.Mesh(new THREE.PlaneGeometry(.96, .3),
      new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false }));
    face.position.z = .03; g2.add(face);
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
    });
    glass(5.2, .42, .06, cx, 2.72, z, .2, '#cfe6f2');
    box(5.3, .07, .1, frame, cx, 2.95, z);
    box(5.3, .1, .22, '#8b97a5', cx, .04, z);
    bx(5.1, .025, .05, '#6fd0c4', cx, .02, z - .14, true);
  }
  function entranceCanopy(cx, z) {
    box(10.4, .16, 2.3, solid('#2f3d52', { metalness: .35, roughness: .4 }), cx, 3.18, z + 1.15);
    box(10.6, .08, 2.45, solid('#aeb8c4', { map: metalTex(), metalness: .55, roughness: .35 }), cx, 3.3, z + 1.15);
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
    wallSign('MEET →', '← FOCUS', 33, 2.72, 23.2, 3.0, .55, 0, '#5f7fa8');
    wallSign('CEO', 'EXECUTIVE', 11.12, 1.7, 27.5, .8, .3, Math.PI / 2, '#b08a3d');
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
    [[10.5, 12.5], [28.5, 12.5], [19.5, 26.5], [37.5, 26.5]].forEach(function (p) { hvacVent(p[0], p[1]); });
    [[6, 4.2], [15, 22.8], [24, 4.2], [33, 22.8], [42, 4.2]].forEach(function (p) {
      fireSprinkler(p[0], p[1]); smokeDetector(p[0] + 1.4, p[1]);
    });
    glassDoors(23, 34);
    entranceCanopy(23, 34);
    receptionDetails(); meetingDetails(); pantryDetails(); serverDetails(); wayfinding();
  }
  function presentationScreen(x, z, rot) {
    var g2 = new THREE.Group();
    var frame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.42, .09), solid('#1b2537'));
    frame.position.y = 1.76; frame.userData.v9 = true; g2.add(frame);
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(2.52, 1.24),
      new THREE.MeshBasicMaterial({ map: screenTex(screenCounter++), side: THREE.DoubleSide, toneMapped: false }));
    scr.position.set(0, 1.76, .055); scr.userData.v9 = true; g2.add(scr);
    var post = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1.05, 8), solid('#4b586b'));
    post.position.y = .52; post.userData.v9 = true; g2.add(post);
    var foot = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .5), solid('#3b475b'));
    foot.position.y = .04; foot.userData.v9 = true; g2.add(foot);
    g2.position.set(x, 0, z); g2.rotation.y = rot || 0; addO(g2);
    reflection(x, z, 1.5, .7, '#7fc7ff', rot || 0, .05);
  }
  function deskDetails(g2, di) {
    var mat = new THREE.Mesh(new THREE.PlaneGeometry(.92, .32), solid('#2f3d52', { roughness: .95 }));
    mat.rotation.x = -Math.PI / 2; mat.position.set(0, .812, .22); mat.userData.v9 = true; g2.add(mat);
    var tablet = bx(.36, .22, .025, '#5fd6ff', .56, 1.02, -.04, true);
    tablet.rotation.z = -.12; tablet.rotation.x = -.28; tablet.userData.v9 = true; g2.add(tablet);
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
    }
  }
  function tableCenterpiece(x, z) {
    cyl(.18, .045, '#2f3d52', x, .88, z);
    bx(.12, .02, .12, '#6cc2f0', x, .91, z, true);
    var notes = new THREE.Mesh(new THREE.BoxGeometry(.34, .02, .24), solid('#f2eee4'));
    notes.rotation.y = .24; notes.position.set(x + .62, .87, z); notes.userData.v9 = true; addO(notes);
    var pen = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .26, 6), solid('#3f5a76'));
    pen.rotation.y = .24; pen.rotation.z = Math.PI / 2; pen.position.set(x + .62, .89, z + .04);
    pen.userData.v9 = true; addO(pen);
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
    var face = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: signTexture(txt, sub, accent), side: THREE.DoubleSide }));
    face.position.z = .045; grp.add(face);
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
  }
  function tree(x, z, s) {
    var k = s || 1;
    shadow(x, z, .85 * k, .65 * k, .14);
    cyl(.32 * k, .5 * k, '#8b5e34', x, .25 * k, z);
    cyl(.075 * k, 1.5 * k, '#5b4632', x, 1.25 * k, z);
    [[0, 1.78, .72], [.52, 1.44, .62], [-.5, 1.5, .62], [.08, 2.24, .55], [-.15, 2.0, .48]].forEach(function (p, i) {
      var leaf = new THREE.Mesh(new THREE.SphereGeometry(p[2] * k, 9, 7),
        solid(i % 2 ? '#358d63' : '#2c7d57', { roughness: .9 }));
      leaf.position.set(x + p[0] * k, p[1] * k, z); addO(leaf);
      fx.plants.push({ m: leaf, bz: leaf.rotation.z, bx: leaf.rotation.x, p: i * 1.1 + z });
    });
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
    var di = screenCounter++;
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(.78, .44),
      new THREE.MeshBasicMaterial({ map: screenTex(di), side: THREE.DoubleSide, toneMapped: false }));
    scr.position.set(0, 1.17, -.185); g2.add(scr);
    var kb = new THREE.Mesh(new THREE.BoxGeometry(.66, .03, .22), solid('#e7e9ec'));
    kb.position.set(0, .83, .23); g2.add(kb);
    var mug = new THREE.Mesh(new THREE.CylinderGeometry(.07, .06, .14, 10), solid('#f0ece2'));
    mug.position.set(-.62, .88, -.2); g2.add(mug);
    var lampArm = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .4, 6), solid('#5b6472'));
    lampArm.position.set(-.72, 1.03, -.24); lampArm.rotation.z = .5; g2.add(lampArm);
    var lampHead = new THREE.Mesh(new THREE.ConeGeometry(.13, .15, 10),
      solid('#f0c777', { emissive: '#ffd98a', emissiveIntensity: .65 }));
    lampHead.position.set(-.84, 1.23, -.24); lampHead.rotation.x = Math.PI; g2.add(lampHead);
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
  }
  function meetingTable(x, z, w) {
    shadow(x, z, w / 2 + .5, 1.25, .17);
    box(w, .13, 1.8, solid('#9a6d40', { map: woodTex('#9a6d40', '#6d4a29', 3, 1), roughness: .45 }), x, .79, z);
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
    });
  }
  function printer(x, z) {
    shadow(x, z, .62, .48, .13);
    box(1.0, .82, .72, '#d5dbe1', x, .41, z);
    box(.9, .15, .64, '#3b475b', x, .9, z);
    box(.74, .025, .48, '#f4f5f7', x, 1.0, z + .06);
    bx(.3, .04, .02, '#6cc2f0', x + .22, .95, z + .37, true);
  }
  function waterCooler(x, z) {
    shadow(x, z, .35, .3, .12);
    box(.5, 1.0, .44, '#e4eaf0', x, .5, z);
    var bottle = new THREE.Mesh(new THREE.CylinderGeometry(.21, .21, .4, 14),
      solid('#79c9e8', { transparent: true, opacity: .58, roughness: .18, metalness: .05 }));
    bottle.position.set(x, 1.2, z); addO(bottle);
    cyl(.22, .035, '#c8d8e4', x, 1.41, z);
    box(.24, .06, .2, '#5d6b7d', x, .82, z + .24);
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
    cyl(.3, .08, '#d9c39a', x, .96, z);
    [[-.12, 0, '#c94f4f'], [.1, .05, '#e0a83a'], [0, -.12, '#7bbf66'], [.14, -.1, '#d4724f']].forEach(function (p) {
      var f = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), solid(p[2]));
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
  }
  function clock(x, y, z) {
    var c = cyl(.28, .07, '#f4f6f8', x, y, z); c.rotation.x = Math.PI / 2;
    cyl(.29, .035, '#2f3d52', x, y, z - .02).rotation.x = Math.PI / 2;
    box(.025, .19, .02, '#2f3d52', x, y + .09, z + .05);
    box(.14, .025, .02, '#2f3d52', x + .06, y, z + .05);
  }
  function coatRack(x, z) {
    cyl(.035, 1.75, '#3d495c', x, .88, z);
    cyl(.28, .05, '#3d495c', x, .04, z);
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2;
      box(.2, .12, .34, ['#4a7fb0', '#3f9d6a', '#b07b3d', '#8f6fd8'][i],
        x + Math.cos(a) * .22, 1.5, z + Math.sin(a) * .22);
    }
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
    for (var x = -8; x <= 58; x += 4) box(2.1, .014, .11, '#e8d9a0', x, .016, 49.3, true);
    // Zebra crossings right in front of the entrance and the side gate.
    [8, 23].forEach(function (cx) {
      for (var z = 46.1; z <= 51.9; z += .72) box(2.4, .015, .34, '#eef2f4', cx, .017, z);
    });
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
    for (var bx = -2; bx <= 34; bx += 3.5) cyl(.07, .5, '#8b97a5', bx, .25, 45.15);
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
    // street furniture and greenery
    [6, 18, 30].forEach(function (px) {
      box(2.0, .4, 1.0, '#8b5e34', px, .2, 35.6);
      plant(px - .5, 35.6, .7); plant(px + .5, 35.6, .7);
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
  }
  function parkBench(x, z) {
    box(1.3, .1, .45, '#a9793f', x, .45, z);
    box(1.3, .5, .08, '#7d5634', x, .7, z - .2);
    [-.52, .52].forEach(function (dx) { box(.08, .45, .08, '#4a5668', x + dx, .22, z); });
  }
  function umbrella(x, z, color) {
    cyl(.04, 2.2, '#4a5668', x, 1.1, z);
    var c = new THREE.Mesh(new THREE.ConeGeometry(1.1, .5, 10), solid(color, { roughness: .85 }));
    c.position.set(x, 2.2, z); addO(c);
    box(1.0, .08, 1.0, '#b9c1c9', x, .76, z);
    cyl(.08, .7, '#8b97a5', x, .38, z);
  }
  function marketStall(x, z, color) {
    box(2.4, .9, 1.2, solid('#e8e4dc'), x, .45, z);
    box(2.6, .12, 1.5, solid(color, { roughness: .8 }), x, 2.15, z);
    [-1.2, 1.2].forEach(function (dx) {
      [-.65, .65].forEach(function (dz) { cyl(.05, 2.1, '#5d6b7d', x + dx, 1.05, z + dz); });
    });
    box(1.6, .5, .06, color, x, 1.2, z + .63);
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
    [-.9, .9].forEach(function (dx) {
      [-.62, .62].forEach(function (dz) {
        var w = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .12, 10), solid('#1b2029'));
        w.rotation.x = Math.PI / 2; w.position.set(dx, .28, dz); w.userData.v9 = true; g2.add(w);
      });
    });
    g2.rotation.y = rot || Math.PI / 2; g2.position.set(x, 0, z); addO(g2);
  }
  function sideBuilding(x, z, w, h, d, color) {
    box(w, h, d, solid(color, { roughness: .9 }), x, h / 2, z);
    box(w + .2, .16, d + .2, '#9aa6b8', x, h + .08, z);
    box(.12, h - .2, d + .04, '#4d5a71', x - w / 2 - .06, h / 2, z);
    for (var wy = 1.8; wy < h - 1; wy += 1.9) {
      for (var wx = -w / 2 + 1; wx <= w / 2 - 1; wx += 1.4) {
        var lit = (Math.round(wy * 10) + Math.round(wx * 10) + Math.round(x)) % 4 !== 0;
        var win = bx(.45, .34, .03, lit ? '#ffd89a' : '#cfe0ee', x + wx, wy, z + d / 2 + .02, true);
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
      beacon: beacon, trails: trails });
  }
  function sideWorlds() {
    // ---- EAST / screen-left: café court, fountain and service lane ----
    // Kept inside the visible left wedge (x≈18..34, z≈35..45) of the user view.
    floor(17, 12, solid('#ffffff', { map: stoneTex(10, 2), roughness: .95 }), 26, .002, 40);
    floor(4, 13, solid('#ffffff', { map: asphaltTex(8, 4), roughness: .96, metalness: .02 }), 35, .003, 40);
    for (var ez = 35; ez <= 45; ez += 2) box(.12, .012, 1, '#e8d9a0', 35, .014, ez);
    floor(7, 7, solid('#4f9d6a', { roughness: 1 }), 23, .006, 40);
    pond(22, 40, 1.9);
    sideBuilding(18, 43, 3, 6, 3, '#5d6b84');
    sideBuilding(34, 43, 3, 7, 3, '#68778f');
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
    floor(5, 40, solid('#ffffff', { map: asphaltTex(9, 4), roughness: .96, metalness: .02 }), -20, .003, 25);
    for (var wz = 8; wz <= 44; wz += 4) box(.12, .012, 1.6, '#e8d9a0', -20, .014, wz);
    floor(14, 18, solid('#4f9d6a', { roughness: 1 }), -12, .004, 26);
    basketballCourt(-12, 26);
    sideBuilding(-22, 34, 5, 9, 4, '#68778f');
    sideBuilding(-20, 15, 5, 7, 4, '#5d6b84');
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
  }
  function streetLamp(x, z, rz) {
    var g2 = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, 4.0, 10), solid('#4a5668', { metalness: .6 }));
    pole.position.y = 2.0; pole.userData.v9 = true; g2.add(pole);
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
    for (var x = -8; x <= 54; x += 4) box(2.1, .014, .11, '#e8d9a0', x, .012, -7.2, true);
    box(70, .012, .09, '#d4dbe0', 23, .012, -4.6);
    box(70, .012, .09, '#d4dbe0', 23, .012, -9.8);
    [12, 34].forEach(function (cx) {
      for (var z = -4.5; z >= -9.9; z -= .72) box(2.8, .014, .34, '#eef2f4', cx, .013, z);
    });
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
  }

  /* The old scene left a 1.6 hemisphere and a purple 26-intensity point light
     glued to scene3d; level3d.clear() could not remove them. Keep ours only. */
  function tameOfficeLights() {
    if (typeof scene3d === 'undefined' || !scene3d) return;
    scene3d.traverse(function (o) {
      if (!o.isLight) return;
      var mine = o.userData && o.userData.v9Light;
      if (o.isAmbientLight) o.intensity = .58;
      else if (o.isHemisphereLight) o.intensity = .25;
      else if (o.isDirectionalLight) o.intensity = mine ? .86 : .3;
      else if (o.isPointLight) {
        if (!mine) { o.intensity = .12; o.visible = false; }
        else o.intensity = .3;
      }
    });
  }

  function buildRealOffice3d() {
    if (typeof THREE === 'undefined' || !g || !g.level) return false;
    ensureGrade();
    cuteBots.forEach(function (b) { if (b.bubble && b.bubble.parentNode) b.bubble.parentNode.removeChild(b.bubble); });
    cuteBots.length = 0; animParts.length = 0; screenCounter = 0; TEX = {};
    fx = { shafts: [], screens: [], dust: null, bubbles: [], steam: [], plants: [], sparkles: [], birds: [], scan: [], windows: [], sheen: null,
      auras: [], antennae: [], glints: [], bands: [], cars: [], sun: null, sky: null,
    blinds: [], reflections: [], signals: [], peds: [], ballers: [], ball: null, planes: [] };
    if (animId) { try { cancelAnimationFrame(animId); } catch (e) {} animId = null; }
    try {
      level3d.clear();
      structureGroup = new THREE.Group();
      level3d.add(structureGroup);
    } catch (e) {}

    // White-out fixes retained exactly: muted background, dark surround,
    // exposure .85, ambient .58, day/night switch pre-resolved.
    scene3d.background = new THREE.Color('#93a1b3');
    scene3d.fog = new THREE.Fog('#93a1b3', 70, 165);
    scene3d.isNight = 0;
    try { renderer3d.toneMappingExposure = .85; } catch (e) {}
    if (g.amb) { g.amb.intensity = .58; g.amb.color.set('#8fa4c4'); }
    if (g.sun) g.sun.intensity = .86;
    [[12, 3.1, 9], [34, 3.1, 9], [23, 3.1, 28]].forEach(function (p) {
      var l = new THREE.PointLight(0xffe9c0, .3, 38);
      l.position.set(p[0], p[1], p[2]); l.userData.v9Light = true; addO(l);
    });
    tameOfficeLights();
    dustField();

    // ---- ground, slab, zone floors ----
    floor(220, 220, '#485567', 23, -.22, 17);
    floor(46.8, 34.8, solid('#b9c3cc', { map: terrazzoTex(), roughness: .95, metalness: 0 }), 23, -.03, 17);
    floor(27, 19, solid('#ffffff', { map: carpetTex('#718f8b', '#3f6662', 7, 5), roughness: .95, metalness: 0 }), 15, .005, 11);
    floor(16, 15, solid('#ffffff', { map: tileTex(5, 5), roughness: .8 }), 37, .005, 10);
    floor(19, 10, solid('#ffffff', { map: plankTex(7, 4), roughness: .75 }), 23, .005, 29);
    floor(16, 9, solid('#ffffff', { map: plankTex(6, 3), roughness: .75 }), 37, .005, 28.5);
    floor(11, 7, '#7d8b9d', 5.5, .005, 28);

    // ---- envelope: north window wall, side walls, glass south facade ----
    box(46.8, .55, .2, solid('#e8e4dc', { map: wallTex(), roughness: .9 }), 23, .28, 34);
    glass(17.4, 2.4, .12, 8.7, 1.75, 34, .34);
    glass(8.6, 2.4, .12, 41.7, 1.75, 34, .34);
    glassGlint(10.5, 1.75, 33.88, 5.2, 2.0, 0);
    glassGlint(41.5, 1.75, 33.88, 4.6, 2.0, 0);
    [0, 17.4, 37.2, 46].forEach(function (x) { box(.16, 2.95, .2, '#d9d5cd', x, 1.48, 34); });
    box(46.8, .18, .26, '#b9c0ca', 23, 3.02, 34);

    box(.2, 3.05, 34.8, solid('#e8e4dc', { map: wallTex(), roughness: .9 }), 0, 1.52, 17);
    box(.2, 3.05, 34.8, solid('#e8e4dc', { map: wallTex(), roughness: .9 }), 46, 1.52, 17);
    box(46.8, 3.05, .2, solid('#e8e4dc', { map: wallTex(), roughness: .9 }), 23, 1.52, 0);
    // bright sky + city behind the north glazing
    var sky = new THREE.Mesh(new THREE.PlaneGeometry(46, 2.5),
      new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.DoubleSide, toneMapped: false }));
    sky.position.set(23, 1.95, .09); addO(sky);
    glass(46, 2.5, .09, 23, 1.95, .14, .22);
    for (var wx = 1; wx <= 45; wx += 4) mullion(wx, .16, 'x', 2.55);
    box(46, .09, .16, '#d8dee6', 23, 1.02, .17);
    box(46, .09, .16, '#d8dee6', 23, 2.93, .17);
    windowReflection();
    [5, 13, 21, 29, 37].forEach(function (bx2) {
      windowBand(bx2, 3.4, 4.2, 5.5, .08);
      blindShadow(bx2, 5.4, 4.0, 3.4, .08);
    });
    roomTrim();
    skyBackdrop();
    sunGlow();
    skyline();
    birds();

    // ---- open ceiling: beams, fixture grid, pendants ----
    for (var lx = 6; lx <= 42; lx += 6) for (var lz = 5; lz <= 31; lz += 6) {
      box(2.8, .06, .52, solid('#fff4dc', { emissive: '#ffe0a0', emissiveIntensity: .45 }), lx, 3.16, lz);
      box(2.95, .06, .62, '#6f7d8e', lx, 3.22, lz);
    }
    for (var beam = 6; beam <= 42; beam += 9) box(.18, .18, 34.4, '#9da8b6', beam, 3.38, 17);

    // ---- WELCOME: reception + lounge ----
    planeAt(14, 7.5, solid('#ffffff', { map: rugTex('#3f7d78', '#c9a86a', 2, 1), roughness: .95 }), 23, .012, 30.4);
    box(6, 1.05, 1.3, solid('#8b5e34', { map: woodTex('#8b5e34', '#634122', 3, 1) }), 23, .52, 30.2);
    box(6.2, .1, 1.46, '#d8c6a4', 23, 1.09, 30.2);
    box(1.0, .55, .07, '#1d2b42', 23, 1.45, 29.86);
    bx(.86, .42, .02, '#6cc2f0', 23, 1.45, 29.81, true);
    bx(5.6, .035, .05, '#5fd6ff', 23, .055, 29.46, true);
    bx(3.2, .035, .05, '#ffd27d', 23, .055, 30.94, true);
    wallSign('CYBORG CHEEBEE', 'AI AGENTS HEADQUARTERS', 23, 2.52, 33.86, 6.4, 1.35, 0, '#3f9d9a');
    sofa(13.5, 30.4, '#3f7d78', Math.PI / 2);
    sofa(32.5, 30.4, '#4a6a9a', -Math.PI / 2);
    box(1.8, .08, .85, '#a9793f', 23, .4, 31.8);
    cyl(.24, .3, '#d9c39a', 23, .59, 31.8);
    plant(7.5, 31.4, 1.15); plant(38.5, 31.4, 1.15);
    pendant(23, 29.6, '#b07b3d'); pendant(16.5, 30.4, '#3f7d78'); pendant(29.5, 30.4, '#3f7d78');
    tree(17.4, 31.3, .95); tree(28.6, 31.3, .95);
    wallBoard(16.2, 1.95, 33.82, 'TEAM');
    clock(31.4, 2.1, 33.82);
    coatRack(19.8, 33.1);
    wallFrame(4.6, 2.0, 33.86, 1.6, 1.0, 0, 1);
    wallFrame(.14, 1.95, 18.5, 1.5, 1.0, Math.PI / 2, 0);
    wallFrame(45.86, 1.95, 18.5, 1.5, 1.0, -Math.PI / 2, 2);
    reflection(23, 30.3, 4.4, 1.3, '#ffd9a6', 0, .05);

    // ---- MAIN STREET ----
    floor(42, 2.8, solid('#ffffff', { map: stoneTex(12, 1), roughness: .85 }), 23, .009, 23.2);
    for (var s = 4; s <= 42; s += 4) bx(1.8, .02, .08, '#c8a86a', s, .022, 23.2, true);
    floorSheen();
    wallSign('MAIN STREET', 'RECEPTION  ←  WORK  →  PANTRY', 41, 2.35, 23.2, 3.4, .9, -Math.PI / 2, '#b08a3d');
    [12, 23, 34].forEach(function (x) { pendant(x, 23.2, '#3f6fa8'); });
    plant(5.4, 23.2, .85); plant(29.6, 23.2, .85);

    // ---- FOCUS ----
    bench(8, 7.5); bench(20, 7.5); bench(8, 16); bench(20, 16);
    bookshelf(3.2, 4.9, 0);
    wallSign('FOCUS', 'OPEN WORKSTATIONS · QUIET ZONES', 14, 2.6, .32, 4.8, 1.05, 0, '#3f9d9a');
    glass(.1, 2.45, 5.6, 27, 1.22, 10, .3);
    for (var mz = 7.4; mz <= 12.6; mz += 1.3) mullion(27, mz, 'z', 2.45);
    doorway(27, 10, 'z');
    for (var q = 0; q < 2; q++) {
      var qx = 24.4 + q * 2.1;
      shadow(qx, 17.8, 1.1, 1.05, .14);
      box(1.8, 2.2, 2, solid('#5c6f86', { map: fabricTex('#5c6f86', 1, 1), roughness: .9 }), qx, 1.1, 17.8);
      glass(1.5, 1.55, .08, qx, 1.3, 16.78, .4);
      box(1.3, .07, .55, '#a9793f', qx, .8, 17.8);
      mullion(qx - .8, 16.78, 'z', 2.2); mullion(qx + .8, 16.78, 'z', 2.2);
    }
    wallSign('QUIET BOOTHS', 'CALL · FOCUS · RESET', 25.5, 2.4, 19.3, 3.2, .8, 0, '#5f7fa8');
    roundTable(22.6, 13.6);
    printer(28.6, 5.2); cabinet(30.2, 5.2, '#6e7c8f');
    lightPool(14, 7.5, 5, '#ffe0ad'); lightPool(14, 16, 5, '#ffe0ad');

    // ---- MEET ----
    glass(.1, 2.5, 14, 29, 1.25, 9.5, .28);
    glass(16, 2.5, .1, 37, 1.25, 16.5, .28);
    glass(.1, 2.5, 7, 45, 1.25, 12.5, .28);
    glassGlint(29, 1.25, 7.2, 4.2, 2.0, Math.PI / 2);
    glassGlint(37, 1.25, 16.35, 4.6, 2.0, 0);
    presentationScreen(37, 4.5, 0);
    meetingTable(37, 7.5, 5.4);
    wallBoard(37, 1.75, .34, 'STUDIO');
    wallSign('THE STUDIO', 'BOARDROOM · 8 SEATS', 37, 2.62, 16.42, 4.6, 1.05, 0, '#3f6fa8');
    meetingTable(37, 12.8, 2.8);
    wallSign('HUDDLE', 'QUICK SYNC', 43.2, 2.25, 12.8, 2.2, .7, -Math.PI / 2, '#5f7fa8');
    plant(31, 14.6, .9);
    for (var mz2 = 3.2; mz2 <= 16; mz2 += 2) mullion(29, mz2, 'z', 2.5);
    doorway(29, 9.5, 'z');
    for (var mx2 = 30; mx2 <= 44; mx2 += 2) mullion(mx2, 16.5, 'x', 2.5);
    doorway(37, 16.5, 'x');
    for (var mz3 = 9.8; mz3 <= 15.5; mz3 += 2) mullion(45, mz3, 'z', 2.5);
    pendant(37, 7.5, '#3f6fa8'); pendant(37, 12.8, '#5f7fa8');
    clock(40.5, 2.1, .34);
    cabinet(44, 5.4, '#6e7c8f');

    // ---- GATHER ----
    box(7.4, .95, .9, solid('#8b5e34', { map: woodTex('#8b5e34', '#634122', 4, 1) }), 37, .48, 32.4);
    box(7.6, .1, 1.0, '#d8c6a4', 37, 1.01, 32.4);
    box(.9, 1.4, .72, '#2f3d52', 39.8, 1.72, 32.4);
    bx(.62, .62, .04, '#6cc2f0', 39.8, 1.9, 32.78, true);
    box(1.1, 1.7, .72, '#c3ccd6', 34.5, .85, 32.4);
    box(.04, 1.1, .03, '#8a96a5', 34.95, .95, 32.78);
    box(4.4, .14, 1.5, solid('#a9793f', { map: woodTex('#a9793f', '#77522e', 3, 1) }), 37, .87, 29.2);
    [35.6, 37, 38.4].forEach(function (px) {
      cyl(.29, .14, '#d9c9a8', px, .74, 28.1);
      cyl(.05, .6, '#5a4632', px, .34, 28.1);
      coffeeSteam(px, 28.1);
    });
    waterCooler(31.4, 30.2);
    fruitBowl(37, 29.2);
    wallSign('THE COMMONS', 'PANTRY · COFFEE · TEAM SNACKS', 37, 2.5, 33.86, 5.2, 1.15, 0, '#b07b3d');
    pendant(37, 29.2, '#b07b3d'); pendant(40.5, 30, '#3f7d78');
    cabinet(41.2, 32.3, '#8b5e34'); cabinet(33.4, 32.3, '#8b5e34');
    bookshelf(44.6, 29.4, -Math.PI / 2);
    lightPool(37, 29.2, 4.6, '#ffd9a6');
    reflection(37, 32.5, 5.4, 1.2, '#ffd9a6', 0, .05);

    // ---- SUPPORT: executive + server / IT ----
    glass(.1, 2.45, 6.4, 11, 1.22, 27.5, .3);
    box(2.8, .13, 1.4, solid('#7d5634', { map: woodTex('#7d5634', '#553a22', 2, 1) }), 5.5, .78, 28.4);
    box(.9, .55, .06, '#1d2b42', 5.5, 1.24, 28.05);
    bx(.78, .44, .02, '#6cc2f0', 5.5, 1.24, 28.01, true);
    officeChair(5.5, 29.6, Math.PI, '#3f5a76');
    box(.95, 2.2, .44, '#8b5e34', 1.6, 1.1, 30.8);
    for (var bk = 0; bk < 4; bk++) box(.82, .05, .36, ['#b05555', '#4a7fb0', '#3f8c66', '#c9a227'][bk], 1.6, .5 + bk * .42, 30.8);
    wallSign('EXECUTIVE', 'CEO · FOCUS ROOM', 5.5, 2.4, 24.28, 3.0, .85, 0, '#b08a3d');
    [2.8, 5, 7.2].forEach(function (px) { serverRack(px, 25.5); });
    wallSign('SERVER / IT', 'SYSTEMS · NETWORK', 5, 2.3, 23.18, 3.0, .8, 0, '#5f7fa8');
    plant(10.5, 32, .95); plant(23, 20.8, .9);
    for (var mz4 = 24.4; mz4 <= 30.6; mz4 += 1.6) mullion(11, mz4, 'z', 2.45);
    doorway(11, 27.5, 'z');
    pendant(5.5, 28.4, '#b08a3d');
    cabinet(9.4, 31.6, '#6e7c8f'); printer(8.6, 26.1);

    exterior();
    northStreet();
    entranceRoad();
    sideWorlds();
    airplane();
    buildingEnhancements();

    // ---- 6 small, cute, happy bots ----
    var host = document.getElementById('oc3d') || document.body;
    BOTS.forEach(function (b, idx) {
      var c;
      try { c = makeChar3d(b, b.x, b.z); } catch (e) { return; }
      c.group.scale.setScalar(.74);
      c.emo.position.set(0, 1.62, 0);
      var tag = c.group.children.filter(function (o) { return o.isSprite && o !== c.emo; })[0];
      if (tag) tag.position.set(0, 2.02, 0);
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .34, 8), solid(b.c));
      arm.position.set(.3, .72, .08); arm.rotation.z = -.85; c.group.add(arm);
      if (b.id === 'cos') {
        var band = new THREE.Mesh(new THREE.TorusGeometry(.4, .03, 8, 16, Math.PI), solid('#2f3d52'));
        band.position.set(0, .58, 0); band.rotation.z = Math.PI; c.group.add(band);
        var mic = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .3, 6), solid('#2f3d52'));
        mic.position.set(.3, .42, .28); mic.rotation.z = -.9; c.group.add(mic);
      } else if (b.id === 'seo') {
        var ring = new THREE.Mesh(new THREE.TorusGeometry(.16, .025, 8, 14), solid('#d8b45a'));
        ring.position.set(.42, .55, .3); c.group.add(ring);
        var hdl = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .28, 6), solid('#8b5e34'));
        hdl.position.set(.58, .38, .3); hdl.rotation.z = -.6; c.group.add(hdl);
      } else if (b.id === 'product') {
        var pkg = new THREE.Mesh(new THREE.BoxGeometry(.26, .2, .24), solid('#b98a54'));
        pkg.position.set(.4, .5, .22); c.group.add(pkg);
      } else if (b.id === 'mgr') {
        var clip = new THREE.Mesh(new THREE.BoxGeometry(.28, .36, .03), solid('#8b5e34'));
        clip.position.set(.4, .62, .26); clip.rotation.z = -.25; c.group.add(clip);
        var paper = new THREE.Mesh(new THREE.BoxGeometry(.22, .28, .01), solid('#f2eee4'));
        paper.position.set(.4, .63, .29); paper.rotation.z = -.25; c.group.add(paper);
      } else if (b.id === 'writer') {
        var pen = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .34, 6), solid('#b07b3d'));
        pen.position.set(.42, .58, .26); pen.rotation.z = -.8; c.group.add(pen);
      }
      var el = document.createElement('div');
      el.className = 'bub3d v9bub'; el.style.display = 'none';
      host.appendChild(el);
      var flair = botFlair(c.group, b, idx);
      cuteBots.push({
        id: b.id, n: b.n, group: c.group, emo: c.emo, arm: arm, armL: flair.armL,
        aura: flair.aura, tip: flair.tip, talking: false, bubble: el,
        baseY: 0, phase: idx * 1.1, face: b.face, tx: b.x, tz: b.z
      });
      botSparkles(c.group, idx);
    });

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
  function updateBubbles(now) {
    var conv = currentConv(), active = null;
    if (conv && now - conv.t < 180000 && conv.lines && conv.lines.length) {
      active = conv.lines[Math.floor(now / 3800) % conv.lines.length];
    }
    var host = document.getElementById('oc3d');
    if (!host) return;
    var w = host.clientWidth || 900, h = host.clientHeight || 520;
    cuteBots.forEach(function (b) {
      var show = active && active.id === b.id && typeof camera3d !== 'undefined' && camera3d;
      if (show) {
        var v = new THREE.Vector3(b.group.position.x, b.group.position.y + 1.75, b.group.position.z).project(camera3d);
        show = v.z < 1;
        if (show) {
          b.bubble.innerHTML = '<b>' + esc(b.n) + '</b>' + esc(active.text);
          b.bubble.style.left = ((v.x * .5 + .5) * w) + 'px';
          b.bubble.style.top = ((-v.y * .5 + .5) * h) + 'px';
        }
      }
      b.talking = !!show;
      b.bubble.style.display = show ? 'block' : 'none';
    });
  }
  function tick() {
    animId = requestAnimationFrame(tick);
    if (document.hidden) return;
    var now = Date.now();
    if (now - (tick.last || 0) < 33) return;
    tick.last = now;
    try {
      if (scene3d) {
        if (scene3d.background && scene3d.background.getHexString() !== '93a1b3') scene3d.background.set('#93a1b3');
        if (scene3d.fog && scene3d.fog.color && scene3d.fog.color.getHexString() !== '93a1b3') scene3d.fog.color.set('#93a1b3');
      }
      if (g && g.amb && Math.abs(g.amb.intensity - .58) > .01) { g.amb.intensity = .58; g.amb.color.set('#8fa4c4'); }
      tameOfficeLights();
      if (renderer3d && Math.abs(renderer3d.toneMappingExposure - .85) > .01) renderer3d.toneMappingExposure = .85;
    } catch (e) {}
    cuteBots.forEach(function (b, i) {
      b.group.position.y = b.baseY + Math.sin(now / 430 + b.phase) * .055;
      b.group.rotation.y = b.face + Math.sin(now / 1700 + i) * .28;
      if (b.arm) b.arm.rotation.z = -.85 + Math.sin(now / 330 + i) * .38;
      if (b.armL) b.armL.rotation.z = .85 - Math.sin(now / 330 + i) * .38;
      if (b.aura) {
        var pulse = .5 + .5 * Math.sin(now / 600 + i);
        b.aura.material.opacity = b.talking ? .22 + .16 * pulse : .08 + .06 * pulse;
        b.aura.scale.setScalar(b.talking ? 1.08 + .08 * pulse : 1 + .03 * pulse);
      }
    });
    if (now - lastEmo > 2800) {
      lastEmo = now;
      cuteBots.forEach(function (b, i) { try { setEmo(b.emo, EMOS[(Math.floor(now / 2800) + i) % EMOS.length]); } catch (e) {} });
    }
    if (now - (tick.glow || 0) > 140) {
      tick.glow = now;
      animParts.forEach(function (a) {
        var m = a.m;
        if (!m || !m.material || m.material.emissiveIntensity === undefined) return;
        m.material.emissiveIntensity = a.k === 'led'
          ? .3 + .65 * (.5 + .5 * Math.sin(now / 240 + a.p))
          : .7 + .22 * Math.sin(now / 720 + a.p);
      });
    }
    try {
      // Animated monitor dashboards (staggered so 24 canvases never repaint at once).
      if (now - (tick.screens || 0) > 320 && fx.screens.length) {
        tick.screens = now;
        for (var si = 0; si < 5; si++) {
          var sc = fx.screens[(tick.screenPtr || 0) % fx.screens.length];
          tick.screenPtr = ((tick.screenPtr || 0) + 1) % fx.screens.length;
          sc.step++;
          try { paintScreen(sc.q, 256, sc.idx, sc.step); sc.t.needsUpdate = true; } catch (e) {}
        }
      }
      fx.shafts.forEach(function (a) {
        a.m.material.opacity = .045 + .025 * (.5 + .5 * Math.sin(now / 900 + a.p));
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
        var v = .5 + .5 * Math.sin(now / 520 + a.p);
        a.m.material.opacity = .15 + .6 * v;
        a.m.position.x = a.base + Math.sin(now / 900 + a.p) * .07;
        a.m.scale.setScalar(.07 + .06 * v);
      });
      if (now - (tick.plants || 0) > 80) {
        tick.plants = now;
        fx.plants.forEach(function (a) {
          a.m.rotation.z = a.bz + Math.sin(now / 1200 + a.p) * .035;
          a.m.rotation.x = a.bx + Math.cos(now / 1450 + a.p) * .03;
        });
      }
      fx.birds.forEach(function (a) {
        a.g.position.x = -12 + ((now / 1000 * a.sp + a.p * 4) % 64);
        a.g.position.y = a.base + Math.sin(now / 900 + a.p) * .25;
        if (a.g.children[0]) a.g.children[0].rotation.z = .3 + Math.sin(now / 160 + a.p) * .25;
        if (a.g.children[1]) a.g.children[1].rotation.z = -.3 - Math.sin(now / 160 + a.p) * .25;
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
        a.m.material.opacity = .08 + .07 * (.5 + .5 * Math.sin(now / 1100 + a.p));
      });
      fx.bands.forEach(function (a) {
        a.m.material.opacity = .1 + .05 * (.5 + .5 * Math.sin(now / 1600 + a.p));
      });
      fx.blinds.forEach(function (a) {
        a.m.material.opacity = .13 + .04 * (.5 + .5 * Math.sin(now / 2100 + a.p));
      });
      fx.reflections.forEach(function (a) {
        a.m.material.opacity = a.base * (.8 + .35 * (.5 + .5 * Math.sin(now / 1400 + a.p)));
      });
      var dt = Math.min(.12, (now - (tick.carLast || now)) / 1000);
      tick.carLast = now;
      fx.cars.forEach(function (a) {
        a.g.position.x += a.dir * a.speed * dt * 3.5;
        if (a.dir > 0 && a.g.position.x > 58) a.g.position.x = -12;
        if (a.dir < 0 && a.g.position.x < -12) a.g.position.x = 58;
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
        a.g.position.y = a.y + Math.sin(now / 1300) * .18;
        a.g.position.z = a.z + Math.sin(now / 2100) * .6;
        a.g.rotation.z = -.035 + Math.sin(now / 1800) * .045;
        if (a.beacon) a.beacon.material.opacity = .25 + .7 * (.5 + .5 * Math.sin(now / 230));
        if (a.trails) a.trails.forEach(function (t, i) {
          t.material.opacity = .12 + .06 * (.5 + .5 * Math.sin(now / 700 + i));
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
      if (fx.sun) {
        var sp = 1 + .04 * Math.sin(now / 1900);
        fx.sun.scale.set(11 * sp, 11 * sp, 1);
      }
    } catch (e) {}
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

  window.buildRealOffice3d = buildRealOffice3d;
  window.__officeV9 = { bots: cuteBots, rebuild: buildRealOffice3d, tick: tick,
    get fx() { return fx; } };
})();
