import { el } from '../utils/dom.js';
export function dropdown(value, options, onChange, label='') { return el('label', { class:'select-label' }, label ? el('span', {}, label) : '', el('select', { onChange:e=>onChange(e.target.value) }, options.map(o => el('option', { value:o.value ?? o, selected:(o.value ?? o)===value }, o.label ?? o)))); }
