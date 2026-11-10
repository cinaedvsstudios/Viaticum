import { FIELDS, FIELD_COLUMNS, text, norm, tokens, unique, validDate, mergeField } from './overviewModel.js';
import { blankEntry } from '../models.js';

const clock = value => !value || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const clean = value => typeof value === 'string' ? value.trim() : '';
const linksText = links => {
  if (!links) return '';
  if (!Array.isArray(links)) throw new Error('Links must be a list of { name, url } objects.');
  return links.map(link => {
    if (!/^https?:\/\//i.test(link.url || '')) throw new Error('A link must start with https:// or http://.');
    return `${clean(link.name) || 'Booking'} - ${link.url.trim()}`;
  }).join('\n');
};
function scheduleLine(record) {
  const dayOffset = record.endDate && record.endDate > record.date ? Math.round((Date.parse(record.endDate) - Date.parse(record.date)) / 86400000) : record.startTime && record.endTime < record.startTime ? 1 : 0;
  const end = record.endTime ? `–${record.endTime}${dayOffset ? ` (+${dayOffset} day${dayOffset === 1 ? '' : 's'})` : ''}` : '';
  const name = [record.event, record.venue && norm(record.venue) !== norm(record.event) ? record.venue : ''].filter(Boolean).join(' — ');
  return `${record.startTime ? record.startTime + end + ': ' : record.endTime ? `Ends ${record.endTime}: ` : ''}${name}`;
}
function common(record) {
  if (!record.sourceId || !record.event || !validDate(record.date)) throw new Error('An ID, event name and valid YYYY-MM-DD date are required.');
  if (!clock(record.startTime) || !clock(record.endTime)) throw new Error('Times must use 24-hour HH:MM, or be blank.');
  if (record.endDate && (!validDate(record.endDate) || record.endDate < record.date)) throw new Error('The arrival/end date must be on or after the start date.');
  return { ...record, id: `${record.source}:${record.sourceId}`, schedule: record.schedule || scheduleLine(record), warnings: record.warnings || [] };
}
export function parseBackroom(input) {
  if (!Array.isArray(input)) throw new Error('A Backroom export must be a JSON array of events.');
  return parseEach(input, (row) => common({
    source: 'backroom', sourceId: clean(row.Event_ID), date: clean(row.Event_Date), event: clean(row.Event_Name),
    location: clean(row.City), venue: clean(row.Venue_Name), startTime: clean(row.Event_Start_Time), endTime: clean(row.Event_End_Time),
    status: 'Maybe', details: '', links: '', bookingId: '', bookingReference: '',
    warnings: [!row.City ? 'No city supplied.' : '', row.Status && row.Status !== 'Live' ? `Backroom source status: ${row.Status}.` : '', clean(row.Flag_Reason)].filter(Boolean)
  }));
}
function parseEach(rows, convert) {
  const items = [], errors = [], ids = new Set();
  rows.forEach((row, index) => {
    try {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Expected a record object.');
      const converted = [convert(row)].flat();
      for (const record of converted) {
        if (ids.has(record.id)) { errors.push({ index: index + 1, name: record.event, message: `Repeated ID in file: ${record.sourceId}. Remove the duplicate before importing.` }); continue; }
        ids.add(record.id); items.push(record);
      }
    } catch (error) { errors.push({ index: index + 1, name: row?.Event_Name || row?.name || '', message: error.message }); }
  });
  return { items, errors, supplied: rows.length };
}
export function parseAI(input) {
  if (input?.schemaVersion !== 'viaticum-import-v1' || !Array.isArray(input.records)) throw new Error('Use schemaVersion "viaticum-import-v1" and a records array. Download the example from this import screen.');
  return parseEach(input.records, row => {
    if (row.confirmed !== true) throw new Error('Only confirmed tickets and reservations can be imported. confirmed must be true.');
    if (!['event', 'train', 'flight', 'travel', 'activity', 'hotel'].includes(row.type)) throw new Error('Unknown record type. Use event, train, flight, travel, activity or hotel.');
    const base = {
      source: 'ai', sourceId: clean(row.id), bookingId: clean(row.bookingId || row.id),
      event: clean(row.name), location: clean(row.location), venue: clean(row.venue),
      status: 'Booked', bookingReference: clean(row.bookingReference), matchEventId: clean(row.matchEventId),
      links: linksText(row.links), details: '', warnings: []
    };
    const details = [base.bookingReference ? `Booking reference: ${base.bookingReference}` : '', clean(row.details),
      row.seat ? `Seat: ${clean(row.seat)}` : '', row.carriage ? `Carriage: ${clean(row.carriage)}` : '',
      row.price ? `Price: ${clean(String(row.price))}${row.currency ? ' ' + clean(row.currency) : ''}` : '',
      row.paymentStatus ? `Payment: ${clean(row.paymentStatus)}` : ''
    ].filter(Boolean).join('\n');
    if (row.type === 'hotel') {
      if (!base.sourceId || !base.event || !validDate(row.checkIn?.date) || !validDate(row.checkOut?.date) || row.checkOut.date <= row.checkIn.date) throw new Error('A hotel needs an ID, name, and check-out date after check-in.');
      if (!clock(row.checkIn?.time) || !clock(row.checkOut?.time)) throw new Error('Hotel times must be HH:MM or blank.');
      const stay = `Stay: ${row.checkIn.date} to ${row.checkOut.date}`;
      return [['check-in', row.checkIn], ['check-out', row.checkOut]].map(([kind, endpoint]) => common({
        ...base, sourceId: `${base.sourceId}:${kind}`, event: `${base.event} — ${kind}`,
        date: endpoint.date, startTime: clean(endpoint.time), endTime: '',
        stayStart: row.checkIn.date, stayEnd: row.checkOut.date,
        details: `Info: ${base.event}\n${stay}${details ? '\n' + details : ''}`
      }));
    }
    const route = [clean(row.departure), clean(row.arrival)].filter(Boolean).join(' → ');
    return common({ ...base, date: clean(row.date), startTime: clean(row.time), endTime: clean(row.endTime), endDate: clean(row.endDate),
      details: [`Info: ${base.event}`, route, row.endDate ? `Arrival: ${row.endDate}${row.endTime ? ' ' + row.endTime : ''}` : '', details].filter(Boolean).join('\n') });
  });
}
function sameName(a, b) {
  const x = norm(a), y = norm(b);
  return !!x && !!y && (x === y || Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x)));
}
function canonicalLocation(city, entries, date) {
  const aliases = [['cologne', 'koln'], ['munich', 'munchen'], ['nuremberg', 'nurnberg']];
  const names = unique([...entries.filter(e => e.date === date), ...entries].flatMap(e => tokens(e.location)));
  const equivalent = aliases.find(group => group.includes(norm(city)));
  return names.find(name => norm(name) === norm(city) || equivalent?.includes(norm(name))) || city;
}
export function prepareImport(parsed, existingRecords, entries) {
  return parsed.items.map(original => {
    const record = { ...original, location: canonicalLocation(original.location, entries, original.date) };
    const duplicate = existingRecords.find(r => r.source === record.source && (r.sourceId === record.sourceId || record.source === 'ai' && record.bookingReference && r.bookingReference === record.bookingReference && r.date === record.date && norm(r.event) === norm(record.event) && r.startTime === record.startTime));
    if (duplicate) return { record, kind: 'duplicate', choice: 'skip', matchId: '', reason: 'Already imported; existing edits will be preserved.' };
    const candidates = existingRecords.filter(r => r.date === record.date && (
      record.matchEventId ? r.source === 'backroom' && r.sourceId === record.matchEventId :
        sameName(r.event, record.event) || record.venue && sameName(r.venue, record.venue)
    ));
    const day = entries.find(e => e.date === record.date);
    const legacyMatch = day && (tokens(day.event).some(name => sameName(name, record.event) || record.venue && sameName(name, record.venue)));
    const warnings = [...record.warnings];
    if (record.matchEventId && !candidates.length) warnings.push('The supplied Backroom event ID was not found on this date. Choose a match or add separately.');
    const certain = candidates.length === 1 && !!record.matchEventId;
    return { record, candidates, day, warnings, kind: candidates.length || legacyMatch || warnings.length ? 'review' : day && FIELDS.some(([k]) => day[k]) ? 'merge' : 'new',
      choice: certain ? 'match' : 'merge', matchId: certain ? candidates[0].id : '', legacyMatch: !!legacyMatch,
      reason: candidates.length > 1 ? 'Several possible matches. Choose the event explicitly.' : candidates.length || legacyMatch ? 'Possible existing activity. Review before saving.' : warnings.join(' ') };
  });
}
function mergeSchedule(current, incoming) {
  const old = current.split('\n').filter(Boolean), next = incoming.split('\n').filter(Boolean);
  return unique([...old, ...next]).map((line, index) => ({ line, index, time: line.match(/^(\d{2}:\d{2})/)?.[1] || '99:99' }))
    .sort((a, b) => a.time.localeCompare(b.time) || a.index - b.index).map(v => v.line).join('\n');
}
export function buildImportPlan(items, book, overrides = {}) {
  const originals = new Map(book.entries.map(e => [e.date, e]));
  const days = new Map(book.entries.map(e => [e.date, { ...e }]));
  const records = [], recordUpdates = new Map();
  let mainRow = book.nextMainRow, eventRow = book.nextRecordRow;
  for (const item of items) {
    if (item.choice === 'skip' || item.kind === 'duplicate') continue;
    const record = { ...item.record, importedAt: new Date().toISOString(), rowIndex: eventRow++ };
    let day = days.get(record.date);
    if (!day) { day = blankEntry(record.date, mainRow++); days.set(record.date, day); }
    let match;
    if (item.choice === 'match') {
      if (item.matchId === 'day') {
        if (!originals.has(record.date)) throw new Error('The selected day match no longer exists.');
      } else {
        match = book.records.find(r => r.id === item.matchId && r.date === record.date);
        if (!match) throw new Error('Choose which existing event to match, or choose Merge.');
      }
    }
    for (const field of ['location', 'event']) day[field] = mergeField(field, day[field], record[field]);
    if (item.choice !== 'match') day.schedule = mergeSchedule(day.schedule, record.schedule);
    else if (!day.schedule) day.schedule = record.schedule;
    // Confirmation can promote an explicitly matched Maybe without changing other events' status.
    const othersMaybe = book.records.some(r => r.date === record.date && r.id !== match?.id && r.status === 'Maybe');
    if (record.source === 'ai' && item.choice === 'match' && !othersMaybe && tokens(originals.get(record.date)?.event).length <= 1) {
      day.status = tokens(day.status).filter(s => s !== 'Maybe').join('|');
    }
    day.status = mergeField('status', day.status, record.status);
    for (const field of ['details', 'links']) day[field] = mergeField(field, day[field], record[field]);
    if (match && record.source === 'ai' && match.status !== 'Booked') recordUpdates.set(match.id, { ...match, previous: match, status: 'Booked', bookingId: record.bookingId, bookingReference: record.bookingReference });
    records.push(record);
  }
  for (const [date, patches] of Object.entries(overrides)) {
    const day = days.get(date);
    if (day) for (const [field, value] of Object.entries(patches)) if (field in FIELD_COLUMNS) day[field] = text(value);
  }
  const changes = [], dateCells = [];
  for (const [date, day] of days) {
    const before = originals.get(date) || blankEntry(date, day.rowIndex), isNew = !originals.has(date);
    if (isNew) dateCells.push({ rowIndex: day.rowIndex, column: 0, before: '', after: date, date, newDay: true });
    for (const [field] of FIELDS) if (text(before[field]) !== text(day[field])) changes.push({ date, rowIndex: day.rowIndex, field, before: text(before[field]), after: text(day[field]), newDay: isNew });
  }
  return { changes, dateCells, records: [...recordUpdates.values(), ...records], days: [...days.values()], added: records.length, skipped: items.filter(i => i.choice === 'skip' || i.kind === 'duplicate').length };
}
export const AI_EXAMPLE = {
  schemaVersion: 'viaticum-import-v1',
  records: [
    { id: 'EXAMPLE-HOTEL-REFERENCE', type: 'hotel', confirmed: true, name: 'Example hotel', location: 'Cologne', bookingReference: 'EXAMPLE123', checkIn: { date: '2026-11-26', time: '15:00' }, checkOut: { date: '2026-11-29', time: '' }, details: 'Example reservation notes. Replace this example with extracted information.', links: [] },
    { id: 'EXAMPLE-TRAIN-REFERENCE-OUTBOUND', type: 'train', confirmed: true, name: 'Train to Cologne', location: 'Cologne', date: '2026-11-26', time: '10:00', departure: 'Berlin Hbf', arrival: 'Köln Hbf', bookingReference: 'EXAMPLE456', seat: '42', carriage: '8', links: [] }
  ]
};
