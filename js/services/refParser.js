import { refData, templateEntry } from '../models.js';
import { normalizeStr } from '../utils/normalize.js';
const cell = (row, i) => (row?.[i] ?? '').toString().trim();
export function parseRefRows(rows=[]) {
  const data = refData();
  rows.forEach(row => {
    const btnId = cell(row,0); if (btnId) data.buttons[btnId] = cell(row,1);
    const status = cell(row,2); if (status) data.statuses[status] = cell(row,3);
    const loc = cell(row,4); if (loc) data.locations[loc] = cell(row,5);
    const event = cell(row,6); if (event) data.events[event] = cell(row,7);
    const imageKey = cell(row,8), imageUrl = cell(row,9); if (imageKey && imageUrl) { data.eventImages[normalizeStr(imageKey)] = imageUrl; data.locationImages[normalizeStr(imageKey)] = imageUrl; }
    const sched = cell(row,10); if (sched) data.schedules[sched] = cell(row,11);
    const targetRaw = cell(row,12), templateText = cell(row,13); if (targetRaw) { const parts = targetRaw.split(','); data.templates.push(templateEntry(parts[0].trim(), (parts[1] || 'Template').trim(), templateText)); }
    const ui = cell(row,14); if (ui) { data.colorsLight[ui] = cell(row,15); data.colorsDark[ui] = cell(row,16); }
  });
  return data;
}
