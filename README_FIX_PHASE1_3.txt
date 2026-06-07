Phase 1.3 auth refresh fix

Copy this directly into the current web repo root.

Included:
- js/services/googleAuth.js

Fix:
- Keeps the Google access token in browser storage until it expires, so refreshing the page does not immediately throw you back to signed-out mode.
- Also still tries silent Google restore when the token has expired but the browser Google session is still available.

Note:
- Google browser OAuth tokens are temporary. After expiry, or if Chrome blocks silent restore, you may still need Settings -> Sign in with Google again.
