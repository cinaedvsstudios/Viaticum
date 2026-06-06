import { state, setState, trips } from '../state.js';
import { el, button } from '../utils/dom.js';
import { bottomNav } from '../components/bottomNav.js';
import { sectionCard } from '../components/sectionCard.js';
import { scheduleTimeline } from '../components/scheduleTimeline.js';
import { detailsGrid } from '../components/detailsGrid.js';
import { linksGrid } from '../components/linksGrid.js';
import { statusChips } from '../components/statusChips.js';
import { imageBox, findLocationImage } from '../components/imageBox.js';
import { dropdown } from '../components/dropdown.js';
import { iconFor } from '../components/iconButton.js';
import { tripEntries, tripTitle, tripRange, candidateDays } from '../features/tripFeature.js';
import { addDayToTrip, removeDayFromTrip, deleteTrip, updateTripCell } from '../services/syncService.js';
import { pushRoute, goMain } from '../router/history.js';
import { sheetUrl } from '../config.js';
import { syncAll } from '../services/syncService.js';
import { shareText } from '../utils/share.js';
export function renderTripScreen() { const list=trips(); const selected=state.selectedTripName || list[0] || ''; if (selected !== state.selectedTripName) setState({ selectedTripName:selected }); const days=tripEntries(state.entries, selected); return el('main', { class:'screen trip-screen' }, header(selected, list, days), controls(selected, days), timeline(days, selected), bottomNav(state.refData,{homeLabel:'Home',day:goMain,trip:()=>{},sheet:()=>window.open(sheetUrl(),'_blank','noopener'),sync:syncAll,more:()=>setState({modal:'more'})},'trip')); }
function header(selected, list, days) { const first=days[0] || {}; return el('header', { class:'trip-header' }, el('div',{}, dropdown(selected, [...list.map(t=>({value:t,label:t})), {value:'__new',label:'New Trip'}], v=> v==='__new' ? newTrip() : setState({selectedTripName:v}), 'Trip'), el('h1',{}, tripTitle(days) || 'Trip'), el('p',{}, tripRange(days)), statusChips([...new Set(days.map(d=>d.status).filter(Boolean))].join('|'), state.refData)), imageBox(findLocationImage(first,state.refData), first.location)); }
function controls(selected, days) { return el('section', { class:'trip-actions' }, button(`${iconFor(state.refData,'Icon_Share_Day')} Share`,()=>shareText('Viaticum trip', days.map(d=>`${d.date} ${d.event}\n${d.schedule}`).join('\n\n')),'btn'), button(`${iconFor(state.refData,'Icon_Edit_Trip_Days')} Edit days`,()=>setState({ tripEdit:!state.tripEdit }),'btn'), button(`${iconFor(state.refData,'Icon_Delete_Trip')} Delete`,()=>selected && confirm('Delete trip links?') && deleteTrip(selected),'btn danger'), button(`${iconFor(state.refData,'Icon_ExpandAll')} Expand all`,()=>setState({ expandedDays:new Set(days.map(d=>d.date)) }),'btn')); }
function timeline(days, selected) { const candidates=candidateDays(state.entries, selected); return el('section', { class:'trip-timeline' }, days.map((d,i)=>dayItem(d,i===days.length-1)), state.tripEdit ? el('div',{class:'candidate-row'}, button('➕ Add Day',()=>{},'btn'), candidates.map(c=>button(`${c.date.slice(5)} ${c.location}`,()=>addDayToTrip(c,selected),'chip-btn'))) : ''); }
function dayItem(entry, last) { const expanded=state.expandedDays.has(entry.date); return el('article', { class:`trip-day ${expanded?'open':''}` }, el('div',{class:'trip-date'}, el('b',{}, new Date(entry.date+'T00:00').toLocaleDateString(undefined,{weekday:'short'})), el('span',{},entry.date.slice(8))), el('div',{class:'trip-card'}, el('header',{onClick:()=>toggle(entry.date)}, el('strong',{},`${state.refData.events[entry.event] || ''} ${entry.event || entry.location}`), state.tripEdit ? button('❌',()=>removeDayFromTrip(entry),'mini danger') : ''), expanded ? el('div',{}, sectionCard('SCHEDULE', scheduleTimeline(entry.schedule,state.refData),'section-card schedule'), sectionCard('DETAILS', detailsGrid(entry.details,state.refData),'section-card details'), sectionCard('DAY FILES', linksGrid(entry.links,state.refData),'section-card files')) : '')); }
function toggle(date) { const next=new Set(state.expandedDays); next.has(date) ? next.delete(date) : next.add(date); setState({ expandedDays:next }); }
async function newTrip() { const name=prompt('New Trip Name'); if(!name) return; const date=prompt('Start date YYYY-MM-DD', state.selectedDate); if(!date) return; const entry=state.entries.find(e=>e.date===date); if(entry) { await updateTripCell(entry,name); setState({selectedTripName:name}); } else alert('No sheet row found for that date yet.'); }
