import { el } from '../utils/dom.js';
export function modal(title, body, onClose) { return el('div', { class:'modal-backdrop', onClick:e=>{ if(e.target.className==='modal-backdrop') onClose(); } }, el('div', { class:'modal' }, el('header', {}, el('h2', {}, title), el('button', { type:'button', onClick:onClose }, '×')), el('div', { class:'modal-body' }, body))); }
