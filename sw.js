// きずなbaton Service Worker (v81)
// 戦略: cache-first + background refresh（SWR 風）
// キャッシュ対象: 同一オリジン + Tabler Icons CDN のみ
// 将来 /api/* を追加する場合は明示的に除外すること（センシティブデータをキャッシュしない）

const CACHE_NAME = 'kizuna-baton-v81';

const LOCAL_PRECACHE = [
  './shukatsu-prototype.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

const CDN_PRECACHE = [
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // ローカルは必須・アトミック（addAll は1つでも失敗すると全体失敗）
    await cache.addAll(LOCAL_PRECACHE);
    // CDN は best-effort（jsdelivr 障害時でも SW インストールは成功させる）
    await Promise.allSettled(CDN_PRECACHE.map(u => cache.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cacheable = (url.origin === location.origin) || (url.host === 'cdn.jsdelivr.net');
  if (!cacheable) return;
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const fetchPromise = fetch(req).then(resp => {
      if (resp && resp.status === 200 && (resp.type === 'basic' || resp.type === 'cors')) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
      }
      return resp;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});
