FXH CAM v104 — RELIABILITY UPDATE (14 November 2026)
Based on v103. Home design, cameras, films, Gallery and Lab look the same.

FIXED
* Gallery can no longer be emptied when the photo store fails to open once.
  Nothing is deleted unless the gallery was loaded successfully first.
* Photos are now stored as files (blobs) instead of base64 text: less memory,
  faster start with many photos. Existing photos are converted automatically
  the first time v104 opens. The app also asks the browser to keep the
  storage permanently.
* Updates no longer reload the page while someone is shooting or recording.
  A new version is picked up the next time the app is opened.
* VHS: records MP4 where WebM is not available (iPhone/iPad), with sound
  (asks for the microphone when recording starts; silent if declined).
  Downloads and shares now use the right file extension.
* Feedback form shows "sent" only when FormSubmit really accepted it;
  otherwise it shows an error and a TRY AGAIN button.
* The automatic rating prompt never opens on top of the camera.
* Fast camera switching no longer leaves a camera stream running.
* Android Back button returns to Home instead of leaving the app.
* Beta end date uses the server clock, not only the phone clock.
* "Analog Cam" wording replaced with "FXH CAM" (texts, file names, frame stamps).
* Link previews: Open Graph tags added (og.jpg).
* Privacy page: microphone, FormSubmit and Google Fonts described.

DEPLOY (GitHub Pages)
1. Upload/replace all files with their original paths (keep assets/, images/, sounds/).
2. These files are no longer used and can be deleted from the repository:
   assets/v98-welcome.js, assets/vhs-home-coral.webp,
   images/canon-ae1-final.png, images/canon-ae1-interface.png,
   images/fxh-cam-logo.png, images/vhs-landing-bg.webp
3. Wait for the Pages deployment, then open https://app.fitimxharra.com.

DO NOT clear site storage to refresh: it deletes locally stored photos.

FEEDBACK FORM
The form posts to FormSubmit. The address must be activated once: send one
test rating, then click the activation link FormSubmit emails you. After
activation, FormSubmit gives you a random token; put it in
assets/beta-control.js in place of the encoded address so the email address
is no longer readable in the code.
