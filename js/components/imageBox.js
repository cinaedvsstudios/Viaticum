import { config } from '../config.js';
import { normalizeStr } from '../utils/normalize.js';
import { el } from '../utils/dom.js';

const MEMORY_FAILED_KEY = 'viaticum.failedImages.v1';
const MEMORY_RESOLVED_KEY = 'viaticum.resolvedImages.v1';
const MEMORY_EMPTY_KEY = 'viaticum.emptyImages.v1';

function readJson(key, fallback) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key) || '') || fallback;
  } catch (_) {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

let failedImageUrls = new Set(readJson(MEMORY_FAILED_KEY, []));
let emptyImageKeys = new Set(readJson(MEMORY_EMPTY_KEY, []));
let resolvedImageUrlByKey = new Map(Object.entries(readJson(MEMORY_RESOLVED_KEY, {})));

function persistFailures() {
  writeJson(MEMORY_FAILED_KEY, [...failedImageUrls].slice(-800));
}

function persistResolved() {
  writeJson(MEMORY_RESOLVED_KEY, Object.fromEntries(resolvedImageUrlByKey));
}

function persistEmpty() {
  writeJson(MEMORY_EMPTY_KEY, [...emptyImageKeys].slice(-300));
}

function absoluteUrl(url) {
  try {
    return new URL(url, window.location.href).href;
  } catch (_) {
    return url;
  }
}

function rawImageUrl(value) {
  if (!value) return '';
  return value.startsWith('http') ? value : `${config.rawImageBaseUrl}${value.replace(/^\/+/, '')}`;
}

function firstEventName(value = '') {
  return String(value).split(',').map(part => part.trim()).filter(Boolean)[0] || '';
}

const dedupe = values => [...new Set(values.filter(Boolean))];

function compactOriginal(value) {
  return String(value || '').trim().replace(/[\s_-]+/g, '');
}

function titleCaseNoSpaces(value) {
  return String(value || '')
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

function nameKeys(name) {
  const original = String(name || '').trim();
  const compact = compactOriginal(original);
  const normal = normalizeStr(original);
  const dash = normal.replace(/\s+/g, '-');
  const underscore = normal.replace(/\s+/g, '_');

  return dedupe([
    original,
    compact,
    compact.toLowerCase(),
    titleCaseNoSpaces(original),
    normal,
    dash,
    underscore,
    normal.replace(/oe/g, 'o'),
    normal.replace(/ae/g, 'a'),
    normal.replace(/ue/g, 'u')
  ]);
}

function localCandidates(name) {
  const keys = nameKeys(name);
  const folders = ['images', 'Images', 'img', 'Img', 'assets', 'Assets', 'assets/images', 'assets/Images'];
  const exts = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
  const out = [];

  folders.forEach(folder => {
    keys.forEach(key => {
      exts.forEach(ext => out.push(`${folder}/${key}.${ext}`));
    });
  });

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
  const direct =
    refData.eventImages?.[normalizeStr(primaryEvent)] ||
    refData.eventImages?.[normalizeStr(entry.event)] ||
    refData.locationImages?.[normalizeStr(primaryEvent)];

  return imageCandidates(primaryEvent, direct);
}

export function findLocationImage(entry, refData) {
  const location = entry.location || entry.tripName || entry.name || '';
  const direct =
    refData.locationImages?.[normalizeStr(location)] ||
    refData.eventImages?.[normalizeStr(location)];

  return imageCandidates(location, direct);
}

function cacheKey(alt, urls) {
  return `${alt || 'image'}::${urls.map(absoluteUrl).join('|')}`;
}

function placeholder(alt) {
  return el('div', { class: 'image-box placeholder', title: alt || 'Image placeholder' }, '');
}

export function imageBox(urlOrUrls, alt = '') {
  const rawUrls = Array.isArray(urlOrUrls) ? urlOrUrls.filter(Boolean) : [urlOrUrls].filter(Boolean);
  const key = cacheKey(alt, rawUrls);

  if (!rawUrls.length || emptyImageKeys.has(key)) {
    return placeholder(alt);
  }

  const cached = resolvedImageUrlByKey.get(key);
  const urls = cached
    ? [cached]
    : rawUrls.filter(url => !failedImageUrls.has(absoluteUrl(url)));

  if (!urls.length) {
    emptyImageKeys.add(key);
    persistEmpty();
    return placeholder(alt);
  }

  const img = el('img', { class: 'image-box', src: urls[0], alt, loading: 'lazy', decoding: 'async' });
  img.dataset.fallbackIndex = '0';
  img.dataset.imageKey = key;

  img.addEventListener('load', () => {
    resolvedImageUrlByKey.set(key, img.currentSrc || absoluteUrl(img.src));
    persistResolved();
  });

  img.addEventListener('error', () => {
    failedImageUrls.add(absoluteUrl(img.src));
    persistFailures();

    const nextIndex = Number(img.dataset.fallbackIndex || '0') + 1;
    while (nextIndex < urls.length && failedImageUrls.has(absoluteUrl(urls[nextIndex]))) {
      img.dataset.fallbackIndex = String(nextIndex + 1);
      return;
    }

    if (nextIndex < urls.length) {
      img.dataset.fallbackIndex = String(nextIndex);
      img.src = urls[nextIndex];
      return;
    }

    emptyImageKeys.add(key);
    persistEmpty();
    img.replaceWith(placeholder(alt));
  });

  return img;
}
