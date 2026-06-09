import { el } from '../utils/dom.js';
import { iconFor } from './iconButton.js';

const quietAuthMessages = [
  'Sign in with Google',
  'Reconnect Google',
  'Restoring Google connection',
  'Connection timed out',
  'Signed out of Google',
  'Not signed in to Google'
];

function shouldHideError(message = '') {
  return quietAuthMessages.some(part => String(message).includes(part));
}

export function loadingBanner(state) {
  if (state.isSyncing) {
    return el('div', { class: 'banner' }, iconFor(state.refData, 'Banner_Syncing'));
  }

  if (!state.error || shouldHideError(state.error)) {
    return '';
  }

  return el('div', { class: 'banner error' }, state.error);
}
