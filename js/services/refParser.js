import { refData, templateEntry } from '../models.js';
import { normalizeStr } from '../utils/normalize.js';
import { cell } from '../utils/sheetFieldParsers.js';

function addLookup(target, key, value) {
  if (!key) return;

  target[key] = value || '';

  const normalized = normalizeStr(key);
  if (normalized && normalized !== key) {
    target[normalized] = value || '';
  }
}

function addImage(data, key, url) {
  if (!key || !url) return;

  data.eventImages[normalizeStr(key)] = url;
  data.locationImages[normalizeStr(key)] = url;
}

export function parseRefRows(rows = []) {
  const data = refData();

  rows.forEach(row => {
    const btnId = cell(row, 0);
    if (btnId) data.buttons[btnId] = cell(row, 1);

    const status = cell(row, 2);
    if (status) addLookup(data.statuses, status, cell(row, 3));

    const loc = cell(row, 4);
    if (loc) addLookup(data.locations, loc, cell(row, 5));

    const event = cell(row, 6);
    if (event) addLookup(data.events, event, cell(row, 7));

    addImage(data, cell(row, 8), cell(row, 9));

    const sched = cell(row, 10);
    if (sched) addLookup(data.schedules, sched, cell(row, 11));

    const targetRaw = cell(row, 12);
    const templateText = cell(row, 13);

    if (targetRaw) {
      const [target, name = 'Template'] = targetRaw.split(',');
      data.templates.push(templateEntry(target.trim(), name.trim() || 'Template', templateText));
    }

    const ui = cell(row, 14);
    if (ui) {
      data.colorsLight[ui] = cell(row, 15);
      data.colorsDark[ui] = cell(row, 16);
    }
  });

  return data;
}
