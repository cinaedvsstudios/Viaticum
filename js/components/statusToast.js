import { el, button } from '../utils/dom.js';
import { dismissToast } from '../services/operationStatus.js';

export function statusToast(state) {
  const toast = state.toast;

  if (!toast) return '';

  return el('aside', {
      class: toast.ok ? 'status-toast success' : 'status-toast error',
      role: 'status',
      ariaLive: 'polite'
    },
    el('div', { class: 'status-toast-main' },
      el('strong', {}, toast.ok ? 'Saved' : 'Problem'),
      el('span', {}, toast.message || '')
    ),
    toast.range || toast.fields
      ? el('small', {}, [toast.range, toast.fields].filter(Boolean).join(' · '))
      : '',
    button('×', dismissToast, 'status-toast-close')
  );
}
