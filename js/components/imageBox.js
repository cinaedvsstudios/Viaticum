import { config } from '../config.js';
import { normalizeStr } from '../utils/normalize.js';
import { el } from '../utils/dom.js';

function rawImageUrl(value) {
  if (!value) return '';
  return value.startsWith('http') ? value : `${config.rawImageBaseUrl}${value.replace(/^\\/+/, '')}`;
}

function firstEventName(value = '') {
  return String(value).split(',').map(part => part.trim()).filter(Boolean)[0] || '';
}

const dedupe = values => [...new Set(values.filter(Boolean))];

function compactOriginal(value) {
  return String(value || '').trim().replace(/[\s_-]+/g, '');
}

function titleCaseNoSpaces(value) {
  return String(value || '').trim().split(/[\s_-]+/).filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('');
}

function nameKeys(name) {
  const original = String(name || '').trim();
  const compact = compactOriginal(original);
  const normal = normalizeStr(original);
  return dedupe([original, compact, compact.toLowerCase(), titleCaseNoSpaces(original), normal, normal.replace(/oe/g, 'o'), normal.replace(/ae/g, 'a'), normal.replace(/ue/g, 'u')]);
}

function localCandidates(name) {
  const keys = nameKeys(name);
  const folders = ['images', 'Images', 'img', 'assets', 'assets/images', 'assets/Images'];
  const exts = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
  const out = [];
  folders.forEach(folder => keys.forEach(key => exts.forEach(ext => out.push(`${folder}/${key}.${ext}`))));
  return dedupe(out);
}

function imageCandidates(name, refValue) {
  const candidates = [...localCandidates(name)];
  const refUrl = rawImageUrl(refValue);
  if (refUrl) candidates.push(refUrl);
  return dedupe(candidates);
}

export function findEventImage(entry, refData) {
  const primaryEvent = firstEventName(entry.event);
  const direct = refData.eventImages?.[normalizeStr(primaryEvent)] || refData.eventImages?.[normalizeStr(entry.event)] || refData.locationImages?.[normalizeStr(primaryEvent)];
  return imageCandidates(primaryEvent, direct);
}

export function findLocationImage(entry, refData) {
  const location = entry.location || entry.tripName || '';
  const direct = refData.locationImages?.[normalizeStr(location)] || refData.eventImages?.[normalizeStr(location)];
  return imageCandidates(location, direct);
}

export function imageBox(urlOrUrls, alt = '') {
  const urls = Array.isArray(urlOrUrls) ? urlOrUrls.filter(Boolean) : [urlOrUrls].filter(Boolean);
  const fallback = el('div', { class: 'image-box placeholder', title: alt || 'Image placeholder' }, '');
  if (!urls.length) return fallback;

  const img = el('img', { class: 'image-box', src: urls[0], alt, loading: 'lazy' });
  img.dataset.fallbackIndex = '0';
  img.addEventListener('error', () => {
    const nextIndex = Number(img.dataset.fallbackIndex || '0') + 1;
    if (nextIndex < urls.length) {
      img.dataset.fallbackIndex = String(nextIndex);
      img.src = urls[nextIndex];
      return;
    }
    img.replaceWith(fallback);
  });
  return img;
}
