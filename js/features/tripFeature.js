import { addDays, compareIso, dateRange } from '../utils/dates.js';
export const tripEntries = (entries, trip) => entries.filter(e => e.tripName === trip).sort((a,b)=>compareIso(a.date,b.date));
export const tripTitle = days => days[0]?.location || days[0]?.tripName || 'Trip';
export const tripRange = dateRange;
export function candidateDays(entries, trip) { const days=tripEntries(entries, trip); if (!days.length) return []; const anchors=[days[0].date, days.at(-1).date]; const wanted=new Set(anchors.flatMap(a=>[-3,-2,-1,1,2,3].map(o=>addDays(a,o)))); return entries.filter(e => wanted.has(e.date) && !e.tripName).sort((a,b)=>compareIso(a.date,b.date)); }
