# FXH CAM v102 — VHS second recording and Full View fix

Base: FXH-CAM-v102-STABLE-FINAL-15-11-2026.zip
Scope: fixes only; original design and other camera modes preserved.

## Changes

1. **Repeated VHS recordings:** The live video element is unmounted while the review screen is displayed. When returning from Retake, Save, or Download, the `MediaStream` now reattaches to the freshly mounted `<video>` element and resumes playback. If its video track is no longer live, the app requests the camera again. Before starting a recording, it attempts reconnection instead of immediately failing with "Camera is loading".
2. **Stop → Retake/Save/Download:** Review closes properly, recording time resets, and the next take can start without navigating away.
3. **PLAY:** Retains access to the last take after Save or Download instead of incorrectly displaying "No VHS recording yet". Retake intentionally clears an unwanted take.
4. **Full View / Landscape:** The user-triggered Full View control now requests fullscreen *before* trying `screen.orientation.lock('landscape')`, as required by Chromium-based browsers. Exiting unlocks and exits fullscreen. If locking is not supported or OS rotation is disabled, an informative prompt asks the user to turn on Auto-rotate and turn the phone sideways; the control does not falsely remain active.
5. **Cache busting:** Updated the app/CSS version query and the PWA Service Worker cache name so browsers can obtain the corrected code.

## Verification (desktop Chromium with synthetic media)

- Four recordings in a single session, through Retake → Save → Download → Retake: passed, with live preview restored on all returns.
- PLAY opens last video after Save and after Download: passed.
- Full View mocked browser API flow: requests fullscreen, locks landscape; exit unlocks and exits fullscreen: passed.
- Fallback when orientation lock unavailable shows a visible message: passed.
- Simulated physical 390×844 → 844×390 → 390×844 viewport orientation: passed.
- No fatal page JavaScript errors in the above tests; JavaScript syntax and ZIP integrity verified.

## Remaining device verification

- **Samsung/Android Chrome with real rear/front camera**, with screen Auto-rotate both on and off; browser-fullscreen permissions differ by OS.
- **Safari/iPhone**, whose orientation lock implementation may differ or not exist.
- Actual microphone capture and codec playback on a physical phone.

These browser automation tests use **synthetic** video/audio, not physical hardware. The application is not yet verified on the user's phone. Do not clear site data (Gallery may use IndexedDB). To activate a new deployment, close all open FXH Cam tabs and reopen the page; the PWA update is designed not to interrupt an ongoing session.
