import { el, button, clear } from '../utils/dom.js';
import { state, setState } from '../state.js';
import {
  STORAGE_CATEGORIES, inspectStorage, readableSize, currentValue,
  updateStorageEntry, deleteStorageEntries, buildBackup, previewBackupRestore,
  restoreBackup, storageReport, hasServerVerificationSource
} from '../services/storageManager.js';

const C = 'vtm-storage-';
function action(label, onClick, extra = '', disabled = false) {
  const node = button(label, onClick, C + 'button ' + extra);
  node.disabled = disabled;
  return node;
}
function paragraph(text, extra = '') { return el('p', { class: C + 'text ' + extra }, text); }
function heading(text) { return el('h3', {}, text); }
function safeDate(value) { return value ? new Date(value).toLocaleString() : 'Not recorded'; }

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const a = el('a', { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function askConfirmation({ title, description, phrase = '', danger = false, backup = null }) {
  return new Promise(resolve => {
    const overlay = el('div', { class: C + 'confirm-backdrop', role: 'presentation' });
    const card = el('section', { class: C + 'confirm', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
    const info = paragraph(description);
    info.style.whiteSpace = 'pre-line';
    let input = null;
    const yes = action(danger ? 'Confirm removal' : 'Confirm', () => finish(true), danger ? C + 'danger' : C + 'primary', Boolean(phrase));
    if (phrase) {
      input = el('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'Type ' + phrase, 'aria-label': 'Confirmation phrase' });
      input.addEventListener('input', () => { yes.disabled = input.value.trim() !== phrase; });
    }
    function finish(value) { overlay.remove(); resolve(value); }
    overlay.addEventListener('click', e => { if (e.target === overlay) finish(false); });
    card.append(heading(title), info);
    if (input) card.append(input);
    card.append(el('div', { class: C + 'controls' },
      action('Cancel', () => finish(false)),
      ...(backup ? [action('📦 Export backup first', backup)] : []),
      yes
    ));
    overlay.append(card);
    document.body.append(overlay);
    (input || card.querySelector('button')).focus();
  });
}

export function renderStorageManager() {
  const ui = {
    scan: null, loading: true, busy: false, view: 'overview', message: '',
    error: '', selected: new Set(), backupCategories: new Set(STORAGE_CATEGORIES),
    search: '', category: 'all', technology: 'all', owner: 'all', status: 'all', protection: 'all',
    onlySafe: false, sortLargest: false, visibleCount: 70,
    detail: null, edit: false, importFile: null, importPreview: null
  };
  const backdrop = el('div', {
    class: 'modal-backdrop settings-backdrop ' + C + 'backdrop',
    onClick: e => { if (e.target === backdrop) setState({ modal: 'more' }); }
  });
  const panel = el('section', { class: 'settings-modal ' + C + 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Storage and cleanup' });
  const body = el('div', { class: C + 'body' });
  const header = el('header', { class: 'settings-header ' + C + 'header' },
    el('div', {}, el('span', { class: 'settings-icon' }, '💾'), el('strong', {}, 'Storage & Cleanup')),
    action('← Settings', () => setState({ modal: 'more' }), C + 'back')
  );
  panel.append(header, body);
  backdrop.append(panel);

  function feedback(text, isError = false) {
    ui.message = isError ? '' : text;
    ui.error = isError ? text : '';
    draw();
  }
  function resultMessage(result, what) {
    const counts = what + ': ' + result.removed.length + ' item(s) removed; ' + result.skipped.length + ' skipped; ' + result.failures.length + ' failed.';
    ui.message = counts + (result.failures.length ? ' ' + result.failures.slice(0, 3).join('; ') : '');
    ui.error = result.failures.length ? ui.message : '';
  }
  async function refresh() {
    if (ui.busy) return;
    ui.loading = true;
    draw();
    try {
      ui.scan = await inspectStorage();
      const ids = new Set(ui.scan.entries.map(e => e.id));
      ui.selected = new Set([...ui.selected].filter(id => ids.has(id)));
      if (ui.detail) ui.detail = ui.scan.entries.find(e => e.id === ui.detail.id) || null;
    } catch (error) {
      ui.error = 'Storage scan failed: ' + String(error.message || error);
    } finally { ui.loading = false; draw(); }
  }
  function owned() { return ui.scan?.entries.filter(e => e.owner === 'Current application') || []; }
  function safeItems() { return owned().filter(e => e.safe && !e.protected); }
  function selectedItems() { return safeItems().filter(e => ui.selected.has(e.id)); }

  async function removeEntries(entries, { all = false, title = 'Confirm cleanup' } = {}) {
    if (!entries.length) { feedback('No eligible items were selected.'); return; }
    const size = readableSize(entries.reduce((sum, e) => sum + (e.bytes || 0), 0));
    const categories = [...new Set(entries.map(e => e.category))];
    const breakdown = categories.map(c => c + ': ' + entries.filter(e => e.category === c).length).join('\n');
    const message = all
      ? 'This will reset all identified Viaticum browser data, including saved views, account connection, settings and undo history.\n\nUnknown data and other applications will be preserved. This cannot necessarily be undone. Export a backup first if you need one.'
      : entries.length + ' eligible item(s):\n' + breakdown + '\nApproximate space: ' + size + '\n\nSaved work, settings and unknown data will remain protected.';
    if (all) {
      const canLeave = window.dispatchEvent(new CustomEvent('viaticum:leave-overview', { cancelable: true }));
      if (!canLeave) { feedback('Unsaved Overview changes must be resolved before resetting storage.', true); return; }
    }
    const confirmed = await askConfirmation({
      title, description: message, danger: true, phrase: all ? 'CLEAR VIATICUM' : '',
      backup: all ? () => downloadJson(buildBackup(owned()), 'viaticum-pre-reset-backup.json') : null
    });
    if (!confirmed) return;
    ui.busy = true;
    const result = deleteStorageEntries(entries, { includeProtected: all, recordCleanup: !all });
    resultMessage(result, all ? 'Reset' : 'Cleanup');
    ui.busy = false;
    if (all && result.failures.length === 0 && result.skipped.length === 0) {
      window.location.reload();
      return;
    }
    await refresh();
  }
  async function quickClean() {
    const entries = safeItems();
    await removeEntries(entries, { title: 'Quick Clean — safe items only' });
  }
  function renderOverview() {
    const scan = ui.scan;
    const stats = el('div', { class: C + 'stats' });
    const metrics = [
      ['App usage (approx.)', readableSize(scan.summary.applicationBytes)],
      ['App items', scan.summary.owned],
      ['Safe to clean', scan.summary.safe],
      ['Protected', scan.summary.protected],
      ['Needs review', scan.summary.review],
      ['Server verified', scan.summary.serverVerified]
    ];
    for (const [label, value] of metrics) stats.append(el('div', { class: C + 'stat' },
      el('strong', {}, String(value)), el('small', {}, label)));
    const safeBytes = safeItems().reduce((sum, e) => sum + (e.bytes || 0), 0);
    const safePercent = scan.summary.applicationBytes
      ? Math.min(100, 100 * safeBytes / scan.summary.applicationBytes)
      : 0;
    const bar = el('div', { class: C + 'bar', role: 'img', 'aria-label': 'Approximate app data: ' +
      safePercent.toFixed(1) + '% safe-to-clean cache; remainder protected' },
      el('span', { class: C + 'bar-safe', style: 'width:' + safePercent + '%' }));
    body.append(heading('Application Storage Overview'), stats, bar,
      paragraph('Safe-to-clean cache ' + readableSize(safeBytes) + ' · protected app data ' +
        readableSize(scan.summary.applicationBytes - safeBytes), C + 'fine'),
      paragraph('Origin-wide usage: ' + readableSize(scan.origin?.usage) +
        (scan.origin?.quota != null ? ' / quota ' + readableSize(scan.origin.quota) : '') +
        '. The origin estimate includes other applications and browser storage; it is not Viaticum usage.', C + 'fine'));
    const list = el('div', { class: C + 'categories' });
    for (const category of STORAGE_CATEGORIES) {
      const entries = owned().filter(e => e.category === category);
      if (!entries.length) continue;
      const removable = entries.filter(e => e.safe && !e.protected);
      const bytes = entries.reduce((sum, e) => sum + (e.bytes || 0), 0);
      const cb = el('input', { type: 'checkbox', 'aria-label': 'Select safe items in ' + category });
      cb.disabled = !removable.length;
      cb.checked = removable.length > 0 && removable.every(e => ui.selected.has(e.id));
      cb.addEventListener('change', () => {
        for (const e of removable) { if (cb.checked) ui.selected.add(e.id); else ui.selected.delete(e.id); }
        draw();
      });
      const caption = removable.length
        ? removable.length + ' safe to clean; ' + (entries.length - removable.length) + ' protected'
        : 'Protected — not selected for ordinary cleanup';
      list.append(el('label', { class: C + 'category' }, cb,
        el('span', {}, el('strong', {}, category),
          el('small', {}, entries.length + ' items · ' + readableSize(bytes) + ' · ' + caption))));
    }
    if (!list.childNodes.length) list.append(paragraph('No registered Viaticum entries found in this browser.'));
    body.append(heading('What is stored'), list);
    const actions = el('div', { class: C + 'action-grid' },
      action('⚡ Quick Clean', quickClean, C + 'primary', !safeItems().length),
      action('🧹 Clear Selected (' + selectedItems().length + ')', () => removeEntries(selectedItems(), { title: 'Clear selected categories' }), '', !selectedItems().length),
      action('☁️ Remove Server-Verified Copies', () => {}, '', true),
      action('🔎 Browse Storage', () => { ui.view = 'browser'; draw(); }),
      action('📦 Backup / Export', () => { ui.view = 'backup'; draw(); }),
      action('📋 Copy Storage Report', copyReport)
    );
    body.append(actions);
    body.append(el('section', { class: C + 'notice' },
      heading('Server verification'),
      paragraph(hasServerVerificationSource ? 'Server checking is configured.' : 'No server verification source configured.'),
      paragraph('This app reads Google Sheets directly and does not store a verified local copy of its published spreadsheet data. Automatic removal of server-verified copies is unavailable.'),
      el('label', { class: C + 'toggle' }, el('input', { type: 'checkbox', disabled: true }), ' Automatically remove verified redundant local copies (unavailable)')
    ));
    const last = owned().find(e => e.key === 'viaticum.storageManager.lastCleanup');
    body.append(paragraph('Last cleanup: ' + (last?.value ? safeDate(last.value) : 'Not recorded'), C + 'fine'));
    body.append(el('section', { class: C + 'danger-zone' },
      heading('Reset application browser storage'),
      paragraph('Removes identified Viaticum local data, including protected settings and history, only after a typed confirmation. It does not delete anything from Google Sheets, GitHub, or your hard drive.'),
      action('🗑️ Clear Everything', () => removeEntries(owned(), { all: true, title: 'Clear Everything — Viaticum only' }), C + 'danger', !owned().length)
    ));
  }
  async function copyReport() {
    try {
      await navigator.clipboard.writeText(storageReport(ui.scan));
      feedback('Storage report copied. No stored values or credentials were included.');
    } catch (error) { feedback('Could not copy report: ' + (error.message || error), true); }
  }
  function selectOption(value, title) { return el('option', { value }, title); }
  function selectField(title, values, selected, set) {
    const select = el('select', { 'aria-label': title });
    for (const [value, name] of values) select.append(selectOption(value, name));
    select.value = selected;
    select.addEventListener('change', () => { set(select.value); ui.visibleCount = 70; draw(); });
    return select;
  }
  function renderBrowser() {
    body.append(el('div', { class: C + 'subheading' }, heading('Browse Storage'), action('← Overview', () => { ui.view = 'overview'; ui.detail = null; draw(); })));
    if (ui.detail) { renderDetail(); return; }
    const filterBar = el('div', { class: C + 'filters' });
    const search = el('input', { type: 'search', placeholder: 'Search stored entries', 'aria-label': 'Search stored entries' });
    search.value = ui.search;
    filterBar.append(search,
      selectField('Category', [['all', 'All categories'], ...STORAGE_CATEGORIES.map(x => [x, x])], ui.category, x => ui.category = x),
      selectField('Technology', [['all', 'All technologies'], ...new Set(ui.scan.entries.map(x => x.technology))].map(x => Array.isArray(x) ? x : [x, x]), ui.technology, x => ui.technology = x),
      selectField('Ownership', [['all', 'All owners'], ['Current application', 'Viaticum'], ['Unknown', 'Unknown / other origin']], ui.owner, x => ui.owner = x),
      selectField('Sync status', [['all', 'All sync statuses'], ['Local Only', 'Local only'], ['Unknown / Review Required', 'Unknown / review']], ui.status, x => ui.status = x),
      selectField('Protection', [['all', 'All protections'], ['protected', 'Protected'], ['removable', 'Removable']], ui.protection, x => ui.protection = x)
    );
    const safe = el('input', { type: 'checkbox' });
    safe.checked = ui.onlySafe;
    safe.addEventListener('change', () => { ui.onlySafe = safe.checked; ui.visibleCount = 70; draw(); });
    filterBar.append(el('label', { class: C + 'toggle' }, safe, ' Show safe items only'));
    const records = el('div', { class: C + 'records' });
    search.addEventListener('input', () => { ui.search = search.value; ui.visibleCount = 70; fillRecords(records); });
    body.append(filterBar, action(ui.sortLargest ? 'Sort by name' : 'Show Largest Items', () => { ui.sortLargest = !ui.sortLargest; draw(); }), records);
    fillRecords(records);
  }
  function fillRecords(records) {
    clear(records);
    const term = ui.search.toLowerCase().trim();
    const items = ui.scan.entries.filter(e =>
      (ui.category === 'all' || e.category === ui.category) &&
      (ui.technology === 'all' || e.technology === ui.technology) &&
      (ui.owner === 'all' || e.owner === ui.owner) &&
      (ui.status === 'all' || e.status === ui.status) &&
      (ui.protection === 'all' || (ui.protection === 'protected' ? e.protected : !e.protected)) &&
      (!ui.onlySafe || (e.safe && !e.protected)) &&
      (!term || (e.key + ' ' + e.category + ' ' + e.technology).toLowerCase().includes(term))
    ).sort((a, b) => ui.sortLargest ? (b.bytes || 0) - (a.bytes || 0) : a.key.localeCompare(b.key));
    records.append(paragraph(items.length + ' matching entries. Size estimates are approximate. Creation/modified dates are not recorded.'));
    for (const e of items.slice(0, ui.visibleCount)) {
      const details = el('div', { class: C + 'record-text' },
        el('strong', {}, e.key),
        el('small', {}, e.technology + ' · ' + e.category + ' · ' + readableSize(e.bytes)),
        el('small', {}, e.owner === 'Current application'
          ? (e.safe ? 'Safe to clean' : 'Protected') + ' · ' + e.status
          : 'Unknown ownership · Protected')
      );
      records.append(el('div', { class: C + 'record' }, details,
        action('View', () => { ui.detail = e; ui.edit = false; draw(); })
      ));
    }
    if (items.length > ui.visibleCount) records.append(action('Show more (' + (items.length - ui.visibleCount) + ' remaining)', () => { ui.visibleCount += 70; fillRecords(records); }));
  }
  function renderDetail() {
    const entry = ui.detail;
    body.append(el('div', { class: C + 'subheading' }, action('← All entries', () => { ui.detail = null; ui.edit = false; draw(); })));
    body.append(heading(entry.key), paragraph(entry.description),
      paragraph('Storage: ' + entry.technology + ' · Category: ' + entry.category +
        ' · Owner: ' + entry.owner + ' · Size: ' + readableSize(entry.bytes)),
      paragraph('Modified: Not recorded · Synchronisation: ' + entry.status));
    if (entry.owner !== 'Current application') {
      body.append(paragraph('This entry does not have verified Viaticum ownership. Its contents and controls are unavailable, and it will not be deleted.'));
      return;
    }
    if (entry.sensitive) {
      body.append(paragraph('Sensitive credential: contents hidden. Editing, copying and backup are disabled.'));
      return;
    }
    const actual = currentValue(entry);
    if (actual == null) { body.append(paragraph('Entry no longer exists. Refresh the inventory.')); return; }
    if (ui.edit) {
      const field = el('textarea', { class: C + 'editor', rows: '12', 'aria-label': 'Edit entry value' });
      field.value = actual;
      const editError = paragraph('', C + 'error');
      editError.hidden = true;
      body.append(field, editError,
        el('div', { class: C + 'controls' },
          action('Cancel edit', () => { ui.edit = false; draw(); }),
          action('Save edited value', () => {
            try {
              updateStorageEntry(entry, field.value);
              ui.edit = false;
              ui.detail = null;
              ui.message = 'Value saved. Refresh the page if an active setting does not update immediately.';
              refresh();
            } catch (error) {
              editError.textContent = error.message || String(error);
              editError.hidden = false;
            }
          }, C + 'primary')
        ));
      return;
    }
    let pretty = actual;
    try { pretty = JSON.stringify(JSON.parse(actual), null, 2); } catch (_) {}
    const preview = el('pre', { class: C + 'preview' }, pretty.slice(0, 7000));
    body.append(preview);
    if (pretty.length > 7000) body.append(action('Load more of this entry', () => {
      preview.textContent = pretty.slice(0, 100000);
      if (pretty.length > 100000) preview.append(document.createTextNode('\n… Large entry truncated for performance.'));
    }));
    body.append(el('div', { class: C + 'controls' },
      action('Copy contents', async () => {
        try { await navigator.clipboard.writeText(actual); feedback('Entry contents copied.'); }
        catch (error) { feedback('Copy failed: ' + error.message, true); }
      }),
      action('Export entry', () => downloadJson(buildBackup([entry]), 'viaticum-entry-backup.json')),
      action('Edit value', () => { ui.edit = true; draw(); }, '', !entry.editable),
      action('Delete entry', async () => {
        const result = await askConfirmation({ title: 'Delete stored entry?', description: entry.key +
          '\nThis ' + (entry.protected ? 'protected' : 'removable') +
          ' item will be lost. Other entries will be preserved.', danger: true });
        if (!result) return;
        resultMessage(deleteStorageEntries([entry], { includeProtected: true }), 'Delete entry');
        ui.detail = null;
        await refresh();
      }, C + 'danger')
    ));
    if (!entry.editable) body.append(paragraph('Editing disabled for this application-critical record. It can still be viewed, exported or explicitly deleted.', C + 'fine'));
  }
  function renderBackup() {
    body.append(el('div', { class: C + 'subheading' }, heading('Backup / Export'), action('← Overview', () => { ui.view = 'overview'; draw(); })));
    body.append(paragraph('Export registered Viaticum browser data as JSON. Google access tokens are never included. This does not back up your live Google Sheet.'));
    const categories = el('div', { class: C + 'backup-categories' });
    for (const category of STORAGE_CATEGORIES) {
      const matching = owned().filter(e => e.category === category && !e.sensitive);
      if (!matching.length) continue;
      const cb = el('input', { type: 'checkbox' });
      cb.checked = ui.backupCategories.has(category);
      cb.addEventListener('change', () => { if (cb.checked) ui.backupCategories.add(category); else ui.backupCategories.delete(category); });
      categories.append(el('label', {}, cb, ' ' + category + ' (' + matching.length + ')'));
    }
    body.append(heading('Choose backup categories'), categories,
      action('📥 Export selected data', () => {
        const subset = owned().filter(e => ui.backupCategories.has(e.category));
        downloadJson(buildBackup(subset), 'viaticum-storage-backup-' + new Date().toISOString().slice(0, 10) + '.json');
        feedback('Backup file generated and download requested. Check your browser downloads to confirm it was saved.');
      }, C + 'primary'));
    body.append(heading('Import a Viaticum backup'),
      paragraph('Existing data is never overwritten by default. Select a file to review additions and conflicts before restoring.'));
    const file = el('input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Choose a Viaticum backup file' });
    file.addEventListener('change', async () => {
      ui.importFile = null; ui.importPreview = null;
      try {
        const selected = file.files?.[0];
        if (!selected) return;
        if (selected.size > 20 * 1024 * 1024) throw new Error('Backup exceeds the 20 MB limit.');
        const data = JSON.parse(await selected.text());
        const preview = previewBackupRestore(data);
        ui.importFile = data; ui.importPreview = preview; ui.error = ''; draw();
      } catch (error) { feedback('Backup could not be inspected: ' + (error.message || error), true); }
    });
    body.append(file);
    if (ui.importPreview) {
      const p = ui.importPreview;
      body.append(el('section', { class: C + 'notice' },
        heading('Restore preview'),
        paragraph(p.valid.length + ' new · ' + p.existing.length + ' conflicts · ' + p.identical.length +
          ' identical · ' + p.rejected.length + ' excluded'),
        paragraph('Unrecognised keys, credentials and invalid data are excluded. Conflicting current records are preserved unless you explicitly choose overwrite.'),
        el('div', { class: C + 'controls' },
          action('Restore new items only', () => runRestore(false), C + 'primary', !p.valid.length),
          action('Overwrite conflicts and restore', () => runRestore(true), C + 'danger', !(p.valid.length || p.existing.length))
        )
      ));
    }
  }
  async function runRestore(overwrite) {
    const prompt = overwrite
      ? 'This replaces ' + ui.importPreview.existing.length + ' existing browser entries with backup values and adds ' +
        ui.importPreview.valid.length + ' new entries. Newer local preferences or saved views may be lost.'
      : 'Restore ' + ui.importPreview.valid.length + ' new entries? Existing values remain untouched.';
    if (!await askConfirmation({ title: 'Restore browser backup?', description: prompt, danger: overwrite, phrase: overwrite ? 'RESTORE' : '' })) return;
    try {
      const result = restoreBackup(ui.importFile, { overwrite });
      ui.message = 'Restore: ' + result.added + ' added, ' + result.replaced + ' replaced, ' +
        result.unchanged + ' identical, ' + result.skipped + ' skipped, ' + result.failures.length + ' failed.';
      ui.error = result.failures.length ? result.failures.join('; ') : '';
      ui.importFile = null; ui.importPreview = null;
      await refresh();
      if (result.added || result.replaced) ui.message += ' Reload the page to apply restored settings.';
      draw();
    } catch (error) { feedback(error.message || String(error), true); }
  }
  function draw() {
    clear(body);
    if (ui.error) body.append(paragraph(ui.error, C + 'error'));
    else if (ui.message) body.append(paragraph(ui.message, C + 'success'));
    if (ui.loading) { body.append(paragraph('Inspecting browser storage…')); return; }
    if (!ui.scan) { body.append(paragraph('Storage inventory unavailable.')); return; }
    body.append(el('div', { class: C + 'topbar' },
      paragraph('Viaticum Web · Browser: ' + (location.protocol === 'file:' ? 'local HTML file' : location.origin), C + 'fine'),
      action('↻ Refresh Storage', refresh)
    ));
    if (ui.scan.errors.length) body.append(paragraph('Warnings: ' + ui.scan.errors.join('; '), C + 'error'));
    if (ui.view === 'overview') renderOverview();
    else if (ui.view === 'browser') renderBrowser();
    else if (ui.view === 'backup') renderBackup();
    body.append(el('details', { class: C + 'capabilities' },
      el('summary', {}, 'Browser storage compatibility'),
      ...Object.entries(ui.scan.capabilities).map(([name, result]) => paragraph(name + ': ' + result, C + 'fine'))
    ));
  }
  Promise.resolve().then(refresh);
  return backdrop;
}
