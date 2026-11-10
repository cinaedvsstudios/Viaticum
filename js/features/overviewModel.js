export const FIELDS = [
  ['location', 'Location'], ['event', 'Event'], ['schedule', 'Schedule'],
  ['status', 'Status'], ['details', 'Details'], ['links', 'Links'], ['tripName', 'Trip ID']
];
export const FIELD_COLUMNS = { location: 2, event: 3, status: 4, schedule: 5, details: 6, links: 7, tripName: 8 };
export const text = value => String(value ?? '').replace(/\r\n?/g, '\n');
export const tokens = value => text(value).split(/[|,]/).map(s => s.trim()).filter(Boolean);
export const unique = items => [...new Set(items.filter(Boolean))];
export const hasContent = entry => FIELDS.some(([key]) => text(entry?.[key]).trim());
export const norm = value => text(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const d = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value;
}
export function berlinToday(now = new Date()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = type => p.find(v => v.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function shiftDate(date, days) {
  const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function monthRange(month = berlinToday().slice(0, 7)) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Choose a valid month.');
  const d = new Date(month + '-01T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0);
  return { from: `${month}-01`, to: d.toISOString().slice(0, 10) };
}
export function initialFilters() {
  return { ...monthRange(), query: '', status: '', location: '', venue: '', tripName: '', source: '', preset: 'month' };
}
export function mergeField(field, before, incoming, mode = 'append') {
  const old = text(before), next = text(incoming).trim();
  if (mode === 'clear') return '';
  if (!next) return old;
  if (mode === 'replace') return next;
  if (mode !== 'append') throw new Error('Choose Append, Replace or Clear.');
  if (['status', 'event', 'location'].includes(field)) {
    return unique([...tokens(old), ...tokens(next)]).join(field === 'status' ? '|' : ', ');
  }
  if (field === 'tripName') return next; // A day has one trip membership.
  return unique([...old.split('\n'), ...next.split('\n')].map(s => s.trim()).filter(Boolean)).join('\n');
}
export function makeBulkChanges(entries, dates, patches) {
  const wanted = new Set(dates), changes = [];
  for (const entry of entries) {
    if (!wanted.has(entry.date)) continue;
    for (const [field, patch] of Object.entries(patches)) {
      if (!(field in FIELD_COLUMNS) || !patch.enabled) continue;
      const before = text(entry[field]);
      const after = mergeField(field, before, patch.value, patch.mode);
      if (before !== after) changes.push({ date: entry.date, rowIndex: entry.rowIndex, field, before, after });
    }
  }
  return changes;
}
export function filterDays(entries, filters, records = []) {
  const byDate = new Map();
  for (const record of records) byDate.set(record.date, [...(byDate.get(record.date) || []), record]);
  return entries.filter(e => {
    const imported = byDate.get(e.date) || [];
    if (!hasContent(e)) return false;
    if (filters.from && e.date < filters.from || filters.to && e.date > filters.to) return false;
    if (filters.status && !tokens(e.status).includes(filters.status)) return false;
    if (filters.location && !tokens(e.location).includes(filters.location)) return false;
    if (filters.tripName && e.tripName !== filters.tripName) return false;
    if (filters.source && (filters.source === 'personal' ? imported.length : !imported.some(r => r.source === filters.source))) return false;
    if (filters.venue && !imported.some(r => r.venue === filters.venue)) return false;
    if (filters.query) {
      const haystack = norm([e.date, ...FIELDS.map(([key]) => e[key]), ...imported.flatMap(r => [r.venue, r.bookingReference, r.event, r.sourceId])].join(' '));
      if (!norm(filters.query).split(' ').every(word => haystack.includes(word))) return false;
    }
    return true;
  });
}
export function tripWarning(entries, dates, tripName) {
  if (!tripName.trim()) return '';
  const members = entries.filter(e => dates.has(e.date) || e.tripName === tripName);
  if (new Set(members.map(e => e.date)).size < 2) return 'A trip must cover more than one date.';
  if (members.every(e => !e.location || tokens(e.location).every(city => norm(city) === 'berlin'))) return 'A trip must include a location outside Berlin.';
  return '';
}
