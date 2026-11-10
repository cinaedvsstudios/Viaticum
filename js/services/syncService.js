import { config } from '../config.js';
import { setState, state } from '../state.js';
import { fetchRange } from './sheetsApi.js';
import { parseRefRows } from './refParser.js';
import { blankEntry } from '../models.js';
import { FIELDS, text } from '../features/overviewModel.js';
import { readWorkbook, installWorkbook, commitCells, changesToCells } from './overviewService.js';
import { recordOperationSuccess, recordOperationFailure } from './operationStatus.js';

export async function syncAll() {
  if (state.isSyncing) return;
  setState({ isSyncing: true, error: '' });
  try {
    const [refRows, book] = await Promise.all([fetchRange(config.refRange), readWorkbook()]);
    installWorkbook(book);
    setState({ refData: parseRefRows(refRows) });
    recordOperationSuccess('Sync', { message: 'Calendar synced', range: config.mainRange + ' + ' + config.refRange, fields: 'Read only' });
  } catch (error) {
    recordOperationFailure('Sync', error);
    setState({ error: error.message || String(error) });
  } finally { setState({ isSyncing: false }); }
}
export function entryForDate(iso) {
  return state.entries.find(e => e.date === iso) || blankEntry(iso, -1);
}
function editsFor(entry, fields) {
  const existing = state.entries.find(e => e.rowIndex === entry.rowIndex && e.date === entry.date);
  if (!existing) throw new Error('No existing sheet row for this date. Sync first. New dates can be added by an import.');
  return fields.flatMap(field => text(existing[field]) === text(entry[field]) ? [] : [{ date: entry.date, rowIndex: entry.rowIndex, field, before: text(existing[field]), after: text(entry[field]) }]);
}
async function saveChanges(changes, label) {
  if (changes.length) return commitCells(changesToCells(changes), label);
}
export async function saveDay(entry) {
  return saveChanges(editsFor(entry, FIELDS.map(([key]) => key)), 'Save day');
}
export async function clearDay(entry) {
  const cleared = { ...entry, location: '', event: '', status: '', schedule: '', details: '', links: '' };
  return saveChanges(editsFor(cleared, ['location', 'event', 'status', 'schedule', 'details', 'links']), 'Clear day');
}
export async function moveDay(oldEntry, newEntry) {
  if (oldEntry.rowIndex === newEntry.rowIndex) return saveDay(newEntry);
  const cleared = { ...oldEntry, location: '', event: '', status: '', schedule: '', details: '', links: '', tripName: '' };
  return saveChanges([...editsFor(cleared, FIELDS.map(([key]) => key)), ...editsFor(newEntry, FIELDS.map(([key]) => key))], 'Move day');
}
export const copyDay = saveDay;
export async function updateTripCell(entry, tripName) {
  return saveChanges(editsFor({ ...entry, tripName: String(tripName ?? '') }, ['tripName']), 'Update trip');
}
export const removeDayFromTrip = entry => updateTripCell(entry, '');
export const addDayToTrip = (entry, tripName) => updateTripCell(entry, tripName);
export async function deleteTrip(tripName) {
  const changes = state.entries.filter(e => e.tripName === tripName).flatMap(e => editsFor({ ...e, tripName: '' }, ['tripName']));
  return saveChanges(changes, 'Remove trip links');
}
export function demoSeed() {
  if (state.entries.length) return;
  const today = new Date();
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  setState({ entries: [{ ...blankEntry(iso(today), 2), location: 'Demo City', event: 'Arrival', status: 'Booked', schedule: '09:00: Airport\n12:00: Lunch', details: 'Info: Connect Google in Settings to sync your calendar.', links: '', tripName: 'Demo Trip' }] });
}
