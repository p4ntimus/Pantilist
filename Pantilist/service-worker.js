/* ============================================================
   SERVICE WORKER – Version 4 (Stable, No-Stale-Bugs)
============================================================ */

const CACHE_VERSION = "v4";
const CACHE_NAME = `pantilist-${CACHE_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./assets/css/layout.css",
  "./assets/css/settings.css",

  // Themes
  "./assets/css/themes/theme-default.css",
  "./assets/css/themes/theme-forest.css",
  "./assets/css/themes/theme-diablo.css",
  "./assets/css/themes/theme-blackfantasy.css",
  "./assets/css/themes/theme-unicorn.css",
  "./assets/css/themes/theme-coreblue.css",

  // JS
  "./assets/js/main.js",
  "./assets/js/ui.js",
  "./assets/js/list.js",
  "./assets/js/settings.js",
  "./assets/js/storage.js",
  "./assets/js/state.js",
  "./assets/js/categories.js",

  // Icons
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png"
];

/* ============================================================
   INSTALL – Cache neu aufbauen
============================================================ */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // sofort aktiv
});

/* ============================================================
   ACTIVATE – Alte Caches löschen
============================================================ */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim(); // sofort übernehmen
});

/* ============================================================
   FETCH – Immer zuerst Netzwerk, dann Cache
   → verhindert alte Versionen
============================================================ */
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Antwort klonen und in Cache legen
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request)) // Offline fallback
  );
});
