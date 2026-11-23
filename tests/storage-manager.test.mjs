import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

function memoryStorage() {
  const items = new Map();
  return {
    items,
    get length() { return items.size; },
    key(index) { return [...items.keys()][index] ?? null; },
    getItem(key) { return items.has(key) ? items.get(key) : null; },
    setItem(key, value) { items.set(key, String(value)); },
    removeItem(key) { items.delete(key); }
  };
}
const local = memoryStorage(), session = memoryStorage();
globalThis.localStorage = local;
globalThis.sessionStorage = session;
globalThis.window = new EventTarget();
globalThis.CustomEvent ??= class extends Event {
  constructor(type, options = {}) { super(type); this.detail = options.detail; }
};
Object.defineProperty(globalThis, 'navigator', { value: {
  storage: { estimate: async () => ({ usage: 1024, quota: 1048576 }) }
}, configurable: true });
globalThis.indexedDB = { databases: async () => [{ name: 'capsanoto-folder-db' }] };
globalThis.caches = { keys: async () => ['other-app-static-cache'], open: async () => ({ keys: async () => ['request'] }) };

const {
  inspectStorage, classifyStorageKey, deleteStorageEntries,
  buildBackup, previewBackupRestore, restoreBackup,
  validateValue, storageReport
} = await import('../js/services/storageManager.js');

beforeEach(() => {
  local.items.clear();
  session.items.clear();
  local.setItem('viaticum.darkMode', 'false');
  local.setItem('viaticum:overview:views:1D8CT24J65KRPubakzrOCaYgavXGTKuo_86YBMjqGcyg', '[{"name":"Trips","filters":{}}]');
  local.setItem('viaticum.failedImages.v1', '["https://example.test/photo.jpg"]');
  session.setItem('viaticum.emptyImages.v1', '["test-key"]');
  local.setItem('viaticum.googleAccessToken', 'private-token');
  local.setItem('other-app.workspace', '{"keep":true}');
  local.setItem('viaticum.someUnregisteredKey', 'do-not-delete');
});

test('exact ownership registry protects unknown keys and saved views', async () => {
  const scan = await inspectStorage();
  assert.equal(scan.summary.safe, 2);
  assert.equal(scan.summary.owned, 5);
  assert.equal(scan.summary.review >= 3, true);
  assert.equal(classifyStorageKey('viaticum.someUnregisteredKey').owner, 'Unknown');
  assert.equal(classifyStorageKey('viaticum.darkMode').protected, true);
  assert.equal(scan.origin.usage, 1024);
  assert.match(storageReport(scan), /Unknown origin items/);
  assert.doesNotMatch(storageReport(scan), /private-token/);
});

test('Quick Clean deletes only known regenerable image caches', async () => {
  const scan = await inspectStorage();
  const result = deleteStorageEntries(scan.entries.filter(e => e.safe));
  assert.equal(result.removed.length, 2);
  assert.equal(local.getItem('viaticum.failedImages.v1'), null);
  assert.equal(session.getItem('viaticum.emptyImages.v1'), null);
  assert.equal(local.getItem('viaticum.darkMode'), 'false');
  assert.notEqual(local.getItem('viaticum:overview:views:1D8CT24J65KRPubakzrOCaYgavXGTKuo_86YBMjqGcyg'), null);
  assert.notEqual(local.getItem('other-app.workspace'), null);
  assert.notEqual(local.getItem('viaticum.someUnregisteredKey'), null);
});

test('cleanup skips entries changed after inspection, including across tabs', async () => {
  const scan = await inspectStorage();
  const cache = scan.entries.find(e => e.key === 'viaticum.failedImages.v1');
  local.setItem(cache.key, '["newer-unsaved-result"]');
  const result = deleteStorageEntries([cache]);
  assert.equal(result.removed.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(local.getItem(cache.key), '["newer-unsaved-result"]');
});

test('Clear Everything removes only registered Viaticum keys', async () => {
  const scan = await inspectStorage();
  const result = deleteStorageEntries(scan.entries, { includeProtected: true, recordCleanup: false });
  assert.equal(result.failures.length, 0);
  assert.equal(local.getItem('viaticum.googleAccessToken'), null);
  assert.equal(local.getItem('viaticum.darkMode'), null);
  assert.equal(local.getItem('other-app.workspace'), '{"keep":true}');
  assert.equal(local.getItem('viaticum.someUnregisteredKey'), 'do-not-delete');
});

test('backup never exports OAuth tokens and restore validates data', async () => {
  const scan = await inspectStorage();
  const backup = buildBackup(scan.entries);
  assert.equal(backup.entries.some(e => e.key === 'viaticum.googleAccessToken'), false);
  assert.equal(backup.entries.some(e => e.key === 'other-app.workspace'), false);
  assert.doesNotMatch(JSON.stringify(backup), /private-token/);
  assert.throws(() => validateValue('viaticum.darkMode', 'maybe'), /true or false/);
  assert.throws(() => validateValue('viaticum.emptyImages.v1', '{"wrong":"type"}'), /array/);

  local.removeItem('viaticum.darkMode');
  const preview = previewBackupRestore(backup);
  assert.equal(preview.valid.some(e => e.key === 'viaticum.darkMode'), true);
  const result = restoreBackup(backup);
  assert.equal(result.added >= 1, true);
  assert.equal(local.getItem('viaticum.darkMode'), 'false');
  assert.equal(local.getItem('other-app.workspace'), '{"keep":true}');
});

test('restore skips conflicting current values unless overwrite is explicit', async () => {
  const scan = await inspectStorage();
  const backup = buildBackup(scan.entries);
  local.setItem('viaticum.darkMode', 'true');
  const preview = previewBackupRestore(backup);
  assert.equal(preview.existing.some(e => e.key === 'viaticum.darkMode'), true);
  restoreBackup(backup);
  assert.equal(local.getItem('viaticum.darkMode'), 'true');
  restoreBackup(backup, { overwrite: true });
  assert.equal(local.getItem('viaticum.darkMode'), 'false');
});
