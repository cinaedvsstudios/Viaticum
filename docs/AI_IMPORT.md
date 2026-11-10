# Viaticum: confirmed booking imports

Open **Overview → AI-Augmented Import**. Upload a JSON file prepared from your tickets or reservations. Review the matches and the blue/current and green/proposed fields, then confirm the import. No PDF or image is uploaded to Viaticum.

The import uses `schemaVersion: "viaticum-import-v1"` and a `records` array. Download an example from the import screen. Every record requires:

- `id`: a stable, unique identifier for that specific ticket/segment/reservation. Reuse the same ID when importing the document again.
- `type`: `hotel`, `train`, `flight`, `travel`, `event` or `activity`.
- `confirmed`: must be the boolean `true`. Provisional or unconfirmed reservations are rejected.
- `name`: hotel, event or travel activity name.
- `location`: the city as you want it shown in the calendar. Use existing names such as Köln where appropriate.

Except for hotels, supply `date` as YYYY-MM-DD. Optional fields are `time`, `endTime`, `endDate`, `venue`, `departure`, `arrival`, `bookingId`, `bookingReference`, `seat`, `carriage`, `details`, `price`, `currency`, `paymentStatus`, and `links`. Times use local 24-hour HH:MM. Leave missing values blank or omit them. Links are a list of `{ "name": "Booking", "url": "https://..." }` objects.

If a ticket is for an event previously imported from Backroom, include its original `Event_ID` in `matchEventId` when known. The preview lets you explicitly confirm the existing activity to match. Uncertain matches are never selected silently.

For hotels use `checkIn: { "date": "2026-11-26", "time": "15:00" }` and `checkOut: { "date": "2026-11-29", "time": "" }`. Viaticum creates exactly two entries, check-in and check-out, with a shared booking identifier and full stay dates. Do not create one record per night.

For multi-leg travel, create one record per ticketed segment. Include the arrival date/time when supplied, especially for overnight journeys. A segment appears on its departure date, with its arrival information retained in Details. No time-zone conversion is applied.

## Prompt to use with ChatGPT

> Extract the confirmed reservations and tickets in my uploaded documents into a JSON file for Viaticum. Return an object with schemaVersion "viaticum-import-v1" and a records array. Use only information actually present in the documents; do not infer missing times, prices, payment status, locations or confirmations. Omit provisional bookings and explain any document that cannot be imported. Every record must have a stable id, type, confirmed:true, name and location. Build stable IDs from the booking reference plus the specific travel segment or reservation; use the same ID if I supply the document again. Use type hotel, train, flight, travel, event or activity. Non-hotels need date in YYYY-MM-DD and may have time, endDate, endTime, venue, departure, arrival, bookingId, bookingReference, seat, carriage, details, price, currency, paymentStatus and links. Times are HH:MM in the location's local time, without time-zone conversion. links is an array of objects with name and an http/https url. For hotels create one hotel record with checkIn and checkOut objects, each containing date and any supplied time; Viaticum creates the two calendar entries. Do not generate nightly hotel entries or repeated/recurring activities. Keep a shared bookingId for related segments. When I provide a Backroom Event_ID for a booked event, include it as matchEventId. Include only text and URLs, never embedded attachments. Show anything uncertain for my review before producing the file.

## Daily information and safe changes

Confirmed AI imports receive Booked. Existing Maybe statuses belonging to other activities are retained. Matching a confirmed ticket can promote its original Maybe activity. The preview shows the exact day-level status result.

The default merge preserves existing notes and links. You can keep the current field, use imported information only, or edit the proposed result before confirming. Replacing a field replaces that field's complete contents, not an automatically inferred sub-section.

Undo and operation history are stored in this browser for this spreadsheet. Clearing browser storage removes them. Undo checks that affected sheet values still match the last operation and refuses to overwrite later changes.
