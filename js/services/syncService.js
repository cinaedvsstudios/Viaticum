import { config } from '../config.js';
import { setState, state } from '../state.js';
import { fetchRange, updateRange } from './sheetsApi.js';
import { parseRefRows } from './refParser.js';
import { parseEntryRows } from './entryParser.js';
import { formatSheetDate } from '../utils/dates.js';
import { blankEntry } from '../models.js';
import {
  assertTargetEntry,
  dayDataRange,
  clearDayRange,
  tripCellRange,
  dayWriteValues,
  clearDayValues,
  clearDayAndTripValues,
  logWriteAudit
} from './writeGuards.js';

function upsertLocal(entry) {
  const exists = state.entries.some(e => e.rowIndex === entry.rowIndex);
  return exists ? state.entries.map(e => e.rowIndex === entry.rowIndex ? entry : e) : [...state.entries, entry];
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

function sortEntries(entries) {
  return [...entries].sort((a, b) => String(a.date).localeCompare(String(b.date)));
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
      entries: sortEntries(parseEntryRows(entryRows)),
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
  const row = assertTargetEntry(entry, 'save day');
  const range = dayDataRange(row);
  const values = [dayWriteValues(entry)];

  logWriteAudit('saveDay', entry, { range, fields: 'C:I' });
  setState({ entries: sortEntries(upsertLocal(entry)), isSyncing: true, error: '' });

  try {
    await updateRange(range, values);
  } catch (e) {
    setState({ error: e.message || String(e) });
    throw e;
  } finally {
    setState({ isSyncing: false });
  }
}

export async function clearDay(entry) {
  const row = assertTargetEntry(entry, 'clear day');
  const range = clearDayRange(row);
  const cleared = clearEntryData(entry, false);

  logWriteAudit('clearDay', entry, { range, fields: 'C:H only; date and trip preserved' });
  setState({ entries: sortEntries(upsertLocal(cleared)), isSyncing: true, error: '' });

  try {
    await updateRange(range, clearDayValues());
  } catch (e) {
    setState({ error: e.message || String(e) });
    throw e;
  } finally {
    setState({ isSyncing: false });
  }
}

export async function moveDay(oldEntry, newEntry) {
  const oldRow = assertTargetEntry(oldEntry, 'move day from old row');
  const newRow = assertTargetEntry(newEntry, 'move day to new row');
  const oldRange = dayDataRange(oldRow);
  const newRange = dayDataRange(newRow);

  logWriteAudit('moveDay.clearOld', oldEntry, { range: oldRange, fields: 'C:I' });
  logWriteAudit('moveDay.writeNew', newEntry, { range: newRange, fields: 'C:I' });

  setState({ isSyncing: true, error: '' });

  try {
    await updateRange(oldRange, clearDayAndTripValues());
    await updateRange(newRange, [dayWriteValues(newEntry)]);

    setState({
      entries: sortEntries(state.entries.map(e =>
        e.rowIndex === oldEntry.rowIndex
          ? clearEntryData(e, true)
          : e.rowIndex === newEntry.rowIndex
            ? newEntry
            : e
      ))
    });
  } catch (e) {
    setState({ error: e.message || String(e) });
    throw e;
  } finally {
    setState({ isSyncing: false });
  }
}

export const copyDay = saveDay;

export async function updateTripCell(entry, tripName) {
  const row = assertTargetEntry(entry, 'update trip');
  const range = tripCellRange(row);
  const updated = { ...entry, tripName: String(tripName ?? '') };

  logWriteAudit('updateTripCell', updated, { range, fields: 'I only' });
  setState({ entries: sortEntries(upsertLocal(updated)), isSyncing: true, error: '' });

  try {
    await updateRange(range, [[String(tripName ?? '')]]);
  } catch (e) {
    setState({ error: e.message || String(e) });
    throw e;
  } finally {
    setState({ isSyncing: false });
  }
}

export const removeDayFromTrip = entry => updateTripCell(entry, '');
export const addDayToTrip = (entry, tripName) => updateTripCell(entry, tripName);

export async function deleteTrip(tripName) {
  const matches = state.entries.filter(e => e.tripName === tripName);

  setState({
    entries: sortEntries(state.entries.map(e => e.tripName === tripName ? { ...e, tripName: '' } : e)),
    isSyncing: true,
    error: ''
  });

  try {
    for (const e of matches) {
      const row = assertTargetEntry(e, 'delete trip');
      const range = tripCellRange(row);
      logWriteAudit('deleteTrip.clearTripCell', e, { range, fields: 'I only' });
      await updateRange(range, [['']]);
    }
  } catch (e) {
    setState({ error: e.message || String(e) });
    throw e;
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
