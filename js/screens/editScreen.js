import { state, setState, entryByDate, trips } from '../state.js';
import { el, button } from '../utils/dom.js';
import { addDays, formatLong } from '../utils/dates.js';
import { editableStatuses, templatesFor, adjacentDates, hasData } from '../features/editFeature.js';
import { saveDay, clearDay, moveDay, copyDay, entryForDate } from '../services/syncService.js';
import { pushRoute, goMain } from '../router/history.js';
import { iconFor } from '../components/iconButton.js';
import { pickDate, confirmAction, showNotice } from '../components/appDialogs.js';

export function renderEditScreen() {
  const original = entryForDate(state.selectedDate);
  const form = { ...original };

  return el('main', { class: 'screen edit-screen' },
    el('header', { class: 'edit-header' },
      button('‹', () => {
        state.selectedDate = addDays(state.selectedDate, -1);
        pushRoute('edit');
      }, 'round-btn'),
      el('div', {},
        el('h1', {}, 'Edit Day'),
        el('p', {}, formatLong(form.date))
      ),
      button('›', () => {
        state.selectedDate = addDays(state.selectedDate, 1);
        pushRoute('edit');
      }, 'round-btn')
    ),
    formView(form)
  );
}

function formView(form) {
  const refs = state.refData;
  const root = el('form', { class: 'edit-form edit-form-grid', onSubmit: e => e.preventDefault() });
  const fields = {};

  const actions = el('footer', { class: 'edit-actions' },
    button(`${iconFor(refs, 'Btn_Preview_Edit')} Preview`, () => showNotice({ title: 'Preview', message: 'Save the day to open its updated preview.' }), 'btn'),
    button(`${iconFor(refs, 'Btn_Save_Edit')} Save`, async () => {
      await saveDay(readForm(form, fields));
      goMain();
    }, 'btn save'),
    button(`${iconFor(refs, 'Btn_Copy_Edit')} Copy`, () => copyOrMoveDay('copy', form, fields), 'btn'),
    button(`${iconFor(refs, 'Btn_Move_Edit')} Move`, () => copyOrMoveDay('move', form, fields), 'btn'),
    button(`${iconFor(refs, 'Icon_Clear_Day')} Clear`, async () => {
      if (await confirmAction({ title: 'Clear this day?', message: 'Clear Location, Event, Status, Schedule, Details and Links for ' + formatLong(form.date) + '? The date and Trip ID will remain.', confirmLabel: 'Clear day', danger: true })) {
        try { await clearDay(form); }
        catch (error) { await showNotice({ title: 'Clear failed', message: error.message || String(error) }); }
      }
    }, 'btn danger'),
    button(`${iconFor(refs, 'Btn_Cancel_Edit')} Cancel`, goMain, 'btn cancel')
  );

  const leftColumn = el('section', { class: 'edit-column edit-column-left' },
    editCard('Trip basics',
      fieldBlock('location', 'Location', form.location || '', refs.locations, value => fields.location.value = value, fields),
      fieldBlock('event', 'Event', form.event || '', refs.events, value => fields.event.value = value, fields),
      statusBlock(form, refs, fields)
    ),
    editCard('Details and links',
      fieldBlock('details', 'Details', form.details || '', null, null, fields, 'textarea'),
      templateButtons(refs, 'Details', t => appendText(fields.details, t.text)),
      fieldBlock('links', 'Links', form.links || '', null, null, fields, 'textarea'),
      adjacentLinkButtons(fields.links),
      templateButtons(refs, 'Links', t => appendText(fields.links, t.text))
    )
  );

  const rightColumn = el('section', { class: 'edit-column edit-column-right' },
    editCard('Itinerary text',
      fieldBlock('schedule', 'Schedule', form.schedule || '', null, null, fields, 'textarea'),
      templateButtons(refs, 'Schedule', t => appendText(fields.schedule, t.text))
    ),
    editCard('Trip ID',
      fieldBlock('tripName', 'Trip ID', form.tripName || '', null, null, fields),
      el('div', { class: 'quick-row trip-pick-row' }, uniqueStrings(trips()).map(t => button(t, () => fields.tripName.value = t, 'chip-btn'))),
      el('div', { class: 'quick-row adjacent-trip-row' }, adjacentDates(form.date).map(o => button(`${o.offset > 0 ? '+' : ''}${o.offset}`, () => {
        const e = entryByDate(o.date);
        if (e?.tripName) fields.tripName.value = e.tripName;
      }, 'chip-btn')))
    )
  );

  root.append(actions, leftColumn, rightColumn);
  return root;
}

async function copyOrMoveDay(action, form, fields) {
  const isMove = action === 'move';
  const writable = state.entries.filter(entry => Number.isInteger(entry.rowIndex) && entry.rowIndex >= 2);
  const target = await pickDate({
    title: isMove ? 'Move to date' : 'Copy to date',
    message: (isMove ? 'Move' : 'Copy') + ' ' + formatLong(form.date) + ' to another day. Dates with an orange dot already contain information.',
    initialDate: form.date,
    availableDates: writable.map(entry => entry.date),
    occupiedDates: writable.filter(hasData).map(entry => entry.date),
    excludeDate: form.date,
    confirmLabel: isMove ? 'Move to selected date' : 'Copy to selected date'
  });
  if (!target) return;
  const existing = writable.find(entry => entry.date === target);
  if (!existing) {
    await showNotice({ title: 'Date unavailable', message: 'This date has no writable row in the Google Sheet. Sync and try again.' });
    return;
  }
  if (hasData(existing)) {
    const approved = await confirmAction({
      title: 'Replace existing day?',
      message: formatLong(target) + ' already contains calendar information. ' +
        'Continuing will replace its Location, Event, Status, Schedule, Details, Links and Trip ID with the ' +
        (isMove ? 'moved' : 'copied') + ' day. The original day will ' + (isMove ? 'be cleared.' : 'remain unchanged.'),
      confirmLabel: isMove ? 'Replace and move' : 'Replace and copy',
      danger: true
    });
    if (!approved) return;
  }
  const next = { ...readForm(form, fields), date: target, rowIndex: existing.rowIndex };
  try {
    if (isMove) { await moveDay(form, next); goMain(); }
    else await copyDay(next);
  } catch (error) {
    await showNotice({ title: isMove ? 'Move failed' : 'Copy failed', message: error.message || String(error) });
  }
}

function editCard(title, ...children) {
  return el('section', { class: 'edit-card' },
    el('h2', {}, title),
    children
  );
}

function fieldBlock(name, label, value, quickMap, quickCallback, fields, type = 'input') {
  fields[name] = type === 'textarea'
    ? el('textarea', { name }, value)
    : el('input', { name, value });

  return el('div', { class: `edit-field edit-field-${name}` },
    el('label', {},
      el('span', {}, label),
      fields[name]
    ),
    quickMap ? quickPick(quickMap, quickCallback) : ''
  );
}

function statusBlock(form, refs, fields) {
  fields.status = el('input', { name: 'status', value: form.status || '' });

  return el('div', { class: 'edit-field edit-field-status' },
    el('label', {},
      el('span', {}, 'Status'),
      fields.status
    ),
    el('div', { class: 'quick-row status-quick-row' },
      button('❌', () => fields.status.value = '', 'chip-btn danger erase-chip-btn'),
      uniqueStatusEntries(editableStatuses(refs)).map(([name, emoji]) => button(emoji || name, () => {
        const vals = new Set(fields.status.value.split(/[|,]/).map(x => x.trim()).filter(Boolean));
        vals.has(name) ? vals.delete(name) : vals.add(name);
        fields.status.value = [...vals].join('|');
      }, 'chip-btn status-chip-btn'))
    )
  );
}

function readForm(form, fields) {
  return {
    ...form,
    location: fields.location.value.trim(),
    event: fields.event.value.trim(),
    status: fields.status.value.trim(),
    schedule: fields.schedule.value.trim(),
    details: fields.details.value.trim(),
    links: fields.links.value.trim(),
    tripName: fields.tripName.value.trim()
  };
}

function uniqueKey(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase();
}

function uniqueEntries(map) {
  const seen = new Set();

  return Object.entries(map || {}).filter(([name]) => {
    const key = uniqueKey(name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values) {
  const seen = new Set();

  return (values || []).filter(value => {
    const key = uniqueKey(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStatusEntries(entries) {
  const seen = new Set();

  return (entries || []).filter(([name, emoji]) => {
    const key = emoji || uniqueKey(name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function quickPick(map, cb) {
  return el('div', { class: 'quick-row' },
    uniqueEntries(map).map(([name, emoji]) => button(`${emoji} ${name}`.trim(), () => cb(name), 'chip-btn'))
  );
}

function templateButtons(refData, target, cb) {
  const items = templatesFor(refData, target);
  return items.length ? el('div', { class: 'quick-row template-row' }, items.map(t => button(t.name, () => cb(t), 'chip-btn'))) : '';
}

function appendText(field, text) {
  field.value = [field.value.trim(), text].filter(Boolean).join('\n');
}

function adjacentLinkButtons(field) {
  return el('div', { class: 'quick-row adjacent-links-row' }, adjacentDates(state.selectedDate).map(o => button(`Links ${o.offset > 0 ? '+' : ''}${o.offset}`, () => {
    const e = entryByDate(o.date);
    if (e?.links) field.value = e.links;
  }, 'chip-btn')));
}
