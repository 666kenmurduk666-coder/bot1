/* office-v9.js — Cyborg Cheebee Office.
   v9 "photographic" pass: textured materials, warm light pools, contact shadows,
   legible signage, a real exterior approach, and a lower hero camera.
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
  var fx = { shafts: [], screens: [], dust: null, bubbles: [], steam: [], plants: [], sparkles: [], birds: [], scan: [], windows: [], sheen: null };

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
      g.addColorStop(0, '#6f9fd0'); g.addColorStop(.55, '#a8c8e4'); g.addColorStop(1, '#d9e6f0');
      q.fillStyle = g; q.fillRect(0, 0, S, S);
      var r = rnd(11);
      for (var i = 0; i < 7; i++) {
        q.fillStyle = 'rgba(255,255,255,' + (.16 + r() * .2).toFixed(2) + ')';
        q.beginPath(); q.ellipse(r() * S, 40 + r() * (S - 80), 30 + r() * 35, 10 + r() * 9, 0, 0, 6.3); q.fill();
      }
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
  function wallTex() {
    return makeTex('wall', function (q, S) {
      q.fillStyle = '#e8e4dc'; q.fillRect(0, 0, S, S);
      var r = rnd(5);
      for (var i = 0; i < 900; i++) {
        q.fillStyle = 'rgba(120,115,105,' + (.012 + r() * .018).toFixed(3) + ')';
        q.fillRect(r() * S, r() * S, 2, 2);
      }
    }, 6, 3);
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
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(.78, .44),
      new THREE.MeshBasicMaterial({ map: screenTex(screenCounter++), side: THREE.DoubleSide, toneMapped: false }));
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
    var heights = [8, 12, 9, 15, 10, 13, 7, 11, 14, 9, 12];
    for (var i = 0; i < heights.length; i++) {
      var x = -18 + i * 7.6, h = heights[i];
      box(5.6, h, 4, solid(i % 2 ? '#5d6b84' : '#68778f', { roughness: .9 }), x, h / 2, -14);
      for (var wy = 2; wy < h - 1; wy += 2.1) {
        for (var wx = -1.8; wx <= 1.8; wx += 1.8) {
          var win = bx(.55, .42, .03, (wy + wx + i) % 3 ? '#dfe9f2' : '#ffd89a', x + wx, wy, -11.93, true);
          if ((Math.round(wy * 10) + Math.round(wx * 10) + i * 3) % 5 === 0) {
            fx.windows.push({ m: win, p: i + wx + wy });
          }
        }
      }
    }
  }
  function skyBackdrop() {
    var cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
    var q = cv.getContext('2d');
    var g = q.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#5d8ec4'); g.addColorStop(.55, '#a9c9e6'); g.addColorStop(1, '#dbe6ef');
    q.fillStyle = g; q.fillRect(0, 0, 1024, 512);
    var r = rnd(91);
    for (var i = 0; i < 20; i++) {
      q.fillStyle = 'rgba(255,255,255,' + (.12 + r() * .22).toFixed(2) + ')';
      q.beginPath();
      q.ellipse(r() * 1024, 60 + r() * 300, 45 + r() * 90, 12 + r() * 22, 0, 0, 6.3);
      q.fill();
    }
    var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
    var m = new THREE.Mesh(new THREE.PlaneGeometry(220, 90),
      new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, depthWrite: false, fog: false, toneMapped: false }));
    m.position.set(23, 28, -32); addO(m);
  }
  function exterior() {
    floor(80, 16, solid('#ffffff', { map: stoneTex(10, 2), roughness: .95, metalness: 0 }), 23, .004, 41);
    floor(80, 6, solid('#3a4352', { roughness: .95 }), 23, .002, 49);
    for (var i = -8; i <= 16; i++) box(2.2, .02, .11, '#c8cdd4', i * 3, .014, 49);
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
    cuteBots.forEach(function (b) { if (b.bubble && b.bubble.parentNode) b.bubble.parentNode.removeChild(b.bubble); });
    cuteBots.length = 0; animParts.length = 0; screenCounter = 0; TEX = {};
    fx = { shafts: [], screens: [], dust: null, bubbles: [], steam: [], plants: [], sparkles: [], birds: [], scan: [], windows: [], sheen: null };
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
    floor(46.8, 34.8, '#6f7d90', 23, -.03, 17);
    floor(27, 19, solid('#ffffff', { map: carpetTex('#718f8b', '#3f6662', 7, 5), roughness: .95, metalness: 0 }), 15, .005, 11);
    floor(16, 15, solid('#ffffff', { map: tileTex(5, 5), roughness: .8 }), 37, .005, 10);
    floor(19, 10, solid('#ffffff', { map: plankTex(7, 4), roughness: .75 }), 23, .005, 29);
    floor(16, 9, solid('#ffffff', { map: plankTex(6, 3), roughness: .75 }), 37, .005, 28.5);
    floor(11, 7, '#7d8b9d', 5.5, .005, 28);

    // ---- envelope: north window wall, side walls, glass south facade ----
    box(46.8, .55, .2, solid('#e8e4dc', { map: wallTex(), roughness: .9 }), 23, .28, 34);
    glass(17.4, 2.4, .12, 8.7, 1.75, 34, .34);
    glass(8.6, 2.4, .12, 41.7, 1.75, 34, .34);
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
    skyBackdrop();
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

    // ---- MAIN STREET ----
    floor(42, 2.8, solid('#ffffff', { map: stoneTex(12, 1), roughness: .85 }), 23, .009, 23.2);
    for (var s = 4; s <= 42; s += 4) bx(1.8, .02, .08, '#c8a86a', s, .022, 23.2, true);
    floorSheen();
    wallSign('MAIN STREET', 'RECEPTION  ←  WORK  →  PANTRY', 41, 2.35, 23.2, 3.4, .9, -Math.PI / 2, '#b08a3d');
    [12, 23, 34].forEach(function (x) { pendant(x, 23.2, '#3f6fa8'); });
    plant(5.4, 23.2, .85); plant(29.6, 23.2, .85);

    // ---- FOCUS ----
    bench(8, 7.5); bench(20, 7.5); bench(8, 16); bench(20, 16);
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
    lightPool(37, 29.2, 4.6, '#ffd9a6');

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
      cuteBots.push({
        id: b.id, n: b.n, group: c.group, emo: c.emo, arm: arm, bubble: el,
        baseY: 0, phase: idx * 1.1, face: b.face, tx: b.x, tz: b.z
      });
      botSparkles(c.group, idx);
    });

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
