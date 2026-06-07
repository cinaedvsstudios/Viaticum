import { state, setState, trips } from '../state.js';
import { el, button } from '../utils/dom.js';
import { bottomNav } from '../components/bottomNav.js';
import { tripEntries, tripTitle, tripRange } from '../features/tripFeature.js';
import { pushRoute, goMain } from '../router/history.js';
import { sheetUrl } from '../config.js';
import { syncAll } from '../services/syncService.js';

export function renderTripScreen() {
  const list = trips();
  const selected = state.selectedTripName || list[0] || '';
  if