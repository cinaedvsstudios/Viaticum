import { clear } from '../utils/dom.js';
import { state, subscribe } from '../state.js';
import { applyTheme } from '../theme/theme.js';
import { renderMainScreen } from '../screens/mainScreen.js';
import { renderDayScreen } from '../screens/dayScreen.js';
import { renderEditScreen } from '../screens/editScreen.js';
import { renderTripScreen } from '../screens/tripScreen.js';
import { renderMoreSheet } from '../screens/moreSheet.js';
import { statusToast } from '../components/statusToast.js';
import { initHistory } from './history.js';

let root;

export function initRouter(rootEl) {
  root = rootEl;
  initHistory(render);
  subscribe(render);
  render();
}

export function render() {
  if (!root) return;

  applyTheme(state.refData, state.isDarkMode);
  clear(root);

  const screen = state.route === 'day'
    ? renderDayScreen()
    : state.route === 'edit'
      ? renderEditScreen()
      : state.route === 'trip'
        ? renderTripScreen()
        : renderMainScreen();

  root.append(screen);

  if (state.modal === 'more') root.append(renderMoreSheet());

  const toast = statusToast(state);
  if (toast) root.append(toast);
}
