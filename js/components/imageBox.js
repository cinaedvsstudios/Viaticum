import { config } from '../config.js';
import { normalizeStr } from '../utils/normalize.js';
import { el } from '../utils/dom.js';

function rawImageUrl(value) {
  if (!value) return '';
  return value.startsWith('http') ? value : `${config.rawImageBaseUrl}${value.replace(/^\/+/, '')}`;
}

function firstEventName(value = '') {
  return String(value).split(',').map(part => part.trim()).filter(Boolean)[0] || '';
}

function localCandidates(name) {
  const key = normalizeStr(name);
  if (!key) return [];
  return [
    `images/${key}.jpg`,
    `images/${key}.jpeg`,
    `images/${key}.png`,
    `images/${key}.webp`,
    `img/${key}.jpg`,
    `img/${key}.jpeg`,
    `img/${key}.png`,
    `img/${key}.webp`,
    `assets/${key}.jpg`,
    `assets/${key}.jpeg`,
    `assets/${key}.png`,
    `assets/${key}.webp`,
    `assets/images/${key}.jpg`,
    `assets/images/${key}.jpeg`,
    `assets/images/${key}.png`,
    `assets/images/${key}.webp`
  ];
}

function imageCandidates(name, refValue) {
  const candidates = [...localCandidates(name)];
  const refUrl = rawImageUrl(refValue);
  if (refUrl) candidates.push(refUrl);
  return [...new Set(candidates.filter(Boolean))];
}

export function findEventImage(entry, refData) {
  const primaryEvent = firstEventName(entry.event);
  const direct = refData.eventImages?.[normalizeStr(primaryEvent)] || refData.eventImages?.[normalizeStr(entry.event)];
  return imageCandidates(primaryEvent, direct);
}

export function findLocationImage(entry, refData) {
  const direct = refData.locationImages?.[normalizeStr(entry.location)];
  return imageCandidates(entry.location, direct);
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
