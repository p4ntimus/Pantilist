/* ============================================================
   SERVICE WORKER – Version 3
============================================================ */

const CACHE_VERSION = "v5";
const CACHE_NAME = `shoppinglist-${CACHE_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",

  "./assets/css/base.css",
  "./assets/css/theme-default.css",
  "./assets/css/theme-forest.css",
  "./assets/css/theme-diablo.css",
  "./assets/css/theme-blackfantasy.css",
  "./assets/css/theme-unicorn.css",
  "./assets/css/theme-coreblue.css",

  "./assets/js/app.js"
];

/* ============================================================
   INSTALL – Cache Assets
============================================================ */

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ============================================================
   ACTIVATE – Remove Old Caches
============================================================ */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith("shoppinglist-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ============================================================
   FETCH – Cache First, Network Fallback
============================================================ */

self.addEventListener("fetch", event => {
  const request = event.request;

  // Nur GET-Anfragen cachen
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline-Fallback für Navigation
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
