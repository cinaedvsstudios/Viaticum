import { el, button } from '../utils/dom.js';
import { todayIso } from '../utils/dates.js';

// Viaticum-owned dialogs deliberately live outside #app so state refreshes never
// replace an open dialog or discard unsaved Edit Day / Overview text.
let dialogNumber = 0;

function makeDialog(title, description, createContent, tone = 'info') {
  return new Promise(resolve => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const id = 'vtm-dialog-' + (++dialogNumber);
    const backdrop = el('div', { class: 'vtm-dialog-backdrop' });
    const panel = el('section', { class: 'vtm-dialog-panel vtm-dialog-' + tone, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': id });
    const heading = el('header', { class: 'vtm-dialog-heading' },
      el('h2', { id }, title),
      button('✕', () => finish(null), 'vtm-dialog-close')
    );
    const body = el('div', { class: 'vtm-dialog-body' });
    const footer = el('footer', { class: 'vtm-dialog-actions' });
    if (description) body.append(el('p', { class: 'vtm-dialog-description' }, description));
    let finished = false;
    function finish(value) {
      if (finished) return;
      finished = true;
      backdrop.remove();
      document.body.style.overflow = previousOverflow;
      previousFocus?.isConnected && previousFocus.focus({ preventScroll: true });
      resolve(value);
    }
    backdrop.addEventListener('click', event => { if (event.target === backdrop) finish(null); });
    backdrop.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(null); }
      if (event.key !== 'Tab') return;
      const focusable = [...panel.querySelectorAll('button,input,textarea,select,[tabindex]')].filter(node => !node.disabled && node.tabIndex !== -1);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    createContent(body, footer, finish);
    panel.append(heading, body, footer);
    backdrop.append(panel);
    document.body.append(backdrop);
    document.body.style.overflow = 'hidden';
    queueMicrotask(() => panel.querySelector('[data-vtm-initial-focus]')?.focus({ preventScroll: true }) || panel.querySelector('.vtm-dialog-actions button')?.focus({ preventScroll: true }));
  });
}

export async function confirmAction({ title = 'Please confirm', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false } = {}) {
  const result = await makeDialog(title, message, (body, footer, finish) => {
    footer.append(
      button(cancelLabel, () => finish(false), 'vtm-dialog-button vtm-dialog-secondary'),
      button(confirmLabel, () => finish(true), 'vtm-dialog-button ' + (danger ? 'vtm-dialog-danger-button' : 'vtm-dialog-primary'))
    );
  }, danger ? 'warning' : 'info');
  return result === true;
}

export async function promptText({ title = 'Enter text', message = '', initialValue = '', placeholder = '', confirmLabel = 'Save', required = true } = {}) {
  return makeDialog(title, message, (body, footer, finish) => {
    const input = el('input', { class: 'vtm-dialog-text-input', type: 'text', value: initialValue, placeholder, 'aria-label': title, 'data-vtm-initial-focus': 'true' });
    const feedback = el('p', { class: 'vtm-dialog-feedback', role: 'status' });
    const accept = () => {
      const value = input.value.trim();
      if (required && !value) { feedback.textContent = 'Enter a value to continue.'; input.focus(); return; }
      finish(value);
    };
    input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); accept(); } });
    body.append(input, feedback);
    footer.append(button('Cancel', () => finish(null), 'vtm-dialog-button vtm-dialog-secondary'), button(confirmLabel, accept, 'vtm-dialog-button vtm-dialog-primary'));
  });
}

export async function showNotice({ title = 'Information', message = '' } = {}) {
  await makeDialog(title, message, (body, footer, finish) => {
    footer.append(button('OK', () => finish(true), 'vtm-dialog-button vtm-dialog-primary'));
  });
}

function validIso(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false;
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(year, month - 1, day);
  return value.getFullYear() === year && value.getMonth() === month - 1 && value.getDate() === day;
}
function iso(year, month, day) {
  return String(year).padStart(4, '0') + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}
function readable(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export async function pickDate({
  title = 'Choose a date', message = '', initialDate = todayIso(), selectedDate = '',
  availableDates = null, occupiedDates = [], excludeDate = '',
  confirmLabel = 'Choose date'
} = {}) {
  const initial = validIso(initialDate) ? initialDate : todayIso();
  const allowed = Array.isArray(availableDates) ? new Set(availableDates.filter(validIso)) : null;
  const occupied = new Set(occupiedDates);
  let selected = validIso(selectedDate) && selectedDate !== excludeDate && (!allowed || allowed.has(selectedDate)) ? selectedDate : '';
  let [year, month] = initial.split('-').map(Number);
  return makeDialog(title, message, (body, footer, finish) => {
    const calendar = el('div', { class: 'vtm-date-calendar' });
    const selection = el('div', { class: 'vtm-date-selection', role: 'status' });
    const submit = button(confirmLabel, () => selected && finish(selected), 'vtm-dialog-button vtm-dialog-primary');
    const nav = el('div', { class: 'vtm-date-nav' });
    const grid = el('div', { class: 'vtm-date-grid', role: 'group', 'aria-label': 'Dates' });
    const note = el('div', { class: 'vtm-date-legend' },
      el('span', {}, el('i', { class: 'vtm-date-legend-dot' }), ' Date already has information'),
      allowed ? el('span', {}, 'Faded dates are not writable in the sheet') : ''
    );
    const redraw = () => {
      nav.replaceChildren(
        button('‹', () => { month--; if (month < 1) { month = 12; year--; } redraw(); }, 'vtm-date-arrow'),
        el('strong', {}, new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })),
        button('›', () => { month++; if (month > 12) { month = 1; year++; } redraw(); }, 'vtm-date-arrow')
      );
      grid.replaceChildren();
      ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(day => grid.append(el('span', { class: 'vtm-date-weekday' }, day)));
      const start = (new Date(year, month - 1, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let i = 0; i < start; i++) grid.append(el('span', { class: 'vtm-date-empty' }));
      for (let day = 1; day <= daysInMonth; day++) {
        const value = iso(year, month, day);
        const disabled = value === excludeDate || (allowed && !allowed.has(value));
        const b = button(String(day), () => { selected = value; redraw(); }, 'vtm-date-day' +
          (value === selected ? ' selected' : '') +
          (value === todayIso() ? ' today' : '') +
          (occupied.has(value) ? ' occupied' : ''));
        b.disabled = Boolean(disabled);
        b.setAttribute('aria-label', readable(value) + (occupied.has(value) ? ' — contains information' : ''));
        b.setAttribute('aria-pressed', String(value === selected));
        if (value === excludeDate) b.title = 'This is the original date';
        else if (allowed && !allowed.has(value)) b.title = 'No writable sheet row for this date';
        grid.append(b);
      }
      selection.textContent = selected ? 'Selected: ' + readable(selected) + (occupied.has(selected) ? ' · Contains existing information' : '') : 'Select a destination date.';
      submit.disabled = !selected;
    };
    calendar.append(nav, grid, note, selection);
    body.append(calendar);
    footer.append(button('Cancel', () => finish(null), 'vtm-dialog-button vtm-dialog-secondary'), submit);
    redraw();
  });
}

export async function pickMonth({ title = 'Choose month', message = '', initialMonth = '' } = {}) {
  const fallback = todayIso().slice(0, 7);
  const parsed = /^\d{4}-\d{2}$/.test(initialMonth) ? initialMonth : fallback;
  let year = Number(parsed.slice(0, 4));
  let selected = parsed;
  return makeDialog(title, message, (body, footer, finish) => {
    const nav = el('div', { class: 'vtm-date-nav' });
    const months = el('div', { class: 'vtm-month-grid' });
    const submit = button('Choose month', () => finish(selected), 'vtm-dialog-button vtm-dialog-primary');
    const redraw = () => {
      nav.replaceChildren(button('‹', () => { year--; redraw(); }, 'vtm-date-arrow'), el('strong', {}, String(year)), button('›', () => { year++; redraw(); }, 'vtm-date-arrow'));
      months.replaceChildren(...Array.from({ length: 12 }, (_, i) => {
        const value = iso(year, i + 1, 1).slice(0, 7);
        const b = button(new Date(year, i, 1).toLocaleDateString(undefined, { month: 'short' }), () => { selected = value; redraw(); }, 'vtm-month-option' + (selected === value ? ' selected' : ''));
        b.setAttribute('aria-pressed', String(selected === value));
        return b;
      }));
    };
    body.append(nav, months);
    footer.append(button('Cancel', () => finish(null), 'vtm-dialog-button vtm-dialog-secondary'), submit);
    redraw();
  });
}
