import { monthGrid, todayIso, addMonths, fromIso } from '../utils/dates.js';
export const getCalendarDays = state => monthGrid(todayIso(), state.currentMonthOffset);
export function monthOptions() { return Array.from({length:25}, (_,i)=>i-12).map(offset => { const d=fromIso(addMonths(todayIso(), offset)); return { value:String(offset), label:d.toLocaleDateString(undefined,{month:'long', year:'numeric'}) }; }); }
export const monthEntries = state => { const month=addMonths(todayIso(), state.currentMonthOffset).slice(0,7); return state.entries.filter(e => e.date.startsWith(month) && [e.location,e.event,e.status,e.schedule].some(Boolean)).sort((a,b)=>a.date.localeCompare(b.date)); };
