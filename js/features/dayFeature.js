import { formatLong } from '../utils/dates.js';
export function shareDayText(entry) { return `Itinerary for ${formatLong(entry.date)}:\nLocation: ${entry.location}\nEvent: ${entry.event}\n\nSchedule:\n${entry.schedule}`; }
