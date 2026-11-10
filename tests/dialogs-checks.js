// Isolated browser QA for Viaticum app-owned dialogs. Run tests/qa.html?dialogs=1.
// No Google Sheet writes are performed by these checks.
import { pickDate, pickMonth, promptText, confirmAction } from '../js/components/appDialogs.js';

const results = [];
const assert = (condition, label) => {
  if (!condition) throw new Error(label);
  results.push(label);
};
const nextPaint = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const primary = () => document.querySelector('.vtm-dialog-panel .vtm-dialog-primary');
const cancel = () => document.querySelector('.vtm-dialog-panel .vtm-dialog-secondary');
const allDays = () => [...document.querySelectorAll('.vtm-date-day')];

try {
  const datePromise = pickDate({
    title: 'Copy to date', initialDate: '2026-11-28', excludeDate: '2026-11-28',
    availableDates: ['2026-11-28', '2026-11-29'], occupiedDates: ['2026-11-29'],
    confirmLabel: 'Copy to selected date'
  });
  await nextPaint();
  assert(Boolean(document.querySelector('.vtm-dialog-panel')), 'Custom date picker opens');
  const source = allDays().find(day => day.textContent.trim() === '28');
  const destination = allDays().find(day => day.textContent.trim() === '29');
  const unsupported = allDays().find(day => day.textContent.trim() === '27');
  assert(source?.disabled && unsupported?.disabled, 'Source and unwritable dates cannot be selected');
  assert(destination && !destination.disabled && destination.classList.contains('occupied'), 'Occupied destination is marked but selectable');
  assert(primary()?.disabled, 'No destination can be confirmed before selection');
  destination.click(); await nextPaint();
  assert(!primary()?.disabled, 'Choosing a valid destination enables confirmation');
  primary().click();
  assert(await datePromise === '2026-11-29', 'Date picker returns the chosen ISO date');
  assert(!document.querySelector('.vtm-dialog-backdrop'), 'Date dialog is removed on completion');

  const canceledDate = pickDate({ initialDate: '2026-11-28' });
  await nextPaint(); cancel().click();
  assert(await canceledDate === null, 'Cancel returns no date');

  const textPromise = promptText({ title: 'Name new trip', confirmLabel: 'Continue' });
  await nextPaint();
  const input = document.querySelector('.vtm-dialog-text-input');
  assert(document.activeElement === input, 'Text-entry field receives focus');
  input.value = 'Cologne weekend';
  primary().click();
  assert(await textPromise === 'Cologne weekend', 'Custom text prompt returns the entered value');

  const confirmed = confirmAction({ title: 'Replace existing day?', danger: true });
  await nextPaint(); cancel().click();
  assert(await confirmed === false, 'Canceling a destructive confirmation returns false');

  const monthPromise = pickMonth({ initialMonth: '2026-11' });
  await nextPaint();
  const december = [...document.querySelectorAll('.vtm-month-option')][11];
  december.click(); primary().click();
  assert(await monthPromise === '2026-12', 'Custom month picker returns YYYY-MM');

  const report = document.createElement('aside');
  report.id = 'dialog-qa-results';
  report.style = 'position:fixed;bottom:0;right:0;z-index:9999;background:#dff5e8;color:#154f31;padding:12px;font:14px system-ui';
  report.textContent = 'PASS: ' + results.length + ' dialog checks';
  document.body.append(report);
} catch (error) {
  const report = document.createElement('aside');
  report.id = 'dialog-qa-results';
  report.style = 'position:fixed;top:0;left:0;z-index:9999;background:#fdd;color:#700;padding:18px;white-space:pre-wrap;font:14px system-ui';
  report.textContent = 'FAIL: ' + String(error.stack || error) + '\nPassed: ' + results.join('; ');
  document.body.append(report);
}
