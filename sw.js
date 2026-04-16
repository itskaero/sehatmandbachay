/* ═══════════════════════════════════════════════════════════════
   sw.js — SehatMand Bachay Service Worker
   Provides offline capability using a cache-first strategy
   for static assets and network-first for API calls.
═══════════════════════════════════════════════════════════════ */

const CACHE_NAME    = "sehatmand-v1.2";
const DYNAMIC_CACHE = "sehatmand-dynamic-v1.2";

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./js/firebase-config.js",
  "./js/nutrition.js",
  "./js/food-database.js",
  "./js/suggestions.js",
  "./js/diet-planner.js",
  "./js/pdf-export.js",
  "./js/app.js"
];

/* ── Install ─────────────────────────────────────────────────── */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn("[SW] Pre-cache failed:", err))
  );
});

/* ── Activate ────────────────────────────────────────────────── */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch ───────────────────────────────────────────────────── */
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Skip non-GET, Firebase API, Chrome extensions
  if (event.request.method !== "GET") return;
  if (url.hostname.includes("firebaseio.com")) return;
  if (url.hostname.includes("googleapis.com")) return;
  if (url.protocol === "chrome-extension:") return;

  // CDN resources (fonts, FA, jsPDF etc.) — cache-first
  if (
    url.hostname.includes("cdnjs.cloudflare.com") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.hostname.includes("jscdn.net") ||
    url.hostname.includes("jsdelivr.net") ||
    url.hostname.includes("gstatic.com")
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(c => c.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Local app files — cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && response.type !== "opaque") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return index.html for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});

/* ── Background Sync Placeholder ─────────────────────────────── */
self.addEventListener("sync", event => {
  if (event.tag === "sync-diets") {
    // Future: sync queued offline saves to Firebase
    console.log("[SW] Background sync: sync-diets");
  }
});
