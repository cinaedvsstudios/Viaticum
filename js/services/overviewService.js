import { state, setState } from '../state.js';
import { config } from '../config.js';
import { fetchRange, spreadsheetBatch, spreadsheetProperties } from './sheetsApi.js';
import { parseEntryRows } from './entryParser.js';
import { FIELD_COLUMNS, text, validDate } from '../features/overviewModel.js';
import { RECORD_TAB, RECORD_FIELDS, recordRow, parseRecords, retainOperation, lastUndoable, markUndone } from './recordStore.js';
import { recordOperationFailure, recordOperationSuccess } from './operationStatus.js';

const mainTab = () => config.mainRange.split('!')[0].replace(/^'|'$/g, '');
let writing = false;
export async function readWorkbook() {
  const sheets = await spreadsheetProperties();
  const hasRecords = sheets.some(s => s.title === RECORD_TAB);
  const [mainRows, recordRows] = await Promise.all([
    fetchRange(config.mainRange), hasRecords ? fetchRange(`'${RECORD_TAB}'!A1:T`) : Promise.resolve([])
  ]);
  return { sheets, mainRows, recordRows, entries: parseEntryRows(mainRows), records: parseRecords(recordRows), nextMainRow: mainRows.length + 2, nextRecordRow: Math.max(2, recordRows.length + 1) };
}
export function installWorkbook(book) {
  setState({ entries: book.entries, importedRecords: book.records, demoMode: false });
}
export async function refreshOverview() {
  if (writing || state.isSyncing) throw new Error('Wait for the current save or sync to finish.');
  const book = await readWorkbook(); installWorkbook(book); return book;
}
function rawCell(book, cell) {
  const rows = cell.tab === RECORD_TAB ? book.recordRows : book.mainRows;
  const offset = cell.tab === RECORD_TAB ? 1 : 2;
  return text(rows[cell.rowIndex - offset]?.[cell.column]);
}
export function changesToCells(changes) {
  return changes.map(c => {
    if (!(c.field in FIELD_COLUMNS) || !validDate(c.date) || !Number.isInteger(c.rowIndex) || c.rowIndex < 2) throw new Error('Invalid day edit. Refresh Overview and try again.');
    return { tab: mainTab(), rowIndex: c.rowIndex, column: FIELD_COLUMNS[c.field], before: c.before, after: c.after, date: c.date, ...(c.newDay ? { newDay: true } : {}) };
  });
}
export function recordsToCells(records) {
  return records.flatMap(r => recordRow(r).map((value, column) => ({ tab: RECORD_TAB, rowIndex: r.rowIndex, column, before: text(r.previous?.[RECORD_FIELDS[column]]), after: value })));
}
function cellRequest(cell, sheetId) {
  return { updateCells: {
    start: { sheetId, rowIndex: cell.rowIndex - 1, columnIndex: cell.column },
    rows: [{ values: [cell.after === '' ? {} : { userEnteredValue: { stringValue: text(cell.after) } }] }],
    fields: 'userEnteredValue'
  } };
}
export function buildRequests(book, cells) {
  const requests = [], ids = new Map(book.sheets.map(s => [s.title, s.sheetId]));
  if (cells.some(c => c.tab === RECORD_TAB) && !ids.has(RECORD_TAB)) {
    const id = Math.max(0, ...book.sheets.map(s => s.sheetId)) + 1;
    ids.set(RECORD_TAB, id);
    requests.push({ addSheet: { properties: { sheetId: id, title: RECORD_TAB, gridProperties: { rowCount: Math.max(1000, ...cells.filter(c => c.tab === RECORD_TAB).map(c => c.rowIndex + 10)), columnCount: RECORD_FIELDS.length, frozenRowCount: 1 } } } });
    requests.push({ updateCells: { start: { sheetId: id, rowIndex: 0, columnIndex: 0 }, rows: [{ values: RECORD_FIELDS.map(value => ({ userEnteredValue: { stringValue: value } })) }], fields: 'userEnteredValue' } });
  } else if (cells.some(c => c.tab === RECORD_TAB) && !book.recordRows.length) {
    requests.push({ updateCells: { start: { sheetId: ids.get(RECORD_TAB), rowIndex: 0, columnIndex: 0 }, rows: [{ values: RECORD_FIELDS.map(value => ({ userEnteredValue: { stringValue: value } })) }], fields: 'userEnteredValue' } });
  }
  for (const sheet of book.sheets) {
    const required = Math.max(0, ...cells.filter(c => c.tab === sheet.title).map(c => c.rowIndex));
    if (required > sheet.gridProperties.rowCount) requests.push({ appendDimension: { sheetId: sheet.sheetId, dimension: 'ROWS', length: required - sheet.gridProperties.rowCount } });
  }
  for (const cell of cells) {
    if (!ids.has(cell.tab)) throw new Error(`Missing sheet: ${cell.tab}`);
    requests.push(cellRequest(cell, ids.get(cell.tab)));
  }
  return requests;
}
export async function commitCells(cells, label, { undoOf = null } = {}) {
  if (writing || state.isSyncing) throw new Error('Wait for the current save or sync to finish.');
  if (state.demoMode) throw new Error('Connect Google and sync your calendar before saving.');
  if (!cells.length) throw new Error('There are no changes to save.');
  if (cells.some(c => text(c.after).length > 49000)) throw new Error('A field is too long for Google Sheets. Shorten it before saving.');
  const seen = new Set();
  for (const c of cells) {
    const key = `${c.tab}:${c.rowIndex}:${c.column}`;
    if (seen.has(key)) throw new Error('A field was selected twice. Rebuild the preview.');
    seen.add(key);
  }
  writing = true; setState({ isSyncing: true, error: '' });
  let saved = false;
  const operation = { id: crypto.randomUUID(), at: new Date().toISOString(), label, ok: false, days: [...new Set(cells.filter(c => c.date).map(c => c.date))], cells: [] };
  try {
    const book = await readWorkbook();
    for (const c of cells) {
      if (text(rawCell(book, c)).trim() !== text(c.before).trim()) throw new Error('The sheet changed after your preview. Refresh and review the changes again; nothing was saved.');
      if (c.date && !c.newDay && book.entries.find(e => e.rowIndex === c.rowIndex)?.date !== c.date) throw new Error('A day moved in the spreadsheet. Refresh and review again; nothing was saved.');
      if (c.newDay && book.entries.some(e => e.date === c.date)) throw new Error('That date was added in another session. Refresh and rebuild the import preview.');
    }
    // Store the exact original text so local Undo can restore it accurately.
    operation.cells = cells.map(c => ({ ...c, before: rawCell(book, c) }));
    try {
      await spreadsheetBatch(buildRequests(book, cells));
      saved = true;
    } catch (error) {
      // A lost response can follow a successful atomic write. Reconcile before offering retry.
      try {
        const check = await readWorkbook();
        if (cells.every(c => rawCell(check, c) === text(c.after))) { saved = true; installWorkbook(check); }
      } catch {}
      if (!saved) throw new Error(`Save could not be confirmed. Refresh before retrying. ${error.message}`);
    }
    operation.ok = true;
    const retained = retainOperation(operation);
    if (undoOf) markUndone(undoOf);
    try { installWorkbook(await readWorkbook()); }
    catch {
      // Reflect confirmed writes even when the follow-up read is unavailable.
      const mainRows = book.mainRows.map(r => [...r]), recordRows = book.recordRows.map(r => [...r]);
      if (!recordRows.length && cells.some(c => c.tab === RECORD_TAB)) recordRows[0] = [...RECORD_FIELDS];
      for (const c of cells) {
        const rows = c.tab === RECORD_TAB ? recordRows : mainRows, index = c.rowIndex - (c.tab === RECORD_TAB ? 1 : 2);
        rows[index] ||= []; rows[index][c.column] = c.after;
      }
      installWorkbook({ entries: parseEntryRows(mainRows), records: parseRecords(recordRows) });
    }
    recordOperationSuccess(label, { message: `${label}: ${operation.days.length} day(s) saved${retained ? '' : '. Browser storage is unavailable; Undo could not be retained.'}`, fields: 'Only reviewed fields' });
    return operation;
  } catch (error) {
    if (!saved) { retainOperation({ ...operation, cells: [], error: error.message }); recordOperationFailure(label, error); }
    throw error;
  } finally { writing = false; setState({ isSyncing: false }); }
}
export async function undoLastOperation() {
  const operation = lastUndoable();
  if (!operation) throw new Error('There is no action to undo in this browser.');
  const cells = operation.cells.map(c => ({ ...c, before: c.after, after: c.before, newDay: false }));
  // New-date cells include A, so validate all exact cell values rather than requiring a surviving date after undo.
  return commitCells(cells, `Undo ${operation.label}`, { undoOf: operation.id });
}
