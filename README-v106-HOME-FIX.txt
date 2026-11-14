FXH CAM — v106 HOME ONLY (14 Nov 2026)
====================================
Based on the uploaded FXH-CAM-v105-RREGULLIM-HOME.zip.

Changes only on Home:
- Profile name is live text based on the saved Profile name (not an image).
- Header avatar is the saved Profile photograph; initials are shown if no photo exists.
- Header name and photo update when saved in Profile and are preserved via existing app storage.
- Decorative Polaroid photo in the Home hero is visually hidden by a dark background overlay.
- Slightly more space between mode selector and the three camera cards; smaller phone widths supported.
- Cache-busting upgraded to v106 to ensure browsers load the corrected Home.

Nothing was modified in the camera processing, recordings, Gallery, Lab or Profile save routines.

IMPORTANT: The user's uploaded v105 ZIP is itself a PARTIAL overlay (it lacks
/assets/index.css, /assets/v98-welcome.css, /assets/v103-home.css, etc.).
Do not erase your existing public_html/site directory before uploading this zip.
Upload/merge its files into the existing installation, overwriting only matching
files. The pre-existing other assets must remain in place.
The same applies to GitHub: merge changed files into the existing repository;
do not replace the repository with this partial ZIP.
