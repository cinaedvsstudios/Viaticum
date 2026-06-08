import { getBool, getItem } from './utils/storage.js';
import { STORAGE_KEYS } from './constants.js';
import { todayIso } from './utils/dates.js';
import { refData } from './models.js';

const listeners = new Set();

function readStoredOperation() {
  try {
    return JSON.parse(getItem('viaticum:lastOperation', 'null')) || null;
  } catch (_) {
    return null;
  }
}

export const state = {
  selectedDate: todayIso(),
  currentMonthOffset: 0,
  entries: [],
  refData: refData(),
  isDarkMode: getBool(STORAGE_KEYS.darkMode, false),
  isSyncing: false,
  selectedTripName: '',
  route: 'main',
  modal: null,
  error: '',
  authReady: false,
  accessToken: '',
  demoMode: true,
  expandedDays: new Set(),
  previewExpanded: { schedule:true, details:true, links:true },
  toast: null,
  lastOperation: readStoredOperation()
};

export const subscribe = fn => (listeners.add(fn), () => listeners.delete(fn));

export function setState(patch) {
  Object.assign(state, typeof patch === 'function' ? patch(state) : patch);
  listeners.forEach(fn => fn(state));
}

export const entryByDate = iso => state.entries.find(e => e.date === iso);
export const trips = () => [...new Set(state.entries.map(e => e.tripName).filter(Boolean))];
