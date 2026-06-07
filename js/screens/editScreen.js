import { state, setState, entryByDate, trips } from '../state.js';
import { el, button } from '../utils/dom.js';
import { addDays, formatLong } from '../utils/dates.js';
import { editableStatuses, templatesFor, adjacentDates, hasData } from '../features/editFeature.js';
import { saveDay, clearDay, moveDay, copyDay, entryForDate } from '../services/syncService.js';
import { pushRoute, goMain } from '../router/history.js';
import { iconFor } from '../components/iconButton.js';

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
  const root = el('form', { class: 'edit-form', onSubmit: e => e.preventDefault() });
  const fields = {};

  root.append(editCard('Trip basics',
    fieldBlock('location', 'Location', form.location || '', refs.locations, value => fields.location.value = value, fields),
    fieldBlock('event', 'Event', form.event || '', refs.events, value => fields.event.value = value, fields),
    statusBlock(form, refs, fields)
  ));

  root.append(editCard('Itinerary text',
    fieldBlock('schedule', 'Schedule', form.schedule || '', null, null, fields, 'textarea'),
    templateButtons(refs, 'Schedule', t => appendText(fields.schedule, t.text))
  ));

  root.append(editCard('Details and links',
    fieldBlock('details', 'Details', form.details || '', null, null, fields, 'textarea'),
    templateButtons(refs, 'Details', t => appendText(fields.details, t.text)),
    fieldBlock('links', 'Links', form.links || '', null, null, fields, 'textarea'),
    adjacentLinkButtons(fields.links),
    templateButtons(refs, 'Links', t => appendText(fields.links, t.text))
  ));

  root.append(editCard('Trip ID',
    fieldBlock('tripName', 'Trip ID', form.tripName || '', null, null, fields),
    el('div', { class: 'quick-row trip-pick-row' }, trips().map(t => button(t, () => fields.tripName.value = t, 'chip-btn'))),
    el('div', { class: 'quick-row adjacent-trip-row' }, adjacentDates(form.date).map(o => button(`${o.offset > 0 ? '+' : ''}${o.offset}`, () => {
      const e = entryByDate(o.date);
      if (e?.tripName) fields.tripName.value = e.tripName;
    }, 'chip-btn')))
  ));

  root.append(el('footer', { class: 'edit-actions' },
    button(`${iconFor(refs, 'Btn_Preview_Edit')} Preview`, () => alert('Preview after saving opens the day screen.'), 'btn'),
    button(`${iconFor(refs, 'Btn_Save_Edit')} Save`, async () => {
      await saveDay(readForm(form, fields));
      goMain();
    }, 'btn save'),
    button(`${iconFor(refs, 'Btn_Copy_Edit')} Copy`, async () => {
      const target = prompt('Copy to date (YYYY-MM-DD)', form.date);
      if (target) await copyDay({ ...readForm(form, fields), date: target, rowIndex: entryForDate(target).rowIndex });
    }, 'btn'),
    button(`${iconFor(refs, 'Btn_Move_Edit')} Move`, async () => {
      const target = prompt('Move to date (YYYY-MM-DD)', form.date);
      if (!target) return;
      const existing = entryForDate(target);
      if (hasData(existing) && !confirm('Target day already has data. Overwrite?')) return;
      await moveDay(form, { ...readForm(form, fields), date: target, rowIndex: existing.rowIndex });
      goMain();
    }, 'btn'),
    button(`${iconFor(refs, 'Icon_Clear_Day')} Clear`, async () => confirm('Clear C:H only?') && clearDay(form), 'btn danger'),
    button(`${iconFor(refs, 'Btn_Cancel_Edit')} Cancel`, goMain, 'btn cancel')
  ));

  return root;
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
      button('Erase', () => fields.status.value = '', 'chip-btn danger'),
      editableStatuses(refs).map(([name, emoji]) => button(emoji || name, () => {
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

function quickPick(map, cb) {
  return el('div', { class: 'quick-row' }, Object.entries(map || {}).map(([name, emoji]) => button(`${emoji} ${name}`, () => cb(name), 'chip-btn')));
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
