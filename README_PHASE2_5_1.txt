Phase 2.5.1 reconnect toast

Copy these files directly into the current web repo root.

Files:
- index.html
- js/main.js
- js/components/loadingBanner.js
- js/components/statusToast.js
- js/services/googleAuth.js
- js/screens/moreSheet.js

Fixes:
- Removes the annoying persistent top banner:
  "Sign in with Google from More to sync Sheets data."
- Auth timeout / expired connection now appears as a floating toast:
  "Connection timed out"
  with a Reconnect button.
- Reconnect uses prompt:'' first, so Google can reuse the last selected signed-in account when the browser session allows it.
- If Google requires account selection or consent again, that is controlled by Google and cannot be forced away by the app.
- Auth-related messages no longer pollute the main top banner.
- Settings version becomes:
  Viaticum Web v2.5.1 — reconnect toast
