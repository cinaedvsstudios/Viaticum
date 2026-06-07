import { state, setState } from '../state.js';
import { el, button } from '../utils/dom.js';
import { signIn, signOut, hasClientId } from '../services/googleAuth.js';
import { syncAll } from '../services/syncService.js';

const WEB_VERSION = 'Viaticum Web v1.6.0 — day 2-col + scroll + trip gold fix';

export function renderMoreSheet() {
  return el('div', { class: 'modal-backdrop settings-backdrop', onClick: e => { if (e.target.classList.contains('settings-backdrop')) setState({ modal: null }); } },
    el('section', { class: 'settings-modal' },
      el('header', { class: 'settings-header' },
        el('div', {}, el('span', { class: 'settings-icon' }, '⚙️'), el('strong', {}, 'Settings')),
        button('✕', () => setState({ modal: null }), 'settings-close')
      ),
      el('div', { class: 'settings-body' },
        state.error ? el('p', { class: 'error-text settings-message' }, state.error) : '',
        !hasClientId() ? el('p', { class: 'muted settings-message' }, 'Add a browser OAuth client ID in js/config.js to enable Google Sheets sync.') : '',
        el('section', { class: 'settings-section' },
          el('h3', {}, 'Account'),
          el('p', { class: state.accessToken ? 'settings-status signed-in' : 'settings-status' }, state.accessToken ? 'Signed in to Google' : 'Not signed in to Google'),
          button(state.accessToken ? 'Sign out of Google' : 'Sign in with Google', state.accessToken ? signOut : signIn, 'btn primary settings-action')
        ),
        el('section', { class: 'settings-section' }, el('h3', {}, 'Sync'), el('p', { class: 'muted' }, 'Pull the latest calendar, ref colours, buttons, templates and emojis from the sheet.'), button('Sync now', syncAll, 'btn settings-action')),
        el('section', { class: 'settings-section' }, el('h3', {}, 'Appearance'), button(state.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode', () => setState({ isDarkMode: !state.isDarkMode }), 'btn settings-action')),
        el('p', { class: 'settings-version' }, WEB_VERSION)
      )
    )
  );
}
