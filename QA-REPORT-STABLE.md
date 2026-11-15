# FXH CAM v102 Stable — 10 simulated users QA report

**Date:** 15 November 2026. **Source:** the exact user-supplied latest ZIP (`da38679ea2dc049d95bdd018b7ffffd2810f0c101c8ae0a227d91dcda635697f`).

## Test approach and evidence limitations

These were **10 simulated user journeys**, not ten real testers. Browser tests used a headless Chromium instance with the app's actual minified JS and stylesheets, inlined static assets and synthetic camera/microphone streams. Direct navigation to local HTTP and `file://` origins was blocked by the sandbox. Consequently, IndexedDB persistence and the installed PWA Service Worker could not be fully exercised in a normal origin, and physical Android/Safari hardware support was **not** verified. The browser used mock camera media, not a physical lens. Some in-browser screenshots display a deliberate IndexedDB-blocked warning which is specific to the test environment.

## Test cases

| User | Scenario | Observed result | Status |
|---|---|---|---|
| 1 | Normal Android-style 390×844: launch Home, SHOOT PHOTO, grant simulated camera, capture | CTA visible; camera starts; video preview receives synthetic 640 px stream; Shutter is accessible at y=700, footer begins at y=784; captured image shows Retake/Save/Download | Passed in browser with mock camera |
| 2 | 35mm: 844×390 landscape → 390×844 portrait | Landscape class activates and is removed again after viewport rotation, with no fatal JS exception | Passed in browser; physical Safari timing still unverified |
| 3 | Polaroid: portrait, then landscape | Portrait camera opens; no Rotate Camera button; landscape shows “Rotate your phone to Portrait” overlay | Passed in browser |
| 4 | VHS: microphone granted and recording stopped | Microphone requested on Record; generated playable WebM Blob (257,357 bytes in one run); `ffprobe` identified VP8 **video** and Opus **audio** streams; STOP opens review | Passed in Chromium with synthetic audio/video; physical iPhone/MP4 pending |
| 5 | VHS 844×390: header/profile while rotating | VHS landscape layout activated; profile at x=794, y=5, size=40×40; no fatal JS exception | Passed in browser |
| 6 | Denied camera and microphone permission | Camera displays a retry/permission message; denied mic displays RECORD WITHOUT AUDIO; option clickable after status-toast fix | Passed in browser with mock permission errors |
| 7 | Very small 320×568 phone | SHOOT PHOTO at y=447 with height 40, footer at y=508 with height 60; neither is below the viewport | Passed in browser |
| 8 | Capture photo → Save → Gallery / Lab controls | Photo was created and added to Gallery in React state; Gallery and Film/Filters Lab render. This browser sandbox deliberately does not support normal IndexedDB persistence | Partly passed; true persistence and every effect export need normal HTTPS-origin testing |
| 9 | VHS microphone denied → no-audio recording → Stop → Save | Silent fallback control shown and works; STOP opens review; SAVE closes review and adds shot; no fatal JS exception | Passed in browser with synthetic camera |
| 10 | Install PWA, go offline, receive update during recording | Static check: all precache resource paths exist; `client.navigate` removed; no automatic `skipWaiting`; activation sent only after explicit idle-state update click. Actual offline installation and update delivery could not be tested | Static verification only — physical / hosted test required |

## Confirmed bugs repaired during this work

- **Gallery read failures misdiagnosed as storage full**; corrected with typed error messages.
- **Unsafe Gallery migration:** old localStorage records could be deleted before successful migration; corrected.
- **Persistence cache inconsistency:** failing write transaction could make later changes look persisted; corrected.
- **VHS unsaved recording inserted into Gallery:** led to broken video after RETAKE; corrected.
- **VHS review screen not appearing after STOP:** preview was assigned to an unrelated state setter; corrected by updating review state.
- **VHS microphone-denied fallback obscured by toast:** corrected with click-through status-toasts.
- **Gallery warning obscured camera shutter:** moved to upper part of camera and made non-intercepting.
- **Service Worker navigated every open tab when activating:** removed.
- **Interrupted/stale camera acquisitions:** guarded with camera generation ids.

## Code and package checks

- `node --check` on all modified JavaScript scripts and `sw.js` — passed.
- Full package ZIP CRC/integrity — passed.
- Referenced local files in SW precache — verified, including JS/CSS/images.
- The original base ZIP passed integrity verification before modification.

## Not confirmed: requires device / hosted QA

- iPhone Safari older models: MP4/H.264/AAC MediaRecorder and playback; canvas capture limitations.
- Native camera selection on phones with multiple lenses, selfie mirror/orientation behavior, and camera switch mid-preview.
- Portrait ↔ landscape with actual accelerometers, notch/Dynamic Island, address-bar shrink/expand.
- 1+ minute real microphone recording, interruption during incoming calls/backgrounding, audio latency.
- IndexedDB true persistence after force-close/restart; device storage quota, private-browsing restrictions and 100+ captures.
- PWA first install/offline open and waiting-update activation on a production HTTPS domain.
- All Film + Filter + Intensity combinations exported and reopened in real Photos apps.

**Release note:** This build is ready for staging/controlled deployment, but “fully tested on iPhone” or “production-proven on every old Android/Safari” would be inaccurate.
