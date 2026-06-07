export const cleanCell = value => String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

export const cell = (row, index) => cleanCell(row?.[index]);

export function normalizeLabel(value = '') {
  return cleanCell(value).toLowerCase().replace(/\s+/g, ' ');
}

export function splitPipeItems(value = '') {
  return cleanCell(value)
    .split('|')
    .map(item => cleanCell(item))
    .filter(Boolean);
}

export function splitFirstDash(value = '') {
  const text = cleanCell(value);
  const spacedDash = text.indexOf(' - ');

  if (spacedDash >= 0) {
    return {
      before: cleanCell(text.slice(0, spacedDash)),
      after: cleanCell(text.slice(spacedDash + 3))
    };
  }

  // URL-only fallback should not split on hyphens inside a URL.
  if (/^https?:\/\//i.test(text)) {
    return { before: '', after: text };
  }

  const looseDash = text.indexOf('-');

  if (looseDash > 0) {
    return {
      before: cleanCell(text.slice(0, looseDash)),
      after: cleanCell(text.slice(looseDash + 1))
    };
  }

  return { before: text, after: '' };
}

export function isUrl(value = '') {
  return /^https?:\/\//i.test(cleanCell(value));
}

export function parseNameUrlLine(line = '') {
  const text = cleanCell(line);

  if (!text) {
    return { name: '', url: '' };
  }

  if (isUrl(text)) {
    return { name: text, url: text };
  }

  const { before, after } = splitFirstDash(text);

  if (isUrl(after)) {
    return { name: before || after, url: after };
  }

  return { name: before || text, url: after };
}

export function parseNameMetaLine(line = '') {
  const text = cleanCell(line);

  if (!text) {
    return { name: '', meta: '' };
  }

  const { before, after } = splitFirstDash(text);

  if (after) {
    return { name: before || text, meta: after };
  }

  const comma = text.indexOf(',');

  if (comma > 0) {
    return {
      name: cleanCell(text.slice(0, comma)),
      meta: cleanCell(text.slice(comma + 1))
    };
  }

  return { name: text, meta: '' };
}

export function parseLabeledSections(text = '', aliases = {}) {
  const sections = {};
  let active = aliases.default || 'info';

  Object.values(aliases).forEach(value => {
    if (value && value !== 'default') sections[value] = [];
  });

  if (!sections[active]) sections[active] = [];

  cleanCell(text)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const match = line.match(/^([^:]{1,40})\s*:\s*(.*)$/);

      if (match) {
        const rawLabel = normalizeLabel(match[1]);
        const mapped = aliases[rawLabel];

        if (mapped) {
          active = mapped;
          if (!sections[active]) sections[active] = [];

          const value = cleanCell(match[2]);
          if (value) {
            if (active === 'info') sections[active].push(value);
            else sections[active].push(...splitPipeItems(value));
          }

          return;
        }
      }

      if (!sections[active]) sections[active] = [];

      if (active === 'info') {
        sections[active].push(line);
      } else {
        sections[active].push(...splitPipeItems(line));
      }
    });

  return sections;
}

export function parseDetailsSections(detailsText = '') {
  const sections = parseLabeledSections(detailsText, {
    default: 'info',
    info: 'info',
    note: 'info',
    notes: 'info',
    detail: 'info',
    details: 'info',
    paid: 'paid',
    unpaid: 'unpaid',
    map: 'maps',
    maps: 'maps',
    code: 'codes',
    codes: 'codes'
  });

  return {
    info: sections.info || [],
    paid: sections.paid || [],
    unpaid: sections.unpaid || [],
    maps: sections.maps || [],
    codes: sections.codes || []
  };
}

export function nonEmptyEntryFields(entry) {
  return [
    entry?.location,
    entry?.event,
    entry?.status,
    entry?.schedule,
    entry?.details,
    entry?.links,
    entry?.tripName
  ].some(value => cleanCell(value));
}
