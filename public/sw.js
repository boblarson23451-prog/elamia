/* ELALAMIA service worker.
 *
 * Caching policy is deliberately conservative:
 *   - /api/*        → NEVER cached. Carts, sessions, orders and payment state
 *                     must always be live. Caching these could show one user
 *                     another user's data on a shared device, or resurrect a
 *                     stale cart/payment status.
 *   - /_next/static → cache-first (content-hashed filenames, safe forever)
 *   - images        → cache-first with a capped bucket
 *   - navigations   → network-first, falling back to the offline page
 */

const VERSION = "v4";
const STATIC_CACHE = `elalamia-static-${VERSION}`;
const IMAGE_CACHE = `elalamia-img-${VERSION}`;
const OFFLINE_URL = "/offline";
const MAX_IMAGES = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([OFFLINE_URL, "/icons/icon-192.png", "/manifest.webmanifest"])
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await Promise.all(keys.slice(0, keys.length - maxItems).map((k) => cache.delete(k)));
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never touch API traffic — always straight to the network.
  if (url.pathname.startsWith("/api/")) return;

  // Cross-origin (e.g. product images from picsum, Google Fonts): cache-first, capped.
  if (url.origin !== self.location.origin) {
    if (request.destination === "image" || request.destination === "font" || request.destination === "style") {
      event.respondWith(
        caches.match(request).then((hit) =>
          hit ||
          fetch(request)
            .then((res) => {
              if (res.ok || res.type === "opaque") {
                const copy = res.clone();
                caches.open(IMAGE_CACHE).then((c) => {
                  c.put(request, copy);
                  trimCache(IMAGE_CACHE, MAX_IMAGES);
                });
              }
              return res;
            })
            .catch(() => hit)
        )
      );
    }
    return;
  }

  // Hashed build assets: cache-first, they never change under the same URL.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((hit) =>
        hit ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
          return res;
        })
      )
    );
    return;
  }

  // Same-origin images.
  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then((hit) =>
        hit ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(IMAGE_CACHE).then((c) => {
            c.put(request, copy);
            trimCache(IMAGE_CACHE, MAX_IMAGES);
          });
          return res;
        }).catch(() => hit)
      )
    );
    return;
  }

  // Page navigations: ALWAYS from the network, never served from cache.
  //
  // An earlier version cached pages here ("network-first"). In practice that
  // still let stale HTML reach shoppers — edited prices, renamed products and
  // newly added items appeared to not update. For a storefront, showing a
  // stale price is worse than showing nothing, so pages are now network-only
  // with the offline screen as the sole fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
