# Viaticum Web

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
