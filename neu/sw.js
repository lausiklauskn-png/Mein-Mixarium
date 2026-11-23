/* Mein Mixarium (neu) – Offline-Speicher. Die Hülle liegt im Cache; geholt wird aus dem Cache und im Hintergrund erneuert.
   Beispielpakete (../beispiele/*.json) werden NICHT vorab geladen: Netz nur auf Knopfdruck. */
const FASSUNG = 'mixarium-neu-10.0.0-vor7';
const HUELLE = ['./', './index.html', './app.css?v=10.0.0-vor7', './app.mjs?v=10.0.0-vor7', './manifest.webmanifest',
  './getraenke-symbole.mjs', './platzbild.mjs', './alt.mjs',
  '../kern/speicher/speicher.mjs', '../kern/speicher/tresor.mjs', '../kern/oberflaeche/farben.mjs', '../kern/oberflaeche/schrift.mjs', '../kern/oberflaeche/bild.mjs', '../kern/oberflaeche/symbole.mjs', '../kern/ki/bild.mjs', '../kern/modell/rezept.mjs', '../kern/oberflaeche/diktat.mjs',
  '../getraenke/index.mjs', '../getraenke/einheiten.mjs', '../getraenke/glaeser.mjs', '../getraenke/kategorien.mjs', '../getraenke/alkohol.mjs', '../getraenke/geraete.mjs', '../getraenke/uebernahme.mjs',
  '../icons/mixarium-192.png?v=1'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(FASSUNG).then((c) => c.addAll(HUELLE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('mixarium-neu-') && k !== FASSUNG).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (/\/(beispiele|ausgaben)\//.test(u.pathname)) return;               // immer frisch vom Netz, nie aus dem Cache
  if (!/\/(neu|getraenke|kern|icons)\//.test(u.pathname)) return;             // die bisherige App hat ihren eigenen Service Worker
  e.respondWith(caches.open(FASSUNG).then(async (c) => {
    const da = await c.match(e.request);
    const netz = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => da);
    return da || netz;
  }));
});
