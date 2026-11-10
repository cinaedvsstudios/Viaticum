// Development fixture only. All Sheets requests are intercepted in this page.
const memory = new Map();
const store = { getItem: k => memory.get(k) ?? null, setItem: (k,v) => memory.set(k,String(v)), removeItem: k => memory.delete(k) };
Object.defineProperty(window,'localStorage',{value:store});
Object.defineProperty(window,'sessionStorage',{value:store});
store.setItem('viaticum.googleAccessToken','simulated-token');
store.setItem('viaticum.googleAccessTokenExpiresAt',String(Date.now()+86400000));
let sheets = [{ properties:{title:'sheet1',sheetId:0,gridProperties:{rowCount:200,columnCount:9}},rows:[['Date','','Location','Event','Status','Schedule','Details','Links','Trip']] }];
for(let i=1;i<=30;i++) {
  const date=`2026-11-${String(i).padStart(2,'0')}`;
  const pride=i>=4&&i<=8, cologne=i>=26&&i<=29;
  sheets[0].rows.push([date,'',pride?'Maspalomas':cologne?'Köln':i===10?'Berlin':'',pride?'Maspalomas winter pride':cologne?['Leave','Red','Sexy','Home'][i-26]:i===10?'Dinner':'',pride?'Maybe':cologne?'Booked':'',cologne?`${i===26?'10:00: Train to Cologne':'20:00: '+['','Red','Sexy','Home'][i-26]}`:'',cologne?'Info: Old hotel\nPaid: Train':'','',cologne?'Cologne weekend':'']);
}
const originalFetch = window.fetch.bind(window);
window.fetch = async (url,options={}) => {
  if(!String(url).startsWith('https://sheets.googleapis.com/')) return originalFetch(url,options);
  const response=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
  if(String(url).includes(':batchUpdate')) {
    const staged=structuredClone(sheets);
    for(const request of JSON.parse(options.body).requests){
      if(request.addSheet)staged.push({properties:request.addSheet.properties,rows:[]});
      if(request.appendDimension)staged.find(s=>s.properties.sheetId===request.appendDimension.sheetId).properties.gridProperties.rowCount+=request.appendDimension.length;
      if(request.updateCells){const {start,rows}=request.updateCells;const sheet=staged.find(s=>s.properties.sheetId===start.sheetId);rows.forEach((row,r)=>row.values.forEach((cell,c)=>{sheet.rows[start.rowIndex+r]||=[];sheet.rows[start.rowIndex+r][start.columnIndex+c]=cell.userEnteredValue?.stringValue??'';}));}
    }
    sheets=staged;return response({replies:[]});
  }
  if(String(url).includes('/values/')) {
    const range=decodeURIComponent(String(url).split('/values/')[1]),name=range.split('!')[0].replaceAll("'",'');
    if(name==='ref')return response({values:[]});
    const sheet=sheets.find(s=>s.properties.title===name);if(!sheet)return new Response('Missing sheet',{status:400});
    return response({values:sheet.rows.slice(Number(range.match(/!A(\d+)/)?.[1]||1)-1)});
  }
  return response({sheets:sheets.map(s=>({properties:s.properties}))});
};
const { initRouter }=await import('../js/router/router.js');
const { setState }=await import('../js/state.js');
const { refreshOverview }=await import('../js/services/overviewService.js');
initRouter(document.getElementById('app'));
await refreshOverview();
setState({refData:{statuses:{Maybe:'❔',Booked:'✅','Not going':'❌'},locations:{'Köln':'🏰',Berlin:'🐻',Maspalomas:'🏖️'},events:{},buttons:{},schedules:{},templates:[],colorsLight:{Header_Sched_Bg:'#ffca35'},colorsDark:{}},demoMode:false,authReady:true,selectedDate:'2026-11-26'});
if(new URLSearchParams(location.search).has('auto')) await import('./ui-checks.js');
if(new URLSearchParams(location.search).has('peek')) await import('./peek-checks.js');
