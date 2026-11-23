// Viaticum Web Storage Manager — storage ownership is deliberately an exact allowlist.
// Other projects can share the same browser origin on GitHub Pages. Never clear the origin.
import { config } from '../config.js';

export const STORAGE_APP_ID = 'viaticum-web';
export const STORAGE_BACKUP_SCHEMA = 'viaticum-storage-backup-v1';
export const STORAGE_CATEGORIES = [
  'Settings & Preferences', 'Projects & Saved Work', 'Drafts & Unsaved Changes',
  'User Data', 'Server-Synced Copies', 'Temporary Data', 'Cache & Previews',
  'History & Logs', 'Unknown / Unclassified'
];

const FIXED = new Map([
  ['viaticum.darkMode', { category: 'Settings & Preferences', description: 'Dark-mode preference', editable: true, kind: 'boolean' }],
  ['viaticum.googleConnected', { category: 'Settings & Preferences', description: 'Google connection preference' }],
  ['viaticum.googleAccessToken', { category: 'Settings & Preferences', description: 'Google OAuth access token', sensitive: true }],
  ['viaticum.googleAccessTokenExpiresAt', { category: 'Settings & Preferences', description: 'Google token expiry', sensitive: true }],
  ['viaticum.googleLastAuthError', { category: 'History & Logs', description: 'Last Google connection error' }],
  ['viaticum:lastOperation', { category: 'History & Logs', description: 'Most recent spreadsheet operation' }],
  ['viaticum.failedImages.v1', { category: 'Cache & Previews', description: 'Regenerable image failure cache', safe: true, editable: true, kind: 'string-array' }],
  ['viaticum.resolvedImages.v1', { category: 'Cache & Previews', description: 'Regenerable image URL lookup', safe: true, editable: true, kind: 'string-map' }],
  ['viaticum.emptyImages.v1', { category: 'Cache & Previews', description: 'Regenerable missing-image lookup', safe: true, editable: true, kind: 'string-array' }],
  ['viaticum.storageManager.lastCleanup', { category: 'History & Logs', description: 'Last successful browser cleanup time' }]
]);

function classify(key) {
  const fixed = FIXED.get(key);
  if (fixed) return { owner: 'Current application', protected: !fixed.safe, ...fixed };
  if (key === 'viaticum:history:' + config.spreadsheetId) {
    return { owner: 'Current application', category: 'History & Logs', description: 'Spreadsheet undo and operation history', protected: true, kind: 'history' };
  }
  if (key === 'viaticum:overview:views:' + config.spreadsheetId) {
    return { owner: 'Current application', category: 'Settings & Preferences', description: 'Saved Overview filter views', protected: true, editable: true, kind: 'views' };
  }
  return { owner: 'Unknown', category: 'Unknown / Unclassified', description: 'Ownership has not been established', protected: true };
}
export const classifyStorageKey = classify;

export function readableSize(bytes) {
  if (bytes == null) return 'Not recorded';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}
const approximateBytes = value => String(value).length * 2;
const entryId = (technology, key) => technology + ':' + key;

function storageFor(technology) {
  try {
    if (technology === 'localStorage') return globalThis.localStorage;
    if (technology === 'sessionStorage') return globalThis.sessionStorage;
  } catch (_) {}
  return null;
}

function scanStore(technology, entries, capabilities, errors) {
  const storage = storageFor(technology);
  if (!storage) {
    capabilities[technology] = 'Unavailable or blocked in this browser';
    return;
  }
  try {
    const keys = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key != null) keys.push(key);
    }
    for (const key of keys) {
      try {
        const value = storage.getItem(key);
        if (value == null) continue;
        const rule = classify(key);
        entries.push({
          id: entryId(technology, key), technology, key, value,
          bytes: approximateBytes(key) + approximateBytes(value),
          status: 'Local Only', ...rule
        });
      } catch (error) {
        errors.push(technology + ': could not inspect one entry (' + String(error.message || error) + ')');
      }
    }
    capabilities[technology] = keys.length + ' keys inspected';
  } catch (error) {
    capabilities[technology] = 'Restricted: ' + String(error.message || error);
  }
}

function externalEntry(technology, key, description) {
  return {
    id: entryId(technology, key), technology, key, value: null, bytes: null,
    status: 'Unknown / Review Required', owner: 'Unknown', protected: true,
    category: 'Unknown / Unclassified', description
  };
}

async function scanIndexedDB(entries, capabilities) {
  if (!globalThis.indexedDB) {
    capabilities.IndexedDB = 'Unavailable';
    return;
  }
  if (typeof indexedDB.databases !== 'function') {
    capabilities.IndexedDB = 'Database enumeration unsupported; existing databases were not touched';
    return;
  }
  try {
    const dbs = await indexedDB.databases();
    for (const db of dbs.slice(0, 100)) {
      if (!db.name) continue;
      entries.push(externalEntry('IndexedDB', db.name, 'Origin-wide database; not registered as Viaticum storage. Contents left untouched.'));
    }
    capabilities.IndexedDB = dbs.length + ' database(s) identified; unknown records protected';
  } catch (error) {
    capabilities.IndexedDB = 'Restricted: ' + String(error.message || error);
  }
}

async function scanCaches(entries, capabilities) {
  if (!globalThis.caches?.keys) {
    capabilities['Cache Storage'] = 'Unavailable';
    return;
  }
  try {
    const names = await caches.keys();
    for (const name of names.slice(0, 80)) {
      let description = 'Origin-wide cache; no Viaticum-owned cache is configured';
      try {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        description += ' (' + requests.length + ' request(s))';
      } catch (_) {}
      entries.push(externalEntry('Cache Storage', name, description + '. Protected.'));
    }
    capabilities['Cache Storage'] = names.length + ' cache(s) identified; unknown caches protected';
  } catch (error) {
    capabilities['Cache Storage'] = 'Restricted: ' + String(error.message || error);
  }
}

async function scanOPFS(entries, capabilities) {
  if (!globalThis.navigator?.storage?.getDirectory) {
    capabilities.OPFS = 'Unavailable in this environment';
    return;
  }
  try {
    const root = await navigator.storage.getDirectory();
    let count = 0;
    for await (const [name, handle] of root.entries()) {
      if (count++ >= 80) break;
      entries.push(externalEntry('OPFS', name, 'Origin-private ' + handle.kind + '; not registered as Viaticum data. Protected.'));
    }
    capabilities.OPFS = count + ' root item(s) identified; contents not inspected';
  } catch (error) {
    capabilities.OPFS = 'Restricted: ' + String(error.message || error);
  }
}

export async function inspectStorage() {
  const entries = [], capabilities = {}, errors = [];
  scanStore('localStorage', entries, capabilities, errors);
  scanStore('sessionStorage', entries, capabilities, errors);
  await scanIndexedDB(entries, capabilities);
  await scanCaches(entries, capabilities);
  await scanOPFS(entries, capabilities);
  capabilities.Cookies = 'No Viaticum-owned cookies registered; other origin cookies are not inspected';
  let origin = null;
  try {
    if (globalThis.navigator?.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      origin = { usage: estimate.usage ?? null, quota: estimate.quota ?? null };
    }
  } catch (error) {
    errors.push('Browser origin storage estimate unavailable: ' + String(error.message || error));
  }
  const owned = entries.filter(e => e.owner === 'Current application');
  const safe = owned.filter(e => e.safe === true && !e.protected);
  const summary = {
    total: entries.length, owned: owned.length, safe: safe.length,
    protected: owned.length - safe.length, review: entries.length - owned.length,
    serverVerified: 0, applicationBytes: owned.reduce((sum, e) => sum + (e.bytes || 0), 0)
  };
  return { entries, summary, capabilities, origin, errors, inspectedAt: new Date().toISOString() };
}

// This application reads its spreadsheet directly from Google Sheets; it does not
// persist a locally editable copy of the published JSON. No verification endpoint
// or auto-deletion rule exists, so "server verified" must never be inferred.
export const hasServerVerificationSource = false;

export function validateValue(key, text) {
  const rule = classify(key);
  if (rule.owner !== 'Current application') throw new Error('Unrecognised application key.');
  if (rule.sensitive) throw new Error('Credentials cannot be restored or edited.');
  if (text.length > 10 * 1024 * 1024) throw new Error('Record is too large.');
  if (rule.kind === 'boolean' && text !== 'true' && text !== 'false') throw new Error('Value must be true or false.');
  if (rule.kind === 'string-array' || rule.kind === 'string-map' || rule.kind === 'views' || rule.kind === 'history') {
    let data;
    try { data = JSON.parse(text); } catch (_) { throw new Error('Invalid JSON.'); }
    if (rule.kind === 'string-array' && (!Array.isArray(data) || data.some(x => typeof x !== 'string'))) throw new Error('Expected a JSON array of strings.');
    if (rule.kind === 'string-map' && (!data || Array.isArray(data) || typeof data !== 'object' || Object.values(data).some(x => typeof x !== 'string'))) throw new Error('Expected a JSON object with string values.');
    if (rule.kind === 'views' && (!Array.isArray(data) || data.length > 20 || data.some(x => !x || typeof x.name !== 'string' || !x.filters || typeof x.filters !== 'object'))) throw new Error('Expected up to 20 saved views with names and filters.');
    if (rule.kind === 'history' && (!Array.isArray(data) || data.length > 30 || data.some(x => !x || typeof x !== 'object'))) throw new Error('Expected up to 30 history records.');
  }
  return true;
}

export function currentValue(entry) {
  return storageFor(entry.technology)?.getItem(entry.key) ?? null;
}
export function updateStorageEntry(entry, text) {
  if (entry.owner !== 'Current application' || !entry.editable || entry.sensitive) throw new Error('This entry is not editable.');
  validateValue(entry.key, text);
  const store = storageFor(entry.technology);
  if (!store) throw new Error('Storage is unavailable.');
  if (store.getItem(entry.key) !== entry.value) throw new Error('Entry has changed since the last scan. Refresh before editing.');
  store.setItem(entry.key, text);
}

export function deleteStorageEntries(entries, { includeProtected = false, recordCleanup = true } = {}) {
  const result = { removed: [], skipped: [], failures: [] };
  for (const entry of entries) {
    const rule = classify(entry.key);
    if (entry.owner !== 'Current application' || rule.owner !== 'Current application' ||
        !['localStorage', 'sessionStorage'].includes(entry.technology) ||
        (!includeProtected && (!rule.safe || rule.protected))) {
      result.skipped.push(entry.key + ' (not eligible)');
      continue;
    }
    const store = storageFor(entry.technology);
    try {
      if (!store) throw new Error('Storage unavailable');
      if (store.getItem(entry.key) !== entry.value) {
        result.skipped.push(entry.key + ' (changed or already removed)');
        continue;
      }
      store.removeItem(entry.key);
      if (store.getItem(entry.key) !== null) throw new Error('Browser did not remove the entry');
      result.removed.push(entry);
    } catch (error) {
      result.failures.push(entry.key + ': ' + String(error.message || error));
    }
  }
  if (result.removed.length && recordCleanup) {
    try { localStorage.setItem('viaticum.storageManager.lastCleanup', new Date().toISOString()); } catch (_) {}
  }
  if (result.removed.length && globalThis.window) {
    window.dispatchEvent(new CustomEvent('viaticum:storage-cleaned', { detail: { keys: result.removed.map(e => e.key) } }));
  }
  return result;
}

export function buildBackup(entries) {
  return {
    schemaVersion: STORAGE_BACKUP_SCHEMA,
    applicationId: STORAGE_APP_ID,
    createdAt: new Date().toISOString(),
    note: 'Only explicitly registered Viaticum browser keys are included. OAuth credentials are excluded.',
    entries: entries.filter(e => e.owner === 'Current application' && e.value !== null && !e.sensitive)
      .map(e => ({
        key: e.key, technology: e.technology, category: e.category,
        value: e.value, approximateBytes: e.bytes
      }))
  };
}

export function previewBackupRestore(backup) {
  if (!backup || backup.schemaVersion !== STORAGE_BACKUP_SCHEMA || backup.applicationId !== STORAGE_APP_ID || !Array.isArray(backup.entries)) {
    throw new Error('This is not a compatible Viaticum storage backup.');
  }
  if (backup.entries.length > 5000) throw new Error('Backup contains too many entries.');
  const valid = [], rejected = [], existing = [], identical = [];
  const seen = new Set();
  for (const item of backup.entries) {
    if (!item || typeof item.key !== 'string' || typeof item.value !== 'string' ||
        !['localStorage', 'sessionStorage'].includes(item.technology)) {
      rejected.push('Malformed entry'); continue;
    }
    const id = entryId(item.technology, item.key);
    const rule = classify(item.key);
    if (seen.has(id) || rule.owner !== 'Current application' || rule.sensitive) {
      rejected.push(item.key + ' (duplicate, unknown or sensitive)'); continue;
    }
    seen.add(id);
    try { validateValue(item.key, item.value); }
    catch (error) { rejected.push(item.key + ' (' + error.message + ')'); continue; }
    const store = storageFor(item.technology);
    if (!store) { rejected.push(item.key + ' (storage unavailable)'); continue; }
    const current = store.getItem(item.key);
    if (current === item.value) identical.push(item);
    else if (current !== null) existing.push(item);
    else valid.push(item);
  }
  return { valid, existing, identical, rejected };
}
export function restoreBackup(backup, { overwrite = false } = {}) {
  const preview = previewBackupRestore(backup);
  const result = { added: 0, replaced: 0, unchanged: preview.identical.length, skipped: preview.rejected.length + (overwrite ? 0 : preview.existing.length), failures: [] };
  for (const [items, isReplacement] of [[preview.valid, false], [overwrite ? preview.existing : [], true]]) {
    for (const item of items) {
      try {
        const store = storageFor(item.technology);
        store.setItem(item.key, item.value);
        if (store.getItem(item.key) !== item.value) throw new Error('Value not saved');
        if (isReplacement) result.replaced++; else result.added++;
      } catch (error) { result.failures.push(item.key + ': ' + String(error.message || error)); }
    }
  }
  return result;
}

export function storageReport(scan) {
  const lines = [
    'Viaticum Web — Browser Storage Report',
    'Inspected: ' + scan.inspectedAt,
    'App items: ' + scan.summary.owned + ' | Safe: ' + scan.summary.safe + ' | Protected: ' + scan.summary.protected,
    'Unknown origin items: ' + scan.summary.review,
    'App-owned approximate size: ' + readableSize(scan.summary.applicationBytes),
    'Origin-wide estimated usage: ' + readableSize(scan.origin?.usage),
    'Server-verified items: 0 (no verification source configured)',
    ''
  ];
  for (const name of STORAGE_CATEGORIES) {
    const list = scan.entries.filter(e => e.owner === 'Current application' && e.category === name);
    if (!list.length) continue;
    lines.push(name + ': ' + list.length + ' item(s), ' + readableSize(list.reduce((s, e) => s + e.bytes, 0)));
    for (const e of list) lines.push('  ' + e.key + ' [' + e.technology + '] ' + (e.safe ? 'Safe to clean' : 'Protected'));
  }
  if (scan.errors.length) lines.push('Warnings: ' + scan.errors.join('; '));
  return lines.join('\n');
}
