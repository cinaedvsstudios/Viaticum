import { state, setState } from '../state.js';
import { el, button } from '../utils/dom.js';
import { formatShort } from '../utils/dates.js';
import { statusChips } from '../components/statusChips.js';
import { editableStatuses } from '../features/editFeature.js';
import { FIELDS, FIELD_COLUMNS, text, tokens, unique, hasContent, berlinToday, monthRange, shiftDate, initialFilters, filterDays, makeBulkChanges, tripWarning, validDate, mergeField } from '../features/overviewModel.js';
import { parseBackroom, parseAI, prepareImport, buildImportPlan, AI_EXAMPLE } from '../features/importModel.js';
import { refreshOverview, commitCells, changesToCells, recordsToCells, undoLastOperation } from '../services/overviewService.js';
import { operationHistory, lastUndoable } from '../services/recordStore.js';
import { config } from '../config.js';
import { confirmAction, promptText, pickDate, pickMonth } from '../components/appDialogs.js';

let session;
let returnFocus;
const localKey = `viaticum:overview:views:${config.spreadsheetId}`;
const views = () => { try { return JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { return []; } };
const dirty = () => session && (session.drafts.size || session.editor?.touched || session.importing);
const tab = () => config.mainRange.split('!')[0].replace(/^'|'$/g, '');
const FIELD_ICONS = { location: '📍', event: '🎉', schedule: '🕒', status: '🏷️', details: '📝', links: '🔗', tripName: '🧳', date: '📅', time: '🕒', source: '📥' };
const ACTIONS = {
  'Close ✕': ['❌', 'Close', 'rose'], 'Review changes': ['🔍', 'Review', 'green'],
  'Confirm and save': ['💾', 'Save', 'green'], 'Confirm import and save': ['💾', 'Save', 'green'],
  'Cancel': ['↩️', 'Cancel', 'peach'], 'Back': ['⬅️', 'Back', 'pink'], 'Back to Overview': ['⬅️', 'Back', 'pink'],
  'Refresh': ['🔄', 'Refresh', 'blue'], 'History': ['📜', 'History', 'purple'], 'Undo last action': ['⏪', 'Undo', 'yellow'],
  'Import Backroom Events': ['🎉', 'Backroom', 'pink'], 'AI-Augmented Import': ['🎟️', 'Bookings', 'purple'],
  'Edit selected days': ['✏️', 'Edit', 'green'], 'Edit': ['✏️', 'Edit', 'blue'], 'Copy to…': ['📋', 'Copy', 'purple'],
  'Deselect': ['🧹', 'None', 'cyan'], 'Reset': ['🔁', 'Reset', 'peach'],
  'Review pending edits': ['🔍', 'Review', 'green'], 'Discard pending edits': ['🧹', 'Discard', 'peach'],
  'Add date range': ['📅', 'Range', 'yellow'], 'Clear date selection': ['🧹', 'Deselect', 'pink'],
  'Merge both': ['🔀', 'Merge', 'green'], 'Keep current': ['🛡️', 'Keep', 'blue'], 'Use imported only': ['📥', 'Replace', 'pink'],
  'Cancel import': ['↩️', 'Cancel', 'peach'], 'Preview day changes': ['🔍', 'Review', 'green'],
  'Back to matching': ['⬅️', 'Back', 'pink'], 'Save current view': ['💾', 'Save', 'green'],
  'Delete saved view': ['🗑️', 'Delete', 'rose'], 'Download example JSON': ['📄', 'Example', 'yellow']
};
function actionStyle(name) {
  if (ACTIONS[name]) return ACTIONS[name];
  const headingName = name.replace(/ [↑↓]$/, '');
  const field = FIELDS.find(([, title]) => title === headingName)?.[0] || ({ Date: 'date', Time: 'time', Source: 'source' })[headingName];
  if (field) return [FIELD_ICONS[field], name, field];
  const hash = [...name].reduce((n, c) => n + c.codePointAt(0), 0);
  return [/\p{Extended_Pictographic}/u.test(name) ? '' : '🏷️', name, ['blue', 'pink', 'yellow', 'purple', 'green', 'peach'][hash % 6]];
}
function statusOptions() {
  const seen = new Set();
  return ['Maybe', 'Booked', ...editableStatuses(state.refData).map(([name]) => name)].filter(name => {
    const key = name.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true;
  });
}
function draw() {
  const active = document.activeElement, key = active?.dataset?.focus;
  const selection = active && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;
  const scroll = [...document.querySelectorAll('[data-scroll]')].map(n => [n.dataset.scroll, n.scrollTop, n.scrollLeft]);
  setState({});
  for (const [id, top, left] of scroll) { const node = document.querySelector(`[data-scroll="${id}"]`); if (node) { node.scrollTop = top; node.scrollLeft = left; } }
  if (key) {
    const node = [...document.querySelectorAll('[data-focus]')].find(n => n.dataset.focus === key);
    if (node) { node.focus({ preventScroll: true }); if (selection && node.setSelectionRange && !['date', 'month', 'checkbox'].includes(node.type)) { try { node.setSelectionRange(...selection); } catch {} } }
  }
}
function act(label, callback, className = '') {
  const [icon, caption, colour] = actionStyle(label);
  const control = button('', async () => {
    if (session.busy) return;
    try { session.error = ''; await callback(); }
    catch (error) { if (session) { session.error = error.message || String(error); draw(); } }
  }, `ov-button ov-colour-${colour} ${className}`);
  control.setAttribute('aria-label', label);
  control.title = label;
  if (icon) control.append(el('span', { class: 'ov-action-icon', 'aria-hidden': 'true' }, icon));
  control.append(el('span', { class: 'ov-action-label' }, caption));
  return control;
}
function input(type, value, onInput, key, attrs = {}) {
  const calendar = type === 'date' || type === 'month';
  const props = { type, value: value || '', dataset: { focus: key }, 'aria-label': attrs['aria-label'] || key, [calendar ? 'onChange' : 'onInput']: e => onInput(e.target.value), ...attrs };
  if (calendar) {
    const choose = async () => {
      const next = type === 'month'
        ? await pickMonth({ title: 'Choose month', initialMonth: value })
        : await pickDate({ title: 'Choose date', initialDate: validDate(value) ? value : berlinToday(), selectedDate: validDate(value) ? value : '', confirmLabel: 'Set date' });
      if (next && next !== value) onInput(next);
    };
    props.readonly = true;
    props.onClick = event => { event.preventDefault(); choose(); };
    props.onKeydown = event => { if (['Enter', ' ', 'ArrowDown'].includes(event.key)) { event.preventDefault(); choose(); } };
  }
  return el('input', props);
}
function select(value, options, change, label) {
  return el('select', { 'aria-label': label, onChange: e => change(e.target.value) }, options.map(([v, name]) => el('option', { value: v, selected: String(v) === String(value) }, name)));
}
function check(checked, change, label) {
  return el('input', { type: 'checkbox', checked, 'aria-label': label, onChange: e => change(e.target.checked) });
}
function label(name, control) { return el('label', { class: 'ov-control' }, el('span', {}, `${FIELD_ICONS[FIELDS.find(([, title]) => title === name)?.[0]] || ({View:'👓',Month:'📅',From:'📅',To:'📅',Venue:'🏠',Trip:'🧳',Source:'📥','Saved view':'⭐','Choose JSON file':'📂'}[name]) || '🔎'} ${name}`), control); }
function heading(title, detail = '') { return el('div', {}, el('h2', {}, `${title.startsWith('Edit') || title.startsWith('Copy') ? '✏️' : title.startsWith('Review') ? '🔍' : title.startsWith('Apply') ? '📅' : title.startsWith('History') ? '📜' : '📥'} ${title}`), detail ? el('p', { class: 'ov-muted' }, detail) : ''); }
function captureOverview() {
  const current = document.querySelector('.ov-table-view');
  if (!current) return;
  const clone = current.cloneNode(true);
  const originals = current.querySelectorAll('input,textarea,select,details');
  clone.querySelectorAll('input,textarea,select,details').forEach((node, i) => {
    if ('value' in node) node.value = originals[i].value;
    if ('checked' in node) node.checked = originals[i].checked;
    if ('open' in node) node.open = originals[i].open;
  });
  clone.inert = true;
  clone.setAttribute('aria-hidden', 'true');
  session.peekSnapshot = { node: clone, scroll: [...current.querySelectorAll('[data-scroll]')].map(n => ({ key: n.dataset.scroll, top: n.scrollTop, left: n.scrollLeft })) };
}
function setPeek(active) {
  const root = document.querySelector('.ov-backdrop'), surface = root?.querySelector('.ov-peek-surface');
  if (!surface || !session?.peekSnapshot) return;
  root.classList.toggle('ov-is-peeking', active);
  surface.hidden = !active;
  if (active) {
    const content = root.querySelector('[data-ov-content]');
    surface.style.top = `${content.getBoundingClientRect().top - root.querySelector('.ov-modal').getBoundingClientRect().top}px`;
  }
  root.querySelector('.ov-peek-button')?.setAttribute('aria-pressed', String(active));
  if (active) for (const { key, top, left } of session.peekSnapshot.scroll) {
    const node = surface.querySelector(`[data-scroll="${key}"]`); if (node) { node.scrollTop = top; node.scrollLeft = left; }
  }
}
function peekButton() {
  const stop = () => setPeek(false);
  return el('button', { type: 'button', class: 'ov-button ov-colour-cyan ov-peek-button', 'aria-label': 'Hold to peek at Overview', 'aria-pressed': 'false', title: 'Hold to see the Overview exactly as you left it; release to return',
    onPointerdown: event => { if (event.pointerType === 'mouse' && event.button !== 0) return; event.preventDefault(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch {} setPeek(true); },
    onPointerup: stop, onPointercancel: stop, onLostpointercapture: stop,
    onKeydown: event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); if (!event.repeat) setPeek(true); } },
    onKeyup: event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); stop(); } },
    onBlur: stop, onContextmenu: event => event.preventDefault(), onClick: event => event.preventDefault()
  }, el('span', { class: 'ov-action-icon', 'aria-hidden': 'true' }, '👁️'), el('span', { class: 'ov-action-label' }, 'Peek'));
}
function downloadable(name, data, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = el('a', { href: url, download: name }); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function openOverview() {
  returnFocus = document.activeElement;
  session = { filters: initialFilters(), selected: new Set(), drafts: new Map(), columns: new Set(['location', 'event', 'status', 'schedule', 'details']), sort: 'date', descending: false, screen: 'table', busy: false, error: '', message: '', editor: null, importing: null, preview: null };
  setState({ modal: 'overview' });
  queueMicrotask(() => document.querySelector('.ov-search')?.focus());
}
export function mayLeaveOverview() {
  if (state.modal !== 'overview') return true;
  if (session?.busy) return false;
  // History's cancellable leave event is synchronous. Stop navigation first,
  // then show an app-owned confirmation and close safely if approved.
  if (dirty()) {
    confirmAction({ title: 'Discard Overview changes?', message: 'You have unsaved changes in Overview. Close without saving?', confirmLabel: 'Discard changes', danger: true }).then(approved => {
      if (approved && !session?.busy) {
        session = null; setState({ modal: null }); returnFocus?.focus?.();
      }
    });
    return false;
  }
  session = null;
  return true;
}
async function closeOverview() {
  if (session?.busy) return;
  if (dirty() && !(await confirmAction({ title: 'Discard Overview changes?', message: 'You have unsaved changes in Overview. Close without saving?', confirmLabel: 'Discard changes', danger: true }))) return;
  session = null; setState({ modal: null }); returnFocus?.focus?.();
}
function currentEntries() {
  return state.entries.map(entry => {
    const draft = session.drafts.get(entry.date);
    return draft ? { ...entry, ...Object.fromEntries(Object.entries(draft.fields).map(([key, value]) => [key, value])) } : entry;
  });
}
function filtered() {
  const rows = filterDays(currentEntries(), session.filters, state.importedRecords || []);
  const sortValue = e => session.sort === 'time' ? e.schedule.match(/^\d{2}:\d{2}/m)?.[0] || '99:99' : session.sort === 'source' ? sourceLabel(e.date) : text(e[session.sort]);
  return rows.sort((a, b) => sortValue(a).localeCompare(sortValue(b)) * (session.descending ? -1 : 1) || a.date.localeCompare(b.date));
}
function setDraft(entry, field, value) {
  let draft = session.drafts.get(entry.date);
  if (!draft) { draft = { entry: { ...state.entries.find(e => e.date === entry.date) }, fields: {} }; session.drafts.set(entry.date, draft); }
  if (text(draft.entry[field]) === value) delete draft.fields[field]; else draft.fields[field] = value;
  if (!Object.keys(draft.fields).length) session.drafts.delete(entry.date);
}
function inlineChanges() {
  return [...session.drafts].flatMap(([date, draft]) => Object.entries(draft.fields).map(([field, after]) => ({ date, rowIndex: draft.entry.rowIndex, field, before: text(draft.entry[field]), after })));
}
function saveInline() {
  const changes = inlineChanges();
  if (!changes.length) throw new Error('There are no pending edits.');
  session.preview = { changes, label: 'Overview edit', back: 'table' }; session.screen = 'preview'; draw();
}
function beginEditor(entry = null, copy = false) {
  if (session.drafts.size) throw new Error('Save or discard your pending table edits before opening the editor.');
  const dates = entry ? [entry.date] : [...session.selected];
  if (!dates.length) throw new Error('Select a day to edit.');
  const source = entry || state.entries.find(e => e.date === dates[0]);
  captureOverview();
  session.editor = { dates: new Set(dates), source: { ...source }, copy, touched: false, from: dates.slice().sort()[0], to: dates.slice().sort().at(-1),
    patches: Object.fromEntries(FIELDS.map(([key]) => [key, { enabled: false, value: copy || dates.length === 1 ? text(source[key]) : '', mode: 'append' }])) };
  session.screen = 'editor'; draw();
}
async function backToTable() {
  if (session.editor?.touched && !(await confirmAction({ title: 'Discard editor changes?', message: 'Your unsaved editor changes will be lost.', confirmLabel: 'Discard changes', danger: true }))) return;
  session.editor = null; session.screen = 'table'; draw();
}
function presets(value) {
  session.filters.preset = value;
  const today = berlinToday();
  if (value === 'month') session.filters = initialFilters();
  else {
    Object.assign(session.filters, { from: today, to: ['30', '60', '90'].includes(value) ? shiftDate(today, Number(value) - 1) : '', status: value === 'maybe' ? 'Maybe' : value === 'booked' ? 'Booked' : '' });
  }
  draw();
}
function filterControl(field, name, values) {
  return label(name, select(session.filters[field], [['', 'All'], ...unique(values).sort().map(v => [v, v])], value => { session.filters[field] = value; draw(); }, name));
}
function toolbar() {
  const f = session.filters;
  return el('section', { class: 'ov-tools', dataset: { scroll: 'tools' } },
    el('div', { class: 'ov-search-line' },
      input('search', f.query, value => { f.query = value; draw(); }, 'search', { class: 'ov-search', placeholder: 'Search events, locations, notes or booking references…', 'aria-label': 'Search Overview' }),
      act('Import Backroom Events', () => startImport('backroom')),
      act('AI-Augmented Import', () => startImport('ai'))
    ),
    el('div', { class: 'ov-filter-row' },
      label('View', select(f.preset, [['month', 'Current month — All records'], ['30', 'Next 30 days'], ['60', 'Next 60 days'], ['90', 'Next 90 days'], ['maybe', 'Maybe / Not yet booked'], ['booked', 'Booked'], ['upcoming', 'All upcoming activities'], ['custom', 'Custom range']], presets, 'View preset')),
      label('Month', input('month', f.from?.slice(0, 7), value => { if (value) { Object.assign(f, monthRange(value), { preset: 'custom' }); draw(); } }, 'month')),
      el('div', { class: 'ov-range-controls' }, label('From', input('date', f.from, value => { f.from = value; f.preset = 'custom'; draw(); }, 'range-from')), label('To', input('date', f.to, value => { f.to = value; f.preset = 'custom'; draw(); }, 'range-to'))),
      act('Reset', () => { session.filters = initialFilters(); draw(); })
    ),
    el('details', { class: 'ov-more-filters' }, el('summary', {}, '🎛️ Filters, saved views and columns'),
      el('div', { class: 'ov-mobile-ranges ov-filter-row' }, label('From', input('date', f.from, value => { f.from = value; f.preset = 'custom'; draw(); }, 'mobile-range-from')), label('To', input('date', f.to, value => { f.to = value; f.preset = 'custom'; draw(); }, 'mobile-range-to'))),
      el('div', { class: 'ov-filter-row' },
        filterControl('status', 'Status', state.entries.flatMap(e => tokens(e.status))),
        filterControl('location', 'Location', state.entries.flatMap(e => tokens(e.location))),
        filterControl('venue', 'Venue', (state.importedRecords || []).map(r => r.venue)),
        filterControl('tripName', 'Trip', state.entries.map(e => e.tripName)),
        label('Source', select(f.source, [['', 'All'], ['personal', 'Personal days'], ['backroom', 'Backroom'], ['ai', 'AI booking']], value => { f.source = value; draw(); }, 'Source'))
      ),
      el('div', { class: 'ov-filter-row' },
        label('Saved view', select('', [['', 'Choose a saved view'], ...views().map((v, i) => [String(i), v.name])], value => { if (value !== '') { session.filters = { ...views()[Number(value)].filters }; draw(); } }, 'Saved view')),
        act('Save current view', async () => {
          const name = await promptText({ title: 'Save Overview view', message: 'Give this set of filters a name.', placeholder: 'View name', confirmLabel: 'Save view' });
          if (!name) return;
          try { localStorage.setItem(localKey, JSON.stringify([...views().filter(v => v.name !== name.trim()), { name: name.trim(), filters: { ...f } }].slice(-20))); session.message = 'View saved in this browser.'; draw(); }
          catch { throw new Error('This browser cannot save views.'); }
        }),
        act('Delete saved view', async () => {
          const name = await promptText({ title: 'Delete saved view', message: 'Enter the name of the saved view to delete.', placeholder: 'View name', confirmLabel: 'Find view' });
          if (name && await confirmAction({ title: 'Delete saved view?', message: 'Delete “' + name + '” from this browser?', confirmLabel: 'Delete view', danger: true })) {
            localStorage.setItem(localKey, JSON.stringify(views().filter(v => v.name !== name))); draw();
          }
        })
      ),
      el('div', { class: 'ov-column-picks' }, [...FIELDS, ['time', 'Time'], ['source', 'Source']].map(([key, title]) => el('label', {}, check(session.columns.has(key), value => { value ? session.columns.add(key) : session.columns.delete(key); draw(); }, `Show ${title}`), `${FIELD_ICONS[key]} ${title}`)))
    )
  );
}
function sourceLabel(date) { return unique((state.importedRecords || []).filter(r => r.date === date).map(r => r.source === 'ai' ? 'AI booking' : 'Backroom')).join(', ') || 'Personal'; }
function editableCell(entry, field, mobile = false) {
  const changed = session.drafts.get(entry.date)?.fields[field] !== undefined;
  return el('div', { class: `ov-cell-wrap ${changed ? 'ov-modified' : ''}` },
    field === 'status' ? statusChips(entry.status, state.refData) : '',
    el('textarea', { rows: mobile ? 2 : 1, 'aria-label': `${FIELDS.find(([key]) => key === field)[1]} ${entry.date}`, dataset: { focus: `cell-${entry.date}-${field}` },
      onInput: e => { setDraft(entry, field, e.target.value); e.target.closest('.ov-cell-wrap').classList.toggle('ov-modified', Object.hasOwn(session.drafts.get(entry.date)?.fields || {}, field)); updatePending(); }, onChange: () => draw() }, text(entry[field])),
    field === 'links' ? text(entry.links).split('\n').map(line => { const match = line.match(/https?:\/\/\S+/); return match ? el('a', { href: match[0], target: '_blank', rel: 'noopener noreferrer' }, line.split(' - ')[0]) : ''; }) : ''
  );
}
function updatePending() {
  const node = document.querySelector('.ov-pending'); if (node) { node.textContent = `${session.drafts.size} day(s) with pending edits`; node.hidden = !session.drafts.size; }
  document.querySelectorAll('[data-pending-button]').forEach(n => { n.disabled = !session.drafts.size; });
}
function tableView() {
  const rows = filtered(), columns = [...FIELDS, ['time', 'Time'], ['source', 'Source']].filter(([key]) => session.columns.has(key));
  const allSelected = rows.length > 0 && rows.every(e => session.selected.has(e.date));
  const rowSelect = (entry, checked) => { checked ? session.selected.add(entry.date) : session.selected.delete(entry.date); draw(); };
  return el('div', { class: 'ov-table-view' }, toolbar(),
    el('div', { class: 'ov-selection-bar' },
      el('label', {}, check(allSelected, value => { rows.forEach(e => value ? session.selected.add(e.date) : session.selected.delete(e.date)); draw(); }, 'Select all filtered days'), 'Select all filtered days'),
      el('strong', {}, `${session.selected.size} selected`),
      act('Deselect', () => { session.selected.clear(); draw(); }),
      act('Edit selected days', () => beginEditor(), 'ov-primary'),
      el('span', { class: 'ov-muted' }, `${rows.length} day(s) shown`)
    ),
    el('div', { class: 'ov-grid-scroll', dataset: { scroll: 'table' } },
      el('table', { class: 'ov-table' },
        el('thead', {}, el('tr', {}, el('th', {}, '☑️ Select'), ...[['date', 'Date'], ...columns].map(([key, title]) => el('th', { dataset: { column: key } }, act(`${title}${session.sort === key ? session.descending ? ' ↓' : ' ↑' : ''}`, () => { session.descending = session.sort === key ? !session.descending : false; session.sort = key; draw(); }))), el('th', {}, '🛠️ Actions'))),
        el('tbody', {}, rows.map(entry => el('tr', { class: session.selected.has(entry.date) ? 'ov-selected' : '' },
          el('td', {}, check(session.selected.has(entry.date), value => rowSelect(entry, value), `Select ${entry.date}`)),
          el('th', { scope: 'row' }, el('time', { datetime: entry.date }, formatShort(entry.date)), el('small', {}, entry.date)),
          ...columns.map(([field]) => el('td', {}, field === 'source' ? sourceLabel(entry.date) : field === 'time' ? entry.schedule.match(/^\d{2}:\d{2}/m)?.[0] || '—' : editableCell(entry, field))),
          el('td', { class: 'ov-row-actions' }, act('Edit', () => beginEditor(entry)), act('Copy to…', () => beginEditor(entry, true)))
        )))
      ),
      rows.length ? '' : el('p', { class: 'ov-empty' }, 'No records match this view. Change the month or filters.')
    ),
    el('div', { class: 'ov-mobile-list', dataset: { scroll: 'mobile' } }, rows.map(entry => el('article', { class: `ov-mobile-day ${session.selected.has(entry.date) ? 'ov-selected' : ''}` },
      el('header', {}, check(session.selected.has(entry.date), value => rowSelect(entry, value), `Select mobile ${entry.date}`), el('strong', {}, formatShort(entry.date)), statusChips(entry.status, state.refData)),
      el('p', {}, `${entry.location}${entry.location && entry.event ? ' · ' : ''}${entry.event}`),
      el('div', { class: 'ov-actions' }, act('Edit', () => beginEditor(entry)), act('Copy to…', () => beginEditor(entry, true))),
      el('details', {}, el('summary', {}, '🔎 Show fields'), FIELDS.filter(([key]) => session.columns.has(key)).map(([field, title]) => label(title, editableCell(entry, field, true)))))))
  );
}
function editorView() {
  const editor = session.editor;
  const setDates = () => {
    if (!validDate(editor.from) || !validDate(editor.to) || editor.from > editor.to) throw new Error('Choose a valid date range.');
    const dates = state.entries.filter(e => e.date >= editor.from && e.date <= editor.to).map(e => e.date);
    if (!dates.length) throw new Error('There are no existing calendar dates in that range.');
    dates.forEach(date => editor.dates.add(date)); editor.touched = true; draw();
  };
  return el('section', { class: 'ov-editor', dataset: { scroll: 'editor' } },
    el('div', { class: 'ov-subheading' }, heading(editor.copy ? `Copy fields from ${formatShort(editor.source.date)}` : 'Edit days', 'Only checked fields change. Blank boxes preserve existing text; choose Clear explicitly to erase a field.')),
    el('div', { class: 'ov-editor-fields' }, FIELDS.map(([key, title]) => {
      const patch = editor.patches[key];
      const changeValue = value => { patch.value = value; patch.enabled = true; editor.touched = true; const row = document.querySelector(`[data-field="${key}"]`); row?.classList.add('ov-field-enabled'); if (row) row.querySelector('input[type=checkbox]').checked = true; };
      return el('section', { class: `ov-edit-field ${patch.enabled ? 'ov-field-enabled' : ''}`, dataset: { field: key } },
        el('header', {}, el('label', {}, check(patch.enabled, value => { patch.enabled = value; editor.touched = true; draw(); }, `Change ${title}`), el('strong', {}, `${FIELD_ICONS[key]} ${title}`)),
          select(patch.mode, key === 'tripName' ? [['replace', 'Replace'], ['clear', 'Clear']] : [['append', 'Append'], ['replace', 'Replace'], ['clear', 'Clear']], value => { patch.mode = value; patch.enabled = true; editor.touched = true; draw(); }, `${title} operation`)),
        el('textarea', { rows: ['schedule', 'details', 'links'].includes(key) ? 5 : 2, disabled: patch.mode === 'clear', dataset: { focus: `edit-${key}` }, 'aria-label': `Edit ${title}`, onInput: e => changeValue(e.target.value) }, patch.value),
        key === 'status' ? el('div', { class: 'ov-chip-picks' }, statusOptions().map(name => act(`${state.refData.statuses?.[name] || ({Maybe:'❔',Booked:'✅'}[name]) || ''} ${name}`, () => { const current = tokens(patch.value), has = current.some(value => value.toLowerCase() === name.toLowerCase()); changeValue(has ? current.filter(value => value.toLowerCase() !== name.toLowerCase()).join('|') : [...current, name].join('|')); draw(); }))) : '',
        key === 'tripName' ? el('small', { class: 'ov-muted' }, 'For trips outside Berlin covering more than one date.') : ''
      );
    })),
    el('section', { class: 'ov-targets' }, heading('Apply to dates', `${editor.dates.size} day(s) selected. Add more dates before saving.`),
      el('div', { class: 'ov-filter-row' }, label('From', input('date', editor.from, value => { editor.from = value; }, 'apply-from')), label('To', input('date', editor.to, value => { editor.to = value; }, 'apply-to')), act('Add date range', setDates), act('Clear date selection', () => { editor.dates.clear(); draw(); })),
      el('div', { class: 'ov-date-picks' }, state.entries.filter(e => e.date >= (editor.from || editor.source.date) && e.date <= [editor.to || editor.source.date, shiftDate(editor.source.date, 7)].sort().at(-1) || editor.dates.has(e.date)).sort((a,b) => a.date.localeCompare(b.date)).map(entry => el('label', {}, check(editor.dates.has(entry.date), value => { value ? editor.dates.add(entry.date) : editor.dates.delete(entry.date); editor.touched = true; draw(); }, `Apply to ${entry.date}`), `${formatShort(entry.date)} · ${entry.event || entry.location || 'Empty day'}`)))
    ),
    el('footer', { class: 'ov-editor-footer' }, act('Review changes', () => {
      if (!editor.dates.size) throw new Error('Choose at least one date.');
      if (editor.patches.tripName.enabled && editor.patches.tripName.mode !== 'clear') {
        const updated = state.entries.map(e => ({ ...e, location: editor.dates.has(e.date) && editor.patches.location.enabled ? editor.patches.location.value || e.location : e.location }));
        const warning = tripWarning(updated, editor.dates, editor.patches.tripName.value); if (warning) throw new Error(warning);
      }
      const changes = makeBulkChanges(state.entries, editor.dates, editor.patches);
      if (!changes.length) throw new Error('No fields would change. Enter a value or choose Clear, and check the fields to apply.');
      session.preview = { changes, label: editor.copy ? 'Copy day fields' : 'Bulk edit', back: 'editor' }; session.screen = 'preview'; draw();
    }, 'ov-primary'), act('Cancel', backToTable))
  );
}
function changesView(changes, editable = false) {
  const grouped = new Map(); changes.forEach(c => grouped.set(c.date, [...(grouped.get(c.date) || []), c]));
  return el('div', { class: 'ov-review-days' }, [...grouped].map(([date, fields]) => el('section', { class: 'ov-review-day' }, el('h3', {}, `${formatShort(date)} · ${date}`), fields.map(c => el('div', { class: 'ov-compare-field' },
    el('strong', {}, FIELDS.find(([key]) => key === c.field)?.[1] || c.field),
    el('div', { class: 'ov-comparison' },
      el('div', { class: 'ov-before' }, el('small', {}, 'CURRENT'), el('pre', {}, c.before || '(empty)')),
      el('div', { class: 'ov-after' }, el('small', {}, 'AFTER SAVING'), editable ? el('textarea', { rows: 3, 'aria-label': `Import result ${date} ${c.field}`, onInput: e => { session.importing.overrides[date] ||= {}; session.importing.overrides[date][c.field] = e.target.value; } }, c.after) : el('pre', {}, c.after || '(clear field)'))
    ),
    editable ? el('div', { class: 'ov-merge-actions' }, act('Merge both', () => { delete session.importing.overrides[date]?.[c.field]; draw(); }), act('Keep current', () => { session.importing.overrides[date] ||= {}; session.importing.overrides[date][c.field] = c.before; draw(); }), act('Use imported only', () => {
      const records = session.importing.items.filter(i => i.choice !== 'skip' && i.kind !== 'duplicate' && i.record.date === date).map(i => i.record);
      let value = ''; for (const record of records) value = mergeField(c.field, value, record[c.field], 'append');
      session.importing.overrides[date] ||= {}; session.importing.overrides[date][c.field] = value; draw();
    })) : ''
  )))));
}
function previewView() {
  const preview = session.preview, destructive = preview.changes.some(c => c.before && !c.after || c.before && !c.after.includes(c.before));
  return el('section', { class: 'ov-review', dataset: { scroll: 'review' } },
    heading('Review before saving', `${new Set(preview.changes.map(c => c.date)).size} day(s) · ${preview.changes.length} field change(s)`),
    el('p', { class: destructive ? 'ov-warning' : 'ov-muted' }, destructive ? 'Some existing text will be replaced or cleared. Check both columns before confirming.' : 'Only the fields shown below will change.'),
    changesView(preview.changes),
    el('footer', { class: 'ov-editor-footer' }, act('Confirm and save', async () => {
      session.busy = true; draw();
      try { await commitCells(changesToCells(preview.changes), preview.label); session.drafts.clear(); session.editor = null; session.preview = null; session.screen = 'table'; session.message = 'Changes saved. Undo is available in this browser.'; }
      finally { session.busy = false; draw(); }
    }, 'ov-primary'), act('Back', () => { session.screen = preview.back; draw(); }))
  );
}
async function startImport(source) {
  if (session.drafts.size) throw new Error('Save or discard your pending edits before importing.');
  if (state.demoMode) throw new Error('Connect Google through Settings and sync your calendar before importing.');
  session.importing = { source, parsed: null, items: [], book: null, overrides: {}, step: 'upload', acceptErrors: false }; session.screen = 'import'; draw();
}
async function readImport(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose a JSON file smaller than 10 MB.');
  session.busy = true; draw();
  try {
    let json; try { json = JSON.parse(await file.text()); } catch { throw new Error('This is not valid JSON. Export the structured JSON file and try again.'); }
    const imp = session.importing;
    imp.parsed = imp.source === 'backroom' ? parseBackroom(json) : parseAI(json);
    imp.book = await refreshOverview();
    imp.items = prepareImport(imp.parsed, imp.book.records, imp.book.entries); imp.name = file.name; imp.step = 'matches';
  } finally { session.busy = false; draw(); }
}
function importPlan() { return buildImportPlan(session.importing.items, session.importing.book, session.importing.overrides); }
function importReviewChanges() {
  const imp = session.importing;
  return buildImportPlan(imp.items, imp.book).changes.map(change => ({ ...change, after: imp.overrides[change.date]?.[change.field] ?? change.after }));
}
function importView() {
  const imp = session.importing;
  const back = async () => {
    if (!(await confirmAction({ title: 'Cancel import?', message: 'Close this import without saving any of its changes?', confirmLabel: 'Discard import', danger: true }))) return;
    session.importing = null; session.screen = 'table'; draw();
  };
  return el('section', { class: 'ov-import', dataset: { scroll: 'import' } },
    el('div', { class: 'ov-subheading' }, heading(imp.source === 'backroom' ? 'Import Backroom Events' : 'AI-Augmented Import', imp.source === 'backroom' ? 'Selected dates, times, locations and party names only. New events are Maybe. Recurrence is not expanded.' : 'Confirmed tickets and reservations only. New bookings are Booked. Original PDFs and images stay outside Viaticum.'), act('Cancel import', back)),
    imp.step === 'upload' ? el('div', { class: 'ov-upload' },
      label('Choose JSON file', el('input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Import JSON file', onChange: async e => { try { await readImport(e.target.files[0]); } catch (error) { session.error = error.message; draw(); } } })),
      imp.source === 'ai' ? el('div', {}, act('Download example JSON', () => downloadable('viaticum-import-example.json', JSON.stringify(AI_EXAMPLE, null, 2))), el('a', { href: new URL('../../docs/AI_IMPORT.md', import.meta.url).href, download: 'Viaticum-ChatGPT-instructions.md', class: 'ov-button', 'aria-label': 'Download ChatGPT instructions' }, '🤖 Instructions'), el('p', {}, 'Use these instructions with your booking documents in ChatGPT, then upload the resulting JSON file here. Missing information stays blank.')) : ''
    ) : '',
    imp.parsed ? el('p', { class: 'ov-import-counts' }, `${imp.parsed.supplied} input record(s) · ${imp.items.filter(i => i.kind === 'new').length} new · ${imp.items.filter(i => ['merge', 'review'].includes(i.kind)).length} to merge/review · ${imp.items.filter(i => i.kind === 'duplicate').length} already imported · ${imp.parsed.errors.length} invalid`) : '',
    imp.parsed?.errors.length ? el('section', { class: 'ov-warning' }, el('strong', {}, 'These records cannot be imported:'), el('ul', {}, imp.parsed.errors.map(error => el('li', {}, `Record ${error.index} ${error.name}: ${error.message}`))), el('label', {}, check(imp.acceptErrors, value => { imp.acceptErrors = value; draw(); }, 'Skip listed invalid records'), 'I reviewed these errors; skip the listed invalid records.')) : '',
    imp.step === 'matches' ? el('div', {},
      el('div', { class: 'ov-import-records' }, imp.items.map((item, index) => el('article', { class: `ov-import-record ov-kind-${item.kind}` },
        el('div', {}, el('strong', {}, `${item.record.date} · ${item.record.event}`), el('p', {}, [item.record.startTime, item.record.venue, item.record.location].filter(Boolean).join(' · ')), el('small', {}, item.kind === 'duplicate' ? 'Already imported — will be skipped' : item.kind === 'new' ? 'New' : 'Existing day / review'), item.reason ? el('p', { class: 'ov-muted' }, item.reason) : '', item.warnings?.length ? el('ul', {}, item.warnings.map(w => el('li', {}, w))) : ''),
        item.kind === 'duplicate' ? '' : el('div', { class: 'ov-import-choice' },
          select(item.choice, [['merge', 'Merge into day'], ...((item.candidates?.length || item.legacyMatch) && imp.source === 'ai' ? [['match', 'Match confirmed booking']] : []), ['skip', 'Skip this record']], value => { item.choice = value; imp.overrides = {}; draw(); }, `Import action ${index + 1}`),
          item.choice === 'match' ? select(item.matchId, [['', 'Choose existing activity'], ...(item.candidates || []).map(r => [r.id, `${r.event} · ${r.startTime || 'time unspecified'}`]), ...(item.legacyMatch ? [['day', 'Existing day activity']] : [])], value => { item.matchId = value; draw(); }, `Match target ${index + 1}`) : ''
        )
      ))),
      act('Preview day changes', () => {
        if (imp.parsed.errors.length && !imp.acceptErrors) throw new Error('Review the invalid records and explicitly choose whether to skip them.');
        const plan = importPlan(); if (!plan.records.length) throw new Error('No new or matched records to import. Already imported events are skipped.');
        imp.step = 'review'; draw();
      }, 'ov-primary')
    ) : '',
    imp.step === 'review' ? el('div', {},
      el('p', {}, 'Blue shows current information. Green shows the proposed result. Edit the green boxes, keep current text, or replace it with the imported value.'),
      changesView(importReviewChanges(), true),
      el('p', { class: 'ov-muted' }, `${importPlan().added} imported record(s) will also be recorded to prevent duplicates. No original documents are uploaded.`),
      el('footer', { class: 'ov-editor-footer' }, act('Confirm import and save', async () => {
        const plan = importPlan();
        if (!plan.records.length) throw new Error('There are no records to import.');
        session.busy = true; draw();
        try {
          const dayCells = changesToCells(plan.changes).map((c, i) => ({ ...c, newDay: plan.changes[i].newDay }));
          const cells = [...dayCells, ...plan.dateCells.map(c => ({ ...c, tab: tab() })), ...recordsToCells(plan.records)];
          await commitCells(cells, imp.source === 'backroom' ? 'Backroom import' : 'AI booking import');
          session.importing = null; session.screen = 'table'; session.message = `Imported ${plan.added} record(s); skipped ${plan.skipped}. Undo is available in this browser.`;
        } finally { session.busy = false; draw(); }
      }, 'ov-primary'), act('Back to matching', () => { imp.step = 'matches'; draw(); }))
    ) : ''
  );
}
function historyView() {
  return el('section', { class: 'ov-history', dataset: { scroll: 'history' } },
    el('div', { class: 'ov-subheading' }, heading('History in this browser', 'Undo is available only here. It checks the sheet first and will stop if affected information has changed.'), act('Back', () => { session.screen = 'table'; draw(); })),
    operationHistory().length ? operationHistory().map(op => el('article', {}, el('strong', {}, `${op.label} · ${op.ok ? op.undone ? 'Undone' : 'Saved' : 'Failed'}`), el('p', {}, `${new Date(op.at).toLocaleString()} · ${op.days?.length || 0} day(s)`), op.error ? el('p', {}, op.error) : '')) : el('p', {}, 'No import or bulk-edit operations recorded in this browser.')
  );
}
function headerUtilities() {
  return [
    act('Refresh', async () => { if (dirty()) throw new Error('Save or discard unsaved changes before refreshing.'); session.busy = true; draw(); try { await refreshOverview(); session.message = 'Calendar refreshed.'; } finally { session.busy = false; draw(); } }),
    act('History', () => { if (session.editor || session.importing) throw new Error('Finish or cancel the current editor/import first.'); session.screen = 'history'; draw(); }),
    act('Undo last action', async () => {
      if (dirty()) throw new Error('Save or discard unsaved changes before Undo.');
      const op = lastUndoable(); if (!op) throw new Error('There is no action to undo in this browser.');
      if (!(await confirmAction({ title: 'Undo last action?', message: 'Undo “' + op.label + '” for ' + op.days.length + ' day(s)?', confirmLabel: 'Undo action', danger: true }))) return;
      session.busy = true; draw(); try { await undoLastOperation(); session.message = 'Last action undone.'; } finally { session.busy = false; draw(); }
    })
  ];
}
export function renderOverview() {
  if (!session) openOverview();
  const content = session.screen === 'table' ? tableView() : session.screen === 'editor' ? editorView() : session.screen === 'preview' ? previewView() : session.screen === 'import' ? importView() : historyView();
  content.dataset.ovContent = '';
  const workflow = [...content.querySelectorAll('.ov-editor-footer > button, .ov-subheading > .ov-button')];
  content.querySelectorAll('.ov-editor-footer').forEach(footer => footer.remove());
  const pending = [];
  if (session.screen === 'table') {
    const review = act('Review pending edits', saveInline, 'ov-primary'); review.dataset.pendingButton = 'save'; review.disabled = !session.drafts.size;
    const discard = act('Discard pending edits', async () => { if (await confirmAction({ title: 'Discard pending edits?', message: 'Discard all unsaved changes to this Overview table?', confirmLabel: 'Discard edits', danger: true })) { session.drafts.clear(); draw(); } }); discard.dataset.pendingButton = 'discard'; discard.disabled = !session.drafts.size;
    pending.push(review, discard);
  }
  const canPeek = session.peekSnapshot && (session.screen === 'editor' || session.screen === 'preview' && session.editor);
  const peekSurface = el('div', { class: 'ov-peek-surface', hidden: true });
  if (canPeek) peekSurface.append(session.peekSnapshot.node);
  const root = el('div', { class: 'ov-backdrop', onKeydown: e => {
    if (e.key === 'Escape') { e.preventDefault(); closeOverview(); }
    if (e.key === 'Tab') {
      const nodes = [...root.querySelectorAll('button,input,select,textarea,a[href],summary')].filter(n => !n.disabled && n.getClientRects().length);
      if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0]?.focus(); }
    }
  } },
    el('section', { class: 'ov-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ov-title' },
      el('header', { class: 'ov-header' },
        el('div', { class: 'ov-title-block' }, el('h1', { id: 'ov-title' }, '🗓️ Overview'), el('p', {}, 'Your calendar, one day at a time'), el('span', { class: 'ov-pending', hidden: !session.drafts.size }, `${session.drafts.size} day(s) with pending edits`)),
        el('div', { class: 'ov-header-actions', role: 'toolbar', 'aria-label': 'Overview actions' }, ...headerUtilities(), ...pending, ...(canPeek ? [peekButton()] : []), ...workflow, act('Close ✕', closeOverview))
      ),
      session.busy ? el('div', { class: 'ov-working', role: 'status' }, 'Saving / loading… Please wait.') : '',
      session.error ? el('div', { class: 'ov-error', role: 'alert' }, session.error) : '',
      session.message ? el('div', { class: 'ov-success', role: 'status' }, session.message) : '',
      content,
      peekSurface
    )
  );
  root.querySelectorAll('button').forEach(b => { if (session.busy) b.disabled = true; });
  const actions = root.querySelector('.ov-header-actions');
  actions.style.setProperty('--ov-action-count', [...actions.children].filter(node => !node.dataset.pendingButton || !node.disabled).length);
  return root;
}
window.addEventListener('beforeunload', event => { if (state.modal === 'overview' && dirty()) { event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('viaticum:leave-overview', event => { if (!mayLeaveOverview()) event.preventDefault(); });
window.addEventListener('pointerup', () => setPeek(false));
window.addEventListener('pointercancel', () => setPeek(false));
window.addEventListener('blur', () => setPeek(false));
document.addEventListener('visibilitychange', () => { if (document.hidden) setPeek(false); });
window.addEventListener('keydown', event => {
  if (state.modal !== 'overview' || event.key !== 'Tab') return;
  if (!document.querySelector('.ov-modal')?.contains(document.activeElement)) document.querySelector('.ov-header button')?.focus();
});
