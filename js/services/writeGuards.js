const SHEET_NAME = 'sheet1';

export function isValidRowIndex(rowIndex) {
  const n = Number(rowIndex);
  return Number.isInteger(n) && n >= 2;
}

export function assertWritableRow(entry, actionName = 'write') {
  if (!entry) {
    throw new Error(`Cannot ${actionName}: no day entry was provided.`);
  }

  if (!isValidRowIndex(entry.rowIndex)) {
    throw new Error(`Cannot ${actionName}: invalid sheet row for ${entry.date || 'selected day'}. Sync first, then try again.`);
  }

  return Number(entry.rowIndex);
}

export function assertTargetEntry(entry, actionName = 'write') {
  const row = assertWritableRow(entry, actionName);

  if (!entry.date) {
    throw new Error(`Cannot ${actionName}: selected entry has no date.`);
  }

  return row;
}

export function rangeFor(rowIndex, columns) {
  const row = Number(rowIndex);

  if (!isValidRowIndex(row)) {
    throw new Error(`Invalid row index for range: ${rowIndex}`);
  }

  return `${SHEET_NAME}!${columns}${row}`;
}

export function dayDataRange(rowIndex) {
  return rangeFor(rowIndex, 'C:I');
}

export function clearDayRange(rowIndex) {
  return rangeFor(rowIndex, 'C:H');
}

export function tripCellRange(rowIndex) {
  return rangeFor(rowIndex, 'I');
}

export function normalizeWriteCell(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function dayWriteValues(entry) {
  return [
    normalizeWriteCell(entry.location),
    normalizeWriteCell(entry.event),
    normalizeWriteCell(entry.status),
    normalizeWriteCell(entry.schedule),
    normalizeWriteCell(entry.details),
    normalizeWriteCell(entry.links),
    normalizeWriteCell(entry.tripName)
  ];
}

export function clearDayValues() {
  return [['', '', '', '', '', '']];
}

export function clearDayAndTripValues() {
  return [['', '', '', '', '', '', '']];
}

export function withWriteAudit(action, entry, extra = {}) {
  return {
    action,
    date: entry?.date || '',
    rowIndex: entry?.rowIndex || '',
    range: extra.range || '',
    fields: extra.fields || ''
  };
}

export function logWriteAudit(action, entry, extra = {}) {
  const audit = withWriteAudit(action, entry, extra);

  try {
    console.info('[Viaticum write]', audit);
  } catch (_) {}

  return audit;
}
