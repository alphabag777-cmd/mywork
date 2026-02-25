/**
 * AlphaBag Service Worker
 * - Caches static assets for offline support
 * - Uses a "network-first" strategy for API/Firebase calls
 * - Stale-while-revalidate for page navigations
 */

const CACHE_NAME = "alphabag-v3";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/logo.png",
];

// ── Install ────────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests (Firebase, BSC RPC, etc.)
  if (request.method !== "GET") return;
  if (url.origin !== location.origin) return;

  // Navigation requests → network-first, fallback to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match("/") || caches.match(request))
    );
    return;
  }

  // Static assets (JS/CSS/images) → network-first, fallback to cache
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request))
    );
  }
});
