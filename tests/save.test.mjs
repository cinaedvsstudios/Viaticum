import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
globalThis.sessionStorage=globalThis.localStorage;
globalThis.window=new EventTarget();
const { state,setState }=await import('../js/state.js');
const { readWorkbook,installWorkbook,commitCells,changesToCells,recordsToCells,undoLastOperation,buildRequests }=await import('../js/services/overviewService.js');
const { lastUndoable,operationHistory,RECORD_FIELDS }=await import('../js/services/recordStore.js');
const { parseBackroom,prepareImport,buildImportPlan }=await import('../js/features/importModel.js');
const { saveDay,clearDay,moveDay,entryForDate }=await import('../js/services/syncService.js');
const { dayDataRange,clearDayRange }=await import('../js/services/writeGuards.js');
let database,requests,failure;
const response=value=>new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
globalThis.fetch=async (url,options={})=>{
  if(!String(url).startsWith('https://sheets.googleapis.com/')) throw new Error('Unexpected network access in test');
  if(String(url).includes(':batchUpdate')) {
    const body=JSON.parse(options.body); requests.push(body.requests);
    if(failure==='reject') return new Response('Simulated failure',{status:500});
    const staged=structuredClone(database);
    for(const request of body.requests){
      if(request.addSheet) staged.push({properties:request.addSheet.properties,rows:[]});
      if(request.appendDimension){ const sheet=staged.find(s=>s.properties.sheetId===request.appendDimension.sheetId); sheet.properties.gridProperties.rowCount+=request.appendDimension.length; }
      if(request.updateCells){const {start,rows}=request.updateCells; const sheet=staged.find(s=>s.properties.sheetId===start.sheetId); rows.forEach((row,r)=>row.values.forEach((cell,c)=>{sheet.rows[start.rowIndex+r]||=[]; sheet.rows[start.rowIndex+r][start.columnIndex+c]=cell.userEnteredValue?.stringValue??'';}));}
    }
    database=staged;
    if(failure==='lost-response'){ failure=null; throw new Error('Lost response'); }
    return response({replies:[]});
  }
  if(String(url).includes('/values/')) {
    const range=decodeURIComponent(String(url).split('/values/')[1]);
    const name=range.split('!')[0].replaceAll("'",''); const sheet=database.find(s=>s.properties.title===name);
    if(!sheet) return new Response('Missing sheet',{status:400});
    const from=Number(range.match(/!A(\d+)/)?.[1]||1)-1;
    return response({values:sheet.rows.slice(from)});
  }
  return response({sheets:database.map(s=>({properties:s.properties}))});
};
beforeEach(async()=>{
  memory.clear(); memory.set('viaticum.googleAccessToken','fake-token-never-sent'); memory.set('viaticum.googleAccessTokenExpiresAt',String(Date.now()+86400000));
  database=[{properties:{sheetId:0,title:'sheet1',gridProperties:{rowCount:100,columnCount:9}},rows:[['date','','location','event','status','schedule','details','links','trip'],['2026-11-26','','Köln','Leave','Booked','10:00: Train','Old hotel','','Weekend'],['2026-11-27','','Köln','Red','Maybe','','Personal note','','Weekend']]}];
  requests=[];failure=null; setState({isSyncing:false,demoMode:false,entries:[],importedRecords:[]}); installWorkbook(await readWorkbook());
});
test('bulk save writes just requested fields, uses one atomic request, and supports local Undo',async()=>{
  await commitCells(changesToCells([{date:'2026-11-26',rowIndex:2,field:'details',before:'Old hotel',after:'Old hotel\nNew hotel'},{date:'2026-11-27',rowIndex:3,field:'details',before:'Personal note',after:'Personal note\nNew hotel'}]),'Bulk edit');
  assert.equal(requests.length,1); assert.equal(requests[0].length,2); assert.equal(database[0].rows[1][3],'Leave');
  assert.equal(state.entries[1].details,'Personal note\nNew hotel'); assert.ok(lastUndoable());
  await undoLastOperation(); assert.equal(database[0].rows[1][6],'Old hotel'); assert.equal(database[0].rows[2][6],'Personal note'); assert.equal(lastUndoable(),null);
});
test('changed sheet cells or moved row dates reject a stale preview without any writes',async()=>{
  database[0].rows[1][6]='Changed elsewhere';
  await assert.rejects(commitCells(changesToCells([{date:'2026-11-26',rowIndex:2,field:'details',before:'Old hotel',after:'New hotel'}]),'Bulk edit'),/sheet changed/);
  assert.equal(requests.length,0); assert.equal(state.entries[0].details,'Old hotel');
  database[0].rows[1][6]='Old hotel'; database[0].rows[1][0]='2026-11-25';
  await assert.rejects(commitCells(changesToCells([{date:'2026-11-26',rowIndex:2,field:'details',before:'Old hotel',after:'New hotel'}]),'Bulk edit'),/day moved/);
  assert.equal(requests.length,0);
});
test('failed writes do not leave optimistic unsaved values in the displayed calendar',async()=>{
  failure='reject'; await assert.rejects(saveDay({...state.entries[0],details:'Never saved'}),/could not be confirmed/);
  assert.equal(state.entries[0].details,'Old hotel'); assert.equal(database[0].rows[1][6],'Old hotel'); assert.equal(state.isSyncing,false);
  assert.equal(operationHistory()[0].ok,false);
});
test('Undo refuses to overwrite subsequent changes from another browser',async()=>{
  await saveDay({...state.entries[0],details:'Saved here'}); database[0].rows[1][6]='Later change';
  const count=requests.length; await assert.rejects(undoLastOperation(),/sheet changed/); assert.equal(requests.length,count); assert.equal(database[0].rows[1][6],'Later change');
});
test('lost success response is reconciled and does not produce an incorrect failure',async()=>{
  failure='lost-response'; await saveDay({...state.entries[0],details:'Saved despite lost response'});
  assert.equal(state.entries[0].details,'Saved despite lost response'); assert.equal(operationHistory()[0].ok,true); assert.equal(requests.length,1);
});
test('import adds missing date and event ledger atomically and Undo removes only imported values',async()=>{
  const book=await readWorkbook();
  const parsed=parseBackroom([{Event_ID:'evt-1',Event_Name:'Party',Event_Date:'2026-11-28',Event_Start_Time:'22:00',City:'Köln',Venue_Name:'Club'}]);
  const plan=buildImportPlan(prepareImport(parsed,book.records,book.entries),book);
  const cells=[...changesToCells(plan.changes),...plan.dateCells.map(c=>({...c,tab:'sheet1'})),...recordsToCells(plan.records)];
  await commitCells(cells,'Backroom import'); assert.equal(requests.length,1); assert.ok(requests[0].some(r=>r.addSheet));
  assert.equal(state.entries.find(e=>e.date==='2026-11-28').status,'Maybe'); assert.equal(state.importedRecords.length,1);
  assert.equal(prepareImport(parsed,state.importedRecords,state.entries)[0].kind,'duplicate');
  await undoLastOperation(); assert.ok(!state.entries.some(e=>e.date==='2026-11-28')); assert.equal(state.importedRecords.length,0);
  assert.equal(database[0].rows[1][6],'Old hotel'); assert.equal(database[1].rows[0][0],'id');
});
test('cell writes treat imported formula-like text as text and clear only selected values',async()=>{
  await saveDay({...state.entries[0],details:'=IMPORTDATA("https://example.com")'});
  const cell=requests[0][0].updateCells.rows[0].values[0]; assert.ok(cell.userEnteredValue.stringValue.startsWith('=')); assert.ok(!cell.userEnteredValue.formulaValue);
  await clearDay(state.entries[0]); assert.equal(database[0].rows[1][8],'Weekend'); assert.equal(database[0].rows[1][0],'2026-11-26'); assert.equal(database[0].rows[1][6],'');
});
test('move day uses one write batch; nonexistent date never receives a fabricated row index',async()=>{
  const before=structuredClone(state.entries[0]), target={...before,date:'2026-11-27',rowIndex:3};
  await moveDay(before,target); assert.equal(requests.length,1); assert.equal(database[0].rows[1][2],''); assert.equal(database[0].rows[2][3],'Leave');
  assert.equal(entryForDate('2026-12-31').rowIndex,-1); await assert.rejects(saveDay(entryForDate('2026-12-31')),/No existing sheet row/);
});
test('legacy range helpers use valid C2:I2 notation',()=>{
  assert.equal(dayDataRange(2),'sheet1!C2:I2'); assert.equal(clearDayRange(2),'sheet1!C2:H2');
});
