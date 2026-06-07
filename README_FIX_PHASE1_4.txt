Phase 1.4 forced 3-column + version fix

Copy these files directly into the current web repo root.

Files:
- index.html
- css/phase1-fix.css
- js/screens/mainScreen.js
- js/screens/moreSheet.js

Fixes:
- The month selector no longer has the grey background.
- Desktop main screen is forced to 3 columns:
  Calendar | Day + Details underneath | Schedule
- If an old fourth Details card is still present from cached CSS/JS, CSS hides it.
- Settings now shows:
  Viaticum Web v1.4.0 — 3-column layout + month selector fix

After copying:
1. Commit/push.
2. Wait for GitHub Pages.
3. Hard refresh with Ctrl + Shift + R.
4. Open Settings and confirm the version number is visible.
