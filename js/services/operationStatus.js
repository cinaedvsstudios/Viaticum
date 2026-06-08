import { setState } from '../state.js';
import { setItem } from '../utils/storage.js';

const STORAGE_KEY = 'viaticum:lastOperation';

function nowIso() {
  return new Date().toISOString();
}

function saveOperation(operation) {
  try {
    setItem(STORAGE_KEY, JSON.stringify(operation));
  } catch (_) {}

  setState({ lastOperation: operation, toast: operation });
}

export function recordOperationSuccess(action, details = {}) {
  const operation = {
    ok: true,
    action,
    message: details.message || `${action} complete`,
    date: details.date || '',
    rowIndex: details.rowIndex || '',
    range: details.range || '',
    fields: details.fields || '',
    at: nowIso()
  };

  saveOperation(operation);
  return operation;
}

export function recordOperationFailure(action, error, details = {}) {
  const operation = {
    ok: false,
    action,
    message: error?.message || String(error || `${action} failed`),
    date: details.date || '',
    rowIndex: details.rowIndex || '',
    range: details.range || '',
    fields: details.fields || '',
    at: nowIso()
  };

  saveOperation(operation);
  return operation;
}

export function dismissToast() {
  setState({ toast: null });
}

export function describeOperation(operation) {
  if (!operation) return 'No sheet operation recorded yet.';

  const when = operation.at ? new Date(operation.at).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'unknown time';

  const status = operation.ok ? 'OK' : 'FAILED';
  const bits = [
    `${status}: ${operation.message}`,
    operation.range ? `Range ${operation.range}` : '',
    operation.date ? `Date ${operation.date}` : '',
    operation.fields ? operation.fields : '',
    when
  ].filter(Boolean);

  return bits.join(' · ');
}
