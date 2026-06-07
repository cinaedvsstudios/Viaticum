import { EXCLUDED_STATUS_KEYS } from '../constants.js';
import { normalizeStr } from '../utils/normalize.js';
import { addDays } from '../utils/dates.js';
export const templatesFor = (refData, target) => refData.templates.filter(t => t.target.toLowerCase() === target.toLowerCase());
export const editableStatuses = refData => Object.entries(refData.statuses).filter(([name]) => !EXCLUDED_STATUS_KEYS.includes(normalizeStr(name)));
export const adjacentOffsets = [-3,-2,-1,1,2,3];
export const adjacentDates = iso => adjacentOffsets.map(o => ({ offset:o, date:addDays(iso,o) }));
export const hasData = e => e && [e.location,e.event,e.status,e.schedule,e.details,e.links,e.tripName].some(Boolean);
