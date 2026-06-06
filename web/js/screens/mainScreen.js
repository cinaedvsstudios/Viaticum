import { state, setState, entryByDate } from '../state.js';
import { el, button } from '../utils/dom.js';
import { formatLong, formatMonth, addDays, todayIso } from '../utils/dates.js';
import { getCalendarDays, monthEntries, monthOptions } from '../features/calendarFeature.js';
import { statusChips, statusEmojis } from '../components/statusChips.js';
import { scheduleTimeline } from '../components/scheduleTimeline.js';
import { detailsGrid } from '../components/detailsGrid.js';
import { linksGrid } from '../components/linksGrid.js';
import { sectionCard } from '../components/sectionCard.js';
import { bottomNav } from '../components/bottomNav.js';
import { loadingBanner } from '../components/loadingBanner.js';
import { dropdown } from '../components/dropdown.js';
import { iconButton, iconFor } from '../components/iconButton.js';
import { pushRoute } from '../router/history.js';
import { sheetUrl } from '../config.js';
import { syncAll, clearDay } from '../services/syncService.js';
import { shareText } from '../utils/share.js';
import { shareDayText } from '../features/dayFeature.js';
import { attachHorizontalSwipe } from '../features/navigationFeature.js';
export function renderMainScreen() {
  const ref=state.refData, selected=entryByDate(state.selectedDate) || { date:state.selectedDate, location:'', event:'', status:'', schedule:'', details:'', links:'' };
  const root=el('main', { class:'screen main-screen' }, loadingBanner(state), header(), calendar(), scheduleList(), preview(selected), nav());
  attachHorizontalSwipe(root, () => setState({ currentMonthOffset: state.currentMonthOffset + 1 }), () => setState({ currentMonthOffset: state.currentMonthOffset - 1 }));
  return root;
}
function header() { return el('section', { class:'month-header' }, el('button', { type:'button', onClick:()=>setState({ currentMonthOffset: state.currentMonthOffset - 1 }) }, '‹'), dropdown(String(state.currentMonthOffset), monthOptions(), v=>setState({ currentMonthOffset:Number(v) }), formatMonth(todayIso(), state.currentMonthOffset)), el('button', { type:'button', onClick:()=>setState({ currentMonthOffset: state.currentMonthOffset + 1 }) }, '›')); }
function calendar() { const days=getCalendarDays(state); return el('section', { class:'calendar-card' }, el('div', { class:'weekdays' }, ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>el('b',{},d))), el('div', { class:'calendar-grid' }, days.map(dayCell))); }
function dayCell(day) { const entry=entryByDate(day.iso); const hasData=entry && [entry.location,entry.event,entry.status,entry.schedule].some(Boolean); const emojis=statusEmojis(entry?.status || '', state.refData); const classes=['day-cell', !day.inMonth?'filler':'', day.iso===state.selectedDate?'selected':'', day.isToday?'today':'', day.isPast && !day.isToday?'past':'', !hasData && day.inMonth?'empty':''].join(' '); return el('button', { class:classes, type:'button', onClick:()=>setState({ selectedDate:day.iso }) }, emojis.length ? el('span', { class:'emoji-grid' }, emojis.map(e=>el('span',{},e))) : String(day.day)); }
function scheduleList() { const entries=monthEntries(state); return el('section', { class:'schedule-list' }, el('h2', {}, 'Schedule'), el('div', { class:'schedule-table' }, el('div', { class:'schedule-head' }, 'Date', 'Location', 'Event'), entries.map(e => el('button', { class:'schedule-row', type:'button', onClick:()=>setState({ selectedDate:e.date }) }, el('span',{},e.date.slice(8)), el('span',{},`${state.refData.locations[e.location] || ''} ${e.location}`), el('span',{},`${state.refData.events[e.event] || ''} ${e.event}`))))); }
function preview(entry) { return el('section', { class:'preview-panel' }, el('header', {}, el('div', {}, el('h2', {}, formatLong(entry.date)), entry.location || entry.event ? el('p', {}, `${entry.location} ${entry.event ? '• ' + entry.event : ''}`) : ''), statusChips(entry.status, state.refData)), el('div', { class:'toolbar' }, iconButton(state.refData,'Icon_Share_Day','Share',()=>shareText('Viaticum day', shareDayText(entry))), iconButton(state.refData,'Icon_Clear_Day','Clear',()=>confirm('Clear this day?') && clearDay(entry)), iconButton(state.refData,'Icon_Edit_Day','Edit',()=>pushRoute('edit')), iconButton(state.refData,'Icon_ExpandAll','Open',()=>pushRoute('day'))), el('div', { class:'preview-scroll' }, entry.schedule ? sectionCard('SCHEDULE', scheduleTimeline(entry.schedule, state.refData), 'section-card schedule') : '', entry.details ? sectionCard('DETAILS', detailsGrid(entry.details, state.refData), 'section-card details') : '', entry.links ? sectionCard('DAY FILES', linksGrid(entry.links, state.refData), 'section-card files') : el('p', { class:'muted' }, 'No details for selected day.'))); }
function nav() { return bottomNav(state.refData, { day:()=>pushRoute('day'), trip:()=>pushRoute('trip'), sheet:()=>window.open(sheetUrl(),'_blank','noopener'), sync:syncAll, more:()=>setState({ modal:'more' }) }, 'day'); }
