const CACHE_NAME = "qsc-pwa-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon.svg",
  "/apple-touch-icon.png",
  "/explore",
  "/bookings"
];

// Install event: cache shell assets safely
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use individual caching to prevent one 404 from failing the entire install
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn("PWA pre-cache item warning:", asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate event: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: network first, fallback to cache for offline resilience
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) {
    return;
  }

  // Skip API mutations or dynamic auth checks from offline cache
  if (event.request.url.includes("/api/auth/") || event.request.url.includes("/api/appointments")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful GET responses for static assets and images
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.includes("/_next/static/") ||
           event.request.url.includes("/icons/") ||
           event.request.url.endsWith(".png") ||
           event.request.url.endsWith(".svg") ||
           event.request.url.endsWith(".css") ||
           event.request.url.endsWith(".woff2"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline – Quetta Salon Connect", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" }
          });
        });
      })
  );
});
