import { el } from '../utils/dom.js';
export function sectionCard(title, content, className='section-card', expanded=true, onToggle=null) { return el('section', { class: `${className} ${expanded?'':'collapsed'}` }, el('header', { onClick:onToggle }, el('strong', {}, title), onToggle ? el('span', {}, expanded ? '⌃' : '⌄') : ''), expanded ? el('div', { class:'section-body' }, content) : ''); }
