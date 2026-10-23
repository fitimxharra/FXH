// bump this on every deploy so old caches get cleared
const CACHE_NAME = "fxhcam-public-beta-v99";

// Precache only the app shell. Mode photos load on demand and are
// cached with stale-while-revalidate. Do not precache camera streams
// or user-created Gallery media (those live in IndexedDB).
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/app.js?v=99",
  "/assets/beta-control.js?v=99",
  "/assets/index.css?v=99",
  "/assets/v95-camera.css?v=99",
  "/assets/v99-camera-preview-match.js?v=99",
  "/assets/v98-welcome.css?v=99",
  "/assets/v98-welcome.js?v=99",
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
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: "window" });
    await Promise.all(windows.map((client) => client.navigate(client.url)));
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.protocol === "blob:" || url.protocol === "data:") return;

  const dest = event.request.destination;
  // never intercept live camera / recorded media streams
  if (dest === "video" || dest === "audioworklet") return;

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
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match("/index.html") || caches.match("/"))
        )
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
