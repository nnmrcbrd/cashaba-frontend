const CACHE_NAME = "casha-ba-offline-v1";
const OFFLINE_ASSETS = ["/offline.html", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match("/offline.html")) || Response.error();
  }));
});
