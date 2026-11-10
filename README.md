# Viaticum Web

## Web v3.0.2 — themed dialogs and date pickers

Copy and Move in Edit Day now open a Viaticum calendar instead of a browser prompt. Dates without writable Google Sheet rows and the source date are disabled; destinations containing data are marked and require a separate overwrite confirmation. Existing unsaved Edit Day fields remain intact while the dialog is open. The Day date control and Overview date/month controls use the same themed picker system.

Clear, Trip creation/removal, and Overview save/delete/discard/import/undo confirmations now use app-owned dialogs rather than JavaScript alert/prompt/confirm. Dialogs support keyboard cancellation and focus restoration. Browser-controlled file selection, OAuth permission windows, and the browser's mandatory before-unload warning are intentionally unchanged.

Open `tests/qa.html?dialogs=1` for isolated dialog checks and `tests/qa.html?auto=1` for the existing Overview interaction checks. The native Android project was not changed.

## Web v3.0 — day Overview and imports

The bottom navigation now includes Overview. Open a day, edit selected fields, add further dates, and review Append/Replace/Clear changes before saving once. Desktop provides an editable daily table; mobile provides expandable day cards. Backroom imports add only selected dates, local times, party names and locations, with Maybe status and source-ID duplicate protection. Confirmed AI booking imports use the versioned JSON format, including two endpoint entries for hotels.

See [Overview guide](docs/OVERVIEW.md) and [ChatGPT booking extraction instructions](docs/AI_IMPORT.md). Undo and operation history stay in the current browser. Sync Now remains in Settings. This update applies only to the web app; the native Android project is untouched.

No dependency installation or build step is needed. Run `node --test tests/*.test.mjs` for the simulated spreadsheet checks. `node tests/serve.mjs` serves a local preview on port 8086; `tests/qa.html?auto=1` runs the isolated browser checks without accessing a live spreadsheet.

A mobile-first static web clone of the existing Kotlin / Jetpack Compose Viaticum Android app. The web app is intentionally plain HTML, CSS, and vanilla JavaScript modules so it can be edited manually and deployed as static files.

## What is included

- Main month calendar with status emoji days, faded past/filler days, today/selected borders, month selector, schedule list, and selected-day preview.
- Day detail screen with date jump, status chips, images from the ref sheet image lookup, schedule/details/files cards, sharing, clearing, editing, and swipe-style day navigation.
- Edit day screen that preserves the Android sheet layout and writes day data to columns `C:I`.
- Trip screen with trip selector, new trip flow, timeline, add/remove day support, delete trip support, share support, and expandable cards.
- More modal for Google sign-in, sync, dark mode, setup errors, and sign-out.
- Google Identity Services OAuth and Google Sheets API access from the browser.
- Demo/offline mode when no OAuth client ID is configured.

## Google OAuth setup

1. Open `web/js/config.js`.
2. Replace:

   ```js
   googleClientId: 'PASTE_GOOGLE_OAUTH_CLIENT_ID_HERE.apps.googleusercontent.com'
   ```

   with your **OAuth 2.0 Client ID** for a browser/web application.
3. In Google Cloud Console, add your local and deployed origins to the OAuth client's **Authorized JavaScript origins**, for example:
   - `http://localhost:8080`
   - `http://127.0.0.1:8080`
   - your future static hosting origin
4. Enable the **Google Sheets API** for the Google Cloud project.

No client secret belongs in this static web app. Browser OAuth uses the public client ID only.

## Required Google API scope

The app requests:

```text
https://www.googleapis.com/auth/spreadsheets
```

This matches the Android app because Viaticum reads and writes the same spreadsheet.

## Sheet compatibility

The web app keeps the Android app's spreadsheet structure:

- Spreadsheet ID: `1D8CT24J65KRPubakzrOCaYgavXGTKuo_86YBMjqGcyg`
- Main data range: `sheet1!A2:I`
- Ref/config range: `ref!A2:Q`

### `sheet1` columns

| Column | Meaning |
| --- | --- |
| A | date |
| B | ignored / currently unused |
| C | location |
| D | event |
| E | status |
| F | schedule |
| G | details |
| H | links |
| I | tripName |

### Write ranges

- Save day: `sheet1!C{row}:I{row}`
- Clear day: `sheet1!C{row}:H{row}` (keeps trip name)
- Move day: clears old `C:I`, writes new `C:I`
- Remove day from trip: clears `sheet1!I{row}`
- Add day to trip: writes `sheet1!I{row}`
- Delete trip: clears column `I` for all matching rows

## Run locally

Because the app uses JavaScript modules, serve it with a small local server instead of opening `index.html` directly:

```bash
cd web
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Without a configured client ID, the UI still loads with a demo day and a setup message in **More**.

## Deploy as a static site

Upload the `web/` directory contents to any static host, such as GitHub Pages, Netlify, Cloudflare Pages, or Firebase Hosting. After deployment, add that site's origin to the OAuth client's Authorized JavaScript origins.

## File organization

- `js/services/` contains Google auth, Sheets API, sync, and parsers.
- `js/theme/` maps ref-sheet color keys to CSS variables.
- `js/components/` contains reusable UI builders with no direct sheet access.
- `js/screens/` composes complete screens.
- `js/features/` contains calendar, day, edit, trip, and navigation logic.
- `css/` is split into base, layout, calendar, cards, forms, modals, and responsive styles.
