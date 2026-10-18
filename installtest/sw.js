// Installations-Test: kleinster sinnvoller Service Worker.
// Netz zuerst, bei fehlendem Netz aus dem Vorrat. Nichts sonst.
const V = 'insttest-v4';
const DATEIEN = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './aufzeichnung.js?v=2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n.startsWith('insttest-') && n !== V).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.includes('/installtest/')) return;
  e.respondWith(fetch(e.request).catch(() =>
    caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
