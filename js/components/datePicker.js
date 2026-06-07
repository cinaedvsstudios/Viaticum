import { el } from '../utils/dom.js';
export const datePicker = (value, onChange) => el('input', { type:'date', value, onChange:e=>onChange(e.target.value) });
