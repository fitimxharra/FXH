# FXH CAM — Black Background Final

Complete deployable v102 edition.

## Visual identity

Original dark v102 home appearance; no summer redesign CSS or images.

## Common fixes in both editions

- VHS second-recording and replay improvements retained.
- VHS/Home navigation fix retained.
- Lab: larger fonts and 9 frames in a 3×3 grid, including Ivory Soft, Matte Black and Cream Notes.
- Polaroid portrait-only, Canon 35MM/VHS orientation and microphone changes retained.
- Gallery and PWA resilience improvements from the v102 working code retained.

## Deployment

Upload the ZIP contents to the site root (index.html, assets/, images/, sw.js etc.).
Deploy one edition at a time. Do not clear browser data or IndexedDB if you wish to keep Gallery media.
The service-worker cache namespace is unique for this edition.
The full camera/microphone behavior still needs a physical-device smoke test after deployment.
