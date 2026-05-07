// WICHTIG: Bei jeder App-Änderung (CSS, JS, HTML) SW_VERSION erhöhen — sonst
// behalten installierte PWAs ihre alte Version im Cache. Beim Hochzählen wird
// in 'activate' der alte Cache automatisch gelöscht.
const SW_VERSION = 'mixarium-sw-v4';
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
    await cache.addAll(PRECACHE_URLS);
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
    // Navigation: network-first for freshest app shell, fallback to cache offline.
    if (req.mode === 'navigate') {
      try {
        const fresh = await fetch(req);
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

    // Static assets: stale-while-revalidate
    const runtime = await caches.open(RUNTIME);
    const cached = await runtime.match(req);

    const networkPromise = fetch(req)
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