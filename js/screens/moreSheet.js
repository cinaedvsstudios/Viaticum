import { state, setState } from '../state.js';
import { el, button } from '../utils/dom.js';
import { modal } from '../components/modal.js';
import { signIn, signOut, hasClientId } from '../services/googleAuth.js';
import { syncAll } from '../services/syncService.js';
export function renderMoreSheet() { return modal('More', el('div', { class:'more-list' }, state.error ? el('p',{class:'error-text'},state.error) : '', !hasClientId() ? el('p',{class:'muted'},'Add a browser OAuth client ID in web/js/config.js to enable Google Sheets sync.') : '', button(state.accessToken ? 'Sign out of Google' : 'Sign in with Google', state.accessToken ? signOut : signIn, 'btn'), button('Sync now', syncAll, 'btn'), button(state.isDarkMode ? 'Light mode' : 'Dark mode', ()=>setState({ isDarkMode:!state.isDarkMode }), 'btn'), button('Close', ()=>setState({ modal:null }), 'btn')), ()=>setState({ modal:null })); }
