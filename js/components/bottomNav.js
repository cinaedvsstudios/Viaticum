import { el } from '../utils/dom.js';
import { iconButton } from './iconButton.js';

export function bottomNav(refData, actions, active = 'day') {
  return el('nav', { class: 'bottom-nav' },
    iconButton(refData, 'Btn_Nav_Day', actions.homeLabel || 'Day', actions.day, active === 'day' ? 'icon-btn active' : 'icon-btn'),
    iconButton(refData, 'Btn_Nav_Trip', 'Trip', actions.trip, active === 'trip' ? 'icon-btn active' : 'icon-btn'),
    iconButton(refData, 'Btn_Nav_Sheet', 'Sheet', actions.sheet),
    iconButton(refData, 'Btn_Nav_Sync', 'Sync', actions.sync),
    iconButton(refData, 'Btn_Nav_Settings', 'Settings', actions.more)
  );
}
