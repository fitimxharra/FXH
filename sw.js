// bump this on every deploy so old caches get cleared
const CACHE_NAME = "fxhcam-20261116-black-background-desktopfix-v2";

// Precache only the app shell. Mode photos load on demand and are
// cached with stale-while-revalidate. Do not precache camera streams
// or user-created Gallery media (those live in IndexedDB).
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/Anton-Regular.woff2",
  "/assets/BarlowCondensed-Bold.woff2",
  "/assets/BarlowCondensed-ExtraBold.woff2",
  "/assets/BarlowCondensed-SemiBold.woff2",
  "/assets/Caveat-Bold.woff2",
  "/assets/GreatVibes-Regular.woff2",
  "/assets/Orbitron-SemiBold.woff2",
  "/assets/Oswald-Bold.woff2",
  "/assets/Oswald-Variable.woff2",
  "/assets/ae1-controls/ae1-controls-dial.png",
  "/assets/ae1-controls/ae1-film-stock.png",
  "/assets/ae1-controls/ae1-filter.png",
  "/assets/ae1-controls/ae1-finder.png",
  "/assets/ae1-controls/ae1-flash.png",
  "/assets/ae1-controls/ae1-shutter.png",
  "/assets/ae1-controls-dial.png",
  "/assets/ae1-film-stock.png",
  "/assets/ae1-filter.png",
  "/assets/ae1-finder.png",
  "/assets/ae1-flash.png",
  "/assets/ae1-rotate-icon.png",
  "/assets/ae1-selfie-icon.png",
  "/assets/ae1-shutter.png",
  "/assets/analog-35mm-desk.webp",
  "/assets/analog-35mm-landing.webp",
  "/assets/app.js",
  "/assets/beta-control.js",
  "/assets/canon-ae1-card.webp",
  "/assets/fxh-cam-logo.webp",
  "/assets/gallery-home-bg.webp",
  "/assets/index.css",
  "/assets/lab-home-bg.webp",
  "/assets/polaroid-cyan-bg.webp",
  "/assets/polaroid-cyan-scene.webp",
  "/assets/polaroid-flash.webp",
  "/assets/polaroid-home-flash.webp",
  "/assets/polaroid-landing-bg.webp",
  "/assets/polaroid-shutter.webp",
  "/assets/v102-footer-lab-fix.css",
  "/assets/v102-home-vhs-visibility.css",
  "/assets/v102-orientation-stable.css",
  "/assets/v95-camera.css",
  "/assets/v98-welcome.css",
  "/assets/v98-welcome.js",
  "/assets/vhs-camera-background.png",
  "/assets/vhs-home-coral.webp",
  "/assets/vhs-home-street.webp",
  "/assets/vhs-landing-bg.webp",
  "/assets/vhs-tape-bg.webp",
  "/assets/vhs-tape-classic.png",
  "/assets/vhs-tapes-bg.webp",
  "/images/LogoFXH-polaroid.png",
  "/images/LogoFXH.png",
  "/images/canon-ae1-final.png",
  "/images/canon-ae1-interface.png",
  "/images/canon.png",
  "/images/card-controls.png",
  "/images/card-filters.png",
  "/images/card-finder.png",
  "/images/card-flash.png",
  "/images/card-frame.png",
  "/images/film/agfa.png",
  "/images/film/cinestill.png",
  "/images/film/ektachrome.png",
  "/images/film/fuji.png",
  "/images/film/gold.png",
  "/images/film/normal.png",
  "/images/film/portra800.png",
  "/images/film/purple.png",
  "/images/film/redscale.png",
  "/images/film/trix.png",
  "/images/film/turquoise.png",
  "/images/film/velvia.png",
  "/images/film-card-bg.png",
  "/images/fxh-cam-logo.png",
  "/images/leica.png",
  "/images/olympus.png",
  "/images/polaroid.png",
  "/images/super8.png",
  "/images/vhs-landing-bg.webp",
  "/images/vhs.png",
  "/sounds/shutter-a1.wav",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/marker.svg",
  "/assets/v98-welcome.css?v=102",
  "/assets/v98-welcome.js?v=102",
  "/assets/beta-control.js?v=102",
  "/assets/index.css?v=102-restored-audio-landscape",
  "/assets/v95-camera.css?v=102-restored-audio-landscape",
  "/assets/v102-footer-lab-fix.css?v=102-footer-lab-20261115",
  "/assets/v102-orientation-stable.css?v=20261115-orientation2",
  "/assets/v102-home-vhs-visibility.css?v=20261115-homevhs1",
  "/assets/app.js?v=20261116-black-background-desktopfix-v2",
  "/assets/fxh-v102-stable.css?v=20261116-black-background-desktopfix-v2",
  "/assets/fxh-pwa-update.js?v=20261115-black-background-final-v1",
  "/assets/fxh-v102-stable.css",
  "/assets/fxh-pwa-update.js"
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
  // Wait until all existing tabs close unless the user accepts the optional update.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("fxhcam-") && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
    // Never reload a live camera, unsaved photo, or active VHS recording.
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

// Optional activation only after an explicit user click while the camera is idle.
self.addEventListener("message", event => {
  if(event.data && event.data.type === "FXH_ACTIVATE_UPDATE") self.skipWaiting();
});
