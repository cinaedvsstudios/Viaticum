import { el } from '../utils/dom.js';
export function statusChips(statusText='', refData) { const statuses = statusText.split(/[|,]/).map(s=>s.trim()).filter(Boolean); return el('div', { class:'chip-row' }, statuses.map(s => el('span', { class:'status-chip' }, `${refData.statuses?.[s] || ''} ${s}`.trim()))); }
export const statusEmojis = (statusText='', refData) => statusText.split(/[|,]/).map(s=>refData.statuses?.[s.trim()] || '').filter(Boolean);
