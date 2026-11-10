import test from 'node:test';
import assert from 'node:assert/strict';
import { FIELDS, makeBulkChanges, mergeField, filterDays, berlinToday, validDate, monthRange, tripWarning } from '../js/features/overviewModel.js';
import { parseBackroom, parseAI, prepareImport, buildImportPlan, AI_EXAMPLE } from '../js/features/importModel.js';
import { blankEntry } from '../js/models.js';

const day = (date, data = {}, rowIndex = 2) => ({ ...blankEntry(date, rowIndex), ...data });
const sample = (data = {}) => ({ Event_ID: 'event-1', Event_Date: '2026-11-21', Event_Name: 'PIPE', City: 'Cologne', Venue_Name: 'PIPE Party Cologne', Event_Start_Time: '22:00', Event_End_Time: '06:00', Status: 'Live', Event_Description: 'Must not be imported', Dresscode_Info: 'Must not be imported', Ticket_URL: 'https://example.com', ...data });
test('weekend append modifies only checked Details fields and keeps different events', () => {
  const entries = [day('2026-11-26', { event: 'Leave', details: 'Existing note', schedule: '10:00: Train' }), day('2026-11-27', { event: 'Red', details: 'Other note' }, 3), day('2026-11-28', { event: 'Sexy' }, 4), day('2026-11-29', { event: 'Home' }, 5)];
  const changes = makeBulkChanges(entries, entries.map(e => e.date), { details: { enabled: true, mode: 'append', value: 'Hotel changed' }, event: { enabled: false, mode: 'replace', value: 'Wrong' } });
  assert.equal(changes.length, 4); assert.ok(changes.every(c => c.field === 'details'));
  assert.equal(changes[0].after, 'Existing note\nHotel changed'); assert.equal(entries[1].event, 'Red');
});
test('replace across five selected dates preserves untouched dates and clear must be explicit', () => {
  const entries = Array.from({ length: 6 }, (_, i) => day(`2026-11-0${i + 4}`, { event: 'Maspalomas winter pride', status: 'Booked', details: 'Personal notes' }, i + 2));
  const changes = makeBulkChanges(entries, entries.slice(0,5).map(e => e.date), { status: { enabled: true, mode: 'replace', value: 'Not going' } });
  assert.equal(changes.length, 5); assert.ok(changes.every(c => c.after === 'Not going')); assert.ok(changes.every(c => c.date !== '2026-11-09'));
  assert.equal(mergeField('details', 'Preserve me', '', 'replace'), 'Preserve me');
  assert.equal(mergeField('details', 'Clear me', '', 'clear'), '');
});
test('status and link append are idempotent; multiple booking statuses survive', () => {
  assert.equal(mergeField('status', 'Booked', 'Maybe', 'append'), 'Booked|Maybe');
  assert.equal(mergeField('status', 'Booked|Maybe', 'Maybe', 'append'), 'Booked|Maybe');
  assert.equal(mergeField('links', 'Hotel - https://example.com', 'Hotel - https://example.com'), 'Hotel - https://example.com');
});
test('Berlin month is explicit and real calendar dates are validated', () => {
  assert.equal(berlinToday(new Date('2026-10-31T23:30:00Z')), '2026-11-01');
  assert.equal(validDate('2026-02-30'), false); assert.equal(validDate('2028-02-29'), true);
  assert.deepEqual(monthRange('2026-11'), { from: '2026-11-01', to: '2026-11-30' });
});
test('filters include notes-only and trip-only days and search booking references', () => {
  const entries = [day('2026-11-20', { details: 'Hotel note' }), day('2026-11-21', { tripName: 'Cologne weekend' },3), day('2026-11-22', {},4)];
  assert.equal(filterDays(entries, {}).length, 2);
  assert.equal(filterDays(entries, { query: 'ABC123' }, [{ date: '2026-11-21', bookingReference: 'ABC123' }])[0].date, '2026-11-21');
  assert.equal(filterDays(entries, { source: 'personal' }, [{ date: '2026-11-21', source: 'ai' }]).length, 1);
});
test('new trips require multiple dates and an outside-Berlin location', () => {
  const entries = [day('2026-11-20', { location: 'Berlin' }), day('2026-11-21', { location: 'Berlin' },3)];
  assert.match(tripWarning(entries,new Set(['2026-11-20']),'Trip'), /more than one/);
  assert.match(tripWarning(entries,new Set(entries.map(e => e.date)),'Trip'), /outside Berlin/);
  entries[1].location = 'Köln'; assert.equal(tripWarning(entries,new Set(entries.map(e => e.date)),'Trip'), '');
});
test('Backroom imports only explicit date/time/location/name, Maybe and no recurrence expansion', () => {
  const parsed = parseBackroom([sample({ Recurrence_Type: 'Weekly', Recurrence_Until: '2027-12-31' })]);
  assert.equal(parsed.items.length, 1); assert.equal(parsed.errors.length, 0);
  const record = parsed.items[0]; assert.equal(record.status, 'Maybe'); assert.equal(record.details, ''); assert.equal(record.links, '');
  assert.match(record.schedule, /^22:00–06:00 \(\+1 day\): PIPE/);
  assert.ok(!JSON.stringify(record).includes('Must not be imported'));
});
test('missing times remain unspecified; invalid data and source warnings are reported', () => {
  const parsed = parseBackroom([sample({ Event_Start_Time:'', Event_End_Time:'', Status:'Hold' }), sample({ Event_ID:'bad', Event_Date:'2026-02-30' }), sample({ Event_ID:'bad-clock',Event_Start_Time:'25:00' })]);
  assert.equal(parsed.items.length, 1); assert.equal(parsed.errors.length, 2);
  assert.equal(parsed.items[0].startTime, ''); assert.match(parsed.items[0].warnings[0], /Hold/);
});
test('location spelling follows the target day before other days and end-only times are retained', () => {
  const parsed = parseBackroom([sample({Event_Start_Time:'',Event_End_Time:'01:00'})]);
  const entries=[day('2026-11-20',{location:'Cologne'}),day('2026-11-21',{location:'Köln'},3)];
  assert.equal(prepareImport(parsed,[],entries)[0].record.location,'Köln');
  assert.match(parsed.items[0].schedule,/Ends 01:00/);
});
test('duplicate IDs in a file are reported and existing imported IDs are skipped', () => {
  const parsed = parseBackroom([sample(), sample()]); assert.equal(parsed.errors.length, 1);
  const records = [{ ...parsed.items[0], status: 'Booked' }];
  const prepared = prepareImport(parsed, records, []); assert.equal(prepared[0].choice, 'skip'); assert.equal(prepared[0].kind, 'duplicate');
  const plan = buildImportPlan(prepared, { entries:[], records, nextMainRow:2, nextRecordRow:3 }); assert.equal(plan.records.length,0);
});
test('two parties on one day become separate chronological Schedule lines without losing personal data', () => {
  const parsed = parseBackroom([sample(), sample({ Event_ID:'event-2', Event_Name:'Phoenix party', Venue_Name:'Phoenix', Event_Start_Time:'20:00', Event_End_Time:'00:00' })]);
  const entries = [day('2026-11-21', { location:'Cologne', event:'Train', status:'Booked', schedule:'10:00: Train', details:'Keep this hotel', tripName:'Weekend' })];
  const book = { entries, records:[], nextMainRow:3, nextRecordRow:2 };
  const plan = buildImportPlan(prepareImport(parsed,[],entries),book);
  assert.equal(plan.days.length,1); assert.equal(plan.days[0].schedule.split('\n').length,3);
  assert.match(plan.days[0].schedule,/10:00.*\n20:00.*\n22:00/s); assert.equal(plan.days[0].status,'Booked|Maybe');
  assert.equal(plan.days[0].details,'Keep this hotel'); assert.equal(plan.days[0].tripName,'Weekend'); assert.equal(plan.records.length,2);
});
test('confirmed hotel creates check-in/out only, retaining stay dates and common booking ID', () => {
  const parsed = parseAI({ ...AI_EXAMPLE, records:[AI_EXAMPLE.records[0]] });
  assert.equal(parsed.errors.length,0); assert.equal(parsed.items.length,2);
  const [arrive,leave]=parsed.items; assert.equal(arrive.bookingId,leave.bookingId); assert.equal(leave.startTime,'');
  assert.equal(arrive.date,'2026-11-26'); assert.equal(leave.date,'2026-11-29'); assert.ok(parsed.items.every(r => r.status==='Booked' && r.stayEnd==='2026-11-29'));
});
test('AI rejects unconfirmed bookings and invalid hotel times without guessing', () => {
  const parsed = parseAI({ schemaVersion:'viaticum-import-v1',records:[{ ...AI_EXAMPLE.records[1],confirmed:false },{ ...AI_EXAMPLE.records[0],checkIn:{date:'2026-11-26',time:'25:00'} }] });
  assert.equal(parsed.items.length,0); assert.equal(parsed.errors.length,2);
});
test('explicit ticket match promotes the activity, preserves personal details, and records both sources', () => {
  const backroom=parseBackroom([sample()]).items[0]; backroom.rowIndex=2;
  const entries=[day(backroom.date,{event:'PIPE',status:'Maybe',schedule:backroom.schedule,details:'Personal note'})];
  const parsed=parseAI({schemaVersion:'viaticum-import-v1',records:[{id:'ticket-1',type:'event',confirmed:true,name:'PIPE',location:'Cologne',date:backroom.date,time:'22:00',matchEventId:'event-1',bookingReference:'XYZ'}]});
  const items=prepareImport(parsed,[backroom],entries); assert.equal(items[0].choice,'match');
  const plan=buildImportPlan(items,{entries,records:[backroom],nextMainRow:3,nextRecordRow:3});
  assert.equal(plan.days[0].status,'Booked'); assert.match(plan.days[0].details,/Personal note/); assert.match(plan.days[0].details,/XYZ/);
  assert.equal(plan.days[0].schedule.split('\n').length,1); assert.equal(plan.records.find(r=>r.source==='backroom').status,'Booked');
});
test('ambiguous matches require an explicit target; replacements are per-field', () => {
  const records=parseBackroom([sample(),sample({Event_ID:'event-2'})]).items;
  const entries=[day('2026-11-21',{event:'PIPE',details:'Hotel stays',status:'Maybe'})];
  const parsed=parseAI({schemaVersion:'viaticum-import-v1',records:[{id:'ticket',type:'event',confirmed:true,name:'PIPE',date:'2026-11-21',location:'Cologne'}]});
  const items=prepareImport(parsed,records,entries); assert.equal(items[0].choice,'merge'); assert.equal(items[0].candidates.length,2);
  items[0].choice='match'; assert.throws(()=>buildImportPlan(items,{entries,records,nextMainRow:3,nextRecordRow:4}),/Choose/);
  items[0].choice='merge'; const plan=buildImportPlan(items,{entries,records,nextMainRow:3,nextRecordRow:4},{'2026-11-21':{details:'Replacement only'}});
  assert.equal(plan.days[0].details,'Replacement only'); assert.ok(plan.days[0].event.includes('PIPE'));
});
