/* Network-first (3s timeout), cache kapag offline. Allowlist lang: static files ng add-on. Hindi kasama ang mga pahina/API. */
var C = 'cheebee-v8';
var OK = ['/phaseB.js', '/phaseC.js', '/phaseD.js', '/three.min.js', '/icon.svg', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/manifest.webmanifest'];
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== C; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || OK.indexOf(u.pathname) < 0) return;
  e.respondWith(Promise.race([fetch(r), new Promise(function (_, rej) { setTimeout(rej, 3000); })]).then(function (res) {
    var cc = res.headers.get('cache-control') || '';
    if (res.ok && !/no-store/i.test(cc) && !res.headers.get('set-cookie')) { var cp = res.clone(); caches.open(C).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || fetch(r); }); }));
});
