// bump this on every deploy so old caches get cleared
const CACHE_NAME = "fxhcam-public-beta-v105";

// Precache only the app shell. Mode photos load on demand and are cached
// as they are fetched. Do not precache camera streams or user-created
// Gallery media (those live in IndexedDB).
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/app.js?v=105",
  "/assets/beta-control.js?v=105",
  "/assets/canvas-filter-fallback.js?v=105",
  "/assets/index.css?v=105",
  "/assets/v95-camera.css?v=105",
  "/assets/v98-welcome.css?v=105",
  "/assets/v103-welcome.js?v=105",
  "/assets/v103-home.css?v=105",
  "/assets/v104-cover.css?v=105",
  "/assets/cover-head.webp?v=105",
  "/assets/cover-z1.webp?v=105",
  "/assets/cover-hero.webp?v=105",
  "/assets/cover-z2.webp?v=105",
  "/assets/cover-cards.webp?v=105",
  "/assets/cover-z3.webp?v=105",
  "/assets/cover-nav.webp?v=105",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/images/LogoFXH.png",
  "/images/LogoFXH-polaroid.png",
  "/sounds/shutter-a1.wav"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn("sw: couldn't precache", url, err))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    // Take control quietly. Open pages are NOT reloaded: a forced reload here
    // would throw away a photo or a VHS recording in progress. The new version
    // is picked up the next time the app is opened.
    await self.clients.claim();
  })());
});

async function fromCache(request) {
  return (
    (await caches.match(request)) ||
    (await caches.match(request, { ignoreSearch: true }))
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.protocol === "blob:" || url.protocol === "data:") return;

  const dest = event.request.destination;
  // never intercept live camera / recorded media streams
  if (dest === "video" || dest === "audioworklet") return;
  // partial (Range) requests can't be answered from a cached full response
  if (event.request.headers.has("range")) return;

  // Beta status must always be checked from the network and never stored in the PWA cache.
  if (url.pathname === "/beta-status.json") {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  const isNavigation = event.request.mode === "navigate";

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(async () =>
          (await caches.match(event.request)) ||
          (await caches.match("/index.html")) ||
          (await caches.match("/")) ||
          Response.error()
        )
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(async () => (await fromCache(event.request)) || Response.error())
  );
});
