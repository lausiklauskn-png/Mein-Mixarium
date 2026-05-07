// WICHTIG: Bei jeder App-Änderung (CSS, JS, HTML) SW_VERSION erhöhen — sonst
// behalten installierte PWAs ihre alte Version im Cache. Beim Hochzählen wird
// in 'activate' der alte Cache automatisch gelöscht.
//
// Ab v5: Navigation und Pre-Cache umgehen den Browser-HTTP-Cache aktiv
// (cache:'reload'), damit App-Änderungen ohne manuelles Cache-Löschen ankommen.
const SW_VERSION = 'mixarium-sw-v18';
const PRECACHE = `precache-${SW_VERSION}`;
const RUNTIME = `runtime-${SW_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './mixarium_icon.svg',
  './mixarium_icon.png'
];

const STATIC_PATH_RE = /\.(?:css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|json|woff2?)$/i;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    // Pre-Cache MUSS frisches Material holen, sonst landet veralteter HTML-Stand
    // in der neuen SW-Version. cache:'reload' überspringt jeden HTTP-Cache.
    const reloadRequests = PRECACHE_URLS.map(u => new Request(u, { cache: 'reload' }));
    await cache.addAll(reloadRequests);
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
