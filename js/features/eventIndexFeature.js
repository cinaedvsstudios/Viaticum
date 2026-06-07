export const eventOccurrences = (entries, eventName) => entries.filter(e => e.event === eventName).sort((a,b)=>a.date.localeCompare(b.date));
