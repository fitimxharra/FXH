# FXH Cam v102 Stable — Changelog (15 November 2026)

**Base archive:** `FXH-CAM-v102-KOMPLET-HOME-SHOT-RECORD-VHS-LANDSCAPE-FIX-15-11-2026.zip`  
**Base SHA-256:** `da38679ea2dc049d95bdd018b7ffffd2810f0c101c8ae0a227d91dcda635697f`

This is a stability release; the original v102 Home, branding, camera artwork, navigation, Gallery, Lab, film effects and feedback remain in place.

## Repairs

1. **Polaroid is portrait-only.** A landscape device view shows a clear request to turn the phone upright. It does not force or rotate the page, or modify Polaroid image ratio or framing. 35mm and VHS still respond to the actual device orientation.
2. **VHS lifecycle.** Video now opens the review screen after STOP; it is not inserted in Gallery automatically. SAVE inserts it; RETAKE revokes only its own unsaved URL. Finalization is guarded against duplicate callbacks. Existing saved Gallery video URLs are not revoked on camera unmount.
3. **VHS audio/permissions.** When microphone access is refused or unavailable, the user gets a RECORD WITHOUT AUDIO option. The camera video stream remains available. When audio permission is granted, video and microphone tracks are merged; actual WebM/MP4 capability is detected by `MediaRecorder`.
4. **Camera concurrency.** Async camera acquisition uses a generation identifier to stop stale camera streams after switching or leaving the camera.
5. **IndexedDB diagnosis.** Storage errors are classified instead of labeling every failure as “storage is full”. A DOWNLOAD LATEST fallback appears when captured media cannot be persisted. Storage warnings cannot cover the shutter. A failed initial Gallery read prevents a subsequent accidental overwrite of existing records.
6. **Legacy migration.** Old localStorage Gallery records are kept until migration to IndexedDB actually succeeds.
7. **Gallery transactions.** Signature caching happens only after a successful transaction. Photo/film/filter metadata and image content signatures are checked for modifications, so edits are not incorrectly skipped.
8. **PWA updates.** The Service Worker no longer reloads each open client during activation. A waiting update is offered only while the user is not in the camera or video review. No general browser data or Gallery databases are cleared.
9. **Offline asset coverage.** All bundled camera artwork, local fonts, icons, film images and static app assets are included in the precache list. Remote Google-hosted optional fonts may still fall back while offline.
10. **Mobile UI.** The existing v102 layout and footer are preserved. A narrow-scoped stylesheet protects the capture button from Gallery notices and keeps fallback controls clickable.

## Changes to existing files
- `assets/app.js` — Gallery persistence, VHS review/audio, camera stream lifecycle.
- `sw.js` — lifecycle, offline precache, optional activation.
- `index.html` — versioned references to revised application and new styles/scripts.

## Added files
- `assets/fxh-v102-stable.css` — narrow-scoped stability CSS.
- `assets/fxh-pwa-update.js` — optional, idle-only update prompt.
- `CHANGELOG-STABLE.md`, `QA-REPORT-STABLE.md`, `DEPLOY-STABLE.md` — documentation.

## Deliberate non-changes
- No reset of Gallery, localStorage or IndexedDB.
- No visual redesign, new camera ordering, different colors, logo, or artificial orientation transform.
- Existing Film and Filters controls in Lab remain unchanged.
- No subscription, payment or beta expiration logic was changed.
