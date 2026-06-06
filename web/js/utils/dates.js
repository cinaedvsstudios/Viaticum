const pad = n => String(n).padStart(2,'0');
export const toIso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const todayIso = () => toIso(new Date());
export function parseSheetDate(raw) {
  const s = String(raw || '').trim(); if (!s) return '';
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  return '';
}
export const fromIso = iso => { const [y,m,d] = iso.split('-').map(Number); return new Date(y, m-1, d); };
export const formatSheetDate = iso => iso;
export const formatLong = iso => fromIso(iso).toLocaleDateString(undefined,{weekday:'long', day:'numeric', month:'long', year:'numeric'});
export const formatShort = iso => fromIso(iso).toLocaleDateString(undefined,{weekday:'short', day:'2-digit', month:'short'});
export const formatMonth = (baseIso=todayIso(), offset=0) => { const d=fromIso(baseIso); d.setDate(1); d.setMonth(d.getMonth()+offset); return d.toLocaleDateString(undefined,{month:'long', year:'numeric'}); };
export const addDays = (iso, days) => { const d=fromIso(iso); d.setDate(d.getDate()+days); return toIso(d); };
export function addMonths(baseIso, offset) { const d=fromIso(baseIso); d.setDate(1); d.setMonth(d.getMonth()+offset); return toIso(d); }
export const compareIso = (a,b) => a < b ? -1 : a > b ? 1 : 0;
export function monthGrid(baseIso=todayIso(), offset=0) {
  const first = fromIso(addMonths(baseIso, offset)); first.setDate(1);
  const start = new Date(first); const mondayOffset = (first.getDay()+6)%7; start.setDate(first.getDate()-mondayOffset);
  return Array.from({length:42}, (_,i) => { const d = new Date(start); d.setDate(start.getDate()+i); return { iso: toIso(d), day:d.getDate(), inMonth: d.getMonth()===first.getMonth(), isToday: toIso(d)===todayIso(), isPast: toIso(d)<todayIso() }; });
}
export function dateRange(entries) { if (!entries.length) return ''; const sorted=[...entries].sort((a,b)=>compareIso(a.date,b.date)); return `${formatShort(sorted[0].date)} - ${formatShort(sorted.at(-1).date)}`; }
