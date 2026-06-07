import { FALLBACK_ICONS } from '../constants.js';
import { el } from '../utils/dom.js';
export const iconFor = (refData, key, fallback='') => refData.buttons?.[key] || FALLBACK_ICONS[key] || fallback || '•';
export function iconButton(refData, key, label, onClick, className='icon-btn') { return el('button', { class:className, type:'button', title:label, onClick }, el('span', { class:'icon' }, iconFor(refData,key)), el('small', {}, label)); }
