const CACHE = 'cangye-awu-cache-v43';
const ASSETS = [
    './',
  './index.html',
  './style.css',
  './app.js',
  './clipper.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './cat_head.png',
  './float_cat_1.png',
  './float_cat_2.png',
  './float_cat_3.png',
  './float_cat_4.png',
  './float_cat_5.png',
  './float_cat_6.png',
  './cat_head_nobg.png',
  './cats_nobg.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const dest = req.destination;

  // html/js/css: network-first
  if (dest === 'document' || dest === 'script' || dest === 'style') {
    event.respondWith(
      fetch(req).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
        return resp;
      }).catch(async () => {
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      })
    );
    return;
  }

  // others: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
        return resp;
      });
    })
  );
});
