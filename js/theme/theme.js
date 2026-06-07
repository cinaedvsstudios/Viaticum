import { FALLBACK_COLORS, DARK_FALLBACK_COLORS, STORAGE_KEYS } from '../constants.js';
import { THEME_KEYS } from './themeKeys.js';
import { setBool } from '../utils/storage.js';
export function getThemeColor(key, refData, isDark, fallback) { const map = isDark ? refData.colorsDark : refData.colorsLight; return cleanHex(map?.[key]) || fallback || (isDark ? DARK_FALLBACK_COLORS[key] : FALLBACK_COLORS[key]) || '#000000'; }
function cleanHex(v) { const s=String(v || '').trim(); return /^#([0-9a-f]{3,8})$/i.test(s) ? s : ''; }
const cssName = key => `--${key.replaceAll('_','-').toLowerCase()}`;
export function applyTheme(refData, isDark) { THEME_KEYS.forEach(key => document.documentElement.style.setProperty(cssName(key), getThemeColor(key, refData, isDark))); document.documentElement.dataset.theme = isDark ? 'dark' : 'light'; setBool(STORAGE_KEYS.darkMode, isDark); }
