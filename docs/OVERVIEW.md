# Overview and multi-day editing

Overview replaces Sync in the bottom navigation. **Settings → Sync now** remains available. Overview opens on the current month in Berlin with every status and source visible. It presents one row per day; mobile uses expandable daily cards.

Open a day's **Edit** action, change only the fields you need, choose Append or Replace, then use **Apply to dates** to add individual dates or a range. Use **Review changes** to inspect every affected date before confirming. Only checked fields change. Blank boxes preserve existing information. Select Clear explicitly to empty a field. Trip ID supports Replace or Clear, because one day belongs to one trip. New trip memberships must cover more than one date and include a location outside Berlin.

Examples:

- Open 4 November, change the appropriate field to indicate you are not going, add 4–8 November, review, and save once.
- Open 26 November, paste your hotel comment into Details, add 26–29 November, choose Append or Replace for Details, review, and save once. Each day's different Event and Schedule remains intact.

You can also select several daily checkboxes first, edit table cells directly and review all pending edits together, or use **Copy to…** to copy only checked fields from one day to several existing dates. Overview does not create individual activities. Imports can add missing calendar dates.

Search covers the daily fields and imported venue/booking references. Filter by date range, status, location, venue, trip or import source. Saved views are local to this browser and are chosen explicitly; reopening Overview always starts at the current month without filters.

## Backroom

Upload the already selected JSON array exported from Backroom. Only explicit dates, local times, party names and city/venue information are used. No descriptions, dress codes, audience descriptions or source links are imported. New events receive Maybe. Each event has a separate Schedule line; daily Event and Status can contain multiple values. A missing time stays unspecified. Overnight activities stay on their start date. Recurrence fields do not generate extra dates.

Repeated source Event_IDs already present in this spreadsheet are skipped, preserving personal changes and Booked statuses. Source warnings and invalid records are shown explicitly. Invalid records are skipped only after you acknowledge them. The full unfiltered events.json supplied for development is a reference; choose the intended export for a real import.

## Spreadsheet layout

`sheet1!A:I` and `ref` retain their roles. Existing rows are not migrated or deleted. Imported activities are projected into the daily cells using the current display conventions, so Day, Trip and the dashboard remain day-based. A supporting `viaticum_events` tab retains source IDs, booking associations and the imported snapshots for duplicate detection and matching. It is created only when the first import is confirmed. Daily edits operate on sheet1; the snapshots are never reapplied over your manual changes.

Writes touch only reviewed cells and use one Sheets batch operation for the daily changes and import identities. Before writing, Viaticum rereads the sheet and rejects stale previews when affected cells or row dates have changed. Simultaneous edits from another device during the short interval between the final read and write cannot be locked by this static client; avoid editing the same fields on two devices at once.

Operation history and Undo are local to this browser and scoped to the configured spreadsheet. Up to 30 actions are retained. Undo reverses the last successful edit/import only when its affected values remain unchanged. It clears newly imported values/identities when reversing an import, without deleting other rows or tabs. Google Sheets version history remains available separately.

The original single-day edit/copy/move/clear/trip actions use the same guarded save path. Existing date rows are required for those actions; the importer can create missing dates safely. Clear Day preserves Trip ID. Moving a day is saved as one batch.

## Verification

Run `node --test tests/*.test.mjs` with Node 22+ to check bulk editing, import conversion, conflict detection, atomic request construction, duplicate handling and local Undo using a simulated spreadsheet. `tests/qa.html` is a development fixture with a simulated calendar; it never reads or writes a real Google spreadsheet. The production entry remains index.html.
