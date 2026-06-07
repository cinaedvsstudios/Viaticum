import { el } from '../utils/dom.js';
import { iconFor } from './iconButton.js';
export function loadingBanner(state) { if (!state.isSyncing && !state.error) return ''; return el('div', { class: state.error ? 'banner error' : 'banner' }, state.isSyncing ? iconFor(state.refData,'Banner_Syncing') : state.error); }
