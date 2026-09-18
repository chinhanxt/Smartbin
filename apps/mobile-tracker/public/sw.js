// Self-destructing Service Worker to unregister legacy PWA caches
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          for (const client of clients) {
            client.navigate(client.url);
          }
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Never intercept fetch requests; bypass cache completely
  return;
});
