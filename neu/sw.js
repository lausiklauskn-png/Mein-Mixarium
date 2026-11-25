/* Mein Mixarium (neu) – Offline-Speicher. Die Hülle liegt im Cache; geholt wird aus dem Cache und im Hintergrund erneuert.
   Beispielpakete (../beispiele/*.json) werden NICHT vorab geladen: Netz nur auf Knopfdruck. */
const FASSUNG = 'mixarium-neu-10.0.0-vor32';
const HUELLE = ['./', './index.html', './app.css?v=10.0.0-vor32', './app.mjs?v=10.0.0-vor32', './manifest.webmanifest',
  './getraenke-symbole.mjs', './platzbild.mjs', './alt.mjs', './zusatz.mjs', './handbuch.mjs',
  './sprachen/es.mjs', './sprachen/fr.mjs', './sprachen/it.mjs', './sprachen/pt.mjs', './sprachen/ru.mjs', './sprachen/zh.mjs',
  '../kern/sprachen/es.mjs', '../kern/sprachen/fr.mjs', '../kern/sprachen/it.mjs', '../kern/sprachen/pt.mjs', '../kern/sprachen/ru.mjs', '../kern/sprachen/zh.mjs',
  '../kern/speicher/speicher.mjs', '../kern/speicher/tresor.mjs', '../kern/speicher/alt-tresor.mjs', '../kern/oberflaeche/farben.mjs', '../kern/oberflaeche/schrift.mjs', '../kern/oberflaeche/bild.mjs', '../kern/oberflaeche/symbole.mjs', '../kern/ki/bild.mjs', '../kern/modell/rezept.mjs', '../kern/modell/kategorien.mjs', '../kern/modell/kategorien-fest.mjs', '../kern/modell/einkauf.mjs', '../kern/modell/warengruppen.mjs', '../kern/modell/mengen.mjs', '../kern/modell/ordner.mjs', '../kern/import/text.mjs', '../kern/modell/plan.mjs', '../kern/suche/bedeutung.mjs', '../kern/suche/richter.mjs', '../kern/oberflaeche/diktat.mjs', '../kern/oberflaeche/hinweis.mjs', '../kern/oberflaeche/warten.mjs', '../kern/oberflaeche/app-pflege.mjs', '../kern/oberflaeche/sprache.mjs', '../kern/ki/schluessel.mjs', '../kern/ki/claude.mjs', '../kern/ki/ocr.mjs', '../kern/ki/reinigung.mjs', '../kern/import/scan.mjs', '../kern/import/web.mjs', '../kern/pruefung/datei.mjs', '../kern/ki/helfer.mjs', '../kern/ausgabe/druck.mjs', '../kern/ausgabe/buch.mjs', '../kern/teilen/qr.mjs',
  '../assets/reinigung.js', '../assets/pruefer-formate.js', '../assets/pruefer-mail.js', '../assets/pruefer-anhang.js',
  '../getraenke/index.mjs', '../getraenke/einheiten.mjs', '../getraenke/glaeser.mjs', '../getraenke/kategorien.mjs', '../getraenke/alkohol.mjs', '../getraenke/geraete.mjs', '../getraenke/uebernahme.mjs', '../getraenke/warengruppen.mjs', '../getraenke/labor.mjs', '../getraenke/entdecken.mjs',
  '../icons/mixarium-neu-192.png?v=1', '../icons/mixarium-neu-180.png?v=1', '../icons/mixarium-leerkarte.jpg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(FASSUNG).then((c) => c.addAll(HUELLE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('mixarium-neu-') && k !== FASSUNG).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (/\/(beispiele|ausgaben)\//.test(u.pathname)) return;               // immer frisch vom Netz, nie aus dem Cache
  if (!/\/(neu|getraenke|kern|icons|assets)\//.test(u.pathname) || /\/Workflow-PDF\//.test(u.pathname)) return;             // die bisherige App hat ihren eigenen Service Worker
  e.respondWith(caches.open(FASSUNG).then(async (c) => {
    const da = await c.match(e.request);
    const netz = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => da);
    return da || netz;
  }));
});
