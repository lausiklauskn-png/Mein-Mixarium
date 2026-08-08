self.SBKIM_SW_STANDALONE = false;
importScripts("./sbkim-sw-v27.js");
console.info("SBKIM-SW geladen via importScripts (Variante 3b)");
// WICHTIG: Bei jeder App-Änderung (CSS, JS, HTML) SW_VERSION erhöhen — sonst
// behalten installierte PWAs ihre alte Version im Cache. Beim Hochzählen wird
// in 'activate' der alte Cache automatisch gelöscht.
//
// Ab v5: Navigation und Pre-Cache umgehen den Browser-HTTP-Cache aktiv
// (cache:'reload'), damit App-Änderungen ohne manuelles Cache-Löschen ankommen.
const SW_VERSION = 'mixarium-sw-v85';
const PRECACHE = `precache-${SW_VERSION}`;
const RUNTIME = `runtime-${SW_VERSION}`;

// Ab v81 in ZWEI Gruppen geteilt (Lighthouse-Befund 2026-08-02: im Bericht kam
// JEDE Datei doppelt vor - einmal fuer die Seite, einmal fuer den Pre-Cache,
// zusammen 4156 KiB statt rund 2000). Ursache war cache:'reload' auf ALLEN
// Adressen: das ueberspringt den Browser-Cache mit Absicht und erzwingt damit
// einen zweiten Download derselben Datei.
//
// FRISCH (cache:'reload'): nur das, was sich mit jeder App-Aenderung aendert.
// Hier ist der Zwang richtig - sonst landet veralteter HTML-Stand in der neuen
// SW-Version, und genau dagegen wurde die Regel damals eingefuehrt.
// './' ist bewusst NICHT dabei: das ist dieselbe Datei wie './index.html', nur
// unter zweiter Adresse - sie wuerde das groesste Stueck der App ein weiteres
// Mal ueber die Leitung holen. Der Offline-Fall ist trotzdem gedeckt, weil der
// navigate-Zweig unten der Reihe nach caches.match(req) UND danach
// caches.match('./index.html') versucht. Mit einem Offline-Aufruf von '/'
// nachgeprueft, nicht nur so gedacht.
const PRECACHE_FRISCH = [
  './index.html',
  './manifest.json',
  './icons/mixarium-120.png?v=1',
  './icons/mixarium-144.png?v=1',
  './icons/mixarium-152.png?v=1',
  './icons/mixarium-180.png?v=1',
  './icons/mixarium-192.png?v=1',
  './icons/mixarium-72.png?v=1',
  './icons/mixarium-96.png?v=1',
  './icons/mixarium-leerkarte.jpg?v=1',
  './icons/splash-1125x2436.png?v=1',
  './icons/splash-1170x2532.png?v=1',
  './icons/splash-1179x2556.png?v=1',
  './icons/splash-1242x2208.png?v=1',
  './icons/splash-1242x2688.png?v=1',
  './icons/splash-1284x2778.png?v=1',
  './icons/splash-1290x2796.png?v=1',
  './icons/splash-1536x2048.png?v=1',
  './icons/splash-2048x2732.png?v=1',
  './icons/splash-640x1136.png?v=1',
  './icons/splash-750x1334.png?v=1',
  './icons/splash-828x1792.png?v=1'
];
// UNVERAENDERLICH: Bilder und Videos. Diese Dateien aendern sich praktisch nie;
// wenn doch, wird ohnehin SW_VERSION hochgezaehlt UND GitHub Pages laesst seinen
// Cache nach 10 Minuten verfallen. Ohne 'reload' nimmt der Pre-Cache hier das,
// was der Browser gerade geholt hat - kein zweiter Download.
// Ab v82 OHNE die beiden Intro-Videos (Lighthouse-Messung 2026-08-02): der
// Browser spielt genau EIN Format — die <video>-Quellen stehen als webm zuerst,
// mp4 als Rueckfall. Der Vorrat holte trotzdem BEIDE. Auf einem Geraet, das
// webm kann, wurden die 620 KiB mp4 also fuer ein Format geladen, das dort nie
// laeuft; das webm kam obendrein doppelt (einmal fuer die Seite, einmal fuer
// den Vorrat). Zusammen 910 KiB bei jedem Erstbesuch.
//
// Sie werden trotzdem offline verfuegbar: STATIC_PATH_RE deckt mp4/webm ab,
// der Laufzeit-Cache legt also genau das Format ab, das die Seite wirklich
// geholt hat. Ehrliche Grenze: wer die App installiert und offline geht, BEVOR
// das Intro je gelaufen ist, sieht es beim ersten Mal nicht — danach immer.
// Das Intro ist Zierde, nicht Funktion; die App laeuft ohne es vollstaendig.
const PRECACHE_MEDIEN = [
  './mixarium_icon.svg',
  './mixarium_icon.png'
];

const STATIC_PATH_RE = /\.(?:css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|json|woff2?|mp4|webm)$/i;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    // Pre-Cache MUSS frisches Material holen, sonst landet veralteter HTML-Stand
    // in der neuen SW-Version. cache:'reload' überspringt jeden HTTP-Cache.
    // Das gilt aber nur für die frische Gruppe — bei Bildern/Videos erzwingt es
    // nur einen zweiten Download derselben Datei (siehe Kommentar oben).
    await cache.addAll(PRECACHE_FRISCH.map(u => new Request(u, { cache: 'reload' })));
    await cache.addAll(PRECACHE_MEDIEN.map(u => new Request(u)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k !== PRECACHE && k !== RUNTIME)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
    // Hinweis an alle laufenden PWA-Fenster: neue SW-Version ist aktiv. Wer
    // einen Listener hat, kann sich neu laden — ansonsten passiert nichts.
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: SW_VERSION }));
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isCacheableRequest(req, url) {
  if (req.method !== 'GET') return false;
  if (url.origin !== self.location.origin) return false;
  if (req.mode === 'navigate') return true;
  return STATIC_PATH_RE.test(url.pathname);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (!isCacheableRequest(req, url)) return;

  event.respondWith((async () => {
    // Navigation: network-first mit Browser-HTTP-Cache UMGEHEN. So kommen
    // App-Updates (Inline-CSS, JS) sofort an, ohne max-age-Wartezeit.
    if (req.mode === 'navigate') {
      try {
        const fresh = await fetch(req, { cache: 'reload' });
        const runtime = await caches.open(RUNTIME);
        runtime.put(req, fresh.clone());
        return fresh;
      } catch {
        const cachedNav = await caches.match(req);
        if (cachedNav) return cachedNav;
        const cachedIndex = await caches.match('./index.html');
        if (cachedIndex) return cachedIndex;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    }

    // Static assets: stale-while-revalidate — cache:'no-cache' zwingt einen
    // bedingten GET (If-None-Match), sodass der Server 304 schicken kann
    // wenn nichts neu ist, aber niemals ein veralteter Cache zurückkommt.
    const runtime = await caches.open(RUNTIME);
    const cached = await runtime.match(req);

    const networkPromise = fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res && res.ok) {
          runtime.put(req, res.clone());
        }
        return res;
      })
      .catch(() => null);

    if (cached) {
      networkPromise.catch(() => null);
      return cached;
    }

    const fresh = await networkPromise;
    if (fresh) return fresh;

    const pre = await caches.match(req);
    if (pre) return pre;

    return new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});
