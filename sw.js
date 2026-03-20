const CACHE_NAME = "devtracker-v2";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  caches.keys().then((keys) => {
    return Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      })
    );
  });
});

self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request));
});