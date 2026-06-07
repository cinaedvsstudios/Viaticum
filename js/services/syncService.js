import { config } from '../config.js';
import { setState, state } from '../state.js';
import { fetchRange, updateRange } from './sheetsApi.js';
import { parseRefRows } from './refParser.js';
import { parseEntryRows } from './entryParser.js';
import { formatSheetDate } from '../utils/dates.js';
import { blankEntry } from '../models.js';

function upsertLocal(entry) {
  const exists = state.entries.some(e => e.rowIndex === entry.rowIndex);
  return exists ? state.entries.map(e => e.rowIndex === entry.rowIndex ? entry : e) : [...state.entries, entry];
}

function cleanEntryForSheet(entry) {
  return [
    entry.location || '',
    entry.event || '',
    entry.status || '',
    entry.schedule || '',
    entry.details || '',
    entry.links || '',
    entry.tripName || ''
  ];
}

function clearEntryData(entry, includeTrip = false) {
  return {
    ...entry,
    location: '',
    event: '',
    status: '',
    schedule: '',
    details: '',
    links: '',
    ...(includeTrip ? { tripName: '' } : {})
  };
}

export async function syncAll() {
  setState({ isSyncing: true, error: '' });

  try {
    const [refRows, entryRows] = await Promise.all([
      fetchRange(config.refRange),
      fetchRange(config.mainRange)
    ]);

    setState({
      refData: parseRefRows(refRows),
      entries: parseEntryRows(entryRows),
      demoMode: false
    });
  } catch (e) {
    setState({ error: e.message || String(e) });
  } finally {
    setState({ isSyncing: false });
  }
}

export function entryForDate(iso) {
  return state.entries.find(e => e.date === iso) || blankEntry(iso, Math.max(2, state.entries.length + 2));
}

export async function saveDay(entry) {
  const row = entry.rowIndex;
  const values = [cleanEntryForSheet(entry)];

  setState({ entries: upsertLocal(entry), isSyncing: true });

  try {
    await updateRange(`sheet1!C${row}:I${row}`, values);
  } finally {
    setState({ isSyncing: false });
  }
}

export async function clearDay(entry) {
  const cleared = clearEntryData(entry, false);
  setState({ entries: upsertLocal(cleared), isSyncing: true });

  try {
    // Clear C:H only. This intentionally leaves the date column A and trip column I untouched.
    await updateRange(`sheet1!C${entry.rowIndex}:H${entry.rowIndex}`, [['', '', '', '', '', '']]);
  } finally {
    setState({ isSyncing: false });
  }
}

export async function moveDay(oldEntry, newEntry) {
  setState({ isSyncing: true });

  try {
    // Move clears C:I on the old row because the trip assignment moves with the day.
    await updateRange(`sheet1!C${oldEntry.rowIndex}:I${oldEntry.rowIndex}`, [['', '', '', '', '', '', '']]);
    await updateRange(`sheet1!C${newEntry.rowIndex}:I${newEntry.rowIndex}`, [cleanEntryForSheet(newEntry)]);

    setState({
      entries: state.entries.map(e =>
        e.rowIndex === oldEntry.rowIndex
          ? clearEntryData(e, true)
          : e.rowIndex === newEntry.rowIndex
            ? newEntry
            : e
      )
    });
  } finally {
    setState({ isSyncing: false });
  }
}

export const copyDay = saveDay;

export async function updateTripCell(entry, tripName) {
  const updated = { ...entry, tripName };
  setState({ entries: upsertLocal(updated), isSyncing: true });

  try {
    await updateRange(`sheet1!I${entry.rowIndex}`, [[tripName]]);
  } finally {
    setState({ isSyncing: false });
  }
}

export const removeDayFromTrip = entry => updateTripCell(entry, '');
export const addDayToTrip = (entry, tripName) => updateTripCell(entry, tripName);

export async function deleteTrip(tripName) {
  const matches = state.entries.filter(e => e.tripName === tripName);
  setState({
    entries: state.entries.map(e => e.tripName === tripName ? { ...e, tripName: '' } : e),
    isSyncing: true
  });

  try {
    for (const e of matches) await updateRange(`sheet1!I${e.rowIndex}`, [['']]);
  } finally {
    setState({ isSyncing: false });
  }
}

export function demoSeed() {
  if (state.entries.length) return;

  const today = new Date();
  const iso = d => formatSheetDate(d.toISOString().slice(0, 10));

  setState({
    entries: [{
      date: iso(today),
      rowIndex: 2,
      location: 'Demo City',
      event: 'Arrival',
      status: 'Booked',
      schedule: '09:00: Airport\n12:00: Lunch',
      details: 'Info: Add Google OAuth client ID to sync.\nPaid: Flight|Hotel\nMaps: Centre - https://maps.google.com',
      links: 'Boarding Pass - https://example.com',
      tripName: 'Demo Trip'
    }]
  });
}
