/* office-v9.js — Cyborg Cheebee Office.
   Modern single-floor office layout based on published planning guides:
   WELCOME (reception/lounge) at the door, a "Main Street" circulation spine,
   FOCUS (bench clusters + quiet booths) in the daylit centre,
   MEET (glass conference + huddle rooms) beside reception, and
   GATHER (pantry/cafe + server/IT) on the service side.
   Palette: wood + teal + navy + warm neutrals. Loaded BEFORE the main app. */
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
      color: '#b9d9ee', transparent: true, opacity: op || 0.26, roughness: 0.12,
      metalness: 0.1, side: THREE.DoubleSide, depthWrite: false
    }));
    m.position.set(x, y, z); return addO(m);
  }
  function panel(w, h, x, y, z, rot, col) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), m3(col || '#9aa7b8'));
    m.position.set(x, y, z); m.rotation.y = rot || 0; return addO(m);
  }
  function lamp(x, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.5),
      m3('#fff3d6', { emissive: '#ffe2a0', emissiveIntensity: 0.42 }));
    m.position.set(x, 3.15, z); return addO(m);
  }
  function plant(x, z, s) {
    var k = s || 1;
    cy(0.24 * k, 0.4 * k, '#9a6642', x, 0.2 * k, z);
    var l = new THREE.Mesh(new THREE.ConeGeometry(0.46 * k, 1.2 * k, 7), m3('#2f8c56'));
    l.position.set(x, 0.92 * k, z); addO(l);
  }
  function sofa(x, z, col, rot) {
    var g2 = new THREE.Group();
    var seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.42, 0.9), m3(col));
    seat.position.y = 0.32; g2.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.62, 0.2), m3(col));
    back.position.set(0, 0.72, -0.36); g2.add(back);
    [-0.95, 0.95].forEach(function (px) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.9), m3('#7d8796'));
      arm.position.set(px, 0.5, 0); g2.add(arm);
    });
    g2.position.set(x, 0, z); g2.rotation.y = rot || 0; addO(g2);
  }
  function officeChair(x, z, rot) {
    var g2 = new THREE.Group();
    var post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 8), m3('#3a4256'));
    post.position.y = 0.21; g2.add(post);
    var seat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), m3('#42536b'));
    seat.position.y = 0.46; g2.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.62, 0.12), m3('#42536b'));
    back.position.set(0, 0.82, 0.27); g2.add(back);
    g2.position.set(x, 0, z); g2.rotation.y = rot || 0; addO(g2);
  }
  function desk(x, z, rot) {
    var g2 = new THREE.Group();
    var top = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, 0.82), m3('#b98a54'));
    top.position.y = 0.76; g2.add(top);
    [-0.78, 0.78].forEach(function (px) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.72), m3('#8d96a6'));
      leg.position.set(px, 0.38, 0); g2.add(leg);
    });
    var mon = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.5, 0.06), m3('#2a3448'));
    mon.position.set(0, 1.16, -0.2); g2.add(mon);
    var scr = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.4, 0.02), m3('#5fb8e8', { emissive: '#2d7ba8', emissiveIntensity: 0.5 }));
    scr.position.set(0, 1.16, -0.16); g2.add(scr);
    var kb = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.2), m3('#e2e6ec'));
    kb.position.set(0, 0.83, 0.22); g2.add(kb);
    g2.position.set(x, 0, z); g2.rotation.y = rot || 0; addO(g2);
  }
  /* Six-seat benching cluster: two rows facing each other across a felt
     divider, 900mm chair zones — the module used in the reference plan. */
  function bench(cx, cz) {
    [-1.35, 1.35].forEach(function (dz, i) {
      [-2.4, 0, 2.4].forEach(function (dx) {
        desk(cx + dx, cz + dz, i ? Math.PI : 0);
        officeChair(cx + dx, cz + (i ? dz - 1.25 : dz + 1.25), i ? 0 : Math.PI);
      });
    });
    panel(7.7, 0.42, cx, 0.92, cz, 0, '#4f7d78'); // felt divider / cable spine
    bx(8, 0.05, 3.9, '#c4b49a', cx, 0.01, cz);    // carpet tile under cluster
  }
  function meetingTable(x, z, w) {
    bx(w, 0.12, 1.7, '#8b5e34', x, 0.78, z);
    bx(w - 0.2, 0.04, 1.5, '#a97c4c', x, 0.86, z);
    var n = Math.max(2, Math.round(w / 1.3));
    for (var i = 0; i < n; i++) {
      var px = x - w / 2 + 0.65 + i * ((w - 1.3) / (n - 1 || 1));
      officeChair(px, z - 1.4, 0); officeChair(px, z + 1.4, Math.PI);
    }
  }
  function serverRack(x, z) {
    bx(0.85, 2.2, 0.72, '#394356', x, 1.1, z);
    for (var i = 0; i < 5; i++) bx(0.55, 0.06, 0.03, i % 2 ? '#5fd0a0' : '#69b6e8', x, 0.5 + i * 0.32, z + 0.38, true);
  }

  /* The old dark zone scene left a 1.6-intensity hemisphere light and a
     purple 26-intensity point light glued to scene3d (not to level3d), so
     level3d.clear() could not remove them. They blew every desk and floor out
     to pure white. Keep only soft office lighting whenever v9 is active. */
  function tameOfficeLights() {
    if (typeof scene3d === 'undefined' || !scene3d) return;
    scene3d.traverse(function (o) {
      if (!o.isLight) return;
      var mine = o.userData && o.userData.v9Light;
      if (o.isAmbientLight) o.intensity = 0.58;
      else if (o.isHemisphereLight) o.intensity = 0.25;
      else if (o.isDirectionalLight) o.intensity = mine ? 0.82 : 0.3;
      else if (o.isPointLight) {
        if (!mine) { o.intensity = 0.12; o.visible = false; }
        else o.intensity = 0.3;
      }
    });
  }

  function buildRealOffice3d() {
    if (typeof THREE === 'undefined' || !g || !g.level) return false;
    cuteBots.forEach(function (b) { if (b.bubble && b.bubble.parentNode) b.bubble.parentNode.removeChild(b.bubble); });
    cuteBots.length = 0;
    if (animId) { try { cancelAnimationFrame(animId); } catch (e) {} animId = null; }
    try {
      level3d.clear();
      structureGroup = new THREE.Group();
      level3d.add(structureGroup);
    } catch (e) {}

    // Calmer light + muted backdrop: the old 1.35 ambient / 1.35 exposure
    // washed this bright office out to near-white. A large dark ground plane
    // also stops the pale default background from showing under the slab.
    scene3d.background = new THREE.Color('#93a1b3');
    scene3d.fog = new THREE.Fog('#93a1b3', 70, 165);
    // Mark the day/night switch as already resolved so its first-frame reset
    // cannot repaint our muted palette with the old pale #e3e7ee background.
    scene3d.isNight = 0;
    try { renderer3d.toneMappingExposure = 0.85; } catch (e) {}
    if (g.amb) { g.amb.intensity = 0.58; g.amb.color.set('#8fa4c4'); }
    if (g.sun) g.sun.intensity = 0.82;
    [[12, 3.1, 9], [34, 3.1, 9], [23, 3.1, 28]].forEach(function (p) {
      var l = new THREE.PointLight(0xffe9c0, 0.3, 38);
      l.position.set(p[0], p[1], p[2]); l.userData.v9Light = true; addO(l);
    });
    tameOfficeLights();

    // ---- ground + slab + zone floors (public -> private, service side apart) ----
    floor(220, 220, '#4a5668', 23, -0.22, 17);      // dark surround, no white gaps
    floor(46.6, 34.6, '#7d8797', 23, -0.03, 17);
    floor(27, 19, '#8ba5a2', 15, 0.005, 11);      // FOCUS work zone
    floor(16, 15, '#8fa6c2', 37, 0.005, 10);      // MEET rooms
    floor(19, 10, '#b09b76', 23, 0.005, 29);      // WELCOME / reception
    floor(16, 9, '#b3a07c', 37, 0.005, 28.5);     // GATHER / pantry
    floor(11, 7, '#909cab', 5.5, 0.005, 28);      // service / server

    // ---- envelope: warm grey walls + long north windows ----
    bx(46.6, 3.05, 0.18, '#c4beb2', 23, 1.52, 0);
    bx(0.18, 3.05, 34.6, '#c4beb2', 0, 1.52, 17);
    bx(0.18, 3.05, 34.6, '#c4beb2', 46, 1.52, 17);
    bx(17.6, 3.05, 0.18, '#c4beb2', 8.8, 1.52, 34);
    bx(17.6, 3.05, 0.18, '#c4beb2', 37.2, 1.52, 34);
    for (var wx = 3; wx <= 43; wx += 5) {
      glass(wx, 1.9, 0.12, wx, 1.95, 0.1, 0.4);
      bx(3.6, 0.06, 0.16, '#d8dee6', wx, 1.0, 0.1);
      bx(3.6, 0.06, 0.16, '#d8dee6', wx, 2.9, 0.1);
    }
    // ---- ceiling light grid ----
    for (var lx = 6; lx <= 42; lx += 6) for (var lz = 5; lz <= 31; lz += 6) lamp(lx, lz);

    // ===== WELCOME: reception, logo wall, lounge =====
    bx(5.6, 1.02, 1.2, '#3f4b60', 23, 0.51, 30.2);
    bx(5.8, 0.1, 1.36, '#a9793f', 23, 1.06, 30.2);
    bx(0.9, 0.5, 0.06, '#2a3448', 23, 1.42, 29.84);
    bx(0.78, 0.4, 0.02, '#6cc2f0', 23, 1.42, 29.8, true);
    mkWallSign('CYBORG CHEEBEE OFFICE', 23, 2.5, 33.78, '#3f9d9a', Math.PI, 5.6, 0.78);
    sofa(13.5, 30.4, '#3f7d78', Math.PI / 2);
    sofa(32.5, 30.4, '#4a6a9a', -Math.PI / 2);
    bx(1.7, 0.06, 0.8, '#8b5e34', 23, 0.38, 31.7);
    cy(0.22, 0.28, '#d9c39a', 23, 0.55, 31.7);
    plant(7.5, 31.4, 1.1); plant(38.5, 31.4, 1.1);

    // ===== MAIN STREET: 1.2m circulation spine across the floor =====
    floor(42, 2.6, '#d7cbb2', 23, 0.008, 23.2);
    for (var s = 4; s <= 42; s += 4) bx(1.8, 0.02, 0.08, '#b79f76', s, 0.02, 23.2);
    mkWallSign('MAIN STREET →', 41, 2.25, 23.2, '#8b6b3d', -Math.PI / 2, 2.6, 0.5);

    // ===== FOCUS: four six-seat bench clusters + quiet booths =====
    bench(8, 7.5); bench(20, 7.5); bench(8, 16); bench(20, 16);
    mkWallSign('FOCUS · WORKSTATIONS', 14, 2.55, 0.32, '#3f7d78', 0, 4.2, 0.6);
    glass(0.09, 2.4, 5.6, 27, 1.2, 10, 0.22);
    for (var q = 0; q < 2; q++) {
      bx(1.7, 2.15, 1.9, '#6b7b8e', 24.4 + q * 2.1, 1.08, 17.8);
      glass(1.4, 1.55, 0.07, 24.4 + q * 2.1, 1.25, 16.82, 0.35);
      bx(1.2, 0.06, 0.5, '#b98a54', 24.4 + q * 2.1, 0.78, 17.8);
    }
    mkWallSign('QUIET BOOTHS', 25.5, 2.35, 19.2, '#5f7fa8', 0, 2.8, 0.5);

    // ===== MEET: glass conference room + smaller huddle =====
    glass(0.09, 2.5, 14, 29, 1.25, 9.5, 0.24);
    glass(16, 2.5, 0.09, 37, 1.25, 16.5, 0.24);
    glass(0.09, 2.5, 7, 45, 1.25, 12.5, 0.24);
    meetingTable(37, 7.5, 5.2);
    panel(3.2, 1.5, 37, 1.7, 0.4, 0, '#2f3d52');
    bx(3.3, 0.06, 0.1, '#8fa0b4', 37, 0.9, 0.4);
    mkWallSign('THE STUDIO · BOARDROOM', 37, 2.5, 16.35, '#3f6fa8', 0, 4.4, 0.6);
    meetingTable(37, 12.8, 2.6);
    mkWallSign('HUDDLE', 43.2, 2.2, 12.8, '#5f7fa8', -Math.PI / 2, 1.9, 0.46);
    plant(31, 14.6, 0.85);

    // ===== GATHER: pantry / cafe with island + stools =====
    bx(7.2, 0.95, 0.85, '#8b5e34', 37, 0.48, 32.4);
    bx(7.4, 0.1, 0.95, '#d8c6a4', 37, 1.0, 32.4);
    bx(0.9, 1.4, 0.7, '#3f4b60', 39.8, 1.72, 32.4);
    bx(0.62, 0.62, 0.04, '#6cc2f0', 39.8, 1.9, 32.78, true);
    bx(1.1, 1.7, 0.7, '#c3ccd6', 34.5, 0.85, 32.4); // fridge
    bx(4.2, 0.12, 1.4, '#a9793f', 37, 0.86, 29.2); // island
    [35.6, 37, 38.4].forEach(function (px) {
      cy(0.28, 0.13, '#d9c9a8', px, 0.72, 28.1);
      cy(0.05, 0.6, '#5a4632', px, 0.34, 28.1);
    });
    bx(0.6, 1.3, 0.6, '#e2e8ef', 31, 0.65, 27);
    cy(0.22, 0.36, '#7fcbe8', 31, 1.48, 27, true);
    mkWallSign('THE COMMONS · PANTRY', 37, 2.45, 33.72, '#b07b3d', Math.PI, 4.2, 0.6);

    // ===== SUPPORT: executive cabin + server / IT =====
    glass(0.09, 2.45, 6.4, 11, 1.22, 27.5, 0.22);
    bx(2.6, 0.12, 1.3, '#7d5634', 5.5, 0.76, 28.4);
    bx(0.85, 0.52, 0.06, '#2a3448', 5.5, 1.2, 28.05);
    bx(0.74, 0.42, 0.02, '#6cc2f0', 5.5, 1.2, 28.01, true);
    officeChair(5.5, 29.6, Math.PI);
    bx(0.9, 2.2, 0.42, '#8b5e34', 1.6, 1.1, 30.8);
    for (var bk = 0; bk < 4; bk++) bx(0.82, 0.05, 0.36, ['#b05555', '#4a7fb0', '#3f8c66', '#c9a227'][bk], 1.6, 0.5 + bk * 0.42, 30.8);
    mkWallSign('EXECUTIVE', 5.5, 2.35, 24.3, '#b08a3d', 0, 2.6, 0.5);
    [2.8, 5, 7.2].forEach(function (px) { serverRack(px, 25.5); });
    mkWallSign('SERVER / IT', 5, 2.25, 23.2, '#5f7fa8', 0, 2.6, 0.5);
    plant(10.5, 32, 0.9); plant(23, 20.8, 0.85);

    // ===== 6 small, cute, happy bots placed in their zones =====
    var host = document.getElementById('oc3d') || document.body;
    BOTS.forEach(function (b, idx) {
      var c;
      try { c = makeChar3d(b, b.x, b.z); } catch (e) { return; }
      c.group.scale.setScalar(0.66);
      c.emo.position.set(0, 1.62, 0);
      var tag = c.group.children.filter(function (o) { return o.isSprite && o !== c.emo; })[0];
      if (tag) tag.position.set(0, 2.02, 0);
      var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 8), m3(b.c));
      arm.position.set(0.3, 0.72, 0.08); arm.rotation.z = -0.85;
      c.group.add(arm);
      var el = document.createElement('div');
      el.className = 'bub3d v9bub'; el.style.display = 'none';
      host.appendChild(el);
      cuteBots.push({
        id: b.id, n: b.n, group: c.group, emo: c.emo, arm: arm, bubble: el,
        baseY: 0, phase: idx * 1.1, face: b.face, tx: b.x, tz: b.z
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
    // The main app's day/night switch resets scene background, fog and ambient
    // once per load. Re-assert the muted office palette so it never reverts to
    // the pale #e3e7ee background that caused the "puro puti" white-out.
    try {
      if (scene3d) {
        if (scene3d.background && scene3d.background.getHexString() !== '93a1b3') scene3d.background.set('#93a1b3');
        if (scene3d.fog && scene3d.fog.color && scene3d.fog.color.getHexString() !== '93a1b3') scene3d.fog.color.set('#93a1b3');
      }
      if (g && g.amb && Math.abs(g.amb.intensity - 0.58) > 0.01) { g.amb.intensity = 0.58; g.amb.color.set('#8fa4c4'); }
      tameOfficeLights();
      if (renderer3d && Math.abs(renderer3d.toneMappingExposure - 0.85) > 0.01) renderer3d.toneMappingExposure = 0.85;
    } catch (e) {}
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
  window.__officeV9 = { bots: cuteBots, rebuild: buildRealOffice3d, tick: tick };
})();
