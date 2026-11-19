/* office-v9.js — Cyborg Cheebee Office, realistic single-floor redesign.
   Loaded after the main app script. buildRoom3d() calls buildRealOffice3d().
   Uses the app's existing helpers (THREE, box3, cyl3, m3, makeChar3d, setEmo).
   Light on purpose: ~150 meshes, no shadows, no pathfinding. */
(function () {
  'use strict';

  var BOTS = [
    { id: 'cos',     n: 'Cos 💬',     c: '#f472b6', x: 23, z: 27, face: Math.PI },
    { id: 'seo',     n: 'Seo 🔍',     c: '#4a9fd6', x: 9,  z: 8,  face: 0 },
    { id: 'product', n: 'Product 📦', c: '#f0b429', x: 17, z: 8,  face: 0 },
    { id: 'joker',   n: 'Joker 😄',   c: '#8f6fd8', x: 13, z: 13, face: Math.PI },
    { id: 'mgr',     n: 'Mgr 📋',     c: '#3f9d6a', x: 35, z: 10, face: Math.PI / 2 },
    { id: 'writer',  n: 'Writer ✍️', c: '#e8622c', x: 38, z: 26, face: -Math.PI / 2 }
  ];
  var EMOS = ['😊', '😄', '🤩', '✨', '💚', '🙌'];
  var cuteBots = [], lastEmo = 0, animId = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function addO(o) {
    var parent = (typeof structureGroup !== 'undefined' && structureGroup) ? structureGroup : g.level;
    parent.add(o); return o;
  }
  function bx(w, h, d, c, x, y, z, glow) { return box3(w, h, d, c, x, y, z, glow); }
  function cy(r, h, c, x, y, z, glow) { return cyl3(r, h, c, x, y, z, glow); }
  function floor(w, d, c, x, y, z) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m3(c));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true;
    return addO(m);
  }
  function glass(w, h, d, x, y, z, op) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({
      color: '#c6e4ff', transparent: true, opacity: op || 0.3, roughness: 0.08,
      metalness: 0.12, side: THREE.DoubleSide, depthWrite: false
    }));
    m.position.set(x, y, z); return addO(m);
  }
  function lamp(x, z, w, d) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w || 2.4, 0.06, d || 0.55),
      m3('#fff9e8', { emissive: '#fff1cf', emissiveIntensity: 0.9 }));
    m.position.set(x, 3.28, z); return addO(m);
  }
  function plant(x, z, s) {
    var k = s || 1;
    cy(0.26 * k, 0.42 * k, '#a9714a', x, 0.21 * k, z);
    var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.42 * k, 1.05 * k, 8), m3('#3fa34a'));
    leaf.position.set(x, 0.88 * k, z); leaf.castShadow = true; addO(leaf);
  }
  function desk(x, z) {
    bx(1.9, 0.09, 0.95, '#c99b62', x, 0.78, z);          // desktop
    bx(0.1, 0.74, 0.85, '#8d96a6', x - 0.85, 0.39, z);
    bx(0.1, 0.74, 0.85, '#8d96a6', x + 0.85, 0.39, z);
    bx(0.85, 0.55, 0.06, '#2a3448', x, 1.2, z - 0.28);   // monitor
    bx(0.75, 0.44, 0.02, '#7fd0ff', x, 1.2, z - 0.24, true);
    bx(0.1, 0.25, 0.1, '#4b5565', x, 1.0, z - 0.28);
    bx(0.7, 0.03, 0.22, '#e8ecf2', x, 0.85, z + 0.2);    // keyboard
    cy(0.06, 0.45, '#3a4354', x, 0.24, z + 1.05);        // chair
    cy(0.28, 0.1, '#4c586c', x, 0.5, z + 1.05);
    bx(0.55, 0.6, 0.12, '#4c586c', x, 0.82, z + 1.32);
  }
  function chair(x, z, rot) {
    var grp = new THREE.Group();
    var b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8), m3('#3a4354'));
    b.position.y = 0.21; grp.add(b);
    var s = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), m3('#526076'));
    s.position.y = 0.47; grp.add(s);
    var back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.12), m3('#526076'));
    back.position.set(0, 0.8, 0.27); grp.add(back);
    grp.position.set(x, 0, z); grp.rotation.y = rot || 0; addO(grp);
  }
  function windowStrip(x, y, z, w, h, alongZ) {
    glass(alongZ ? 0.1 : w, h, alongZ ? w : 0.1, x, y, z, 0.34);
    bx(alongZ ? 0.14 : w, 0.06, alongZ ? w : 0.14, '#eef3fa', x, y - h / 2, z);
    bx(alongZ ? 0.14 : w, 0.06, alongZ ? w : 0.14, '#eef3fa', x, y + h / 2, z);
  }

  function buildRealOffice3d() {
    if (typeof THREE === 'undefined' || !g || !g.level) return false;
    cuteBots.forEach(function (b) { if (b.bubble && b.bubble.parentNode) b.bubble.parentNode.removeChild(b.bubble); });
    cuteBots.length = 0;
    if (animId) { try { cancelAnimationFrame(animId); } catch (e) {} animId = null; }

    scene3d.background = new THREE.Color('#e9eef5');
    scene3d.fog = new THREE.Fog('#e9eef5', 75, 190);
    if (g.amb) g.amb.intensity = 1.35;
    [[10, 3.4, 9], [30, 3.4, 9], [23, 3.4, 25]].forEach(function (p, i) {
      var l = new THREE.PointLight(i === 2 ? 0xfff0d2 : 0xf4f8ff, 0.75, 46);
      l.position.set(p[0], p[1], p[2]); addO(l);
    });

    // ---- floor + zone carpets ----
    floor(46.6, 34.6, '#d9dee7', 23, -0.02, 17);
    floor(25, 15, '#e6e9ee', 15, 0.005, 11);       // workstations
    floor(15, 12, '#dce9e2', 36, 0.005, 10.5);     // meeting room
    floor(11, 12, '#eee4d2', 5.5, 0.005, 10.5);    // CEO office
    floor(18, 10, '#efe6d5', 23, 0.005, 28.5);     // reception / lobby
    floor(15, 10, '#eee3d0', 37, 0.005, 27);       // pantry

    // ---- perimeter walls + windows ----
    bx(46.6, 3.3, 0.2, '#f5f2ea', 23, 1.65, 0);
    bx(0.2, 3.3, 34.6, '#f5f2ea', 0, 1.65, 17);
    bx(0.2, 3.3, 34.6, '#f5f2ea', 46, 1.65, 17);
    bx(18.3, 3.3, 0.2, '#f5f2ea', 9.15, 1.65, 34);
    bx(18.3, 3.3, 0.2, '#f5f2ea', 36.85, 1.65, 34);
    bx(9, 0.28, 1.3, '#2f4059', 23, 3.45, 34);     // entrance canopy
    for (var wx = 3; wx <= 43; wx += 5) windowStrip(wx, 2.0, 0.13, 3.4, 1.75, false);
    for (var wz = 3; wz <= 31; wz += 5) {
      windowStrip(0.13, 2.0, wz, 3.4, 1.75, true);
      windowStrip(45.87, 2.0, wz, 3.4, 1.75, true);
    }

    // ---- glass partitions ----
    glass(0.1, 2.5, 12.6, 28, 1.25, 10.5, 0.24);
    glass(15.6, 2.5, 0.1, 36.2, 1.25, 16.8, 0.24);
    glass(0.1, 2.5, 12.6, 11, 1.25, 10.5, 0.24);
    glass(10.8, 2.5, 0.1, 5.6, 1.25, 16.8, 0.24);
    mkWallSign('MEETING ROOM', 36, 2.35, 16.65, '#3f9d6a', 0, 2.8, 0.55);
    mkWallSign('CEO OFFICE', 5.6, 2.35, 16.65, '#c9a227', 0, 2.6, 0.55);
    mkWallSign('CYBORG CHEEBEE OFFICE', 23, 2.5, 33.78, '#4a9fd6', Math.PI, 5.4, 0.75);

    // ---- ceiling light rows ----
    for (var lx = 6; lx <= 40; lx += 6) for (var lz = 5; lz <= 29; lz += 6) lamp(lx, lz);

    // ---- reception / lobby ----
    bx(5.4, 1.05, 1.25, '#3d4a60', 23, 0.52, 29.5);
    bx(5.6, 0.12, 1.4, '#d8b98a', 23, 1.09, 29.5);
    bx(0.8, 0.5, 0.06, '#2a3448', 23, 1.42, 29.1);
    bx(0.68, 0.4, 0.02, '#7fd0ff', 23, 1.42, 29.06, true);
    bx(2.2, 0.42, 0.9, '#7a6aa8', 17.5, 0.28, 30.5);
    bx(2.2, 0.42, 0.9, '#7a6aa8', 28.5, 0.28, 30.5);
    bx(1.1, 0.1, 0.65, '#a98a5c', 23, 0.42, 31.2);
    plant(15, 32, 1.15); plant(31, 32, 1.15);

    // ---- open workstations (2 rows x 5) ----
    for (var i = 0; i < 5; i++) { desk(5 + i * 4, 8); desk(5 + i * 4, 13); }
    mkLabel('WORKSTATIONS', 15, 3.2, 2.4, '#4a9fd6');

    // ---- meeting room ----
    bx(5.5, 0.14, 2.2, '#9a7448', 36, 0.76, 10);
    bx(5.2, 0.04, 2, '#b48d5c', 36, 0.85, 10);
    chair(33.2, 10, Math.PI / 2); chair(38.8, 10, -Math.PI / 2);
    chair(34.6, 10, Math.PI / 2); chair(37.4, 10, -Math.PI / 2);
    chair(36, 8.4, 0); chair(36, 11.6, Math.PI);
    bx(2.8, 1.5, 0.1, '#f7f9fc', 42.9, 1.7, 8);
    bx(2.9, 0.1, 0.14, '#9aa5b6', 42.9, 0.92, 8);
    plant(41.8, 14.4, 0.9);

    // ---- CEO office ----
    bx(2.7, 0.14, 1.35, '#6b4a2c', 5.5, 0.78, 9.5);
    bx(0.85, 0.55, 0.06, '#2a3448', 5.5, 1.22, 9.15);
    bx(0.74, 0.44, 0.02, '#7fd0ff', 5.5, 1.22, 9.11, true);
    chair(5.5, 10.8, Math.PI);
    bx(0.9, 2.3, 0.45, '#8a6238', 1.4, 1.15, 6.5);
    for (var bk = 0; bk < 4; bk++) bx(0.82, 0.05, 0.4, ['#c94f4f', '#4a9fd6', '#3f9d6a', '#c9a227'][bk], 1.4, 0.5 + bk * 0.45, 6.5);
    plant(8.8, 14.5, 1);

    // ---- pantry + server nook ----
    bx(4.6, 1, 0.9, '#b07b45', 38, 0.5, 31.5);
    bx(4.4, 0.12, 0.75, '#e6d3aa', 38, 1.06, 31.5);
    bx(0.85, 1.35, 0.7, '#3a4256', 39.6, 1.68, 31.5);
    bx(0.6, 0.55, 0.04, '#7fd0ff', 39.6, 1.85, 31.87, true);
    for (var st = 0; st < 3; st++) cy(0.3, 0.12, '#d9c9a8', 35.5 + st * 1.6, 0.72, 30.1);
    bx(0.6, 1.35, 0.6, '#e8eef5', 31.5, 0.68, 27);
    cy(0.24, 0.4, '#8fd0e8', 31.5, 1.52, 27, true);
    for (var sv = 0; sv < 3; sv++) {
      bx(0.9, 2.35, 0.8, '#384358', 2.5 + sv * 2, 1.18, 26);
      bx(0.5, 0.08, 0.03, '#5fe08a', 2.5 + sv * 2, 1.7, 26.42, true);
    }
    plant(11, 28, 1); plant(23, 20.5, 0.9);

    // ---- small, cute, happy bots ----
    var host = document.getElementById('oc3d') || document.body;
    BOTS.forEach(function (b, idx) {
      var c;
      try { c = makeChar3d(b, b.x, b.z); } catch (e) { return; }
      c.group.scale.setScalar(0.66);                       // maliliit
      c.emo.position.set(0, 1.65, 0);
      var tag = c.group.children.filter(function (o) { return o.isSprite && o !== c.emo; })[0];
      if (tag) tag.position.set(0, 2.05, 0);
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 8), m3(b.c));
      arm.position.set(0.3, 0.72, 0.08); arm.rotation.z = -0.85;
      c.group.add(arm);
      var el = document.createElement('div');
      el.className = 'bub3d'; el.style.display = 'none';
      host.appendChild(el);
      cuteBots.push({
        id: b.id, n: b.n, group: c.group, emo: c.emo, arm: arm, bubble: el,
        baseY: 0, phase: idx * 1.1, face: b.face,
        tx: b.x, tz: b.z
      });
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
          b.bubble.style.left = ((v.x * 0.5 + 0.5) * w) + 'px';
          b.bubble.style.top = ((-v.y * 0.5 + 0.5) * h) + 'px';
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
    cuteBots.forEach(function (b, i) {
      b.group.position.y = b.baseY + Math.sin(now / 430 + b.phase) * 0.055;
      b.group.rotation.y = b.face + Math.sin(now / 1700 + i) * 0.28;
      if (b.arm) b.arm.rotation.z = -0.85 + Math.sin(now / 330 + i) * 0.38;
    });
    if (now - lastEmo > 2800) {
      lastEmo = now;
      cuteBots.forEach(function (b, i) { try { setEmo(b.emo, EMOS[(Math.floor(now / 2800) + i) % EMOS.length]); } catch (e) {} });
    }
    updateBubbles(now);
  }

  // A raw immediate conversation makes the office feel alive on first open.
  setTimeout(function () {
    var conv = currentConv();
    if (conv && Date.now() - conv.t < 120000) return;
    try {
      var pass = (typeof ceoPass !== 'undefined' && ceoPass) ? ceoPass : '';
      fetch('/api/conversation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pass: pass }) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.ok && typeof refresh === 'function') refresh(); })
        .catch(function () {});
    } catch (e) {}
  }, 4000);

  window.buildRealOffice3d = buildRealOffice3d;
  // Expose tick for diagnostics: some embedded browsers pause requestAnimationFrame.
  window.__officeV9 = { bots: cuteBots, rebuild: buildRealOffice3d, tick: tick };
})();
