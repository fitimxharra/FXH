# FXH Cam v102 Stable — Deploy safely / Instalimi

1. **Back up your current website** and keep a copy of the current working ZIP.
2. Use the supplied full ZIP as the source. Upload its contents into the same website root (`public_html` on Hostinger, or the existing repository root on GitHub). Do not put all the files in a new nested directory by accident.
3. Preserve existing domain and HTTPS setup. Camera and microphone permissions require a secure context.
4. **Do not clear browser data, site storage, localStorage or IndexedDB** and do not instruct users to uninstall/reinstall merely to refresh the app. Gallery media normally stays on the device and is not backed up to the server.
5. Reload the live app after deployment. The new Service Worker intentionally will **not** take over an active tab or interrupt a recording. Users may see “FXH CAM update is ready” when idle; they can click UPDATE. Otherwise the new worker activates when all old tabs close.
6. Smoke-test on the deployed HTTPS site: home CTA for each camera; 35mm photo/save; portrait Polaroid; VHS 10s with microphone; VHS landscape profile; Gallery reopening after browser restart; Lab Film+Filters and save; PWA offline reopen after first successful visit.
7. Validate on a real Android and iPhone before treating older Safari as supported.

**Important:** Screenshots taken within a browser test sandbox may warn that IndexedDB is blocked. That test condition is not evidence that a normal HTTPS Hostinger/GitHub deployment will be blocked. Conversely, real-device storage persistence must still be tested.

**Beta expiry:** This update does not change the pre-existing public-beta expiry of 1 January 2027. Do not deploy it as a post-beta paid app without separately updating beta/payment logic.
