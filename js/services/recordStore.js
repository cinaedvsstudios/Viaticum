import { config } from '../config.js';
export const RECORD_TAB = 'viaticum_events';
export const RECORD_FIELDS = ['id', 'source', 'sourceId', 'bookingId', 'date', 'event', 'location', 'venue', 'startTime', 'endTime', 'endDate', 'status', 'schedule', 'details', 'links', 'bookingReference', 'stayStart', 'stayEnd', 'matchEventId', 'importedAt'];
export const recordRow = record => RECORD_FIELDS.map(key => String(record[key] ?? ''));
export function parseRecords(rows = []) {
  if (!rows.length) return [];
  if (RECORD_FIELDS.some((key, i) => rows[0]?.[i] !== key)) throw new Error('The viaticum_events columns have changed. Restore its original header before importing.');
  return rows.slice(1).map((row, i) => ({ ...Object.fromEntries(RECORD_FIELDS.map((key, col) => [key, String(row[col] ?? '')])), rowIndex: i + 2 })).filter(r => r.id);
}
const historyKey = () => `viaticum:history:${config.spreadsheetId}`;
export function operationHistory() {
  try { return JSON.parse(localStorage.getItem(historyKey()) || '[]'); } catch { return []; }
}
export function retainOperation(operation) {
  try {
    const history = [operation, ...operationHistory()].slice(0, 30);
    localStorage.setItem(historyKey(), JSON.stringify(history));
    return true;
  } catch { return false; }
}
export function markUndone(id) {
  try { localStorage.setItem(historyKey(), JSON.stringify(operationHistory().map(op => op.id === id ? { ...op, undone: true } : op))); } catch {}
}
export function lastUndoable() {
  const last = operationHistory().find(op => op.ok && op.cells?.length && !op.label.startsWith('Undo '));
  return last && !last.undone ? last : null;
}
