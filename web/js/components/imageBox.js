import { config } from '../config.js';
import { normalizeStr } from '../utils/normalize.js';
import { el } from '../utils/dom.js';
function imageUrl(value) { if (!value) return ''; return value.startsWith('http') ? value : `${config.rawImageBaseUrl}${value.replace(/^\/+/, '')}`; }
export function findEventImage(entry, refData) { return imageUrl(refData.eventImages?.[normalizeStr(entry.event)]); }
export function findLocationImage(entry, refData) { return imageUrl(refData.locationImages?.[normalizeStr(entry.location)]); }
export function imageBox(url, alt='') { return url ? el('img', { class:'image-box', src:url, alt, loading:'lazy' }) : el('div', { class:'image-box placeholder' }, ''); }
